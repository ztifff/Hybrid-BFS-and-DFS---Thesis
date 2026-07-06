import { ScenarioGraph, GraphNode, GraphEdge, GraphSize, GraphSizing } from '../types/index';
import { clampInt, fitGraphEdgeCount, resolveSizingValue } from './graphSizing';

const W = 1600; 
const H = 1200;

export type GameAIBoard = 'chess' | 'checkers';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];

const BOARD_SIZE: Record<GraphSize, number> = {
  small: 6,
  medium: 8,
  large: 10
};



export function buildGameAIGraph(
  board: GameAIBoard = 'chess',
  graphSize: GraphSize = 'medium',
  chessPiece: string = 'knight',
  seed: number = 123,
  sizing?: GraphSizing
): ScenarioGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const fallbackBoardDim = BOARD_SIZE[graphSize];
  const fallbackNodes = board === 'checkers'
    ? Math.floor((fallbackBoardDim * fallbackBoardDim) / 2) + 2
    : (fallbackBoardDim * fallbackBoardDim) + 2;
  const targetNodes = resolveSizingValue(sizing?.nodes, fallbackNodes, 18, 220);
  let boardDim = fallbackBoardDim;
  let auxiliaryNodeCount = 0;

  if (sizing) {
    if (board === 'checkers') {
      boardDim = clampInt(Math.sqrt((targetNodes - 2) * 2), 4, 12);
      while (Math.floor((boardDim * boardDim) / 2) + 2 > targetNodes && boardDim > 4) boardDim--;
      auxiliaryNodeCount = targetNodes - (Math.floor((boardDim * boardDim) / 2) + 2);
    } else {
      boardDim = clampInt(Math.sqrt(targetNodes - 2), 4, 12);
      while ((boardDim * boardDim) + 2 > targetNodes && boardDim > 4) boardDim--;
      auxiliaryNodeCount = targetNodes - ((boardDim * boardDim) + 2);
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

  let entryNode = `chess_${files[1]}1`;
  let destinationIds = ['portal_chess'];

  // seeded shuffle helper
  const seededRng = (s: number) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };

  if (board === 'checkers') {
    buildCheckersBoard(addNode, addTwoWayEdge, boardDim);
    entryNode = `checkers_${files[1]}1`;

    // Pick 2-3 random dark squares from the top 2 rows as targets
    const topDarkCols: number[] = [];
    for (let row = boardDim - 1; row >= boardDim - 2; row--) {
      for (let col = 0; col < boardDim; col++) {
        if ((row + col) % 2 !== 0) topDarkCols.push(col * boardDim + row);
      }
    }
    // shuffle with seed
    const shuffled = [...topDarkCols].sort((a, b) => seededRng(seed + a) - seededRng(seed + b));
    const numTargets = 2 + (seededRng(seed + 99) > 0.5 ? 1 : 0);
    destinationIds = shuffled.slice(0, numTargets).map((encoded) => {
      const col = Math.floor(encoded / boardDim);
      const row = encoded % boardDim;
      return `checkers_${files[col]}${row + 1}`;
    }).filter(id => nodes.some(n => n.id === id));

    // fallback if filter removed some
    if (destinationIds.length === 0) destinationIds = [`checkers_${files[boardDim % 2 === 0 ? 1 : 0]}${boardDim}`];

    // mark them as winning_square
    destinationIds.forEach(id => {
      const n = nodes.find(n => n.id === id);
      if (n) { n.type = 'winning_square'; n.label = 'Crown Row Target'; }
    });

  } else {
    buildChessBoard(addNode, addTwoWayEdge, boardDim, chessPiece);

    // Pick 2-3 random top-row squares as targets, color-safe for bishop
    const targetColor = chessPiece === 'bishop' ? ((boardDim - 1 + boardDim - 1) % 2) : -1;
    const topRowCols = Array.from({ length: boardDim }, (_, col) => col)
      .filter(col => targetColor === -1 || ((boardDim - 1 + col) % 2) === targetColor);
    const shuffledCols = [...topRowCols].sort((a, b) => seededRng(seed + a) - seededRng(seed + b));
    const numTargets = 2 + (seededRng(seed + 77) > 0.5 ? 1 : 0);
    destinationIds = shuffledCols.slice(0, numTargets).map(col => `chess_${files[col]}${boardDim}`);

    // mark them as winning_square
    destinationIds.forEach(id => {
      const n = nodes.find(n => n.id === id);
      if (n) { n.type = 'winning_square'; n.label = 'Checkmate Target'; }
    });

    // randomize start from bottom row, color-safe for bishop
    const bottomColor = chessPiece === 'bishop' ? ((0 + 0) % 2) : -1;
    const bottomCols = Array.from({ length: boardDim }, (_, col) => col)
      .filter(col => targetColor === -1 || (0 + col) % 2 === bottomColor);
    const pickedStart = bottomCols[Math.floor(seededRng(seed + 55) * bottomCols.length)];
    entryNode = `chess_${files[pickedStart]}1`;
  }

  addEdge('spawn', entryNode, 1, 'wireless');

  // Move spawn node onto the board at entry position
  const entryNodeObject = nodes.find(n => n.id === entryNode);
  const spawnNode = nodes.find(n => n.id === 'spawn');
  if (entryNodeObject && spawnNode) {
    spawnNode.x = entryNodeObject.x;
    spawnNode.y = entryNodeObject.y;
  }

  return fitGraphEdgeCount({
    nodes,
    edges,
    sourceId: 'spawn',
    destinationIds,
    width: W,
    height: H
  }, sizing?.edges, seed, {
    edgeType: 'path',
    labelUnit: ' move',
    latencyBase: 1,
    latencySpread: 3,
    maxEdges: targetNodes * 16
  });
}

function buildChessBoard(
  addNode: (node: GraphNode) => void,
  addTwoWayEdge: (from: string, to: string, latency?: number, type?: GraphEdge['type'], label?: string) => void,
  size: number,
  chessPiece: string = 'knight'
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

  const getMoves = (): [number, number][] => {
    if (chessPiece === 'bishop') {
      const moves: [number, number][] = [];
      for (let i = 1; i < size; i++) moves.push([i,i],[-i,i],[i,-i],[-i,-i]);
      return moves;
    }
    if (chessPiece === 'rook') {
      const moves: [number, number][] = [];
      for (let i = 1; i < size; i++) moves.push([i,0],[-i,0],[0,i],[0,-i]);
      return moves;
    }
    if (chessPiece === 'queen') {
      const moves: [number, number][] = [];
      for (let i = 1; i < size; i++) moves.push([i,0],[-i,0],[0,i],[0,-i],[i,i],[-i,i],[i,-i],[-i,-i]);
      return moves;
    }
    // knight (default)
    return [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
  };
  const pieceMoves = getMoves();
  const latencyMap: Record<string, number> = { knight: 1, bishop: 2, rook: 1, queen: 1 };
  const moveLatency = latencyMap[chessPiece] ?? 1;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      for (const [dc, dr] of pieceMoves) {
        const nc = col + dc;
        const nr = row + dr;
        if (nc < 0 || nc >= size || nr < 0 || nr >= size) continue;
        const from = `chess_${files[col]}${row + 1}`;
        const to = `chess_${files[nc]}${nr + 1}`;
        if (from < to) addTwoWayEdge(from, to, moveLatency, 'path', `${chessPiece} move`);
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



export function getGameAIEnemyCandidates(graph: ScenarioGraph): string[] {
  // 🧠 FIX: Look for 'board_tile' so the dynamic event engine knows where it can spawn obstacles!
  return graph.nodes.filter(n => n.type === 'board_tile').map(n => n.id);
}
