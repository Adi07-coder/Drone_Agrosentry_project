/**
 * AgroSentry — Drone Backend API Service
 *
 * All calls go to /api/drone/* with the user's JWT token.
 * This replaces the mock droneService for persistence-heavy operations:
 *   - Session lifecycle (start, push telemetry, log commands, end)
 *   - Mission plan CRUD (save, load, update, delete from MongoDB)
 *   - Aggregated dashboard stats
 *
 * Flight control commands (arm, takeoff, land, etc.) still use droneService.js
 * because those go directly to the flight controller, not the backend.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─────────────────────────────────────────────────────────
// AXIOS INSTANCE with JWT injection
// ─────────────────────────────────────────────────────────

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  // Try both possible token keys used by the auth context
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('adminToken') ||
    sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─────────────────────────────────────────────────────────
// DRONE SESSIONS
// ─────────────────────────────────────────────────────────

/**
 * Create a new flight session.
 * @param {object} payload - { sessionName, batteryStart, missionPlanId? }
 * @returns {{ success, session }}
 */
export const startSession = async (payload = {}) => {
  const { data } = await api.post('/drone/session/start', payload);
  return data;
};

/**
 * Get the currently active session (or null).
 */
export const getActiveSession = async () => {
  const { data } = await api.get('/drone/session/active');
  return data;
};

/**
 * Append a telemetry snapshot to a session.
 * @param {string} sessionId
 * @param {object} snapshot - telemetry key-value pairs
 */
export const pushTelemetry = async (sessionId, snapshot) => {
  const { data } = await api.post(`/drone/session/${sessionId}/telemetry`, snapshot);
  return data;
};

/**
 * Log a command execution to a session.
 * @param {string} sessionId
 * @param {object} payload - { command, params?, success?, message? }
 */
export const logCommand = async (sessionId, payload) => {
  const { data } = await api.post(`/drone/session/${sessionId}/command`, payload);
  return data;
};

/**
 * End a session.
 * @param {string} sessionId
 * @param {object} payload - { status?, batteryEnd?, totalFlightTime?, coverageArea?, waterUsed? }
 */
export const endSession = async (sessionId, payload = {}) => {
  const { data } = await api.patch(`/drone/session/${sessionId}/end`, payload);
  return data;
};

/**
 * Get paginated session history.
 * @param {{ page?, limit? }} opts
 */
export const getSessions = async (opts = {}) => {
  const { data } = await api.get('/drone/sessions', { params: opts });
  return data;
};

/**
 * Get one full session with telemetry log.
 * @param {string} sessionId
 */
export const getSession = async (sessionId) => {
  const { data } = await api.get(`/drone/sessions/${sessionId}`);
  return data;
};

/**
 * Get aggregated drone stats for the dashboard.
 * Returns: { stats: { totalSessions, completedFlights, totalFlightTime, totalCoverage, ... }, activeSession }
 */
export const getDroneStats = async () => {
  const { data } = await api.get('/drone/stats');
  return data;
};

// ─────────────────────────────────────────────────────────
// MISSION PLANS
// ─────────────────────────────────────────────────────────

/**
 * Save a new mission plan to the database.
 * @param {object} payload - { name, waypoints[], boundaryPolygon?, ...metrics }
 */
export const saveMissionToCloud = async (payload) => {
  const { data } = await api.post('/drone/mission', payload);
  return data;
};

/**
 * List all mission plans for the user.
 */
export const getMissions = async () => {
  const { data } = await api.get('/drone/missions');
  return data;
};

/**
 * Get one full mission plan.
 * @param {string} missionId
 */
export const getMission = async (missionId) => {
  const { data } = await api.get(`/drone/mission/${missionId}`);
  return data;
};

/**
 * Update an existing mission plan.
 * @param {string} missionId
 * @param {object} updates
 */
export const updateMission = async (missionId, updates) => {
  const { data } = await api.put(`/drone/mission/${missionId}`, updates);
  return data;
};

/**
 * Delete a mission plan.
 * @param {string} missionId
 */
export const deleteMission = async (missionId) => {
  const { data } = await api.delete(`/drone/mission/${missionId}`);
  return data;
};

// ─────────────────────────────────────────────────────────
// REAL-TIME TELEMETRY FLUSH HELPER
// ─────────────────────────────────────────────────────────

/**
 * Batch-flush buffered telemetry snapshots to backend.
 * Call this every N seconds from the DroneControlAgent to persist telemetry.
 *
 * @param {string}   sessionId   - active session _id
 * @param {object}   latestSnap  - most recent telemetry object
 * @returns {Promise<void>}
 */
export const flushTelemetry = async (sessionId, latestSnap) => {
  if (!sessionId || !latestSnap) return;
  try {
    await pushTelemetry(sessionId, latestSnap);
  } catch {
    // Silently fail — telemetry push is best-effort
  }
};
