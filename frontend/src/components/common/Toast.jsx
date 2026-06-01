import React from 'react';
import { motion } from 'framer-motion';

export const Toast = ({ message, type = 'success', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeStyles = {
    success: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
    error: 'bg-red-500/20 border-red-500/50 text-red-300',
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
    warning: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-20 right-6 px-6 py-3 rounded-lg border backdrop-blur-sm ${typeStyles[type]} shadow-lg z-50`}
    >
      {message}
    </motion.div>
  );
};

export default Toast;
