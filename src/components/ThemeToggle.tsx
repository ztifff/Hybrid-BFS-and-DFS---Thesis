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
      className={`relative px-2.5 sm:px-3 py-1.5 rounded-lg glass-panel text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] shadow-md hover:shadow-glow-blue border ${
        isDark 
          ? 'text-amber-300 border-amber-500/30 hover:border-amber-400/50 bg-gray-900/60' 
          : 'text-indigo-600 border-indigo-300 hover:border-indigo-500 bg-white/90 shadow-sm'
      } ${className}`}
    >
      <span className="text-sm sm:text-base leading-none transition-transform duration-300 transform group-hover:rotate-12">
        {isDark ? '☀️' : '🌙'}
      </span>
      {showLabel && (
        <span className="hidden md:inline font-semibold tracking-wide">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
