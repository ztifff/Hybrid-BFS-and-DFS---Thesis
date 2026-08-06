async function run() {
  const response = await fetch('http://localhost:3200/api/simulation/run?offset=0&limit=1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scenario: 'gameai',
      mapId: undefined, // or synthetic
      seed: 123,
      graphSize: 'medium',
      sizing: { nodes: 999, edges: 112 },
      gameBoard: 'dama'
    })
  });
  const json = await response.json();
  console.log("Response nodes:", json.data.results.bfs.graph.nodes.length);
}

run();
