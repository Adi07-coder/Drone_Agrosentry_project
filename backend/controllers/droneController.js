const DroneSession = require('../models/DroneSession');
const MissionPlan  = require('../models/MissionPlan');

// ─────────────────────────────────────────────────────────
// DRONE SESSION ENDPOINTS
// ─────────────────────────────────────────────────────────

/**
 * POST /api/drone/session/start
 * Create a new drone session for the authenticated user.
 */
exports.startSession = async (req, res) => {
  try {
    const { sessionName, batteryStart, missionPlanId } = req.body;
    const session = await DroneSession.create({
      userId:      req.user.id,
      sessionName: sessionName || `Flight ${new Date().toLocaleString()}`,
      batteryStart,
      missionPlanId: missionPlanId || null,
      status: 'active',
    });
    res.status(201).json({ success: true, session });
  } catch (err) {
    console.error('startSession error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/drone/session/active
 * Get the most recent active session for the user.
 */
exports.getActiveSession = async (req, res) => {
  try {
    const session = await DroneSession.findOne({
      userId: req.user.id,
      status: 'active',
    })
      .sort({ startedAt: -1 })
      .populate('missionPlanId', 'name waypoints totalDistanceM');

    if (!session) {
      return res.json({ success: true, session: null });
    }
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/drone/session/:id/telemetry
 * Append a telemetry snapshot to the active session.
 */
exports.pushTelemetry = async (req, res) => {
  try {
    const { id } = req.params;
    const snap = req.body; // { battery, altitude, speed, heading, ... }

    const session = await DroneSession.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      {
        $push: {
          telemetryLog: {
            $each: [{ ...snap, timestamp: new Date() }],
            $slice: -500,             // keep last 500 snapshots
          },
        },
        // Update top-level aggregates if provided
        ...(snap.coverageArea  !== undefined && { coverageArea:  snap.coverageArea }),
        ...(snap.altitude      !== undefined && { $max: { maxAltitude: snap.altitude } }),
      },
      { new: true, select: '_id status telemetryLog' }
    );

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, snapshotCount: session.telemetryLog.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/drone/session/:id/command
 * Log a drone command execution.
 */
exports.logCommand = async (req, res) => {
  try {
    const { id } = req.params;
    const { command, params, success = true, message } = req.body;

    await DroneSession.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      {
        $push: { commandLog: { command, params, success, message, timestamp: new Date() } },
        ...(command === 'MISSION_START' && { missionStatus: 'running', flightMode: 'MISSION' }),
        ...(command === 'MISSION_PAUSE' && { missionStatus: 'paused' }),
        ...(command === 'MISSION_RESUME' && { missionStatus: 'running' }),
        ...(command === 'MISSION_ABORT'  && { missionStatus: 'aborted', flightMode: 'RTH' }),
        ...(command === 'LAND'  && { flightMode: 'LAND' }),
        ...(command === 'HOVER' && { flightMode: 'HOVER' }),
        ...(command === 'RTH'   && { flightMode: 'RTH' }),
      }
    );

    res.json({ success: true, command });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/drone/session/:id/end
 * Mark a session as completed or aborted.
 */
exports.endSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'completed', batteryEnd, totalFlightTime, coverageArea, waterUsed } = req.body;

    const session = await DroneSession.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      {
        status,
        completedAt: new Date(),
        ...(batteryEnd     !== undefined && { batteryEnd }),
        ...(totalFlightTime !== undefined && { totalFlightTime }),
        ...(coverageArea   !== undefined && { coverageArea }),
        ...(waterUsed      !== undefined && { waterUsed }),
      },
      { new: true }
    );

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/drone/sessions
 * Get all sessions for the authenticated user (paginated).
 */
exports.getSessions = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      DroneSession.find({ userId: req.user.id })
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-telemetryLog')          // exclude heavy telemetry array from list view
        .populate('missionPlanId', 'name'),
      DroneSession.countDocuments({ userId: req.user.id }),
    ]);

    res.json({ success: true, sessions, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/drone/sessions/:id
 * Get one full session (including telemetry log).
 */
exports.getSession = async (req, res) => {
  try {
    const session = await DroneSession.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).populate('missionPlanId', 'name waypoints');

    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/drone/stats
 * Aggregate flight stats for the user (used by real-time dashboard).
 */
exports.getDroneStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [stats] = await DroneSession.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId.toString()) } },
      {
        $group: {
          _id: null,
          totalSessions:    { $sum: 1 },
          completedFlights: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalFlightTime:  { $sum: '$totalFlightTime' },
          totalCoverage:    { $sum: '$coverageArea' },
          totalWaterUsed:   { $sum: '$waterUsed' },
          avgBattery:       { $avg: '$batteryEnd' },
        },
      },
    ]);

    const activeSession = await DroneSession.findOne({ userId, status: 'active' }).select('_id sessionName startedAt flightMode missionStatus');

    res.json({
      success: true,
      stats: stats || { totalSessions: 0, completedFlights: 0, totalFlightTime: 0, totalCoverage: 0, totalWaterUsed: 0, avgBattery: null },
      activeSession: activeSession || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// MISSION PLAN ENDPOINTS
// ─────────────────────────────────────────────────────────

/**
 * POST /api/drone/mission
 * Save a new mission plan.
 */
exports.saveMission = async (req, res) => {
  try {
    const {
      name, description, waypoints, boundaryPolygon,
      totalDistanceM, estimatedTimeMin, coverageAreaHa,
      waterRequiredL, originLat, originLng,
    } = req.body;

    if (!waypoints || waypoints.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one waypoint is required' });
    }

    const mission = await MissionPlan.create({
      userId: req.user.id,
      name: name || `Mission ${new Date().toLocaleDateString()}`,
      description,
      waypoints,
      boundaryPolygon: boundaryPolygon || [],
      totalDistanceM:  totalDistanceM  || 0,
      estimatedTimeMin: estimatedTimeMin || 0,
      coverageAreaHa:  coverageAreaHa  || 0,
      waterRequiredL:  waterRequiredL  || 0,
      originLat, originLng,
    });

    res.status(201).json({ success: true, mission, message: `Mission "${mission.name}" saved to cloud` });
  } catch (err) {
    console.error('saveMission error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/drone/missions
 * List all missions for the user.
 */
exports.getMissions = async (req, res) => {
  try {
    const missions = await MissionPlan.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .select('name description status waypoints totalDistanceM estimatedTimeMin coverageAreaHa updatedAt');

    res.json({ success: true, missions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/drone/mission/:id
 * Get one full mission plan.
 */
exports.getMission = async (req, res) => {
  try {
    const mission = await MissionPlan.findOne({ _id: req.params.id, userId: req.user.id });
    if (!mission) return res.status(404).json({ success: false, message: 'Mission not found' });
    res.json({ success: true, mission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/drone/mission/:id
 * Update an existing mission plan.
 */
exports.updateMission = async (req, res) => {
  try {
    const allowed = ['name', 'description', 'waypoints', 'boundaryPolygon',
      'totalDistanceM', 'estimatedTimeMin', 'coverageAreaHa', 'waterRequiredL', 'status'];
    const update = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

    const mission = await MissionPlan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      update,
      { new: true, runValidators: true }
    );

    if (!mission) return res.status(404).json({ success: false, message: 'Mission not found' });
    res.json({ success: true, mission, message: 'Mission updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/drone/mission/:id
 * Delete a mission plan.
 */
exports.deleteMission = async (req, res) => {
  try {
    const mission = await MissionPlan.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!mission) return res.status(404).json({ success: false, message: 'Mission not found' });
    res.json({ success: true, message: 'Mission deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
