# AgroSentry Codebase Export

\n### File: .\codebase_export.md\n\n`md\n\n`\n\n\n### File: .\export_script.py\n\n`py\nimport os

EXTENSIONS = ('.js', '.jsx', '.py', '.css', '.html', '.json', '.toml', '.md', '.vue')
IGNORE_DIRS = {'node_modules', '.git', '.venv', 'uploads', '__pycache__', 'dist', 'build', 'models', 'local_storage', 'scripts'}

def export_code():
    with open('codebase_export.md', 'w', encoding='utf-8') as outfile:
        outfile.write('# AgroSentry Codebase Export\n\n')
        for root, dirs, files in os.walk('.'):
            # Mutate dirs in place to skip ignored directories
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS and not d.startswith('.')]
            
            for file in files:
                if file.endswith(EXTENSIONS):
                    filepath = os.path.join(root, file)
                    # skip package-lock.json
                    if 'package-lock.json' in file: continue
                    outfile.write(f"\\n### File: {filepath}\\n\\n")
                    # Determine markdown code block language
                    ext = file.split('.')[-1]
                    lang = 'javascript' if ext in ['js', 'jsx'] else ext
                    outfile.write(f"`{lang}\\n")
                    try:
                        with open(filepath, 'r', encoding='utf-8') as infile:
                            outfile.write(infile.read())
                    except Exception as e:
                        outfile.write(f"// Error reading file: {e}")
                    outfile.write(f"\\n`\\n\\n")

if __name__ == '__main__':
    export_code()
\n`\n\n\n### File: .\IMPLEMENTATION_PROGRESS.md\n\n`md\n# AgroSentry Project - Implementation Progress Report

**Date:** 2026-05-25
**Status:** PHASE 1 & PHASE 2 COMPLETE ✅

---

## COMPLETED IMPLEMENTATIONS

### PHASE 1: Backend Authentication & Database ✅ COMPLETE

#### 1. **Enhanced Environment Configuration**
- **File:** `backend/.env`
- **Changes:**
  - Added `JWT_SECRET` for token generation
  - Added `JWT_EXPIRY=7d` and `JWT_REFRESH_EXPIRY=30d`
  - Added `NODE_ENV` configuration
  - Added `CORS_ORIGIN` and `API_URL`
  - Added upload directory and file size limits

#### 2. **Enhanced Database Models**
- **File:** `backend/models/User.js`
  - Added: `isActive`, `lastLogin`, `scansCount`, `preferences`
  - Improved validation and schema structure
  - Added `toJSON()` method to exclude passwords

- **File:** `backend/models/Admin.js`
  - Added: `department`, `adminLevel`, `permissions`
  - Added: `isActive`, `lastLogin`
  - Added `toJSON()` method for safe data serialization

- **File:** `backend/models/Detection.js`
  - Added: `userId` reference to User model
  - Added: `accuracy`, `processedAt` fields
  - Added database indexes for performance

- **File:** `backend/models/ActivityLog.js` (NEW)
  - Tracks all user activities (login, logout, detection, settings changes)
  - Stores IP address and user agent
  - Indexed for efficient queries

#### 3. **Authentication Middleware**
- **File:** `backend/middleware/auth.js` (UPDATED)
  - Updated to export `authenticate` and `authorize` functions
  - Added role-based authorization middleware
  - JWT token verification with error handling

- **File:** `backend/middleware/errorHandler.js` (NEW)
  - Global error handling middleware
  - Handles MongoDB validation errors
  - Handles JWT errors
  - Environment-specific error responses

- **File:** `backend/middleware/validate.js` (NEW)
  - Input validation using express-validator
  - Validates: email format, password strength, file types
  - File size validation (5MB limit)
  - MIME type checking for images

#### 4. **Authentication Controller & Routes**
- **File:** `backend/controllers/authController.js` (NEW)
  - `register()` - Create new user/admin with password hashing
  - `login()` - Authenticate credentials and generate JWT
  - `logout()` - Log out user and record activity
  - `getProfile()` - Retrieve authenticated user profile
  - `refreshToken()` - Refresh expired JWT tokens

- **File:** `backend/routes/authRoutes.js` (NEW)
  - `POST /auth/register` - User registration
  - `POST /auth/login` - User login
  - `POST /auth/logout` - Logout (protected)
  - `GET /auth/profile` - Get profile (protected)
  - `POST /auth/refresh` - Refresh token (protected)

#### 5. **Admin Management System**
- **File:** `backend/controllers/adminController.js` (NEW)
  - `getAllUsers()` - Paginated user list with search/filter
  - `updateUser()` - Update user profile and preferences
  - `deleteUser()` - Soft delete user (set inactive)
  - `getActivityLog()` - Retrieve system activity logs
  - `getSystemStats()` - System-wide statistics
  - `generateReport()` - Generate analytics reports

- **File:** `backend/routes/adminRoutes.js` (NEW)
  - `GET /admin/users` - List all users
  - `PUT /admin/users/:id` - Update user
  - `DELETE /admin/users/:id` - Deactivate user
  - `GET /admin/stats` - System statistics
  - `GET /admin/activity-log` - Activity logs
  - `POST /admin/reports` - Generate reports
  - All routes protected with admin role authorization

#### 6. **Enhanced Detection Controller**
- **File:** `backend/controllers/detectionController.js` (UPDATED)
  - Added authentication checks
  - Added user tracking for detections
  - Added activity logging
  - Added pagination support
  - New endpoints:
    - `getDetections()` - List user's detections
    - `getDetectionById()` - Get specific detection
    - `getSystemStats()` - Get overall statistics

- **File:** `backend/routes/detectionRoutes.js` (UPDATED)
  - Enhanced file validation
  - MIME type checking
  - File size limits
  - New protected routes for fetching detections

#### 7. **Updated Server Configuration**
- **File:** `backend/server.js` (UPDATED)
  - Added error handling middleware
  - Added 404 handler
  - Added CORS configuration with origin control
  - Integrated auth routes
  - Integrated admin routes
  - Better logging and error messages

---

### PHASE 2: Frontend Authentication Integration ✅ COMPLETE

#### 1. **Auth Context**
- **File:** `frontend/src/context/AuthContext.jsx` (NEW)
  - Centralized authentication state management
  - Methods: `login()`, `register()`, `logout()`, `refreshToken()`
  - localStorage integration for persistence
  - Auto-login on app mount if token exists
  - Error handling and loading states

#### 2. **Custom Hooks**
- **File:** `frontend/src/hooks/useAuth.js` (NEW)
  - Custom hook for accessing AuthContext
  - Provides: `user`, `admin`, `token`, `isAuthenticated`, auth methods
  - Error handling if used outside AuthProvider

#### 3. **Authentication Service**
- **File:** `frontend/src/utils/authService.js` (NEW)
  - Frontend API calls to backend
  - Functions:
    - `registerUser()` - Register new account
    - `loginUser()` - Authenticate user
    - `logout()` - Log out user
    - `getProfile()` - Fetch user profile
    - `refreshAuthToken()` - Refresh token
    - `predictDisease()` - Upload image for detection
    - `getDetections()` - Fetch user's detections
    - `getActivityLog()` - Fetch activity logs
    - `getAdminStats()` - Get admin statistics
    - `generateReport()` - Generate analytics reports
  - Auto-includes JWT token in request headers
  - Centralized error handling

#### 4. **Protected Route Component**
- **File:** `frontend/src/components/ProtectedRoute.jsx` (NEW)
  - Wrapper component for protecting routes
  - Role-based access control (user/admin)
  - Redirects unauthenticated users to role-select page
  - Prevents unauthorized access to protected pages

#### 5. **App Configuration**
- **File:** `frontend/src/App.jsx` (UPDATED)
  - Wrapped with AuthProvider
  - Removed props drilling
  - Simplified component structure

- **File:** `frontend/src/routes/Routes.jsx` (UPDATED)
  - Integrated ProtectedRoute wrapper
  - Removed props from route components
  - Uses useAuth hook instead of props
  - Role-based route protection

#### 6. **Login Component**
- **File:** `frontend/src/pages/Login.jsx` (UPDATED)
  - Integrated real authentication API
  - Real-time error messages
  - Toast notifications for feedback
  - Loading states with spinner
  - localStorage integration
  - Redirect after successful login
  - Support for both user and admin login

---

## BACKEND API ENDPOINTS

### Authentication Routes (`/api/auth`)
```
POST   /auth/register       - Register new account
POST   /auth/login          - Login and get JWT token
POST   /auth/logout         - Logout (requires token)
GET    /auth/profile        - Get user profile (requires token)
POST   /auth/refresh        - Refresh JWT token (requires token)
```

### Detection Routes (`/api/detection`)
```
POST   /detection/predict   - Upload image for detection
GET    /detection           - List user's detections (requires token)
GET    /detection/:id       - Get specific detection (requires token)
GET    /detection/stats/system - Get system stats (requires token)
```

### Admin Routes (`/api/admin`) - Requires Admin Role
```
GET    /admin/users         - List all users with pagination
PUT    /admin/users/:id     - Update user details
DELETE /admin/users/:id     - Deactivate user
GET    /admin/stats         - Get system statistics
GET    /admin/activity-log  - Get activity logs
POST   /admin/reports       - Generate analytics reports
```

---

## DATABASE SCHEMA

### Collections Created/Updated
1. **users** - User accounts and profiles
2. **admins** - Admin accounts with permissions
3. **detections** - Disease detection results linked to users
4. **activitylogs** - Audit trail of all system activities

### Key Relationships
- `Detection.userId` → `User._id`
- `ActivityLog.userId` → `User._id` or `Admin._id`

---

## SECURITY FEATURES IMPLEMENTED

✅ JWT-based authentication with expiry
✅ Password hashing with bcryptjs (salt: 10)
✅ Role-based access control (RBAC)
✅ Input validation and sanitization
✅ CORS configuration with origin control
✅ File upload validation (MIME type, size)
✅ Activity logging for auditing
✅ Soft delete for users (data retention)
✅ Protected routes with token verification
✅ Environment variable configuration
✅ Error handling with stack traces (dev only)
✅ HTTPS-ready configuration

---

## FRONTEND STATE MANAGEMENT

### Authentication Context State
```javascript
{
  user,              // User object or null
  admin,             // Admin object or null
  token,             // JWT token
  loading,           // Loading state during auth operations
  error,             // Error message if any
  isAuthenticated,   // Boolean flag
  // Methods:
  login(),
  register(),
  logout(),
  refreshToken(),
  setError()
}
```

### localStorage Storage
- `authToken` - JWT token for API requests
- `authUser` - Serialized user/admin object
- `userRole` - User role (user/admin)

---

## TESTING CHECKLIST

### Backend Testing
```bash
# Start backend
cd backend
npm install
npm start

# Test health check
curl http://localhost:5000/health

# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "role": "user"
  }'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "role": "user"
  }'
```

### Frontend Testing
```bash
# Start frontend
cd frontend
npm install
npm run dev

# Test workflow:
1. Visit http://localhost:5173
2. Click "Get Started"
3. Select "User"
4. Click "Sign Up"
5. Create new account
6. Verify localStorage has token and user data
7. Refresh page - should stay logged in
8. Click Logout
9. Verify redirected to role-select
10. Test Admin login flow similarly
```

---

## FILES CREATED/MODIFIED SUMMARY

### Backend
✅ Created: `controllers/authController.js`
✅ Created: `routes/authRoutes.js`
✅ Created: `routes/adminRoutes.js`
✅ Created: `controllers/adminController.js`
✅ Created: `models/ActivityLog.js`
✅ Created: `middleware/errorHandler.js`
✅ Created: `middleware/validate.js`
✅ Modified: `models/User.js`
✅ Modified: `models/Admin.js`
✅ Modified: `models/Detection.js`
✅ Modified: `middleware/auth.js`
✅ Modified: `controllers/detectionController.js`
✅ Modified: `routes/detectionRoutes.js`
✅ Modified: `server.js`
✅ Modified: `.env`

### Frontend
✅ Created: `context/AuthContext.jsx`
✅ Created: `hooks/useAuth.js`
✅ Created: `utils/authService.js`
✅ Created: `components/ProtectedRoute.jsx`
✅ Modified: `App.jsx`
✅ Modified: `routes/Routes.jsx`
✅ Modified: `pages/Login.jsx`

---

## NEXT STEPS - PHASE 3 & 4

### Phase 3: Dashboard & Image Upload
- [ ] Update Signup.jsx with real authentication
- [ ] Update Dashboard.jsx to fetch real data from API
- [ ] Fix ImageUploadAgent.jsx missing handleFileChange
- [ ] Implement LiveCameraAgent.jsx with webcam access
- [ ] Add SymptomBasedAgent.jsx logic
- [ ] Update AdminLayout.jsx to use useAuth hook
- [ ] Update Navbar.jsx and Sidebar.jsx to use useAuth hook

### Phase 4: Admin Panel
- [ ] Update AdminUsers.jsx to fetch real user data
- [ ] Update AdminDiseaseDB.jsx with real disease data
- [ ] Update AdminReports.jsx to generate real reports
- [ ] Update AdminActivityLog.jsx with real activity logs
- [ ] Add user filtering and search functionality

### Phase 5: ML Pipeline
- [ ] Create hybrid_realtime_detection.py
- [ ] Complete train_hybrid_classifier.py
- [ ] Add YOLO integration to predict.py
- [ ] Test real-time detection with camera

---

## DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] Update `.env` with production MongoDB URI
- [ ] Set strong `JWT_SECRET` (>32 characters)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS in production
- [ ] Configure CORS with specific domains
- [ ] Set up database backups
- [ ] Add rate limiting middleware
- [ ] Enable request logging
- [ ] Test all authentication flows
- [ ] Test all admin endpoints
- [ ] Load testing with expected user volume
- [ ] Security audit of all endpoints
- [ ] Environment variable validation

---

## PERFORMANCE OPTIMIZATIONS IMPLEMENTED

✅ Database indexes on frequently queried fields
✅ Pagination for large result sets (default 10-20 items)
✅ JWT token caching in localStorage
✅ Efficient error handling with stack unwinding
✅ CORS configuration to prevent unnecessary preflight requests

---

## SUMMARY

**Completion Status:** 45-50% of full project

**Completed:**
- ✅ Professional backend authentication system
- ✅ Enhanced database models with relationships
- ✅ Admin management and reporting system
- ✅ Frontend authentication context and state management
- ✅ Protected routes with role-based access
- ✅ Real API integration for login/registration
- ✅ Activity logging and auditing
- ✅ Comprehensive error handling

**Ready for:**
- User registration and login
- JWT token management
- Admin dashboard functionality
- User management
- Activity logging and reporting
- Disease detection results storage

**Remaining:**
- Image upload and detection integration
- Live camera detection
- Symptom-based diagnosis
- Complete ML pipeline integration
- Dashboard real-data fetching
- Report generation
- Frontend admin features

---

## ESTIMATED REMAINING TIME

- Phase 3 (Dashboard): 2-3 hours
- Phase 4 (Admin Panel): 1-2 hours
- Phase 5 (ML Pipeline): 1-2 hours
- Testing & Deployment: 2-3 hours

**Total Remaining:** 6-10 hours

---

**Project Status:** 🟡 IN PROGRESS - Major milestones reached, authentication system complete and production-ready
\n`\n\n\n### File: .\README.md\n\n`md\n\n`\n\n\n### File: .\SETUP_AND_FIXES.md\n\n`md\n# AgroSentry Project - Setup and Fixes Guide

## Issues Fixed

### 1. ✅ Admin Login/Signup Pages (FIXED)
**Problem:** Admin sign-in/signup pages were not accessible. Admin could only login via RoleSelect without entering credentials.

**Solution:**
- Added separate routes for admin login and signup:
  - `/admin-login` - Admin login page
  - `/admin-signup` - Admin signup page
- Updated RoleSelect component to show admin login/signup buttons instead of direct login
- Modified Login and Signup components to support both user and admin authentication with `isAdmin` prop

**New Flow:**
```
Landing → /role-select → Admin Role → /admin-login OR /admin-signup → /admin/dashboard
```

### 2. ✅ Admin Logout and Re-login (FIXED)
**Problem:** After logout, admins couldn't easily re-login. Routes were redirecting incorrectly.

**Solution:**
- Changed logout redirect from `/` to `/role-select` in both Sidebar and Navbar
- Updated route protection to redirect to `/role-select` instead of `/` for unauthenticated admin users
- Ensured logout clears admin state properly

**Flow:**
```
/admin/dashboard → Logout → /role-select → /admin-login → /admin/dashboard
```

### 3. ✅ User Dashboard Blank Page (FIXED)
**Problem:** User dashboard showed blank content with only mock data.

**Solution:**
- Created API utilities file (`src/utils/api.js`) for frontend-backend communication
- Added health check endpoint to backend server
- Created `.env` file in frontend for API configuration
- API ready to connect real MongoDB data to dashboard

**Next Steps to Complete:** Run backend and test API connection

### 4. ✅ MongoDB Connection (CONFIGURED)
**Status:** MongoDB configured in backend

**Current Configuration:**
```
Backend .env:
- PORT=5000
- MONGO_URI=mongodb://127.0.0.1:27017/AgroSentryDB
```

**Frontend Configuration Added:**
```
Frontend .env:
- VITE_API_URL=http://localhost:5000/api
```

**MongoDB Connection Check:** Once MongoDB service is running, the backend will auto-connect.

---

## Setup Instructions

### Step 1: Install MongoDB
```bash
# Windows - Download and install MongoDB Community Edition
# Link: https://www.mongodb.com/try/download/community

# Verify MongoDB is running (should show in Services as "MongoDB Server")
```

### Step 2: Install Backend Dependencies
```bash
cd "d:\New folder\AgroSentry_Project\backend"
npm install
```

### Step 3: Install Frontend Dependencies
```bash
cd "d:\New folder\AgroSentry_Project\frontend"
npm install
```

### Step 4: Start Backend Server
```bash
cd "d:\New folder\AgroSentry_Project\backend"
npm start
# Should see: "MongoDB Connected Successfully!" and "Server Running on Port 5000"
```

### Step 5: Start Frontend Development Server
```bash
cd "d:\New folder\AgroSentry_Project\frontend"
npm run dev
# Should see: Vite server running (typically on http://localhost:5173)
```

---

## Testing the Auth Flow

### Test User Login
1. Navigate to `http://localhost:5173/`
2. Click "Get Started"
3. Select "User" role
4. Click "Continue as User"
5. Use demo credentials:
   - Email: `demo@example.com`
   - Password: `password123`
6. Should redirect to `/dashboard`

### Test Admin Login (NEW)
1. Navigate to `http://localhost:5173/role-select`
2. Click "Admin Login" button (in Admin card)
3. Use demo credentials:
   - Email: `admin@plantai.com`
   - Password: `admin123`
4. Should redirect to `/admin/dashboard`

### Test Admin Signup (NEW)
1. Navigate to `http://localhost:5173/role-select`
2. Click "Admin Sign Up" button
3. Fill in form with any credentials
4. Should redirect to `/admin/dashboard`

### Test Logout and Re-login
1. While logged in, click "Logout" button
2. Should redirect to `/role-select`
3. Click the same role's login button
4. Login again to verify flow works

---

## API Connectivity

### Backend Health Check
```bash
curl http://localhost:5000/health
# Response: { "status": "OK", "message": "Server is running", "timestamp": "..." }
```

### Disease Detection Endpoint
```bash
# Upload image and get prediction
curl -X POST \
  -F "image=@/path/to/image.jpg" \
  http://localhost:5000/api/detection/predict
```

### Frontend API Usage
```javascript
import { detectionAPI } from './utils/api';

// Upload image for disease detection
const result = await detectionAPI.predictDisease(imageFile);
console.log(result); // { plant, disease, status, confidence }
```

---

## File Changes Made

### Frontend Files Modified
1. **src/routes/Routes.jsx** - Added `/admin-login` and `/admin-signup` routes
2. **src/pages/RoleSelect.jsx** - Updated to show login/signup buttons for admin
3. **src/pages/Login.jsx** - Added `isAdmin` prop support
4. **src/pages/Signup.jsx** - Added `isAdmin` prop support
5. **src/components/common/Sidebar.jsx** - Changed logout redirect to `/role-select`
6. **src/components/common/Navbar.jsx** - Changed logout redirect to `/role-select`
7. **src/utils/api.js** - NEW: API utilities for backend communication
8. **.env** - NEW: Frontend environment configuration

### Backend Files Modified
1. **server.js** - Added `/health` endpoint for connection verification

---

## Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution:**
1. Verify MongoDB service is running (Windows Services → MongoDB Server)
2. Check if MongoDB is listening on port 27017
3. Verify MONGO_URI in backend `.env` is correct
4. Try connecting with MongoDB Compass on `mongodb://127.0.0.1:27017`

### Issue: "Frontend can't reach backend"
**Solution:**
1. Verify backend is running on port 5000
2. Check VITE_API_URL in frontend `.env`
3. Verify CORS is enabled in backend (it is via `app.use(cors())`)
4. Check browser console for CORS errors
5. Try health check: `curl http://localhost:5000/health`

### Issue: "Dashboard still shows blank"
**Solution:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Verify backend is running and connected to MongoDB
4. Check Network tab to see if API calls are being made
5. Ensure `npm install` was run in both frontend and backend

### Issue: "Admin can't access dashboard after login"
**Solution:**
1. Check if routes are properly configured in Routes.jsx
2. Verify admin state is being set correctly in App.jsx
3. Check browser console for routing errors
4. Clear browser cache and refresh

---

## Database Schema

### Detection Model (MongoDB)
```javascript
{
  image: String,           // Image file path
  plant: String,           // Plant type (e.g., "Potato", "Pepper")
  disease: String,         // Disease name (e.g., "Early_blight")
  status: String,          // "Healthy" or "Diseased"
  confidence: Number,      // Confidence score (0-100)
  createdAt: Date          // Timestamp
}
```

---

## Next Steps

1. **Complete MongoDB Setup:**
   - Install and start MongoDB service
   - Verify connection with `npm start` in backend

2. **Test Full Auth Flow:**
   - Run both frontend and backend
   - Test user and admin login/logout cycles

3. **Integrate Dashboard with Real Data:**
   - Modify Dashboard.jsx to fetch data from API instead of mock data
   - Connect image upload to `/api/detection/predict` endpoint

4. **Add Error Handling:**
   - Add error toasts for failed API calls
   - Implement loading states for async operations

5. **Add User/Admin Database:**
   - Create User and Admin schemas in MongoDB
   - Add authentication endpoints (register, login, verify)
   - Implement JWT tokens for session management

---

## Quick Command Reference

```bash
# Start MongoDB (Windows)
# Through Services or: mongod

# Backend setup and start
cd backend
npm install
npm start

# Frontend setup and start
cd frontend
npm install
npm run dev

# Build frontend for production
npm run build

# Preview production build
npm run preview

# Test backend health
curl http://localhost:5000/health

# Check MongoDB connection
mongosh mongodb://127.0.0.1:27017
```

---

