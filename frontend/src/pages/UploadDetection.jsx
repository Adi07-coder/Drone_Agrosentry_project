import React from 'react';
import ImageUploadAgent from '../components/dashboard/ImageUploadAgent';

const UploadDetection = () => {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Upload Image Detection</h2>
      <p className="text-slate-400 mb-8">Upload a picture of a diseased plant to receive a detailed AI diagnostic report.</p>
      <ImageUploadAgent />
    </div>
  );
};

export default UploadDetection;
