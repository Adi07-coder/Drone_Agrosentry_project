import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapContainer, TileLayer, Marker, Polyline, Polygon,
  useMapEvents, useMap, Circle, Tooltip
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Card from '../common/Card';
import {
  Map, Trash2, Edit3, Move, Save, Upload, Play,
  RotateCcw, CheckCircle2, AlertTriangle, AlertCircle,
  Info, Navigation, Clock, Battery, Droplets,
  MapPin, Layers, Grid, Zap, X, Check, FileJson, Loader2,
  Square, Shield, Hexagon, Crosshair, Locate, Satellite,
  Activity, Ruler, Eye, EyeOff
} from 'lucide-react';
import { containerVariants, itemVariants } from '../../animations/variants';
import toast from 'react-hot-toast';
import * as missionService from '../../services/missionService';
import * as droneApi from '../../services/droneApiService';

// ─────────────────────────────────────────────────────────
// FIX LEAFLET DEFAULT ICON (Vite asset bundling issue)
// ─────────────────────────────────────────────────────────

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─────────────────────────────────────────────────────────
// CONSTANTS & CONFIG
// ─────────────────────────────────────────────────────────

const TOOLS = {
  SELECT:   'select',
  WAYPOINT: 'waypoint',
  POLYGON:  'polygon',
};

const ACTION_COLORS = {
  FLY_THROUGH:      '#10b981',
  HOVER:            '#3b82f6',
  CAPTURE_IMAGE:    '#a855f7',
  START_SPRINKLING: '#06b6d4',
  STOP_SPRINKLING:  '#f97316',
  RETURN_HOME:      '#f59e0b',
};

const MAP_LAYERS = {
  osm:       { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',            label: 'Street',    attr: '© OpenStreetMap contributors' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', label: 'Satellite', attr: 'Tiles © Esri' },
  topo:      { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',              label: 'Terrain',   attr: '© OpenTopoMap' },
};

const DEFAULT_CENTER = [18.5204, 73.8567]; // Pune, India — will be replaced by real GPS

// ─────────────────────────────────────────────────────────
// CUSTOM LEAFLET ICONS
// ─────────────────────────────────────────────────────────

const makeWpIcon = (index, color, isSelected) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        width:${isSelected ? 34 : 28}px;
        height:${isSelected ? 34 : 28}px;
        background:${color};
        border:${isSelected ? '3px solid white' : '2px solid rgba(255,255,255,0.7)'};
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:900;
        font-size:11px;
        color:#000;
        box-shadow:0 0 ${isSelected ? '12px' : '6px'} ${color}99;
        transition:all 0.2s;
        ${isSelected ? 'outline:2px dashed ' + color + ';outline-offset:3px;' : ''}
      ">${index === 0 ? 'T' : index}</div>`,
    iconSize:   [isSelected ? 34 : 28, isSelected ? 34 : 28],
    iconAnchor: [isSelected ? 17 : 14, isSelected ? 17 : 14],
  });

const gpsIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:rgba(59,130,246,0.25);
        animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
      "></div>
      <div style="
        position:absolute;top:4px;left:4px;right:4px;bottom:4px;
        border-radius:50%;background:#3b82f6;
        border:2.5px solid white;
        box-shadow:0 0 10px #3b82f699;
      "></div>
    </div>
    <style>@keyframes ping{75%,100%{transform:scale(2);opacity:0}}</style>`,
  iconSize:   [24, 24],
  iconAnchor: [12, 12],
});

// ─────────────────────────────────────────────────────────
// MAP CLICK HANDLER (inner component — has access to map)
// ─────────────────────────────────────────────────────────

const MapClickHandler = ({ activeTool, onMapClick }) => {
  useMapEvents({
    click(e) {
      if (activeTool === TOOLS.WAYPOINT || activeTool === TOOLS.POLYGON) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
};

// ─────────────────────────────────────────────────────────
// FLY-TO CONTROLLER (re-centers map on GPS position)
// ─────────────────────────────────────────────────────────

const FlyToLocation = ({ position, trigger }) => {
  const map = useMap();
  useEffect(() => {
    if (position && trigger) {
      map.flyTo(position, 17, { animate: true, duration: 1.5 });
    }
  }, [trigger]); // eslint-disable-line
  return null;
};

// ─────────────────────────────────────────────────────────
// CURSOR STYLE CONTROLLER
// ─────────────────────────────────────────────────────────

const CursorController = ({ activeTool }) => {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (activeTool === TOOLS.WAYPOINT || activeTool === TOOLS.POLYGON) {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = '';
    }
    return () => { container.style.cursor = ''; };
  }, [activeTool, map]);
  return null;
};

// ─────────────────────────────────────────────────────────
// DISTANCES
// ─────────────────────────────────────────────────────────

const haversineDistance = (a, b) => {
  const R = 6371000; // Earth radius in metres
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const totalMissionDistance = (wps) => {
  if (wps.length < 2) return 0;
  return wps.slice(1).reduce((sum, wp, i) => sum + haversineDistance(wps[i], wp), 0);
};

const formatDist = (m) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`);

