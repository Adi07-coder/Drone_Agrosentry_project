# AgroSentry — Complete Architectural Analysis

> Deep-dive technical breakdown of every file, component, API, and AI model in the codebase.

---

## 1. Project Structure — Hierarchical Tree

```
I:\AgroSentry-Final\
├── backend/                        ← Node.js + Express API gateway
│   ├── controllers/
│   │   ├── authController.js       ← User register / login / profile / refresh
│   │   ├── adminController.js      ← Admin CRUD, stats, reports
│   │   ├── detectionController.js  ← AI prediction pipeline orchestrator
│   │   └── symptomController.js    ← Rule-based symptom diagnosis engine
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
│   │   ├── ActivityLog.js          ← activitylogs collection
│   │   ├── SymptomHistory.js       ← symptomhistories collection
│   │   └── LoginLog.js             ← loginlogs collection
│   ├── routes/
│   │   ├── authRoutes.js           ← /api/auth/*
│   │   ├── adminRoutes.js          ← /api/admin/*
│   │   ├── detectionRoutes.js      ← /api/detection/* and /api/detect/* (alias)
│   │   ├── symptomRoutes.js        ← /api/detection/symptom/*
│   │   └── logRoutes.js            ← /api/logs/*
│   ├── uploads/                    ← Multer image upload destination (disk, auto-created)
│   ├── .env                        ← JWT_SECRET, MONGO_URI, PYTHON_PATH, PORT, CORS_ORIGIN
│   ├── package.json
│   └── server.js                   ← ★ BACKEND ENTRY POINT
│
├── frontend/                       ← React 18 + Vite SPA
│   ├── public/
│   ├── src/
│   │   ├── main.jsx                ← ★ FRONTEND ENTRY POINT (ReactDOM.createRoot)
│   │   ├── App.jsx                 ← BrowserRouter + AuthProvider wrapper
│   │   ├── index.css               ← Global styles
│   │   ├── animations/
│   │   │   └── variants.js         ← Framer Motion animation presets
│   │   ├── assets/                 ← Static images, icons
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx  ← Role-based route guard component
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx      ← Top navigation bar
│   │   │   │   ├── Sidebar.jsx     ← Dashboard sidebar navigation
│   │   │   │   ├── Card.jsx        ← Reusable card container
│   │   │   │   ├── Button.jsx      ← Styled button component
│   │   │   │   ├── Badge.jsx       ← Status badge (Healthy / Diseased)
│   │   │   │   ├── Modal.jsx       ← Dialog overlay component
│   │   │   │   ├── Toast.jsx       ← Notification toast wrapper
│   │   │   │   └── SkeletonLoader.jsx ← Loading placeholder
│   │   │   └── dashboard/
│   │   │       ├── LiveCameraAgent.jsx    ← ★ Live detection UI + polling engine
│   │   │       ├── ImageUploadAgent.jsx   ← Upload detection UI + history table
│   │   │       ├── SymptomBasedAgent.jsx  ← Symptom-based diagnosis UI
│   │   │       ├── StatCard.jsx           ← Analytics stat tile
│   │   │       ├── Chart.jsx              ← Recharts bar/line wrapper
│   │   │       └── RecentScans.jsx        ← Recent scan list widget
│   │   ├── context/
│   │   │   └── AuthContext.jsx     ← Global auth state + localStorage sync
│   │   ├── data/                   ← Static JSON disease data
│   │   ├── hooks/
│   │   │   └── useAuth.js          ← useContext(AuthContext) convenience hook
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
│   │   │   ├── HistoryScans.jsx           ← Paginated scan history table
│   │   │   ├── Disease.jsx                ← Disease detail page (/disease/:id)
│   │   │   ├── AdminDashboard.jsx         ← Admin home (redirects to /analytics)
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
│   │   └── utils/
│   │       ├── authService.js      ← All axios API call wrappers (30+ functions)
│   │       ├── api.js              ← Secondary axios client + detectionAPI object
│   │       ├── constants.js        ← Global constants
│   │       └── cn.js               ← className utility (clsx)
│   ├── index.html                  ← Vite HTML shell
│   ├── vite.config.js              ← HTTPS dev server + /api proxy to port 5000
│   └── package.json
│
├── models/                         ← ★ AI model weight files
│   ├── best.pt                     ← YOLOv8 plant ROI detector (22.6 MB)
│   ├── best_augmented_full_model.pth  ← General EfficientNet-B0 classifier (18.9 MB)
│   ├── best_specialist_model.pth      ← Specialist EfficientNet-B0 — Pepper/Potato (18.9 MB)
│   ├── labels.txt                  ← 15 general class labels
│   └── pepper_potato_labels.txt    ← Specialist class labels
│
├── scripts/
│   ├── predict.py                  ← ★ MAIN AI INFERENCE SCRIPT (spawned by Node.js per request)
│   ├── realtime_detection.py       ← Standalone YOLO demo loop (NOT used in web app)
│   ├── train_augmented_full.py     ← Training script: general classifier
│   ├── train_hybrid_classifier.py  ← Hybrid training script
│   ├── train_yolov8_detector.py    ← YOLOv8 training script
│   ├── ensemble_realtime_detection.py ← Ensemble detection (experimental)
│   └── seed-demo-users.js          ← MongoDB seed: admin@plantai.com + user@example.com
│
├── local_storage/                  ← File cache mirrors
│   ├── realtime_detection/images/
│   ├── upload_detection/images/
│   ├── csv_reports/
│   └── logs/
├── requirements.txt                ← Python dependencies
├── Dockerfile                      ← Python 3.10 container definition
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

### Startup Sequence

```
index.html
  └── main.jsx              → ReactDOM.createRoot(#root).render(<App />)
        └── App.jsx
              ├── BrowserRouter     (React Router DOM context)
              └── AuthProvider      (AuthContext.jsx — global auth state)
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
| `/dashboard/analytics` | `AnalyticsDashboard` | user |
| `/dashboard/live-detection` | `LiveDetection` | user |
| `/dashboard/upload-detection` | `UploadDetection` | user |
| `/dashboard/symptoms-recommendation` | `SymptomsRecommendation` | user |
| `/dashboard/history` | `HistoryScans` | user |
| `/disease/:id` | `Disease` | user |
| `/admin/*` | `AdminLayout` (shell) | admin |
| `/admin/analytics` | `AnalyticsDashboard` | admin |
| `/admin/live-detection` | `LiveDetection` | admin |
| `/admin/upload-detection` | `UploadDetection` | admin |
| `/admin/history` | `HistoryScans` | admin |
| `/admin/login-logs` | `LoginLogs` | admin |
| `*` | `PageNotFound` | Public |

### Route Guard — `ProtectedRoute.jsx`
Reads `{ user, admin, isAuthenticated }` from `useAuth()`.
Redirects to `/login` if unauthenticated or wrong role.

### Auth State — `AuthContext.jsx`
Stores `{ user, admin, token, isAuthenticated }` in React context
AND syncs to `localStorage` keys: `authToken`, `authUser`, `userRole`.

---

## 3. Backend Analysis

### Framework
**Node.js + Express.js** acting as an API Gateway that:
1. Handles authentication, user/admin management
2. Accepts image uploads via **Multer** (disk storage)
3. **Spawns Python 3.10** as a child process (`child_process.execFile`) per request to run AI inference
4. Persists results to **MongoDB Atlas** via Mongoose

### Entry Point — `backend/server.js`

### Startup Sequence

```
server.js
  ├── require('dotenv').config()        → Load .env (PYTHON_PATH, MONGO_URI, JWT_SECRET…)
  ├── Express app + CORS (LAN-permissive regex: localhost, 10.x, 192.168.x, 172.x)
  ├── express.json() + express.urlencoded()
  ├── Mount 5 route groups:
  │     /api/auth      → authRoutes.js
  │     /api/detection → detectionRoutes.js
  │     /api/detect    → detectionRoutes.js (alias)
  │     /api/admin     → adminRoutes.js
  │     /api/detection/symptom → symptomRoutes.js
  ├── mongoose.connect(MONGO_URI)       → MongoDB Atlas
  ├── Create local_storage/ directories
  └── app.listen(5000, '0.0.0.0')
```

### Middleware Stack (per request)

```
Incoming Request
  → CORS check
  → express.json()
  → express.urlencoded()
  → [route] authenticate()         ← JWT Bearer token verify
  → [route] authorize(role)        ← Role check (admin routes only)
  → [route] multer upload          ← Image (5 MB) or Video (50 MB) parsing
  → [route] validateImageUpload()  ← MIME + size re-validation
  → Controller function
  → errorHandler middleware
```

### `middleware/auth.js`
- **`authenticate(req, res, next)`** — Extracts `Authorization: Bearer <token>`, verifies with `jwt.verify(token, JWT_SECRET)`, populates `req.user`.
- **`authorize(...roles)`** — Checks `req.user.role` matches allowed roles array.

---

## 4. All API Endpoints

| Endpoint | Method | Auth | Frontend Caller | Backend Handler | Purpose |
|----------|--------|------|-----------------|-----------------|---------|
| `/api/auth/register` | POST | No | `authService.registerUser()` | `authController.register` | User signup |
| `/api/auth/login` | POST | No | `authService.loginUser()` | `authController.login` | User login → JWT |
| `/api/auth/logout` | POST | User | `authService.logout()` | `authController.logout` | End session |
| `/api/auth/profile` | GET | User | `authService.getProfile()` | `authController.getProfile` | Get user info |
| `/api/auth/refresh` | POST | User | `authService.refreshAuthToken()` | `authController.refreshToken` | Refresh JWT |
| `/api/auth/forgot-password` | POST | No | `authService.forgotPassword()` | `authController.forgotPassword` | Reset email |
| `/api/auth/reset-password` | POST | No | `authService.resetPassword()` | `authController.resetPassword` | New password |
| `/api/admin/login` | POST | No | `authService.adminLogin()` | `adminController.adminLogin` | Admin JWT |
| `/api/admin/signup` | POST | No | `authService.adminRegister()` | `adminController.adminSignup` | Admin register |
| `/api/admin/users` | GET | Admin | `authService.getAllUsers()` | `adminController.getAllUsers` | List users |
| `/api/admin/users/:id` | PUT | Admin | `AdminUsers.jsx` | `adminController.updateUser` | Edit user |
| `/api/admin/users/:id` | DELETE | Admin | `AdminUsers.jsx` | `adminController.deleteUser` | Remove user |
| `/api/admin/stats` | GET | Admin | `authService.getAdminStats()` | `adminController.getSystemStats` | System metrics |
| `/api/admin/activity-log` | GET | Admin | `authService.getActivityLog()` | `adminController.getActivityLog` | Activity log |
| `/api/admin/reports` | POST | Admin | `authService.generateReport()` | `adminController.generateReport` | Report CSV/XLSX |
| **`/api/detection/predict`** | **POST** | User | `ImageUploadAgent.jsx` L98 | `detectionController.detectDisease` | **Upload → AI** |
| `/api/detection/upload` | POST | User | `authService.predictDisease()` | `detectionController.detectDisease` | Alt upload |
| **`/api/detection/realtime`** | **POST** | User | `LiveCameraAgent.jsx` L196 | `detectionController.detectDisease` | **Live frame → AI** |
| `/api/detection/realtime/log` | POST | No | Flask `app.py` L261 | `detectionController.logRealtimeDetection` | Flask→Node log |
| `/api/detection/realtime/video` | POST | User | `LiveCameraAgent.jsx` | `detectionController.saveVideo` | Save video |
| `/api/detection/realtime/history` | GET | User | `LiveCameraAgent.jsx` | `detectionController.getRealtimeHistory` | Past live scans |
| `/api/detection/upload/history` | GET | User | `ImageUploadAgent.jsx` L28 | `detectionController.getUploadHistory` | Past uploads |
| `/api/detection/stats/system` | GET | User | `AnalyticsDashboard.jsx` L28 | `detectionController.getSystemStats` | Dashboard stats |
| `/api/detection/download/realtime/csv` | GET | User | `LiveCameraAgent.jsx` | `detectionController.downloadFile` | Export live CSV |
| `/api/detection/download/upload/csv` | GET | User | `ImageUploadAgent.jsx` L141 | `detectionController.downloadFile` | Export upload CSV |
| `/api/detection/:id` | GET | User | `authService.getDetectionById()` | `detectionController.getDetectionById` | Detection detail |
| `/api/detection/symptom` | POST | User | `authService.diagnoseSymptoms()` | `symptomController.diagnoseSymptoms` | Symptom → disease |
| `/api/detection/symptom/history` | GET | User | `SymptomBasedAgent.jsx` L27 | `symptomController.getSymptomHistory` | Symptom history |
| `/api/analytics` | GET | User | (legacy) | `detectionController.getSystemStats` | Alt stats alias |
| `/api/health` | GET | No | `api.js healthCheck()` | Inline handler | Health check |

---

## 5. Live Detection Page — Complete Execution Flow

### Source Files

| Layer | File |
|-------|------|
| Route | `routes/Routes.jsx` L55 |
| Page | `frontend/src/pages/LiveDetection.jsx` |
| Core Component | `frontend/src/components/dashboard/LiveCameraAgent.jsx` |
| API Route | `POST /api/detection/realtime` |
| Route Handler | `backend/routes/detectionRoutes.js` line 67 |
| Controller | `backend/controllers/detectionController.js` — `detectDisease()` |
| AI Script | `scripts/predict.py` |

### Step-by-Step Execution

```
① User navigates to /dashboard/live-detection
   LiveDetection.jsx renders <LiveCameraAgent />

② Camera Initialization (LiveCameraAgent.jsx — startCamera())
   navigator.mediaDevices.getUserMedia({ video: true })
   → stream bound to <video ref={videoRef}>

③ User clicks "Start Analysis"
   → setInterval(pollDetection, ~3000) begins

④ Each Poll — Frame Capture
   ctx.drawImage(videoRef.current, 0, 0)
   canvas.toBlob(blob => handleDetection(blob), 'image/jpeg', 0.8)

⑤ handleDetection(blob) — API Call
   const fd = new FormData()
   fd.append('image', blob, `detect_${Date.now()}.jpg`)
   axios.post('/api/detect/realtime', fd, {
     headers: { Authorization: `Bearer ${token}` }
   })
   → Vite proxy rewrites → http://localhost:5000/api/detect/realtime

⑥ Node.js — Request Processing
   authenticate()         → JWT verified ✓
   multer.single('image') → saved to backend/uploads/<ts>-detect_*.jpg
   validateImageUpload()  → MIME (JPEG/PNG) + 5 MB size ✓
   detectionController.detectDisease()

⑦ AI Invocation (detectionController.js line 69)
   execFile(
     'C:\Users\Shruti\AppData\Local\Programs\Python\Python310\python.exe',
     ['scripts/predict.py', '--image', imagePath],
     { timeout: 45000, maxBuffer: 50MB }
   )

⑧ scripts/predict.py — AI Pipeline
   a) Load YOLO (models/best.pt)
      → yolo_model(image_path, conf=0.5)
      → Best-confidence box → crop + 20px padding → square pad
   b) Load General EfficientNet-B0 (models/best_augmented_full_model.pth)
      → Resize(224,224) → ToTensor() → inference → softmax → 15-class
   c) Load Specialist EfficientNet-B0 (models/best_specialist_model.pth)
      → Same tensor → inference → softmax
   d) Ensemble: if specialist_confidence > 80% → override general result
   e) Threshold:
      YOLO found plant → require ≥ 70% confidence
      No YOLO detection → require ≥ 95% confidence
   f) Build JSON:
      { plantName, diseaseName, status, confidence, bbox,
        symptoms, treatment, fertilizer, prevention }
      → print to stdout → sys.exit(0)

⑨ Node.js Parses stdout JSON
   JSON.parse(lastLine of stdout)
   if plantName === 'None' → 400 "Could not detect a plant"
   else:
     Detection.create()          → MongoDB (combined log)
     RealtimePrediction.create() → MongoDB (realtime history)
     ActivityLog.create()        → MongoDB (activity audit)
     res.json({ success: true, detection, subPrediction })

⑩ Frontend Renders Results (LiveCameraAgent.jsx)
   setCurrentResult(response.data.subPrediction)
   → Plant name, Disease name, Confidence %, Status badge
   → Symptoms, Treatment, Fertilizer, Prevention panels
   → YOLO bounding box drawn on canvas overlay
```

---

## 6. AI/ML Models — Detailed Analysis

### Model 1: YOLOv8 Plant ROI Detector

| Property | Detail |
|----------|--------|
| **File** | `models/best.pt` — 22.6 MB |
| **Framework** | Ultralytics YOLOv8 (PyTorch backend) |
| **Purpose** | Detect and crop the plant/leaf region from image |
| **Input format** | PIL Image (any resolution) |
| **Output** | `boxes.xyxy` — `[x1, y1, x2, y2]` + confidence score per box |
| **Confidence threshold** | `conf=0.5` |
| **Loading code** | `predict.py` L94: `yolo_model = YOLO(YOLO_MODEL_PATH)` |
| **Inference code** | `predict.py` L174: `yolo_results = yolo_model(image_path, conf=0.5, verbose=False)` |
| **Post-processing** | Best-confidence box cropped + 20px padding + square-padded via `ImageOps.pad` |
| **Effect on pipeline** | If found: confidence threshold drops to 70%. If not found: threshold raises to 95%. |

### Model 2: General EfficientNet-B0 Classifier

| Property | Detail |
|----------|--------|
| **File** | `models/best_augmented_full_model.pth` — 18.9 MB |
| **Framework** | PyTorch + torchvision |
| **Architecture** | EfficientNet-B0 → Dropout(0.5) → Linear(1280→512) → ReLU → Dropout(0.3) → Linear(512→15) |
| **Purpose** | Classify across 15 plant/disease categories |
| **Input format** | 224×224 RGB tensor — NO ImageNet normalization applied |
| **Output format** | 15-class softmax probabilities |
| **Labels file** | `models/labels.txt` |
| **Loading code** | `predict.py` lines 100–116 |
| **Inference code** | `predict.py` L208: `general_output = general_model(image_tensor)` |

### Model 3: Specialist EfficientNet-B0 (Pepper + Potato)

| Property | Detail |
|----------|--------|
| **File** | `models/best_specialist_model.pth` — 18.9 MB |
| **Framework** | PyTorch + torchvision |
| **Purpose** | Higher-accuracy classification for Pepper bell + Potato diseases |
| **Architecture** | Same as General model, different output head size |
| **Labels file** | `models/pepper_potato_labels.txt` |
| **Ensemble rule** | `predict.py` L225: if `specialist_confidence > 80%` → override general result |
| **Loading code** | `predict.py` lines 118–134 |

### Model 4: YOLOv8s COCO (Standalone Demo Only)

| Property | Detail |
|----------|--------|
| **File** | `yolov8s.pt` (auto-downloaded from Ultralytics Hub on first run) |
| **Used by** | `scripts/realtime_detection.py` — standalone CLI mode ONLY |
| **NOT in web app** | Web live detection uses `predict.py` with `best.pt` |
| **COCO classes used** | ID 58 (potted plant), 47 (apple), 49 (orange), 50 (broccoli), 51 (carrot) |
| **Purpose** | Mock demo for testing: simulates disease output for any detected COCO object |

### Model 5: Flask Inference Pipeline (Alternative — Not Active)

| Property | Detail |
|----------|--------|
| **File** | `backend/flask_api/app.py` — port 5001 |
| **Endpoints** | `POST /predict` (image bytes → JSON), `GET /video_feed` (MJPEG stream) |
| **Models** | Same YOLO + 2x EfficientNet-B0, loaded persistently in memory at startup |
| **Status** | Built but **not wired** to the Node.js backend — would eliminate subprocess cold-start if enabled |

---

## 7. Frontend ↔ Backend Connection

### Connection Method
Vite's HTTPS dev proxy rewrites all `/api/*` calls from `https://localhost:5173` → `http://localhost:5000`.
All frontend API calls use relative URLs (e.g., `/api/detection/predict`).

### Auth Token Flow

```
Login.jsx
  → authService.loginUser()  (User tab)
  → authService.adminLogin() (Admin tab)
  → POST /api/auth/login OR /api/admin/login
  → Response: { token, user }
  → localStorage.setItem('authToken', token)
  → axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  → AuthContext.setState({ isAuthenticated: true, user })
```

### Complete Live Detection Request-Response Chain

```
LiveCameraAgent.jsx
  handleDetection(blob)
      │
      ▼  axios.post('/api/detect/realtime', FormData{image: blob})
      │  Header: Authorization: Bearer <JWT>
      │
      ▼  Vite proxy → http://localhost:5000
      │
      ▼  server.js → app.use('/api/detect', detectionRoutes)
      │
      ▼  detectionRoutes.js L67:
      │    router.post('/realtime',
      │      authenticate, upload.single('image'), validateImageUpload, detectDisease)
      │
      ├── authenticate()       → JWT verified, req.user populated
      ├── multer()             → image saved to uploads/<ts>-detect_*.jpg
      ├── validateImageUpload() → MIME + size OK
      │
      ▼  detectionController.detectDisease()
      │    execFile('Python310/python.exe', ['predict.py', '--image', path])
      │
      ▼  predict.py
      │    YOLO(best.pt) → ROI crop
      │    EfficientNet-B0 × 2 → ensemble
      │    JSON → stdout
      │
      ▼  Node.js parses stdout JSON
      │    → Detection.create()
      │    → RealtimePrediction.create()
      │    → ActivityLog.create()
      │
      ▼  res.json({ success: true, detection, subPrediction })
      │
      ▼  LiveCameraAgent.jsx
           setCurrentResult(subPrediction)
           → renders disease information panels
```

---

## 8. Real-Time Detection Workflow

| Step | Event | Code Location |
|------|-------|---------------|
| 1 | User opens `/dashboard/live-detection` | `Routes.jsx` L55 |
| 2 | `LiveDetection.jsx` renders `<LiveCameraAgent />` | `LiveDetection.jsx` L9 |
| 3 | `getUserMedia({video:true})` opens webcam | `LiveCameraAgent.jsx` — `startCamera()` |
| 4 | Video stream bound to `<video>` element | `videoRef.current.srcObject = stream` |
| 5 | "Start Analysis" → `setInterval(pollDetection, 3000)` | `LiveCameraAgent.jsx` |
| 6 | Canvas captures current video frame | `ctx.drawImage(videoRef.current, 0, 0)` |
| 7 | Frame exported as JPEG blob at quality 0.8 | `canvas.toBlob(blob, 'image/jpeg', 0.8)` |
| 8 | FormData `{image: blob}` → `axios.post` | `handleDetection()` in `LiveCameraAgent.jsx` |
| 9 | Multer saves file to `backend/uploads/` | `detectionRoutes.js` L67 |
| 10 | `validateImageUpload` checks MIME + 5 MB limit | `middleware/validate.js` |
| 11 | `execFile(PYTHON_PATH, ['predict.py','--image', path])` | `detectionController.js` L69 |
| 12 | YOLO `best.pt` → ROI bounding box | `predict.py` L172–194 |
| 13 | EfficientNet-B0 × 2 ensemble inference | `predict.py` L206–227 |
| 14 | JSON result printed to stdout | `predict.py` L335 |
| 15 | Node.js parses JSON from child process stdout | `detectionController.js` L75–96 |
| 16 | Results saved to 3 MongoDB collections | `Detection`, `RealtimePrediction`, `ActivityLog` |
| 17 | `res.json({ success, subPrediction })` sent | `detectionController.js` L169 |
| 18 | `setCurrentResult()` triggers UI re-render | `LiveCameraAgent.jsx` |

---

## 9. Dependency Analysis

### Frontend

| Library | Version | Purpose |
|---------|---------|---------|
| `react` + `react-dom` | 18.x | Core UI framework |
| `react-router-dom` | v6 | Client-side routing |
| `axios` | latest | All HTTP API communication |
| `framer-motion` | latest | UI animations + transitions |
| `recharts` | latest | Bar + line charts (analytics page) |
| `lucide-react` | latest | Icon library |
| `react-hot-toast` | latest | Toast notifications |
| `clsx` | latest | Conditional className utility |

### Backend (Node.js)

| Library | Purpose |
|---------|---------|
| `express` | HTTP server + routing |
| `mongoose` | MongoDB ODM — 8 Mongoose schemas |
| `jsonwebtoken` | JWT sign + verify |
| `bcryptjs` | Password hashing |
| `multer` | Image + video file uploads (disk storage) |
| `cors` | Cross-origin request handling |
| `dotenv` | `.env` variable loading |

### Python (AI Engine)

| Library | Version | Purpose |
|---------|---------|---------|
| `torch` | 2.12.0+cpu | Deep learning inference engine |
| `torchvision` | 0.27.0 | EfficientNet-B0 model + image transforms |
| `ultralytics` | 8.4.60 | YOLOv8 model loading + inference |
| `Pillow` | 12.2.0 | Image loading, ROI crop, padding |
| `numpy` | 1.26.4 | Tensor/array operations |
| `opencv-python` | 4.11.0.86 | Camera frame capture (standalone demo mode) |
| `flask` + `flask-cors` | — | Alternative microservice (`flask_api/app.py`) |

---

## 10. System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                              │
│   React 18 SPA (Vite)       https://localhost:5173                   │
│   ┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│   │  AuthContext   │  │   React Router   │  │  Axios Client    │    │
│   │  (JWT + state) │  │   (v6 Routes)    │  │  /api/* calls    │    │
│   └────────────────┘  └──────────────────┘  └────────┬─────────┘    │
└────────────────────────────────────────────────────────┼─────────────┘
                                                         │  Vite Proxy
                                                         │  /api/* → :5000
┌────────────────────────────────────────────────────────▼─────────────┐
│                   NODE.JS EXPRESS BACKEND  localhost:5000             │
│   ┌───────────┐  ┌─────────────┐  ┌──────────┐  ┌───────────────┐   │
│   │  auth.js  │  │ validate.js │  │  multer  │  │ errorHandler  │   │
│   └───────────┘  └─────────────┘  └──────────┘  └───────────────┘   │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │  /api/auth   /api/admin   /api/detection   /api/logs         │   │
│   └──────────────────────────┬───────────────────────────────────┘   │
│   ┌───────────────────────────▼──────────────────────────────────┐   │
│   │              detectionController.js                          │   │
│   │   execFile(PYTHON_PATH, predict.py, --image, imagePath)      │   │
│   └───────────────────────────┬──────────────────────────────────┘   │
└───────────────────────────────┼──────────────────────────────────────┘
                                │  child_process.execFile
┌───────────────────────────────▼──────────────────────────────────────┐
│                PYTHON 3.10 AI INFERENCE (subprocess per request)      │
│   ┌────────────────────────────────────────────────────────────────┐  │
│   │                      scripts/predict.py                        │  │
│   │   ┌───────────┐  ┌──────────────────────┐  ┌──────────────┐   │  │
│   │   │ YOLO ROI  │→ │  EfficientNet-B0     │ +│  Specialist  │   │  │
│   │   │  best.pt  │  │  (General, 15-class) │  │  EfficNet-B0 │   │  │
│   │   └───────────┘  └──────────────────────┘  └──────────────┘   │  │
│   │          └──────────────── Ensemble ─────────────────┘         │  │
│   │                       JSON → stdout                            │  │
│   └────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────┐
│                          MONGODB ATLAS                                │
│   users │ admins │ detections │ realtimepredictions                   │
│   uploadpredictions │ activitylogs │ symptomhistories │ loginlogs     │
└───────────────────────────────────────────────────────────────────────┘
```

### Detection Pipeline Diagram

```
Camera Frame (JPEG blob, ~480px)
           │
           ▼
   FormData { image: blob }
           │
           ▼
   POST /api/detect/realtime
           │
      ┌────▼────┐
      │JWT auth │
      └────┬────┘
           │
      ┌────▼─────┐
      │  multer  │  → uploads/<ts>-detect_*.jpg
      └────┬─────┘
           │
      ┌────▼──────────┐
      │ validateImage │  → MIME check + 5 MB limit
      └────┬──────────┘
           │
      ┌────▼───────────────────────┐
      │ execFile(python, predict.py)│  timeout = 45 seconds
      └────┬───────────────────────┘
           │
           ▼
   ┌───────────────────────────────────────────────────────┐
   │                    predict.py                         │
   │                                                       │
   │  YOLO(best.pt)                                        │
   │    conf ≥ 0.5 → crop plant ROI → pad to square        │
   │    not found  → use full image, threshold = 95%       │
   │                                                       │
   │  EfficientNet-B0 General                              │
   │    Resize(224,224) → ToTensor() → softmax → 15 classes│
   │                                                       │
   │  EfficientNet-B0 Specialist                           │
   │    Same input tensor → softmax                        │
   │    if specialist_conf > 80% → override general        │
   │                                                       │
   │  Final threshold:                                     │
   │    YOLO found:  confidence ≥ 70%  → result            │
   │    No YOLO:     confidence ≥ 95%  → result            │
   │    Below threshold → { plantName: "Unknown" }         │
   │                                                       │
   │  Output JSON → stdout                                 │
   └──────────────────────────┬────────────────────────────┘
                              │
              Node.js parses stdout JSON
                              │
              ┌───────────────┴──────────────┐
              │       MongoDB saves:          │
              │   Detection (combined log)    │
              │   RealtimePrediction          │
              │   ActivityLog                 │
              └───────────────┬──────────────┘
                              │
              { success: true, subPrediction: { ... } }
                              │
              LiveCameraAgent.jsx renders results
```

---

## 11. Supported Plant Diseases (15 Classes)

From `models/labels.txt`:

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

## 12. Final Summary

### Frontend Entry Points
| File | Role |
|------|------|
| `frontend/index.html` | HTML shell |
| `frontend/src/main.jsx` | `ReactDOM.createRoot` — JS entry |
| `frontend/src/App.jsx` | `BrowserRouter + AuthProvider` wrapper |
| `frontend/src/routes/Routes.jsx` | All 18 route definitions |

### Backend Entry Points
| File | Role |
|------|------|
| `backend/server.js` | `app.listen(5000)` — Express server |
| `scripts/predict.py` | AI inference (subprocess per request) |
| `backend/flask_api/app.py` | Alt microservice port 5001 (not wired) |

### Live Detection Full Execution Path (Summary)
```
/dashboard/live-detection
  → LiveDetection.jsx
    → <LiveCameraAgent />
      → getUserMedia() — open webcam
      → canvas.toBlob() every 3s — JPEG frame
      → axios.post('/api/detect/realtime', FormData)
        → authenticate → multer → validateImageUpload
        → detectionController.detectDisease()
          → execFile(Python 3.10, scripts/predict.py)
            → YOLO(best.pt) → ROI crop
            → EfficientNet-B0 × 2 → ensemble decision
            → JSON printed to stdout
          → Node.js parses JSON result
          → MongoDB: Detection + RealtimePrediction + ActivityLog
          → JSON response to frontend
      → setCurrentResult() → disease panels rendered in UI
```

### Potential Bottlenecks & Optimizations

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| **Model cold start** | ~15 s on first request (3 models load fresh each time) | Switch to `flask_api/app.py` as persistent server — models stay in memory |
| **Subprocess overhead** | New Python process spawned per every camera frame | Call Flask `/predict` via HTTP from Node controller instead of `execFile` |
| **3-second polling** | High request rate during continuous live use | Use WebSocket or Server-Sent Events (SSE) for push-based results |
| **uploads/ disk growth** | `uploads/` grows unboundedly over time | Add a cron job to delete files older than 24 hours |
| **No client-side resize** | Large images slow upload on mobile | Resize canvas output to 640px max before creating blob |
| **Single Python process** | Only 1 inference can run at a time | Run Flask with Gunicorn (multi-worker) for parallel inference |
