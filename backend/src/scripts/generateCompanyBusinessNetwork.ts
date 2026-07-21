import fs from "node:fs";
import path from "node:path";

interface GraphNode { id: string; label: string; type: string; x: number; y: number; level: number; }
interface GraphEdge { id: string; from: string; to: string; latency: number; type: string; }
interface ScenarioGraph { nodes: GraphNode[]; edges: GraphEdge[]; sourceId: string; destinationIds: string[]; width: number; height: number; }

const W = 2600;
const H = 1300;

// ─────────────────────────────────────────────────────────────────────────────
// Company Business System Network Design
// Source: https://github.com/Mehedi-Hasan-Rabbi/Company-Business-System-Network-Design
//
// 3-Tier Cisco Architecture:
//   Level 0 — Core Layer   : ISP-1, ISP-2, CORE-R1, CORE-R2 (WAN/Internet Edge)
//   Level 1 — Distribution : DIST-SW1, DIST-SW2 (Multilayer Switches)
//   Level 2 — Access Layer : Per-VLAN Access Switches per Floor
//   Level 3 — End Devices  : PCs, Printers, Laptops, Tablets, Servers
//
// VLANs:
//   VLAN 10 — Sales and Marketing (Floor 1)
//   VLAN 20 — Human Resource & Logistics (Floor 1)
//   VLAN 30 — Finance and Accounts (Floor 2)
//   VLAN 40 — Administration & Public Relations (Floor 2)
//   VLAN 50 — ICT Department (Floor 3)
//   VLAN 80 — Server Room (Floor 3)
// ─────────────────────────────────────────────────────────────────────────────

