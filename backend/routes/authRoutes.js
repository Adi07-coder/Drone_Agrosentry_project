const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getProfile,
  refreshToken,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { validate, validateRegister, validateLogin } = require("../middleware/validate");

// Public routes
router.post("/register", validateRegister, validate, register);
router.post("/login", validateLogin, validate, login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, getProfile);
router.post("/refresh", authenticate, refreshToken);

module.exports = router;
