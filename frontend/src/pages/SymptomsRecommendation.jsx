import React from 'react';
import SymptomBasedAgent from '../components/dashboard/SymptomBasedAgent';

const SymptomsRecommendation = () => {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Symptoms Based Recommendation</h2>
      <p className="text-slate-400 mb-8">Describe the symptoms you're seeing in your plants to get targeted advice and fertilizer recommendations.</p>
      <SymptomBasedAgent />
    </div>
  );
};

export default SymptomsRecommendation;
