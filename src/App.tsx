import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import AnalyticsProvider from './context/AnalyticsProvider';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { SkipToContent } from './components/common/SkipToContent';
import { router } from './routes';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AnalyticsProvider>
            {/* Each page renders its own <main id="main-content"> as the skip target. */}
            <SkipToContent />
            <RouterProvider router={router} />
            <OfflineIndicator />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                  border: '1px solid rgb(var(--color-border))',
                },
              }}
            />
          </AnalyticsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
