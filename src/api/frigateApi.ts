import { apiClient } from './client';
import { Camera, FrigateEvent, Recording } from '../models/types';

export const frigateApi = {
  getConfig: async () => {
    const response = await apiClient.get('/api/config');
    return response.data;
  },

  getCameras: async (): Promise<Camera[]> => {
    // Frigate's config contains cameras in a map, we parse it into an array
    const response = await apiClient.get('/api/config');
    const camerasMap = response.data.cameras || {};
    return Object.keys(camerasMap).map(key => ({
      name: key,
      ...camerasMap[key]
    }));
  },

  getEvents: async (params?: { camera?: string, label?: string, limit?: number }): Promise<FrigateEvent[]> => {
    const response = await apiClient.get<FrigateEvent[]>('/api/events', { params });
    return response.data;
  },

  getRecordings: async (): Promise<Recording[]> => {
    // This endpoint might vary based on Frigate version. Using a generic one or placeholder.
    // often it's /api/<camera>/recordings or similar. Here's a placeholder returning mock or general data
    // Some implementations just use /api/events for all clip related data
    return [];
  },

  getStats: async () => {
    const response = await apiClient.get('/api/stats');
    return response.data;
  }
};
