# AgroSentry — Complete Architectural Analysis

> Deep-dive technical breakdown of every file, component, API, and AI model in the codebase.
> **Last Updated:** 2026-06-05 — Includes Drone Control System, Mission Planner, Socket.IO backend, Timed Sprinkling Scheduler, Activity History.

---

## 1. Project Structure — Hierarchical Tree

```
Drone_AgroSentry\
├── backend/                        ← Node.js + Express + Socket.IO API gateway
│   ├── controllers/
│   │   ├── authController.js       ← User register / login / profile / refresh
│   │   ├── adminController.js      ← Admin CRUD, stats, reports
│   │   ├── detectionController.js  ← AI prediction pipeline orchestrator
│   │   ├── symptomController.js    ← Rule-based symptom diagnosis engine
│   │   ├── droneController.js      ← ★ NEW: Drone session, telemetry, missions, activity log
│   │   └── logController.js        ← Generic log endpoints
│   ├── flask_api/
│   │   └── app.py                  ← Flask microservice (alt inference + MJPEG stream, port 5001)
│   ├── middleware/
│   │   ├── auth.js                 ← JWT authenticate() + authorize(role) guards
│   │   ├── validate.js             ← validateImageUpload, validateRegister, validateLogin
│   │   └── errorHandler.js         ← Global Express error middleware
│   ├── models/                     ← Mongoose schemas (MongoDB collections)
│   │   ├── User.js                 ← users collection
│   │   ├── Admin.js                ← admins collection
│   │   ├── Detection.js            ← detections collection (combined audit log)
│   │   ├── RealtimePrediction.js   ← realtimepredictions collection
│   │   ├── UploadPrediction.js     ← uploadpredictions collection
│   │   ├── ActivityLog.js          ← activitylogs collection (plant detection)
│   │   ├── SymptomHistory.js       ← symptomhistories collection
│   │   ├── LoginLog.js             ← loginlogs collection
│   │   ├── DroneSession.js         ← ★ NEW: drone flight sessions + telemetry log
│   │   ├── DroneActivityLog.js     ← ★ NEW: drone operator event log
│   │   └── MissionPlan.js          ← ★ NEW: saved mission plans (waypoints + config)
│   ├── routes/
│   │   ├── authRoutes.js           ← /api/auth/*
│   │   ├── adminRoutes.js          ← /api/admin/*
│   │   ├── detectionRoutes.js      ← /api/detection/* and /api/detect/* (alias)
│   │   ├── symptomRoutes.js        ← /api/detection/symptom/*
│   │   ├── logRoutes.js            ← /api/logs/*
│   │   └── droneRoutes.js          ← ★ NEW: /api/drone/*
│   ├── sockets/
│   │   └── droneSocket.js          ← ★ NEW: Socket.IO /drone namespace + telemetry simulator
│   ├── uploads/                    ← Multer image upload destination
│   ├── .env                        ← JWT_SECRET, MONGO_URI, PYTHON_PATH, PORT, CORS_ORIGIN
│   ├── package.json
│   └── server.js                   ← ★ BACKEND ENTRY POINT (now includes Socket.IO)
│
├── frontend/                       ← React 18 + Vite SPA
│   ├── public/
│   ├── src/
│   │   ├── main.jsx                ← ★ FRONTEND ENTRY POINT (ReactDOM.createRoot)
│   │   ├── App.jsx                 ← BrowserRouter + AuthProvider + DroneProvider wrapper
│   │   ├── index.css               ← Global styles
│   │   ├── animations/
│   │   │   └── variants.js         ← Framer Motion animation presets
│   │   ├── assets/                 ← Static images, icons
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx  ← Role-based route guard component
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx      ← Top navigation bar
│   │   │   │   ├── Sidebar.jsx     ← Dashboard sidebar (Drone Control → Mission Planner → Dashboard → ...)
│   │   │   │   ├── Card.jsx        ← Reusable card container
│   │   │   │   ├── Button.jsx      ← Styled button component
│   │   │   │   ├── Badge.jsx       ← Status badge
│   │   │   │   ├── Modal.jsx       ← Dialog overlay component
│   │   │   │   ├── Toast.jsx       ← Notification toast wrapper
│   │   │   │   └── SkeletonLoader.jsx ← Loading placeholder
│   │   │   └── dashboard/
│   │   │       ├── LiveCameraAgent.jsx    ← Live detection UI + polling engine
│   │   │       ├── ImageUploadAgent.jsx   ← Upload detection UI + history table
│   │   │       ├── SymptomBasedAgent.jsx  ← Symptom-based diagnosis UI
│   │   │       ├── DroneControlAgent.jsx  ← ★ NEW: Full drone control UI (1500+ lines)
│   │   │       ├── MissionPlannerAgent.jsx← ★ NEW: Leaflet map mission planner
│   │   │       ├── StatCard.jsx           ← Analytics stat tile
│   │   │       ├── Chart.jsx              ← Recharts bar/line wrapper
│   │   │       └── RecentScans.jsx        ← Recent scan list widget
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     ← Global auth state + localStorage sync
│   │   │   └── DroneContext.jsx    ← ★ NEW: Shared drone socket + state context
│   │   ├── data/                   ← Static JSON disease data
│   │   ├── hooks/
│   │   │   ├── useAuth.js          ← useContext(AuthContext) convenience hook
│   │   │   ├── useDroneSocket.js   ← ★ NEW: Socket.IO client hook for drone telemetry
│   │   │   └── useSprinklingTimer.js ← ★ NEW: Timed sprinkling countdown + calculations
│   │   ├── layouts/
│   │   │   └── AdminLayout.jsx     ← Admin shell with Sidebar + <Outlet>
│   │   ├── pages/
│   │   │   ├── Landing.jsx                ← Public marketing page (/)
│   │   │   ├── Login.jsx                  ← User / Admin dual-tab login
│   │   │   ├── Signup.jsx                 ← User registration
│   │   │   ├── Onboarding.jsx             ← Post-signup onboarding flow
│   │   │   ├── Dashboard.jsx              ← User dashboard shell (nested routes)
│   │   │   ├── AnalyticsDashboard.jsx     ← Charts, stats, recent scans
│   │   │   ├── LiveDetection.jsx          ← Thin wrapper → <LiveCameraAgent>
│   │   │   ├── UploadDetection.jsx        ← Thin wrapper → <ImageUploadAgent>
│   │   │   ├── SymptomsRecommendation.jsx ← Thin wrapper → <SymptomBasedAgent>
│   │   │   ├── DroneControl.jsx           ← ★ NEW: Thin wrapper → <DroneControlAgent>
│   │   │   ├── MissionPlanner.jsx         ← ★ NEW: Thin wrapper → <MissionPlannerAgent>
│   │   │   ├── HistoryScans.jsx           ← Paginated scan history table
│   │   │   ├── Disease.jsx                ← Disease detail page (/disease/:id)
│   │   │   ├── AdminDashboard.jsx         ← Admin home
│   │   │   ├── AdminUsers.jsx             ← Admin user management table
│   │   │   ├── AdminDiseaseDB.jsx         ← Disease database browser
│   │   │   ├── AdminReports.jsx           ← Report generation panel
│   │   │   ├── AdminActivityLog.jsx       ← Activity log viewer
│   │   │   ├── AdminSettings.jsx          ← System settings
│   │   │   ├── PageNotFound.jsx           ← 404 page
│   │   │   └── admin/
│   │   │       └── LoginLogs.jsx          ← Login audit log (admin-only)
│   │   ├── routes/
│   │   │   └── Routes.jsx          ← React Router v6 route definitions
│   │   ├── services/
│   │   │   ├── droneApiService.js  ← ★ NEW: All /api/drone/* API call wrappers
│   │   │   ├── droneService.js     ← Mock flight command service (arm, takeoff, etc.)
│   │   │   ├── missionService.js   ← Mission logic helpers
│   │   │   └── sprinklingTimerService.js ← ★ NEW: Timer state enum + formatCountdown()
│   │   └── utils/
│   │       ├── authService.js      ← All axios API call wrappers (30+ functions)
│   │       ├── api.js              ← Secondary axios client + detectionAPI object
│   │       ├── constants.js        ← Global constants
│   │       └── cn.js               ← className utility (clsx)
│   ├── index.html                  ← Vite HTML shell
│   ├── vite.config.js              ← HTTPS dev server + /api proxy to port 5000
│   └── package.json
│
├── models/                         ← AI model weight files
│   ├── best.pt                     ← YOLOv8 plant ROI detector (22.6 MB)
│   ├── best_augmented_full_model.pth  ← General EfficientNet-B0 classifier (18.9 MB)
│   ├── best_specialist_model.pth      ← Specialist EfficientNet-B0 — Pepper/Potato (18.9 MB)
│   ├── labels.txt                  ← 15 general class labels
│   └── pepper_potato_labels.txt    ← Specialist class labels
│
├── scripts/
│   ├── predict.py                  ← MAIN AI INFERENCE SCRIPT
│   └── ...training scripts...
│
├── task-docs/                      ← ★ NEW: Sequential task documentation
│   ├── task1.md  ← Codebase reading & structure mapping
│   ├── task2.md  ← Drone Control System implementation
│   ├── task3.md  ← Mission Planner implementation
│   ├── task4.md  ← Bug fix: Shield icon crash
│   ├── task5.md  ← Camera feed display
│   ├── task6.md  ← Real-time GPS location
│   ├── task7.md  ← Backend integration + Socket.IO + sidebar reorder
│   ├── task8.md  ← Timed Sprinkling Scheduler
│   ├── task9.md  ← Mission Planner comprehensive improvements
│   └── task10.md ← Drone Control System final enhancements
│
├── requirements.txt                ← Python dependencies
├── Dockerfile
└── render.yaml                     ← Render.com deployment spec
```

