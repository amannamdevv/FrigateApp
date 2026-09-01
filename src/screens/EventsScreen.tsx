import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal
} from 'react-native';
import { Appbar, Text, ActivityIndicator, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Calendar } from 'react-native-calendars';
import { aivmsApi, CallAlert } from '../api/frigateApi';

const callStatusConfig: Record<string, { color: string; icon: string; bg: string }> = {
  'Call Received':  { color: '#22c55e', icon: 'phone-check',   bg: '#22c55e18' },
  'Call Declined':  { color: '#f97316', icon: 'phone-cancel',  bg: '#f9731618' },
  'Missed':         { color: '#ef4444', icon: 'phone-missed',  bg: '#ef444418' },
  'FAILED':         { color: '#dc2626', icon: 'phone-alert',   bg: '#dc262618' },
  'PDROP':          { color: '#a855f7', icon: 'phone-hangup',  bg: '#a855f718' },
  'SKIPPED_COOLDOWN': { color: '#6b7280', icon: 'phone-off',   bg: '#6b728018' },
};

const formatDateTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr.replace(' ', 'T'));
    return {
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  } catch {
    return { date: '', time: dateStr };
  }
};

const AlertCard = ({ item }: { item: CallAlert }) => {
  const cfg = callStatusConfig[item.call_status] || { color: '#9ca3af', icon: 'phone', bg: '#9ca3af18' };
  const { date, time } = formatDateTime(item.created_at);

  return (
    <View style={styles.alertCard}>
      <View style={[styles.alertIcon, { backgroundColor: cfg.bg }]}>
        <Icon name={cfg.icon} size={24} color={cfg.color} />
      </View>
      <View style={styles.alertBody}>
        <Text style={styles.alertCamera} numberOfLines={1}>
          {item.camera_name.toUpperCase()}
        </Text>
        <View style={styles.alertPhoneRow}>
          <Icon name="phone" size={14} color="#6b7280" />
          <Text style={styles.alertPhone}> +{item.phone_number}</Text>
        </View>
      </View>
      <View style={styles.alertRight}>
        <Text style={[styles.alertStatus, { color: cfg.color }]}>{item.call_status}</Text>
        <Text style={styles.alertDate}>{date}</Text>
        <Text style={styles.alertTime}>{time}</Text>
      </View>
    </View>
  );
};

