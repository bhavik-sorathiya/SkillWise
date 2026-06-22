/**
 * Socket Service
 * Manages Socket.IO connection and event listeners for interview
 * Provides client-side API for socket operations
 */

import io from 'socket.io-client';

if (!import.meta.env.VITE_SOCKET_URL && !import.meta.env.DEV) {
  console.error('CRITICAL: VITE_SOCKET_URL environment variable is missing in production! Mock Interviews will fail to connect.');
}
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.connectionPromise = null;
    this.pendingListeners = new Map();
  }

  attachPendingListeners() {
    if (!this.socket) return;

    this.pendingListeners.forEach((callbacks, eventName) => {
      callbacks.forEach((callback) => {
        this.socket.on(eventName, callback);
      });
    });
  }

  /**
   * Initialize socket connection
   * @param {string} token - Auth token
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async connect(token, userId) {
    if (this.socket?.connected) {
      this.isConnected = true;
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    try {
      if (!this.socket) {
        this.socket = io(SOCKET_URL, {
          auth: {
            token,
            userId
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5
        });

        // Keep base diagnostics local; consumers should subscribe to
        // server events via socketService.on('error' | 'loading' | ...).
        this.socket.on('disconnect', () => {
          console.log('[Socket] Disconnected');
          this.isConnected = false;
        });

        this.socket.on('error', (error) => {
          console.error('[Socket] Error:', error);
        });

        this.socket.on('loading', (data) => {
          console.log('[Socket] Loading:', data);
        });

        this.attachPendingListeners();
      } else {
        this.socket.auth = { token, userId };
        if (!this.socket.connected) {
          this.socket.connect();
        }
      }

      this.connectionPromise = new Promise((resolve, reject) => {
        const onConnect = () => {
          this.isConnected = true;
          console.log('[Socket] Connected:', this.socket?.id);
          this.socket?.off('connect_error', onConnectError);
          resolve();
        };

        const onConnectError = (error) => {
          console.error('[Socket] Connection error:', error);
          this.socket?.off('connect', onConnect);
          reject(error);
        };

        this.socket?.once('connect', onConnect);
        this.socket?.once('connect_error', onConnectError);
      }).finally(() => {
        this.connectionPromise = null;
      });

      return this.connectionPromise;
    } catch (error) {
      this.connectionPromise = null;
      return Promise.reject(error);
    }
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
    this.connectionPromise = null;
  }

  /**
   * Emit socket event
   * @param {string} eventName - Event name
   * @param {Object} payload - Event payload
   */
  emit(eventName, payload) {
    if (this.socket?.connected) {
      this.socket.emit(eventName, payload);
    } else {
      console.warn(`[Socket] Cannot emit event "${eventName}" - socket not connected`);
    }
  }

  /**
   * Register event listener
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback) {
    if (!this.pendingListeners.has(eventName)) {
      this.pendingListeners.set(eventName, new Set());
    }
    this.pendingListeners.get(eventName).add(callback);

    if (this.socket) {
      this.socket.on(eventName, callback);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.pendingListeners.get(eventName);
      callbacks?.delete(callback);
      if (this.socket) {
        this.socket.off(eventName, callback);
      }
    };
  }

  /**
   * Register one-time event listener
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   */
  once(eventName, callback) {
    if (this.socket) {
      this.socket.once(eventName, callback);
    }
  }

  /**
   * Start interview
   * @param {number} resumeId - Resume ID
   * @param {string} role - Target role
   */
  startInterview(resumeId, role) {
    this.emit('start_interview', { resumeId, role });
  }

  /**
   * Send user message
   * @param {number} sessionId - Session ID
   * @param {string} message - User message
   */
  sendMessage(sessionId, message) {
    this.emit('user_message', { sessionId, message });
  }

  /**
   * End interview
   * @param {number} sessionId - Session ID
   */
  endInterview(sessionId) {
    this.emit('end_interview', { sessionId });
  }

  /**
   * Check if socket is connected
   * @returns {boolean}
   */
  get connected() {
    return this.isConnected && this.socket?.connected;
  }

  /**
   * Get socket ID
   * @returns {string}
   */
  get id() {
    return this.socket?.id || null;
  }
}

// Export singleton instance
export default new SocketService();
