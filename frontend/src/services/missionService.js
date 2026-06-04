/**
 * AgroSentry — Mission Planning Service Layer
 *
 * Provides mission data structures and utilities compatible with:
 *   - MAVLink Mission Protocol (MISSION_ITEM_INT)
 *   - ArduPilot mission format (.waypoints file)
 *   - PX4 mission format (.plan JSON)
 *   - QGroundControl .plan format
 *   - DroneDeploy mission export
 *
 * Future: uploadMission() will send items to flight controller
 * via MAVLink sequence or REST API.
 */

// ─────────────────────────────────────────────────────────
// CONSTANTS — MAVLink command IDs
// ─────────────────────────────────────────────────────────

export const MAV_FRAME = {
  GLOBAL: 0,                    // Absolute altitude (AMSL)
  GLOBAL_RELATIVE_ALT: 3,       // Relative altitude (most common for missions)
  GLOBAL_TERRAIN_ALT: 10,       // Terrain-following altitude
};

export const MAV_CMD = {
  NAV_WAYPOINT: 16,             // Standard waypoint
  NAV_LOITER_UNLIM: 17,         // Loiter indefinitely
  NAV_LOITER_TIME: 19,          // Loiter for N seconds
  NAV_RETURN_TO_LAUNCH: 20,     // RTL
  NAV_LAND: 21,                 // Land at waypoint
  NAV_TAKEOFF: 22,              // Takeoff
  DO_DIGICAM_CONTROL: 203,      // Camera capture
  DO_SET_SERVO: 183,            // Servo (used for sprayer)
  DO_SPRAY: 216,                // Custom spray command (ArduPlane)
};

export const WAYPOINT_ACTIONS = [
  { value: 'FLY_THROUGH',       label: 'Fly Through',       mavCmd: MAV_CMD.NAV_WAYPOINT },
  { value: 'HOVER',             label: 'Hover / Loiter',    mavCmd: MAV_CMD.NAV_LOITER_TIME },
  { value: 'CAPTURE_IMAGE',     label: 'Capture Image',     mavCmd: MAV_CMD.DO_DIGICAM_CONTROL },
  { value: 'START_SPRINKLING',  label: 'Start Sprinkling',  mavCmd: MAV_CMD.DO_SET_SERVO },
  { value: 'STOP_SPRINKLING',   label: 'Stop Sprinkling',   mavCmd: MAV_CMD.DO_SET_SERVO },
  { value: 'RETURN_HOME',       label: 'Return Home',       mavCmd: MAV_CMD.NAV_RETURN_TO_LAUNCH },
];

// ─────────────────────────────────────────────────────────
// MISSION ITEM FACTORY
// ─────────────────────────────────────────────────────────

let _seqCounter = 0;

/**
 * Create a new waypoint object.
 * Compatible with MAVLink MISSION_ITEM_INT structure.
 */
