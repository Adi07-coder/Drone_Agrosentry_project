const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  action: {
    type: String,
    required: true,
    enum: ["login", "logout", "upload", "detection", "symptom_diagnosis", "settings_change", "account_creation"],
  },

  description: {
    type: String,
    required: true,
  },

  ipAddress: {
    type: String,
  },

  userAgent: {
    type: String,
  },

  status: {
    type: String,
    enum: ["success", "failed"],
    default: "success",
  },

  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1 });
ActivityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
