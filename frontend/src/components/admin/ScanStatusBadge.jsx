import React from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

const ScanStatusBadge = ({ status, size = 'sm' }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-lg shadow-emerald-500/20';
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-lg shadow-blue-500/20';
      case 'pending-review':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-lg shadow-amber-500/20';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-lg shadow-red-500/20';
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/50';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'processing':
        return <Clock className="w-3.5 h-3.5 animate-spin" />;
      case 'pending-review':
        return <AlertCircle className="w-3.5 h-3.5" />;
      case 'failed':
        return <XCircle className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const sizeClass = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full font-medium ${sizeClass} ${getStatusStyle()}`}>
      {getIcon()}
      <span className="capitalize">{status.replace('-', ' ')}</span>
    </span>
  );
};

export default ScanStatusBadge;
