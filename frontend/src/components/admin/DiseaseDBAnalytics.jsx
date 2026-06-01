import React from 'react';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import { Camera, Microscope, Zap, TrendingUp, Users } from 'lucide-react';
import { itemVariants } from '../../animations/variants';

const DiseaseDBAnalytics = ({ data }) => {
  const analytics = [
    {
      icon: Camera,
      label: 'Total Uploaded Images',
      value: data.totalUploadedImages.toLocaleString(),
      color: 'emerald',
      subtitle: 'Plant disease samples',
    },
    {
      icon: Microscope,
      label: 'Most Common Disease',
      value: data.mostCommonDisease,
      color: 'purple',
      subtitle: 'Current dataset trend',
    },
    {
      icon: Zap,
      label: 'Live Scans Today',
      value: data.liveScansTodayCount.toString(),
      color: 'amber',
      subtitle: 'Real-time detections',
    },
    {
      icon: TrendingUp,
      label: 'Detection Accuracy',
      value: `${data.detectionAccuracy}%`,
      color: 'lime',
      subtitle: 'Overall system accuracy',
    },
    {
      icon: Users,
      label: 'Active Users Now',
      value: data.activeUsersNow.toString(),
      color: 'blue',
      subtitle: 'Currently scanning',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      emerald: 'bg-emerald-500/20 text-emerald-400',
      purple: 'bg-purple-500/20 text-purple-400',
      amber: 'bg-amber-500/20 text-amber-400',
      lime: 'bg-lime-500/20 text-lime-400',
      blue: 'bg-blue-500/20 text-blue-400',
    };
    return colors[color];
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {analytics.map((item) => {
        const Icon = item.icon;
        return (
          <motion.div key={item.label} variants={itemVariants}>
            <Card className="p-4 h-full flex flex-col">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${getColorClasses(item.color)}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-slate-400 text-xs mb-2 uppercase tracking-wide">{item.label}</p>
              <p className="text-2xl font-bold mb-2">{item.value}</p>
              <p className="text-xs text-slate-500 mt-auto">{item.subtitle}</p>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DiseaseDBAnalytics;
