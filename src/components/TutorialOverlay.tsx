import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../context/ThemeContext';

// ── Step definitions ──────────────────────────────────────────────────────────

export interface TutorialStep {
  target: string;
  title: string;
  body: string | ((scenario: string) => string);
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: 'tutorial-header-title',
    title: 'Welcome to the Simulation!',
    body: 'This system lets you compare three search algorithms — BFS, DFS, and Hybrid — side by side in real-time across different environments.',
    placement: 'bottom',
  },
  {
    target: 'tutorial-algo-pills',
    title: 'Algorithm Toggles',
    body: 'Click any pill to show or hide that algorithm. All three are active by default for a full head-to-head comparison. At least one must stay enabled.',
    placement: 'bottom',
  },
  {
    target: 'tutorial-scenario-selectors',
    title: 'Configuration Controls',
    body: (scenario: string) => {
      if (scenario === 'network') return 'Customize your network routing simulation. Switch between ISP Broadcast or Device-to-Device mode, select specific source/destination nodes, and choose the routing method (Anycast or Multicast).';
      if (scenario === 'evacuation') return 'Set the starting point (source) and destination (safe zone) for the evacuation simulation.';
      if (scenario === 'traffic') return 'Configure the traffic simulation by setting the starting intersection and destination for the vehicles.';
      if (scenario === 'gameai') return 'Choose the starting strategy (e.g. Random, Aggressive, Defensive) for the game AI algorithms.';
      return 'Adjust scenario-specific configurations before running the simulation.';
    },
    placement: 'bottom',
  },
  {
    target: 'tutorial-metrics-panel',
    title: 'Live Metrics Panel',
    body: 'Tracks visited nodes, completion rate, latency, memory, path optimality, and adaptability for each algorithm — updating live every step.',
    placement: 'right',
  },
  {
    target: 'tutorial-legend',
    title: 'Legend',
    body: 'Explains the visual elements on the canvas, such as source, destination, blockages, and the color coding for different algorithms.',
    placement: 'right',
  },
  {
    target: 'tutorial-canvas',
    title: 'Network Canvas',
    body: 'The main visualization. Watch the algorithms explore the graph in real time. Colored paths show each frontier. You can zoom and pan freely.',
    placement: 'auto',
  },
  {
    target: 'tutorial-map-events',
    title: 'Dynamic Map Events',
    body: 'Lists hazards injected mid-simulation — blocked nodes, AoE failures. Each event shows which algorithms had their path severed and adapted.',
    placement: 'left',
  },
  {
    target: 'tutorial-scenario-panels',
    title: 'Scenario Specific Data',
    body: (scenario: string) => {
      if (scenario === 'robotics') return 'Shows the robot fleet status and their delivery assignments. You can see which robot is active and what boxes they are picking up.';
      if (scenario === 'gameai') return 'Displays the Strategy Map Events. It shows recent AI moves, opponent formations, and how the algorithm reacts to them.';
      if (scenario === 'network') return 'Displays the Campus Topology Rules. It explains the active VLAN isolation (ACLs) and which subnets can communicate with each other.';
      return 'Displays unique data and specialized controls for the current simulation scenario.';
    },
    placement: 'left',
  },
  {
    target: 'tutorial-result-history',
    title: 'Result History',
    body: 'Saves and lists all your previous simulation runs. You can view past metrics, compare performance, and view dynamic events of previous runs.',
    placement: 'bottom',
  },
  {
    target: 'tutorial-size-adjuster',
    title: 'Dynamic Size Adjuster',
    body: (scenario: string) => {
      if (scenario === 'gameai') {
        return 'Allows you to change the size of the synthetic board. The Links input is uneditable for Game AI, as game boards strictly adhere to fixed movement rules and calculate their own valid paths.';
      }
      return 'Allows you to change the size and complexity of synthetic graphs to see how algorithms scale on larger maps.';
    },
    placement: 'left',
  },
  {
    target: 'tutorial-topology-editor',
    title: 'Topology Editor',
    body: 'Allows you to manually customize the graph by adding or removing nodes and edges before the simulation starts or while it is paused.',
    placement: 'left',
  },
  {
    target: 'tutorial-expert-panel',
    title: 'Algorithm Path Trace',
    body: 'A real-time live feed showing exactly which node each algorithm is evaluating at the current step.',
    placement: 'left',
  },
  {
    target: 'tutorial-playback-controls',
    title: 'Simulation Controls',
    body: 'Run Simulations starts the run; Pause and Resume appear while it runs. Use Back and Fwd to move through steps, Skip to jump to the end, or Reset to start over. Block Nodes places hazards, Reroll Events generates new ones, and the speed slider adjusts playback.',
    placement: 'top',
  },
  {
    target: 'tutorial-help-btn',
    title: '📖 Help & Guide',
    body: 'Opens a full reference guide with screenshots. Re-open this tutorial anytime by clicking "New here?" in the guide footer.',
    placement: 'bottom',
  },
];

