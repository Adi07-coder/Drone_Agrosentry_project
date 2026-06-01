import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { Loader2, Users, ShieldAlert, MonitorSmartphone, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const getAuthHeaders = () => {
  const live = axios.defaults.headers.common['Authorization'];
  if (live) return { Authorization: live };
  const stored = localStorage.getItem('authToken');
  return stored ? { Authorization: `Bearer ${stored}` } : {};
};

const LoginLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/activity-log?action=login', { headers: getAuthHeaders() });
        if (response.data.success && response.data.logs) {
          setLogs(response.data.logs);
        }
      } catch (err) {
        console.error('Failed to fetch login logs:', err);
        toast.error('Failed to load login logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Calculate Real-Time Analytics
  const totalLogins = logs.length;
  const adminLogins = logs.filter(log => log.userId?.role === 'admin').length;
  const uniqueIPs = new Set(logs.map(log => log.ipAddress).filter(Boolean)).size;
  const recentLogins24h = logs.filter(log => (new Date() - new Date(log.createdAt)) < 24 * 60 * 60 * 1000).length;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Login Logs & Analytics</h2>
        <p className="text-slate-400">Real-time authentication tracking and analytical metrics.</p>
      </div>

      {/* Real-time Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg">
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400">Total Logins</p>
            <p className="text-2xl font-bold text-white">{totalLogins}</p>
          </div>
        </Card>
        
        <Card className="p-4 border border-blue-500/20 bg-blue-500/5 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400">Admin Logins</p>
            <p className="text-2xl font-bold text-white">{adminLogins}</p>
          </div>
        </Card>

        <Card className="p-4 border border-purple-500/20 bg-purple-500/5 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-lg">
            <MonitorSmartphone className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400">Unique Devices (IPs)</p>
            <p className="text-2xl font-bold text-white">{uniqueIPs}</p>
          </div>
        </Card>

        <Card className="p-4 border border-rose-500/20 bg-rose-500/5 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-lg">
            <Activity className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400">Last 24 Hours</p>
            <p className="text-2xl font-bold text-white">{recentLogins24h}</p>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0 border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-sm">
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Login Time</th>
                <th className="px-6 py-4 font-semibold">IP Address</th>
                <th className="px-6 py-4 font-semibold">Device / Browser Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    No login logs found in the database.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">
                      {log.userId?.name || log.userId?.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={log.userId?.role === 'admin' ? 'primary' : 'secondary'} size="sm">
                        {(log.userId?.role || 'user').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-emerald-400 font-mono">
                      {log.ipAddress || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate" title={log.userAgent}>
                      {log.userAgent || 'Unknown'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default LoginLogs;
