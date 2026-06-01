import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = ({ className = '', count = 1 }) => {
  return (
    <div className={className}>
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="bg-slate-800 rounded-lg h-20 mb-4"
          />
        ))}
    </div>
  );
};

export default SkeletonLoader;
