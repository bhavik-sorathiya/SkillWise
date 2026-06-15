import React, { createContext, useContext, useState, useCallback } from 'react';
import ApiKeyModal from '../components/ApiKeyModal';

const ApiKeyContext = createContext();

export const ApiKeyProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [successCallback, setSuccessCallback] = useState(null);
  const [closeCallback, setCloseCallback] = useState(null);

  const showApiKeyModal = useCallback((onSuccess, onClose) => {
    setSuccessCallback(() => onSuccess);
    setCloseCallback(() => onClose);
    setIsOpen(true);
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    if (closeCallback) {
      closeCallback();
    }
    setSuccessCallback(null);
    setCloseCallback(null);
  };

  const handleSuccess = () => {
    setCloseCallback(null); // Clear close callback since we succeeded
    if (successCallback) {
      successCallback();
    }
  };

  return (
    <ApiKeyContext.Provider value={{ showApiKeyModal }}>
      {children}
      <ApiKeyModal 
        isOpen={isOpen} 
        onClose={closeModal} 
        onSuccess={handleSuccess} 
      />
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within ApiKeyProvider');
  }
  return context;
};
