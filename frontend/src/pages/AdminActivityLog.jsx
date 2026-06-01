import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { containerVariants, itemVariants } from '../animations/variants';
import { mockActivityLog } from '../data/mockData';
import * as authService from '../utils/authService';
import { Activity, ScanLine, Upload, Database, Download, Calendar } from 'lucide-react';

const getIcon = (iconName) => {
  const icons = { scan: ScanLine, upload: Upload, database: Database, download: Download, calendar: Calendar };
  return icons[iconName] || Activity;
};

const AdminActivityLog = () => {
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        setLoading(true);
        const response = await authService.getActivityLog(1, 50);
        if (response.success && response.logs && response.logs.length > 0) {
          setActivityLog(response.logs.map(log => ({
            id: log._id,
            user: log.userId?.name || 'System',
            action: log.description || log.action,
            timestamp: new Date(log.createdAt).toLocaleString(),
            status: log.status,
            icon: log.action || 'scan'
          })));
        } else {
          setActivityLog(mockActivityLog);
        }
      } catch (err) {
        console.error('Failed to load activity log:', err);
        setActivityLog(mockActivityLog);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Activity Log</h2>
        <p className="text-slate-400">Monitor system activities and user actions</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3" />
              <span className="text-slate-400">Loading activity log...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {activityLog.map((log, index) => {
                const Icon = getIcon(log.icon);
                return (
                  <motion.div
                    key={log.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 hover:border-emerald-500/20 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{log.action}</p>
                      <p className="text-slate-400 text-sm">by {log.user}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-500 mb-1">{log.timestamp}</p>
                      {log.status && (
                        <Badge variant={log.status === 'success' ? 'success' : 'warning'} size="sm">
                          {log.status}
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {activityLog.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  No activity logged yet
                </div>
              )}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminActivityLog;
