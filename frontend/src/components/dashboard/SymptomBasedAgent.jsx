import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Send, Loader2 } from 'lucide-react';
import { containerVariants, itemVariants } from '../../animations/variants';
import * as authService from '../../utils/authService';

const getAuthHeaders = () => {
  const live = axios.defaults.headers.common['Authorization'];
  if (live) return { Authorization: live };
  const stored = localStorage.getItem('authToken');
  return stored ? { Authorization: `Bearer ${stored}` } : {};
};

const SymptomBasedAgent = ({ onScanComplete }) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/detection/symptom/history', {
        headers: getAuthHeaders()
      });
      if (response.data && response.data.success && Array.isArray(response.data.history)) {
        setHistoryData(response.data.history);
      } else {
        setHistoryData([]);
      }
    } catch (err) {
      console.error('Failed to fetch symptom history:', err);
      setHistoryData([]); // Fallback to empty array on failure
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const symptoms = [
    'Yellow Leaves',
    'Brown Spots',
    'Curling Leaves',
    'Wilting',
    'Powdery Coating',
    'Leaf Holes',
    'Stunted Growth',
    'Black Spots',
    'Drooping',
    'White Spots',
    'Yellow Halos',
    'Browning Edges',
    'Webbing',
    'Foul Odor',
  ];

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await authService.diagnoseSymptoms(selectedSymptoms, additionalNotes);
      if (response.success && response.diagnoses) {
        setResult(response.diagnoses);
        onScanComplete?.();
        fetchHistory();
      }
    } catch (err) {
      console.error("Diagnosis error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card className="p-8">
        <h3 className="text-2xl font-bold text-white mb-2">Symptom-Based Detection</h3>
        <p className="text-slate-400 mb-6">Describe your plant symptoms for AI analysis</p>

        <motion.div variants={itemVariants} className="mb-6">
          <label className="block text-sm font-semibold text-white mb-3">Select Symptoms</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {symptoms.map((symptom) => (
              <button
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedSymptoms.includes(symptom)
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-emerald-500/50'
                }`}
              >
                {symptom}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-6">
          <label className="block text-sm font-semibold text-white mb-2">Additional Notes</label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Describe any other observations..."
            className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            rows={4}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button onClick={handleAnalyze} disabled={loading || selectedSymptoms.length === 0} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Get Diagnosis
              </>
            )}
          </Button>
        </motion.div>

        {result && result.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
          >
            {/* Primary Diagnosis Card */}
            <div className="p-6 bg-gradient-to-r from-emerald-500/20 to-lime-500/10 rounded-xl border border-emerald-500/30">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
                    #1 Most Likely
                    {result[0].severity && (
                       <Badge variant={result[0].severity === 'High' ? 'danger' : result[0].severity === 'Medium' ? 'warning' : 'primary'}>
                         {result[0].severity} Severity
                       </Badge>
                    )}
                  </h4>
                  <p className="font-bold text-emerald-400 text-3xl">{result[0].diseaseName}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <Badge variant={result[0].confidence > 75 ? "success" : "warning"}>
                    {result[0].confidence}% Match
                  </Badge>
                  <div className="w-24 h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${result[0].confidence}%` }} />
                  </div>
                </div>
              </div>
              <p className="text-slate-300 text-lg mb-4">{result[0].recommendation}</p>
              
              {result[0].symptomsMatched?.length > 0 && (
                <div>
                  <p className="text-slate-400 text-sm mb-2">Matched Symptoms:</p>
                  <div className="flex flex-wrap gap-2">
                    {result[0].symptomsMatched.map((sym) => (
                      <span key={sym} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-300 text-xs font-medium">
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Plan Grid for #1 */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700 hover:border-blue-500/50 transition">
                <h5 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Treatment Plan
                </h5>
                <p className="text-slate-300 text-sm leading-relaxed">{result[0].treatment || "No specific treatment advised."}</p>
              </div>
              
              <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700 hover:border-amber-500/50 transition">
                <h5 className="text-amber-400 font-bold mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Fertilizer Guide
                </h5>
                <p className="text-slate-300 text-sm leading-relaxed">{result[0].fertilizer || "Maintain standard feeding schedule."}</p>
              </div>

              <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700 hover:border-purple-500/50 transition">
                <h5 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  Prevention Steps
                </h5>
                <p className="text-slate-300 text-sm leading-relaxed">{result[0].prevention || "Monitor plants daily for changes."}</p>
              </div>
            </div>

            {/* Alternative Diagnoses */}
            {result.length > 1 && (
              <div className="mt-8 pt-6 border-t border-slate-800">
                <h4 className="text-slate-300 font-semibold mb-4 text-sm uppercase tracking-wider">Alternative Possibilities</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {result.slice(1).map((alt, index) => (
                    <div key={index} className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 flex flex-col justify-between hover:border-slate-600 transition">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="text-white font-bold">#{index + 2} {alt.diseaseName}</h5>
                          <Badge variant="secondary" className="text-xs">
                            {alt.confidence}%
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm mb-3 line-clamp-2">{alt.recommendation}</p>
                      </div>
                      <div>
                        <p className="text-emerald-400 text-xs font-semibold">Treatment:</p>
                        <p className="text-slate-300 text-xs line-clamp-2">{alt.treatment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Symptom History Table */}
        <div className="mt-8 border-t border-slate-800 pt-6">
          <h4 className="text-lg font-bold text-white mb-4">Diagnosis History</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Symptoms</th>
                  <th className="py-3 px-4">Disease Name</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Severity</th>
                </tr>
              </thead>
              <tbody>
                {historyData && Array.isArray(historyData) && historyData.slice(0, 5).map((row, idx) => {
                  return (
                    <tr key={row._id || idx} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/40">
                      <td className="py-3 px-4">{row.createdAt ? new Date(row.createdAt).toLocaleString() : 'Unknown'}</td>
                      <td className="py-3 px-4 max-w-[200px] truncate">
                        {Array.isArray(row.symptoms) ? row.symptoms.join(', ') : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">{row.diseaseName || 'Unknown'}</td>
                      <td className="py-3 px-4 font-bold text-emerald-500">{row.confidence || 0}%</td>
                      <td className="py-3 px-4">
                        <Badge variant={row.severity === 'High' ? 'danger' : row.severity === 'Medium' ? 'warning' : 'primary'} size="sm">
                          {row.severity || 'Unknown'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {(!historyData || !Array.isArray(historyData) || historyData.length === 0) && (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-500">
                      No diagnosis history yet. Describe symptoms above to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default SymptomBasedAgent;
