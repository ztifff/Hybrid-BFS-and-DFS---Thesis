import { ScenarioGraph, GraphNode, GraphEdge, GraphSize } from '../types/index';

const W = 1600; 
const H = 1200;

export type GameAIBoard = 'chess' | 'checkers' | 'snakes';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];

const BOARD_SIZE: Record<GraphSize, number> = {
  small: 6,
  medium: 8,
  large: 10
};

const SNAKES_SIZE: Record<GraphSize, number> = {
  small: 64,
  medium: 100,
  large: 144
};

export function buildGameAIGraph(
  board: GameAIBoard = 'chess',
  graphSize: GraphSize = 'medium'
): ScenarioGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const boardDim = BOARD_SIZE[graphSize];
  const snakesTiles = SNAKES_SIZE[graphSize];

  const addNode = (node: GraphNode) => nodes.push(node);

  const addEdge = (
    from: string,
    to: string,
    latency = 1,
    type: GraphEdge['type'] = 'path',
    label = `${latency} move`
  ) => {
    edges.push({
      id: `${from}-${to}`,
      from,
      to,
      latency,
      label,
      type
    });
  };

  const addTwoWayEdge = (
    from: string,
    to: string,
    latency = 1,
    type: GraphEdge['type'] = 'path',
    label = `${latency} move`
  ) => {
    addEdge(from, to, latency, type, label);
    addEdge(to, from, latency, type, label);
  };

  addNode({
    id: 'spawn',
    label: 'Strategy AI',
    type: 'strategy_planner',
    x: W / 2,
    y: 56,
    level: 0,
    buildingId: 'Arena',
    metadata: { board: 'arena' }
  });

  let entryNode = `chess_${files[1]}1`;
  let destinationIds = ['portal_chess'];

  if (board === 'checkers') {
    buildCheckersBoard(addNode, addTwoWayEdge, boardDim);
    entryNode = `checkers_${files[1]}1`;
    destinationIds = ['portal_checkers'];
  } else if (board === 'snakes') {
    buildSnakesAndLaddersBoard(addNode, addEdge, snakesTiles);
    entryNode = 'snakes_1';
    destinationIds = ['portal_snakes'];
  } else {
    buildChessBoard(addNode, addTwoWayEdge, boardDim);
    entryNode = `chess_${files[1]}1`;
    destinationIds = ['portal_chess'];
  }

  addEdge('spawn', entryNode, 1, 'wireless');

  return {
    nodes,
    edges,
    sourceId: 'spawn',
    destinationIds,
    width: W,
    height: H
  };
}

function buildChessBoard(
  addNode: (node: GraphNode) => void,
  addTwoWayEdge: (from: string, to: string, latency?: number, type?: GraphEdge['type'], label?: string) => void,
  size: number
) {
  const tileSize = Math.floor(400 / size);
const originX = Math.floor((W - tileSize * size) / 2);
const originY = Math.floor((H - tileSize * size) / 2);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const id = `chess_${files[col]}${row + 1}`;
      addNode({
        id,
        label: `${files[col]}${row + 1}`,
        type: 'board_tile',
        x: originX + col * tileSize,
        y: originY + (size - 1 - row) * tileSize,
        level: row + col + 1,
        buildingId: 'Chess',
        metadata: { board: 'chess', row, col }
      });
    }
  }

  const knightMoves = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      for (const [dc, dr] of knightMoves) {
        const nc = col + dc;
        const nr = row + dr;
        if (nc < 0 || nc >= size || nr < 0 || nr >= size) continue;
        const from = `chess_${files[col]}${row + 1}`;
        const to = `chess_${files[nc]}${nr + 1}`;
        if (from < to) addTwoWayEdge(from, to, 1, 'path', '');
      }
    }
  }

  addNode({
    id: 'portal_chess',
    label: 'Chess Checkmate\nTarget Square',
    type: 'winning_square',
    x: originX + (size - 1) * tileSize,
    y: originY,
    level: size * 2,
    buildingId: 'Chess',
    metadata: { board: 'chess', row: size - 1, col: size - 1 }
  });
  addTwoWayEdge(`chess_${files[size - 1]}${size}`, 'portal_chess', 1, 'wireless', 'checkmate');
}