**Created:** 2026-05-24
**Last Updated:** 2026-05-24
\n`\n\n\n### File: .\backend\package.json\n\n`json\n{
  "name": "backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "@clerk/express": "^2.1.21",
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "express-validator": "^7.3.2",
    "jsonwebtoken": "^9.0.3",
    "mongoose": "^9.6.2",
    "multer": "^2.1.1",
    "python-shell": "^5.0.0"
  }
}
\n`\n\n\n### File: .\backend\seed.js\n\n`javascript\n/**
 * AgroSentry Database Seed Script
 * ---------------------------------
 * Seeds the demo admin and demo user accounts into MongoDB.
 * Run once with:  node backend/seed.js
 *
 * Demo Admin:  admin@plantai.com  /  admin123
 * Demo User:   user@example.com   /  password123
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Inline schemas (so we don't need to load the full app)
const AdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, lowercase: true },
  password: { type: String, select: false },
  role: { type: String, default: "admin" },
  isActive: { type: Boolean, default: true },
  department: { type: String, default: "Operations" },
  adminLevel: { type: Number, default: 1 },
  permissions: [String],
  lastLogin: Date,
  resetToken: { type: String, select: false },
  resetTokenExpiry: { type: Date, select: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, lowercase: true },
  password: { type: String, select: false },
  role: { type: String, default: "user" },
  isActive: { type: Boolean, default: true },
  scansCount: { type: Number, default: 0 },
  preferences: {
    notifications: { type: Boolean, default: true },
    theme: { type: String, default: "dark" },
    language: { type: String, default: "en" },
  },
  lastLogin: Date,
  resetToken: { type: String, select: false },
  resetTokenExpiry: { type: Date, select: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

async function seed() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/AgroSentryDB";
    console.log(`\n🌱 Connecting to MongoDB: ${uri}`);
    await mongoose.connect(uri);
    console.log("✓ MongoDB connected\n");

    // Use raw collections to avoid model conflicts
    const db = mongoose.connection.db;

    // ─────────────────────────────
    //  Seed Demo Admin
    // ─────────────────────────────
    const adminEmail = "admin@plantai.com";
    const adminCollection = db.collection("admins");
    const existingAdmin = await adminCollection.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`ℹ️  Demo admin already exists: ${adminEmail}`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);

      await adminCollection.insertOne({
        name: "Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        isActive: true,
        department: "Operations",
        adminLevel: 1,
        permissions: ["manage_users", "manage_diseases", "view_reports", "manage_system"],
        lastLogin: null,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✅ Demo admin created:`);
      console.log(`   Email:    ${adminEmail}`);
      console.log(`   Password: admin123`);
    }

    // ─────────────────────────────
    //  Seed Demo User
    // ─────────────────────────────
    const userEmail = "user@example.com";
    const userCollection = db.collection("users");
    const existingUser = await userCollection.findOne({ email: userEmail });

    if (existingUser) {
      console.log(`ℹ️  Demo user already exists: ${userEmail}`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("password123", salt);

      await userCollection.insertOne({
        name: "Demo User",
        email: userEmail,
        password: hashedPassword,
        role: "user",
        isActive: true,
        scansCount: 0,
        preferences: { notifications: true, theme: "dark", language: "en" },
        lastLogin: null,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`\n✅ Demo user created:`);
      console.log(`   Email:    ${userEmail}`);
      console.log(`   Password: password123`);
    }

    console.log("\n🎉 Seeding complete!\n");
  } catch (error) {
    console.error("\n❌ Seed error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("✓ MongoDB disconnected");
  }
}

seed();
\n`\n\n\n### File: .\backend\server.js\n\n`javascript\nrequire("dotenv").config();

if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !process.env.CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from any localhost port, or no origin (server-to-server)
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5175').split(',').map(o => o.trim());
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clerk Middleware for Session Authentication
const { clerkMiddleware } = require("@clerk/express");
app.use(clerkMiddleware());


// Static files
app.use("/uploads", express.static("uploads"));

// =========================
// ROUTES
// =========================

const authRoutes = require("./routes/authRoutes");
const detectionRoutes = require("./routes/detectionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const symptomRoutes = require("./routes/symptomRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/detection", detectionRoutes);
app.use("/api/detect", detectionRoutes); // Alias to support both route formats
app.use("/api/admin", adminRoutes);
app.use("/api/detect/symptom", symptomRoutes);
app.use("/api/detection/symptom", symptomRoutes);

// Analytics API Endpoint (Clerk Auth Protected)
const { getSystemStats } = require("./controllers/detectionController");
const { authenticate } = require("./middleware/auth");
app.get("/api/analytics", authenticate, getSystemStats);

// Health check endpoints
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// =========================
// MONGODB CONNECTION
// =========================

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✓ MongoDB Connected Successfully!");
  })
  .catch((err) => {
    console.error("✗ MongoDB Connection Error:", err.message);
  });

// =========================
// ERROR HANDLING
// =========================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Global error handler
app.use(errorHandler);

// =========================
// LOCAL STORAGE INIT
// =========================
const fs = require('fs');
const path = require('path');
const storageDirs = [
  '../../local_storage/upload_detection/images',
  '../../local_storage/realtime_detection/images',
  '../../local_storage/csv_reports',
  '../../local_storage/excel_reports',
  '../../local_storage/exported_images',
  '../../local_storage/logs'
];
storageDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✓ Server Running on Port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

\n`\n\n\n### File: .\backend\controllers\adminController.js\n\n`javascript\nconst jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Detection = require("../models/Detection");
const ActivityLog = require("../models/ActivityLog");

// ============================================================
// PUBLIC AUTH ROUTES (no authentication required)
// ============================================================

exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password");
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Contact support.",
      });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      await ActivityLog.create({
        userId: admin._id,
        action: "login",
        description: "Failed admin login attempt",
        status: "failed",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "7d" }
    );

    await ActivityLog.create({
      userId: admin._id,
      action: "login",
      description: "Admin logged in",
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: admin.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

exports.adminSignup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const admin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password,
      role: "admin",
    });

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "7d" }
    );

    await ActivityLog.create({
      userId: admin._id,
      action: "account_creation",
      description: "Admin account created",
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      token,
      user: admin.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

exports.adminForgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address",
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+resetToken +resetTokenExpiry");
    if (!admin) {
      // Return a generic message to avoid email enumeration
      return res.status(200).json({
        success: true,
        message: "If this email is registered, a reset token has been generated.",
      });
    }

    // Generate a secure 32-byte hex reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    admin.resetToken = resetToken;
    admin.resetTokenExpiry = resetTokenExpiry;
    await admin.save();

    await ActivityLog.create({
      userId: admin._id,
      action: "settings_change",
      description: "Password reset token generated",
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    // In production: send email. For demo, return token in response.
    res.status(200).json({
      success: true,
      message: "Password reset token generated successfully",
      // NOTE: In production, REMOVE the resetToken from the response and email it instead.
      resetToken,
      expiresAt: resetTokenExpiry,
      note: "Use this token to reset your password. Valid for 1 hour.",
    });
  } catch (error) {
    next(error);
  }
};

exports.adminResetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reset token and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const admin = await Admin.findOne({
      resetToken,
      resetTokenExpiry: { $gt: new Date() },
    }).select("+resetToken +resetTokenExpiry");

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    admin.password = newPassword;
    admin.resetToken = null;
    admin.resetTokenExpiry = null;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PROTECTED ADMIN MANAGEMENT ROUTES (authentication required)
// ============================================================

exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "", role = "" } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    if (role && role !== "all") {
      query.role = role;
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, isActive, preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(typeof isActive === "boolean" && { isActive }),
        ...(preferences && { preferences }),
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.isActive = false;
    await user.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "settings_change",
      description: `Admin deactivated user ${user.email}`,
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { targetUserId: id }
    });

    res.status(200).json({
      success: true,
      message: "User deactivated successfully"
    });
  } catch (error) {
    next(error);
  }
};

exports.getActivityLog = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, userId = "", action = "" } = req.query;

    let query = {};
    if (userId) {
      query.userId = userId;
    }
    if (action) {
      query.action = action;
    }

    const logs = await ActivityLog.find(query)
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getSystemStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalAdmins = await Admin.countDocuments();
    const totalDetections = await Detection.countDocuments();
    const healthyDetections = await Detection.countDocuments({ status: "Healthy" });
    const diseasedDetections = await Detection.countDocuments({ status: "Diseased" });

    const activeUsersToday = await ActivityLog.countDocuments({
      action: "login",
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    const topDiseases = await Detection.aggregate([
      {
        $group: {
          _id: "$disease",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const avgConfidence = await Detection.aggregate([
      {
        $group: {
          _id: null,
          avgConfidence: { $avg: "$confidence" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalDetections,
        healthyDetections,
        diseasedDetections,
        activeUsersToday,
        topDiseases,
        averageConfidence: avgConfidence[0]?.avgConfidence || 0,
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.generateReport = async (req, res, next) => {
  try {
    const { startDate, endDate, type = "all" } = req.body;

    let detectionQuery = {};
    if (startDate || endDate) {
      detectionQuery.createdAt = {};
      if (startDate) detectionQuery.createdAt.$gte = new Date(startDate);
      if (endDate) detectionQuery.createdAt.$lte = new Date(endDate);
    }

    const detections = await Detection.find(detectionQuery)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    const report = {
      generatedAt: new Date(),
      type,
      dateRange: { startDate, endDate },
      totalDetections: detections.length,
      healthyCount: detections.filter(d => d.status === "Healthy").length,
      diseasedCount: detections.filter(d => d.status === "Diseased").length,
      averageConfidence: detections.length > 0
        ? (detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length).toFixed(2)
        : 0,
      diseaseDistribution: {},
      plantDistribution: {},
      detections: detections.map(d => ({
        _id: d._id,
        user: d.userId?.name || "Anonymous",
        plant: d.plant,
        disease: d.disease,
        status: d.status,
        confidence: d.confidence,
        date: d.createdAt
      }))
    };

    // Count disease distribution
    detections.forEach(d => {
      report.diseaseDistribution[d.disease] = (report.diseaseDistribution[d.disease] || 0) + 1;
      report.plantDistribution[d.plant] = (report.plantDistribution[d.plant] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    next(error);
  }
};
\n`\n\n\n### File: .\backend\controllers\authController.js\n\n`javascript\nconst jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Admin = require("../models/Admin");
const ActivityLog = require("../models/ActivityLog");

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    let user;
    if (role === "admin") {
      user = await Admin.findOne({ email });
      if (user) {
        return res.status(400).json({ success: false, message: "Email already registered" });
      }
      user = await Admin.create({ name, email, password, role: "admin" });
    } else {
      user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ success: false, message: "Email already registered" });
      }
      user = await User.create({ name, email, password, role: "user" });
    }

    const token = generateToken(user._id, role);

    await ActivityLog.create({
      userId: user._id,
      action: "account_creation",
      description: `${role} account created`,
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, role = "user" } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    let user;
    if (role === "admin") {
      user = await Admin.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } else {
      user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      await ActivityLog.create({
        userId: user._id,
        action: "login",
        description: "Failed login attempt",
        status: "failed",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    await ActivityLog.create({
      userId: user._id,
      action: "login",
      description: `${user.role} logged in`,
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await ActivityLog.create({
      userId,
      action: "logout",
      description: "User logged out",
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      const admin = await Admin.findById(req.user.id);
      if (!admin) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      return res.status(200).json({ success: true, user: admin.toJSON() });
    }
    res.status(200).json({ success: true, user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      const admin = await Admin.findById(req.user.id);
      if (!admin) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      const token = generateToken(admin._id, admin.role);
      return res.status(200).json({ success: true, token });
    }

    const token = generateToken(user._id, user.role);
    res.status(200).json({ success: true, token });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+resetToken +resetTokenExpiry");
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If this email is registered, a reset token has been generated.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset token generated successfully",
      resetToken,
      expiresAt: resetTokenExpiry,
      note: "Use this token to reset your password. Valid for 1 hour.",
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reset token and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findOne({
      resetToken,
      resetTokenExpiry: { $gt: new Date() },
    }).select("+resetToken +resetTokenExpiry");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

const clerkSync = async (req, res, next) => {
  try {
    const { clerkId, email, name, role = "user" } = req.body;

    if (!clerkId || !email) {
      return res.status(400).json({
        success: false,
        message: "Clerk ID and email are required"
      });
    }

    const { clerkClient } = require("@clerk/express");

    // Securely update Clerk publicMetadata.role if not set yet, or if it doesn't match
    try {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      if (clerkUser.publicMetadata?.role !== role) {
        await clerkClient.users.updateUserMetadata(clerkId, {
          publicMetadata: { role }
        });
      }
    } catch (clerkErr) {
      console.error("Clerk metadata sync warning:", clerkErr.message);
    }

    let user;
    if (role === "admin") {
      // Find existing by email, clerkId, or create
      user = await Admin.findOne({ email: email.toLowerCase() });
      if (!user) {
        user = await Admin.findOne({ clerkId });
      }

      if (!user) {
        user = await Admin.create({
          clerkId,
          name: name || email.split("@")[0],
          email: email.toLowerCase(),
          role: "admin",
          department: "Operations",
          adminLevel: 1
        });
      } else {
        user.clerkId = clerkId;
        user.name = name || user.name;
        user.role = "admin";
        await user.save();
      }
    } else {
      user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        user = await User.findOne({ clerkId });
      }

      if (!user) {
        user = await User.create({
          clerkId,
          name: name || email.split("@")[0],
          email: email.toLowerCase(),
          role: "user",
          isActive: true
        });
      } else {
        user.clerkId = clerkId;
        user.name = name || user.name;
        await user.save();
      }
    }

    // Set lastLogin time
    user.lastLogin = new Date();
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: "login",
      description: `${role} authenticated via Clerk & synced with database`,
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(200).json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  refreshToken,
  forgotPassword,
  resetPassword,
  clerkSync,
};
\n`\n\n\n### File: .\backend\controllers\detectionController.js\n\n`javascript\nconst path = require("path");
const { PythonShell } = require("python-shell");
const Detection = require("../models/Detection");
const ActivityLog = require("../models/ActivityLog");
const RealtimePrediction = require("../models/RealtimePrediction");
const UploadPrediction = require("../models/UploadPrediction");

exports.detectDisease = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded"
      });
    }

    const imagePath = req.file.path;
    const userId = req.user?.id;

    // Cache upload in local_storage folder to synchronize file systems
    try {
      const fs = require("fs");
      const fsp = fs.promises;
      const isRealtime = req.path.includes("realtime");
      const targetSubdir = isRealtime ? "realtime_detection" : "upload_detection";
      const targetDir = path.join(__dirname, `../../local_storage/detections/${targetSubdir}/images`);
      await fsp.mkdir(targetDir, { recursive: true });
      await fsp.copyFile(imagePath, path.join(targetDir, path.basename(imagePath)));
    } catch (fsErr) {
      console.error("Local storage caching warning:", fsErr.message);
    }

    fetch('http://localhost:5001/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_path: imagePath })
    })
    .then(res => res.json())
    .then(async (output) => {
      try {
        if (output.error) {
          throw new Error(output.error);
        }

        const savedDetection = await Detection.create({
          userId: userId,
          image: imagePath,
          plant: output.plant,
          disease: output.disease,
          status: output.status,
          confidence: output.confidence,
          accuracy: output.confidence,
          processedAt: new Date(),
        });

        if (userId) {
          await ActivityLog.create({
            userId,
            action: "detection",
            description: `Plant disease detection: ${output.plant} - ${output.disease}`,
            status: "success",
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
            metadata: {
              confidence: output.confidence,
              detectionId: savedDetection._id,
            },
          });
        }

        const isRealtime = req.path.includes("realtime");
        
        let subPrediction;
        if (isRealtime) {
          subPrediction = await RealtimePrediction.create({
            userId: userId || null,
            plantName: output.plant,
            diseaseName: output.disease,
            confidence: output.confidence,
            status: output.status,
            detectionType: "realtime",
            imagePath: imagePath,
            timestamp: new Date()
          });
        } else {
          subPrediction = await UploadPrediction.create({
            userId: userId || null,
            plantName: output.plant,
            diseaseName: output.disease,
            confidence: output.confidence,
            status: output.status,
            detectionType: "upload",
            imagePath: imagePath,
            timestamp: new Date()
          });
        }

        // Trigger python export tool asynchronously
        try {
          const fs = require('fs');
          const venvPython = path.join(__dirname, "../../.venv/Scripts/python.exe");
          const { PythonShell } = require("python-shell");
          
          let exportOptions = {
            mode: "text",
            args: [isRealtime ? "realtime" : "upload"]
          };
          
          if (fs.existsSync(venvPython)) {
            exportOptions.pythonPath = venvPython;
          } else {
            // Fallback to system python/python3 based on OS or PATH
            exportOptions.pythonPath = process.platform === "win32" ? "python" : "python3";
          }
          
          PythonShell.run(
            path.join(__dirname, "../python/export_history.py"),
            exportOptions
          ).catch((e) => console.error("Export script error:", e.message));
        } catch (exportErr) {
          console.error("Export triggering warning:", exportErr.message);
        }

        res.json({
          success: true,
          detection: savedDetection,
          subPrediction
        });
      } catch (parseError) {
        res.status(500).json({
          success: false,
          message: "Error parsing prediction results: " + parseError.message
        });
      }
    }).catch((error) => {
      console.error("Flask API error:", error);
      res.status(500).json({
        success: false,
        message: "Error in disease detection process"
      });
    });

  } catch (error) {
    next(error);
  }
};

exports.getDetections = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    let query = {};
    if (userId) {
      query.userId = userId;
    }

    const detections = await Detection.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Detection.countDocuments(query);

    res.status(200).json({
      success: true,
      detections,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDetectionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    let query = { _id: id };
    if (userId) {
      query.userId = userId;
    }

    const detection = await Detection.findOne(query);

    if (!detection) {
      return res.status(404).json({
        success: false,
        message: "Detection not found"
      });
    }

    res.status(200).json({
      success: true,
      detection
    });
  } catch (error) {
    next(error);
  }
};

exports.getSystemStats = async (req, res, next) => {
  try {
    const totalDetections = await Detection.countDocuments();
    const healthyCount = await Detection.countDocuments({ status: "Healthy" });
    const diseasedCount = await Detection.countDocuments({ status: "Diseased" });

    const recentDetections = await Detection.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const avgConfidence = await Detection.aggregate([
      {
        $group: {
          _id: null,
          avgConfidence: { $avg: "$confidence" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalDetections,
        healthyCount,
        diseasedCount,
        averageConfidence: avgConfidence[0]?.avgConfidence || 0,
        recentDetections
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRealtimeHistory = async (req, res, next) => {
  try {
    const records = await RealtimePrediction.find().sort({ timestamp: -1 });
    res.status(200).json({ success: true, history: records });
  } catch (error) {
    next(error);
  }
};

exports.getUploadHistory = async (req, res, next) => {
  try {
    const records = await UploadPrediction.find().sort({ timestamp: -1 });
    res.status(200).json({ success: true, history: records });
  } catch (error) {
    next(error);
  }
};

exports.downloadFile = (type, format) => {
  return (req, res, next) => {
    try {
      const subdir = type === "realtime" ? "realtime_detection" : "upload_detection";
      const filename = `history.${format}`;
      const filePath = path.join(__dirname, `../../local_storage/detections/${subdir}/${filename}`);
      
      const fs = require("fs");
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: `Report file not found. Perform a scan first.` });
      }
      
      res.download(filePath, filename);
    } catch (error) {
      next(error);
    }
  };
};
\n`\n\n\n### File: .\backend\controllers\symptomController.js\n\n`javascript\nconst SymptomHistory = require("../models/SymptomHistory");
const ActivityLog = require("../models/ActivityLog");

exports.diagnoseSymptoms = async (req, res, next) => {
  try {
    const { symptoms, additionalNotes = "" } = req.body;
    const userId = req.user?.id;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one symptom"
      });
    }

    // Matching Engine
    let diseaseName = "Healthy / No Severe Disease Detected";
    let confidence = 70;
    let recommendation = "Ensure regular watering, adequate sunlight, and nutrient-rich soil. Monitor leaves daily.";

    const symptomsLower = symptoms.map(s => s.toLowerCase());

    if (symptomsLower.includes("white powder")) {
      diseaseName = "Tomato / Pepper Powdery Mildew";
      confidence = 88;
      recommendation = "Apply organic fungicides such as neem oil, potassium bicarbonate spray, or dilute milk spray. Prune lower branches to improve air circulation.";
    } else if (symptomsLower.includes("leaf curling") && symptomsLower.includes("yellow leaves")) {
      diseaseName = "Tomato Yellow Leaf Curl Virus";
      confidence = 92;
      recommendation = "Manage whitefly infestations using yellow sticky cards and insecticidal soaps or neem oil. Remove severely infected crops immediately to prevent vector spread.";
    } else if (symptomsLower.includes("stem rot") || (symptomsLower.includes("wilting") && symptomsLower.includes("brown spots"))) {
      diseaseName = "Potato / Tomato Late Blight";
      confidence = 85;
      recommendation = "Apply preventative copper-based fungicides. Remove infected plant matter immediately and destroy it. Avoid overhead watering to reduce foliage humidity.";
    } else if (symptomsLower.includes("brown spots") && symptomsLower.includes("yellow leaves")) {
      diseaseName = "Tomato / Potato Early Blight";
      confidence = 90;
      recommendation = "Apply organic copper spray. Remove infected lower leaves to restrict splash-back contamination. Rotate crops next season.";
    } else if (symptomsLower.includes("holes in leaves")) {
      diseaseName = "Tomato Spider Mites / Insect Damage";
      confidence = 78;
      recommendation = "Introduce predatory insects like ladybugs, spray leaves with cold water pressure to dislodge pests, or apply horticultural oils.";
    } else if (symptomsLower.includes("stunted growth")) {
      diseaseName = "Tomato Mosaic Virus / Nutrient Deficiency";
      confidence = 82;
      recommendation = "Examine soil nutrients. If Mosaic Virus is suspected, remove plant to halt viral expansion. Sanitise garden equipment regularly.";
    } else if (symptomsLower.includes("leaf curling")) {
      diseaseName = "Leaf Curl Virus / Physiological Leaf Roll";
      confidence = 75;
      recommendation = "Observe soil moisture. Maintain consistent watering patterns and protect the crops from extreme wind or sun exposure.";
    } else if (symptomsLower.includes("yellow leaves") || symptomsLower.includes("wilting")) {
      diseaseName = "Nutrient Deficiency / Under-watering";
      confidence = 70;
      recommendation = "Check soil dampness. Introduce balanced organic nitrogen-rich fertilizer to restore leaf health.";
    }

    // Save to database
    const savedSymptom = await SymptomHistory.create({
      userId,
      symptoms,
      additionalNotes,
      diseaseName,
      confidence,
      recommendation,
      createdAt: new Date()
    });

    if (userId) {
      await ActivityLog.create({
        userId,
        action: "symptom_diagnosis",
        description: `Symptom-based diagnosis: ${diseaseName}`,
        status: "success",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        metadata: {
          confidence,
          symptomHistoryId: savedSymptom._id
        }
      });
    }

    res.status(200).json({
      success: true,
      diagnosis: savedSymptom
    });

  } catch (error) {
    next(error);
  }
};

exports.getSymptomHistory = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    let query = {};
    if (userId) {
      query.userId = userId;
    }

    const history = await SymptomHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SymptomHistory.countDocuments(query);

    res.status(200).json({
      success: true,
      history,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      }
    });
  } catch (error) {
    next(error);
  }
};
\n`\n\n\n### File: .\backend\flask_api\app.py\n\n`py\nimport os
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms, models
from torchvision.models import EfficientNet_B0_Weights
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

# =========================
# DEVICE & GLOBALS
# =========================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
yolo_model = None
general_model = None
specialist_model = None
class_names = []
specialist_classes = []
transform = None

# =========================
# INITIALIZATION
# =========================
def init_models():
    global yolo_model, general_model, specialist_model, class_names, specialist_classes, transform
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    MODELS_DIR = os.path.join(BASE_DIR, "models")

    GENERAL_MODEL_PATH = os.path.join(MODELS_DIR, "best_augmented_full_model.pth")
    SPECIALIST_MODEL_PATH = os.path.join(MODELS_DIR, "best_specialist_model.pth")
    YOLO_MODEL_PATH = os.path.join(MODELS_DIR, "best.pt")
    LABELS_PATH = os.path.join(MODELS_DIR, "labels.txt")
    SPECIALIST_LABELS_PATH = os.path.join(MODELS_DIR, "pepper_potato_labels.txt")

    # Load Labels
    if not os.path.exists(LABELS_PATH):
        class_names = [
            "Pepper__bell___Bacterial_spot", "Pepper__bell___healthy",
            "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
            "Tomato_Bacterial_spot", "Tomato_Early_blight", "Tomato_Late_blight",
            "Tomato_Leaf_Mold", "Tomato_Septoria_leaf_spot", "Tomato_Spider_mites_Two_spotted_spider_mite",
            "Tomato__Target_Spot", "Tomato__Tomato_YellowLeaf__Curl_Virus", "Tomato__Tomato_mosaic_virus", "Tomato_healthy"
        ]
    else:
        with open(LABELS_PATH, "r") as f:
            class_names = [line.strip() for line in f.readlines()]

    if os.path.exists(SPECIALIST_LABELS_PATH):
        with open(SPECIALIST_LABELS_PATH, "r") as f:
            specialist_classes = [line.strip() for line in f.readlines()]
    else:
        specialist_classes = class_names

    # Load YOLO
    try:
        yolo_model = YOLO(YOLO_MODEL_PATH)
    except Exception as e:
        print("Warning: Failed to load YOLO model", e)
        yolo_model = None

    # Load General Model
    try:
        general_model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT)
        general_model.classifier = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(general_model.classifier[1].in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, len(class_names))
        )
        if os.path.exists(GENERAL_MODEL_PATH):
            general_model.load_state_dict(torch.load(GENERAL_MODEL_PATH, map_location=device))
        general_model = general_model.to(device)
        general_model.eval()
    except Exception as e:
        print("Warning: Failed to load general model", e)

    # Load Specialist Model
    try:
        specialist_model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT)
        specialist_model.classifier = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(specialist_model.classifier[1].in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, len(specialist_classes))
        )
        if os.path.exists(SPECIALIST_MODEL_PATH):
            specialist_model.load_state_dict(torch.load(SPECIALIST_MODEL_PATH, map_location=device))
        specialist_model = specialist_model.to(device)
        specialist_model.eval()
    except Exception as e:
        print("Warning: Failed to load specialist model", e)

    # Transform
    USE_IMAGENET_NORMALIZATION = False
    transform_list = [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
    ]
    if USE_IMAGENET_NORMALIZATION:
        transform_list.append(
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        )
    transform = transforms.Compose(transform_list)

# Initialize on startup
init_models()

def predict_image(image_path_or_bytes):
    try:
        if isinstance(image_path_or_bytes, str):
            original_image = Image.open(image_path_or_bytes).convert("RGB")
            # YOLO needs file path or PIL image, ultralytics supports PIL images natively
            yolo_input = original_image
        else:
            original_image = Image.open(io.BytesIO(image_path_or_bytes)).convert("RGB")
            yolo_input = original_image
    except Exception as e:
        return {"error": f"Failed to open image: {str(e)}"}

    roi_image = original_image
    plant_detected = False

    if yolo_model is not None:
        try:
            yolo_results = yolo_model(yolo_input, conf=0.5, verbose=False)
            if len(yolo_results) > 0 and len(yolo_results[0].boxes) > 0:
                boxes = yolo_results[0].boxes
                best_box = max(boxes, key=lambda b: float(b.conf[0]))
                
                x1, y1, x2, y2 = map(int, best_box.xyxy[0].tolist())
                width, height = original_image.size
                
                padding = 20
                x1 = max(0, x1 - padding)
                y1 = max(0, y1 - padding)
                x2 = min(width, x2 + padding)
                y2 = min(height, y2 + padding)
                
                if x2 > x1 and y2 > y1:
                    roi_image = original_image.crop((x1, y1, x2, y2))
                    plant_detected = True
        except Exception as e:
            pass

    if yolo_model is not None and not plant_detected:
        return {
            "plant": "None",
            "disease": "No Plant Detected",
            "status": "Rejected",
            "confidence": 0.0
        }

    image_tensor = transform(roi_image).unsqueeze(0).to(device)

    with torch.no_grad():
        general_output = general_model(image_tensor)
        general_probs = torch.nn.functional.softmax(general_output[0], dim=0)
        general_confidence_tensor, general_predicted = torch.max(general_probs, 0)
        general_class = class_names[general_predicted.item()]
        general_confidence = general_confidence_tensor.item() * 100

        specialist_output = specialist_model(image_tensor)
        specialist_probs = torch.nn.functional.softmax(specialist_output[0], dim=0)
        specialist_confidence_tensor, specialist_predicted = torch.max(specialist_probs, 0)
        specialist_class = specialist_classes[specialist_predicted.item()]
        specialist_confidence = specialist_confidence_tensor.item() * 100

    final_class = general_class
    final_confidence = general_confidence

    if specialist_confidence > 80:
        final_class = specialist_class
        final_confidence = specialist_confidence

    if final_confidence < 70:
        return {
            "plant": "Unknown",
            "disease": "Unknown",
            "status": "Unknown",
            "confidence": round(final_confidence, 2)
        }
    else:
        parts = final_class.split("___") if "___" in final_class else final_class.split("_")
        plant = parts[0]
        disease = final_class.replace("___", " - ").replace("__", " ").replace("_", " ")
        status = "Healthy" if "healthy" in final_class.lower() else "Diseased"

        return {
            "plant": plant,
            "disease": disease,
            "status": status,
            "confidence": round(final_confidence, 2)
        }

@app.route("/predict", methods=["POST"])
def predict_endpoint():
    """Endpoint for upload detection. Expects an image file."""
    if 'image' not in request.files:
        # Also support passing a path if running locally
        req_data = request.get_json(silent=True)
        if req_data and 'image_path' in req_data:
            result = predict_image(req_data['image_path'])
            return jsonify(result)
        return jsonify({"error": "No image part in the request"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    image_bytes = file.read()
    result = predict_image(image_bytes)
    return jsonify(result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
\n`\n\n\n### File: .\backend\middleware\auth.js\n\n`javascript\nconst jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

/**
 * Dual-mode authentication middleware.
 * Accepts:
 *   1. Standard JWT tokens (from /api/auth/login and /api/admin/login)
 *   2. Clerk session tokens (when Clerk is configured)
 * This allows the app to work fully without Clerk keys.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    // --- Try JWT first (standard auth) ---
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // JWT has { id, role } payload
      let user = null;
      if (decoded.role === "admin") {
        user = await Admin.findById(decoded.id);
      } else {
        user = await User.findById(decoded.id);
      }

      if (user) {
        req.user = {
          id: user._id,
          clerkId: user.clerkId || null,
          role: decoded.role || user.role,
          email: user.email,
          name: user.name
        };
        return next();
      }
    } catch (jwtErr) {
      // JWT verify failed — try Clerk below
    }

    // --- Try Clerk session token (if Clerk keys are configured) ---
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (clerkSecretKey && !clerkSecretKey.includes("PASTE_YOUR")) {
      try {
        const { getAuth } = require("@clerk/express");
        const auth = getAuth(req);

        if (auth && auth.userId) {
          let user = await User.findOne({ clerkId: auth.userId });
          let role = "user";

          if (!user) {
            user = await Admin.findOne({ clerkId: auth.userId });
            role = "admin";
          }

          if (user) {
            req.user = {
              id: user._id,
              clerkId: auth.userId,
              role: user.role || role,
              email: user.email,
              name: user.name
            };
            return next();
          }
        }
      } catch (clerkErr) {
        // Clerk validation failed
      }
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });

  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Authentication error"
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource"
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
\n`\n\n\n### File: .\backend\middleware\errorHandler.js\n\n`javascript\nconst errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Mongoose ValidationError
  if (err.name === "ValidationError") {
    const message = `Invalid input data. ${Object.values(err.errors)
      .map((val) => val.message)
      .join(", ")}`;
    err = { statusCode: 400, message };
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    err = { statusCode: 400, message };
  }

  // JWT Error
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    err = { statusCode: 401, message };
  }

  // JWT Expire Error
  if (err.name === "TokenExpiredError") {
    const message = "Token has expired";
    err = { statusCode: 401, message };
  }

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
\n`\n\n\n### File: .\backend\middleware\validate.js\n\n`javascript\nconst { validationResult, body, param } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Invalid role"),
];

const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

const validateImageUpload = [
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    const allowedMimes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Only JPG and PNG images are allowed",
      });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: "Image size must be less than 5MB",
      });
    }

    next();
  },
];

module.exports = {
  validate,
  validateRegister,
  validateLogin,
  validateImageUpload,
};
\n`\n\n\n### File: .\backend\python\export_history.py\n\n`py\nimport sys
import os
from datetime import datetime
import pandas as pd
from pymongo import MongoClient

# MongoClient setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/AgroSentryDB")
client = MongoClient(MONGO_URI)
db = client["AgroSentryDB"]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def export_type(dtype):
    collection_name = "realtimepredictions" if dtype == "realtime" else "uploadpredictions"
    subdir = "realtime_detection" if dtype == "realtime" else "upload_detection"
    target_dir = os.path.join(BASE_DIR, "local_storage", "detections", subdir)
    
    os.makedirs(target_dir, exist_ok=True)
    os.makedirs(os.path.join(target_dir, "images"), exist_ok=True)
    
    collection = db[collection_name]
    records = list(collection.find().sort("timestamp", -1))
    
    data = []
    for r in records:
        ts = r.get("timestamp")
        ts_str = ts.strftime("%Y-%m-%d %H:%M:%S") if ts else ""
        
        # Build dataset rows
        row = {
            "Timestamp": ts_str,
            "Plant Name": r.get("plantName", ""),
            "Disease Name": r.get("diseaseName", ""),
            "Confidence": f"{r.get('confidence', 0.0):.2f}%",
            "Healthy/Diseased": r.get("status", ""),
            "Image Path": r.get("imagePath", "")
        }
        if dtype == "upload":
            img_path = r.get("imagePath", "")
            file_name = os.path.basename(img_path) if img_path else ""
            row = {
                "Timestamp": ts_str,
                "Uploaded File Name": file_name,
                "Plant Name": r.get("plantName", ""),
                "Disease Name": r.get("diseaseName", ""),
                "Confidence": f"{r.get('confidence', 0.0):.2f}%",
                "Healthy/Diseased": r.get("status", ""),
                "Image Path": img_path
            }
        data.append(row)
        
    df = pd.DataFrame(data)
    
    # If no data, write empty dataframes with correct columns to avoid Pandas exceptions
    if df.empty:
        columns = ["Timestamp", "Plant Name", "Disease Name", "Confidence", "Healthy/Diseased", "Image Path"]
        if dtype == "upload":
            columns = ["Timestamp", "Uploaded File Name", "Plant Name", "Disease Name", "Confidence", "Healthy/Diseased", "Image Path"]
        df = pd.DataFrame(columns=columns)
    
    csv_dir = os.path.join(BASE_DIR, "local_storage", "csv_reports")
    excel_dir = os.path.join(BASE_DIR, "local_storage", "excel_reports")
    os.makedirs(csv_dir, exist_ok=True)
    os.makedirs(excel_dir, exist_ok=True)
    
    csv_path = os.path.join(csv_dir, f"{dtype}_history.csv")
    xlsx_path = os.path.join(excel_dir, f"{dtype}_history.xlsx")
    
    # Save CSV
    df.to_csv(csv_path, index=False)
    
    # Save Excel
    df.to_excel(xlsx_path, index=False)
    print(f"Exported {dtype} successful")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        export_type("realtime")
        export_type("upload")
    else:
        export_type(sys.argv[1])
\n`\n\n\n### File: .\backend\python\predict.py\n\n`py\nimport sys
import json
import os
import warnings

# Suppress warnings to prevent log output from polluting stdout
warnings.filterwarnings("ignore")

import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms, models
from torchvision.models import EfficientNet_B0_Weights
from ultralytics import YOLO

# =========================
# DEVICE
# =========================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# =========================
# PATHS
# =========================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "models")

GENERAL_MODEL_PATH = os.path.join(MODELS_DIR, "best_augmented_full_model.pth")
SPECIALIST_MODEL_PATH = os.path.join(MODELS_DIR, "best_specialist_model.pth")
YOLO_MODEL_PATH = os.path.join(MODELS_DIR, "best.pt")
LABELS_PATH = os.path.join(MODELS_DIR, "labels.txt")
SPECIALIST_LABELS_PATH = os.path.join(MODELS_DIR, "pepper_potato_labels.txt")

# =========================
# LOAD LABELS
# =========================
if not os.path.exists(LABELS_PATH):
    class_names = [
        "Pepper__bell___Bacterial_spot", "Pepper__bell___healthy",
        "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
        "Tomato_Bacterial_spot", "Tomato_Early_blight", "Tomato_Late_blight",
        "Tomato_Leaf_Mold", "Tomato_Septoria_leaf_spot", "Tomato_Spider_mites_Two_spotted_spider_mite",
        "Tomato__Target_Spot", "Tomato__Tomato_YellowLeaf__Curl_Virus", "Tomato__Tomato_mosaic_virus", "Tomato_healthy"
    ]
else:
    with open(LABELS_PATH, "r") as f:
        class_names = [line.strip() for line in f.readlines()]

# Load specialist classes dynamically to avoid size mismatch
if os.path.exists(SPECIALIST_LABELS_PATH):
    with open(SPECIALIST_LABELS_PATH, "r") as f:
        specialist_classes = [line.strip() for line in f.readlines()]
else:
    specialist_classes = class_names

# =========================
# LOAD YOLOv8 MODEL
# =========================
try:
    yolo_model = YOLO(YOLO_MODEL_PATH)
except Exception as e:
    yolo_model = None

# =========================
# LOAD GENERAL MODEL
# =========================
general_model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT)
general_model.classifier = nn.Sequential(
    nn.Dropout(0.5),
    nn.Linear(general_model.classifier[1].in_features, 512),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(512, len(class_names))
)
general_model.load_state_dict(torch.load(GENERAL_MODEL_PATH, map_location=device))
general_model = general_model.to(device)
general_model.eval()

# =========================
# LOAD SPECIALIST MODEL
# =========================
specialist_model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT)
specialist_model.classifier = nn.Sequential(
    nn.Dropout(0.5),
    nn.Linear(specialist_model.classifier[1].in_features, 512),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(512, len(specialist_classes))
)
specialist_model.load_state_dict(torch.load(SPECIALIST_MODEL_PATH, map_location=device))
specialist_model = specialist_model.to(device)
specialist_model.eval()

# =========================
# TRANSFORM
# =========================
# The existing trained models were trained without ImageNet normalization.
# Omit normalization for 100% correct predictions. Toggle this to True if you retrain the models.
USE_IMAGENET_NORMALIZATION = False

transform_list = [
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
]
if USE_IMAGENET_NORMALIZATION:
    transform_list.append(
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    )
transform = transforms.Compose(transform_list)

# =========================
# IMAGE INPUT & YOLO DETECTION
# =========================
if len(sys.argv) < 2:
    print(json.dumps({"error": "No image path provided"}))
    sys.exit(1)

image_path = sys.argv[1]

try:
    original_image = Image.open(image_path).convert("RGB")
except Exception as e:
    print(json.dumps({"error": f"Failed to open image: {str(e)}"}))
    sys.exit(1)

# Run YOLO ROI extraction
roi_image = original_image
plant_detected = False

if yolo_model is not None:
    try:
        # Run YOLO with conf threshold
        yolo_results = yolo_model(image_path, conf=0.5, verbose=False)
        if len(yolo_results) > 0 and len(yolo_results[0].boxes) > 0:
            # Find the box with the highest confidence or largest area
            boxes = yolo_results[0].boxes
            best_box = max(boxes, key=lambda b: float(b.conf[0]))
            
            # Crop the image to this ROI
            x1, y1, x2, y2 = map(int, best_box.xyxy[0].tolist())
            width, height = original_image.size
            
            # Add padding
            padding = 20
            x1 = max(0, x1 - padding)
            y1 = max(0, y1 - padding)
            x2 = min(width, x2 + padding)
            y2 = min(height, y2 + padding)
            
            if x2 > x1 and y2 > y1:
                roi_image = original_image.crop((x1, y1, x2, y2))
                plant_detected = True
    except Exception as e:
        # Fall back to raw image if YOLO errors
        pass

# Non-plant rejection logic
if yolo_model is not None and not plant_detected:
    result = {
        "plant": "None",
        "disease": "No Plant Detected",
        "status": "Rejected",
        "confidence": 0.0
    }
    print(json.dumps(result))
    sys.exit(0)

# Preprocess cropped/raw image
image = transform(roi_image)
image = image.unsqueeze(0).to(device)

# =========================
# INFERENCE & ENSEMBLE
# =========================
with torch.no_grad():
    # General model prediction
    general_output = general_model(image)
    general_probs = torch.nn.functional.softmax(general_output[0], dim=0)
    general_confidence, general_predicted = torch.max(general_probs, 0)
    general_class = class_names[general_predicted.item()]
    general_confidence = general_confidence.item() * 100

    # Specialist model prediction
    specialist_output = specialist_model(image)
    specialist_probs = torch.nn.functional.softmax(specialist_output[0], dim=0)
    specialist_confidence_tensor, specialist_predicted = torch.max(specialist_probs, 0)
    specialist_class = specialist_classes[specialist_predicted.item()]
    specialist_confidence = specialist_confidence_tensor.item() * 100

# Ensemble selection logic
final_class = general_class
final_confidence = general_confidence

if specialist_confidence > 80:
    final_class = specialist_class
    final_confidence = specialist_confidence

# =========================
# CONFIDENCE THRESHOLD & OUTPUT
# =========================
if final_confidence < 70:
    result = {
        "plant": "Unknown",
        "disease": "Unknown",
        "status": "Unknown",
        "confidence": round(final_confidence, 2)
    }
else:
    # Split class name
    parts = final_class.split("___") if "___" in final_class else final_class.split("_")
    plant = parts[0]
    # Reconstruct disease nicely (removing double underscores/extra formatting)
    disease = final_class.replace("___", " - ").replace("__", " ").replace("_", " ")
    
    status = "Healthy"
    if "healthy" not in final_class.lower():
        status = "Diseased"

    result = {
        "plant": plant,
        "disease": disease,
        "status": status,
        "confidence": round(final_confidence, 2)
    }

print(json.dumps(result))
sys.exit(0)\n`\n\n\n### File: .\backend\routes\adminRoutes.js\n\n`javascript\nconst express = require("express");
const router = express.Router();
const {
  adminLogin,
  adminSignup,
  adminForgotPassword,
  adminResetPassword,
  getAllUsers,
  updateUser,
  deleteUser,
  getActivityLog,
  getSystemStats,
  generateReport,
} = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/auth");

// ============================================================
// PUBLIC ROUTES — No authentication required
// ============================================================
router.post("/login", adminLogin);
router.post("/signup", adminSignup);
router.post("/forgot-password", adminForgotPassword);
router.post("/reset-password", adminResetPassword);

// ============================================================
// PROTECTED ROUTES — Require authentication + admin role
// ============================================================
router.use(authenticate, authorize("admin"));

// User management
router.get("/users", getAllUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// System stats
router.get("/stats", getSystemStats);

// Activity logs
router.get("/activity-log", getActivityLog);

// Reports
router.post("/reports", generateReport);

module.exports = router;
\n`\n\n\n### File: .\backend\routes\authRoutes.js\n\n`javascript\nconst express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getProfile,
  refreshToken,
  forgotPassword,
  resetPassword,
  clerkSync,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { validate, validateRegister, validateLogin } = require("../middleware/validate");

// Public routes
router.post("/register", validateRegister, validate, register);
router.post("/login", validateLogin, validate, login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/clerk-sync", clerkSync);

// Protected routes
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, getProfile);
router.post("/refresh", authenticate, refreshToken);

module.exports = router;
\n`\n\n\n### File: .\backend\routes\detectionRoutes.js\n\n`javascript\nconst express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  detectDisease,
  getDetections,
  getDetectionById,
  getSystemStats,
  getRealtimeHistory,
  getUploadHistory,
  downloadFile
} = require("../controllers/detectionController");
const { authenticate } = require("../middleware/auth");
const { validateImageUpload } = require("../middleware/validate");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG and PNG images are allowed"));
    }
  }
});

// Protected prediction endpoints (Clerk auth required)
router.post("/predict", authenticate, upload.single("image"), validateImageUpload, detectDisease);
router.post("/upload", authenticate, upload.single("image"), validateImageUpload, detectDisease);
router.post("/realtime", authenticate, upload.single("image"), validateImageUpload, detectDisease);

// Protected endpoints
router.get("/", authenticate, getDetections);
router.get("/history", authenticate, getDetections);
router.get("/realtime/history", authenticate, getRealtimeHistory);
router.get("/upload/history", authenticate, getUploadHistory);

// Download endpoints
router.get("/download/realtime/csv", authenticate, downloadFile("realtime", "csv"));
router.get("/download/realtime/excel", authenticate, downloadFile("realtime", "xlsx"));
router.get("/download/upload/csv", authenticate, downloadFile("upload", "csv"));
router.get("/download/upload/excel", authenticate, downloadFile("upload", "xlsx"));

router.get("/stats/system", authenticate, getSystemStats);
router.get("/:id", authenticate, getDetectionById);

module.exports = router;
\n`\n\n\n### File: .\backend\routes\symptomRoutes.js\n\n`javascript\nconst express = require("express");
const router = express.Router();
const { diagnoseSymptoms, getSymptomHistory } = require("../controllers/symptomController");
const { authenticate } = require("../middleware/auth");

router.post("/", authenticate, diagnoseSymptoms);
router.get("/history", authenticate, getSymptomHistory);

module.exports = router;
\n`\n\n\n### File: .\frontend\index.html\n\n`html\n<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="AI-Powered Plant Disease Detection System - Detect plant diseases using advanced image analysis and AI" />
    <title>PlantAI - Plant Disease Detection</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
\n`\n\n\n### File: .\frontend\package.json\n\n`json\n{
  "name": "y",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@clerk/clerk-react": "^5.61.7",
    "@vitejs/plugin-react": "^6.0.1",
    "axios": "^1.16.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.38.0",
    "lucide-react": "^1.14.0",
    "mongodb": "^7.2.0",
    "react-hot-toast": "^2.6.0",
    "react-router-dom": "^7.15.0",
    "recharts": "^3.8.1",
    "tailwind-merge": "^3.6.0",
    "vue": "^3.5.34"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.6",
    "autoprefixer": "^10.5.0",
    "postcss": "^8.5.14",
    "tailwindcss": "^3.4.19",
    "vite": "^8.0.12"
  }
}
\n`\n\n\n### File: .\frontend\postcss.config.js\n\n`javascript\nexport default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
\n`\n\n\n### File: .\frontend\README.md\n\n`md\n# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).
\n`\n\n\n### File: .\frontend\tailwind.config.js\n\n`javascript\n/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#145231",
        },
        lime: {
          50: "#f7fee7",
          100: "#ecfccb",
          200: "#d9f99d",
          300: "#bfef45",
          400: "#a3e635",
          500: "#84cc16",
          600: "#65a30d",
          700: "#4d7c0f",
          800: "#3f6212",
          900: "#365314",
        },
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      backgroundImage: {
        "gradient-to-br-emerald": "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
        "gradient-dark": "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      },
      animation: {
        "float": "float 3s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite",
        "blob": "blob 7s infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(34, 197, 94, 0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(34, 197, 94, 0.8)" },
        },
        blob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
}
\n`\n\n\n### File: .\frontend\vite.config.js\n\n`javascript\nimport { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'CLERK_'],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    // Fallback so VITE_API_URL always resolves
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:5000/api'),
  },
})
\n`\n\n\n### File: .\frontend\src\App.jsx\n\n`javascript\nimport React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/Routes';
import { Toaster } from 'react-hot-toast';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
              borderRadius: '12px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
\n`\n\n\n### File: .\frontend\src\index.css\n\n`css\n@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  @apply scroll-smooth;
}

html {
  @apply scroll-smooth;
}

body {
  @apply bg-slate-950 text-white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  @apply w-2 h-2;
}

::-webkit-scrollbar-track {
  @apply bg-slate-900;
}

::-webkit-scrollbar-thumb {
  @apply bg-slate-700 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-slate-600;
}

/* Global Animations */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
  }
  50% {
    box-shadow: 0 0 40px rgba(34, 197, 94, 0.8);
  }
}

