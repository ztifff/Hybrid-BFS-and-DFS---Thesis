/**
 * Dungeon Game AI Pathfinding Graph
 */

import { ScenarioGraph, GraphNode, GraphEdge } from '../types/index';
// ✅ Import the newly generated Elden Ring map
import { gameAIEldenRingGraph } from '../data/gameai.eldenring';

const W = 1000;
const H = 760;

// ✅ Added the useRealWorld parameter
export function buildGameAIGraph(useRealWorld: boolean = false): ScenarioGraph {
  
  // ✅ If Real-World is checked, return the colossal Elden Ring Map!
  if (useRealWorld) {
    return gameAIEldenRingGraph as ScenarioGraph;
  }

  // 👇 Otherwise, return the standard small dungeon map
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // ── Spawn Room ──────────────────────────────────────────────────────────
  nodes.push({
    id: 'spawn',
    label: 'Spawn Room',
    type: 'spawn',
    x: W / 2,
    y: 50,
    level: 0,
  });

  // ── Wings ───────────────────────────────────────────────────────────────
  const wings = [
    {
      id: 'W', name: 'West Wing', cx: W * 0.18,
      rooms: [
        { id: 'room_W1', label: 'Armory', y: 260 },
        { id: 'room_W2', label: 'Library', y: 390 },
        { id: 'room_W3', label: 'Crypt', y: 520 },
      ],
      corridors: [
        { id: 'corr_W1', label: 'Dark Hall', x: W * 0.10, y: 455 },
        { id: 'corr_W2', label: 'Stone Pass', x: W * 0.26, y: 455 },
      ],
      portal: { id: 'portal_W', label: 'Portal West', y: 660 },
    },
    {
      id: 'C', name: 'Central', cx: W * 0.50,
      rooms: [
        { id: 'room_C1', label: 'Throne Room', y: 260 },
        { id: 'room_C2', label: 'Vault', y: 390 },
        { id: 'room_C3', label: 'Ritual Chamber', y: 520 },
      ],
      corridors: [
        { id: 'corr_C1', label: 'Secret Path', x: W * 0.42, y: 455 },
        { id: 'corr_C2', label: 'Passage', x: W * 0.58, y: 455 },
      ],
      portal: { id: 'portal_C', label: 'Portal Central', y: 660 },
    },
    {
      id: 'E', name: 'East Wing', cx: W * 0.82,
      rooms: [
        { id: 'room_E1', label: 'Barracks', y: 260 },
        { id: 'room_E2', label: 'Workshop', y: 390 },
        { id: 'room_E3', label: 'Dragon Lair', y: 520 },
      ],
      corridors: [
        { id: 'corr_E1', label: 'Fire Hall', x: W * 0.74, y: 455 },
        { id: 'corr_E2', label: 'Lava Bridge', x: W * 0.90, y: 455 },
      ],
      portal: { id: 'portal_E', label: 'Portal East', y: 660 },
    },
  ];

  wings.forEach((wing) => {
    const firstRoom = wing.rooms[0];
    nodes.push({
      id: firstRoom.id,
      label: firstRoom.label,
      type: 'room',
      x: wing.cx,
      y: firstRoom.y,
      level: 1,
      buildingId: wing.id,
    });
    edges.push({
      id: `spawn-${firstRoom.id}`,
      from: 'spawn',
      to: firstRoom.id,
      latency: 1,
      label: '1pt',
      type: 'corridor',
    });

    for (let ri = 1; ri < wing.rooms.length; ri++) {
      const room = wing.rooms[ri];
      nodes.push({
        id: room.id,
        label: room.label,
        type: 'room',
        x: wing.cx,
        y: room.y,
        level: ri + 1,
        buildingId: wing.id,
      });
      edges.push({
        id: `${wing.rooms[ri - 1].id}-${room.id}`,
        from: wing.rooms[ri - 1].id,
        to: room.id,
        latency: 2,
        label: '2pt',
        type: 'path',
      });
    }

    const lastRoom = wing.rooms[wing.rooms.length - 1];
    wing.corridors.forEach((corr) => {
      nodes.push({
        id: corr.id,
        label: corr.label,
        type: 'corridor',
        x: corr.x,
        y: corr.y,
        level: wing.rooms.length + 1,
        buildingId: wing.id,
      });
      edges.push({
        id: `${lastRoom.id}-${corr.id}`,
        from: lastRoom.id,
        to: corr.id,
        latency: 1,
        label: '1pt',
        type: 'corridor',
      });

      edges.push({
        id: `${corr.id}-${wing.portal.id}`,
        from: corr.id,
        to: wing.portal.id,
        latency: 3,
        label: '3pt',
        type: 'wireless',
      });
    });

    nodes.push({
      id: wing.portal.id,
      label: wing.portal.label,
      type: 'portal',
      x: wing.cx,
      y: wing.portal.y,
      level: wing.rooms.length + 2,
      buildingId: wing.id,
    });
  });

  const destinationIds = nodes.filter((n) => n.type === 'portal').map((n) => n.id);

  return {
    nodes, edges,
    sourceId: 'spawn',
    destinationIds,
    width: W,
    height: H,
  };
}

export function getGameAIEnemyCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes.filter((n) => n.type === 'room' || n.type === 'corridor').map((n) => n.id);
}