---

## 2. Frontend Analysis

### Framework
**React 18** with **Vite 8** as the build/dev server. Uses:
- **React Router v6** — client-side routing with protected routes
- **Framer Motion** — page and component animations
- **Recharts** — data visualization (bar + line charts)
- **Axios** — all HTTP API communication
- **react-hot-toast** — toast notification system
- **react-leaflet / Leaflet** — interactive maps (Mission Planner)
- **socket.io-client** — real-time telemetry (Drone Control + Mission Planner)

### Startup Sequence

```
index.html
  └── main.jsx              → ReactDOM.createRoot(#root).render(<App />)
        └── App.jsx
              ├── BrowserRouter     (React Router DOM context)
              ├── AuthProvider      (AuthContext.jsx — global auth state)
              └── DroneProvider     (DroneContext.jsx — ★ NEW: shared drone socket)
                    └── AppRoutes   (routes/Routes.jsx)
```

### Route Map

| URL Path | Page Component | Role Required |
|----------|---------------|---------------|
| `/` | `Landing` | Public |
| `/login/*` | `Login` | Public |
| `/signup/*` | `Signup` | Public |
| `/onboarding` | `Onboarding` | user |
| `/dashboard` | `Dashboard` (shell) | user |
| `/dashboard/drone-control-system` | `DroneControl` → `DroneControlAgent` | user ★ NEW |
| `/dashboard/mission-planner` | `MissionPlanner` → `MissionPlannerAgent` | user ★ NEW |
| `/dashboard/analytics` | `AnalyticsDashboard` | user |
| `/dashboard/live-detection` | `LiveDetection` | user |
| `/dashboard/upload-detection` | `UploadDetection` | user |
| `/dashboard/symptoms-recommendation` | `SymptomsRecommendation` | user |
| `/dashboard/history` | `HistoryScans` | user |
| `/disease/:id` | `Disease` | user |
| `/admin/*` | `AdminLayout` (shell) | admin |
| `/admin/drone-control-system` | `DroneControl` | admin ★ NEW |
| `/admin/mission-planner` | `MissionPlanner` | admin ★ NEW |
| `*` | `PageNotFound` | Public |