// ─────────────────────────────────────────────────────────
// WAYPOINT EDITOR PANEL
// ─────────────────────────────────────────────────────────

const WaypointEditor = ({ waypoint, onUpdate, onDelete, onClose }) => {
  const [form, setForm] = useState({ ...waypoint });

  const handleSave = () => {
    onUpdate({ ...form, alt: parseFloat(form.alt) || 30, speed: parseFloat(form.speed) || 5, holdTime: parseFloat(form.holdTime) || 0 });
    onClose();
    toast.success(`${form.label} updated`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-slate-900/90 border border-slate-700 rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-white flex items-center gap-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-black"
            style={{ backgroundColor: ACTION_COLORS[form.action] || '#10b981' }}>
            {waypoint.seq}
          </div>
          {form.label}
        </h4>
        <div className="flex gap-1">
          <button onClick={handleSave} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"><Check size={14} /></button>
          <button onClick={() => { onDelete(waypoint.id); onClose(); }} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"><Trash2 size={14} /></button>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 transition"><X size={14} /></button>
        </div>
      </div>

      {/* GPS Coordinates (read-only) */}
      <div className="grid grid-cols-2 gap-2">
        {[['Latitude', 'lat', '°'], ['Longitude', 'lng', '°']].map(([label, field, unit]) => (
          <div key={field}>
            <label className="text-xs text-slate-500 mb-1 block">{label}</label>
            <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-lg overflow-hidden">
              <span className="flex-1 px-2.5 py-1.5 text-xs text-emerald-300 font-mono">{parseFloat(form[field]).toFixed(6)}</span>
              <span className="text-slate-500 pr-2 text-xs">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Flight params */}
      <div className="grid grid-cols-3 gap-2">
        {[['Altitude', 'alt', 'm', 1], ['Speed', 'speed', 'm/s', 0.5], ['Hold (s)', 'holdTime', 's', 1]].map(([label, field, unit, step]) => (
          <div key={field}>
            <label className="text-xs text-slate-500 mb-1 block">{label}</label>
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <input type="number" step={step} min="0" value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="flex-1 bg-transparent px-2 py-1.5 text-xs text-white focus:outline-none min-w-0" />
              <span className="text-slate-500 pr-1.5 text-xs">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action */}
      <div>
        <label className="text-xs text-slate-500 mb-2 block">Action at Waypoint</label>
        <div className="flex flex-wrap gap-1.5">
          {missionService.WAYPOINT_ACTIONS.map(action => {
            const color = ACTION_COLORS[action.value] || '#10b981';
            const active = form.action === action.value;
            return (
              <button key={action.value} onClick={() => setForm(f => ({ ...f, action: action.value }))}
                className="px-2 py-1 rounded-lg border text-xs font-semibold transition"
                style={active ? { backgroundColor: `${color}22`, borderColor: `${color}66`, color } : { background: 'rgb(30 41 59 / 0.5)', borderColor: '#334155', color: '#94a3b8' }}>
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────
// MISSION SUMMARY
// ─────────────────────────────────────────────────────────

const MissionSummary = ({ waypoints }) => {
  const dist = totalMissionDistance(waypoints);
  const speed = 5; // m/s avg
  const timeMin = dist > 0 ? Math.round(dist / speed / 60) : 0;
  const battPct = Math.min(100, Math.round((dist / 5000) * 100 + timeMin * 2));
  const water = Math.round((dist / 100) * 0.5 * 10) / 10;

  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: 'Total Distance', value: formatDist(dist), icon: Ruler, color: 'text-emerald-400' },
        { label: 'Est. Time', value: `~${timeMin} min`, icon: Clock, color: 'text-blue-400' },
        { label: 'Waypoints', value: waypoints.length, icon: MapPin, color: 'text-purple-400' },
        { label: 'Battery Est.', value: `~${battPct}%`, icon: Battery, color: battPct > 80 ? 'text-red-400' : 'text-amber-400' },
        { label: 'Water Req.', value: `~${water} L`, icon: Droplets, color: 'text-cyan-400' },
        { label: 'Coverage', value: `~${(dist * 0.005).toFixed(1)} ha`, icon: Grid, color: 'text-lime-400' },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1"><Icon size={11} className={color} /><span className="text-slate-500 text-xs">{label}</span></div>
          <span className={`font-bold text-sm ${color}`}>{value}</span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// VALIDATION PANEL
// ─────────────────────────────────────────────────────────

const ValidationPanel = ({ warnings }) => {
  if (warnings.length === 0) return (
    <div className="flex items-center gap-2 text-emerald-400 text-sm">
      <CheckCircle2 size={16} /><span>Mission validation passed — ready to upload</span>
    </div>
  );
  const sevColors = { error: 'text-red-400 bg-red-500/10 border-red-500/20', warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20', info: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
  const sevIcons = { error: AlertCircle, warning: AlertTriangle, info: Info };
  return (
    <div className="space-y-2">
      {warnings.map((w, i) => { const Icon = sevIcons[w.severity] || Info; return (
        <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${sevColors[w.severity]}`}>
          <Icon size={13} className="flex-shrink-0 mt-0.5" /><span>{w.message}</span>
        </div>
      ); })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────

let wpIdCounter = 0;

const MissionPlannerAgent = () => {
  const [waypoints,     setWaypoints]     = useState([]);
  const [polygon,       setPolygon]       = useState([]);
  const [selectedWpId,  setSelectedWpId]  = useState(null);
  const [editingWpId,   setEditingWpId]   = useState(null);
  const [activeTool,    setActiveTool]    = useState(TOOLS.WAYPOINT);
  const [activeLayer,   setActiveLayer]   = useState('satellite');
  const [showPath,      setShowPath]      = useState(true);
  const [showLabels,    setShowLabels]    = useState(true);
  const [defaultAlt,    setDefaultAlt]    = useState(30);
  const [defaultSpeed,  setDefaultSpeed]  = useState(5);
  const [generating,    setGenerating]    = useState(false);
  const [simulating,    setSimulating]    = useState(false);
  const [simWpIndex,    setSimWpIndex]    = useState(-1);
  const [cloudMissions, setCloudMissions] = useState([]);   // missions from backend
  const [cloudLoading,  setCloudLoading]  = useState(false);
  const [showMissionList, setShowMissionList] = useState(false);
  const [activeMissionId, setActiveMissionId] = useState(null);

  // GPS state
  const [gpsPosition,   setGpsPosition]   = useState(null);  // { lat, lng }
  const [gpsAccuracy,   setGpsAccuracy]   = useState(null);
  const [gpsLoading,    setGpsLoading]    = useState(true);
  const [gpsError,      setGpsError]      = useState(null);
  const [mapCenter,     setMapCenter]     = useState(DEFAULT_CENTER);
  const [flyTrigger,    setFlyTrigger]    = useState(0);

  const simRef     = useRef(null);
  const watchIdRef = useRef(null);

  // ── Load cloud missions on mount ────────────────────────
  useEffect(() => {
    droneApi.getMissions()
      .then(res => { if (res.success) setCloudMissions(res.missions); })
      .catch(() => {}); // gracefully degrade offline
  }, []);

  // ── Real-time GPS via browser Geolocation API ─────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported by this browser');
      setGpsLoading(false);
      return;
    }

    setGpsLoading(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setGpsPosition({ lat, lng });
        setGpsAccuracy(accuracy);
        setGpsError(null);
        setGpsLoading(false);
        // First fix — fly map to user location
        setMapCenter([lat, lng]);
      },
      (err) => {
        setGpsError(err.code === 1 ? 'Location permission denied' : 'Unable to get location');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // ── Validation ─────────────────────────────────────────
  const warnings = missionService.validateMission(waypoints);
  const errors   = warnings.filter(w => w.severity === 'error');

  // ── Map click handler ──────────────────────────────────
  const handleMapClick = useCallback(({ lat, lng }) => {
    if (activeTool === TOOLS.WAYPOINT) {
      const seq = waypoints.length;
      const wp = {
        id:       `wp-${++wpIdCounter}`,
        seq,
        label:    seq === 0 ? 'Takeoff' : `WP${seq}`,
        lat,
        lng,
        alt:      defaultAlt,
        speed:    defaultSpeed,
        holdTime: 0,
        action:   'FLY_THROUGH',
        // Keep legacy fields for missionService compat
        x: lat, y: lng, z: defaultAlt,
        svgX: 0, svgY: 0,
        param1: 0,
      };
      setWaypoints(wps => [...wps, wp]);
      toast.success(`${wp.label} placed at ${lat.toFixed(5)}, ${lng.toFixed(5)}`, { duration: 1500 });
    } else if (activeTool === TOOLS.POLYGON) {
      setPolygon(pts => [...pts, { lat, lng }]);
    }
  }, [activeTool, defaultAlt, defaultSpeed, waypoints.length]);

  // ── Mission ops (cloud + localStorage) ─────────────────
  const handleSave = async () => {
    if (!waypoints.length) { toast.error('No waypoints to save'); return; }
    setCloudLoading(true);
    try {
      const dist = totalMissionDistance(waypoints);
      const payload = {
        name:             `Mission ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        waypoints:        waypoints.map(({ id, svgX, svgY, x, y, z, param1, ...rest }) => rest),
        boundaryPolygon:  polygon.map(p => [p.lat, p.lng]),
        totalDistanceM:   Math.round(dist),
        estimatedTimeMin: Math.round(dist / 5 / 60),
        coverageAreaHa:   parseFloat((dist * 0.005).toFixed(2)),
        waterRequiredL:   parseFloat((dist / 100 * 0.5).toFixed(1)),
        originLat:        gpsPosition?.lat,
        originLng:        gpsPosition?.lng,
      };
      const res = await droneApi.saveMissionToCloud(payload);
      if (res.success) {
        toast.success(res.message || 'Mission saved to cloud ☁');
        setActiveMissionId(res.mission._id);
        setCloudMissions(prev => [res.mission, ...prev]);
        // also save locally as backup
        missionService.saveMission(waypoints, { waypointCount: waypoints.length });
      } else {
        toast.error('Cloud save failed — saved locally instead');
        missionService.saveMission(waypoints, { waypointCount: waypoints.length });
      }
    } catch {
      toast.error('Backend offline — saved locally');
      missionService.saveMission(waypoints, { waypointCount: waypoints.length });
    } finally {
      setCloudLoading(false);
    }
  };

  const handleLoad = async () => {
    // Show cloud mission picker
    setCloudLoading(true);
    try {
      const res = await droneApi.getMissions();
      if (res.success && res.missions.length > 0) {
        setCloudMissions(res.missions);
        setShowMissionList(true);
      } else {
        // Fallback to localStorage
        const local = missionService.loadMission();
        if (local.success) { setWaypoints(local.mission.waypoints || []); toast.success('Loaded from local storage'); }
        else toast.error('No saved missions found');
      }
    } catch {
      const local = missionService.loadMission();
      if (local.success) { setWaypoints(local.mission.waypoints || []); toast.success('Loaded from local storage (offline)'); }
      else toast.error('Backend offline — no local mission either');
    } finally {
      setCloudLoading(false);
    }
  };

  const handleLoadCloudMission = async (missionId) => {
    try {
      const res = await droneApi.getMission(missionId);
      if (res.success) {
        const wps = (res.mission.waypoints || []).map((wp, i) => ({
          ...wp,
          id:   `wp-${++wpIdCounter}`,
          x: wp.lat, y: wp.lng, z: wp.alt,
          svgX: 0, svgY: 0, param1: 0,
        }));
        setWaypoints(wps);
        setActiveMissionId(missionId);
        setShowMissionList(false);
        toast.success(`"${res.mission.name}" loaded from cloud`);
      }
    } catch {
      toast.error('Failed to load mission');
    }
  };

  const handleDeleteCloudMission = async (missionId, e) => {
    e.stopPropagation();
    try {
      const res = await droneApi.deleteMission(missionId);
      if (res.success) {
        setCloudMissions(prev => prev.filter(m => m._id !== missionId));
        if (activeMissionId === missionId) setActiveMissionId(null);
        toast.success('Mission deleted from cloud');
      }
    } catch {
      toast.error('Failed to delete mission');
    }
  };

  // ── Waypoint operations ────────────────────────────────
  const handleWpUpdate = useCallback((updated) => {
    setWaypoints(wps => wps.map(wp => wp.id === updated.id ? { ...updated, x: updated.lat, y: updated.lng, z: updated.alt } : wp));
  }, []);

  const handleWpDelete = useCallback((wpId) => {
    setWaypoints(wps => {
      const filtered = wps.filter(wp => wp.id !== wpId);
      // renumber
      return filtered.map((wp, i) => ({ ...wp, seq: i, label: i === 0 ? 'Takeoff' : `WP${i}` }));
    });
    setSelectedWpId(null);
    setEditingWpId(null);
    toast.success('Waypoint deleted');
  }, []);

  // ── Fly to GPS location ────────────────────────────────
  const handleLocate = () => {
    if (gpsPosition) {
      setMapCenter([gpsPosition.lat, gpsPosition.lng]);
      setFlyTrigger(t => t + 1);
      toast.success(`Centered on your location (±${Math.round(gpsAccuracy || 0)}m)`);
    } else {
      toast.error(gpsError || 'GPS not ready yet');
    }
  };

  // ── Polygon coverage ───────────────────────────────────
  const handleClosePolygon = () => {
    if (polygon.length < 3) { toast.error('Draw at least 3 corners'); return; }
    setActiveTool(TOOLS.SELECT);
    toast.success(`Boundary defined — ${polygon.length} corners`);
  };

  const handleGenerateCoverage = async () => {
    if (polygon.length < 3) { toast.error('Define a polygon boundary first'); return; }
    setGenerating(true);
    await new Promise(r => setTimeout(r, 600));

    // Boustrophedon lawnmower pattern in GPS space
    const lats = polygon.map(p => p.lat);
    const lngs = polygon.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const stripDeg = 0.00040; // ~45m between strips
    const newWps = [];
    let row = 0;
    for (let lat = minLat; lat <= maxLat; lat += stripDeg) {
      const leftRight = row % 2 === 0
        ? [minLng, maxLng]
        : [maxLng, minLng];
      leftRight.forEach(lng => {
        const i = newWps.length;
        newWps.push({
          id:       `wp-${++wpIdCounter}`,
          seq:      i,
          label:    i === 0 ? 'Takeoff' : `WP${i}`,
          lat, lng,
          alt:      defaultAlt,
          speed:    defaultSpeed,
          holdTime: 0,
          action:   'START_SPRINKLING',
          x: lat, y: lng, z: defaultAlt, svgX: 0, svgY: 0, param1: 0,
        });
      });
      row++;
    }
    setWaypoints(newWps);
    setGenerating(false);
    toast.success(`Coverage path generated — ${newWps.length} waypoints`);
  };

  // ── Mission ops ────────────────────────────────────────
  const handleSave = () => {
    const result = missionService.saveMission(waypoints, { waypointCount: waypoints.length });
    toast[result.success ? 'success' : 'error'](result.message);
  };

  const handleLoad = () => {
    const result = missionService.loadMission();
    if (result.success) { setWaypoints(result.mission.waypoints || []); toast.success('Mission loaded'); }
    else toast.error(result.message);
  };

  const handleExport = () => {
    if (!waypoints.length) { toast.error('No waypoints to export'); return; }
    const result = missionService.exportMissionAsJSON(waypoints);
    if (result.success) toast.success(result.message);
  };

  const handleClear = () => {
    setWaypoints([]); setPolygon([]);
    setSelectedWpId(null); setEditingWpId(null);
    toast.success('Mission cleared');
  };

  // ── Simulation ─────────────────────────────────────────
  const handleSimulate = () => {
    if (waypoints.length < 2) { toast.error('Need at least 2 waypoints'); return; }
    setSimulating(true); setSimWpIndex(0);
    let i = 0;
    simRef.current = setInterval(() => {
      i++;
      if (i >= waypoints.length) { clearInterval(simRef.current); setSimulating(false); setSimWpIndex(-1); toast.success('Simulation complete'); }
      else setSimWpIndex(i);
    }, 900);
  };

  const handleStopSimulate = () => { clearInterval(simRef.current); setSimulating(false); setSimWpIndex(-1); };
  useEffect(() => () => clearInterval(simRef.current), []);

  const editingWp = waypoints.find(wp => wp.id === editingWpId);

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full">

      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-400/10 border border-blue-500/30 flex items-center justify-center">
              <Map size={20} className="text-blue-400" />
            </div>
            Mission Planner
          </h2>
          <p className="text-slate-400 mt-1">Real-time GPS mission planning with OpenStreetMap satellite view</p>
        </div>

        {/* GPS status chip */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
            gpsLoading ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
            gpsError   ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                         'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            {gpsLoading ? <Loader2 size={12} className="animate-spin" /> : <Locate size={12} />}
            {gpsLoading ? 'Getting GPS…' :
             gpsError   ? gpsError :
             `GPS ±${Math.round(gpsAccuracy || 0)}m — ${gpsPosition?.lat.toFixed(5)}, ${gpsPosition?.lng.toFixed(5)}`}
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300">
            {waypoints.length} WP{waypoints.length !== 1 ? 's' : ''}
          </span>
          {errors.length > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              {errors.length} Error{errors.length > 1 ? 's' : ''}
            </span>
          )}
          {cloudMissions.length > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold flex items-center gap-1.5">
              ☁ {cloudMissions.length} saved
            </span>
          )}
        </div>
      </motion.div>

      {/* ── CLOUD MISSION PICKER MODAL ───────────────────── */}
      <AnimatePresence>
        {showMissionList && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowMissionList(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2"><Upload size={16} className="text-blue-400" />Cloud Missions</h3>
                <button onClick={() => setShowMissionList(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {cloudMissions.map(m => (
                  <div key={m._id}
                    onClick={() => handleLoadCloudMission(m._id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      activeMissionId === m._id
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{m.name}</p>
                      <p className="text-slate-500 text-xs">
                        {m.waypoints?.length || 0} WPs · {m.totalDistanceM ? Math.round(m.totalDistanceM) + 'm' : '—'} · {new Date(m.updatedAt || m.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {activeMissionId === m._id && <CheckCircle2 size={14} className="text-emerald-400" />}
                      <button onClick={e => handleDeleteCloudMission(m._id, e)}
                        className="p-1 rounded-lg text-red-500/60 hover:text-red-400 hover:bg-red-500/10 transition">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOOLBAR ─────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="p-3 mb-4" hover={false}>
          <div className="flex flex-wrap items-center gap-2">

            {/* Tool selector */}
            <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
              {[
                { tool: TOOLS.SELECT,   icon: Move,    label: 'Select' },
                { tool: TOOLS.WAYPOINT, icon: MapPin,  label: 'Waypoint' },
                { tool: TOOLS.POLYGON,  icon: Hexagon, label: 'Polygon' },
              ].map(({ tool, icon: Icon, label }) => (
                <button key={tool} onClick={() => setActiveTool(tool)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    activeTool === tool
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-700" />

            {/* Map layer selector */}
            <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
              {Object.entries(MAP_LAYERS).map(([key, { label }]) => (
                <button key={key} onClick={() => setActiveLayer(key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${
                    activeLayer === key ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}>
                  {key === 'satellite' ? <Satellite size={11} /> : <Layers size={11} />}
                  {label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-700" />

            {/* Default params */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Alt:</span>
              <input type="number" min="5" max="120" value={defaultAlt}
                onChange={e => setDefaultAlt(parseInt(e.target.value) || 30)}
                className="w-14 bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500" />
              <span>m</span>
              <span className="ml-1">Speed:</span>
              <input type="number" min="1" max="15" step="0.5" value={defaultSpeed}
                onChange={e => setDefaultSpeed(parseFloat(e.target.value) || 5)}
                className="w-14 bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500" />
              <span>m/s</span>
            </div>

            <div className="h-6 w-px bg-slate-700" />

            {/* View toggles */}
            {[{ label: 'Path', state: showPath, toggle: () => setShowPath(v => !v) },
              { label: 'Labels', state: showLabels, toggle: () => setShowLabels(v => !v) }].map(({ label, state, toggle }) => (
              <button key={label} onClick={toggle}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${state ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}>
                {label}
              </button>
            ))}

            {/* Polygon actions */}
            {activeTool === TOOLS.POLYGON && (<>
              <div className="h-6 w-px bg-slate-700" />
              <button onClick={handleClosePolygon}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 transition">
                Close Polygon
              </button>
              <button onClick={handleGenerateCoverage} disabled={generating || polygon.length < 3}
                className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold hover:bg-blue-500/25 transition disabled:opacity-50 flex items-center gap-1.5">
                {generating ? <Loader2 size={12} className="animate-spin" /> : <Grid size={12} />}
                Gen Coverage
              </button>
            </>)}

            {/* GPS locate button */}
            <div className="ml-auto flex gap-1.5">
              <button onClick={handleLocate} disabled={!gpsPosition}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold hover:bg-blue-500/25 transition disabled:opacity-40">
                <Locate size={12} /> My Location
              </button>

              {simulating ? (
                <button onClick={handleStopSimulate}
                  className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/25 transition flex items-center gap-1.5">
                  <Square size={12} /> Stop Sim
                </button>
              ) : (
                <button onClick={handleSimulate} disabled={waypoints.length < 2}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/25 transition disabled:opacity-50 flex items-center gap-1.5">
                  <Play size={12} /> Simulate
                </button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── MAIN SPLIT ──────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* MAP — 2/3 width */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="overflow-hidden p-0" hover={false}>
            {/* Map header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/60 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Satellite size={12} className="text-blue-400" />
                <span>{MAP_LAYERS[activeLayer].label} View</span>
                {gpsPosition && (
                  <>
                    <span className="text-slate-600">|</span>
                    <span className="text-emerald-400 font-mono">
                      {gpsPosition.lat.toFixed(5)}, {gpsPosition.lng.toFixed(5)}
                    </span>
                  </>
                )}
                {simulating && (
                  <span className="ml-2 text-purple-400 font-semibold animate-pulse">
                    ▶ Simulating → {waypoints[simWpIndex]?.label}
                  </span>
                )}
              </div>
              <span className="text-slate-500">
                {activeTool === TOOLS.WAYPOINT ? '✦ Click map to place waypoint' :
                 activeTool === TOOLS.POLYGON  ? '✦ Click to draw boundary corners' :
                 '✦ Select tool active'}
              </span>
            </div>

            {/* Leaflet map */}
            <div style={{ height: '500px' }}>
              <MapContainer
                center={mapCenter}
                zoom={15}
                style={{ height: '100%', width: '100%', background: '#0a0f1a' }}
                zoomControl={true}
              >
                {/* Tile layer */}
                <TileLayer
                  key={activeLayer}
                  url={MAP_LAYERS[activeLayer].url}
                  attribution={MAP_LAYERS[activeLayer].attr}
                  maxZoom={20}
                />

                {/* Fly-to GPS on locate button */}
                <FlyToLocation position={mapCenter} trigger={flyTrigger} />

                {/* Cursor + click handler */}
                <CursorController activeTool={activeTool} />
                <MapClickHandler activeTool={activeTool} onMapClick={handleMapClick} />

                {/* Real-time GPS marker */}
                {gpsPosition && (
                  <>
                    <Marker position={[gpsPosition.lat, gpsPosition.lng]} icon={gpsIcon}>
                      <Tooltip permanent direction="top" offset={[0, -14]} className="leaflet-tooltip-dark">
                        <span className="text-xs font-mono text-blue-300">You are here</span>
                      </Tooltip>
                    </Marker>
                    {gpsAccuracy && (
                      <Circle
                        center={[gpsPosition.lat, gpsPosition.lng]}
                        radius={gpsAccuracy}
                        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1, dashArray: '4 4' }}
                      />
                    )}
                  </>
                )}

                {/* Mission path polyline */}
                {showPath && waypoints.length >= 2 && (
                  <Polyline
                    positions={waypoints.map(wp => [wp.lat, wp.lng])}
                    pathOptions={{ color: '#10b981', weight: 2.5, opacity: 0.8, dashArray: '8 4' }}
                  />
                )}

                {/* Polygon area */}
                {polygon.length >= 2 && (
                  <Polygon
                    positions={polygon.map(p => [p.lat, p.lng])}
                    pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1, weight: 1.5 }}
                  />
                )}

                {/* Simulation highlight */}
                {simulating && simWpIndex >= 0 && simWpIndex < waypoints.length && (
                  <Circle
                    center={[waypoints[simWpIndex].lat, waypoints[simWpIndex].lng]}
                    radius={20}
                    pathOptions={{ color: '#facc15', fillColor: '#facc15', fillOpacity: 0.4, weight: 2 }}
                  />
                )}

                {/* Waypoint markers */}
                {waypoints.map((wp, i) => {
                  const color = ACTION_COLORS[wp.action] || '#10b981';
                  const isSelected = wp.id === selectedWpId;
                  return (
                    <Marker
                      key={wp.id}
                      position={[wp.lat, wp.lng]}
                      icon={makeWpIcon(i === 0 ? 0 : i, color, isSelected)}
                      eventHandlers={{
                        click: () => {
                          setSelectedWpId(isSelected ? null : wp.id);
                          setEditingWpId(wp.id);
                        },
                      }}
                    >
                      {showLabels && (
                        <Tooltip permanent direction="top" offset={[0, -18]} className="leaflet-tooltip-dark">
                          <span className="text-xs font-mono" style={{ color }}>
                            {wp.label} · {wp.alt}m
                          </span>
                        </Tooltip>
                      )}
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </Card>
        </motion.div>

        {/* RIGHT PANEL — 1/3 */}
        <div className="lg:col-span-1 space-y-4">

          {/* Waypoint Editor */}
          <motion.div variants={itemVariants}>
            <AnimatePresence mode="wait">
              {editingWp ? (
                <WaypointEditor key={editingWp.id} waypoint={editingWp}
                  onUpdate={handleWpUpdate} onDelete={handleWpDelete}
                  onClose={() => setEditingWpId(null)} />
              ) : (
                <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center">
                  <Edit3 size={22} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">
                    {activeTool === TOOLS.SELECT ? 'Click a waypoint marker to edit it' : 'Switch to Select tool to edit waypoints'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Waypoint list */}
          <motion.div variants={itemVariants}>
            <Card className="p-4" hover={false}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Navigation size={14} className="text-emerald-400" />
                  Waypoints ({waypoints.length})
                </h3>
                {waypoints.length > 0 && (
                  <button onClick={handleClear} className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1">
                    <Trash2 size={10} /> Clear
                  </button>
                )}
              </div>

              {waypoints.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-4">Use the Waypoint tool and click the map</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {waypoints.map((wp, i) => {
                    const color = ACTION_COLORS[wp.action] || '#10b981';
                    const isSelected = wp.id === selectedWpId;
                    const dist = i > 0 ? haversineDistance(waypoints[i - 1], wp) : 0;
                    return (
                      <motion.button key={wp.id} whileHover={{ x: 2 }}
                        onClick={() => { setSelectedWpId(isSelected ? null : wp.id); setEditingWpId(wp.id); }}
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition ${
                          isSelected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        }`}>
                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black text-black" style={{ backgroundColor: color }}>
                          {i === 0 ? 'T' : i}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-xs font-semibold">{wp.label}</span>
                            <span className="text-slate-500 text-xs">{wp.alt}m</span>
                          </div>
                          <p className="text-slate-500 text-xs font-mono truncate">
                            {wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}
                          </p>
                        </div>
                        {i > 0 && <span className="text-slate-600 text-xs flex-shrink-0">{Math.round(dist)}m</span>}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>

          {/* GPS Info card */}
          <motion.div variants={itemVariants}>
            <Card className="p-4" hover={false}>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Locate size={14} className="text-blue-400" />
                GPS Position
              </h3>
              {gpsLoading ? (
                <div className="flex items-center gap-2 text-amber-400 text-xs"><Loader2 size={12} className="animate-spin" />Acquiring GPS signal…</div>
              ) : gpsError ? (
                <div className="text-red-400 text-xs">{gpsError}</div>
              ) : gpsPosition ? (
                <div className="space-y-2">
                  {[
                    ['Latitude',  gpsPosition.lat.toFixed(7) + '°', 'text-emerald-400'],
                    ['Longitude', gpsPosition.lng.toFixed(7) + '°', 'text-emerald-400'],
                    ['Accuracy',  `±${Math.round(gpsAccuracy || 0)} m`, gpsAccuracy < 20 ? 'text-emerald-400' : gpsAccuracy < 50 ? 'text-amber-400' : 'text-red-400'],
                  ].map(([label, value, cls]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-slate-500 text-xs">{label}</span>
                      <span className={`text-xs font-mono font-bold ${cls}`}>{value}</span>
                    </div>
                  ))}
                  <button onClick={handleLocate}
                    className="w-full mt-2 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold hover:bg-blue-500/25 transition flex items-center justify-center gap-1.5">
                    <Crosshair size={12} /> Centre Map on Me
                  </button>
                </div>
              ) : null}
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ── BOTTOM: SUMMARY + VALIDATION + OPS ──────────── */}
      <div className="grid lg:grid-cols-2 gap-5 mt-5">

        {/* Mission Summary */}
        <motion.div variants={itemVariants}>
          <Card className="p-5" hover={false}>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Activity size={14} className="text-emerald-400" />Mission Summary
            </h3>
            {waypoints.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Add waypoints on the map to see summary</p>
            ) : (
              <MissionSummary waypoints={waypoints} />
            )}
          </Card>
        </motion.div>

        {/* Validation + Operations */}
        <motion.div variants={itemVariants} className="space-y-4">
          <Card className="p-5" hover={false}>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Shield size={14} className="text-purple-400" />Validation
            </h3>
            <ValidationPanel warnings={warnings} />
          </Card>

          <Card className="p-5" hover={false}>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Zap size={14} className="text-amber-400" />Operations
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Save', icon: Save, action: handleSave, disabled: !waypoints.length, cls: 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600' },
                { label: 'Load', icon: Upload, action: handleLoad, disabled: false, cls: 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600' },
                { label: 'Export', icon: FileJson, action: handleExport, disabled: !waypoints.length, cls: 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600' },
                { label: 'Clear', icon: RotateCcw, action: handleClear, disabled: !waypoints.length, cls: 'bg-red-500/10 border-red-500/20 text-red-400 hover:border-red-500/40' },
                { label: simulating ? 'Stop' : 'Simulate', icon: simulating ? Square : Play, action: simulating ? handleStopSimulate : handleSimulate, disabled: !simulating && waypoints.length < 2, cls: 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:border-purple-500/40' },
                { label: 'Generate', icon: Zap, action: () => toast.success(`Mission ready — ${waypoints.length} waypoints`), disabled: !waypoints.length || errors.length > 0, cls: 'bg-gradient-to-br from-emerald-500/20 to-lime-500/10 border-emerald-500/30 text-emerald-300 hover:border-emerald-400/50' },
              ].map(({ label, icon: Icon, action, disabled, cls }) => (
                <button key={label} onClick={action} disabled={disabled}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition disabled:opacity-40 text-xs font-semibold ${cls}`}>
                  <Icon size={16} />{label}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Leaflet tooltip dark style injected */}
      <style>{`
        .leaflet-tooltip-dark {
          background: rgba(15,23,42,0.92) !important;
          border: 1px solid #334155 !important;
          color: #e2e8f0 !important;
          border-radius: 6px !important;
          font-size: 11px !important;
          padding: 3px 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
          white-space: nowrap !important;
        }
        .leaflet-tooltip-dark::before {
          border-top-color: #334155 !important;
        }
        .leaflet-container {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </motion.div>
  );
};

export default MissionPlannerAgent;
