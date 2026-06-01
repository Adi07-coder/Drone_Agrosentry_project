const mongoose = require("mongoose");

const UploadPredictionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: false,
  },
  plantName: {
    type: String,
    required: true,
  },
  diseaseName: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  detectionType: {
    type: String,
    default: "upload",
  },
  imagePath: {
    type: String,
    required: false,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  }
});

module.exports = mongoose.model("UploadPrediction", UploadPredictionSchema, "uploadpredictions");
