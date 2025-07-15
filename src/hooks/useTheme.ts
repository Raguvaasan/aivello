export const useTheme = () => {
  const darkMode = false;

  const themeClasses = 'bg-gray-100 text-gray-900';

  const toggleDarkMode = () => {
    // Dark mode disabled – do nothing or optionally show alert
    //console.log('Dark mode is disabled.');
  };

  return { darkMode, themeClasses, toggleDarkMode };
};
