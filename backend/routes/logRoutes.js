const express = require("express");
const router = express.Router();
const { getLoginLogs } = require("../controllers/logController");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", authenticate, authorize("admin"), getLoginLogs);

module.exports = router;
