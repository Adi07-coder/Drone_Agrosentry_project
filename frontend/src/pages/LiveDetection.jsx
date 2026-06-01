import React from 'react';
import LiveCameraAgent from '../components/dashboard/LiveCameraAgent';

const LiveDetection = () => {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Live Camera Detection</h2>
      <p className="text-slate-400 mb-8">Scan your plants in real-time using your device's camera.</p>
      <LiveCameraAgent />
    </div>
  );
};

export default LiveDetection;
