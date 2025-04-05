import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize state with values from localStorage
  const [apiKey, setApiKey] = useState(localStorage.getItem('optimizelyApiKey') || '');
  const [projectId, setProjectId] = useState(localStorage.getItem('optimizelyProjectId') || '');

  // Update localStorage whenever these values change
  useEffect(() => {
    if (apiKey) localStorage.setItem('optimizelyApiKey', apiKey);
    if (projectId) localStorage.setItem('optimizelyProjectId', projectId);
  }, [apiKey, projectId]);

  const value = { apiKey, projectId, setApiKey, setProjectId };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a custom hook for easy access to the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};