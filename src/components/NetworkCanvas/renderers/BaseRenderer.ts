import { GraphNode, GraphEdge, ScenarioType, AlgorithmStep } from '../../../types';
import { NODE_CONFIG, EDGE_CONFIG } from '../types';
import { ALGORITHMS } from '../../../config/scenarios';
import { getCiscoIconPath, getCiscoIconCanvas } from '../../../utils/ciscoIcons';
import { drawEvacuationNodeIcon } from '../evacuationNodeIcons';

export interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  pan: { x: number; y: number };
  scale: number;
  offsetX: number;
  offsetY: number;
  scenario: ScenarioType;
  mapId?: string;
  activeFloor?: string;
  isDatacenter: boolean;
  isMassive: boolean;
  visibleNodes: GraphNode[];
  visibleEdges: GraphEdge[];
  visibleNodeMap: Map<string, GraphNode>;
  activeBlocked: Set<string>;
  wasHistoricallyBlocked: Set<string>;
  highlightedNodeId?: string | null;
  sourceId: string;
  sourceIds?: string[];
  destinationIds: string[];
  visibleAlgos: { bfs: boolean; dfs: boolean; hybrid: boolean };
  sets: {
    bfs: { explored: Set<string>; path: Set<string>; current: string | null };
    dfs: { explored: Set<string>; path: Set<string>; current: string | null };
    hyb: { explored: Set<string>; path: Set<string>; current: string | null };
  };
  activeSteps: { bfs: AlgorithmStep | null; dfs: AlgorithmStep | null; hybrid: AlgorithmStep | null };
  graph?: import('../../../types').ScenarioGraph;
  shelfBoxCounts?: Map<string, number>; // nodeId → remaining box count (0–6) for AWS Warehouse
  robotAssignments?: import('../../../types').RobotAssignment[]; // per-robot rack allocation
  followAlgo?: 'bfs' | 'dfs' | 'hybrid' | null;
  disableSimultaneousMode?: boolean;
  workspaceView?: 'physical' | 'logical';
  isFinished?: boolean;
  showHopBadges?: boolean;
  theme?: 'dark' | 'light';
}

export abstract class BaseRenderer {
  protected cBFS = ALGORITHMS.find(a => a.id === 'bfs')?.color || '#4ade80';
  protected cDFS = ALGORITHMS.find(a => a.id === 'dfs')?.color || '#c084fc';
  protected cHYB = ALGORITHMS.find(a => a.id === 'hybrid')?.color || '#fb923c';

  protected renderedTextPositions: { x: number; y: number; radius: number; width?: number; text?: string }[] = [];

