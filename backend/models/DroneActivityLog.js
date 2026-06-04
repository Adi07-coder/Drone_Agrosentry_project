const mongoose = require('mongoose');

/**
 * AgroSentry — Drone Activity Log
 *
 * Queryable event log for every drone action (takeoff, land, sprinkle, etc.)
 * Separate from DroneSession.commandLog (which is an embedded array) so we
 * can query, paginate, filter, and search efficiently.
 *
 * Future MAVLink/MQTT integration: each incoming MAVLink message or MQTT
 * publish can create an entry here via droneSocket.js.
 */

const DroneActivityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DroneSession',
    default: null,
    index: true,
  },
  missionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MissionPlan',
    default: null,
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      // Flight
      'ARM', 'DISARM', 'TAKEOFF', 'LAND', 'HOVER', 'RTH', 'EMERGENCY_STOP',
      // Mission
      'MISSION_START', 'MISSION_END', 'MISSION_PAUSE', 'MISSION_RESUME', 'MISSION_ABORT',
      'MISSION_UPLOAD', 'MISSION_SAVE', 'MISSION_DELETE',
      // Sprinkle
      'SPRINKLE_START', 'SPRINKLE_STOP', 'TIMED_SPRINKLE', 'FLOW_CHANGE',
      // Camera
      'CAMERA_ON', 'CAMERA_OFF',
      // Session
      'SESSION_START', 'SESSION_END',
      // System
      'CALIBRATE', 'GPS_REFRESH', 'STATE_RESET',
      // Timer
      'TIMER_START', 'TIMER_PAUSE', 'TIMER_RESUME', 'TIMER_CANCEL', 'TIMER_COMPLETE', 'TIMER_EMERGENCY_CANCEL',
    ],
    index: true,
  },
  // Which category this event belongs to (for UI filter chips)
  category: {
    type: String,
    enum: ['flight', 'mission', 'sprinkle', 'camera', 'session', 'system', 'timer', 'emergency'],
    index: true,
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'warning'],
    default: 'success',
  },
  // Arbitrary event payload (telemetry snapshot, command params, etc.)
  eventData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Human-readable summary for history display
  summary: {
    type: String,
    trim: true,
  },
  // Operator identifier (username or 'system')
  operator: {
    type: String,
    default: 'operator',
    trim: true,
  },
  // Source of the event (for future hardware integration)
  source: {
    type: String,
    enum: ['web_ui', 'socket', 'mavlink', 'mqtt', 'ros', 'api', 'system'],
    default: 'web_ui',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound index for efficient per-user paginated queries
DroneActivityLogSchema.index({ userId: 1, timestamp: -1 });
DroneActivityLogSchema.index({ userId: 1, category: 1, timestamp: -1 });
DroneActivityLogSchema.index({ userId: 1, eventType: 1, timestamp: -1 });

// Helper: derive category from eventType
DroneActivityLogSchema.pre('save', function (next) {
  if (!this.category) {
    const type = this.eventType;
    if (['ARM', 'DISARM', 'TAKEOFF', 'LAND', 'HOVER', 'RTH'].includes(type)) this.category = 'flight';
    else if (type === 'EMERGENCY_STOP') this.category = 'emergency';
    else if (type.startsWith('MISSION_')) this.category = 'mission';
    else if (['SPRINKLE_START', 'SPRINKLE_STOP', 'TIMED_SPRINKLE', 'FLOW_CHANGE'].includes(type)) this.category = 'sprinkle';
    else if (type.startsWith('CAMERA_')) this.category = 'camera';
    else if (type.startsWith('SESSION_')) this.category = 'session';
    else if (type.startsWith('TIMER_')) this.category = 'timer';
    else this.category = 'system';
  }
  next();
});

module.exports = mongoose.model('DroneActivityLog', DroneActivityLogSchema);
