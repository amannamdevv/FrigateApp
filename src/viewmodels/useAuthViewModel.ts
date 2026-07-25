import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../store/AuthContext';

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
      const baseUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
      const config: any = { timeout: 10000 };
      if (username && password) {
        config.auth = { username, password };
      }

      console.log(`Requesting URL: ${baseUrl}/api/version`);
      const headers = { ...config.headers };
      if (config.auth) {
        headers.Authorization = 'Basic (hidden)';
      }
      console.log(`Headers:`, headers);

      const response = await axios.get(`${baseUrl}/api/version`, config);
      console.log(`Response Status: ${response.status}`);

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
