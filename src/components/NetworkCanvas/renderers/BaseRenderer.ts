import { GraphNode, GraphEdge, ScenarioType, AlgorithmStep } from '../../../types';
import { NODE_CONFIG, EDGE_CONFIG } from '../types';
import { ALGORITHMS } from '../../../config/scenarios';

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
}

export abstract class BaseRenderer {
  protected cBFS = ALGORITHMS.find(a => a.id === 'bfs')?.color || '#4ade80';
  protected cDFS = ALGORITHMS.find(a => a.id === 'dfs')?.color || '#c084fc';
  protected cHYB = ALGORITHMS.find(a => a.id === 'hybrid')?.color || '#fb923c';

  protected renderedTextPositions: { x: number; y: number; radius: number }[] = [];

  public render(options: RenderOptions) {
    const { ctx, canvasWidth, canvasHeight, zoom, pan } = options;
    const dpr = window.devicePixelRatio || 1;
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.scale(dpr, dpr);
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    ctx.lineCap = 'round';
    this.renderedTextPositions = [];

    this.drawBackground(options);
    this.drawEdges(options);
    this.drawActivePaths(options);
    this.drawVisitedEdges(options);
    this.drawNodesAndLabels(options);
    this.drawEdgeLabels(options);
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
    const { ctx, visibleEdges, visibleNodeMap, isDatacenter, isMassive, sets } = options;
    const baseOpacity = isDatacenter ? 0.2 : (isMassive ? 0.15 : 0.35);

    visibleEdges.forEach(edge => {
      const fromNode = visibleNodeMap.get(edge.from);
      const toNode = visibleNodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const x1 = this.sx(fromNode.x, options), y1 = this.sy(fromNode.y, options);
      const x2 = this.sx(toNode.x, options), y2 = this.sy(toNode.y, options);
      const isExplored = (id: string) => sets.bfs.explored.has(id) || sets.dfs.explored.has(id) || sets.hyb.explored.has(id);
      const expAny = isExplored(edge.from) && isExplored(edge.to);
      const cfg = EDGE_CONFIG[edge.type] ?? EDGE_CONFIG.path;
      const baseWidth = isDatacenter ? 0.25 : (isMassive ? 0.3 : cfg.width);

      this.drawPath(ctx, edge, x1, y1, x2, y2, options.scale);
      ctx.strokeStyle = expAny ? this.getRgba('#64748b', 0.4) : this.getRgba(cfg.color, baseOpacity);
      ctx.lineWidth = baseWidth;
      ctx.setLineDash(cfg.dash.length > 0 ? cfg.dash : []);
      ctx.stroke();
    });
  }

  protected drawActivePaths(options: RenderOptions) {
    const { ctx, visibleEdges, visibleNodeMap, sets, visibleAlgos, isMassive } = options;
    ctx.setLineDash([]);
    visibleEdges.forEach(edge => {
      const fromNode = visibleNodeMap.get(edge.from);
      const toNode = visibleNodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const pBFS = sets.bfs.path.has(edge.from) && sets.bfs.path.has(edge.to);
      const pDFS = sets.dfs.path.has(edge.from) && sets.dfs.path.has(edge.to);
      const pHYB = sets.hyb.path.has(edge.from) && sets.hyb.path.has(edge.to);

      if (pBFS || pDFS || pHYB) {
        const x1 = this.sx(fromNode.x, options), y1 = this.sy(fromNode.y, options);
        const x2 = this.sx(toNode.x, options), y2 = this.sy(toNode.y, options);
        this.drawPath(ctx, edge, x1, y1, x2, y2, options.scale);
        
        if (pBFS && visibleAlgos.bfs) { ctx.strokeStyle = this.getRgba(this.cBFS, 0.9); ctx.lineWidth = isMassive ? 2.5 : 8; ctx.stroke(); }
        if (pDFS && visibleAlgos.dfs) { ctx.strokeStyle = this.getRgba(this.cDFS, 0.95); ctx.lineWidth = isMassive ? 1.8 : 5; ctx.stroke(); }
        if (pHYB && visibleAlgos.hybrid) { ctx.strokeStyle = this.getRgba(this.cHYB, 1); ctx.lineWidth = isMassive ? 1.2 : 3; ctx.stroke(); }
      }
    });
  }

