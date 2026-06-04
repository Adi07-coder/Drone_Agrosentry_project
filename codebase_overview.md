# 🌿 AgroSentry — Complete Codebase Overview

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite, TailwindCSS, Framer Motion, Recharts, Axios |
| **Backend** | Node.js + Express 5, MongoDB + Mongoose, JWT Auth, Multer |
| **ML Layer** | Python (Flask API / python-shell) |
| **Analytics** | Streamlit (separate service on port 8501) |
| **Auth** | JWT tokens, bcryptjs, role-based (user/admin) |

---

## 📁 Root Directory

```
Drone_AgroSentry/
├── backend/                  ← Node.js + Express API server
├── frontend/                 ← React + Vite SPA
├── models/                   ← ML model files (pickle/h5)
├── local_storage/            ← Local file storage for images/reports/logs
├── scripts/                  ← Utility scripts
├── streamlit_app/            ← Streamlit analytics dashboard
├── venv/                     ← Python virtual environment
├── Dockerfile                ← Docker containerization
├── render.yaml               ← Render.com deployment config
├── requirements.txt          ← Python dependencies
├── package.json              ← Root-level npm scripts
└── README.md / docs/         ← Documentation files
```

---

## 🔵 BACKEND — `backend/`

**Entry Point:** [`server.js`](file:///j:/personal%20projects/Drone_AgroSentry/backend/server.js)

### Architecture
- Express 5 REST API on port **5000**
- MongoDB via Mongoose (Atlas or local)
- JWT middleware for protected routes
- Python ML inference via `python-shell`

### File Structure

```
backend/
├── server.js                 ← App entry: Express setup, CORS, routes, MongoDB
├── .env                      ← Environment variables (MONGO_URI, JWT_SECRET, etc.)
├── package.json              ← Dependencies: express, mongoose, jwt, bcrypt, multer
├── seed.js                   ← Database seeder script
├── check_admins.js           ← Admin verification utility
│
├── controllers/              ← Business logic layer
│   ├── authController.js     ← Register, login, logout, password reset
│   ├── adminController.js    ← Admin CRUD, user management, login logs
│   ├── detectionController.js← Disease detection, stats, scan history
│   ├── symptomController.js  ← Symptom-based recommendation engine
│   └── logController.js      ← Activity/login log retrieval
│
├── routes/                   ← Express route definitions
│   ├── authRoutes.js         ← POST /api/auth/login, /register, /logout
│   ├── adminRoutes.js        ← POST /api/admin/login, GET /api/admin/users
│   ├── detectionRoutes.js    ← POST /api/detection/predict, GET /api/detect/stats
│   ├── symptomRoutes.js      ← POST /api/detect/symptom
│   └── logRoutes.js          ← GET /api/logs
│
├── middleware/
│   ├── auth.js               ← JWT `authenticate` + `requireAdmin` middleware
│   ├── errorHandler.js       ← Global Express error handler
│   └── validate.js           ← express-validator input validation chains
│
├── models/                   ← Mongoose schemas
│   ├── User.js               ← User schema (name, email, password, role, farm info)
│   ├── Admin.js              ← Admin schema (separate collection)
│   ├── Detection.js          ← Main detection result model
│   ├── UploadPrediction.js   ← Image upload detection records
│   ├── RealtimePrediction.js ← Live camera detection records
│   ├── SymptomHistory.js     ← Symptom-based session records
│   ├── ActivityLog.js        ← User activity tracking
│   └── LoginLog.js           ← Login attempt records
│
├── flask_api/
│   └── app.py                ← Flask ML API (runs separately, ~10KB)
│
├── python/
│   ├── predict.py            ← ML inference script (called via python-shell)
│   └── export_history.py     ← CSV/Excel export utility
│
└── uploads/                  ← Multer upload destination for image files
```

### Key API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/admin/login` | Admin login |
| POST | `/api/detection/predict` | Upload image → ML prediction |
| GET | `/api/detect/stats/system` | Analytics stats |
| POST | `/api/detect/symptom` | Symptom-based diagnosis |
| GET | `/api/logs` | Activity/login logs |
| GET | `/api/analytics` | System-wide stats (authenticated) |
| GET | `/health` | Health check |

---

## 🟢 FRONTEND — `frontend/`

**Entry Point:** [`main.jsx`](file:///j:/personal%20projects/Drone_AgroSentry/frontend/src/main.jsx) → [`App.jsx`](file:///j:/personal%20projects/Drone_AgroSentry/frontend/src/App.jsx)

**Dev Server:** Vite on port **5175** (configured in vite.config.js)

### File Structure

```
frontend/
├── index.html                ← HTML shell
├── vite.config.js            ← Vite config (React plugin, proxy to :5000)
├── tailwind.config.js        ← TailwindCSS config with custom theme
├── package.json              ← React, Framer Motion, Recharts, Axios, etc.
│
└── src/
    ├── main.jsx              ← React DOM root mount + Toaster
    ├── App.jsx               ← BrowserRouter + AuthProvider + AppRoutes
    ├── index.css             ← Global styles + Tailwind directives
    │
    ├── routes/
    │   └── Routes.jsx        ← All route definitions (public + user + admin)
    │
    ├── context/
    │   └── AuthContext.jsx   ← Auth state: login, register, logout, token mgmt
    │
    ├── hooks/
    │   └── useAuth.js        ← `useContext(AuthContext)` hook shorthand
    │
    ├── animations/
    │   └── variants.js       ← Framer Motion animation variants (container, item, floating)
    │
    ├── utils/
    │   ├── api.js            ← Axios client + detectionAPI + healthCheck
    │   ├── authService.js    ← Auth service functions
    │   ├── constants.js      ← App-wide constants
    │   └── cn.js             ← `clsx` + `tailwind-merge` utility
    │
    ├── data/
    │   └── mockData.js       ← Mock data for development/testing (~15KB)
    │
    ├── layouts/
    │   └── AdminLayout.jsx   ← Admin shell layout with Sidebar + Navbar + Outlet
    │
    ├── components/
    │   ├── ProtectedRoute.jsx ← Role-based route guard (user | admin)
    │   │
    │   ├── common/           ← Shared UI primitives
    │   │   ├── Navbar.jsx    ← Top navigation bar
    │   │   ├── Sidebar.jsx   ← Collapsible sidebar (user/admin menu items)
    │   │   ├── Button.jsx    ← Reusable button component
    │   │   ├── Card.jsx      ← Glass-morphism card wrapper
    │   │   ├── Modal.jsx     ← Portal-based modal dialog
    │   │   ├── Badge.jsx     ← Status badge chip
    │   │   ├── Toast.jsx     ← Toast notification wrapper
    │   │   ├── SkeletonLoader.jsx ← Loading skeleton
    │   │   └── index.js      ← Barrel exports
    │   │
    │   ├── dashboard/        ← Dashboard-specific widgets
    │   │   ├── ImageUploadAgent.jsx  ← Image upload + detection UI (14KB)
    │   │   ├── LiveCameraAgent.jsx   ← WebRTC camera stream + real-time detection (23KB)
    │   │   ├── SymptomBasedAgent.jsx ← Multi-step symptom form + AI diagnosis (12KB)
    │   │   ├── Chart.jsx     ← Recharts wrapper (bar + line charts)
    │   │   ├── StatCard.jsx  ← Analytics stat card widget
    │   │   ├── RecentScans.jsx ← Recent detection list widget
    │   │   └── index.js      ← Barrel exports
    │   │
    │   └── admin/            ← Admin-specific table/modal components
    │       ├── DiseaseDBTable.jsx      ← Disease database CRUD table (11KB)
    │       ├── UserManagementTable.jsx ← User admin table (9KB)
    │       ├── ScanHistoryDrawer.jsx   ← Scan detail side drawer
    │       ├── ImagePreviewModal.jsx   ← Full-size image modal
    │       ├── ActivityTimeline.jsx    ← Admin activity feed
    │       ├── DiseaseDBAnalytics.jsx  ← Disease stats charts
    │       ├── ScanStatusBadge.jsx     ← Scan status indicator
    │       └── index.js
    │
    └── pages/
        ├── Landing.jsx           ← Public homepage (hero + features + footer)
        ├── Login.jsx             ← User + Admin login with tabs
        ├── Signup.jsx            ← User registration form
        ├── Onboarding.jsx        ← Post-signup farm setup wizard
        ├── Dashboard.jsx         ← User dashboard shell (Navbar + Sidebar + Outlet)
        ├── AnalyticsDashboard.jsx← Analytics stats + charts (fetches /api/detect/stats)
        ├── LiveDetection.jsx     ← Wraps LiveCameraAgent
        ├── UploadDetection.jsx   ← Wraps ImageUploadAgent
        ├── SymptomsRecommendation.jsx ← Wraps SymptomBasedAgent
        ├── HistoryScans.jsx      ← Detection history with filters/export (8KB)
        ├── Disease.jsx           ← Disease detail page (9KB)
        ├── PageNotFound.jsx      ← 404 page
        │
        ├── AdminDashboard.jsx    ← Admin dashboard shell
        ├── AdminUsers.jsx        ← User management page
        ├── AdminDiseaseDB.jsx    ← Disease database management
        ├── AdminReports.jsx      ← Reports generation page (8KB)
        ├── AdminActivityLog.jsx  ← Activity log viewer
        ├── AdminSettings.jsx     ← Admin settings page
        └── admin/
            └── LoginLogs.jsx     ← Login attempt logs table
```

---

## 🔐 Authentication Flow

```
User visits /login
    → Selects tab: "Farmer Login" or "Admin Login"
    → POST /api/auth/login  OR  /api/admin/login
    → JWT token stored in localStorage as 'authToken'
    → User object stored as 'authUser', role as 'userRole'
    → Redirects to /dashboard (user) or /admin (admin)

ProtectedRoute checks AuthContext:
    → requiredRole="user"  → checks user state
    → requiredRole="admin" → checks admin state
    → Unauthenticated → redirects to /login
```

---

## 🗺️ Route Map

| Path | Component | Access |
|---|---|---|
| `/` | Landing | Public |
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/onboarding` | Onboarding | User |
| `/dashboard` | Dashboard shell | User |
| `/dashboard/analytics` | AnalyticsDashboard | User |
| `/dashboard/live-detection` | LiveDetection | User |
| `/dashboard/upload-detection` | UploadDetection | User |
| `/dashboard/symptoms-recommendation` | SymptomsRecommendation | User |
| `/dashboard/history` | HistoryScans | User |
| `/disease/:id` | Disease | User |
| `/admin` | AdminLayout shell | Admin |
| `/admin/analytics` | AnalyticsDashboard | Admin |
| `/admin/live-detection` | LiveDetection | Admin |
| `/admin/upload-detection` | UploadDetection | Admin |
| `/admin/symptoms-recommendation` | SymptomsRecommendation | Admin |
| `/admin/history` | HistoryScans | Admin |
| `/admin/login-logs` | LoginLogs | Admin |

---

## 🧠 Key Observations

1. **Dual-role architecture**: Same pages (analytics, detection, history) are shared between users and admins — differentiated by route prefix `/dashboard` vs `/admin`.
2. **Three detection modes**: Image upload, live camera (WebRTC), and symptom-based questionnaire.
3. **Python ML Bridge**: Node.js calls Python scripts via `python-shell` for inference; a separate Flask API (`flask_api/app.py`) also exists.
4. **Streamlit integration**: A separate analytics service on port 8501 linked from the Dashboard header.
5. **Frontend uses TailwindCSS** (v3) with a dark slate/emerald color theme throughout.
6. **Mock data** available in `mockData.js` for offline development.
