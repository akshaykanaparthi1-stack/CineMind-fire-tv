import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useTVFocus } from '../../context/TVNavigationContext';

interface ThemeToggleButtonProps {
  showLabel?: boolean;
  className?: string;
  focusId?: string;
}

export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({
  showLabel = true,
  className = '',
  focusId = 'nav-theme-toggle',
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { ref, isFocused } = useTVFocus(focusId, 'top-search-bar', {
    onSelect: toggleTheme,
  });

  return (
    <button
      ref={ref as any}
      type="button"
      onClick={toggleTheme}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border transition-all rounded-none tv-focusable ${
        isDarkMode
          ? 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
          : 'bg-white text-slate-800 hover:text-black border-slate-300 hover:border-slate-400 shadow-sm'
      } ${isFocused ? (isDarkMode ? 'tv-focused ring-2 ring-white' : 'tv-focused ring-2 ring-slate-900') : ''} ${className}`}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Dark and Light Mode"
    >
      {isDarkMode ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          {showLabel && <span className="hidden sm:inline text-[11px] font-medium">Light</span>}
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-500" />
          {showLabel && <span className="hidden sm:inline text-[11px] font-medium text-slate-700">Dark</span>}
        </>
      )}
    </button>
  );
};