export const EventsScreen = ({ navigation }: any) => {
  const [alerts, setAlerts] = useState<CallAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Date Range state
  const [startDate, setStartDate] = useState<string>(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>(''); // YYYY-MM-DD
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');

  // 1. Fetch dashboard stats to get the status_counts (filter bar values)
  const fetchCounts = useCallback(async () => {
    const result = await aivmsApi.getDashboardStats();
    if (result?.call_alerts) {
      setStatusCounts(result.call_alerts.status_counts);
    }
  }, []);

  // 2. Fetch paginated alerts driven by backend
  const fetchAlerts = useCallback(async (
    pageNum: number, 
    isRefresh = false, 
    currentStatus = statusFilter,
    sDate = startDate,
    eDate = endDate
  ) => {
    if (!isRefresh) setLoadingMore(true);
    
    // Fetch from backend WITH filters
    const res = await aivmsApi.getPaginatedCallAlerts(pageNum, 20, currentStatus || undefined, sDate || undefined, eDate || undefined);
    
    if (res && res.data) {
      if (isRefresh || pageNum === 1) {
        setAlerts(res.data);
      } else {
        // Append & dedupe
        setAlerts(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const newAlerts = res.data.filter(a => !existingIds.has(a.id));
          return [...prev, ...newAlerts];
        });
      }
      setTotalCount(res.total);

      if (res.data.length < res.limit || alerts.length + res.data.length >= res.total) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } else {
      setHasMore(false);
      if (isRefresh || pageNum === 1) setAlerts([]);
    }
    
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
  }, [statusFilter, startDate, endDate, alerts.length]);

  useEffect(() => {
    fetchCounts();
    fetchAlerts(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Triggers when Status filter changes
  const handleFilterChange = (newFilter: string | null) => {
    setStatusFilter(newFilter);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    fetchAlerts(1, true, newFilter, startDate, endDate);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchCounts();
    fetchAlerts(1, true, statusFilter, startDate, endDate);
  }, [fetchCounts, fetchAlerts, statusFilter, startDate, endDate]);

  const loadMore = () => {
    if (hasMore && !loadingMore && !loading && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchAlerts(nextPage, false, statusFilter, startDate, endDate);
    }
  };

  const applyDateRange = () => {
    setStartDate(tempStart);
    setEndDate(tempEnd);
    setShowCalendar(false);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    fetchAlerts(1, true, statusFilter, tempStart, tempEnd);
  };

  const clearDateRange = () => {
    setTempStart('');
    setTempEnd('');
    setStartDate('');
    setEndDate('');
    setShowCalendar(false);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    fetchAlerts(1, true, statusFilter, '', '');
  };

  // Calendar marking logic for range
  const markedDates = useMemo(() => {
    const marks: any = {};
    if (tempStart && tempEnd) {
      marks[tempStart] = { startingDay: true, color: '#135d9d', textColor: 'white' };
      marks[tempEnd] = { endingDay: true, color: '#135d9d', textColor: 'white' };
      // fill in between
      let curr = new Date(tempStart);
      curr.setDate(curr.getDate() + 1);
      const end = new Date(tempEnd);
      while (curr < end) {
        marks[curr.toISOString().split('T')[0]] = { color: '#135d9d30', textColor: '#135d9d' };
        curr.setDate(curr.getDate() + 1);
      }
    } else if (tempStart) {
      marks[tempStart] = { startingDay: true, endingDay: true, color: '#135d9d', textColor: 'white' };
    }
    return marks;
  }, [tempStart, tempEnd]);

  const onDayPress = (day: any) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(day.dateString);
      setTempEnd('');
    } else if (tempStart && !tempEnd) {
      if (day.dateString >= tempStart) {
        setTempEnd(day.dateString);
      } else {
        setTempEnd(tempStart);
        setTempStart(day.dateString);
      }
    }
  };

  if (loading && page === 1 && !refreshing) {
    return (
      <View style={styles.container}>
        <Appbar.Header style={styles.appbar}>
          <Appbar.BackAction onPress={() => navigation.goBack()} color="#4b5563" />
          <Appbar.Content title="Call Alerts" titleStyle={styles.appbarTitle} />
        </Appbar.Header>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loaderText}>Loading alerts...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#4b5563" />
        <View style={{ flex: 1 }}>
          <Text style={styles.appbarTitle}>Call Alerts</Text>
          <Text style={styles.appbarSub}>{totalCount} matching alerts</Text>
        </View>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowCalendar(true)}>
          <Icon name="calendar-range" size={20} color="#135d9d" />
        </TouchableOpacity>
      </Appbar.Header>

      {/* Status filter pills */}
      <View style={styles.filterScroll}>
        <TouchableOpacity
          style={[styles.filterChip, !statusFilter && styles.filterChipActive]}
          onPress={() => handleFilterChange(null)}
        >
          <Text style={[styles.filterChipText, !statusFilter && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {Object.entries(statusCounts).map(([status, count]) => {
          const cfg = callStatusConfig[status] || { color: '#9ca3af' };
          const isActive = statusFilter === status;
          return (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, isActive && { backgroundColor: cfg.color + '25', borderColor: cfg.color }]}
              onPress={() => handleFilterChange(isActive ? null : status)}
            >
              <Text style={[styles.filterChipText, { color: isActive ? cfg.color : '#6b7280' }]}>
                {status} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={statusFilter ? alerts.filter(a => a.call_status === statusFilter) : alerts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <AlertCard item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" colors={['#3b82f6']} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon name="phone-off" size={60} color="#9ca3af" />
            <Text style={styles.emptyText}>No alerts found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={{ marginTop: 8, color: '#6b7280', fontSize: 14 }}>Loading older alerts...</Text>
            </View>
          ) : null
        }
      />

      <Modal visible={showCalendar} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Date Range</Text>
            <Calendar
              markingType={'period'}
              markedDates={markedDates}
              onDayPress={onDayPress}
              theme={{
                todayTextColor: '#135d9d',
                arrowColor: '#135d9d',
              }}
            />
            <View style={styles.modalBtns}>
              <Button mode="text" textColor="#ef4444" onPress={clearDateRange}>Clear</Button>
              <Button mode="text" textColor="#6b7280" onPress={() => setShowCalendar(false)}>Cancel</Button>
              <Button mode="contained" buttonColor="#135d9d" onPress={applyDateRange}>Apply</Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  appbar: { backgroundColor: '#ffffff', elevation: 2, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  appbarTitle: { color: '#135d9d', fontSize: 20, fontWeight: '800' },
  appbarSub: { color: '#6b7280', fontSize: 13, fontWeight: '500' },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { color: '#6b7280', marginTop: 12, fontSize: 16 },

  dateBtn: {
    padding: 8,
    marginRight: 12,
    backgroundColor: '#135d9d15',
    borderRadius: 8,
  },

  filterScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 1,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
  },
  filterChipActive: { backgroundColor: '#135d9d15', borderColor: '#135d9d' },
  filterChipText: { fontSize: 13, color: '#4b5563', fontWeight: '700' },
  filterChipTextActive: { color: '#135d9d' },

  listContent: { padding: 16, paddingBottom: 40 },
  separator: { height: 12 },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  alertIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  alertBody: { flex: 1 },
  alertCamera: { fontSize: 16, fontWeight: '900', color: '#111827', letterSpacing: 0.3 },
  alertPhoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  alertPhone: { fontSize: 14, color: '#4b5563', fontWeight: '500' },
  alertRight: { alignItems: 'flex-end' },
  alertStatus: { fontSize: 13, fontWeight: '800' },
  alertDate: { fontSize: 12, color: '#6b7280', marginTop: 4, fontWeight: '600' },
  alertTime: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { color: '#6b7280', marginTop: 16, fontSize: 18, fontWeight: '700' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: 'white', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 12 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 }
});
