const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/droneController');

// All drone routes require authentication
router.use(authenticate);

// ── Real-time status / telemetry / location ───────────────
router.get   ('/status',            ctrl.getDroneStatus);
router.get   ('/telemetry',         ctrl.getDroneTelemetry);
router.get   ('/location',          ctrl.getDroneLocation);
router.get   ('/camera-status',     ctrl.getCameraStatus);

// ── Flight command shortcuts ──────────────────────────────
router.post  ('/takeoff',           ctrl.commandTakeoff);
router.post  ('/land',              ctrl.commandLand);
router.post  ('/hover',             ctrl.commandHover);
router.post  ('/return-home',       ctrl.commandReturnHome);

// ── Sprinkling command shortcuts ──────────────────────────
router.post  ('/sprinkling/start',  ctrl.commandSprinklingStart);
router.post  ('/sprinkling/stop',   ctrl.commandSprinklingStop);
router.post  ('/sprinkling/timed',  ctrl.commandTimedSprinkling);

// ── Activity log ──────────────────────────────────────────
router.get   ('/activity',          ctrl.getActivityLog);

// ── Mission history (separate from CRUD) ──────────────────
router.get   ('/missions/history',  ctrl.getMissionHistory);

// ── Drone Session lifecycle ───────────────────────────────
router.post  ('/session/start',        ctrl.startSession);
router.get   ('/session/active',       ctrl.getActiveSession);
router.post  ('/session/:id/telemetry', ctrl.pushTelemetry);
router.post  ('/session/:id/command',   ctrl.logCommand);
router.patch ('/session/:id/end',      ctrl.endSession);
router.get   ('/sessions',             ctrl.getSessions);
router.get   ('/sessions/:id',         ctrl.getSession);
router.get   ('/stats',                ctrl.getDroneStats);

// ── Mission Plans CRUD ────────────────────────────────────
router.post  ('/mission',        ctrl.saveMission);
router.get   ('/missions',       ctrl.getMissions);
router.get   ('/mission/:id',    ctrl.getMission);
router.put   ('/mission/:id',    ctrl.updateMission);
router.delete('/mission/:id',    ctrl.deleteMission);

module.exports = router;
