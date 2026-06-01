import React from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar, Sidebar } from '../components/common';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { mockDiseases } from '../data/mockData';
import {
  ArrowLeft,
  Share2,
  Download,
  AlertCircle,
  CheckCircle2,
  Droplet,
  Shield,
  BookOpen,
} from 'lucide-react';
import { containerVariants, itemVariants } from '../animations/variants';

const DiseaseDetails = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const disease = mockDiseases[0]; // Using first disease for demo
  const [activeTab, setActiveTab] = React.useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'treatment', label: 'Treatment', icon: Droplet },
    { id: 'prevention', label: 'Prevention', icon: Shield },
  ];

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'danger',
      critical: 'danger',
    };
    return colors[severity] || 'default';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar user={user} onLogout={onLogout} userRole="user" />

      <div className="flex pt-16">
        <Sidebar userRole="user" onLogout={onLogout} />

        <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto"
          >
            {/* Back Button */}
            <motion.button
              variants={itemVariants}
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 mb-8 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </motion.button>

            {/* Header Card */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden mb-8">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={disease.image}
                    alt={disease.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                </div>
                <div className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Badge variant={getSeverityColor(disease.severity)} size="lg" className="mb-4">
                        {disease.severity.toUpperCase()}
                      </Badge>
                      <h1 className="text-4xl font-bold">{disease.name}</h1>
                      <p className="text-slate-400 mt-2">Affects: {disease.plantType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Detection Confidence</p>
                      <p className="text-3xl font-bold text-emerald-400">{disease.confidence}%</p>
                    </div>
                  </div>
                  <p className="text-slate-300 text-lg">{disease.description}</p>
                  <div className="flex gap-3 mt-6">
                    <Button variant="secondary" size="sm">
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    <Button variant="secondary" size="sm">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={itemVariants} className="flex gap-4 mb-8 border-b border-slate-800">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 font-semibold flex items-center gap-2 border-b-2 transition ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </motion.div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                {/* Causes */}
                <motion.div variants={itemVariants}>
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-amber-400" />
                      Causes
                    </h2>
                    <ul className="space-y-2">
                      {disease.causes.map((cause, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-300">
                          <span className="text-emerald-400 font-bold mt-1">•</span>
                          {cause}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>

                {/* Symptoms */}
                <motion.div variants={itemVariants}>
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-amber-400" />
                      Symptoms
                    </h2>
                    <ul className="space-y-2">
                      {disease.symptoms.map((symptom, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-300">
                          <span className="text-emerald-400 font-bold mt-1">•</span>
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'treatment' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                {/* Remedies */}
                <motion.div variants={itemVariants}>
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      Remedies
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {disease.remedies.map((remedy, i) => (
                        <div key={i} className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                          <p className="text-slate-300">{remedy}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>

                {/* Pesticides */}
                <motion.div variants={itemVariants}>
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <Droplet className="w-6 h-6 text-emerald-400" />
                      Recommended Pesticides
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                      {disease.pesticides.map((pesticide, i) => (
                        <div key={i} className="p-4 rounded-lg bg-slate-800 border border-slate-700">
                          <p className="font-semibold text-white">{pesticide}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'prevention' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <Shield className="w-6 h-6 text-lime-400" />
                      Prevention Tips
                    </h2>
                    <ul className="space-y-3">
                      {disease.prevention.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                          <span className="text-lime-400 font-bold mt-1">✓</span>
                          <span className="text-slate-300">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DiseaseDetails;
