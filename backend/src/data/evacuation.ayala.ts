// ══════════════════════════════════════════════════════════════════════════════
//  Ayala Malls Solenad 1 — Atrium Building
//  Emergency Evacuation Graph Dataset (Detailed `#` Grid Layout)
//
//  Layout (Matching user's exact red line annotations & zoom proportions):
//  - Top Horizontal Corridor (Y=12000)
//  - Bottom Horizontal Corridor (Y=27000)
//  - Left Vertical Corridor (X=15000)
//  - Right Vertical Corridor (X=35000)
//  - North Corridor connects Top Horizontal to Stairs and North Exit (X=25000).
//  - South Corridor connects Bottom Horizontal to Escalator and South Exit (X=25000).
// ══════════════════════════════════════════════════════════════════════════════

import { ScenarioGraph, GraphNode, GraphEdge } from '../types/index';

function generateFloorNodes(floor: 'GL' | 'L2'): GraphNode[] {
  const pfx = floor === 'GL' ? '' : 'l2_';

  const corridors: GraphNode[] = [
    // ── Top Horizontal Corridor Hubs (Y=12000) ──
    { id: `${pfx}th_w`,      label: 'Top Hall W',       type: 'corridor', x:  2000, y: 12000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}th_kuyaj`,  label: 'Top Hall (Kuya J)',type: 'corridor', x:  7500, y: 12000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}th_savory`, label: 'Top Hall (Savory)',type: 'corridor', x: 10500, y: 12000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}th_int_l`,  label: 'Top Intersect L',  type: 'corridor', x: 15000, y: 12000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}th_nbs`,    label: 'Top Hall (NBS)',   type: 'corridor', x: 19000, y: 12000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}th_int_c`,  label: 'Top Intersect C',  type: 'corridor', x: 25000, y: 12000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}th_jamba`,  label: 'Top Hall (Jamba)', type: 'corridor', x: 31000, y: 12000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}th_int_r`,  label: 'Top Intersect R',  type: 'corridor', x: 35000, y: 12000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}th_watsons`,label: 'Top Hall (Watsons)',type:'corridor', x: 41500, y: 12000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}th_e`,      label: 'Top Hall E',       type: 'corridor', x: 48000, y: 12000, level: floor === 'GL' ? 1 : 2, buildingId: floor },

    // ── Bottom Horizontal Corridor Hubs (Y=27000) ──
    { id: `${pfx}bh_w`,      label: 'Bot Hall W',       type: 'corridor', x:  2000, y: 27000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}bh_bank`,   label: 'Bot Hall (Bank)',  type: 'corridor', x:  4000, y: 27000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}bh_nbs2`,   label: 'Bot Hall (NBS2)',  type: 'corridor', x:  8000, y: 27000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}bh_salad`,  label: 'Bot Hall (Salad)', type: 'corridor', x: 11500, y: 27000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}bh_int_l`,  label: 'Bot Intersect L',  type: 'corridor', x: 15000, y: 27000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}bh_hokk`,   label: 'Bot Hall (Hokk)',  type: 'corridor', x: 18000, y: 27000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}bh_int_c`,  label: 'Bot Intersect C',  type: 'corridor', x: 25000, y: 27000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}bh_kenny`,  label: 'Bot Hall (Kenny)', type: 'corridor', x: 30500, y: 27000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}bh_int_r`,  label: 'Bot Intersect R',  type: 'corridor', x: 35000, y: 27000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}bh_bread`,  label: 'Bot Hall (Bread)', type: 'corridor', x: 37500, y: 27000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}bh_bow`,    label: 'Bot Hall (Bow)',   type: 'corridor', x: 44500, y: 27000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}bh_e`,      label: 'Bot Hall E',       type: 'corridor', x: 48000, y: 27000, level: floor === 'GL' ? 1 : 2, buildingId: floor },

    // ── Left/Right Vertical Corridor Hubs ──
    { id: `${pfx}lv_hapchan`,label: 'Left Vert (Hap)',  type: 'corridor', x: 15000, y: 22000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}rv_beabi`,  label: 'Right Vert (Bea)', type: 'corridor', x: 35000, y: 16000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}rv_healthy`,label: 'Right Vert (Hea)', type: 'corridor', x: 35000, y: 20000, level: floor === 'GL' ? 1 : 2, buildingId: floor },

    // ── Vertical Access ──
    { id: `${pfx}stairs`,    label: 'Stairs',           type: 'stairwell', x: 25000, y:  7000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
    { id: `${pfx}escal`,     label: 'Escalators',       type: 'stairwell', x: 25000, y: 31000, level: floor === 'GL' ? 1 : 2, buildingId: floor },
  ];

  if (floor === 'GL') {
    return [
      ...corridors,
      // ── GL Stores ──
      { id: `s_bacolod`,  label: 'Bacolod Inasal', type: 'place', x:  4500, y:  4500, level: 1, buildingId: 'GL' },
      { id: `s_savory`,   label: 'Classic Savory', type: 'place', x: 10000, y:  7500, level: 1, buildingId: 'GL' },
      { id: `s_nbs`,      label: 'National Book',  type: 'place', x: 19000, y:  6000, level: 1, buildingId: 'GL' },
      { id: `s_jamba`,    label: 'Jamba Juice',    type: 'place', x: 31000, y:  6000, level: 1, buildingId: 'GL' },
      { id: `s_watsons`,  label: 'Watsons',        type: 'place', x: 41500, y:  8000, level: 1, buildingId: 'GL' },
      { id: `s_kuyaj`,    label: 'Kuya J',         type: 'place', x:  7500, y: 16500, level: 1, buildingId: 'GL' },
      { id: `s_hapchan`,  label: 'Hap Chan',       type: 'place', x:  7500, y: 22000, level: 1, buildingId: 'GL' },
      { id: `s_beabi`,    label: 'Beabi / Casa Musica', type: 'place', x: 42500, y: 16000, level: 1, buildingId: 'GL' },
      { id: `s_healthy`,  label: 'Healthy Options',type: 'place', x: 42500, y: 20000, level: 1, buildingId: 'GL' },
      { id: `s_sarabia`,  label: 'Sarabia Optical',type: 'place', x: 40000, y: 23000, level: 1, buildingId: 'GL' },
      { id: `s_bank`,     label: 'Bank of PH',     type: 'place', x:  4000, y: 32000, level: 1, buildingId: 'GL' },
      { id: `s_nbs2`,     label: 'NBS',            type: 'place', x:  8000, y: 32000, level: 1, buildingId: 'GL' },
      { id: `s_salad`,    label: 'Salad Stop',     type: 'place', x: 11500, y: 32000, level: 1, buildingId: 'GL' },
      { id: `s_katsu`,    label: 'Katsu Sora',     type: 'place', x: 18000, y: 33500, level: 1, buildingId: 'GL' },
      { id: `s_hokk`,     label: 'Hokkaido Ramen', type: 'place', x: 18000, y: 30500, level: 1, buildingId: 'GL' },
      { id: `s_kenny`,    label: 'Kenny Rogers',   type: 'place', x: 30500, y: 31500, level: 1, buildingId: 'GL' },
      { id: `s_bread`,    label: 'Breadtalk',      type: 'place', x: 37500, y: 31500, level: 1, buildingId: 'GL' },
      { id: `s_bow`,      label: 'Bow & Wow',      type: 'place', x: 44500, y: 23500, level: 1, buildingId: 'GL' },
      { id: `s_starbucks`,label: 'Starbucks',      type: 'place', x: 44500, y: 31500, level: 1, buildingId: 'GL' },
      { id: `s_restroom`, label: 'Restroom',       type: 'place', x: 15000, y:  7500, level: 1, buildingId: 'GL' },
      
      // ── GL Exits ──
      { id: 'exit_north',   label: 'North Exit',     type: 'emergency_exit', x: 25000, y:  2000, level: 1, buildingId: 'GL' },
      { id: 'exit_west_t',  label: 'West Exit 1',    type: 'emergency_exit', x:  2000, y: 12000, level: 1, buildingId: 'GL' },
      { id: 'exit_west_b',  label: 'West Exit 2',    type: 'emergency_exit', x:  2000, y: 27000, level: 1, buildingId: 'GL' },
      { id: 'exit_east_t',  label: 'East Exit 1',    type: 'emergency_exit', x: 48000, y: 12000, level: 1, buildingId: 'GL' },
      { id: 'exit_east_b',  label: 'East Exit 2',    type: 'emergency_exit', x: 48000, y: 27000, level: 1, buildingId: 'GL' },
      { id: 'exit_south',   label: 'South Exit',     type: 'emergency_exit', x: 25000, y: 35000, level: 1, buildingId: 'GL' }
    ];
  } else {
    return [
      ...corridors,
      // ── L2 Stores ──
      { id: `l2_s_furniture`, label: 'Furniture Republic', type: 'place', x:  9000, y:  6000, level: 2, buildingId: 'L2' },
      { id: `l2_s_daiso`,     label: 'Daiso Japan',        type: 'place', x: 31000, y:  5000, level: 2, buildingId: 'L2' },
      { id: `l2_s_casa`,      label: 'Casa Romantica',     type: 'place', x: 31000, y:  9000, level: 2, buildingId: 'L2' },
      { id: `l2_s_sanyang`,   label: 'San-Yang',           type: 'place', x: 39500, y: 19500, level: 2, buildingId: 'L2' },
      { id: `l2_s_japanhome`, label: 'Japan Home',         type: 'place', x: 45000, y: 19500, level: 2, buildingId: 'L2' },
      { id: `l2_s_ashley`,    label: 'Ashley Furniture',   type: 'place', x: 12500, y: 32000, level: 2, buildingId: 'L2' },
      { id: `l2_s_dogs`,      label: 'Dogs & The City',    type: 'place', x: 28500, y: 32000, level: 2, buildingId: 'L2' },
      { id: `l2_s_abenson`,   label: 'Abenson',            type: 'place', x: 35500, y: 32000, level: 2, buildingId: 'L2' },
      { id: `l2_s_dental`,    label: 'Intellident',        type: 'place', x: 44500, y: 30500, level: 2, buildingId: 'L2' },
      { id: `l2_s_restroom`,  label: 'Restroom',           type: 'place', x: 15000, y:  7500, level: 2, buildingId: 'L2' },
    ];
  }
}

