const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/droneController');

// All drone routes require authentication
router.use(authenticate);

// ── Drone Session ─────────────────────────────────────────
router.post  ('/session/start',      ctrl.startSession);
router.get   ('/session/active',     ctrl.getActiveSession);
router.post  ('/session/:id/telemetry', ctrl.pushTelemetry);
router.post  ('/session/:id/command',   ctrl.logCommand);
router.patch ('/session/:id/end',    ctrl.endSession);
router.get   ('/sessions',           ctrl.getSessions);
router.get   ('/sessions/:id',       ctrl.getSession);
router.get   ('/stats',              ctrl.getDroneStats);

// ── Mission Plans ─────────────────────────────────────────
router.post  ('/mission',            ctrl.saveMission);
router.get   ('/missions',           ctrl.getMissions);
router.get   ('/mission/:id',        ctrl.getMission);
router.put   ('/mission/:id',        ctrl.updateMission);
router.delete('/mission/:id',        ctrl.deleteMission);

module.exports = router;
