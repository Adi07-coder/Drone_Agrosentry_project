const mongoose = require("mongoose");

const DetectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },

  image: {
    type: String,
    required: true,
  },

  plant: {
    type: String,
    required: true,
  },

  disease: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    enum: ["Healthy", "Diseased", "Rejected", "Unknown"],
    required: true,
  },

  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },

  accuracy: {
    type: Number,
    default: 0,
  },

  processedAt: {
    type: Date,
    default: Date.now,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  }
});

DetectionSchema.index({ userId: 1, createdAt: -1 });
DetectionSchema.index({ disease: 1 });
DetectionSchema.index({ status: 1 });

module.exports = mongoose.model("Detection", DetectionSchema);