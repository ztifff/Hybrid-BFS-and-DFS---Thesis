// ═══════════════════════════════════════════════════════════════════════════════
//  Clemens Hall – 5-Story Academic Complex (Emergency Evacuation Graph)
//
//  Based on: 3DCityNet indoor building model (Thill et al., 2011)
//  Modeled as a wide rectangular Philippine university building.
//
//  Layout (per floor):
//    - X range: 2000 to 57000 (wide building footprint)
//    - Y range: 2000 to 34000
//    - Main Spine Corridor (center): y=17000
//    - North Classroom Row: y=8000
//    - South Classroom Row: y=26000
//    - Far North Wall: y=3000  (windows/restrooms)
//    - Far South Wall: y=31000 (windows/restrooms)
//    - West Wing end: x=4000
//    - East Wing end: x=56000
//    - Columns: x = 4000, 10000, 16000, 22000, 29000, 36000, 42000, 48000, 56000
//
//  Vertical connections:
//    - West Fire Stairs (x=4000)
//    - East Fire Stairs (x=56000)
//    - Central Main Staircase (x=29000, y=17000)
//    - North Elevator Bank (x=22000, y=8000)
//    - South Elevator Bank (x=36000, y=26000)
//
//  Ground Floor (L1): 4 Emergency Exits at each wall face
//  Source: L4 Computer Lab (Room 404) — north side
// ═══════════════════════════════════════════════════════════════════════════════