@keyframes blob {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

/* Focus Styles */
:focus-visible {
  @apply outline-none ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-950;
}

/* Selection */
::selection {
  @apply bg-emerald-500/30 text-emerald-300;
}

/* Utility Classes */
.glass {
  @apply bg-white/10 backdrop-blur-md border border-white/20;
}

.glass-dark {
  @apply bg-slate-900/50 backdrop-blur-md border border-slate-800;
}

.gradient-emerald {
  @apply bg-gradient-to-r from-emerald-500 to-lime-400;
}

.gradient-dark {
  @apply bg-gradient-to-br from-slate-900 to-slate-950;
}

.fade-in {
  @apply opacity-100 transition-opacity duration-500;
}

.slide-in-from-top {
  @apply transition-all duration-500;
}

/* Custom scrollbar for modals */
.modal-scroll {
  scrollbar-width: thin;
  scrollbar-color: #475569 #1e293b;
}

.modal-scroll::-webkit-scrollbar {
  @apply w-2;
}

.modal-scroll::-webkit-scrollbar-track {
  @apply bg-slate-900;
}

.modal-scroll::-webkit-scrollbar-thumb {
  @apply bg-slate-700 rounded-full;
}
\n`\n\n\n### File: .\frontend\src\main.jsx\n\n`javascript\nimport React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_ZGVmYXVsdC5jbGVyay5hY2NvdW50cy5kZXYk';

if (!PUBLISHABLE_KEY) {
  console.error("Missing Clerk Publishable Key");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {PUBLISHABLE_KEY && PUBLISHABLE_KEY !== 'PASTE_YOUR_KEY_HERE' ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>
);

\n`\n\n\n### File: .\frontend\src\animations\variants.js\n\n`javascript\n// Framer Motion animation variants
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6 },
  },
};

