import { useState, useEffect, useCallback } from 'react';
import { Recording } from '../models/types';
import { frigateApi } from '../api/frigateApi';

export const useRecordingsViewModel = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await frigateApi.getRecordings();
      setRecordings(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch recordings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  return {
    recordings,
    loading,
    error,
    refetch: fetchRecordings,
  };
};
