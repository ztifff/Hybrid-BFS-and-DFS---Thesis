import { ScenarioGraph, GraphNode, GraphEdge, GraphSize, GraphSizing } from '../types/index';
import { clampInt, fitGraphEdgeCount, resolveSizingValue } from './graphSizing';

const W = 1600; 
const H = 1200;

export type GameAIBoard = 'dama' | 'checkers';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];

const BOARD_SIZE: Record<GraphSize, number> = {
  small: 6,
  medium: 8,
  large: 10
};



export function buildGameAIGraph(
  board: GameAIBoard = 'dama',
  graphSize: GraphSize = 'medium',
  _chessPiece: string = 'man',   // kept for API compat but unused
  seed: number = 123,
  sizing?: GraphSizing
): ScenarioGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const fallbackBoardDim = BOARD_SIZE[graphSize];

  // Dama uses all board squares + one spawn node; Checkers uses playable dark squares + spawn + portal.
  const fallbackNodes = board === 'checkers'
    ? Math.ceil((fallbackBoardDim * fallbackBoardDim) / 2) + 2
    : (fallbackBoardDim * fallbackBoardDim) + 1;
  const targetNodes = resolveSizingValue(sizing?.nodes, fallbackNodes, 18, 220);
  let boardDim = fallbackBoardDim;
  let auxiliaryNodeCount = 0;

  // Only resize the board when the user has actually moved the slider away from
  // the natural fallback (±15% tolerance). This prevents the shared default
  // slider value from accidentally inflating the board beyond the intended 8×8.
  const userRequestedDifferentSize = sizing != null && Math.abs(targetNodes - fallbackNodes) > fallbackNodes * 0.15;

  if (userRequestedDifferentSize) {
    if (board === 'checkers') {
      boardDim = clampInt(Math.sqrt((targetNodes - 2) * 2), 4, 12);
      while (Math.ceil((boardDim * boardDim) / 2) + 2 > targetNodes && boardDim > 4) boardDim--;
      auxiliaryNodeCount = targetNodes - (Math.ceil((boardDim * boardDim) / 2) + 2);
    } else {
      // Dama uses all squares plus one spawn node.
      boardDim = clampInt(Math.sqrt(targetNodes - 1), 4, 12);
      while ((boardDim * boardDim) + 1 > targetNodes && boardDim > 4) boardDim--;
      auxiliaryNodeCount = targetNodes - ((boardDim * boardDim) + 1);
    }
  }

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

  // seeded shuffle helper
  const seededRng = (s: number) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };

  let entryNode = `dama_${files[1]}1`;
  let destinationIds: string[] = [];

  if (board === 'checkers') {
    buildCheckersBoard(addNode, addTwoWayEdge, boardDim);

    // Randomize start from bottom row dark squares (same seed offset as Dama)
    const bottomDarkCols: number[] = [];
    for (let col = 0; col < boardDim; col++) {
      if ((0 + col) % 2 !== 0) bottomDarkCols.push(col); // dark squares have (row+col) % 2 !== 0
    }
    const pickedCheckerStart = bottomDarkCols[Math.floor(seededRng(seed + 55) * bottomDarkCols.length)];
    entryNode = `checkers_${files[pickedCheckerStart]}1`;

    // Pick 2-3 random dark squares from the top 2 rows as targets
    const topDarkCols: number[] = [];
    for (let row = boardDim - 1; row >= boardDim - 2; row--) {
      for (let col = 0; col < boardDim; col++) {
        if ((row + col) % 2 !== 0) topDarkCols.push(col * boardDim + row);
      }
    }
    const shuffled = [...topDarkCols].sort((a, b) => seededRng(seed + a) - seededRng(seed + b));
    const numTargets = 2 + (seededRng(seed + 99) > 0.5 ? 1 : 0);
    destinationIds = shuffled.slice(0, numTargets).map((encoded) => {
      const col = Math.floor(encoded / boardDim);
      const row = encoded % boardDim;
      return `checkers_${files[col]}${row + 1}`;
    }).filter(id => nodes.some(n => n.id === id));

    if (destinationIds.length === 0) destinationIds = [`checkers_${files[boardDim % 2 === 0 ? 1 : 0]}${boardDim}`];

    destinationIds.forEach(id => {
      const n = nodes.find(n => n.id === id);
      if (n) { n.type = 'winning_square'; n.label = 'Crown Row Target'; }
    });

  } else {
    // Turkish Draughts (Dama)
    buildDamaBoard(addNode, addTwoWayEdge, boardDim);

    // Pick 2-3 random top-row squares as targets
    const topRowCols = Array.from({ length: boardDim }, (_, col) => col);
    const shuffledCols = [...topRowCols].sort((a, b) => seededRng(seed + a) - seededRng(seed + b));
    const numTargets = 2 + (seededRng(seed + 77) > 0.5 ? 1 : 0);
    destinationIds = shuffledCols.slice(0, numTargets).map(col => `dama_${files[col]}${boardDim}`);

    // mark them as winning_square
    destinationIds.forEach(id => {
      const n = nodes.find(n => n.id === id);
      if (n) { n.type = 'winning_square'; n.label = 'Dama King Row'; }
    });

    // randomize start from bottom row
    const bottomCols = Array.from({ length: boardDim }, (_, col) => col);
    const pickedStart = bottomCols[Math.floor(seededRng(seed + 55) * bottomCols.length)];
    entryNode = `dama_${files[pickedStart]}1`;
  }

  addEdge('spawn', entryNode, 1, 'wireless');

  // Move spawn node onto the board at entry position
  const entryNodeObject = nodes.find(n => n.id === entryNode);
  const spawnNode = nodes.find(n => n.id === 'spawn');
  if (entryNodeObject && spawnNode) {
    spawnNode.x = entryNodeObject.x;
    spawnNode.y = entryNodeObject.y;
  }

  return {
    nodes,
    edges,
    sourceId: 'spawn',
    destinationIds,
    width: W,
    height: H
  };
}

