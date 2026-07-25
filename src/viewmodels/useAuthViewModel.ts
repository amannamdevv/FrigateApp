import { useState, useContext } from 'react';
import { AuthContext } from '../store/AuthContext';
import { apiClient } from '../api/client';

export const useAuthViewModel = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthViewModel must be used within an AuthProvider');
  }

  const [serverUrl, setServerUrl] = useState(context.serverUrl || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setError(null);
    if (!serverUrl) {
      setError('Server URL is required');
      return;
    }

    setIsLoggingIn(true);
    try {
      // Basic test to see if URL is valid
      const testClient = apiClient;
      testClient.defaults.baseURL = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
      if (username && password) {
        testClient.defaults.auth = { username, password };
      }

      await testClient.get('/api/version');

      // If success, save
      await context.login(serverUrl, username, password);
    } catch (e: any) {
      setError(e?.response?.status === 401 ? 'Invalid credentials' : 'Failed to connect to server');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await context.logout();
  };

  return {
    serverUrl,
    setServerUrl,
    username,
    setUsername,
    password,
    setPassword,
    error,
    isLoggingIn,
    handleLogin,
    handleLogout,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
  };
};
