const path = require("path");
const { execFile } = require("child_process");
const Detection = require("../models/Detection");
const ActivityLog = require("../models/ActivityLog");
const RealtimePrediction = require("../models/RealtimePrediction");
const UploadPrediction = require("../models/UploadPrediction");
// const geminiDetection = require("../gemini/geminiDetection");
const fs = require("fs");
const fsp = fs.promises;

exports.detectDisease = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded"
      });
    }

    const imagePath = req.file.path;
    const userId = req.user?.id;

    // Cache upload in local_storage folder to synchronize file systems
    try {
      const isRealtime = req.path.includes("realtime");
      const targetSubdir = isRealtime ? "realtime_detection" : "upload_detection";
      const targetDir = path.join(__dirname, `../../local_storage/${targetSubdir}/images`);
      await fsp.mkdir(targetDir, { recursive: true });
      await fsp.copyFile(imagePath, path.join(targetDir, path.basename(imagePath)));
    } catch (fsErr) {
      console.error("Local storage caching warning:", fsErr.message);
    }

    try {
      const pythonScriptPath = path.join(__dirname, "../../scripts/predict.py");
      const pythonExecutable = process.env.PYTHON_PATH || "python3";

      if (!fs.existsSync(pythonScriptPath)) {
        console.error("Missing AI Environment: Script not found at", pythonScriptPath);
        return res.status(500).json({
          success: false,
          message: "Internal Server Error: AI Engine is misconfigured or missing."
        });
      }

      if (!fs.existsSync(imagePath)) {
        console.error("Missing file safeguard triggered: File missing at", imagePath);
        return res.status(400).json({
          success: false,
          message: "Upload failed: Image file was lost before processing."
        });
      }
      
      const output = await new Promise((resolve) => {
        execFile(pythonExecutable, [pythonScriptPath, '--image', imagePath], { maxBuffer: 1024 * 1024 * 50, timeout: 45000 }, (error, stdout, stderr) => {
          if (error) {
            console.error("Python Execution Error:", error);
            console.error("Python Stderr:", stderr);
            return resolve({ plantName: "None" });
          }
          try {
            // Find the last valid JSON object in stdout in case of extra prints
            const lines = stdout.trim().split('\n');
            const lastLine = lines[lines.length - 1];
            const parsed = JSON.parse(lastLine);
            resolve(parsed);
          } catch (parseErr) {
            console.error("Python JSON Parse Error:", parseErr);
            console.error("Raw stdout:", stdout);
            console.error("Raw stderr:", stderr);
            resolve({ 
              plantName: "None", 
              diseaseName: "Analysis Failed",
              status: "Rejected",
              confidence: 0,
              symptoms: [],
              treatment: [],
              fertilizer: [],
              prevention: ""
            });
          }
        });
      });

      if (!output || output.plantName === 'None') {
        return res.status(400).json({
          success: false,
          message: "Could not detect a plant in the image.",
          subPrediction: output
        });
      }

      const savedDetection = await Detection.create({
        userId: userId,
        image: imagePath,
        plant: output.plantName,
        disease: output.diseaseName,
        status: output.status,
        confidence: output.confidence,
        accuracy: output.confidence,
        processedAt: new Date(),
      });

      if (userId) {
        await ActivityLog.create({
          userId,
          action: "detection",
          description: `Plant disease detection: ${output.plantName} - ${output.diseaseName}`,
          status: "success",
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          metadata: {
            confidence: output.confidence,
            detectionId: savedDetection._id,
          },
        });
      }

      const isRealtime = req.path.includes("realtime");
      
      let subPrediction;
      if (isRealtime) {
        subPrediction = await RealtimePrediction.create({
          userId: userId || null,
          plantName: output.plantName,
          diseaseName: output.diseaseName,
          confidence: output.confidence,
          status: output.status,
          detectionType: "realtime",
          imagePath: imagePath,
          timestamp: new Date()
        });
      } else {
        subPrediction = await UploadPrediction.create({
          userId: userId || null,
          plantName: output.plantName,
          diseaseName: output.diseaseName,
          confidence: output.confidence,
          status: output.status,
          detectionType: "upload",
          imagePath: imagePath,
          timestamp: new Date()
        });
      }

      // Add the extra Gemini fields for the frontend to consume
      const fullResponseData = {
        ...subPrediction.toJSON(),
        symptoms: output.symptoms,
        treatment: output.treatment,
        fertilizer: output.fertilizer,
        prevention: output.prevention
      };

      res.json({
        success: true,
        detection: savedDetection,
        subPrediction: fullResponseData
      });

    } catch (aiError) {
      console.error("Gemini AI error:", aiError);
      res.status(500).json({
        success: false,
        message: "Error analyzing image with AI"
      });
    }

  } catch (error) {
    next(error);
  }
};