export const clemensBuildingGraph = {
  nodes: [

    // ══════════════════════════════════════════════════════════════════════════
    //  L1 — GROUND FLOOR (Reception, Admin, Main Lobby, Registrar)
    // ══════════════════════════════════════════════════════════════════════════

    // 4 Ground-Level Emergency Exits (on all 4 building faces)
    { id: "exit_south_main",   label: "Main Entrance (South Exit)",   type: "emergency_exit", x: 29000, y: 34000, level: 1, buildingId: "L1" },
    { id: "exit_north_gate",   label: "North Gate Exit",              type: "emergency_exit", x: 29000, y:  2000, level: 1, buildingId: "L1" },
    { id: "exit_west_fire",    label: "West Fire Exit (Ground)",      type: "emergency_exit", x:  2000, y: 17000, level: 1, buildingId: "L1" },
    { id: "exit_east_fire",    label: "East Fire Exit (Ground)",      type: "emergency_exit", x: 56000, y: 17000, level: 1, buildingId: "L1" },

    // Main Spine Corridor (y=17000, horizontal)
    { id: "l1_spine_w1",   label: "L1 West Lobby",              type: "corridor", x:  4000, y: 17000, level: 1, buildingId: "L1" },
    { id: "l1_spine_w2",   label: "L1 Main Hall West",          type: "corridor", x: 10000, y: 17000, level: 1, buildingId: "L1" },
    { id: "l1_spine_w3",   label: "L1 Main Hall Center-West",   type: "corridor", x: 16000, y: 17000, level: 1, buildingId: "L1" },
    { id: "l1_spine_c",    label: "L1 Grand Lobby",             type: "corridor", x: 22000, y: 17000, level: 1, buildingId: "L1" },
    { id: "l1_spine_mid",  label: "L1 Central Atrium",          type: "corridor", x: 29000, y: 17000, level: 1, buildingId: "L1" },
    { id: "l1_spine_e3",   label: "L1 Main Hall Center-East",   type: "corridor", x: 36000, y: 17000, level: 1, buildingId: "L1" },
    { id: "l1_spine_e2",   label: "L1 Main Hall East",          type: "corridor", x: 42000, y: 17000, level: 1, buildingId: "L1" },
    { id: "l1_spine_e1",   label: "L1 East Lobby",              type: "corridor", x: 48000, y: 17000, level: 1, buildingId: "L1" },
    { id: "l1_spine_ef",   label: "L1 East Hall Far",           type: "corridor", x: 56000, y: 17000, level: 1, buildingId: "L1" },

    // North Corridor (y=8000)
    { id: "l1_north_w1",  label: "L1 North-West Hall",          type: "corridor", x:  4000, y:  8000, level: 1, buildingId: "L1" },
    { id: "l1_north_w2",  label: "L1 North Hall Wing-A",        type: "corridor", x: 10000, y:  8000, level: 1, buildingId: "L1" },
    { id: "l1_north_c",   label: "L1 North Hall Center",        type: "corridor", x: 22000, y:  8000, level: 1, buildingId: "L1" },
    { id: "l1_north_mid", label: "L1 North Annex",              type: "corridor", x: 29000, y:  8000, level: 1, buildingId: "L1" },
    { id: "l1_north_e",   label: "L1 North Hall East",          type: "corridor", x: 36000, y:  8000, level: 1, buildingId: "L1" },
    { id: "l1_north_ef",  label: "L1 North-East Hall",          type: "corridor", x: 48000, y:  8000, level: 1, buildingId: "L1" },

    // South Corridor (y=26000)
    { id: "l1_south_w1",  label: "L1 South-West Hall",          type: "corridor", x:  4000, y: 26000, level: 1, buildingId: "L1" },
    { id: "l1_south_w2",  label: "L1 South Hall Wing-A",        type: "corridor", x: 10000, y: 26000, level: 1, buildingId: "L1" },
    { id: "l1_south_c",   label: "L1 South Hall Center",        type: "corridor", x: 22000, y: 26000, level: 1, buildingId: "L1" },
    { id: "l1_south_mid", label: "L1 South Concourse",          type: "corridor", x: 29000, y: 26000, level: 1, buildingId: "L1" },
    { id: "l1_south_e",   label: "L1 South Hall East",          type: "corridor", x: 36000, y: 26000, level: 1, buildingId: "L1" },
    { id: "l1_south_ef",  label: "L1 South-East Hall",          type: "corridor", x: 48000, y: 26000, level: 1, buildingId: "L1" },

    // Rooms / Places (Ground Floor)
    { id: "l1_registrar",      label: "Office of the Registrar",   type: "place",     x: 10000, y:  3000, level: 1, buildingId: "L1" },
    { id: "l1_admission",      label: "Admissions Office",         type: "place",     x: 22000, y:  3000, level: 1, buildingId: "L1" },
    { id: "l1_room101",        label: "Room 101 – Lecture Hall",   type: "place",     x: 36000, y:  3000, level: 1, buildingId: "L1" },
    { id: "l1_cafeteria",      label: "Student Cafeteria",         type: "place",     x: 10000, y: 31000, level: 1, buildingId: "L1" },
    { id: "l1_bookstore",      label: "University Bookstore",      type: "place",     x: 22000, y: 31000, level: 1, buildingId: "L1" },
    { id: "l1_room102",        label: "Room 102 – Lecture Hall",   type: "place",     x: 36000, y: 31000, level: 1, buildingId: "L1" },
    { id: "l1_guard_post",     label: "Security Guard Post",       type: "place",     x: 48000, y: 31000, level: 1, buildingId: "L1" },
    { id: "l1_restroom_n",     label: "L1 Restroom (North)",       type: "place",     x: 48000, y:  3000, level: 1, buildingId: "L1" },

    // Vertical Access (L1)
    { id: "stair_w_1",    label: "West Fire Stairs (L1)",          type: "stairwell", x:  4000, y: 12000, level: 1, buildingId: "L1" },
    { id: "stair_e_1",    label: "East Fire Stairs (L1)",          type: "stairwell", x: 56000, y: 12000, level: 1, buildingId: "L1" },
    { id: "stair_main_1", label: "Main Staircase (L1)",            type: "stairwell", x: 29000, y: 22000, level: 1, buildingId: "L1" },
    { id: "elev_n_1",     label: "North Elevator (L1)",            type: "stairwell", x: 16000, y:  8000, level: 1, buildingId: "L1" },
    { id: "elev_s_1",     label: "South Elevator (L1)",            type: "stairwell", x: 42000, y: 26000, level: 1, buildingId: "L1" },


    // ══════════════════════════════════════════════════════════════════════════
    //  L2 — 2ND FLOOR (General Education, Liberal Arts, Student Council)
    // ══════════════════════════════════════════════════════════════════════════

    // Main Spine Corridor
    { id: "l2_spine_w1",   label: "L2 West Hallway",             type: "corridor", x:  4000, y: 17000, level: 2, buildingId: "L2" },
    { id: "l2_spine_w2",   label: "L2 Main Hall West",           type: "corridor", x: 10000, y: 17000, level: 2, buildingId: "L2" },
    { id: "l2_spine_w3",   label: "L2 Main Hall Ctr-West",       type: "corridor", x: 16000, y: 17000, level: 2, buildingId: "L2" },
    { id: "l2_spine_c",    label: "L2 Center Hall",              type: "corridor", x: 22000, y: 17000, level: 2, buildingId: "L2" },
    { id: "l2_spine_mid",  label: "L2 Main Hub",                 type: "corridor", x: 29000, y: 17000, level: 2, buildingId: "L2" },
    { id: "l2_spine_e3",   label: "L2 Main Hall Ctr-East",       type: "corridor", x: 36000, y: 17000, level: 2, buildingId: "L2" },
    { id: "l2_spine_e2",   label: "L2 Main Hall East",           type: "corridor", x: 42000, y: 17000, level: 2, buildingId: "L2" },
    { id: "l2_spine_e1",   label: "L2 East Hallway",             type: "corridor", x: 48000, y: 17000, level: 2, buildingId: "L2" },
    { id: "l2_spine_ef",   label: "L2 East Hall Far",            type: "corridor", x: 56000, y: 17000, level: 2, buildingId: "L2" },

    // North Corridor (y=8000)
    { id: "l2_north_w1",  label: "L2 North-West Hall",           type: "corridor", x:  4000, y:  8000, level: 2, buildingId: "L2" },
    { id: "l2_north_w2",  label: "L2 North Hall Wing-A",         type: "corridor", x: 10000, y:  8000, level: 2, buildingId: "L2" },
    { id: "l2_north_c",   label: "L2 North Hall Center",         type: "corridor", x: 22000, y:  8000, level: 2, buildingId: "L2" },
    { id: "l2_north_mid", label: "L2 North Annex",               type: "corridor", x: 29000, y:  8000, level: 2, buildingId: "L2" },
    { id: "l2_north_e",   label: "L2 North Hall East",           type: "corridor", x: 36000, y:  8000, level: 2, buildingId: "L2" },
    { id: "l2_north_ef",  label: "L2 North-East Hall",           type: "corridor", x: 48000, y:  8000, level: 2, buildingId: "L2" },

    // South Corridor (y=26000)
    { id: "l2_south_w1",  label: "L2 South-West Hall",           type: "corridor", x:  4000, y: 26000, level: 2, buildingId: "L2" },
    { id: "l2_south_w2",  label: "L2 South Hall Wing-A",         type: "corridor", x: 10000, y: 26000, level: 2, buildingId: "L2" },
    { id: "l2_south_c",   label: "L2 South Hall Center",         type: "corridor", x: 22000, y: 26000, level: 2, buildingId: "L2" },
    { id: "l2_south_mid", label: "L2 South Concourse",           type: "corridor", x: 29000, y: 26000, level: 2, buildingId: "L2" },
    { id: "l2_south_e",   label: "L2 South Hall East",           type: "corridor", x: 36000, y: 26000, level: 2, buildingId: "L2" },
    { id: "l2_south_ef",  label: "L2 South-East Hall",           type: "corridor", x: 48000, y: 26000, level: 2, buildingId: "L2" },

    // Rooms / Places (2nd Floor)
    { id: "l2_room201",   label: "Room 201 – English",           type: "place",     x: 10000, y:  3000, level: 2, buildingId: "L2" },
    { id: "l2_room202",   label: "Room 202 – Filipino",          type: "place",     x: 22000, y:  3000, level: 2, buildingId: "L2" },
    { id: "l2_room203",   label: "Room 203 – Social Science",    type: "place",     x: 36000, y:  3000, level: 2, buildingId: "L2" },
    { id: "l2_room204",   label: "Room 204 – Humanities",        type: "place",     x: 48000, y:  3000, level: 2, buildingId: "L2" },
    { id: "l2_room205",   label: "Room 205 – NSTP Office",       type: "place",     x: 10000, y: 31000, level: 2, buildingId: "L2" },
    { id: "l2_room206",   label: "Room 206 – Guidance Office",   type: "place",     x: 22000, y: 31000, level: 2, buildingId: "L2" },
    { id: "l2_council",   label: "Student Council Office",       type: "place",     x: 36000, y: 31000, level: 2, buildingId: "L2" },
    { id: "l2_restroom_n", label: "L2 Restroom (North)",         type: "place",     x: 48000, y: 31000, level: 2, buildingId: "L2" },

    // Vertical Access (L2)
    { id: "stair_w_2",    label: "West Fire Stairs (L2)",         type: "stairwell", x:  4000, y: 12000, level: 2, buildingId: "L2" },
    { id: "stair_e_2",    label: "East Fire Stairs (L2)",         type: "stairwell", x: 56000, y: 12000, level: 2, buildingId: "L2" },
    { id: "stair_main_2", label: "Main Staircase (L2)",           type: "stairwell", x: 29000, y: 22000, level: 2, buildingId: "L2" },
    { id: "elev_n_2",     label: "North Elevator (L2)",           type: "stairwell", x: 16000, y:  8000, level: 2, buildingId: "L2" },
    { id: "elev_s_2",     label: "South Elevator (L2)",           type: "stairwell", x: 42000, y: 26000, level: 2, buildingId: "L2" },


    // ══════════════════════════════════════════════════════════════════════════
    //  L3 — 3RD FLOOR (Engineering, Architecture, Mathematics)
    // ══════════════════════════════════════════════════════════════════════════

    // Main Spine Corridor
    { id: "l3_spine_w1",   label: "L3 West Hallway",             type: "corridor", x:  4000, y: 17000, level: 3, buildingId: "L3" },
    { id: "l3_spine_w2",   label: "L3 Main Hall West",           type: "corridor", x: 10000, y: 17000, level: 3, buildingId: "L3" },
    { id: "l3_spine_w3",   label: "L3 Main Hall Ctr-West",       type: "corridor", x: 16000, y: 17000, level: 3, buildingId: "L3" },
    { id: "l3_spine_c",    label: "L3 Center Hall",              type: "corridor", x: 22000, y: 17000, level: 3, buildingId: "L3" },
    { id: "l3_spine_mid",  label: "L3 Main Hub",                 type: "corridor", x: 29000, y: 17000, level: 3, buildingId: "L3" },
    { id: "l3_spine_e3",   label: "L3 Main Hall Ctr-East",       type: "corridor", x: 36000, y: 17000, level: 3, buildingId: "L3" },
    { id: "l3_spine_e2",   label: "L3 Main Hall East",           type: "corridor", x: 42000, y: 17000, level: 3, buildingId: "L3" },
    { id: "l3_spine_e1",   label: "L3 East Hallway",             type: "corridor", x: 48000, y: 17000, level: 3, buildingId: "L3" },
    { id: "l3_spine_ef",   label: "L3 East Hall Far",            type: "corridor", x: 56000, y: 17000, level: 3, buildingId: "L3" },

    // North Corridor (y=8000)
    { id: "l3_north_w1",  label: "L3 North-West Hall",           type: "corridor", x:  4000, y:  8000, level: 3, buildingId: "L3" },
    { id: "l3_north_w2",  label: "L3 North Hall Wing-A",         type: "corridor", x: 10000, y:  8000, level: 3, buildingId: "L3" },
    { id: "l3_north_c",   label: "L3 North Hall Center",         type: "corridor", x: 22000, y:  8000, level: 3, buildingId: "L3" },
    { id: "l3_north_mid", label: "L3 North Annex",               type: "corridor", x: 29000, y:  8000, level: 3, buildingId: "L3" },
    { id: "l3_north_e",   label: "L3 North Hall East",           type: "corridor", x: 36000, y:  8000, level: 3, buildingId: "L3" },
    { id: "l3_north_ef",  label: "L3 North-East Hall",           type: "corridor", x: 48000, y:  8000, level: 3, buildingId: "L3" },

    // South Corridor (y=26000)
    { id: "l3_south_w1",  label: "L3 South-West Hall",           type: "corridor", x:  4000, y: 26000, level: 3, buildingId: "L3" },
    { id: "l3_south_w2",  label: "L3 South Hall Wing-A",         type: "corridor", x: 10000, y: 26000, level: 3, buildingId: "L3" },
    { id: "l3_south_c",   label: "L3 South Hall Center",         type: "corridor", x: 22000, y: 26000, level: 3, buildingId: "L3" },
    { id: "l3_south_mid", label: "L3 South Concourse",           type: "corridor", x: 29000, y: 26000, level: 3, buildingId: "L3" },
    { id: "l3_south_e",   label: "L3 South Hall East",           type: "corridor", x: 36000, y: 26000, level: 3, buildingId: "L3" },
    { id: "l3_south_ef",  label: "L3 South-East Hall",           type: "corridor", x: 48000, y: 26000, level: 3, buildingId: "L3" },

    // Rooms / Places (3rd Floor)
    { id: "l3_room301",   label: "Room 301 – Engineering Math",  type: "place",     x: 10000, y:  3000, level: 3, buildingId: "L3" },
    { id: "l3_room302",   label: "Room 302 – Calculus",          type: "place",     x: 22000, y:  3000, level: 3, buildingId: "L3" },
    { id: "l3_room303",   label: "Room 303 – Differential Eq.",  type: "place",     x: 36000, y:  3000, level: 3, buildingId: "L3" },
    { id: "l3_room304",   label: "Room 304 – Statistics",        type: "place",     x: 48000, y:  3000, level: 3, buildingId: "L3" },
    { id: "l3_room305",   label: "Room 305 – Architecture Lab",  type: "place",     x: 10000, y: 31000, level: 3, buildingId: "L3" },
    { id: "l3_room306",   label: "Room 306 – Drafting Room",     type: "place",     x: 22000, y: 31000, level: 3, buildingId: "L3" },
    { id: "l3_room307",   label: "Room 307 – Engineering Lab",   type: "place",     x: 36000, y: 31000, level: 3, buildingId: "L3" },
    { id: "l3_restroom",  label: "L3 Restroom",                  type: "place",     x: 48000, y: 31000, level: 3, buildingId: "L3" },

    // Vertical Access (L3)
    { id: "stair_w_3",    label: "West Fire Stairs (L3)",         type: "stairwell", x:  4000, y: 12000, level: 3, buildingId: "L3" },
    { id: "stair_e_3",    label: "East Fire Stairs (L3)",         type: "stairwell", x: 56000, y: 12000, level: 3, buildingId: "L3" },
    { id: "stair_main_3", label: "Main Staircase (L3)",           type: "stairwell", x: 29000, y: 22000, level: 3, buildingId: "L3" },
    { id: "elev_n_3",     label: "North Elevator (L3)",           type: "stairwell", x: 16000, y:  8000, level: 3, buildingId: "L3" },
    { id: "elev_s_3",     label: "South Elevator (L3)",           type: "stairwell", x: 42000, y: 26000, level: 3, buildingId: "L3" },


    // ══════════════════════════════════════════════════════════════════════════
    //  L4 — 4TH FLOOR (Computer Science, IT Labs, Research Center)
    //  ★ SOURCE FLOOR – Evacuation starts from Room 404 (Computer Lab)
    // ══════════════════════════════════════════════════════════════════════════

    // Main Spine Corridor
    { id: "l4_spine_w1",   label: "L4 West Hallway",             type: "corridor", x:  4000, y: 17000, level: 4, buildingId: "L4" },
    { id: "l4_spine_w2",   label: "L4 Main Hall West",           type: "corridor", x: 10000, y: 17000, level: 4, buildingId: "L4" },
    { id: "l4_spine_w3",   label: "L4 Main Hall Ctr-West",       type: "corridor", x: 16000, y: 17000, level: 4, buildingId: "L4" },
    { id: "l4_spine_c",    label: "L4 Center Hall",              type: "corridor", x: 22000, y: 17000, level: 4, buildingId: "L4" },
    { id: "l4_spine_mid",  label: "L4 Main Hub",                 type: "corridor", x: 29000, y: 17000, level: 4, buildingId: "L4" },
    { id: "l4_spine_e3",   label: "L4 Main Hall Ctr-East",       type: "corridor", x: 36000, y: 17000, level: 4, buildingId: "L4" },
    { id: "l4_spine_e2",   label: "L4 Main Hall East",           type: "corridor", x: 42000, y: 17000, level: 4, buildingId: "L4" },
    { id: "l4_spine_e1",   label: "L4 East Hallway",             type: "corridor", x: 48000, y: 17000, level: 4, buildingId: "L4" },
    { id: "l4_spine_ef",   label: "L4 East Hall Far",            type: "corridor", x: 56000, y: 17000, level: 4, buildingId: "L4" },

    // North Corridor (y=8000)
    { id: "l4_north_w1",  label: "L4 North-West Hall",           type: "corridor", x:  4000, y:  8000, level: 4, buildingId: "L4" },
    { id: "l4_north_w2",  label: "L4 North Hall Wing-A",         type: "corridor", x: 10000, y:  8000, level: 4, buildingId: "L4" },
    { id: "l4_north_c",   label: "L4 North Hall Center",         type: "corridor", x: 22000, y:  8000, level: 4, buildingId: "L4" },
    { id: "l4_north_mid", label: "L4 North Annex",               type: "corridor", x: 29000, y:  8000, level: 4, buildingId: "L4" },
    { id: "l4_north_e",   label: "L4 North Hall East",           type: "corridor", x: 36000, y:  8000, level: 4, buildingId: "L4" },
    { id: "l4_north_ef",  label: "L4 North-East Hall",           type: "corridor", x: 48000, y:  8000, level: 4, buildingId: "L4" },

    // South Corridor (y=26000)
    { id: "l4_south_w1",  label: "L4 South-West Hall",           type: "corridor", x:  4000, y: 26000, level: 4, buildingId: "L4" },
    { id: "l4_south_w2",  label: "L4 South Hall Wing-A",         type: "corridor", x: 10000, y: 26000, level: 4, buildingId: "L4" },
    { id: "l4_south_c",   label: "L4 South Hall Center",         type: "corridor", x: 22000, y: 26000, level: 4, buildingId: "L4" },
    { id: "l4_south_mid", label: "L4 South Concourse",           type: "corridor", x: 29000, y: 26000, level: 4, buildingId: "L4" },
    { id: "l4_south_e",   label: "L4 South Hall East",           type: "corridor", x: 36000, y: 26000, level: 4, buildingId: "L4" },
    { id: "l4_south_ef",  label: "L4 South-East Hall",           type: "corridor", x: 48000, y: 26000, level: 4, buildingId: "L4" },

    // Rooms / Places (4th Floor — Computer Science / IT)
    { id: "l4_room401",   label: "Room 401 – Data Structures",   type: "place",     x: 10000, y:  3000, level: 4, buildingId: "L4" },
    { id: "l4_room402",   label: "Room 402 – Algorithms",        type: "place",     x: 22000, y:  3000, level: 4, buildingId: "L4" },
    { id: "l4_room403",   label: "Room 403 – OS Lab",            type: "place",     x: 36000, y:  3000, level: 4, buildingId: "L4" },
    { id: "l4_room404",   label: "Room 404 – Computer Lab",   type: "place",    x: 48000, y:  3000, level: 4, buildingId: "L4" },
    { id: "l4_room405",   label: "Room 405 – Networking Lab",    type: "place",     x: 10000, y: 31000, level: 4, buildingId: "L4" },
    { id: "l4_room406",   label: "Room 406 – Database Lab",      type: "place",     x: 22000, y: 31000, level: 4, buildingId: "L4" },
    { id: "l4_room407",   label: "Room 407 – Research Center",   type: "place",     x: 36000, y: 31000, level: 4, buildingId: "L4" },
    { id: "l4_restroom",  label: "L4 Restroom",                  type: "place",     x: 48000, y: 31000, level: 4, buildingId: "L4" },

    // Vertical Access (L4)
    { id: "stair_w_4",    label: "West Fire Stairs (L4)",         type: "stairwell", x:  4000, y: 12000, level: 4, buildingId: "L4" },
    { id: "stair_e_4",    label: "East Fire Stairs (L4)",         type: "stairwell", x: 56000, y: 12000, level: 4, buildingId: "L4" },
    { id: "stair_main_4", label: "Main Staircase (L4)",           type: "stairwell", x: 29000, y: 22000, level: 4, buildingId: "L4" },
    { id: "elev_n_4",     label: "North Elevator (L4)",           type: "stairwell", x: 16000, y:  8000, level: 4, buildingId: "L4" },
    { id: "elev_s_4",     label: "South Elevator (L4)",           type: "stairwell", x: 42000, y: 26000, level: 4, buildingId: "L4" },


    // ══════════════════════════════════════════════════════════════════════════
    //  L5 — 5TH FLOOR (Executive Offices, Conference Halls, Dean's Suite)
    // ══════════════════════════════════════════════════════════════════════════

    // Main Spine Corridor
    { id: "l5_spine_w1",   label: "L5 West Hallway",             type: "corridor", x:  4000, y: 17000, level: 5, buildingId: "L5" },
    { id: "l5_spine_w2",   label: "L5 Main Hall West",           type: "corridor", x: 10000, y: 17000, level: 5, buildingId: "L5" },
    { id: "l5_spine_w3",   label: "L5 Main Hall Ctr-West",       type: "corridor", x: 16000, y: 17000, level: 5, buildingId: "L5" },
    { id: "l5_spine_c",    label: "L5 Center Hall",              type: "corridor", x: 22000, y: 17000, level: 5, buildingId: "L5" },
    { id: "l5_spine_mid",  label: "L5 Main Hub",                 type: "corridor", x: 29000, y: 17000, level: 5, buildingId: "L5" },
    { id: "l5_spine_e3",   label: "L5 Main Hall Ctr-East",       type: "corridor", x: 36000, y: 17000, level: 5, buildingId: "L5" },
    { id: "l5_spine_e2",   label: "L5 Main Hall East",           type: "corridor", x: 42000, y: 17000, level: 5, buildingId: "L5" },
    { id: "l5_spine_e1",   label: "L5 East Hallway",             type: "corridor", x: 48000, y: 17000, level: 5, buildingId: "L5" },
    { id: "l5_spine_ef",   label: "L5 East Hall Far",            type: "corridor", x: 56000, y: 17000, level: 5, buildingId: "L5" },

    // North Corridor (y=8000)
    { id: "l5_north_w1",  label: "L5 North-West Hall",           type: "corridor", x:  4000, y:  8000, level: 5, buildingId: "L5" },
    { id: "l5_north_w2",  label: "L5 North Hall Wing-A",         type: "corridor", x: 10000, y:  8000, level: 5, buildingId: "L5" },
    { id: "l5_north_c",   label: "L5 North Hall Center",         type: "corridor", x: 22000, y:  8000, level: 5, buildingId: "L5" },
    { id: "l5_north_mid", label: "L5 North Annex",               type: "corridor", x: 29000, y:  8000, level: 5, buildingId: "L5" },
    { id: "l5_north_e",   label: "L5 North Hall East",           type: "corridor", x: 36000, y:  8000, level: 5, buildingId: "L5" },
    { id: "l5_north_ef",  label: "L5 North-East Hall",           type: "corridor", x: 48000, y:  8000, level: 5, buildingId: "L5" },

    // South Corridor (y=26000)
    { id: "l5_south_w1",  label: "L5 South-West Hall",           type: "corridor", x:  4000, y: 26000, level: 5, buildingId: "L5" },
    { id: "l5_south_w2",  label: "L5 South Hall Wing-A",         type: "corridor", x: 10000, y: 26000, level: 5, buildingId: "L5" },
    { id: "l5_south_c",   label: "L5 South Hall Center",         type: "corridor", x: 22000, y: 26000, level: 5, buildingId: "L5" },
    { id: "l5_south_mid", label: "L5 South Concourse",           type: "corridor", x: 29000, y: 26000, level: 5, buildingId: "L5" },
    { id: "l5_south_e",   label: "L5 South Hall East",           type: "corridor", x: 36000, y: 26000, level: 5, buildingId: "L5" },
    { id: "l5_south_ef",  label: "L5 South-East Hall",           type: "corridor", x: 48000, y: 26000, level: 5, buildingId: "L5" },

    // Rooms / Places (5th Floor — Executive / Admin)
    { id: "l5_room501",   label: "Room 501 – Board Room A",      type: "place",     x: 10000, y:  3000, level: 5, buildingId: "L5" },
    { id: "l5_room502",   label: "Room 502 – Board Room B",      type: "place",     x: 22000, y:  3000, level: 5, buildingId: "L5" },
    { id: "l5_room503",   label: "Room 503 – VP Academic",       type: "place",     x: 36000, y:  3000, level: 5, buildingId: "L5" },
    { id: "l5_room504",   label: "Room 504 – University President",type: "place",   x: 48000, y:  3000, level: 5, buildingId: "L5" },
    { id: "l5_room505",   label: "Room 505 – Conference Hall A", type: "place",     x: 10000, y: 31000, level: 5, buildingId: "L5" },
    { id: "l5_room506",   label: "Room 506 – Conference Hall B", type: "place",     x: 22000, y: 31000, level: 5, buildingId: "L5" },
    { id: "l5_dean",      label: "Dean's Executive Office",      type: "place",     x: 36000, y: 31000, level: 5, buildingId: "L5" },
    { id: "l5_restroom",  label: "L5 Restroom",                  type: "place",     x: 48000, y: 31000, level: 5, buildingId: "L5" },

    // Vertical Access (L5)
    { id: "stair_w_5",    label: "West Fire Stairs (L5)",         type: "stairwell", x:  4000, y: 12000, level: 5, buildingId: "L5" },
    { id: "stair_e_5",    label: "East Fire Stairs (L5)",         type: "stairwell", x: 56000, y: 12000, level: 5, buildingId: "L5" },
    { id: "stair_main_5", label: "Main Staircase (L5)",           type: "stairwell", x: 29000, y: 22000, level: 5, buildingId: "L5" },
    { id: "elev_n_5",     label: "North Elevator (L5)",           type: "stairwell", x: 16000, y:  8000, level: 5, buildingId: "L5" },
    { id: "elev_s_5",     label: "South Elevator (L5)",           type: "stairwell", x: 42000, y: 26000, level: 5, buildingId: "L5" },

  ],

  edges: [

    // ══════════════════════════════════════════════════════════════════════════
    //  HELPER: generate_floor_edges for each floor
    //  Pattern: spine ↔ north/south corridors via vertical links
    //           rooms connect to nearest corridor node
    // ══════════════════════════════════════════════════════════════════════════

    // ─── L1 SPINE (horizontal main corridor) ─────────────────────────────────
    { id: "l1_s_w1_w2",  from: "l1_spine_w1",  to: "l1_spine_w2",  latency: 10, type: "path" },
    { id: "l1_s_w2_w3",  from: "l1_spine_w2",  to: "l1_spine_w3",  latency: 10, type: "path" },
    { id: "l1_s_w3_c",   from: "l1_spine_w3",  to: "l1_spine_c",   latency: 10, type: "path" },
    { id: "l1_s_c_mid",  from: "l1_spine_c",   to: "l1_spine_mid", latency: 10, type: "path" },
    { id: "l1_s_mid_e3", from: "l1_spine_mid", to: "l1_spine_e3",  latency: 10, type: "path" },
    { id: "l1_s_e3_e2",  from: "l1_spine_e3",  to: "l1_spine_e2",  latency: 10, type: "path" },
    { id: "l1_s_e2_e1",  from: "l1_spine_e2",  to: "l1_spine_e1",  latency: 10, type: "path" },
    { id: "l1_s_e1_ef",  from: "l1_spine_e1",  to: "l1_spine_ef",  latency: 10, type: "path" },

    // ─── L1 NORTH corridor (horizontal) ──────────────────────────────────────
    { id: "l1_n_w1_w2",  from: "l1_north_w1",  to: "l1_north_w2",  latency: 10, type: "path" },
    { id: "l1_n_w2_c",   from: "l1_north_w2",  to: "l1_north_c",   latency: 15, type: "path" },
    { id: "l1_n_c_mid",  from: "l1_north_c",   to: "l1_north_mid", latency: 10, type: "path" },
    { id: "l1_n_mid_e",  from: "l1_north_mid", to: "l1_north_e",   latency: 10, type: "path" },
    { id: "l1_n_e_ef",   from: "l1_north_e",   to: "l1_north_ef",  latency: 15, type: "path" },

    // ─── L1 SOUTH corridor (horizontal) ──────────────────────────────────────
    { id: "l1_so_w1_w2", from: "l1_south_w1",  to: "l1_south_w2",  latency: 10, type: "path" },
    { id: "l1_so_w2_c",  from: "l1_south_w2",  to: "l1_south_c",   latency: 15, type: "path" },
    { id: "l1_so_c_mid", from: "l1_south_c",   to: "l1_south_mid", latency: 10, type: "path" },
    { id: "l1_so_mid_e", from: "l1_south_mid", to: "l1_south_e",   latency: 10, type: "path" },
    { id: "l1_so_e_ef",  from: "l1_south_e",   to: "l1_south_ef",  latency: 15, type: "path" },

    // ─── L1 VERTICAL links (spine ↔ north/south) ─────────────────────────────
    { id: "l1_v_w1_nw1",  from: "l1_spine_w1",  to: "l1_north_w1",  latency: 12, type: "path" },
    { id: "l1_v_w1_sw1",  from: "l1_spine_w1",  to: "l1_south_w1",  latency: 12, type: "path" },
    { id: "l1_v_w2_nw2",  from: "l1_spine_w2",  to: "l1_north_w2",  latency: 12, type: "path" },
    { id: "l1_v_w2_sw2",  from: "l1_spine_w2",  to: "l1_south_w2",  latency: 12, type: "path" },
    { id: "l1_v_c_nc",    from: "l1_spine_c",   to: "l1_north_c",   latency: 12, type: "path" },
    { id: "l1_v_c_sc",    from: "l1_spine_c",   to: "l1_south_c",   latency: 12, type: "path" },
    { id: "l1_v_mid_nm",  from: "l1_spine_mid", to: "l1_north_mid", latency: 12, type: "path" },
    { id: "l1_v_mid_sm",  from: "l1_spine_mid", to: "l1_south_mid", latency: 12, type: "path" },
    { id: "l1_v_e3_ne",   from: "l1_spine_e3",  to: "l1_north_e",   latency: 12, type: "path" },
    { id: "l1_v_e3_se",   from: "l1_spine_e3",  to: "l1_south_e",   latency: 12, type: "path" },
    { id: "l1_v_e1_nef",  from: "l1_spine_e1",  to: "l1_north_ef",  latency: 12, type: "path" },
    { id: "l1_v_e1_sef",  from: "l1_spine_e1",  to: "l1_south_ef",  latency: 12, type: "path" },

    // ─── L1 EXITS ────────────────────────────────────────────────────────────
    { id: "l1_exit_s",    from: "l1_south_mid", to: "exit_south_main", latency: 5, type: "path" },
    { id: "l1_exit_n",    from: "l1_north_mid", to: "exit_north_gate", latency: 5, type: "path" },
    { id: "l1_exit_w",    from: "l1_spine_w1",  to: "exit_west_fire",  latency: 5, type: "path" },
    { id: "l1_exit_e",    from: "l1_spine_ef",  to: "exit_east_fire",  latency: 5, type: "path" },

    // ─── L1 ROOMS connected to nearest corridor ───────────────────────────────
    { id: "l1_r_registrar", from: "l1_north_w2",  to: "l1_registrar",  latency: 8, type: "path" },
    { id: "l1_r_admission", from: "l1_north_c",   to: "l1_admission",  latency: 8, type: "path" },
    { id: "l1_r_room101",   from: "l1_north_e",   to: "l1_room101",    latency: 8, type: "path" },
    { id: "l1_r_cafeteria", from: "l1_south_w2",  to: "l1_cafeteria",  latency: 8, type: "path" },
    { id: "l1_r_bookstore", from: "l1_south_c",   to: "l1_bookstore",  latency: 8, type: "path" },
    { id: "l1_r_room102",   from: "l1_south_e",   to: "l1_room102",    latency: 8, type: "path" },
    { id: "l1_r_guard",     from: "l1_south_ef",  to: "l1_guard_post", latency: 8, type: "path" },
    { id: "l1_r_restN",     from: "l1_north_ef",  to: "l1_restroom_n", latency: 8, type: "path" },

    // ─── L1 STAIRWELLS + ELEVATORS ────────────────────────────────────────────
    { id: "l1_sw_w",    from: "l1_spine_w1",  to: "stair_w_1",    latency: 6, type: "path" },
    { id: "l1_sw_e",    from: "l1_spine_ef",  to: "stair_e_1",    latency: 6, type: "path" },
    { id: "l1_sw_main", from: "l1_spine_mid", to: "stair_main_1", latency: 6, type: "path" },
    { id: "l1_el_n",    from: "l1_north_c",   to: "elev_n_1",     latency: 4, type: "path" },
    { id: "l1_el_s",    from: "l1_south_e",   to: "elev_s_1",     latency: 4, type: "path" },


    // ─── L2 SPINE ─────────────────────────────────────────────────────────────
    { id: "l2_s_w1_w2",  from: "l2_spine_w1",  to: "l2_spine_w2",  latency: 10, type: "path" },
    { id: "l2_s_w2_w3",  from: "l2_spine_w2",  to: "l2_spine_w3",  latency: 10, type: "path" },
    { id: "l2_s_w3_c",   from: "l2_spine_w3",  to: "l2_spine_c",   latency: 10, type: "path" },
    { id: "l2_s_c_mid",  from: "l2_spine_c",   to: "l2_spine_mid", latency: 10, type: "path" },
    { id: "l2_s_mid_e3", from: "l2_spine_mid", to: "l2_spine_e3",  latency: 10, type: "path" },
    { id: "l2_s_e3_e2",  from: "l2_spine_e3",  to: "l2_spine_e2",  latency: 10, type: "path" },
    { id: "l2_s_e2_e1",  from: "l2_spine_e2",  to: "l2_spine_e1",  latency: 10, type: "path" },
    { id: "l2_s_e1_ef",  from: "l2_spine_e1",  to: "l2_spine_ef",  latency: 10, type: "path" },

    // ─── L2 NORTH corridor ───────────────────────────────────────────────────
    { id: "l2_n_w1_w2",  from: "l2_north_w1",  to: "l2_north_w2",  latency: 10, type: "path" },
    { id: "l2_n_w2_c",   from: "l2_north_w2",  to: "l2_north_c",   latency: 15, type: "path" },
    { id: "l2_n_c_mid",  from: "l2_north_c",   to: "l2_north_mid", latency: 10, type: "path" },
    { id: "l2_n_mid_e",  from: "l2_north_mid", to: "l2_north_e",   latency: 10, type: "path" },
    { id: "l2_n_e_ef",   from: "l2_north_e",   to: "l2_north_ef",  latency: 15, type: "path" },

    // ─── L2 SOUTH corridor ───────────────────────────────────────────────────
    { id: "l2_so_w1_w2", from: "l2_south_w1",  to: "l2_south_w2",  latency: 10, type: "path" },
    { id: "l2_so_w2_c",  from: "l2_south_w2",  to: "l2_south_c",   latency: 15, type: "path" },
    { id: "l2_so_c_mid", from: "l2_south_c",   to: "l2_south_mid", latency: 10, type: "path" },
    { id: "l2_so_mid_e", from: "l2_south_mid", to: "l2_south_e",   latency: 10, type: "path" },
    { id: "l2_so_e_ef",  from: "l2_south_e",   to: "l2_south_ef",  latency: 15, type: "path" },

    // ─── L2 VERTICAL links ───────────────────────────────────────────────────
    { id: "l2_v_w1_nw1",  from: "l2_spine_w1",  to: "l2_north_w1",  latency: 12, type: "path" },
    { id: "l2_v_w1_sw1",  from: "l2_spine_w1",  to: "l2_south_w1",  latency: 12, type: "path" },
    { id: "l2_v_w2_nw2",  from: "l2_spine_w2",  to: "l2_north_w2",  latency: 12, type: "path" },
    { id: "l2_v_w2_sw2",  from: "l2_spine_w2",  to: "l2_south_w2",  latency: 12, type: "path" },
    { id: "l2_v_c_nc",    from: "l2_spine_c",   to: "l2_north_c",   latency: 12, type: "path" },
    { id: "l2_v_c_sc",    from: "l2_spine_c",   to: "l2_south_c",   latency: 12, type: "path" },
    { id: "l2_v_mid_nm",  from: "l2_spine_mid", to: "l2_north_mid", latency: 12, type: "path" },
    { id: "l2_v_mid_sm",  from: "l2_spine_mid", to: "l2_south_mid", latency: 12, type: "path" },
    { id: "l2_v_e3_ne",   from: "l2_spine_e3",  to: "l2_north_e",   latency: 12, type: "path" },
    { id: "l2_v_e3_se",   from: "l2_spine_e3",  to: "l2_south_e",   latency: 12, type: "path" },
    { id: "l2_v_e1_nef",  from: "l2_spine_e1",  to: "l2_north_ef",  latency: 12, type: "path" },
    { id: "l2_v_e1_sef",  from: "l2_spine_e1",  to: "l2_south_ef",  latency: 12, type: "path" },

    // ─── L2 ROOMS ─────────────────────────────────────────────────────────────
    { id: "l2_r_201",    from: "l2_north_w2",  to: "l2_room201",   latency: 8, type: "path" },
    { id: "l2_r_202",    from: "l2_north_c",   to: "l2_room202",   latency: 8, type: "path" },
    { id: "l2_r_203",    from: "l2_north_e",   to: "l2_room203",   latency: 8, type: "path" },
    { id: "l2_r_204",    from: "l2_north_ef",  to: "l2_room204",   latency: 8, type: "path" },
    { id: "l2_r_205",    from: "l2_south_w2",  to: "l2_room205",   latency: 8, type: "path" },
    { id: "l2_r_206",    from: "l2_south_c",   to: "l2_room206",   latency: 8, type: "path" },
    { id: "l2_r_council",from: "l2_south_e",   to: "l2_council",   latency: 8, type: "path" },
    { id: "l2_r_restN",  from: "l2_south_ef",  to: "l2_restroom_n",latency: 8, type: "path" },

    // ─── L2 STAIRWELLS ────────────────────────────────────────────────────────
    { id: "l2_sw_w",    from: "l2_spine_w1",  to: "stair_w_2",    latency: 6, type: "path" },
    { id: "l2_sw_e",    from: "l2_spine_ef",  to: "stair_e_2",    latency: 6, type: "path" },
    { id: "l2_sw_main", from: "l2_spine_mid", to: "stair_main_2", latency: 6, type: "path" },
    { id: "l2_el_n",    from: "l2_north_c",   to: "elev_n_2",     latency: 4, type: "path" },
    { id: "l2_el_s",    from: "l2_south_e",   to: "elev_s_2",     latency: 4, type: "path" },


    // ─── L3 SPINE ─────────────────────────────────────────────────────────────
    { id: "l3_s_w1_w2",  from: "l3_spine_w1",  to: "l3_spine_w2",  latency: 10, type: "path" },
    { id: "l3_s_w2_w3",  from: "l3_spine_w2",  to: "l3_spine_w3",  latency: 10, type: "path" },
    { id: "l3_s_w3_c",   from: "l3_spine_w3",  to: "l3_spine_c",   latency: 10, type: "path" },
    { id: "l3_s_c_mid",  from: "l3_spine_c",   to: "l3_spine_mid", latency: 10, type: "path" },
    { id: "l3_s_mid_e3", from: "l3_spine_mid", to: "l3_spine_e3",  latency: 10, type: "path" },
    { id: "l3_s_e3_e2",  from: "l3_spine_e3",  to: "l3_spine_e2",  latency: 10, type: "path" },
    { id: "l3_s_e2_e1",  from: "l3_spine_e2",  to: "l3_spine_e1",  latency: 10, type: "path" },
    { id: "l3_s_e1_ef",  from: "l3_spine_e1",  to: "l3_spine_ef",  latency: 10, type: "path" },

    // ─── L3 NORTH corridor ───────────────────────────────────────────────────
    { id: "l3_n_w1_w2",  from: "l3_north_w1",  to: "l3_north_w2",  latency: 10, type: "path" },
    { id: "l3_n_w2_c",   from: "l3_north_w2",  to: "l3_north_c",   latency: 15, type: "path" },
    { id: "l3_n_c_mid",  from: "l3_north_c",   to: "l3_north_mid", latency: 10, type: "path" },
    { id: "l3_n_mid_e",  from: "l3_north_mid", to: "l3_north_e",   latency: 10, type: "path" },
    { id: "l3_n_e_ef",   from: "l3_north_e",   to: "l3_north_ef",  latency: 15, type: "path" },

    // ─── L3 SOUTH corridor ───────────────────────────────────────────────────
    { id: "l3_so_w1_w2", from: "l3_south_w1",  to: "l3_south_w2",  latency: 10, type: "path" },
    { id: "l3_so_w2_c",  from: "l3_south_w2",  to: "l3_south_c",   latency: 15, type: "path" },
    { id: "l3_so_c_mid", from: "l3_south_c",   to: "l3_south_mid", latency: 10, type: "path" },
    { id: "l3_so_mid_e", from: "l3_south_mid", to: "l3_south_e",   latency: 10, type: "path" },
    { id: "l3_so_e_ef",  from: "l3_south_e",   to: "l3_south_ef",  latency: 15, type: "path" },

    // ─── L3 VERTICAL links ───────────────────────────────────────────────────
    { id: "l3_v_w1_nw1",  from: "l3_spine_w1",  to: "l3_north_w1",  latency: 12, type: "path" },
    { id: "l3_v_w1_sw1",  from: "l3_spine_w1",  to: "l3_south_w1",  latency: 12, type: "path" },
    { id: "l3_v_w2_nw2",  from: "l3_spine_w2",  to: "l3_north_w2",  latency: 12, type: "path" },
    { id: "l3_v_w2_sw2",  from: "l3_spine_w2",  to: "l3_south_w2",  latency: 12, type: "path" },
    { id: "l3_v_c_nc",    from: "l3_spine_c",   to: "l3_north_c",   latency: 12, type: "path" },
    { id: "l3_v_c_sc",    from: "l3_spine_c",   to: "l3_south_c",   latency: 12, type: "path" },
    { id: "l3_v_mid_nm",  from: "l3_spine_mid", to: "l3_north_mid", latency: 12, type: "path" },
    { id: "l3_v_mid_sm",  from: "l3_spine_mid", to: "l3_south_mid", latency: 12, type: "path" },
    { id: "l3_v_e3_ne",   from: "l3_spine_e3",  to: "l3_north_e",   latency: 12, type: "path" },
    { id: "l3_v_e3_se",   from: "l3_spine_e3",  to: "l3_south_e",   latency: 12, type: "path" },
    { id: "l3_v_e1_nef",  from: "l3_spine_e1",  to: "l3_north_ef",  latency: 12, type: "path" },
    { id: "l3_v_e1_sef",  from: "l3_spine_e1",  to: "l3_south_ef",  latency: 12, type: "path" },

    // ─── L3 ROOMS ─────────────────────────────────────────────────────────────
    { id: "l3_r_301",    from: "l3_north_w2",  to: "l3_room301",   latency: 8, type: "path" },
    { id: "l3_r_302",    from: "l3_north_c",   to: "l3_room302",   latency: 8, type: "path" },
    { id: "l3_r_303",    from: "l3_north_e",   to: "l3_room303",   latency: 8, type: "path" },
    { id: "l3_r_304",    from: "l3_north_ef",  to: "l3_room304",   latency: 8, type: "path" },
    { id: "l3_r_305",    from: "l3_south_w2",  to: "l3_room305",   latency: 8, type: "path" },
    { id: "l3_r_306",    from: "l3_south_c",   to: "l3_room306",   latency: 8, type: "path" },
    { id: "l3_r_307",    from: "l3_south_e",   to: "l3_room307",   latency: 8, type: "path" },
    { id: "l3_r_rest",   from: "l3_south_ef",  to: "l3_restroom",  latency: 8, type: "path" },

    // ─── L3 STAIRWELLS ────────────────────────────────────────────────────────
    { id: "l3_sw_w",    from: "l3_spine_w1",  to: "stair_w_3",    latency: 6, type: "path" },
    { id: "l3_sw_e",    from: "l3_spine_ef",  to: "stair_e_3",    latency: 6, type: "path" },
    { id: "l3_sw_main", from: "l3_spine_mid", to: "stair_main_3", latency: 6, type: "path" },
    { id: "l3_el_n",    from: "l3_north_c",   to: "elev_n_3",     latency: 4, type: "path" },
    { id: "l3_el_s",    from: "l3_south_e",   to: "elev_s_3",     latency: 4, type: "path" },


    // ─── L4 SPINE ─────────────────────────────────────────────────────────────
    { id: "l4_s_w1_w2",  from: "l4_spine_w1",  to: "l4_spine_w2",  latency: 10, type: "path" },
    { id: "l4_s_w2_w3",  from: "l4_spine_w2",  to: "l4_spine_w3",  latency: 10, type: "path" },
    { id: "l4_s_w3_c",   from: "l4_spine_w3",  to: "l4_spine_c",   latency: 10, type: "path" },
    { id: "l4_s_c_mid",  from: "l4_spine_c",   to: "l4_spine_mid", latency: 10, type: "path" },
    { id: "l4_s_mid_e3", from: "l4_spine_mid", to: "l4_spine_e3",  latency: 10, type: "path" },
    { id: "l4_s_e3_e2",  from: "l4_spine_e3",  to: "l4_spine_e2",  latency: 10, type: "path" },
    { id: "l4_s_e2_e1",  from: "l4_spine_e2",  to: "l4_spine_e1",  latency: 10, type: "path" },
    { id: "l4_s_e1_ef",  from: "l4_spine_e1",  to: "l4_spine_ef",  latency: 10, type: "path" },

    // ─── L4 NORTH corridor ───────────────────────────────────────────────────
    { id: "l4_n_w1_w2",  from: "l4_north_w1",  to: "l4_north_w2",  latency: 10, type: "path" },
    { id: "l4_n_w2_c",   from: "l4_north_w2",  to: "l4_north_c",   latency: 15, type: "path" },
    { id: "l4_n_c_mid",  from: "l4_north_c",   to: "l4_north_mid", latency: 10, type: "path" },
    { id: "l4_n_mid_e",  from: "l4_north_mid", to: "l4_north_e",   latency: 10, type: "path" },
    { id: "l4_n_e_ef",   from: "l4_north_e",   to: "l4_north_ef",  latency: 15, type: "path" },

    // ─── L4 SOUTH corridor ───────────────────────────────────────────────────
    { id: "l4_so_w1_w2", from: "l4_south_w1",  to: "l4_south_w2",  latency: 10, type: "path" },
    { id: "l4_so_w2_c",  from: "l4_south_w2",  to: "l4_south_c",   latency: 15, type: "path" },
    { id: "l4_so_c_mid", from: "l4_south_c",   to: "l4_south_mid", latency: 10, type: "path" },
    { id: "l4_so_mid_e", from: "l4_south_mid", to: "l4_south_e",   latency: 10, type: "path" },
    { id: "l4_so_e_ef",  from: "l4_south_e",   to: "l4_south_ef",  latency: 15, type: "path" },

    // ─── L4 VERTICAL links ───────────────────────────────────────────────────
    { id: "l4_v_w1_nw1",  from: "l4_spine_w1",  to: "l4_north_w1",  latency: 12, type: "path" },
    { id: "l4_v_w1_sw1",  from: "l4_spine_w1",  to: "l4_south_w1",  latency: 12, type: "path" },
    { id: "l4_v_w2_nw2",  from: "l4_spine_w2",  to: "l4_north_w2",  latency: 12, type: "path" },
    { id: "l4_v_w2_sw2",  from: "l4_spine_w2",  to: "l4_south_w2",  latency: 12, type: "path" },
    { id: "l4_v_c_nc",    from: "l4_spine_c",   to: "l4_north_c",   latency: 12, type: "path" },
    { id: "l4_v_c_sc",    from: "l4_spine_c",   to: "l4_south_c",   latency: 12, type: "path" },
    { id: "l4_v_mid_nm",  from: "l4_spine_mid", to: "l4_north_mid", latency: 12, type: "path" },
    { id: "l4_v_mid_sm",  from: "l4_spine_mid", to: "l4_south_mid", latency: 12, type: "path" },
    { id: "l4_v_e3_ne",   from: "l4_spine_e3",  to: "l4_north_e",   latency: 12, type: "path" },
    { id: "l4_v_e3_se",   from: "l4_spine_e3",  to: "l4_south_e",   latency: 12, type: "path" },
    { id: "l4_v_e1_nef",  from: "l4_spine_e1",  to: "l4_north_ef",  latency: 12, type: "path" },
    { id: "l4_v_e1_sef",  from: "l4_spine_e1",  to: "l4_south_ef",  latency: 12, type: "path" },

    // ─── L4 ROOMS ─────────────────────────────────────────────────────────────
    { id: "l4_r_401",    from: "l4_north_w2",  to: "l4_room401",   latency: 8, type: "path" },
    { id: "l4_r_402",    from: "l4_north_c",   to: "l4_room402",   latency: 8, type: "path" },
    { id: "l4_r_403",    from: "l4_north_e",   to: "l4_room403",   latency: 8, type: "path" },
    { id: "l4_r_404",    from: "l4_north_ef",  to: "l4_room404",   latency: 8, type: "path" },
    { id: "l4_r_405",    from: "l4_south_w2",  to: "l4_room405",   latency: 8, type: "path" },
    { id: "l4_r_406",    from: "l4_south_c",   to: "l4_room406",   latency: 8, type: "path" },
    { id: "l4_r_407",    from: "l4_south_e",   to: "l4_room407",   latency: 8, type: "path" },
    { id: "l4_r_rest",   from: "l4_south_ef",  to: "l4_restroom",  latency: 8, type: "path" },

    // ─── L4 STAIRWELLS ────────────────────────────────────────────────────────
    { id: "l4_sw_w",    from: "l4_spine_w1",  to: "stair_w_4",    latency: 6, type: "path" },
    { id: "l4_sw_e",    from: "l4_spine_ef",  to: "stair_e_4",    latency: 6, type: "path" },
    { id: "l4_sw_main", from: "l4_spine_mid", to: "stair_main_4", latency: 6, type: "path" },
    { id: "l4_el_n",    from: "l4_north_c",   to: "elev_n_4",     latency: 4, type: "path" },
    { id: "l4_el_s",    from: "l4_south_e",   to: "elev_s_4",     latency: 4, type: "path" },


    // ─── L5 SPINE ─────────────────────────────────────────────────────────────
    { id: "l5_s_w1_w2",  from: "l5_spine_w1",  to: "l5_spine_w2",  latency: 10, type: "path" },
    { id: "l5_s_w2_w3",  from: "l5_spine_w2",  to: "l5_spine_w3",  latency: 10, type: "path" },
    { id: "l5_s_w3_c",   from: "l5_spine_w3",  to: "l5_spine_c",   latency: 10, type: "path" },
    { id: "l5_s_c_mid",  from: "l5_spine_c",   to: "l5_spine_mid", latency: 10, type: "path" },
    { id: "l5_s_mid_e3", from: "l5_spine_mid", to: "l5_spine_e3",  latency: 10, type: "path" },
    { id: "l5_s_e3_e2",  from: "l5_spine_e3",  to: "l5_spine_e2",  latency: 10, type: "path" },
    { id: "l5_s_e2_e1",  from: "l5_spine_e2",  to: "l5_spine_e1",  latency: 10, type: "path" },
    { id: "l5_s_e1_ef",  from: "l5_spine_e1",  to: "l5_spine_ef",  latency: 10, type: "path" },

    // ─── L5 NORTH corridor ───────────────────────────────────────────────────
    { id: "l5_n_w1_w2",  from: "l5_north_w1",  to: "l5_north_w2",  latency: 10, type: "path" },
    { id: "l5_n_w2_c",   from: "l5_north_w2",  to: "l5_north_c",   latency: 15, type: "path" },
    { id: "l5_n_c_mid",  from: "l5_north_c",   to: "l5_north_mid", latency: 10, type: "path" },
    { id: "l5_n_mid_e",  from: "l5_north_mid", to: "l5_north_e",   latency: 10, type: "path" },
    { id: "l5_n_e_ef",   from: "l5_north_e",   to: "l5_north_ef",  latency: 15, type: "path" },

    // ─── L5 SOUTH corridor ───────────────────────────────────────────────────
    { id: "l5_so_w1_w2", from: "l5_south_w1",  to: "l5_south_w2",  latency: 10, type: "path" },
    { id: "l5_so_w2_c",  from: "l5_south_w2",  to: "l5_south_c",   latency: 15, type: "path" },
    { id: "l5_so_c_mid", from: "l5_south_c",   to: "l5_south_mid", latency: 10, type: "path" },
    { id: "l5_so_mid_e", from: "l5_south_mid", to: "l5_south_e",   latency: 10, type: "path" },
    { id: "l5_so_e_ef",  from: "l5_south_e",   to: "l5_south_ef",  latency: 15, type: "path" },

    // ─── L5 VERTICAL links ───────────────────────────────────────────────────
    { id: "l5_v_w1_nw1",  from: "l5_spine_w1",  to: "l5_north_w1",  latency: 12, type: "path" },
    { id: "l5_v_w1_sw1",  from: "l5_spine_w1",  to: "l5_south_w1",  latency: 12, type: "path" },
    { id: "l5_v_w2_nw2",  from: "l5_spine_w2",  to: "l5_north_w2",  latency: 12, type: "path" },
    { id: "l5_v_w2_sw2",  from: "l5_spine_w2",  to: "l5_south_w2",  latency: 12, type: "path" },
    { id: "l5_v_c_nc",    from: "l5_spine_c",   to: "l5_north_c",   latency: 12, type: "path" },
    { id: "l5_v_c_sc",    from: "l5_spine_c",   to: "l5_south_c",   latency: 12, type: "path" },
    { id: "l5_v_mid_nm",  from: "l5_spine_mid", to: "l5_north_mid", latency: 12, type: "path" },
    { id: "l5_v_mid_sm",  from: "l5_spine_mid", to: "l5_south_mid", latency: 12, type: "path" },
    { id: "l5_v_e3_ne",   from: "l5_spine_e3",  to: "l5_north_e",   latency: 12, type: "path" },
    { id: "l5_v_e3_se",   from: "l5_spine_e3",  to: "l5_south_e",   latency: 12, type: "path" },
    { id: "l5_v_e1_nef",  from: "l5_spine_e1",  to: "l5_north_ef",  latency: 12, type: "path" },
    { id: "l5_v_e1_sef",  from: "l5_spine_e1",  to: "l5_south_ef",  latency: 12, type: "path" },

    // ─── L5 ROOMS ─────────────────────────────────────────────────────────────
    { id: "l5_r_501",    from: "l5_north_w2",  to: "l5_room501",   latency: 8, type: "path" },
    { id: "l5_r_502",    from: "l5_north_c",   to: "l5_room502",   latency: 8, type: "path" },
    { id: "l5_r_503",    from: "l5_north_e",   to: "l5_room503",   latency: 8, type: "path" },
    { id: "l5_r_504",    from: "l5_north_ef",  to: "l5_room504",   latency: 8, type: "path" },
    { id: "l5_r_505",    from: "l5_south_w2",  to: "l5_room505",   latency: 8, type: "path" },
    { id: "l5_r_506",    from: "l5_south_c",   to: "l5_room506",   latency: 8, type: "path" },
    { id: "l5_r_dean",   from: "l5_south_e",   to: "l5_dean",      latency: 8, type: "path" },
    { id: "l5_r_rest",   from: "l5_south_ef",  to: "l5_restroom",  latency: 8, type: "path" },

    // ─── L5 STAIRWELLS ────────────────────────────────────────────────────────
    { id: "l5_sw_w",    from: "l5_spine_w1",  to: "stair_w_5",    latency: 6, type: "path" },
    { id: "l5_sw_e",    from: "l5_spine_ef",  to: "stair_e_5",    latency: 6, type: "path" },
    { id: "l5_sw_main", from: "l5_spine_mid", to: "stair_main_5", latency: 6, type: "path" },
    { id: "l5_el_n",    from: "l5_north_c",   to: "elev_n_5",     latency: 4, type: "path" },
    { id: "l5_el_s",    from: "l5_south_e",   to: "elev_s_5",     latency: 4, type: "path" },


    // ══════════════════════════════════════════════════════════════════════════
    //  INTER-FLOOR VERTICAL CONNECTIONS (stairwells + elevators)
    // ══════════════════════════════════════════════════════════════════════════

    // West Fire Stairs (L1 ↔ L2 ↔ L3 ↔ L4 ↔ L5)
    { id: "v_sw_1_2",   from: "stair_w_1",    to: "stair_w_2",    latency: 15, type: "stairwell" },
    { id: "v_sw_2_3",   from: "stair_w_2",    to: "stair_w_3",    latency: 15, type: "stairwell" },
    { id: "v_sw_3_4",   from: "stair_w_3",    to: "stair_w_4",    latency: 15, type: "stairwell" },
    { id: "v_sw_4_5",   from: "stair_w_4",    to: "stair_w_5",    latency: 15, type: "stairwell" },

    // East Fire Stairs (L1 ↔ L2 ↔ L3 ↔ L4 ↔ L5)
    { id: "v_se_1_2",   from: "stair_e_1",    to: "stair_e_2",    latency: 15, type: "stairwell" },
    { id: "v_se_2_3",   from: "stair_e_2",    to: "stair_e_3",    latency: 15, type: "stairwell" },
    { id: "v_se_3_4",   from: "stair_e_3",    to: "stair_e_4",    latency: 15, type: "stairwell" },
    { id: "v_se_4_5",   from: "stair_e_4",    to: "stair_e_5",    latency: 15, type: "stairwell" },

    // Main Central Staircase (L1 ↔ L2 ↔ L3 ↔ L4 ↔ L5)
    { id: "v_sm_1_2",   from: "stair_main_1", to: "stair_main_2", latency: 12, type: "stairwell" },
    { id: "v_sm_2_3",   from: "stair_main_2", to: "stair_main_3", latency: 12, type: "stairwell" },
    { id: "v_sm_3_4",   from: "stair_main_3", to: "stair_main_4", latency: 12, type: "stairwell" },
    { id: "v_sm_4_5",   from: "stair_main_4", to: "stair_main_5", latency: 12, type: "stairwell" },

    // North Elevator Bank (L1 ↔ L2 ↔ L3 ↔ L4 ↔ L5)
    { id: "v_en_1_2",   from: "elev_n_1",     to: "elev_n_2",     latency: 5,  type: "elevator" },
    { id: "v_en_2_3",   from: "elev_n_2",     to: "elev_n_3",     latency: 5,  type: "elevator" },
    { id: "v_en_3_4",   from: "elev_n_3",     to: "elev_n_4",     latency: 5,  type: "elevator" },
    { id: "v_en_4_5",   from: "elev_n_4",     to: "elev_n_5",     latency: 5,  type: "elevator" },

    // South Elevator Bank (L1 ↔ L2 ↔ L3 ↔ L4 ↔ L5)
    { id: "v_es_1_2",   from: "elev_s_1",     to: "elev_s_2",     latency: 5,  type: "elevator" },
    { id: "v_es_2_3",   from: "elev_s_2",     to: "elev_s_3",     latency: 5,  type: "elevator" },
    { id: "v_es_3_4",   from: "elev_s_3",     to: "elev_s_4",     latency: 5,  type: "elevator" },
    { id: "v_es_4_5",   from: "elev_s_4",     to: "elev_s_5",     latency: 5,  type: "elevator" },

  ],

  // Evacuation starts from Room 404 (Computer Lab, L4 North-East)
  sourceId:        "l4_room404",
  sourceIds:       ["l4_room404"],
  destinationIds:  ["exit_south_main", "exit_north_gate", "exit_west_fire", "exit_east_fire"],
  width:  58000,
  height: 36000,
};