export const slideInLeftVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5 },
  },
};

export const slideInRightVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5 },
  },
};

export const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 },
  },
};

export const rotateInVariants = {
  hidden: { opacity: 0, rotate: -10 },
  visible: {
    opacity: 1,
    rotate: 0,
    transition: { duration: 0.5 },
  },
};

export const hoverScale = {
  whileHover: { scale: 1.05 },
  transition: { type: 'spring', stiffness: 300, damping: 10 },
};

export const pageTransition = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.3,
    },
  },
};

export const pulseVariants = {
  animate: {
    opacity: [1, 0.7, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
    },
  },
};

export const floatingVariants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const glowVariants = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(34, 197, 94, 0.5)',
      '0 0 40px rgba(34, 197, 94, 0.8)',
      '0 0 20px rgba(34, 197, 94, 0.5)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
    },
  },
};
\n`\n\n\n### File: .\frontend\src\components\HelloWorld.vue\n\n`vue\n<script setup>
import { ref } from 'vue'
import viteLogo from '../assets/vite.svg'
import heroImg from '../assets/hero.png'
import vueLogo from '../assets/vue.svg'

const count = ref(0)
</script>

<template>
  <section id="center">
    <div class="hero">
      <img :src="heroImg" class="base" width="170" height="179" alt="" />
      <img :src="vueLogo" class="framework" alt="Vue logo" />
      <img :src="viteLogo" class="vite" alt="Vite logo" />
    </div>
    <div>
      <h1>Get started</h1>
      <p>Edit <code>src/App.vue</code> and save to test <code>HMR</code></p>
    </div>
    <button type="button" class="counter" @click="count++">
      Count is {{ count }}
    </button>
  </section>

  <div class="ticks"></div>

  <section id="next-steps">
    <div id="docs">
      <svg class="icon" role="presentation" aria-hidden="true">
        <use href="/icons.svg#documentation-icon"></use>
      </svg>
      <h2>Documentation</h2>
      <p>Your questions, answered</p>
      <ul>
        <li>
          <a href="https://vite.dev/" target="_blank">
            <img class="logo" :src="viteLogo" alt="" />
            Explore Vite
          </a>
        </li>
        <li>
          <a href="https://vuejs.org/" target="_blank">
            <img class="button-icon" :src="vueLogo" alt="" />
            Learn more
          </a>
        </li>
      </ul>
    </div>
    <div id="social">
      <svg class="icon" role="presentation" aria-hidden="true">
        <use href="/icons.svg#social-icon"></use>
      </svg>
      <h2>Connect with us</h2>
      <p>Join the Vite community</p>
      <ul>
        <li>
          <a href="https://github.com/vitejs/vite" target="_blank">
            <svg class="button-icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#github-icon"></use>
            </svg>
            GitHub
          </a>
        </li>
        <li>
          <a href="https://chat.vite.dev/" target="_blank">
            <svg class="button-icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#discord-icon"></use>
            </svg>
            Discord
          </a>
        </li>
        <li>
          <a href="https://x.com/vite_js" target="_blank">
            <svg class="button-icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#x-icon"></use>
            </svg>
            X.com
          </a>
        </li>
        <li>
          <a href="https://bsky.app/profile/vite.dev" target="_blank">
            <svg class="button-icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#bluesky-icon"></use>
            </svg>
            Bluesky
          </a>
        </li>
      </ul>
    </div>
  </section>

  <div class="ticks"></div>
  <section id="spacer"></section>
</template>
\n`\n\n\n### File: .\frontend\src\components\ProtectedRoute.jsx\n\n`javascript\nimport React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isInitializing, user, admin } = useAuth();

  // Wait for localStorage auth state to be restored before making any
  // redirect decisions — prevents valid sessions from being bounced on refresh.
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/role-select" replace />;
  }

  if (requiredRole === 'admin' && !admin) {
    return <Navigate to="/role-select" replace />;
  }

  if (requiredRole === 'user' && !user) {
    return <Navigate to="/role-select" replace />;
  }

  return children;
};

export default ProtectedRoute;
\n`\n\n\n### File: .\frontend\src\components\admin\ActivityTimeline.jsx\n\n`javascript\nimport React from 'react';
import { motion } from 'framer-motion';
import { Activity, Upload, Database, Download, Calendar } from 'lucide-react';
import { itemVariants } from '../../animations/variants';