exports.getDetections = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    let query = {};
    if (userId) {
      query.userId = userId;
    }

    const detections = await Detection.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Detection.countDocuments(query);

    res.status(200).json({
      success: true,
      detections,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDetectionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    let query = { _id: id };
    if (userId) {
      query.userId = userId;
    }

    const detection = await Detection.findOne(query);

    if (!detection) {
      return res.status(404).json({
        success: false,
        message: "Detection not found"
      });
    }

    res.status(200).json({
      success: true,
      detection
    });
  } catch (error) {
    next(error);
  }
};

exports.getSystemStats = async (req, res, next) => {
  try {
    const totalDetections = await Detection.countDocuments();
    const healthyCount = await Detection.countDocuments({ status: "Healthy" });
    const diseasedCount = await Detection.countDocuments({ status: "Diseased" });

    const recentDetections = await Detection.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const avgConfidence = await Detection.aggregate([
      {
        $group: {
          _id: null,
          avgConfidence: { $avg: "$confidence" }
        }
      }
    ]);

    // Calculate time-series data for the last 7 days for charts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await Detection.aggregate([
      {
        $match: { createdAt: { $gte: sevenDaysAgo } }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          avgConfidence: { $avg: "$confidence" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const chartLabels = [];
    const chartScans = [];
    const chartAccuracy = [];
    
    // Default to at least the days we found, or a fallback if empty
    dailyStats.forEach(stat => {
      const date = new Date(stat._id);
      chartLabels.push(days[date.getDay() === 0 ? 6 : date.getDay() - 1] || stat._id);
      chartScans.push(stat.count);
      chartAccuracy.push(Math.round(stat.avgConfidence));
    });

    if (chartLabels.length === 0) {
      chartLabels.push("Today");
      chartScans.push(totalDetections);
      chartAccuracy.push(Math.round(avgConfidence[0]?.avgConfidence || 0));
    }

    res.status(200).json({
      success: true,
      stats: {
        totalDetections,
        healthyCount,
        diseasedCount,
        averageConfidence: avgConfidence[0]?.avgConfidence || 0,
        recentDetections,
        chartData: {
          labels: chartLabels,
          scans: chartScans,
          accuracy: chartAccuracy
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRealtimeHistory = async (req, res, next) => {
  try {
    const records = await RealtimePrediction.find().sort({ timestamp: -1 });
    res.status(200).json({ success: true, history: records });
  } catch (error) {
    next(error);
  }
};

exports.logRealtimeDetection = async (req, res, next) => {
  try {
    const { plant, disease, confidence, status } = req.body;
    
    // Create prediction record
    const subPrediction = await RealtimePrediction.create({
      plantName: plant,
      diseaseName: disease,
      confidence: confidence,
      status: status,
      detectionType: "realtime",
      timestamp: new Date()
    });
    
    // We omit ActivityLog since this runs continuously and would flood it,
    // but the subPrediction is saved for history.

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

exports.getUploadHistory = async (req, res, next) => {
  try {
    const records = await UploadPrediction.find().sort({ timestamp: -1 });
    res.status(200).json({ success: true, history: records });
  } catch (error) {
    next(error);
  }
};

exports.downloadFile = (type, format) => {
  return async (req, res, next) => {
    try {
      const records = type === "realtime" 
        ? await RealtimePrediction.find().sort({ timestamp: -1 })
        : await UploadPrediction.find().sort({ timestamp: -1 });

      if (records.length === 0) {
        return res.status(404).json({ success: false, message: `No history data found.` });
      }

      if (format === 'csv') {
        const header = ["Timestamp", "Plant Name", "Disease Name", "Confidence", "Status"];
        const rows = records.map(r => [
          new Date(r.timestamp).toLocaleString(),
          r.plantName,
          r.diseaseName,
          r.confidence,
          r.status
        ]);
        
        const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_history.csv`);
        return res.send(csvContent);
      } else {
        // Just return CSV for now as a fallback for 'excel' requested format 
        // to avoid installing new heavy packages like exceljs
        const header = ["Timestamp", "Plant Name", "Disease Name", "Confidence", "Status"];
        const rows = records.map(r => [
          new Date(r.timestamp).toLocaleString(),
          r.plantName,
          r.diseaseName,
          r.confidence,
          r.status
        ]);
        
        const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_history.csv`);
        return res.send(csvContent);
      }
    } catch (error) {
      next(error);
    }
  };
};

// Endpoint to save recorded video
exports.saveVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No video uploaded" });
    }

    const videoPath = req.file.path;
    const targetDir = path.join(__dirname, `../../local_storage/realtime_detection/videos`);
    await fsp.mkdir(targetDir, { recursive: true });
    await fsp.copyFile(videoPath, path.join(targetDir, path.basename(videoPath)));

    res.status(200).json({ success: true, message: "Video saved successfully" });
  } catch (error) {
    next(error);
  }
};
