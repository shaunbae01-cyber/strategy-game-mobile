import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  StatusBar,
} from 'react-native';

const BOARD_SIZE = 5;
const TILE_COUNT = BOARD_SIZE * BOARD_SIZE;

const BUILDINGS = {
  farm: { label: 'Farm', cost: { gold: 5, food: 0, energy: 1 }, color: '#7ad57a' },
  tower: { label: 'Tower', cost: { gold: 8, food: 0, energy: 2 }, color: '#6da4ff' },
  base: { label: 'Base', cost: { gold: 12, food: 2, energy: 2 }, color: '#ffd166' },
};

const createInitialBoard = () => {
  const board = Array(TILE_COUNT).fill({ kind: 'empty' });

  const centerIndex = Math.floor(TILE_COUNT / 2);
  board[centerIndex] = { kind: 'base' };

  const enemySpots = [0, 3, 4, 6, 18, 20, 21, 23, 24];
  enemySpots.forEach((index) => {
    if (index !== centerIndex) {
      board[index] = { kind: 'enemy' };
    }
  });

  return board;
};

const hasEnoughResources = (resources, cost) => {
  return (
    resources.gold >= (cost.gold || 0) &&
    resources.food >= (cost.food || 0) &&
    resources.energy >= (cost.energy || 0)
  );
};

const payCost = (resources, cost) => ({
  gold: resources.gold - (cost.gold || 0),
  food: resources.food - (cost.food || 0),
  energy: resources.energy - (cost.energy || 0),
});

const getTileKind = (tile) => {
  if (!tile) return 'empty';
  return tile.kind || 'empty';
};

const getTileColor = (tileKind) => {
  if (tileKind === 'empty') return '#263447';
  if (tileKind === 'farm') return '#7ad57a';
  if (tileKind === 'tower') return '#6da4ff';
  if (tileKind === 'base') return '#ffd166';
  if (tileKind === 'enemy') return '#ff6b6b';
  return '#263447';
};

const getTileLabel = (tileKind) => {
  if (tileKind === 'empty') return '·';
  if (tileKind === 'farm') return 'F';
  if (tileKind === 'tower') return 'T';
  if (tileKind === 'base') return 'B';
  if (tileKind === 'enemy') return 'E';
  return '·';
};

const getIncomeFromBoard = (board) => {
  return board.reduce(
    (totals, tile) => {
      if (tile.kind === 'farm') {
        totals.gold += 2;
        totals.food += 2;
      }
      if (tile.kind === 'base') {
        totals.gold += 3;
        totals.food += 1;
      }
      if (tile.kind === 'tower') {
        totals.gold += 1;
      }
      return totals;
    },
    { gold: 0, food: 0 }
  );
};

