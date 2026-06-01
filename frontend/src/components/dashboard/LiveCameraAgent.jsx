import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Video, Play, Square, Loader2, Camera, Circle, Aperture, Activity, Target, Zap, Beaker } from 'lucide-react';
import { containerVariants, itemVariants } from '../../animations/variants';
import toast from 'react-hot-toast';
import axios from 'axios';

const getAuthHeaders = () => {
  const live = axios.defaults.headers.common['Authorization'];
  if (live) return { Authorization: live };
  const stored = localStorage.getItem('authToken');
  return stored ? { Authorization: `Bearer ${stored}` } : {};
};

const LiveCameraAgent = ({ onScanComplete }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [detectionResult, setDetectionResult] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const isPollingRef = useRef(false);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/detect/realtime/history', {
        headers: getAuthHeaders()
      });
      if (response.data.success && response.data.history) {
        setHistoryData(response.data.history);
      }
    } catch (err) {
      console.error('Failed to fetch realtime history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
    return () => {
      handleStopCamera();
    };
  }, []);

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user"
        } 
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      setDetectionResult(null);
      clearOverlay();
      toast.success('Camera started');
    } catch (err) {
      toast.error('Failed to access webcam. Please ensure permissions are granted.');
      console.error(err);
    }
  };

  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
        if (overlayCanvasRef.current) {
          overlayCanvasRef.current.width = videoRef.current.videoWidth;
          overlayCanvasRef.current.height = videoRef.current.videoHeight;
        }
      };
    }
  }, [isCameraActive, cameraStream]);

  const handleStopCamera = () => {
    if (cameraStream) {
      const tracks = cameraStream.getTracks();
      tracks.forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (isRecording) {
      handleStopRecording();
    }
    setIsCameraActive(false);
    isPollingRef.current = false;
    clearOverlay();
  };

  const clearOverlay = () => {
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
  };

  const drawOverlay = (result) => {
    if (!overlayCanvasRef.current) return;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (result.plantName === 'None') return;

    let x, y, boxW, boxH;

    // Use YOLO bbox coordinates if available
    if (result.bbox && result.bbox.length === 4) {
      [x, y, boxW, boxH] = result.bbox;
    } else {
      // Fallback centered bounding box
      const width = canvas.width;
      const height = canvas.height;
      boxW = width * 0.5;
      boxH = height * 0.5;
      x = (width - boxW) / 2;
      y = (height - boxH) / 2;
    }

    const isHealthy = result.status === 'Healthy';
    const color = isHealthy ? '#10b981' : '#ef4444'; // Emerald for healthy, Red for diseased

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(x, y, boxW, boxH);

    // Draw solid label background
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 30, boxW, 30);
    
    // Draw text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Inter, sans-serif';
    const text = result.plantName === 'Unknown' ? 'Unknown Object' : `${result.plantName} - ${result.diseaseName}`;
    ctx.fillText(text, x + 5, y - 10);
  };

  const getFrameBlob = () => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !canvasRef.current) return reject('Refs not available');
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return reject('Video not loaded yet');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 1.0);
    });
  };

  const handleCaptureLive = async () => {
    if (!isCameraActive) return toast.error('Start the camera first');
    try {
      const blob = await getFrameBlob();
      const fd = new FormData();
      fd.append('image', blob, `capture_${Date.now()}.jpg`);
      
      const response = await axios.post('/api/detect/realtime', fd, {
        headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() }
      });
      toast.success('Live frame captured & saved to local_storage!');
      fetchHistory();
    } catch (err) {
      toast.error('Failed to capture frame');
    }
  };

  const handleDetection = async () => {
    if (!isCameraActive || !videoRef.current || videoRef.current.videoWidth === 0) return;
    setIsAnalyzing(true);
    try {
      const blob = await getFrameBlob();
      const fd = new FormData();
      fd.append('image', blob, `detect_${Date.now()}.jpg`);
      
      const response = await axios.post('/api/detect/realtime', fd, {
        headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() }
      });
      
      if (response.data.success && response.data.subPrediction) {
        setDetectionResult(response.data.subPrediction);
        drawOverlay(response.data.subPrediction);
        fetchHistory();
        if (onScanComplete) onScanComplete();
      }
    } catch (err) {
      console.error('Analysis failed', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pollDetection = async () => {
    if (!isPollingRef.current) return;
    await handleDetection();
    if (isPollingRef.current) {
      setTimeout(pollDetection, 4500); // Wait exactly 4.5 seconds AFTER previous request completes to reduce jitter
    }
  };

  useEffect(() => {
    if (isCameraActive) {
      isPollingRef.current = true;
      pollDetection();
    } else {
      isPollingRef.current = false;
    }
    return () => {
      isPollingRef.current = false;
    };
  }, [isCameraActive]);

  const handleStartRecording = () => {
    if (!isCameraActive || !cameraStream) return toast.error('Start the camera first');
    recordedChunksRef.current = [];
    try {
      const mediaRecorder = new MediaRecorder(cameraStream, { mimeType: 'video/webm' });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const fd = new FormData();
        fd.append('video', blob, `video_${Date.now()}.webm`);
        try {
          await axios.post('/api/detect/realtime/video', fd, {
            headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() }
          });
          toast.success('Video recorded and saved to local_storage!');
        } catch (err) {
          toast.error('Failed to save video');
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (err) {
      toast.error('Media recording not supported on this browser');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const downloadSheet = async (format) => {
    const endpoint = format === 'csv'
      ? '/api/detect/download/realtime/csv'
      : '/api/detect/download/realtime/excel';
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
      link.download = `realtime_history.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded live history as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Download failed');
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Live Camera Engine</h2>
          <p className="text-slate-400 mt-1">Real-time disease scanning using your device camera.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Camera Feed & Controls */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 overflow-hidden relative border-slate-800 shadow-2xl">
            <motion.div
              variants={itemVariants}
              className="relative bg-slate-900 rounded-xl overflow-hidden w-full aspect-video flex items-center justify-center border border-slate-800 shadow-inner group"
            >
              <canvas ref={canvasRef} className="hidden" />
              
              {isCameraActive ? (
                <div className="relative w-full h-full bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={overlayCanvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  />
                  {/* Status Overlay */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <div className="bg-emerald-500/20 text-emerald-400 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-500/30 flex items-center shadow-lg">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></div>
                      Camera Active
                    </div>
                    {isRecording && (
                      <div className="bg-red-500/20 text-red-400 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold border border-red-500/30 flex items-center shadow-lg animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-red-400 animate-ping mr-2"></div>
                        Recording
                      </div>
                    )}
                  </div>

                  {/* Polling Indicator */}
                  <AnimatePresence>
                    {isAnalyzing && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold border border-slate-700/50 flex items-center gap-2 shadow-2xl"
                      >
                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                        <span className="text-slate-200">Analyzing Frame...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-xl group-hover:scale-105 transition-transform duration-300">
                    <Video className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-300 mb-2">Camera Inactive</h3>
                  <p className="text-slate-500 max-w-sm mx-auto text-sm">
                    Click Start Camera to initialize the live video stream and begin continuous real-time disease detection.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Controls */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <Button
                onClick={isCameraActive ? handleStopCamera : handleStartCamera}
                variant={isCameraActive ? 'danger' : 'primary'}
                className="w-full py-3 shadow-lg"
              >
                {isCameraActive ? (
                  <><Square className="w-4 h-4 mr-2" /> Stop Camera</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" /> Start Camera</>
                )}
              </Button>

              <Button
                onClick={handleCaptureLive}
                disabled={!isCameraActive}
                variant="secondary"
                className="w-full py-3 shadow-lg"
              >
                <Camera className="w-4 h-4 mr-2" /> Capture Frame
              </Button>

              <Button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={!isCameraActive}
                variant={isRecording ? 'danger' : 'secondary'}
                className={`w-full py-3 shadow-lg ${isRecording ? '' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30'}`}
              >
                {isRecording ? (
                  <><Square className="w-4 h-4 mr-2" /> Stop Rec</>
                ) : (
                  <><Circle className="w-4 h-4 mr-2" fill="currentColor" /> Record Video</>
                )}
              </Button>
            </motion.div>
          </Card>
        </div>

        {/* Right Column: Live Detection Results */}
        <div className="lg:col-span-1">
          <Card className="p-6 h-full border-slate-800 flex flex-col">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-emerald-400" />
              Live Telemetry
            </h3>

            {detectionResult ? (
              <motion.div 
                key={detectionResult.timestamp}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col flex-grow space-y-5"
              >
                {/* Status Indicator */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 text-sm font-medium">Status</span>
                    <Badge variant={detectionResult.status === 'Healthy' ? 'success' : 'danger'}>
                      {detectionResult.status}
                    </Badge>
                  </div>
                  <h4 className={`text-xl font-bold mt-2 ${detectionResult.status === 'Healthy' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {detectionResult.plantName}
                    {detectionResult.diseaseName !== 'None' && detectionResult.diseaseName !== 'No Plant Detected' && (
                      <span className="block text-sm text-slate-300 mt-1">{detectionResult.diseaseName}</span>
                    )}
                  </h4>
                </div>

                {/* Confidence */}
                <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                  <div className="flex items-center text-slate-300">
                    <Target className="w-4 h-4 mr-2 text-blue-400" />
                    <span className="text-sm font-medium">AI Confidence</span>
                  </div>
                  <span className="font-bold text-white text-lg">{detectionResult.confidence}%</span>
                </div>

                {/* dynamic content depending on healthy vs diseased */}
                {detectionResult.status === 'Healthy' ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                      <Zap className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h5 className="text-emerald-400 font-bold mb-2">Plant is Thriving</h5>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      No signs of disease detected. Keep up the current care routine and maintain optimal watering conditions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 flex-grow">
                    {/* Treatments */}
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                      <h5 className="text-sm font-bold text-white flex items-center mb-2">
                        <Beaker className="w-4 h-4 mr-2 text-amber-400" />
                        Treatment
                      </h5>
                      <ul className="text-sm text-slate-300 space-y-1 pl-6 list-disc">
                        {Array.isArray(detectionResult.treatment)
                          ? detectionResult.treatment.slice(0,2).map((t, i) => <li key={i}>{t}</li>)
                          : <li>{detectionResult.treatment || "No specific treatment found."}</li>}
                      </ul>
                    </div>
                    
                    {/* Fertilizer */}
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                      <h5 className="text-sm font-bold text-white flex items-center mb-2">
                        <Aperture className="w-4 h-4 mr-2 text-purple-400" />
                        Fertilizer
                      </h5>
                      <ul className="text-sm text-slate-300 space-y-1 pl-6 list-disc">
                        {Array.isArray(detectionResult.fertilizer)
                          ? detectionResult.fertilizer.slice(0,2).map((f, i) => <li key={i}>{f}</li>)
                          : <li>{detectionResult.fertilizer || "Standard NPK recommended."}</li>}
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                <Target className="w-12 h-12 text-slate-600 mb-4" />
                <p className="text-slate-400 text-sm">
                  Start the camera to begin analyzing real-time telemetry from the AI engine.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Detection History Table */}
      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-bold text-white">Recent Activity Log</h4>
          <div className="flex gap-2">
            <button
              onClick={() => downloadSheet('csv')}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition"
            >
              CSV
            </button>
            <button
              onClick={() => downloadSheet('excel')}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition"
            >
              Excel
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/50">
                <th className="py-3 px-4 rounded-tl-lg">Time</th>
                <th className="py-3 px-4">Plant</th>
                <th className="py-3 px-4">Disease</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4 rounded-tr-lg">Status</th>
              </tr>
            </thead>
            <tbody>
              {historyData.slice(0, 4).map((row, idx) => (
                <tr key={row._id || idx} className="border-b border-slate-800/50 text-slate-300 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">{new Date(row.timestamp).toLocaleTimeString()}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-400">{row.plantName}</td>
                  <td className="py-3 px-4">{row.diseaseName}</td>
                  <td className="py-3 px-4 font-bold text-emerald-500">{row.confidence}%</td>
                  <td className="py-3 px-4">
                    <Badge variant={row.status === 'Healthy' ? 'success' : 'danger'} size="sm">
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {historyData.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500 italic">
                    No detections logged in this session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
};

export default LiveCameraAgent;
