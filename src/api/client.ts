/**
 * AIVMS API Client
 * Cookie-based session authentication for aivms.shrotitele.com
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://aivms.shrotitele.com';
const SESSION_COOKIE_KEY = 'aivms_session_cookie';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': '1',
  },
  withCredentials: false, // React Native doesn't have browser cookie jar; we manage manually
});

// ─── Request Interceptor: inject stored session cookie ────────────────────────
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const cookie = await AsyncStorage.getItem(SESSION_COOKIE_KEY);
      if (cookie) {
        config.headers['Cookie'] = cookie;
      }
    } catch (e) {
      console.warn('[AIVMS] Could not read session cookie:', e);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor: capture and persist Set-Cookie header ──────────────
apiClient.interceptors.response.use(
  async (response) => {
    try {
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        // Flatten cookie array to string
        const cookieStr = Array.isArray(setCookie)
          ? setCookie.map((c: string) => c.split(';')[0]).join('; ')
          : String(setCookie).split(';')[0];
        await AsyncStorage.setItem(SESSION_COOKIE_KEY, cookieStr);
      }
    } catch (e) {
      console.warn('[AIVMS] Could not persist session cookie:', e);
    }
    return response;
  },
  (error) => Promise.reject(error),
);

// ─── Helper: clear session ────────────────────────────────────────────────────
export const clearSession = async () => {
  await AsyncStorage.removeItem(SESSION_COOKIE_KEY);
  await AsyncStorage.removeItem('aivms_username');
  await AsyncStorage.removeItem('aivms_role');
};

export const SESSION_COOKIE_KEY_EXPORT = SESSION_COOKIE_KEY;