  protected drawVisitedEdges(options: RenderOptions) {
    const { ctx, visibleEdges, visibleNodeMap, sets, visibleAlgos, isMassive, isDatacenter } = options;
    ctx.setLineDash([]);
    visibleEdges.forEach(edge => {
      const fromNode = visibleNodeMap.get(edge.from);
      const toNode = visibleNodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const x1 = this.sx(fromNode.x, options), y1 = this.sy(fromNode.y, options);
      const x2 = this.sx(toNode.x, options), y2 = this.sy(toNode.y, options);
      const cfg = EDGE_CONFIG[edge.type] ?? EDGE_CONFIG.path;
      const baseWidth = isDatacenter ? 0.25 : (isMassive ? 0.3 : cfg.width);

      const vBFS = (sets.bfs.explored.has(edge.from) || sets.bfs.explored.has(edge.to)) && !(sets.bfs.path.has(edge.from) && sets.bfs.path.has(edge.to));
      const vDFS = (sets.dfs.explored.has(edge.from) || sets.dfs.explored.has(edge.to)) && !(sets.dfs.path.has(edge.from) && sets.dfs.path.has(edge.to));
      const vHYB = (sets.hyb.explored.has(edge.from) || sets.hyb.explored.has(edge.to)) && !(sets.hyb.path.has(edge.from) && sets.hyb.path.has(edge.to));

      if (vBFS || vDFS || vHYB) {
        if (isMassive || isDatacenter) {
          const opacity = 0.55;
          if (vBFS && visibleAlgos.bfs) { this.drawPath(ctx, edge, x1, y1, x2, y2, options.scale); ctx.strokeStyle = this.getRgba(this.cBFS, opacity); ctx.lineWidth = baseWidth * 8.0; ctx.stroke(); }
          if (vDFS && visibleAlgos.dfs) { this.drawPath(ctx, edge, x1, y1, x2, y2, options.scale); ctx.strokeStyle = this.getRgba(this.cDFS, opacity + 0.1); ctx.lineWidth = baseWidth * 5.0; ctx.stroke(); }
          if (vHYB && visibleAlgos.hybrid) { this.drawPath(ctx, edge, x1, y1, x2, y2, options.scale); ctx.strokeStyle = this.getRgba(this.cHYB, opacity + 0.2); ctx.lineWidth = baseWidth * 2.0; ctx.stroke(); }
        } else {
          const dx = x2 - x1, dy = y2 - y1;
          const len = Math.hypot(dx, dy) || 1;
          const perpX = -dy / len, perpY = dx / len;
          
          const stackOffset = baseWidth * 1.5; 
          const algoLines = [
            { active: vBFS && visibleAlgos.bfs, color: this.cBFS, offset: -stackOffset },
            { active: vDFS && visibleAlgos.dfs, color: this.cDFS, offset: 0 },
            { active: vHYB && visibleAlgos.hybrid, color: this.cHYB, offset: stackOffset }
          ];

          algoLines.forEach(algo => {
            if (algo.active) {
              this.drawPath(ctx, edge, x1, y1, x2, y2, options.scale, perpX * algo.offset, perpY * algo.offset);
              ctx.strokeStyle = this.getRgba(algo.color, 0.35); 
              ctx.lineWidth = baseWidth * 1.2; 
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
      
      const ringTint = isRealWorldPlace ? cfg.baseColor : null;
      const activeExplorations = [
        { id: 'bfs', active: expBFS, color: ringTint ?? this.cBFS },
        { id: 'dfs', active: expDFS, color: ringTint ?? this.cDFS },
        { id: 'hyb', active: expHYB, color: ringTint ?? this.cHYB }
      ].filter(e => e.active);

      const isBlockedImportant = isBlocked;
      let r = isMassive ? (isImportant || isBlockedImportant ? 4.5 : 1.2) : cfg.radius;
      if (isDatacenter) r = (isImportant || isBlockedImportant) ? 8 : 4.5;
      
      const currentRadii = isMassive ? [2.2, 1.2, 0.6] : [r * 0.85, r * 0.55, r * 0.25];
      const currentStrokes = isMassive ? [0.5, 0.3, 0.1] : [2, 1.5, 1];

      let fillColor = cfg.baseColor;
      let opacity = (isMassive && !isImportant && !isBlockedImportant) ? 0.3 : 1;
      
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
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let displayLabel = node.label ? node.label.replace('\n', ' - ').trim() : '';
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
      const shouldShowNormalLabel = (!isMassive && isKnownPlace) || isImportant;
      const textAlpha = isImportant ? 1 : Math.max(0, Math.min(1, (zoom - 0.4) * 3));

      if (textAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = textAlpha;

        if (shouldShowStreetLabel) {
          const screenX = (cx * zoom) + pan.x;
          const screenY = (cy * zoom) + pan.y;
          const separationThreshold = Math.max(50 / (zoom * 0.15), 35); 
          const isOverlapping = this.renderedTextPositions.some(pos => Math.hypot(pos.x - screenX, pos.y - screenY) < separationThreshold);

          if (!isOverlapping || isImportant) {
            const dynamicFontSize = (isImportant ? 16 : 14) / zoom; 
            ctx.font = `${isImportant ? 'bold' : '600'} ${dynamicFontSize}px sans-serif`;
            ctx.lineJoin = 'round';
            ctx.lineWidth = (scenario === 'gameai' ? 5 : 3) / zoom;
            ctx.strokeStyle = scenario === 'gameai' ? '#000000' : '#0a0f1e'; 
            
            const labelOffsetY = r + (10 / zoom);
            ctx.strokeText(displayLabel, cx, cy - labelOffsetY);
            ctx.fillStyle = isImportant ? '#fb923c' : (scenario === 'gameai' ? '#fde68a' : '#f1f5f9'); 
            ctx.fillText(displayLabel, cx, cy - labelOffsetY);
            this.renderedTextPositions.push({ x: screenX, y: screenY, radius: separationThreshold });
          }
        } else if (shouldShowNormalLabel && displayLabel) {
          let textY = cy;
          if (isImportant) {
            const screenX = (cx * zoom) + pan.x;
            let screenY = (textY * zoom) + pan.y;
            let attempts = 0;
            while (attempts < 5 && this.renderedTextPositions.some(pos => Math.abs(pos.x - screenX) < 70 && Math.abs(pos.y - screenY) < 25)) {
              screenY += 20;
              textY += 20 / zoom;
              attempts++;
            }
            this.renderedTextPositions.push({ x: screenX, y: screenY, radius: 25 });
          }

          if (isMassive && isImportant) {
            ctx.font = `bold ${16 / zoom}px sans-serif`;
            ctx.strokeStyle = '#0a0f1e';
            ctx.lineWidth = 3 / zoom;
            const labelOffsetY = r + (10 / zoom);
            ctx.strokeText(displayLabel, cx, textY - labelOffsetY);
            ctx.fillStyle = isSource ? '#4ade80' : isDest ? '#f87171' : '#fb923c';
            ctx.fillText(displayLabel, cx, textY - labelOffsetY);
          } else if (!isMassive) {
            if (!isDatacenter) {
              const labelSize = (isImportant ? 18 : 15) / zoom;
              ctx.font = `${isImportant ? 'bold ' : ''}${labelSize}px sans-serif`;
              
              if (scenario === 'gameai') {
                ctx.lineJoin = 'round';
                ctx.lineWidth = 4 / zoom;
                ctx.strokeStyle = '#000000';
                const labelOffsetY = r + (12 / zoom);
                ctx.strokeText(displayLabel, cx, textY + labelOffsetY);
                ctx.fillStyle = isImportant ? '#fb923c' : '#fde68a';
                ctx.fillText(displayLabel, cx, textY + labelOffsetY);
              } else {
                ctx.lineJoin = 'round';
                ctx.lineWidth = 3 / zoom;
                ctx.strokeStyle = '#0a0f1e';
                const labelOffsetY = r + (12 / zoom);
                ctx.strokeText(displayLabel, cx, textY + labelOffsetY);
                
                if (isImportant) {
                  ctx.fillStyle = isSource ? '#4ade80' : isDest ? '#f87171' : '#fb923c';
                } else {
                  ctx.fillStyle = '#cbd5e1';
                }
                ctx.fillText(displayLabel, cx, textY + labelOffsetY);
              }
            } else {
              const labelSize = (isImportant ? 12 : 10) / zoom;
              const labelY = textY + r + (8 / zoom);
              ctx.font = `${labelSize}px sans-serif`;
              ctx.lineWidth = 2 / zoom;
              ctx.strokeStyle = '#0f172a';
              ctx.strokeText(displayLabel, cx, labelY);
              ctx.fillStyle = isImportant ? (isSource ? '#4ade80' : isDest ? '#f87171' : '#fb923c') : '#f8fafc';
              ctx.fillText(displayLabel, cx, labelY);
            }
          }
        }
        ctx.restore();
      }
      
      if (!isMassive) {
        const iconSize = r * 1.1;
        ctx.font = `${iconSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let displayIcon = cfg.icon;
        if (scenario === 'gameai' && isSource) {
          displayIcon = mapId === 'dama' ? '🔷' : '🔵';
        }
        ctx.fillText(isBlocked ? blockedIcon : displayIcon, cx, cy);

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

          const isCarrying = checkCarrying(activeSteps.bfs) || checkCarrying(activeSteps.dfs) || checkCarrying(activeSteps.hybrid);
          if (isCarrying) {
            ctx.font = `${r * 0.9}px sans-serif`;
            ctx.fillText('📦', cx + r * 0.75, cy - r * 0.75);
          }
        }
      }
    });
  }

  protected drawEdgeLabels(options: RenderOptions) {
    const { ctx, isMassive, zoom, scenario, visibleEdges, visibleNodeMap } = options;
    if (!isMassive && zoom >= 0.7 && scenario !== 'gameai') {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, (zoom - 0.7) * 3));
      ctx.font = `${Math.max(8, 12 / zoom)}px sans-serif`;
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2 / zoom;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
  
      visibleEdges.forEach(edge => {
        const fromNode = visibleNodeMap.get(edge.from);
        const toNode = visibleNodeMap.get(edge.to);
        if (!fromNode || !toNode) return;
  
        const x1 = this.sx(fromNode.x, options), y1 = this.sy(fromNode.y, options);
        const x2 = this.sx(toNode.x, options), y2 = this.sy(toNode.y, options);
        const midX = (x1 + x2) / 2;
        const mi = (y1 + y2) / 2;
  
        const unit = scenario === 'evacuation' ? 's' : scenario === 'network' ? 'ms' : 'm';
        const label = edge.label || `${edge.latency}${unit}`;
        ctx.strokeText(label, midX, mi);
        ctx.fillText(label, midX, mi);
      });
      ctx.restore();
    }
  }

  protected drawOverlays(options: RenderOptions) {
    const { ctx, highlightedNodeId, destinationIds, visibleNodeMap, zoom, scale, disableSimultaneousMode, visibleAlgos } = options;
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
          const r = (cfg.radius / scale) * zoom;
          ctx.save();
          ctx.shadowBlur = 18;
          ctx.shadowColor = '#22c55e';
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3 / zoom;
          ctx.beginPath();
          ctx.arc(cx, cy, r + 6 / zoom, 0, Math.PI * 2);
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
        const r = (cfg.radius / scale) * zoom;
        const pulseR = r + 8 / zoom;
        ctx.save();
        ctx.shadowBlur = 20;
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
}
