import React from 'react';
import { motion } from 'framer-motion';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 ${sizes[size]} w-full max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-2xl"
          >
            ×
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
};

export default Modal;