### Sidebar Navigation Order

```
1. 🚁 Drone Control System   (/dashboard/drone-control-system)
2. 🗺  Mission Planner        (/dashboard/mission-planner)
3. 📊 Dashboard              (/dashboard/analytics)
4. 📷 Live Detection         (/dashboard/live-detection)
5. 📤 Upload Detection       (/dashboard/upload-detection)
6. 🌿 Symptom Recommendation (/dashboard/symptoms-recommendation)
7. 📋 History                (/dashboard/history)
8. 🔬 Disease Library        (/disease/*)
```

---

## 3. Backend Analysis

### Framework
**Node.js + Express.js + Socket.IO** acting as an API Gateway that:
1. Handles authentication, user/admin management
2. Accepts image uploads via **Multer** (disk storage)
3. **Spawns Python 3.10** as a child process per AI request
4. Persists results to **MongoDB Atlas** via Mongoose
5. ★ **NEW:** Manages drone sessions, mission plans, activity logs via REST + Socket.IO

### Entry Point — `backend/server.js`

```
server.js
  ├── dotenv.config()                → Load .env
  ├── Express app
  ├── http.createServer(app)         → Raw HTTP server
  ├── Socket.IO(httpServer)          → ★ NEW: WebSocket server
  │     └── initDroneSocket(io)      → /drone namespace + telemetry simulator
  ├── CORS middleware (LAN-permissive regex)
  ├── express.json() + urlencoded()
  ├── Mount route groups:
  │     /api/auth      → authRoutes.js
  │     /api/detection → detectionRoutes.js
  │     /api/detect    → detectionRoutes.js (alias)
  │     /api/admin     → adminRoutes.js
  │     /api/logs      → logRoutes.js
  │     /api/drone     → droneRoutes.js    ★ NEW
  ├── mongoose.connect(MONGO_URI)    → MongoDB Atlas
  └── httpServer.listen(5000, '0.0.0.0')
```

