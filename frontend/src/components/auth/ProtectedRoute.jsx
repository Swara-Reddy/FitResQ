import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FitResQLogo from '../common/FitResQLogo';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] flex flex-col items-center justify-center p-4 transition-colors duration-200">
        <div className="text-center space-y-4 animate-in fade-in duration-300">
          <div className="inline-block animate-pulse">
            <FitResQLogo size="lg" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Verifying Cognito Session...
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Connecting securely to FitResQ User Pool
            </p>
          </div>
          <div className="w-32 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div className="w-1/2 h-full bg-brand-600 rounded-full animate-indeterminate" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
