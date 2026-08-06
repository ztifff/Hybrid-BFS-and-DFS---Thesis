import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ScenarioType } from '../types';

interface Props {
  scenario: ScenarioType;
  onClose: () => void;
}

// ── Scenario-specific content ─────────────────────────────────────────────────

const SCENARIO_MAPS: Record<ScenarioType, { name: string; description: string }[]> = {
  network: [
    { name: '🧪 Synthetic', description: 'A procedurally generated network graph of configurable size. Useful for controlled benchmarking. Nodes represent generic routers and the structure is randomized each session.' },
    { name: '🏢 Company Business Network', description: 'A realistic 3-tier hierarchical enterprise network (Core, Distribution, Access) spanning multiple floors and VLANs. Ideal for testing intra-VLAN routing and broadcast containment.' },
    { name: '🏫 Campus Network', description: 'A university campus network featuring active Access Control Lists (ACLs). Demonstrates strict subnet routing rules where Boys Block (192.168.3.x) can only reach AB1, Girls Block can only reach AB2, and Yellow Zones bypass routers using Layer 2 switching.' },
  ],
  robotics: [
    { name: '🧪 Synthetic', description: 'A generated warehouse grid layout that dynamically expands horizontally with up to 18 finish line exit destinations as node density increases. Features 3D storage shelf box pillars and 3D delivery storage grids.' },
    { name: '🏭 AWS Warehouse', description: 'Inspired by Amazon Fulfillment Center layouts. Features a Central Depot (source), multiple shelf zones organized in rows, and Delivery Bay targets. Shelf-blocking events simulate real robot-shelf collision events.' },
    { name: '🏥 Clinic Building', description: 'Models a multi-room clinic or hospital floor. Narrow corridors and many dead-end rooms make this a prime test for DFS trap sensitivity and Hybrid backtracking.' },
  ],
  traffic: [
    { name: '🧪 Synthetic', description: 'A procedurally generated road grid with configurable intersections and roads. Good for isolated benchmarking of BFS vs DFS on a pure grid topology.' },
    { name: '🗺️ Cabuyao City', description: 'A real-world road network based on the actual road map of Cabuyao, Laguna, Philippines. Intersections, highways, and streets are sourced from OpenStreetMap data. This tests algorithms on actual geographic constraints.' },
  ],
  evacuation: [
    { name: '🧪 Synthetic', description: 'A generated floor plan with corridors, stairwells, and emergency exits placed randomly. Used to test evacuation logic in generalized building structures.' },
    { name: '🏬 SM City Santa Rosa', description: 'Based on the multi-level layout of SM City Santa Rosa mall (Laguna, Philippines). Contains two floors (Ground Level & Level 2) with real-world stairwells, corridors, and emergency exit placement.' },
    { name: '🛍️ Ayala Malls Solenad Nuvali (Atrium)', description: 'A multi-level outdoor lifestyle center layout based on Ayala Malls Solenad Nuvali (Atrium) in Santa Rosa, Laguna. Features 2 levels (Ground Level & Level 2).' },
  ],
  gameai: [
    { name: '🔵 Turkish Draughts (Dama)', description: 'An 8×8 Dama board using tan/dark-brown alternating squares. All squares are playable. The Strategy Planner (🔷) navigates from the bottom to the King Row at the top while avoiding dynamically-placed opponent pieces (🔻).' },
    { name: '⚫ Checkers', description: 'A classic 8×8 Checkers board using red/black alternating squares. Only dark squares are playable. The Strategy Planner (🔵) navigates diagonally to reach the Winning Square (🏁) while dodging opponent pieces (🔴).' },
  ],
};

