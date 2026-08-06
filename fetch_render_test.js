async function run() {
  const response = await fetch('https://backend-1e4y.onrender.com/api/simulation/run?offset=0&limit=1000', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({"scenario":"gameai","mapId":"synthetic","seed":1785978957632,"graphSize":"medium","sizing":{"nodes":82,"edges":121},"gameBoard":"dama"})
  });
  const json = await response.json();
  console.log("BFS Nodes:", json.data.results.bfs.graph.nodes.length);
}
run();
