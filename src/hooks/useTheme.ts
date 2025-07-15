import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') setDarkMode(false);
    else if (savedTheme === 'false') setDarkMode(true);
  }, []);

  const themeClasses = darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-100 text-gray-900';

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', (!darkMode).toString());
  };

  return { darkMode, themeClasses, toggleDarkMode };
};