---

## 4. All API Endpoints

### Original AgroSentry Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | No | User signup |
| `/api/auth/login` | POST | No | User login → JWT |
| `/api/auth/logout` | POST | User | End session |
| `/api/auth/profile` | GET | User | Get user info |
| `/api/admin/login` | POST | No | Admin JWT |
| `/api/admin/users` | GET | Admin | List users |
| `/api/admin/stats` | GET | Admin | System metrics |
| `/api/detection/predict` | POST | User | Upload → AI |
| `/api/detection/realtime` | POST | User | Live frame → AI |
| `/api/detection/symptom` | POST | User | Symptom → disease |
| `/api/health` | GET | No | Health check |

### ★ NEW Drone API Endpoints (`/api/drone/*`)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/drone/status` | GET | User | Current drone state |
| `/api/drone/telemetry` | GET | User | Latest telemetry snapshot |
| `/api/drone/location` | GET | User | GPS coordinates |
| `/api/drone/camera-status` | GET | User | Camera on/off + stream URL |
| `/api/drone/activity` | GET | User | Paginated activity log |
| `/api/drone/missions/history` | GET | User | Past mission records |
| `/api/drone/takeoff` | POST | User | Takeoff command |
| `/api/drone/land` | POST | User | Land command |
| `/api/drone/hover` | POST | User | Hover command |
| `/api/drone/return-home` | POST | User | RTH command |
| `/api/drone/sprinkling/start` | POST | User | Start sprinkler |
| `/api/drone/sprinkling/stop` | POST | User | Stop sprinkler |
| `/api/drone/sprinkling/timed` | POST | User | Timed spray |
| `/api/drone/session/start` | POST | User | Begin flight session |
| `/api/drone/session/active` | GET | User | Active session |
| `/api/drone/session/:id/telemetry` | POST | User | Push telemetry batch |
| `/api/drone/session/:id/command` | POST | User | Log command |
| `/api/drone/session/:id/end` | PATCH | User | End flight session |
| `/api/drone/sessions` | GET | User | Session history |
| `/api/drone/stats` | GET | User | Aggregated drone stats |
| `/api/drone/mission` | POST | User | Save mission plan |
| `/api/drone/missions` | GET | User | List mission plans |
| `/api/drone/mission/:id` | GET/PUT/DELETE | User | Mission CRUD |

