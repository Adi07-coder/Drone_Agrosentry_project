/**
 * AgroSentry — DroneContext
 *
 * Shared drone state context so both DroneControlAgent and
 * MissionPlannerAgent share the same socket connection and telemetry,
 * preventing duplicate connections when navigating between pages.
 *
 * Usage:
 *   Wrap your router with <DroneProvider>
 *   const { telemetry, connected, sessionId, ... } = useDrone();
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import useDroneSocket, { DEFAULT_TELEMETRY } from '../hooks/useDroneSocket';
import * as droneApi from '../services/droneApiService';

// ─────────────────────────────────────────────────────────
const DroneContext = createContext(null);

export function DroneProvider({ children }) {
  const [sessionId,     setSessionId]     = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [droneState,    setDroneState]    = useState({
    isArmed: false, isFlying: false, isSprinklingActive: false,
    flightMode: 'IDLE', missionStatus: 'idle',
  });
  const [missionActive, setMissionActive] = useState(false);
  const [activeWaypointIdx, setActiveWaypointIdx] = useState(0);

  const sessionIdRef = useRef(null);

  // Socket hook (shared across all consumers)
  const socket = useDroneSocket({
    sessionId,
    autoJoin: true,
    onTelemetry: (snap) => {
      // Update drone flight state from telemetry
      if (snap.isFlying !== undefined || snap.flightMode !== undefined) {
        setDroneState(prev => ({
          ...prev,
          isFlying:    snap.isFlying    ?? prev.isFlying,
          flightMode:  snap.flightMode  ?? prev.flightMode,
          isSprinklingActive: snap.isSprinklingActive ?? prev.isSprinklingActive,
        }));
      }
    },
  });

  // Start a new backend session
  const startSession = useCallback(async (opts = {}) => {
    try {
      const result = await droneApi.startSession({
        sessionName:  opts.sessionName || `Flight ${new Date().toLocaleString()}`,
        batteryStart: socket.telemetry.battery,
        missionPlanId: opts.missionPlanId || null,
      });
      if (result.success) {
        const sid = result.session._id;
        setSessionId(sid);
        sessionIdRef.current = sid;
        setSessionActive(true);
        socket.joinSession(sid);
        return sid;
      }
    } catch (_) {
      // Session start failed — continue without persistence
    }
    return null;
  }, [socket.telemetry.battery]); // eslint-disable-line

  const endSession = useCallback(async (opts = {}) => {
    if (!sessionIdRef.current) return;
    try {
      await droneApi.endSession(sessionIdRef.current, opts);
    } catch (_) { /* ignore */ }
    setSessionId(null);
    sessionIdRef.current = null;
    setSessionActive(false);
  }, []);

  const value = {
    // Socket
    ...socket,

    // Session
    sessionId,
    sessionActive,
    startSession,
    endSession,

    // Drone state
    droneState,
    setDroneState,

    // Mission tracking
    missionActive,
    setMissionActive,
    activeWaypointIdx,
    setActiveWaypointIdx,
  };

  return (
    <DroneContext.Provider value={value}>
      {children}
    </DroneContext.Provider>
  );
}

export function useDrone() {
  const ctx = useContext(DroneContext);
  if (!ctx) throw new Error('useDrone must be used inside <DroneProvider>');
  return ctx;
}

export default DroneContext;
