/**
 * AgroSentry — Drone Socket.IO Handler
 *
 * Manages the /drone Socket.IO namespace.
 *
 * Architecture:
 *   Browser connects → joins session room → receives telemetry:update every 2s
 *   Browser emits telemetry:push → server persists + re-broadcasts to room
 *   Browser emits command:log → server saves DroneActivityLog + broadcasts
 *
 * Future hardware integration:
 *   Replace the simulated telemetry broadcaster with:
 *   - MAVLink: mavlink.createConnection() → emit telemetry on each HEARTBEAT message
 *   - MQTT: mqttClient.on('message', topic, payload) → parse + re-emit
 *   - ROS: rosbridge WebSocket → forward /mavros/state messages
 */

const jwt    = require('jsonwebtoken');
const DroneSession      = require('../models/DroneSession');
const DroneActivityLog  = require('../models/DroneActivityLog');

// ── Simulated telemetry state (shared across all sockets, per-session) ────────
// In a real integration this comes from MAVLink/MQTT.
const _simState = {
  battery:         87,
  altitude:        0,
  speed:           0,
  heading:         0,
  gpsLock:         true,
  satellites:      12,
  signalStrength:  94,
  flowRate:        5,
  tankLevel:       95,
  coverageArea:    0,
  missionProgress: 0,
  remainingFlightTime: 42,
  lat:   20.5937,   // Default: center of India
  lng:   78.9629,
  verticalSpeed: 0,
  flightMode:    'IDLE',
  isFlying:      false,
  isSprinklingActive: false,
};

let _simInterval = null;
let _connectedClients = 0;

function _tick() {
  _simState.battery         = Math.max(5, _simState.battery - 0.02);
  _simState.heading         = (_simState.heading + (_simState.isFlying ? 0.5 : 0)) % 360;
  _simState.signalStrength  = 90 + Math.floor(Math.random() * 8);
  if (_simState.isFlying) {
    _simState.altitude = Math.max(0, _simState.altitude + (Math.random() - 0.48) * 0.4);
    _simState.speed    = parseFloat((Math.random() * 3 + 3).toFixed(1));
    // Drift GPS slightly to simulate movement
    _simState.lat += (Math.random() - 0.5) * 0.000005;
    _simState.lng += (Math.random() - 0.5) * 0.000005;
  } else {
    _simState.speed = 0;
  }
  return {
    ..._simState,
    battery:         parseFloat(_simState.battery.toFixed(1)),
    altitude:        parseFloat(_simState.altitude.toFixed(1)),
    remainingFlightTime: Math.max(0, Math.floor(_simState.battery / 2)),
    timestamp: Date.now(),
  };
}

// ── JWT Auth Middleware for Socket.IO ─────────────────────────────────────────
function authenticateSocket(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      (socket.handshake.headers?.authorization || '').replace('Bearer ', '');

    if (!token) {
      // Allow connection without auth — telemetry will still broadcast
      // but db writes won't have a userId. Useful for dev/demo mode.
      socket.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    socket.user = null;
    next(); // Don't reject — allow read-only telemetry
  }
}

// ── Main Socket handler ───────────────────────────────────────────────────────
function initDroneSocket(io) {
  const droneNs = io.of('/drone');

  droneNs.use(authenticateSocket);

  droneNs.on('connection', (socket) => {
    _connectedClients++;
    console.log(`[Socket] Drone client connected: ${socket.id} | total: ${_connectedClients}`);

    // Start sim broadcaster when first client connects
    if (_connectedClients === 1) {
      _simInterval = setInterval(() => {
        const snap = _tick();
        droneNs.emit('telemetry:update', snap);
      }, 2000);
    }

    // ── join:session — client requests to join a session room ──
    socket.on('join:session', async ({ sessionId }) => {
      if (!sessionId) return;
      socket.join(`session:${sessionId}`);
      socket.currentSessionId = sessionId;
      console.log(`[Socket] ${socket.id} joined session:${sessionId}`);

      // Send current state immediately
      socket.emit('telemetry:update', _tick());

      // Load and send session info if authenticated
      if (socket.user) {
        try {
          const session = await DroneSession.findById(sessionId)
            .select('sessionName status flightMode missionStatus startedAt')
            .lean();
          if (session) socket.emit('session:state', { session });
        } catch (_) { /* ignore */ }
      }
    });

    // ── telemetry:push — client pushes telemetry update ──
    socket.on('telemetry:push', async (snap) => {
      if (!snap) return;

      // Update shared sim state with client data
      Object.assign(_simState, {
        battery:   snap.battery   ?? _simState.battery,
        altitude:  snap.altitude  ?? _simState.altitude,
        speed:     snap.speed     ?? _simState.speed,
        heading:   snap.heading   ?? _simState.heading,
        tankLevel: snap.tankLevel ?? _simState.tankLevel,
        flowRate:  snap.flowRate  ?? _simState.flowRate,
        isFlying:  snap.isFlying  ?? _simState.isFlying,
        isSprinklingActive: snap.isSprinklingActive ?? _simState.isSprinklingActive,
        lat: snap.lat ?? _simState.lat,
        lng: snap.lng ?? _simState.lng,
      });

      // Broadcast updated telemetry to all in the room
      const broadcast = { ..._simState, ...snap, timestamp: Date.now() };
      if (socket.currentSessionId) {
        droneNs.to(`session:${socket.currentSessionId}`).emit('telemetry:update', broadcast);
      }

      // Persist to DB (fire and forget)
      if (socket.user && socket.currentSessionId) {
        DroneSession.findByIdAndUpdate(
          socket.currentSessionId,
          {
            $push: {
              telemetryLog: {
                $each: [{ ...snap, timestamp: new Date() }],
                $slice: -500,
              },
            },
          }
        ).catch(() => {});
      }
    });

    // ── command:log — client logs a command event ──
    socket.on('command:log', async ({ command, params, status = 'success', summary, sessionId }) => {
      const sid = sessionId || socket.currentSessionId;

      // Broadcast the event to all in room
      if (sid) {
        droneNs.to(`session:${sid}`).emit('session:event', {
          command, params, status, summary, timestamp: Date.now(),
        });
      }

      // Persist to DroneActivityLog
      if (socket.user) {
        try {
          await DroneActivityLog.create({
            userId:    socket.user.id || socket.user._id,
            sessionId: sid || null,
            eventType: command,
            status,
            eventData: params || {},
            summary:   summary || command,
            operator:  socket.user.name || socket.user.email || 'operator',
            source:    'socket',
          });
        } catch (_) { /* ignore */ }
      }
    });

    // ── drone:state:update — client updates flight state ──
    socket.on('drone:state', (state) => {
      Object.assign(_simState, {
        isFlying:   state.isFlying   ?? _simState.isFlying,
        flightMode: state.flightMode ?? _simState.flightMode,
        isSprinklingActive: state.isSprinklingActive ?? _simState.isSprinklingActive,
      });
    });

    // ── disconnect ──
    socket.on('disconnect', () => {
      _connectedClients = Math.max(0, _connectedClients - 1);
      console.log(`[Socket] Drone client disconnected: ${socket.id} | remaining: ${_connectedClients}`);

      if (_connectedClients === 0 && _simInterval) {
        clearInterval(_simInterval);
        _simInterval = null;
      }
    });
  });

  return droneNs;
}

// Expose simState for REST endpoints to read
function getSimState() { return { ..._simState, timestamp: Date.now() }; }

module.exports = { initDroneSocket, getSimState };
