/**
 * Authentication Context
 * Provides global authentication state and methods
 * Used to manage user login, token storage, and auth status
 */

import React, { createContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login user and store auth token
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and token
   */
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      // Handle new response format from backend
      const userData = data.user || data.result;
      const newToken = data.token;

      // Validate required fields
      if (!userData || !newToken) {
        throw new Error('Invalid server response');
      }

      // Normalize: support both full_name and name fields from backend
      // New schema uses full_name; keep name as alias for component compatibility
      if (userData.full_name && !userData.name) {
        userData.name = userData.full_name;
      }

      // Store token and user data (includes profile_completed)
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('user', JSON.stringify(userData));

      // Update state (synchronously within same render cycle)
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);

      console.log('[Auth] Login successful, profile_completed:', userData.profile_completed);
      return { user: userData, token: newToken };
    } catch (err) {
      console.error('[Auth] Login error:', err.message);
      setError(err.message);
      setLoading(false);
      clearAuth();
      throw err;
    }
  };

  /**
   * Signup new user
   * @param {string} name - User name
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User ID
   */
  const signup = async (name, email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ full_name: name, name, email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Signup failed');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user and clear auth data
   */
  const logout = () => {
    clearAuth();
  };

  /**
   * Clear all auth data from state and storage
   */
  const clearAuth = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setError(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  /**
   * Update user data in context (used after profile/name edits)
   * @param {Object} partialUser - Fields to merge into current user
   */
  const updateUserInContext = (partialUser) => {
    setUser(prev => {
      const updated = { ...prev, ...partialUser };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };


  /**
   * Get current auth token for API requests
   * @returns {string|null} JWT token
   */
  const getToken = () => token;

  /**
   * Get auth header for API requests
   * @returns {Object} Authorization header with Bearer token
   */
  const getAuthHeader = () => {
    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      };
    }
    return {};
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    signup,
    logout,
    getToken,
    getAuthHeader,
    clearAuth,
    updateUserInContext
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use Auth Context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
