import React, { useState } from "react";
import { createPortal } from "react-dom";
import { GraphNode, RobotAssignment } from "../../types";

interface Props {
  assignments: RobotAssignment[];
  setAssignments: (assignments: RobotAssignment[]) => void;
  depotNodes: GraphNode[];
  shelfNodes: GraphNode[];
  disabled?: boolean;
  mapId?: string;
}

export const RobotAssignmentPanel: React.FC<Props> = ({
  assignments,
  setAssignments,
  depotNodes,
  shelfNodes,
  disabled = false,
  mapId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRobotId, setActiveRobotId] = useState<string | null>(null);
  const [minRobotWarning, setMinRobotWarning] = useState(false);
  const [minDestWarning, setMinDestWarning] = useState(false);

  const isBoxDeliveryMap = mapId === 'aws' || mapId === 'awsWarehouse' || mapId === 'synthetic';

  const formatLabel = (label: string) => {
    return label
      .replace(/\n/g, " ")
      .replace(/Finish Line /g, "FL-")
      .replace(/Packing Desk /g, "PD-");
  };

  const getRobotLabel = (robotId: string) => {
    const node = depotNodes.find(n => n.id === robotId);
    return node ? formatLabel(node.label) : robotId;
  };

  const getShelfLabel = (shelfId: string) => {
    const node = shelfNodes.find(n => n.id === shelfId);
    return node ? formatLabel(node.label) : shelfId;
  };

  const toggleDestination = (robotId: string, shelfId: string) => {
    setAssignments(assignments.map(a => {
      if (a.robotId !== robotId) return a;
      const hasIt = a.destinations.includes(shelfId);
      
      // Prevent removing the last destination — show warning instead
      if (hasIt && a.destinations.length <= 1) {
        setMinDestWarning(true);
        setTimeout(() => setMinDestWarning(false), 3000);
        return a;
      }

      const newDests = hasIt ? a.destinations.filter(d => d !== shelfId) : [...a.destinations, shelfId];
      const newPriority = (hasIt && a.priorityDest === shelfId) ? undefined : a.priorityDest;
      // Initialize box count to 6 when selecting a new destination
      const newBoxCounts = { ...(a.boxCounts ?? {}) };
      if (!hasIt) newBoxCounts[shelfId] = 6;
      else delete newBoxCounts[shelfId];
      return { ...a, destinations: newDests, priorityDest: newPriority, boxCounts: newBoxCounts };
    }));
  };

  const togglePriority = (robotId: string, shelfId: string) => {
    setAssignments(assignments.map(a => {
      if (a.robotId !== robotId) return a;
      return { ...a, priorityDest: a.priorityDest === shelfId ? undefined : shelfId };
    }));
  };

  const setBoxCount = (robotId: string, shelfId: string, count: number) => {
    setAssignments(assignments.map(a => {
      if (a.robotId !== robotId) return a;
      return { ...a, boxCounts: { ...(a.boxCounts ?? {}), [shelfId]: Math.min(6, Math.max(1, count)) } };
    }));
  };

  const removeRobot = (robotId: string) => {
    // Block if this is the last active robot
    if (assignments.length <= 1) {
      setMinRobotWarning(true);
      setTimeout(() => setMinRobotWarning(false), 3000);
      return;
    }
    setAssignments(assignments.filter(a => a.robotId !== robotId));
    if (activeRobotId === robotId) setActiveRobotId(null);
  };

  const addRobot = (robotId: string) => {
    if (assignments.some(a => a.robotId === robotId)) return;
    const newAssignments = [...assignments, { robotId, destinations: [] }];
    setAssignments(newAssignments);
    setActiveRobotId(robotId);
  };

  const unassignedDepots = depotNodes.filter(d => !assignments.some(a => a.robotId === d.id));

  const totalDests = assignments.reduce((sum, a) => sum + a.destinations.length, 0);
  const totalBoxes = assignments.reduce((sum, a) =>
    sum + a.destinations.reduce((s, d) => s + (a.boxCounts?.[d] ?? 6), 0), 0
  );
  const activeAssignment = assignments.find(a => a.robotId === activeRobotId);

  // Summary button shown in sidebar
  const SummaryButton = (
    <button
      onClick={() => {
        if (!disabled) {
          setIsOpen(true);
          if (!activeRobotId && assignments.length > 0) setActiveRobotId(assignments[0].robotId);
        }
      }}
      disabled={disabled}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        disabled
          ? "bg-gray-900 border-gray-700"
          : "bg-green-900/20 border-green-900/40 hover:border-green-500/60 hover:bg-green-900/30"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm sm:hidden">🤖</span>
        <div className="text-left">
          <div className="text-[10px] uppercase tracking-[0.18em] text-green-400 font-bold">
            Robot Assignments
          </div>
          <div className="text-[11px] text-gray-400 font-medium">
            {assignments.length} robot{assignments.length !== 1 ? "s" : ""} · {totalDests} dest{totalDests !== 1 ? "s" : ""}
            {isBoxDeliveryMap ? <> · {totalBoxes} box{totalBoxes !== 1 ? "es" : ""}</> : ""}
          </div>
        </div>
      </div>
      <span className="text-gray-400 text-xs sm:hidden">⚙️</span>
    </button>
  );

  return (
    <>
      {SummaryButton}

      {/* Modal Overlay */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-10 glass-panel rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.15)] w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden fade-in">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-green-900/10 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xl sm:hidden">🤖</span>
                <div>
                  <h2 className="text-sm font-bold text-white">Robot Delivery Assignments</h2>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Assign destinations to each robot · <span className="sm:hidden">⭐ </span>Priority destinations are visited first
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body — two pane layout */}
            <div className="flex flex-1 min-h-0">
              
              {/* Left Pane — Robot List */}
              <div className="w-56 shrink-0 border-r border-gray-800 flex flex-col bg-[#0a0f1e]">
                <div className="px-3 py-2 text-[9px] uppercase tracking-widest text-gray-500 font-bold border-b border-gray-800">
                  Active Robots
                </div>
                <div className="flex-1 overflow-y-auto">
                  {assignments.length === 0 && (
                    <div className="text-xs text-gray-600 italic text-center p-4">
                      No robots active
                    </div>
                  )}
                  {assignments.map(a => {
                    const isActive = a.robotId === activeRobotId;
                    return (
                      <button
                        key={a.robotId}
                        onClick={() => setActiveRobotId(a.robotId)}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-2 border-b border-gray-800/50 transition-colors cursor-pointer ${
                          isActive
                            ? "bg-green-900/30 border-l-2 border-l-green-500"
                            : "hover:bg-gray-800/50"
                        }`}
                      >
                        <span className="text-sm shrink-0 sm:hidden">🤖</span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-semibold truncate ${isActive ? "text-green-300" : "text-gray-300"}`}>
                            {getRobotLabel(a.robotId)}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {a.destinations.length} dest{a.destinations.length !== 1 ? "s" : ""}
                            {a.priorityDest && <><span className="sm:hidden"> · ⭐</span> priority</>}
                          </div>
                        </div>
                        {!disabled && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeRobot(a.robotId); }}
                            title="Remove robot"
                            className="shrink-0 text-gray-600 hover:text-red-400 text-xs transition-colors ml-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </button>
                    );
                  })}

                  {/* Minimum robot warning — sticky at bottom of robot list */}
                  {minRobotWarning && (
                    <div className="sticky bottom-0 z-10 px-3 py-2.5 bg-amber-950 border-t border-amber-500/60 flex items-start gap-2">
                      <span className="text-amber-400 text-sm shrink-0 mt-0.5 sm:hidden">⚠️</span>
                      <div>
                        <p className="text-amber-300 text-[11px] font-bold leading-tight">Minimum 1 Robot Required</p>
                        <p className="text-amber-400/70 text-[10px] mt-0.5 leading-tight">At least one active robot must remain in the simulation.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Inactive robots */}
                {!disabled && mapId !== 'synthetic' && unassignedDepots.length > 0 && (
                  <div className="border-t border-gray-800 p-2">
                    <div className="text-[9px] uppercase tracking-widest text-gray-600 font-bold mb-1 px-1">
                      Inactive
                    </div>
                    {unassignedDepots.map(depot => (
                      <button
                        key={depot.id}
                        onClick={() => addRobot(depot.id)}
                        title={`Add ${depot.label}`}
                        className="w-full text-left px-2 py-1.5 text-[11px] text-gray-500 hover:text-green-400 hover:bg-gray-800/50 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="text-gray-600">+</span>
                        {formatLabel(depot.label)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Pane — Destination Selector */}
              <div className="flex-1 flex flex-col min-h-0">
                {!activeRobotId ? (
                  <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
                    ← Select a robot to configure its destinations
                  </div>
                ) : !activeAssignment ? (
                  <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
                    Robot not found
                  </div>
                ) : (
                  <>
                    {/* Robot header */}
                    <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/30 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:hidden">🤖</span>
                        <div>
                          <div className="text-sm font-bold text-green-300">
                            {getRobotLabel(activeAssignment.robotId)}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {activeAssignment.destinations.length} destinations selected
                            {activeAssignment.priorityDest && (
                              <span className="text-amber-400 ml-2">
                                · <span className="sm:hidden">⭐ </span>{getShelfLabel(activeAssignment.priorityDest)} is priority
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Destination list */}
                    <div className="flex-1 overflow-y-auto p-3">
                      {/* Minimum destination warning — sticky at top */}
                      {minDestWarning && (
                        <div className="sticky top-0 z-10 -mx-3 -mt-3 mb-3 px-3 py-2.5 bg-amber-950 border-b border-amber-500/60 flex items-start gap-2">
                          <span className="text-amber-400 text-sm shrink-0 mt-0.5 sm:hidden">⚠️</span>
                          <div>
                            <p className="text-amber-300 text-[11px] font-bold leading-tight">Minimum 1 Destination Required</p>
                            <p className="text-amber-400/70 text-[10px] mt-0.5 leading-tight">Each robot must have at least one delivery destination assigned.</p>
                          </div>
                        </div>
                      )}
                      <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2 px-1">
                        Click to select · <span className="sm:hidden">⭐ </span>to set priority (visited first)
                      </div>
                      <div className="space-y-1">
                        {shelfNodes
                          .sort((a, b) => a.label.localeCompare(b.label))
                          .map(shelf => {
                            const isSelected = activeAssignment.destinations.includes(shelf.id);
                            const isPriority = activeAssignment.priorityDest === shelf.id;

                            return (
                              <div
                                key={shelf.id}
                                className={`flex flex-col gap-1.5 px-3 py-2 rounded-lg border transition-all ${
                                  isPriority
                                    ? "bg-amber-900/25 border-amber-500/50"
                                    : isSelected
                                    ? "bg-blue-900/25 border-blue-500/40"
                                    : "bg-gray-800/40 border-gray-700/40 hover:border-gray-600"
                                } ${disabled ? "" : "cursor-pointer"}`}
                                onClick={() => {
                                  if (!disabled) toggleDestination(activeAssignment.robotId, shelf.id);
                                }}
                              >
                                {/* Top row: checkbox + label + priority */}
                                <div className="flex items-center gap-3">
                                  {/* Checkbox */}
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected
                                      ? "bg-blue-500 border-blue-500"
                                      : "border-gray-600"
                                  }`}>
                                    {isSelected && <span className="text-white text-[10px] leading-none">✓</span>}
                                  </div>

                                  {/* Label */}
                                  <span className={`flex-1 text-xs font-medium truncate ${
                                    isPriority ? "text-amber-200" : isSelected ? "text-blue-200" : "text-gray-300"
                                  }`}>
                                    {formatLabel(shelf.label)}
                                  </span>

                                  {/* Priority toggle */}
                                  {isSelected && !disabled && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        togglePriority(activeAssignment.robotId, shelf.id);
                                      }}
                                      title={isPriority ? "Remove priority" : "Set as priority — visited first"}
                                      className={`shrink-0 text-sm transition-colors cursor-pointer px-1 rounded ${
                                        isPriority
                                          ? "text-amber-400 hover:text-gray-400"
                                          : "text-gray-600 hover:text-amber-400"
                                      }`}
                                    >
                                      <span className="sm:hidden">{isPriority ? "⭐" : "☆"}</span>
                                    </button>
                                  )}

                                  {isPriority && (
                                    <span className="text-[9px] text-amber-400 uppercase tracking-wider font-bold shrink-0">
                                      Priority
                                    </span>
                                  )}
                                </div>

                                {/* Box count row — show for AWS Warehouse and Synthetic maps */}
                                {isSelected && mapId !== 'clinic' && (
                                  <div
                                    className="flex items-center gap-2 pl-7"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider pl-1">Boxes:</span>
                                    <div className="flex items-center gap-1">
                                      {Array.from({ length: 6 }, (_, i) => {
                                        const boxNum = i + 1;
                                        const currentCount = activeAssignment.boxCounts?.[shelf.id] ?? 6;
                                        const isFilled = boxNum <= currentCount;
                                        return (
                                          <button
                                            key={boxNum}
                                            disabled={disabled}
                                            onClick={() => setBoxCount(activeAssignment.robotId, shelf.id, boxNum)}
                                            title={`Set ${boxNum} box${boxNum !== 1 ? 'es' : ''}`}
                                            className={`p-0.5 transition-all cursor-pointer hover:scale-110 disabled:cursor-not-allowed ${
                                              isFilled ? 'text-amber-500' : 'text-gray-600'
                                            }`}
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={isFilled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                              {isFilled && <line x1="9" y1="9" x2="15" y2="15"></line>}
                                              {isFilled && <line x1="15" y1="9" x2="9" y2="15"></line>}
                                            </svg>
                                          </button>
                                        );
                                      })}
                                      <span className="text-[10px] text-gray-400 ml-1">
                                        {activeAssignment.boxCounts?.[shelf.id] ?? 6}/6
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800 bg-[#0a0f1e] shrink-0">
              <div className="text-xs text-gray-500">
                {assignments.length} robot{assignments.length !== 1 ? "s" : ""} · {totalDests} destination{totalDests !== 1 ? "s" : ""}
                {isBoxDeliveryMap ? <> · {totalBoxes} box{totalBoxes !== 1 ? "es" : ""} configured</> : ""}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 bg-green-700 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer shadow-md"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
