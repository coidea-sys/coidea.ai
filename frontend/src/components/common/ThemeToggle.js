import React from 'react';
import { useTheme, THEMES } from '../../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, isDark, isLight, isOrganic, cycleTheme } = useTheme();

  const getIcon = () => {
    if (isDark) return '🌙';
    if (isLight) return '☀️';
    if (isOrganic) return '🌱';
    return '🎨';
  };

  const getLabel = () => {
    if (isDark) return 'Dark';
    if (isLight) return 'Light';
    if (isOrganic) return 'Organic';
    return 'Theme';
  };

  return (
    <button 
      className={`theme-toggle ${theme}`}
      onClick={cycleTheme}
      title={`Current: ${getLabel()} - Click to cycle`}
    >
      <span className="theme-icon">{getIcon()}</span>
      <span className="theme-label">{getLabel()}</span>
    </button>
  );
};

export default ThemeToggle;
