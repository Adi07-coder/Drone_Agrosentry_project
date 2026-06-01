const express = require("express");
const router = express.Router();
const { diagnoseSymptoms, getSymptomHistory } = require("../controllers/symptomController");
const { authenticate } = require("../middleware/auth");

router.post("/", authenticate, diagnoseSymptoms);
router.get("/history", authenticate, getSymptomHistory);

module.exports = router;
