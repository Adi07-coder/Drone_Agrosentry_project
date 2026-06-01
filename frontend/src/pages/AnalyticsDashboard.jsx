import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StatCard, Chart } from '../components/dashboard';
import Card from '../components/common/Card';
import { TrendingUp, Activity, Zap, CheckCircle, AlertCircle, Leaf } from 'lucide-react';
import { containerVariants, itemVariants } from '../animations/variants';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const getAuthHeaders = () => {
  const live = axios.defaults.headers.common['Authorization'];
  if (live) return { Authorization: live };
  const stored = localStorage.getItem('authToken');
  return stored ? { Authorization: `Bearer ${stored}` } : {};
};

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('/api/detect/stats/system', {
          headers: getAuthHeaders()
        });
        
        if (response.data.success) {
          setStats(response.data.stats);
        } else {
          throw new Error('Failed to fetch stats');
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Unable to load analytics data. Please try again later.');
        toast.error('Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 text-lg">Loading your analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-slate-900/50 rounded-xl border border-red-500/20 p-8 text-center mt-8">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Data Unavailable</h3>
        <p className="text-slate-400 text-lg">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Handle empty state gracefully
  const hasData = stats.totalDetections > 0;
  
  // Format success rate
  const successRate = ((stats.healthyCount / Math.max(1, stats.totalDetections)) * 100).toFixed(1);

  // Recharts requires array of objects
  const formatChartData = (chartData) => {
    if (!chartData || !chartData.labels) return [];
    return chartData.labels.map((label, index) => ({
      day: label,
      month: label,
      scans: chartData.scans[index] || 0,
      accuracy: chartData.accuracy[index] || 0
    }));
  };

  const formattedChartData = formatChartData(stats.chartData);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="animate-fade-in">
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Overview</h1>
        <p className="text-slate-400">Real-time statistics and insights from your AI models</p>
      </motion.div>

      {!hasData ? (
        <motion.div variants={itemVariants} className="bg-slate-900/50 rounded-xl border border-slate-800 p-12 text-center mt-8">
          <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">No Detections Yet</h3>
          <p className="text-slate-400">Run a scan using the Live Camera or Upload tools to see your analytics here.</p>
        </motion.div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Activity}
              label="Total Scans"
              value={stats.totalDetections.toLocaleString()}
              trend="All time"
              color="blue"
            />
            <StatCard
              icon={CheckCircle}
              label="Healthy Plants"
              value={stats.healthyCount.toLocaleString()}
              trend={`${successRate}% Success Rate`}
              color="emerald"
            />
            <StatCard
              icon={AlertCircle}
              label="Diseased Plants"
              value={stats.diseasedCount.toLocaleString()}
              trend="Needs attention"
              color="red"
            />
            <StatCard
              icon={Zap}
              label="AI Confidence"
              value={`${Math.round(stats.averageConfidence)}%`}
              trend="Average accuracy"
              color="purple"
            />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <Chart
              type="bar"
              data={formattedChartData}
              title="7-Day Detection Volume"
            />
            <Chart
              type="line"
              data={formattedChartData}
              title="AI Confidence Trend"
            />
          </div>
          
          {/* Recent Detections Mini-List */}
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Recent Scans</h2>
              <div className="space-y-4">
                {stats.recentDetections && stats.recentDetections.map((detection) => (
                  <div key={detection._id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${detection.status === 'Healthy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        <Leaf className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{detection.plant}</h4>
                        <p className="text-sm text-slate-400">{detection.disease}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-300">{Math.round(detection.confidence)}% Conf.</p>
                      <p className="text-xs text-slate-500">{new Date(detection.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default AnalyticsDashboard;
