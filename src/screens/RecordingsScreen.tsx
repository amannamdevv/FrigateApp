import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Appbar, Text, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { aivmsApi, ClipEntry, getMediaUrl } from '../api/frigateApi';

type TabType = 'whatsapp' | 'telegram';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  'image+video':            { color: '#22c55e', icon: 'check-circle',   label: 'IMG + VID' },
  'img_only_vidfail':       { color: '#f97316', icon: 'image-check',    label: 'IMG only' },
  'image_only':             { color: '#f97316', icon: 'image',          label: 'IMG only' },
  'skipped':                { color: '#6b7280', icon: 'skip-next',      label: 'Skipped' },
  'no_numbers_configured':  { color: '#6b7280', icon: 'phone-off',      label: 'No Numbers' },
};

const getStatusCfg = (key: string | undefined) =>
  STATUS_CONFIG[key ?? ''] ?? { color: '#9ca3af', icon: 'help-circle', label: key || '?' };

// ─── Date formatter ───────────────────────────────────────────────────────────
const fmtDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr.replace(' ', 'T'));
    return {
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  } catch { return { date: '—', time: dateStr }; }
};

// ─── Open media URL ──────────────────────────────────────────────────────
const openMedia = (navigation: any, path: string | null, label: string) => {
  const url = getMediaUrl(path);
  if (!url) {
    Alert.alert('Not available', `${label} path is not available for this event.`);
    return;
  }
  navigation.navigate('MediaViewer', { url, title: label });
};

const getMediaStatusColor = (status: string | null | undefined) => {
  if (!status) return { text: '#6b7280', bg: '#6b728020' };
  const s = status.toLowerCase();
  if (s === 'sent') return { text: '#22c55e', bg: '#22c55e20' };
  if (s === 'found') return { text: '#3b82f6', bg: '#3b82f620' };
  if (s === 'missing' || s === 'failed') return { text: '#ef4444', bg: '#ef444420' };
  if (s === 'skipped') return { text: '#9ca3af', bg: '#9ca3af20' };
  return { text: '#f59e0b', bg: '#f59e0b20' }; // orange
};

