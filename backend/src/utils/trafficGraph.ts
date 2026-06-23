import { ScenarioGraph, GraphSize } from '../types/index';
import { cabuyaoTrafficGraph } from '../data/traffic.cabuyao';

const W = 1200;
const H = 900;

const SIZE_CONFIG = {
  small: [
    { id: 'N', name: 'North', cx: W * 0.25, intersections: 2, streetsPerInt: [2, 2], exit: 'Highway Exit North' },
    { id: 'S', name: 'South', cx: W * 0.75, intersections: 2, streetsPerInt: [2, 2], exit: 'Highway Exit South' },
  ],
  medium: [
    { id: 'N', name: 'North', cx: W * 0.18, intersections: 2, streetsPerInt: [2, 3], exit: 'Highway Exit North' },
    { id: 'E', name: 'East',  cx: W * 0.50, intersections: 2, streetsPerInt: [2, 2], exit: 'Highway Exit East'  },
    { id: 'S', name: 'South', cx: W * 0.82, intersections: 2, streetsPerInt: [3, 2], exit: 'Highway Exit South' },
  ],
  large: [
    { id: 'NW', name: 'North-West', cx: W * 0.10, intersections: 3, streetsPerInt: [3, 3, 2], exit: 'Exit NW'    },
    { id: 'N',  name: 'North',      cx: W * 0.28, intersections: 3, streetsPerInt: [2, 3, 3], exit: 'Exit North' },
    { id: 'E',  name: 'East',       cx: W * 0.50, intersections: 4, streetsPerInt: [2, 2, 3, 2], exit: 'Exit East' },
    { id: 'S',  name: 'South',      cx: W * 0.72, intersections: 3, streetsPerInt: [3, 2, 3], exit: 'Exit South' },
    { id: 'SW', name: 'South-West', cx: W * 0.90, intersections: 3, streetsPerInt: [2, 2, 2], exit: 'Exit SW'    },
  ],
};

export function buildTrafficGraph(useRealWorld: boolean = true, graphSize: GraphSize = 'medium'): ScenarioGraph {
  if (useRealWorld) {
    return {
      ...cabuyaoTrafficGraph,
      width: cabuyaoTrafficGraph.width || W,
      height: cabuyaoTrafficGraph.height || H,
    };
  }

  const nodes: any[] = [];
  const edges: any[] = [];
  const corridors = SIZE_CONFIG[graphSize];

  nodes.push({ id: 'city_center', label: 'City Center', type: 'origin', x: W / 2, y: 50, level: 0 });

  const corridorY = 165;
  const intStartY = 300;
  const intGapY = 145;

  corridors.forEach((cor) => {
    const corId = `corridor_${cor.id}`;
    nodes.push({ id: corId, label: `${cor.name} Corridor`, type: 'intersection', x: cor.cx, y: corridorY, level: 1, buildingId: cor.id });
    edges.push({ id: `cc-${corId}`, from: 'city_center', to: corId, latency: 3, label: '3min', type: 'road' });

    for (let ii = 0; ii < cor.intersections; ii++) {
      const intId = `int_${cor.id}_${ii + 1}`;
      const intY = intStartY + ii * intGapY;
      const prevId = ii === 0 ? corId : `int_${cor.id}_${ii}`;

      nodes.push({ id: intId, label: `Int-${cor.id}${ii + 1}`, type: 'intersection', x: cor.cx, y: intY, level: 2, buildingId: cor.id });
      edges.push({ id: `${prevId}-${intId}`, from: prevId, to: intId, latency: 4, label: '4min', type: 'road' });

      const streetCount = cor.streetsPerInt[ii] ?? 2;
      const spread = 52;
      for (let si = 0; si < streetCount; si++) {
        const stId = `street_${cor.id}_${ii + 1}_${si + 1}`;
        const offset = (si - (streetCount - 1) / 2) * spread;
        nodes.push({ id: stId, label: `St-${cor.id}${ii + 1}${si + 1}`, type: 'street', x: cor.cx + offset, y: intY + 90, level: 3, buildingId: cor.id });
        edges.push({ id: `${intId}-${stId}`, from: intId, to: stId, latency: 2, label: '2min', type: 'road' });
      }
    }

    const exitId = `exit_${cor.id}`;
    const lastIntId = `int_${cor.id}_${cor.intersections}`;
    const exitY = intStartY + (cor.intersections - 1) * intGapY + 205;
    nodes.push({ id: exitId, label: cor.exit, type: 'highway', x: cor.cx, y: Math.min(exitY, H - 40), level: 4, buildingId: cor.id });
    edges.push({ id: `${lastIntId}-${exitId}`, from: lastIntId, to: exitId, latency: 2, label: '2min', type: 'road' });
  });

  const destinationIds = nodes.filter(n => n.type === 'highway').map(n => n.id);
  return { nodes, edges, sourceId: 'city_center', destinationIds, width: W, height: H };
}

export function getTrafficClosureCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes.filter(n => n.type === 'intersection' || n.type === 'street').map(n => n.id);
}
