/**
 * Interview Context
 * Manages interview state (session, messages, loading, etc)
 * Provides interview operations and state to components
 */

import React, { createContext, useState, useCallback, useContext } from 'react';
import socketService from '../services/socketService';

export const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(''); // Detailed loading message
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null); // Interview metadata

  /**
   * Start interview
   * @param {number} resumeId - Resume ID
   * @param {string} role - Target role
   */
  const startInterview = useCallback((resumeId, role) => {
    try {
      setError(null);
      setIsLoading(true);
      setMessages([]);
      
      // Emit start_interview event
      socketService.startInterview(resumeId, role);
    } catch (err) {
      setError(err.message);
      console.error('Start interview error:', err);
    }
  }, []);

  /**
   * Send message (user answer)
   * @param {string} message - User message
   */
  const sendMessage = useCallback((message) => {
    if (!sessionId) {
      setError('Session not initialized');
      return;
    }

    if (isLoading) {
      setError('AI is processing. Please wait...');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      setLoadingMessage('AI is evaluating your answer...');

      // Add user message to UI immediately with type field
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        sender: 'user',
        text: message,
        type: 'answer',
        timestamp: new Date().toISOString()
      }]);

      // Emit user_message event
      socketService.sendMessage(sessionId, message);
    } catch (err) {
      setError(err.message);
      console.error('Send message error:', err);
    }
  }, [sessionId, isLoading]);

  /**
   * End interview
   */
  const endInterview = useCallback(() => {
    if (!sessionId) {
      setError('Session not initialized');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Emit end_interview event
      socketService.endInterview(sessionId);
    } catch (err) {
      setError(err.message);
      console.error('End interview error:', err);
    }
  }, [sessionId]);

  /**
   * Reset interview state
   */
  const resetInterview = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setIsLoading(false);
    setIsInterviewActive(false);
    setError(null);
    setMetadata(null);
  }, []);

  // Socket event listeners (will be set up by component)
  const setupSocketListeners = useCallback(() => {
    // Listen for AI message (question)
    const unsubscribeAiMessage = socketService.on('ai_message', (data) => {
      const { sessionId: newSessionId, question } = data;

      // Set session ID if new
      if (newSessionId && !sessionId) {
        setSessionId(newSessionId);
        setIsInterviewActive(true);
      }

      // Add AI message to messages with type field
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: question,
        type: 'question',
        timestamp: new Date().toISOString()
      }]);

      setIsLoading(false);
      setLoadingMessage('');
    });

    // Listen for interview result
    const unsubscribeResult = socketService.on('interview_result', (result) => {
      setMetadata(result);
      setIsInterviewActive(false);
      setIsLoading(false);
      setLoadingMessage('');
    });

    // Listen for errors
    const unsubscribeError = socketService.on('error_event', (error) => {
      setError(error.message || 'An error occurred');
      setIsLoading(false);
      setLoadingMessage('');
    });

    // Listen for loading with detailed message
    const unsubscribeLoading = socketService.on('loading_event', (data) => {
      setIsLoading(true);
      setLoadingMessage(data.message || 'Processing...');
    });

    // Return cleanup function
    return () => {
      unsubscribeAiMessage();
      unsubscribeResult();
      unsubscribeError();
      unsubscribeLoading();
    };
  }, [sessionId]);

  const value = {
    // State
    sessionId,
    messages,
    isLoading,
    loadingMessage,
    isInterviewActive,
    error,
    metadata,

    // Actions
    startInterview,
    sendMessage,
    endInterview,
    resetInterview,
    setupSocketListeners,

    // Connection status
    isConnected: socketService.connected
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
};

/**
 * Hook to use interview context
 */
export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within InterviewProvider');
  }
  return context;
};
