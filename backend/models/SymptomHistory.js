const mongoose = require("mongoose");

const SymptomHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  symptoms: {
    type: [String],
    required: true
  },
  additionalNotes: {
    type: String,
    default: ""
  },
  diseaseName: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true
  },
  severity: {
    type: String,
    enum: ["High", "Medium", "Low", "Unknown"],
    default: "Unknown"
  },
  recommendation: {
    type: String,
    required: true
  },
  treatment: {
    type: String,
    default: ""
  },
  fertilizer: {
    type: String,
    default: ""
  },
  prevention: {
    type: String,
    default: ""
  },
  symptomsMatched: {
    type: [String],
    default: []
  },
  additionalDiagnoses: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

SymptomHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("SymptomHistory", SymptomHistorySchema);
