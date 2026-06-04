import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import {
  Map, Plus, Trash2, Edit3, Move, Download, Save, Upload,
  Play, RotateCcw, CheckCircle2, AlertTriangle, AlertCircle,
  Info, Crosshair, Navigation, Clock, Battery, Droplets,
  MapPin, Layers, Grid, Target, Zap, ChevronDown, ChevronUp,
  Eye, EyeOff, Ruler, Activity, X, Check, FileJson, Loader2,
  Square, Circle, Pentagon
} from 'lucide-react';
import { containerVariants, itemVariants } from '../../animations/variants';
import toast from 'react-hot-toast';
import * as missionService from '../../services/missionService';

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────

const MAP_W = 800;
const MAP_H = 520;
const SCALE = 1;         // 1 SVG unit = 1 meter
const GRID_SPACING = 50; // pixels between grid lines = 50m
const WP_RADIUS = 14;

const TOOLS = {
  SELECT:   'select',
  WAYPOINT: 'waypoint',
  POLYGON:  'polygon',
  PAN:      'pan',
};

const ACTION_COLORS = {
  FLY_THROUGH:      '#10b981', // emerald
  HOVER:            '#3b82f6', // blue
  CAPTURE_IMAGE:    '#a855f7', // purple
  START_SPRINKLING: '#06b6d4', // cyan
  STOP_SPRINKLING:  '#f97316', // orange
  RETURN_HOME:      '#f59e0b', // amber
};

// ─────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────

const svgToGPS = (svgX, svgY) => {
  // Simulated origin: center of a farm (replace with real GPS reference)
  const originLat = 18.5204;
  const originLng = 73.8567;
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos((originLat * Math.PI) / 180);
  return {
    lat: originLat + (svgY - MAP_H / 2) / metersPerDegLat,
    lng: originLng + (svgX - MAP_W / 2) / metersPerDegLng,
  };
};

const distanceBetween = (a, b) => {
  const dx = (b.svgX - a.svgX) * SCALE;
  const dy = (b.svgY - a.svgY) * SCALE;
  return Math.sqrt(dx * dx + dy * dy);
};