const SCENARIO_DYNAMIC_EVENTS: Record<ScenarioType, { event: string; icon: string; cause: string; resolution: string }[]> = {
  network: [
    { event: 'Cable Unplugged / Overheating Switch', icon: '💥', cause: 'A router, switch, or link fails mid-simulation. The node turns red-orange and is marked as blocked.', resolution: 'The algorithms detect the blocked node and immediately reroute around it. BFS finds the next shortest alternate path; DFS dives deep into branches; Hybrid balances between the two. The event panel shows "Path Severed: [Algorithm]" for any algorithm whose active path was disrupted.' },
    { event: 'Rack Power Loss / Massive DDoS Attack', icon: '💥', cause: 'A major cascading failure blocks a node and its immediate neighbors (AoE block).', resolution: 'Algorithms must reroute around a much larger blocked area. Tests wide-area detour efficiency.' },
    { event: 'Restored (Cable Reconnected / Cooling / Power / Attack Mitigated)', icon: '✅', cause: 'A previously failed component or cluster comes back online.', resolution: 'The node becomes unblocked. Algorithms may reconsider it for future path segments. This tests whether the pathfinder can adapt to improving conditions.' },
  ],
  robotics: [
    { event: 'Pallet Spill / Robot Malfunction', icon: '🚧', cause: 'A warehouse robot breaks down or a spill blocks an aisle node. This simulates real warehouse accidents.', resolution: 'Algorithms reroute around the blocked node. The "Path Severed" indicator shows which algorithm was directly affected.' },
    { event: 'Massive Rack Collapse', icon: '🚧', cause: 'A large section of shelving collapses, blocking an entire cluster of nodes (AoE block).', resolution: 'Algorithms must find alternate aisle routes around the large collapsed zone.' },
    { event: 'Cleared / Repaired / Rebuilt', icon: '✅', cause: 'Maintenance staff clear a blocked aisle, restoring normal movement through that section.', resolution: 'The blocked node becomes traversable again. Algorithms can resume using that corridor in subsequent path calculations.' },
  ],
  traffic: [
    { event: 'Road Closure / Signal Failure', icon: '🚫', cause: 'An accident, construction, or emergency closes a road segment. The intersection or street node is fully blocked.', resolution: 'Algorithms reroute via alternate roads. In a city grid like Cabuyao, this often forces longer detours around major arterial roads.' },
    { event: 'Major Accident / Congestion Cascade', icon: '🚫', cause: 'A large-scale traffic incident that blocks an intersection and all immediate neighboring nodes (AoE block).', resolution: 'Algorithms avoid the wide congested area and reroute. Resolves automatically after a set number of steps.' },
    { event: 'Reopened / Signal Restored / Flow Restored', icon: '✅', cause: 'A failed traffic signal is repaired and normal flow resumes.', resolution: 'The intersection node is unblocked. Flow through that road junction resumes for future path planning.' },
  ],
  evacuation: [
    { event: 'Debris / Exit Blocked', icon: '🧱', cause: 'A corridor, stairwell, exit, or room node becomes blocked by debris or obstruction, making it impassable for evacuees.', resolution: 'The node turns dark orange and remains blocked until a clear event restores it. Algorithms must reroute to the nearest emergency exit around the blocked node.' },
    { event: 'Smoke / Blind Zone', icon: '💨', cause: 'Smoke or contamination spreads through connected corridors and rooms, blocking a cluster of nodes.', resolution: 'Algorithms must avoid the contaminated area while finding a safe evacuation path.' },
    { event: 'Indoor Tenant Fire Spreads', icon: '🔥', cause: 'A tenant fire spreads inside the building and blocks nearby rooms and corridors.', resolution: 'The fire event later clears or is contained, allowing previously blocked nodes to become traversable again.' },
    { event: 'Cleared / Contained / Restored', icon: '✅', cause: 'A previously blocked node or area is cleared or the hazard is contained.', resolution: 'The node becomes traversable again. Algorithms can resume using that path for future evacuation routing.' },
  ],
  gameai: [
    { event: 'Opponent Piece Deployed / Opponent Attacks', icon: '🔴', cause: 'An opponent piece is placed on a board square ahead of the Strategy Planner\'s path, blocking that tile.', resolution: 'The Strategy Planner must reroute around the piece. The Strategy Map Events panel shows which algorithms were UNAFFECTED (not in their path) vs. PATH SEVERED (directly blocked). The piece remains until it retreats.' },
    { event: 'Opponent Formation', icon: '🔴', cause: 'Multiple opponent pieces form a defensive cluster (AoE block).', resolution: 'The Strategy Planner must adapt its diagonal or straight-line movement to avoid the wide threat position.' },
    { event: 'Opponent Retreats / Moves Away', icon: '✅', cause: 'The opponent piece vacates the blocked square, reopening that tile.', resolution: 'The board square becomes traversable again. Algorithms can reconsider that square for path planning on subsequent steps.' },
  ],
};

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'metrics',   label: 'Live Metrics',   icon: '📊' },
  { id: 'legend',    label: 'Legend',         icon: '🗺️' },
  { id: 'canvas',    label: 'Canvas Controls',icon: '🎮' },
  { id: 'buttons',   label: 'Sim Controls',   icon: '▶️' },
  { id: 'events',    label: 'Map Events',      icon: '⚡' },
  { id: 'maps',      label: 'Map Variants',    icon: '📍' },
  { id: 'results',   label: 'Results & Save',  icon: '🏆' },
] as const;
type TabId = typeof TABS[number]['id'];

