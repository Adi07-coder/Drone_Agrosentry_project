const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  detectDisease,
  getDetections,
  getDetectionById,
  getSystemStats,
  getRealtimeHistory,
  getUploadHistory,
  downloadFile,
  logRealtimeDetection,
  saveVideo
} = require("../controllers/detectionController");
const { authenticate } = require("../middleware/auth");
const { validateImageUpload } = require("../middleware/validate");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG and PNG images are allowed"));
    }
  }
});

const videoUpload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["video/mp4", "video/webm"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only MP4 and WebM videos are allowed"));
    }
  }
});

// Protected prediction endpoints (Clerk auth required)
router.post("/predict", authenticate, upload.single("image"), validateImageUpload, detectDisease);
router.post("/upload", authenticate, upload.single("image"), validateImageUpload, detectDisease);
router.post("/realtime", authenticate, upload.single("image"), validateImageUpload, detectDisease);

// Video saving endpoint
router.post("/realtime/video", authenticate, videoUpload.single("video"), saveVideo);

// Internal server-to-server route (Flask -> Node)
router.post("/realtime/log", logRealtimeDetection);

// Protected endpoints
router.get("/", authenticate, getDetections);
router.get("/history", authenticate, getDetections);
router.get("/realtime/history", authenticate, getRealtimeHistory);
router.get("/upload/history", authenticate, getUploadHistory);

// Download endpoints
router.get("/download/realtime/csv", authenticate, downloadFile("realtime", "csv"));
router.get("/download/realtime/excel", authenticate, downloadFile("realtime", "xlsx"));
router.get("/download/upload/csv", authenticate, downloadFile("upload", "csv"));
router.get("/download/upload/excel", authenticate, downloadFile("upload", "xlsx"));

router.get("/stats/system", authenticate, getSystemStats);
router.get("/:id", authenticate, getDetectionById);

module.exports = router;
