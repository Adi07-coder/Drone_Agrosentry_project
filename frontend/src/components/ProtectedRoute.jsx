import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isInitializing, user, admin } = useAuth();

  // Wait for localStorage auth state to be restored before making any
  // redirect decisions — prevents valid sessions from being bounced on refresh.
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && !admin) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'user' && !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
