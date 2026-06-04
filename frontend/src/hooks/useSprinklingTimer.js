/**
 * AgroSentry — useSprinklingTimer React Hook
 *
 * Wraps sprinklingTimerService in React state so components
 * get reactive updates on every timer tick.
 *
 * Usage:
 *   const timer = useSprinklingTimer({
 *     flowRate:       5,         // L/min from telemetry
 *     onAutoStop:     () => handleStopSprinkling(),
 *     onTimerEvent:   (event, data) => logToBackend(event, data),
 *   });
 *
 *   <button onClick={() => timer.start(180)}>Start 3 min</button>
 *   <span>{timer.display.countdown}</span>
 *
 * All state is self-contained — no external store needed.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createSprinklingTimer,
  TIMER_STATES,
  PRESET_DURATIONS,
  formatCountdown,
  calcWaterConsumed,
  calcCoverageM2,
  parseToSeconds,
  buildWaypointSprinklingAction,
} from '../services/sprinklingTimerService';

// ─────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────

/**
 * @param {{
 *   flowRate?:      number,   – L/min (defaults to 5)
 *   tankLevel?:     number,   – % tank level (read-only display)
 *   onAutoStop?:    Function, – called when timer hits zero
 *   onTimerEvent?:  Function, – (event: string, payload: object) => void
 * }} options
 */