// ── Sub-components ─────────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-5">
    <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 border-b border-gray-700/60 pb-1">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const Item: React.FC<{ label: string; icon?: string; children: React.ReactNode }> = ({ label, icon, children }) => (
  <div className="flex gap-3 text-sm">
    {icon && <span className="text-lg shrink-0 mt-0.5">{icon}</span>}
    <div>
      <span className="font-semibold text-white">{label}: </span>
      <span className="text-gray-300">{children}</span>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
export const HelpModal: React.FC<Props> = ({ scenario, onClose }) => {
  const [tab, setTab] = useState<TabId>('metrics');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const maps = SCENARIO_MAPS[scenario];
  const events = SCENARIO_DYNAMIC_EVENTS[scenario];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-panel rounded-2xl shadow-glow-blue w-full max-w-2xl flex flex-col max-h-[90vh] fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Help & Guide</h2>
            <p className="text-xs text-gray-500 mt-0.5">Simulation View — full panel reference</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-2 shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                tab === t.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                  : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}>

          {/* Visual Guide Header(s) */}
          {(() => {
            const folder = {
              network: 'Network Routing',
              robotics: 'Robotics Warehouse',
              traffic: 'Road Traffic',
              evacuation: 'Emergency Evacuation',
              gameai: 'Game AI Pathfinding',
            }[scenario];
            const base = `/help-images/${folder}`;
            
            let images: string[] = [];
            if (tab === 'metrics') images = [`${base}/Metrics.png`];
            if (tab === 'legend') images = [`${base}/Legend.png`];
            if (tab === 'canvas') {
              images = scenario === 'evacuation' 
                ? [`${base}/CanvasControl.png`, `${base}/StartingPoint.png`]
                : [`${base}/CanvasControl.png`];
            }
            if (tab === 'buttons') {
              if (scenario === 'network') images = [`${base}/SimulationControl.png`, `${base}/Mode1.png`, `${base}/Mode2.png`, `${base}/Mode3.png`];
              else if (scenario === 'robotics') images = [`${base}/SimulationControl.png`, `${base}/RobotAssign.png`, `${base}/RobotAssign1.png`, `${base}/RobotFleetStatus.png`];
              else images = [`${base}/SimulationControl.png`];
            }
            if (tab === 'maps') {
              images = scenario === 'network'
                ? [`${base}/MapVariants.png`, `${base}/DynamicSizeAdjuster.png`, `${base}/CampusRules.png`]
                : [`${base}/MapVariants.png`, `${base}/DynamicSizeAdjuster.png`];
            }
            if (tab === 'results') {
              images = scenario === 'evacuation'
                ? [`${base}/Reults.png`, `${base}/History.png`]
                : [`${base}/Results.png`, `${base}/History.png`];
            }
            if (tab === 'events') {
              images = scenario === 'gameai'
                ? [`${base}/DynamicMapEvents.png`, `${base}/StrategyMapEvents.png`]
                : [`${base}/DynamicMapEvents.png`];
            }

            if (images.length === 0) return null;

            return (
              <div className="mb-6 flex flex-col gap-4">
                {images.map(src => (
                  <div key={src} className="rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/10 bg-[#0a0f1e]/80 flex items-center justify-center p-3">
                    <img 
                      src={src}
                      alt={`${tab} visual guide`}
                      className="max-w-full h-auto max-h-72 object-contain rounded-md cursor-zoom-in transition-transform hover:scale-[1.02]"
                      onClick={() => setZoomedImage(src)}
                      onError={(e) => {
                        // gracefully hide if image is missing
                        (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── LIVE METRICS ── */}
          {tab === 'metrics' && (
            <>
              <Section title="Live Metrics Panel (Left Sidebar)">
                <p className="text-sm text-gray-400 mb-3">Displays real-time statistics for all three algorithms side-by-side as the simulation runs. Each column is color-coded: <span className="text-green-400 font-bold">BFS</span>, <span className="text-purple-400 font-bold">DFS</span>, <span className="text-orange-400 font-bold">Hybrid</span>.</p>
                <Item label="Visited Nodes" icon="🔢">The total number of nodes each algorithm has explored so far. Higher values mean more of the graph was searched before finding a path.</Item>
                <Item label="Completion %" icon="📈">Percentage of the path completed toward the target node. Reaches 100% when the destination is found.</Item>
                <Item label="Distance" icon="📏">The cumulative edge-weight cost of the current path. Lower is better and represents a shorter or faster route.</Item>
                <Item label="Optimal %" icon="🎯">How close the found path is to the theoretically shortest possible path (BFS optimal = 100% by definition). Values below 100% indicate a suboptimal route.</Item>
                <Item label="Memory" icon="💾">Estimated memory consumed by the algorithm's frontier and visited sets. BFS typically uses the most; DFS the least; Hybrid is in-between.</Item>
                <Item label="Adaptability" icon="🔄">A score (0–100) measuring how well the algorithm recovered after a dynamic event (blockage). Higher scores mean faster, cleaner rerouting.</Item>
              </Section>
              <Section title="Step Counter">
                <Item label="Step X / Y" icon="👣">Shows the current animation step out of the total number of steps in the simulation. Each step is one node expansion across all three algorithms simultaneously.</Item>
              </Section>
            </>
          )}

          {/* ── LEGEND ── */}
          {tab === 'legend' && (
            <>
              <Section title="Environment Nodes">
                <p className="text-sm text-gray-400 mb-2">Scenario-specific nodes have unique icons and colors defined in the Legend. The Source node (green) is where algorithms start. Target/Destination nodes (red) are the goal.</p>
                <Item label="Source Node" icon="🟢">The starting point of the pathfinding. All three algorithms begin their search from this node simultaneously.</Item>
                <Item label="Target / Exit Node" icon="🔴">The destination all algorithms are trying to reach. When found, the path is highlighted on the canvas.</Item>
                <Item label="Blockage Node" icon="⛔">A dynamically generated event node that becomes impassable during the simulation. Different scenarios use different icons (e.g., 🔥 Fire, 🚫 Road Closure, 💥 Failed Component).</Item>
                <Item label="Explored Nodes (Stacked)" icon="⬤">Nodes explored by multiple algorithms are shown with concentric colored rings — green (BFS outer), purple (DFS middle), orange (Hybrid inner).</Item>
              </Section>
              <Section title="Environment Edges">
                <Item label="Edge Lines" icon="➖">Lines connecting nodes represent traversable paths. Edge thickness and color are scenario-specific (e.g., fiber optic lines vs. roads vs. corridors).</Item>
              </Section>
              <Section title="Algorithm Paths">
                <Item label="BFS Path" icon="🟩">The thickest outermost line. Shows the guaranteed shortest path found by Breadth-First Search.</Item>
                <Item label="DFS Path" icon="🟪">The middle-width line. Shows the path found by Depth-First Search — often longer but uses less memory.</Item>
                <Item label="Hybrid Path" icon="🟧">The thinnest innermost line. Shows the balanced path from the Hybrid algorithm.</Item>
                <Item label="Active Search Heads" icon="⭕">The pulsing colored rings on nodes show where each algorithm's frontier is currently expanding in real time.</Item>
              </Section>
            </>
          )}

          {/* ── CANVAS CONTROLS ── */}
          {tab === 'canvas' && (
            <>
              <Section title="Show Panel (Top-Left of Canvas)">
                <p className="text-sm text-gray-400 mb-2">Click <strong>SHOW ▼</strong> to expand. Lets you toggle the visibility of each algorithm's coloring on the canvas.</p>
                <Item label="BFS / DFS / Hybrid toggle" icon="👁️">Click to hide or show that algorithm's explored regions, path lines, and search head rings. Useful for isolating one algorithm for comparison — e.g., hide BFS and DFS to see only the Hybrid path in orange.</Item>
                <Item label="ON / OFF indicator">Shows the current visibility state. Dot color matches the algorithm's color scheme.</Item>
              </Section>
              <Section title="Follow Panel (Top-Right of Canvas)">
                <p className="text-sm text-gray-400 mb-2">Click <strong>FOLLOW ▼</strong> to expand. Auto-pans the camera to track a specific algorithm's search head as it explores the graph.</p>
                <Item label="BFS / DFS / Hybrid">Select one to start following that algorithm. The canvas smoothly pans each step to keep the active search head centered. The 📡 icon appears when tracking is active.</Item>
                <Item label="Stop Following">Appears when following is active. Click to release camera control back to you. Also deactivated automatically when you drag the canvas.</Item>
              </Section>
              <Section title="Zoom Controls (Bottom-Right of Canvas)">
                <Item label="+ Button" icon="🔍">Zooms into the canvas at the current view center (1.5× per click).</Item>
                <Item label="− Button" icon="🔎">Zooms out of the canvas (1.5× per click). Minimum zoom is 0.2×.</Item>
                <Item label="Reset Button" icon="🔄">Instantly snaps back to the default zoom (1×) and pan position (centered).</Item>
                <Item label="Zoom: X.Xx display">Shows your current zoom level. Scroll your mouse wheel over the canvas for smooth zoom-in/out at the cursor position.</Item>
              </Section>
              {scenario === 'evacuation' && (
                <Section title="Floor Switcher (Bottom-Center)">
                  <Item label="GL (Ground) / L2 (Second)" icon="🏢">Switches between the Ground Level and Level 2 and other floors views of the map. Algorithms run across both floors simultaneously via stairwells.</Item>
                </Section>
              )}
            </>
          )}

          {/* ── SIM CONTROLS ── */}
          {tab === 'buttons' && (
            <>
              <Section title="Map Selector (Above Canvas)">
                <Item label="Simultaneous Multi-Algorithm Evaluation badge" icon="🔵">Indicates that BFS, DFS, and Hybrid are all running at the same time on the same graph — not sequentially.</Item>
                <Item label="Dynamic: [description]" icon="⚡">Describes the type of dynamic events that will appear during this scenario's simulation.</Item>
                <Item label="Map buttons (Synthetic / Company / Campus)" icon="🗺️">Switches the active graph map. Synthetic generates a random configurable graph; real-world maps load fixed topology data. See the Map Variants tab for details on each map.</Item>
                {scenario === 'gameai' && <Item label="Game Board (Turkish Draughts / Checkers)" icon="♟️">Switches the game board type. Each has different tile layouts, movement rules, and opponent behavior patterns.</Item>}
                {scenario === 'network' && (
                  <>
                    <Item label="MODE: Default vs Device to Device" icon="🎛️">
                      Select the routing style for the active network map:
                      <ul className="list-disc list-inside mt-2 text-gray-300">
                        <li><strong>Default (ISP Broadcast)</strong>: uses standard broadcast-style routing and evaluates how the network behaves when traffic is sent broadly across the topology.</li>
                        <li><strong>Device to Device</strong>: enables the source and destination selectors so you can choose a specific source machine and one or more target machines for targeted routing.</li>
                      </ul>
                    </Item>
                    <Item label="SRC & DST Selectors" icon="🎯">When in Device to Device mode, select the exact source machine and one or more destinations. This lets you compare algorithm routing for a specific pair or group of network devices.</Item>
                    <Item label="Routing Method (Anycast / Multicast)" icon="📡">ANYCAST (Race to First) stops when the first selected destination is reached. MULTICAST (Find All) continues until all selected destinations have been found.</Item>
                  </>
                )}
              </Section>
              <Section title="Simulation Control Buttons (Below Canvas)">
                <Item label="🎲 Reroll Events" icon="">Randomly regenerates the dynamic event schedule (blockages) for the current map. Use this to test a different event pattern without re-running the simulation from scratch.</Item>
                <Item label="🔄 Reset" icon="">Clears all simulation progress and returns to Step 0. Keeps the current map and event schedule loaded.</Item>
                <Item label="⏪ Back" icon="">Steps the simulation backward by one step. Useful for reviewing exactly when a path was rerouted.</Item>
                <Item label="▶️ Run Simulations" icon="🟢">Starts the simulation. All three algorithms begin simultaneously. Button turns red and becomes Pause while running.</Item>
                <Item label="⏸️ Pause" icon="🔴">Pauses the simulation at the current step. Button turns green and becomes Resume.</Item>
                <Item label="▶️ Resume" icon="🟢">Continues the simulation from where it was paused.</Item>
                <Item label="🔄 Replay" icon="🔵">Appears after the simulation finishes. Re-runs the full simulation from the beginning using the same graph and event data.</Item>
                <Item label="Fwd ⏭️" icon="">Steps the simulation forward by one step. Useful for slow manual inspection of each algorithm decision.</Item>
                <Item label="⏭️ Skip" icon="">Jumps directly to the final step (end of simulation), skipping all animation frames.</Item>
              </Section>
            </>
          )}

          {/* ── MAP EVENTS ── */}
          {tab === 'events' && (
            <>
              <Section title="Dynamic Map Events Panel (Right Sidebar)">
                <p className="text-sm text-gray-400 mb-3">Shows a real-time log of all dynamic events that have occurred during the simulation. Each entry includes the step number, the affected node, and which algorithms had their paths severed.</p>
                <Item label="[Step #]" icon="🕐">The simulation step number at which the event was triggered.</Item>
                <Item label="[Balance]" icon="⚖️">Indicates this event was generated by the balance system to maintain realistic simulation difficulty. The system ensures events aren't overly clustered at one algorithm.</Item>
                <Item label="Event Description" icon="📋">A human-readable name of the event generated by the balance system (e.g., "🔥 Overheating Switch at Core-SP3" or "💥 Critical Cascading Failure at Floor-2"). Includes [AoE] tags for area-of-effect cascading blockages.</Item>
                <Item label="Path Severed: [Algorithm]" icon="⚠️">Shown in red. Identifies which algorithm(s) had their active route cut off by this event and were forced to reroute.</Item>
                <Item label="Unaffected" icon="✅">Shown in green. The algorithm's path did not pass through the blocked node — no rerouting needed.</Item>
              </Section>
              <Section title={`Event Types — ${scenario === 'network' ? 'Network Routing' : scenario === 'robotics' ? 'Robotics / Warehouse' : scenario === 'traffic' ? 'Road Traffic' : scenario === 'evacuation' ? 'Emergency Evacuation' : 'Game AI'}`}>
                {events.map(ev => (
                  <div key={ev.event} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 mb-2">
                    <p className="text-sm font-bold text-white mb-1">{ev.icon} {ev.event}</p>
                    <p className="text-xs text-gray-400 mb-1"><span className="text-yellow-400 font-semibold">Cause:</span> {ev.cause}</p>
                    <p className="text-xs text-gray-400"><span className="text-green-400 font-semibold">Resolution:</span> {ev.resolution}</p>
                  </div>
                ))}
              </Section>
              {scenario === 'gameai' && (
                <Section title="Strategy Map Events Panel (Game AI Only)">
                  <p className="text-sm text-gray-400 mb-2">A second events panel exclusive to Game AI that shows detailed per-algorithm impact analysis for each opponent piece movement.</p>
                  <Item label="Opponent Piece Deployed / Attacks / Retreats" icon="🔴">The event type for the opponent piece movement.</Item>
                  <Item label="BFS / DFS / Hybrid — UNAFFECTED" icon="✅">That algorithm's path did not go through the blocked square — it continues without change.</Item>
                  <Item label="BFS / DFS / Hybrid — PATH SEVERED" icon="⚠️">The opponent blocked a square that was part of that algorithm's active route. The algorithm must immediately find an alternative diagonal or straight-line path.</Item>
                </Section>
              )}
            </>
          )}

          {/* ── MAP VARIANTS ── */}
          {tab === 'maps' && (
            <>
              <Section title={`Available Maps — ${scenario === 'network' ? 'Network Routing' : scenario === 'robotics' ? 'Robotics / Warehouse' : scenario === 'traffic' ? 'Road Traffic' : scenario === 'evacuation' ? 'Emergency Evacuation' : 'Game AI Pathfinding'}`}>
                {maps.map(m => (
                  <div key={m.name} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 mb-2">
                    <p className="text-sm font-bold text-white mb-1">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.description}</p>
                  </div>
                ))}
              </Section>
                {scenario === 'robotics' && (
                  <Section title="Multi-Robot Fleet & Delivery Assignments (Robotics Scenario)">
                    <Item label="🤖 Robot Delivery Assignments" icon="⚙️">Assign specific finish line exits (Finish Line 1..18), packing desks, or clutter zones to active robots. Supports setting priority destinations (visited first ⭐) and configuring cargo box counts (1 to 6 boxes per destination).</Item>
                    <Item label="📊 Robot Fleet Status (Sidebar)" icon="🤖">Real-time status tracking showing total cargo box delivery progress (e.g. 48/48 boxes, 100%), progress bars color-coded by algorithm, active robot location, live task badge (Loading 📦, Unloading 🚚, Blocked ⏳, In Transit 🚚), and per-destination box progress.</Item>
                  </Section>
                )}
                {scenario !== 'gameai' ? (
                  <Section title="Dynamic Size Adjuster (Synthetic Maps only)">
                    <Item label="Nodes" icon="🔢">
                      Controls how many nodes are generated in the synthetic graph. The strict mathematical bounds for this scenario to ensure valid layouts are:
                      <ul className="list-disc list-inside mt-2 mb-2 ml-4 text-gray-400">
                        {scenario === 'network' && <li><strong>Network Routing:</strong> 7 to 220 nodes</li>}
                        {scenario === 'robotics' && <li><strong>Robotics / Warehouse:</strong> 13 to 217 nodes</li>}
                        {scenario === 'traffic' && <li><strong>Road Traffic:</strong> 9 to 220 nodes</li>}
                        {scenario === 'evacuation' && <li><strong>Emergency Evacuation:</strong> 28 to 144 nodes</li>}
                      </ul>
                      {scenario === 'robotics' && 'On Synthetic Robotics maps, increasing nodes automatically expands the layout horizontally with up to 18 finish line exit destinations.'}
                    </Item>
                    <Item label="Links" icon="🔗">Controls edge connectivity. Link counts automatically scale with node density to ensure dense graphs remain 100% pathable and connected.</Item>
                    <Item label="Generated X nodes / Y links" icon="📋">Displays actual generated node and edge counts after structure generation.</Item>
                  </Section>
                ) : (
                  <Section title="Dynamic Board Scaling (Game AI)">
                    <Item label="Auto-Snapping Grids" icon="📐">Because a game board must remain a perfect grid (e.g. 8x8 = 64 squares, or 9x9 = 81 squares), clicking the up or down arrows on the Nodes adjuster will automatically snap to the next mathematically valid board size. The Game AI graph has a strict bound of <strong>17 to 145 nodes</strong>. The total nodes will equal the playable squares on the board plus 1 or 2 extra nodes for the spawning Strategy AI and portals.</Item>
                    <Item label="Fixed Links" icon="🔗">Game boards strictly adhere to the movement rules of the game (e.g. orthogonal slides in Dama, or diagonal jumps in Checkers). Therefore, the Links slider input is ignored for Game AI scenarios, and the graph will always generate exactly the mathematically valid number of links for that board size.</Item>
                  </Section>
                )}
            </>
          )}

          {/* ── RESULTS & SAVE ── */}
          {tab === 'results' && (
            <>
              <Section title="Comparative Benchmark Table (Appears after simulation)">
                <p className="text-sm text-gray-400 mb-2">Summarizes the final performance of all three algorithms side-by-side once the simulation completes.</p>
                <Item label="Execution Time" icon="⏱️">How long each algorithm took to find its path (in milliseconds). Includes rerouting time after dynamic events.</Item>
                <Item label="Nodes Visited" icon="🔢">Total unique nodes explored. Directly measures algorithmic efficiency — fewer explored nodes is better.</Item>
                <Item label="Completion Rate" icon="📈">Whether the algorithm successfully reached the target. 100% = found a path; values below 100% indicate partial completion or failure due to blocked routes.</Item>
                <Item label="Memory Used" icon="💾">Peak memory consumed during the run (in MB). BFS typically uses the most; DFS the least.</Item>
                <Item label="Path Optimality" icon="🎯">How close the found path is to the theoretical shortest path. BFS always achieves 100%; DFS and Hybrid may score lower.</Item>
                <Item label="Adaptability" icon="🔄">A composite score measuring rerouting speed and path quality after each dynamic event. Higher is better.</Item>
              </Section>
              <Section title="Save Comparison to History">
                <Item label="💾 Save Comparison to History" icon="">Saves the current benchmark result to your in-session history for this scenario. You can view, compare, and replay all saved results via the Result History button in the top header.</Item>
              </Section>
              <Section title="Result History Modal">
                <Item label="🗄️ Result History [N]" icon="">The button in the top header. Opens a modal listing all saved simulation results for the current scenario. Each entry shows the map used, algorithm metrics, and a Replay button to re-animate that exact run.</Item>
              </Section>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-700 shrink-0 flex justify-between items-center">
          <span className="text-xs text-gray-600">Click outside or press ✕ to close</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Got it!
          </button>
        </div>
      </div>
      
      {/* Zoom Lightbox */}
      {zoomedImage && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[200] overflow-y-auto bg-black/90 backdrop-blur-md cursor-zoom-out flex p-4 sm:p-10"
          onClick={() => setZoomedImage(null)}
        >
          <img 
            src={zoomedImage} 
            alt="Zoomed visual guide" 
            className="m-auto w-auto h-auto max-w-none rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)]"
          />
        </div>,
        document.body
      )}
    </div>
  );
};
