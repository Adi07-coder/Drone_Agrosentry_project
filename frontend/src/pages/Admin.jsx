import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar, Sidebar } from '../components/common';
import { StatCard, Chart } from '../components/dashboard';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  Users,
  TrendingUp,
  Zap,
  Activity,
  Search,
  MoreVertical,
  Trash2,
  Edit,
} from 'lucide-react';
import { mockAdminStats, mockAdminUsers, mockActivityLog, mockChartData, mockScanRecords, mockDiseaseDBAnalytics } from '../data/mockData';
import { containerVariants, itemVariants } from '../animations/variants';
import UserManagementTable from '../components/admin/UserManagementTable';
import DiseaseDBTable from '../components/admin/DiseaseDBTable';
import DiseaseDBAnalytics from '../components/admin/DiseaseDBAnalytics';
import ActivityTimeline from '../components/admin/ActivityTimeline';

const Admin = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'overview', label: 'Dashboard' },
    { id: 'users', label: 'User Management' },
    { id: 'disease-db', label: 'Disease DB' },
    { id: 'reports', label: 'Reports' },
    { id: 'activity', label: 'Activity Log' },
  ];

  const filteredUsers = mockAdminUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar user={user} onLogout={onLogout} />

      <div className="flex pt-16">
        <Sidebar userRole="admin" onLogout={onLogout} />

        <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-slate-400">Manage your PlantAI system</p>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={itemVariants} className="flex gap-4 mb-8 border-b border-slate-800 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-semibold border-b-2 transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </motion.div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard
                    icon={Users}
                    label="Total Users"
                    value={mockAdminStats.totalUsers}
                    trend="+45 this month"
                    color="emerald"
                  />
                  <StatCard
                    icon={Activity}
                    label="Active Users"
                    value={mockAdminStats.activeUsers}
                    trend="+12 today"
                    color="blue"
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="Total Scans"
                    value={mockAdminStats.totalScans}
                    trend="+2.3K this month"
                    color="purple"
                  />
                  <StatCard
                    icon={Zap}
                    label="System Uptime"
                    value={`${mockAdminStats.systemUptime}%`}
                    trend="All systems green"
                    color="amber"
                  />
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                  <Chart
                    type="bar"
                    data={mockChartData.scansPerDay}
                    title="Scans This Week"
                  />
                  <Chart
                    type="pie"
                    data={mockChartData.diseaseDistribution}
                    title="Disease Distribution"
                  />
                </div>

                {/* System Status */}
                <motion.div variants={itemVariants}>
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-6">System Status</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-slate-400 mb-2">API Response Time</p>
                        <div className="flex items-end gap-2">
                          <p className="text-3xl font-bold">{mockAdminStats.avgResponseTime}ms</p>
                          <span className="text-emerald-400 text-sm mb-1">Optimal</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-2">Total API Calls</p>
                        <p className="text-3xl font-bold">{mockAdminStats.apiCalls.toLocaleString()}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <UserManagementTable users={mockAdminUsers} mockScans={mockScanRecords} />
              </motion.div>
            )}

            {/* Disease DB Tab */}
            {activeTab === 'disease-db' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants} className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">Disease Detection Database</h2>
                </motion.div>

                <DiseaseDBAnalytics data={mockDiseaseDBAnalytics} />

                <motion.div variants={itemVariants} className="mb-6">
                  <h3 className="text-xl font-semibold mb-4">Scan Records</h3>
                </motion.div>

                <DiseaseDBTable scanRecords={mockScanRecords} />
              </motion.div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}>
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
                    <ActivityTimeline activityLog={mockActivityLog} />
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div variants={itemVariants}>
                    <Card className="p-6">
                      <h3 className="text-xl font-bold mb-4">Generate Reports</h3>
                      <div className="space-y-3">
                        <Button variant="secondary" className="w-full">
                          User Analytics Report
                        </Button>
                        <Button variant="secondary" className="w-full">
                          Disease Detection Report
                        </Button>
                        <Button variant="secondary" className="w-full">
                          System Performance Report
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <Card className="p-6">
                      <h3 className="text-xl font-bold mb-4">Recent Reports</h3>
                      <div className="space-y-3 text-slate-300">
                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                          <span>Monthly Analytics</span>
                          <span className="text-sm text-slate-500">May 10</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                          <span>System Health Check</span>
                          <span className="text-sm text-slate-500">May 8</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                          <span>User Growth Analysis</span>
                          <span className="text-sm text-slate-500">May 5</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
