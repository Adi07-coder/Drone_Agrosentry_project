const express = require("express");
const router = express.Router();
const {
  adminLogin,
  adminSignup,
  adminForgotPassword,
  adminResetPassword,
  getAllUsers,
  updateUser,
  deleteUser,
  getActivityLog,
  getSystemStats,
  generateReport,
} = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/auth");

// ============================================================
// PUBLIC ROUTES — No authentication required
// ============================================================
router.post("/login", adminLogin);
router.post("/signup", adminSignup);
router.post("/forgot-password", adminForgotPassword);
router.post("/reset-password", adminResetPassword);

// ============================================================
// PROTECTED ROUTES — Require authentication + admin role
// ============================================================
router.use(authenticate, authorize("admin"));

// User management
router.get("/users", getAllUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// System stats
router.get("/stats", getSystemStats);

// Activity logs
router.get("/activity-log", getActivityLog);

// Reports
router.post("/reports", generateReport);

module.exports = router;
