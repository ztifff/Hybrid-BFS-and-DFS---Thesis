/**
 * Board-game Game AI pathfinding graph.
 *
 * The scenario models three familiar board-game movement spaces in one arena:
 * chess knight routing, checkers diagonal/jump routing, and Snakes & Ladders
 * race-board routing. They remain plain graph topologies so BFS, DFS, and the
 * hybrid strategy can compare pathfinding behavior without a full rules engine.
 */

import { ScenarioGraph, GraphNode, GraphEdge } from '../types/index';

const W = 1000;
const H = 860;

export type GameAIBoard = 'chess' | 'checkers' | 'snakes';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export function buildGameAIGraph(board: GameAIBoard = 'chess'): ScenarioGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const addNode = (node: GraphNode) => nodes.push(node);
  const addEdge = (
    from: string,
    to: string,
    latency = 1,
    type: GraphEdge['type'] = 'path',
    label = `${latency} move`
  ) => {
    edges.push({ id: `${from}-${to}`, from, to, latency, label, type });
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
    label: 'Strategy AI\nMove Planner',
    type: 'spawn',
    x: W / 2,
    y: 56,
    level: 0,
    buildingId: 'Arena',
    metadata: { board: 'arena' }
  });

  let entryNode = 'chess_b1';
  let destinationIds = ['portal_chess'];

  if (board === 'checkers') {
    buildCheckersBoard(addNode, addTwoWayEdge);
    entryNode = 'checkers_b1';
    destinationIds = ['portal_checkers'];
  } else if (board === 'snakes') {
    buildSnakesAndLaddersBoard(addNode, addEdge);
    entryNode = 'snakes_1';
    destinationIds = ['portal_snakes'];
  } else {
    buildChessBoard(addNode, addTwoWayEdge);
  }

  addEdge('spawn', entryNode, 1, 'wireless', `select ${board}`);

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
  addTwoWayEdge: (from: string, to: string, latency?: number, type?: GraphEdge['type'], label?: string) => void
) {
  const originX = 276;
  const originY = 178;
  const tile = 64;
  const board: GameAIBoard = 'chess';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const id = chessId(col, row);
      const square = `${files[col]}${row + 1}`;
      addNode({
        id,
        label: square,
        type: 'room',
        x: originX + col * tile,
        y: originY + (7 - row) * tile,
        level: row + col + 1,
        buildingId: 'Chess',
        metadata: { board, row, col, square }
      });
    }
  }

  const knightMoves = [
    [1, 2], [2, 1], [-1, 2], [-2, 1],
    [1, -2], [2, -1], [-1, -2], [-2, -1]
  ];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      for (const [dc, dr] of knightMoves) {
        const nextCol = col + dc;
        const nextRow = row + dr;
        if (nextCol < 0 || nextCol > 7 || nextRow < 0 || nextRow > 7) continue;

        const from = chessId(col, row);
        const to = chessId(nextCol, nextRow);
        if (from < to) addTwoWayEdge(from, to, 1, 'path', 'knight jump');
      }
    }
  }

  addNode({
    id: 'portal_chess',
    label: 'Chess Checkmate\nTarget Square',
    type: 'portal',
    x: originX + 7 * tile,
    y: originY,
    level: 16,
    buildingId: 'Chess',
    metadata: { board, row: 7, col: 7, square: 'h8' }
  });
  addTwoWayEdge('chess_h8', 'portal_chess', 1, 'wireless', 'checkmate');
}

