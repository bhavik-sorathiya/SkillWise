/**
 * API Error Handler
 * Provides utilities for handling API errors consistently
 */

export class APIError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static async fromResponse(response) {
    let details = null;
    try {
      const data = await response.json();
      details = data;
    } catch (e) {
      // Could not parse JSON, use response text
      details = { message: response.statusText };
    }

    const message = details?.error || details?.message || response.statusText || 'Unknown error';
    return new APIError(message, response.status, details);
  }
}

/**
 * Make an API request with error handling
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @param {string} options.method - HTTP method
 * @param {object} options.headers - Request headers
 * @param {object} options.body - Request body (will be JSON.stringify'd)
 * @param {number} options.timeout - Request timeout in ms (default: 30000)
 * @param {function} options.onError - Error callback (optional)
 * @returns {Promise<object>} Response data
 */
export async function apiCall(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    timeout = 30000,
    onError = null
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      signal: controller.signal
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await APIError.fromResponse(response);
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle timeout
    if (error.name === 'AbortError') {
      const timeoutError = new APIError(
        'Request timed out. Please check your connection and try again.',
        0,
        { timeout: true }
      );
      
      if (onError) {
        onError(timeoutError);
      }
      
      throw timeoutError;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new APIError(
        'Network error. Please check your internet connection.',
        0,
        { network: true }
      );
      
      if (onError) {
        onError(networkError);
      }
      
      throw networkError;
    }

    // Handle API errors
    if (error instanceof APIError) {
      if (onError) {
        onError(error);
      }
      throw error;
    }

    // Handle unexpected errors
    const unexpectedError = new APIError(
      'An unexpected error occurred. Please try again later.',
      0,
      { unexpected: true, originalError: error }
    );
    
    if (onError) {
      onError(unexpectedError);
    }
    
    throw unexpectedError;
  }
}

/**
 * Safe API call wrapper - catches errors and returns them instead of throwing
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options (same as apiCall)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function safApiCall(url, options = {}) {
  try {
    const data = await apiCall(url, { ...options, onError: null });
    return { success: true, data };
  } catch (error) {
    console.error('[API Error]', error.message, error);
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode,
      details: error.details
    };
  }
}
