require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // 1. Allow server-to-server requests (no origin)
    if (!origin) return callback(null, true);
    
    // 2. Allow if explicitly listed in CORS_ORIGIN or if wildcard '*' is used
    const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5175').split(',').map(o => o.trim());
    if (allowed.includes('*') || allowed.includes(origin)) {
      return callback(null, true);
    }
    
    // 3. Allow all localhost and standard LAN IPs (10.x, 192.168.x, 172.x) with or without ports
    if (/^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    
    // 4. Allow any local hostname without dots (e.g., http://my-pc:5173)
    try {
      const hostname = new URL(origin).hostname;
      if (!hostname.includes('.')) return callback(null, true);
    } catch(e) {}

    console.warn(`CORS block triggered for origin: ${origin}`);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware


// Static files
app.use("/uploads", express.static("uploads"));

// =========================
// ROUTES
// =========================

const authRoutes    = require("./routes/authRoutes");
const detectionRoutes = require("./routes/detectionRoutes");
const adminRoutes   = require("./routes/adminRoutes");
const symptomRoutes = require("./routes/symptomRoutes");
const logRoutes     = require("./routes/logRoutes");
const droneRoutes   = require("./routes/droneRoutes");

app.use("/api/auth",      authRoutes);
app.use("/api/detection", detectionRoutes);
app.use("/api/detect",    detectionRoutes);  // Alias
app.use("/api/admin",     adminRoutes);
app.use("/api/detect/symptom",    symptomRoutes);
app.use("/api/detection/symptom", symptomRoutes);
app.use("/api/logs",  logRoutes);
app.use("/api/drone", droneRoutes); // Drone control + mission plans

// Analytics API Endpoint
const { getSystemStats } = require("./controllers/detectionController");
const { authenticate } = require("./middleware/auth");
app.get("/api/analytics", authenticate, getSystemStats);

// Health check endpoints
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// =========================
// MONGODB CONNECTION
// =========================

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✓ MongoDB Connected Successfully!");
  })
  .catch((err) => {
    console.error("✗ MongoDB Connection Error:", err.message);
  });

// =========================
// ERROR HANDLING
// =========================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Global error handler
app.use(errorHandler);

// =========================
// LOCAL STORAGE INIT
// =========================
const fs = require('fs');
const path = require('path');
const storageDirs = [
  '../../local_storage/upload_detection/images',
  '../../local_storage/realtime_detection/images',
  '../../local_storage/csv_reports',
  '../../local_storage/excel_reports',
  '../../local_storage/exported_images',
  '../../local_storage/logs',
  'uploads'
];
storageDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server Running on Port ${PORT} (0.0.0.0)`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