// ── Turkish Draughts (Dama) board ────────────────────────────────────────────
// Rules:
//   • All 8×8 squares are used (not just dark ones)
//   • Men move forward orthogonally (left, right, forward — NOT diagonal)
//   • Men capture by orthogonal jump (any direction) over an opponent piece
//   • Kings (after promotion) move any number of squares orthogonally (like a chess rook)
//   • Graph models: short forward/lateral moves (latency 1) + longer king-range moves (latency 2)
function buildDamaBoard(
  addNode: (node: GraphNode) => void,
  addTwoWayEdge: (from: string, to: string, latency?: number, type?: GraphEdge['type'], label?: string) => void,
  size: number
) {
  const tileSize = Math.floor(400 / size);
  const originX = Math.floor((W - tileSize * size) / 2);
  const originY = Math.floor((H - tileSize * size) / 2);

  // 1. Create every square on the board
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const id = `dama_${files[col]}${row + 1}`;
      addNode({
        id,
        label: `${files[col]}${row + 1}`,
        type: 'board_tile',
        x: originX + col * tileSize,
        y: originY + (size - 1 - row) * tileSize,
        level: row + col + 1,
        buildingId: 'Dama',
        metadata: { board: 'dama', row, col }
      });
    }
  }

  // 2. Connect squares with Dama movement rules:
  //    a) Man moves: forward (↑) and lateral (←→) — 1 step, latency 1
  //    b) Man captures: orthogonal jump (↑↓←→ 2 steps), latency 1 (tempo advantage)
  //    c) King range moves: orthogonal sliding any distance, latency 2
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const from = `dama_${files[col]}${row + 1}`;

      // Man moves: forward (row+1), lateral (col±1) — single step
      const manMoves: [number, number][] = [
        [0, 1],   // forward
        [-1, 0],  // left
        [1, 0],   // right
        [0, -1],  // backward (allowed for king; also useful for pathfinding model)
      ];
      for (const [dc, dr] of manMoves) {
        const nc = col + dc;
        const nr = row + dr;
        if (nc < 0 || nc >= size || nr < 0 || nr >= size) continue;
        const to = `dama_${files[nc]}${nr + 1}`;
        if (from < to) addTwoWayEdge(from, to, 1, 'path', 'man move');
      }

      // Capture jumps: orthogonal 2-step (over an opponent)
      const jumpMoves: [number, number][] = [[0,2],[0,-2],[2,0],[-2,0]];
      for (const [dc, dr] of jumpMoves) {
        const nc = col + dc;
        const nr = row + dr;
        if (nc < 0 || nc >= size || nr < 0 || nr >= size) continue;
        const to = `dama_${files[nc]}${nr + 1}`;
        if (from < to) addTwoWayEdge(from, to, 1, 'wireless', 'capture jump');
      }

    }
  }
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



export function getGameAIEnemyCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes.filter(n => n.type === 'board_tile').map(n => n.id);
}
