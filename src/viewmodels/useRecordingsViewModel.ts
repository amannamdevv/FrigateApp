/**
 * Recordings (Clips) ViewModel - uses real AIVMS API
 */
import { useState, useCallback } from 'react';
import { aivmsApi, ClipEntry } from '../api/frigateApi';

export const useRecordingsViewModel = () => {
  const [waClips, setWaClips] = useState<ClipEntry[]>([]);
  const [tgClips, setTgClips] = useState<ClipEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await aivmsApi.getDashboardStats();
    if (result) {
      setWaClips(result.whatsapp_clips.recent);
      setTgClips(result.telegram_clips.recent);
    } else {
      setError('Failed to fetch recordings');
    }
    setLoading(false);
  }, []);

  return { waClips, tgClips, loading, error, fetchRecordings };
};
