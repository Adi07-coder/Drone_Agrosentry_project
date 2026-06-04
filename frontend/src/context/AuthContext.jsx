import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API = import.meta.env.VITE_API_URL || '/api';

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
        }).catch(() => { }); // ignore logout API errors
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