export default function App() {
  const [board, setBoard] = useState(createInitialBoard());
  const [selectedBuild, setSelectedBuild] = useState('farm');
  const [resources, setResources] = useState({ gold: 18, food: 8, energy: 4 });
  const [turn, setTurn] = useState(1);
  const [message, setMessage] = useState('Build your first farm and protect the base.');

  const updateResources = (nextResources) => setResources(nextResources);

  const buildStructure = (tileIndex) => {
    const targetTile = board[tileIndex];
    const chosenBuild = BUILDINGS[selectedBuild];

    if (!chosenBuild) {
      setMessage('Choose a structure to build.');
      return;
    }

    if (getTileKind(targetTile) !== 'empty') {
      setMessage('This tile is occupied. Select an empty tile.');
      return;
    }

    if (!hasEnoughResources(resources, chosenBuild.cost)) {
      setMessage('Not enough resources for that build.');
      return;
    }

    const nextBoard = [...board];
    nextBoard[tileIndex] = { kind: selectedBuild };
    setBoard(nextBoard);
    updateResources(payCost(resources, chosenBuild.cost));
    setMessage(`${chosenBuild.label} built successfully.`);
  };

  const collectResources = () => {
    const income = getIncomeFromBoard(board);
    const nextGold = resources.gold + income.gold + 2;
    const nextFood = resources.food + income.food + 1;
    const nextEnergy = Math.min(5, resources.energy + 1);

    setResources({ gold: nextGold, food: nextFood, energy: nextEnergy });
    setMessage('You collected supplies from your settlements.');
  };

  const endTurn = () => {
    const income = getIncomeFromBoard(board);
    const newGold = resources.gold + income.gold;
    const newFood = resources.food + income.food;
    const newEnergy = 4;

    setResources({ gold: newGold, food: newFood, energy: newEnergy });

    const enemyTargets = board
      .map((tile, index) => ({ tile, index }))
      .filter(({ tile }) => tile.kind !== 'empty' && tile.kind !== 'enemy');

    if (enemyTargets.length > 0) {
      const attackTarget = enemyTargets[Math.floor(Math.random() * enemyTargets.length)];
      const nextBoard = [...board];

      if (attackTarget.tile.kind === 'base') {
        nextBoard[attackTarget.index] = { kind: 'enemy' };
        setMessage('The enemy struck your base. Defend your territory!');
      } else {
        nextBoard[attackTarget.index] = { kind: 'empty' };
        setMessage('The enemy destroyed one of your structures.');
      }

      setBoard(nextBoard);
    } else {
      setMessage('The enemy is scouting your territory.');
    }

    setTurn((prev) => prev + 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Kingdom Clash</Text>
        <Text style={styles.subtitle}>Turn {turn}</Text>

        <View style={styles.topBar}>
          <View style={styles.resourceBox}>
            <Text style={styles.label}>Gold</Text>
            <Text style={styles.value}>{resources.gold}</Text>
          </View>
          <View style={styles.resourceBox}>
            <Text style={styles.label}>Food</Text>
            <Text style={styles.value}>{resources.food}</Text>
          </View>
          <View style={styles.resourceBox}>
            <Text style={styles.label}>Energy</Text>
            <Text style={styles.value}>{resources.energy}</Text>
          </View>
        </View>

        <Text style={styles.message}>{message}</Text>

        <View style={styles.boardWrap}>
          <View style={styles.board}>
            {board.map((tile, index) => (
              <Pressable
                key={index}
                style={[
                  styles.tile,
                  { backgroundColor: getTileColor(getTileKind(tile)) },
                ]}
                onPress={() => buildStructure(index)}
              >
                <Text style={styles.tileText}>{getTileLabel(getTileKind(tile))}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.actionRow}>
          {Object.entries(BUILDINGS).map(([key, building]) => (
            <Pressable
              key={key}
              onPress={() => setSelectedBuild(key)}
              style={[
                styles.buildButton,
                selectedBuild === key && styles.selectedBuild,
              ]}
            >
              <Text style={styles.buildText}>{building.label}</Text>
              <Text style={styles.costText}>${building.cost.gold}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.footerActions}>
          <Pressable style={styles.primaryAction} onPress={collectResources}>
            <Text style={styles.primaryText}>Collect</Text>
          </Pressable>
          <Pressable style={styles.primaryAction} onPress={endTurn}>
            <Text style={styles.primaryText}>End Turn</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    color: '#f8fafc',
    fontWeight: 'bold',
    marginTop: 16,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 18,
    marginBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  resourceBox: {
    flex: 1,
    backgroundColor: '#0b1220',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginHorizontal: 4,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
  },
  value: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: 'bold',
  },
  message: {
    backgroundColor: '#111827',
    color: '#e2e8f0',
    width: '100%',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  boardWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  board: {
    width: 320,
    height: 320,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    backgroundColor: '#111827',
    padding: 8,
    borderRadius: 18,
    borderColor: '#334155',
    borderWidth: 2,
  },
  tile: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: '#172033',
  },
  tileText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  buildButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedBuild: {
    backgroundColor: '#0ea5e9',
    borderColor: '#7dd3fc',
  },
  buildText: {
    color: '#f8fafc',
    fontWeight: 'bold',
  },
  costText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  footerActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  primaryText: {
    color: '#f8fafc',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