  public render(options: RenderOptions) {
    const { ctx, canvasWidth, canvasHeight, zoom, pan } = options;
    const dpr = window.devicePixelRatio || 1;
    const isLight = options.theme === 'light';
    
    // Dynamic algorithm colors based on theme
    if (isLight) {
      this.cBFS = '#15803d'; // High-contrast deep emerald green
      this.cDFS = '#7e22ce'; // High-contrast royal purple
      this.cHYB = '#ea580c'; // High-contrast deep warm amber
    } else {
      this.cBFS = ALGORITHMS.find(a => a.id === 'bfs')?.color || '#4ade80';
      this.cDFS = ALGORITHMS.find(a => a.id === 'dfs')?.color || '#c084fc';
      this.cHYB = ALGORITHMS.find(a => a.id === 'hybrid')?.color || '#fb923c';
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (options.theme === 'light') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    
    ctx.scale(dpr, dpr);
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    ctx.lineCap = 'round';
    this.renderedTextPositions = [];

    this.drawBackground(options);
    this.drawEdges(options);
    this.drawVisitedEdges(options);
    this.drawActivePaths(options);
    this.drawNodesAndLabels(options);
    this.drawEdgeLabels(options);
    this.drawFinalPathHighlight(options);
    this.drawOverlays(options);
  }

  protected getRgba(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  protected sx(x: number, options: RenderOptions) { return (x * options.scale) + options.offsetX; }
  protected sy(y: number, options: RenderOptions) { return (y * options.scale) + options.offsetY; }

  protected drawPath(ctx: CanvasRenderingContext2D, edge: GraphEdge, x1: number, y1: number, x2: number, y2: number, scale: number, ox: number = 0, oy: number = 0) {
    ctx.beginPath();
    if (edge.type === 'serial') {
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const perpX = -dy / len, perpY = dx / len;
      const midX = x1 + dx * 0.5, midY = y1 + dy * 0.5;
      const zigzagSize = 14 * scale; 
      
      ctx.moveTo(x1 + ox, y1 + oy);
      ctx.lineTo(midX - (dx * 0.1) + perpX * zigzagSize + ox, midY - (dy * 0.1) + perpY * zigzagSize + oy);
      ctx.lineTo(midX + (dx * 0.1) - perpX * zigzagSize + ox, midY + (dy * 0.1) - perpY * zigzagSize + oy);
      ctx.lineTo(x2 + ox, y2 + oy);
    } else {
      ctx.moveTo(x1 + ox, y1 + oy);
      ctx.lineTo(x2 + ox, y2 + oy);
    }
  }

  protected drawBackground(_options: RenderOptions) {}

  protected drawEdges(options: RenderOptions) {
    const { ctx, visibleEdges, visibleNodeMap, isDatacenter, isMassive, sets, zoom } = options;
    const isLight = options.theme === 'light';
    const baseOpacity = isLight 
      ? (isDatacenter ? 0.75 : (isMassive ? 0.75 : 0.9)) 
      : (isDatacenter ? 0.2 : (isMassive ? 0.15 : 0.35));

    visibleEdges.forEach(edge => {
      const fromNode = visibleNodeMap.get(edge.from);
      const toNode = visibleNodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const x1 = this.sx(fromNode.x, options), y1 = this.sy(fromNode.y, options);
      const x2 = this.sx(toNode.x, options), y2 = this.sy(toNode.y, options);
      const isExplored = (id: string) => sets.bfs.explored.has(id) || sets.dfs.explored.has(id) || sets.hyb.explored.has(id);
      const expAny = isExplored(edge.from) && isExplored(edge.to);
      const cfg = EDGE_CONFIG[edge.type] ?? EDGE_CONFIG.path;
      
      const rawWidth = isLight
        ? (isDatacenter ? 0.9 : (isMassive ? 1.0 : Math.max(2.5, cfg.width * 1.3)))
        : (isDatacenter ? 0.25 : (isMassive ? 0.3 : cfg.width));

      // Guarantee minimum on-screen physical thickness so zoomed-out graphs don't become invisible hair-lines
      const minScreenPx = isLight ? (isMassive ? 1.3 : 2.0) : (isMassive ? 0.8 : 1.2);
      const effectiveWidth = Math.max(rawWidth, minScreenPx / Math.max(zoom, 0.12));

      const isBlocked = options.activeBlocked.has(edge.from) || options.activeBlocked.has(edge.to);

      this.drawPath(ctx, edge, x1, y1, x2, y2, options.scale);
      
      let edgeColor = cfg.color;
      if (isLight) {
        if (edgeColor === '#ffffff' || edgeColor === '#fff') edgeColor = '#475569';
        else if (edgeColor === '#6ee7b7') edgeColor = '#047857'; // road: deep high-contrast pine/emerald
        else if (edgeColor === '#c4b5fd') edgeColor = '#6d28d9'; // path / stairwell: deep purple
        else if (edgeColor === '#fca5a5') edgeColor = '#be123c'; // corridor: deep rose
        else if (edgeColor === '#60a5fa') edgeColor = '#1d4ed8'; // fiber: bold blue
        else if (edgeColor === '#fdba74') edgeColor = '#c2410c'; // copper: rust amber
        else if (edgeColor === '#fbbf24') edgeColor = '#b45309'; // auto_connect: amber
        else if (edgeColor === '#94a3b8') edgeColor = '#334155'; // ethernet: deep slate
        else if (edgeColor === '#06b6d4') edgeColor = '#0e7490'; // wireless: deep cyan
      }

      if (isBlocked && options.scenario === 'gameai') {
        ctx.strokeStyle = this.getRgba('#ef4444', Math.max(baseOpacity * 2, 0.8));
        ctx.lineWidth = effectiveWidth * 2.2;
      } else if (options.scenario === 'traffic' && options.workspaceView === 'physical' && options.mapId !== 'synthetic') {
        const lbl = (edge.label || '').toLowerCase();
        const isHighway = lbl.includes('south luzon') || lbl.includes('slex') || lbl.includes('expressway');
        const isPrimary = lbl.includes('national') || lbl.includes('mayapa') || lbl.includes('pulo-diezmo') || lbl.includes('arterial');

        let roadBaseColor = isLight ? '#94a3b8' : '#334155';
        let roadWidth = effectiveWidth * 2.0;

        if (isHighway) {
          roadBaseColor = isLight ? '#b91c1c' : '#dc2626'; // High-contrast Red Expressway (SLEX)
          roadWidth = effectiveWidth * 3.4;
        } else if (isPrimary) {
          roadBaseColor = isLight ? '#c2410c' : '#ea580c'; // Warm Orange Arterial Thoroughfare
          roadWidth = effectiveWidth * 2.5;
        }

        ctx.strokeStyle = expAny 
          ? this.getRgba(roadBaseColor, isLight ? 0.75 : 0.45) 
          : this.getRgba(roadBaseColor, isLight ? 0.95 : 0.85);
        ctx.lineWidth = roadWidth;
      } else {
        ctx.strokeStyle = expAny 
          ? this.getRgba(isLight ? '#475569' : '#64748b', isLight ? 0.7 : 0.4) 
          : this.getRgba(edgeColor, baseOpacity);
        ctx.lineWidth = effectiveWidth;
      }
      
      ctx.setLineDash(cfg.dash.length > 0 ? cfg.dash : []);
      ctx.stroke();

      if (options.scenario === 'traffic' && options.workspaceView === 'physical' && options.mapId !== 'synthetic' && !isBlocked) {
        const lbl = (edge.label || '').toLowerCase();
        const isHighway = lbl.includes('south luzon') || lbl.includes('slex') || lbl.includes('expressway');
        const isPrimary = lbl.includes('national') || lbl.includes('mayapa') || lbl.includes('pulo-diezmo') || lbl.includes('arterial');

        if (isHighway) {
          ctx.strokeStyle = isLight ? '#fca5a5' : '#f87171'; // SLEX inner luminous ribbon
          ctx.lineWidth = effectiveWidth * 1.8;
          ctx.stroke();
        } else if (isPrimary) {
          ctx.strokeStyle = isLight ? '#fed7aa' : '#fb923c'; // Arterial inner warm ribbon
          ctx.lineWidth = effectiveWidth * 1.3;
          ctx.stroke();
        } else {
          ctx.strokeStyle = isLight ? '#e2e8f0' : '#475569'; // Clean road center
          ctx.lineWidth = effectiveWidth * 1.0;
          ctx.stroke();
        }
      }
    });
  }

  protected drawActivePaths(options: RenderOptions) {
    const { ctx, visibleEdges, visibleNodeMap, sets, visibleAlgos, isMassive, zoom } = options;
    const isLight = options.theme === 'light';
    const zoomFactor = Math.max(zoom, 0.12);
    ctx.setLineDash([]);
    visibleEdges.forEach(edge => {
      const fromNode = visibleNodeMap.get(edge.from);
      const toNode = visibleNodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const edgeTouchesBlocked = options.activeBlocked.has(edge.from) || options.activeBlocked.has(edge.to);
      const pBFS = !edgeTouchesBlocked && sets.bfs.path.has(edge.from) && sets.bfs.path.has(edge.to);
      const pDFS = !edgeTouchesBlocked && sets.dfs.path.has(edge.from) && sets.dfs.path.has(edge.to);
      const pHYB = !edgeTouchesBlocked && sets.hyb.path.has(edge.from) && sets.hyb.path.has(edge.to);

      if (pBFS || pDFS || pHYB) {
        const x1 = this.sx(fromNode.x, options), y1 = this.sy(fromNode.y, options);
        const x2 = this.sx(toNode.x, options), y2 = this.sy(toNode.y, options);
        this.drawPath(ctx, edge, x1, y1, x2, y2, options.scale);
        
        if (pBFS && visibleAlgos.bfs) { 
          ctx.strokeStyle = this.getRgba(this.cBFS, 0.95); 
          ctx.lineWidth = isMassive ? 2.5 : Math.max(8, (isLight ? 4.5 : 3.5) / zoomFactor); 
          ctx.stroke(); 
        }
        if (pDFS && visibleAlgos.dfs) { 
          ctx.strokeStyle = this.getRgba(this.cDFS, 0.95); 
          ctx.lineWidth = isMassive ? 1.8 : Math.max(5, (isLight ? 3.5 : 2.5) / zoomFactor); 
          ctx.stroke(); 
        }
        if (pHYB && visibleAlgos.hybrid) { 
          ctx.strokeStyle = this.getRgba(this.cHYB, 1); 
          ctx.lineWidth = isMassive ? 1.2 : Math.max(3, (isLight ? 2.8 : 2.0) / zoomFactor); 
          ctx.stroke(); 
        }
      }
    });
  }

  protected drawVisitedEdges(options: RenderOptions) {
    const { ctx, visibleEdges, visibleNodeMap, sets, visibleAlgos, isMassive, isDatacenter, zoom } = options;
    const isLight = options.theme === 'light';
    ctx.setLineDash([]);
    visibleEdges.forEach(edge => {
      const fromNode = visibleNodeMap.get(edge.from);
      const toNode = visibleNodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const x1 = this.sx(fromNode.x, options), y1 = this.sy(fromNode.y, options);
      const x2 = this.sx(toNode.x, options), y2 = this.sy(toNode.y, options);
      const cfg = EDGE_CONFIG[edge.type] ?? EDGE_CONFIG.path;
      
      const rawWidth = isLight
        ? (isDatacenter ? 0.8 : (isMassive ? 0.9 : Math.max(2.0, cfg.width * 1.2)))
        : (isDatacenter ? 0.25 : (isMassive ? 0.3 : cfg.width));
      const minScreenPx = isLight ? (isMassive ? 1.2 : 1.8) : (isMassive ? 0.7 : 1.0);
      const effectiveWidth = Math.max(rawWidth, minScreenPx / Math.max(zoom, 0.12));

      const isBlocked = (id: string) => options.activeBlocked.has(id);
      const vBFS = (sets.bfs.explored.has(edge.from) && sets.bfs.explored.has(edge.to)) && !isBlocked(edge.from) && !isBlocked(edge.to) && !(sets.bfs.path.has(edge.from) && sets.bfs.path.has(edge.to));
      const vDFS = (sets.dfs.explored.has(edge.from) && sets.dfs.explored.has(edge.to)) && !isBlocked(edge.from) && !isBlocked(edge.to) && !(sets.dfs.path.has(edge.from) && sets.dfs.path.has(edge.to));
      const vHYB = (sets.hyb.explored.has(edge.from) && sets.hyb.explored.has(edge.to)) && !isBlocked(edge.from) && !isBlocked(edge.to) && !(sets.hyb.path.has(edge.from) && sets.hyb.path.has(edge.to));

      if (vBFS || vDFS || vHYB) {
        if (isMassive || isDatacenter) {
          const opacity = isLight ? (options.isFinished ? 0.55 : 0.8) : (options.isFinished ? 0.35 : 0.55);
          const strokeMult = options.isFinished ? 3.5 : 6.0;
          if (vBFS && visibleAlgos.bfs) { this.drawPath(ctx, edge, x1, y1, x2, y2, options.scale); ctx.strokeStyle = this.getRgba(this.cBFS, opacity); ctx.lineWidth = effectiveWidth * strokeMult; ctx.stroke(); }
          if (vDFS && visibleAlgos.dfs) { this.drawPath(ctx, edge, x1, y1, x2, y2, options.scale); ctx.strokeStyle = this.getRgba(this.cDFS, opacity + (options.isFinished ? 0.02 : 0.1)); ctx.lineWidth = effectiveWidth * (options.isFinished ? 3.0 : 4.5); ctx.stroke(); }
          if (vHYB && visibleAlgos.hybrid) { this.drawPath(ctx, edge, x1, y1, x2, y2, options.scale); ctx.strokeStyle = this.getRgba(this.cHYB, opacity + (options.isFinished ? 0.04 : 0.2)); ctx.lineWidth = effectiveWidth * (options.isFinished ? 2.5 : 2.0); ctx.stroke(); }
        } else {
          const dx = x2 - x1, dy = y2 - y1;
          const len = Math.hypot(dx, dy) || 1;
          const perpX = -dy / len, perpY = dx / len;
          
          const stackOffset = effectiveWidth * 1.5; 
          const algoLines = [
            { active: vBFS && visibleAlgos.bfs, color: this.cBFS, offset: -stackOffset },
            { active: vDFS && visibleAlgos.dfs, color: this.cDFS, offset: 0 },
            { active: vHYB && visibleAlgos.hybrid, color: this.cHYB, offset: stackOffset }
          ];

          const edgeOpacity = isLight ? (options.isFinished ? 0.65 : 0.8) : (options.isFinished ? 0.3 : 0.35);
          algoLines.forEach(algo => {
            if (algo.active) {
              this.drawPath(ctx, edge, x1, y1, x2, y2, options.scale, perpX * algo.offset, perpY * algo.offset);
              ctx.strokeStyle = this.getRgba(algo.color, edgeOpacity); 
              ctx.lineWidth = effectiveWidth * (options.isFinished ? 1.3 : 1.6); 
              ctx.stroke();
            }
          });
        }
      }
    });
  }

  protected drawNodesAndLabels(options: RenderOptions) {
    const { ctx, visibleNodes, isDatacenter, isMassive, zoom, pan, mapId, scenario, sourceId, sourceIds, destinationIds, visibleAlgos, sets, activeBlocked, wasHistoricallyBlocked, activeSteps } = options;


    visibleNodes.forEach(node => {
      const isRealWorldPlace = scenario === 'evacuation' && !['start', 'emergency_exit', 'corridor', 'stairwell', 'fire'].includes(node.type);
      const cfg = NODE_CONFIG[node.type] ?? { icon: '🏪', radius: 18, baseColor: '#0e7490' };
      const cx = this.sx(node.x, options), cy = this.sy(node.y, options);
      const isBlocked = activeBlocked.has(node.id);
      const isSource = node.id === sourceId || (sourceIds && sourceIds.includes(node.id));
      const isDest = destinationIds.includes(node.id);

      const currBFS = visibleAlgos.bfs && sets.bfs.current === node.id;
      const currDFS = visibleAlgos.dfs && sets.dfs.current === node.id;
      const currHYB = visibleAlgos.hybrid && sets.hyb.current === node.id;
      const isImportant = isSource || isDest || currBFS || currDFS || currHYB;
      
      const expBFS = visibleAlgos.bfs && sets.bfs.explored.has(node.id);
      const expDFS = visibleAlgos.dfs && sets.dfs.explored.has(node.id);
      const expHYB = visibleAlgos.hybrid && sets.hyb.explored.has(node.id);

      const inPathBFS = visibleAlgos.bfs && sets.bfs.path.has(node.id);
      const inPathDFS = visibleAlgos.dfs && sets.dfs.path.has(node.id);
      const inPathHYB = visibleAlgos.hybrid && sets.hyb.path.has(node.id);
      const inAnyPath = inPathBFS || inPathDFS || inPathHYB;
      
      const ringTint = isRealWorldPlace ? cfg.baseColor : null;
      const activeExplorations = [
        { id: 'bfs', active: expBFS, color: ringTint ?? this.cBFS },
        { id: 'dfs', active: expDFS, color: ringTint ?? this.cDFS },
        { id: 'hyb', active: expHYB, color: ringTint ?? this.cHYB }
      ].filter(e => e.active);

      const isBlockedImportant = isBlocked;
      let r = isMassive ? (isImportant || isBlockedImportant ? 4.5 : (activeExplorations.length > 0 ? 2.5 : 1.2)) : cfg.radius;
      if (scenario === 'robotics' && mapId === 'synthetic' && node.type === 'delivery_bay') r = isMassive ? 3 : 9;
      if (isDatacenter) r = (isImportant || isBlockedImportant) ? 8 : 4.5;
      
      const currentRadii = isMassive ? [2.2, 1.2, 0.6] : [r * 0.85, r * 0.55, r * 0.25];
      const currentStrokes = isMassive ? [0.5, 0.3, 0.1] : [2, 1.5, 1];

      let fillColor = cfg.baseColor;
      let opacity = (isMassive && !isImportant && !isBlockedImportant) ? 0.3 : 1;
      if (options.isFinished && !inAnyPath && !isImportant && !isBlockedImportant) {
        opacity = activeExplorations.length > 0 ? 0.5 : 0.2;
      }
      
      const BLOCKED_ICONS: Record<string, string> = {
        traffic:    '\uD83D\uDEAB', 
        evacuation: '⛔', 
        robotics:   '\uD83D\uDEA7', 
        network:    '\uD83D\uDCA5', 
        gameai:     mapId === 'dama' ? '\uD83D\uDD3B' : '\uD83D\uDD34', 
      };
      const blockedIcon = BLOCKED_ICONS[scenario] ?? '\uD83D\uDCA5';

      if (isBlocked) { 
        fillColor = scenario === 'evacuation' ? '#3f1212' : '#dc2626'; 
        opacity = 1; 
      }

      const bfsFound = !visibleAlgos.bfs || (activeSteps.bfs?.foundDestinations?.includes(node.id) ?? false);
      const dfsFound = !visibleAlgos.dfs || (activeSteps.dfs?.foundDestinations?.includes(node.id) ?? false);
      const hybFound = !visibleAlgos.hybrid || (activeSteps.hybrid?.foundDestinations?.includes(node.id) ?? false);
      const isReachedDest = isDest && bfsFound && dfsFound && hybFound;

      if (isSource) { fillColor = '#16a34a'; } 
      else if (isReachedDest) { fillColor = '#22c55e'; }
      else if (isDest) { fillColor = '#b91c1c'; }

      if (isBlocked && (isMassive || isDatacenter)) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + (isDatacenter ? 4 : 2.5), 0, Math.PI * 2);
        ctx.strokeStyle = scenario === 'evacuation' ? 'rgba(127, 29, 29, 0.7)' : 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = isDatacenter ? 1.5 : 1;
        ctx.stroke();
      }

      if (wasHistoricallyBlocked.has(node.id) && !isBlocked) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = scenario === 'evacuation' ? 'rgba(234, 88, 12, 0.5)' : 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (currBFS || currDFS || currHYB) {
        ctx.shadowBlur = 6;
        ctx.lineWidth = 1.5;
        if (currBFS) { ctx.beginPath(); ctx.arc(cx, cy, r + (isMassive ? 2 : 8), 0, Math.PI * 2); ctx.strokeStyle = this.cBFS; ctx.shadowColor = this.cBFS; ctx.stroke(); }
        if (currDFS) { ctx.beginPath(); ctx.arc(cx, cy, r + (isMassive ? 4 : 12), 0, Math.PI * 2); ctx.strokeStyle = this.cDFS; ctx.shadowColor = this.cDFS; ctx.stroke(); }
        if (currHYB) { ctx.beginPath(); ctx.arc(cx, cy, r + (isMassive ? 6 : 16), 0, Math.PI * 2); ctx.strokeStyle = this.cHYB; ctx.shadowColor = this.cHYB; ctx.stroke(); }
        ctx.shadowBlur = 0; 
      }

      const isPhysicalTraffic = scenario === 'traffic' && options.workspaceView === 'physical' && options.mapId !== 'synthetic';
      const isRegularRoadNode = node.type === 'street' || node.type === 'intersection';
      const shouldHideCircle = isPhysicalTraffic && isRegularRoadNode && !isImportant && !isBlocked;

      const nodeIconSrc = scenario === 'network'
        ? (getCiscoIconPath(node) || cfg.iconImg)
        : scenario === 'robotics' ? cfg.iconImg : null;
      const isLight = options.theme === 'light';

      if (!shouldHideCircle) {
        if (nodeIconSrc && !isMassive) {
          if (isBlocked) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = this.getRgba('#dc2626', opacity);
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ef4444';
            ctx.stroke();
          } else {
            // Stacked outer rings for active algorithm exploration
            if (activeExplorations.length > 0) {
              activeExplorations.forEach((exp, index) => {
                ctx.beginPath();
                ctx.arc(cx, cy, r + 2.5 + (index * 2.5), 0, Math.PI * 2);
                ctx.strokeStyle = exp.color;
                ctx.lineWidth = 2;
                ctx.stroke();
              });
            }

            // Clean badge circular background
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = scenario === 'robotics' || isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.92)';
            ctx.fill();

            // Device role border
            ctx.lineWidth = isImportant ? 2.5 : 1.5;
            ctx.strokeStyle = isSource
              ? (isLight ? '#16a34a' : '#4ade80')
              : isDest
              ? (isReachedDest ? '#22c55e' : '#f87171')
              : (isLight ? (fillColor || '#334155') : (fillColor || '#38bdf8'));
            ctx.stroke();
          }
        } else {
          if (isBlocked || isSource || isDest || activeExplorations.length === 0) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = this.getRgba(fillColor, opacity);
            ctx.fill();
            if (!isMassive || isImportant) {
              ctx.lineWidth = isBlocked ? 2 : (isSource || isDest ? 3 : 1);
              ctx.strokeStyle = isBlocked ? (scenario === 'evacuation' ? '#7f1d1d' : '#ef4444') : 
                                isSource ? '#4ade80' : 
                                isDest ? '#f87171' : '#374151';
              ctx.stroke();
            }
          } else {
            activeExplorations.forEach((exp, index) => {
              ctx.beginPath();
              ctx.arc(cx, cy, currentRadii[index], 0, Math.PI * 2);
              ctx.fillStyle = exp.color;
              ctx.fill();
              ctx.lineWidth = currentStrokes[index];
              ctx.strokeStyle = '#ffffff';
              ctx.stroke();
            });
          }
        }
      }

