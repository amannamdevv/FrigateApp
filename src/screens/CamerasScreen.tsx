import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SectionList,
} from 'react-native';
import { Appbar, Text, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { aivmsApi, Camera } from '../api/frigateApi';

const formatHeartbeat = (hb: string | null) => {
  if (!hb) return 'Never';
  try {
    const d = new Date(hb.replace(' ', 'T'));
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return hb; }
};

const CameraCard = ({ item, onPress }: { item: Camera; onPress: () => void }) => {
  const isActive = item.is_active === 1;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Thumbnail placeholder */}
      <View style={styles.thumbWrap}>
        <View style={styles.thumbPlaceholder}>
          <Icon name="cctv" size={36} color={isActive ? '#3b82f6' : '#374151'} />
          {isActive && (
            <View style={styles.liveTag}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.cardTop}>
          <Text style={styles.camName} numberOfLines={1}>{item.camera_name}</Text>
          <View style={[styles.statusPill, { backgroundColor: isActive ? '#22c55e20' : '#ef444420' }]}>
            <View style={[styles.statusDot, { backgroundColor: isActive ? '#22c55e' : '#ef4444' }]} />
            <Text style={[styles.statusText, { color: isActive ? '#22c55e' : '#ef4444' }]}>
              {isActive ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        {item.location && (
          <View style={styles.metaRow}>
            <Icon name="map-marker-outline" size={12} color="#6b7280" />
            <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <Icon name="clock-outline" size={12} color="#6b7280" />
          <Text style={styles.metaText}>Last seen: {formatHeartbeat(item.last_heartbeat)}</Text>
        </View>
      </View>

      <Icon name="chevron-right" size={20} color="#374151" style={{ marginRight: 14, alignSelf: 'center' }} />
    </TouchableOpacity>
  );
};

export const CamerasScreen = ({ navigation }: any) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 });

  const fetchData = useCallback(async () => {
    const result = await aivmsApi.getCameraList();
    if (result) {
      setCameras(result.cameras);
      setSummary(result.summary);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (filter === 'online') return cameras.filter(c => c.is_active === 1);
    if (filter === 'offline') return cameras.filter(c => c.is_active === 0);
    return cameras;
  }, [cameras, filter]);

  // Group by site_code
  const sections = useMemo(() => {
    const groups: Record<string, Camera[]> = {};
    filtered.forEach(cam => {
      const key = cam.site_code || 'Other Cameras';
      if (!groups[key]) groups[key] = [];
      groups[key].push(cam);
    });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [filtered]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header style={styles.appbar}>
          <Appbar.Content title="Cameras" titleStyle={styles.appbarTitle} />
        </Appbar.Header>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loaderText}>Loading cameras...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.appbarTitle}>Cameras</Text>
          <Text style={styles.appbarSub}>{summary.active} online · {summary.inactive} offline</Text>
        </View>
        <Appbar.Action icon="refresh" color="#9ca3af" onPress={() => { setRefreshing(true); fetchData(); }} />
      </Appbar.Header>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'online', 'offline'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? `All (${summary.total})` : f === 'online' ? `Online (${summary.active})` : `Offline (${summary.inactive})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => String(item.id)}
        renderSectionHeader={({ section: { title, data } }) => (
          <View style={styles.sectionHeader}>
            <Icon name="tag-outline" size={13} color="#6b7280" />
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionCount}>{data.length}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <CameraCard
            item={item}
            onPress={() => navigation.navigate('CameraDetails', { camera: item })}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" colors={['#3b82f6']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon name="camera-off" size={48} color="#374151" />
            <Text style={styles.emptyText}>No cameras found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  appbar: { backgroundColor: '#161b22', elevation: 0, borderBottomWidth: 1, borderBottomColor: '#21262d' },
  appbarTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  appbarSub: { color: '#6b7280', fontSize: 11 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { color: '#6b7280', marginTop: 12, fontSize: 14 },

  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#161b22',
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#21262d',
  },
  filterTabActive: { backgroundColor: '#1d4ed8' },
  filterText: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  filterTextActive: { color: '#ffffff' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  sectionTitle: { flex: 1, fontSize: 12, color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  sectionCount: { fontSize: 11, color: '#4b5563', backgroundColor: '#21262d', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },

  listContent: { paddingBottom: 24 },

  card: {
    flexDirection: 'row',
    backgroundColor: '#161b22',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#21262d',
    overflow: 'hidden',
  },
  thumbWrap: { width: 90 },
  thumbPlaceholder: {
    width: 90, height: '100%', minHeight: 80,
    backgroundColor: '#0d1117',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  liveTag: {
    position: 'absolute', top: 6, left: 6,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#ef4444', marginRight: 3 },
  liveText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  cardInfo: { flex: 1, padding: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  camName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#e5e7eb' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaText: { fontSize: 11, color: '#6b7280', flex: 1 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { color: '#374151', marginTop: 12, fontSize: 15 },
});
