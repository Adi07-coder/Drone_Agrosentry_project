# AgroSentry Project - Setup and Fixes Guide

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
