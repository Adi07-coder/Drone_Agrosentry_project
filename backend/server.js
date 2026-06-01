require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from any localhost port, or no origin (server-to-server)
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5175').split(',').map(o => o.trim());
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
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

const authRoutes = require("./routes/authRoutes");
const detectionRoutes = require("./routes/detectionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const symptomRoutes = require("./routes/symptomRoutes");
const logRoutes = require("./routes/logRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/detection", detectionRoutes);
app.use("/api/detect", detectionRoutes); // Alias to support both route formats
app.use("/api/admin", adminRoutes);
app.use("/api/detect/symptom", symptomRoutes);
app.use("/api/detection/symptom", symptomRoutes);
app.use("/api/logs", logRoutes);

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

app.listen(PORT, () => {
  console.log(`✓ Server Running on Port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

