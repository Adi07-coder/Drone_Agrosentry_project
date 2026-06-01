import axios from 'axios';

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