---

## 5. ★ NEW: Drone Control System — Complete Feature Reference

### Page: `/dashboard/drone-control-system`
**Component:** `DroneControlAgent.jsx`

### Layout (3-column grid on desktop)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🚁 Drone Control System    [● ARMED]  [● Session Recording]  [⛔ STOP] │
│ Backend Stats Strip: Total Flights | Flight Time | Coverage | Socket │
├──────────────────────────────┬──────────────────────────────────────┤
│   8-CARD TELEMETRY ROW 1    │        (spans full width)            │
│ Battery | Altitude | Speed  | Signal                               │
│   8-CARD TELEMETRY ROW 2    │                                      │
│ Vert Speed | Mode | Tank | Spraying                                │
├──────────────────────┬───────┴─────────────────────────────────────┤
│ LEFT COLUMN (col-1)  │ RIGHT COLUMN (col-2)                        │
│                      │                                             │
│ Flight Controls      │ Camera Feed (always visible)                │
│  [ARM] [DISARM]      │  ┌─────────────────────────────────────┐    │
│  [TAKEOFF] [LAND]    │  │ 🔴 LIVE  Drone FPV Camera  1080p 30FPS│    │
│  [HOVER] [RTH]       │  │                                     │    │
│                      │  │    ← Real webcam / error / init →   │    │
│ Mission Controls     │  │                                     │    │
│  [START] [PAUSE]     │  │  [FPV HUD: ALT/SPD/HDG/GPS/BAT/REC]│    │
│  [RESUME] [ABORT]    │  └─────────────────────────────────────┘    │
│  Progress bar        │                                             │
│                      │ Drone Status Panel                          │
│ Sprinkling           │  • Connection, Armed, Flying, Battery...    │
│  [ON/OFF] Flow ±     │                                             │
│  Tank level bar      │ Safety Panel                                │
│                      │  • Obstacle, Failsafe, GPS, Motors...       │
│ Timed Sprinkling     │                                             │
│  [30s][1m][2m][5m]   │ Telemetry Overview                          │
│  [▶ Start][⏸ Pause]  │  Water Tank | Coverage | Progress | Time    │
│  Countdown 01:30     │                                             │
│  Water: 1.5L / 0.75ha│ Activity History Panel                      │
│                      │  [Search] [all][flight][mission][sprinkle]  │
│ Quick Actions        │  Table: Timestamp | Event | Cat | Status    │
│  [Calibrate][GPS]    │  [← Prev] [Next →] (paginated)              │
│  [Camera][Live Feed] │                                             │
│  [Reset Mission]     │                                             │
│  [Reset Drone]       │                                             │
└──────────────────────┴─────────────────────────────────────────────┘
```

---

## 6. ★ NEW: Mission Planner — Complete Feature Reference

### Page: `/dashboard/mission-planner`
**Component:** `MissionPlannerAgent.jsx`

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🗺 Mission Planner  [● Socket Live]  [↻ Refresh GPS]  [💾 Save]     │
│ Telemetry Strip: GPS Fix | Lat | Lng | Sats | Alt | Signal | Conn  │
├──────────────────────────────┬──────────────────────────────────────┤
│                              │ Waypoint List                        │
│   LEAFLET MAP                │  WP-1 (lat, lng, alt, speed) [✕]   │
│   (interactive, click=add WP)│  WP-2 ...                           │
│                              │                                      │
│  ✈ Drone marker (cyan)       │ Mission Config                       │
│  • GPS marker (blue)         │  Speed | Altitude | Return Home      │
│  ○ WP markers (numbered)     │  Overlap %                           │
│  ── Polyline path            │                                      │
│                              │ Mission Status                       │
│  Active WP coloring:         │  [IDLE/ACTIVE/COMPLETED] badge       │
│  ✓ green = done              │  Progress bar                        │
│  ⬤ cyan  = current           │  [▶ Start] [⏸ Pause] [⏹ Abort]     │
│  ○ grey  = queued            │                                      │
└──────────────────────────────┴──────────────────────────────────────┘
│ Mission History Panel                                               │
│  [Search missions…] [All][Draft][Active][Completed]  [↻]           │
│  Table: Name | Date | WPs | Distance | Est.Time | Status  [Load]  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. ★ NEW: Socket.IO Architecture

### Server Side (`backend/sockets/droneSocket.js`)

```
io.of('/drone') — Socket.IO namespace
  ├── connection
  │     ├── join-session → socket.join(sessionId)
  │     ├── leave-session → socket.leave(sessionId)
  │     ├── command → validates + emits to session room
  │     └── disconnect
  └── Telemetry Simulator (setInterval 2s)
        → emits 'telemetry' to all connected sockets
        → payload: { battery, altitude, speed, heading, gps*, signal, ... }
