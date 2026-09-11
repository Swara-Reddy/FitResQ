import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SupportProvider } from './context/SupportContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AISupport from './pages/AISupport';
import MyCases from './pages/MyCases';
import CaseDetails from './pages/CaseDetails';
import Refunds from './pages/Refunds';
import RequestRefund from './pages/RequestRefund';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SupportProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <Routes>
                {/* Public / Auth Callback Route */}
                <Route path="/login" element={<Login />} />

                {/* Protected Application Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="ai-support" element={<AISupport />} />
                  <Route path="cases" element={<MyCases />} />
                  <Route path="cases/:id" element={<CaseDetails />} />
                  <Route path="cases/:caseId" element={<CaseDetails />} />
                  <Route path="refunds" element={<Refunds />} />
                  <Route path="refund-request" element={<RequestRefund />} />
                  <Route path="refunds/request" element={<RequestRefund />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </SupportProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
