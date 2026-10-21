import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { applyTheme, getInitialTheme } from '../../theme/themeTransition';

export interface ThemeToggleProps {
  isDark?: boolean;
  onThemeChange?: (isDark: boolean) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isDark: controlledDark,
  onThemeChange,
}) => {
  const [uncontrolledDark, setUncontrolledDark] = useState<boolean>(getInitialTheme);
  const isControlled = controlledDark !== undefined;
  const isDark = isControlled ? controlledDark : uncontrolledDark;

  const toggleTheme = () => {
    const nextDark = !isDark;
    if (!isControlled) {
      setUncontrolledDark(nextDark);
      applyTheme(nextDark, true, true);
    }
    onThemeChange?.(nextDark);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-testid="theme-toggle-btn"
    >
      {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-200" />}
    </button>
  );
};
