import React from 'react';
import { motion } from 'framer-motion';
import { ImageUploadAgent, SymptomBasedAgent, LiveCameraAgent } from '../components/dashboard';
import { containerVariants, itemVariants } from '../animations/variants';
import { useAuth } from '../hooks/useAuth';

const AdminDashboard = () => {
  const { admin } = useAuth();

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">
            Welcome back, <span className="text-emerald-400 font-semibold">{admin?.name}</span> ({admin?.email})
          </p>
        </div>
      </motion.div>

      {/* AI Agents Section */}
      <div className="mt-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Disease Detection Agents</h2>
        <div className="space-y-8">
          <ImageUploadAgent />
          <SymptomBasedAgent />
          <LiveCameraAgent />
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
