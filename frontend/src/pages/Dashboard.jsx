import React from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Sidebar, Navbar } from '../components/common';
import { Outlet } from 'react-router-dom';
import { containerVariants } from '../animations/variants';
import { useAuth } from "../hooks/useAuth";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Logout failed');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <Navbar onLogout={handleLogout} userRole="user" />

      {/* Main Layout */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <Sidebar userRole="user" onLogout={handleLogout} />

        {/* Content */}
        <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto"
          >
            {/* Header */}
            <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Welcome back, <span className="text-emerald-400">{user?.name}</span></h1>
                <p className="text-slate-400 mb-2">{user?.email}</p>
                <p className="text-slate-400">Here's what's happening with your plants today</p>
              </div>
              <a
                href={`http://${window.location.hostname}:8501`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-lime-500/10 border border-emerald-500/30 text-emerald-300 hover:text-emerald-100 hover:border-emerald-400/50 transition text-sm font-semibold whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Streamlit Analytics
              </a>
            </div>

            {/* Nested Route Content */}
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