const formatDist = (m) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`);

// ─────────────────────────────────────────────────────────
// SVG MAP COMPONENT
// ─────────────────────────────────────────────────────────

const MissionMap = ({
  waypoints, polygon, activeTool, selectedWpId,
  onMapClick, onWpClick, onWpDrag,
  showGrid, showLabels, showPath,
}) => {
  const svgRef = useRef(null);
  const draggingRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const getSVGPoint = (e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      svgX: Math.round(((e.clientX - rect.left) / rect.width) * MAP_W),
      svgY: Math.round(((e.clientY - rect.top) / rect.height) * MAP_H),
    };
  };

  const handleSVGClick = (e) => {
    if (isDragging) return;
    if (e.target === svgRef.current || e.target.classList.contains('map-bg') || e.target.classList.contains('grid-line')) {
      const pt = getSVGPoint(e);
      if (pt) onMapClick(pt);
    }
  };

  const handleWpMouseDown = (e, wpId) => {
    e.stopPropagation();
    if (activeTool !== TOOLS.SELECT) return;
    draggingRef.current = wpId;
  };

  const handleMouseMove = (e) => {
    if (!draggingRef.current) return;
    setIsDragging(true);
    const pt = getSVGPoint(e);
    if (pt) onWpDrag(draggingRef.current, pt);
  };

  const handleMouseUp = (e) => {
    draggingRef.current = null;
    setTimeout(() => setIsDragging(false), 50);
  };

  const handleWpClick = (e, wpId) => {
    e.stopPropagation();
    if (!isDragging) onWpClick(wpId);
  };

  // Path polyline points string
  const pathPoints = waypoints.map((wp) => `${wp.svgX},${wp.svgY}`).join(' ');

  // Total distances for labels
  const distances = waypoints.map((wp, i) => {
    if (i === 0) return 0;
    return distanceBetween(waypoints[i - 1], wp);
  });

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      className={`w-full h-full select-none ${activeTool === TOOLS.WAYPOINT ? 'cursor-crosshair' : activeTool === TOOLS.SELECT ? 'cursor-default' : 'cursor-grab'}`}
      onClick={handleSVGClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="#0a0f1a" className="map-bg" />

      {/* Grid */}
      {showGrid && (
        <g opacity="0.25">
          {Array.from({ length: Math.ceil(MAP_W / GRID_SPACING) + 1 }, (_, i) => i * GRID_SPACING).map((x) => (
            <line key={`vg${x}`} x1={x} y1={0} x2={x} y2={MAP_H} stroke="#1e3a2f" strokeWidth="1" className="grid-line" />
          ))}
          {Array.from({ length: Math.ceil(MAP_H / GRID_SPACING) + 1 }, (_, i) => i * GRID_SPACING).map((y) => (
            <line key={`hg${y}`} x1={0} y1={y} x2={MAP_W} y2={y} stroke="#1e3a2f" strokeWidth="1" className="grid-line" />
          ))}
          {/* Grid scale labels */}
          {[1, 2, 3, 4, 5].map((i) => (
            <text key={`gl${i}`} x={i * GRID_SPACING + 2} y={MAP_H - 4} fontSize="9" fill="#1e4d3a" fontFamily="monospace">
              {i * GRID_SPACING * SCALE}m
            </text>
          ))}
        </g>
      )}

      {/* Compass */}
      <g transform={`translate(${MAP_W - 40}, 36)`}>
        <circle cx="0" cy="0" r="20" fill="#0f1e2e" stroke="#1e3a2f" strokeWidth="1" />
        <text x="0" y="-8" textAnchor="middle" fontSize="9" fill="#10b981" fontWeight="bold">N</text>
        <text x="0" y="14" textAnchor="middle" fontSize="8" fill="#64748b">S</text>
        <text x="11" y="3" textAnchor="middle" fontSize="8" fill="#64748b">E</text>
        <text x="-11" y="3" textAnchor="middle" fontSize="8" fill="#64748b">W</text>
        <polygon points="0,-12 -3,-2 0,2 3,-2" fill="#10b981" />
        <polygon points="0,12 -3,2 0,-2 3,2" fill="#475569" />
      </g>

      {/* Scale bar */}
      <g transform={`translate(16, ${MAP_H - 20})`}>
        <line x1="0" y1="0" x2={GRID_SPACING} y2="0" stroke="#10b981" strokeWidth="2" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke="#10b981" strokeWidth="1.5" />
        <line x1={GRID_SPACING} y1="-4" x2={GRID_SPACING} y2="4" stroke="#10b981" strokeWidth="1.5" />
        <text x={GRID_SPACING / 2} y="-7" textAnchor="middle" fontSize="9" fill="#10b981" fontFamily="monospace">
          {GRID_SPACING * SCALE}m
        </text>
      </g>

      {/* Home marker */}
      <g transform={`translate(${MAP_W / 2}, ${MAP_H / 2})`}>
        <circle cx="0" cy="0" r="8" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5" />
        <text x="0" y="4" textAnchor="middle" fontSize="10" fill="#10b981" fontWeight="bold">H</text>
      </g>

      {/* Polygon area */}
      {polygon.length >= 2 && (
        <>
          <polygon
            points={polygon.map((p) => `${p.svgX},${p.svgY}`).join(' ')}
            fill="#10b981" fillOpacity="0.07"
            stroke="#10b981" strokeWidth="1.5"
            strokeDasharray={polygon.length < 3 ? '6,4' : undefined}
          />
          {polygon.map((p, i) => (
            <circle key={`poly${i}`} cx={p.svgX} cy={p.svgY} r="5"
              fill="#10b981" fillOpacity="0.5" stroke="#10b981" strokeWidth="1" />
          ))}
        </>
      )}

      {/* Mission path */}
      {showPath && waypoints.length >= 2 && (
        <>
          <polyline
            points={pathPoints}
            fill="none" stroke="#10b981" strokeWidth="1.5"
            strokeDasharray="6,3" opacity="0.6"
          />
          {/* Arrows along path */}
          {waypoints.slice(1).map((wp, i) => {
            const prev = waypoints[i];
            const mx = (prev.svgX + wp.svgX) / 2;
            const my = (prev.svgY + wp.svgY) / 2;
            const angle = Math.atan2(wp.svgY - prev.svgY, wp.svgX - prev.svgX) * (180 / Math.PI);
            return (
              <g key={`arrow${i}`} transform={`translate(${mx},${my}) rotate(${angle})`}>
                <polygon points="0,-3 6,0 0,3" fill="#10b981" opacity="0.7" />
              </g>
            );
          })}

          {/* Distance labels between waypoints */}
          {showLabels && waypoints.slice(1).map((wp, i) => {
            const prev = waypoints[i];
            const mx = (prev.svgX + wp.svgX) / 2;
            const my = (prev.svgY + wp.svgY) / 2;
            const d = Math.round(distances[i + 1]);
            return (
              <g key={`dist${i}`}>
                <rect x={mx - 20} y={my - 12} width="40" height="13" rx="3" fill="#0f1e2e" fillOpacity="0.85" />
                <text x={mx} y={my - 2} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                  {d}m
                </text>
              </g>
            );
          })}
        </>
      )}

      {/* Waypoint nodes */}
      {waypoints.map((wp, i) => {
        const isSelected = wp.id === selectedWpId;
        const color = ACTION_COLORS[wp.action] || '#10b981';
        const isHome = i === 0;

        return (
          <g
            key={wp.id}
            transform={`translate(${wp.svgX}, ${wp.svgY})`}
            onMouseDown={(e) => handleWpMouseDown(e, wp.id)}
            onClick={(e) => handleWpClick(e, wp.id)}
            style={{ cursor: activeTool === TOOLS.SELECT ? 'pointer' : 'default' }}
          >
            {/* Selection ring */}
            {isSelected && (
              <circle cx="0" cy="0" r={WP_RADIUS + 5} fill="none" stroke={color} strokeWidth="2" strokeDasharray="4,2" opacity="0.8">
                <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Waypoint circle */}
            <circle
              cx="0" cy="0" r={WP_RADIUS}
              fill={color} fillOpacity={isSelected ? 0.9 : 0.7}
              stroke={color} strokeWidth={isSelected ? 2 : 1.5}
            />

            {/* Waypoint number */}
            <text x="0" y="4" textAnchor="middle" fontSize="11" fill="#000" fontWeight="bold" fontFamily="monospace">
              {isHome ? 'T' : i}
            </text>

            {/* Label */}
            {showLabels && (
              <g transform="translate(0, -24)">
                <rect x="-18" y="-10" width="36" height="12" rx="2" fill="#0a0f1a" fillOpacity="0.85" />
                <text x="0" y="0" textAnchor="middle" fontSize="9" fill="#e2e8f0" fontFamily="monospace">
                  {wp.label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Placement hint */}
      {activeTool === TOOLS.WAYPOINT && (
        <text x={MAP_W / 2} y="22" textAnchor="middle" fontSize="11" fill="#10b981" fontFamily="monospace" opacity="0.7">
          ✦ Click to place waypoint
        </text>
      )}
      {activeTool === TOOLS.POLYGON && (
        <text x={MAP_W / 2} y="22" textAnchor="middle" fontSize="11" fill="#10b981" fontFamily="monospace" opacity="0.7">
          ✦ Click to define boundary corners — click first point to close
        </text>
      )}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────
// WAYPOINT EDITOR PANEL
// ─────────────────────────────────────────────────────────

const WaypointEditor = ({ waypoint, onUpdate, onDelete, onClose }) => {
  const [form, setForm] = useState({ ...waypoint });

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
  };

  const handleSave = () => {
    onUpdate({ ...form, z: parseFloat(form.z), speed: parseFloat(form.speed), param1: parseFloat(form.param1) });
    onClose();
    toast.success(`${form.label} updated`);
  };

  const ActionOption = ({ action }) => {
    const color = ACTION_COLORS[action.value] || '#10b981';
    return (
      <button
        onClick={() => handleChange('action', action.value)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
          form.action === action.value
            ? 'text-white border-opacity-80'
            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
        }`}
        style={form.action === action.value ? { backgroundColor: `${color}22`, borderColor: `${color}66`, color } : {}}
      >
        {action.label}
      </button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-white flex items-center gap-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-black"
            style={{ backgroundColor: ACTION_COLORS[form.action] || '#10b981' }}>
            {waypoint.seq}
          </div>
          Editing {form.label}
        </h4>
        <div className="flex gap-1">
          <button onClick={handleSave} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition">
            <Check size={14} />
          </button>
          <button onClick={() => { onDelete(waypoint.id); onClose(); }} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition">
            <Trash2 size={14} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 transition">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Latitude', field: 'x', unit: '°', step: 0.0001 },
          { label: 'Longitude', field: 'y', unit: '°', step: 0.0001 },
        ].map(({ label, field, unit, step }) => (
          <div key={field}>
            <label className="text-xs text-slate-500 font-medium mb-1 block">{label}</label>
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <input
                type="number" step={step}
                value={parseFloat(form[field]).toFixed(6)}
                onChange={(e) => handleChange(field, parseFloat(e.target.value))}
                className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-white focus:outline-none min-w-0"
              />
              <span className="text-slate-500 pr-2 text-xs">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Flight params */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Altitude', field: 'z', unit: 'm', step: 1 },
          { label: 'Speed', field: 'speed', unit: 'm/s', step: 0.5 },
          { label: 'Hold Time', field: 'param1', unit: 's', step: 1 },
        ].map(({ label, field, unit, step }) => (
          <div key={field}>
            <label className="text-xs text-slate-500 font-medium mb-1 block">{label}</label>
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <input
                type="number" step={step} min="0"
                value={form[field]}
                onChange={(e) => handleChange(field, parseFloat(e.target.value) || 0)}
                className="flex-1 bg-transparent px-2 py-1.5 text-xs text-white focus:outline-none min-w-0"
              />
              <span className="text-slate-500 pr-1.5 text-xs">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action type */}
      <div>
        <label className="text-xs text-slate-500 font-medium mb-2 block">Action at Waypoint</label>
        <div className="flex flex-wrap gap-1.5">
          {missionService.WAYPOINT_ACTIONS.map((action) => (
            <ActionOption key={action.value} action={action} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────
// MISSION SUMMARY PANEL
// ─────────────────────────────────────────────────────────

const MissionSummary = ({ waypoints }) => {
  const totalDist  = missionService.calculateTotalDistance(waypoints, SCALE);
  const flightTime = missionService.estimateFlightTime(totalDist);
  const area       = missionService.estimateCoverageArea(waypoints, 5, SCALE);
  const battery    = missionService.estimateBattery(flightTime);
  const water      = missionService.estimateWater(parseFloat(area) || 0);

  const items = [
    { label: 'Total Distance',    value: formatDist(totalDist),             icon: Ruler,    color: 'text-emerald-400' },
    { label: 'Est. Flight Time',  value: `~${flightTime} min`,              icon: Clock,    color: 'text-blue-400' },
    { label: 'Waypoints',         value: waypoints.length,                  icon: MapPin,   color: 'text-purple-400' },
    { label: 'Coverage Area',     value: `~${area} ha`,                     icon: Grid,     color: 'text-cyan-400' },
    { label: 'Battery Estimate',  value: `~${battery}%`,                    icon: Battery,  color: battery > 80 ? 'text-red-400' : 'text-amber-400' },
    { label: 'Water Required',    value: `~${water} L`,                     icon: Droplets, color: 'text-cyan-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {items.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon size={12} className={color} />
            <span className="text-slate-500 text-xs">{label}</span>
          </div>
          <span className={`font-bold text-base ${color}`}>{value}</span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// VALIDATION PANEL
// ─────────────────────────────────────────────────────────

const ValidationPanel = ({ warnings }) => {
  if (warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 text-emerald-400 text-sm">
        <CheckCircle2 size={16} />
        <span>Mission validation passed — ready to generate</span>
      </div>
    );
  }

  const sevColors = { error: 'text-red-400 bg-red-500/10 border-red-500/20', warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20', info: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
  const sevIcons  = { error: AlertCircle, warning: AlertTriangle, info: Info };

  return (
    <div className="space-y-2">
      {warnings.map((w, i) => {
        const Icon = sevIcons[w.severity] || Info;
        return (
          <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${sevColors[w.severity]}`}>
            <Icon size={13} className="flex-shrink-0 mt-0.5" />
            <span>{w.message}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────

const MissionPlannerAgent = () => {
  const [waypoints, setWaypoints] = useState([]);
  const [polygon, setPolygon] = useState([]);
  const [selectedWpId, setSelectedWpId] = useState(null);
  const [editingWpId, setEditingWpId] = useState(null);
  const [activeTool, setActiveTool] = useState(TOOLS.WAYPOINT);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showPath, setShowPath] = useState(true);
  const [defaultAlt, setDefaultAlt] = useState(30);
  const [defaultSpeed, setDefaultSpeed] = useState(5);
  const [validating, setValidating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simWpIndex, setSimWpIndex] = useState(-1);
  const simRef = useRef(null);
  const wpSeqRef = useRef(0);

  // ── Validation ────────────────────────────────────────
  const warnings = missionService.validateMission(waypoints);
  const errors   = warnings.filter((w) => w.severity === 'error');

  // ── Map Interactions ──────────────────────────────────
  const handleMapClick = useCallback(({ svgX, svgY }) => {
    if (activeTool === TOOLS.WAYPOINT) {
      const gps = svgToGPS(svgX, svgY);
      const newWp = missionService.createWaypoint({
        svgX, svgY,
        lat: parseFloat(gps.lat.toFixed(6)),
        lng: parseFloat(gps.lng.toFixed(6)),
        alt: defaultAlt,
        speed: defaultSpeed,
        action: 'FLY_THROUGH',
      });
      setWaypoints((wps) => {
        const updated = [...wps, newWp];
        return missionService.renumberWaypoints(updated);
      });
      toast.success(`WP${waypoints.length + 1} placed`, { duration: 1200 });
    } else if (activeTool === TOOLS.POLYGON) {
      setPolygon((pts) => [...pts, { svgX, svgY }]);
    }
  }, [activeTool, defaultAlt, defaultSpeed, waypoints.length]);

  const handleWpClick = useCallback((wpId) => {
    if (activeTool === TOOLS.SELECT) {
      setSelectedWpId((prev) => prev === wpId ? null : wpId);
      setEditingWpId(wpId);
    }
  }, [activeTool]);

  const handleWpDrag = useCallback((wpId, { svgX, svgY }) => {
    const gps = svgToGPS(svgX, svgY);
    setWaypoints((wps) =>
      wps.map((wp) =>
        wp.id === wpId
          ? { ...wp, svgX, svgY, x: parseFloat(gps.lat.toFixed(6)), y: parseFloat(gps.lng.toFixed(6)) }
          : wp
      )
    );
  }, []);

  const handleWpUpdate = useCallback((updated) => {
    setWaypoints((wps) => wps.map((wp) => wp.id === updated.id ? updated : wp));
  }, []);

  const handleWpDelete = useCallback((wpId) => {
    setWaypoints((wps) => {
      const filtered = wps.filter((wp) => wp.id !== wpId);
      return missionService.renumberWaypoints(filtered);
    });
    setSelectedWpId(null);
    setEditingWpId(null);
    toast.success('Waypoint deleted');
  }, []);

  const handleDeleteSelected = () => {
    if (selectedWpId) handleWpDelete(selectedWpId);
  };

  // ── Polygon / Coverage ────────────────────────────────
  const handleClosePolygon = () => {
    if (polygon.length < 3) {
      toast.error('Draw at least 3 boundary points first');
      return;
    }
    setActiveTool(TOOLS.SELECT);
    toast.success('Boundary defined');
  };

  const handleGenerateCoverage = async () => {
    if (polygon.length < 3) {
      toast.error('Define a polygon boundary area first (use Polygon tool)');
      return;
    }
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 800));
    const newWps = missionService.generateGridPath(polygon, 45, defaultAlt, 'START_SPRINKLING');
    setWaypoints(missionService.renumberWaypoints(newWps));
    setGenerating(false);
    toast.success(`Coverage path generated — ${newWps.length} waypoints`);
  };

  // ── Mission Operations ────────────────────────────────
  const handleGenerate = async () => {
    if (errors.length > 0) {
      toast.error('Fix validation errors before generating');
      return;
    }
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1000));
    setGenerating(false);
    toast.success(`Mission ready — ${waypoints.length} waypoints`);
  };

  const handleSave = () => {
    const result = missionService.saveMission(waypoints, { waypointCount: waypoints.length });
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  };

  const handleLoad = () => {
    const result = missionService.loadMission();
    if (result.success) {
      setWaypoints(result.mission.waypoints || []);
      toast.success(`Mission loaded — ${result.mission.waypoints?.length || 0} waypoints`);
    } else {
      toast.error(result.message);
    }
  };

  const handleExport = () => {
    if (waypoints.length === 0) { toast.error('No waypoints to export'); return; }
    const result = missionService.exportMissionAsJSON(waypoints);
    if (result.success) toast.success(result.message);
  };

  const handleClear = () => {
    setWaypoints([]);
    setPolygon([]);
    setSelectedWpId(null);
    setEditingWpId(null);
    missionService.resetSequenceCounter();
    toast.success('Mission cleared');
  };

  // ── Simulation ────────────────────────────────────────
  const handleSimulate = () => {
    if (waypoints.length < 2) { toast.error('Need at least 2 waypoints to simulate'); return; }
    setSimulating(true);
    setSimWpIndex(0);
    let i = 0;
    simRef.current = setInterval(() => {
      i++;
      if (i >= waypoints.length) {
        clearInterval(simRef.current);
        setSimulating(false);
        setSimWpIndex(-1);
        toast.success('Mission simulation complete');
      } else {
        setSimWpIndex(i);
      }
    }, 900);
  };

  const handleStopSimulate = () => {
    clearInterval(simRef.current);
    setSimulating(false);
    setSimWpIndex(-1);
  };

  useEffect(() => () => clearInterval(simRef.current), []);

  const editingWp = waypoints.find((wp) => wp.id === editingWpId);

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full">

      {/* ── PAGE HEADER ────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-400/10 border border-blue-500/30 flex items-center justify-center">
              <Map size={20} className="text-blue-400" />
            </div>
            Mission Planner
          </h2>
          <p className="text-slate-400 mt-1">Design autonomous precision spraying missions with waypoint routing</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
            {waypoints.length} WP{waypoints.length !== 1 ? 's' : ''}
          </span>
          {errors.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              {errors.length} Error{errors.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </motion.div>

      {/* ── TOOLBAR ────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="p-3 mb-4" hover={false}>
          <div className="flex flex-wrap items-center gap-2">

            {/* Tool selector */}
            <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
              {[
                { tool: TOOLS.SELECT,   icon: Move,      label: 'Select' },
                { tool: TOOLS.WAYPOINT, icon: MapPin,     label: 'Waypoint' },
                { tool: TOOLS.POLYGON,  icon: Pentagon,   label: 'Polygon' },
              ].map(({ tool, icon: Icon, label }) => (
                <button
                  key={tool}
                  onClick={() => setActiveTool(tool)}
                  title={label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    activeTool === tool
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-700" />

            {/* Default params */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Alt:</span>
              <input
                type="number" min="5" max="120" value={defaultAlt}
                onChange={(e) => setDefaultAlt(parseInt(e.target.value) || 30)}
                className="w-14 bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <span>m</span>
              <span className="ml-2">Speed:</span>
              <input
                type="number" min="1" max="15" step="0.5" value={defaultSpeed}
                onChange={(e) => setDefaultSpeed(parseFloat(e.target.value) || 5)}
                className="w-14 bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <span>m/s</span>
            </div>

            <div className="h-6 w-px bg-slate-700" />

            {/* View toggles */}
            <div className="flex gap-1">
              {[
                { label: 'Grid', state: showGrid, toggle: () => setShowGrid(v => !v) },
                { label: 'Labels', state: showLabels, toggle: () => setShowLabels(v => !v) },
                { label: 'Path', state: showPath, toggle: () => setShowPath(v => !v) },
              ].map(({ label, state, toggle }) => (
                <button
                  key={label} onClick={toggle}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${state ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-700" />

            {/* Polygon actions */}
            {activeTool === TOOLS.POLYGON && (
              <>
                <button onClick={handleClosePolygon} className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 transition">
                  Close Polygon
                </button>
                <button
                  onClick={handleGenerateCoverage}
                  disabled={generating || polygon.length < 3}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold hover:bg-blue-500/25 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {generating ? <Loader2 size={12} className="animate-spin" /> : <Grid size={12} />}
                  Gen Coverage
                </button>
              </>
            )}

            {/* Delete selected */}
            {selectedWpId && (
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/25 transition flex items-center gap-1.5"
              >
                <Trash2 size={12} /> Delete WP
              </button>
            )}

            <div className="ml-auto flex gap-1.5">
              {/* Simulation */}
              {simulating ? (
                <button onClick={handleStopSimulate} className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/25 transition flex items-center gap-1.5">
                  <Square size={12} /> Stop Sim
                </button>
              ) : (
                <button onClick={handleSimulate} disabled={waypoints.length < 2} className="px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/25 transition disabled:opacity-50 flex items-center gap-1.5">
                  <Play size={12} /> Simulate
                </button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── MAIN SPLIT: MAP + PANEL ──────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* MAP CANVAS — 2/3 */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="overflow-hidden p-0" hover={false}>
            {/* Map header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Layers size={12} className="text-emerald-400" />
                <span>Mission Map</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400">1 unit = {SCALE}m</span>
                {simulating && (
                  <span className="ml-2 text-purple-400 font-semibold animate-pulse">
                    ▶ Simulating WP{simWpIndex + 1}...
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500">
                Click map to place waypoints
              </div>
            </div>

            {/* SVG map */}
            <div className="relative" style={{ height: '460px' }}>
              {/* Simulation dot overlay */}
              {simulating && simWpIndex >= 0 && simWpIndex < waypoints.length && (
                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="absolute w-5 h-5 rounded-full bg-yellow-400 border-2 border-white"
                    style={{
                      left: `${(waypoints[simWpIndex].svgX / MAP_W) * 100}%`,
                      top: `${(waypoints[simWpIndex].svgY / MAP_H) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                </div>
              )}

              <MissionMap
                waypoints={waypoints}
                polygon={polygon}
                activeTool={activeTool}
                selectedWpId={selectedWpId}
                onMapClick={handleMapClick}
                onWpClick={handleWpClick}
                onWpDrag={handleWpDrag}
                showGrid={showGrid}
                showLabels={showLabels}
                showPath={showPath}
              />
            </div>
          </Card>
        </motion.div>

        {/* RIGHT PANEL — 1/3 */}
        <div className="lg:col-span-1 space-y-4">

          {/* Waypoint Editor */}
          <motion.div variants={itemVariants}>
            <AnimatePresence mode="wait">
              {editingWp ? (
                <WaypointEditor
                  key={editingWp.id}
                  waypoint={editingWp}
                  onUpdate={handleWpUpdate}
                  onDelete={handleWpDelete}
                  onClose={() => setEditingWpId(null)}
                />
              ) : (
                <motion.div
                  key="wp-hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center"
                >
                  <Edit3 size={24} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">
                    {activeTool === TOOLS.SELECT
                      ? 'Click a waypoint to edit its parameters'
                      : 'Switch to Select tool to edit waypoints'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Waypoint List */}
          <motion.div variants={itemVariants}>
            <Card className="p-4" hover={false}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Navigation size={14} className="text-emerald-400" />
                  Waypoints ({waypoints.length})
                </h3>
                {waypoints.length > 0 && (
                  <button onClick={handleClear} className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1">
                    <Trash2 size={10} /> Clear all
                  </button>
                )}
              </div>

              {waypoints.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-4">
                  Use the Waypoint tool to place points on the map
                </p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {waypoints.map((wp, i) => {
                    const color = ACTION_COLORS[wp.action] || '#10b981';
                    const isSelected = wp.id === selectedWpId;
                    return (
                      <motion.button
                        key={wp.id}
                        whileHover={{ x: 2 }}
                        onClick={() => { setSelectedWpId(isSelected ? null : wp.id); setEditingWpId(wp.id); }}
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black text-black"
                          style={{ backgroundColor: color }}>
                          {i === 0 ? 'T' : i}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-xs font-semibold">{wp.label}</span>
                            <span className="text-slate-500 text-xs">{wp.z}m</span>
                          </div>
                          <p className="text-slate-500 text-xs truncate">
                            {missionService.WAYPOINT_ACTIONS.find(a => a.value === wp.action)?.label || wp.action}
                          </p>
                        </div>
                        {i > 0 && (
                          <span className="text-slate-600 text-xs flex-shrink-0">
                            {Math.round(distanceBetween(waypoints[i - 1], wp))}m
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ── BOTTOM: SUMMARY + VALIDATION + OPERATIONS ─── */}
      <div className="grid lg:grid-cols-2 gap-5 mt-5">

        {/* Mission Summary */}
        <motion.div variants={itemVariants}>
          <Card className="p-5" hover={false}>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Activity size={14} className="text-emerald-400" />
              Mission Summary
            </h3>
            {waypoints.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Add waypoints to see mission summary</p>
            ) : (
              <MissionSummary waypoints={waypoints} />
            )}
          </Card>
        </motion.div>

        {/* Validation + Operations */}
        <motion.div variants={itemVariants} className="space-y-4">
          {/* Validation */}
          <Card className="p-5" hover={false}>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Shield size={14} className="text-purple-400" />
              Mission Validation
            </h3>
            <ValidationPanel warnings={warnings} />
          </Card>

          {/* Operations */}
          <Card className="p-5" hover={false}>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Zap size={14} className="text-amber-400" />
              Mission Operations
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleGenerate}
                disabled={generating || waypoints.length === 0 || errors.length > 0}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-lime-500/10 border border-emerald-500/30 text-emerald-300 hover:border-emerald-400/50 transition disabled:opacity-40 text-xs font-semibold"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                Generate
              </button>
              <button onClick={handleSave} disabled={waypoints.length === 0}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600 transition disabled:opacity-40 text-xs font-semibold">
                <Save size={16} />
                Save
              </button>
              <button onClick={handleLoad}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600 transition text-xs font-semibold">
                <Upload size={16} />
                Load
              </button>
              <button onClick={handleExport} disabled={waypoints.length === 0}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600 transition disabled:opacity-40 text-xs font-semibold">
                <FileJson size={16} />
                Export
              </button>
              <button onClick={handleClear} disabled={waypoints.length === 0}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:border-red-500/40 transition disabled:opacity-40 text-xs font-semibold">
                <RotateCcw size={16} />
                Clear
              </button>
              <button onClick={simulating ? handleStopSimulate : handleSimulate} disabled={waypoints.length < 2}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:border-purple-500/40 transition disabled:opacity-40 text-xs font-semibold">
                {simulating ? <Square size={16} /> : <Play size={16} />}
                {simulating ? 'Stop' : 'Simulate'}
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MissionPlannerAgent;
