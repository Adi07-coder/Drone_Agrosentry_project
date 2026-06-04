/**
 * AgroSentry — Sprinkling Timer Service
 *
 * Pure JavaScript state-machine for managing timed sprinkler operations.
 * Zero React dependencies — fully portable for real drone integration.
 *
 * Architecture:
 *   TimerState machine:
 *     IDLE → RUNNING → PAUSED → RUNNING → COMPLETED
 *                    ↘ CANCELLED
 *
 * Mission Waypoint Integration:
 *   Each waypoint can carry a `sprinklingAction` payload:
 *   {
 *     action: 'START_TIMED_SPRINKLING',
 *     durationSeconds: 60,
 *     flowRate: 5,
 *   }
 *   The timer service can be driven by mission executor by calling
 *   start(durationSeconds, callbacks) at the waypoint trigger.
 *
 * Future hardware integration:
 *   Replace onStart/onStop callbacks with:
 *   - MQTT publish('agrosentry/drone/sprinkler/start', { duration, flowRate })
 *   - MAVLink: MAV_CMD_DO_SET_SERVO with pump relay control
 *   - ROS: service call to /agrosentry/sprinkler/start
 */

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────

export const TIMER_STATES = Object.freeze({
  IDLE:      'idle',
  RUNNING:   'running',
  PAUSED:    'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const PRESET_DURATIONS = [
  { label: '30s',  seconds: 30,  displayMin: 0, displaySec: 30 },
  { label: '1m',   seconds: 60,  displayMin: 1, displaySec: 0 },
  { label: '2m',   seconds: 120, displayMin: 2, displaySec: 0 },
  { label: '3m',   seconds: 180, displayMin: 3, displaySec: 0 },
  { label: '5m',   seconds: 300, displayMin: 5, displaySec: 0 },
  { label: '10m',  seconds: 600, displayMin: 10, displaySec: 0 },
];

// Water consumption: 5 L/min default ≈ 0.0833 L/s
const LITRES_PER_SECOND_PER_FLOW_UNIT = 1 / 60; // 1 L/min = 0.01667 L/s

// ─────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────

/**
 * Format total seconds into HH:MM:SS display string.
 * @param {number} totalSeconds
 * @returns {string} e.g. "02:30" or "01:00:00"
 */
export const formatCountdown = (totalSeconds) => {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

/**
 * Calculate estimated water consumed given elapsed time and flow rate.
 * @param {number} elapsedSeconds
 * @param {number} flowRateLPM  – litres per minute
 * @returns {number} litres consumed (2 decimal places)
 */
export const calcWaterConsumed = (elapsedSeconds, flowRateLPM) => {
  return parseFloat((elapsedSeconds * flowRateLPM * LITRES_PER_SECOND_PER_FLOW_UNIT).toFixed(2));
};

/**
 * Calculate estimated coverage area from water consumed.
 * Rule-of-thumb: 1 L covers ~20 m² at standard ag drone density.
 * @param {number} litresConsumed
 * @returns {number} square metres
 */
export const calcCoverageM2 = (litresConsumed) =>
  parseFloat((litresConsumed * 20).toFixed(1));

/**
 * Parse a minutes + seconds input into total seconds.
 * @param {number} minutes
 * @param {number} seconds
 * @returns {number} total seconds, clamped to [1, 3600]
 */
export const parseToSeconds = (minutes, seconds) => {
  const total = (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
  return Math.min(3600, Math.max(1, total));
};

// ─────────────────────────────────────────────────────────
// TIMER FACTORY
// Creates a self-contained timer instance (not React state).
// Use useSprinklingTimer hook for React integration.
// ─────────────────────────────────────────────────────────

/**
 * Create a new sprinkling timer instance.
 *
 * @param {{
 *   onTick:      (remaining: number, elapsed: number) => void,
 *   onComplete:  () => void,
 *   onStateChange: (state: string) => void,
 * }} callbacks
 *
 * @returns {{
 *   start:   (durationSeconds: number) => void,
 *   pause:   () => void,
 *   resume:  () => void,
 *   cancel:  () => void,
 *   reset:   () => void,
 *   getState: () => object,
 * }}
 */
export const createSprinklingTimer = (callbacks = {}) => {
  let _intervalId  = null;
  let _state       = TIMER_STATES.IDLE;
  let _duration    = 0;   // total configured seconds
  let _remaining   = 0;   // seconds remaining
  let _elapsed     = 0;   // seconds elapsed
  let _startedAt   = null;
  let _pausedAt    = null;

  const { onTick, onComplete, onStateChange } = callbacks;

  const _setState = (newState) => {
    _state = newState;
    onStateChange?.(newState);
  };

  const _clearInterval = () => {
    if (_intervalId !== null) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
  };

  const _tick = () => {
    _remaining = Math.max(0, _remaining - 1);
    _elapsed   = _duration - _remaining;
    onTick?.(_remaining, _elapsed);

    if (_remaining <= 0) {
      _clearInterval();
      _setState(TIMER_STATES.COMPLETED);
      onComplete?.();
    }
  };

  return {
    /**
     * Start the timer with a given duration in seconds.
     * Cancels any in-progress timer.
     */
    start(durationSeconds) {
      _clearInterval();
      _duration  = durationSeconds;
      _remaining = durationSeconds;
      _elapsed   = 0;
      _startedAt = Date.now();
      _pausedAt  = null;
      _setState(TIMER_STATES.RUNNING);
      onTick?.(_remaining, _elapsed);
      _intervalId = setInterval(_tick, 1000);
    },

    /** Pause the timer (freeze countdown). */
    pause() {
      if (_state !== TIMER_STATES.RUNNING) return;
      _clearInterval();
      _pausedAt = Date.now();
      _setState(TIMER_STATES.PAUSED);
    },

    /** Resume a paused timer. */
    resume() {
      if (_state !== TIMER_STATES.PAUSED) return;
      _pausedAt = null;
      _setState(TIMER_STATES.RUNNING);
      _intervalId = setInterval(_tick, 1000);
    },

    /** Cancel and reset. */
    cancel() {
      _clearInterval();
      _remaining = 0;
      _elapsed   = 0;
      _setState(TIMER_STATES.CANCELLED);
    },

    /** Reset to IDLE (after cancel or complete). */
    reset() {
      _clearInterval();
      _remaining = 0;
      _elapsed   = 0;
      _duration  = 0;
      _startedAt = null;
      _pausedAt  = null;
      _setState(TIMER_STATES.IDLE);
    },

    /** Get current internal state snapshot (useful for debugging/logging). */
    getState() {
      return {
        state:     _state,
        duration:  _duration,
        remaining: _remaining,
        elapsed:   _elapsed,
        startedAt: _startedAt,
        pausedAt:  _pausedAt,
      };
    },
  };
};

// ─────────────────────────────────────────────────────────
// MISSION WAYPOINT PAYLOAD BUILDER
// Pre-built data structures for future waypoint integration.
// ─────────────────────────────────────────────────────────

/**
 * Build a timed sprinkling waypoint action payload.
 * Attach to a MissionPlan waypoint's `sprinklingAction` field.
 *
 * @param {number} durationSeconds
 * @param {number} flowRateLPM
 * @returns {object} waypoint sprinkling payload
 */
export const buildWaypointSprinklingAction = (durationSeconds, flowRateLPM = 5) => ({
  type:            'TIMED_SPRINKLING',
  durationSeconds,
  flowRateLPM,
  estimatedLitres: calcWaterConsumed(durationSeconds, flowRateLPM),
  coverageM2:      calcCoverageM2(calcWaterConsumed(durationSeconds, flowRateLPM)),
  createdAt:       new Date().toISOString(),
});

export default {
  TIMER_STATES,
  PRESET_DURATIONS,
  formatCountdown,
  calcWaterConsumed,
  calcCoverageM2,
  parseToSeconds,
  createSprinklingTimer,
  buildWaypointSprinklingAction,
};
