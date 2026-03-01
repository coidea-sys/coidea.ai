import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  ORGANIC: 'organic'
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('coidea-theme') || THEMES.ORGANIC;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('coidea-theme', theme);
  }, [theme]);

  const setDark = () => setTheme(THEMES.DARK);
  const setLight = () => setTheme(THEMES.LIGHT);
  const setOrganic = () => setTheme(THEMES.ORGANIC);
  const cycleTheme = () => {
    const themes = [THEMES.DARK, THEMES.LIGHT, THEMES.ORGANIC];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const value = {
    theme,
    isDark: theme === THEMES.DARK,
    isLight: theme === THEMES.LIGHT,
    isOrganic: theme === THEMES.ORGANIC,
    setDark,
    setLight,
    setOrganic,
    cycleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;
