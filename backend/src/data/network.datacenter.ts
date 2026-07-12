// Auto-generated k-ary Fat-Tree Topology (k=8)
import type { ScenarioGraph } from "../types";

export const datacenterNetworkGraph: ScenarioGraph = {
  "nodes": [
    {
      "id": "core-0",
      "label": "Core-0",
      "type": "datacenter",
      "x": 94.11764705882354,
      "y": 150,
      "level": 0
    },
    {
      "id": "core-1",
      "label": "Core-1",
      "type": "datacenter",
      "x": 188.23529411764707,
      "y": 150,
      "level": 0
    },
    {
      "id": "core-2",
      "label": "Core-2",
      "type": "datacenter",
      "x": 282.3529411764706,
      "y": 150,
      "level": 0
    },
    {
      "id": "core-3",
      "label": "Core-3",
      "type": "datacenter",
      "x": 376.47058823529414,
      "y": 150,
      "level": 0
    },
    {
      "id": "core-4",
      "label": "Core-4",
      "type": "datacenter",
      "x": 470.5882352941177,
      "y": 150,
      "level": 0
    },
    {
      "id": "core-5",
      "label": "Core-5",
      "type": "datacenter",
      "x": 564.7058823529412,
      "y": 150,
      "level": 0
    },
    {
      "id": "core-6",
      "label": "Core-6",
      "type": "datacenter",
      "x": 658.8235294117648,
      "y": 150,
      "level": 0
    },
    {
      "id": "core-7",
      "label": "Core-7",
      "type": "datacenter",
      "x": 752.9411764705883,
      "y": 150,
      "level": 0
    },
    {
      "id": "core-8",
      "label": "Core-8",
      "type": "datacenter",
      "x": 847.0588235294118,
      "y": 150,
      "level": 0
    },
    {
      "id": "core-9",
      "label": "Core-9",
      "type": "datacenter",
      "x": 941.1764705882354,
      "y": 150,
      "level": 0
    },
    {
      "id": "core-10",
      "label": "Core-10",
      "type": "datacenter",
      "x": 1035.294117647059,
      "y": 150,
      "level": 0
    },
    {
      "id": "core-11",
      "label": "Core-11",
      "type": "datacenter",
      "x": 1129.4117647058824,
      "y": 150,
      "level": 0
    },
    {
      "id": "core-12",
      "label": "Core-12",
      "type": "datacenter",
      "x": 1223.5294117647059,
      "y": 150,
      "level": 0
    },
    {
      "id": "core-13",
      "label": "Core-13",
      "type": "datacenter",
      "x": 1317.6470588235295,
      "y": 150,
      "level": 0
    },
    {
      "id": "core-14",
      "label": "Core-14",
      "type": "datacenter",
      "x": 1411.7647058823532,
      "y": 150,
      "level": 0
    },
    {
      "id": "core-15",
      "label": "Core-15",
      "type": "datacenter",
      "x": 1505.8823529411766,
      "y": 150,
      "level": 0
    },
    {
      "id": "pod0-agg0",
      "label": "Agg-0-0",
      "type": "building_router",
      "x": 40,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod0-agg1",
      "label": "Agg-0-1",
      "type": "building_router",
      "x": 80,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod0-agg2",
      "label": "Agg-0-2",
      "type": "building_router",
      "x": 120,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod0-agg3",
      "label": "Agg-0-3",
      "type": "building_router",
      "x": 160,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod0-edge0",
      "label": "Edge-0-0",
      "type": "floor_router",
      "x": 40,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod0-edge0-host0",
      "label": "Host-0-0-0",
      "type": "server",
      "x": 10,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod0-edge0-host1",
      "label": "Host-0-0-1",
      "type": "server",
      "x": 30,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod0-edge0-host2",
      "label": "Host-0-0-2",
      "type": "server",
      "x": 50,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod0-edge0-host3",
      "label": "Host-0-0-3",
      "type": "server",
      "x": 70,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod0-edge1",
      "label": "Edge-0-1",
      "type": "floor_router",
      "x": 80,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod0-edge1-host0",
      "label": "Host-0-1-0",
      "type": "server",
      "x": 50,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod0-edge1-host1",
      "label": "Host-0-1-1",
      "type": "server",
      "x": 70,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod0-edge1-host2",
      "label": "Host-0-1-2",
      "type": "server",
      "x": 90,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod0-edge1-host3",
      "label": "Host-0-1-3",
      "type": "server",
      "x": 110,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod0-edge2",
      "label": "Edge-0-2",
      "type": "floor_router",
      "x": 120,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod0-edge2-host0",
      "label": "Host-0-2-0",
      "type": "server",
      "x": 90,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod0-edge2-host1",
      "label": "Host-0-2-1",
      "type": "server",
      "x": 110,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod0-edge2-host2",
      "label": "Host-0-2-2",
      "type": "server",
      "x": 130,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod0-edge2-host3",
      "label": "Host-0-2-3",
      "type": "server",
      "x": 150,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod0-edge3",
      "label": "Edge-0-3",
      "type": "floor_router",
      "x": 160,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod0-edge3-host0",
      "label": "Host-0-3-0",
      "type": "server",
      "x": 130,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod0-edge3-host1",
      "label": "Host-0-3-1",
      "type": "server",
      "x": 150,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod0-edge3-host2",
      "label": "Host-0-3-2",
      "type": "server",
      "x": 170,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod0-edge3-host3",
      "label": "Host-0-3-3",
      "type": "server",
      "x": 190,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod1-agg0",
      "label": "Agg-1-0",
      "type": "building_router",
      "x": 240,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod1-agg1",
      "label": "Agg-1-1",
      "type": "building_router",
      "x": 280,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod1-agg2",
      "label": "Agg-1-2",
      "type": "building_router",
      "x": 320,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod1-agg3",
      "label": "Agg-1-3",
      "type": "building_router",
      "x": 360,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod1-edge0",
      "label": "Edge-1-0",
      "type": "floor_router",
      "x": 240,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod1-edge0-host0",
      "label": "Host-1-0-0",
      "type": "server",
      "x": 210,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod1-edge0-host1",
      "label": "Host-1-0-1",
      "type": "server",
      "x": 230,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod1-edge0-host2",
      "label": "Host-1-0-2",
      "type": "server",
      "x": 250,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod1-edge0-host3",
      "label": "Host-1-0-3",
      "type": "server",
      "x": 270,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod1-edge1",
      "label": "Edge-1-1",
      "type": "floor_router",
      "x": 280,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod1-edge1-host0",
      "label": "Host-1-1-0",
      "type": "server",
      "x": 250,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod1-edge1-host1",
      "label": "Host-1-1-1",
      "type": "server",
      "x": 270,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod1-edge1-host2",
      "label": "Host-1-1-2",
      "type": "server",
      "x": 290,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod1-edge1-host3",
      "label": "Host-1-1-3",
      "type": "server",
      "x": 310,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod1-edge2",
      "label": "Edge-1-2",
      "type": "floor_router",
      "x": 320,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod1-edge2-host0",
      "label": "Host-1-2-0",
      "type": "server",
      "x": 290,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod1-edge2-host1",
      "label": "Host-1-2-1",
      "type": "server",
      "x": 310,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod1-edge2-host2",
      "label": "Host-1-2-2",
      "type": "server",
      "x": 330,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod1-edge2-host3",
      "label": "Host-1-2-3",
      "type": "server",
      "x": 350,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod1-edge3",
      "label": "Edge-1-3",
      "type": "floor_router",
      "x": 360,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod1-edge3-host0",
      "label": "Host-1-3-0",
      "type": "server",
      "x": 330,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod1-edge3-host1",
      "label": "Host-1-3-1",
      "type": "server",
      "x": 350,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod1-edge3-host2",
      "label": "Host-1-3-2",
      "type": "server",
      "x": 370,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod1-edge3-host3",
      "label": "Host-1-3-3",
      "type": "server",
      "x": 390,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod2-agg0",
      "label": "Agg-2-0",
      "type": "building_router",
      "x": 440,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod2-agg1",
      "label": "Agg-2-1",
      "type": "building_router",
      "x": 480,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod2-agg2",
      "label": "Agg-2-2",
      "type": "building_router",
      "x": 520,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod2-agg3",
      "label": "Agg-2-3",
      "type": "building_router",
      "x": 560,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod2-edge0",
      "label": "Edge-2-0",
      "type": "floor_router",
      "x": 440,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod2-edge0-host0",
      "label": "Host-2-0-0",
      "type": "server",
      "x": 410,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod2-edge0-host1",
      "label": "Host-2-0-1",
      "type": "server",
      "x": 430,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod2-edge0-host2",
      "label": "Host-2-0-2",
      "type": "server",
      "x": 450,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod2-edge0-host3",
      "label": "Host-2-0-3",
      "type": "server",
      "x": 470,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod2-edge1",
      "label": "Edge-2-1",
      "type": "floor_router",
      "x": 480,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod2-edge1-host0",
      "label": "Host-2-1-0",
      "type": "server",
      "x": 450,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod2-edge1-host1",
      "label": "Host-2-1-1",
      "type": "server",
      "x": 470,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod2-edge1-host2",
      "label": "Host-2-1-2",
      "type": "server",
      "x": 490,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod2-edge1-host3",
      "label": "Host-2-1-3",
      "type": "server",
      "x": 510,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod2-edge2",
      "label": "Edge-2-2",
      "type": "floor_router",
      "x": 520,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod2-edge2-host0",
      "label": "Host-2-2-0",
      "type": "server",
      "x": 490,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod2-edge2-host1",
      "label": "Host-2-2-1",
      "type": "server",
      "x": 510,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod2-edge2-host2",
      "label": "Host-2-2-2",
      "type": "server",
      "x": 530,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod2-edge2-host3",
      "label": "Host-2-2-3",
      "type": "server",
      "x": 550,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod2-edge3",
      "label": "Edge-2-3",
      "type": "floor_router",
      "x": 560,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod2-edge3-host0",
      "label": "Host-2-3-0",
      "type": "server",
      "x": 530,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod2-edge3-host1",
      "label": "Host-2-3-1",
      "type": "server",
      "x": 550,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod2-edge3-host2",
      "label": "Host-2-3-2",
      "type": "server",
      "x": 570,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod2-edge3-host3",
      "label": "Host-2-3-3",
      "type": "server",
      "x": 590,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod3-agg0",
      "label": "Agg-3-0",
      "type": "building_router",
      "x": 640,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod3-agg1",
      "label": "Agg-3-1",
      "type": "building_router",
      "x": 680,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod3-agg2",
      "label": "Agg-3-2",
      "type": "building_router",
      "x": 720,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod3-agg3",
      "label": "Agg-3-3",
      "type": "building_router",
      "x": 760,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod3-edge0",
      "label": "Edge-3-0",
      "type": "floor_router",
      "x": 640,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod3-edge0-host0",
      "label": "Host-3-0-0",
      "type": "server",
      "x": 610,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod3-edge0-host1",
      "label": "Host-3-0-1",
      "type": "server",
      "x": 630,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod3-edge0-host2",
      "label": "Host-3-0-2",
      "type": "server",
      "x": 650,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod3-edge0-host3",
      "label": "Host-3-0-3",
      "type": "server",
      "x": 670,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod3-edge1",
      "label": "Edge-3-1",
      "type": "floor_router",
      "x": 680,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod3-edge1-host0",
      "label": "Host-3-1-0",
      "type": "server",
      "x": 650,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod3-edge1-host1",
      "label": "Host-3-1-1",
      "type": "server",
      "x": 670,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod3-edge1-host2",
      "label": "Host-3-1-2",
      "type": "server",
      "x": 690,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod3-edge1-host3",
      "label": "Host-3-1-3",
      "type": "server",
      "x": 710,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod3-edge2",
      "label": "Edge-3-2",
      "type": "floor_router",
      "x": 720,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod3-edge2-host0",
      "label": "Host-3-2-0",
      "type": "server",
      "x": 690,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod3-edge2-host1",
      "label": "Host-3-2-1",
      "type": "server",
      "x": 710,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod3-edge2-host2",
      "label": "Host-3-2-2",
      "type": "server",
      "x": 730,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod3-edge2-host3",
      "label": "Host-3-2-3",
      "type": "server",
      "x": 750,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod3-edge3",
      "label": "Edge-3-3",
      "type": "floor_router",
      "x": 760,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod3-edge3-host0",
      "label": "Host-3-3-0",
      "type": "server",
      "x": 730,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod3-edge3-host1",
      "label": "Host-3-3-1",
      "type": "server",
      "x": 750,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod3-edge3-host2",
      "label": "Host-3-3-2",
      "type": "server",
      "x": 770,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod3-edge3-host3",
      "label": "Host-3-3-3",
      "type": "server",
      "x": 790,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod4-agg0",
      "label": "Agg-4-0",
      "type": "building_router",
      "x": 840,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod4-agg1",
      "label": "Agg-4-1",
      "type": "building_router",
      "x": 880,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod4-agg2",
      "label": "Agg-4-2",
      "type": "building_router",
      "x": 920,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod4-agg3",
      "label": "Agg-4-3",
      "type": "building_router",
      "x": 960,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod4-edge0",
      "label": "Edge-4-0",
      "type": "floor_router",
      "x": 840,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod4-edge0-host0",
      "label": "Host-4-0-0",
      "type": "server",
      "x": 810,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod4-edge0-host1",
      "label": "Host-4-0-1",
      "type": "server",
      "x": 830,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod4-edge0-host2",
      "label": "Host-4-0-2",
      "type": "server",
      "x": 850,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod4-edge0-host3",
      "label": "Host-4-0-3",
      "type": "server",
      "x": 870,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod4-edge1",
      "label": "Edge-4-1",
      "type": "floor_router",
      "x": 880,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod4-edge1-host0",
      "label": "Host-4-1-0",
      "type": "server",
      "x": 850,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod4-edge1-host1",
      "label": "Host-4-1-1",
      "type": "server",
      "x": 870,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod4-edge1-host2",
      "label": "Host-4-1-2",
      "type": "server",
      "x": 890,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod4-edge1-host3",
      "label": "Host-4-1-3",
      "type": "server",
      "x": 910,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod4-edge2",
      "label": "Edge-4-2",
      "type": "floor_router",
      "x": 920,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod4-edge2-host0",
      "label": "Host-4-2-0",
      "type": "server",
      "x": 890,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod4-edge2-host1",
      "label": "Host-4-2-1",
      "type": "server",
      "x": 910,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod4-edge2-host2",
      "label": "Host-4-2-2",
      "type": "server",
      "x": 930,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod4-edge2-host3",
      "label": "Host-4-2-3",
      "type": "server",
      "x": 950,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod4-edge3",
      "label": "Edge-4-3",
      "type": "floor_router",
      "x": 960,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod4-edge3-host0",
      "label": "Host-4-3-0",
      "type": "server",
      "x": 930,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod4-edge3-host1",
      "label": "Host-4-3-1",
      "type": "server",
      "x": 950,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod4-edge3-host2",
      "label": "Host-4-3-2",
      "type": "server",
      "x": 970,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod4-edge3-host3",
      "label": "Host-4-3-3",
      "type": "server",
      "x": 990,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod5-agg0",
      "label": "Agg-5-0",
      "type": "building_router",
      "x": 1040,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod5-agg1",
      "label": "Agg-5-1",
      "type": "building_router",
      "x": 1080,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod5-agg2",
      "label": "Agg-5-2",
      "type": "building_router",
      "x": 1120,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod5-agg3",
      "label": "Agg-5-3",
      "type": "building_router",
      "x": 1160,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod5-edge0",
      "label": "Edge-5-0",
      "type": "floor_router",
      "x": 1040,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod5-edge0-host0",
      "label": "Host-5-0-0",
      "type": "server",
      "x": 1010,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod5-edge0-host1",
      "label": "Host-5-0-1",
      "type": "server",
      "x": 1030,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod5-edge0-host2",
      "label": "Host-5-0-2",
      "type": "server",
      "x": 1050,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod5-edge0-host3",
      "label": "Host-5-0-3",
      "type": "server",
      "x": 1070,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod5-edge1",
      "label": "Edge-5-1",
      "type": "floor_router",
      "x": 1080,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod5-edge1-host0",
      "label": "Host-5-1-0",
      "type": "server",
      "x": 1050,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod5-edge1-host1",
      "label": "Host-5-1-1",
      "type": "server",
      "x": 1070,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod5-edge1-host2",
      "label": "Host-5-1-2",
      "type": "server",
      "x": 1090,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod5-edge1-host3",
      "label": "Host-5-1-3",
      "type": "server",
      "x": 1110,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod5-edge2",
      "label": "Edge-5-2",
      "type": "floor_router",
      "x": 1120,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod5-edge2-host0",
      "label": "Host-5-2-0",
      "type": "server",
      "x": 1090,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod5-edge2-host1",
      "label": "Host-5-2-1",
      "type": "server",
      "x": 1110,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod5-edge2-host2",
      "label": "Host-5-2-2",
      "type": "server",
      "x": 1130,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod5-edge2-host3",
      "label": "Host-5-2-3",
      "type": "server",
      "x": 1150,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod5-edge3",
      "label": "Edge-5-3",
      "type": "floor_router",
      "x": 1160,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod5-edge3-host0",
      "label": "Host-5-3-0",
      "type": "server",
      "x": 1130,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod5-edge3-host1",
      "label": "Host-5-3-1",
      "type": "server",
      "x": 1150,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod5-edge3-host2",
      "label": "Host-5-3-2",
      "type": "server",
      "x": 1170,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod5-edge3-host3",
      "label": "Host-5-3-3",
      "type": "server",
      "x": 1190,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod6-agg0",
      "label": "Agg-6-0",
      "type": "building_router",
      "x": 1240,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod6-agg1",
      "label": "Agg-6-1",
      "type": "building_router",
      "x": 1280,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod6-agg2",
      "label": "Agg-6-2",
      "type": "building_router",
      "x": 1320,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod6-agg3",
      "label": "Agg-6-3",
      "type": "building_router",
      "x": 1360,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod6-edge0",
      "label": "Edge-6-0",
      "type": "floor_router",
      "x": 1240,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod6-edge0-host0",
      "label": "Host-6-0-0",
      "type": "server",
      "x": 1210,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod6-edge0-host1",
      "label": "Host-6-0-1",
      "type": "server",
      "x": 1230,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod6-edge0-host2",
      "label": "Host-6-0-2",
      "type": "server",
      "x": 1250,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod6-edge0-host3",
      "label": "Host-6-0-3",
      "type": "server",
      "x": 1270,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod6-edge1",
      "label": "Edge-6-1",
      "type": "floor_router",
      "x": 1280,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod6-edge1-host0",
      "label": "Host-6-1-0",
      "type": "server",
      "x": 1250,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod6-edge1-host1",
      "label": "Host-6-1-1",
      "type": "server",
      "x": 1270,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod6-edge1-host2",
      "label": "Host-6-1-2",
      "type": "server",
      "x": 1290,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod6-edge1-host3",
      "label": "Host-6-1-3",
      "type": "server",
      "x": 1310,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod6-edge2",
      "label": "Edge-6-2",
      "type": "floor_router",
      "x": 1320,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod6-edge2-host0",
      "label": "Host-6-2-0",
      "type": "server",
      "x": 1290,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod6-edge2-host1",
      "label": "Host-6-2-1",
      "type": "server",
      "x": 1310,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod6-edge2-host2",
      "label": "Host-6-2-2",
      "type": "server",
      "x": 1330,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod6-edge2-host3",
      "label": "Host-6-2-3",
      "type": "server",
      "x": 1350,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod6-edge3",
      "label": "Edge-6-3",
      "type": "floor_router",
      "x": 1360,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod6-edge3-host0",
      "label": "Host-6-3-0",
      "type": "server",
      "x": 1330,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod6-edge3-host1",
      "label": "Host-6-3-1",
      "type": "server",
      "x": 1350,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod6-edge3-host2",
      "label": "Host-6-3-2",
      "type": "server",
      "x": 1370,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod6-edge3-host3",
      "label": "Host-6-3-3",
      "type": "server",
      "x": 1390,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod7-agg0",
      "label": "Agg-7-0",
      "type": "building_router",
      "x": 1440,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod7-agg1",
      "label": "Agg-7-1",
      "type": "building_router",
      "x": 1480,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod7-agg2",
      "label": "Agg-7-2",
      "type": "building_router",
      "x": 1520,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod7-agg3",
      "label": "Agg-7-3",
      "type": "building_router",
      "x": 1560,
      "y": 350,
      "level": 1
    },
    {
      "id": "pod7-edge0",
      "label": "Edge-7-0",
      "type": "floor_router",
      "x": 1440,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod7-edge0-host0",
      "label": "Host-7-0-0",
      "type": "server",
      "x": 1410,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod7-edge0-host1",
      "label": "Host-7-0-1",
      "type": "server",
      "x": 1430,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod7-edge0-host2",
      "label": "Host-7-0-2",
      "type": "server",
      "x": 1450,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod7-edge0-host3",
      "label": "Host-7-0-3",
      "type": "server",
      "x": 1470,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod7-edge1",
      "label": "Edge-7-1",
      "type": "floor_router",
      "x": 1480,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod7-edge1-host0",
      "label": "Host-7-1-0",
      "type": "server",
      "x": 1450,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod7-edge1-host1",
      "label": "Host-7-1-1",
      "type": "server",
      "x": 1470,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod7-edge1-host2",
      "label": "Host-7-1-2",
      "type": "server",
      "x": 1490,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod7-edge1-host3",
      "label": "Host-7-1-3",
      "type": "server",
      "x": 1510,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod7-edge2",
      "label": "Edge-7-2",
      "type": "floor_router",
      "x": 1520,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod7-edge2-host0",
      "label": "Host-7-2-0",
      "type": "server",
      "x": 1490,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod7-edge2-host1",
      "label": "Host-7-2-1",
      "type": "server",
      "x": 1510,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod7-edge2-host2",
      "label": "Host-7-2-2",
      "type": "server",
      "x": 1530,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod7-edge2-host3",
      "label": "Host-7-2-3",
      "type": "server",
      "x": 1550,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod7-edge3",
      "label": "Edge-7-3",
      "type": "floor_router",
      "x": 1560,
      "y": 550,
      "level": 2
    },
    {
      "id": "pod7-edge3-host0",
      "label": "Host-7-3-0",
      "type": "server",
      "x": 1530,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod7-edge3-host1",
      "label": "Host-7-3-1",
      "type": "server",
      "x": 1550,
      "y": 800,
      "level": 3
    },
    {
      "id": "pod7-edge3-host2",
      "label": "Host-7-3-2",
      "type": "server",
      "x": 1570,
      "y": 750,
      "level": 3
    },
    {
      "id": "pod7-edge3-host3",
      "label": "Host-7-3-3",
      "type": "server",
      "x": 1590,
      "y": 800,
      "level": 3
    }
  ],
  "edges": [
    {
      "id": "e-pod0-agg0-core0",
      "from": "pod0-agg0",
      "to": "core-0",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod0-agg0-core1",
      "from": "pod0-agg0",
      "to": "core-1",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod0-agg0-core2",
      "from": "pod0-agg0",
      "to": "core-2",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod0-agg0-core3",
      "from": "pod0-agg0",
      "to": "core-3",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod0-agg1-core4",
      "from": "pod0-agg1",
      "to": "core-4",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod0-agg1-core5",
      "from": "pod0-agg1",
      "to": "core-5",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod0-agg1-core6",
      "from": "pod0-agg1",
      "to": "core-6",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod0-agg1-core7",
      "from": "pod0-agg1",
      "to": "core-7",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod0-agg2-core8",
      "from": "pod0-agg2",
      "to": "core-8",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod0-agg2-core9",
      "from": "pod0-agg2",
      "to": "core-9",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod0-agg2-core10",
      "from": "pod0-agg2",
      "to": "core-10",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod0-agg2-core11",
      "from": "pod0-agg2",
      "to": "core-11",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod0-agg3-core12",
      "from": "pod0-agg3",
      "to": "core-12",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod0-agg3-core13",
      "from": "pod0-agg3",
      "to": "core-13",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod0-agg3-core14",
      "from": "pod0-agg3",
      "to": "core-14",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod0-agg3-core15",
      "from": "pod0-agg3",
      "to": "core-15",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge0-pod0-agg0",
      "from": "pod0-edge0",
      "to": "pod0-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge0-pod0-agg1",
      "from": "pod0-edge0",
      "to": "pod0-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge0-pod0-agg2",
      "from": "pod0-edge0",
      "to": "pod0-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge0-pod0-agg3",
      "from": "pod0-edge0",
      "to": "pod0-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge0-host0-pod0-edge0",
      "from": "pod0-edge0-host0",
      "to": "pod0-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod0-edge0-host1-pod0-edge0",
      "from": "pod0-edge0-host1",
      "to": "pod0-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod0-edge0-host2-pod0-edge0",
      "from": "pod0-edge0-host2",
      "to": "pod0-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod0-edge0-host3-pod0-edge0",
      "from": "pod0-edge0-host3",
      "to": "pod0-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod0-edge1-pod0-agg0",
      "from": "pod0-edge1",
      "to": "pod0-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge1-pod0-agg1",
      "from": "pod0-edge1",
      "to": "pod0-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge1-pod0-agg2",
      "from": "pod0-edge1",
      "to": "pod0-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge1-pod0-agg3",
      "from": "pod0-edge1",
      "to": "pod0-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge1-host0-pod0-edge1",
      "from": "pod0-edge1-host0",
      "to": "pod0-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod0-edge1-host1-pod0-edge1",
      "from": "pod0-edge1-host1",
      "to": "pod0-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod0-edge1-host2-pod0-edge1",
      "from": "pod0-edge1-host2",
      "to": "pod0-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod0-edge1-host3-pod0-edge1",
      "from": "pod0-edge1-host3",
      "to": "pod0-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod0-edge2-pod0-agg0",
      "from": "pod0-edge2",
      "to": "pod0-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge2-pod0-agg1",
      "from": "pod0-edge2",
      "to": "pod0-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge2-pod0-agg2",
      "from": "pod0-edge2",
      "to": "pod0-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge2-pod0-agg3",
      "from": "pod0-edge2",
      "to": "pod0-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge2-host0-pod0-edge2",
      "from": "pod0-edge2-host0",
      "to": "pod0-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod0-edge2-host1-pod0-edge2",
      "from": "pod0-edge2-host1",
      "to": "pod0-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod0-edge2-host2-pod0-edge2",
      "from": "pod0-edge2-host2",
      "to": "pod0-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod0-edge2-host3-pod0-edge2",
      "from": "pod0-edge2-host3",
      "to": "pod0-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod0-edge3-pod0-agg0",
      "from": "pod0-edge3",
      "to": "pod0-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge3-pod0-agg1",
      "from": "pod0-edge3",
      "to": "pod0-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge3-pod0-agg2",
      "from": "pod0-edge3",
      "to": "pod0-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge3-pod0-agg3",
      "from": "pod0-edge3",
      "to": "pod0-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod0-edge3-host0-pod0-edge3",
      "from": "pod0-edge3-host0",
      "to": "pod0-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod0-edge3-host1-pod0-edge3",
      "from": "pod0-edge3-host1",
      "to": "pod0-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod0-edge3-host2-pod0-edge3",
      "from": "pod0-edge3-host2",
      "to": "pod0-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod0-edge3-host3-pod0-edge3",
      "from": "pod0-edge3-host3",
      "to": "pod0-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod1-agg0-core0",
      "from": "pod1-agg0",
      "to": "core-0",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod1-agg0-core1",
      "from": "pod1-agg0",
      "to": "core-1",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod1-agg0-core2",
      "from": "pod1-agg0",
      "to": "core-2",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod1-agg0-core3",
      "from": "pod1-agg0",
      "to": "core-3",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod1-agg1-core4",
      "from": "pod1-agg1",
      "to": "core-4",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod1-agg1-core5",
      "from": "pod1-agg1",
      "to": "core-5",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod1-agg1-core6",
      "from": "pod1-agg1",
      "to": "core-6",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod1-agg1-core7",
      "from": "pod1-agg1",
      "to": "core-7",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod1-agg2-core8",
      "from": "pod1-agg2",
      "to": "core-8",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod1-agg2-core9",
      "from": "pod1-agg2",
      "to": "core-9",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod1-agg2-core10",
      "from": "pod1-agg2",
      "to": "core-10",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod1-agg2-core11",
      "from": "pod1-agg2",
      "to": "core-11",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod1-agg3-core12",
      "from": "pod1-agg3",
      "to": "core-12",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod1-agg3-core13",
      "from": "pod1-agg3",
      "to": "core-13",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod1-agg3-core14",
      "from": "pod1-agg3",
      "to": "core-14",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod1-agg3-core15",
      "from": "pod1-agg3",
      "to": "core-15",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge0-pod1-agg0",
      "from": "pod1-edge0",
      "to": "pod1-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge0-pod1-agg1",
      "from": "pod1-edge0",
      "to": "pod1-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge0-pod1-agg2",
      "from": "pod1-edge0",
      "to": "pod1-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge0-pod1-agg3",
      "from": "pod1-edge0",
      "to": "pod1-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge0-host0-pod1-edge0",
      "from": "pod1-edge0-host0",
      "to": "pod1-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod1-edge0-host1-pod1-edge0",
      "from": "pod1-edge0-host1",
      "to": "pod1-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod1-edge0-host2-pod1-edge0",
      "from": "pod1-edge0-host2",
      "to": "pod1-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod1-edge0-host3-pod1-edge0",
      "from": "pod1-edge0-host3",
      "to": "pod1-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod1-edge1-pod1-agg0",
      "from": "pod1-edge1",
      "to": "pod1-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge1-pod1-agg1",
      "from": "pod1-edge1",
      "to": "pod1-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge1-pod1-agg2",
      "from": "pod1-edge1",
      "to": "pod1-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge1-pod1-agg3",
      "from": "pod1-edge1",
      "to": "pod1-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge1-host0-pod1-edge1",
      "from": "pod1-edge1-host0",
      "to": "pod1-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod1-edge1-host1-pod1-edge1",
      "from": "pod1-edge1-host1",
      "to": "pod1-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod1-edge1-host2-pod1-edge1",
      "from": "pod1-edge1-host2",
      "to": "pod1-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod1-edge1-host3-pod1-edge1",
      "from": "pod1-edge1-host3",
      "to": "pod1-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod1-edge2-pod1-agg0",
      "from": "pod1-edge2",
      "to": "pod1-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge2-pod1-agg1",
      "from": "pod1-edge2",
      "to": "pod1-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge2-pod1-agg2",
      "from": "pod1-edge2",
      "to": "pod1-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge2-pod1-agg3",
      "from": "pod1-edge2",
      "to": "pod1-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge2-host0-pod1-edge2",
      "from": "pod1-edge2-host0",
      "to": "pod1-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod1-edge2-host1-pod1-edge2",
      "from": "pod1-edge2-host1",
      "to": "pod1-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod1-edge2-host2-pod1-edge2",
      "from": "pod1-edge2-host2",
      "to": "pod1-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod1-edge2-host3-pod1-edge2",
      "from": "pod1-edge2-host3",
      "to": "pod1-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod1-edge3-pod1-agg0",
      "from": "pod1-edge3",
      "to": "pod1-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge3-pod1-agg1",
      "from": "pod1-edge3",
      "to": "pod1-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge3-pod1-agg2",
      "from": "pod1-edge3",
      "to": "pod1-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge3-pod1-agg3",
      "from": "pod1-edge3",
      "to": "pod1-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod1-edge3-host0-pod1-edge3",
      "from": "pod1-edge3-host0",
      "to": "pod1-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod1-edge3-host1-pod1-edge3",
      "from": "pod1-edge3-host1",
      "to": "pod1-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod1-edge3-host2-pod1-edge3",
      "from": "pod1-edge3-host2",
      "to": "pod1-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod1-edge3-host3-pod1-edge3",
      "from": "pod1-edge3-host3",
      "to": "pod1-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod2-agg0-core0",
      "from": "pod2-agg0",
      "to": "core-0",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod2-agg0-core1",
      "from": "pod2-agg0",
      "to": "core-1",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod2-agg0-core2",
      "from": "pod2-agg0",
      "to": "core-2",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod2-agg0-core3",
      "from": "pod2-agg0",
      "to": "core-3",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod2-agg1-core4",
      "from": "pod2-agg1",
      "to": "core-4",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod2-agg1-core5",
      "from": "pod2-agg1",
      "to": "core-5",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod2-agg1-core6",
      "from": "pod2-agg1",
      "to": "core-6",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod2-agg1-core7",
      "from": "pod2-agg1",
      "to": "core-7",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod2-agg2-core8",
      "from": "pod2-agg2",
      "to": "core-8",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod2-agg2-core9",
      "from": "pod2-agg2",
      "to": "core-9",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod2-agg2-core10",
      "from": "pod2-agg2",
      "to": "core-10",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod2-agg2-core11",
      "from": "pod2-agg2",
      "to": "core-11",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod2-agg3-core12",
      "from": "pod2-agg3",
      "to": "core-12",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod2-agg3-core13",
      "from": "pod2-agg3",
      "to": "core-13",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod2-agg3-core14",
      "from": "pod2-agg3",
      "to": "core-14",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod2-agg3-core15",
      "from": "pod2-agg3",
      "to": "core-15",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge0-pod2-agg0",
      "from": "pod2-edge0",
      "to": "pod2-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge0-pod2-agg1",
      "from": "pod2-edge0",
      "to": "pod2-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge0-pod2-agg2",
      "from": "pod2-edge0",
      "to": "pod2-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge0-pod2-agg3",
      "from": "pod2-edge0",
      "to": "pod2-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge0-host0-pod2-edge0",
      "from": "pod2-edge0-host0",
      "to": "pod2-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod2-edge0-host1-pod2-edge0",
      "from": "pod2-edge0-host1",
      "to": "pod2-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod2-edge0-host2-pod2-edge0",
      "from": "pod2-edge0-host2",
      "to": "pod2-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod2-edge0-host3-pod2-edge0",
      "from": "pod2-edge0-host3",
      "to": "pod2-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod2-edge1-pod2-agg0",
      "from": "pod2-edge1",
      "to": "pod2-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge1-pod2-agg1",
      "from": "pod2-edge1",
      "to": "pod2-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge1-pod2-agg2",
      "from": "pod2-edge1",
      "to": "pod2-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge1-pod2-agg3",
      "from": "pod2-edge1",
      "to": "pod2-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge1-host0-pod2-edge1",
      "from": "pod2-edge1-host0",
      "to": "pod2-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod2-edge1-host1-pod2-edge1",
      "from": "pod2-edge1-host1",
      "to": "pod2-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod2-edge1-host2-pod2-edge1",
      "from": "pod2-edge1-host2",
      "to": "pod2-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod2-edge1-host3-pod2-edge1",
      "from": "pod2-edge1-host3",
      "to": "pod2-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod2-edge2-pod2-agg0",
      "from": "pod2-edge2",
      "to": "pod2-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge2-pod2-agg1",
      "from": "pod2-edge2",
      "to": "pod2-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge2-pod2-agg2",
      "from": "pod2-edge2",
      "to": "pod2-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge2-pod2-agg3",
      "from": "pod2-edge2",
      "to": "pod2-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge2-host0-pod2-edge2",
      "from": "pod2-edge2-host0",
      "to": "pod2-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod2-edge2-host1-pod2-edge2",
      "from": "pod2-edge2-host1",
      "to": "pod2-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod2-edge2-host2-pod2-edge2",
      "from": "pod2-edge2-host2",
      "to": "pod2-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod2-edge2-host3-pod2-edge2",
      "from": "pod2-edge2-host3",
      "to": "pod2-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod2-edge3-pod2-agg0",
      "from": "pod2-edge3",
      "to": "pod2-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge3-pod2-agg1",
      "from": "pod2-edge3",
      "to": "pod2-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge3-pod2-agg2",
      "from": "pod2-edge3",
      "to": "pod2-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge3-pod2-agg3",
      "from": "pod2-edge3",
      "to": "pod2-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod2-edge3-host0-pod2-edge3",
      "from": "pod2-edge3-host0",
      "to": "pod2-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod2-edge3-host1-pod2-edge3",
      "from": "pod2-edge3-host1",
      "to": "pod2-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod2-edge3-host2-pod2-edge3",
      "from": "pod2-edge3-host2",
      "to": "pod2-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod2-edge3-host3-pod2-edge3",
      "from": "pod2-edge3-host3",
      "to": "pod2-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod3-agg0-core0",
      "from": "pod3-agg0",
      "to": "core-0",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod3-agg0-core1",
      "from": "pod3-agg0",
      "to": "core-1",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod3-agg0-core2",
      "from": "pod3-agg0",
      "to": "core-2",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod3-agg0-core3",
      "from": "pod3-agg0",
      "to": "core-3",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod3-agg1-core4",
      "from": "pod3-agg1",
      "to": "core-4",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod3-agg1-core5",
      "from": "pod3-agg1",
      "to": "core-5",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod3-agg1-core6",
      "from": "pod3-agg1",
      "to": "core-6",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod3-agg1-core7",
      "from": "pod3-agg1",
      "to": "core-7",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod3-agg2-core8",
      "from": "pod3-agg2",
      "to": "core-8",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod3-agg2-core9",
      "from": "pod3-agg2",
      "to": "core-9",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod3-agg2-core10",
      "from": "pod3-agg2",
      "to": "core-10",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod3-agg2-core11",
      "from": "pod3-agg2",
      "to": "core-11",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod3-agg3-core12",
      "from": "pod3-agg3",
      "to": "core-12",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod3-agg3-core13",
      "from": "pod3-agg3",
      "to": "core-13",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod3-agg3-core14",
      "from": "pod3-agg3",
      "to": "core-14",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod3-agg3-core15",
      "from": "pod3-agg3",
      "to": "core-15",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge0-pod3-agg0",
      "from": "pod3-edge0",
      "to": "pod3-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge0-pod3-agg1",
      "from": "pod3-edge0",
      "to": "pod3-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge0-pod3-agg2",
      "from": "pod3-edge0",
      "to": "pod3-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge0-pod3-agg3",
      "from": "pod3-edge0",
      "to": "pod3-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge0-host0-pod3-edge0",
      "from": "pod3-edge0-host0",
      "to": "pod3-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod3-edge0-host1-pod3-edge0",
      "from": "pod3-edge0-host1",
      "to": "pod3-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod3-edge0-host2-pod3-edge0",
      "from": "pod3-edge0-host2",
      "to": "pod3-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod3-edge0-host3-pod3-edge0",
      "from": "pod3-edge0-host3",
      "to": "pod3-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod3-edge1-pod3-agg0",
      "from": "pod3-edge1",
      "to": "pod3-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge1-pod3-agg1",
      "from": "pod3-edge1",
      "to": "pod3-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge1-pod3-agg2",
      "from": "pod3-edge1",
      "to": "pod3-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge1-pod3-agg3",
      "from": "pod3-edge1",
      "to": "pod3-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge1-host0-pod3-edge1",
      "from": "pod3-edge1-host0",
      "to": "pod3-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod3-edge1-host1-pod3-edge1",
      "from": "pod3-edge1-host1",
      "to": "pod3-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod3-edge1-host2-pod3-edge1",
      "from": "pod3-edge1-host2",
      "to": "pod3-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod3-edge1-host3-pod3-edge1",
      "from": "pod3-edge1-host3",
      "to": "pod3-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod3-edge2-pod3-agg0",
      "from": "pod3-edge2",
      "to": "pod3-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge2-pod3-agg1",
      "from": "pod3-edge2",
      "to": "pod3-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge2-pod3-agg2",
      "from": "pod3-edge2",
      "to": "pod3-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge2-pod3-agg3",
      "from": "pod3-edge2",
      "to": "pod3-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge2-host0-pod3-edge2",
      "from": "pod3-edge2-host0",
      "to": "pod3-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod3-edge2-host1-pod3-edge2",
      "from": "pod3-edge2-host1",
      "to": "pod3-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod3-edge2-host2-pod3-edge2",
      "from": "pod3-edge2-host2",
      "to": "pod3-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod3-edge2-host3-pod3-edge2",
      "from": "pod3-edge2-host3",
      "to": "pod3-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod3-edge3-pod3-agg0",
      "from": "pod3-edge3",
      "to": "pod3-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge3-pod3-agg1",
      "from": "pod3-edge3",
      "to": "pod3-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge3-pod3-agg2",
      "from": "pod3-edge3",
      "to": "pod3-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge3-pod3-agg3",
      "from": "pod3-edge3",
      "to": "pod3-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod3-edge3-host0-pod3-edge3",
      "from": "pod3-edge3-host0",
      "to": "pod3-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod3-edge3-host1-pod3-edge3",
      "from": "pod3-edge3-host1",
      "to": "pod3-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod3-edge3-host2-pod3-edge3",
      "from": "pod3-edge3-host2",
      "to": "pod3-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod3-edge3-host3-pod3-edge3",
      "from": "pod3-edge3-host3",
      "to": "pod3-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod4-agg0-core0",
      "from": "pod4-agg0",
      "to": "core-0",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod4-agg0-core1",
      "from": "pod4-agg0",
      "to": "core-1",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod4-agg0-core2",
      "from": "pod4-agg0",
      "to": "core-2",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod4-agg0-core3",
      "from": "pod4-agg0",
      "to": "core-3",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod4-agg1-core4",
      "from": "pod4-agg1",
      "to": "core-4",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod4-agg1-core5",
      "from": "pod4-agg1",
      "to": "core-5",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod4-agg1-core6",
      "from": "pod4-agg1",
      "to": "core-6",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod4-agg1-core7",
      "from": "pod4-agg1",
      "to": "core-7",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod4-agg2-core8",
      "from": "pod4-agg2",
      "to": "core-8",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod4-agg2-core9",
      "from": "pod4-agg2",
      "to": "core-9",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod4-agg2-core10",
      "from": "pod4-agg2",
      "to": "core-10",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod4-agg2-core11",
      "from": "pod4-agg2",
      "to": "core-11",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod4-agg3-core12",
      "from": "pod4-agg3",
      "to": "core-12",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod4-agg3-core13",
      "from": "pod4-agg3",
      "to": "core-13",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod4-agg3-core14",
      "from": "pod4-agg3",
      "to": "core-14",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod4-agg3-core15",
      "from": "pod4-agg3",
      "to": "core-15",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge0-pod4-agg0",
      "from": "pod4-edge0",
      "to": "pod4-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge0-pod4-agg1",
      "from": "pod4-edge0",
      "to": "pod4-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge0-pod4-agg2",
      "from": "pod4-edge0",
      "to": "pod4-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge0-pod4-agg3",
      "from": "pod4-edge0",
      "to": "pod4-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge0-host0-pod4-edge0",
      "from": "pod4-edge0-host0",
      "to": "pod4-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod4-edge0-host1-pod4-edge0",
      "from": "pod4-edge0-host1",
      "to": "pod4-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod4-edge0-host2-pod4-edge0",
      "from": "pod4-edge0-host2",
      "to": "pod4-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod4-edge0-host3-pod4-edge0",
      "from": "pod4-edge0-host3",
      "to": "pod4-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod4-edge1-pod4-agg0",
      "from": "pod4-edge1",
      "to": "pod4-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge1-pod4-agg1",
      "from": "pod4-edge1",
      "to": "pod4-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge1-pod4-agg2",
      "from": "pod4-edge1",
      "to": "pod4-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge1-pod4-agg3",
      "from": "pod4-edge1",
      "to": "pod4-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge1-host0-pod4-edge1",
      "from": "pod4-edge1-host0",
      "to": "pod4-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod4-edge1-host1-pod4-edge1",
      "from": "pod4-edge1-host1",
      "to": "pod4-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod4-edge1-host2-pod4-edge1",
      "from": "pod4-edge1-host2",
      "to": "pod4-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod4-edge1-host3-pod4-edge1",
      "from": "pod4-edge1-host3",
      "to": "pod4-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod4-edge2-pod4-agg0",
      "from": "pod4-edge2",
      "to": "pod4-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge2-pod4-agg1",
      "from": "pod4-edge2",
      "to": "pod4-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge2-pod4-agg2",
      "from": "pod4-edge2",
      "to": "pod4-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge2-pod4-agg3",
      "from": "pod4-edge2",
      "to": "pod4-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge2-host0-pod4-edge2",
      "from": "pod4-edge2-host0",
      "to": "pod4-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod4-edge2-host1-pod4-edge2",
      "from": "pod4-edge2-host1",
      "to": "pod4-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod4-edge2-host2-pod4-edge2",
      "from": "pod4-edge2-host2",
      "to": "pod4-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod4-edge2-host3-pod4-edge2",
      "from": "pod4-edge2-host3",
      "to": "pod4-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod4-edge3-pod4-agg0",
      "from": "pod4-edge3",
      "to": "pod4-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge3-pod4-agg1",
      "from": "pod4-edge3",
      "to": "pod4-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge3-pod4-agg2",
      "from": "pod4-edge3",
      "to": "pod4-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge3-pod4-agg3",
      "from": "pod4-edge3",
      "to": "pod4-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod4-edge3-host0-pod4-edge3",
      "from": "pod4-edge3-host0",
      "to": "pod4-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod4-edge3-host1-pod4-edge3",
      "from": "pod4-edge3-host1",
      "to": "pod4-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod4-edge3-host2-pod4-edge3",
      "from": "pod4-edge3-host2",
      "to": "pod4-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod4-edge3-host3-pod4-edge3",
      "from": "pod4-edge3-host3",
      "to": "pod4-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod5-agg0-core0",
      "from": "pod5-agg0",
      "to": "core-0",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod5-agg0-core1",
      "from": "pod5-agg0",
      "to": "core-1",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod5-agg0-core2",
      "from": "pod5-agg0",
      "to": "core-2",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod5-agg0-core3",
      "from": "pod5-agg0",
      "to": "core-3",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod5-agg1-core4",
      "from": "pod5-agg1",
      "to": "core-4",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod5-agg1-core5",
      "from": "pod5-agg1",
      "to": "core-5",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod5-agg1-core6",
      "from": "pod5-agg1",
      "to": "core-6",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod5-agg1-core7",
      "from": "pod5-agg1",
      "to": "core-7",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod5-agg2-core8",
      "from": "pod5-agg2",
      "to": "core-8",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod5-agg2-core9",
      "from": "pod5-agg2",
      "to": "core-9",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod5-agg2-core10",
      "from": "pod5-agg2",
      "to": "core-10",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod5-agg2-core11",
      "from": "pod5-agg2",
      "to": "core-11",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod5-agg3-core12",
      "from": "pod5-agg3",
      "to": "core-12",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod5-agg3-core13",
      "from": "pod5-agg3",
      "to": "core-13",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod5-agg3-core14",
      "from": "pod5-agg3",
      "to": "core-14",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod5-agg3-core15",
      "from": "pod5-agg3",
      "to": "core-15",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge0-pod5-agg0",
      "from": "pod5-edge0",
      "to": "pod5-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge0-pod5-agg1",
      "from": "pod5-edge0",
      "to": "pod5-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge0-pod5-agg2",
      "from": "pod5-edge0",
      "to": "pod5-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge0-pod5-agg3",
      "from": "pod5-edge0",
      "to": "pod5-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge0-host0-pod5-edge0",
      "from": "pod5-edge0-host0",
      "to": "pod5-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod5-edge0-host1-pod5-edge0",
      "from": "pod5-edge0-host1",
      "to": "pod5-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod5-edge0-host2-pod5-edge0",
      "from": "pod5-edge0-host2",
      "to": "pod5-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod5-edge0-host3-pod5-edge0",
      "from": "pod5-edge0-host3",
      "to": "pod5-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod5-edge1-pod5-agg0",
      "from": "pod5-edge1",
      "to": "pod5-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge1-pod5-agg1",
      "from": "pod5-edge1",
      "to": "pod5-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge1-pod5-agg2",
      "from": "pod5-edge1",
      "to": "pod5-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge1-pod5-agg3",
      "from": "pod5-edge1",
      "to": "pod5-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge1-host0-pod5-edge1",
      "from": "pod5-edge1-host0",
      "to": "pod5-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod5-edge1-host1-pod5-edge1",
      "from": "pod5-edge1-host1",
      "to": "pod5-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod5-edge1-host2-pod5-edge1",
      "from": "pod5-edge1-host2",
      "to": "pod5-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod5-edge1-host3-pod5-edge1",
      "from": "pod5-edge1-host3",
      "to": "pod5-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod5-edge2-pod5-agg0",
      "from": "pod5-edge2",
      "to": "pod5-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge2-pod5-agg1",
      "from": "pod5-edge2",
      "to": "pod5-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge2-pod5-agg2",
      "from": "pod5-edge2",
      "to": "pod5-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge2-pod5-agg3",
      "from": "pod5-edge2",
      "to": "pod5-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge2-host0-pod5-edge2",
      "from": "pod5-edge2-host0",
      "to": "pod5-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod5-edge2-host1-pod5-edge2",
      "from": "pod5-edge2-host1",
      "to": "pod5-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod5-edge2-host2-pod5-edge2",
      "from": "pod5-edge2-host2",
      "to": "pod5-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod5-edge2-host3-pod5-edge2",
      "from": "pod5-edge2-host3",
      "to": "pod5-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod5-edge3-pod5-agg0",
      "from": "pod5-edge3",
      "to": "pod5-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge3-pod5-agg1",
      "from": "pod5-edge3",
      "to": "pod5-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge3-pod5-agg2",
      "from": "pod5-edge3",
      "to": "pod5-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge3-pod5-agg3",
      "from": "pod5-edge3",
      "to": "pod5-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod5-edge3-host0-pod5-edge3",
      "from": "pod5-edge3-host0",
      "to": "pod5-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod5-edge3-host1-pod5-edge3",
      "from": "pod5-edge3-host1",
      "to": "pod5-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod5-edge3-host2-pod5-edge3",
      "from": "pod5-edge3-host2",
      "to": "pod5-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod5-edge3-host3-pod5-edge3",
      "from": "pod5-edge3-host3",
      "to": "pod5-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod6-agg0-core0",
      "from": "pod6-agg0",
      "to": "core-0",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod6-agg0-core1",
      "from": "pod6-agg0",
      "to": "core-1",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod6-agg0-core2",
      "from": "pod6-agg0",
      "to": "core-2",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod6-agg0-core3",
      "from": "pod6-agg0",
      "to": "core-3",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod6-agg1-core4",
      "from": "pod6-agg1",
      "to": "core-4",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod6-agg1-core5",
      "from": "pod6-agg1",
      "to": "core-5",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod6-agg1-core6",
      "from": "pod6-agg1",
      "to": "core-6",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod6-agg1-core7",
      "from": "pod6-agg1",
      "to": "core-7",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod6-agg2-core8",
      "from": "pod6-agg2",
      "to": "core-8",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod6-agg2-core9",
      "from": "pod6-agg2",
      "to": "core-9",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod6-agg2-core10",
      "from": "pod6-agg2",
      "to": "core-10",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod6-agg2-core11",
      "from": "pod6-agg2",
      "to": "core-11",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod6-agg3-core12",
      "from": "pod6-agg3",
      "to": "core-12",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod6-agg3-core13",
      "from": "pod6-agg3",
      "to": "core-13",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod6-agg3-core14",
      "from": "pod6-agg3",
      "to": "core-14",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod6-agg3-core15",
      "from": "pod6-agg3",
      "to": "core-15",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge0-pod6-agg0",
      "from": "pod6-edge0",
      "to": "pod6-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge0-pod6-agg1",
      "from": "pod6-edge0",
      "to": "pod6-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge0-pod6-agg2",
      "from": "pod6-edge0",
      "to": "pod6-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge0-pod6-agg3",
      "from": "pod6-edge0",
      "to": "pod6-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge0-host0-pod6-edge0",
      "from": "pod6-edge0-host0",
      "to": "pod6-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod6-edge0-host1-pod6-edge0",
      "from": "pod6-edge0-host1",
      "to": "pod6-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod6-edge0-host2-pod6-edge0",
      "from": "pod6-edge0-host2",
      "to": "pod6-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod6-edge0-host3-pod6-edge0",
      "from": "pod6-edge0-host3",
      "to": "pod6-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod6-edge1-pod6-agg0",
      "from": "pod6-edge1",
      "to": "pod6-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge1-pod6-agg1",
      "from": "pod6-edge1",
      "to": "pod6-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge1-pod6-agg2",
      "from": "pod6-edge1",
      "to": "pod6-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge1-pod6-agg3",
      "from": "pod6-edge1",
      "to": "pod6-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge1-host0-pod6-edge1",
      "from": "pod6-edge1-host0",
      "to": "pod6-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod6-edge1-host1-pod6-edge1",
      "from": "pod6-edge1-host1",
      "to": "pod6-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod6-edge1-host2-pod6-edge1",
      "from": "pod6-edge1-host2",
      "to": "pod6-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod6-edge1-host3-pod6-edge1",
      "from": "pod6-edge1-host3",
      "to": "pod6-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod6-edge2-pod6-agg0",
      "from": "pod6-edge2",
      "to": "pod6-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge2-pod6-agg1",
      "from": "pod6-edge2",
      "to": "pod6-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge2-pod6-agg2",
      "from": "pod6-edge2",
      "to": "pod6-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge2-pod6-agg3",
      "from": "pod6-edge2",
      "to": "pod6-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge2-host0-pod6-edge2",
      "from": "pod6-edge2-host0",
      "to": "pod6-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod6-edge2-host1-pod6-edge2",
      "from": "pod6-edge2-host1",
      "to": "pod6-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod6-edge2-host2-pod6-edge2",
      "from": "pod6-edge2-host2",
      "to": "pod6-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod6-edge2-host3-pod6-edge2",
      "from": "pod6-edge2-host3",
      "to": "pod6-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod6-edge3-pod6-agg0",
      "from": "pod6-edge3",
      "to": "pod6-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge3-pod6-agg1",
      "from": "pod6-edge3",
      "to": "pod6-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge3-pod6-agg2",
      "from": "pod6-edge3",
      "to": "pod6-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge3-pod6-agg3",
      "from": "pod6-edge3",
      "to": "pod6-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod6-edge3-host0-pod6-edge3",
      "from": "pod6-edge3-host0",
      "to": "pod6-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod6-edge3-host1-pod6-edge3",
      "from": "pod6-edge3-host1",
      "to": "pod6-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod6-edge3-host2-pod6-edge3",
      "from": "pod6-edge3-host2",
      "to": "pod6-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod6-edge3-host3-pod6-edge3",
      "from": "pod6-edge3-host3",
      "to": "pod6-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod7-agg0-core0",
      "from": "pod7-agg0",
      "to": "core-0",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod7-agg0-core1",
      "from": "pod7-agg0",
      "to": "core-1",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod7-agg0-core2",
      "from": "pod7-agg0",
      "to": "core-2",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod7-agg0-core3",
      "from": "pod7-agg0",
      "to": "core-3",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod7-agg1-core4",
      "from": "pod7-agg1",
      "to": "core-4",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod7-agg1-core5",
      "from": "pod7-agg1",
      "to": "core-5",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod7-agg1-core6",
      "from": "pod7-agg1",
      "to": "core-6",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod7-agg1-core7",
      "from": "pod7-agg1",
      "to": "core-7",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod7-agg2-core8",
      "from": "pod7-agg2",
      "to": "core-8",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod7-agg2-core9",
      "from": "pod7-agg2",
      "to": "core-9",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod7-agg2-core10",
      "from": "pod7-agg2",
      "to": "core-10",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod7-agg2-core11",
      "from": "pod7-agg2",
      "to": "core-11",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod7-agg3-core12",
      "from": "pod7-agg3",
      "to": "core-12",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod7-agg3-core13",
      "from": "pod7-agg3",
      "to": "core-13",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod7-agg3-core14",
      "from": "pod7-agg3",
      "to": "core-14",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod7-agg3-core15",
      "from": "pod7-agg3",
      "to": "core-15",
      "latency": 2,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge0-pod7-agg0",
      "from": "pod7-edge0",
      "to": "pod7-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge0-pod7-agg1",
      "from": "pod7-edge0",
      "to": "pod7-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge0-pod7-agg2",
      "from": "pod7-edge0",
      "to": "pod7-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge0-pod7-agg3",
      "from": "pod7-edge0",
      "to": "pod7-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge0-host0-pod7-edge0",
      "from": "pod7-edge0-host0",
      "to": "pod7-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod7-edge0-host1-pod7-edge0",
      "from": "pod7-edge0-host1",
      "to": "pod7-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod7-edge0-host2-pod7-edge0",
      "from": "pod7-edge0-host2",
      "to": "pod7-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod7-edge0-host3-pod7-edge0",
      "from": "pod7-edge0-host3",
      "to": "pod7-edge0",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod7-edge1-pod7-agg0",
      "from": "pod7-edge1",
      "to": "pod7-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge1-pod7-agg1",
      "from": "pod7-edge1",
      "to": "pod7-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge1-pod7-agg2",
      "from": "pod7-edge1",
      "to": "pod7-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge1-pod7-agg3",
      "from": "pod7-edge1",
      "to": "pod7-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge1-host0-pod7-edge1",
      "from": "pod7-edge1-host0",
      "to": "pod7-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod7-edge1-host1-pod7-edge1",
      "from": "pod7-edge1-host1",
      "to": "pod7-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod7-edge1-host2-pod7-edge1",
      "from": "pod7-edge1-host2",
      "to": "pod7-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod7-edge1-host3-pod7-edge1",
      "from": "pod7-edge1-host3",
      "to": "pod7-edge1",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod7-edge2-pod7-agg0",
      "from": "pod7-edge2",
      "to": "pod7-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge2-pod7-agg1",
      "from": "pod7-edge2",
      "to": "pod7-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge2-pod7-agg2",
      "from": "pod7-edge2",
      "to": "pod7-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge2-pod7-agg3",
      "from": "pod7-edge2",
      "to": "pod7-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge2-host0-pod7-edge2",
      "from": "pod7-edge2-host0",
      "to": "pod7-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod7-edge2-host1-pod7-edge2",
      "from": "pod7-edge2-host1",
      "to": "pod7-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod7-edge2-host2-pod7-edge2",
      "from": "pod7-edge2-host2",
      "to": "pod7-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod7-edge2-host3-pod7-edge2",
      "from": "pod7-edge2-host3",
      "to": "pod7-edge2",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod7-edge3-pod7-agg0",
      "from": "pod7-edge3",
      "to": "pod7-agg0",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge3-pod7-agg1",
      "from": "pod7-edge3",
      "to": "pod7-agg1",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge3-pod7-agg2",
      "from": "pod7-edge3",
      "to": "pod7-agg2",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge3-pod7-agg3",
      "from": "pod7-edge3",
      "to": "pod7-agg3",
      "latency": 5,
      "type": "fiber"
    },
    {
      "id": "e-pod7-edge3-host0-pod7-edge3",
      "from": "pod7-edge3-host0",
      "to": "pod7-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod7-edge3-host1-pod7-edge3",
      "from": "pod7-edge3-host1",
      "to": "pod7-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod7-edge3-host2-pod7-edge3",
      "from": "pod7-edge3-host2",
      "to": "pod7-edge3",
      "latency": 10,
      "type": "copper"
    },
    {
      "id": "e-pod7-edge3-host3-pod7-edge3",
      "from": "pod7-edge3-host3",
      "to": "pod7-edge3",
      "latency": 10,
      "type": "copper"
    }
  ],
  "sourceId": "core-0",
  "destinationIds": [
    "pod0-edge0-host0",
    "pod0-edge0-host1",
    "pod0-edge0-host2",
    "pod0-edge0-host3",
    "pod0-edge1-host0",
    "pod0-edge1-host1",
    "pod0-edge1-host2",
    "pod0-edge1-host3",
    "pod0-edge2-host0",
    "pod0-edge2-host1",
    "pod0-edge2-host2",
    "pod0-edge2-host3",
    "pod0-edge3-host0",
    "pod0-edge3-host1",
    "pod0-edge3-host2",
    "pod0-edge3-host3",
    "pod1-edge0-host0",
    "pod1-edge0-host1",
    "pod1-edge0-host2",
    "pod1-edge0-host3",
    "pod1-edge1-host0",
    "pod1-edge1-host1",
    "pod1-edge1-host2",
    "pod1-edge1-host3",
    "pod1-edge2-host0",
    "pod1-edge2-host1",
    "pod1-edge2-host2",
    "pod1-edge2-host3",
    "pod1-edge3-host0",
    "pod1-edge3-host1",
    "pod1-edge3-host2",
    "pod1-edge3-host3",
    "pod2-edge0-host0",
    "pod2-edge0-host1",
    "pod2-edge0-host2",
    "pod2-edge0-host3",
    "pod2-edge1-host0",
    "pod2-edge1-host1",
    "pod2-edge1-host2",
    "pod2-edge1-host3",
    "pod2-edge2-host0",
    "pod2-edge2-host1",
    "pod2-edge2-host2",
    "pod2-edge2-host3",
    "pod2-edge3-host0",
    "pod2-edge3-host1",
    "pod2-edge3-host2",
    "pod2-edge3-host3",
    "pod3-edge0-host0",
    "pod3-edge0-host1",
    "pod3-edge0-host2",
    "pod3-edge0-host3",
    "pod3-edge1-host0",
    "pod3-edge1-host1",
    "pod3-edge1-host2",
    "pod3-edge1-host3",
    "pod3-edge2-host0",
    "pod3-edge2-host1",
    "pod3-edge2-host2",
    "pod3-edge2-host3",
    "pod3-edge3-host0",
    "pod3-edge3-host1",
    "pod3-edge3-host2",
    "pod3-edge3-host3",
    "pod4-edge0-host0",
    "pod4-edge0-host1",
    "pod4-edge0-host2",
    "pod4-edge0-host3",
    "pod4-edge1-host0",
    "pod4-edge1-host1",
    "pod4-edge1-host2",
    "pod4-edge1-host3",
    "pod4-edge2-host0",
    "pod4-edge2-host1",
    "pod4-edge2-host2",
    "pod4-edge2-host3",
    "pod4-edge3-host0",
    "pod4-edge3-host1",
    "pod4-edge3-host2",
    "pod4-edge3-host3",
    "pod5-edge0-host0",
    "pod5-edge0-host1",
    "pod5-edge0-host2",
    "pod5-edge0-host3",
    "pod5-edge1-host0",
    "pod5-edge1-host1",
    "pod5-edge1-host2",
    "pod5-edge1-host3",
    "pod5-edge2-host0",
    "pod5-edge2-host1",
    "pod5-edge2-host2",
    "pod5-edge2-host3",
    "pod5-edge3-host0",
    "pod5-edge3-host1",
    "pod5-edge3-host2",
    "pod5-edge3-host3",
    "pod6-edge0-host0",
    "pod6-edge0-host1",
    "pod6-edge0-host2",
    "pod6-edge0-host3",
    "pod6-edge1-host0",
    "pod6-edge1-host1",
    "pod6-edge1-host2",
    "pod6-edge1-host3",
    "pod6-edge2-host0",
    "pod6-edge2-host1",
    "pod6-edge2-host2",
    "pod6-edge2-host3",
    "pod6-edge3-host0",
    "pod6-edge3-host1",
    "pod6-edge3-host2",
    "pod6-edge3-host3",
    "pod7-edge0-host0",
    "pod7-edge0-host1",
    "pod7-edge0-host2",
    "pod7-edge0-host3",
    "pod7-edge1-host0",
    "pod7-edge1-host1",
    "pod7-edge1-host2",
    "pod7-edge1-host3",
    "pod7-edge2-host0",
    "pod7-edge2-host1",
    "pod7-edge2-host2",
    "pod7-edge2-host3",
    "pod7-edge3-host0",
    "pod7-edge3-host1",
    "pod7-edge3-host2",
    "pod7-edge3-host3"
  ],
  "width": 1600,
  "height": 1200
};
