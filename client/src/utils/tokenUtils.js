/**
 * Token Utilities
 * Helper functions for JWT token management and validation
 */

/**
 * Decode JWT token payload (without verification - for client-side only)
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  
  if (!decoded || !decoded.exp) {
    return true; // Consider invalid tokens as expired
  }

  // Token expiry is in seconds, convert to milliseconds
  const expiryTime = decoded.exp * 1000;
  const currentTime = Date.now();

  // Add 5 second buffer to check token before it fully expires
  const bufferTime = 5000;

  return currentTime > (expiryTime - bufferTime);
};

/**
 * Get token expiry time in a human-readable format
 * @param {string} token - JWT token
 * @returns {Object|null} { expiresIn: "X minutes", expiryDate: Date } or null
 */
export const getTokenExpiry = (token) => {
  const decoded = decodeToken(token);
  
  if (!decoded || !decoded.exp) {
    return null;
  }

  const expiryTime = decoded.exp * 1000;
  const currentTime = Date.now();
  const timeLeft = expiryTime - currentTime;

  if (timeLeft <= 0) {
    return { expiresIn: 'expired', expiryDate: new Date(expiryTime) };
  }

  const minutes = Math.floor(timeLeft / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let expiresIn = '';
  if (days > 0) {
    expiresIn = `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    expiresIn = `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    expiresIn = `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  return { expiresIn, expiryDate: new Date(expiryTime) };
};

/**
 * Validate token before making API request
 * Returns false if token is expired or invalid
 * @param {string} token - JWT token
 * @returns {boolean} True if token is valid
 */
export const isTokenValid = (token) => {
  if (!token) {
    return false;
  }
  return !isTokenExpired(token);
};
