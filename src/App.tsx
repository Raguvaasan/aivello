import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { Dashboard } from './components/layout/Dashboard';
import { LoadingScreen } from './components/common/LoadingScreen';
import { useTheme } from './hooks/useTheme';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { darkMode } = useTheme();

  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <LandingPage />
    </div>
  );
};

export default App;