export const awsWarehouseGraph = {
  "nodes": [
    {
      "id": "depot_main",
      "label": "Robot Charging Station\n(Start)",
      "type": "depot",
      "x": 25000,
      "y": -1500,
      "level": 0
    },
    {
      "id": "top_w",
      "label": "Top Aisle (West)",
      "type": "zone",
      "x": 10000,
      "y": 1000,
      "level": 0
    },
    {
      "id": "top_mw",
      "label": "Top Aisle (Mid-West)",
      "type": "zone",
      "x": 20000,
      "y": 1000,
      "level": 0
    },
    {
      "id": "top_me",
      "label": "Top Aisle (Mid-East)",
      "type": "zone",
      "x": 30000,
      "y": 1000,
      "level": 0
    },
    {
      "id": "top_e",
      "label": "Top Aisle (East)",
      "type": "zone",
      "x": 40000,
      "y": 1000,
      "level": 0
    },
    {
      "id": "shelf_a1",
      "label": "Shelf A1 (Electronics)",
      "type": "aisle",
      "x": 10000,
      "y": 4000,
      "level": 0
    },
    {
      "id": "shelf_a2",
      "label": "Shelf A2 (Apparel)",
      "type": "aisle",
      "x": 20000,
      "y": 4000,
      "level": 0
    },
    {
      "id": "shelf_b1",
      "label": "Shelf B1 (Home & Kitchen)",
      "type": "aisle",
      "x": 30000,
      "y": 4000,
      "level": 0
    },
    {
      "id": "shelf_b2",
      "label": "Shelf B2 (Books & Media)",
      "type": "aisle",
      "x": 40000,
      "y": 4000,
      "level": 0
    },
    {
      "id": "dest_desk_a",
      "label": "Packing Desk A",
      "type": "shelf",
      "x": 10000,
      "y": 28000,
      "level": 4
    },
    {
      "id": "depot_secondary",
      "label": "Secondary Robot Depot",
      "type": "depot",
      "x": 25000,
      "y": 28000,
      "level": 4
    },
    {
      "id": "dest_desk_b",
      "label": "Packing Desk B",
      "type": "shelf",
      "x": 40000,
      "y": 28000,
      "level": 4
    },
    {
      "id": "front_w",
      "label": "Front Aisle (West)",
      "type": "zone",
      "x": 10000,
      "y": 8000,
      "level": 1
    },
    {
      "id": "front_mw",
      "label": "Front Aisle (Mid-West)",
      "type": "zone",
      "x": 20000,
      "y": 8000,
      "level": 1
    },
    {
      "id": "front_me",
      "label": "Front Aisle (Mid-East)",
      "type": "zone",
      "x": 30000,
      "y": 8000,
      "level": 1
    },
    {
      "id": "front_e",
      "label": "Front Aisle (East)",
      "type": "zone",
      "x": 40000,
      "y": 8000,
      "level": 1
    },
    {
      "id": "mid_w",
      "label": "Middle Aisle (West)",
      "type": "zone",
      "x": 10000,
      "y": 16000,
      "level": 2
    },
    {
      "id": "mid_mw",
      "label": "Middle Aisle (Mid-West)",
      "type": "zone",
      "x": 20000,
      "y": 16000,
      "level": 2
    },
    {
      "id": "mid_me",
      "label": "Middle Aisle (Mid-East)",
      "type": "zone",
      "x": 30000,
      "y": 16000,
      "level": 2
    },
    {
      "id": "mid_e",
      "label": "Middle Aisle (East)",
      "type": "zone",
      "x": 40000,
      "y": 16000,
      "level": 2
    },
    {
      "id": "back_w",
      "label": "Back Aisle (West)",
      "type": "zone",
      "x": 10000,
      "y": 24000,
      "level": 3
    },
    {
      "id": "back_mw",
      "label": "Back Aisle (Mid-West)",
      "type": "zone",
      "x": 20000,
      "y": 24000,
      "level": 3
    },
    {
      "id": "back_me",
      "label": "Back Aisle (Mid-East)",
      "type": "zone",
      "x": 30000,
      "y": 24000,
      "level": 3
    },
    {
      "id": "back_e",
      "label": "Back Aisle (East)",
      "type": "zone",
      "x": 40000,
      "y": 24000,
      "level": 3
    },
    {
      "id": "shelf_d1",
      "label": "Shelf D1 (Electronics)",
      "type": "aisle",
      "x": 10000,
      "y": 12000,
      "level": 1
    },
    {
      "id": "shelf_d2",
      "label": "Shelf D2 (Tools)",
      "type": "aisle",
      "x": 10000,
      "y": 20000,
      "level": 2
    },
    {
      "id": "shelf_e1",
      "label": "Shelf E1 (Apparel)",
      "type": "aisle",
      "x": 20000,
      "y": 12000,
      "level": 1
    },
    {
      "id": "shelf_e2",
      "label": "Shelf E2 (Home Goods)",
      "type": "aisle",
      "x": 20000,
      "y": 20000,
      "level": 2
    },
    {
      "id": "shelf_e3",
      "label": "Shelf E3 (Toys)",
      "type": "aisle",
      "x": 30000,
      "y": 12000,
      "level": 1
    },
    {
      "id": "shelf_e4",
      "label": "Shelf E4 (Books)",
      "type": "aisle",
      "x": 30000,
      "y": 20000,
      "level": 2
    },
    {
      "id": "shelf_f1",
      "label": "Shelf F1 (Heavy Goods)",
      "type": "aisle",
      "x": 40000,
      "y": 12000,
      "level": 1
    },
    {
      "id": "shelf_f2",
      "label": "Shelf F2 (Automotive)",
      "type": "aisle",
      "x": 40000,
      "y": 20000,
      "level": 2
    },
    {
      "id": "clutter_a",
      "label": "Clutter Zone A",
      "type": "shelf",
      "x": 5000,
      "y": 12000,
      "level": 1
    },
    {
      "id": "clutter_b",
      "label": "Clutter Zone B",
      "type": "shelf",
      "x": 45000,
      "y": 12000,
      "level": 1
    },
    {
      "id": "pallet_jack",
      "label": "Parked Pallet Jack",
      "type": "shelf",
      "x": 5000,
      "y": 20000,
      "level": 2
    },
    {
      "id": "trash_cans",
      "label": "Trash Can Area",
      "type": "shelf",
      "x": 45000,
      "y": 20000,
      "level": 2
    }
  ],
  "edges": [
    {
      "id": "e_depot_main_top_mw",
      "from": "depot_main",
      "to": "top_mw",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_top_mw_depot_main",
      "from": "top_mw",
      "to": "depot_main",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_depot_main_top_me",
      "from": "depot_main",
      "to": "top_me",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_top_me_depot_main",
      "from": "top_me",
      "to": "depot_main",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_top_w_top_mw",
      "from": "top_w",
      "to": "top_mw",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_top_mw_top_w",
      "from": "top_mw",
      "to": "top_w",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_top_mw_top_me",
      "from": "top_mw",
      "to": "top_me",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_top_me_top_mw",
      "from": "top_me",
      "to": "top_mw",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_top_me_top_e",
      "from": "top_me",
      "to": "top_e",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_top_e_top_me",
      "from": "top_e",
      "to": "top_me",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_top_w_shelf_a1",
      "from": "top_w",
      "to": "shelf_a1",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_shelf_a1_top_w",
      "from": "shelf_a1",
      "to": "top_w",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_shelf_a1_front_w",
      "from": "shelf_a1",
      "to": "front_w",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_front_w_shelf_a1",
      "from": "front_w",
      "to": "shelf_a1",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_top_mw_shelf_a2",
      "from": "top_mw",
      "to": "shelf_a2",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_shelf_a2_top_mw",
      "from": "shelf_a2",
      "to": "top_mw",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_shelf_a2_front_mw",
      "from": "shelf_a2",
      "to": "front_mw",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_front_mw_shelf_a2",
      "from": "front_mw",
      "to": "shelf_a2",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_top_me_shelf_b1",
      "from": "top_me",
      "to": "shelf_b1",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_shelf_b1_top_me",
      "from": "shelf_b1",
      "to": "top_me",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_shelf_b1_front_me",
      "from": "shelf_b1",
      "to": "front_me",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_front_me_shelf_b1",
      "from": "front_me",
      "to": "shelf_b1",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_top_e_shelf_b2",
      "from": "top_e",
      "to": "shelf_b2",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_shelf_b2_top_e",
      "from": "shelf_b2",
      "to": "top_e",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_shelf_b2_front_e",
      "from": "shelf_b2",
      "to": "front_e",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_front_e_shelf_b2",
      "from": "front_e",
      "to": "shelf_b2",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_front_w_front_mw",
      "from": "front_w",
      "to": "front_mw",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_front_mw_front_w",
      "from": "front_mw",
      "to": "front_w",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_front_mw_front_me",
      "from": "front_mw",
      "to": "front_me",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_front_me_front_mw",
      "from": "front_me",
      "to": "front_mw",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_front_me_front_e",
      "from": "front_me",
      "to": "front_e",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_front_e_front_me",
      "from": "front_e",
      "to": "front_me",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_mid_w_mid_mw",
      "from": "mid_w",
      "to": "mid_mw",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_mid_mw_mid_w",
      "from": "mid_mw",
      "to": "mid_w",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_mid_mw_mid_me",
      "from": "mid_mw",
      "to": "mid_me",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_mid_me_mid_mw",
      "from": "mid_me",
      "to": "mid_mw",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_mid_me_mid_e",
      "from": "mid_me",
      "to": "mid_e",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_mid_e_mid_me",
      "from": "mid_e",
      "to": "mid_me",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_back_w_back_mw",
      "from": "back_w",
      "to": "back_mw",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_back_mw_back_w",
      "from": "back_mw",
      "to": "back_w",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_back_mw_back_me",
      "from": "back_mw",
      "to": "back_me",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_back_me_back_mw",
      "from": "back_me",
      "to": "back_mw",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_back_me_back_e",
      "from": "back_me",
      "to": "back_e",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_back_e_back_me",
      "from": "back_e",
      "to": "back_me",
      "latency": 20,
      "type": "path"
    },
    {
      "id": "e_front_w_shelf_d1",
      "from": "front_w",
      "to": "shelf_d1",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_shelf_d1_front_w",
      "from": "shelf_d1",
      "to": "front_w",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_shelf_d1_mid_w",
      "from": "shelf_d1",
      "to": "mid_w",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_mid_w_shelf_d1",
      "from": "mid_w",
      "to": "shelf_d1",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_mid_w_shelf_d2",
      "from": "mid_w",
      "to": "shelf_d2",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_shelf_d2_mid_w",
      "from": "shelf_d2",
      "to": "mid_w",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_shelf_d2_back_w",
      "from": "shelf_d2",
      "to": "back_w",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_back_w_shelf_d2",
      "from": "back_w",
      "to": "shelf_d2",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_front_mw_shelf_e1",
      "from": "front_mw",
      "to": "shelf_e1",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_shelf_e1_front_mw",
      "from": "shelf_e1",
      "to": "front_mw",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_shelf_e1_mid_mw",
      "from": "shelf_e1",
      "to": "mid_mw",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_mid_mw_shelf_e1",
      "from": "mid_mw",
      "to": "shelf_e1",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_mid_mw_shelf_e2",
      "from": "mid_mw",
      "to": "shelf_e2",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_shelf_e2_mid_mw",
      "from": "shelf_e2",
      "to": "mid_mw",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_shelf_e2_back_mw",
      "from": "shelf_e2",
      "to": "back_mw",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_back_mw_shelf_e2",
      "from": "back_mw",
      "to": "shelf_e2",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_front_me_shelf_e3",
      "from": "front_me",
      "to": "shelf_e3",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_shelf_e3_front_me",
      "from": "shelf_e3",
      "to": "front_me",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_shelf_e3_mid_me",
      "from": "shelf_e3",
      "to": "mid_me",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_mid_me_shelf_e3",
      "from": "mid_me",
      "to": "shelf_e3",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_mid_me_shelf_e4",
      "from": "mid_me",
      "to": "shelf_e4",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_shelf_e4_mid_me",
      "from": "shelf_e4",
      "to": "mid_me",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_shelf_e4_back_me",
      "from": "shelf_e4",
      "to": "back_me",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_back_me_shelf_e4",
      "from": "back_me",
      "to": "shelf_e4",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_front_e_shelf_f1",
      "from": "front_e",
      "to": "shelf_f1",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_shelf_f1_front_e",
      "from": "shelf_f1",
      "to": "front_e",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_shelf_f1_mid_e",
      "from": "shelf_f1",
      "to": "mid_e",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_mid_e_shelf_f1",
      "from": "mid_e",
      "to": "shelf_f1",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_mid_e_shelf_f2",
      "from": "mid_e",
      "to": "shelf_f2",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_shelf_f2_mid_e",
      "from": "shelf_f2",
      "to": "mid_e",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_shelf_f2_back_e",
      "from": "shelf_f2",
      "to": "back_e",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_back_e_shelf_f2",
      "from": "back_e",
      "to": "shelf_f2",
      "latency": 10,
      "type": "path"
    },
    {
      "id": "e_back_w_dest_desk_a",
      "from": "back_w",
      "to": "dest_desk_a",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_dest_desk_a_back_w",
      "from": "dest_desk_a",
      "to": "back_w",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_back_mw_depot_secondary",
      "from": "back_mw",
      "to": "depot_secondary",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_depot_secondary_back_mw",
      "from": "depot_secondary",
      "to": "back_mw",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_back_me_depot_secondary",
      "from": "back_me",
      "to": "depot_secondary",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_depot_secondary_back_me",
      "from": "depot_secondary",
      "to": "back_me",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_back_e_dest_desk_b",
      "from": "back_e",
      "to": "dest_desk_b",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_dest_desk_b_back_e",
      "from": "dest_desk_b",
      "to": "back_e",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_shelf_d1_clutter_a",
      "from": "shelf_d1",
      "to": "clutter_a",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_clutter_a_shelf_d1",
      "from": "clutter_a",
      "to": "shelf_d1",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_shelf_f1_clutter_b",
      "from": "shelf_f1",
      "to": "clutter_b",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_clutter_b_shelf_f1",
      "from": "clutter_b",
      "to": "shelf_f1",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_shelf_d2_pallet_jack",
      "from": "shelf_d2",
      "to": "pallet_jack",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_pallet_jack_shelf_d2",
      "from": "pallet_jack",
      "to": "shelf_d2",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_shelf_f2_trash_cans",
      "from": "shelf_f2",
      "to": "trash_cans",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_trash_cans_shelf_f2",
      "from": "trash_cans",
      "to": "shelf_f2",
      "latency": 15,
      "type": "path"
    }
  ],
  "sourceId": "depot_main",
  "destinationIds": [
    "dest_desk_a",
    "dest_desk_b",
    "clutter_a",
    "clutter_b",
    "pallet_jack",
    "trash_cans"
  ],
  "width": 50000,
  "height": 33000,
  "walls": [
    {
      "x1": 3500,
      "y1": -3000,
      "x2": 46500,
      "y2": -3000,
      "level": "warehouse"
    },
    {
      "x1": 46500,
      "y1": -3000,
      "x2": 46500,
      "y2": 29000,
      "level": "warehouse"
    },
    {
      "x1": 46500,
      "y1": 29000,
      "x2": 3500,
      "y2": 29000,
      "level": "warehouse"
    },
    {
      "x1": 3500,
      "y1": 29000,
      "x2": 3500,
      "y2": -3000,
      "level": "warehouse"
    },
    {
      "x1": 21000,
      "y1": -3000,
      "x2": 21000,
      "y2": 1000,
      "level": "warehouse"
    },
    {
      "x1": 29000,
      "y1": -3000,
      "x2": 29000,
      "y2": 1000,
      "level": "warehouse"
    },
    {
      "x1": 21000,
      "y1": 1000,
      "x2": 23500,
      "y2": 1000,
      "level": "warehouse"
    },
    {
      "x1": 26500,
      "y1": 1000,
      "x2": 29000,
      "y2": 1000,
      "level": "warehouse"
    },
    {
      "x1": 7500,
      "y1": 1500,
      "x2": 12500,
      "y2": 1500,
      "level": "warehouse"
    },
    {
      "x1": 12500,
      "y1": 1500,
      "x2": 12500,
      "y2": 6500,
      "level": "warehouse"
    },
    {
      "x1": 7500,
      "y1": 6500,
      "x2": 12500,
      "y2": 6500,
      "level": "warehouse"
    },
    {
      "x1": 7500,
      "y1": 1500,
      "x2": 7500,
      "y2": 6500,
      "level": "warehouse"
    },
    {
      "x1": 7500,
      "y1": 3166.6666666666665,
      "x2": 12500,
      "y2": 3166.6666666666665,
      "level": "warehouse"
    },
    {
      "x1": 7500,
      "y1": 4833.333333333333,
      "x2": 12500,
      "y2": 4833.333333333333,
      "level": "warehouse"
    },
    {
      "x1": 10000,
      "y1": 1500,
      "x2": 10000,
      "y2": 6500,
      "level": "warehouse"
    },
    {
      "x1": 17500,
      "y1": 1500,
      "x2": 22500,
      "y2": 1500,
      "level": "warehouse"
    },
    {
      "x1": 22500,
      "y1": 1500,
      "x2": 22500,
      "y2": 6500,
      "level": "warehouse"
    },
    {
      "x1": 17500,
      "y1": 6500,
      "x2": 22500,
      "y2": 6500,
      "level": "warehouse"
    },
    {
      "x1": 17500,
      "y1": 1500,
      "x2": 17500,
      "y2": 6500,
      "level": "warehouse"
    },
    {
      "x1": 17500,
      "y1": 3166.6666666666665,
      "x2": 22500,
      "y2": 3166.6666666666665,
      "level": "warehouse"
    },
    {
      "x1": 17500,
      "y1": 4833.333333333333,
      "x2": 22500,
      "y2": 4833.333333333333,
      "level": "warehouse"
    },
    {
      "x1": 20000,
      "y1": 1500,
      "x2": 20000,
      "y2": 6500,
      "level": "warehouse"
    },
    {
      "x1": 27500,
      "y1": 1500,
      "x2": 32500,
      "y2": 1500,
      "level": "warehouse"
    },
    {
      "x1": 32500,
      "y1": 1500,
      "x2": 32500,
      "y2": 6500,
      "level": "warehouse"
    },
    {
      "x1": 27500,
      "y1": 6500,
      "x2": 32500,
      "y2": 6500,
      "level": "warehouse"
    },
    {
      "x1": 27500,
      "y1": 1500,
      "x2": 27500,
      "y2": 6500,
      "level": "warehouse"
    },
    {
      "x1": 27500,
      "y1": 3166.6666666666665,
      "x2": 32500,
      "y2": 3166.6666666666665,
      "level": "warehouse"
    },
    {
      "x1": 27500,
      "y1": 4833.333333333333,
      "x2": 32500,
      "y2": 4833.333333333333,
      "level": "warehouse"
    },
    {
      "x1": 30000,
      "y1": 1500,
      "x2": 30000,
      "y2": 6500,
      "level": "warehouse"
    },
    {
      "x1": 37500,
      "y1": 1500,
      "x2": 42500,
      "y2": 1500,
      "level": "warehouse"
    },
    {
      "x1": 42500,
      "y1": 1500,
      "x2": 42500,
      "y2": 6500,
      "level": "warehouse"
    },
    {
      "x1": 37500,
      "y1": 6500,
      "x2": 42500,
      "y2": 6500,
      "level": "warehouse"
    },
    {
      "x1": 37500,
      "y1": 1500,
      "x2": 37500,
      "y2": 6500,
      "level": "warehouse"
    },
    {
      "x1": 37500,
      "y1": 3166.6666666666665,
      "x2": 42500,
      "y2": 3166.6666666666665,
      "level": "warehouse"
    },
    {
      "x1": 37500,
      "y1": 4833.333333333333,
      "x2": 42500,
      "y2": 4833.333333333333,
      "level": "warehouse"
    },
    {
      "x1": 40000,
      "y1": 1500,
      "x2": 40000,
      "y2": 6500,
      "level": "warehouse"
    },
    {
      "x1": 7500,
      "y1": 9500,
      "x2": 12500,
      "y2": 9500,
      "level": "warehouse"
    },
    {
      "x1": 12500,
      "y1": 9500,
      "x2": 12500,
      "y2": 14500,
      "level": "warehouse"
    },
    {
      "x1": 7500,
      "y1": 14500,
      "x2": 12500,
      "y2": 14500,
      "level": "warehouse"
    },
    {
      "x1": 7500,
      "y1": 9500,
      "x2": 7500,
      "y2": 14500,
      "level": "warehouse"
    },
    {
      "x1": 7500,
      "y1": 11166.666666666666,
      "x2": 12500,
      "y2": 11166.666666666666,
      "level": "warehouse"
    },
    {
      "x1": 7500,
      "y1": 12833.333333333334,
      "x2": 12500,
      "y2": 12833.333333333334,
      "level": "warehouse"
    },
    {
      "x1": 10000,
      "y1": 9500,
      "x2": 10000,
      "y2": 14500,
      "level": "warehouse"
    },
    {
      "x1": 7500,
      "y1": 17500,
      "x2": 12500,
      "y2": 17500,
      "level": "warehouse"
    },
    {
      "x1": 12500,
      "y1": 17500,
      "x2": 12500,
      "y2": 22500,
      "level": "warehouse"
    },
    {
      "x1": 7500,
      "y1": 22500,
      "x2": 12500,
      "y2": 22500,
      "level": "warehouse"
    },
    {
      "x1": 7500,
      "y1": 17500,
      "x2": 7500,
      "y2": 22500,
      "level": "warehouse"
    },
    {
      "x1": 7500,
      "y1": 19166.666666666668,
      "x2": 12500,
      "y2": 19166.666666666668,
      "level": "warehouse"
    },
    {
      "x1": 7500,
      "y1": 20833.333333333332,
      "x2": 12500,
      "y2": 20833.333333333332,
      "level": "warehouse"
    },
    {
      "x1": 10000,
      "y1": 17500,
      "x2": 10000,
      "y2": 22500,
      "level": "warehouse"
    },
    {
      "x1": 17500,
      "y1": 9500,
      "x2": 22500,
      "y2": 9500,
      "level": "warehouse"
    },
    {
      "x1": 22500,
      "y1": 9500,
      "x2": 22500,
      "y2": 14500,
      "level": "warehouse"
    },
    {
      "x1": 17500,
      "y1": 14500,
      "x2": 22500,
      "y2": 14500,
      "level": "warehouse"
    },
    {
      "x1": 17500,
      "y1": 9500,
      "x2": 17500,
      "y2": 14500,
      "level": "warehouse"
    },
    {
      "x1": 17500,
      "y1": 11166.666666666666,
      "x2": 22500,
      "y2": 11166.666666666666,
      "level": "warehouse"
    },
    {
      "x1": 17500,
      "y1": 12833.333333333334,
      "x2": 22500,
      "y2": 12833.333333333334,
      "level": "warehouse"
    },
    {
      "x1": 20000,
      "y1": 9500,
      "x2": 20000,
      "y2": 14500,
      "level": "warehouse"
    },
    {
      "x1": 17500,
      "y1": 17500,
      "x2": 22500,
      "y2": 17500,
      "level": "warehouse"
    },
    {
      "x1": 22500,
      "y1": 17500,
      "x2": 22500,
      "y2": 22500,
      "level": "warehouse"
    },
    {
      "x1": 17500,
      "y1": 22500,
      "x2": 22500,
      "y2": 22500,
      "level": "warehouse"
    },
    {
      "x1": 17500,
      "y1": 17500,
      "x2": 17500,
      "y2": 22500,
      "level": "warehouse"
    },
    {
      "x1": 17500,
      "y1": 19166.666666666668,
      "x2": 22500,
      "y2": 19166.666666666668,
      "level": "warehouse"
    },
    {
      "x1": 17500,
      "y1": 20833.333333333332,
      "x2": 22500,
      "y2": 20833.333333333332,
      "level": "warehouse"
    },
    {
      "x1": 20000,
      "y1": 17500,
      "x2": 20000,
      "y2": 22500,
      "level": "warehouse"
    },
    {
      "x1": 27500,
      "y1": 9500,
      "x2": 32500,
      "y2": 9500,
      "level": "warehouse"
    },
    {
      "x1": 32500,
      "y1": 9500,
      "x2": 32500,
      "y2": 14500,
      "level": "warehouse"
    },
    {
      "x1": 27500,
      "y1": 14500,
      "x2": 32500,
      "y2": 14500,
      "level": "warehouse"
    },
    {
      "x1": 27500,
      "y1": 9500,
      "x2": 27500,
      "y2": 14500,
      "level": "warehouse"
    },
    {
      "x1": 27500,
      "y1": 11166.666666666666,
      "x2": 32500,
      "y2": 11166.666666666666,
      "level": "warehouse"
    },
    {
      "x1": 27500,
      "y1": 12833.333333333334,
      "x2": 32500,
      "y2": 12833.333333333334,
      "level": "warehouse"
    },
    {
      "x1": 30000,
      "y1": 9500,
      "x2": 30000,
      "y2": 14500,
      "level": "warehouse"
    },
    {
      "x1": 27500,
      "y1": 17500,
      "x2": 32500,
      "y2": 17500,
      "level": "warehouse"
    },
    {
      "x1": 32500,
      "y1": 17500,
      "x2": 32500,
      "y2": 22500,
      "level": "warehouse"
    },
    {
      "x1": 27500,
      "y1": 22500,
      "x2": 32500,
      "y2": 22500,
      "level": "warehouse"
    },
    {
      "x1": 27500,
      "y1": 17500,
      "x2": 27500,
      "y2": 22500,
      "level": "warehouse"
    },
    {
      "x1": 27500,
      "y1": 19166.666666666668,
      "x2": 32500,
      "y2": 19166.666666666668,
      "level": "warehouse"
    },
    {
      "x1": 27500,
      "y1": 20833.333333333332,
      "x2": 32500,
      "y2": 20833.333333333332,
      "level": "warehouse"
    },
    {
      "x1": 30000,
      "y1": 17500,
      "x2": 30000,
      "y2": 22500,
      "level": "warehouse"
    },
    {
      "x1": 37500,
      "y1": 9500,
      "x2": 42500,
      "y2": 9500,
      "level": "warehouse"
    },
    {
      "x1": 42500,
      "y1": 9500,
      "x2": 42500,
      "y2": 14500,
      "level": "warehouse"
    },
    {
      "x1": 37500,
      "y1": 14500,
      "x2": 42500,
      "y2": 14500,
      "level": "warehouse"
    },
    {
      "x1": 37500,
      "y1": 9500,
      "x2": 37500,
      "y2": 14500,
      "level": "warehouse"
    },
    {
      "x1": 37500,
      "y1": 11166.666666666666,
      "x2": 42500,
      "y2": 11166.666666666666,
      "level": "warehouse"
    },
    {
      "x1": 37500,
      "y1": 12833.333333333334,
      "x2": 42500,
      "y2": 12833.333333333334,
      "level": "warehouse"
    },
    {
      "x1": 40000,
      "y1": 9500,
      "x2": 40000,
      "y2": 14500,
      "level": "warehouse"
    },
    {
      "x1": 37500,
      "y1": 17500,
      "x2": 42500,
      "y2": 17500,
      "level": "warehouse"
    },
    {
      "x1": 42500,
      "y1": 17500,
      "x2": 42500,
      "y2": 22500,
      "level": "warehouse"
    },
    {
      "x1": 37500,
      "y1": 22500,
      "x2": 42500,
      "y2": 22500,
      "level": "warehouse"
    },
    {
      "x1": 37500,
      "y1": 17500,
      "x2": 37500,
      "y2": 22500,
      "level": "warehouse"
    },
    {
      "x1": 37500,
      "y1": 19166.666666666668,
      "x2": 42500,
      "y2": 19166.666666666668,
      "level": "warehouse"
    },
    {
      "x1": 37500,
      "y1": 20833.333333333332,
      "x2": 42500,
      "y2": 20833.333333333332,
      "level": "warehouse"
    },
    {
      "x1": 40000,
      "y1": 17500,
      "x2": 40000,
      "y2": 22500,
      "level": "warehouse"
    },
    {
      "x1": 8000,
      "y1": 26500,
      "x2": 12000,
      "y2": 26500,
      "level": "warehouse"
    },
    {
      "x1": 12000,
      "y1": 26500,
      "x2": 12000,
      "y2": 29000,
      "level": "warehouse"
    },
    {
      "x1": 8000,
      "y1": 26500,
      "x2": 8000,
      "y2": 29000,
      "level": "warehouse"
    },
    {
      "x1": 38000,
      "y1": 26500,
      "x2": 42000,
      "y2": 26500,
      "level": "warehouse"
    },
    {
      "x1": 38000,
      "y1": 26500,
      "x2": 38000,
      "y2": 29000,
      "level": "warehouse"
    },
    {
      "x1": 42000,
      "y1": 26500,
      "x2": 42000,
      "y2": 29000,
      "level": "warehouse"
    }
  ]
};