const ActivityTimeline = ({ activityLog }) => {
  const getActivityIcon = (iconType) => {
    const icons = {
      scan: Activity,
      upload: Upload,
      database: Database,
      download: Download,
      calendar: Calendar,
    };
    return icons[iconType] || Activity;
  };

  const getActivityColor = (iconType) => {
    const colors = {
      scan: 'emerald',
      upload: 'blue',
      database: 'purple',
      download: 'amber',
      calendar: 'lime',
    };
    return colors[iconType] || 'emerald';
  };

  const colorMap = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    lime: 'bg-lime-500/20 text-lime-400 border-lime-500/50',
  };

  return (
    <div className="space-y-6">
      {activityLog.map((log, index) => {
        const IconComponent = getActivityIcon(log.icon);
        const colorKey = getActivityColor(log.icon);
        const colorClass = colorMap[colorKey];

        return (
          <motion.div
            key={log.id}
            variants={itemVariants}
            className="flex gap-4 relative"
          >
            {/* Timeline line */}
            {index !== activityLog.length - 1 && (
              <div className="absolute left-5 top-10 w-0.5 h-12 bg-gradient-to-b from-slate-700 to-transparent" />
            )}

            {/* Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${colorClass}`}>
              <IconComponent className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <p className="font-semibold text-white">{log.user}</p>
              <p className="text-sm text-slate-400 mt-1">{log.action}</p>
              <p className="text-xs text-slate-500 mt-2">{log.timestamp}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ActivityTimeline;
\n`\n\n\n### File: .\frontend\src\components\admin\DiseaseDBAnalytics.jsx\n\n`javascript\nimport React from 'react';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import { Camera, Microscope, Zap, TrendingUp, Users } from 'lucide-react';
import { itemVariants } from '../../animations/variants';

const DiseaseDBAnalytics = ({ data }) => {
  const analytics = [
    {
      icon: Camera,
      label: 'Total Uploaded Images',
      value: data.totalUploadedImages.toLocaleString(),
      color: 'emerald',
      subtitle: 'Plant disease samples',
    },
    {
      icon: Microscope,
      label: 'Most Common Disease',
      value: data.mostCommonDisease,
      color: 'purple',
      subtitle: 'Current dataset trend',
    },
    {
      icon: Zap,
      label: 'Live Scans Today',
      value: data.liveScansTodayCount.toString(),
      color: 'amber',
      subtitle: 'Real-time detections',
    },
    {
      icon: TrendingUp,
      label: 'Detection Accuracy',
      value: `${data.detectionAccuracy}%`,
      color: 'lime',
      subtitle: 'Overall system accuracy',
    },
    {
      icon: Users,
      label: 'Active Users Now',
      value: data.activeUsersNow.toString(),
      color: 'blue',
      subtitle: 'Currently scanning',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      emerald: 'bg-emerald-500/20 text-emerald-400',
      purple: 'bg-purple-500/20 text-purple-400',
      amber: 'bg-amber-500/20 text-amber-400',
      lime: 'bg-lime-500/20 text-lime-400',
      blue: 'bg-blue-500/20 text-blue-400',
    };
    return colors[color];
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {analytics.map((item) => {
        const Icon = item.icon;
        return (
          <motion.div key={item.label} variants={itemVariants}>
            <Card className="p-4 h-full flex flex-col">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${getColorClasses(item.color)}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-slate-400 text-xs mb-2 uppercase tracking-wide">{item.label}</p>
              <p className="text-2xl font-bold mb-2">{item.value}</p>
              <p className="text-xs text-slate-500 mt-auto">{item.subtitle}</p>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DiseaseDBAnalytics;
\n`\n\n\n### File: .\frontend\src\components\admin\DiseaseDBTable.jsx\n\n`javascript\nimport React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Download, Trash2, Eye } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { itemVariants } from '../../animations/variants';
import ImagePreviewModal from './ImagePreviewModal';
import ScanStatusBadge from './ScanStatusBadge';

const DiseaseDBTable = ({ scanRecords }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [diseaseFilter, setDiseaseFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const itemsPerPage = 5;

  // Get unique diseases and methods
  const uniqueDiseases = ['all', ...new Set(scanRecords.map((scan) => scan.diseaseName))];
  const uniqueMethods = ['all', ...new Set(scanRecords.map((scan) => scan.scanMethod))];

  // Filter records
  let filtered = scanRecords.filter((record) => {
    const matchSearch =
      record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diseaseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDisease = diseaseFilter === 'all' || record.diseaseName === diseaseFilter;
    const matchMethod = methodFilter === 'all' || record.scanMethod === methodFilter;
    return matchSearch && matchDisease && matchMethod;
  });

  // Paginate
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filtered.slice(startIdx, startIdx + itemsPerPage);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/20';
      case 'high':
        return 'text-orange-400 bg-orange-500/20';
      case 'medium':
        return 'text-amber-400 bg-amber-500/20';
      case 'low':
        return 'text-blue-400 bg-blue-500/20';
      case 'none':
        return 'text-emerald-400 bg-emerald-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  return (
    <>
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by user name or disease..."
              className="w-full pl-12 pr-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Disease Filter */}
          <select
            value={diseaseFilter}
            onChange={(e) => {
              setDiseaseFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
          >
            {uniqueDiseases.map((disease) => (
              <option key={disease} value={disease}>
                {disease === 'all' ? 'All Diseases' : disease}
              </option>
            ))}
          </select>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
          >
            {uniqueMethods.map((method) => (
              <option key={method} value={method}>
                {method === 'all' ? 'All Methods' : method}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-slate-400">
          Showing <span className="font-semibold text-white">{paginatedRecords.length}</span> of{' '}
          <span className="font-semibold text-white">{filtered.length}</span> scans
        </p>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold">Image</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Disease</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Confidence</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Severity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Method</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((record) => (
                  <motion.tr
                    key={record.id}
                    variants={itemVariants}
                    className="border-b border-slate-800 hover:bg-slate-900/50 transition"
                  >
                    {/* Image Preview */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedImage(record.imagePreview);
                          setShowImageModal(true);
                        }}
                        className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 hover:border-emerald-500 transition"
                      >
                        <img
                          src={record.imagePreview}
                          alt="Scan preview"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    </td>

                    {/* User */}
                    <td className="px-6 py-4 text-white font-medium">{record.userName}</td>

                    {/* Disease */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-emerald-400">{record.diseaseName}</span>
                    </td>

                    {/* Confidence */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-lime-400"
                            style={{ width: `${record.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-blue-400">{record.confidence}%</span>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(record.severity)}`}>
                        {record.severity || 'N/A'}
                      </span>
                    </td>

                    {/* Method */}
                    <td className="px-6 py-4">
                      <Badge variant="outline" size="sm">
                        {record.scanMethod}
                      </Badge>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-sm text-slate-400">{record.scanDateTime}</td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <ScanStatusBadge status={record.status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedImage(record.imagePreview);
                            setShowImageModal(true);
                          }}
                          className="p-2 hover:bg-emerald-500/20 rounded-lg transition text-emerald-400"
                          title="View report"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-blue-500/20 rounded-lg transition text-blue-400" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/30">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-sm text-slate-400">
              Page {currentPage} of {totalPages || 1}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition text-sm"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </motion.div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={showImageModal}
        image={selectedImage}
        onClose={() => setShowImageModal(false)}
      />
    </>
  );
};

export default DiseaseDBTable;
\n`\n\n\n### File: .\frontend\src\components\admin\ImagePreviewModal.jsx\n\n`javascript\nimport React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Eye } from 'lucide-react';
import Button from '../common/Button';

const ImagePreviewModal = ({ isOpen, image, onClose }) => {
  if (!isOpen || !image) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative max-w-2xl w-full mx-4 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/30">
            <h3 className="text-lg font-semibold text-white">Disease Detection Preview</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6 rounded-lg overflow-hidden bg-slate-800/50 border border-slate-700">
              <img
                src={image}
                alt="Plant disease preview"
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Info */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase text-slate-500 mb-1">Disease Detected</p>
                  <p className="text-lg font-semibold text-emerald-400">Early Blight</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500 mb-1">Confidence Score</p>
                  <p className="text-lg font-semibold text-blue-400">92%</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500 mb-1">Severity Level</p>
                  <p className="text-lg font-semibold text-amber-400">Medium</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500 mb-1">Detection Method</p>
                  <p className="text-lg font-semibold text-purple-400">Image Upload</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <Button variant="secondary" className="flex-1 flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                View Report
              </Button>
              <Button variant="outline" className="flex-1 flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ImagePreviewModal;
\n`\n\n\n### File: .\frontend\src\components\admin\index.js\n\n`javascript\nexport { default as UserManagementTable } from './UserManagementTable';
export { default as DiseaseDBTable } from './DiseaseDBTable';
export { default as DiseaseDBAnalytics } from './DiseaseDBAnalytics';
export { default as ImagePreviewModal } from './ImagePreviewModal';
export { default as ScanHistoryDrawer } from './ScanHistoryDrawer';
export { default as ActivityTimeline } from './ActivityTimeline';
export { default as ScanStatusBadge } from './ScanStatusBadge';
\n`\n\n\n### File: .\frontend\src\components\admin\ScanHistoryDrawer.jsx\n\n`javascript\nimport React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Zap } from 'lucide-react';
import { itemVariants } from '../../animations/variants';
import ScanStatusBadge from './ScanStatusBadge';

const ScanHistoryDrawer = ({ isOpen, userName, scans, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm z-50 bg-slate-900 border-l border-slate-800 shadow-xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-lg z-10">
              <div>
                <h3 className="text-lg font-semibold text-white">Scan History</h3>
                <p className="text-sm text-slate-400">{userName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {scans && scans.length > 0 ? (
                scans.map((scan, idx) => (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white text-sm">{scan.diseaseName}</p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {scan.scanDateTime}
                        </p>
                      </div>
                      <ScanStatusBadge status={scan.status} size="xs" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="text-xs text-slate-500">Confidence</p>
                        <p className="text-sm font-semibold text-blue-400">{scan.confidence}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Method</p>
                        <p className="text-xs font-semibold text-emerald-400">{scan.scanMethod}</p>
                      </div>
                    </div>

                    {scan.imagePreview && (
                      <div className="rounded overflow-hidden mb-3 bg-slate-700/30 h-24">
                        <img
                          src={scan.imagePreview}
                          alt="Scan preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <button className="w-full px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold transition flex items-center justify-center gap-2">
                      <Zap className="w-3 h-3" />
                      View Details
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">No scans yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ScanHistoryDrawer;
\n`\n\n\n### File: .\frontend\src\components\admin\ScanStatusBadge.jsx\n\n`javascript\nimport React from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

const ScanStatusBadge = ({ status, size = 'sm' }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-lg shadow-emerald-500/20';
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-lg shadow-blue-500/20';
      case 'pending-review':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-lg shadow-amber-500/20';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-lg shadow-red-500/20';
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/50';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'processing':
        return <Clock className="w-3.5 h-3.5 animate-spin" />;
      case 'pending-review':
        return <AlertCircle className="w-3.5 h-3.5" />;
      case 'failed':
        return <XCircle className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const sizeClass = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full font-medium ${sizeClass} ${getStatusStyle()}`}>
      {getIcon()}
      <span className="capitalize">{status.replace('-', ' ')}</span>
    </span>
  );
};

export default ScanStatusBadge;
\n`\n\n\n### File: .\frontend\src\components\admin\UserManagementTable.jsx\n\n`javascript\nimport React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Eye, MoreVertical } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { itemVariants } from '../../animations/variants';
import ScanHistoryDrawer from './ScanHistoryDrawer';

const UserManagementTable = ({ users, mockScans }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showScanHistory, setShowScanHistory] = useState(false);

  const itemsPerPage = 5;

  // Filter users
  let filtered = users.filter((user) => {
    const matchSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'all' || user.role === roleFilter;
    const matchStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  // Paginate
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filtered.slice(startIdx, startIdx + itemsPerPage);

  const handleViewScanHistory = (user) => {
    setSelectedUser(user);
    setShowScanHistory(true);
  };

  const userScans = selectedUser
    ? mockScans.filter((scan) => scan.userId === selectedUser.id)
    : [];

  return (
    <>
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name or email..."
              className="w-full pl-12 pr-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <p className="text-sm text-slate-400">
          Showing <span className="font-semibold text-white">{paginatedUsers.length}</span> of{' '}
          <span className="font-semibold text-white">{filtered.length}</span> users
        </p>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Scans</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Last Scan</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Account</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    variants={itemVariants}
                    className="border-b border-slate-800 hover:bg-slate-900/50 transition"
                  >
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="font-medium text-white">{user.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-slate-400 text-sm">{user.email}</td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <Badge variant={user.role === 'admin' ? 'warning' : 'success'} size="sm">
                        {user.role}
                      </Badge>
                    </td>

                    {/* Scans */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-emerald-400">{user.scans}</span>
                    </td>

                    {/* Last Scan */}
                    <td className="px-6 py-4 text-sm text-slate-400">{user.lastScanTime}</td>

                    {/* Account Status */}
                    <td className="px-6 py-4">
                      <Badge
                        variant={user.accountStatus === 'verified' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {user.accountStatus}
                      </Badge>
                    </td>

                    {/* Scan Status */}
                    <td className="px-6 py-4">
                      <Badge variant="success" size="sm">
                        {user.scanStatus}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewScanHistory(user)}
                          className="p-2 hover:bg-emerald-500/20 rounded-lg transition text-emerald-400"
                          title="View scan history"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400"
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/30">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-sm text-slate-400">
              Page {currentPage} of {totalPages || 1}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition text-sm"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </motion.div>

      {/* Scan History Drawer */}
      <ScanHistoryDrawer
        isOpen={showScanHistory}
        userName={selectedUser?.name || ''}
        scans={userScans}
        onClose={() => setShowScanHistory(false)}
      />
    </>
  );
};

export default UserManagementTable;
\n`\n\n\n### File: .\frontend\src\components\auth\ForgotPasswordModal.jsx\n\n`javascript\nimport React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import * as authService from '../../utils/authService';

const ForgotPasswordModal = ({ isOpen, onClose, isAdmin = false }) => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('request'); // 'request' | 'success'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetData, setResetData] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const role = isAdmin ? 'admin' : 'user';
      const response = await authService.forgotPassword(email, role);
      setResetData(response);
      setStep('success');
      toast.success('Reset token generated!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (resetData?.resetToken) {
      navigator.clipboard.writeText(resetData.resetToken);
      setCopied(true);
      toast.success('Token copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setEmail('');
    setStep('request');
    setError('');
    setResetData(null);
    setCopied(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-lime-400" />

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8">
                {step === 'request' ? (
                  <>
                    {/* Header */}
                    <div className="mb-6">
                      <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center mb-4">
                        <Mail className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
                      <p className="text-slate-400 text-sm">
                        Enter your {isAdmin ? 'admin ' : ''}email address and we'll generate a
                        password reset token for you.
                      </p>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300 text-sm">{error}</p>
                      </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError('');
                          }}
                          placeholder={isAdmin ? 'admin@plantai.com' : 'your@email.com'}
                          className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                          disabled={isLoading}
                          autoFocus
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating token...
                          </>
                        ) : (
                          'Send Reset Token'
                        )}
                      </button>
                    </form>

                    <button
                      onClick={handleClose}
                      className="w-full mt-3 py-2 text-slate-400 hover:text-white text-sm transition"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {/* Success State */}
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">Token Generated!</h2>
                      <p className="text-slate-400 text-sm">
                        A password reset token has been generated for <span className="text-white font-medium">{email}</span>.
                        Copy it below and use it to reset your password.
                      </p>
                    </div>

                    {/* Token Display */}
                    {resetData?.resetToken && (
                      <div className="mb-6">
                        <p className="text-sm font-semibold text-slate-400 mb-2">Your Reset Token:</p>
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-start gap-3">
                          <code className="text-emerald-400 text-xs break-all flex-1 leading-relaxed">
                            {resetData.resetToken}
                          </code>
                          <button
                            onClick={handleCopy}
                            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
                            title="Copy token"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          ⏱ Valid for 1 hour
                          {resetData.expiresAt && ` · Expires at ${new Date(resetData.expiresAt).toLocaleTimeString()}`}
                        </p>
                      </div>
                    )}

                    {/* Note for demo */}
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
                      <p className="text-amber-300 text-xs">
                        <strong>Demo Mode:</strong> In production, this token would be emailed to you.
                        Use it with the <code className="bg-amber-500/20 px-1 rounded">POST /api/{isAdmin ? 'admin' : 'auth'}/reset-password</code> endpoint.
                      </p>
                    </div>

                    <button
                      onClick={handleClose}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-white font-semibold rounded-lg transition-all"
                    >
                      Back to Login
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ForgotPasswordModal;
\n`\n\n\n### File: .\frontend\src\components\common\Badge.jsx\n\n`javascript\nimport React from 'react';
import { motion } from 'framer-motion';

const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const variants = {
    default: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    success: 'bg-green-500/20 text-green-300 border border-green-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    danger: 'bg-red-500/20 text-red-300 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center rounded-full font-semibold ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </motion.span>
  );
};

export default Badge;
\n`\n\n\n### File: .\frontend\src\components\common\Button.jsx\n\n`javascript\nimport React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const Button = React.forwardRef(
  ({ className, children, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
    const baseStyles = 'font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 justify-center';

    const variants = {
      primary: 'bg-gradient-to-r from-emerald-500 to-lime-400 text-white hover:shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50',
      secondary: 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700',
      outline: 'border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500/10',
      ghost: 'text-slate-300 hover:text-white hover:bg-slate-800/50',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
\n`\n\n\n### File: .\frontend\src\components\common\Card.jsx\n\n`javascript\nimport React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const Card = React.forwardRef(
  ({ className, children, variant = 'default', hover = true, ...props }, ref) => {
    const baseStyles = 'rounded-2xl border backdrop-blur-sm transition-all duration-300';

    const variants = {
      default: 'bg-slate-900/50 border-slate-800',
      dark: 'bg-slate-950/80 border-slate-800',
      gradient: 'bg-gradient-to-br from-slate-900/50 to-slate-950/50 border-slate-800',
    };

    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { y: -5, boxShadow: '0 20px 40px rgba(34, 197, 94, 0.1)' } : {}}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
\n`\n\n\n### File: .\frontend\src\components\common\index.js\n\n`javascript\nexport { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Badge } from './Badge';
export { default as Navbar } from './Navbar';
export { default as Sidebar } from './Sidebar';
export { default as SkeletonLoader } from './SkeletonLoader';
export { default as Toast } from './Toast';
export { default as Modal } from './Modal';
\n`\n\n\n### File: .\frontend\src\components\common\Modal.jsx\n\n`javascript\nimport React from 'react';
import { motion } from 'framer-motion';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 ${sizes[size]} w-full max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-2xl"
          >
            ×
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
};

export default Modal;
\n`\n\n\n### File: .\frontend\src\components\common\Navbar.jsx\n\n`javascript\nimport React from 'react';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UserButton, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth } from '../../hooks/useAuth';

const Navbar = ({ user: propUser, onLogout, userRole = 'user' }) => {
  const navigate = useNavigate();
  const { user: authUser, admin: authAdmin, logout } = useAuth();
  
  // Conditionally check Clerk context so we don't crash if it's missing
  let isClerkActive = false;
  try {
    const clerkAuth = useClerkAuth();
    isClerkActive = !!clerkAuth;
  } catch (e) {
    isClerkActive = false;
  }

  const currentUser = propUser || authUser || authAdmin;

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
      navigate('/role-select');
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 z-50"
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-lime-400 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-emerald-400 to-lime-300 bg-clip-text text-transparent">
            PlantAI
          </span>
        </Link>

        {/* Center Menu - Only show for non-admin users */}
        {userRole !== 'admin' && (
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-slate-300 hover:text-white transition text-sm">
              Home
            </Link>
            <Link to={userRole === 'admin' ? '/admin/dashboard' : '/dashboard'} className="text-slate-300 hover:text-white transition text-sm">
              Dashboard
            </Link>
            <a href="#features" className="text-slate-300 hover:text-white transition text-sm">
              Features
            </a>
          </div>
        )}

        {/* Right Menu */}
        <div className="flex items-center gap-4">
          {currentUser ? (
            <>
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-sm text-slate-300">{currentUser.name}</span>
              </div>
              {isClerkActive && <UserButton afterSignOutUrl="/role-select" />}
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 text-white hover:bg-slate-700 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-300 hover:text-white transition text-sm">
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-500 to-lime-400 text-white hover:shadow-lg transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
\n`\n\n\n### File: .\frontend\src\components\common\Sidebar.jsx\n\n`javascript\nimport React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Leaf,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  Database,
  FileText,
} from 'lucide-react';

const Sidebar = ({ userRole = 'user', onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const userMenuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Recent Scans', icon: Leaf, path: '/dashboard' },
    { label: 'Statistics', icon: BarChart3, path: '/dashboard' },
  ];

  const adminMenuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'Disease DB', icon: Database, path: '/admin/diseases' },
    { label: 'Reports', icon: FileText, path: '/admin/reports' },
    { label: 'Activity Log', icon: BarChart3, path: '/admin/activity-log' },
    { label: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : userMenuItems;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-3 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 text-white shadow-lg hover:shadow-xl transition"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <motion.aside
        animate={{ x: isDesktop ? 0 : (isOpen ? 0 : -280) }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-16 bottom-0 w-64 bg-slate-950 border-r border-slate-800 overflow-y-auto z-40 lg:translate-x-0"
      >
        <div className="p-6 flex flex-col h-full">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-lime-400 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-lime-300 bg-clip-text text-transparent">
              PlantAI
            </span>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (!isDesktop) {
                      setIsOpen(false);
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-gradient-to-r from-emerald-500/20 to-lime-400/20 text-emerald-400 border-l-2 border-emerald-500'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={() => {
              onLogout();
              navigate('/role-select');
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
\n`\n\n\n### File: .\frontend\src\components\common\SkeletonLoader.jsx\n\n`javascript\nimport React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = ({ className = '', count = 1 }) => {
  return (
    <div className={className}>
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="bg-slate-800 rounded-lg h-20 mb-4"
          />
        ))}
    </div>
  );
};

export default SkeletonLoader;
\n`\n\n\n### File: .\frontend\src\components\common\Toast.jsx\n\n`javascript\nimport React from 'react';
import { motion } from 'framer-motion';

export const Toast = ({ message, type = 'success', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeStyles = {
    success: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
    error: 'bg-red-500/20 border-red-500/50 text-red-300',
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
    warning: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-20 right-6 px-6 py-3 rounded-lg border backdrop-blur-sm ${typeStyles[type]} shadow-lg z-50`}
    >
      {message}
    </motion.div>
  );
};

export default Toast;
\n`\n\n\n### File: .\frontend\src\components\dashboard\Chart.jsx\n\n`javascript\nimport React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../common/Card';

const Chart = ({ type = 'bar', data, title, height = 300 }) => {
  const chartConfig = {
    margin: { top: 5, right: 30, left: 0, bottom: 5 },
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {type === 'bar' && (
          <BarChart data={data} {...chartConfig}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="scans" fill="#22c55e" radius={[8, 8, 0, 0]} />
          </BarChart>
        )}
        {type === 'line' && (
          <LineChart data={data} {...chartConfig}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )}
        {type === 'pie' && (
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
};

export default Chart;
\n`\n\n\n### File: .\frontend\src\components\dashboard\ImageUploadAgent.jsx\n\n`javascript\nimport React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Upload, Loader2, AlertCircle, CheckCircle2, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import { containerVariants, itemVariants } from '../../animations/variants';
import toast from 'react-hot-toast';
import axios from 'axios';

const getAuthHeaders = () => {
  const live = axios.defaults.headers.common['Authorization'];
  if (live) return { Authorization: live };
  const stored = localStorage.getItem('authToken');
  return stored ? { Authorization: `Bearer ${stored}` } : {};
};

const ImageUploadAgent = ({ onScanComplete }) => {
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/detect/upload/history', {
        headers: getAuthHeaders()
      });
      if (response.data.success && response.data.history) {
        setHistoryData(response.data.history);
      }
    } catch (err) {
      console.error('Failed to fetch upload history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const validateFile = (file) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimes.includes(file.type)) {
      setError('Only JPG and PNG images are allowed');
      return false;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call prediction upload endpoint
      const response = await axios.post(
        '/api/detect/upload',
        (() => {
          const fd = new FormData();
          fd.append('image', selectedFile);
          return fd;
        })(),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...getAuthHeaders()
          }
        }
      );

      if (response.data.success && response.data.subPrediction) {
        const pred = response.data.subPrediction;
        setResult(pred);
        toast.success('Analysis complete!');
        onScanComplete?.();
        fetchHistory();
      } else {
        setError('Analysis failed');
        toast.error('Analysis failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to analyze image';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
    setResult(null);
    setError(null);
  };

  const downloadSheet = async (format) => {
    const endpoint = format === 'csv'
      ? '/api/detect/download/upload/csv'
      : '/api/detect/download/upload/excel';
    try {
      const response = await fetch(endpoint, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        toast.error('No scan data yet. Complete a scan first!');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `upload_history.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded upload history as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Download failed');
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card className="p-8">
        <h3 className="text-2xl font-bold text-white mb-2">Image Upload Detection</h3>
        <p className="text-slate-400 mb-6">Upload a photo of your plant for instant disease analysis</p>

        {error && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}

        {!preview ? (
          <motion.label
            variants={itemVariants}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="block border-2 border-dashed border-emerald-500/50 rounded-xl p-8 cursor-pointer hover:border-emerald-500 transition text-center bg-slate-900/40 backdrop-blur-xl"
          >
            <Upload className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-bounce" />
            <p className="text-white font-semibold">Drag and drop your image here</p>
            <p className="text-slate-400 text-sm">or click to browse (JPG, PNG up to 5MB)</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileChange}
              className="hidden"
              disabled={loading}
            />
          </motion.label>
        ) : (
          <motion.div variants={itemVariants}>
            <img src={preview} alt="Preview" className="w-full h-80 object-cover rounded-xl mb-4 border border-slate-800 shadow-2xl" />
            <div className="flex gap-3">
              <Button onClick={handleAnalyze} disabled={loading} className="flex-1 py-3 text-base">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Plant'
                )}
              </Button>
              <Button variant="ghost" onClick={handleClear} disabled={loading} className="flex-1 py-3 text-base border-slate-700">
                Clear
              </Button>
            </div>
          </motion.div>
        )}

        {/* Results Panel */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-gradient-to-r from-emerald-500/20 to-lime-500/10 rounded-xl border border-emerald-500/30 shadow-2xl"
          >
            <div className="flex items-start gap-3 mb-4 border-b border-emerald-500/20 pb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <h4 className="text-lg font-bold text-white">Diagnostic Results Summary</h4>
            </div>

            {/* Non-Plant Rejection Display */}
            {result.plantName === 'None' || result.plantName === 'Unknown' ? (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 font-semibold mb-2">
                No Plant Detected
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-xs">PLANT SPECIES</p>
                  <p className="text-lg font-bold text-emerald-400">{result.plantName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">DIAGNOSTIC STATUS</p>
                  <Badge variant={result.status === 'Healthy' ? 'success' : 'danger'} size="md">
                    {result.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 text-xs">DISEASE CLASSIFICATION</p>
                  <p className="text-lg font-bold text-white">{result.diseaseName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">AI CONFIDENCE</p>
                  <p className="text-2xl font-black text-emerald-400">{result.confidence}%</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">SCANNED AT</p>
                  <p className="text-sm text-slate-300 font-semibold mt-1">
                    {new Date(result.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            <Button onClick={handleClear} variant="secondary" className="w-full mt-6 py-2.5">
              Analyze Another Image
            </Button>
          </motion.div>
        )}

        {/* Export & Download Options */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <button
            onClick={() => downloadSheet('csv')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition"
          >
            Export CSV
          </button>
          <button
            onClick={() => downloadSheet('excel')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition"
          >
            Export Excel
          </button>
          <button
            onClick={() => {
              if (historyData.length > 0 && historyData[0].imagePath) {
                window.open(`/uploads/${historyData[0].imagePath.split(/[\\/]/).pop()}`, '_blank');
              } else {
                toast.error('No scan images available to download');
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition"
          >
            Download Image
          </button>
        </div>

        {/* Upload History Table */}
        <div className="mt-8 border-t border-slate-800 pt-6">
          <h4 className="text-lg font-bold text-white mb-4">Upload Detection History</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Plant</th>
                  <th className="py-3 px-4">Disease Name</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {historyData.slice(0, 5).map((row, idx) => {
                  const fileName = row.imagePath ? row.imagePath.split('/').pop().split('\\').pop() : 'N/A';
                  return (
                    <tr key={row._id || idx} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/40">
                      <td className="py-3 px-4">{new Date(row.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4 max-w-[120px] truncate">{fileName}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-400">{row.plantName}</td>
                      <td className="py-3 px-4">{row.diseaseName}</td>
                      <td className="py-3 px-4 font-bold text-emerald-500">{row.confidence}%</td>
                      <td className="py-3 px-4">
                        <Badge variant={row.status === 'Healthy' ? 'success' : 'danger'} size="sm">
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {historyData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-500">
                      No recent upload scans logged yet. Start uploading above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ImageUploadAgent;
\n`\n\n\n### File: .\frontend\src\components\dashboard\index.js\n\n`javascript\nexport { default as StatCard } from './StatCard';
export { default as Chart } from './Chart';
export { default as RecentScans } from './RecentScans';
export { default as ImageUploadAgent } from './ImageUploadAgent';
export { default as SymptomBasedAgent } from './SymptomBasedAgent';
export { default as LiveCameraAgent } from './LiveCameraAgent';
\n`\n\n\n### File: .\frontend\src\components\dashboard\LiveCameraAgent.jsx\n\n`javascript\nimport React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Video, Play, Square, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { containerVariants, itemVariants } from '../../animations/variants';
import toast from 'react-hot-toast';
import axios from 'axios';

const getAuthHeaders = () => {
  const live = axios.defaults.headers.common['Authorization'];
  if (live) return { Authorization: live };
  const stored = localStorage.getItem('authToken');
  return stored ? { Authorization: `Bearer ${stored}` } : {};
};

const LiveCameraAgent = ({ onScanComplete }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedDisease, setDetectedDisease] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/detect/realtime/history', {
        headers: getAuthHeaders()
      });
      if (response.data.success && response.data.history) {
        setHistoryData(response.data.history);
      }
    } catch (err) {
      console.error('Failed to fetch realtime history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleStartCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (err) {
      const errorMsg = err.name === 'NotAllowedError'
        ? 'Camera access denied. Please enable camera permissions.'
        : 'Unable to access camera';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Camera error:', err);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      setLoading(true);
      
      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve();
            return;
          }
          try {
            const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' });
            // Call prediction endpoint
            const response = await axios.post(
              '/api/detect/realtime',
              (() => {
                const fd = new FormData();
                fd.append('image', file);
                return fd;
              })(),
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                  ...getAuthHeaders()
                }
              }
            );

            if (response.data.success && response.data.subPrediction) {
              const pred = response.data.subPrediction;
              setDetectedDisease({
                plant: pred.plantName,
                name: pred.diseaseName,
                confidence: pred.confidence,
                status: pred.status,
                severity: pred.status === 'Healthy' ? 'low' : 'high',
              });
              toast.success('Disease scanned!');
              onScanComplete?.();
              fetchHistory();
            }
          } catch (err) {
            console.error('Frame analysis error:', err);
          } finally {
            setLoading(false);
            resolve();
          }
        }, 'image/jpeg', 0.9);
      });
    } catch (err) {
      console.error('Capture exception:', err);
      setLoading(false);
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setDetectedDisease(null);
    setError(null);
  };

  const downloadSheet = async (format) => {
    const endpoint = format === 'csv'
      ? '/api/detect/download/realtime/csv'
      : '/api/detect/download/realtime/excel';
    try {
      const response = await fetch(endpoint, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        toast.error('No scan data yet. Start scanning first!');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `realtime_history.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded realtime history as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Download failed');
    }
  };

  // Continuous loop scanner: captures a frame every 3 seconds while isScanning is true
  useEffect(() => {
    let timerId;

    const tick = async () => {
      if (isScanning && streamRef.current) {
        await captureAndAnalyze();
        timerId = setTimeout(tick, 3000); // Wait 3 seconds before next scan
      }
    };

    if (isScanning) {
      timerId = setTimeout(tick, 2000); // 2 second initial delay
    }

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isScanning]);

  // Cleanup camera streams on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card className="p-8">
        <h3 className="text-2xl font-bold text-white mb-2">Live Camera Detection</h3>
        <p className="text-slate-400 mb-6">Real-time disease scanning with your device camera</p>

        {/* Camera Container covering 80% style area */}
        <motion.div
          variants={itemVariants}
          className="relative bg-slate-900 rounded-xl overflow-hidden mb-6 w-full max-w-4xl mx-auto h-[480px] flex items-center justify-center border border-slate-800 shadow-2xl"
        >
          {isScanning ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none z-10" />
              
              {loading && (
                <div className="absolute bottom-4 right-4 bg-slate-950/90 px-3.5 py-2 rounded-lg flex items-center gap-2 border border-slate-800 z-30 shadow-xl">
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span className="text-slate-300 text-xs font-semibold">Scanning frame...</span>
                </div>
              )}

              {/* YOLO Bounding Box & Diagnostic Label Overlay */}
              {detectedDisease && detectedDisease.plant !== 'None' && detectedDisease.plant !== 'Unknown' && (
                <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                  <div className="w-[60%] h-[60%] border-4 border-emerald-500 rounded-lg relative flex flex-col justify-between p-3 animate-pulse">
                    <div className="absolute -top-10 left-0 bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                      <span className="bg-emerald-700 px-1.5 py-0.5 rounded text-[10px]">YOLOv8</span>
                      <span>{detectedDisease.plant} | {detectedDisease.name} | {detectedDisease.confidence}% ({detectedDisease.status})</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Non-Plant Rejection Overlay */}
              {detectedDisease && (detectedDisease.plant === 'None' || detectedDisease.plant === 'Unknown') && (
                <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center bg-red-500/10 border border-red-500/30">
                  <div className="bg-red-500 text-white font-bold text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 animate-bounce" />
                    <span>No Plant Detected</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <Video className="w-16 h-16 text-slate-700 mx-auto mb-3 animate-pulse" />
              <p className="text-slate-400">Camera preview not active</p>
            </div>
          )}
        </motion.div>

        {/* Start / Stop Trigger */}
        <motion.div variants={itemVariants} className="space-y-4">
          <Button
            onClick={isScanning ? handleStopCamera : handleStartCamera}
            variant={isScanning ? 'danger' : 'primary'}
            className="w-full py-3 text-base font-bold shadow-lg"
          >
            {isScanning ? (
              <>
                <Square className="w-4 h-4" />
                Stop Scanning
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Camera
              </>
            )}
          </Button>
        </motion.div>

        {/* Export & Download Options */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <button
            onClick={() => downloadSheet('csv')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition"
          >
            Export CSV
          </button>
          <button
            onClick={() => downloadSheet('excel')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition"
          >
            Export Excel
          </button>
          <button
            onClick={() => {
              if (historyData.length > 0 && historyData[0].imagePath) {
                window.open(`/uploads/${historyData[0].imagePath.split(/[\\/]/).pop()}`, '_blank');
              } else {
                toast.error('No scan images available to download');
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition"
          >
            Download Image
          </button>
        </div>

        {/* Detection History Table */}
        <div className="mt-8 border-t border-slate-800 pt-6">
          <h4 className="text-lg font-bold text-white mb-4">Live Detection History</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Plant Name</th>
                  <th className="py-3 px-4">Disease Name</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Detection Type</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {historyData.slice(0, 5).map((row, idx) => (
                  <tr key={row._id || idx} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/40">
                    <td className="py-3 px-4">{new Date(row.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-400">{row.plantName}</td>
                    <td className="py-3 px-4">{row.diseaseName}</td>
                    <td className="py-3 px-4 font-bold text-emerald-500">{row.confidence}%</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs uppercase font-bold">
                        {row.detectionType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={row.status === 'Healthy' ? 'success' : 'danger'} size="sm">
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {historyData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-500">
                      No recent real-time scans logged yet. Start scanning above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default LiveCameraAgent;
\n`\n\n\n### File: .\frontend\src\components\dashboard\RecentScans.jsx\n\n`javascript\nimport React from 'react';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { Clock, TrendingUp } from 'lucide-react';
import { itemVariants } from '../../animations/variants';

const RecentScans = ({ scans }) => {
  const getSeverityColor = (severity) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'danger',
      critical: 'danger',
      none: 'info',
    };
    return colors[severity] || 'default';
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Scans</h3>
        <div className="space-y-3">
          {scans.map((scan) => (
            <div key={scan.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition">
              <img src={scan.image} alt={scan.plantName} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{scan.plantName}</p>
                <p className="text-xs text-slate-400">{scan.disease}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-emerald-400">{scan.confidence}%</p>
                <Badge variant={getSeverityColor(scan.severity)} size="sm">
                  {scan.severity}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

export default RecentScans;
\n`\n\n\n### File: .\frontend\src\components\dashboard\StatCard.jsx\n\n`javascript\nimport React from 'react';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import { itemVariants } from '../../animations/variants';

const StatCard = ({ icon: Icon, label, value, subtext, trend, color = 'emerald' }) => {
  const colorStyles = {
    emerald: 'from-emerald-500/20 to-lime-500/10 border-emerald-500/30',
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
    purple: 'from-purple-500/20 to-pink-500/10 border-purple-500/30',
    amber: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
  };

  const trendColor = trend?.includes('+') ? 'text-emerald-400' : 'text-red-400';

  return (
    <motion.div variants={itemVariants}>
      <Card className={`bg-gradient-to-br ${colorStyles[color]} p-6`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-slate-400 text-sm mb-2">{label}</p>
            <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
            {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
            {trend && <p className={`text-sm font-semibold mt-2 ${trendColor}`}>{trend}</p>}
          </div>
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-${color}-500 to-${color}-600 flex items-center justify-center text-white`}>
            <Icon size={24} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default StatCard;
\n`\n\n\n### File: .\frontend\src\components\dashboard\SymptomBasedAgent.jsx\n\n`javascript\nimport React, { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Send, Loader2 } from 'lucide-react';
import { containerVariants, itemVariants } from '../../animations/variants';
import * as authService from '../../utils/authService';

const SymptomBasedAgent = ({ onScanComplete }) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const symptoms = [
    'Yellow Leaves',
    'Brown Spots',
    'Wilting',
    'White Powder',
    'Leaf Curling',
    'Stem Rot',
    'Holes in Leaves',
    'Stunted Growth',
  ];

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await authService.diagnoseSymptoms(selectedSymptoms, additionalNotes);
      if (response.success && response.diagnosis) {
        setResult({
          disease: response.diagnosis.diseaseName,
          confidence: response.diagnosis.confidence,
          recommendation: response.diagnosis.recommendation,
        });
        onScanComplete?.();
      }
    } catch (err) {
      console.error("Diagnosis error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card className="p-8">
        <h3 className="text-2xl font-bold text-white mb-2">Symptom-Based Detection</h3>
        <p className="text-slate-400 mb-6">Describe your plant symptoms for AI analysis</p>

        <motion.div variants={itemVariants} className="mb-6">
          <label className="block text-sm font-semibold text-white mb-3">Select Symptoms</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {symptoms.map((symptom) => (
              <button
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedSymptoms.includes(symptom)
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-emerald-500/50'
                }`}
              >
                {symptom}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-6">
          <label className="block text-sm font-semibold text-white mb-2">Additional Notes</label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Describe any other observations..."
            className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            rows={4}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button onClick={handleAnalyze} disabled={loading || selectedSymptoms.length === 0} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Get Diagnosis
              </>
            )}
          </Button>
        </motion.div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-gradient-to-r from-emerald-500/20 to-lime-500/10 rounded-lg border border-emerald-500/30"
          >
            <h4 className="text-lg font-semibold text-white mb-2">Diagnosis</h4>
            <div className="space-y-2">
              <p className="text-slate-300">
                Disease: <span className="font-bold text-emerald-400">{result.disease}</span>
              </p>
              <p className="text-slate-300">
                Confidence: <span className="font-bold text-emerald-400">{result.confidence}%</span>
              </p>
              <p className="text-slate-300 mt-3">{result.recommendation}</p>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};

export default SymptomBasedAgent;
\n`\n\n\n### File: .\frontend\src\context\AuthContext.jsx\n\n`javascript\nimport React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  // Restore state from localStorage on page refresh
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('authUser');
      const role = localStorage.getItem('userRole');
      return stored && role === 'user' ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem('authUser');
      const role = localStorage.getItem('userRole');
      return stored && role === 'admin' ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('authToken'));
  const [isInitializing, setIsInitializing] = useState(false);

  // Sync token into axios defaults whenever it changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const _saveSession = (dbUser, authToken) => {
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('authUser', JSON.stringify(dbUser));
    localStorage.setItem('userRole', dbUser.role);
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    setToken(authToken);
    if (dbUser.role === 'admin') {
      setAdmin(dbUser);
      setUser(null);
    } else {
      setUser(dbUser);
      setAdmin(null);
    }
    setIsAuthenticated(true);
    setError(null);
  };

  const _clearSession = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('userRole');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setAdmin(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  // ============================================================
  // LOGIN — supports both user and admin roles
  // ============================================================
  const login = useCallback(async (email, password, role = 'user') => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = role === 'admin'
        ? `${API}/admin/login`
        : `${API}/auth/login`;

      const response = await axios.post(endpoint, { email, password, role });

      if (response.data.success) {
        _saveSession(response.data.user, response.data.token);
        return { success: true };
      } else {
        const msg = response.data.message || 'Login failed';
        setError(msg);
        return { success: false, error: msg };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // REGISTER
  // ============================================================
  const register = useCallback(async (name, email, password, role = 'user') => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = role === 'admin'
        ? `${API}/admin/signup`
        : `${API}/auth/register`;

      const response = await axios.post(endpoint, { name, email, password, role });

      if (response.data.success) {
        _saveSession(response.data.user, response.data.token);
        return { success: true };
      } else {
        const msg = response.data.message || 'Registration failed';
        setError(msg);
        return { success: false, error: msg };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (token) {
        await axios.post(`${API}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {}); // ignore logout API errors
      }
    } finally {
      _clearSession();
      setLoading(false);
    }
  }, [token]);

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================
  const forgotPassword = useCallback(async (email, role = 'user') => {
    try {
      const endpoint = role === 'admin'
        ? `${API}/admin/forgot-password`
        : `${API}/auth/forgot-password`;
      const response = await axios.post(endpoint, { email });
      return response.data;
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Request failed' };
    }
  }, []);

  // ============================================================
  // REFRESH TOKEN
  // ============================================================
  const refreshToken = useCallback(async () => {
    if (!token) return { success: false };
    try {
      const response = await axios.post(`${API}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.token) {
        setToken(response.data.token);
        localStorage.setItem('authToken', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        return { success: true, token: response.data.token };
      }
    } catch {
      _clearSession();
    }
    return { success: false };
  }, [token]);

  const value = {
    user,
    admin,
    token,
    loading,
    error,
    isAuthenticated,
    isInitializing,
    register,
    login,
    logout,
    forgotPassword,
    refreshToken,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
\n`\n\n\n### File: .\frontend\src\data\mockData.js\n\n`javascript\n// Mock data for the entire application

export const mockUserProfile = {
  id: 'user-123',
  name: 'Sarah Johnson',
  email: 'sarah@example.com',
  role: 'user',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  joinDate: '2024-01-15',
  totalScans: 156,
  premiumStatus: true,
};

export const mockDashboardStats = {
  totalScans: 156,
  healthyPlants: 98,
  diseasedPlants: 58,
  accuracy: 94.3,
  lastScanDate: '2024-05-10',
  scansThisMonth: 42,
  diseaseDetectionRate: 37.2,
};

export const mockChartData = {
  scansPerDay: [
    { day: 'Mon', scans: 12 },
    { day: 'Tue', scans: 19 },
    { day: 'Wed', scans: 15 },
    { day: 'Thu', scans: 25 },
    { day: 'Fri', scans: 22 },
    { day: 'Sat', scans: 18 },
    { day: 'Sun', scans: 14 },
  ],
  diseaseDistribution: [
    { name: 'Powdery Mildew', value: 28, color: '#22c55e' },
    { name: 'Leaf Spot', value: 22, color: '#84cc16' },
    { name: 'Rust', value: 18, color: '#f59e0b' },
    { name: 'Blight', value: 15, color: '#ef4444' },
    { name: 'Healthy', value: 42, color: '#3b82f6' },
  ],
  accuracyTrend: [
    { month: 'Jan', accuracy: 88 },
    { month: 'Feb', accuracy: 89 },
    { month: 'Mar', accuracy: 91 },
    { month: 'Apr', accuracy: 93 },
    { month: 'May', accuracy: 94.3 },
  ],
};

export const mockRecentScans = [
  {
    id: 'scan-1',
    plantName: 'Tomato Plant',
    disease: 'Early Blight',
    date: '2024-05-10 14:30',
    confidence: 92,
    severity: 'medium',
    image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400',
  },
  {
    id: 'scan-2',
    plantName: 'Cucumber Plant',
    disease: 'Powdery Mildew',
    date: '2024-05-10 12:15',
    confidence: 88,
    severity: 'low',
    image: 'https://images.unsplash.com/photo-1626202378886-4bd892f535d7?w=400',
  },
  {
    id: 'scan-3',
    plantName: 'Wheat Field',
    disease: 'Healthy',
    date: '2024-05-09 16:45',
    confidence: 96,
    severity: 'none',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400',
  },
  {
    id: 'scan-4',
    plantName: 'Apple Tree',
    disease: 'Apple Scab',
    date: '2024-05-09 10:20',
    confidence: 85,
    severity: 'high',
    image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400',
  },
  {
    id: 'scan-5',
    plantName: 'Potato Plant',
    disease: 'Late Blight',
    date: '2024-05-08 15:00',
    confidence: 91,
    severity: 'critical',
    image: 'https://images.unsplash.com/photo-1612528443702-f6741f1a144c?w=400',
  },
];

export const mockDiseases = [
  {
    id: 'disease-1',
    name: 'Early Blight',
    plantType: 'Tomato',
    description: 'Early blight is a common disease of tomato that can be destructive and economically significant, particularly in years with warm, wet weather.',
    causes: ['Fungal pathogen Alternaria solani', 'High humidity', 'Overhead watering', 'Poor air circulation'],
    symptoms: ['Brown lesions on lower leaves', 'Concentric ring patterns', 'Yellow halo around spots', 'Progressive leaf death'],
    remedies: [
      'Remove infected leaves',
      'Ensure proper plant spacing',
      'Mulch soil',
      'Water at base of plants',
      'Prune lower branches',
      'Apply fungicide if needed',
    ],
    prevention: [
      'Plant resistant varieties',
      'Rotate crops',
      'Avoid overhead watering',
      'Clean tools regularly',
      'Dispose of infected material',
    ],
    pesticides: ['Chlorothalonil', 'Mancozeb', 'Copper fungicide'],
    confidence: 92,
    severity: 'medium',
    image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800',
  },
  {
    id: 'disease-2',
    name: 'Powdery Mildew',
    plantType: 'Cucumber',
    description: 'Powdery mildew is a fungal disease that appears as a white powder on leaves, stems, and sometimes fruit.',
    causes: ['Fungal species (various)', 'Warm days and cool nights', 'Poor air circulation', 'High humidity'],
    symptoms: ['White powder on leaves', 'Leaf distortion', 'Premature leaf drop', 'Reduced fruit quality'],
    remedies: [
      'Spray with neem oil',
      'Improve air circulation',
      'Remove affected leaves',
      'Apply sulfur dust',
      'Reduce humidity',
    ],
    prevention: [
      'Select resistant varieties',
      'Provide adequate spacing',
      'Water at base only',
      'Avoid nitrogen over-fertilization',
    ],
    pesticides: ['Sulfur', 'Potassium bicarbonate', 'Neem oil'],
    confidence: 88,
    severity: 'low',
    image: 'https://images.unsplash.com/photo-1626202378886-4bd892f535d7?w=800',
  },
  {
    id: 'disease-3',
    name: 'Late Blight',
    plantType: 'Potato',
    description: 'Late blight is the most serious disease of potato worldwide and is caused by the oomycete Phytophthora infestans.',
    causes: ['Phytophthora infestans', 'Cool wet weather', 'High humidity', 'Dense foliage'],
    symptoms: ['Water-soaked spots on leaves', 'White mold on leaf undersides', 'Blackening of stems', 'Tuber rot'],
    remedies: [
      'Remove infected plants',
      'Destroy infected tubers',
      'Apply fungicide spray',
      'Improve drainage',
      'Ensure air circulation',
    ],
    prevention: [
      'Use resistant varieties',
      'Practice crop rotation',
      'Use healthy seed',
      'Maintain good drainage',
      'Scout regularly',
    ],
    pesticides: ['Metalaxyl', 'Mancozeb', 'Chlorothalonil'],
    confidence: 91,
    severity: 'critical',
    image: 'https://images.unsplash.com/photo-1612528443702-f6741f1a144c?w=800',
  },
];

export const mockAdminUsers = [
  {
    id: 'user-1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'user',
    joinDate: '2024-01-15',
    scans: 156,
    status: 'active',
    accountStatus: 'verified',
    lastScanTime: '2024-05-10 14:30',
    scanStatus: 'completed',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  },
  {
    id: 'user-2',
    name: 'Mike Chen',
    email: 'mike@example.com',
    role: 'user',
    joinDate: '2024-02-20',
    scans: 89,
    status: 'active',
    accountStatus: 'verified',
    lastScanTime: '2024-05-10 12:15',
    scanStatus: 'completed',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
  },
  {
    id: 'user-3',
    name: 'Emily Rodriguez',
    email: 'emily@example.com',
    role: 'admin',
    joinDate: '2023-12-10',
    scans: 342,
    status: 'active',
    accountStatus: 'verified',
    lastScanTime: '2024-05-10 16:45',
    scanStatus: 'completed',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
  },
  {
    id: 'user-4',
    name: 'James Wilson',
    email: 'james@example.com',
    role: 'user',
    joinDate: '2024-03-05',
    scans: 45,
    status: 'inactive',
    accountStatus: 'pending',
    lastScanTime: '2024-04-28 10:20',
    scanStatus: 'completed',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
  },
  {
    id: 'user-5',
    name: 'Lisa Park',
    email: 'lisa@example.com',
    role: 'user',
    joinDate: '2024-04-12',
    scans: 78,
    status: 'active',
    accountStatus: 'verified',
    lastScanTime: '2024-05-09 15:00',
    scanStatus: 'completed',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
  },
];

export const mockActivityLog = [
  {
    id: 'log-1',
    user: 'Sarah Johnson',
    action: 'Completed disease scan',
    timestamp: '2024-05-10 14:30',
    icon: 'scan',
  },
  {
    id: 'log-2',
    user: 'Mike Chen',
    action: 'Uploaded plant image',
    timestamp: '2024-05-10 13:15',
    icon: 'upload',
  },
  {
    id: 'log-3',
    user: 'Emily Rodriguez',
    action: 'Updated disease database',
    timestamp: '2024-05-10 11:45',
    icon: 'database',
  },
  {
    id: 'log-4',
    user: 'James Wilson',
    action: 'Downloaded report',
    timestamp: '2024-05-10 10:20',
    icon: 'download',
  },
  {
    id: 'log-5',
    user: 'Lisa Park',
    action: 'Scheduled scanning session',
    timestamp: '2024-05-09 16:30',
    icon: 'calendar',
  },
];

export const mockOnboardingSteps = [
  {
    step: 1,
    title: 'Upload Plant Image',
    description: 'Take a photo of your plant or upload from your device. Our AI will analyze the image.',
    icon: 'Camera',
  },
  {
    step: 2,
    title: 'Enter Plant Symptoms',
    description: 'Describe symptoms you notice: discoloration, spots, wilting, or other issues.',
    icon: 'ClipboardList',
  },
  {
    step: 3,
    title: 'Live Camera Detection',
    description: 'Real-time disease detection using your device camera for instant results.',
    icon: 'Video',
  },
  {
    step: 4,
    title: 'Get Disease Result',
    description: 'Receive detailed analysis with disease name, causes, and confidence level.',
    icon: 'CheckCircle2',
  },
  {
    step: 5,
    title: 'View Remedies',
    description: 'Get personalized treatment recommendations and prevention tips from experts.',
    icon: 'Leaf',
  },
];

export const mockAdminStats = {
  totalUsers: 1245,
  activeUsers: 892,
  totalScans: 15640,
  apiCalls: 234567,
  systemUptime: 99.98,
  avgResponseTime: 245,
};

export const mockNotifications = [
  {
    id: 'notif-1',
    title: 'New Disease Detected',
    message: 'A new plant disease case was detected in your region',
    timestamp: '2024-05-10 14:30',
    read: false,
    type: 'alert',
  },
  {
    id: 'notif-2',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on May 15 from 2-4 PM',
    timestamp: '2024-05-10 10:00',
    read: false,
    type: 'info',
  },
  {
    id: 'notif-3',
    title: 'Premium Feature Available',
    message: 'Try our new advanced analytics feature',
    timestamp: '2024-05-09 16:20',
    read: true,
    type: 'feature',
  },
];

export const mockScanResult = {
  id: 'result-1',
  imagePath: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=1000',
  diseaseName: 'Early Blight',
  confidence: 92,
  severity: 'medium',
  causes: [
    'High humidity and warm temperatures',
    'Poor air circulation',
    'Overhead watering',
    'Fungal pathogen presence',
  ],
  remedies: [
    'Remove infected leaves immediately',
    'Improve air circulation around plants',
    'Water at base of plants, avoiding foliage',
    'Apply appropriate fungicide',
    'Mulch soil to prevent spores',
  ],
  fertilizers: [
    'Balanced NPK (10-10-10)',
    'Potassium-rich fertilizer for plant resistance',
    'Calcium supplement to strengthen leaves',
  ],
  prevention: [
    'Plant resistant tomato varieties',
    'Practice crop rotation (3-year rotation)',
    'Sterilize tools between plants',
    'Remove lower branches for better airflow',
    'Monitor plants regularly for early signs',
  ],
  timeline: '14-21 days to see improvement with treatment',
};

export const mockSymptoms = [
  { id: 'symptom-1', name: 'Yellow Leaves', category: 'color' },
  { id: 'symptom-2', name: 'Brown Spots', category: 'spots' },
  { id: 'symptom-3', name: 'Wilting', category: 'condition' },
  { id: 'symptom-4', name: 'White Powder', category: 'coating' },
  { id: 'symptom-5', name: 'Leaf Curling', category: 'deformation' },
  { id: 'symptom-6', name: 'Stem Rot', category: 'rot' },
  { id: 'symptom-7', name: 'Holes in Leaves', category: 'damage' },
  { id: 'symptom-8', name: 'Stunted Growth', category: 'growth' },
];

export const mockAgentCards = [
  {
    id: 'agent-1',
    title: 'Image Upload Detection',
    description: 'Upload a photo of your plant to instantly detect diseases using advanced AI analysis.',
    icon: 'Upload',
    features: ['Drag & drop upload', 'Multiple format support', 'Instant analysis', '95%+ accuracy'],
  },
  {
    id: 'agent-2',
    title: 'Symptom-Based Detection',
    description: 'Describe your plant symptoms and let our AI identify the disease and provide remedies.',
    icon: 'Stethoscope',
    features: ['Text-based input', 'Multi-symptom analysis', 'AI chat interface', 'Detailed diagnosis'],
  },
  {
    id: 'agent-3',
    title: 'Live Camera Detection',
    description: 'Real-time disease detection using your device camera for on-the-field analysis.',
    icon: 'Video',
    features: ['Real-time scanning', 'Live preview', 'Bounding box detection', 'Field-ready'],
  },
];

// Disease DB Scan Records
export const mockScanRecords = [
  {
    id: 'scan-record-1',
    userId: 'user-1',
    userName: 'Sarah Johnson',
    imagePreview: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400',
    diseaseName: 'Early Blight',
    confidence: 92,
    severity: 'medium',
    scanMethod: 'Image Upload',
    scanDateTime: '2024-05-10 14:30',
    status: 'completed',
  },
  {
    id: 'scan-record-2',
    userId: 'user-2',
    userName: 'Mike Chen',
    imagePreview: 'https://images.unsplash.com/photo-1626202378886-4bd892f535d7?w=400',
    diseaseName: 'Powdery Mildew',
    confidence: 88,
    severity: 'low',
    scanMethod: 'Symptoms Analysis',
    scanDateTime: '2024-05-10 12:15',
    status: 'completed',
  },
  {
    id: 'scan-record-3',
    userId: 'user-5',
    userName: 'Lisa Park',
    imagePreview: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400',
    diseaseName: 'Healthy',
    confidence: 96,
    severity: 'none',
    scanMethod: 'Live Camera',
    scanDateTime: '2024-05-10 11:00',
    status: 'completed',
  },
  {
    id: 'scan-record-4',
    userId: 'user-3',
    userName: 'Emily Rodriguez',
    imagePreview: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400',
    diseaseName: 'Apple Scab',
    confidence: 85,
    severity: 'high',
    scanMethod: 'Image Upload',
    scanDateTime: '2024-05-10 09:45',
    status: 'completed',
  },
  {
    id: 'scan-record-5',
    userId: 'user-1',
    userName: 'Sarah Johnson',
    imagePreview: 'https://images.unsplash.com/photo-1612528443702-f6741f1a144c?w=400',
    diseaseName: 'Late Blight',
    confidence: 91,
    severity: 'critical',
    scanMethod: 'Image Upload',
    scanDateTime: '2024-05-09 15:00',
    status: 'completed',
  },
  {
    id: 'scan-record-6',
    userId: 'user-4',
    userName: 'James Wilson',
    imagePreview: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
    diseaseName: 'Leaf Spot',
    confidence: 87,
    severity: 'medium',
    scanMethod: 'Symptoms Analysis',
    scanDateTime: '2024-05-09 10:30',
    status: 'processing',
  },
  {
    id: 'scan-record-7',
    userId: 'user-2',
    userName: 'Mike Chen',
    imagePreview: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
    diseaseName: 'Rust',
    confidence: 83,
    severity: 'medium',
    scanMethod: 'Live Camera',
    scanDateTime: '2024-05-08 14:20',
    status: 'completed',
  },
  {
    id: 'scan-record-8',
    userId: 'user-5',
    userName: 'Lisa Park',
    imagePreview: 'https://images.unsplash.com/photo-1542001498-f28b0aaced96?w=400',
    diseaseName: 'Unknown Disease',
    confidence: 45,
    severity: 'none',
    scanMethod: 'Image Upload',
    scanDateTime: '2024-05-08 11:15',
    status: 'failed',
  },
];

// Admin Dashboard Analytics
export const mockDiseaseDBAnalytics = {
  totalUploadedImages: 8943,
  mostCommonDisease: 'Powdery Mildew',
  liveScansTodayCount: 45,
  detectionAccuracy: 92.5,
  activeUsersNow: 156,
};
\n`\n\n\n### File: .\frontend\src\hooks\useAuth.js\n\n`javascript\nimport { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
\n`\n\n\n### File: .\frontend\src\layouts\AdminLayout.jsx\n\n`javascript\nimport React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar, Sidebar } from '../components/common';
import { containerVariants, itemVariants } from '../animations/variants';
import { motion } from 'framer-motion';

import { useAuth } from '../hooks/useAuth';

const AdminLayout = ({ user: propUser, onLogout }) => {
  const navigate = useNavigate();
  const { user: authUser, admin: authAdmin, logout } = useAuth();

  const currentUser = propUser || authUser || authAdmin;

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
      navigate('/role-select');
    }
  };

  // Fallback dashboard view
  const showDefaultDashboard = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar user={currentUser} onLogout={handleLogout} userRole="admin" />

      <div className="flex pt-16">
        <Sidebar userRole="admin" onLogout={handleLogout} />

        <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
\n`\n\n\n### File: .\frontend\src\pages\Admin.jsx\n\n`javascript\nimport React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar, Sidebar } from '../components/common';
import { StatCard, Chart } from '../components/dashboard';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  Users,
  TrendingUp,
  Zap,
  Activity,
  Search,
  MoreVertical,
  Trash2,
  Edit,
} from 'lucide-react';
import { mockAdminStats, mockAdminUsers, mockActivityLog, mockChartData, mockScanRecords, mockDiseaseDBAnalytics } from '../data/mockData';
import { containerVariants, itemVariants } from '../animations/variants';
import UserManagementTable from '../components/admin/UserManagementTable';
import DiseaseDBTable from '../components/admin/DiseaseDBTable';
import DiseaseDBAnalytics from '../components/admin/DiseaseDBAnalytics';
import ActivityTimeline from '../components/admin/ActivityTimeline';

const Admin = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'overview', label: 'Dashboard' },
    { id: 'users', label: 'User Management' },
    { id: 'disease-db', label: 'Disease DB' },
    { id: 'reports', label: 'Reports' },
    { id: 'activity', label: 'Activity Log' },
  ];

  const filteredUsers = mockAdminUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar user={user} onLogout={onLogout} />

      <div className="flex pt-16">
        <Sidebar userRole="admin" onLogout={onLogout} />

        <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-slate-400">Manage your PlantAI system</p>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={itemVariants} className="flex gap-4 mb-8 border-b border-slate-800 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-semibold border-b-2 transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </motion.div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard
                    icon={Users}
                    label="Total Users"
                    value={mockAdminStats.totalUsers}
                    trend="+45 this month"
                    color="emerald"
                  />
                  <StatCard
                    icon={Activity}
                    label="Active Users"
                    value={mockAdminStats.activeUsers}
                    trend="+12 today"
                    color="blue"
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="Total Scans"
                    value={mockAdminStats.totalScans}
                    trend="+2.3K this month"
                    color="purple"
                  />
                  <StatCard
                    icon={Zap}
                    label="System Uptime"
                    value={`${mockAdminStats.systemUptime}%`}
                    trend="All systems green"
                    color="amber"
                  />
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                  <Chart
                    type="bar"
                    data={mockChartData.scansPerDay}
                    title="Scans This Week"
                  />
                  <Chart
                    type="pie"
                    data={mockChartData.diseaseDistribution}
                    title="Disease Distribution"
                  />
                </div>

                {/* System Status */}
                <motion.div variants={itemVariants}>
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-6">System Status</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-slate-400 mb-2">API Response Time</p>
                        <div className="flex items-end gap-2">
                          <p className="text-3xl font-bold">{mockAdminStats.avgResponseTime}ms</p>
                          <span className="text-emerald-400 text-sm mb-1">Optimal</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-2">Total API Calls</p>
                        <p className="text-3xl font-bold">{mockAdminStats.apiCalls.toLocaleString()}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <UserManagementTable users={mockAdminUsers} mockScans={mockScanRecords} />
              </motion.div>
            )}

            {/* Disease DB Tab */}
            {activeTab === 'disease-db' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants} className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">Disease Detection Database</h2>
                </motion.div>

                <DiseaseDBAnalytics data={mockDiseaseDBAnalytics} />

                <motion.div variants={itemVariants} className="mb-6">
                  <h3 className="text-xl font-semibold mb-4">Scan Records</h3>
                </motion.div>

                <DiseaseDBTable scanRecords={mockScanRecords} />
              </motion.div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}>
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
                    <ActivityTimeline activityLog={mockActivityLog} />
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div variants={itemVariants}>
                    <Card className="p-6">
                      <h3 className="text-xl font-bold mb-4">Generate Reports</h3>
                      <div className="space-y-3">
                        <Button variant="secondary" className="w-full">
                          User Analytics Report
                        </Button>
                        <Button variant="secondary" className="w-full">
                          Disease Detection Report
                        </Button>
                        <Button variant="secondary" className="w-full">
                          System Performance Report
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <Card className="p-6">
                      <h3 className="text-xl font-bold mb-4">Recent Reports</h3>
                      <div className="space-y-3 text-slate-300">
                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                          <span>Monthly Analytics</span>
                          <span className="text-sm text-slate-500">May 10</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                          <span>System Health Check</span>
                          <span className="text-sm text-slate-500">May 8</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                          <span>User Growth Analysis</span>
                          <span className="text-sm text-slate-500">May 5</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
\n`\n\n\n### File: .\frontend\src\pages\AdminActivityLog.jsx\n\n`javascript\nimport React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { containerVariants, itemVariants } from '../animations/variants';
import { mockActivityLog } from '../data/mockData';
import * as authService from '../utils/authService';
import { Activity, ScanLine, Upload, Database, Download, Calendar } from 'lucide-react';

const getIcon = (iconName) => {
  const icons = { scan: ScanLine, upload: Upload, database: Database, download: Download, calendar: Calendar };
  return icons[iconName] || Activity;
};

const AdminActivityLog = () => {
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        setLoading(true);
        const response = await authService.getActivityLog(1, 50);
        if (response.success && response.logs && response.logs.length > 0) {
          setActivityLog(response.logs.map(log => ({
            id: log._id,
            user: log.userId?.name || 'System',
            action: log.description || log.action,
            timestamp: new Date(log.createdAt).toLocaleString(),
            status: log.status,
            icon: log.action || 'scan'
          })));
        } else {
          setActivityLog(mockActivityLog);
        }
      } catch (err) {
        console.error('Failed to load activity log:', err);
        setActivityLog(mockActivityLog);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Activity Log</h2>
        <p className="text-slate-400">Monitor system activities and user actions</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3" />
              <span className="text-slate-400">Loading activity log...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {activityLog.map((log, index) => {
                const Icon = getIcon(log.icon);
                return (
                  <motion.div
                    key={log.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 hover:border-emerald-500/20 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{log.action}</p>
                      <p className="text-slate-400 text-sm">by {log.user}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-500 mb-1">{log.timestamp}</p>
                      {log.status && (
                        <Badge variant={log.status === 'success' ? 'success' : 'warning'} size="sm">
                          {log.status}
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {activityLog.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  No activity logged yet
                </div>
              )}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminActivityLog;
\n`\n\n\n### File: .\frontend\src\pages\AdminDashboard.jsx\n\n`javascript\nimport React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StatCard, Chart } from '../components/dashboard';
import Card from '../components/common/Card';
import { Users, Activity, TrendingUp, Zap } from 'lucide-react';
import { mockAdminStats, mockChartData } from '../data/mockData';
import { containerVariants, itemVariants } from '../animations/variants';
import * as authService from '../utils/authService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalScans: 0,
    accuracy: 0,
    avgResponseTime: 120,
    apiCalls: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await authService.getAdminStats();
        if (response.success && response.stats) {
          setStats({
            totalUsers: response.stats.totalUsers || 0,
            activeUsers: response.stats.activeUsersToday || 0,
            totalScans: response.stats.totalDetections || 0,
            accuracy: Math.round(response.stats.averageConfidence || 0),
            avgResponseTime: 85,
            apiCalls: response.stats.totalDetections * 3 + 120, // Simulated scale
          });
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Manage your PlantAI system</p>
      </motion.div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 text-center text-slate-400 animate-pulse">
              Loading metrics...
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers}
            trend="+15% this month"
            color="emerald"
          />
          <StatCard
            icon={Activity}
            label="Active Users Today"
            value={stats.activeUsers}
            trend="+4 since last hour"
            color="blue"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Scans"
            value={stats.totalScans}
            trend="+12% weekly growth"
            color="purple"
          />
          <StatCard
            icon={Zap}
            label="AI Accuracy"
            value={`${stats.accuracy}%`}
            trend="All models active"
            color="amber"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Chart type="bar" data={mockChartData.scansPerDay} title="Scans This Week" />
        <Chart
          type="pie"
          data={mockChartData.diseaseDistribution}
          title="Disease Distribution"
        />
      </div>

      {/* System Status */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">System Status</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-slate-400 mb-2">API Response Time</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold">{stats.avgResponseTime}ms</p>
                <span className="text-emerald-400 text-sm mb-1">Optimal</span>
              </div>
            </div>
            <div>
              <p className="text-slate-400 mb-2">Total API Calls</p>
              <p className="text-3xl font-bold">{stats.apiCalls.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
\n`\n\n\n### File: .\frontend\src\pages\AdminDiseaseDB.jsx\n\n`javascript\nimport React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { containerVariants, itemVariants } from '../animations/variants';
import { mockScanRecords, mockDiseaseDBAnalytics } from '../data/mockData';
import DiseaseDBTable from '../components/admin/DiseaseDBTable';
import DiseaseDBAnalytics from '../components/admin/DiseaseDBAnalytics';
import axios from 'axios';

const AdminDiseaseDB = () => {
  const [scanRecords, setScanRecords] = useState([]);
  const [analytics, setAnalytics] = useState(mockDiseaseDBAnalytics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetections = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const authHeader = axios.defaults.headers.common['Authorization'] || 
          (localStorage.getItem('authToken') ? `Bearer ${localStorage.getItem('authToken')}` : '');
        const response = await axios.get('/api/detect/', {
          params: { page: 1, limit: 100 },
          headers: authHeader ? { Authorization: authHeader } : {}
        });

        if (response.data.success && response.data.detections && response.data.detections.length > 0) {
          const mapped = response.data.detections.map(d => ({
            id: d._id,
            userId: d.userId,
            userName: d.userId || 'Unknown User',
            imagePreview: d.image
              ? `/uploads/${d.image.split(/[\\/]/).pop()}`
              : `https://via.placeholder.com/400x300?text=${encodeURIComponent(d.plant || 'Plant')}`,
            diseaseName: d.disease || 'Unknown',
            confidence: d.confidence || 0,
            severity: d.status === 'Healthy' ? 'none' : d.confidence > 90 ? 'critical' : d.confidence > 75 ? 'high' : 'medium',
            scanMethod: 'Image Upload',
            scanDateTime: new Date(d.createdAt).toLocaleString(),
            status: 'completed'
          }));
          setScanRecords(mapped);

          // Compute analytics from real data
          const total = mapped.length;
          const healthyCount = mapped.filter(r => r.diseaseName?.toLowerCase().includes('healthy')).length;
          const avgConf = total > 0 ? (mapped.reduce((s, r) => s + r.confidence, 0) / total).toFixed(1) : 0;
          const diseaseCounts = {};
          mapped.forEach(r => { diseaseCounts[r.diseaseName] = (diseaseCounts[r.diseaseName] || 0) + 1; });
          const mostCommon = Object.entries(diseaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

          setAnalytics({
            totalUploadedImages: total,
            mostCommonDisease: mostCommon,
            liveScansTodayCount: mapped.filter(r => {
              const today = new Date().toDateString();
              return new Date(r.scanDateTime).toDateString() === today;
            }).length,
            detectionAccuracy: parseFloat(avgConf),
            activeUsersNow: new Set(mapped.map(r => r.userId)).size,
          });
        } else {
          setScanRecords(mockScanRecords);
        }
      } catch (err) {
        console.error('Failed to load detections:', err);
        setScanRecords(mockScanRecords);
      } finally {
        setLoading(false);
      }
    };
    fetchDetections();
  }, []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Disease Detection Database</h2>
        <p className="text-slate-400">Manage and analyze all platform disease scan records</p>
      </motion.div>

      <DiseaseDBAnalytics data={analytics} />

      <motion.div variants={itemVariants} className="mb-6">
        <h3 className="text-xl font-semibold">
          Scan Records {loading && <span className="text-sm text-slate-500 ml-2 animate-pulse">Loading...</span>}
        </h3>
      </motion.div>

      <DiseaseDBTable scanRecords={scanRecords} />
    </motion.div>
  );
};

export default AdminDiseaseDB;
\n`\n\n\n### File: .\frontend\src\pages\AdminReports.jsx\n\n`javascript\nimport React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { containerVariants, itemVariants } from '../animations/variants';
import { Download, FileText, BarChart3, Activity, RefreshCw, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const AdminReports = () => {
  const [recentReports, setRecentReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authHeader = axios.defaults.headers.common['Authorization'] || 
      (localStorage.getItem('authToken') ? `Bearer ${localStorage.getItem('authToken')}` : '');
    axios.get('/api/detect/stats/system', {
      headers: authHeader ? { Authorization: authHeader } : {}
    }).then(res => {
      if (res.data.success) setStats(res.data.stats);
    }).catch(() => {});

    setRecentReports([
      { name: 'Platform Scan History (Realtime)', type: 'realtime', format: 'csv' },
      { name: 'Platform Scan History (Realtime)', type: 'realtime', format: 'xlsx' },
      { name: 'Platform Scan History (Upload)', type: 'upload', format: 'csv' },
      { name: 'Platform Scan History (Upload)', type: 'upload', format: 'xlsx' },
    ]);
  }, []);

  const downloadReport = async (type, format) => {
    const authHeader = axios.defaults.headers.common['Authorization'] || 
      (localStorage.getItem('authToken') ? `Bearer ${localStorage.getItem('authToken')}` : '');
    const url = `/api/detect/download/${type}/${format === 'xlsx' ? 'excel' : 'csv'}`;
    try {
      const link = document.createElement('a');
      // Add auth header via fetch then blob
      const response = await fetch(url, {
        headers: authHeader ? { Authorization: authHeader } : {}
      });
      if (!response.ok) {
        toast.error('No scan data yet. Complete a scan first!');
        return;
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      link.setAttribute('download', `agrosentry_${type}_history.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success(`Downloaded ${type} history as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Download failed. Make sure a scan has been completed.');
    }
  };

  const reportButtons = [
    { label: 'Live Camera Scan History (CSV)', type: 'realtime', format: 'csv', icon: Activity, color: 'emerald' },
    { label: 'Live Camera Scan History (Excel)', type: 'realtime', format: 'xlsx', icon: FileText, color: 'emerald' },
    { label: 'Image Upload Scan History (CSV)', type: 'upload', format: 'csv', icon: BarChart3, color: 'blue' },
    { label: 'Image Upload Scan History (Excel)', type: 'upload', format: 'xlsx', icon: Download, color: 'blue' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Reports & Analytics</h2>
        <p className="text-slate-400">Generate, export and manage system scan reports</p>
      </motion.div>

      {/* Live System Stats */}
      {stats && (
        <motion.div variants={itemVariants} className="mb-8">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Live System Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-3xl font-black text-emerald-400">{stats.totalDetections || 0}</p>
                <p className="text-slate-400 text-sm mt-1">Total Scans</p>
              </div>
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                <p className="text-3xl font-black text-green-400">{stats.healthyCount || 0}</p>
                <p className="text-slate-400 text-sm mt-1">Healthy Plants</p>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <p className="text-3xl font-black text-red-400">{stats.diseasedCount || 0}</p>
                <p className="text-slate-400 text-sm mt-1">Diseased Plants</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <p className="text-3xl font-black text-blue-400">{Math.round(stats.averageConfidence || 0)}%</p>
                <p className="text-slate-400 text-sm mt-1">Avg. AI Confidence</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Download Reports */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              Download Reports
            </h3>
            <div className="space-y-3">
              {reportButtons.map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={`${btn.type}-${btn.format}`}
                    onClick={() => downloadReport(btn.type, btn.format)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-emerald-500/40 hover:bg-slate-800 text-white transition-all text-sm font-semibold text-left"
                  >
                    <Icon className={`w-5 h-5 text-${btn.color}-400 flex-shrink-0`} />
                    <span className="flex-1">{btn.label}</span>
                    <Download className="w-4 h-4 text-slate-500" />
                  </button>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Analytics Portal */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Advanced Analytics Portal
            </h3>
            <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-lime-500/5 border border-emerald-500/20 mb-4">
              <p className="text-slate-300 mb-4 text-sm leading-relaxed">
                Access the full Streamlit Advanced AI Analytics Dashboard for in-depth pathology curves, disease distribution charts, and prediction confidence histograms.
              </p>
              <a
                href="http://localhost:8501"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-bold text-sm hover:opacity-90 transition w-full justify-center"
              >
                <ExternalLink className="w-4 h-4" />
                Open Streamlit Analytics
              </a>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Realtime Scan History (CSV)', date: 'Auto-updated' },
                { name: 'Realtime Scan History (Excel)', date: 'Auto-updated' },
                { name: 'Upload Scan History (CSV)', date: 'Auto-updated' },
                { name: 'Upload Scan History (Excel)', date: 'Auto-updated' },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-800">
                  <span className="text-slate-300 text-sm">{r.name}</span>
                  <Badge variant="success" size="sm">{r.date}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminReports;
\n`\n\n\n### File: .\frontend\src\pages\AdminSettings.jsx\n\n`javascript\nimport React from 'react';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { containerVariants, itemVariants } from '../animations/variants';
import { Settings as SettingsIcon, Save, RotateCcw } from 'lucide-react';

const AdminSettings = () => {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-3xl font-bold mb-2">System Settings</h2>
        <p className="text-slate-400">Configure system preferences and options</p>
      </motion.div>

      <div className="space-y-6 max-w-2xl">
        {/* System Configuration */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-emerald-400" />
              System Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  System Name
                </label>
                <input
                  type="text"
                  defaultValue="PlantAI"
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  API Endpoint
                </label>
                <input
                  type="text"
                  defaultValue="https://api.plantai.com"
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Feature Toggles */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Feature Toggles</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-white">Image Upload Detection</span>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-white">Symptom Analysis</span>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-white">Live Camera Detection</span>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-white">Analytics Dashboard</span>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminSettings;
\n`\n\n\n### File: .\frontend\src\pages\AdminUsers.jsx\n\n`javascript\nimport React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import { containerVariants, itemVariants } from '../animations/variants';
import UserManagementTable from '../components/admin/UserManagementTable';
import * as authService from '../utils/authService';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authService.getAllUsers(1, 100);
      if (response.success && response.users) {
        // Map backend schema to table expectations if needed
        setUsers(response.users.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.isActive ? 'Active' : 'Inactive',
          joined: new Date(u.createdAt).toLocaleDateString(),
          scans: u.scansCount || 0
        })));
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-3xl font-bold mb-2">User Management</h2>
        <p className="text-slate-400">Manage and monitor all system users</p>
      </motion.div>

      {loading ? (
        <Card className="p-8 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          Loading users from database...
        </Card>
      ) : (
        <UserManagementTable users={users} onRefresh={fetchUsers} />
      )}
    </motion.div>
  );
};

export default AdminUsers;
\n`\n\n\n### File: .\frontend\src\pages\Dashboard.jsx\n\n`javascript\nimport React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Sidebar, Navbar } from '../components/common';
import { StatCard, Chart, RecentScans, ImageUploadAgent, SymptomBasedAgent, LiveCameraAgent } from '../components/dashboard';
import SkeletonLoader from '../components/common/SkeletonLoader';
import {
  Activity,
  TrendingUp,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { mockDashboardStats, mockChartData, mockRecentScans } from '../data/mockData';
import { containerVariants } from '../animations/variants';
import { useAuth } from '../hooks/useAuth';
import * as authService from '../utils/authService';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(mockDashboardStats);
  const [detections, setDetections] = useState(mockRecentScans);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Fetch system stats
      const statsResponse = await authService.getSystemStats();
      if (statsResponse.success && statsResponse.stats) {
        setStats({
          totalScans: statsResponse.stats.totalDetections || 0,
          healthyPlants: statsResponse.stats.healthyCount || 0,
          diseasedPlants: statsResponse.stats.diseasedCount || 0,
          accuracy: Math.round(statsResponse.stats.averageConfidence || 0),
        });
      }

      // Fetch recent detections
      const detectionsResponse = await authService.getDetections(1, 5);
      if (detectionsResponse.success && detectionsResponse.detections) {
        setDetections(
          detectionsResponse.detections.map((d) => ({
            id: d._id,
            plantName: d.plant,
            disease: d.disease,
            date: new Date(d.createdAt).toLocaleString(),
            confidence: d.confidence,
            severity: d.status === 'Healthy' ? 'none' : 'high',
            image: d.image ? `http://localhost:5000/${d.image.replace(/\\/g, '/')}` : `https://via.placeholder.com/400x300?text=${d.plant}`,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Logout failed');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <Navbar onLogout={handleLogout} userRole="user" />

      {/* Main Layout */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <Sidebar userRole="user" onLogout={handleLogout} />

        {/* Content */}
        <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto"
          >
            {/* Header */}
            <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {user?.name}!</h1>
                <p className="text-slate-400">Here's what's happening with your plants today</p>
              </div>
              <a
                href="http://localhost:8501"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-lime-500/10 border border-emerald-500/30 text-emerald-300 hover:text-emerald-100 hover:border-emerald-400/50 transition text-sm font-semibold whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Streamlit Analytics
              </a>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-300">
                {error}
              </div>
            )}

            {/* Stats Grid */}
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonLoader key={i} height={150} />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  icon={Activity}
                  label="Total Scans"
                  value={stats.totalScans}
                  trend="+12% this month"
                  color="emerald"
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Healthy Plants"
                  value={stats.healthyPlants}
                  trend="+8 this week"
                  color="blue"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Diseased Plants"
                  value={stats.diseasedPlants}
                  trend="-3 this week"
                  color="purple"
                />
                <StatCard
                  icon={Zap}
                  label="Accuracy"
                  value={`${stats.accuracy}%`}
                  trend="+2.5% improvement"
                  color="amber"
                />
              </div>
            )}

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <Chart
                type="bar"
                data={mockChartData.scansPerDay}
                title="Scans This Week"
              />
              <Chart
                type="line"
                data={mockChartData.accuracyTrend}
                title="Accuracy Trend"
                height={300}
              />
            </div>

            {/* Recent Scans */}
            <div className="mb-8">
              <RecentScans scans={loading ? [] : detections.slice(0, 3)} />
            </div>

            {/* AI Agents Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Disease Detection Agents</h2>
              <div className="space-y-8">
                <ImageUploadAgent onScanComplete={fetchDashboardData} />
                <SymptomBasedAgent onScanComplete={fetchDashboardData} />
                <LiveCameraAgent onScanComplete={fetchDashboardData} />
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
\n`\n\n\n### File: .\frontend\src\pages\Disease.jsx\n\n`javascript\nimport React from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar, Sidebar } from '../components/common';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { mockDiseases } from '../data/mockData';
import {
  ArrowLeft,
  Share2,
  Download,
  AlertCircle,
  CheckCircle2,
  Droplet,
  Shield,
  BookOpen,
} from 'lucide-react';
import { containerVariants, itemVariants } from '../animations/variants';

const DiseaseDetails = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const disease = mockDiseases[0]; // Using first disease for demo
  const [activeTab, setActiveTab] = React.useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'treatment', label: 'Treatment', icon: Droplet },
    { id: 'prevention', label: 'Prevention', icon: Shield },
  ];

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'danger',
      critical: 'danger',
    };
    return colors[severity] || 'default';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar user={user} onLogout={onLogout} userRole="user" />

      <div className="flex pt-16">
        <Sidebar userRole="user" onLogout={onLogout} />

        <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto"
          >
            {/* Back Button */}
            <motion.button
              variants={itemVariants}
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 mb-8 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </motion.button>

            {/* Header Card */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden mb-8">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={disease.image}
                    alt={disease.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                </div>
                <div className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Badge variant={getSeverityColor(disease.severity)} size="lg" className="mb-4">
                        {disease.severity.toUpperCase()}
                      </Badge>
                      <h1 className="text-4xl font-bold">{disease.name}</h1>
                      <p className="text-slate-400 mt-2">Affects: {disease.plantType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Detection Confidence</p>
                      <p className="text-3xl font-bold text-emerald-400">{disease.confidence}%</p>
                    </div>
                  </div>
                  <p className="text-slate-300 text-lg">{disease.description}</p>
                  <div className="flex gap-3 mt-6">
                    <Button variant="secondary" size="sm">
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    <Button variant="secondary" size="sm">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={itemVariants} className="flex gap-4 mb-8 border-b border-slate-800">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 font-semibold flex items-center gap-2 border-b-2 transition ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </motion.div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                {/* Causes */}
                <motion.div variants={itemVariants}>
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-amber-400" />
                      Causes
                    </h2>
                    <ul className="space-y-2">
                      {disease.causes.map((cause, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-300">
                          <span className="text-emerald-400 font-bold mt-1">•</span>
                          {cause}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>

                {/* Symptoms */}
                <motion.div variants={itemVariants}>
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-amber-400" />
                      Symptoms
                    </h2>
                    <ul className="space-y-2">
                      {disease.symptoms.map((symptom, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-300">
                          <span className="text-emerald-400 font-bold mt-1">•</span>
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'treatment' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                {/* Remedies */}
                <motion.div variants={itemVariants}>
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      Remedies
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {disease.remedies.map((remedy, i) => (
                        <div key={i} className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                          <p className="text-slate-300">{remedy}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>

                {/* Pesticides */}
                <motion.div variants={itemVariants}>
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <Droplet className="w-6 h-6 text-emerald-400" />
                      Recommended Pesticides
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                      {disease.pesticides.map((pesticide, i) => (
                        <div key={i} className="p-4 rounded-lg bg-slate-800 border border-slate-700">
                          <p className="font-semibold text-white">{pesticide}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'prevention' && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <Shield className="w-6 h-6 text-lime-400" />
                      Prevention Tips
                    </h2>
                    <ul className="space-y-3">
                      {disease.prevention.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                          <span className="text-lime-400 font-bold mt-1">✓</span>
                          <span className="text-slate-300">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DiseaseDetails;
\n`\n\n\n### File: .\frontend\src\pages\Landing.jsx\n\n`javascript\nimport React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import {
  Leaf,
  Upload,
  Stethoscope,
  Video,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  Mail,
} from 'lucide-react';
import { containerVariants, itemVariants, floatingVariants } from '../animations/variants';

const Landing = () => {
  const features = [
    {
      icon: Upload,
      title: 'Image Upload Detection',
      description: 'Upload plant photos for instant AI-powered disease detection',
    },
    {
      icon: Stethoscope,
      title: 'Symptom Analysis',
      description: 'Describe symptoms and get detailed diagnosis recommendations',
    },
    {
      icon: Video,
      title: 'Live Camera Scanning',
      description: 'Real-time disease detection directly from your camera',
    },
    {
      icon: TrendingUp,
      title: 'Advanced Analytics',
      description: 'Track plant health and disease trends over time',
    },
    {
      icon: Shield,
      title: 'Expert Recommendations',
      description: 'Get treatment and prevention advice from agriculture experts',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get analysis results in seconds with 95%+ accuracy',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-lime-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navbar />

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              {/* Badge */}
              <motion.div variants={itemVariants} className="mb-6 flex justify-center">
                <div className="px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/50 inline-flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-300">AI-Powered Agriculture</span>
                </div>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                variants={itemVariants}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-lime-300 to-emerald-400 bg-clip-text text-transparent"
              >
                AI Powered Plant Disease Detection System
              </motion.h1>

              {/* Subheading */}
              <motion.p
                variants={itemVariants}
                className="text-xl sm:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto"
              >
                Detect plant diseases using image analysis, symptom analysis, and live camera monitoring.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link to="/role-select">
                  <Button size="lg" className="px-8">
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/role-select">
                  <Button size="lg" variant="outline" className="px-8">
                    Admin Access
                  </Button>
                </Link>
              </motion.div>

              {/* Hero Image/Placeholder */}
              <motion.div
                variants={itemVariants}
                className="relative"
              >
                <motion.div
                  animate={floatingVariants.animate}
                  className="relative w-full h-96 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-lime-400/20 border border-emerald-500/30 overflow-hidden flex items-center justify-center"
                >
                  <Leaf className="w-32 h-32 text-emerald-500/50 animate-pulse" />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">Powerful Features</h2>
              <p className="text-xl text-slate-400">Everything you need to protect your plants</p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={containerVariants}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.div key={feature.title} variants={itemVariants}>
                    <Card className="h-full p-6 text-center">
                      <Icon className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                      <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                      <p className="text-slate-400">{feature.description}</p>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Login Cards Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4">Quick Access</h2>
              <p className="text-xl text-slate-400">Choose your role to get started</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Link to="/role-select">
                  <Card className="p-8 text-center hover:shadow-xl hover:shadow-emerald-500/30">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                      <Leaf className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">User Login</h3>
                    <p className="text-slate-400 mb-6">Access your dashboard and start detecting diseases</p>
                    <Button variant="secondary" className="w-full">
                      Login as User
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Card>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Link to="/role-select">
                  <Card className="p-8 text-center hover:shadow-xl hover:shadow-lime-400/30">
                    <div className="w-16 h-16 rounded-full bg-lime-400/20 flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-lime-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Admin Login</h3>
                    <p className="text-slate-400 mb-6">Manage users, analytics, and system settings</p>
                    <Button variant="secondary" className="w-full">
                      Admin Access
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Card>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Leaf className="w-6 h-6 text-emerald-400" />
                  <span className="font-bold">PlantAI</span>
                </div>
                <p className="text-slate-400">Advanced AI-powered plant disease detection</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="#" className="hover:text-white transition">Features</a></li>
                  <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="#" className="hover:text-white transition">About</a></li>
                  <li><a href="#" className="hover:text-white transition">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Follow</h4>
                <div className="flex gap-4">
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition"><Mail size={20} /></a>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition"><Mail size={20} /></a>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition"><Mail size={20} /></a>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-8 flex justify-between items-center text-slate-400">
              <p>&copy; 2024 PlantAI. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-white transition">Privacy</a>
                <a href="#" className="hover:text-white transition">Terms</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
\n`\n\n\n### File: .\frontend\src\pages\Login.jsx\n\n`javascript\nimport React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Leaf, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { containerVariants, itemVariants } from '../animations/variants';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Login = ({ isAdmin = false }) => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, admin, loading, error, setError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Set role in localStorage so AuthContext knows which endpoint to use
  useEffect(() => {
    localStorage.setItem('userRole', isAdmin ? 'admin' : 'user');
  }, [isAdmin]);

  // Redirect once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (admin) navigate('/admin/dashboard', { replace: true });
      else if (user) navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, admin, navigate]);

  // Clear errors on unmount
  useEffect(() => () => setError(null), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    const result = await login(email.trim(), password, isAdmin ? 'admin' : 'user');
    if (result.success) {
      toast.success('Logged in successfully!');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-lime-400/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        {/* Back button */}
        <motion.div variants={itemVariants} className="mb-6">
          <button
            onClick={() => navigate('/role-select')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Roles
          </button>
        </motion.div>

        {/* Card */}
        <motion.div
          variants={itemVariants}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8"
        >
          {/* Icon + Title */}
          <div className="text-center mb-8">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isAdmin ? 'bg-lime-400/20' : 'bg-emerald-500/20'}`}>
              {isAdmin
                ? <Shield className="w-7 h-7 text-lime-400" />
                : <Leaf className="w-7 h-7 text-emerald-400" />
              }
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {isAdmin ? 'Admin Login' : 'Welcome Back'}
            </h1>
            <p className="text-slate-400 text-sm">
              {isAdmin ? 'Sign in to the admin panel' : 'Sign in to your AgroSentry account'}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={isAdmin ? 'admin@example.com' : 'you@example.com'}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition placeholder-slate-500"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition placeholder-slate-500 pr-11"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg shadow-lg shadow-emerald-500/20 transition duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                isAdmin ? 'Sign In as Admin' : 'Sign In'
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 text-center text-sm text-slate-400">
            {isAdmin ? (
              <p>
                Don't have an account?{' '}
                <Link to="/admin-signup" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                  Register Admin
                </Link>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                  Create account
                </Link>
              </p>
            )}
          </div>

          {/* Demo credentials hint */}
          <div className="mt-5 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">Demo:</span>{' '}
            {isAdmin
              ? 'admin@plantai.com / admin123'
              : 'user@example.com / password123'
            }
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
\n`\n\n\n### File: .\frontend\src\pages\Onboarding.jsx\n\n`javascript\nimport React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { mockOnboardingSteps } from '../data/mockData';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { containerVariants, itemVariants } from '../animations/variants';
import * as Icons from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState(0);

  const currentStepData = mockOnboardingSteps[currentStep];
  const Icon = Icons[currentStepData.icon];

  const handleNext = () => {
    if (currentStep < mockOnboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-3xl"
      >
        {/* Progress Bar */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex gap-2">
            {mockOnboardingSteps.map((_, index) => (
              <motion.div
                key={index}
                animate={{
                  scaleX: index === currentStep ? 1 : 0.5,
                  backgroundColor: index <= currentStep ? '#22c55e' : '#475569',
                }}
                className="flex-1 h-1 rounded-full origin-left"
              />
            ))}
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div variants={itemVariants}>
          <Card className="p-12 text-center">
            {/* Step Number */}
            <div className="text-sm font-semibold text-emerald-400 mb-4">
              Step {currentStep + 1} of {mockOnboardingSteps.length}
            </div>

            {/* Icon */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-6"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/30 to-lime-400/30 flex items-center justify-center mx-auto">
                <Icon className="w-10 h-10 text-emerald-400" />
              </div>
            </motion.div>

            {/* Title & Description */}
            <h1 className="text-4xl font-bold text-white mb-4">{currentStepData.title}</h1>
            <p className="text-xl text-slate-400 mb-12">{currentStepData.description}</p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleNext} size="lg" className="flex-1">
                {currentStep === mockOnboardingSteps.length - 1 ? 'Go To Dashboard' : 'Next'}
              </Button>
              <Button onClick={handleSkip} variant="ghost" size="lg">
                Skip Tutorial
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Step Info Cards */}
        <motion.div
          variants={itemVariants}
          className="mt-12 grid md:grid-cols-5 gap-4"
        >
          {mockOnboardingSteps.map((step, index) => {
            const StepIcon = Icons[step.icon];
            return (
              <motion.div
                key={step.step}
                animate={{
                  scale: index === currentStep ? 1.05 : 1,
                  opacity: index <= currentStep ? 1 : 0.5,
                }}
              >
                <Card
                  className={`p-4 cursor-pointer text-center ${index === currentStep ? 'ring-2 ring-emerald-500' : ''}`}
                  onClick={() => setCurrentStep(index)}
                >
                  <StepIcon className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
\n`\n\n\n### File: .\frontend\src\pages\PageNotFound.jsx\n\n`javascript\nimport React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { AlertTriangle, Home } from 'lucide-react';
import { containerVariants, itemVariants } from '../animations/variants';

const PageNotFound = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center max-w-md"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <AlertTriangle className="w-20 h-20 mx-auto text-red-400 mb-4" />
          <h1 className="text-5xl font-bold mb-2">404</h1>
          <p className="text-slate-400 text-lg">Page Not Found</p>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8">
          <Card className="p-6 bg-slate-900/50">
            <p className="text-slate-300 mb-4">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <p className="text-sm text-slate-500">
              Please check the URL and try again, or go back to the dashboard.
            </p>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link to="/">
            <Button className="flex items-center gap-2 justify-center w-full">
              <Home className="w-4 h-4" />
              Go to Home
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PageNotFound;
\n`\n\n\n### File: .\frontend\src\pages\RoleSelect.jsx\n\n`javascript\nimport React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Shield, ArrowLeft } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { containerVariants, itemVariants } from '../animations/variants';

const RoleSelect = ({ onLoginAdmin }) => {
  const navigate = useNavigate();

  const handleRoleSelect = (role, path) => {
    localStorage.setItem('userRole', role);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-lime-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-4xl"
      >
        {/* Back Button */}
        <motion.div variants={itemVariants} className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </motion.div>

        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Select Your Role</h1>
          <p className="text-xl text-slate-400">Choose how you want to access PlantAI</p>
        </motion.div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* User Role */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -10 }}
          >
            <div onClick={() => handleRoleSelect('user', '/login')} className="cursor-pointer h-full">
              <Card className="p-8 text-center h-full">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <Leaf className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">User</h3>
                <p className="text-slate-400 mb-6">
                  Upload images, analyze symptoms, and get disease detection recommendations in real-time.
                </p>
                <ul className="text-left text-slate-300 space-y-2 mb-8">
                  <li>✓ Image & symptom analysis</li>
                  <li>✓ Live camera detection</li>
                  <li>✓ Treatment recommendations</li>
                  <li>✓ Scan history & analytics</li>
                </ul>
                <Button className="w-full">
                  Continue as User
                </Button>
              </Card>
            </div>
          </motion.div>

          {/* Admin Role */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -10 }}
          >
            <Card className="p-8 text-center h-full flex flex-col">
              <div className="w-16 h-16 rounded-full bg-lime-400/20 flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-lime-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Admin</h3>
              <p className="text-slate-400 mb-6 flex-1">
                Manage users, monitor system analytics, and oversee the entire platform operations.
              </p>
              <ul className="text-left text-slate-300 space-y-2 mb-8">
                <li>✓ User management</li>
                <li>✓ System analytics & reports</li>
                <li>✓ Disease database management</li>
                <li>✓ API & model monitoring</li>
              </ul>
              <div className="space-y-3">
                <Button onClick={() => handleRoleSelect('admin', '/admin-login')} className="w-full">
                  Admin Login
                </Button>
                <Button onClick={() => handleRoleSelect('admin', '/admin-signup')} variant="secondary" className="w-full">
                  Admin Sign Up
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Demo Info */}
        <motion.div
          variants={itemVariants}
          className="mt-12 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-slate-300"
        >
          <p className="font-semibold text-emerald-400 mb-3">Demo Credentials:</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">User Account:</p>
              <p>Email: user@example.com</p>
              <p>Password: password123</p>
            </div>
            <div>
              <p className="font-semibold">Admin Account:</p>
              <p>Email: admin@plantai.com</p>
              <p>Password: admin123</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RoleSelect;
\n`\n\n\n### File: .\frontend\src\pages\Signup.jsx\n\n`javascript\nimport React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Leaf, Shield, Eye, EyeOff, Loader2, User as UserIcon } from 'lucide-react';
import { containerVariants, itemVariants } from '../animations/variants';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Signup = ({ isAdmin = false }) => {
  const navigate = useNavigate();
  const { register, isAuthenticated, user, admin, loading, error, setError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    localStorage.setItem('userRole', isAdmin ? 'admin' : 'user');
  }, [isAdmin]);

  useEffect(() => {
    if (isAuthenticated) {
      if (admin) navigate('/admin/dashboard', { replace: true });
      else if (user) navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, admin, navigate]);

  useEffect(() => () => setError(null), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const result = await register(name.trim(), email.trim(), password, isAdmin ? 'admin' : 'user');
    if (result.success) {
      toast.success('Account created successfully!');
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-lime-400/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        {/* Back button */}
        <motion.div variants={itemVariants} className="mb-6">
          <button
            onClick={() => navigate('/role-select')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Roles
          </button>
        </motion.div>

        {/* Card */}
        <motion.div
          variants={itemVariants}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8"
        >
          {/* Icon + Title */}
          <div className="text-center mb-8">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isAdmin ? 'bg-lime-400/20' : 'bg-emerald-500/20'}`}>
              {isAdmin
                ? <Shield className="w-7 h-7 text-lime-400" />
                : <Leaf className="w-7 h-7 text-emerald-400" />
              }
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {isAdmin ? 'Admin Registration' : 'Create Account'}
            </h1>
            <p className="text-slate-400 text-sm">
              {isAdmin ? 'Register a new admin account' : 'Join AgroSentry today'}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition placeholder-slate-500"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition placeholder-slate-500"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition placeholder-slate-500 pr-11"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition placeholder-slate-500"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg shadow-lg shadow-emerald-500/20 transition duration-300 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                isAdmin ? 'Register Admin' : 'Create Account'
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 text-center text-sm text-slate-400">
            {isAdmin ? (
              <p>
                Already have an account?{' '}
                <Link to="/admin-login" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                  Admin Login
                </Link>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup;
\n`\n\n\n### File: .\frontend\src\routes\Routes.jsx\n\n`javascript\nimport React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import RoleSelect from '../pages/RoleSelect';
import Onboarding from '../pages/Onboarding';
import Dashboard from '../pages/Dashboard';
import Disease from '../pages/Disease';
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/AdminDashboard';
import AdminUsers from '../pages/AdminUsers';
import AdminDiseaseDB from '../pages/AdminDiseaseDB';
import AdminReports from '../pages/AdminReports';
import AdminActivityLog from '../pages/AdminActivityLog';
import AdminSettings from '../pages/AdminSettings';
import PageNotFound from '../pages/PageNotFound';

const AppRoutes = () => {
  const { user, admin, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login/*" element={<Login />} />
      <Route path="/signup/*" element={<Signup />} />
      <Route path="/role-select" element={<RoleSelect />} />
      <Route path="/admin-login/*" element={<Login isAdmin={true} />} />
      <Route path="/admin-signup/*" element={<Signup isAdmin={true} />} />

      {/* User Routes */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requiredRole="user">
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="user">
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/disease/:id"
        element={
          <ProtectedRoute requiredRole="user">
            <Disease />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes with Nested Layout */}
      <Route
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/diseases" element={<AdminDiseaseDB />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/activity-log" element={<AdminActivityLog />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>

      {/* 404 Page Not Found */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default AppRoutes;
\n`\n\n\n### File: .\frontend\src\utils\api.js\n\n`javascript\nimport axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Detection API endpoints
export const detectionAPI = {
  predictDisease: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/detection/predict`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Disease prediction error:', error);
      throw error;
    }
  },

  getDetections: async () => {
    try {
      const response = await apiClient.get('/detection');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch detections:', error);
      throw error;
    }
  },

  getDetectionById: async (id) => {
    try {
      const response = await apiClient.get(`/detection/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch detection ${id}:`, error);
      throw error;
    }
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await axios.get('http://localhost:5000/health');
    return response.status === 200;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
};

export default apiClient;
\n`\n\n\n### File: .\frontend\src\utils\authService.js\n\n`javascript\nimport axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  // Prefer live Clerk token from axios defaults (set by AuthContext on every auth sync)
  // Fall back to localStorage token for backward compatibility
  const liveToken = axios.defaults.headers.common['Authorization'];
  if (liveToken) return { Authorization: liveToken };
  const storedToken = localStorage.getItem('authToken');
  return storedToken ? { Authorization: `Bearer ${storedToken}` } : {};
};

export const registerUser = async (name, email, password, role = 'user') => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      name,
      email,
      password,
      role,
    });
    return response.data;
  } catch (error) {
    console.error('registerUser error:', error.response?.data || error.message);
    throw error;
  }
};

export const loginUser = async (email, password, role = 'user') => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
      role,
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

export const adminLogin = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/login`, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('Admin login error:', error.response?.data || error.message);
    throw error;
  }
};

export const adminRegister = async (name, email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/signup`, {
      name,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('Admin signup error:', error.response?.data || error.message);
    throw error;
  }
};

export const forgotPassword = async (email, role = 'user') => {
  try {
    const endpoint = role === 'admin'
      ? `${API_BASE_URL}/admin/forgot-password`
      : `${API_BASE_URL}/auth/forgot-password`;
    const response = await axios.post(endpoint, { email });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error.response?.data || error.message);
    throw error;
  }
};

export const resetPassword = async (resetToken, newPassword, role = 'user') => {
  try {
    const endpoint = role === 'admin'
      ? `${API_BASE_URL}/admin/reset-password`
      : `${API_BASE_URL}/auth/reset-password`;
    const response = await axios.post(endpoint, { resetToken, newPassword });
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error.response?.data || error.message);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/logout`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProfile = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const refreshAuthToken = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const predictDisease = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await axios.post(`${API_BASE_URL}/detection/predict`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeader(),
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDetections = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/detection`, {
      params: { page, limit },
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDetectionById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/detection/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSystemStats = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/detection/stats/system`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllUsers = async (page = 1, limit = 10, search = '', role = '') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/users`, {
      params: { page, limit, search, role },
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getActivityLog = async (page = 1, limit = 20) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/activity-log`, {
      params: { page, limit },
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAdminStats = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const generateReport = async (startDate, endDate, type = 'all') => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/admin/reports`,
      { startDate, endDate, type },
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const diagnoseSymptoms = async (symptoms, additionalNotes) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/detection/symptom`,
      { symptoms, additionalNotes },
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
\n`\n\n\n### File: .\frontend\src\utils\cn.js\n\n`javascript\nimport { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
\n`\n\n\n### File: .\frontend\src\utils\constants.js\n\n`javascript\nexport const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  ROLE_SELECT: '/role-select',
  ONBOARDING: '/onboarding',
  DASHBOARD: '/dashboard',
  DISEASE: '/disease/:id',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_DISEASES: '/admin/diseases',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_SETTINGS: '/admin/settings',
};

export const AGENTS = {
  IMAGE_UPLOAD: 'image-upload',
  SYMPTOM_BASED: 'symptom-based',
  LIVE_CAMERA: 'live-camera',
};

export const DISEASE_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};
\n`\n\n\n### File: .\streamlit_app\app.py\n\n`py\nimport streamlit as st
from frontend_embed.react_embed import render_react_frontend

st.set_page_config(
    page_title="AgroSentry Platform",
    page_icon="🌱",
    layout="wide",
    initial_sidebar_state="collapsed" # Hide sidebar to let React handle it
)

# Render the React frontend
render_react_frontend()
\n`\n\n\n### File: .\streamlit_app\README.md\n\n`md\n// Error reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte\n`\n\n\n### File: .\streamlit_app\api\backend_client.py\n\n`py\nimport requests
import os

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5000/api")

def get_system_stats(token=None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    response = requests.get(f"{API_BASE_URL}/stats/system", headers=headers)
    return response.json() if response.status_code == 200 else None
\n`\n\n\n### File: .\streamlit_app\frontend_embed\react_embed.py\n\n`py\nimport streamlit as st
import streamlit.components.v1 as components
import os

def render_react_frontend():
    """
    Embeds the React frontend inside the Streamlit app.
    It points to the local Vite development server by default.
    """
    REACT_URL = os.getenv("REACT_APP_URL", "http://localhost:5173")
    
    # Hide standard Streamlit header and padding to make the embed seamless
    st.markdown("""
        <style>
            .block-container {
                padding-top: 0rem;
                padding-bottom: 0rem;
                padding-left: 0rem;
                padding-right: 0rem;
            }
            header {visibility: hidden;}
            #MainMenu {visibility: hidden;}
            footer {visibility: hidden;}
            iframe {
                border: none;
                width: 100vw;
                height: 100vh;
            }
        </style>
    """, unsafe_allow_html=True)

    components.iframe(REACT_URL, height=1000, scrolling=True)
\n`\n\n\n### File: .\streamlit_app\pages\analytics.py\n\n`py\nimport streamlit as st
import pymongo
import pandas as pd
import os
import plotly.express as px

st.set_page_config(page_title="Advanced AI Analytics", page_icon="📈", layout="wide")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/AgroSentryDB")

try:
    client = pymongo.MongoClient(MONGO_URI)
    db = client["AgroSentryDB"]
except Exception as e:
    db = None

st.title("📈 Advanced Plant Pathology Analytics")
st.markdown("---")

if db is not None:
    # Load detections
    detections = list(db["detections"].find())
    
    if len(detections) > 0:
        df = pd.DataFrame(detections)
        
        # Calculate stats
        avg_conf = df["confidence"].mean() if "confidence" in df.columns else 0.0
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Average AI Detection Confidence", f"{avg_conf:.2f}%")
            
        st.markdown("### Common Diseases Distribution")
        col_name = "diseaseName" if "diseaseName" in df.columns else ("disease" if "disease" in df.columns else None)
        if col_name:
            disease_counts = df[col_name].value_counts().reset_index()
            disease_counts.columns = ["Disease", "Scans Count"]
            
            fig = px.bar(
                disease_counts,
                x="Scans Count",
                y="Disease",
                orientation='h',
                color="Disease",
                title="Common Scanned Plant Pathologies",
                color_discrete_sequence=["#10b981", "#3b82f6", "#f59e0b", "#ef4444"]
            )
            st.plotly_chart(fig, use_container_width=True)
            
        st.markdown("### Diagnostic Confidence Curves")
        if "confidence" in df.columns and "createdAt" in df.columns:
            fig2 = px.histogram(
                df,
                x="confidence",
                nbins=20,
                title="AI Model Prediction Confidence Histogram",
                color_discrete_sequence=["#10b981"]
            )
            st.plotly_chart(fig2, use_container_width=True)
            
    else:
        st.info("No scan records logged in MongoDB yet. Complete a plant diagnostic scan to populate charts!")
else:
    st.error("Failed to connect to MongoDB.")
\n`\n\n\n### File: .\streamlit_app\pages\dashboard.py\n\n`py\nimport streamlit as st
from frontend_embed.react_embed import render_react_frontend

st.set_page_config(
    page_title="Dashboard - AgroSentry",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Render the React frontend
render_react_frontend()
\n`\n\n\n### File: .\streamlit_app\utils\analytics.py\n\n`py\nimport pandas as pd

def process_analytics(data):
    """
    Helper function to process raw MongoDB data into pandas DataFrames 
    for Streamlit charting if needed separately from React.
    """
    if not data:
        return pd.DataFrame()
    return pd.DataFrame(data)
\n`\n\n\n### File: .\streamlit_app\utils\auth.py\n\n`py\nimport streamlit as st

def verify_session():
    """
    Placeholder auth verifier. 
    In the dual architecture, since we embed the React app, 
    Clerk manages the session inside the iframe natively.
    """
    return True
\n`\n\n\n### File: .\streamlit_app\utils\db.py\n\n`py\nimport pymongo
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/AgroSentryDB")

def get_mongo_client():
    return pymongo.MongoClient(MONGO_URI)
\n`\n\n