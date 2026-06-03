import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Upload, Loader2, AlertCircle, CheckCircle2, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import { containerVariants, itemVariants } from '../../animations/variants';
import toast from 'react-hot-toast';
import axios from 'axios';

const getAuthHeaders = () => {
  const live = axios.defaults.headers.common['Authorization'];
  if (live) return { Authorization: live };
  const stored = localStorage.getItem('authToken');
  return stored ? { Authorization: `Bearer ${stored}` } : {};
};

const ImageUploadAgent = ({ onScanComplete }) => {
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/detection/upload/history', {
        headers: getAuthHeaders()
      });
      if (response.data.success && response.data.history) {
        setHistoryData(response.data.history);
      }
    } catch (err) {
      console.error('Failed to fetch upload history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const validateFile = (file) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimes.includes(file.type)) {
      setError('Only JPG and PNG images are allowed');
      return false;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call prediction upload endpoint
      const response = await axios.post(
        '/api/detection/predict',
        (() => {
          const fd = new FormData();
          fd.append('image', selectedFile);
          return fd;
        })(),
        {
          headers: {
            ...getAuthHeaders()
          }
        }
      );

      if (response.data.success && response.data.subPrediction) {
        const pred = response.data.subPrediction;
        setResult(pred);
        toast.success('Analysis complete!');
        onScanComplete?.();
        fetchHistory();
      } else {
        setError('Analysis failed');
        toast.error('Analysis failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to analyze image';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
    setResult(null);
    setError(null);
  };

  const downloadSheet = async (format) => {
    const endpoint = format === 'csv'
      ? '/api/detection/download/upload/csv'
      : '/api/detection/download/upload/excel';
    try {
      const response = await fetch(endpoint, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        toast.error('No scan data yet. Complete a scan first!');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `upload_history.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded upload history as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Download failed');
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card className="p-8">
        <h3 className="text-2xl font-bold text-white mb-2">Image Upload Detection</h3>
        <p className="text-slate-400 mb-6">Upload a photo of your plant for instant disease analysis</p>

        {error && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}

        {!preview ? (
          <motion.label
            variants={itemVariants}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="block border-2 border-dashed border-emerald-500/50 rounded-xl p-8 cursor-pointer hover:border-emerald-500 transition text-center bg-slate-900/40 backdrop-blur-xl"
          >
            <Upload className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-bounce" />
            <p className="text-white font-semibold">Drag and drop your image here</p>
            <p className="text-slate-400 text-sm">or click to browse (JPG, PNG up to 5MB)</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileChange}
              className="hidden"
              disabled={loading}
            />
          </motion.label>
        ) : (
          <motion.div variants={itemVariants}>
            <img src={preview} alt="Preview" className="w-full h-80 object-cover rounded-xl mb-4 border border-slate-800 shadow-2xl" />
            <div className="flex gap-3">
              <Button onClick={handleAnalyze} disabled={loading} className="flex-1 py-3 text-base">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Plant'
                )}
              </Button>
              <Button variant="ghost" onClick={handleClear} disabled={loading} className="flex-1 py-3 text-base border-slate-700">
                Clear
              </Button>
            </div>
          </motion.div>
        )}

        {/* Results Panel */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-gradient-to-r from-emerald-500/20 to-lime-500/10 rounded-xl border border-emerald-500/30 shadow-2xl"
          >
            <div className="flex items-start gap-3 mb-4 border-b border-emerald-500/20 pb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <h4 className="text-lg font-bold text-white">Diagnostic Results Summary</h4>
            </div>

            {/* Non-Plant Rejection Display */}
            {result.plantName === 'None' || result.plantName === 'Unknown' ? (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 font-semibold mb-2">
                No Plant Detected
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-xs">PLANT SPECIES</p>
                  <p className="text-lg font-bold text-emerald-400">{result.plantName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">DIAGNOSTIC STATUS</p>
                  <Badge variant={result.status === 'Healthy' ? 'success' : 'danger'} size="md">
                    {result.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 text-xs">DISEASE CLASSIFICATION</p>
                  <p className="text-lg font-bold text-white">{result.diseaseName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">AI CONFIDENCE</p>
                  <p className="text-2xl font-black text-emerald-400">{result.confidence}%</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">SCANNED AT</p>
                  <p className="text-sm text-slate-300 font-semibold mt-1">
                    {new Date(result.timestamp).toLocaleString()}
                  </p>
                </div>

                {/* Detailed Recommendations */}
                {result.treatment && (
                  <div className="col-span-2 mt-4 pt-4 border-t border-emerald-500/20">
                    <p className="text-slate-400 text-xs mb-1">TREATMENT RECOMMENDATION</p>
                    <p className="text-sm text-white">{result.treatment}</p>
                  </div>
                )}
                
                {result.fertilizer && (
                  <div className="col-span-2 mt-2">
                    <p className="text-slate-400 text-xs mb-1">FERTILIZER SUGGESTION</p>
                    <p className="text-sm text-white">{result.fertilizer}</p>
                  </div>
                )}

                {result.prevention && (
                  <div className="col-span-2 mt-2">
                    <p className="text-slate-400 text-xs mb-1">PREVENTION TIPS</p>
                    <p className="text-sm text-white">{result.prevention}</p>
                  </div>
                )}
              </div>
            )}

            <Button onClick={handleClear} variant="secondary" className="w-full mt-6 py-2.5">
              Analyze Another Image
            </Button>
          </motion.div>
        )}

        {/* Export & Download Options */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <button
            onClick={() => downloadSheet('csv')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition"
          >
            Export CSV
          </button>
          <button
            onClick={() => downloadSheet('excel')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition"
          >
            Export Excel
          </button>
          <button
            onClick={() => {
              if (historyData.length > 0 && historyData[0].imagePath) {
                window.open(`/uploads/${historyData[0].imagePath.split(/[\\/]/).pop()}`, '_blank');
              } else {
                toast.error('No scan images available to download');
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition"
          >
            Download Image
          </button>
        </div>

        {/* Upload History Table */}
        <div className="mt-8 border-t border-slate-800 pt-6">
          <h4 className="text-lg font-bold text-white mb-4">Upload Detection History</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Plant</th>
                  <th className="py-3 px-4">Disease Name</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {historyData.slice(0, 5).map((row, idx) => {
                  const fileName = row.imagePath ? row.imagePath.split('/').pop().split('\\').pop() : 'N/A';
                  return (
                    <tr key={row._id || idx} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/40">
                      <td className="py-3 px-4">{new Date(row.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4 max-w-[120px] truncate">{fileName}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-400">{row.plantName}</td>
                      <td className="py-3 px-4">{row.diseaseName}</td>
                      <td className="py-3 px-4 font-bold text-emerald-500">{row.confidence}%</td>
                      <td className="py-3 px-4">
                        <Badge variant={row.status === 'Healthy' ? 'success' : 'danger'} size="sm">
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {historyData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-500">
                      No recent upload scans logged yet. Start uploading above!
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

export default ImageUploadAgent;
