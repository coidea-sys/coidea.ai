import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle"
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-icon">{isDark ? '🌙' : '☀️'}</span>
      <span className="theme-label">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
};

export default ThemeToggle;
