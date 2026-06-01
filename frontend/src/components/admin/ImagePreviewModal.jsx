import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Eye } from 'lucide-react';
import Button from '../common/Button';

const ImagePreviewModal = ({ isOpen, image, onClose }) => {
  if (!isOpen || !image) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative max-w-2xl w-full mx-4 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/30">
            <h3 className="text-lg font-semibold text-white">Disease Detection Preview</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6 rounded-lg overflow-hidden bg-slate-800/50 border border-slate-700">
              <img
                src={image}
                alt="Plant disease preview"
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Info */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase text-slate-500 mb-1">Disease Detected</p>
                  <p className="text-lg font-semibold text-emerald-400">Early Blight</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500 mb-1">Confidence Score</p>
                  <p className="text-lg font-semibold text-blue-400">92%</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500 mb-1">Severity Level</p>
                  <p className="text-lg font-semibold text-amber-400">Medium</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500 mb-1">Detection Method</p>
                  <p className="text-lg font-semibold text-purple-400">Image Upload</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <Button variant="secondary" className="flex-1 flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                View Report
              </Button>
              <Button variant="outline" className="flex-1 flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ImagePreviewModal;