// ─── Clip Card Component ──────────────────────────────────────────────────────
const ClipCard = ({ item, type, navigation }: { item: ClipEntry; type: TabType; navigation: any }) => {
  const { date, time } = fmtDate(item.event_time);
  const statusKey  = type === 'whatsapp' ? item.wa_status : item.tg_status;
  const numbers    = type === 'whatsapp' ? item.wa_numbers : item.tg_phone_numbers;
  const cfg        = getStatusCfg(statusKey);

  const hasImg = item.img_status === 'sent' || item.img_status === 'found';
  const hasVid = item.vid_status === 'sent' || item.vid_status === 'found';

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={[styles.camBadge]}>
          <Icon name="cctv" size={12} color="#60a5fa" style={{ marginRight: 4 }} />
          <Text style={styles.cardCamera} numberOfLines={1}>{item.camera}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: cfg.color + '20', borderColor: cfg.color + '40' }]}>
          <Icon name={cfg.icon} size={11} color={cfg.color} style={{ marginRight: 3 }} />
          <Text style={[styles.statusChipText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>


      {/* Media Status */}
      <View style={styles.mediaRow}>
        <View style={styles.mediaCol}>
          <Text style={styles.mediaLabel}>Image</Text>
          <View style={[styles.mediaBadge, { backgroundColor: getMediaStatusColor(item.img_status).bg }]}>
            <Text style={[styles.mediaBadgeText, { color: getMediaStatusColor(item.img_status).text }]}>{item.img_status || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.mediaCol}>
          <Text style={styles.mediaLabel}>Video</Text>
          <View style={[styles.mediaBadge, { backgroundColor: getMediaStatusColor(item.vid_status).bg }]}>
            <Text style={[styles.mediaBadgeText, { color: getMediaStatusColor(item.vid_status).text }]}>{item.vid_status || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Time */}
      <View style={styles.timeRow}>
        <Icon name="clock-outline" size={12} color="#6b7280" />
        <Text style={styles.timeText}> {date} • {time}</Text>
      </View>

      {/* Numbers */}
      {!!numbers && (
        <View style={styles.numsRow}>
          <Icon name={type === 'whatsapp' ? 'whatsapp' : 'send-outline'} size={12} color="#6b7280" />
          <Text style={styles.numsText} numberOfLines={2}> {numbers.replace(/91/g, '+91 ').replace(/,/g, '\n')}</Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, !hasImg && styles.actionBtnDisabled]}
          onPress={() => openMedia(navigation, item.img_path, 'Image')}
          disabled={!hasImg}
          activeOpacity={0.75}
        >
          <Icon name="image" size={16} color={hasImg ? '#3b82f6' : '#374151'} />
          <Text style={[styles.actionBtnText, { color: hasImg ? '#3b82f6' : '#374151' }]}>
            View Image
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, !hasVid && styles.actionBtnDisabled, { borderColor: hasVid ? '#22c55e40' : '#21262d' }]}
          onPress={() => openMedia(navigation, item.clip_path, 'Video')}
          disabled={!hasVid}
          activeOpacity={0.75}
        >
          <Icon name="play-circle" size={16} color={hasVid ? '#22c55e' : '#374151'} />
          <Text style={[styles.actionBtnText, { color: hasVid ? '#22c55e' : '#374151' }]}>
            Play Video
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Count Filter Chip ────────────────────────────────────────────────────────
const CountChip = ({
  label, count, color, selected, onPress,
}: {
  label: string; count: number; color: string; selected: boolean; onPress: () => void;
}) => (
  <TouchableOpacity
    style={[
      styles.countChip,
      selected
        ? { backgroundColor: color + '25', borderColor: color }
        : {},
    ]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Text style={[styles.countChipNum, { color: selected ? color : '#e5e7eb' }]}>{count}</Text>
    <Text style={[styles.countChipLabel, { color: selected ? color : '#6b7280' }]} numberOfLines={1}>
      {getStatusCfg(label).label || label}
    </Text>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const RecordingsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab]     = useState<TabType>('whatsapp');
  const [waClips, setWaClips]         = useState<ClipEntry[]>([]);
  const [tgClips, setTgClips]         = useState<ClipEntry[]>([]);
  const [waCounts, setWaCounts]       = useState<Record<string, number>>({});
  const [tgCounts, setTgCounts]       = useState<Record<string, number>>({});
  const [wa24h, setWa24h]             = useState(0);
  const [tg24h, setTg24h]             = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  // Fetch ONLY dashboard stats (counts) on mount
  const fetchCounts = useCallback(async () => {
    const result = await aivmsApi.getDashboardStats();
    if (result) {
      setWaCounts(result.whatsapp_clips.status_counts);
      setTgCounts(result.telegram_clips.status_counts);
      setWa24h(result.whatsapp_clips.count_24h);
      setTg24h(result.telegram_clips.count_24h);
    }
  }, []);

  // Fetch paginated clips for a specific tab and page
  const fetchClipsPage = async (tab: TabType, page: number) => {
    return await aivmsApi.getPaginatedClips(tab, page, 20);
  };

  // Fetch clips (page 1 immediately, then background load up to 10 pages for 24h filters)
  const fetchAllClips = useCallback(async () => {
    setLoading(true);
    
    // 1. Fetch page 1 to unblock UI immediately
    const [waRes, tgRes] = await Promise.all([
      fetchClipsPage('whatsapp', 1),
      fetchClipsPage('telegram', 1),
    ]);
    
    setWaClips(waRes ? waRes.data : []);
    setTgClips(tgRes ? tgRes.data : []);
    setLoading(false); // UNBLOCK UI
    setRefreshing(false);

    // 2. Silently fetch remaining pages (MAX 10 to prevent app freeze!)
    const maxPages = 10;
    const dedupe = (arr: ClipEntry[]) => arr.filter((v, i, a) => a.findIndex(t => t.event_id === v.event_id) === i);

    if (waRes && waRes.total > 20) {
      const totalPages = Math.min(Math.ceil(waRes.total / 20), maxPages);
      const reqs = [];
      for (let p = 2; p <= totalPages; p++) reqs.push(fetchClipsPage('whatsapp', p));
      
      if (reqs.length > 0) {
        Promise.all(reqs).then(results => {
          let extra: ClipEntry[] = [];
          results.forEach(r => { if (r) extra = [...extra, ...r.data]; });
          setWaClips(prev => dedupe([...prev, ...extra]));
        }).catch(e => console.warn('[AIVMS] Background fetch WA error', e));
      }
    }

    if (tgRes && tgRes.total > 20) {
      const totalPages = Math.min(Math.ceil(tgRes.total / 20), maxPages);
      const reqs = [];
      for (let p = 2; p <= totalPages; p++) reqs.push(fetchClipsPage('telegram', p));
      
      if (reqs.length > 0) {
        Promise.all(reqs).then(results => {
          let extra: ClipEntry[] = [];
          results.forEach(r => { if (r) extra = [...extra, ...r.data]; });
          setTgClips(prev => dedupe([...prev, ...extra]));
        }).catch(e => console.warn('[AIVMS] Background fetch TG error', e));
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCounts();
    fetchAllClips();
  }, [fetchCounts, fetchAllClips]);

  // Reset filter when switching tabs
  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setStatusFilter(null);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCounts();
    fetchAllClips();
  }, [fetchCounts, fetchAllClips]);



  const rawData    = activeTab === 'whatsapp' ? waClips : tgClips;
  const counts     = activeTab === 'whatsapp' ? waCounts : tgCounts;
  const total24h   = activeTab === 'whatsapp' ? wa24h : tg24h;

  // Helper to ensure filter only applies to last 24h (matching the API count)
  const isLast24h = (timeStr: string) => {
    return (Date.now() - new Date(timeStr).getTime()) <= 24 * 60 * 60 * 1000;
  };

  // Client-side filtering
  const filtered = useMemo(() => {
    if (!statusFilter) return rawData; // Show all time if no filter
    return rawData.filter(c => {
      const key = activeTab === 'whatsapp' ? c.wa_status : c.tg_status;
      // Filter MUST match the 24h window because the counts are 24h only!
      return key === statusFilter && isLast24h(c.event_time);
    });
  }, [rawData, statusFilter, activeTab]);



  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header style={styles.appbar}>
          <Appbar.BackAction onPress={() => navigation.goBack()} color="#9ca3af" />
          <Appbar.Content title="Clips & Recordings" titleStyle={styles.appbarTitle} />
        </Appbar.Header>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loaderText}>Loading clips...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── App Bar ── */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#9ca3af" />
        <View style={{ flex: 1 }}>
          <Text style={styles.appbarTitle}>Clips & Recordings</Text>
          <Text style={styles.appbarSub}>
            {statusFilter
              ? `Filtered: ${getStatusCfg(statusFilter).label}`
              : `${total24h} clips in last 24h`}
          </Text>
        </View>
        <Appbar.Action icon="refresh" color="#9ca3af" onPress={onRefresh} />
      </Appbar.Header>

      {/* ── Tab Bar ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'whatsapp' && { borderBottomColor: '#22c55e' }]}
          onPress={() => switchTab('whatsapp')}
        >
          <Icon name="whatsapp" size={18} color={activeTab === 'whatsapp' ? '#22c55e' : '#6b7280'} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === 'whatsapp' && { color: '#22c55e' }]}>
            WhatsApp
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: activeTab === 'whatsapp' ? '#22c55e20' : '#21262d' }]}>
            <Text style={[styles.tabBadgeText, { color: activeTab === 'whatsapp' ? '#22c55e' : '#6b7280' }]}>{wa24h}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'telegram' && { borderBottomColor: '#a78bfa' }]}
          onPress={() => switchTab('telegram')}
        >
          <Icon name="send" size={16} color={activeTab === 'telegram' ? '#a78bfa' : '#6b7280'} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === 'telegram' && { color: '#a78bfa' }]}>
            Telegram
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: activeTab === 'telegram' ? '#a78bfa20' : '#21262d' }]}>
            <Text style={[styles.tabBadgeText, { color: activeTab === 'telegram' ? '#a78bfa' : '#6b7280' }]}>{tg24h}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Status Count Filter Chips (clickable!) ── */}
      {Object.keys(counts).length > 0 && (
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            {/* "All" chip */}
            <CountChip
              label=""
              count={total24h}
              color="#3b82f6"
              selected={statusFilter === null}
              onPress={() => setStatusFilter(null)}
            />
            {Object.entries(counts).map(([k, v]) => {
              const cfg = getStatusCfg(k);
              return (
                <CountChip
                  key={k}
                  label={k}
                  count={v}
                  color={cfg.color}
                  selected={statusFilter === k}
                  onPress={() => setStatusFilter(prev => prev === k ? null : k)}
                />
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Clips List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item, idx) => `${item.event_id}-${idx}`}
        renderItem={({ item }) => <ClipCard item={item} type={activeTab} navigation={navigation} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListFooterComponent={null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" colors={['#3b82f6']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon name="video-off-outline" size={52} color="#374151" />
            <Text style={styles.emptyTitle}>No clips found</Text>
            <Text style={styles.emptySubtitle}>
              {statusFilter ? `No "${getStatusCfg(statusFilter).label}" clips available` : 'No recent clips'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f3f4f6' }, // Light gray background
  appbar:       { backgroundColor: '#ffffff', elevation: 2, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  appbarTitle:  { color: '#135d9d', fontSize: 20, fontWeight: '800', letterSpacing: 0.2 },
  appbarSub:    { color: '#6b7280', fontSize: 13, fontWeight: '500' },
  loaderWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText:   { color: '#6b7280', marginTop: 12, fontSize: 16 },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 1,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderBottomWidth: 3, borderBottomColor: 'transparent',
    gap: 6,
  },
  tabText:        { fontSize: 15, fontWeight: '800', color: '#6b7280' },
  tabBadge:       { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 4 },
  tabBadgeText:   { fontSize: 12, fontWeight: '800' },

  // Filter bar
  filterBar: {
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  countChip: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  countChipNum:   { fontSize: 22, fontWeight: '900' },
  countChipLabel: { fontSize: 12, fontWeight: '700', marginTop: 2, textAlign: 'center' },

  // List
  listContent: { padding: 16, paddingBottom: 40 },

  // Card
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  camBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardCamera: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 0.3,
    flex: 1,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusChipText: { fontSize: 11, fontWeight: '800' },

  // Meta rows
  mediaRow: { flexDirection: 'row', gap: 16, marginBottom: 14, marginTop: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  mediaCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mediaLabel: { fontSize: 13, color: '#4b5563', fontWeight: '700' },
  mediaBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  mediaBadgeText: { fontSize: 11, fontWeight: '800' },

  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  timeText: { fontSize: 13, color: '#4b5563', fontWeight: '500' },
  numsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, marginTop: 4 },
  numsText: { fontSize: 13, color: '#6b7280', flex: 1, lineHeight: 20, fontWeight: '500' },

  // Action buttons
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#3b82f650',
  },
  actionBtnDisabled: {
    opacity: 0.4,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  actionBtnText: { fontSize: 14, fontWeight: '800' },

  // Empty state
  emptyWrap:     { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 40 },
  emptyTitle:    { color: '#4b5563', marginTop: 16, fontSize: 18, fontWeight: '800' },
  emptySubtitle: { color: '#6b7280', marginTop: 8, fontSize: 14, textAlign: 'center' },
});
