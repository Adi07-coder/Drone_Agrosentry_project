import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { containerVariants, itemVariants } from '../animations/variants';
import DiseaseDBTable from '../components/admin/DiseaseDBTable';
import DiseaseDBAnalytics from '../components/admin/DiseaseDBAnalytics';
import axios from 'axios';

const AdminDiseaseDB = () => {
  const [scanRecords, setScanRecords] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetections = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const authHeader = axios.defaults.headers.common['Authorization'] || 
          (localStorage.getItem('authToken') ? `Bearer ${localStorage.getItem('authToken')}` : '');
        const response = await axios.get('/api/detect/', {
          params: { page: 1, limit: 100 },
          headers: authHeader ? { Authorization: authHeader } : {}
        });

        if (response.data.success && response.data.detections && response.data.detections.length > 0) {
          const mapped = response.data.detections.map(d => ({
            id: d._id,
            userId: d.userId,
            userName: d.userId || 'Unknown User',
            imagePreview: d.image
              ? `/uploads/${d.image.split(/[\\/]/).pop()}`
              : `https://via.placeholder.com/400x300?text=${encodeURIComponent(d.plant || 'Plant')}`,
            diseaseName: d.disease || 'Unknown',
            confidence: d.confidence || 0,
            severity: d.status === 'Healthy' ? 'none' : d.confidence > 90 ? 'critical' : d.confidence > 75 ? 'high' : 'medium',
            scanMethod: 'Image Upload',
            scanDateTime: new Date(d.createdAt).toLocaleString(),
            status: 'completed'
          }));
          setScanRecords(mapped);

          // Compute analytics from real data
          const total = mapped.length;
          const healthyCount = mapped.filter(r => r.diseaseName?.toLowerCase().includes('healthy')).length;
          const avgConf = total > 0 ? (mapped.reduce((s, r) => s + r.confidence, 0) / total).toFixed(1) : 0;
          const diseaseCounts = {};
          mapped.forEach(r => { diseaseCounts[r.diseaseName] = (diseaseCounts[r.diseaseName] || 0) + 1; });
          const mostCommon = Object.entries(diseaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

          setAnalytics({
            totalUploadedImages: total,
            mostCommonDisease: mostCommon,
            liveScansTodayCount: mapped.filter(r => {
              const today = new Date().toDateString();
              return new Date(r.scanDateTime).toDateString() === today;
            }).length,
            detectionAccuracy: parseFloat(avgConf),
            activeUsersNow: new Set(mapped.map(r => r.userId)).size,
          });
        } else {
          setScanRecords([]);
        }
      } catch (err) {
        console.error('Failed to load detections:', err);
        setScanRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDetections();
  }, []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Disease Detection Database</h2>
        <p className="text-slate-400">Manage and analyze all platform disease scan records</p>
      </motion.div>

      {analytics && <DiseaseDBAnalytics data={analytics} />}

      <motion.div variants={itemVariants} className="mb-6 mt-8">
        <h3 className="text-xl font-semibold">
          Scan Records {loading && <span className="text-sm text-slate-500 ml-2 animate-pulse">Loading...</span>}
        </h3>
      </motion.div>

      <DiseaseDBTable scanRecords={scanRecords} />
    </motion.div>
  );
};

export default AdminDiseaseDB;
