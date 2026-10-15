import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = true }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`group relative px-2.5 sm:px-3 py-1.5 rounded-lg glass-panel text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] shadow-md hover:shadow-glow-blue border ${
        isDark 
          ? 'text-amber-300 border-amber-500/30 hover:border-amber-400/50 bg-gray-900/60' 
          : 'text-indigo-600 border-indigo-300 hover:border-indigo-500 bg-white/90 shadow-sm'
      } ${className}`}
    >
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center transition-transform duration-300 group-hover:rotate-12 sm:h-[18px] sm:w-[18px]" aria-hidden="true">
        {isDark ? (
          <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3.8" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.7 8.7 0 1 0 20.2 15.1Z" />
          </svg>
        )}
      </span>
      {showLabel && (
        <span className="hidden md:inline font-semibold tracking-wide">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
