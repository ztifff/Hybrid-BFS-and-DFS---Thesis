export const awsWarehouseGraph = {
  "nodes": [
    {
      "id": "depot_main",
      "label": "Robot Charging Station\n(Start)",
      "type": "depot",
      "x": 25000,
      "y": 3000,
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
      "id": "dest_dock_1",
      "label": "Loading Dock 1",
      "type": "shelf",
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
      "type": "zone",
      "x": 5000,
      "y": 12000,
      "level": 1
    },
    {
      "id": "clutter_b",
      "label": "Clutter Zone B",
      "type": "zone",
      "x": 45000,
      "y": 12000,
      "level": 1
    },
    {
      "id": "pallet_jack",
      "label": "Parked Pallet Jack",
      "type": "zone",
      "x": 5000,
      "y": 20000,
      "level": 2
    },
    {
      "id": "trash_cans",
      "label": "Trash Can Area",
      "type": "zone",
      "x": 45000,
      "y": 20000,
      "level": 2
    }
  ],
  "edges": [
    {
      "id": "e_depot_main_front_mw",
      "from": "depot_main",
      "to": "front_mw",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_front_mw_depot_main",
      "from": "front_mw",
      "to": "depot_main",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_depot_main_front_me",
      "from": "depot_main",
      "to": "front_me",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_front_me_depot_main",
      "from": "front_me",
      "to": "depot_main",
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
      "id": "e_back_mw_dest_dock_1",
      "from": "back_mw",
      "to": "dest_dock_1",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_dest_dock_1_back_mw",
      "from": "dest_dock_1",
      "to": "back_mw",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_back_me_dest_dock_1",
      "from": "back_me",
      "to": "dest_dock_1",
      "latency": 15,
      "type": "path"
    },
    {
      "id": "e_dest_dock_1_back_me",
      "from": "dest_dock_1",
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
    "dest_dock_1",
    "dest_desk_b"
  ],
  "width": 50000,
  "height": 30000
};