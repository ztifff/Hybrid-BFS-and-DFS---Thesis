async function run() {
  const params = new URLSearchParams({
    scenario: 'gameai',
    mapId: 'synthetic',
    seed: '123',
    graphSize: 'medium',
    gameBoard: 'dama',
    nodes: '99',
    edges: '112'
  });
  const response = await fetch(`http://localhost:3200/api/network/graph?${params.toString()}`);
  const json = await response.json();
  console.log("Graph Nodes:", json.data.nodes.length);
}
run();