```

### Client Side (`frontend/src/hooks/useDroneSocket.js`)

```js
const { connected, emit, socketRef } = useDroneSocket({
  sessionId,     // optional: auto-join this session room
  autoJoin,      // boolean
  onTelemetry,   // callback(snap) called on every telemetry event
});
```

The `DroneContext.jsx` wraps the entire dashboard so only ONE socket connection is created regardless of how many components use the hook.

---

## 8. ★ NEW: Timed Sprinkling System

### Hook: `useSprinklingTimer`

```
States: IDLE → RUNNING → PAUSED → RUNNING → COMPLETED
                     ↓
                  CANCELLED → IDLE
```

**Input:**
- `durationMs` — total spray duration in milliseconds
- `flowRate` — litres per minute (from telemetry)
- `onComplete` — callback when countdown reaches zero

**Output:**
- `countdown` — formatted string `"MM:SS"`
- `progressPct` — 0–100 for progress bar
- `waterDispensed` — litres used so far
- `coverageArea` — estimated hectares (waterDispensed × 0.5)

---

## 9. MongoDB Collections (Complete List)

| Collection | Model File | Purpose |
|------------|-----------|---------|
| `users` | `User.js` | User accounts |
| `admins` | `Admin.js` | Admin accounts |
| `detections` | `Detection.js` | Combined AI detection audit log |
| `realtimepredictions` | `RealtimePrediction.js` | Live camera detections |
| `uploadpredictions` | `UploadPrediction.js` | Upload-based detections |
| `activitylogs` | `ActivityLog.js` | Plant detection activity |
| `symptomhistories` | `SymptomHistory.js` | Symptom diagnosis history |
| `loginlogs` | `LoginLog.js` | Auth audit trail |
| `dronesessions` | `DroneSession.js` | ★ NEW: Flight sessions + telemetry |
| `droneactivitylogs` | `DroneActivityLog.js` | ★ NEW: Drone operator events |
| `missionplans` | `MissionPlan.js` | ★ NEW: Saved mission plans |

---

## 10. Frontend ↔ Backend Connection

### Connection Method
Vite's HTTPS dev proxy rewrites all `/api/*` calls from `https://localhost:5173` → `http://localhost:5000`.

### Socket.IO Connection
```js
// DroneContext.jsx
const socket = io('http://localhost:5000/drone', {
  transports: ['websocket', 'polling'],
  auth: { token: localStorage.getItem('token') },
});
```

---

## 11. AI/ML Models — Detailed Analysis

### Model 1: YOLOv8 Plant ROI Detector

| Property | Detail |
|----------|--------|
| **File** | `models/best.pt` — 22.6 MB |
| **Framework** | Ultralytics YOLOv8 (PyTorch backend) |
| **Purpose** | Detect and crop the plant/leaf region from image |
| **Confidence threshold** | `conf=0.5` |
| **Effect** | If found: threshold 70%. If not: threshold 95% |

### Model 2: General EfficientNet-B0 Classifier

| Property | Detail |
|----------|--------|
| **File** | `models/best_augmented_full_model.pth` — 18.9 MB |
| **Architecture** | EfficientNet-B0 → Dropout → Linear(1280→512) → ReLU → Linear(512→15) |
| **Output** | 15-class softmax probabilities |

### Model 3: Specialist EfficientNet-B0 (Pepper + Potato)

| Property | Detail |
|----------|--------|
| **File** | `models/best_specialist_model.pth` — 18.9 MB |
| **Ensemble rule** | If `specialist_confidence > 80%` → override general result |

---

## 12. Supported Plant Diseases (15 Classes)

| # | Class Label | Plant | Condition |
|---|-------------|-------|-----------|
| 1 | `Pepper__bell___Bacterial_spot` | Pepper bell | Diseased |
| 2 | `Pepper__bell___healthy` | Pepper bell | Healthy |
| 3 | `Potato___Early_blight` | Potato | Diseased |
| 4 | `Potato___Late_blight` | Potato | Diseased |
| 5 | `Potato___healthy` | Potato | Healthy |
| 6 | `Tomato_Bacterial_spot` | Tomato | Diseased |
| 7 | `Tomato_Early_blight` | Tomato | Diseased |
| 8 | `Tomato_Late_blight` | Tomato | Diseased |
| 9 | `Tomato_Leaf_Mold` | Tomato | Diseased |
| 10 | `Tomato_Septoria_leaf_spot` | Tomato | Diseased |
| 11 | `Tomato_Spider_mites_Two_spotted_spider_mite` | Tomato | Diseased |
| 12 | `Tomato__Target_Spot` | Tomato | Diseased |
| 13 | `Tomato__Tomato_YellowLeaf__Curl_Virus` | Tomato | Diseased |
| 14 | `Tomato__Tomato_mosaic_virus` | Tomato | Diseased |
| 15 | `Tomato_healthy` | Tomato | Healthy |

---

## 13. Dependency Analysis

### Frontend

| Library | Version | Purpose |
|---------|---------|---------|
| `react` + `react-dom` | 18.x | Core UI framework |
| `react-router-dom` | v6 | Client-side routing |
| `axios` | latest | All HTTP API communication |
| `framer-motion` | latest | UI animations + transitions |
| `recharts` | latest | Bar + line charts |
| `lucide-react` | latest | Icon library |
| `react-hot-toast` | latest | Toast notifications |
| `react-leaflet` + `leaflet` | latest | ★ NEW: Interactive maps |
| `socket.io-client` | latest | ★ NEW: Real-time telemetry |
| `clsx` | latest | Conditional className utility |

### Backend (Node.js)

| Library | Purpose |
|---------|---------|
| `express` | HTTP server + routing |
| `socket.io` | ★ NEW: WebSocket server |
| `mongoose` | MongoDB ODM — 11 Mongoose schemas |
| `jsonwebtoken` | JWT sign + verify |
| `bcryptjs` | Password hashing |
| `multer` | Image + video file uploads |
| `cors` | Cross-origin request handling |
| `dotenv` | `.env` variable loading |

---

## 14. Task Documentation Index

All implementation tasks are recorded sequentially in [`task-docs/`](./task-docs/):

| File | Task | Status |
|------|------|--------|
| [task1.md](./task-docs/task1.md) | Codebase reading & structure mapping | ✅ Complete |
| [task2.md](./task-docs/task2.md) | Drone Control System implementation | ✅ Complete |
| [task3.md](./task-docs/task3.md) | Mission Planner implementation | ✅ Complete |
| [task4.md](./task-docs/task4.md) | Bug fix: Shield icon crash | ✅ Complete |
| [task5.md](./task-docs/task5.md) | Camera feed always-on display | ✅ Complete |
| [task6.md](./task-docs/task6.md) | Real-time GPS location integration | ✅ Complete |
| [task7.md](./task-docs/task7.md) | Backend Socket.IO + sidebar reorder | ✅ Complete |
| [task8.md](./task-docs/task8.md) | Timed Sprinkling Scheduler | ✅ Complete |
| [task9.md](./task-docs/task9.md) | Mission Planner comprehensive improvements | ✅ Complete |
| [task10.md](./task-docs/task10.md) | Drone Control System final enhancements | ✅ Complete |

---

## 15. System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                              │
│   React 18 SPA (Vite)       https://localhost:5173                   │
│   ┌────────────────┐  ┌───────────────┐  ┌──────────────────────┐   │
│   │  AuthContext   │  │  DroneContext │  │   Axios API Client   │   │
│   │  (JWT + state) │  │  (socket.io) │  │   /api/* calls       │   │
│   └────────────────┘  └───────┬───────┘  └──────────┬───────────┘   │
└───────────────────────────────┼──────────────────────┼───────────────┘
          Socket.IO /drone       │          Vite Proxy  │  /api/* → :5000
┌───────────────────────────────▼──────────────────────▼───────────────┐
│                   NODE.JS EXPRESS + SOCKET.IO  localhost:5000         │
│   ┌───────────┐  ┌─────────────┐  ┌──────────┐  ┌───────────────┐   │
│   │  auth.js  │  │ validate.js │  │  multer  │  │ errorHandler  │   │
│   └───────────┘  └─────────────┘  └──────────┘  └───────────────┘   │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │  /api/auth  /api/admin  /api/detection  /api/drone           │   │
│   └───────────────────────────┬──────────────────────────────────┘   │
│   ┌───────────────────────────▼──────────────────────────────────┐   │
│   │  droneController.js (sessions, missions, telemetry, activity) │   │
│   │  detectionController.js (plant AI pipeline)                   │   │
│   │  droneSocket.js (Socket.IO /drone namespace + simulator)      │   │
│   └──────────────────┬────────────────────────────────────────────┘   │
└──────────────────────┼────────────────────────────────────────────────┘
                       │  child_process.execFile (AI only)
┌──────────────────────▼────────────────────────────────────────────────┐
│                PYTHON 3.10 AI INFERENCE (subprocess per request)       │
│   YOLO(best.pt) → EfficientNet-B0 × 2 → Ensemble → JSON → stdout     │
└───────────────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼────────────────────────────────────────────────┐
│                          MONGODB ATLAS                                 │
│   users │ admins │ detections │ realtimepredictions │ uploadpredictions│
│   activitylogs │ symptomhistories │ loginlogs                          │
│   dronesessions │ droneactivitylogs │ missionplans    ★ NEW            │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 16. Potential Bottlenecks & Optimizations

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| **Model cold start** | ~15 s on first AI request | Switch to `flask_api/app.py` as persistent server |
| **Subprocess overhead** | New Python process per camera frame | Call Flask `/predict` via HTTP from Node |
| **3-second polling** | High request rate during live detection | Use SSE or WebSocket push |
| **uploads/ disk growth** | Unbounded file accumulation | Cron job: delete files older than 24h |
| **Socket.IO simulation** | Simulator runs 24/7 even without clients | Add client-count check; stop when 0 connected |
| **Single backend process** | No clustering | Run with PM2 cluster mode for multi-core |
