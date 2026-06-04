const DroneSession     = require('../models/DroneSession');
const MissionPlan      = require('../models/MissionPlan');
const DroneActivityLog = require('../models/DroneActivityLog');

// ─────────────────────────────────────────────────────────
// HELPER — log activity
// ─────────────────────────────────────────────────────────
async function logActivity(userId, eventType, opts = {}) {
  try {
    await DroneActivityLog.create({
      userId,
      sessionId:  opts.sessionId || null,
      missionId:  opts.missionId || null,
      eventType,
      status:     opts.status   || 'success',
      eventData:  opts.eventData || {},
      summary:    opts.summary  || eventType,
      operator:   opts.operator || 'operator',
      source:     opts.source   || 'api',
    });
  } catch (_) { /* fire and forget */ }
}

// ─────────────────────────────────────────────────────────
// GET /api/drone/status
// Returns a simulated drone status snapshot for dashboard display.
// Future: pull from MAVLink HEARTBEAT / MQTT status topic.
// ─────────────────────────────────────────────────────────
exports.getDroneStatus = async (req, res) => {
  try {
    const { getSimState } = require('../sockets/droneSocket');
    const sim = getSimState();
    const activeSession = await DroneSession.findOne({ userId: req.user.id, status: 'active' })
      .select('_id sessionName flightMode missionStatus startedAt').lean();

    res.json({
      success: true,
      status: {
        connected:    true,   // Future: real hardware heartbeat check
        armed:        sim.isFlying,
        flying:       sim.isFlying,
        flightMode:   activeSession?.flightMode   || 'IDLE',
        missionStatus: activeSession?.missionStatus || 'idle',
        sessionId:    activeSession?._id || null,
        sessionName:  activeSession?.sessionName || null,
      },
      timestamp: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/drone/telemetry
// Returns the latest telemetry from the simulated state.
// Future: subscribe to MAVLink stream and return most recent packet.
// ─────────────────────────────────────────────────────────
exports.getDroneTelemetry = async (req, res) => {
  try {
    const { getSimState } = require('../sockets/droneSocket');
    const snap = getSimState();

    // Enrich with last DB telemetry if session active
    const session = await DroneSession.findOne({ userId: req.user.id, status: 'active' })
      .select('telemetryLog').lean();

    const lastLog = session?.telemetryLog?.at(-1);

    res.json({
      success: true,
      telemetry: {
        battery:         snap.battery,
        altitude:        snap.altitude,
        speed:           snap.speed,
        heading:         snap.heading,
        gpsLock:         snap.gpsLock,
        satellites:      snap.satellites,
        signalStrength:  snap.signalStrength,
        flowRate:        snap.flowRate,
        tankLevel:       lastLog?.tankLevel  ?? snap.tankLevel,
        coverageArea:    lastLog?.coverageArea ?? 0,
        missionProgress: lastLog?.missionProgress ?? 0,
        lat:             snap.lat,
        lng:             snap.lng,
        verticalSpeed:   snap.verticalSpeed,
        flightMode:      snap.flightMode,
        remainingFlightTime: snap.remainingFlightTime,
        timestamp:       snap.timestamp,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/drone/location
// GPS coordinates for mission planner live centering.
// ─────────────────────────────────────────────────────────
exports.getDroneLocation = async (req, res) => {
  try {
    const { getSimState } = require('../sockets/droneSocket');
    const sim = getSimState();
    res.json({
      success:  true,
      location: {
        lat:      sim.lat,
        lng:      sim.lng,
        altitude: sim.altitude,
        heading:  sim.heading,
        accuracy: 3.5,       // Future: from GPS_RAW_INT.h_acc
        satellites: sim.satellites,
        gpsLock:    sim.gpsLock,
        timestamp:  Date.now(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/drone/camera-status
// Simulated camera health. Future: HTTP probe to onboard camera API.
// ─────────────────────────────────────────────────────────
exports.getCameraStatus = async (req, res) => {
  res.json({
    success: true,
    camera: {
      connected:   true,
      streaming:   false,
      resolution:  '1080p',
      fps:         30,
      format:      'H.264',
      streamUrl:   null, // Future: rtsp://drone-local:8554/live
      health:      'ok',
      timestamp:   Date.now(),
    },
  });
};

// ─────────────────────────────────────────────────────────
// POST /api/drone/takeoff
// ─────────────────────────────────────────────────────────
exports.commandTakeoff = async (req, res) => {
  try {
    const { altitude = 10 } = req.body;
    const activeSession = await DroneSession.findOne({ userId: req.user.id, status: 'active' })
      .select('_id').lean();

    await logActivity(req.user.id, 'TAKEOFF', {
      sessionId: activeSession?._id,
      eventData: { altitude },
      summary: `Takeoff to ${altitude}m`,
      operator: req.user.name || req.user.email || 'operator',
    });

    res.json({ success: true, command: 'TAKEOFF', targetAltitude: altitude, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/drone/land
exports.commandLand = async (req, res) => {
  try {
    const activeSession = await DroneSession.findOne({ userId: req.user.id, status: 'active' }).select('_id').lean();
    await logActivity(req.user.id, 'LAND', { sessionId: activeSession?._id, summary: 'Landing initiated', operator: req.user.name || 'operator' });
    res.json({ success: true, command: 'LAND', timestamp: Date.now() });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/drone/hover
exports.commandHover = async (req, res) => {
  try {
    const activeSession = await DroneSession.findOne({ userId: req.user.id, status: 'active' }).select('_id').lean();
    await logActivity(req.user.id, 'HOVER', { sessionId: activeSession?._id, summary: 'Holding position', operator: req.user.name || 'operator' });
    res.json({ success: true, command: 'HOVER', timestamp: Date.now() });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/drone/return-home
exports.commandReturnHome = async (req, res) => {
  try {
    const activeSession = await DroneSession.findOne({ userId: req.user.id, status: 'active' }).select('_id').lean();
    await logActivity(req.user.id, 'RTH', { sessionId: activeSession?._id, summary: 'Return to home', operator: req.user.name || 'operator' });
    res.json({ success: true, command: 'RTH', timestamp: Date.now() });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/drone/sprinkling/start
exports.commandSprinklingStart = async (req, res) => {
  try {
    const activeSession = await DroneSession.findOne({ userId: req.user.id, status: 'active' }).select('_id').lean();
    await logActivity(req.user.id, 'SPRINKLE_START', {
      sessionId: activeSession?._id,
      eventData: req.body,
      summary: 'Sprinkling activated',
      operator: req.user.name || 'operator',
    });
    res.json({ success: true, command: 'SPRINKLE_START', timestamp: Date.now() });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/drone/sprinkling/stop
exports.commandSprinklingStop = async (req, res) => {
  try {
    const activeSession = await DroneSession.findOne({ userId: req.user.id, status: 'active' }).select('_id').lean();
    await logActivity(req.user.id, 'SPRINKLE_STOP', {
      sessionId: activeSession?._id,
      eventData: req.body,
      summary: 'Sprinkling stopped',
      operator: req.user.name || 'operator',
    });
    res.json({ success: true, command: 'SPRINKLE_STOP', timestamp: Date.now() });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/drone/sprinkling/timed
exports.commandTimedSprinkling = async (req, res) => {
  try {
    const { durationSeconds = 60, flowRate = 5 } = req.body;
    const activeSession = await DroneSession.findOne({ userId: req.user.id, status: 'active' }).select('_id').lean();
    await logActivity(req.user.id, 'TIMED_SPRINKLE', {
      sessionId: activeSession?._id,
      eventData: { durationSeconds, flowRate },
      summary: `Timed spray: ${durationSeconds}s at ${flowRate} L/min`,
      operator: req.user.name || 'operator',
    });
    res.json({
      success: true, command: 'TIMED_SPRINKLE',
      durationSeconds, flowRate,
      estimatedLitres: parseFloat(((durationSeconds / 60) * flowRate).toFixed(2)),
      timestamp: Date.now(),
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─────────────────────────────────────────────────────────
// GET /api/drone/activity
// Paginated, filtered drone activity history.
// ─────────────────────────────────────────────────────────
exports.getActivityLog = async (req, res) => {
  try {
    const page     = parseInt(req.query.page)     || 1;
    const limit    = parseInt(req.query.limit)    || 20;
    const skip     = (page - 1) * limit;
    const category = req.query.category; // flight|mission|sprinkle|camera|emergency|timer
    const search   = req.query.search;
    const from     = req.query.from;     // ISO date
    const to       = req.query.to;

    const filter = { userId: req.user.id };
    if (category && category !== 'all') filter.category = category;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to)   filter.timestamp.$lte = new Date(to);
    }
    if (search) {
      filter.$or = [
        { summary:   { $regex: search, $options: 'i' } },
        { eventType: { $regex: search, $options: 'i' } },
        { operator:  { $regex: search, $options: 'i' } },
      ];
    }

    const [logs, total] = await Promise.all([
      DroneActivityLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DroneActivityLog.countDocuments(filter),
    ]);

    res.json({
      success: true, logs, total, page,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/drone/missions/history
// Mission history enriched with session run data.
// ─────────────────────────────────────────────────────────
exports.getMissionHistory = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;

    const filter = { userId: req.user.id };
    if (status && status !== 'all') filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const [missions, total] = await Promise.all([
      MissionPlan.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('name description status waypoints totalDistanceM estimatedTimeMin coverageAreaHa waterRequiredL createdAt updatedAt')
        .lean(),
      MissionPlan.countDocuments(filter),
    ]);

    res.json({
      success: true, missions, total, page,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// EXISTING ENDPOINTS (preserved from previous version)
// ─────────────────────────────────────────────────────────

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
    await logActivity(req.user.id, 'SESSION_START', {
      sessionId: session._id,
      summary: `Session started: ${session.sessionName}`,
      operator: req.user.name || req.user.email || 'operator',
    });
    res.status(201).json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getActiveSession = async (req, res) => {
  try {
    const session = await DroneSession.findOne({ userId: req.user.id, status: 'active' })
      .sort({ startedAt: -1 })
      .populate('missionPlanId', 'name waypoints totalDistanceM');
    res.json({ success: true, session: session || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.pushTelemetry = async (req, res) => {
  try {
    const { id } = req.params;
    const snap = req.body;
    const session = await DroneSession.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      {
        $push: { telemetryLog: { $each: [{ ...snap, timestamp: new Date() }], $slice: -500 } },
        ...(snap.coverageArea !== undefined && { coverageArea: snap.coverageArea }),
      },
      { new: true, select: '_id status telemetryLog' }
    );
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, snapshotCount: session.telemetryLog.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

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
        ...(command === 'MISSION_ABORT' && { missionStatus: 'aborted', flightMode: 'RTH' }),
        ...(command === 'LAND'  && { flightMode: 'LAND' }),
        ...(command === 'HOVER' && { flightMode: 'HOVER' }),
        ...(command === 'RTH'   && { flightMode: 'RTH' }),
      }
    );
    // Also log to DroneActivityLog for history
    await logActivity(req.user.id, command, {
      sessionId: id,
      eventData: params,
      summary: message || command,
      status: success ? 'success' : 'failed',
      operator: req.user.name || req.user.email || 'operator',
    }).catch(() => {});

    res.json({ success: true, command });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.endSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'completed', batteryEnd, totalFlightTime, coverageArea, waterUsed } = req.body;
    const session = await DroneSession.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { status, completedAt: new Date(), ...(batteryEnd !== undefined && { batteryEnd }), ...(totalFlightTime !== undefined && { totalFlightTime }), ...(coverageArea !== undefined && { coverageArea }), ...(waterUsed !== undefined && { waterUsed }) },
      { new: true }
    );
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    await logActivity(req.user.id, 'SESSION_END', {
      sessionId: id,
      eventData: { status, batteryEnd, totalFlightTime },
      summary: `Session ended: ${status}`,
      operator: req.user.name || req.user.email || 'operator',
    });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      DroneSession.find({ userId: req.user.id }).sort({ startedAt: -1 }).skip(skip).limit(limit).select('-telemetryLog').populate('missionPlanId', 'name'),
      DroneSession.countDocuments({ userId: req.user.id }),
    ]);
    res.json({ success: true, sessions, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSession = async (req, res) => {
  try {
    const session = await DroneSession.findOne({ _id: req.params.id, userId: req.user.id }).populate('missionPlanId', 'name waypoints');
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDroneStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const [stats] = await DroneSession.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId.toString()) } },
      { $group: { _id: null, totalSessions: { $sum: 1 }, completedFlights: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, totalFlightTime: { $sum: '$totalFlightTime' }, totalCoverage: { $sum: '$coverageArea' }, totalWaterUsed: { $sum: '$waterUsed' }, avgBattery: { $avg: '$batteryEnd' } } },
    ]);
    const activeSession = await DroneSession.findOne({ userId, status: 'active' }).select('_id sessionName startedAt flightMode missionStatus');
    res.json({ success: true, stats: stats || { totalSessions: 0, completedFlights: 0, totalFlightTime: 0, totalCoverage: 0, totalWaterUsed: 0, avgBattery: null }, activeSession: activeSession || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Mission CRUD (unchanged) ─────────────────────────────────────────────────

exports.saveMission = async (req, res) => {
  try {
    const { name, description, waypoints, boundaryPolygon, totalDistanceM, estimatedTimeMin, coverageAreaHa, waterRequiredL, originLat, originLng } = req.body;
    if (!waypoints || waypoints.length === 0) return res.status(400).json({ success: false, message: 'At least one waypoint is required' });
    const mission = await MissionPlan.create({ userId: req.user.id, name: name || `Mission ${new Date().toLocaleDateString()}`, description, waypoints, boundaryPolygon: boundaryPolygon || [], totalDistanceM: totalDistanceM || 0, estimatedTimeMin: estimatedTimeMin || 0, coverageAreaHa: coverageAreaHa || 0, waterRequiredL: waterRequiredL || 0, originLat, originLng });
    await logActivity(req.user.id, 'MISSION_SAVE', { missionId: mission._id, summary: `Mission saved: ${mission.name}`, operator: req.user.name || 'operator' });
    res.status(201).json({ success: true, mission, message: `Mission "${mission.name}" saved to cloud` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMissions = async (req, res) => {
  try {
    const missions = await MissionPlan.find({ userId: req.user.id }).sort({ updatedAt: -1 }).select('name description status waypoints totalDistanceM estimatedTimeMin coverageAreaHa updatedAt');
    res.json({ success: true, missions });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getMission = async (req, res) => {
  try {
    const mission = await MissionPlan.findOne({ _id: req.params.id, userId: req.user.id });
    if (!mission) return res.status(404).json({ success: false, message: 'Mission not found' });
    res.json({ success: true, mission });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateMission = async (req, res) => {
  try {
    const allowed = ['name', 'description', 'waypoints', 'boundaryPolygon', 'totalDistanceM', 'estimatedTimeMin', 'coverageAreaHa', 'waterRequiredL', 'status'];
    const update = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    const mission = await MissionPlan.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, update, { new: true, runValidators: true });
    if (!mission) return res.status(404).json({ success: false, message: 'Mission not found' });
    res.json({ success: true, mission, message: 'Mission updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteMission = async (req, res) => {
  try {
    const mission = await MissionPlan.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!mission) return res.status(404).json({ success: false, message: 'Mission not found' });
    await logActivity(req.user.id, 'MISSION_DELETE', { summary: `Mission deleted: ${mission.name}`, operator: req.user.name || 'operator' });
    res.json({ success: true, message: 'Mission deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
