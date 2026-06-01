const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Detection = require("../models/Detection");
const ActivityLog = require("../models/ActivityLog");

// ============================================================
// PUBLIC AUTH ROUTES (no authentication required)
// ============================================================

exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password");
    if (!admin) {
      console.log(`[adminLogin] Failed: Admin not found for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!admin.isActive) {
      console.log(`[adminLogin] Failed: Admin account deactivated for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Contact support.",
      });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      await ActivityLog.create({
        userId: admin._id,
        action: "login",
        description: "Failed admin login attempt",
        status: "failed",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      console.log(`[adminLogin] Failed: Password mismatch for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "7d" }
    );

    await ActivityLog.create({
      userId: admin._id,
      action: "login",
      description: "Admin logged in",
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: admin.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

exports.adminSignup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const admin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password,
      role: "admin",
    });

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "7d" }
    );

    await ActivityLog.create({
      userId: admin._id,
      action: "account_creation",
      description: "Admin account created",
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      token,
      user: admin.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

exports.adminForgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address",
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+resetToken +resetTokenExpiry");
    if (!admin) {
      // Return a generic message to avoid email enumeration
      return res.status(200).json({
        success: true,
        message: "If this email is registered, a reset token has been generated.",
      });
    }

    // Generate a secure 32-byte hex reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    admin.resetToken = resetToken;
    admin.resetTokenExpiry = resetTokenExpiry;
    await admin.save();

    await ActivityLog.create({
      userId: admin._id,
      action: "settings_change",
      description: "Password reset token generated",
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    // In production: send email. For demo, return token in response.
    res.status(200).json({
      success: true,
      message: "Password reset token generated successfully",
      // NOTE: In production, REMOVE the resetToken from the response and email it instead.
      resetToken,
      expiresAt: resetTokenExpiry,
      note: "Use this token to reset your password. Valid for 1 hour.",
    });
  } catch (error) {
    next(error);
  }
};

exports.adminResetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reset token and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const admin = await Admin.findOne({
      resetToken,
      resetTokenExpiry: { $gt: new Date() },
    }).select("+resetToken +resetTokenExpiry");

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    admin.password = newPassword;
    admin.resetToken = null;
    admin.resetTokenExpiry = null;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PROTECTED ADMIN MANAGEMENT ROUTES (authentication required)
// ============================================================

exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "", role = "" } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    if (role && role !== "all") {
      query.role = role;
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
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

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, isActive, preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(typeof isActive === "boolean" && { isActive }),
        ...(preferences && { preferences }),
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.isActive = false;
    await user.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "settings_change",
      description: `Admin deactivated user ${user.email}`,
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { targetUserId: id }
    });

    res.status(200).json({
      success: true,
      message: "User deactivated successfully"
    });
  } catch (error) {
    next(error);
  }
};

exports.getActivityLog = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, userId = "", action = "" } = req.query;

    let query = {};
    if (userId) {
      query.userId = userId;
    }
    if (action) {
      query.action = action;
    }

    const logs = await ActivityLog.find(query)
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      logs,
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

exports.getSystemStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalAdmins = await Admin.countDocuments();
    const totalDetections = await Detection.countDocuments();
    const healthyDetections = await Detection.countDocuments({ status: "Healthy" });
    const diseasedDetections = await Detection.countDocuments({ status: "Diseased" });

    const activeUsersToday = await ActivityLog.countDocuments({
      action: "login",
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    const topDiseases = await Detection.aggregate([
      {
        $group: {
          _id: "$disease",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const diseaseDistribution = topDiseases.map((d, index) => {
      const colors = ['#22c55e', '#84cc16', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
      return {
        name: d._id || "Healthy",
        value: d.count,
        color: colors[index % colors.length]
      };
    });

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
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const scansPerDay = [];
    
    dailyStats.forEach(stat => {
      const date = new Date(stat._id);
      scansPerDay.push({
        day: days[date.getDay() === 0 ? 6 : date.getDay() - 1] || stat._id,
        scans: stat.count
      });
    });

    if (scansPerDay.length === 0) {
      scansPerDay.push({ day: "Today", scans: totalDetections });
    }

    const avgConfidence = await Detection.aggregate([
      {
        $group: {
          _id: null,
          avgConfidence: { $avg: "$confidence" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalDetections,
        healthyDetections,
        diseasedDetections,
        activeUsersToday,
        topDiseases,
        diseaseDistribution,
        scansPerDay,
        averageConfidence: avgConfidence[0]?.avgConfidence || 0,
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.generateReport = async (req, res, next) => {
  try {
    const { startDate, endDate, type = "all" } = req.body;

    let detectionQuery = {};
    if (startDate || endDate) {
      detectionQuery.createdAt = {};
      if (startDate) detectionQuery.createdAt.$gte = new Date(startDate);
      if (endDate) detectionQuery.createdAt.$lte = new Date(endDate);
    }

    const detections = await Detection.find(detectionQuery)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    const report = {
      generatedAt: new Date(),
      type,
      dateRange: { startDate, endDate },
      totalDetections: detections.length,
      healthyCount: detections.filter(d => d.status === "Healthy").length,
      diseasedCount: detections.filter(d => d.status === "Diseased").length,
      averageConfidence: detections.length > 0
        ? (detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length).toFixed(2)
        : 0,
      diseaseDistribution: {},
      plantDistribution: {},
      detections: detections.map(d => ({
        _id: d._id,
        user: d.userId?.name || "Anonymous",
        plant: d.plant,
        disease: d.disease,
        status: d.status,
        confidence: d.confidence,
        date: d.createdAt
      }))
    };

    // Count disease distribution
    detections.forEach(d => {
      report.diseaseDistribution[d.disease] = (report.diseaseDistribution[d.disease] || 0) + 1;
      report.plantDistribution[d.plant] = (report.plantDistribution[d.plant] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    next(error);
  }
};
