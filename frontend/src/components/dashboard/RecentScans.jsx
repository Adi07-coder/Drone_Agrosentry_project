import React from 'react';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { Clock, TrendingUp } from 'lucide-react';
import { itemVariants } from '../../animations/variants';

const RecentScans = ({ scans }) => {
  const getSeverityColor = (severity) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'danger',
      critical: 'danger',
      none: 'info',
    };
    return colors[severity] || 'default';
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Scans</h3>
        <div className="space-y-3">
          {scans.map((scan) => (
            <div key={scan.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition">
              <img src={scan.image} alt={scan.plantName} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{scan.plantName}</p>
                <p className="text-xs text-slate-400">{scan.disease}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-emerald-400">{scan.confidence}%</p>
                <Badge variant={getSeverityColor(scan.severity)} size="sm">
                  {scan.severity}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

export default RecentScans;
