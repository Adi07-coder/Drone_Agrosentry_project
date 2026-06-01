import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar, Sidebar } from '../components/common';
import { containerVariants, itemVariants } from '../animations/variants';
import { motion } from 'framer-motion';

import { useAuth } from '../hooks/useAuth';

const AdminLayout = ({ user: propUser, onLogout }) => {
  const navigate = useNavigate();
  const { user: authUser, admin: authAdmin, logout } = useAuth();

  const currentUser = propUser || authUser || authAdmin;

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
      navigate('/role-select');
    }
  };

  // Fallback dashboard view
  const showDefaultDashboard = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar user={currentUser} onLogout={handleLogout} userRole="admin" />

      <div className="flex pt-16">
        <Sidebar userRole="admin" onLogout={handleLogout} />

        <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
