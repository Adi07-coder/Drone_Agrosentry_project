/**
 * AgroSentry — Drone Control Service Layer
 *
 * Architecture designed for future integration with:
 *   - MAVLink (ArduPilot / PX4 via UDP port 14550 or serial)
 *   - DroneKit Python bridge (via python-shell or REST sidecar)
 *   - ROS / ROS2 (via rosbridge WebSocket or rclnodejs)
 *   - MQTT message broker (mosquitto / HiveMQ)
 *   - WebSocket real-time GCS bridge
 *
 * Current implementation: Mocked responses with realistic latency.
 * To integrate real hardware: swap the mock bodies below with your
 * protocol adapter (MAVLink, MQTT publish, WebSocket message, etc.)
 *
 * MAVLink reference commands are included in comments.
 */

// ─────────────────────────────────────────────────────────
// ADAPTER CONFIGURATION (future: swap protocol here)
// ─────────────────────────────────────────────────────────

let _connectionConfig = {
  protocol: 'mock',       // 'mavlink' | 'ros' | 'mqtt' | 'websocket' | 'mock'
  host: 'localhost',
  port: 14550,            // MAVLink UDP default
  baudrate: 57600,        // Serial baudrate for MAVLink over USB
  mqttTopic: 'agrosentry/drone', // MQTT base topic
  heartbeatTimeout: 3000, // ms before connection considered lost
};

export const configure = (config) => {
  _connectionConfig = { ..._connectionConfig, ...config };
};

export const getConnectionConfig = () => ({ ..._connectionConfig });

// ─────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────

const _delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

const _mockResponse = (payload, delayMs) =>
  _delay(delayMs).then(() => ({ success: true, timestamp: Date.now(), ...payload }));

// ─────────────────────────────────────────────────────────
// FLIGHT CONTROL COMMANDS
// ─────────────────────────────────────────────────────────

/**
 * Arm drone motors.
 * MAVLink: MAV_CMD_COMPONENT_ARM_DISARM (param1 = 1)
 * DroneKit: vehicle.armed = True
 * ROS: /mavros/cmd/arming (service call)
 */
export const armDrone = () =>
  _mockResponse({ command: 'ARM', message: 'Drone armed successfully' });

/**
 * Disarm drone motors.
 * MAVLink: MAV_CMD_COMPONENT_ARM_DISARM (param1 = 0)
 * DroneKit: vehicle.armed = False
 */
export const disarmDrone = () =>
  _mockResponse({ command: 'DISARM', message: 'Drone disarmed' });

/**
 * Initiate takeoff to target altitude.
 * MAVLink: MAV_CMD_NAV_TAKEOFF (param7 = altitude_m)
 * DroneKit: vehicle.simple_takeoff(altitude)
 * PX4: Set TAKEOFF mode
 */
export const takeoff = (altitude = 10) =>
  _mockResponse({
    command: 'TAKEOFF',
    targetAltitude: altitude,
    message: `Takeoff initiated — climbing to ${altitude}m`,
  });

/**
 * Initiate landing sequence.
 * MAVLink: MAV_CMD_NAV_LAND
 * DroneKit: vehicle.mode = VehicleMode("LAND")
 */
export const land = () =>
  _mockResponse({ command: 'LAND', message: 'Landing sequence initiated' });

/**
 * Hold current position (loiter).
 * MAVLink: Set flight mode to LOITER (ArduPilot) / POSCTL (PX4)
 * DroneKit: vehicle.mode = VehicleMode("LOITER")
 */
export const hover = () =>
  _mockResponse({ command: 'HOVER', message: 'Holding position' });

/**
 * Return to launch / home position.
 * MAVLink: MAV_CMD_NAV_RETURN_TO_LAUNCH or set mode RTL
 * DroneKit: vehicle.mode = VehicleMode("RTL")
 * PX4: Set RTL mode
 */
export const returnHome = () =>
  _mockResponse({ command: 'RTH', message: 'Returning to home position' });

/**
 * Emergency stop — immediate motor kill.
 * MAVLink: MAV_CMD_COMPONENT_ARM_DISARM with force flag
 * CRITICAL: This immediately disarms motors mid-flight. Use only in emergency.
 */
