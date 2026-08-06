import { buildGameAIGraph } from './backend/src/utils/gameAIGraph.ts';

const graph = buildGameAIGraph('dama', 'medium', 'knight', 123, { nodes: 999, edges: 112 });
console.log('Nodes generated:', graph.nodes.length);
