import React from 'react';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import { itemVariants } from '../../animations/variants';

const StatCard = ({ icon: Icon, label, value, subtext, trend, color = 'emerald' }) => {
  const colorStyles = {
    emerald: 'from-emerald-500/20 to-lime-500/10 border-emerald-500/30',
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
    purple: 'from-purple-500/20 to-pink-500/10 border-purple-500/30',
    amber: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
  };

  const trendColor = trend?.includes('+') ? 'text-emerald-400' : 'text-red-400';

  return (
    <motion.div variants={itemVariants}>
      <Card className={`bg-gradient-to-br ${colorStyles[color]} p-6`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-slate-400 text-sm mb-2">{label}</p>
            <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
            {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
            {trend && <p className={`text-sm font-semibold mt-2 ${trendColor}`}>{trend}</p>}
          </div>
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-${color}-500 to-${color}-600 flex items-center justify-center text-white`}>
            <Icon size={24} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default StatCard;