export const emergencyStop = () =>
  _delay(150).then(() => ({
    success: true,
    command: 'EMERGENCY_STOP',
    critical: true,
    timestamp: Date.now(),
    message: 'EMERGENCY STOP ACTIVATED — Motors killed',
  }));

// ─────────────────────────────────────────────────────────
// MISSION CONTROL COMMANDS
// ─────────────────────────────────────────────────────────

/**
 * Start autonomous mission.
 * MAVLink: MAV_CMD_MISSION_START or set mode AUTO
 * DroneKit: vehicle.mode = VehicleMode("AUTO")
 * PX4: Set MISSION mode
 */
export const startMission = (missionItems = []) =>
  _mockResponse({
    command: 'MISSION_START',
    totalWaypoints: missionItems.length,
    message: `Mission started — ${missionItems.length} waypoints queued`,
  });

/**
 * Pause current mission (loiter in place).
 * MAVLink: MAV_CMD_DO_PAUSE_CONTINUE (param1 = 0)
 * DroneKit: vehicle.mode = VehicleMode("LOITER")
 */
export const pauseMission = () =>
  _mockResponse({ command: 'MISSION_PAUSE', message: 'Mission paused — loitering' });

/**
 * Resume paused mission.
 * MAVLink: MAV_CMD_DO_PAUSE_CONTINUE (param1 = 1)
 * DroneKit: vehicle.mode = VehicleMode("AUTO")
 */
export const resumeMission = () =>
  _mockResponse({ command: 'MISSION_RESUME', message: 'Mission resumed' });

/**
 * Abort mission and return home.
 * MAVLink: Clear mission + set RTL mode
 */
export const abortMission = () =>
  _mockResponse({ command: 'MISSION_ABORT', message: 'Mission aborted — returning home' });

/**
 * Upload waypoint mission to flight controller.
 * MAVLink: MISSION_COUNT + sequence of MISSION_ITEM_INT messages
 * DroneKit: vehicle.commands.add() loop + vehicle.commands.upload()
 */
export const uploadMission = (missionItems) =>
  _delay(1800).then(() => ({
    success: true,
    command: 'MISSION_UPLOAD',
    itemCount: missionItems.length,
    timestamp: Date.now(),
    message: `Mission uploaded: ${missionItems.length} waypoints`,
  }));

// ─────────────────────────────────────────────────────────
// PRECISION SPRAYING COMMANDS
// ─────────────────────────────────────────────────────────

/**
 * Start sprinkler/sprayer.
 * MAVLink: MAV_CMD_DO_SET_SERVO or custom DO_REPEAT_SERVO
 * MQTT: publish to agrosentry/drone/sprinkler/start
 * Custom: GPIO signal to relay/pump controller
 */
export const startSprinkling = () =>
  _mockResponse({ command: 'SPRINKLE_START', message: 'Sprinkling activated' });

/**
 * Stop sprinkler/sprayer.
 * MQTT: publish to agrosentry/drone/sprinkler/stop
 */
export const stopSprinkling = () =>
  _mockResponse({ command: 'SPRINKLE_STOP', message: 'Sprinkling deactivated' });

/**
 * Increase flow rate by 1 L/min (max 10 L/min).
 * MAVLink: Custom parameter set (SPRAY_FLOW_RATE param)
 * PWM: Increase PWM signal to flow control servo
 */
export const increaseFlowRate = (currentRate) => {
  const newRate = Math.min(Math.round(currentRate) + 1, 10);
  return _mockResponse({
    command: 'FLOW_INCREASE',
    newRate,
    message: `Flow rate → ${newRate} L/min`,
  }, 300);
};

/**
 * Decrease flow rate by 1 L/min (min 1 L/min).
 */
export const decreaseFlowRate = (currentRate) => {
  const newRate = Math.max(Math.round(currentRate) - 1, 1);
  return _mockResponse({
    command: 'FLOW_DECREASE',
    newRate,
    message: `Flow rate → ${newRate} L/min`,
  }, 300);
};

// ─────────────────────────────────────────────────────────
// SENSOR & SYSTEM COMMANDS
// ─────────────────────────────────────────────────────────

