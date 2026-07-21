// Auto-generated Company Business System Network Topology
// Source: https://github.com/Mehedi-Hasan-Rabbi/Company-Business-System-Network-Design
// 3-Tier Cisco Architecture: Core (ISP + Routers) -> Distribution (Multilayer SW) -> Access (VLAN Switches) -> End Devices
import type { ScenarioGraph } from "../types";

export const companyBusinessNetworkGraph: ScenarioGraph = {
  "nodes": [
    {
      "id": "isp1",
      "label": "ISP-1",
      "type": "datacenter",
      "x": 900,
      "y": 80,
      "level": 0
    },
    {
      "id": "isp2",
      "label": "ISP-2",
      "type": "datacenter",
      "x": 1700,
      "y": 80,
      "level": 0
    },
    {
      "id": "core_r1",
      "label": "CORE-R1",
      "type": "building_router",
      "x": 1000,
      "y": 220,
      "level": 0
    },
    {
      "id": "core_r2",
      "label": "CORE-R2",
      "type": "building_router",
      "x": 1600,
      "y": 220,
      "level": 0
    },
    {
      "id": "mlt_sw1",
      "label": "Mlt-SW1",
      "type": "floor_router",
      "x": 1000,
      "y": 400,
      "level": 1
    },
    {
      "id": "dist_sw2",
      "label": "DIST-SW2",
      "type": "floor_router",
      "x": 1600,
      "y": 400,
      "level": 1
    },
    {
      "id": "acc_vlan10",
      "label": "Sales-SW",
      "type": "floor_router",
      "x": 300,
      "y": 620,
      "level": 2
    },
    {
      "id": "sales_pc1",
      "label": "Sales-PC1",
      "type": "access_point",
      "x": 190,
      "y": 740,
      "level": 3
    },
    {
      "id": "sales_ap",
      "label": "Sales-AP",
      "type": "wireless_ap",
      "x": 300,
      "y": 740,
      "level": 3
    },
    {
      "id": "sales_printer",
      "label": "Sales-Printer",
      "type": "server",
      "x": 410,
      "y": 740,
      "level": 3
    },
    {
      "id": "sales_laptop",
      "label": "Sales-Laptop",
      "type": "access_point",
      "x": 250,
      "y": 860,
      "level": 4
    },
    {
      "id": "sales_tablet",
      "label": "Sales-Tablet",
      "type": "access_point",
      "x": 350,
      "y": 860,
      "level": 4
    },
    {
      "id": "acc_vlan20",
      "label": "HR-SW",
      "type": "floor_router",
      "x": 700,
      "y": 620,
      "level": 2
    },
    {
      "id": "hr_pc1",
      "label": "HR-PC1",
      "type": "access_point",
      "x": 590,
      "y": 740,
      "level": 3
    },
    {
      "id": "hr_ap",
      "label": "HR-AP",
      "type": "wireless_ap",
      "x": 700,
      "y": 740,
      "level": 3
    },
    {
      "id": "hr_printer",
      "label": "HR-Printer",
      "type": "server",
      "x": 810,
      "y": 740,
      "level": 3
    },
    {
      "id": "hr_laptop",
      "label": "HR-Laptop",
      "type": "access_point",
      "x": 650,
      "y": 860,
      "level": 4
    },
    {
      "id": "hr_tablet",
      "label": "HR-Tablet",
      "type": "access_point",
      "x": 750,
      "y": 860,
      "level": 4
    },
    {
      "id": "acc_vlan30",
      "label": "Finance-SW",
      "type": "floor_router",
      "x": 1100,
      "y": 620,
      "level": 2
    },
    {
      "id": "fin_pc1",
      "label": "Finance-PC1",
      "type": "access_point",
      "x": 990,
      "y": 740,
      "level": 3
    },
    {
      "id": "fin_ap",
      "label": "Finance-AP",
      "type": "wireless_ap",
      "x": 1100,
      "y": 740,
      "level": 3
    },
    {
      "id": "fin_printer",
      "label": "Finance-Printer",
      "type": "server",
      "x": 1210,
      "y": 740,
      "level": 3
    },
    {
      "id": "fin_laptop",
      "label": "Finance-Laptop",
      "type": "access_point",
      "x": 1050,
      "y": 860,
      "level": 4
    },
    {
      "id": "fin_tablet",
      "label": "Finance-Tablet",
      "type": "access_point",
      "x": 1150,
      "y": 860,
      "level": 4
    },
    {
      "id": "acc_vlan40",
      "label": "Admin-SW",
      "type": "floor_router",
      "x": 1500,
      "y": 620,
      "level": 2
    },
    {
      "id": "adm_pc1",
      "label": "Admin-PC1",
      "type": "access_point",
      "x": 1390,
      "y": 740,
      "level": 3
    },
    {
      "id": "adm_ap",
      "label": "Admin-AP",
      "type": "wireless_ap",
      "x": 1500,
      "y": 740,
      "level": 3
    },
    {
      "id": "adm_printer",
      "label": "Admin-Printer",
      "type": "server",
      "x": 1610,
      "y": 740,
      "level": 3
    },
    {
      "id": "adm_laptop",
      "label": "Admin-Laptop",
      "type": "access_point",
      "x": 1450,
      "y": 860,
      "level": 4
    },
    {
      "id": "adm_tablet",
      "label": "Admin-Tablet",
      "type": "access_point",
      "x": 1550,
      "y": 860,
      "level": 4
    },
    {
      "id": "acc_vlan50",
      "label": "ICT-SW",
      "type": "floor_router",
      "x": 1900,
      "y": 620,
      "level": 2
    },
    {
      "id": "ict_pc1",
      "label": "ICT-PC1",
      "type": "access_point",
      "x": 1790,
      "y": 740,
      "level": 3
    },
    {
      "id": "ict_ap",
      "label": "ICT-AP",
      "type": "wireless_ap",
      "x": 1900,
      "y": 740,
      "level": 3
    },
    {
      "id": "ict_printer",
      "label": "ICT-Printer",
      "type": "server",
      "x": 2010,
      "y": 740,
      "level": 3
    },
    {
      "id": "ict_laptop",
      "label": "ICT-Laptop",
      "type": "access_point",
      "x": 1850,
      "y": 860,
      "level": 4
    },
    {
      "id": "ict_tablet",
      "label": "ICT-Tablet",
      "type": "access_point",
      "x": 1950,
      "y": 860,
      "level": 4
    },
    {
      "id": "acc_vlan80",
      "label": "ServerRoom-SW",
      "type": "floor_router",
      "x": 2300,
      "y": 620,
      "level": 2
    },
    {
      "id": "srv_dhcp",
      "label": "DHCP-Server",
      "type": "server",
      "x": 2220,
      "y": 740,
      "level": 3
    },
    {
      "id": "srv_email",
      "label": "Email-Server",
      "type": "server",
      "x": 2380,
      "y": 740,
      "level": 3
    },
    {
      "id": "srv_pc",
      "label": "SysAdmin-PC",
      "type": "access_point",
      "x": 2220,
      "y": 860,
      "level": 3
    },
    {
      "id": "srv_dns",
      "label": "DNS-Server",
      "type": "server",
      "x": 2380,
      "y": 860,
      "level": 3
    }
  ],
  "edges": [
    {
      "id": "e-isp1-cr1",
      "from": "isp1",
      "to": "core_r1",
      "latency": 20,
      "type": "serial"
    },
    {
      "id": "e-isp1-cr2",
      "from": "isp1",
      "to": "core_r2",
      "latency": 25,
      "type": "serial"
    },
    {
      "id": "e-isp2-cr1",
      "from": "isp2",
      "to": "core_r1",
      "latency": 25,
      "type": "serial"
    },
    {
      "id": "e-isp2-cr2",
      "from": "isp2",
      "to": "core_r2",
      "latency": 20,
      "type": "serial"
    },
    {
      "id": "e-cr1-cr2",
      "from": "core_r1",
      "to": "core_r2",
      "latency": 2,
      "type": "serial"
    },
    {
      "id": "e-cr1-msw1",
      "from": "core_r1",
      "to": "mlt_sw1",
      "latency": 3,
      "type": "copper_straight"
    },
    {
      "id": "e-cr1-dsw2",
      "from": "core_r1",
      "to": "dist_sw2",
      "latency": 3,
      "type": "copper_straight"
    },
    {
      "id": "e-cr2-msw1",
      "from": "core_r2",
      "to": "mlt_sw1",
      "latency": 3,
      "type": "copper_straight"
    },
    {
      "id": "e-cr2-dsw2",
      "from": "core_r2",
      "to": "dist_sw2",
      "latency": 3,
      "type": "copper_straight"
    },
    {
      "id": "e-msw1-dsw2",
      "from": "mlt_sw1",
      "to": "dist_sw2",
      "latency": 2,
      "type": "copper_crossover"
    },
    {
      "id": "e-msw1-acc_vlan10",
      "from": "mlt_sw1",
      "to": "acc_vlan10",
      "latency": 5,
      "type": "copper_crossover"
    },
    {
      "id": "e-dsw2-acc_vlan10",
      "from": "dist_sw2",
      "to": "acc_vlan10",
      "latency": 5,
      "type": "copper_crossover"
    },
    {
      "id": "e-acc_vlan10-sales_pc1",
      "from": "acc_vlan10",
      "to": "sales_pc1",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-acc_vlan10-sales_ap",
      "from": "acc_vlan10",
      "to": "sales_ap",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-acc_vlan10-sales_printer",
      "from": "acc_vlan10",
      "to": "sales_printer",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-sales_ap-sales_laptop",
      "from": "sales_ap",
      "to": "sales_laptop",
      "latency": 12,
      "type": "wireless"
    },
    {
      "id": "e-sales_ap-sales_tablet",
      "from": "sales_ap",
      "to": "sales_tablet",
      "latency": 12,
      "type": "wireless"
    },
    {
      "id": "e-msw1-acc_vlan20",
      "from": "mlt_sw1",
      "to": "acc_vlan20",
      "latency": 5,
      "type": "copper_crossover"
    },
    {
      "id": "e-dsw2-acc_vlan20",
      "from": "dist_sw2",
      "to": "acc_vlan20",
      "latency": 5,
      "type": "copper_crossover"
    },
    {
      "id": "e-acc_vlan20-hr_pc1",
      "from": "acc_vlan20",
      "to": "hr_pc1",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-acc_vlan20-hr_ap",
      "from": "acc_vlan20",
      "to": "hr_ap",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-acc_vlan20-hr_printer",
      "from": "acc_vlan20",
      "to": "hr_printer",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-hr_ap-hr_laptop",
      "from": "hr_ap",
      "to": "hr_laptop",
      "latency": 12,
      "type": "wireless"
    },
    {
      "id": "e-hr_ap-hr_tablet",
      "from": "hr_ap",
      "to": "hr_tablet",
      "latency": 12,
      "type": "wireless"
    },
    {
      "id": "e-msw1-acc_vlan30",
      "from": "mlt_sw1",
      "to": "acc_vlan30",
      "latency": 5,
      "type": "copper_crossover"
    },
    {
      "id": "e-dsw2-acc_vlan30",
      "from": "dist_sw2",
      "to": "acc_vlan30",
      "latency": 5,
      "type": "copper_crossover"
    },
    {
      "id": "e-acc_vlan30-fin_pc1",
      "from": "acc_vlan30",
      "to": "fin_pc1",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-acc_vlan30-fin_ap",
      "from": "acc_vlan30",
      "to": "fin_ap",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-acc_vlan30-fin_printer",
      "from": "acc_vlan30",
      "to": "fin_printer",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-fin_ap-fin_laptop",
      "from": "fin_ap",
      "to": "fin_laptop",
      "latency": 12,
      "type": "wireless"
    },
    {
      "id": "e-fin_ap-fin_tablet",
      "from": "fin_ap",
      "to": "fin_tablet",
      "latency": 12,
      "type": "wireless"
    },
    {
      "id": "e-msw1-acc_vlan40",
      "from": "mlt_sw1",
      "to": "acc_vlan40",
      "latency": 5,
      "type": "copper_crossover"
    },
    {
      "id": "e-dsw2-acc_vlan40",
      "from": "dist_sw2",
      "to": "acc_vlan40",
      "latency": 5,
      "type": "copper_crossover"
    },
    {
      "id": "e-acc_vlan40-adm_pc1",
      "from": "acc_vlan40",
      "to": "adm_pc1",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-acc_vlan40-adm_ap",
      "from": "acc_vlan40",
      "to": "adm_ap",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-acc_vlan40-adm_printer",
      "from": "acc_vlan40",
      "to": "adm_printer",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-adm_ap-adm_laptop",
      "from": "adm_ap",
      "to": "adm_laptop",
      "latency": 12,
      "type": "wireless"
    },
    {
      "id": "e-adm_ap-adm_tablet",
      "from": "adm_ap",
      "to": "adm_tablet",
      "latency": 12,
      "type": "wireless"
    },
    {
      "id": "e-msw1-acc_vlan50",
      "from": "mlt_sw1",
      "to": "acc_vlan50",
      "latency": 5,
      "type": "copper_crossover"
    },
    {
      "id": "e-dsw2-acc_vlan50",
      "from": "dist_sw2",
      "to": "acc_vlan50",
      "latency": 5,
      "type": "copper_crossover"
    },
    {
      "id": "e-acc_vlan50-ict_pc1",
      "from": "acc_vlan50",
      "to": "ict_pc1",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-acc_vlan50-ict_ap",
      "from": "acc_vlan50",
      "to": "ict_ap",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-acc_vlan50-ict_printer",
      "from": "acc_vlan50",
      "to": "ict_printer",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-ict_ap-ict_laptop",
      "from": "ict_ap",
      "to": "ict_laptop",
      "latency": 12,
      "type": "wireless"
    },
    {
      "id": "e-ict_ap-ict_tablet",
      "from": "ict_ap",
      "to": "ict_tablet",
      "latency": 12,
      "type": "wireless"
    },
    {
      "id": "e-msw1-acc_vlan80",
      "from": "mlt_sw1",
      "to": "acc_vlan80",
      "latency": 5,
      "type": "copper_crossover"
    },
    {
      "id": "e-dsw2-acc_vlan80",
      "from": "dist_sw2",
      "to": "acc_vlan80",
      "latency": 5,
      "type": "copper_crossover"
    },
    {
      "id": "e-acc_vlan80-srv_dhcp",
      "from": "acc_vlan80",
      "to": "srv_dhcp",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-acc_vlan80-srv_email",
      "from": "acc_vlan80",
      "to": "srv_email",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-acc_vlan80-srv_pc",
      "from": "acc_vlan80",
      "to": "srv_pc",
      "latency": 8,
      "type": "copper_straight"
    },
    {
      "id": "e-acc_vlan80-srv_dns",
      "from": "acc_vlan80",
      "to": "srv_dns",
      "latency": 8,
      "type": "copper_straight"
    }
  ],
  "sourceId": "isp1",
  "destinationIds": [
    "sales_pc1",
    "sales_ap",
    "sales_printer",
    "sales_laptop",
    "sales_tablet",
    "hr_pc1",
    "hr_ap",
    "hr_printer",
    "hr_laptop",
    "hr_tablet",
    "fin_pc1",
    "fin_ap",
    "fin_printer",
    "fin_laptop",
    "fin_tablet",
    "adm_pc1",
    "adm_ap",
    "adm_printer",
    "adm_laptop",
    "adm_tablet",
    "ict_pc1",
    "ict_ap",
    "ict_printer",
    "ict_laptop",
    "ict_tablet",
    "srv_dhcp",
    "srv_email",
    "srv_pc",
    "srv_dns"
  ],
  "width": 2600,
  "height": 1300
};