function generateFloorEdges(floor: 'GL' | 'L2'): GraphEdge[] {
  const pfx = floor === 'GL' ? '' : 'l2_';
  
  const corridorEdges: GraphEdge[] = [
    // Top Horizontal Corridor line
    { id: `e_${pfx}th_1`, from: `${pfx}th_w`,      to: `${pfx}th_kuyaj`,   latency: 2, label: '2s', type: 'corridor' },
    { id: `e_${pfx}th_2`, from: `${pfx}th_kuyaj`,  to: `${pfx}th_savory`,  latency: 1, label: '1s', type: 'corridor' },
    { id: `e_${pfx}th_3`, from: `${pfx}th_savory`, to: `${pfx}th_int_l`,   latency: 1, label: '1s', type: 'corridor' },
    { id: `e_${pfx}th_4`, from: `${pfx}th_int_l`,  to: `${pfx}th_nbs`,     latency: 1, label: '1s', type: 'corridor' },
    { id: `e_${pfx}th_5`, from: `${pfx}th_nbs`,    to: `${pfx}th_int_c`,   latency: 2, label: '2s', type: 'corridor' },
    { id: `e_${pfx}th_6`, from: `${pfx}th_int_c`,  to: `${pfx}th_jamba`,   latency: 2, label: '2s', type: 'corridor' },
    { id: `e_${pfx}th_7`, from: `${pfx}th_jamba`,  to: `${pfx}th_int_r`,   latency: 1, label: '1s', type: 'corridor' },
    { id: `e_${pfx}th_8`, from: `${pfx}th_int_r`,  to: `${pfx}th_watsons`, latency: 2, label: '2s', type: 'corridor' },
    { id: `e_${pfx}th_9`, from: `${pfx}th_watsons`,to: `${pfx}th_e`,       latency: 2, label: '2s', type: 'corridor' },

    // Bottom Horizontal Corridor line
    { id: `e_${pfx}bh_1`, from: `${pfx}bh_w`,      to: `${pfx}bh_bank`,    latency: 2, label: '2s', type: 'corridor' },
    { id: `e_${pfx}bh_2a`,from: `${pfx}bh_bank`,   to: `${pfx}bh_nbs2`,    latency: 1, label: '1s', type: 'corridor' },
    { id: `e_${pfx}bh_2b`,from: `${pfx}bh_nbs2`,   to: `${pfx}bh_salad`,   latency: 1, label: '1s', type: 'corridor' },
    { id: `e_${pfx}bh_3`, from: `${pfx}bh_salad`,  to: `${pfx}bh_int_l`,   latency: 1, label: '1s', type: 'corridor' },
    { id: `e_${pfx}bh_4`, from: `${pfx}bh_int_l`,  to: `${pfx}bh_hokk`,    latency: 1, label: '1s', type: 'corridor' },
    { id: `e_${pfx}bh_5`, from: `${pfx}bh_hokk`,   to: `${pfx}bh_int_c`,   latency: 1, label: '1s', type: 'corridor' },
    { id: `e_${pfx}bh_6`, from: `${pfx}bh_int_c`,  to: `${pfx}bh_kenny`,   latency: 1, label: '1s', type: 'corridor' },
    { id: `e_${pfx}bh_7`, from: `${pfx}bh_kenny`,  to: `${pfx}bh_int_r`,   latency: 1, label: '1s', type: 'corridor' },
    { id: `e_${pfx}bh_8`, from: `${pfx}bh_int_r`,  to: `${pfx}bh_bread`,   latency: 1, label: '1s', type: 'corridor' },
    { id: `e_${pfx}bh_9`, from: `${pfx}bh_bread`,  to: `${pfx}bh_bow`,     latency: 2, label: '2s', type: 'corridor' },
    { id: `e_${pfx}bh_10`,from: `${pfx}bh_bow`,    to: `${pfx}bh_e`,       latency: 1, label: '1s', type: 'corridor' },

    // Left Vertical Corridor line
    { id: `e_${pfx}lv_1`, from: `${pfx}th_int_l`,  to: `${pfx}lv_hapchan`, latency: 3, label: '3s', type: 'corridor' },
    { id: `e_${pfx}lv_2`, from: `${pfx}lv_hapchan`,to: `${pfx}bh_int_l`,   latency: 2, label: '2s', type: 'corridor' },

    // Right Vertical Corridor line
    { id: `e_${pfx}rv_1`, from: `${pfx}th_int_r`,  to: `${pfx}rv_beabi`,   latency: 2, label: '2s', type: 'corridor' },
    { id: `e_${pfx}rv_2`, from: `${pfx}rv_beabi`,  to: `${pfx}rv_healthy`, latency: 2, label: '2s', type: 'corridor' },
    { id: `e_${pfx}rv_3`, from: `${pfx}rv_healthy`,to: `${pfx}bh_int_r`,   latency: 2, label: '2s', type: 'corridor' },

    // Vertical Access from Corridors
    { id: `e_${pfx}st_c`,  from: `${pfx}stairs`,   to: `${pfx}th_int_c`,   latency: 2, label: '2s', type: 'corridor' },
    { id: `e_${pfx}es_c`,  from: `${pfx}escal`,    to: `${pfx}bh_int_c`,   latency: 2, label: '2s', type: 'corridor' },
  ];

  if (floor === 'GL') {
    return [
      ...corridorEdges,
      // ── GL Store Connections ──
      { id: `e_s_bac`, from: `s_bacolod`, to: `th_w`,       latency: 3, label: '3s', type: 'corridor' }, // Connecting Bacolod to top-left
      { id: `e_s_sav`, from: `s_savory`,  to: `th_savory`,  latency: 3, label: '3s', type: 'corridor' },
      { id: `e_s_nbs`, from: `s_nbs`,     to: `th_nbs`,     latency: 3, label: '3s', type: 'corridor' },
      { id: `e_s_jam`, from: `s_jamba`,   to: `th_jamba`,   latency: 3, label: '3s', type: 'corridor' },
      { id: `e_s_wat`, from: `s_watsons`, to: `th_watsons`, latency: 3, label: '3s', type: 'corridor' },
      
      { id: `e_s_kuy`, from: `s_kuyaj`,   to: `th_kuyaj`,   latency: 3, label: '3s', type: 'corridor' },
      { id: `e_s_hap`, from: `s_hapchan`, to: `lv_hapchan`, latency: 3, label: '3s', type: 'corridor' },
      { id: `e_s_bea`, from: `s_beabi`,   to: `rv_beabi`,   latency: 3, label: '3s', type: 'corridor' },
      { id: `e_s_hea`, from: `s_healthy`, to: `rv_healthy`, latency: 3, label: '3s', type: 'corridor' },
      { id: `e_s_sar`, from: `s_sarabia`, to: `bh_bread`,   latency: 3, label: '3s', type: 'corridor' },
      
      { id: `e_s_ban`, from: `s_bank`,    to: `bh_bank`,    latency: 3, label: '3s', type: 'corridor' },
      { id: `e_s_nbs2`,from: `s_nbs2`,    to: `bh_nbs2`,    latency: 3, label: '3s', type: 'corridor' },
      { id: `e_s_sal`, from: `s_salad`,   to: `bh_salad`,   latency: 3, label: '3s', type: 'corridor' },
      { id: `e_s_kat`, from: `s_katsu`,   to: `bh_hokk`,    latency: 3, label: '3s', type: 'corridor' }, 
      { id: `e_s_hok`, from: `s_hokk`,    to: `bh_hokk`,    latency: 2, label: '2s', type: 'corridor' },
      { id: `e_s_ken`, from: `s_kenny`,   to: `bh_kenny`,   latency: 3, label: '3s', type: 'corridor' },
      { id: `e_s_bre`, from: `s_bread`,   to: `bh_bread`,   latency: 3, label: '3s', type: 'corridor' },
      { id: `e_s_bow`, from: `s_bow`,     to: `bh_bow`,     latency: 2, label: '2s', type: 'corridor' },
      { id: `e_s_star`,from: `s_starbucks`,to:`bh_bow`,     latency: 3, label: '3s', type: 'corridor' },
      { id: `e_s_rest`,from: `s_restroom`,to: `th_int_l`,   latency: 2, label: '2s', type: 'corridor' },

      // ── GL Exits ──
      { id: 'e_exit_nt', from: 'stairs',   to: 'exit_north',  latency: 3, label: '3s', type: 'corridor' },
      { id: 'e_exit_wt', from: 'th_w',     to: 'exit_west_t', latency: 2, label: '2s', type: 'corridor' },
      { id: 'e_exit_wb', from: 'bh_w',     to: 'exit_west_b', latency: 2, label: '2s', type: 'corridor' },
      { id: 'e_exit_et', from: 'th_e',     to: 'exit_east_t', latency: 2, label: '2s', type: 'corridor' },
      { id: 'e_exit_eb', from: 'bh_e',     to: 'exit_east_b', latency: 2, label: '2s', type: 'corridor' },
      { id: 'e_exit_s',  from: 'escal',    to: 'exit_south',  latency: 3, label: '3s', type: 'corridor' }
    ];
  } else {
    return [
      ...corridorEdges,
      // ── L2 Store Connections ──
      { id: `e_l2_s_furn`, from: `l2_s_furniture`, to: `l2_th_kuyaj`,  latency: 3, label: '3s', type: 'corridor' },
      { id: `e_l2_s_dai`,  from: `l2_s_daiso`,     to: `l2_stairs`,    latency: 3, label: '3s', type: 'corridor' },
      { id: `e_l2_s_cas`,  from: `l2_s_casa`,      to: `l2_th_jamba`,  latency: 2, label: '2s', type: 'corridor' },
      { id: `e_l2_s_san`,  from: `l2_s_sanyang`,   to: `l2_th_watsons`,latency: 3, label: '3s', type: 'corridor' },
      { id: `e_l2_s_jap`,  from: `l2_s_japanhome`, to: `l2_th_e`,      latency: 3, label: '3s', type: 'corridor' },
      { id: `e_l2_s_ash`,  from: `l2_s_ashley`,    to: `l2_bh_salad`,  latency: 3, label: '3s', type: 'corridor' },
      { id: `e_l2_s_dog`,  from: `l2_s_dogs`,      to: `l2_bh_kenny`,  latency: 2, label: '2s', type: 'corridor' },
      { id: `e_l2_s_abe`,  from: `l2_s_abenson`,   to: `l2_bh_int_r`,  latency: 3, label: '3s', type: 'corridor' },
      { id: `e_l2_s_den`,  from: `l2_s_dental`,    to: `l2_bh_bow`,    latency: 2, label: '2s', type: 'corridor' },
      { id: `e_l2_s_res`,  from: `l2_s_restroom`,  to: `l2_th_int_l`,  latency: 2, label: '2s', type: 'corridor' },
    ];
  }
}

export const ayalaMallBuildingGraph: ScenarioGraph = {
  nodes: [
    ...generateFloorNodes('GL'),
    ...generateFloorNodes('L2')
  ],

  edges: [
    ...generateFloorEdges('GL'),
    ...generateFloorEdges('L2'),
    // ── Floor Connectors (GL ↔ L2) ──
    { id: 'e_vert_stairs_up',   from: 'stairs', to: 'l2_stairs', latency: 15, label: '15s', type: 'corridor' },
    { id: 'e_vert_stairs_down', from: 'l2_stairs', to: 'stairs', latency: 15, label: '15s', type: 'corridor' },
    { id: 'e_vert_escal_up',    from: 'escal',  to: 'l2_escal',  latency: 10, label: '10s', type: 'corridor' },
    { id: 'e_vert_escal_down',  from: 'l2_escal',  to: 'escal',  latency: 10, label: '10s', type: 'corridor' },
  ],

  // Default start: Classic Savory
  sourceId: 's_savory',
  destinationIds: ['exit_north', 'exit_west_t', 'exit_west_b', 'exit_east_t', 'exit_east_b', 'exit_south'],
  width:  50000,
  height: 37000,
};
