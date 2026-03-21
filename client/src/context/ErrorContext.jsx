// client/src/context/ErrorContext.jsx
// Global toast-style notification context for error, warning, success, and info events.

import React, { createContext, useContext, useState, useCallback } from 'react';

const ErrorContext = createContext();

// Provider that stores queued notifications and renders a shared notification container.
export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);

  // Adds a notification and optionally auto-removes it after a timeout.
  const addError = useCallback((message, type = 'error', duration = 5000) => {
    const id = Date.now();
    const error = {
      id,
      message,
      type, // 'error', 'warning', 'success', 'info'
    };

    setErrors(prev => [...prev, error]);

    if (duration > 0) {
      setTimeout(() => removeError(id), duration);
    }

    return id;
  }, []);

  const removeError = useCallback((id) => {
    setErrors(prev => prev.filter(err => err.id !== id));
  }, []);

  // Clears all visible notifications, useful during route changes or hard resets.
  const clearAll = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearAll }}>
      {children}
      <ErrorNotificationContainer errors={errors} onRemove={removeError} />
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
};

// Stacks active notifications in the top-right corner of the viewport.
const ErrorNotificationContainer = ({ errors, onRemove }) => {
  if (errors.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-md space-y-3">
      {errors.map(error => (
        <ErrorNotification
          key={error.id}
          error={error}
          onClose={() => onRemove(error.id)}
        />
      ))}
    </div>
  );
};

// Renders one typed notification card with semantic icon/color mapping.
const ErrorNotification = ({ error, onClose }) => {
  const typeStyles = {
    error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700',
    warning: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700',
    success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
  };

  const typeIcons = {
    error: 'error',
    warning: 'warning',
    success: 'check_circle',
    info: 'info'
  };

  const typeTextColor = {
    error: 'text-red-800 dark:text-red-400',
    warning: 'text-amber-800 dark:text-amber-400',
    success: 'text-emerald-800 dark:text-emerald-400',
    info: 'text-blue-800 dark:text-blue-400'
  };

  return (
    <div
      className={`${typeStyles[error.type]} border rounded-lg p-4 shadow-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2`}
      role="alert"
    >
      <span className={`material-symbols-outlined ${typeTextColor[error.type]} flex-shrink-0`}>
        {typeIcons[error.type]}
      </span>
      <div className="flex-1">
        <p className={`${typeTextColor[error.type]} font-semibold text-sm`}>
          {error.type.charAt(0).toUpperCase() + error.type.slice(1)}
        </p>
        <p className={`${typeTextColor[error.type]} text-sm mt-1 opacity-90`}>
          {error.message}
        </p>
      </div>
      <button
        onClick={onClose}
        className={`${typeTextColor[error.type]} opacity-60 hover:opacity-100 transition flex-shrink-0`}
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
};
