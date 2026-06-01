import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Zap } from 'lucide-react';
import { itemVariants } from '../../animations/variants';
import ScanStatusBadge from './ScanStatusBadge';

const ScanHistoryDrawer = ({ isOpen, userName, scans, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm z-50 bg-slate-900 border-l border-slate-800 shadow-xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-lg z-10">
              <div>
                <h3 className="text-lg font-semibold text-white">Scan History</h3>
                <p className="text-sm text-slate-400">{userName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {scans && scans.length > 0 ? (
                scans.map((scan, idx) => (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white text-sm">{scan.diseaseName}</p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {scan.scanDateTime}
                        </p>
                      </div>
                      <ScanStatusBadge status={scan.status} size="xs" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="text-xs text-slate-500">Confidence</p>
                        <p className="text-sm font-semibold text-blue-400">{scan.confidence}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Method</p>
                        <p className="text-xs font-semibold text-emerald-400">{scan.scanMethod}</p>
                      </div>
                    </div>

                    {scan.imagePreview && (
                      <div className="rounded overflow-hidden mb-3 bg-slate-700/30 h-24">
                        <img
                          src={scan.imagePreview}
                          alt="Scan preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <button className="w-full px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold transition flex items-center justify-center gap-2">
                      <Zap className="w-3 h-3" />
                      View Details
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">No scans yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ScanHistoryDrawer;