function generateCompanyBusinessNetwork() {
  console.log("Generating Company Business System Network Topology...");

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const destinationIds: string[] = [];

  // ─── LEVEL 0: Core Layer / WAN ───────────────────────────────────────────
  nodes.push({ id: "isp1",    label: "ISP-1",    type: "datacenter",      x: 900,  y: 80,  level: 0 });
  nodes.push({ id: "isp2",    label: "ISP-2",    type: "datacenter",      x: 1700, y: 80,  level: 0 });
  nodes.push({ id: "core_r1", label: "CORE-R1",  type: "building_router", x: 1000, y: 220, level: 0 });
  nodes.push({ id: "core_r2", label: "CORE-R2",  type: "building_router", x: 1600, y: 220, level: 0 });

  // ISP <-> Core Router cross-links (redundant WAN uplinks)
  edges.push({ id: "e-isp1-cr1",  from: "isp1",    to: "core_r1", latency: 20, type: "serial" });
  edges.push({ id: "e-isp1-cr2",  from: "isp1",    to: "core_r2", latency: 25, type: "serial" });
  edges.push({ id: "e-isp2-cr1",  from: "isp2",    to: "core_r1", latency: 25, type: "serial" });
  edges.push({ id: "e-isp2-cr2",  from: "isp2",    to: "core_r2", latency: 20, type: "serial" });
  // Core-to-Core redundancy link
  edges.push({ id: "e-cr1-cr2",   from: "core_r1", to: "core_r2", latency: 2,  type: "serial" });

  // ─── LEVEL 1: Distribution Layer ─────────────────────────────────────────
  nodes.push({ id: "mlt_sw1", label: "Mlt-SW1", type: "floor_router", x: 1000, y: 400, level: 1 });
  nodes.push({ id: "dist_sw2", label: "DIST-SW2", type: "floor_router", x: 1600, y: 400, level: 1 });

  // Core <-> Distribution (Straight-Through, per Cisco standard router-to-switch)
  edges.push({ id: "e-cr1-msw1", from: "core_r1", to: "mlt_sw1", latency: 3, type: "copper_straight" });
  edges.push({ id: "e-cr1-dsw2", from: "core_r1", to: "dist_sw2", latency: 3, type: "copper_straight" });
  edges.push({ id: "e-cr2-msw1", from: "core_r2", to: "mlt_sw1", latency: 3, type: "copper_straight" });
  edges.push({ id: "e-cr2-dsw2", from: "core_r2", to: "dist_sw2", latency: 3, type: "copper_straight" });
  // Distribution inter-switch link (Cross-Over, switch-to-switch)
  edges.push({ id: "e-msw1-dsw2", from: "mlt_sw1", to: "dist_sw2", latency: 2, type: "copper_crossover" });

  // ─── LEVEL 2 & 3: Access Layer per VLAN ──────────────────────────────────
  // Layout: 3 floors, 2 VLANs each, spread evenly across W
  const floors = [
    {
      floor: 1,
      vlans: [
        {
          id: "acc_vlan10", label: "Sales-SW",
          x: 300, y: 620,
          devices: [
            { id: "sales_pc1",     label: "Sales-PC1",     type: "access_point" },
            { id: "sales_printer", label: "Sales-Printer",  type: "server" },
            { id: "sales_ap",      label: "Sales-AP",       type: "wireless_ap" },
            { id: "sales_laptop",  label: "Sales-Laptop",   type: "access_point" },
            { id: "sales_tablet",  label: "Sales-Tablet",   type: "access_point" },
          ]
        },
        {
          id: "acc_vlan20", label: "HR-SW",
          x: 700, y: 620,
          devices: [
            { id: "hr_pc1",     label: "HR-PC1",     type: "access_point" },
            { id: "hr_printer", label: "HR-Printer",  type: "server" },
            { id: "hr_ap",      label: "HR-AP",       type: "wireless_ap" },
            { id: "hr_laptop",  label: "HR-Laptop",   type: "access_point" },
            { id: "hr_tablet",  label: "HR-Tablet",   type: "access_point" },
          ]
        }
      ]
    },
    {
      floor: 2,
      vlans: [
        {
          id: "acc_vlan30", label: "Finance-SW",
          x: 1100, y: 620,
          devices: [
            { id: "fin_pc1",        label: "Finance-PC1",       type: "access_point" },
            { id: "fin_printer",    label: "Finance-Printer",    type: "server" },
            { id: "fin_ap",         label: "Finance-AP",         type: "wireless_ap" },
            { id: "fin_laptop",     label: "Finance-Laptop",     type: "access_point" },
            { id: "fin_tablet",     label: "Finance-Tablet",     type: "access_point" },
          ]
        },
        {
          id: "acc_vlan40", label: "Admin-SW",
          x: 1500, y: 620,
          devices: [
            { id: "adm_pc1",     label: "Admin-PC1",     type: "access_point" },
            { id: "adm_printer", label: "Admin-Printer",  type: "server" },
            { id: "adm_ap",      label: "Admin-AP",       type: "wireless_ap" },
            { id: "adm_laptop",  label: "Admin-Laptop",   type: "access_point" },
            { id: "adm_tablet",  label: "Admin-Tablet",   type: "access_point" },
          ]
        }
      ]
    },
    {
      floor: 3,
      vlans: [
        {
          id: "acc_vlan50", label: "ICT-SW",
          x: 1900, y: 620,
          devices: [
            { id: "ict_pc1",    label: "ICT-PC1",    type: "access_point" },
            { id: "ict_printer",label: "ICT-Printer", type: "server" },
            { id: "ict_ap",     label: "ICT-AP",      type: "wireless_ap" },
            { id: "ict_laptop", label: "ICT-Laptop",  type: "access_point" },
            { id: "ict_tablet", label: "ICT-Tablet",  type: "access_point" },
          ]
        },
        {
          id: "acc_vlan80", label: "ServerRoom-SW",
          x: 2300, y: 620,
          devices: [
            { id: "srv_dhcp",  label: "DHCP-Server",   type: "server" },
            { id: "srv_email", label: "Email-Server",   type: "server" },
            { id: "srv_pc",    label: "SysAdmin-PC",    type: "access_point" },
            { id: "srv_dns",   label: "DNS-Server",     type: "server" },
          ]
        }
      ]
    }
  ];

  for (const floor of floors) {
    for (const vlan of floor.vlans) {
      // Add the access switch
      nodes.push({ id: vlan.id, label: vlan.label, type: "floor_router", x: vlan.x, y: vlan.y, level: 2 });

      // Cisco High Availability (HA) Design: Connect EVERY access switch to BOTH Multilayer switches
      edges.push({ id: `e-msw1-${vlan.id}`, from: "mlt_sw1", to: vlan.id, latency: 5, type: "copper_crossover" });
      edges.push({ id: `e-dsw2-${vlan.id}`, from: "dist_sw2", to: vlan.id, latency: 5, type: "copper_crossover" });

      // Add devices for this VLAN
      // Sort into wired (PC, Printer, Server, AP) and wireless (Laptop, Tablet)
      const wiredDevices = vlan.devices.filter(d => !d.id.includes('laptop') && !d.id.includes('tablet'));
      const wirelessDevices = vlan.devices.filter(d => d.id.includes('laptop') || d.id.includes('tablet'));
      const apDevice = wiredDevices.find(d => d.id.includes('ap'));

      // Center the AP, put others around it
      const wiredWithoutAp = wiredDevices.filter(d => d !== apDevice);
      const arrangedWired = [];
      if (apDevice) {
         const half = Math.ceil(wiredWithoutAp.length / 2);
         arrangedWired.push(...wiredWithoutAp.slice(0, half));
         arrangedWired.push(apDevice);
         arrangedWired.push(...wiredWithoutAp.slice(half));
      } else {
         arrangedWired.push(...wiredWithoutAp);
      }

      const wiredCount = arrangedWired.length;

      if (vlan.id === "acc_vlan80") {
        // Staggered Server Room Layout (like Packet Tracer)
        vlan.devices.forEach((dev, i) => {
          let devX, devY;
          if (dev.id === "srv_dhcp") { devX = vlan.x - 80; devY = vlan.y + 120; }
          else if (dev.id === "srv_email") { devX = vlan.x + 80; devY = vlan.y + 120; }
          else if (dev.id === "srv_pc") { devX = vlan.x - 80; devY = vlan.y + 240; }
          else if (dev.id === "srv_dns") { devX = vlan.x + 80; devY = vlan.y + 240; }
          else { devX = vlan.x + (i * 80); devY = vlan.y + 120; }
          
          nodes.push({ id: dev.id, label: dev.label, type: dev.type, x: devX, y: devY, level: 3 });
          edges.push({ id: `e-${vlan.id}-${dev.id}`, from: vlan.id, to: dev.id, latency: 8, type: "copper_straight" });
          destinationIds.push(dev.id);
        });
      } else {
        arrangedWired.forEach((dev, i) => {
          const devX = vlan.x + (i - (wiredCount - 1) / 2) * 110;
          const devY = vlan.y + 120; // Wired devices sit below switch
          nodes.push({ id: dev.id, label: dev.label, type: dev.type, x: devX, y: devY, level: 3 });
          edges.push({ id: `e-${vlan.id}-${dev.id}`, from: vlan.id, to: dev.id, latency: 8, type: "copper_straight" });
          destinationIds.push(dev.id);
        });
      }

      if (wirelessDevices.length > 0) {
        // Find the X coordinate of the AP we just placed, or use center if none
        const apX = apDevice ? (vlan.x + (arrangedWired.indexOf(apDevice) - (wiredCount - 1) / 2) * 110) : vlan.x;
        const apY = vlan.y + 120;

        const wlCount = wirelessDevices.length;
        wirelessDevices.forEach((dev, i) => {
          const devX = apX + (i - (wlCount - 1) / 2) * 100;
          const devY = apY + 120; // Wireless devices sit below AP
          nodes.push({ id: dev.id, label: dev.label, type: dev.type, x: devX, y: devY, level: 4 });
          edges.push({ id: `e-${apDevice ? apDevice.id : vlan.id}-${dev.id}`, from: apDevice ? apDevice.id : vlan.id, to: dev.id, latency: 12, type: "wireless" });
          destinationIds.push(dev.id);
        });
      }
    }
  }

  const graph: ScenarioGraph = {
    nodes,
    edges,
    sourceId: "isp1",
    destinationIds,
    width: W,
    height: H
  };

  const outPath = path.join(__dirname, "..", "data", "network.companybusiness.ts");
  const fileContent = `// Auto-generated Company Business System Network Topology
// Source: https://github.com/Mehedi-Hasan-Rabbi/Company-Business-System-Network-Design
// 3-Tier Cisco Architecture: Core (ISP + Routers) -> Distribution (Multilayer SW) -> Access (VLAN Switches) -> End Devices
import type { ScenarioGraph } from "../types";

export const companyBusinessNetworkGraph: ScenarioGraph = ${JSON.stringify(graph, null, 2)};
`;

  fs.writeFileSync(outPath, fileContent, "utf8");
  console.log("✅ COMPANY BUSINESS NETWORK GENERATED!");
  console.log(`   Nodes: ${nodes.length} | Edges: ${edges.length} | Exits (Devices): ${destinationIds.length}`);
}

generateCompanyBusinessNetwork();
