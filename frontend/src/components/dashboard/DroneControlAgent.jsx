import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import {
  Radio, Power, AlertTriangle, Shield, Zap,
  Play, Pause, Square, Navigation, RotateCcw,
  Droplets, Plus, Minus, Activity, Battery, Gauge,
  Signal, Camera, RefreshCw, Settings, CheckCircle2,
  XCircle, AlertCircle, ChevronUp, ChevronDown,
  Clock, Waves, Wifi, Wind, MapPin, Crosshair,
  Loader2, TriangleAlert, Eye, EyeOff, Cpu
} from 'lucide-react';
import { containerVariants, itemVariants } from '../../animations/variants';
import toast from 'react-hot-toast';
import * as droneService from '../../services/droneService';

// ─────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────

const INITIAL_TELEMETRY = {
  battery: 87,
  altitude: 0,
  speed: 0,
  heading: 0,
  gpsLock: true,
  satellites: 12,
  flowRate: 5,
  tankLevel: 95,
  coverageArea: 0,
  signalStrength: 94,
  missionProgress: 0,
  remainingFlightTime: 42,
  obstacleDetected: false,
  motorHealth: 'good',
  propellerHealth: 'good',
  commHealth: 'good',
  failsafeStatus: 'inactive',
};

const INITIAL_DRONE_STATE = {
  isArmed: false,
  isFlying: false,
  isHovering: false,
  missionStatus: 'idle',       // 'idle' | 'running' | 'paused' | 'completed' | 'aborted'
  isSprinklingActive: false,
  connectionStatus: 'connected',// 'connected' | 'disconnected' | 'connecting'
  flightMode: 'IDLE',          // 'IDLE' | 'TAKEOFF' | 'MISSION' | 'HOVER' | 'LAND' | 'RTH'
  cameraEnabled: false,
  liveFeedEnabled: false,
};

// ─────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────

const StatusRow = ({ label, value, valueColor = 'text-white', icon: Icon, iconColor = 'text-slate-400' }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-800/60 last:border-b-0">
    <div className="flex items-center gap-2.5">
      {Icon && <Icon size={14} className={iconColor} />}
      <span className="text-slate-400 text-sm">{label}</span>
    </div>
    <span className={`text-sm font-semibold ${valueColor}`}>{value}</span>
  </div>
);

const HealthDot = ({ status }) => {
  const colors = {
    good:      'bg-emerald-400 shadow-emerald-400/50',
    warning:   'bg-amber-400 shadow-amber-400/50',
    error:     'bg-red-400 shadow-red-400/50',
    active:    'bg-red-400 shadow-red-400/50 animate-pulse',
    inactive:  'bg-emerald-400 shadow-emerald-400/50',
    detected:  'bg-red-400 shadow-red-400/50 animate-pulse',
    clear:     'bg-emerald-400 shadow-emerald-400/50',
    locked:    'bg-emerald-400 shadow-emerald-400/50',
    searching: 'bg-amber-400 shadow-amber-400/50 animate-pulse',
    connected: 'bg-emerald-400 shadow-emerald-400/50',
    lost:      'bg-red-400 shadow-red-400/50 animate-ping',
  };
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full shadow-md ${colors[status] || colors.good}`} />
  );
};

const SafetyRow = ({ label, status, statusLabel, icon: Icon }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-800/60 last:border-b-0">
    <div className="flex items-center gap-2.5">
      {Icon && <Icon size={14} className="text-slate-500" />}
      <span className="text-slate-300 text-sm">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <HealthDot status={status} />
      <span className={`text-xs font-semibold ${
        ['good','inactive','clear','locked','connected'].includes(status)
          ? 'text-emerald-400'
          : ['warning','searching'].includes(status)
          ? 'text-amber-400'
          : 'text-red-400'
      }`}>
        {statusLabel}
      </span>
    </div>
  </div>
);

const TelemetryCard = ({ icon: Icon, label, value, unit, color = 'emerald', subtext }) => {
  const colorMap = {
    emerald: { bg: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30', icon: 'text-emerald-400', val: 'text-emerald-300' },
    blue:    { bg: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',         icon: 'text-blue-400',    val: 'text-blue-300' },
    amber:   { bg: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',       icon: 'text-amber-400',   val: 'text-amber-300' },
    purple:  { bg: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',    icon: 'text-purple-400',  val: 'text-purple-300' },
    cyan:    { bg: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',          icon: 'text-cyan-400',    val: 'text-cyan-300' },
    red:     { bg: 'from-red-500/20 to-red-600/10 border-red-500/30',            icon: 'text-red-400',     val: 'text-red-300' },
  };
  const c = colorMap[color] || colorMap.emerald;
  return (
    <motion.div variants={itemVariants}>
      <div className={`rounded-xl bg-gradient-to-br ${c.bg} border p-4 h-full`}>
        <div className="flex items-start justify-between mb-2">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</span>
          <Icon size={16} className={c.icon} />
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-black ${c.val}`}>{value}</span>
          {unit && <span className="text-slate-500 text-sm">{unit}</span>}
        </div>
        {subtext && <p className="text-slate-500 text-xs mt-1">{subtext}</p>}
      </div>
    </motion.div>
  );
};

