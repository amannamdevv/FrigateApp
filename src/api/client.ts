import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const serverUrl = await AsyncStorage.getItem('serverUrl');
      if (serverUrl) {
        config.baseURL = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
      }

      // Basic Auth if needed based on username/password stored
      const username = await AsyncStorage.getItem('username');
      const password = await AsyncStorage.getItem('password');

      if (username && password) {
        config.auth = {
          username,
          password,
        };
      }
    } catch (error) {
      console.error('Error fetching credentials from storage', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