const useSprinklingTimer = ({
  flowRate    = 5,
  tankLevel   = 95,
  onAutoStop,
  onTimerEvent,
} = {}) => {
  // ── React state ────────────────────────────────────────
  const [timerState,  setTimerState]  = useState(TIMER_STATES.IDLE);
  const [remaining,   setRemaining]   = useState(0);
  const [elapsed,     setElapsed]     = useState(0);
  const [duration,    setDuration]    = useState(0);

  // Input fields (minutes + seconds)
  const [inputMin, setInputMin] = useState(0);
  const [inputSec, setInputSec] = useState(30);

  // ── Timer instance ref (not reactive) ─────────────────
  const timerRef = useRef(null);

  // ── Build timer instance once ──────────────────────────
  useEffect(() => {
    timerRef.current = createSprinklingTimer({
      onTick(rem, el) {
        setRemaining(rem);
        setElapsed(el);
      },
      onComplete() {
        setTimerState(TIMER_STATES.COMPLETED);
        setRemaining(0);
        onAutoStop?.();
        onTimerEvent?.('TIMER_COMPLETE', { elapsed: timerRef.current?.getState().elapsed });
      },
      onStateChange(state) {
        setTimerState(state);
      },
    });
    return () => timerRef.current?.cancel();
  }, []); // eslint-disable-line

  // ── ACTIONS ────────────────────────────────────────────

  /** Start the timer with the current input (min + sec). */
  const start = useCallback(() => {
    const secs = parseToSeconds(inputMin, inputSec);
    setDuration(secs);
    setElapsed(0);
    setRemaining(secs);
    timerRef.current?.start(secs);
    onTimerEvent?.('TIMER_START', { durationSeconds: secs, flowRate });
  }, [inputMin, inputSec, flowRate, onTimerEvent]);

  /** Start with an explicit duration in seconds (for presets / waypoints). */
  const startWithDuration = useCallback((secs) => {
    const clamped = Math.min(3600, Math.max(1, secs));
    const m = Math.floor(clamped / 60);
    const s = clamped % 60;
    setInputMin(m);
    setInputSec(s);
    setDuration(clamped);
    setElapsed(0);
    setRemaining(clamped);
    timerRef.current?.start(clamped);
    onTimerEvent?.('TIMER_START', { durationSeconds: clamped, flowRate });
  }, [flowRate, onTimerEvent]);

  const pause = useCallback(() => {
    timerRef.current?.pause();
    onTimerEvent?.('TIMER_PAUSE', { remaining });
  }, [remaining, onTimerEvent]);

  const resume = useCallback(() => {
    timerRef.current?.resume();
    onTimerEvent?.('TIMER_RESUME', { remaining });
  }, [remaining, onTimerEvent]);

  const cancel = useCallback(() => {
    timerRef.current?.cancel();
    onAutoStop?.();
    onTimerEvent?.('TIMER_CANCEL', { remaining, elapsed });
    // Reset display after brief pause so UI can show "Cancelled"
    setTimeout(() => {
      timerRef.current?.reset();
      setRemaining(0);
      setElapsed(0);
      setDuration(0);
    }, 1200);
  }, [remaining, elapsed, onAutoStop, onTimerEvent]);

  /** Emergency cancel — immediate, no delay. */
  const emergencyCancel = useCallback(() => {
    timerRef.current?.cancel();
    timerRef.current?.reset();
    setRemaining(0);
    setElapsed(0);
    setDuration(0);
    onAutoStop?.();
    onTimerEvent?.('TIMER_EMERGENCY_CANCEL', {});
  }, [onAutoStop, onTimerEvent]);

  const reset = useCallback(() => {
    timerRef.current?.reset();
    setRemaining(0);
    setElapsed(0);
    setDuration(0);
    setTimerState(TIMER_STATES.IDLE);
  }, []);

  // ── DERIVED DISPLAY VALUES ─────────────────────────────

  const waterConsumed  = calcWaterConsumed(elapsed, flowRate);
  const coverageM2     = calcCoverageM2(waterConsumed);
  const percentDone    = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;
  const progressColor  = timerState === TIMER_STATES.PAUSED  ? '#f59e0b' :
                         timerState === TIMER_STATES.RUNNING  ? '#06b6d4' :
                         timerState === TIMER_STATES.COMPLETED ? '#10b981' :
                         timerState === TIMER_STATES.CANCELLED ? '#ef4444' : '#64748b';

  // Tank drain simulation
  const tankDrained    = parseFloat((waterConsumed / 10).toFixed(1)); // 10L = 1%
  const effectiveTank  = Math.max(0, tankLevel - tankDrained);

  const display = {
    countdown:   formatCountdown(remaining),
    elapsedStr:  formatCountdown(elapsed),
    remaining,
    elapsed,
    duration,
    percentDone,
    progressColor,
    waterConsumed,
    coverageM2,
    effectiveTank,
    statusLabel: {
      [TIMER_STATES.IDLE]:      { text: 'Standby',   color: 'text-slate-400' },
      [TIMER_STATES.RUNNING]:   { text: 'Spraying',  color: 'text-cyan-400' },
      [TIMER_STATES.PAUSED]:    { text: 'Paused',    color: 'text-amber-400' },
      [TIMER_STATES.COMPLETED]: { text: 'Completed', color: 'text-emerald-400' },
      [TIMER_STATES.CANCELLED]: { text: 'Cancelled', color: 'text-red-400' },
    }[timerState] || { text: 'Unknown', color: 'text-slate-400' },
  };

  const isActive   = timerState === TIMER_STATES.RUNNING || timerState === TIMER_STATES.PAUSED;
  const isRunning  = timerState === TIMER_STATES.RUNNING;
  const isPaused   = timerState === TIMER_STATES.PAUSED;
  const isIdle     = timerState === TIMER_STATES.IDLE;
  const isDone     = timerState === TIMER_STATES.COMPLETED || timerState === TIMER_STATES.CANCELLED;

  return {
    // State
    timerState,
    remaining,
    elapsed,
    duration,
    isActive,
    isRunning,
    isPaused,
    isIdle,
    isDone,

    // Input
    inputMin, setInputMin,
    inputSec, setInputSec,

    // Actions
    start,
    startWithDuration,
    pause,
    resume,
    cancel,
    emergencyCancel,
    reset,

    // Display-ready values
    display,

    // Presets & builder
    PRESET_DURATIONS,
    buildWaypointAction: (dur = duration) =>
      buildWaypointSprinklingAction(dur, flowRate),
  };
};

export default useSprinklingTimer;
