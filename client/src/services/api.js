// client/src/services/api.js
// Central API client: auth-aware request helpers plus feature-specific service modules.
import { DataSyncService } from '../utils/cacheSync';
import { isTokenValid } from '../utils/tokenUtils';
import { clearAllCache } from '../utils/cacheSync';

const getDefaultApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (!import.meta.env.DEV) {
    console.error('CRITICAL: VITE_API_URL environment variable is missing in production! API calls will fail.');
  }

  return import.meta.env.DEV ? 'http://localhost:3000/api' : '/api';
};

export const API_BASE_URL = getDefaultApiBaseUrl();

// Global fetch interceptor to catch 401 Unauthorized responses
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  try {
    const response = await originalFetch(...args);
    if (response.status === 401) {
      console.warn('[Fetch Interceptor] 401 Unauthorized detected. Clearing auth state.');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('authContext');
      // Dispatch custom event to notify AuthContext to update React state
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    return response;
  } catch (error) {
    throw error;
  }
};


/**
 * Check token validity before making requests
 * If token is expired, clear auth and throw error
 * @throws {Error} If token is expired
 */
const validateTokenBeforeRequest = () => {
  const token = localStorage.getItem('authToken');
  
  if (token && !isTokenValid(token)) {
    // Token is expired - clear auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('authContext');
    
    // Clear caches
    clearAllCache?.();
    
    throw new Error('Session expired. Please login again.');
  }
};

// Generic fetch wrapper used by all feature APIs.
const apiRequest = async (endpoint, options = {}) => {
  // Validate token before making request
  validateTokenBeforeRequest();

  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add token if it exists
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (response.status === 401) {
    // Unauthorized - clear auth and redirect
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Something went wrong');
    error.code = data.code;
    throw error;
  }

  return data;
};

// GET-aware wrapper that integrates cache-first and background sync strategies.
const apiRequestWithCache = async (endpoint, options = {}, cacheKey = null, useCacheFirst = false) => {
  // Validate token before making request
  validateTokenBeforeRequest();

  const token = localStorage.getItem('authToken');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Only cache GET requests
  if (config.method === 'GET' || !config.method) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    if (useCacheFirst && cacheKey) {
      return await DataSyncService.fetchCacheFirst(url, cacheKey, config);
    } else if (cacheKey) {
      const result = await DataSyncService.fetchWithSync(url, cacheKey, config);
      return result.data;
    }
  }

  // For non-GET requests or requests without caching
  return apiRequest(endpoint, options);
};

// Authentication API surface used by login/signup screens.
export const authAPI = {
  // User signup
  signup: async (userData) => {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: userData.fullName,
        email: userData.email,
        password: userData.password,
      }),
    });
  },

  // User login
  login: async (credentials) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    // Store token in localStorage
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.result));
    }

    return response;
  },

  // Google login
  googleLogin: async (idToken) => {
    const response = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });

    if (response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user || response.result));
    }

    return response;
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
};

/**
 * Logout user - calls backend endpoint and clears local auth data
 * @param {string} token - JWT token for authentication
 * @returns {Promise<void>}
 */
