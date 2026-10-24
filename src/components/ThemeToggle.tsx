import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center gap-2 p-2 rounded-[10px] border border-border bg-surface hover:bg-surface-2 text-text-muted hover:text-text transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-accent transition-transform hover:rotate-45" strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 text-text transition-transform hover:-rotate-12" strokeWidth={1.75} aria-hidden="true" />
      )}
      {showLabel && (
        <span className="text-xs font-mono select-none">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
