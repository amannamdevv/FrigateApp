/**
 * AIVMS API Functions
 * All real endpoints for aivms.shrotitele.com
 */

import { apiClient, clearSession } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE_URL = 'https://aivms.shrotitele.com';

/**
 * Converts an API media path to a full playable/viewable URL.
 *
 * API paths come in several forms:
 *   /media/frigate/recordings/...  →  https://aivms.shrotitele.com/recordings/...
 *   /media/frigate/clips/...       →  https://aivms.shrotitele.com/clips/...
 *   /www/Nazil/.../media/clips/... →  https://aivms.shrotitele.com/clips/...
 *   recordings/...  (relative)     →  https://aivms.shrotitele.com/recordings/...
 */
export const getMediaUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  // Already a full URL
  if (path.startsWith('http')) return path;
  // /media/frigate/recordings/... or /media/frigate/clips/...
  if (path.includes('/media/frigate/')) {
    return BASE_URL + path.split('/media/frigate')[1];
  }
  // /www/.../ media/recordings or /www/.../media/clips
  if (path.includes('/media/')) {
    return BASE_URL + path.split('/media')[1];
  }
  // relative path like "recordings/2026-08-21/..."
  if (!path.startsWith('/')) {
    return `${BASE_URL}/${path}`;
  }
  return BASE_URL + path;
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  success: boolean;
  message?: string;
}

export interface UserProfile {
  username: string;
  role: string;
  allowed_cameras: string[];
}

export interface Camera {
  id: number;
  camera_name: string;
  camera_key: string;
  site_code: string | null;
  location: string | null;
  is_active: number; // 0 or 1
  last_heartbeat: string | null;
}

export interface CamerasResponse {
  cameras: Camera[];
  summary: {
    total: number;
    active: number;
    inactive: number;
    auto_inactive_timeout: number;
  };
}

export interface CallAlert {
  id: number;
  event_id: string;
  camera_name: string;
  phone_number: string;
  call_status: string;
  created_at: string;
}

export interface ClipEntry {
  event_id: string;
  camera: string;
  event_time: string;
  img_status: string;
  vid_status: string;
  wa_status?: string;
  tg_status?: string;
  wa_numbers?: string;
  tg_chat_ids?: string | null;
  tg_phone_numbers?: string | null;
  img_path: string | null;
  clip_path: string | null;
}

export interface DashboardStats {
  call_alerts: {
    count_24h: number;
    status_counts: Record<string, number>;
    recent: CallAlert[];
  };
  whatsapp_clips: {
    count_24h: number;
    status_counts: Record<string, number>;
    recent: ClipEntry[];
  };
  telegram_clips: {
    count_24h: number;
    status_counts: Record<string, number>;
    recent: ClipEntry[];
  };
}

export interface PaginatedClipsResponse {
  data: ClipEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedCallAlertsResponse {
  data: CallAlert[];
  total: number;
  page: number;
  limit: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const aivmsApi = {

  /**
   * Login with username + password.
   * The API returns a session cookie via Set-Cookie header.
   * Our axios interceptor automatically captures and stores it.
   */
  login: async (user: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post('/api/login', { user, password });
      if (response.status === 200) {
        // Store username for profile display
        await AsyncStorage.setItem('aivms_username', user);
        return { success: true };
      }
      return { success: false, message: 'Login failed' };
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Network error. Check your connection.';
      return { success: false, message };
    }
  },

  /**
   * Get logged-in user profile
   */
  getProfile: async (): Promise<UserProfile | null> => {
    try {
      const response = await apiClient.get('/api/profile');
      if (response.data) {
        await AsyncStorage.setItem('aivms_role', response.data.role || '');
        return response.data;
      }
      return null;
    } catch (e) {
      console.warn('[AIVMS] getProfile error:', e);
      return null;
    }
  },

  /**
   * Dashboard stats: call alerts, WhatsApp clips, Telegram clips
   */
  getDashboardStats: async (): Promise<DashboardStats | null> => {
    try {
      const response = await apiClient.get('/api/shroti/dashboard-stats');
      return response.data;
    } catch (e) {
      console.warn('[AIVMS] getDashboardStats error:', e);
      return null;
    }
  },

  /**
   * Get Paginated Clips (WhatsApp or Telegram)
   */
  getPaginatedClips: async (type: 'whatsapp' | 'telegram', page: number = 1, limit: number = 20): Promise<PaginatedClipsResponse | null> => {
    try {
      const endpoint = type === 'whatsapp'
        ? `/api/shroti/dashboard-stats/whatsapp-clips?page=${page}&limit=${limit}`
        : `/api/shroti/dashboard-stats/telegram-clips?page=${page}&limit=${limit}`;

      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (e) {
      console.warn(`[AIVMS] getPaginatedClips (${type}) error:`, e);
      return null;
    }
  },

  /**
   * Camera list with active/inactive status
   */
  getCameraList: async (): Promise<CamerasResponse | null> => {
    try {
      const response = await apiClient.get('/api/shroti/camera-status');
      return response.data;
    } catch (e) {
      console.warn('[AIVMS] getCameraList error:', e);
      return null;
    }
  },

  /**
   * Get Paginated Call Alerts
   */
  getPaginatedCallAlerts: async (page: number = 1, limit: number = 20, status?: string, startDate?: string, endDate?: string): Promise<PaginatedCallAlertsResponse | null> => {
    try {
      let url = `/api/shroti/dashboard-stats/call-alerts?page=${page}&limit=${limit}`;
      if (status) url += `&status=${encodeURIComponent(status)}`;
      if (startDate) url += `&start_date=${encodeURIComponent(startDate)}`;
      if (endDate) url += `&end_date=${encodeURIComponent(endDate)}`;

      const response = await apiClient.get(url);
      return response.data;
    } catch (e) {
      console.warn('[AIVMS] getPaginatedCallAlerts error:', e);
      return null;
    }
  },

  /**
   * Logout: clear stored session
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/api/logout');
    } catch (_) {
      // ignore logout endpoint errors
    }
    await clearSession();
  },

  /**
   * Check if a session exists (for auto-login)
   */
  hasSession: async (): Promise<boolean> => {
    try {
      const cookie = await AsyncStorage.getItem('aivms_session_cookie');
      return !!cookie;
    } catch {
      return false;
    }
  },
};