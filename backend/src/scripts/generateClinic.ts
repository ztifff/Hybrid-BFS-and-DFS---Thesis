import fs from "node:fs";
import path from "node:path";

interface GraphNode { id: string; label: string; type: string; x: number; y: number; level: number; }
interface GraphEdge { id: string; from: string; to: string; latency: number; type: string; }
interface ScenarioGraph { nodes: GraphNode[]; edges: GraphEdge[]; sourceId: string; destinationIds: string[]; width: number; height: number; }

function parseOpenRMFClinic() {
  console.log("🔍 Reading Open-RMF Clinic Dataset...");
  
  const yamlPath = path.join(__dirname, "clinic.building.yaml");
  if (!fs.existsSync(yamlPath)) {
    console.error("❌ Error: clinic.building.yaml not found in scripts folder!");
    return;
  }

  const yamlContent = fs.readFileSync(yamlPath, "utf-8");
  const lines = yamlContent.split('\n');

  const rawVertices: { x: number; y: number; name: string }[] = [];
  const rawLanes: { v1: number; v2: number }[] = [];

  let inL1 = false;
  let inVertices = false;
  let inLanes = false;

  lines.forEach(line => {
    if (line.startsWith('  L1:')) { inL1 = true; return; }
    if (line.startsWith('  L2:')) { inL1 = false; return; }
    if (!inL1) return;

    if (line.includes('vertices:')) { inVertices = true; inLanes = false; return; }
    if (line.includes('lanes:')) { inVertices = false; inLanes = true; return; }
    if (line.includes('models:') || line.includes('measurements:') || line.includes('walls:') || line.includes('doors:')) { 
      inVertices = false; inLanes = false; return; 
    }

    if (inVertices && line.trim().startsWith('- [')) {
      const match = line.match(/-\s*\[(.*?)\]/);
      if (match) {
        const parts = match[1].split(',');
        if (parts.length >= 2) {
          const x = parseFloat(parts[0]);
          const y = parseFloat(parts[1]);
          const namePart = parts[3] ? parts[3].trim().replace(/^"|"$/g, '') : "";
          rawVertices.push({ x, y, name: namePart });
        }
      }
    }

    if (inLanes && line.trim().startsWith('- [')) {
      const match = line.match(/-\s*\[\s*(\d+)\s*,\s*(\d+)/);
      if (match) {
        rawLanes.push({ v1: parseInt(match[1], 10), v2: parseInt(match[2], 10) });
      }
    }
  });

  // 🧠 THE MAGIC FIX: Isolate the actual driving paths from the architectural walls!
  const usedVertexIndices = new Set<number>();
  rawLanes.forEach(lane => {
    usedVertexIndices.add(lane.v1);
    usedVertexIndices.add(lane.v2);
  });

  console.log(`📊 Extracted ${rawVertices.length} Total Vertices and ${rawLanes.length} Lanes.`);
  console.log(`🧹 Filtered out ${rawVertices.length - usedVertexIndices.size} architectural walls. Keeping ${usedVertexIndices.size} actual path nodes!`);

  if (usedVertexIndices.size === 0) {
    console.error("❌ No path lanes found! Parser failed.");
    return;
  }

  // Calculate True Aspect Ratio Scaling based ONLY on the path nodes
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  rawVertices.forEach((v, i) => {
    if (!usedVertexIndices.has(i)) return; // Skip walls!
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  });

  const W = 1600;
  const H = 1200;
  
  const diffX = maxX - minX || 1;
  const diffY = maxY - minY || 1;
  const scale = Math.min((W - 300) / diffX, (H - 300) / diffY);
  
  const offsetX = (W - diffX * scale) / 2;
  const offsetY = (H - diffY * scale) / 2;

  const scaleX = (x: number) => offsetX + (maxX - x) * scale;
  const scaleY = (y: number) => offsetY + (maxY - y) * scale;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const destinationIds: string[] = [];
  let sourceId = "";

  // 🧠 FIX: Safely map original YAML indices to the new Graph Nodes
  const nodeMap = new Map<number, GraphNode>();

  rawVertices.forEach((v, index) => {
    if (!usedVertexIndices.has(index)) return; // Throw away the unconnected wall corners

    const isNamed = v.name !== "";
    const nodeId = `node_${index}`;

    if (isNamed) {
      if (!sourceId && v.name.toLowerCase().includes('mag')) {
        sourceId = nodeId;
      } else {
        destinationIds.push(nodeId);
      }
    }

    const node: GraphNode = {
      id: nodeId,
      label: isNamed ? v.name : '',
      type: isNamed ? (sourceId === nodeId ? 'depot' : 'shelf') : 'aisle',
      x: scaleX(v.x),
      y: scaleY(v.y),
      level: 1
    };
    
    nodes.push(node);
    nodeMap.set(index, node);
  });

  if (!sourceId && nodes.length > 0) sourceId = nodes[0].id;

  rawLanes.forEach(lane => {
    const n1 = nodeMap.get(lane.v1);
    const n2 = nodeMap.get(lane.v2);
    if (!n1 || !n2) return;

    const dist = Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2));
    const latency = Math.max(1, Math.round(dist / 20)); 

    edges.push({ id: `e_${n1.id}_${n2.id}`, from: n1.id, to: n2.id, latency, type: 'corridor' });
    edges.push({ id: `e_${n2.id}_${n1.id}`, from: n2.id, to: n1.id, latency, type: 'corridor' });
  });

  const graph: ScenarioGraph = { nodes, edges, sourceId, destinationIds, width: W, height: H };

  const outPath = path.join(process.cwd(), "src", "data", "robotics.clinic.ts.ts");
  const fileContent = `// Auto-generated from Open-RMF Clinic Dataset\nimport type { ScenarioGraph } from "../types";\n\nexport const clinicGraph : ScenarioGraph = ${JSON.stringify(graph, null, 2)};\n`;

  fs.writeFileSync(outPath, fileContent);
  console.log(`✅ Successfully generated perfectly scaled Official RMF Clinic Graph!`);
}

parseOpenRMFClinic();