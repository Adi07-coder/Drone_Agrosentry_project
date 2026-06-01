import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Upload, Database, Download, Calendar } from 'lucide-react';
import { itemVariants } from '../../animations/variants';

const ActivityTimeline = ({ activityLog }) => {
  const getActivityIcon = (iconType) => {
    const icons = {
      scan: Activity,
      upload: Upload,
      database: Database,
      download: Download,
      calendar: Calendar,
    };
    return icons[iconType] || Activity;
  };

  const getActivityColor = (iconType) => {
    const colors = {
      scan: 'emerald',
      upload: 'blue',
      database: 'purple',
      download: 'amber',
      calendar: 'lime',
    };
    return colors[iconType] || 'emerald';
  };

  const colorMap = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    lime: 'bg-lime-500/20 text-lime-400 border-lime-500/50',
  };

  return (
    <div className="space-y-6">
      {activityLog.map((log, index) => {
        const IconComponent = getActivityIcon(log.icon);
        const colorKey = getActivityColor(log.icon);
        const colorClass = colorMap[colorKey];

        return (
          <motion.div
            key={log.id}
            variants={itemVariants}
            className="flex gap-4 relative"
          >
            {/* Timeline line */}
            {index !== activityLog.length - 1 && (
              <div className="absolute left-5 top-10 w-0.5 h-12 bg-gradient-to-b from-slate-700 to-transparent" />
            )}

            {/* Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${colorClass}`}>
              <IconComponent className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <p className="font-semibold text-white">{log.user}</p>
              <p className="text-sm text-slate-400 mt-1">{log.action}</p>
              <p className="text-xs text-slate-500 mt-2">{log.timestamp}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ActivityTimeline;
