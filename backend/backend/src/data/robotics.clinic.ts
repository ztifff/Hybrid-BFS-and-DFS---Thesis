// Auto-generated from SM Rosa evacuation clinic building pattern
import type { ScenarioGraph } from "../types";

export const clinicGraph : ScenarioGraph = {
  "nodes": [
    {
      "id": "GL_spine_0",
      "label": "GL Main Spine 1",
      "type": "zone",
      "x": 9000,
      "y": 17500,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_spine_1",
      "label": "GL Main Spine 2",
      "type": "zone",
      "x": 19500,
      "y": 17500,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_spine_2",
      "label": "GL Main Spine 3",
      "type": "zone",
      "x": 30000,
      "y": 17500,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_spine_3",
      "label": "GL Main Spine 4",
      "type": "zone",
      "x": 40500,
      "y": 17500,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_spine_4",
      "label": "GL Main Spine 5",
      "type": "zone",
      "x": 51000,
      "y": 17500,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_wingN_0",
      "label": "GL North Wing 1",
      "type": "zone",
      "x": 15000,
      "y": 6300,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_wingS_0",
      "label": "GL South Wing 1",
      "type": "zone",
      "x": 15000,
      "y": 28700,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_wingN_1",
      "label": "GL North Wing 2",
      "type": "zone",
      "x": 30000,
      "y": 6300,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_wingS_1",
      "label": "GL South Wing 2",
      "type": "zone",
      "x": 30000,
      "y": 28700,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_wingN_2",
      "label": "GL North Wing 3",
      "type": "zone",
      "x": 45000,
      "y": 6300,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_wingS_2",
      "label": "GL South Wing 3",
      "type": "zone",
      "x": 45000,
      "y": 28700,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "L2_spine_0",
      "label": "L2 Main Spine 1",
      "type": "zone",
      "x": 9000,
      "y": 17500,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_spine_1",
      "label": "L2 Main Spine 2",
      "type": "zone",
      "x": 19500,
      "y": 17500,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_spine_2",
      "label": "L2 Main Spine 3",
      "type": "zone",
      "x": 30000,
      "y": 17500,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_spine_3",
      "label": "L2 Main Spine 4",
      "type": "zone",
      "x": 40500,
      "y": 17500,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_spine_4",
      "label": "L2 Main Spine 5",
      "type": "zone",
      "x": 51000,
      "y": 17500,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_wingN_0",
      "label": "L2 North Wing 1",
      "type": "zone",
      "x": 15000,
      "y": 6300,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_wingS_0",
      "label": "L2 South Wing 1",
      "type": "zone",
      "x": 15000,
      "y": 28700,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_wingN_1",
      "label": "L2 North Wing 2",
      "type": "zone",
      "x": 30000,
      "y": 6300,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_wingS_1",
      "label": "L2 South Wing 2",
      "type": "zone",
      "x": 30000,
      "y": 28700,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_wingN_2",
      "label": "L2 North Wing 3",
      "type": "zone",
      "x": 45000,
      "y": 6300,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_wingS_2",
      "label": "L2 South Wing 3",
      "type": "zone",
      "x": 45000,
      "y": 28700,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "nurse_station_gl",
      "label": "Nurse Station (GL)",
      "type": "depot",
      "x": 30000,
      "y": 17500,
      "level": 0,
      "buildingId": "GL"
    },
    {
      "id": "nurse_station_l2",
      "label": "Nurse Station (L2)",
      "type": "depot",
      "x": 30000,
      "y": 17500,
      "level": 0,
      "buildingId": "L2"
    },
    {
      "id": "stair_1_GL",
      "label": "Stairwell 1 (GL→L2)",
      "type": "aisle",
      "x": 12000,
      "y": 17500,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "stair_1_L2",
      "label": "Stairwell 1 (L2→GL)",
      "type": "aisle",
      "x": 12000,
      "y": 17500,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "stair_2_GL",
      "label": "Stairwell 2 (GL→L2)",
      "type": "aisle",
      "x": 30000,
      "y": 17500,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "stair_2_L2",
      "label": "Stairwell 2 (L2→GL)",
      "type": "aisle",
      "x": 30000,
      "y": 17500,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "stair_3_GL",
      "label": "Stairwell 3 (GL→L2)",
      "type": "aisle",
      "x": 48000,
      "y": 17500,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "stair_3_L2",
      "label": "Stairwell 3 (L2→GL)",
      "type": "aisle",
      "x": 48000,
      "y": 17500,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "GL_N_0",
      "label": "Pharmacy",
      "type": "shelf",
      "x": 10500,
      "y": 4300,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_N_1",
      "label": "Radiology",
      "type": "shelf",
      "x": 26785.714285714286,
      "y": 3700,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_N_2",
      "label": "Lab",
      "type": "blocked",
      "x": 43071.42857142857,
      "y": 4300,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_N_3",
      "label": "Emergency Entrance",
      "type": "shelf",
      "x": 14357.142857142857,
      "y": 3700,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_N_4",
      "label": "Patient Room",
      "type": "shelf",
      "x": 30642.85714285714,
      "y": 4300,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_N_5",
      "label": "Pharmacy",
      "type": "shelf",
      "x": 46928.57142857143,
      "y": 3700,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_N_6",
      "label": "Radiology",
      "type": "blocked",
      "x": 18214.285714285714,
      "y": 4300,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_N_7",
      "label": "Lab",
      "type": "shelf",
      "x": 34500,
      "y": 3700,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_S_0",
      "label": "Pharmacy",
      "type": "shelf",
      "x": 10500,
      "y": 30700,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_S_1",
      "label": "Radiology",
      "type": "blocked",
      "x": 26785.714285714286,
      "y": 31300,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_S_2",
      "label": "Lab",
      "type": "shelf",
      "x": 43071.42857142857,
      "y": 30700,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_S_3",
      "label": "Emergency Entrance",
      "type": "shelf",
      "x": 14357.142857142857,
      "y": 31300,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_S_4",
      "label": "Patient Room",
      "type": "shelf",
      "x": 30642.85714285714,
      "y": 30700,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_S_5",
      "label": "Pharmacy",
      "type": "blocked",
      "x": 46928.57142857143,
      "y": 31300,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_S_6",
      "label": "Radiology",
      "type": "shelf",
      "x": 18214.285714285714,
      "y": 30700,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_S_7",
      "label": "Lab",
      "type": "shelf",
      "x": 34500,
      "y": 31300,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_exit_1",
      "label": "Emergency Entrance (Exit)",
      "type": "shelf",
      "x": 28800,
      "y": 31900,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "GL_exit_2",
      "label": "Emergency Entrance (Exit)",
      "type": "shelf",
      "x": 31200,
      "y": 31900,
      "level": 1,
      "buildingId": "GL"
    },
    {
      "id": "L2_N_0",
      "label": "Doctor Office",
      "type": "shelf",
      "x": 10500,
      "y": 4300,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_N_1",
      "label": "Consultation Room",
      "type": "shelf",
      "x": 26785.714285714286,
      "y": 3700,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_N_2",
      "label": "Storage",
      "type": "blocked",
      "x": 43071.42857142857,
      "y": 4300,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_N_3",
      "label": "Morgue",
      "type": "shelf",
      "x": 14357.142857142857,
      "y": 3700,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_N_4",
      "label": "Cafeteria",
      "type": "shelf",
      "x": 30642.85714285714,
      "y": 4300,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_N_5",
      "label": "Doctor Office",
      "type": "shelf",
      "x": 46928.57142857143,
      "y": 3700,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_N_6",
      "label": "Consultation Room",
      "type": "blocked",
      "x": 18214.285714285714,
      "y": 4300,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_N_7",
      "label": "Storage",
      "type": "shelf",
      "x": 34500,
      "y": 3700,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_S_0",
      "label": "Doctor Office",
      "type": "shelf",
      "x": 10500,
      "y": 30700,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_S_1",
      "label": "Consultation Room",
      "type": "blocked",
      "x": 26785.714285714286,
      "y": 31300,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_S_2",
      "label": "Storage",
      "type": "shelf",
      "x": 43071.42857142857,
      "y": 30700,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_S_3",
      "label": "Morgue",
      "type": "shelf",
      "x": 14357.142857142857,
      "y": 31300,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_S_4",
      "label": "Cafeteria",
      "type": "shelf",
      "x": 30642.85714285714,
      "y": 30700,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_S_5",
      "label": "Doctor Office",
      "type": "blocked",
      "x": 46928.57142857143,
      "y": 31300,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_S_6",
      "label": "Consultation Room",
      "type": "shelf",
      "x": 18214.285714285714,
      "y": 30700,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_S_7",
      "label": "Storage",
      "type": "shelf",
      "x": 34500,
      "y": 31300,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_exit_1",
      "label": "Emergency Exit (Exit)",
      "type": "shelf",
      "x": 28800,
      "y": 3100,
      "level": 2,
      "buildingId": "L2"
    },
    {
      "id": "L2_exit_2",
      "label": "Emergency Exit (Exit)",
      "type": "shelf",
      "x": 31200,
      "y": 3100,
      "level": 2,
      "buildingId": "L2"
    }
  ],
  "edges": [
    {
      "id": "e_GL_spine_0_GL_spine_1",
      "from": "GL_spine_0",
      "to": "GL_spine_1",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_1_GL_spine_0",
      "from": "GL_spine_1",
      "to": "GL_spine_0",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_1_GL_spine_2",
      "from": "GL_spine_1",
      "to": "GL_spine_2",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_2_GL_spine_1",
      "from": "GL_spine_2",
      "to": "GL_spine_1",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_2_GL_spine_3",
      "from": "GL_spine_2",
      "to": "GL_spine_3",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_3_GL_spine_2",
      "from": "GL_spine_3",
      "to": "GL_spine_2",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_3_GL_spine_4",
      "from": "GL_spine_3",
      "to": "GL_spine_4",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_4_GL_spine_3",
      "from": "GL_spine_4",
      "to": "GL_spine_3",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_1_GL_wingN_0",
      "from": "GL_spine_1",
      "to": "GL_wingN_0",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_wingN_0_GL_spine_1",
      "from": "GL_wingN_0",
      "to": "GL_spine_1",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_1_GL_wingS_0",
      "from": "GL_spine_1",
      "to": "GL_wingS_0",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_wingS_0_GL_spine_1",
      "from": "GL_wingS_0",
      "to": "GL_spine_1",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_2_GL_wingN_1",
      "from": "GL_spine_2",
      "to": "GL_wingN_1",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_wingN_1_GL_spine_2",
      "from": "GL_wingN_1",
      "to": "GL_spine_2",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_2_GL_wingS_1",
      "from": "GL_spine_2",
      "to": "GL_wingS_1",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_wingS_1_GL_spine_2",
      "from": "GL_wingS_1",
      "to": "GL_spine_2",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_3_GL_wingN_2",
      "from": "GL_spine_3",
      "to": "GL_wingN_2",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_wingN_2_GL_spine_3",
      "from": "GL_wingN_2",
      "to": "GL_spine_3",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_3_GL_wingS_2",
      "from": "GL_spine_3",
      "to": "GL_wingS_2",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_GL_wingS_2_GL_spine_3",
      "from": "GL_wingS_2",
      "to": "GL_spine_3",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_0_L2_spine_1",
      "from": "L2_spine_0",
      "to": "L2_spine_1",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_1_L2_spine_0",
      "from": "L2_spine_1",
      "to": "L2_spine_0",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_1_L2_spine_2",
      "from": "L2_spine_1",
      "to": "L2_spine_2",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_2_L2_spine_1",
      "from": "L2_spine_2",
      "to": "L2_spine_1",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_2_L2_spine_3",
      "from": "L2_spine_2",
      "to": "L2_spine_3",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_3_L2_spine_2",
      "from": "L2_spine_3",
      "to": "L2_spine_2",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_3_L2_spine_4",
      "from": "L2_spine_3",
      "to": "L2_spine_4",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_4_L2_spine_3",
      "from": "L2_spine_4",
      "to": "L2_spine_3",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_1_L2_wingN_0",
      "from": "L2_spine_1",
      "to": "L2_wingN_0",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_wingN_0_L2_spine_1",
      "from": "L2_wingN_0",
      "to": "L2_spine_1",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_1_L2_wingS_0",
      "from": "L2_spine_1",
      "to": "L2_wingS_0",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_wingS_0_L2_spine_1",
      "from": "L2_wingS_0",
      "to": "L2_spine_1",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_2_L2_wingN_1",
      "from": "L2_spine_2",
      "to": "L2_wingN_1",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_wingN_1_L2_spine_2",
      "from": "L2_wingN_1",
      "to": "L2_spine_2",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_2_L2_wingS_1",
      "from": "L2_spine_2",
      "to": "L2_wingS_1",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_wingS_1_L2_spine_2",
      "from": "L2_wingS_1",
      "to": "L2_spine_2",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_3_L2_wingN_2",
      "from": "L2_spine_3",
      "to": "L2_wingN_2",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_wingN_2_L2_spine_3",
      "from": "L2_wingN_2",
      "to": "L2_spine_3",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_3_L2_wingS_2",
      "from": "L2_spine_3",
      "to": "L2_wingS_2",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_L2_wingS_2_L2_spine_3",
      "from": "L2_wingS_2",
      "to": "L2_spine_3",
      "latency": 22,
      "type": "corridor"
    },
    {
      "id": "e_nurse_station_gl_GL_spine_2",
      "from": "nurse_station_gl",
      "to": "GL_spine_2",
      "latency": 25,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_2_nurse_station_gl",
      "from": "GL_spine_2",
      "to": "nurse_station_gl",
      "latency": 25,
      "type": "corridor"
    },
    {
      "id": "e_nurse_station_l2_L2_spine_2",
      "from": "nurse_station_l2",
      "to": "L2_spine_2",
      "latency": 25,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_2_nurse_station_l2",
      "from": "L2_spine_2",
      "to": "nurse_station_l2",
      "latency": 25,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_0_stair_1_GL",
      "from": "GL_spine_0",
      "to": "stair_1_GL",
      "latency": 24,
      "type": "corridor"
    },
    {
      "id": "e_stair_1_GL_GL_spine_0",
      "from": "stair_1_GL",
      "to": "GL_spine_0",
      "latency": 24,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_0_stair_1_L2",
      "from": "L2_spine_0",
      "to": "stair_1_L2",
      "latency": 24,
      "type": "corridor"
    },
    {
      "id": "e_stair_1_L2_L2_spine_0",
      "from": "stair_1_L2",
      "to": "L2_spine_0",
      "latency": 24,
      "type": "corridor"
    },
    {
      "id": "e_stair_1_GL_stair_1_L2",
      "from": "stair_1_GL",
      "to": "stair_1_L2",
      "latency": 40,
      "type": "corridor"
    },
    {
      "id": "e_stair_1_L2_stair_1_GL",
      "from": "stair_1_L2",
      "to": "stair_1_GL",
      "latency": 40,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_2_stair_2_GL",
      "from": "GL_spine_2",
      "to": "stair_2_GL",
      "latency": 24,
      "type": "corridor"
    },
    {
      "id": "e_stair_2_GL_GL_spine_2",
      "from": "stair_2_GL",
      "to": "GL_spine_2",
      "latency": 24,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_2_stair_2_L2",
      "from": "L2_spine_2",
      "to": "stair_2_L2",
      "latency": 24,
      "type": "corridor"
    },
    {
      "id": "e_stair_2_L2_L2_spine_2",
      "from": "stair_2_L2",
      "to": "L2_spine_2",
      "latency": 24,
      "type": "corridor"
    },
    {
      "id": "e_stair_2_GL_stair_2_L2",
      "from": "stair_2_GL",
      "to": "stair_2_L2",
      "latency": 40,
      "type": "corridor"
    },
    {
      "id": "e_stair_2_L2_stair_2_GL",
      "from": "stair_2_L2",
      "to": "stair_2_GL",
      "latency": 40,
      "type": "corridor"
    },
    {
      "id": "e_GL_spine_4_stair_3_GL",
      "from": "GL_spine_4",
      "to": "stair_3_GL",
      "latency": 24,
      "type": "corridor"
    },
    {
      "id": "e_stair_3_GL_GL_spine_4",
      "from": "stair_3_GL",
      "to": "GL_spine_4",
      "latency": 24,
      "type": "corridor"
    },
    {
      "id": "e_L2_spine_4_stair_3_L2",
      "from": "L2_spine_4",
      "to": "stair_3_L2",
      "latency": 24,
      "type": "corridor"
    },
    {
      "id": "e_stair_3_L2_L2_spine_4",
      "from": "stair_3_L2",
      "to": "L2_spine_4",
      "latency": 24,
      "type": "corridor"
    },
    {
      "id": "e_stair_3_GL_stair_3_L2",
      "from": "stair_3_GL",
      "to": "stair_3_L2",
      "latency": 40,
      "type": "corridor"
    },
    {
      "id": "e_stair_3_L2_stair_3_GL",
      "from": "stair_3_L2",
      "to": "stair_3_GL",
      "latency": 40,
      "type": "corridor"
    },
    {
      "id": "e_GL_wingN_0_GL_N_0",
      "from": "GL_wingN_0",
      "to": "GL_N_0",
      "latency": 9,
      "type": "path"
    },
    {
      "id": "e_GL_N_0_GL_wingN_0",
      "from": "GL_N_0",
      "to": "GL_wingN_0",
      "latency": 9,
      "type": "path"
    },
    {
      "id": "e_GL_wingN_1_GL_N_1",
      "from": "GL_wingN_1",
      "to": "GL_N_1",
      "latency": 9,
      "type": "path"
    },
    {
      "id": "e_GL_N_1_GL_wingN_1",
      "from": "GL_N_1",
      "to": "GL_wingN_1",
      "latency": 9,
      "type": "path"
    },
    {
      "id": "e_GL_wingN_2_GL_N_2",
      "from": "GL_wingN_2",
      "to": "GL_N_2",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_GL_N_2_GL_wingN_2",
      "from": "GL_N_2",
      "to": "GL_wingN_2",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_GL_wingN_0_GL_N_3",
      "from": "GL_wingN_0",
      "to": "GL_N_3",
      "latency": 5,
      "type": "path"
    },
    {
      "id": "e_GL_N_3_GL_wingN_0",
      "from": "GL_N_3",
      "to": "GL_wingN_0",
      "latency": 5,
      "type": "path"
    },
    {
      "id": "e_GL_wingN_1_GL_N_4",
      "from": "GL_wingN_1",
      "to": "GL_N_4",
      "latency": 5,
      "type": "path"
    },
    {
      "id": "e_GL_N_4_GL_wingN_1",
      "from": "GL_N_4",
      "to": "GL_wingN_1",
      "latency": 5,
      "type": "path"
    },
    {
      "id": "e_GL_wingN_2_GL_N_5",
      "from": "GL_wingN_2",
      "to": "GL_N_5",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_GL_N_5_GL_wingN_2",
      "from": "GL_N_5",
      "to": "GL_wingN_2",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_GL_wingN_0_GL_N_6",
      "from": "GL_wingN_0",
      "to": "GL_N_6",
      "latency": 9,
      "type": "path"
    },
    {
      "id": "e_GL_N_6_GL_wingN_0",
      "from": "GL_N_6",
      "to": "GL_wingN_0",
      "latency": 9,
      "type": "path"
    },
    {
      "id": "e_GL_wingN_1_GL_N_7",
      "from": "GL_wingN_1",
      "to": "GL_N_7",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_GL_N_7_GL_wingN_1",
      "from": "GL_N_7",
      "to": "GL_wingN_1",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_GL_wingS_0_GL_S_0",
      "from": "GL_wingS_0",
      "to": "GL_S_0",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_GL_S_0_GL_wingS_0",
      "from": "GL_S_0",
      "to": "GL_wingS_0",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_GL_wingS_1_GL_S_1",
      "from": "GL_wingS_1",
      "to": "GL_S_1",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_GL_S_1_GL_wingS_1",
      "from": "GL_S_1",
      "to": "GL_wingS_1",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_GL_wingS_2_GL_S_2",
      "from": "GL_wingS_2",
      "to": "GL_S_2",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_GL_S_2_GL_wingS_2",
      "from": "GL_S_2",
      "to": "GL_wingS_2",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_GL_wingS_0_GL_S_3",
      "from": "GL_wingS_0",
      "to": "GL_S_3",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_GL_S_3_GL_wingS_0",
      "from": "GL_S_3",
      "to": "GL_wingS_0",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_GL_wingS_1_GL_S_4",
      "from": "GL_wingS_1",
      "to": "GL_S_4",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_GL_S_4_GL_wingS_1",
      "from": "GL_S_4",
      "to": "GL_wingS_1",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_GL_wingS_2_GL_S_5",
      "from": "GL_wingS_2",
      "to": "GL_S_5",
      "latency": 5,
      "type": "path"
    },
    {
      "id": "e_GL_S_5_GL_wingS_2",
      "from": "GL_S_5",
      "to": "GL_wingS_2",
      "latency": 5,
      "type": "path"
    },
    {
      "id": "e_GL_wingS_0_GL_S_6",
      "from": "GL_wingS_0",
      "to": "GL_S_6",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_GL_S_6_GL_wingS_0",
      "from": "GL_S_6",
      "to": "GL_wingS_0",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_GL_wingS_1_GL_S_7",
      "from": "GL_wingS_1",
      "to": "GL_S_7",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_GL_S_7_GL_wingS_1",
      "from": "GL_S_7",
      "to": "GL_wingS_1",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_GL_wingS_1_GL_exit_1",
      "from": "GL_wingS_1",
      "to": "GL_exit_1",
      "latency": 8,
      "type": "path"
    },
    {
      "id": "e_GL_exit_1_GL_wingS_1",
      "from": "GL_exit_1",
      "to": "GL_wingS_1",
      "latency": 8,
      "type": "path"
    },
    {
      "id": "e_GL_wingS_1_GL_exit_2",
      "from": "GL_wingS_1",
      "to": "GL_exit_2",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_GL_exit_2_GL_wingS_1",
      "from": "GL_exit_2",
      "to": "GL_wingS_1",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_L2_wingN_0_L2_N_0",
      "from": "L2_wingN_0",
      "to": "L2_N_0",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_L2_N_0_L2_wingN_0",
      "from": "L2_N_0",
      "to": "L2_wingN_0",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_L2_wingN_1_L2_N_1",
      "from": "L2_wingN_1",
      "to": "L2_N_1",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_L2_N_1_L2_wingN_1",
      "from": "L2_N_1",
      "to": "L2_wingN_1",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_L2_wingN_2_L2_N_2",
      "from": "L2_wingN_2",
      "to": "L2_N_2",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_L2_N_2_L2_wingN_2",
      "from": "L2_N_2",
      "to": "L2_wingN_2",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_L2_wingN_0_L2_N_3",
      "from": "L2_wingN_0",
      "to": "L2_N_3",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_L2_N_3_L2_wingN_0",
      "from": "L2_N_3",
      "to": "L2_wingN_0",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_L2_wingN_1_L2_N_4",
      "from": "L2_wingN_1",
      "to": "L2_N_4",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_L2_N_4_L2_wingN_1",
      "from": "L2_N_4",
      "to": "L2_wingN_1",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_L2_wingN_2_L2_N_5",
      "from": "L2_wingN_2",
      "to": "L2_N_5",
      "latency": 9,
      "type": "path"
    },
    {
      "id": "e_L2_N_5_L2_wingN_2",
      "from": "L2_N_5",
      "to": "L2_wingN_2",
      "latency": 9,
      "type": "path"
    },
    {
      "id": "e_L2_wingN_0_L2_N_6",
      "from": "L2_wingN_0",
      "to": "L2_N_6",
      "latency": 8,
      "type": "path"
    },
    {
      "id": "e_L2_N_6_L2_wingN_0",
      "from": "L2_N_6",
      "to": "L2_wingN_0",
      "latency": 8,
      "type": "path"
    },
    {
      "id": "e_L2_wingN_1_L2_N_7",
      "from": "L2_wingN_1",
      "to": "L2_N_7",
      "latency": 8,
      "type": "path"
    },
    {
      "id": "e_L2_N_7_L2_wingN_1",
      "from": "L2_N_7",
      "to": "L2_wingN_1",
      "latency": 8,
      "type": "path"
    },
    {
      "id": "e_L2_wingS_0_L2_S_0",
      "from": "L2_wingS_0",
      "to": "L2_S_0",
      "latency": 9,
      "type": "path"
    },
    {
      "id": "e_L2_S_0_L2_wingS_0",
      "from": "L2_S_0",
      "to": "L2_wingS_0",
      "latency": 9,
      "type": "path"
    },
    {
      "id": "e_L2_wingS_1_L2_S_1",
      "from": "L2_wingS_1",
      "to": "L2_S_1",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_L2_S_1_L2_wingS_1",
      "from": "L2_S_1",
      "to": "L2_wingS_1",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_L2_wingS_2_L2_S_2",
      "from": "L2_wingS_2",
      "to": "L2_S_2",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_L2_S_2_L2_wingS_2",
      "from": "L2_S_2",
      "to": "L2_wingS_2",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_L2_wingS_0_L2_S_3",
      "from": "L2_wingS_0",
      "to": "L2_S_3",
      "latency": 8,
      "type": "path"
    },
    {
      "id": "e_L2_S_3_L2_wingS_0",
      "from": "L2_S_3",
      "to": "L2_wingS_0",
      "latency": 8,
      "type": "path"
    },
    {
      "id": "e_L2_wingS_1_L2_S_4",
      "from": "L2_wingS_1",
      "to": "L2_S_4",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_L2_S_4_L2_wingS_1",
      "from": "L2_S_4",
      "to": "L2_wingS_1",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_L2_wingS_2_L2_S_5",
      "from": "L2_wingS_2",
      "to": "L2_S_5",
      "latency": 5,
      "type": "path"
    },
    {
      "id": "e_L2_S_5_L2_wingS_2",
      "from": "L2_S_5",
      "to": "L2_wingS_2",
      "latency": 5,
      "type": "path"
    },
    {
      "id": "e_L2_wingS_0_L2_S_6",
      "from": "L2_wingS_0",
      "to": "L2_S_6",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_L2_S_6_L2_wingS_0",
      "from": "L2_S_6",
      "to": "L2_wingS_0",
      "latency": 6,
      "type": "path"
    },
    {
      "id": "e_L2_wingS_1_L2_S_7",
      "from": "L2_wingS_1",
      "to": "L2_S_7",
      "latency": 9,
      "type": "path"
    },
    {
      "id": "e_L2_S_7_L2_wingS_1",
      "from": "L2_S_7",
      "to": "L2_wingS_1",
      "latency": 9,
      "type": "path"
    },
    {
      "id": "e_L2_wingN_1_L2_exit_1",
      "from": "L2_wingN_1",
      "to": "L2_exit_1",
      "latency": 8,
      "type": "path"
    },
    {
      "id": "e_L2_exit_1_L2_wingN_1",
      "from": "L2_exit_1",
      "to": "L2_wingN_1",
      "latency": 8,
      "type": "path"
    },
    {
      "id": "e_L2_wingN_1_L2_exit_2",
      "from": "L2_wingN_1",
      "to": "L2_exit_2",
      "latency": 7,
      "type": "path"
    },
    {
      "id": "e_L2_exit_2_L2_wingN_1",
      "from": "L2_exit_2",
      "to": "L2_wingN_1",
      "latency": 7,
      "type": "path"
    }
  ],
  "sourceId": "nurse_station_gl",
  "destinationIds": [
    "GL_exit_1",
    "GL_exit_2",
    "L2_exit_1",
    "L2_exit_2"
  ],
  "width": 60000,
  "height": 35000
};
