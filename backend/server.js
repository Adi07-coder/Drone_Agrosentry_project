require("dotenv").config();

const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const mongoose   = require("mongoose");
const cors       = require("cors");
const errorHandler = require("./middleware/errorHandler");
const { initDroneSocket } = require("./sockets/droneSocket");

const app        = express();
const httpServer = http.createServer(app);

// ─── Socket.IO setup ──────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5175').split(',').map(o => o.trim());
      if (allowed.includes('*') || allowed.includes(origin)) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin))
        return callback(null, true);
      callback(new Error(`Socket CORS block: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Initialize the /drone Socket.IO namespace
initDroneSocket(io);

// ─── Express Middleware ───────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5175').split(',').map(o => o.trim());
    if (allowed.includes('*') || allowed.includes(origin)) return callback(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin))
      return callback(null, true);
    try {
      const hostname = new URL(origin).hostname;
      if (!hostname.includes('.')) return callback(null, true);
    } catch(e) {}
    console.warn(`CORS block triggered for origin: ${origin}`);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static files ─────────────────────────────────────────────────────────────
app.use("/uploads", express.static("uploads"));

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes      = require("./routes/authRoutes");
const detectionRoutes = require("./routes/detectionRoutes");
const adminRoutes     = require("./routes/adminRoutes");
const symptomRoutes   = require("./routes/symptomRoutes");
const logRoutes       = require("./routes/logRoutes");
const droneRoutes     = require("./routes/droneRoutes");

app.use("/api/auth",             authRoutes);
app.use("/api/detection",        detectionRoutes);
app.use("/api/detect",           detectionRoutes);  // Alias
app.use("/api/admin",            adminRoutes);
app.use("/api/detect/symptom",   symptomRoutes);
app.use("/api/detection/symptom",symptomRoutes);
app.use("/api/logs",             logRoutes);
app.use("/api/drone",            droneRoutes);

// Analytics
const { getSystemStats } = require("./controllers/detectionController");
const { authenticate }   = require("./middleware/auth");
app.get("/api/analytics", authenticate, getSystemStats);

// Health checks
app.get("/health",     (req, res) => res.json({ status: "OK", timestamp: new Date().toISOString() }));
app.get("/api/health", (req, res) => res.json({ status: "OK", timestamp: new Date().toISOString() }));

// ─── MongoDB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✓ MongoDB Connected Successfully!"))
  .catch((err) => console.error("✗ MongoDB Connection Error:", err.message));

// ─── Error handling ───────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use(errorHandler);

// ─── Local storage init ───────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');
const storageDirs = [
  '../../local_storage/upload_detection/images',
  '../../local_storage/realtime_detection/images',
  '../../local_storage/csv_reports',
  '../../local_storage/excel_reports',
  '../../local_storage/exported_images',
  '../../local_storage/logs',
  'uploads',
];
storageDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server Running on Port ${PORT} (0.0.0.0)`);
  console.log(`✓ Socket.IO active on /drone namespace`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
