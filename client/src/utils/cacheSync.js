/**
 * Client-side Data Caching Utility with Smart Sync
 * Stores API responses and checks server-side data for consistency
 */

const CACHE_PREFIX = 'skillwise_cache_';
const CACHE_TIMESTAMP_SUFFIX = '_timestamp';
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Set cache with expiration timestamp
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} duration - Cache duration in ms (default: 5 minutes)
 */
export const setCache = (key, data, duration = DEFAULT_CACHE_DURATION) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const timestamp = Date.now() + duration;
    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(`${cacheKey}${CACHE_TIMESTAMP_SUFFIX}`, timestamp.toString());
  } catch (error) {
    console.warn('Failed to set cache:', error);
  }
};

/**
 * Get cache if valid (not expired)
 * @param {string} key - Cache key
 * @returns {any|null} Cached data or null if expired/not found
 */
export const getCache = (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const timestamp = localStorage.getItem(`${cacheKey}${CACHE_TIMESTAMP_SUFFIX}`);

    // Check if cache exists and hasn't expired
    if (!timestamp || Date.now() > parseInt(timestamp)) {
      // Clear expired cache
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`${cacheKey}${CACHE_TIMESTAMP_SUFFIX}`);
      return null;
    }

    const data = localStorage.getItem(cacheKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Failed to get cache:', error);
    return null;
  }
};

/**
 * Clear specific cache
 * @param {string} key - Cache key
 */
export const clearCache = (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}${CACHE_TIMESTAMP_SUFFIX}`);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
};

/**
 * Clear all SkillWise caches
 */
export const clearAllCache = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear all cache:', error);
  }
};

/**
 * Deep compare two objects for equality
 * Used to check if server data matches cached data
 * @param {any} obj1 - First object
 * @param {any} obj2 - Second object
 * @returns {boolean} True if objects are deeply equal
 */
export const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;

  if (obj1 == null || obj2 == null) return false;

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
};

/**
 * Data Sync Service - Middleware for smart data fetching
 * Checks if server data matches cached data before updating
 */
export const DataSyncService = {
  /**
   * Fetch with smart sync - returns cached if unchanged, fetches if changed or expired
   * @param {string} url - API endpoint
   * @param {string} cacheKey - Cache key for storing data
   * @param {object} fetchOptions - Fetch options (headers, method, etc)
   * @returns {Promise<{data: any, fromCache: boolean, changed: boolean}>}
   */
  fetchWithSync: async (url, cacheKey, fetchOptions = {}) => {
    // Get cached data
    const cachedData = getCache(cacheKey);

    try {
      // Always fetch from server to check for updates
      const response = await fetch(url, {
        ...fetchOptions,
        method: fetchOptions.method || 'GET',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const serverData = await response.json();

      // If we have cached data, compare
      if (cachedData) {
        const dataChanged = !deepEqual(cachedData, serverData);

        if (!dataChanged) {
          // Data is the same, return cached version
          return {
            data: cachedData,
            fromCache: true,
            changed: false,
          };
        }
      }

      // Data is new or changed, cache it
      setCache(cacheKey, serverData);

      return {
        data: serverData,
        fromCache: false,
        changed: cachedData ? true : false, // Changed if we had cached data and it differs
      };
    } catch (error) {
      // If fetch fails, return cached data if available
      if (cachedData) {
        console.warn('Fetch failed, using cached data:', error);
        return {
          data: cachedData,
          fromCache: true,
          changed: false,
        };
      }

      // No cache and fetch failed
      throw error;
    }
  },

  /**
   * Fetch with cache first (offline-first approach)
   * Returns cached data immediately, fetches in background
   * @param {string} url - API endpoint
   * @param {string} cacheKey - Cache key
   * @param {object} fetchOptions - Fetch options
   * @returns {Promise<any>} Returns cached data if available, otherwise fetches
   */
  fetchCacheFirst: async (url, cacheKey, fetchOptions = {}) => {
    // Return cached data immediately if available
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      // Fetch in background to keep cache fresh
      fetch(url, fetchOptions)
        .then((res) => res.json())
        .then((data) => {
          if (!deepEqual(cachedData, data)) {
            setCache(cacheKey, data);
          }
        })
        .catch((err) => console.warn('Background sync failed:', err));

      return cachedData;
    }

    // No cache, fetch from server
    const response = await fetch(url, {
      ...fetchOptions,
      method: fetchOptions.method || 'GET',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  },

  /**
   * Invalidate cache and refetch data
   * Used when data changes (POST, PUT, DELETE operations)
   * @param {string} cacheKey - Cache key to invalidate
   */
  invalidateCache: (cacheKey) => {
    clearCache(cacheKey);
  },

  /**
   * Invalidate multiple caches
   * @param {string[]} cacheKeys - Array of cache keys to invalidate
   */
  invalidateCaches: (cacheKeys) => {
    cacheKeys.forEach((key) => clearCache(key));
  },
};

export default DataSyncService;