// ── Persistence ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'hybrid_sim_tutorial_done_v1';

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTutorial(storageKey: string = STORAGE_KEY, steps: TutorialStep[] = TUTORIAL_STEPS) {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(storageKey);
    if (!done) {
      const t = setTimeout(() => setIsOpen(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  const findValidStep = useCallback((startIndex: number, direction: 1 | -1): number => {
    let i = startIndex;
    while (i >= 0 && i < steps.length) {
      const el = document.querySelector(`[data-tutorial="${steps[i].target}"]`);
      if (el && el.getBoundingClientRect().height > 0) {
        return i;
      }
      i += direction;
    }
    return -1;
  }, [steps]);

  const start = useCallback(() => {
    const firstIndex = findValidStep(0, 1);
    setStepIndex(firstIndex !== -1 ? firstIndex : 0);
    setIsOpen(true);
  }, [findValidStep]);

  const startAt = useCallback((index: number) => {
    const validIndex = findValidStep(index, 1);
    if (validIndex !== -1) {
      setStepIndex(validIndex);
      setIsOpen(true);
    }
  }, [findValidStep]);

  const goTo = useCallback((index: number) => {
    const validIndex = findValidStep(index, 1);
    if (validIndex !== -1) {
      setStepIndex(validIndex);
    }
  }, [findValidStep]);

  const close = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(storageKey, '1');
  }, [storageKey]);

  const next = useCallback(() => {
    setStepIndex(i => {
      const nextIndex = findValidStep(i + 1, 1);
      if (nextIndex === -1) {
        setIsOpen(false);
        localStorage.setItem(storageKey, '1');
        return i;
      }
      return nextIndex;
    });
  }, [findValidStep]);

  const prev = useCallback(() => {
    setStepIndex(i => {
      const prevIndex = findValidStep(i - 1, -1);
      return prevIndex !== -1 ? prevIndex : i;
    });
  }, [findValidStep]);

  return { isOpen, stepIndex, start, startAt, close, next, prev, goTo };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

interface Rect { top: number; left: number; width: number; height: number; }
const PAD = 10;

function getTargetRect(target: string): Rect | null {
  const el = document.querySelector(`[data-tutorial="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function computeTooltipStyle(
  rect: Rect | null,
  placement: TutorialStep['placement'],
  tooltipRef: React.RefObject<HTMLDivElement | null>,
): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // ── On mobile, always center at the bottom ───────────────────────────────
  if (vw < 640) {
    const mw = Math.min(vw - 24, 400);
    return {
      bottom: 80,
      left: (vw - mw) / 2,
      width: mw,
      top: 'auto',
    };
  }

  // ── Desktop: smart anchor placement ──────────────────────────────────────
  if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  const tw = Math.min(tooltipRef.current?.offsetWidth ?? 300, vw - 32);
  const th = tooltipRef.current?.offsetHeight ?? 180;
  
  const spaceBelow = vh - (rect.top + rect.height + PAD);
  const spaceAbove = rect.top - PAD;
  const spaceRight = vw - (rect.left + rect.width + PAD);
  const spaceLeft = rect.left - PAD;

  let resolved = placement ?? 'bottom';
  
  if (resolved === 'auto') {
    resolved = spaceBelow >= th + 20 ? 'bottom'
      : spaceAbove >= th + 20 ? 'top'
        : spaceRight >= tw + 20 ? 'right'
          : 'left';
  }

  // Safe fallback if the requested placement pushes the tooltip off-screen
  if (resolved === 'left' && spaceLeft < tw + 20) {
    resolved = spaceRight >= tw + 20 ? 'right' : (spaceBelow >= th + 20 ? 'bottom' : 'top');
  } else if (resolved === 'right' && spaceRight < tw + 20) {
    resolved = spaceLeft >= tw + 20 ? 'left' : (spaceBelow >= th + 20 ? 'bottom' : 'top');
  } else if (resolved === 'top' && spaceAbove < th + 20) {
    resolved = spaceBelow >= th + 20 ? 'bottom' : (spaceRight >= tw + 20 ? 'right' : 'left');
  } else if (resolved === 'bottom' && spaceBelow < th + 20) {
    resolved = spaceAbove >= th + 20 ? 'top' : (spaceRight >= tw + 20 ? 'right' : 'left');
  }

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  switch (resolved) {
    case 'bottom': {
      const l = Math.max(12, Math.min(cx - tw / 2, vw - tw - 12));
      return { top: rect.top + rect.height + PAD + 14, left: l, width: tw };
    }
    case 'top': {
      const l = Math.max(12, Math.min(cx - tw / 2, vw - tw - 12));
      return { top: rect.top - PAD - th - 14, left: l, width: tw };
    }
    case 'right': {
      const t = Math.max(12, Math.min(cy - th / 2, vh - th - 12));
      return { top: t, left: rect.left + rect.width + PAD + 14, width: tw };
    }
    case 'left':
    default: {
      const t = Math.max(12, Math.min(cy - th / 2, vh - th - 12));
      const l = Math.max(12, Math.min(rect.left - PAD - tw - 14, vw - tw - 12));
      return { top: t, left: l, width: tw };
    }
  }
}

const getTheme = (scenario: string, isLight: boolean) => {
  if (isLight) {
    switch (scenario) {
      case 'robotics': return {
        border: 'border-orange-200/90', shadowBorder: 'rgba(249,115,22,0.12)',
        gradient: 'from-orange-500 via-amber-500 to-yellow-500',
        iconBg: 'bg-orange-50', iconBorder: 'border-orange-200', iconText: 'text-orange-600',
        progressActive: '#ea580c', progressHoverBg: 'hover:bg-orange-400', progressPast: '#f97316',
        btnBg: 'bg-orange-600', btnHover: 'hover:bg-orange-700', btnShadow: 'shadow-orange-500/25',
        spotlightBorder: 'rgba(234,88,12,0.85)',
      };
      case 'traffic': return {
        border: 'border-emerald-200/90', shadowBorder: 'rgba(16,185,129,0.12)',
        gradient: 'from-emerald-500 via-green-500 to-teal-500',
        iconBg: 'bg-emerald-50', iconBorder: 'border-emerald-200', iconText: 'text-emerald-600',
        progressActive: '#059669', progressHoverBg: 'hover:bg-emerald-400', progressPast: '#10b981',
        btnBg: 'bg-emerald-600', btnHover: 'hover:bg-emerald-700', btnShadow: 'shadow-emerald-500/25',
        spotlightBorder: 'rgba(5,150,105,0.85)',
      };
      case 'evacuation': return {
        border: 'border-rose-200/90', shadowBorder: 'rgba(239,68,68,0.12)',
        gradient: 'from-red-500 via-rose-500 to-orange-500',
        iconBg: 'bg-rose-50', iconBorder: 'border-rose-200', iconText: 'text-rose-600',
        progressActive: '#e11d48', progressHoverBg: 'hover:bg-rose-400', progressPast: '#f43f5e',
        btnBg: 'bg-rose-600', btnHover: 'hover:bg-rose-700', btnShadow: 'shadow-rose-500/25',
        spotlightBorder: 'rgba(225,29,72,0.85)',
      };
      case 'gameai': return {
        border: 'border-purple-200/90', shadowBorder: 'rgba(168,85,247,0.12)',
        gradient: 'from-purple-600 via-fuchsia-500 to-pink-500',
        iconBg: 'bg-purple-50', iconBorder: 'border-purple-200', iconText: 'text-purple-600',
        progressActive: '#7c3aed', progressHoverBg: 'hover:bg-purple-400', progressPast: '#a855f7',
        btnBg: 'bg-purple-600', btnHover: 'hover:bg-purple-700', btnShadow: 'shadow-purple-500/25',
        spotlightBorder: 'rgba(124,58,237,0.85)',
      };
      case 'network':
      default: return {
        border: 'border-blue-200/90', shadowBorder: 'rgba(59,130,246,0.12)',
        gradient: 'from-blue-600 via-indigo-500 to-purple-600',
        iconBg: 'bg-blue-50', iconBorder: 'border-blue-200', iconText: 'text-blue-600',
        progressActive: '#2563eb', progressHoverBg: 'hover:bg-blue-400', progressPast: '#3b82f6',
        btnBg: 'bg-blue-600', btnHover: 'hover:bg-blue-700', btnShadow: 'shadow-blue-500/25',
        spotlightBorder: 'rgba(37,99,235,0.85)',
      };
    }
  }

  switch (scenario) {
    case 'robotics': return {
      border: 'border-orange-500/25', shadowBorder: 'rgba(249,115,22,0.07)',
      gradient: 'from-orange-500 via-amber-400 to-yellow-500',
      iconBg: 'bg-orange-600/20', iconBorder: 'border-orange-500/30', iconText: 'text-orange-400',
      progressActive: '#f97316', progressHoverBg: 'hover:bg-orange-400', progressPast: '#c2410c',
      btnBg: 'bg-orange-600', btnHover: 'hover:bg-orange-500', btnShadow: 'shadow-orange-900/40',
      spotlightBorder: 'rgba(249,115,22,0.5)',
    };
    case 'traffic': return {
      border: 'border-emerald-500/25', shadowBorder: 'rgba(168,85,247,0.07)',
      gradient: 'from-emerald-500 via-green-400 to-teal-500',
      iconBg: 'bg-emerald-600/20', iconBorder: 'border-emerald-500/30', iconText: 'text-emerald-400',
      progressActive: '#10b981', progressHoverBg: 'hover:bg-emerald-400', progressPast: '#047857',
      btnBg: 'bg-emerald-600', btnHover: 'hover:bg-emerald-500', btnShadow: 'shadow-emerald-900/40',
      spotlightBorder: 'rgba(16,185,129,0.5)',
    };
    case 'evacuation': return {
      border: 'border-red-500/25', shadowBorder: 'rgba(239,68,68,0.07)',
      gradient: 'from-red-500 via-rose-400 to-orange-500',
      iconBg: 'bg-red-600/20', iconBorder: 'border-red-500/30', iconText: 'text-red-400',
      progressActive: '#ef4444', progressHoverBg: 'hover:bg-red-400', progressPast: '#b91c1c',
      btnBg: 'bg-red-600', btnHover: 'hover:bg-red-500', btnShadow: 'shadow-red-900/40',
      spotlightBorder: 'rgba(239,68,68,0.5)',
    };
    case 'gameai': return {
      border: 'border-purple-500/25', shadowBorder: 'rgba(168,85,247,0.07)',
      gradient: 'from-purple-500 via-fuchsia-400 to-pink-500',
      iconBg: 'bg-purple-600/20', iconBorder: 'border-purple-500/30', iconText: 'text-purple-400',
      progressActive: '#a855f7', progressHoverBg: 'hover:bg-purple-400', progressPast: '#7e22ce',
      btnBg: 'bg-purple-600', btnHover: 'hover:bg-purple-500', btnShadow: 'shadow-purple-900/40',
      spotlightBorder: 'rgba(168,85,247,0.5)',
    };
    case 'network':
    default: return {
      border: 'border-blue-500/25', shadowBorder: 'rgba(59,130,246,0.07)',
      gradient: 'from-blue-500 via-indigo-400 to-purple-500',
      iconBg: 'bg-blue-600/20', iconBorder: 'border-blue-500/30', iconText: 'text-blue-400',
      progressActive: '#3b82f6', progressHoverBg: 'hover:bg-blue-400', progressPast: '#1d4ed8',
      btnBg: 'bg-blue-600', btnHover: 'hover:bg-blue-500', btnShadow: 'shadow-blue-900/40',
      spotlightBorder: 'rgba(59,130,246,0.5)',
    };
  }
};


// ── Component ─────────────────────────────────────────────────────────────────

interface TutorialOverlayProps {
  isOpen: boolean;
  stepIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onGoTo: (i: number) => void;
  scenario: string;
  steps?: TutorialStep[];
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  isOpen, stepIndex, onClose, onNext, onPrev, onGoTo, scenario, steps = TUTORIAL_STEPS
}) => {
  const { theme: appTheme } = useTheme();
  const isLight = appTheme === 'light';

  const step = steps[stepIndex];
  const stepBody = typeof step.body === 'function' ? step.body(scenario || '') : step.body;
  const [rect, setRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  
  const theme = getTheme(scenario, isLight);

  // Track mobile breakpoint
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isOpen || !step) { setVisible(false); return; }
    setVisible(false);

    // Auto-scroll the target into view if it exists
    const el = document.querySelector(`[data-tutorial="${step.target}"]`);
    // Scroll the target into view on all devices so the highlight is visible.
    // On mobile we use block:'center' so the element sits in the upper half
    // of the screen, leaving room for the bottom-pinned tooltip.
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: isMobile ? 'center' : 'end' });
    }

    // Give extra time on mobile — its scroll animation can be slower
    const timer = setTimeout(() => {
      const r = getTargetRect(step.target);
      setRect(r);
      requestAnimationFrame(() => {
        setTooltipStyle(computeTooltipStyle(r, step.placement, tooltipRef));
        setVisible(true);
      });
    }, isMobile ? 650 : 400);
    return () => clearTimeout(timer);
  }, [isOpen, stepIndex, step, isMobile]);

  // Brighten the active target itself so it remains vivid against the dimmed page.
  useEffect(() => {
    if (!isOpen || !step) return;
    const el = document.querySelector<HTMLElement>(`[data-tutorial="${step.target}"]`);
    if (!el) return;

    const previousFilter = el.style.filter;
    const previousTransition = el.style.transition;
    el.style.transition = `${previousTransition ? `${previousTransition}, ` : ''}filter 250ms ease`;
    el.style.filter = 'brightness(1.22) saturate(1.15)';

    return () => {
      el.style.filter = previousFilter;
      el.style.transition = previousTransition;
    };
  }, [isOpen, stepIndex, step]);

  // We re-compute position whenever stepIndex changes or window resizes.
  useEffect(() => {
    if (!isOpen || !step) return;
    const handler = () => {
      const r = getTargetRect(step.target);
      if (r) {
        setRect(r);
        setTooltipStyle(computeTooltipStyle(r, step.placement, tooltipRef));
      }
    };
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true); // true for capture phase
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [isOpen, stepIndex, step]);

  // Block clicks to the underlying app during tutorial, but allow scrolls
  useEffect(() => {
    if (!isOpen) return;

    const blockClicks = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('.tutorial-interactive')) {
        return; // Allow clicks on tutorial elements
      }
      e.stopPropagation();
      e.preventDefault();
    };

    // Use capture phase to intercept before React or anything else processes it
    window.addEventListener('click', blockClicks, true);

    return () => {
      window.removeEventListener('click', blockClicks, true);
    };
  }, [isOpen]);

  if (!isOpen || !step) return null;

  const isLast = stepIndex === steps.length - 1;
  const isFirst = stepIndex === 0;
  const spotlight = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null;

  const overlayBg = isLight ? 'rgba(15, 23, 42, 0.4)' : 'rgba(0, 0, 0, 0.68)';

  return createPortal(
    <div
      className="fixed inset-0 z-[9000] overflow-hidden pointer-events-none"
      style={{ touchAction: 'pan-x pan-y' }}
    >

      {/* Use the spotlight shadow as the dimming layer so the highlighted area stays clear. */}
      {!spotlight && (
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{ background: overlayBg, opacity: visible ? 1 : 0 }}
        />
      )}

      {/* Spotlight cutout — shown on all devices once element is in view */}
      {spotlight && (
        <div
          className="absolute rounded-xl pointer-events-none transition-all duration-300"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: `0 0 0 9999px ${overlayBg}`,
            border: `2px solid ${theme.spotlightBorder}`,
            outline: `1px solid ${theme.spotlightBorder}`,
            outlineOffset: '2px',
            opacity: visible ? 1 : 0,
          }}
        />
      )}

      {/* Skip pill */}
      <div
        className="absolute top-5 left-1/2 -translate-x-1/2 z-[9010] pointer-events-auto tutorial-interactive"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.25s' }}
      >
        <button
          onClick={onClose}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
            isLight
              ? 'bg-white/95 border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xl shadow-slate-900/10'
              : 'bg-[#111827]/95 border border-white/10 text-gray-300 hover:bg-gray-800 hover:text-white shadow-2xl backdrop-blur-sm'
          }`}
        >
          <span className={`${isLight ? 'text-slate-400' : 'text-gray-500'} text-base leading-none`}>×</span>
          Skip Explanation
        </button>
      </div>

      {/* Step counter */}
      <div
        className="absolute top-5 right-5 z-[9010] select-none pointer-events-auto tutorial-interactive"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.25s' }}
      >
        <div className={`px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-wider ${
          isLight
            ? 'bg-white/95 border border-slate-300 text-slate-700 shadow-lg shadow-slate-900/10'
            : 'bg-[#111827]/90 border border-white/10 text-gray-400'
        }`}>
          {stepIndex + 1} / {steps.length}
        </div>
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute z-[9010] pointer-events-auto tutorial-interactive"
        style={{
          ...tooltipStyle,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(6px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          ...(isMobile
            ? { maxWidth: 'calc(100vw - 24px)' }
            : { maxWidth: '320px', minWidth: '240px' }),
        }}
      >
        <div
          className={`${isLight ? 'bg-white' : 'bg-[#0d1424]'} border ${theme.border} rounded-2xl overflow-hidden transition-colors`}
          style={{
            boxShadow: isLight
              ? '0 20px 45px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.05)'
              : `0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px ${theme.shadowBorder}`
          }}
        >
          <div className={`h-[2px] bg-gradient-to-r ${theme.gradient}`} />
          <div className="p-5 pb-2">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-7 h-7 rounded-full ${theme.iconBg} ${theme.iconBorder} border flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <svg className={`w-3.5 h-3.5 ${theme.iconText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`font-bold text-sm leading-snug ${isLight ? 'text-slate-900 font-extrabold' : 'text-white'}`}>{step.title}</h3>
            </div>
            <p className={`text-[13px] leading-relaxed pl-10 ${isLight ? 'text-slate-600 font-medium' : 'text-gray-300'}`}>{stepBody}</p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 pt-3 pb-3">
            {steps.map((_, i) => (
              <div
                key={i}
                onClick={() => onGoTo(i)}
                className={`rounded-full transition-all duration-300 cursor-pointer ${theme.progressHoverBg}`}
                style={{
                  width: i === stepIndex ? 18 : 6,
                  height: 6,
                  background: i === stepIndex ? theme.progressActive : i < stepIndex ? theme.progressPast : (isLight ? '#cbd5e1' : '#1f2937'),
                }}
                title={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 flex items-center justify-between">
            <button
              onClick={onPrev}
              disabled={isFirst}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-25 disabled:pointer-events-none cursor-pointer ${
                isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              ← Back
            </button>
            <button
              onClick={onNext}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white ${theme.btnBg} ${theme.btnHover} transition-all shadow-lg ${theme.btnShadow} active:scale-95 cursor-pointer`}
            >
              {isLast ? '✓ Got it!' : 'Next →'}
            </button>
          </div>
        </div>
      </div>

    </div>,
    document.body,
  );
};
