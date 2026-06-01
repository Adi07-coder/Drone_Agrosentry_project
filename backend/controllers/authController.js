const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Admin = require("../models/Admin");
const ActivityLog = require("../models/ActivityLog");
const LoginLog = require("../models/LoginLog");

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    let user;
    if (role === "admin") {
      user = await Admin.findOne({ email });
      if (user) {
        return res.status(400).json({ success: false, message: "Email already registered" });
      }
      user = await Admin.create({ name, email, password, role: "admin" });
    } else {
      user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ success: false, message: "Email already registered" });
      }
      user = await User.create({ name, email, password, role: "user" });
    }

    const token = generateToken(user._id, role);

    await ActivityLog.create({
      userId: user._id,
      action: "account_creation",
      description: `${role} account created`,
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, role = "user" } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    let user;
    if (role === "admin") {
      user = await Admin.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } else {
      user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      await ActivityLog.create({
        userId: user._id,
        action: "login",
        description: "Failed login attempt",
        status: "failed",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    await ActivityLog.create({
      userId: user._id,
      action: "login",
      description: `${user.role} logged in`,
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await ActivityLog.create({
      userId,
      action: "logout",
      description: "User logged out",
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      const admin = await Admin.findById(req.user.id);
      if (!admin) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      return res.status(200).json({ success: true, user: admin.toJSON() });
    }
    res.status(200).json({ success: true, user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      const admin = await Admin.findById(req.user.id);
      if (!admin) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      const token = generateToken(admin._id, admin.role);
      return res.status(200).json({ success: true, token });
    }

    const token = generateToken(user._id, user.role);
    res.status(200).json({ success: true, token });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+resetToken +resetTokenExpiry");
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If this email is registered, a reset token has been generated.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset token generated successfully",
      resetToken,
      expiresAt: resetTokenExpiry,
      note: "Use this token to reset your password. Valid for 1 hour.",
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
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

    const user = await User.findOne({
      resetToken,
      resetTokenExpiry: { $gt: new Date() },
    }).select("+resetToken +resetTokenExpiry");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  refreshToken,
  forgotPassword,
  resetPassword,
};
