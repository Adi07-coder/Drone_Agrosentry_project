import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const getAuthHeaders = () => {
  const live = axios.defaults.headers.common['Authorization'];
  if (live) return { Authorization: live };
  const stored = localStorage.getItem('authToken');
  return stored ? { Authorization: `Bearer ${stored}` } : {};
};

const HistoryScans = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const [uploadRes, realtimeRes, symptomRes] = await Promise.all([
        axios.get('/api/detect/upload/history', { headers: getAuthHeaders() }),
        axios.get('/api/detect/realtime/history', { headers: getAuthHeaders() }),
        axios.get('/api/detection/symptom/history', { headers: getAuthHeaders() })
      ]);

      let combined = [];
      if (uploadRes.data.success && uploadRes.data.history) {
        combined = [...combined, ...uploadRes.data.history.map(h => ({ ...h, source: 'Upload' }))];
      }
      if (realtimeRes.data.success && realtimeRes.data.history) {
        combined = [...combined, ...realtimeRes.data.history.map(h => ({ ...h, source: 'Live Camera' }))];
      }
      if (symptomRes.data.success && symptomRes.data.history) {
        combined = [...combined, ...symptomRes.data.history.map(h => ({ ...h, source: 'Symptom Diagnosis' }))];
      }

      // Sort by newest first
      combined.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
      setHistory(combined);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      toast.error('Failed to load history scans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDownload = async (type, format) => {
    const endpoint = `/api/detect/download/${type}/${format}`;
    try {
      const response = await fetch(endpoint, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_history.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${type} history as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Download failed or no data available.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">History Scans Record</h2>
          <p className="text-slate-400">View and download your past AI detections and analyses.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Live Camera</span>
            <div className="flex gap-2">
              <Button onClick={() => handleDownload('realtime', 'csv')} variant="secondary" className="px-3 py-1.5 text-xs">CSV</Button>
              <Button onClick={() => handleDownload('realtime', 'excel')} variant="primary" className="px-3 py-1.5 text-xs">Excel</Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Uploads</span>
            <div className="flex gap-2">
              <Button onClick={() => handleDownload('upload', 'csv')} variant="secondary" className="px-3 py-1.5 text-xs">CSV</Button>
              <Button onClick={() => handleDownload('upload', 'excel')} variant="primary" className="px-3 py-1.5 text-xs">Excel</Button>
            </div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden p-0 border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-sm">
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Source</th>
                <th className="px-6 py-4 font-semibold">Plant Name</th>
                <th className="px-6 py-4 font-semibold">Disease Detected</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    No scan history found.
                  </td>
                </tr>
              ) : (
                history.map((item, index) => {
                  const isHealthy = item.status === 'Healthy' || item.diseaseName === 'Healthy';
                  const date = item.timestamp || item.createdAt;
                  
                  return (
                    <tr key={item._id || index} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {new Date(date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                          {item.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        {item.plantName || item.plant || (item.source === 'Symptom Diagnosis' ? 'Multiple/Unknown' : 'Unknown')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={isHealthy ? 'text-emerald-400' : 'text-red-400'}>
                          {item.diseaseName || item.disease || 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={isHealthy ? 'success' : 'danger'}>
                          {isHealthy ? 'Healthy' : 'Diseased'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden w-16">
                            <div 
                              className={`h-full rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`}
                              style={{ width: `${item.confidence || 0}%` }}
                            />
                          </div>
                          <span className="text-sm text-slate-400">
                            {item.confidence ? Math.round(item.confidence) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default HistoryScans;
