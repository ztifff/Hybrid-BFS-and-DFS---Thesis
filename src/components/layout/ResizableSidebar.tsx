import React, { HTMLAttributes } from 'react';
import { useResizablePanel } from '../../hooks/useResizablePanel';

interface ResizableSidebarProps extends HTMLAttributes<HTMLDivElement> {
  side: 'left' | 'right';
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  snapThreshold?: number;
  storageKey: string;
  innerClassName?: string;
}

export const ResizableSidebar: React.FC<ResizableSidebarProps> = ({
  side,
  defaultWidth = 300,
  minWidth = 260,
  maxWidth = 480,
  snapThreshold = 180,
  storageKey,
  children,
  className = '',
  innerClassName = 'p-4 flex flex-col gap-4',
  ...props
}) => {
  const { width, isCollapsed, isDragging, toggleCollapse, handlePointerDown } = useResizablePanel({
    side,
    defaultWidth,
    minWidth,
    maxWidth,
    snapThreshold,
    storageKey,
  });

  const handleClasses = `absolute top-0 bottom-0 w-2.5 z-50 cursor-col-resize flex items-center justify-center group touch-none`;
  const handlePosition = side === 'left' ? '-right-1.5' : '-left-1.5';

  return (
    <aside
      className={`relative flex-shrink-0 flex flex-col transition-[width] duration-300 ease-out lg:w-[var(--sidebar-width)] w-full ${className} ${isDragging ? '!transition-none select-none' : ''}`}
      style={{
        '--sidebar-width': isCollapsed ? '48px' : `${width}px`,
        ...(props.style || {})
      } as React.CSSProperties}
      {...props}
    >
      {/* Header / Toggle Strip */}
      <div className={`flex items-center p-2 shrink-0 border-b border-gray-800 ${isCollapsed ? 'justify-center' : (side === 'right' ? 'justify-start' : 'justify-end')}`}>
        <button
          onClick={toggleCollapse}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-800 text-gray-500 hover:text-white transition-colors cursor-pointer"
          title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
        >
          {isCollapsed 
            ? (side === 'left' ? '❯' : '❮') 
            : (side === 'left' ? '❮' : '❯')}
        </button>
      </div>

      {/* Content area */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'hidden' : 'flex flex-col'} ${innerClassName}`} style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}>
        {children}
      </div>

      {/* Drag Handle (Visible only on lg+ screens) */}
      {!isCollapsed && (
        <div 
          className={`${handleClasses} ${handlePosition} hidden lg:flex`}
          onPointerDown={handlePointerDown}
        >
          {/* Inner line for visual glow */}
          <div className="w-1 h-full bg-transparent group-hover:bg-blue-500/40 transition-colors rounded-full" />
        </div>
      )}
    </aside>
  );
};