export const logout = async (token) => {
  try {
    // Call backend logout endpoint
    await apiRequest('/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.warn('Backend logout failed:', error);
    // Continue with local cleanup even if backend call fails
  } finally {
    // Clear local auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Clear any cached auth context data
    sessionStorage.removeItem('authContext');
    
    // Invalidate all caches
    const { clearAllCache } = await import('../utils/cacheSync');
    clearAllCache();
  }
};

// Skills API surface used by resume/skills dashboard components.
export const skillsAPI = {
  /**
   * Get user skills from profile with caching
   * @param {boolean} useCacheFirst - Use cache first, then sync in background
   * @returns {Promise<Array>}
   */
  getSkills: async (useCacheFirst = true) => {
    const response = await apiRequestWithCache(
      '/skills',
      { method: 'GET' },
      'user_skills',
      useCacheFirst
    );
    // Extract skills array from response
    return Array.isArray(response) ? response : response?.skills || [];
  },

  /**
   * Add a new skill for the user
   * Updates both user profile and latest resume analysis
   * @param {string} skillName - Name of the skill
   * @param {string} proficiency - Proficiency level (beginner, intermediate, advanced, expert)
   * @param {number} yearsOfExperience - Years of experience with this skill
   * @returns {Promise<Object>} Created skill data
   */
  addSkill: async (skillName, proficiency = 'intermediate', yearsOfExperience = 0, resumeId = null) => {
    const response = await apiRequest('/skills/add', {
      method: 'POST',
      body: JSON.stringify({
        skill_name: skillName,
        proficiency_level: proficiency,
        years_of_experience: yearsOfExperience,
        resume_id: resumeId,
      }),
    });

    // Invalidate skills cache after adding
    const { clearCache } = await import('../utils/cacheSync');
    clearCache('user_skills');

    // Return skill with name as ID for frontend use
    if (response.success && response.skill) {
      return {
        success: true,
        message: response.message,
        skill: {
          ...response.skill,
          id: skillName // Use skill name as ID for consistency
        }
      };
    }
    return response;
  },

  /**
   * Delete a skill by name
   * Removes from both user profile and latest resume analysis
   * @param {string} skillName - Name of the skill to delete
   * @returns {Promise<Object>}
   */
  deleteSkill: async (skillName) => {
    const response = await apiRequest(`/skills/${encodeURIComponent(skillName)}`, {
      method: 'DELETE',
    });

    // Invalidate skills cache after deletion
    const { clearCache } = await import('../utils/cacheSync');
    clearCache('user_skills');

    return response;
  },

  /**
   * Update a skill by name
   * Updates both user profile and latest resume analysis
   * @param {string} skillName - Current name of the skill
   * @param {Object} updates - Object with fields to update (proficiency_level, new_skill_name)
   * @returns {Promise<Object>}
   */
  updateSkill: async (skillName, updates) => {
    const response = await apiRequest(`/skills/${encodeURIComponent(skillName)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    // Invalidate skills cache after update
    const { clearCache } = await import('../utils/cacheSync');
    clearCache('user_skills');

    return response;
  },
};

// Resume API functions
export const resumeAPI = {
  /**
   * Get list of all uploaded resumes
   * @returns {Promise<Object>}
   */
  getResumesList: async () => {
    return apiRequestWithCache(
      '/resumes/list',
      { method: 'GET' },
      'user_resumes',
      false
    );
  },

  /**
   * Upload a new resume with target job role for AI analysis
   * AI will automatically detect experience level and years from resume
   * @param {File} file - Resume file (DOCX or PDF)
   * @param {Object} options - Optional analysis parameters
   * @param {string} options.targetRole - Target job role for role-specific analysis
   * @returns {Promise<Object>}
   */
  uploadResume: async (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);

    // Add title (new required field for display name)
    if (options.title) {
      formData.append('title', options.title);
    }

    // Add target role if provided
    if (options.targetRole) {
      formData.append('targetRole', options.targetRole);
    }

    const token = localStorage.getItem('authToken');
    const url = `${API_BASE_URL}/resumes/upload`;

    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || data.message || 'Upload failed');
      error.code = data.code;
      throw error;
    }

    // Invalidate resumes cache after upload
    const { clearCache } = await import('../utils/cacheSync');
    clearCache('user_resumes');

    return data;
  },

  /**
   * Get detailed analysis for a specific resume
   * @param {number} resumeId - ID of the resume
   * @returns {Promise<Object>}
   */
  getResumeAnalysis: async (resumeId) => {
    return apiRequestWithCache(
      `/resumes/analysis/${resumeId}`,
      { method: 'GET' },
      `resume_analysis_${resumeId}`,
      false
    );
  },

  /**
   * Delete a resume by ID
   * @param {number} resumeId - ID of the resume to delete
   * @returns {Promise<Object>}
   */
  deleteResume: async (resumeId) => {
    const response = await apiRequest(`/resumes/${resumeId}`, {
      method: 'DELETE',
    });

    // Invalidate resumes cache after deletion
    const { clearCache } = await import('../utils/cacheSync');
    clearCache('user_resumes');

    return response;
  },
};

// Admin API surface
export const adminAPI = {
  getStats: async () => {
    return await apiRequest('/admin/stats', {
      method: 'GET'
    });
  },
  
  getUsers: async () => {
    return await apiRequest('/admin/users', {
      method: 'GET'
    });
  }
};

export default authAPI;