function buildCheckersBoard(
  addNode: (node: GraphNode) => void,
  addTwoWayEdge: (from: string, to: string, latency?: number, type?: GraphEdge['type'], label?: string) => void,
  size: number
) {
  const tileSize = Math.floor(400 / size); 
  const originX = Math.floor((W - tileSize * size) / 2);
  const originY = Math.floor((H - tileSize * size) / 2);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if ((row + col) % 2 === 0) continue;
      addNode({
        id: `checkers_${files[col]}${row + 1}`,
        label: `${files[col]}${row + 1}`,
        type: 'board_tile',
        x: originX + col * tileSize,
        y: originY + (size - 1 - row) * tileSize,
        level: row + col + 1,
        buildingId: 'Checkers',
        metadata: { board: 'checkers', row, col }
      });
    }
  }

  const moves = [[1,1],[-1,1],[1,-1],[-1,-1],[2,2],[-2,2],[2,-2],[-2,-2]];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if ((row + col) % 2 === 0) continue;
      for (const [dc, dr] of moves) {
        const nc = col + dc;
        const nr = row + dr;
        if (nc < 0 || nc >= size || nr < 0 || nr >= size) continue;
        if ((nr + nc) % 2 === 0) continue;
        const from = `checkers_${files[col]}${row + 1}`;
        const to = `checkers_${files[nc]}${nr + 1}`;
        if (from < to) {
          const isJump = Math.abs(dc) === 2;
          addTwoWayEdge(from, to, isJump ? 1 : 2, isJump ? 'wireless' : 'path', isJump ? 'capture jump' : 'diagonal move');
        }
      }
    }
  }

  // Find last valid dark square in top row for portal
  let portalCol = size - 1;
  if (((size - 1) + portalCol) % 2 === 0) portalCol = size - 2;

  addNode({
    id: 'portal_checkers',
    label: 'Checkers Crown Row\nTarget Square',
    type: 'winning_square',
    x: originX + portalCol * tileSize,
    y: originY,
    level: size * 2,
    buildingId: 'Checkers',
    metadata: { board: 'checkers', row: size - 1, col: portalCol }
  });
  addTwoWayEdge(`checkers_${files[portalCol]}${size}`, 'portal_checkers', 1, 'wireless', 'king me');
}

function buildSnakesAndLaddersBoard(
  addNode: (node: GraphNode) => void,
  addEdge: (from: string, to: string, latency?: number, type?: GraphEdge['type'], label?: string) => void,
  totalTiles: number
) {
  const gridSize = Math.round(Math.sqrt(totalTiles));
  const tileSize = Math.floor(400 / gridSize); 
  const originX = Math.floor((W - tileSize * gridSize) / 2);
  const originY = Math.floor((H - tileSize * gridSize) / 2);

  for (let t = 1; t <= totalTiles; t++) {
    const { row, col } = serpentinePosition(t, gridSize);
    addNode({
      id: `snakes_${t}`,
      label: `${t}`,
      type: 'board_tile',
      x: originX + col * tileSize,
      y: originY + (gridSize - 1 - row) * tileSize,
      level: t + 1,
      buildingId: 'Snakes & Ladders',
      metadata: { board: 'snakes', tile: t }
    });
  }

  for (let t = 1; t < totalTiles; t++) {
    addEdge(`snakes_${t}`, `snakes_${t + 1}`, 1, 'path', 'next tile');
  }

  const scale = totalTiles / 100;

  const ladders: [number, number][] = [
    [Math.round(3 * scale),  Math.round(22 * scale)],
    [Math.round(8 * scale),  Math.round(30 * scale)],
    [Math.round(28 * scale), Math.round(55 * scale)],
    [Math.round(58 * scale), Math.round(77 * scale)],
    [Math.round(71 * scale), Math.round(92 * scale)],
  ].filter(([f, t]) => f >= 1 && t <= totalTiles && f < t) as [number, number][];

  const snakes: [number, number][] = [
    [Math.round(27 * scale), Math.round(5 * scale)],
    [Math.round(48 * scale), Math.round(26 * scale)],
    [Math.round(64 * scale), Math.round(36 * scale)],
    [Math.round(89 * scale), Math.round(68 * scale)],
    [Math.round(99 * scale), Math.round(78 * scale)],
  ].filter(([f, t]) => f >= 1 && t >= 1 && f <= totalTiles && t <= totalTiles && f > t) as [number, number][];

  ladders.forEach(([f, t]) => addEdge(`snakes_${f}`, `snakes_${t}`, 1, 'wireless', 'ladder climb'));
  snakes.forEach(([f, t]) => addEdge(`snakes_${f}`, `snakes_${t}`, 3, 'corridor', 'snake slide'));

  const { row: pr, col: pc } = serpentinePosition(totalTiles, gridSize);
  addNode({
    id: 'portal_snakes',
    label: 'Snakes & Ladders\nFinish Tile',
    type: 'winning_square',
    x: originX + pc * tileSize,
    y: originY + (gridSize - 1 - pr) * tileSize,
    level: totalTiles + 2,
    buildingId: 'Snakes & Ladders',
    metadata: { board: 'snakes', tile: totalTiles }
  });
  addEdge(`snakes_${totalTiles}`, 'portal_snakes', 1, 'wireless', 'finish');
}

function serpentinePosition(tileNumber: number, gridSize: number): { row: number; col: number } {
  const index = tileNumber - 1;
  const row = Math.floor(index / gridSize);
  const colInRow = index % gridSize;
  const col = row % 2 === 0 ? colInRow : gridSize - 1 - colInRow;
  return { row, col };
}

export function getGameAIEnemyCandidates(graph: ScenarioGraph): string[] {
  // 🧠 FIX: Look for 'board_tile' so the dynamic event engine knows where it can spawn obstacles!
  return graph.nodes.filter(n => n.type === 'board_tile').map(n => n.id);
}
