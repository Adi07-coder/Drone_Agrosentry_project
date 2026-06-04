/**
 * AgroSentry — useDroneSocket React Hook
 *
 * Connects to the backend /drone Socket.IO namespace and provides
 * real-time telemetry + session event subscriptions.
 *
 * Design:
 *   - One connection per tab (singleton via module-level ref)
 *   - Falls back gracefully if server is offline
 *   - Exposes emit() so components can push telemetry / log commands
 *
 * Future hardware integration:
 *   When real MAVLink/MQTT data is flowing through the backend socket,
 *   this hook will transparently receive it with zero changes.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '');

// ── Module-level singleton so we don't re-connect on re-renders ───────────────
let _socket = null;
let _refCount = 0;

function _getSocket() {
  if (!_socket || _socket.disconnected) {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('adminToken') ||
      sessionStorage.getItem('token') || '';

    _socket = io(`${SOCKET_URL}/drone`, {
      auth:       { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 8000,
    });
  }
  return _socket;
}

// ── Default telemetry structure (shown before first socket message) ───────────
const DEFAULT_TELEMETRY = {
  battery:          85,
  altitude:         0,
  speed:            0,
  heading:          0,
  gpsLock:          true,
  satellites:       12,
  signalStrength:   90,
  flowRate:         5,
  tankLevel:        95,
  coverageArea:     0,
  missionProgress:  0,
  remainingFlightTime: 42,
  lat:              20.5937,
  lng:              78.9629,
  verticalSpeed:    0,
  flightMode:       'IDLE',
  isFlying:         false,
  isSprinklingActive: false,
  timestamp:        Date.now(),
};

/**
 * @param {{
 *   sessionId?:   string,
 *   onTelemetry?: (snap: object) => void,
 *   onEvent?:     (event: object) => void,
 *   autoJoin?:    boolean,
 * }} opts
 */
const useDroneSocket = ({
  sessionId = null,
  onTelemetry = null,
  onEvent = null,
  autoJoin = true,
} = {}) => {
  const [connected,  setConnected]  = useState(false);
  const [telemetry,  setTelemetry]  = useState(DEFAULT_TELEMETRY);
  const [lastEvent,  setLastEvent]  = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = _getSocket();
    socketRef.current = socket;
    _refCount++;

    const onConnect = () => {
      setConnected(true);
      if (autoJoin && sessionId) {
        socket.emit('join:session', { sessionId });
      }
    };

    const onDisconnect = () => setConnected(false);

    const onTelemetryUpdate = (snap) => {
      setTelemetry(prev => ({ ...prev, ...snap }));
      onTelemetry?.(snap);
    };

    const onSessionEvent = (event) => {
      setLastEvent(event);
      onEvent?.(event);
    };

    socket.on('connect',          onConnect);
    socket.on('disconnect',       onDisconnect);
    socket.on('telemetry:update', onTelemetryUpdate);
    socket.on('session:event',    onSessionEvent);

    // Connect if not already connected
    if (!socket.connected) socket.connect();
    else setConnected(true);

    return () => {
      socket.off('connect',          onConnect);
      socket.off('disconnect',       onDisconnect);
      socket.off('telemetry:update', onTelemetryUpdate);
      socket.off('session:event',    onSessionEvent);
      _refCount--;
      // Only fully disconnect if no more consumers
      if (_refCount <= 0) {
        socket.disconnect();
        _socket = null;
        _refCount = 0;
      }
    };
  }, [sessionId]); // eslint-disable-line

  // Join a session room
  const joinSession = useCallback((sid) => {
    socketRef.current?.emit('join:session', { sessionId: sid });
  }, []);

  // Push telemetry update to server
  const pushTelemetry = useCallback((snap) => {
    socketRef.current?.emit('telemetry:push', snap);
  }, []);

  // Log a command event
  const logCommand = useCallback((command, params = {}, opts = {}) => {
    socketRef.current?.emit('command:log', {
      command,
      params,
      status:    opts.status || 'success',
      summary:   opts.summary || command,
      sessionId: opts.sessionId || sessionId,
    });
  }, [sessionId]);

  // Update drone flight state on server
  const updateDroneState = useCallback((state) => {
    socketRef.current?.emit('drone:state', state);
  }, []);

  // Generic emit
  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return {
    connected,
    telemetry,
    lastEvent,
    joinSession,
    pushTelemetry,
    logCommand,
    updateDroneState,
    emit,
    socket: socketRef.current,
  };
};

export default useDroneSocket;
export { DEFAULT_TELEMETRY };
