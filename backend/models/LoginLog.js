const mongoose = require("mongoose");

const loginLogSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ["user", "admin"]
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  logoutTime: {
    type: Date,
    default: null
  },
  deviceInfo: {
    type: String,
    default: "Unknown Device"
  },
  ipAddress: {
    type: String,
    default: "Unknown IP"
  },
  actions: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("LoginLog", loginLogSchema);
