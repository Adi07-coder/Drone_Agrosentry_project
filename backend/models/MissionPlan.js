const mongoose = require('mongoose');

const WaypointSchema = new mongoose.Schema({
  seq:      { type: Number, required: true },
  label:    { type: String, default: 'WP' },
  lat:      { type: Number, required: true },
  lng:      { type: Number, required: true },
  alt:      { type: Number, default: 30 },
  speed:    { type: Number, default: 5 },
  holdTime: { type: Number, default: 0 },
  action:   {
    type: String,
    enum: ['FLY_THROUGH', 'HOVER', 'CAPTURE_IMAGE', 'START_SPRINKLING', 'STOP_SPRINKLING', 'RETURN_HOME'],
    default: 'FLY_THROUGH',
  },
}, { _id: false });

const MissionPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Mission name is required'],
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft',
    index: true,
  },
  waypoints: {
    type: [WaypointSchema],
    default: [],
    validate: [arr => arr.length <= 200, 'Maximum 200 waypoints per mission'],
  },
  // Polygon boundary (for coverage generation)
  boundaryPolygon: {
    type: [[Number]],  // [[lat, lng], ...]
    default: [],
  },
  // Computed mission metadata
  totalDistanceM:  { type: Number, default: 0 },
  estimatedTimeMin: { type: Number, default: 0 },
  coverageAreaHa:   { type: Number, default: 0 },
  waterRequiredL:   { type: Number, default: 0 },
  // Export format
  format: {
    type: String,
    enum: ['agrosentry', 'qgc', 'ardupilot'],
    default: 'agrosentry',
  },
  // GPS origin used when mission was planned
  originLat: { type: Number },
  originLng: { type: Number },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

MissionPlanSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('MissionPlan', MissionPlanSchema);
