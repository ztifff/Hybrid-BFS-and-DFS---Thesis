import { useState, useEffect, useRef, useMemo } from 'react';
import { ScenarioType } from '../types';
import { PlacementMode } from '../components/simulation/TopologyEditor';
import { useTutorial, TUTORIAL_STEPS } from '../components/TutorialOverlay';

export function useSimulationViewLogic(scenario: ScenarioType, sim: any) {
  // ── Purely local UI state ───────────────
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [terminalNodeId, setTerminalNodeId] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isBlockageMode, setIsBlockageMode] = useState(false);
  const [blockageBrush, setBlockageBrush] = useState<string>('');
  const [placementMode, setPlacementMode] = useState<PlacementMode>(null);
  const [draftBlockedNodes, setDraftBlockedNodes] = useState<{ nodeId: string; label: string }[] | null>(null);

  // ── On-map endpoint picking ──────────────────────
  const [pickMode, setPickMode] = useState<'source' | 'dest' | null>(null);
  const [pickDraft, setPickDraft] = useState<string[]>([]);
  const [pickToast, setPickToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const pickToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tutorial = useTutorial();

  const handleEventClick = (nodeId: string) => {
    setHighlightedNodeId(prev => prev === nodeId ? null : nodeId);
  };

  const showPickToast = (msg: string, ok: boolean) => {
    if (pickToastTimer.current) clearTimeout(pickToastTimer.current);
    setPickToast({ msg, ok });
    pickToastTimer.current = setTimeout(() => setPickToast(null), 2600);
  };

  const nodeLabel = (id: string | null | undefined) => {
    if (!id) return '—';
    const n = sim.currentGraph?.nodes.find((x: any) => x.id === id);
    return n?.label ? n.label.replace('\n', ' - ') : id;
  };

  const supportsDestPick = scenario === 'network' || scenario === 'traffic';
  const minDestinations = scenario === 'network' ? 2 : 1;

  const currentSourceId: string | null = (() => {
    if (!sim.currentGraph) return null;
    const nodeIds = new Set(sim.currentGraph.nodes.map((n: any) => n.id));
    const checkNode = (id: string | null | undefined) => (id && nodeIds.has(id) ? id : null);
    const isEvacuationRoom = (node: any) => ['place', 'origin', 'room', 'start', 'cinema'].includes(node.type);

    switch (scenario) {
      case 'network':
        return checkNode(sim.sourceDevice) || checkNode(sim.currentGraph.sourceId) || sim.currentGraph.nodes[0]?.id || null;
      case 'traffic':
        return checkNode(sim.trafficSourceId) || checkNode(sim.currentGraph.sourceId) || sim.currentGraph.nodes[0]?.id || null;
      case 'evacuation':
        return [sim.evacuationSourceId, sim.currentGraph.sourceId]
          .find(id => id && sim.currentGraph.nodes.some((node: any) => node.id === id && isEvacuationRoom(node)))
          || sim.currentGraph.nodes.find((node: any) => isEvacuationRoom(node))?.id
          || null;
      case 'robotics':
        return checkNode(sim.robotAssignments[0]?.robotId) || checkNode(sim.currentGraph.sourceId) || sim.currentGraph.nodes[0]?.id || null;
      case 'gameai':
        return checkNode(sim.gameAISourceId) || null;
      default:
        return null;
    }
  })();

  const currentDestIds: string[] = (() => {
    if (!sim.currentGraph) return [];
    const nodeIds = new Set(sim.currentGraph.nodes.map((n: any) => n.id));

    if (scenario === 'network') {
      return sim.destinationDevices.filter((d: string) => nodeIds.has(d));
    }
    if (scenario === 'traffic') {
      const customDests = sim.trafficDestinationIds.filter((d: string) => nodeIds.has(d));
      if (customDests.length > 0) return customDests;
      return (sim.currentGraph.destinationIds || []).filter((d: string) => nodeIds.has(d));
    }
    if (scenario === 'robotics') {
      return Array.from<string>(new Set(sim.robotAssignments.flatMap((r: any) => r.destinations))).filter((d) => nodeIds.has(d));
    }
    return (sim.currentGraph.destinationIds || []).filter((d: string) => nodeIds.has(d));
  })();

  const pickRuleText = (role: 'source' | 'dest'): string => {
    switch (scenario) {
      case 'network':
        if (sim.networkRoutingMode === 'device-to-device') return 'End devices only (PCs, laptops, printers, tablets — APs excluded)';
        return role === 'source' ? 'Routers only (ISP / Core / Building routers)' : 'End devices or servers only (APs excluded)';
      case 'traffic': return 'Intersections, streets, origins or highways';
      case 'evacuation': return 'Rooms / places only';
      case 'robotics': return 'Depots / robot docks only';
      case 'gameai': return 'Your home-row tiles only';
      default: return '';
    }
  };

  const validatePick = (nodeId: string, role: 'source' | 'dest'): { ok: boolean; reason?: string } => {
    const n = sim.currentGraph?.nodes.find((x: any) => x.id === nodeId);
    if (!n) return { ok: false, reason: 'Unknown node.' };
    const t = n.type as string;
    const label = (n.label || '').toLowerCase();
    const isAP = t === 'wireless_ap' || (t === 'access_point' && !label.includes('rack')) || /(^|\s|[-_])ap(\s|[-_]|\d|$)/i.test(label) || /^ap[_-]/i.test(n.id);
    const isEndDevice = (label.includes('rack') || t === 'end_device') && !isAP;
    const isRouter = t === 'datacenter' || t === 'router' || t === 'building_router';
    const pretty = (n.label || n.id).replace('\n', ' ');

    if (sim.customBlockedNodes.some((b: any) => b.nodeId === nodeId)) {
      return { ok: false, reason: `${pretty} is blocked.` };
    }

    switch (scenario) {
      case 'network': {
        if (isAP) {
          return { ok: false, reason: `${pretty} is an Access Point — APs connect wireless devices and cannot be chosen as an end device or exit.` };
        }
        if (sim.networkRoutingMode === 'device-to-device') {
          if (!isEndDevice) return { ok: false, reason: `${pretty} is infrastructure — only end devices can be selected in Device-to-Device mode.` };
        } else if (role === 'source') {
          if (!isRouter) return { ok: false, reason: `${pretty} is not a router — Default mode can only start from a router.` };
        } else if (!(isEndDevice || t === 'server')) {
          return { ok: false, reason: `${pretty} can't be an exit — pick an end device or server.` };
        }
        if (role === 'source' && sim.destinationDevices.includes(nodeId)) return { ok: false, reason: `${pretty} is already an exit.` };
        if (role === 'dest' && nodeId === sim.sourceDevice) return { ok: false, reason: `${pretty} is the starting point.` };
        return { ok: true };
      }
      case 'traffic': {
        if (!['intersection', 'street', 'origin', 'highway'].includes(t)) return { ok: false, reason: `${pretty} is not a road node.` };
        if (role === 'source' && currentDestIds.includes(nodeId)) return { ok: false, reason: `${pretty} is already a destination.` };
        if (role === 'dest' && nodeId === currentSourceId) return { ok: false, reason: `${pretty} is the starting point.` };
        return { ok: true };
      }
      case 'evacuation':
        if (!['place', 'origin', 'room', 'start', 'cinema'].includes(t)) return { ok: false, reason: `${pretty} is not a room — evacuees must start inside a room.` };
        return { ok: true };
      case 'robotics':
        if (!['depot', 'place'].includes(t)) return { ok: false, reason: `${pretty} is not a depot — robots must start at a depot.` };
        return { ok: true };
      case 'gameai':
        if (!(t === 'board_tile' && (n.id.endsWith('1') || /^[a-z]+1$/.test(n.id)))) return { ok: false, reason: `${pretty} is not on your home row.` };
        return { ok: true };
      default:
        return { ok: false };
    }
  };

  const commitSource = (nodeId: string) => {
    switch (scenario) {
      case 'network': sim.setSourceDevice(nodeId); break;
      case 'traffic': sim.setTrafficSourceId(nodeId); break;
      case 'evacuation': sim.setEvacuationSourceId(nodeId); break;
      case 'gameai': sim.setGameAISourceId(nodeId); break;
      case 'robotics': {
        const updated = [...sim.robotAssignments];
        if (updated.length > 0) updated[0] = { ...updated[0], robotId: nodeId };
        else updated.push({ robotId: nodeId, destinations: [], boxCounts: {} });
        sim.setRobotAssignments(updated);
        break;
      }
    }
  };

  const startPicking = (role: 'source' | 'dest') => {
    if (sim.isComputing || sim.status === 'running') return;
    setIsBlockageMode(false);
    setPlacementMode(null);
    setHighlightedNodeId(null);
    setPickDraft(role === 'dest' ? [...currentDestIds] : []);
    setPickMode(role);
  };

  const cancelPicking = () => {
    setPickMode(null);
    setPickDraft([]);
  };

  const finishPicking = () => {
    if (pickMode !== 'dest') { cancelPicking(); return; }
    if (pickDraft.length < minDestinations) {
      showPickToast(`Select at least ${minDestinations} exit${minDestinations > 1 ? 's' : ''} before finishing.`, false);
      return;
    }
    if (scenario === 'network') sim.setDestinationDevices(pickDraft);
    if (scenario === 'traffic') sim.setTrafficDestinationIds(pickDraft);
    showPickToast(`${pickDraft.length} exit${pickDraft.length > 1 ? 's' : ''} saved.`, true);
    setPickMode(null);
    setPickDraft([]);
  };

  const handlePickClick = (nodeId: string) => {
    if (!pickMode) return;
    const res = validatePick(nodeId, pickMode);
    if (!res.ok) { showPickToast(res.reason || 'Invalid selection.', false); return; }
    if (pickMode === 'source') {
      commitSource(nodeId);
      showPickToast(`Starting point set to ${nodeLabel(nodeId)}.`, true);
      setPickMode(null);
      return;
    }
    setPickDraft(prev => prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]);
  };

  useEffect(() => {
    setPickMode(null);
    setPickDraft([]);
  }, [scenario, sim.mapId, sim.gameBoard, sim.networkRoutingMode]);

  useEffect(() => {
    if (sim.status === 'running' || sim.isComputing) { setPickMode(null); setPickDraft([]); }
  }, [sim.status, sim.isComputing]);

  useEffect(() => {
    if (!pickMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setPickMode(null); setPickDraft([]); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pickMode]);

  const patchedGraph = useMemo(() => {
    if (!sim.currentGraph) return null;
    const g = { ...sim.currentGraph };
    const nodeIds = new Set(g.nodes.map((n: any) => n.id));

    if (scenario === 'network') {
      if (sim.sourceDevice && nodeIds.has(sim.sourceDevice)) g.sourceId = sim.sourceDevice;
      if (sim.destinationDevices.length > 0) {
        const valid = sim.destinationDevices.filter((d: string) => nodeIds.has(d));
        if (valid.length > 0) g.destinationIds = valid;
      }
    }
    if (scenario === 'traffic') {
      if (sim.trafficSourceId && nodeIds.has(sim.trafficSourceId)) g.sourceId = sim.trafficSourceId;
      if (sim.trafficDestinationIds.length > 0) {
        const valid = sim.trafficDestinationIds.filter((d: string) => nodeIds.has(d));
        if (valid.length > 0) g.destinationIds = valid;
      }
    }
    if (scenario === 'evacuation') {
      const isEvacuationRoom = (node: any) => ['place', 'origin', 'room', 'start', 'cinema'].includes(node.type);
      const validSourceId = [sim.evacuationSourceId, g.sourceId]
        .find(id => id && nodeIds.has(id) && isEvacuationRoom(g.nodes.find((node: any) => node.id === id)))
        || g.nodes.find((node: any) => isEvacuationRoom(node))?.id;
      if (validSourceId) g.sourceId = validSourceId;
    }
    if (scenario === 'gameai' && sim.gameAISourceId) {
      const entryNode = g.nodes.find((n: any) => n.id === sim.gameAISourceId);
      if (entryNode) {
        g.nodes = g.nodes.map((n: any) => n.id === 'spawn' ? { ...n, x: entryNode.x, y: entryNode.y } : n);
      }
    }
    if (scenario === 'robotics') {
      const robotDests = Array.from(new Set(sim.robotAssignments.flatMap((r: any) => r.destinations))).filter(d => nodeIds.has(d));
      if (robotDests.length > 0) g.destinationIds = robotDests;
    }
    if (pickMode === 'dest' && (scenario === 'network' || scenario === 'traffic')) {
      g.destinationIds = pickDraft;
    }
    return g;
  }, [sim.currentGraph, scenario, sim.networkRoutingMode, sim.sourceDevice, sim.destinationDevices, sim.trafficSourceId, sim.trafficDestinationIds, sim.evacuationSourceId, sim.gameAISourceId, sim.robotAssignments, pickMode, pickDraft]);

  const BLOCKAGE_LABELS: Record<ScenarioType, string[]> = {
    network: ['🔌 Cable Unplugged', '⚡ Rack Power Loss', '🌐 Massive DDoS Attack'],
    robotics: ['📦 Pallet Spill', '🤖 Robot Malfunction', '⚠️ Massive Rack Collapse'],
    traffic: ['🚫 Road Closure', '🚦 Signal Failure', '🚗 Major Accident'],
    evacuation: ['🧱 Debris', '🔒 Shutter Lockout / Trapped Exit', '🔥 Indoor Tenant Fire Spreads'],
    gameai: ['Opponent Piece Deployed', 'Opponent Attacks', 'Opponent Formation'],
  };

  useEffect(() => {
    setBlockageBrush(BLOCKAGE_LABELS[scenario][0]);
  }, [scenario]);

  const previewDynamicEvents = useMemo(() => {
    if (draftBlockedNodes === null && sim.status !== 'idle' && sim.simResults) {
      return (sim.simResults.hybrid.dynamicEvents || []).map((e: any) => {
        if (e.label && e.label.includes(' at ')) return e;
        const node = sim.currentGraph?.nodes.find((n: any) => n.id === e.nodeId);
        const nodeName = node?.label?.trim() ? node.label.split('\n')[0].trim() : e.nodeId;
        return {
          ...e,
          label: `${e.label || '🚫 Blocked'} at ${nodeName}`,
        };
      });
    }
    const nodesToUse = draftBlockedNodes ?? sim.customBlockedNodes ?? [];
    return nodesToUse.map((b: any) => {
      let label = b.label || BLOCKAGE_LABELS[scenario]?.[0] || '🚫 Blocked';
      if (!label.includes(' at ')) {
        const node = sim.currentGraph?.nodes.find((n: any) => n.id === b.nodeId);
        const nodeName = node?.label?.trim() ? node.label.split('\n')[0].trim() : b.nodeId;
        label = `${label} at ${nodeName}`;
      }
      return {
        stepIndex: 0,
        nodeId: b.nodeId,
        blocked: true,
        label,
      };
    });
  }, [sim.status, sim.simResults, sim.customBlockedNodes, draftBlockedNodes, sim.currentGraph, scenario]);

  const baseBtnClass = "px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-xl border border-slate-700/60 bg-slate-800/80 backdrop-blur-md text-slate-300 text-xs xl:text-sm font-medium transition-all duration-200 hover:bg-slate-700/80 hover:text-white hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 xl:gap-2 flex-1 sm:flex-none justify-center whitespace-nowrap";

  const scenarioBtnClass = (() => {
    const map: Record<ScenarioType, string> = {
      network: `${baseBtnClass} hover:border-blue-500/80 hover:shadow-blue-500/20`,
      robotics: `${baseBtnClass} hover:border-orange-500/80 hover:shadow-orange-500/20`,
      traffic: `${baseBtnClass} hover:border-emerald-500/80 hover:shadow-emerald-500/20`,
      evacuation: `${baseBtnClass} hover:border-red-500/80 hover:shadow-red-500/20`,
      gameai: `${baseBtnClass} hover:border-purple-500/80 hover:shadow-purple-500/20`,
    };
    return map[scenario] ?? baseBtnClass;
  })();

  const activeTabClass = (() => {
    const map: Record<ScenarioType, string> = {
      network: 'bg-blue-600/20 backdrop-blur-md text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
      robotics: 'bg-orange-600/20 backdrop-blur-md text-orange-400 border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)]',
      traffic: 'bg-emerald-600/20 backdrop-blur-md text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
      evacuation: 'bg-red-600/20 backdrop-blur-md text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
      gameai: 'bg-purple-600/20 backdrop-blur-md text-purple-400 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    };
    return map[scenario] ?? 'bg-slate-800 text-white border border-slate-500';
  })();

  useEffect(() => {
    if (tutorial.isOpen) return;

    let panelId: string | null = null;
    if (scenario === 'robotics') panelId = 'robotics';
    else if (scenario === 'network' && sim.mapId === 'campus') panelId = 'network_campus';
    else if (scenario === 'gameai') panelId = 'gameai';

    if (panelId) {
      const seenRaw = localStorage.getItem('hybrid_sim_tutorial_seen_panels');
      const seen: string[] = seenRaw ? JSON.parse(seenRaw) : [];
      if (!seen.includes(panelId)) {
        const stepIdx = TUTORIAL_STEPS.findIndex(s => s.target === 'tutorial-scenario-panels');
        if (stepIdx !== -1) {
          const t = setTimeout(() => {
            tutorial.startAt(stepIdx);
            seen.push(panelId!);
            localStorage.setItem('hybrid_sim_tutorial_seen_panels', JSON.stringify(seen));
          }, 800);
          return () => clearTimeout(t);
        }
      }
    }
  }, [scenario, sim.mapId, tutorial.isOpen, tutorial.startAt]);

  const primaryBtnClass = "px-4 xl:px-6 py-1.5 xl:py-2 rounded-xl font-bold text-xs xl:text-sm transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 xl:gap-2 flex-1 sm:flex-none whitespace-nowrap hover:shadow-xl hover:-translate-y-0.5 active:scale-95 text-white";

  const pickDisabled = sim.isComputing || sim.status === 'running' || !sim.currentGraph;

  return {
    highlightedNodeId, setHighlightedNodeId,
    terminalNodeId, setTerminalNodeId,
    isHelpOpen, setIsHelpOpen,
    isBlockageMode, setIsBlockageMode,
    blockageBrush, setBlockageBrush,
    draftBlockedNodes, setDraftBlockedNodes,
    placementMode, setPlacementMode,
    pickMode, setPickMode,
    pickDraft, setPickDraft,
    pickToast, setPickToast,
    tutorial,
    
    handleEventClick,
    showPickToast,
    nodeLabel,
    supportsDestPick,
    minDestinations,
    currentSourceId,
    currentDestIds,
    pickRuleText,
    validatePick,
    commitSource,
    startPicking,
    cancelPicking,
    finishPicking,
    handlePickClick,
    
    patchedGraph,
    BLOCKAGE_LABELS,
    previewDynamicEvents,
    
    baseBtnClass,
    scenarioBtnClass,
    activeTabClass,
    primaryBtnClass,
    pickDisabled,
  };
}