function buildCheckersBoard(
  addNode: (node: GraphNode) => void,
  addTwoWayEdge: (from: string, to: string, latency?: number, type?: GraphEdge['type'], label?: string) => void
) {
  const originX = 276;
  const originY = 178;
  const tile = 64;
  const board: GameAIBoard = 'checkers';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 0) continue;

      const square = `${files[col]}${row + 1}`;
      addNode({
        id: checkersId(col, row),
        label: square,
        type: 'room',
        x: originX + col * tile,
        y: originY + (7 - row) * tile,
        level: row + col + 1,
        buildingId: 'Checkers',
        metadata: { board, row, col, square }
      });
    }
  }

  const moves = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [2, 2], [-2, 2], [2, -2], [-2, -2]
  ];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 0) continue;

      for (const [dc, dr] of moves) {
        const nextCol = col + dc;
        const nextRow = row + dr;
        if (nextCol < 0 || nextCol > 7 || nextRow < 0 || nextRow > 7) continue;
        if ((nextRow + nextCol) % 2 === 0) continue;

        const from = checkersId(col, row);
        const to = checkersId(nextCol, nextRow);
        if (from < to) {
          const isJump = Math.abs(dc) === 2;
          addTwoWayEdge(from, to, isJump ? 1 : 2, isJump ? 'wireless' : 'path', isJump ? 'capture jump' : 'diagonal move');
        }
      }
    }
  }

  addNode({
    id: 'portal_checkers',
    label: 'Checkers Crown Row\nTarget Square',
    type: 'portal',
    x: originX + 6 * tile,
    y: originY,
    level: 16,
    buildingId: 'Checkers',
    metadata: { board, row: 7, col: 6, square: 'g8' }
  });
  addTwoWayEdge('checkers_g8', 'portal_checkers', 1, 'wireless', 'king me');
}

function buildSnakesAndLaddersBoard(
  addNode: (node: GraphNode) => void,
  addEdge: (from: string, to: string, latency?: number, type?: GraphEdge['type'], label?: string) => void
) {
  const originX = 239;
  const originY = 114;
  const tile = 58;
  const board: GameAIBoard = 'snakes';

  for (let tileNumber = 1; tileNumber <= 100; tileNumber++) {
    const { row, col } = serpentinePosition(tileNumber);
    addNode({
      id: snakesId(tileNumber),
      label: `${tileNumber}`,
      type: 'room',
      x: originX + col * tile,
      y: originY + (9 - row) * tile,
      // Offset by 1 so the first tile (tile 1) gets level 2, not level 1.
      // level === 1 is reserved for top-level hub nodes in the hybrid
      // algorithm; using it here caused snakes_1 to be misidentified as a
      // hub, forcing DFS throughout the board and collapsing the animation.
      level: tileNumber + 1,
      buildingId: 'Snakes & Ladders',
      metadata: { board, row, col, tile: tileNumber }
    });
  }

  for (let tileNumber = 1; tileNumber < 100; tileNumber++) {
    addEdge(snakesId(tileNumber), snakesId(tileNumber + 1), 1, 'path', 'next tile');
  }

  const ladders: Array<[number, number]> = [
    [3, 22], [8, 30], [28, 55], [58, 77], [71, 92]
  ];
  const snakes: Array<[number, number]> = [
    [27, 5], [48, 26], [64, 36], [89, 68], [99, 78]
  ];

  ladders.forEach(([from, to]) => addEdge(snakesId(from), snakesId(to), 1, 'wireless', 'ladder climb'));
  snakes.forEach(([from, to]) => addEdge(snakesId(from), snakesId(to), 3, 'corridor', 'snake slide'));

  addNode({
    id: 'portal_snakes',
    label: 'Snakes & Ladders\nFinish Tile',
    type: 'portal',
    x: originX,
    y: originY,
    level: 102,
    buildingId: 'Snakes & Ladders',
    metadata: { board, row: 9, col: 0, tile: 100 }
  });
  addEdge('snakes_100', 'portal_snakes', 1, 'wireless', 'finish');
}

function chessId(col: number, row: number): string {
  return `chess_${files[col]}${row + 1}`;
}

function checkersId(col: number, row: number): string {
  return `checkers_${files[col]}${row + 1}`;
}

function snakesId(tileNumber: number): string {
  return `snakes_${tileNumber}`;
}

function serpentinePosition(tileNumber: number): { row: number; col: number } {
  const index = tileNumber - 1;
  const row = Math.floor(index / 10);
  const colInRow = index % 10;
  const col = row % 2 === 0 ? colInRow : 9 - colInRow;
  return { row, col };
}

export function getGameAIEnemyCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes
    .filter((n) => n.type === 'room' || n.type === 'corridor')
    .map((n) => n.id);
}
