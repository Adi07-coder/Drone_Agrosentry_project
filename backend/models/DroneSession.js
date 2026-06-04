const mongoose = require('mongoose');

const TelemetrySnapshotSchema = new mongoose.Schema({
  battery:        { type: Number },
  altitude:       { type: Number },
  speed:          { type: Number },
  heading:        { type: Number },
  gpsLock:        { type: Boolean },
  satellites:     { type: Number },
  signalStrength:  { type: Number },
  flowRate:        { type: Number },
  tankLevel:       { type: Number },
  coverageArea:    { type: Number },
  missionProgress: { type: Number },
  timestamp:       { type: Date, default: Date.now },
}, { _id: false });

const CommandLogSchema = new mongoose.Schema({
  command:   { type: String, required: true },
  params:    { type: mongoose.Schema.Types.Mixed },
  success:   { type: Boolean, default: true },
  message:   { type: String },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const DroneSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sessionName: {
    type: String,
    default: () => `Session ${new Date().toISOString().split('T')[0]}`,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'aborted', 'emergency'],
    default: 'active',
    index: true,
  },
  flightMode: {
    type: String,
    enum: ['IDLE', 'TAKEOFF', 'MISSION', 'HOVER', 'LAND', 'RTH'],
    default: 'IDLE',
  },
  missionStatus: {
    type: String,
    enum: ['idle', 'running', 'paused', 'completed', 'aborted'],
    default: 'idle',
  },
  // Aggregated flight metrics
  totalDistance:   { type: Number, default: 0 },
  totalFlightTime: { type: Number, default: 0 }, // seconds
  coverageArea:    { type: Number, default: 0 },  // hectares
  waterUsed:       { type: Number, default: 0 },  // litres
  maxAltitude:     { type: Number, default: 0 },  // metres
  batteryStart:    { type: Number },
  batteryEnd:      { type: Number },
  // Linked mission plan
  missionPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MissionPlan',
    default: null,
  },
  // Time-series telemetry (capped at 500 snapshots per session)
  telemetryLog: {
    type: [TelemetrySnapshotSchema],
    default: [],
    validate: [arr => arr.length <= 500, 'Telemetry log exceeds 500 entries'],
  },
  // Command audit trail
  commandLog: {
    type: [CommandLogSchema],
    default: [],
  },
  startedAt:   { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
}, {
  timestamps: true,
});

module.exports = mongoose.model('DroneSession', DroneSessionSchema);