      if (!isMassive) {
        if (nodeIconSrc && !isBlocked) {
          const ciscoCanvas = getCiscoIconCanvas(nodeIconSrc);
          if (ciscoCanvas) {
            const imgW = ciscoCanvas.width || 1;
            const imgH = ciscoCanvas.height || 1;
            const aspect = imgW / imgH;
            const targetDim = r * 1.45;
            let dw = targetDim;
            let dh = targetDim / aspect;
            if (dh > targetDim) {
              dh = targetDim;
              dw = targetDim * aspect;
            }
            ctx.drawImage(ciscoCanvas, cx - dw / 2, cy - dh / 2, dw, dh);
          } else {
            const iconSize = r * 1.0;
            ctx.font = `${iconSize}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cfg.icon, cx, cy);
          }
        } else if (scenario === 'evacuation' && drawEvacuationNodeIcon(
          ctx,
          isBlocked ? 'blocked' : (isSource ? 'start' : node.type),
          cx,
          cy,
          r * 1.1
        )) {
          // The shared pictograms are also used by the editor palette and legend.
        } else {
          const iconSize = r * 1.1;
          ctx.font = `${iconSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          let displayIcon = cfg.icon;
          const nodeLabelLower = (node.label || '').toLowerCase();
          const nodeIdLower = (node.id || '').toLowerCase();
          if (nodeLabelLower.includes('cinema') || nodeIdLower.includes('cinema')) {
            displayIcon = '🎬';
          } else if (scenario === 'gameai' && isSource) {
            displayIcon = mapId === 'dama' ? '🔷' : '🔵';
          }
          ctx.fillText(isBlocked ? blockedIcon : displayIcon, cx, cy);
        }

        // Render carried package badge on active robot node ONLY after picking up from a shelf
        if (scenario === 'robotics' && (sets.bfs.current === node.id || sets.dfs.current === node.id || sets.hyb.current === node.id)) {
          const isShelfNode = (id: string) => id.startsWith('shelf_') && !id.startsWith('dest_');
          const checkCarrying = (step: AlgorithmStep | null) => {
            if (!step || !step.path) return false;
            const currentIdx = step.path.indexOf(node.id);
            if (currentIdx <= 0) return false;
            const pathBeforeCurrent = step.path.slice(0, currentIdx + 1);
            const passedShelf = pathBeforeCurrent.some(id => isShelfNode(id));
            const isAtDeskOrDepot = destinationIds.includes(node.id) || sourceIds?.includes(node.id) || sourceId === node.id;
            return passedShelf && !isAtDeskOrDepot;
          };

          const carryingAlgos = [
            { active: visibleAlgos.bfs && checkCarrying(activeSteps.bfs), color: '#22c55e' },
            { active: visibleAlgos.dfs && checkCarrying(activeSteps.dfs), color: '#a855f7' },
            { active: visibleAlgos.hybrid && checkCarrying(activeSteps.hybrid), color: '#f97316' },
          ].filter(algo => algo.active);
          if (carryingAlgos.length > 0) {
            const badgeX = cx + r * 0.75;
            const badgeY = cy - r * 0.75;
            const badgeSize = Math.max(10, r * 0.9);
            ctx.beginPath();
            ctx.arc(badgeX, badgeY, badgeSize * 0.58, 0, Math.PI * 2);
            ctx.fillStyle = options.workspaceView === 'logical' ? carryingAlgos[0].color : '#fff7ed';
            ctx.fill();
            ctx.lineWidth = Math.max(1, 1.5 / zoom);
            ctx.strokeStyle = options.workspaceView === 'logical' ? '#0f172a' : '#c2410c';
            ctx.stroke();
            if (options.workspaceView === 'logical') {
              const stripeW = badgeSize * 0.7 / carryingAlgos.length;
              carryingAlgos.forEach((algo, index) => {
                ctx.fillStyle = algo.color;
                ctx.fillRect(badgeX - badgeSize * 0.35 + index * stripeW, badgeY - badgeSize * 0.35, stripeW, badgeSize * 0.7);
              });
            } else {
              const boxIcon = getCiscoIconCanvas('/RoboticsMaps/icons/box.png');
              if (boxIcon) {
              const iconSize = badgeSize * 0.76;
              ctx.drawImage(boxIcon, badgeX - iconSize / 2, badgeY - iconSize / 2, iconSize, iconSize);
              } else {
                ctx.font = `${badgeSize * 0.8}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('📦', badgeX, badgeY);
              }
            }
          }
        }
      }
    });

    // Pass 2: Label rendering pass with priority sorting & collision detection
    const sortedNodes = [...visibleNodes].sort((a, b) => {
      const aImp = a.id === sourceId || (sourceIds && sourceIds.includes(a.id)) || destinationIds.includes(a.id) || sets.bfs.current === a.id || sets.dfs.current === a.id || sets.hyb.current === a.id;
      const bImp = b.id === sourceId || (sourceIds && sourceIds.includes(b.id)) || destinationIds.includes(b.id) || sets.bfs.current === b.id || sets.dfs.current === b.id || sets.hyb.current === b.id;
      if (aImp && !bImp) return -1;
      if (!aImp && bImp) return 1;
      return 0;
    });

    sortedNodes.forEach(node => {
      const cfg = NODE_CONFIG[node.type] ?? { icon: '🏪', radius: 18, baseColor: '#0e7490' };
      const cx = this.sx(node.x, options), cy = this.sy(node.y, options);
      const isSource = node.id === sourceId || (sourceIds && sourceIds.includes(node.id));
      const isDest = destinationIds.includes(node.id);
      const currBFS = visibleAlgos.bfs && sets.bfs.current === node.id;
      const currDFS = visibleAlgos.dfs && sets.dfs.current === node.id;
      const currHYB = visibleAlgos.hybrid && sets.hyb.current === node.id;
      const isImportant = isSource || isDest || currBFS || currDFS || currHYB;

      let r = isMassive ? (isImportant ? 4.5 : 1.2) : cfg.radius;
      if (isDatacenter) r = isImportant ? 8 : 4.5;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let displayLabel = node.label ? node.label.replace('\n', ' - ').trim() : '';
      if (scenario === 'traffic') {
        displayLabel = displayLabel.replace(/^Jct:\s*/i, '');
        displayLabel = displayLabel.replace(/National Highway/gi, 'Natl Hwy');
      }
      if (displayLabel.includes('_')) {
        displayLabel = displayLabel
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      if (zoom < 0.5) {
        if (displayLabel.startsWith('Finish Line ')) displayLabel = displayLabel.replace('Finish Line ', 'FL-');
        if (displayLabel.startsWith('Rack-')) displayLabel = displayLabel.replace('Rack-', 'R-');
        if (displayLabel.startsWith('Core-')) displayLabel = displayLabel.replace('Core-', 'C-');
        if (displayLabel.startsWith('Aggr-')) displayLabel = displayLabel.replace('Aggr-', 'A-');
        if (displayLabel === 'Global Ingress') displayLabel = 'GI';
        if (displayLabel === 'Dama King Row') displayLabel = 'KR';
        if (displayLabel === 'Strategy AI') displayLabel = 'AI';
      }

      const isGenericLink = displayLabel.toLowerCase().includes('local link section') || 
                            displayLabel.toLowerCase().includes('node/') || 
                            displayLabel.includes('#');
      const isKnownPlace = displayLabel && !isGenericLink;
      const shouldShowStreetLabel = isMassive && isKnownPlace && zoom >= 1.5;
      const isAWSWarehouse = scenario === 'robotics' && (mapId === 'aws' || mapId === 'awsWarehouse');
      // At a full-building view the AWS blueprint and graph contain many nearby
      // infrastructure nodes. Keep their markers visible, but defer ordinary
      // labels until the user zooms in; source, destination, and active nodes
      // remain labelled at every zoom level.
      const shouldShowNormalLabel = ((!isMassive && isKnownPlace) && (!isAWSWarehouse || zoom >= 0.45)) || isImportant;

      // In datacenter / synthetic graphs, skip unselected rack node labels when zoomed out (< 0.65x)
      // to avoid 100+ labels smearing horizontally into an illegible black blob
      if (isDatacenter && !isImportant && zoom < 0.65 && (node.id.startsWith('rack_') || node.type === 'rack')) {
        return;
      }

      const textAlpha = isImportant ? 1 : Math.max(options.theme === 'light' ? 0.92 : 0.2, Math.min(1, (zoom - 0.2) * 3));

      if (textAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = textAlpha;

        const isLight = options.theme === 'light';
        const defaultStroke = isLight ? '#ffffff' : '#0a0f1e';
        const defaultText = isLight ? '#0f172a' : '#f1f5f9';

        if (shouldShowStreetLabel) {
          const screenX = (cx * zoom) + pan.x;
          const screenY = (cy * zoom) + pan.y;
          const dynamicFontSize = (isImportant ? 16 : 14) / zoom; 
          ctx.font = `${isImportant ? 'bold' : '600'} ${dynamicFontSize}px sans-serif`;
          
          const textWidth = ctx.measureText(displayLabel).width;
          const isOverlapping = this.renderedTextPositions.some(pos => {
            const dx = Math.abs(pos.x - screenX);
            const dy = Math.abs(pos.y - screenY);
            if (pos.text === displayLabel && dx < (textWidth * 1.5) && dy < 40) return true;
            return dx < (textWidth / 2 + (pos.width || 0) / 2 + 10) && dy < 25;
          });

          if (!isOverlapping || isImportant) {
            ctx.lineJoin = 'round';
            ctx.lineWidth = (scenario === 'gameai' ? 5 : 3.5) / zoom;
            ctx.strokeStyle = scenario === 'gameai' ? '#000000' : defaultStroke; 
            
            const labelOffsetY = r + (10 / zoom);
            ctx.strokeText(displayLabel, cx, cy - labelOffsetY);
            ctx.fillStyle = isImportant ? (isLight ? '#c2410c' : '#fb923c') : (scenario === 'gameai' ? '#fde68a' : defaultText); 
            ctx.fillText(displayLabel, cx, cy - labelOffsetY);
            this.renderedTextPositions.push({ x: screenX, y: screenY, radius: 0, width: textWidth, text: displayLabel });
          }
        } else if (shouldShowNormalLabel && displayLabel) {
          let textY = cy;
          let labelOffsetY = isDatacenter ? (r + (8 / zoom)) : (r + (12 / zoom));
          let labelY = textY + labelOffsetY;

          const labelSize = isDatacenter 
            ? ((isImportant ? 13 : 10.5) / zoom) 
            : ((isImportant ? 18 : 14.5) / zoom);
          ctx.font = `${isImportant ? 'bold ' : '600 '}${labelSize}px sans-serif`;
          const textWidthUnscaled = ctx.measureText(displayLabel).width;
          const textWidthOnScreen = textWidthUnscaled * zoom;

          const screenX = (cx * zoom) + pan.x;
          let screenY = (labelY * zoom) + pan.y;

          // Collision detection: skip non-important labels that would collide with already drawn labels
          if (!isImportant) {
            const hasCollision = this.renderedTextPositions.some(pos => {
              const dx = Math.abs(pos.x - screenX);
              const dy = Math.abs(pos.y - screenY);
              return dx < ((pos.width || 40) / 2 + textWidthOnScreen / 2 + 6) && dy < 20;
            });
            if (hasCollision) {
              ctx.restore();
              return;
            }
          } else {
            // Reposition important labels downward if colliding
            let attempts = 0;
            while (attempts < 4 && this.renderedTextPositions.some(pos => Math.abs(pos.x - screenX) < 60 && Math.abs(pos.y - screenY) < 22)) {
              screenY += 20;
              labelY += 20 / zoom;
              attempts++;
            }
          }

          ctx.lineJoin = 'round';
          ctx.lineWidth = (isLight ? 4.5 : 3) / zoom;
          ctx.strokeStyle = scenario === 'gameai' ? '#000000' : defaultStroke;
          ctx.strokeText(displayLabel, cx, labelY);

          if (isImportant) {
            ctx.fillStyle = isSource ? '#16a34a' : isDest ? '#dc2626' : (isLight ? '#c2410c' : '#fb923c');
          } else {
            ctx.fillStyle = scenario === 'gameai' ? '#fde68a' : (isLight ? '#0f172a' : '#cbd5e1');
          }
          ctx.fillText(displayLabel, cx, labelY);

          this.renderedTextPositions.push({
            x: screenX,
            y: screenY,
            radius: 20,
            width: textWidthOnScreen,
            text: displayLabel
          });
        }
        ctx.restore();
      }
    });
  }

  protected drawEdgeLabels(options: RenderOptions) {
    const { ctx, isMassive, zoom, scenario, visibleEdges, visibleNodeMap } = options;
    const showNetworkPorts = scenario === 'network' && options.workspaceView === 'physical';
    if (!isMassive && (showNetworkPorts ? zoom >= 1 : zoom >= 0.7) && scenario !== 'gameai') {
      ctx.save();
      ctx.globalAlpha = showNetworkPorts ? 0.95 : Math.max(0, Math.min(1, (zoom - 0.7) * 3));
      ctx.font = showNetworkPorts ? `${Math.max(8, Math.min(11, 9 / zoom))}px monospace` : `${Math.max(8, 12 / zoom)}px sans-serif`;
      const isLight = options.theme === 'light';
      ctx.fillStyle = isLight ? '#0f172a' : '#e2e8f0';
      ctx.strokeStyle = isLight ? '#ffffff' : '#0f172a';
      ctx.lineWidth = 2 / zoom;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const occupiedLabels: Array<{ left: number; right: number; top: number; bottom: number }> = [];
  
      visibleEdges.forEach(edge => {
        const fromNode = visibleNodeMap.get(edge.from);
        const toNode = visibleNodeMap.get(edge.to);
        if (!fromNode || !toNode) return;
  
        const x1 = this.sx(fromNode.x, options), y1 = this.sy(fromNode.y, options);
        const x2 = this.sx(toNode.x, options), y2 = this.sy(toNode.y, options);
        const midX = (x1 + x2) / 2;
        const mi = (y1 + y2) / 2;
  
        const unit = scenario === 'evacuation' ? 's' : scenario === 'network' ? 'ms' : 'm';
        const label = showNetworkPorts
          ? this.getNetworkPortLabel(edge, options)
          : edge.label || `${edge.latency}${unit}`;
        if (!label) return;
        if (showNetworkPorts) {
          const width = ctx.measureText(label).width + 8;
          const height = 14;
          const rect = { left: midX - width / 2, right: midX + width / 2, top: mi - height / 2, bottom: mi + height / 2 };
          if (occupiedLabels.some(other => rect.left < other.right && rect.right > other.left && rect.top < other.bottom && rect.bottom > other.top)) return;
          occupiedLabels.push(rect);
        }
        ctx.strokeText(label, midX, mi);
        ctx.fillText(label, midX, mi);
      });
      ctx.restore();
    }
  }

  private getNetworkPortLabel(edge: GraphEdge, options: RenderOptions): string | null {
    if (edge.type === 'wireless') return 'Wi-Fi';
    const graph = options.graph;
    if (!graph) return null;
    const mapId = options.mapId;
    const knownCompanyPorts: Record<string, string> = {
      'mlt_sw1|acc_vlan50': 'Gi1/0/7',
      'mlt_sw1|core_r2': 'Gi1/0/2',
      'mlt_sw1|acc_vlan40': 'Gi1/0/6',
      'mlt_sw1|acc_vlan20': 'Gi1/0/4',
      'mlt_sw1|acc_vlan80': 'Gi1/0/8',
      'mlt_sw1|acc_vlan30': 'Gi1/0/5',
      'mlt_sw1|core_r1': 'Gi1/0/1',
      'mlt_sw1|acc_vlan10': 'Gi1/0/3',
    };
    const knownCompanyRemotePorts: Record<string, string> = {
      core_r1: 'Gi0/0', core_r2: 'Gi0/0', acc_vlan50: 'Fa0/1', acc_vlan40: 'Fa0/1',
      acc_vlan20: 'Fa0/1', acc_vlan80: 'Fa0/1', acc_vlan30: 'Fa0/1', acc_vlan10: 'Fa0/1',
    };
    const portAt = (nodeId: string, otherId: string): string => {
      if (mapId === 'companybusiness' && nodeId === 'mlt_sw1') {
        return knownCompanyPorts[`${nodeId}|${otherId}`] || 'Gi1/0/9';
      }
      if (mapId === 'companybusiness' && knownCompanyRemotePorts[nodeId] && otherId === 'mlt_sw1') {
        return knownCompanyRemotePorts[nodeId];
      }
      const node = graph.nodes.find(item => item.id === nodeId);
      const type = node?.type || '';
      const isSerial = edge.type === 'serial';
      const adjacent = graph.edges.filter(item =>
        item.type !== 'wireless' && (item.type === 'serial') === isSerial && (item.from === nodeId || item.to === nodeId)
      );
      const portIndex = adjacent.findIndex(item => item.id === edge.id) + 1;
      if (edge.type === 'serial') return `Se0/0/${Math.max(0, portIndex - 1)}`;
      if (type.includes('router') || type === 'datacenter') return `Gi0/${Math.max(0, portIndex - 1)}`;
      if (type.includes('switch')) return `Gi1/0/${portIndex}`;
      return 'Fa0/1';
    };
    return `${portAt(edge.from, edge.to)} ↔ ${portAt(edge.to, edge.from)}`;
  }

  protected drawOverlays(options: RenderOptions) {
    const { ctx, highlightedNodeId, destinationIds, visibleNodeMap, zoom, disableSimultaneousMode, visibleAlgos } = options;
    const visibleCount = [visibleAlgos.bfs, visibleAlgos.dfs, visibleAlgos.hybrid].filter(Boolean).length;
    const isSimultaneousMode = !disableSimultaneousMode && visibleCount > 1;

    // Determine active step based on active follow selection or single active tab
    const currentActiveStep = (options.followAlgo === 'dfs' && options.activeSteps.dfs) ? options.activeSteps.dfs
      : (options.followAlgo === 'hybrid' && options.activeSteps.hybrid) ? options.activeSteps.hybrid
      : (options.followAlgo === 'bfs' && options.activeSteps.bfs) ? options.activeSteps.bfs
      : (visibleAlgos.hybrid && !visibleAlgos.bfs && !visibleAlgos.dfs) ? options.activeSteps.hybrid
      : (visibleAlgos.dfs && !visibleAlgos.bfs && !visibleAlgos.hybrid) ? options.activeSteps.dfs
      : (visibleAlgos.bfs && !visibleAlgos.dfs && !visibleAlgos.hybrid) ? options.activeSteps.bfs
      : (options.activeSteps.hybrid || options.activeSteps.bfs || options.activeSteps.dfs);

    const getCombinedDelivered = (nodeId: string): number => {
      let max = 0;
      if (visibleAlgos.bfs && options.activeSteps.bfs?.deliveredBoxCounts?.[nodeId]) max = Math.max(max, options.activeSteps.bfs.deliveredBoxCounts[nodeId]);
      if (visibleAlgos.dfs && options.activeSteps.dfs?.deliveredBoxCounts?.[nodeId]) max = Math.max(max, options.activeSteps.dfs.deliveredBoxCounts[nodeId]);
      if (visibleAlgos.hybrid && options.activeSteps.hybrid?.deliveredBoxCounts?.[nodeId]) max = Math.max(max, options.activeSteps.hybrid.deliveredBoxCounts[nodeId]);
      return max;
    };

    // Highlight completed packing desks (6/6 delivered) in bright green
    destinationIds.forEach(deskId => {
      const requiredCount = options.shelfBoxCounts?.get(deskId) ?? 6;
      const delCount = isSimultaneousMode
        ? getCombinedDelivered(deskId)
        : (currentActiveStep?.deliveredBoxCounts?.[deskId] ?? 0);
      if (delCount >= requiredCount) {
        const dNode = visibleNodeMap.get(deskId);
        if (dNode) {
          const cx = this.sx(dNode.x, options), cy = this.sy(dNode.y, options);
          const cfg = NODE_CONFIG[dNode.type] || NODE_CONFIG['place'];
          // Use same world-space radius as node drawing (no /scale, no *zoom)
          const r = options.isMassive ? 4.5 : cfg.radius;
          ctx.save();
          ctx.shadowBlur = 6 / zoom;
          ctx.shadowColor = '#22c55e';
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 1.5 / zoom;
          ctx.beginPath();
          ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    });

    if (highlightedNodeId) {
      const hNode = visibleNodeMap.get(highlightedNodeId);
      if (hNode) {
        const cx = this.sx(hNode.x, options), cy = this.sy(hNode.y, options);
        const cfg = NODE_CONFIG[hNode.type] || NODE_CONFIG['place'];
        const r = options.isMassive ? 4.5 : (cfg.radius || 18);
        const pulseR = r + 8 / zoom;
        ctx.save();
        ctx.shadowBlur = 16 / zoom;
        ctx.shadowColor = '#facc15';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3 / zoom;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(250,204,21,0.4)';
        ctx.lineWidth = 6 / zoom;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR + 5 / zoom, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  protected drawFinalPathHighlight(options: RenderOptions) {
    const { ctx, visibleNodeMap, visibleEdges, visibleAlgos, activeSteps, zoom } = options;
    const isFinished = Boolean(options.isFinished);

    if (!isFinished) return;

    const algos: Array<'bfs' | 'dfs' | 'hybrid'> = ['bfs', 'dfs', 'hybrid'];
    const activeAlgos = algos.filter(a =>
      visibleAlgos[a] &&
      activeSteps[a]?.path &&
      (activeSteps[a]?.path?.length ?? 0) > 1
    );

    if (activeAlgos.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Phase 1: Draw Sequential Path Lines
    activeAlgos.forEach(algo => {
      const path = activeSteps[algo]!.path;
      const algoColor = algo === 'bfs' ? this.cBFS : algo === 'dfs' ? this.cDFS : this.cHYB;
      const offsetVal = activeAlgos.length > 1
        ? (algo === 'bfs' ? -4 : algo === 'hybrid' ? 4 : 0)
        : 0;

      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        const n1 = visibleNodeMap.get(u);
        const n2 = visibleNodeMap.get(v);
        if (!n1 || !n2) continue;

        const x1 = this.sx(n1.x, options);
        const y1 = this.sy(n1.y, options);
        const x2 = this.sx(n2.x, options);
        const y2 = this.sy(n2.y, options);

        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const perpX = (-dy / len) * (offsetVal / zoom);
        const perpY = (dx / len) * (offsetVal / zoom);

        const sx1 = x1 + perpX;
        const sy1 = y1 + perpY;
        const sx2 = x2 + perpX;
        const sy2 = y2 + perpY;

        const matchingEdge = visibleEdges.find(e => (e.from === u && e.to === v) || (e.from === v && e.to === u));

        // 1. Outer Glow
        ctx.shadowBlur = 14 / zoom;
        ctx.shadowColor = algoColor;
        ctx.strokeStyle = this.getRgba(algoColor, 0.45);
        ctx.lineWidth = Math.max(5, 10 / zoom);
        if (matchingEdge) {
          this.drawPath(ctx, matchingEdge, x1, y1, x2, y2, options.scale, perpX, perpY);
        } else {
          ctx.beginPath();
          ctx.moveTo(sx1, sy1);
          ctx.lineTo(sx2, sy2);
        }
        ctx.stroke();

        // 2. High-contrast Solid Path
        ctx.shadowBlur = 0;
        ctx.strokeStyle = algoColor;
        ctx.lineWidth = Math.max(3, 5.5 / zoom);
        if (matchingEdge) {
          this.drawPath(ctx, matchingEdge, x1, y1, x2, y2, options.scale, perpX, perpY);
        } else {
          ctx.beginPath();
          ctx.moveTo(sx1, sy1);
          ctx.lineTo(sx2, sy2);
        }
        ctx.stroke();

        // 3. Neon Core Highlight (bright white line in center)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, 1.8 / zoom);
        if (matchingEdge) {
          this.drawPath(ctx, matchingEdge, x1, y1, x2, y2, options.scale, perpX, perpY);
        } else {
          ctx.beginPath();
          ctx.moveTo(sx1, sy1);
          ctx.lineTo(sx2, sy2);
        }
        ctx.stroke();

        // 4. Directional Chevron Flow Arrow at midpoint
        const midX = (sx1 + sx2) / 2;
        const midY = (sy1 + sy2) / 2;
        const arrowDist = Math.hypot(dx, dy);
        if (arrowDist > 16 / zoom) {
          const arrowSize = Math.max(3, 5.5 / zoom);
          const angle = Math.atan2(dy, dx);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(midX + Math.cos(angle) * arrowSize, midY + Math.sin(angle) * arrowSize);
          ctx.lineTo(midX + Math.cos(angle + 2.4) * arrowSize, midY + Math.sin(angle + 2.4) * arrowSize);
          ctx.lineTo(midX - Math.cos(angle) * (arrowSize * 0.3), midY - Math.sin(angle) * (arrowSize * 0.3));
          ctx.lineTo(midX + Math.cos(angle - 2.4) * arrowSize, midY + Math.sin(angle - 2.4) * arrowSize);
          ctx.closePath();
          ctx.fill();
        }
      }
    });

    // Phase 2: Draw Hop Badges on Path Nodes
    if (options.showHopBadges !== false) {
      // 2A. Draw single START badge ONCE (no duplicates)
      const startNodeId = options.sourceId || (activeAlgos[0] && activeSteps[activeAlgos[0]]?.path[0]);
      const startNode = startNodeId ? visibleNodeMap.get(startNodeId) : null;
      if (startNode) {
        const sx = this.sx(startNode.x, options);
        const sy = this.sy(startNode.y, options);
        this.drawHopBadge(ctx, sx, sy - 20 / zoom, 'START', '#052e16', '#22c55e', zoom, true);
      }

      // 2B. Draw Intermediate Hop Badges (nodes 1 through path.length - 2)
      activeAlgos.forEach(algo => {
        const path = activeSteps[algo]!.path;
        const algoColor = algo === 'bfs' ? this.cBFS : algo === 'dfs' ? this.cDFS : this.cHYB;
        const totalHops = path.length - 1;

        const badgeOffsetX = activeAlgos.length > 1
          ? (algo === 'bfs' ? -13 : algo === 'hybrid' ? 13 : 0) / zoom
          : 0;
        const badgeOffsetY = activeAlgos.length > 1
          ? (algo === 'bfs' ? -13 : algo === 'hybrid' ? 13 : -15) / zoom
          : 0;

        for (let i = 1; i < path.length - 1; i++) {
          const nodeId = path[i];
          const node = visibleNodeMap.get(nodeId);
          if (!node) continue;

          const cx = this.sx(node.x, options) + badgeOffsetX;
          const cy = this.sy(node.y, options) + badgeOffsetY;

          const isVeryLong = totalHops > 25;
          const skipForDensity = isVeryLong && zoom < 1.0 && (i % (totalHops > 50 ? 5 : 2) !== 0);

          if (!skipForDensity) {
            this.drawHopBadge(ctx, cx, cy, `${i}`, '#0a0f1e', algoColor, zoom, false);
          }
        }
      });

      // 2C. Draw Color-Coded, Non-Overlapping Destination Badges
      const destArrivalsByNode = new Map<string, Array<{ algo: 'bfs' | 'dfs' | 'hybrid'; hops: number; color: string; bgColor: string; label: string }>>();

      activeAlgos.forEach(algo => {
        const path = activeSteps[algo]!.path;
        if (!path || path.length < 2) return;
        const destId = path[path.length - 1];
        const hops = path.length - 1;
        const algoColor = algo === 'bfs' ? this.cBFS : algo === 'dfs' ? this.cDFS : this.cHYB;
        const bgColor = algo === 'bfs' ? '#052e16' : algo === 'dfs' ? '#2e1065' : '#431407';
        const algoLabel = algo === 'bfs' ? 'BFS' : algo === 'dfs' ? 'DFS' : 'Hybrid';

        if (!destArrivalsByNode.has(destId)) {
          destArrivalsByNode.set(destId, []);
        }
        destArrivalsByNode.get(destId)!.push({
          algo,
          hops,
          color: algoColor,
          bgColor,
          label: `${algoLabel} (${hops} hops)`
        });
      });

      destArrivalsByNode.forEach((arrivals, destId) => {
        const node = visibleNodeMap.get(destId);
        if (!node) return;

        const cx = this.sx(node.x, options);
        const cy = this.sy(node.y, options);

        // Draw destination pulsing target radar ring
        ctx.save();
        ctx.shadowBlur = 10 / zoom;
        ctx.shadowColor = arrivals[0].color;
        ctx.strokeStyle = arrivals[0].color;
        ctx.lineWidth = 2 / zoom;
        ctx.beginPath();
        ctx.arc(cx, cy, 14 / zoom, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Stack badges above the destination node so they do not overlap each other or the node
        arrivals.forEach((arr, idx) => {
          const badgeY = cy - (20 + idx * 19) / zoom;
          this.drawHopBadge(ctx, cx, badgeY, arr.label, arr.bgColor, arr.color, zoom, true);
        });
      });
    }

    ctx.restore();
  }

  protected drawHopBadge(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    text: string,
    bgColor: string,
    borderColor: string,
    zoom: number,
    isPill: boolean
  ) {
    ctx.save();
    const fontSize = Math.max(9, Math.min(13, 11 / zoom));
    ctx.font = `bold ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const paddingX = isPill ? Math.max(5, 7 / zoom) : Math.max(3, 4 / zoom);
    const textWidth = ctx.measureText(text).width;
    const badgeW = isPill ? textWidth + paddingX * 2 : Math.max(fontSize * 1.6, textWidth + paddingX * 2);
    const badgeH = Math.max(fontSize * 1.5, 16 / zoom);
    const radius = isPill ? badgeH / 2 : Math.max(7 / zoom, badgeH / 2);

    // Glow / Drop Shadow
    ctx.shadowBlur = 8 / zoom;
    ctx.shadowColor = borderColor;

    // Background shape
    ctx.beginPath();
    if (isPill) {
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x - badgeW / 2, y - badgeH / 2, badgeW, badgeH, radius);
      } else {
        ctx.rect(x - badgeW / 2, y - badgeH / 2, badgeW, badgeH);
      }
    } else {
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
    ctx.fillStyle = bgColor;
    ctx.fill();

    // Border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = Math.max(1.5, 2.2 / zoom);
    ctx.stroke();

    // Text Label
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, y);

    ctx.restore();
  }
}
