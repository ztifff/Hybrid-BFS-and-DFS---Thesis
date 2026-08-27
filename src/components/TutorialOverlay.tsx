import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

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
    body: 'Saves and lists all your previous simulation runs. You can view past metrics, compare performance, and replay animations of previous runs.',
    placement: 'bottom',
  },
  {
    target: 'tutorial-size-adjuster',
    title: 'Dynamic Size Adjuster',
    body: 'Allows you to change the size and complexity of synthetic graphs to see how algorithms scale on larger maps.',
    placement: 'left',
  },
  {
    target: 'tutorial-playback-controls',
    title: 'Playback Controls',
    body: 'Run, Pause, Resume, step forward/back, Reset, or Skip to end. Reroll Events generates a new hazard schedule without rerunning the algorithms.',
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
  if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tw = Math.min(tooltipRef.current?.offsetWidth ?? 300, vw - 32);
  const th = tooltipRef.current?.offsetHeight ?? 180;
  const spaceBelow = vh - (rect.top + rect.height + PAD);
  const spaceAbove = rect.top - PAD;
  const spaceRight = vw - (rect.left + rect.width + PAD);
  let resolved = placement === 'auto'
    ? (spaceBelow >= th + 20 ? 'bottom'
      : spaceAbove >= th + 20 ? 'top'
      : spaceRight >= tw + 20 ? 'right'
      : 'left')
    : placement ?? 'bottom';
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
    default: {
      const t = Math.max(12, Math.min(cy - th / 2, vh - th - 12));
      return { top: t, left: rect.left - PAD - tw - 14, width: tw };
    }
  }
}

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
  const step = steps[stepIndex];
  const stepBody = typeof step.body === 'function' ? step.body(scenario || '') : step.body;
  const [rect, setRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isOpen || !step) { setVisible(false); return; }
    setVisible(false);
    
    // Auto-scroll the target into view if it exists
    const el = document.querySelector(`[data-tutorial="${step.target}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    const t = setTimeout(() => {
      const r = getTargetRect(step.target);
      setRect(r);
      requestAnimationFrame(() => {
        setTooltipStyle(computeTooltipStyle(r, step.placement, tooltipRef));
        setVisible(true);
      });
    }, 400); // 400ms delay to let the smooth scroll finish
    return () => clearTimeout(t);
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

  if (!isOpen || !step) return null;

  const isLast = stepIndex === steps.length - 1;
  const isFirst = stepIndex === 0;
  const spotlight = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[9000]">

      {/* Backdrop — click to skip */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,0.75)', opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Spotlight cutout using box-shadow trick */}
      {spotlight && (
        <div
          className="absolute rounded-xl pointer-events-none transition-all duration-300"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
            border: '2px solid rgba(96,165,250,0.5)',
            opacity: visible ? 1 : 0,
          }}
        />
      )}

      {/* Skip pill */}
      <div
        className="absolute top-5 left-1/2 -translate-x-1/2 z-[9010]"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.25s' }}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111827]/95 border border-white/10 text-gray-300 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 hover:text-white transition-all shadow-2xl backdrop-blur-sm cursor-pointer"
        >
          <span className="text-gray-500 text-base leading-none">×</span>
          Skip Explanation
        </button>
      </div>

      {/* Step counter */}
      <div
        className="absolute top-5 right-5 z-[9010] select-none"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.25s' }}
      >
        <div className="px-3 py-1.5 rounded-full bg-[#111827]/90 border border-white/10 text-gray-400 text-[10px] font-mono tracking-wider">
          {stepIndex + 1} / {steps.length}
        </div>
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute z-[9010] max-w-[320px] min-w-[240px]"
        style={{
          ...tooltipStyle,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(6px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
        }}
      >
        <div className="bg-[#0d1424] border border-blue-500/25 rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.7),0_0_0_1px_rgba(96,165,250,0.07)] overflow-hidden">
          <div className="h-[2px] bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500" />
          <div className="p-5 pb-2">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-sm leading-snug">{step.title}</h3>
            </div>
            <p className="text-gray-300 text-[13px] leading-relaxed pl-10">{stepBody}</p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 pt-3 pb-3">
            {steps.map((_, i) => (
              <div
                key={i}
                onClick={() => onGoTo(i)}
                className="rounded-full transition-all duration-300 cursor-pointer hover:bg-blue-400"
                style={{
                  width: i === stepIndex ? 18 : 6,
                  height: 6,
                  background: i === stepIndex ? '#3b82f6' : i < stepIndex ? '#1d4ed8' : '#1f2937',
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
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={onNext}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/40 active:scale-95 cursor-pointer"
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
