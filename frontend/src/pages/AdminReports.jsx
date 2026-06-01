import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { containerVariants, itemVariants } from '../animations/variants';
import { Download, FileText, BarChart3, Activity, RefreshCw, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const AdminReports = () => {
  const [recentReports, setRecentReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authHeader = axios.defaults.headers.common['Authorization'] || 
      (localStorage.getItem('authToken') ? `Bearer ${localStorage.getItem('authToken')}` : '');
    axios.get('/api/detect/stats/system', {
      headers: authHeader ? { Authorization: authHeader } : {}
    }).then(res => {
      if (res.data.success) setStats(res.data.stats);
    }).catch(() => {});

    setRecentReports([
      { name: 'Platform Scan History (Realtime)', type: 'realtime', format: 'csv' },
      { name: 'Platform Scan History (Realtime)', type: 'realtime', format: 'xlsx' },
      { name: 'Platform Scan History (Upload)', type: 'upload', format: 'csv' },
      { name: 'Platform Scan History (Upload)', type: 'upload', format: 'xlsx' },
    ]);
  }, []);

  const downloadReport = async (type, format) => {
    const authHeader = axios.defaults.headers.common['Authorization'] || 
      (localStorage.getItem('authToken') ? `Bearer ${localStorage.getItem('authToken')}` : '');
    const url = `/api/detect/download/${type}/${format === 'xlsx' ? 'excel' : 'csv'}`;
    try {
      const link = document.createElement('a');
      // Add auth header via fetch then blob
      const response = await fetch(url, {
        headers: authHeader ? { Authorization: authHeader } : {}
      });
      if (!response.ok) {
        toast.error('No scan data yet. Complete a scan first!');
        return;
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      link.setAttribute('download', `agrosentry_${type}_history.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success(`Downloaded ${type} history as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Download failed. Make sure a scan has been completed.');
    }
  };

  const reportButtons = [
    { label: 'Live Camera Scan History (CSV)', type: 'realtime', format: 'csv', icon: Activity, color: 'emerald' },
    { label: 'Live Camera Scan History (Excel)', type: 'realtime', format: 'xlsx', icon: FileText, color: 'emerald' },
    { label: 'Image Upload Scan History (CSV)', type: 'upload', format: 'csv', icon: BarChart3, color: 'blue' },
    { label: 'Image Upload Scan History (Excel)', type: 'upload', format: 'xlsx', icon: Download, color: 'blue' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Reports & Analytics</h2>
        <p className="text-slate-400">Generate, export and manage system scan reports</p>
      </motion.div>

      {/* Live System Stats */}
      {stats && (
        <motion.div variants={itemVariants} className="mb-8">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Live System Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-3xl font-black text-emerald-400">{stats.totalDetections || 0}</p>
                <p className="text-slate-400 text-sm mt-1">Total Scans</p>
              </div>
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                <p className="text-3xl font-black text-green-400">{stats.healthyCount || 0}</p>
                <p className="text-slate-400 text-sm mt-1">Healthy Plants</p>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <p className="text-3xl font-black text-red-400">{stats.diseasedCount || 0}</p>
                <p className="text-slate-400 text-sm mt-1">Diseased Plants</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <p className="text-3xl font-black text-blue-400">{Math.round(stats.averageConfidence || 0)}%</p>
                <p className="text-slate-400 text-sm mt-1">Avg. AI Confidence</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Download Reports */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              Download Reports
            </h3>
            <div className="space-y-3">
              {reportButtons.map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={`${btn.type}-${btn.format}`}
                    onClick={() => downloadReport(btn.type, btn.format)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-emerald-500/40 hover:bg-slate-800 text-white transition-all text-sm font-semibold text-left"
                  >
                    <Icon className={`w-5 h-5 text-${btn.color}-400 flex-shrink-0`} />
                    <span className="flex-1">{btn.label}</span>
                    <Download className="w-4 h-4 text-slate-500" />
                  </button>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Analytics Portal */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Advanced Analytics Portal
            </h3>
            <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-lime-500/5 border border-emerald-500/20 mb-4">
              <p className="text-slate-300 mb-4 text-sm leading-relaxed">
                Access the full Streamlit Advanced AI Analytics Dashboard for in-depth pathology curves, disease distribution charts, and prediction confidence histograms.
              </p>
              <a
                href="http://localhost:8501"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-bold text-sm hover:opacity-90 transition w-full justify-center"
              >
                <ExternalLink className="w-4 h-4" />
                Open Streamlit Analytics
              </a>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Realtime Scan History (CSV)', date: 'Auto-updated' },
                { name: 'Realtime Scan History (Excel)', date: 'Auto-updated' },
                { name: 'Upload Scan History (CSV)', date: 'Auto-updated' },
                { name: 'Upload Scan History (Excel)', date: 'Auto-updated' },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-800">
                  <span className="text-slate-300 text-sm">{r.name}</span>
                  <Badge variant="success" size="sm">{r.date}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminReports;
