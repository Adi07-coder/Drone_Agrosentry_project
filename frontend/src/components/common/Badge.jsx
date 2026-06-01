import React from 'react';
import { motion } from 'framer-motion';

const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const variants = {
    default: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    success: 'bg-green-500/20 text-green-300 border border-green-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    danger: 'bg-red-500/20 text-red-300 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center rounded-full font-semibold ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </motion.span>
  );
};

export default Badge;