/**
 * Run pre-flight sensor calibration.
 * MAVLink: MAV_CMD_PREFLIGHT_CALIBRATION (accelerometer + compass)
 * DroneKit: vehicle.commands.calibrate_gyro()
 */
export const calibrateSensors = () =>
  _delay(3200).then(() => ({
    success: true,
    command: 'CALIBRATE',
    timestamp: Date.now(),
    message: 'All sensors calibrated — gyro, accel, compass OK',
    results: { gyro: 'pass', accelerometer: 'pass', compass: 'pass', barometer: 'pass' },
  }));

/**
 * Trigger GPS cold/warm restart.
 * MAVLink: GPS_INJECT_DATA or reboot GPS module
 */
export const refreshGPS = () =>
  _delay(2000).then(() => ({
    success: true,
    command: 'GPS_REFRESH',
    timestamp: Date.now(),
    message: 'GPS lock refreshed',
    satellites: 14,
    hdop: 0.8,
    fix: '3D Fix',
  }));

/**
 * Toggle onboard camera.
 * MAVLink: MAV_CMD_DO_DIGICAM_CONTROL
 * Custom: HTTP API call to onboard camera endpoint
 */
export const toggleCamera = (enabled) =>
  _mockResponse({
    command: 'CAMERA_TOGGLE',
    enabled,
    message: `Camera ${enabled ? 'enabled' : 'disabled'}`,
  });

/**
 * Toggle live video feed stream.
 * Custom: Start/stop RTSP or WebRTC stream from drone
 * MQTT: publish to agrosentry/drone/camera/stream
 */
export const toggleLiveFeed = (enabled) =>
  _mockResponse({
    command: 'FEED_TOGGLE',
    enabled,
    message: `Live feed ${enabled ? 'streaming' : 'stopped'}`,
    streamUrl: enabled ? 'rtsp://drone-local:8554/live' : null,
  });

/**
 * Reset drone state and mission data.
 * Clears all waypoints, resets parameters to defaults.
 */
export const resetDroneState = () =>
  _delay(800).then(() => ({
    success: true,
    command: 'STATE_RESET',
    timestamp: Date.now(),
    message: 'Drone state reset to defaults',
  }));

/**
 * Reset mission planner data only.
 */
export const resetMission = () =>
  _mockResponse({ command: 'MISSION_RESET', message: 'Mission data cleared' }, 400);

// ─────────────────────────────────────────────────────────
// TELEMETRY STREAM
// ─────────────────────────────────────────────────────────

/**
 * Get current telemetry snapshot.
 *
 * Future: Replace with WebSocket subscription handler.
 * MAVLink messages to subscribe:
 *   HEARTBEAT (sys_status), SYS_STATUS (battery, comms),
 *   GPS_RAW_INT (gps lock, satellites), GLOBAL_POSITION_INT (alt, lat, lng),
 *   ATTITUDE (heading, roll, pitch), VFR_HUD (speed, groundspeed),
 *   BATTERY_STATUS (remaining%)
 *
 * MQTT topics to subscribe:
 *   agrosentry/drone/telemetry/battery
 *   agrosentry/drone/telemetry/gps
 *   agrosentry/drone/telemetry/attitude
 *   agrosentry/drone/telemetry/status
 */
export const getTelemetry = async () => ({
  battery: null,       // injected by caller from live state
  altitude: null,
  speed: null,
  heading: null,
  satellites: null,
  signalStrength: null,
  timestamp: Date.now(),
});

/**
 * Subscribe to real-time telemetry stream.
 * Future: Returns a WebSocket / MQTT client subscription handle.
 * Caller is responsible for calling unsubscribe() on cleanup.
 *
 * @param {Function} onData - callback(telemetryObject)
 * @param {number} intervalMs - polling interval for mock mode
 * @returns {{ unsubscribe: Function }}
 */
export const subscribeTelemetry = (onData, intervalMs = 2000) => {
  // Future: Replace interval with WebSocket.onmessage or MQTT client.on('message')
  const timer = setInterval(() => {
    onData({ timestamp: Date.now() });
  }, intervalMs);

  return {
    unsubscribe: () => clearInterval(timer),
  };
};