export const createWaypoint = ({
  lat = 0,
  lng = 0,
  alt = 30,
  speed = 5,
  holdTime = 0,
  action = 'FLY_THROUGH',
  svgX = 0,
  svgY = 0,
} = {}) => ({
  id: `wp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  seq: _seqCounter++,
  frame: MAV_FRAME.GLOBAL_RELATIVE_ALT,
  command: WAYPOINT_ACTIONS.find((a) => a.value === action)?.mavCmd ?? MAV_CMD.NAV_WAYPOINT,
  current: 0,
  autocontinue: 1,
  param1: holdTime,   // hold time (seconds)
  param2: 2,          // acceptance radius (meters)
  param3: 0,          // pass radius
  param4: 0,          // yaw (NaN = auto)
  x: lat,             // latitude
  y: lng,             // longitude
  z: alt,             // altitude (meters)
  // AgroSentry-specific fields
  speed,
  action,
  svgX,               // canvas X position (display only)
  svgY,               // canvas Y position (display only)
  label: `WP${_seqCounter}`,
});

export const resetSequenceCounter = () => { _seqCounter = 0; };

/**
 * Renumber waypoints after add/delete/reorder.
 */
export const renumberWaypoints = (waypoints) =>
  waypoints.map((wp, idx) => ({
    ...wp,
    seq: idx,
    label: `WP${idx + 1}`,
    current: idx === 0 ? 1 : 0,
  }));

// ─────────────────────────────────────────────────────────
// GEOMETRY UTILITIES
// ─────────────────────────────────────────────────────────

/** Haversine distance between two GPS coords (in meters). */
export const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Calculate total mission distance (meters) from waypoint list.
 * Uses SVG positions scaled to simulated GPS coords.
 * Scale: 1 SVG unit ≈ 1 meter (adjustable via scaleFactor).
 */
export const calculateTotalDistance = (waypoints, scaleFactor = 1) => {
  if (waypoints.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const dx = (curr.svgX - prev.svgX) * scaleFactor;
    const dy = (curr.svgY - prev.svgY) * scaleFactor;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return Math.round(total);
};

/**
 * Estimate flight time in minutes.
 * @param {number} distanceM - total distance in meters
 * @param {number} speedMs   - average speed in m/s (default 5 m/s)
 */
export const estimateFlightTime = (distanceM, speedMs = 5) => {
  const seconds = distanceM / speedMs;
  return Math.ceil(seconds / 60);
};

/**
 * Estimate coverage area from waypoints (convex hull approximation).
 * Returns hectares.
 */
export const estimateCoverageArea = (waypoints, swathWidthM = 5, scaleFactor = 1) => {
  if (waypoints.length < 2) return 0;
  const totalDist = calculateTotalDistance(waypoints, scaleFactor);
  const areaM2 = totalDist * swathWidthM;
  return (areaM2 / 10000).toFixed(2); // hectares
};

/**
 * Estimate battery consumption.
 * Rough model: 1% per 30 seconds of flight + 2% per minute of spraying.
 */
export const estimateBattery = (flightTimeMins, sprayingTimeMins = 0) =>
  Math.min(100, Math.round(flightTimeMins * 2 + sprayingTimeMins * 2));

/**
 * Estimate water consumption.
 * @param {number} areaHa    - coverage area in hectares
 * @param {number} rateL_ha  - L per hectare (default 200 L/ha for pesticide)
 */
export const estimateWater = (areaHa, rateL_ha = 200) =>
  Math.round(parseFloat(areaHa) * rateL_ha);

// ─────────────────────────────────────────────────────────
// GRID / COVERAGE PATH GENERATOR
// ─────────────────────────────────────────────────────────

/**
 * Generate a lawnmower grid coverage path within a polygon boundary.
 * Returns an array of {svgX, svgY} grid points.
 *
 * @param {Array<{svgX, svgY}>} polygon - boundary corners
 * @param {number} spacingPx - row spacing in SVG pixels
 * @param {number} defaultAlt - altitude for generated waypoints
 * @param {string} defaultAction - action for generated waypoints
 */
export const generateGridPath = (polygon, spacingPx = 40, defaultAlt = 30, defaultAction = 'START_SPRINKLING') => {
  if (polygon.length < 3) return [];

  const xs = polygon.map((p) => p.svgX);
  const ys = polygon.map((p) => p.svgY);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const points = [];
  let row = 0;
  for (let y = minY; y <= maxY; y += spacingPx) {
    const rowPoints = [];
    for (let x = minX; x <= maxX; x += spacingPx) {
      if (_pointInPolygon({ svgX: x, svgY: y }, polygon)) {
        rowPoints.push({ svgX: x, svgY: y });
      }
    }
    // Alternate row direction (serpentine/boustrophedon pattern)
    if (row % 2 === 1) rowPoints.reverse();
    points.push(...rowPoints);
    row++;
  }

  return points.map((p) => createWaypoint({ ...p, alt: defaultAlt, action: defaultAction }));
};

/** Point-in-polygon ray casting algorithm. */
const _pointInPolygon = (point, polygon) => {
  let inside = false;
  const { svgX: px, svgY: py } = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].svgX, yi = polygon[i].svgY;
    const xj = polygon[j].svgX, yj = polygon[j].svgY;
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

// ─────────────────────────────────────────────────────────
// MISSION VALIDATION
// ─────────────────────────────────────────────────────────

/**
 * Validate mission before upload/export.
 * Returns array of warning objects: { type, severity, message }
 */
export const validateMission = (waypoints, config = {}) => {
  const {
    maxDistanceM = 5000,
    minAlt = 5,
    maxAlt = 120,
    minWaypoints = 1,
    batteryWarningThreshold = 80,
  } = config;

  const warnings = [];

  if (waypoints.length < minWaypoints) {
    warnings.push({
      type: 'NO_WAYPOINTS',
      severity: 'error',
      message: 'No waypoints defined. Add at least one waypoint to generate a mission.',
    });
    return warnings; // No point checking further
  }

  // Check missing or invalid altitudes
  waypoints.forEach((wp, i) => {
    if (!wp.z || wp.z < minAlt) {
      warnings.push({
        type: 'LOW_ALTITUDE',
        severity: 'warning',
        message: `WP${i + 1}: Altitude ${wp.z}m is below minimum safe altitude (${minAlt}m).`,
      });
    }
    if (wp.z > maxAlt) {
      warnings.push({
        type: 'HIGH_ALTITUDE',
        severity: 'error',
        message: `WP${i + 1}: Altitude ${wp.z}m exceeds regulatory maximum (${maxAlt}m).`,
      });
    }
  });

  // Total distance
  const totalDist = calculateTotalDistance(waypoints);
  if (totalDist > maxDistanceM) {
    warnings.push({
      type: 'EXCESSIVE_DISTANCE',
      severity: 'warning',
      message: `Total mission distance ${totalDist}m exceeds ${maxDistanceM}m — check battery capacity.`,
    });
  }

  // Battery estimate
  const flightTime = estimateFlightTime(totalDist);
  const batteryEst = estimateBattery(flightTime);
  if (batteryEst > batteryWarningThreshold) {
    warnings.push({
      type: 'BATTERY_RISK',
      severity: 'warning',
      message: `Estimated battery consumption ${batteryEst}% — consider splitting mission or increasing battery.`,
    });
  }

  // Missing GPS coords (all SVG-based for now)
  const hasNoCoords = waypoints.every((wp) => wp.svgX === 0 && wp.svgY === 0);
  if (hasNoCoords && waypoints.length > 0) {
    warnings.push({
      type: 'NO_COORDINATES',
      severity: 'info',
      message: 'Waypoints use grid coordinates. Connect GPS to assign real-world coordinates.',
    });
  }

  return warnings;
};

// ─────────────────────────────────────────────────────────
// PERSISTENCE (localStorage)
// ─────────────────────────────────────────────────────────

const STORAGE_KEY = 'agrosentry_mission_v1';

export const saveMission = (waypoints, metadata = {}) => {
  const mission = {
    version: 1,
    savedAt: new Date().toISOString(),
    metadata: { name: 'AgroSentry Mission', ...metadata },
    waypoints,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mission));
    return { success: true, message: 'Mission saved locally' };
  } catch {
    return { success: false, message: 'Failed to save mission — storage full?' };
  }
};

export const loadMission = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { success: false, message: 'No saved mission found' };
    const mission = JSON.parse(raw);
    return { success: true, mission };
  } catch {
    return { success: false, message: 'Failed to load mission — data corrupted' };
  }
};

// ─────────────────────────────────────────────────────────
// EXPORT FORMATS
// ─────────────────────────────────────────────────────────

/**
 * Export mission as QGroundControl / PX4 .plan JSON.
 * Compatible with ArduPilot Mission Planner import.
 */
export const exportMissionAsJSON = (waypoints, metadata = {}) => {
  const plan = {
    fileType: 'Plan',
    version: 1,
    geoFence: { circles: [], polygons: [], version: 2 },
    groundStation: 'AgroSentry',
    mission: {
      cruiseSpeed: 5,
      firmwareType: 12,     // MAV_AUTOPILOT_ARDUPILOTMEGA
      globalPlanAltitudeMode: 1,
      hoverSpeed: 5,
      items: waypoints.map((wp) => ({
        AMSLAltAboveTerrain: null,
        Altitude: wp.z,
        AltitudeMode: 1,
        autoContinue: !!wp.autocontinue,
        command: wp.command,
        doJumpId: wp.seq + 1,
        frame: wp.frame,
        params: [wp.param1, wp.param2, wp.param3, wp.param4, wp.x, wp.y, wp.z],
        type: 'SimpleItem',
      })),
      plannedHomePosition: [0, 0, 0],
      vehicleType: 2,       // MAV_TYPE_QUADROTOR
      version: 2,
    },
    rallyPoints: { points: [], version: 2 },
    // AgroSentry metadata
    agroSentry: {
      exportedAt: new Date().toISOString(),
      totalWaypoints: waypoints.length,
      ...metadata,
    },
  };

  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `agrosentry_mission_${Date.now()}.plan`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return { success: true, message: 'Mission exported as .plan file' };
};

/**
 * Export mission as ArduPilot .waypoints text format.
 * Can be loaded directly into ArduPilot Mission Planner.
 */
export const exportMissionAsWaypoints = (waypoints) => {
  const lines = ['QGC WPL 110'];
  waypoints.forEach((wp, i) => {
    lines.push(
      `${i}\t${i === 0 ? 1 : 0}\t${wp.frame}\t${wp.command}\t${wp.param1}\t${wp.param2}\t${wp.param3}\t${wp.param4}\t${wp.x}\t${wp.y}\t${wp.z}\t${wp.autocontinue}`
    );
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `agrosentry_mission_${Date.now()}.waypoints`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return { success: true, message: 'Mission exported as .waypoints file' };
};
