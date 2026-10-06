import React, { Suspense, lazy } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import AnalyticsProvider from './context/AnalyticsProvider';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { SkipToContent } from './components/common/SkipToContent';
import { router } from './routes';

// Toasts only ever follow a user action, so the toaster and its CSS-in-JS runtime stay
// out of the initial bundle. A toast fired before it mounts waits in the shared store.
const Toaster = lazy(() => import('react-hot-toast').then((m) => ({ default: m.Toaster })));

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
            <Suspense fallback={null}>
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
            </Suspense>
          </AnalyticsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
