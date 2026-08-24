/**
 * Events (Call Alerts) ViewModel - uses real AIVMS API
 */
import { useState, useCallback } from 'react';
import { aivmsApi, CallAlert, DashboardStats } from '../api/frigateApi';

export const useEventsViewModel = () => {
  const [alerts, setAlerts] = useState<CallAlert[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [count24h, setCount24h] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await aivmsApi.getDashboardStats();
    if (result?.call_alerts) {
      setAlerts(result.call_alerts.recent);
      setStatusCounts(result.call_alerts.status_counts);
      setCount24h(result.call_alerts.count_24h);
    } else {
      setError('Failed to fetch call alerts');
    }
    setLoading(false);
  }, []);

  return { alerts, statusCounts, count24h, loading, error, fetchEvents };
};
