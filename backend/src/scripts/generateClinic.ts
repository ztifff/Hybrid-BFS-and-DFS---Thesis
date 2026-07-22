import fs from "node:fs";
import path from "node:path";

interface GraphNode { id: string; label: string; type: string; x: number; y: number; level: number; buildingId: string; }
interface GraphEdge { id: string; from: string; to: string; latency: number; type: string; }
interface ScenarioGraph { 
  nodes: GraphNode[]; 
  edges: GraphEdge[]; 
  sourceId: string; 
  destinationIds: string[]; 
  width: number; 
  height: number;
  walls?: { x1: number; y1: number; x2: number; y2: number; level: string; }[];
}

function parseOpenRMFClinic() {
  console.log("🔍 Reading Open-RMF Clinic Dataset...");
  
  const yamlPath = path.join(__dirname, "clinic.building.yaml");
  if (!fs.existsSync(yamlPath)) {
    console.error("❌ Error: clinic.building.yaml not found in scripts folder!");
    return;
  }

  const yamlContent = fs.readFileSync(yamlPath, "utf-8");
  const lines = yamlContent.split('\n');

  interface FloorData {
    vertices: { x: number; y: number; name: string }[];
    lanes: { v1: number; v2: number }[];
    walls: { v1: number; v2: number }[];
  }

  const floors: Record<string, FloorData> = {
    'L1': { vertices: [], lanes: [], walls: [] },
    'L2': { vertices: [], lanes: [], walls: [] }
  };

  let currentFloor = '';
  let currentSection = '';

  lines.forEach(line => {
    if (line.startsWith('  L1:')) { currentFloor = 'L1'; currentSection = ''; return; }
    if (line.startsWith('  L2:')) { currentFloor = 'L2'; currentSection = ''; return; }
    if (!currentFloor) return;

    if (line.startsWith('    vertices:')) { currentSection = 'vertices'; return; }
    if (line.startsWith('    lanes:')) { currentSection = 'lanes'; return; }
    if (line.startsWith('    walls:')) { currentSection = 'walls'; return; }
    if (line.startsWith('    doors:') || line.startsWith('    models:') || line.startsWith('    measurements:') || line.startsWith('    elevation:')) { 
      currentSection = ''; return; 
    }

    if (currentSection === 'vertices' && line.trim().startsWith('- [')) {
      const match = line.match(/-\s*\[(.*?)\]/);
      if (match) {
        const parts = match[1].split(',');
        if (parts.length >= 2) {
          const x = parseFloat(parts[0]);
          const y = parseFloat(parts[1]);
          const namePart = parts[3] ? parts[3].trim().replace(/^"|"$/g, '') : "";
          floors[currentFloor].vertices.push({ x, y, name: namePart });
        }
      }
    }

    if (currentSection === 'lanes' && line.trim().startsWith('- [')) {
      const match = line.match(/-\s*\[\s*(\d+)\s*,\s*(\d+)/);
      if (match) {
        floors[currentFloor].lanes.push({ v1: parseInt(match[1], 10), v2: parseInt(match[2], 10) });
      }
    }

    if (currentSection === 'walls' && line.trim().startsWith('- [')) {
      const match = line.match(/-\s*\[\s*(\d+)\s*,\s*(\d+)/);
      if (match) {
        floors[currentFloor].walls.push({ v1: parseInt(match[1], 10), v2: parseInt(match[2], 10) });
      }
    }
  });

  const usedVertexIndicesL1 = new Set<number>();
  floors['L1'].lanes.forEach(lane => { usedVertexIndicesL1.add(lane.v1); usedVertexIndicesL1.add(lane.v2); });
  const usedVertexIndicesL2 = new Set<number>();
  floors['L2'].lanes.forEach(lane => { usedVertexIndicesL2.add(lane.v1); usedVertexIndicesL2.add(lane.v2); });

  console.log(`📊 L1: ${floors['L1'].vertices.length} vertices, ${floors['L1'].lanes.length} lanes, ${floors['L1'].walls.length} walls.`);
  console.log(`📊 L2: ${floors['L2'].vertices.length} vertices, ${floors['L2'].lanes.length} lanes, ${floors['L2'].walls.length} walls.`);

  // Calculate True Aspect Ratio Scaling based on ALL vertices across all floors
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  ['L1', 'L2'].forEach(f => {
    floors[f].vertices.forEach(v => {
      if (v.x < minX) minX = v.x;
      if (v.x > maxX) maxX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
    });
  });

  const W = 1680;
  const H = 1280;
  
  const diffX = maxX - minX || 1;
  const diffY = maxY - minY || 1;
  const scale = Math.min(W / diffX, H / diffY);
  
  const offsetX = (W - diffX * scale) / 2 - 120;
  const offsetY = (H - diffY * scale) / 2 + 40;

  const scaleX = (x: number) => offsetX + (x - minX) * scale;
  const scaleY = (y: number) => offsetY + (y - minY) * scale;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const destinationIds: string[] = [];
  let sourceId = "";

  const finalWalls: NonNullable<ScenarioGraph['walls']> = [];

  function getAisleName(x: number, y: number) {
    const horizontal = x < W * 0.4 ? "West" : x > W * 0.6 ? "East" : "Central";
    const vertical = y < H * 0.4 ? "North" : y > H * 0.6 ? "South" : "Mid";
    return `Clinic Corridor (${vertical}-${horizontal})`;
  }

  ['L1', 'L2'].forEach(f => {
    const floorData = floors[f];
    const usedIndices = f === 'L1' ? usedVertexIndicesL1 : usedVertexIndicesL2;
    const nodeMap = new Map<number, GraphNode>();

    // Add nodes
    floorData.vertices.forEach((v, index) => {
      if (!usedIndices.has(index)) return;

      const isNamed = v.name !== "";
      const nodeId = `node_${f}_${index}`;

      let isDepot = false;
      if (isNamed) {
        if (v.name.toLowerCase().includes('mag') || v.name === 'L1_sub_waiting_area_8') {
          isDepot = true;
          if (!sourceId) sourceId = nodeId; // Keep first one as legacy sourceId
        } else {
          destinationIds.push(nodeId);
        }
      }

      const nodeX = scaleX(v.x);
      const nodeY = scaleY(v.y);

      const node: GraphNode = {
        id: nodeId,
        label: isNamed ? v.name : getAisleName(nodeX, nodeY),
        type: isNamed ? (isDepot ? 'depot' : 'shelf') : 'aisle',
        x: nodeX,
        y: nodeY,
        level: f === 'L1' ? 1 : 2,
        buildingId: f
      };
      

      nodes.push(node);
      nodeMap.set(index, node);
    });

    if (!sourceId && nodes.length > 0) sourceId = nodes[0].id;

    // Add lanes (edges)
    floorData.lanes.forEach(lane => {
      const n1 = nodeMap.get(lane.v1);
      const n2 = nodeMap.get(lane.v2);
      if (!n1 || !n2) return;

      const dist = Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2));
      const latency = Math.max(1, Math.round(dist / 20)); 

      edges.push({ id: `e_${n1.id}_${n2.id}`, from: n1.id, to: n2.id, latency, type: 'corridor' });
      edges.push({ id: `e_${n2.id}_${n1.id}`, from: n2.id, to: n1.id, latency, type: 'corridor' });
    });

    // Add walls
    floorData.walls.forEach(wall => {
      const v1 = floorData.vertices[wall.v1];
      const v2 = floorData.vertices[wall.v2];
      if (!v1 || !v2) return;

      finalWalls.push({
        x1: scaleX(v1.x),
        y1: scaleY(v1.y),
        x2: scaleX(v2.x),
        y2: scaleY(v2.y),
        level: f
      });
    });
  });

  // Link L1 and L2 using a known lift if available, else find nearest nodes
  let l1Lift = nodes.find(n => n.buildingId === 'L1' && n.label.toLowerCase().includes('lift'));
  let l2Lift = nodes.find(n => n.buildingId === 'L2' && n.label.toLowerCase().includes('lift'));

  if (!l1Lift && nodes.some(n => n.buildingId === 'L1')) l1Lift = nodes.find(n => n.buildingId === 'L1');
  if (!l2Lift && nodes.some(n => n.buildingId === 'L2')) l2Lift = nodes.find(n => n.buildingId === 'L2');

  if (l1Lift && l2Lift) {
    edges.push({ id: `e_${l1Lift.id}_${l2Lift.id}`, from: l1Lift.id, to: l2Lift.id, latency: 15, type: 'corridor' });
    edges.push({ id: `e_${l2Lift.id}_${l1Lift.id}`, from: l2Lift.id, to: l1Lift.id, latency: 15, type: 'corridor' });
  }

  const graph: ScenarioGraph = { nodes, edges, sourceId, destinationIds, width: W, height: H, walls: finalWalls };

  const outPath = path.join(__dirname, "..", "data", "robotics.clinic.ts");
  const fileContent = `// Auto-generated from Open-RMF Clinic Dataset with Walls\nimport type { ScenarioGraph } from "../types";\n\nexport const clinicGraph : ScenarioGraph = ${JSON.stringify(graph, null, 2)};\n`;

  fs.writeFileSync(outPath, fileContent);
  console.log(`✅ Successfully generated Official RMF Clinic Graph with Walls!`);
}

parseOpenRMFClinic();