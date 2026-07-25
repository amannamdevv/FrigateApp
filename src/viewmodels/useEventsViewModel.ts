import { useState, useEffect, useCallback } from 'react';
import { FrigateEvent } from '../models/types';
import { frigateApi } from '../api/frigateApi';

export const useEventsViewModel = () => {
  const [events, setEvents] = useState<FrigateEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await frigateApi.getEvents({ limit: 50 });
      setEvents(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  };
};
