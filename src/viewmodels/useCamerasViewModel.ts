import { useState, useEffect, useCallback } from 'react';
import { Camera } from '../models/types';
import { frigateApi } from '../api/frigateApi';

export const useCamerasViewModel = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCameras = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await frigateApi.getCameras();
      setCameras(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch cameras');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  return {
    cameras,
    loading,
    error,
    refetch: fetchCameras,
  };
};
