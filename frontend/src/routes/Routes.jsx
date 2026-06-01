import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Onboarding from '../pages/Onboarding';
import Dashboard from '../pages/Dashboard';
import AnalyticsDashboard from '../pages/AnalyticsDashboard';
import Disease from '../pages/Disease';
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/AdminDashboard';
import AdminUsers from '../pages/AdminUsers';
import AdminDiseaseDB from '../pages/AdminDiseaseDB';
import AdminReports from '../pages/AdminReports';
import AdminActivityLog from '../pages/AdminActivityLog';
import AdminSettings from '../pages/AdminSettings';
import PageNotFound from '../pages/PageNotFound';
import LiveDetection from '../pages/LiveDetection';
import UploadDetection from '../pages/UploadDetection';
import SymptomsRecommendation from '../pages/SymptomsRecommendation';
import HistoryScans from '../pages/HistoryScans';
import LoginLogs from '../pages/admin/LoginLogs';

const AppRoutes = () => {
  const { user, admin, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login/*" element={<Login />} />
      <Route path="/signup/*" element={<Signup />} />

      {/* User Routes */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requiredRole="user">
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="user">
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="analytics" replace />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="live-detection" element={<LiveDetection />} />
        <Route path="upload-detection" element={<UploadDetection />} />
        <Route path="symptoms-recommendation" element={<SymptomsRecommendation />} />
        <Route path="history" element={<HistoryScans />} />
      </Route>
      <Route
        path="/disease/:id"
        element={
          <ProtectedRoute requiredRole="user">
            <Disease />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes with Nested Layout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="analytics" replace />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="live-detection" element={<LiveDetection />} />
        <Route path="upload-detection" element={<UploadDetection />} />
        <Route path="symptoms-recommendation" element={<SymptomsRecommendation />} />
        <Route path="history" element={<HistoryScans />} />
        <Route path="login-logs" element={<LoginLogs />} />
      </Route>

      {/* 404 Page Not Found */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default AppRoutes;
