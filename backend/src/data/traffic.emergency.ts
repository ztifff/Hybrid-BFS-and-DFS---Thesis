export const emergencyRoutingGraph = {
  "nodes": [
    {
      "id": "dispatch_hq",
      "label": "Central Dispatch HQ",
      "type": "origin",
      "x": 30000,
      "y": 17500,
      "level": 1,
      "buildingId": "Urban_Core"
    },
    {
      "id": "hosp_gen",
      "label": "General Hospital (Urban)",
      "type": "emergency_exit",
      "x": 30000,
      "y": 25000,
      "level": 1,
      "buildingId": "Urban_Core"
    },
    {
      "id": "hosp_sub_north",
      "label": "North Suburb Med Center",
      "type": "emergency_exit",
      "x": 30000,
      "y": 5000,
      "level": 1,
      "buildingId": "Suburban_Ring"
    },
    {
      "id": "hosp_sub_east",
      "label": "East Suburb Clinic",
      "type": "emergency_exit",
      "x": 50000,
      "y": 17500,
      "level": 1,
      "buildingId": "Suburban_Ring"
    },
    {
      "id": "hosp_rural_west",
      "label": "West Rural Outpost",
      "type": "emergency_exit",
      "x": 5000,
      "y": 17500,
      "level": 1,
      "buildingId": "Rural_Outskirts"
    },
    {
      "id": "u_int_1",
      "label": "Urban Junction NW",
      "type": "corridor",
      "x": 20000,
      "y": 12000,
      "level": 1,
      "buildingId": "Urban_Core"
    },
    {
      "id": "u_int_2",
      "label": "Urban Junction NE",
      "type": "corridor",
      "x": 40000,
      "y": 12000,
      "level": 1,
      "buildingId": "Urban_Core"
    },
    {
      "id": "u_int_3",
      "label": "Urban Junction SW",
      "type": "corridor",
      "x": 20000,
      "y": 22000,
      "level": 1,
      "buildingId": "Urban_Core"
    },
    {
      "id": "u_int_4",
      "label": "Urban Junction SE",
      "type": "corridor",
      "x": 40000,
      "y": 22000,
      "level": 1,
      "buildingId": "Urban_Core"
    },
    {
      "id": "inc_u_1",
      "label": "⚠️ Major Accident (High Traffic)",
      "type": "place",
      "x": 25000,
      "y": 15000,
      "level": 1,
      "buildingId": "Urban_Core"
    },
    {
      "id": "inc_u_2",
      "label": "⚠️ Cardiac Arrest (Clear)",
      "type": "place",
      "x": 35000,
      "y": 15000,
      "level": 1,
      "buildingId": "Urban_Core"
    },
    {
      "id": "s_int_n",
      "label": "Suburban Hwy North",
      "type": "corridor",
      "x": 30000,
      "y": 10000,
      "level": 1,
      "buildingId": "Suburban_Ring"
    },
    {
      "id": "s_int_s",
      "label": "Suburban Hwy South",
      "type": "corridor",
      "x": 30000,
      "y": 30000,
      "level": 1,
      "buildingId": "Suburban_Ring"
    },
    {
      "id": "s_int_w",
      "label": "Suburban Hwy West",
      "type": "corridor",
      "x": 12000,
      "y": 17500,
      "level": 1,
      "buildingId": "Suburban_Ring"
    },
    {
      "id": "s_int_e",
      "label": "Suburban Hwy East",
      "type": "corridor",
      "x": 48000,
      "y": 17500,
      "level": 1,
      "buildingId": "Suburban_Ring"
    },
    {
      "id": "inc_s_1",
      "label": "⚠️ Minor Accident",
      "type": "place",
      "x": 40000,
      "y": 8000,
      "level": 1,
      "buildingId": "Suburban_Ring"
    },
    {
      "id": "inc_s_2",
      "label": "⚠️ Fire Emergency",
      "type": "place",
      "x": 20000,
      "y": 30000,
      "level": 1,
      "buildingId": "Suburban_Ring"
    },
    {
      "id": "r_int_nw",
      "label": "Rural Route NW",
      "type": "corridor",
      "x": 8000,
      "y": 5000,
      "level": 1,
      "buildingId": "Rural_Outskirts"
    },
    {
      "id": "r_int_sw",
      "label": "Rural Route SW",
      "type": "corridor",
      "x": 8000,
      "y": 30000,
      "level": 1,
      "buildingId": "Rural_Outskirts"
    },
    {
      "id": "r_int_ne",
      "label": "Rural Route NE",
      "type": "corridor",
      "x": 52000,
      "y": 5000,
      "level": 1,
      "buildingId": "Rural_Outskirts"
    },
    {
      "id": "r_int_se",
      "label": "Rural Route SE",
      "type": "corridor",
      "x": 52000,
      "y": 30000,
      "level": 1,
      "buildingId": "Rural_Outskirts"
    },
    {
      "id": "inc_r_1",
      "label": "⚠️ Tractor Accident (Unpaved)",
      "type": "place",
      "x": 8000,
      "y": 12000,
      "level": 1,
      "buildingId": "Rural_Outskirts"
    },
    {
      "id": "inc_r_2",
      "label": "⚠️ Medical Emergency",
      "type": "place",
      "x": 52000,
      "y": 25000,
      "level": 1,
      "buildingId": "Rural_Outskirts"
    }
  ],
  "edges": [
    {
      "id": "e_dispatch_hq_inc_u_1",
      "from": "dispatch_hq",
      "to": "inc_u_1",
      "latency": 20,
      "type": "corridor"
    },
    {
      "id": "e_inc_u_1_dispatch_hq",
      "from": "inc_u_1",
      "to": "dispatch_hq",
      "latency": 20,
      "type": "corridor"
    },
    {
      "id": "e_dispatch_hq_inc_u_2",
      "from": "dispatch_hq",
      "to": "inc_u_2",
      "latency": 15,
      "type": "corridor"
    },
    {
      "id": "e_inc_u_2_dispatch_hq",
      "from": "inc_u_2",
      "to": "dispatch_hq",
      "latency": 15,
      "type": "corridor"
    },
    {
      "id": "e_dispatch_hq_u_int_1",
      "from": "dispatch_hq",
      "to": "u_int_1",
      "latency": 18,
      "type": "corridor"
    },
    {
      "id": "e_u_int_1_dispatch_hq",
      "from": "u_int_1",
      "to": "dispatch_hq",
      "latency": 18,
      "type": "corridor"
    },
    {
      "id": "e_dispatch_hq_u_int_2",
      "from": "dispatch_hq",
      "to": "u_int_2",
      "latency": 18,
      "type": "corridor"
    },
    {
      "id": "e_u_int_2_dispatch_hq",
      "from": "u_int_2",
      "to": "dispatch_hq",
      "latency": 18,
      "type": "corridor"
    },
    {
      "id": "e_dispatch_hq_u_int_3",
      "from": "dispatch_hq",
      "to": "u_int_3",
      "latency": 18,
      "type": "corridor"
    },
    {
      "id": "e_u_int_3_dispatch_hq",
      "from": "u_int_3",
      "to": "dispatch_hq",
      "latency": 18,
      "type": "corridor"
    },
    {
      "id": "e_dispatch_hq_u_int_4",
      "from": "dispatch_hq",
      "to": "u_int_4",
      "latency": 18,
      "type": "corridor"
    },
    {
      "id": "e_u_int_4_dispatch_hq",
      "from": "u_int_4",
      "to": "dispatch_hq",
      "latency": 18,
      "type": "corridor"
    },
    {
      "id": "e_dispatch_hq_hosp_gen",
      "from": "dispatch_hq",
      "to": "hosp_gen",
      "latency": 25,
      "type": "corridor"
    },
    {
      "id": "e_hosp_gen_dispatch_hq",
      "from": "hosp_gen",
      "to": "dispatch_hq",
      "latency": 25,
      "type": "corridor"
    },
    {
      "id": "e_u_int_1_inc_u_1",
      "from": "u_int_1",
      "to": "inc_u_1",
      "latency": 15,
      "type": "corridor"
    },
    {
      "id": "e_inc_u_1_u_int_1",
      "from": "inc_u_1",
      "to": "u_int_1",
      "latency": 15,
      "type": "corridor"
    },
    {
      "id": "e_u_int_2_inc_u_2",
      "from": "u_int_2",
      "to": "inc_u_2",
      "latency": 15,
      "type": "corridor"
    },
    {
      "id": "e_inc_u_2_u_int_2",
      "from": "inc_u_2",
      "to": "u_int_2",
      "latency": 15,
      "type": "corridor"
    },
    {
      "id": "e_u_int_3_hosp_gen",
      "from": "u_int_3",
      "to": "hosp_gen",
      "latency": 20,
      "type": "corridor"
    },
    {
      "id": "e_hosp_gen_u_int_3",
      "from": "hosp_gen",
      "to": "u_int_3",
      "latency": 20,
      "type": "corridor"
    },
    {
      "id": "e_u_int_4_hosp_gen",
      "from": "u_int_4",
      "to": "hosp_gen",
      "latency": 20,
      "type": "corridor"
    },
    {
      "id": "e_hosp_gen_u_int_4",
      "from": "hosp_gen",
      "to": "u_int_4",
      "latency": 20,
      "type": "corridor"
    },
    {
      "id": "e_u_int_1_s_int_w",
      "from": "u_int_1",
      "to": "s_int_w",
      "latency": 8,
      "type": "stairwell"
    },
    {
      "id": "e_s_int_w_u_int_1",
      "from": "s_int_w",
      "to": "u_int_1",
      "latency": 8,
      "type": "stairwell"
    },
    {
      "id": "e_u_int_2_s_int_e",
      "from": "u_int_2",
      "to": "s_int_e",
      "latency": 8,
      "type": "stairwell"
    },
    {
      "id": "e_s_int_e_u_int_2",
      "from": "s_int_e",
      "to": "u_int_2",
      "latency": 8,
      "type": "stairwell"
    },
    {
      "id": "e_u_int_1_s_int_n",
      "from": "u_int_1",
      "to": "s_int_n",
      "latency": 8,
      "type": "stairwell"
    },
    {
      "id": "e_s_int_n_u_int_1",
      "from": "s_int_n",
      "to": "u_int_1",
      "latency": 8,
      "type": "stairwell"
    },
    {
      "id": "e_u_int_3_s_int_s",
      "from": "u_int_3",
      "to": "s_int_s",
      "latency": 8,
      "type": "stairwell"
    },
    {
      "id": "e_s_int_s_u_int_3",
      "from": "s_int_s",
      "to": "u_int_3",
      "latency": 8,
      "type": "stairwell"
    },
    {
      "id": "e_s_int_n_hosp_sub_north",
      "from": "s_int_n",
      "to": "hosp_sub_north",
      "latency": 5,
      "type": "stairwell"
    },
    {
      "id": "e_hosp_sub_north_s_int_n",
      "from": "hosp_sub_north",
      "to": "s_int_n",
      "latency": 5,
      "type": "stairwell"
    },
    {
      "id": "e_s_int_e_hosp_sub_east",
      "from": "s_int_e",
      "to": "hosp_sub_east",
      "latency": 5,
      "type": "stairwell"
    },
    {
      "id": "e_hosp_sub_east_s_int_e",
      "from": "hosp_sub_east",
      "to": "s_int_e",
      "latency": 5,
      "type": "stairwell"
    },
    {
      "id": "e_s_int_n_inc_s_1",
      "from": "s_int_n",
      "to": "inc_s_1",
      "latency": 10,
      "type": "corridor"
    },
    {
      "id": "e_inc_s_1_s_int_n",
      "from": "inc_s_1",
      "to": "s_int_n",
      "latency": 10,
      "type": "corridor"
    },
    {
      "id": "e_s_int_s_inc_s_2",
      "from": "s_int_s",
      "to": "inc_s_2",
      "latency": 10,
      "type": "corridor"
    },
    {
      "id": "e_inc_s_2_s_int_s",
      "from": "inc_s_2",
      "to": "s_int_s",
      "latency": 10,
      "type": "corridor"
    },
    {
      "id": "e_s_int_w_r_int_nw",
      "from": "s_int_w",
      "to": "r_int_nw",
      "latency": 35,
      "type": "corridor"
    },
    {
      "id": "e_r_int_nw_s_int_w",
      "from": "r_int_nw",
      "to": "s_int_w",
      "latency": 35,
      "type": "corridor"
    },
    {
      "id": "e_s_int_w_r_int_sw",
      "from": "s_int_w",
      "to": "r_int_sw",
      "latency": 35,
      "type": "corridor"
    },
    {
      "id": "e_r_int_sw_s_int_w",
      "from": "r_int_sw",
      "to": "s_int_w",
      "latency": 35,
      "type": "corridor"
    },
    {
      "id": "e_s_int_e_r_int_ne",
      "from": "s_int_e",
      "to": "r_int_ne",
      "latency": 35,
      "type": "corridor"
    },
    {
      "id": "e_r_int_ne_s_int_e",
      "from": "r_int_ne",
      "to": "s_int_e",
      "latency": 35,
      "type": "corridor"
    },
    {
      "id": "e_s_int_e_r_int_se",
      "from": "s_int_e",
      "to": "r_int_se",
      "latency": 35,
      "type": "corridor"
    },
    {
      "id": "e_r_int_se_s_int_e",
      "from": "r_int_se",
      "to": "s_int_e",
      "latency": 35,
      "type": "corridor"
    },
    {
      "id": "e_r_int_nw_inc_r_1",
      "from": "r_int_nw",
      "to": "inc_r_1",
      "latency": 40,
      "type": "corridor"
    },
    {
      "id": "e_inc_r_1_r_int_nw",
      "from": "inc_r_1",
      "to": "r_int_nw",
      "latency": 40,
      "type": "corridor"
    },
    {
      "id": "e_r_int_sw_hosp_rural_west",
      "from": "r_int_sw",
      "to": "hosp_rural_west",
      "latency": 20,
      "type": "corridor"
    },
    {
      "id": "e_hosp_rural_west_r_int_sw",
      "from": "hosp_rural_west",
      "to": "r_int_sw",
      "latency": 20,
      "type": "corridor"
    },
    {
      "id": "e_r_int_nw_hosp_rural_west",
      "from": "r_int_nw",
      "to": "hosp_rural_west",
      "latency": 30,
      "type": "corridor"
    },
    {
      "id": "e_hosp_rural_west_r_int_nw",
      "from": "hosp_rural_west",
      "to": "r_int_nw",
      "latency": 30,
      "type": "corridor"
    },
    {
      "id": "e_r_int_se_inc_r_2",
      "from": "r_int_se",
      "to": "inc_r_2",
      "latency": 45,
      "type": "corridor"
    },
    {
      "id": "e_inc_r_2_r_int_se",
      "from": "inc_r_2",
      "to": "r_int_se",
      "latency": 45,
      "type": "corridor"
    }
  ],
  "sourceId": "dispatch_hq",
  "destinationIds": [
    "hosp_gen",
    "hosp_sub_north",
    "hosp_sub_east",
    "hosp_rural_west"
  ],
  "width": 60000,
  "height": 35000
};