const ControlButton = ({ label, icon: Icon, onClick, loading, variant = 'default', disabled, className = '' }) => {
  const variants = {
    default:    'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600',
    primary:    'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-emerald-500/40 text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-500/25',
    danger:     'bg-gradient-to-r from-red-500/20 to-red-600/10 border-red-500/40 text-red-300 hover:border-red-400/60 hover:bg-red-500/25',
    warning:    'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-amber-500/40 text-amber-300 hover:border-amber-400/60 hover:bg-amber-500/25',
    success:    'bg-gradient-to-r from-emerald-600/30 to-lime-600/20 border-emerald-500/50 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/35',
    active:     'bg-gradient-to-r from-emerald-600/40 to-lime-600/30 border-emerald-400/60 text-white',
    'mission-run': 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 border-blue-500/40 text-blue-300 hover:border-blue-400/60',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant] || variants.default} ${className}`}
    >
      {loading
        ? <Loader2 size={14} className="animate-spin" />
        : Icon && <Icon size={14} />
      }
      <span>{label}</span>
    </motion.button>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────

const DroneControlAgent = () => {
  const [droneState, setDroneState] = useState(INITIAL_DRONE_STATE);
  const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY);
  const [loading, setLoading] = useState({});
  const telemetryIntervalRef = useRef(null);
  const batteryRef = useRef(87);
  const altRef = useRef(0);
  const coverageRef = useRef(0);
  const progressRef = useRef(0);
  const videoRef = useRef(null);      // <video> element for camera feed
  const streamRef = useRef(null);     // MediaStream from getUserMedia
  const [cameraError, setCameraError] = useState(null);

  // ── Live telemetry simulation ──────────────────────────
  useEffect(() => {
    telemetryIntervalRef.current = setInterval(() => {
      setDroneState((ds) => {
        setTelemetry((t) => {
          // Slowly drain battery
          batteryRef.current = Math.max(5, batteryRef.current - 0.05);

          // If flying — fluctuate altitude & speed
          if (ds.isFlying) {
            altRef.current = Math.max(0, altRef.current + (Math.random() - 0.48) * 0.8);
          }

          // If mission running — increase coverage & progress
          if (ds.missionStatus === 'running') {
            coverageRef.current = Math.min(100, coverageRef.current + 0.15);
            progressRef.current = Math.min(100, progressRef.current + 0.3);
          }

          return {
            ...t,
            battery: parseFloat(batteryRef.current.toFixed(1)),
            altitude: ds.isFlying ? parseFloat(altRef.current.toFixed(1)) : 0,
            speed: ds.isFlying ? parseFloat((Math.random() * 3 + 3).toFixed(1)) : 0,
            heading: (t.heading + (ds.isFlying ? Math.random() * 2 : 0)) % 360,
            signalStrength: Math.floor(Math.random() * 8) + 90,
            coverageArea: parseFloat(coverageRef.current.toFixed(2)),
            missionProgress: parseFloat(progressRef.current.toFixed(1)),
            remainingFlightTime: Math.max(0, Math.floor((batteryRef.current / 2))),
          };
        });
        return ds;
      });
    }, 2000);

    return () => clearInterval(telemetryIntervalRef.current);
  }, []);

  // ── Camera stream cleanup on unmount ──────────────────
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ── Generic command executor ───────────────────────────
  const executeCommand = useCallback(async (cmdKey, serviceCall, onSuccess) => {
    setLoading((l) => ({ ...l, [cmdKey]: true }));
    try {
      const result = await serviceCall();
      if (result.success) {
        toast.success(result.message);
        onSuccess?.(result);
      } else {
        toast.error(result.message || 'Command failed');
      }
    } catch {
      toast.error('Connection error — check drone link');
    } finally {
      setLoading((l) => ({ ...l, [cmdKey]: false }));
    }
  }, []);

  // ── FLIGHT CONTROLS ────────────────────────────────────
  const handleArm = () => executeCommand('arm', droneService.armDrone, () =>
    setDroneState((s) => ({ ...s, isArmed: true }))
  );

  const handleDisarm = () => executeCommand('disarm', droneService.disarmDrone, () =>
    setDroneState((s) => ({ ...s, isArmed: false, isFlying: false, flightMode: 'IDLE' }))
  );

  const handleTakeoff = () => executeCommand('takeoff', () => droneService.takeoff(30), (r) => {
    setDroneState((s) => ({ ...s, isFlying: true, flightMode: 'TAKEOFF' }));
    altRef.current = 30;
  });

  const handleLand = () => executeCommand('land', droneService.land, () => {
    setDroneState((s) => ({ ...s, isFlying: false, isHovering: false, flightMode: 'LAND' }));
    altRef.current = 0;
  });

  const handleHover = () => executeCommand('hover', droneService.hover, () =>
    setDroneState((s) => ({ ...s, isHovering: true, flightMode: 'HOVER' }))
  );

  const handleRTH = () => executeCommand('rth', droneService.returnHome, () =>
    setDroneState((s) => ({ ...s, flightMode: 'RTH' }))
  );

  const handleEmergencyStop = async () => {
    setLoading((l) => ({ ...l, estop: true }));
    try {
      const result = await droneService.emergencyStop();
      toast.error('⚠ EMERGENCY STOP — All motors killed!', { duration: 5000 });
      setDroneState(INITIAL_DRONE_STATE);
      setTelemetry((t) => ({ ...t, altitude: 0, speed: 0 }));
      altRef.current = 0;
      coverageRef.current = 0;
      progressRef.current = 0;
    } catch {
      toast.error('Emergency stop signal failed!');
    } finally {
      setLoading((l) => ({ ...l, estop: false }));
    }
  };

  // ── MISSION CONTROLS ───────────────────────────────────
  const handleStartMission = () => executeCommand('missionStart', droneService.startMission, () => {
    setDroneState((s) => ({ ...s, missionStatus: 'running', flightMode: 'MISSION', isFlying: true }));
  });

  const handlePauseMission = () => executeCommand('missionPause', droneService.pauseMission, () =>
    setDroneState((s) => ({ ...s, missionStatus: 'paused', flightMode: 'HOVER' }))
  );

  const handleResumeMission = () => executeCommand('missionResume', droneService.resumeMission, () =>
    setDroneState((s) => ({ ...s, missionStatus: 'running', flightMode: 'MISSION' }))
  );

  const handleAbortMission = () => executeCommand('missionAbort', droneService.abortMission, () => {
    setDroneState((s) => ({ ...s, missionStatus: 'aborted', flightMode: 'RTH' }));
    progressRef.current = 0;
    coverageRef.current = 0;
  });

  // ── SPRINKLING CONTROLS ────────────────────────────────
  const handleStartSprinkling = () => executeCommand('sprinkleStart', droneService.startSprinkling, () =>
    setDroneState((s) => ({ ...s, isSprinklingActive: true }))
  );

  const handleStopSprinkling = () => executeCommand('sprinkleStop', droneService.stopSprinkling, () =>
    setDroneState((s) => ({ ...s, isSprinklingActive: false }))
  );

  const handleIncreaseFlow = () => executeCommand('flowUp', () =>
    droneService.increaseFlowRate(telemetry.flowRate), (r) =>
    setTelemetry((t) => ({ ...t, flowRate: r.newRate }))
  );

  const handleDecreaseFlow = () => executeCommand('flowDown', () =>
    droneService.decreaseFlowRate(telemetry.flowRate), (r) =>
    setTelemetry((t) => ({ ...t, flowRate: r.newRate }))
  );

  // ── QUICK ACTIONS ──────────────────────────────────────
  const handleCalibrate = () => {
    toast.loading('Calibrating sensors...', { id: 'calibrate', duration: 3500 });
    executeCommand('calibrate', droneService.calibrateSensors, () =>
      toast.success('All sensors calibrated!', { id: 'calibrate' })
    );
  };

  const handleRefreshGPS = () => executeCommand('gps', droneService.refreshGPS, (r) => {
    setTelemetry((t) => ({ ...t, gpsLock: true, satellites: r.satellites }));
  });

  const handleCameraToggle = async () => {
    const next = !droneState.cameraEnabled;
    if (next) {
      // Turn camera ON — request device camera access
      setLoading((l) => ({ ...l, camera: true }));
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        // Assign stream to <video> element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setDroneState((s) => ({ ...s, cameraEnabled: true }));
        toast.success('Camera feed active — showing live input');
      } catch (err) {
        const msg = err.name === 'NotAllowedError'
          ? 'Camera permission denied — allow camera access in browser'
          : err.name === 'NotFoundError'
          ? 'No camera device found'
          : `Camera error: ${err.message}`;
        setCameraError(msg);
        toast.error(msg);
      } finally {
        setLoading((l) => ({ ...l, camera: false }));
      }
    } else {
      // Turn camera OFF — stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      setDroneState((s) => ({ ...s, cameraEnabled: false }));
      setCameraError(null);
      toast.success('Camera feed stopped');
    }
  };

  const handleLiveFeedToggle = () => {
    const next = !droneState.liveFeedEnabled;
    executeCommand('livefeed', () => droneService.toggleLiveFeed(next), () =>
      setDroneState((s) => ({ ...s, liveFeedEnabled: next }))
    );
  };

  const handleResetMission = () => executeCommand('resetMission', droneService.resetMission, () => {
    progressRef.current = 0;
    coverageRef.current = 0;
    setDroneState((s) => ({ ...s, missionStatus: 'idle' }));
  });

  const handleResetDrone = () => executeCommand('resetDrone', droneService.resetDroneState, () => {
    setDroneState(INITIAL_DRONE_STATE);
    setTelemetry(INITIAL_TELEMETRY);
    batteryRef.current = 87;
    altRef.current = 0;
    coverageRef.current = 0;
    progressRef.current = 0;
  });

  // ── CONNECTION STATUS ──────────────────────────────────
  const connColor = {
    connected:    'text-emerald-400',
    disconnected: 'text-red-400',
    connecting:   'text-amber-400',
  };
  const missionStatusLabel = {
    idle:      { label: 'No Mission', color: 'text-slate-400' },
    running:   { label: 'Running',    color: 'text-emerald-400' },
    paused:    { label: 'Paused',     color: 'text-amber-400' },
    completed: { label: 'Completed',  color: 'text-blue-400' },
    aborted:   { label: 'Aborted',    color: 'text-red-400' },
  };
  const ms = missionStatusLabel[droneState.missionStatus] || missionStatusLabel.idle;

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full">

      {/* ── PAGE HEADER ────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-lime-400/10 border border-emerald-500/30 flex items-center justify-center">
              <Radio size={20} className="text-emerald-400" />
            </div>
            Drone Control System
          </h2>
          <p className="text-slate-400 mt-1 ml-13">Autonomous precision agriculture drone operations</p>
        </div>

        {/* Connection + Emergency */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className={`w-2 h-2 rounded-full ${droneState.connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <Wifi size={14} className={connColor[droneState.connectionStatus]} />
            <span className={`text-sm font-semibold capitalize ${connColor[droneState.connectionStatus]}`}>
              {droneState.connectionStatus}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleEmergencyStop}
            disabled={loading.estop}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30 hover:border-red-400/70 transition font-bold text-sm"
          >
            {loading.estop ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
            Emergency Stop
          </motion.button>
        </div>
      </motion.div>

      {/* ── TOP TELEMETRY ROW ──────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <TelemetryCard icon={Battery}   label="Battery"         value={telemetry.battery.toFixed(0)} unit="%" color={telemetry.battery > 40 ? 'emerald' : 'red'} subtext={`~${telemetry.remainingFlightTime} min left`} />
        <TelemetryCard icon={ChevronUp} label="Altitude"        value={telemetry.altitude.toFixed(1)} unit="m"   color="blue"   subtext="AGL" />
        <TelemetryCard icon={Gauge}     label="Ground Speed"    value={telemetry.speed.toFixed(1)}   unit="m/s" color="purple" subtext={`Heading ${Math.floor(telemetry.heading)}°`} />
        <TelemetryCard icon={Signal}    label="Signal Strength" value={telemetry.signalStrength}     unit="%"   color={telemetry.signalStrength > 70 ? 'cyan' : 'amber'} subtext={`${telemetry.satellites} satellites`} />
      </motion.div>

      {/* ── MAIN GRID ──────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* LEFT — CONTROL PANELS */}
        <div className="lg:col-span-1 space-y-5">

          {/* Flight Controls */}
          <motion.div variants={itemVariants}>
            <Card className="p-5" hover={false}>
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Navigation size={16} className="text-emerald-400" />
                Flight Controls
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <ControlButton label="Arm Drone"    icon={Power}      onClick={handleArm}      loading={loading.arm}       variant="success"  disabled={droneState.isArmed} />
                <ControlButton label="Disarm"       icon={Power}      onClick={handleDisarm}   loading={loading.disarm}    variant="warning"  disabled={!droneState.isArmed} />
                <ControlButton label="Take Off"     icon={ChevronUp}  onClick={handleTakeoff}  loading={loading.takeoff}   variant="primary"  disabled={!droneState.isArmed || droneState.isFlying} />
                <ControlButton label="Land"         icon={ChevronDown}onClick={handleLand}     loading={loading.land}      variant="default"  disabled={!droneState.isFlying} />
                <ControlButton label="Hover"        icon={Crosshair}  onClick={handleHover}    loading={loading.hover}     variant="default"  disabled={!droneState.isFlying} />
                <ControlButton label="Return Home"  icon={RotateCcw}  onClick={handleRTH}      loading={loading.rth}       variant="warning"  disabled={!droneState.isFlying} />
              </div>
            </Card>
          </motion.div>

          {/* Mission Controls */}
          <motion.div variants={itemVariants}>
            <Card className="p-5" hover={false}>
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-blue-400" />
                Mission Controls
                <span className={`ml-auto text-xs font-bold ${ms.color}`}>{ms.label}</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <ControlButton
                  label="Start Mission" icon={Play}
                  onClick={handleStartMission} loading={loading.missionStart}
                  variant="mission-run"
                  disabled={!droneState.isArmed || droneState.missionStatus === 'running'}
                />
                <ControlButton
                  label="Pause" icon={Pause}
                  onClick={handlePauseMission} loading={loading.missionPause}
                  variant="warning"
                  disabled={droneState.missionStatus !== 'running'}
                />
                <ControlButton
                  label="Resume" icon={Play}
                  onClick={handleResumeMission} loading={loading.missionResume}
                  variant="primary"
                  disabled={droneState.missionStatus !== 'paused'}
                />
                <ControlButton
                  label="Abort" icon={Square}
                  onClick={handleAbortMission} loading={loading.missionAbort}
                  variant="danger"
                  disabled={droneState.missionStatus === 'idle' || droneState.missionStatus === 'aborted'}
                />
              </div>

              {/* Mission Progress Bar */}
              {droneState.missionStatus !== 'idle' && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Mission Progress</span>
                    <span className="text-emerald-400 font-bold">{telemetry.missionProgress.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 rounded-full"
                      style={{ width: `${telemetry.missionProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Sprinkling Controls */}
          <motion.div variants={itemVariants}>
            <Card className="p-5" hover={false}>
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Droplets size={16} className="text-cyan-400" />
                Sprinkling Controls
                <AnimatePresence>
                  {droneState.isSprinklingActive && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="ml-auto px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold animate-pulse"
                    >
                      ACTIVE
                    </motion.span>
                  )}
                </AnimatePresence>
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <ControlButton
                  label="Start Sprinkle" icon={Droplets}
                  onClick={handleStartSprinkling} loading={loading.sprinkleStart}
                  variant="primary"
                  disabled={droneState.isSprinklingActive}
                />
                <ControlButton
                  label="Stop Sprinkle" icon={Square}
                  onClick={handleStopSprinkling} loading={loading.sprinkleStop}
                  variant="danger"
                  disabled={!droneState.isSprinklingActive}
                />
              </div>

              {/* Flow Rate Control */}
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-medium">Flow Rate</span>
                  <span className="text-cyan-300 font-bold">{telemetry.flowRate} L/min</span>
                </div>
                <div className="flex gap-2">
                  <ControlButton
                    label="Decrease" icon={Minus}
                    onClick={handleDecreaseFlow} loading={loading.flowDown}
                    variant="default"
                    disabled={telemetry.flowRate <= 1}
                    className="flex-1"
                  />
                  <ControlButton
                    label="Increase" icon={Plus}
                    onClick={handleIncreaseFlow} loading={loading.flowUp}
                    variant="primary"
                    disabled={telemetry.flowRate >= 10}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Tank Level */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Water Tank</span>
                  <span className={`font-bold ${telemetry.tankLevel > 30 ? 'text-cyan-400' : 'text-red-400'}`}>
                    {telemetry.tankLevel}%
                  </span>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${telemetry.tankLevel > 30 ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-red-500'}`}
                    style={{ width: `${telemetry.tankLevel}%` }}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <Card className="p-5" hover={false}>
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Zap size={16} className="text-amber-400" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <ControlButton label="Calibrate"      icon={Settings}   onClick={handleCalibrate}      loading={loading.calibrate}    variant="default" />
                <ControlButton label="Refresh GPS"    icon={RefreshCw}  onClick={handleRefreshGPS}     loading={loading.gps}          variant="default" />
                <ControlButton label={droneState.cameraEnabled ? 'Camera Off' : 'Camera On'} icon={Camera}
                  onClick={handleCameraToggle} loading={loading.camera}
                  variant={droneState.cameraEnabled ? 'active' : 'default'}
                />
                <ControlButton label={droneState.liveFeedEnabled ? 'Feed Off' : 'Live Feed'} icon={droneState.liveFeedEnabled ? EyeOff : Eye}
                  onClick={handleLiveFeedToggle} loading={loading.livefeed}
                  variant={droneState.liveFeedEnabled ? 'active' : 'default'}
                />
                <ControlButton label="Reset Mission"  icon={RotateCcw}  onClick={handleResetMission}   loading={loading.resetMission}  variant="warning" />
                <ControlButton label="Reset Drone"    icon={Cpu}        onClick={handleResetDrone}      loading={loading.resetDrone}   variant="danger" />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* RIGHT — STATUS, SAFETY & CAMERA FEED */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── CAMERA FEED PANEL ─────────────────────── */}
          <AnimatePresence>
            {(droneState.cameraEnabled || cameraError) && (
              <motion.div
                key="camera-panel"
                initial={{ opacity: 0, y: -16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.97 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <Card className="overflow-hidden p-0" hover={false}>
                  {/* Panel header */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950/70">
                    <div className="flex items-center gap-2">
                      <Camera size={14} className="text-emerald-400" />
                      <span className="text-sm font-bold text-white">Drone FPV Camera</span>
                      {droneState.cameraEnabled && !cameraError && (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleCameraToggle}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 text-xs font-semibold transition"
                    >
                      <EyeOff size={12} /> Close Feed
                    </button>
                  </div>

                  {/* Video viewport */}
                  <div className="relative bg-black" style={{ height: '340px' }}>

                    {/* Real camera video element */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover transition-opacity duration-500 ${
                        droneState.cameraEnabled && !cameraError ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    {/* Error state */}
                    {cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950">
                        <Camera size={40} className="text-slate-600" />
                        <p className="text-red-400 text-sm font-semibold text-center px-6">{cameraError}</p>
                        <button
                          onClick={handleCameraToggle}
                          className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition"
                        >
                          Retry Camera
                        </button>
                      </div>
                    )}

                    {/* FPV HUD overlay — only shown when live */}
                    {droneState.cameraEnabled && !cameraError && (
                      <>
                        {/* Scanline effect */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
                          }}
                        />

                        {/* Corner brackets */}
                        {[['top-3 left-3','border-t-2 border-l-2'],['top-3 right-3','border-t-2 border-r-2'],['bottom-3 left-3','border-b-2 border-l-2'],['bottom-3 right-3','border-b-2 border-r-2']].map(([pos, border], i) => (
                          <div key={i} className={`absolute ${pos} w-6 h-6 ${border} border-emerald-400/70 pointer-events-none`} />
                        ))}

                        {/* Centre crosshair */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="relative w-16 h-16">
                            <div className="absolute top-1/2 left-0 right-0 h-px bg-emerald-400/50" />
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-emerald-400/50" />
                            <div className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/60" />
                          </div>
                        </div>

                        {/* TOP-LEFT — REC + timestamp */}
                        <div className="absolute top-3 left-10 flex items-center gap-2 pointer-events-none">
                          <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold font-mono">
                            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                            REC
                          </span>
                          <span className="text-white/60 text-xs font-mono">
                            {new Date().toLocaleTimeString()}
                          </span>
                        </div>

                        {/* TOP-RIGHT — mode + battery */}
                        <div className="absolute top-3 right-10 flex items-center gap-3 pointer-events-none">
                          <span className="text-emerald-400 text-xs font-bold font-mono uppercase">{droneState.flightMode}</span>
                          <span className={`text-xs font-bold font-mono ${
                            telemetry.battery > 40 ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            BAT {telemetry.battery.toFixed(0)}%
                          </span>
                        </div>

                        {/* BOTTOM-LEFT — altitude + speed */}
                        <div className="absolute bottom-3 left-10 space-y-0.5 pointer-events-none">
                          <div className="text-xs font-mono text-emerald-300">
                            ALT&nbsp;&nbsp;<span className="text-white font-bold">{telemetry.altitude.toFixed(1)} m</span>
                          </div>
                          <div className="text-xs font-mono text-emerald-300">
                            SPD&nbsp;&nbsp;<span className="text-white font-bold">{telemetry.speed.toFixed(1)} m/s</span>
                          </div>
                        </div>

                        {/* BOTTOM-RIGHT — heading + GPS */}
                        <div className="absolute bottom-3 right-10 text-right space-y-0.5 pointer-events-none">
                          <div className="text-xs font-mono text-emerald-300">
                            HDG&nbsp;<span className="text-white font-bold">{Math.floor(telemetry.heading)}°</span>
                          </div>
                          <div className="text-xs font-mono text-emerald-300">
                            GPS&nbsp;<span className={telemetry.gpsLock ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                              {telemetry.gpsLock ? `LOCK (${telemetry.satellites})` : 'SEARCHING'}
                            </span>
                          </div>
                        </div>

                        {/* CENTRE-TOP — drone ID */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
                          <span className="text-white/50 text-xs font-mono tracking-widest">AGROSENTRY-01</span>
                        </div>

                        {/* Signal strength bar — bottom centre */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
                          <div className="flex items-end gap-0.5">
                            {[3,5,7,9,11].map((h, i) => (
                              <div
                                key={i}
                                style={{ height: `${h}px`, width: '3px' }}
                                className={`rounded-sm ${
                                  i < Math.ceil((telemetry.signalStrength / 100) * 5)
                                    ? 'bg-emerald-400'
                                    : 'bg-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-emerald-400 text-xs font-mono">{telemetry.signalStrength}%</span>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drone Status */}
          <motion.div variants={itemVariants}>
            <Card className="p-5" hover={false}>
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Activity size={16} className="text-emerald-400" />
                Drone Status
              </h3>
              <div className="grid md:grid-cols-2 gap-x-8">
                <div>
                  <StatusRow
                    label="Drone Status" icon={Radio}
                    value={droneState.isFlying ? 'In Flight' : droneState.isArmed ? 'Armed / Ground' : 'Disarmed'}
                    valueColor={droneState.isFlying ? 'text-emerald-400' : droneState.isArmed ? 'text-amber-400' : 'text-slate-400'}
                  />
                  <StatusRow
                    label="Connection" icon={Wifi}
                    value={droneState.connectionStatus}
                    valueColor={connColor[droneState.connectionStatus]}
                  />
                  <StatusRow
                    label="Battery" icon={Battery}
                    value={`${telemetry.battery.toFixed(0)}%`}
                    valueColor={telemetry.battery > 40 ? 'text-emerald-400' : 'text-red-400'}
                  />
                  <StatusRow
                    label="GPS Lock" icon={MapPin}
                    value={telemetry.gpsLock ? `Locked (${telemetry.satellites} sat)` : 'Searching...'}
                    valueColor={telemetry.gpsLock ? 'text-emerald-400' : 'text-amber-400'}
                  />
                  <StatusRow
                    label="Flight Mode" icon={Navigation}
                    value={droneState.flightMode}
                    valueColor="text-blue-400"
                  />
                </div>
                <div>
                  <StatusRow label="Altitude"       icon={ChevronUp} value={`${telemetry.altitude.toFixed(1)} m`}   valueColor="text-white" />
                  <StatusRow label="Speed"          icon={Gauge}     value={`${telemetry.speed.toFixed(1)} m/s`}   valueColor="text-white" />
                  <StatusRow label="Heading"        icon={Wind}      value={`${Math.floor(telemetry.heading)}°`}   valueColor="text-white" />
                  <StatusRow
                    label="Mission Status" icon={MapPin}
                    value={ms.label}
                    valueColor={ms.color}
                  />
                  <StatusRow
                    label="Sprinkler" icon={Droplets}
                    value={droneState.isSprinklingActive ? 'Active' : 'Off'}
                    valueColor={droneState.isSprinklingActive ? 'text-cyan-400' : 'text-slate-400'}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Safety Panel */}
          <motion.div variants={itemVariants}>
            <Card className="p-5" hover={false}>
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Shield size={16} className="text-purple-400" />
                Safety Panel
                {telemetry.obstacleDetected && (
                  <span className="ml-auto text-xs font-bold text-red-400 animate-pulse flex items-center gap-1">
                    <AlertTriangle size={12} /> OBSTACLE DETECTED
                  </span>
                )}
              </h3>
              <div className="grid md:grid-cols-2 gap-x-8">
                <div>
                  <SafetyRow label="Obstacle Detection" icon={AlertCircle} status={telemetry.obstacleDetected ? 'detected' : 'clear'}      statusLabel={telemetry.obstacleDetected ? 'Detected!' : 'Clear'} />
                  <SafetyRow label="Failsafe Status"    icon={Shield}      status={telemetry.failsafeStatus === 'inactive' ? 'inactive' : 'active'} statusLabel={telemetry.failsafeStatus === 'inactive' ? 'Inactive (OK)' : 'ACTIVE!'} />
                  <SafetyRow label="GPS Lock"           icon={MapPin}      status={telemetry.gpsLock ? 'locked' : 'searching'}                statusLabel={telemetry.gpsLock ? 'Locked' : 'Searching'} />
                  <SafetyRow label="Return Home"        icon={RotateCcw}   status={droneState.flightMode === 'RTH' ? 'active' : 'inactive'}   statusLabel={droneState.flightMode === 'RTH' ? 'Active' : 'Ready'} />
                </div>
                <div>
                  <SafetyRow label="Motor Health"       icon={Cpu}         status={telemetry.motorHealth}        statusLabel={telemetry.motorHealth === 'good' ? 'Nominal' : 'Check Required'} />
                  <SafetyRow label="Propeller Health"   icon={Wind}        status={telemetry.propellerHealth}    statusLabel={telemetry.propellerHealth === 'good' ? 'Nominal' : 'Inspect'} />
                  <SafetyRow label="Comm Health"        icon={Wifi}        status={telemetry.commHealth}         statusLabel={telemetry.commHealth === 'good' ? 'Nominal' : 'Signal Issue'} />
                  <SafetyRow label="Signal Strength"    icon={Signal}      status={telemetry.signalStrength > 70 ? 'good' : 'warning'}  statusLabel={`${telemetry.signalStrength}% RSSI`} />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Extended Telemetry */}
          <motion.div variants={itemVariants}>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Telemetry Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <TelemetryCard icon={Waves}    label="Water Tank"          value={telemetry.tankLevel}              unit="%" color="cyan"   subtext="Capacity remaining" />
              <TelemetryCard icon={MapPin}   label="Coverage Area"       value={telemetry.coverageArea.toFixed(2)} unit="ha" color="emerald" subtext="Sprayed so far" />
              <TelemetryCard icon={Activity} label="Mission Progress"    value={telemetry.missionProgress.toFixed(0)} unit="%" color="blue" subtext="Waypoints completed" />
              <TelemetryCard icon={Clock}    label="Flight Time Left"    value={telemetry.remainingFlightTime}     unit="min" color={telemetry.remainingFlightTime > 15 ? 'purple' : 'amber'} subtext="Est. remaining" />
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
};

export default DroneControlAgent;
