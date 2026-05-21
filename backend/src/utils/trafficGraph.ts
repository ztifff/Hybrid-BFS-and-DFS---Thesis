import { ScenarioGraph } from '../types/index';
import { cabuyaoTrafficGraph } from '../data/traffic.cabuyao'; 

// Set the baseline dimensions to match your Overpass projection matrix
const W = 1200;
const H = 900;

/**
 * Builds the traffic network topology model.
 * Default shifted to TRUE to display the real-world Cabuyao infrastructure mesh automatically.
 */
export function buildTrafficGraph(useRealWorld: boolean = true): ScenarioGraph {
  // Return the high-performance real-world OpenStreetMap parsed data
  if (useRealWorld) {
    return {
      ...cabuyaoTrafficGraph,
      width: cabuyaoTrafficGraph.width || W,
      height: cabuyaoTrafficGraph.height || H
    };
  }

  // --- Fallback Fictional Mock Graph Layout (Kept for Type/Pipeline Safety) ---
  const nodes: any[] = [];
  const edges: any[] = [];

  nodes.push({
    id: 'city_center',
    label: 'City Center',
    type: 'origin',
    x: W / 2,
    y: 50,
    level: 0,
  });

  const corridors = [
    {
      id: 'N', name: 'North', cx: W * 0.18,
      intersections: ['Int-N1', 'Int-N2'],
      streets: [['St-N1a', 'St-N1b'], ['St-N2a', 'St-N2b', 'St-N2c']],
      exit: 'Highway Exit North',
    },
    {
      id: 'E', name: 'East', cx: W * 0.50,
      intersections: ['Int-E1', 'Int-E2'],
      streets: [['St-E1a', 'St-E1b'], ['St-E2a', 'St-E2b']],
      exit: 'Highway Exit East',
    },
    {
      id: 'S', name: 'South', cx: W * 0.82,
      intersections: ['Int-S1', 'Int-S2'],
      streets: [['St-S1a', 'St-S1b', 'St-S1c'], ['St-S2a', 'St-S2b']],
      exit: 'Highway Exit South',
    },
  ];

  const corridorY = 165;

  corridors.forEach((cor) => {
    const corId = `corridor_${cor.id}`;
    nodes.push({
      id: corId,
      label: `${cor.name} Corridor`,
      type: 'intersection',
      x: cor.cx,
      y: corridorY,
      level: 1,
      buildingId: cor.id,
    });
    edges.push({
      id: `cc-${corId}`,
      from: 'city_center',
      to: corId,
      latency: 3,
      label: '3min',
      type: 'road',
    });

    const intStartY = 300;
    const intGapY = 145;

    cor.intersections.forEach((intName, ii) => {
      const intId = `int_${cor.id}_${ii + 1}`;
      const intY = intStartY + ii * intGapY;
      const prevId = ii === 0 ? corId : `int_${cor.id}_${ii}`;

      nodes.push({
        id: intId,
        label: intName,
        type: 'intersection',
        x: cor.cx,
        y: intY,
        level: 2,
        buildingId: cor.id,
      });
      edges.push({
        id: `${prevId}-${intId}`,
        from: prevId,
        to: intId,
        latency: 4,
        label: '4min',
        type: 'road',
      });

      const streetList = cor.streets[ii] ?? [];
      const spread = 52;
      streetList.forEach((stLabel, si) => {
        const stId = `street_${cor.id}_${ii + 1}_${si + 1}`;
        const offset = (si - (streetList.length - 1) / 2) * spread;

        nodes.push({
          id: stId,
          label: stLabel,
          type: 'street',
          x: cor.cx + offset,
          y: intY + 90,
          level: 3,
          buildingId: cor.id,
        });
        edges.push({
          id: `${intId}-${stId}`,
          from: intId,
          to: stId,
          latency: 2,
          label: '2min',
          type: 'road',
        });
      });
    });

    const exitId = `exit_${cor.id}`;
    const lastIntId = `int_${cor.id}_${cor.intersections.length}`;
    const exitY = intStartY + (cor.intersections.length - 1) * intGapY + 205;

    nodes.push({
      id: exitId,
      label: cor.exit,
      type: 'highway',
      x: cor.cx,
      y: Math.min(exitY, H - 40),
      level: 4,
      buildingId: cor.id,
    });
    edges.push({
      id: `${lastIntId}-${exitId}`,
      from: lastIntId,
      to: exitId,
      latency: 2,
      label: '2min',
      type: 'road',
    });
  });

  const destinationIds = nodes.filter((n) => n.type === 'highway').map((n) => n.id);

  return {
    nodes, edges,
    sourceId: 'city_center',
    destinationIds,
    width: W,
    height: H,
  };
}

/**
 * Returns eligible intersection or street node IDs for random or dynamic traffic closures
 */
export function getTrafficClosureCandidates(graph: ScenarioGraph): string[] {
  // Works for both simulated maps and real-world Cabuyao graphs natively!
  return graph.nodes
    .filter((n) => n.type === 'intersection' || n.type === 'street')
    .map((n) => n.id);
}