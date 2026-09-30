import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingScreen } from '../common/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Gates pages that show the signed-in user's own data (history, profile). Tools are
 * public and are not wrapped in this.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, initialized, ensureAuth } = useAuth();
  const location = useLocation();

  useEffect(() => {
    ensureAuth();
  }, [ensureAuth]);

  // Wait for Firebase to report the real session before deciding; redirecting on the
  // initial `null` would bounce signed-in users to /login on every refresh.
  if (!initialized) {
    return <LoadingScreen label="Checking your session…" />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
