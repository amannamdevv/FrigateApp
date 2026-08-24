/**
 * Camera list ViewModel - uses real AIVMS API
 */
import { useState, useCallback } from 'react';
import { aivmsApi, Camera, CamerasResponse } from '../api/frigateApi';

export const useCamerasViewModel = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [summary, setSummary] = useState<CamerasResponse['summary'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCameras = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await aivmsApi.getCameraList();
    if (result) {
      setCameras(result.cameras);
      setSummary(result.summary);
    } else {
      setError('Failed to fetch cameras');
    }
    setLoading(false);
  }, []);

  return { cameras, summary, loading, error, fetchCameras };
};
