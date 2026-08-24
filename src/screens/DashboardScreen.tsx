import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Text, Appbar, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { aivmsApi, DashboardStats, CamerasResponse, getMediaUrl, Camera } from '../api/frigateApi';

// ─── Open media helper ────────────────────────────────────────────────────────
const openMedia = (navigation: any, path: string | null, label: string) => {
  const url = getMediaUrl(path);
  if (!url) { Alert.alert('Not available', `${label} not available.`); return; }
  navigation.navigate('MediaViewer', { url, title: label });
};

// ─── Helper: format datetime ──────────────────────────────────────────────────
const formatTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr.replace(' ', 'T'));
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return dateStr;
  }
};

// ─── Call Status Color/Icon ───────────────────────────────────────────────────
const callStatusConfig: Record<string, { color: string; icon: string }> = {
  'Call Received': { color: '#22c55e', icon: 'phone-check' },
  'Call Declined': { color: '#f97316', icon: 'phone-cancel' },
  'Missed': { color: '#ef4444', icon: 'phone-missed' },
  'FAILED': { color: '#dc2626', icon: 'phone-alert' },
  'PDROP': { color: '#a855f7', icon: 'phone-hangup' },
  'SKIPPED_COOLDOWN': { color: '#6b7280', icon: 'phone-off' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const BigStatCard = ({
  icon,
  iconColor,
  iconBg,
  title,
  value,
  sub,
}: any) => (
  <View style={[styles.bigStatCard, { borderLeftColor: iconColor }]}>
    <View style={[styles.bigStatIcon, { backgroundColor: iconBg }]}>
      <Icon name={icon} size={26} color={iconColor} />
    </View>
    <View style={styles.bigStatText}>
      <Text style={styles.bigStatValue}>{value}</Text>
      <Text style={styles.bigStatTitle}>{title}</Text>
      {!!sub && <Text style={styles.bigStatSub}>{sub}</Text>}
    </View>
  </View>
);

const StatusPill = ({ label, count, color }: any) => (
  <View style={[styles.pill, { borderColor: color + '50', backgroundColor: color + '18' }]}>
    <View style={[styles.pillDot, { backgroundColor: color }]} />
    <Text style={[styles.pillText, { color }]} numberOfLines={1}>
      {label}: <Text style={{ fontWeight: '700' }}>{count}</Text>
    </Text>
  </View>
);

const SectionHeader = ({ title, onPress, actionLabel }: any) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onPress && (
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.sectionAction}>{actionLabel || 'See All'}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const DashboardScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [cameraSummary, setCameraSummary] = useState<CamerasResponse['summary'] | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [recentCallAlerts, setRecentCallAlerts] = useState<any[]>([]);
  const [username, setUsername] = useState('Admin');

  const fetchData = useCallback(async () => {
    try {
      const [dashStats, camsData, profile, callAlertsData] = await Promise.all([
        aivmsApi.getDashboardStats(),
        aivmsApi.getCameraList(),
        aivmsApi.getProfile(),
        aivmsApi.getPaginatedCallAlerts(1, 10), // Fetch top 10 for dashboard
      ]);
      if (dashStats) setStats(dashStats);
      if (camsData) {
        setCameraSummary(camsData.summary);
        setCameras(camsData.cameras || []);
      }
      if (callAlertsData) setRecentCallAlerts(callAlertsData.data || []);
      if (profile) setUsername(profile.username);
    } catch (e) {
      console.warn('[Dashboard] fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header style={styles.appbar}>
          <Appbar.Content title="Dashboard" titleStyle={styles.appbarTitle} />
          <Appbar.Action icon="account-circle-outline" color="#9ca3af" onPress={() => navigation.navigate('Settings')} />
        </Appbar.Header>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loaderText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  const callAlerts = stats?.call_alerts;
  const waClips = stats?.whatsapp_clips;
  const tgClips = stats?.telegram_clips;

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <View style={styles.appbarLeft}>
          <Icon name="cctv" size={24} color="#3b82f6" style={{ marginLeft: 12 }} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.appbarTitle}>Dashboard</Text>
            <Text style={styles.appbarSub}>Welcome, {username}</Text>
          </View>
        </View>
        <Appbar.Action
          icon="account-circle-outline"
          color="#9ca3af"
          onPress={() => navigation.navigate('Settings')}
        />
      </Appbar.Header>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Camera Summary Row ── */}
        {cameraSummary && (
          <View style={styles.cameraRow}>
            <TouchableOpacity style={styles.camStat} onPress={() => navigation.navigate('Cameras')}>
              <Text style={styles.camStatNum}>{cameraSummary.total}</Text>
              <Text style={styles.camStatLabel}>Total</Text>
            </TouchableOpacity>
            <View style={styles.camDivider} />
            <TouchableOpacity style={styles.camStat} onPress={() => navigation.navigate('Cameras')}>
              <Text style={[styles.camStatNum, { color: '#22c55e' }]}>{cameraSummary.active}</Text>
              <Text style={styles.camStatLabel}>Online</Text>
            </TouchableOpacity>
            <View style={styles.camDivider} />
            <TouchableOpacity style={styles.camStat} onPress={() => navigation.navigate('Cameras')}>
              <Text style={[styles.camStatNum, { color: '#ef4444' }]}>{cameraSummary.inactive}</Text>
              <Text style={styles.camStatLabel}>Offline</Text>
            </TouchableOpacity>
            <View style={styles.camDivider} />
            <View style={styles.camStat}>
              <Icon name="camera-outline" size={20} color="#3b82f6" />
              <Text style={[styles.camStatLabel, { marginTop: 2 }]}>Cameras</Text>
            </View>
          </View>
        )}

        {/* ── All Cameras List ── */}
        {cameras.length > 0 && (
          <>
            <SectionHeader
              title="All Cameras"
              onPress={() => navigation.navigate('Cameras')}
              actionLabel="View Groups"
            />
            <View style={styles.card}>
              {cameras.map((cam, idx) => {
                const isActive = cam.is_active === 1;
                return (
                  <View key={`dash-cam-${cam.id}-${idx}`}>
                    <TouchableOpacity
                      style={styles.clipRow}
                      activeOpacity={0.75}
                      onPress={() => navigation.navigate('CameraDetails', { camera: cam })}
                    >
                      <View style={[styles.clipIconWrap, { backgroundColor: isActive ? '#22c55e15' : '#ef444415' }]}>
                        <Icon name="cctv" size={22} color={isActive ? '#22c55e' : '#ef4444'} />
                      </View>
                      <View style={styles.clipInfo}>
                        <Text style={styles.clipCamera} numberOfLines={1}>{cam.camera_name}</Text>
                        <Text style={styles.clipTime} numberOfLines={1}>{cam.location || cam.site_code || 'Unknown Location'}</Text>
                      </View>
                      <View style={styles.clipBadges}>
                        <View style={[styles.badge, { backgroundColor: isActive ? '#22c55e20' : '#ef444420' }]}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isActive ? '#22c55e' : '#ef4444', marginRight: 4 }} />
                          <Text style={[styles.badgeText, { color: isActive ? '#22c55e' : '#ef4444' }]}>
                            {isActive ? 'Online' : 'Offline'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {idx < cameras.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── Big Stat Cards ── */}
        <SectionHeader title="24h Overview" />
        <View style={styles.bigStatRow}>
          <BigStatCard
            icon="phone-ring"
            iconColor="#3b82f6"
            iconBg="#3b82f615"
            title="Call Alerts"
            value={callAlerts?.count_24h ?? '—'}
            sub="Last 24 hours"
          />
          <BigStatCard
            icon="whatsapp"
            iconColor="#22c55e"
            iconBg="#22c55e15"
            title="WhatsApp Clips"
            value={waClips?.count_24h ?? '—'}
            sub="Last 24 hours"
          />
        </View>
        <View style={styles.bigStatRow}>
          <BigStatCard
            icon="send"
            iconColor="#a78bfa"
            iconBg="#a78bfa15"
            title="Telegram Clips"
            value={tgClips?.count_24h ?? '—'}
            sub="Last 24 hours"
          />
          <BigStatCard
            icon="video-check"
            iconColor="#f97316"
            iconBg="#f9731615"
            title="img+video"
            value={waClips?.status_counts?.['image+video'] ?? '—'}
            sub="WhatsApp success"
          />
        </View>

        {/* ── Call Alert Status Breakdown ── */}
        {callAlerts && Object.keys(callAlerts.status_counts).length > 0 && (
          <>
            <SectionHeader title="Call Status Breakdown" />
            <View style={styles.pillsRow}>
              {Object.entries(callAlerts.status_counts).map(([label, count]) => {
                const cfg = callStatusConfig[label] || { color: '#9ca3af', icon: 'phone' };
                return <StatusPill key={label} label={label} count={count} color={cfg.color} />;
              })}
            </View>
          </>
        )}

        {/* ── Recent Call Alerts ── */}
        {recentCallAlerts.length > 0 && (
          <>
            <SectionHeader
              title="Recent Call Alerts"
              onPress={() => navigation.navigate('Events')}
              actionLabel="View All"
            />
            <View style={styles.card}>
              {recentCallAlerts.slice(0, 10).map((alert, idx) => {
                const cfg = callStatusConfig[alert.call_status] || { color: '#9ca3af', icon: 'phone' };
                return (
                  <View key={`${alert.id}-${idx}`}>
                    <View style={styles.alertRow}>
                      <View style={[styles.alertIconWrap, { backgroundColor: cfg.color + '20' }]}>
                        <Icon name={cfg.icon} size={18} color={cfg.color} />
                      </View>
                      <View style={styles.alertInfo}>
                        <Text style={styles.alertCamera} numberOfLines={1}>
                          {alert.camera_name.toUpperCase()}
                        </Text>
                        <Text style={styles.alertPhone}>📞 +{alert.phone_number}</Text>
                      </View>
                      <View style={styles.alertRight}>
                        <Text style={[styles.alertStatus, { color: cfg.color }]} numberOfLines={1}>
                          {alert.call_status}
                        </Text>
                        <Text style={styles.alertTime}>{formatTime(alert.created_at)}</Text>
                      </View>
                    </View>
                    {idx < Math.min(recentCallAlerts.length, 10) - 1 && (
                      <View style={styles.divider} />
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── Recent WhatsApp Clips ── */}
        {waClips && waClips.recent.length > 0 && (
          <>
            <SectionHeader
              title="Recent WhatsApp Clips"
              onPress={() => navigation.navigate('Recordings')}
              actionLabel="View All"
            />
            <View style={styles.card}>
              {waClips.recent.slice(0, 5).map((clip, idx) => {
                const hasImg = clip.img_status === 'sent' || clip.img_status === 'found';
                const hasVid = clip.vid_status === 'sent' || clip.vid_status === 'found';
                return (
                  <View key={`wa-${clip.event_id}-${idx}`}>
                    <TouchableOpacity
                      style={styles.clipRow}
                      activeOpacity={0.75}
                      onPress={() => {
                        // prefer video, fallback to image
                        if (hasVid) openMedia(navigation, clip.clip_path, 'Video');
                        else if (hasImg) openMedia(navigation, clip.img_path, 'Image');
                        else Alert.alert('Not available', 'No media for this event.');
                      }}
                    >
                      <View style={styles.clipIconWrap}>
                        <Icon name="whatsapp" size={20} color="#22c55e" />
                      </View>
                      <View style={styles.clipInfo}>
                        <Text style={styles.clipCamera} numberOfLines={1}>{clip.camera}</Text>
                        <Text style={styles.clipTime}>{formatTime(clip.event_time)}</Text>
                      </View>
                      <View style={styles.clipBadges}>
                        {/* Image badge */}
                        <TouchableOpacity
                          style={[styles.badge, { backgroundColor: hasImg ? '#22c55e20' : '#ef444420' }]}
                          onPress={() => openMedia(navigation, clip.img_path, 'Image')}
                          disabled={!hasImg}
                        >
                          <Icon name={hasImg ? 'image-check' : 'image-off'} size={11} color={hasImg ? '#22c55e' : '#ef4444'} style={{ marginRight: 3 }} />
                          <Text style={[styles.badgeText, { color: hasImg ? '#22c55e' : '#ef4444' }]}>IMG</Text>
                        </TouchableOpacity>
                        {/* Video badge */}
                        <TouchableOpacity
                          style={[styles.badge, { backgroundColor: hasVid ? '#3b82f620' : '#ef444420', marginLeft: 5 }]}
                          onPress={() => openMedia(navigation, clip.clip_path, 'Video')}
                          disabled={!hasVid}
                        >
                          <Icon name={hasVid ? 'play-circle' : 'video-off'} size={11} color={hasVid ? '#3b82f6' : '#ef4444'} style={{ marginRight: 3 }} />
                          <Text style={[styles.badgeText, { color: hasVid ? '#3b82f6' : '#ef4444' }]}>VID</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                    {idx < Math.min(waClips.recent.length, 5) - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' }, // Light gray bg
  appbar: { backgroundColor: '#ffffff', elevation: 2, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  appbarLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  appbarTitle: { color: '#135d9d', fontSize: 20, fontWeight: '800' }, // Shroti Blue
  appbarSub: { color: '#6b7280', fontSize: 13, fontWeight: '500' },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { color: '#6b7280', marginTop: 12, fontSize: 16 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  // Camera summary row
  cameraRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  camStat: { flex: 1, alignItems: 'center' },
  camStatNum: { fontSize: 26, fontWeight: '800', color: '#111827' },
  camStatLabel: { fontSize: 13, color: '#4b5563', marginTop: 4, fontWeight: '500' },
  camDivider: { width: 1, height: 40, backgroundColor: '#e5e7eb' },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', letterSpacing: 0.3 },
  sectionAction: { fontSize: 15, color: '#135d9d', fontWeight: '700' },

  // Big stat cards
  bigStatRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  bigStatCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 4,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  bigStatIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  bigStatText: { flex: 1 },
  bigStatValue: { fontSize: 28, fontWeight: '900', color: '#111827' },
  bigStatTitle: { fontSize: 13, color: '#4b5563', marginTop: 2, fontWeight: '700' },
  bigStatSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  // Status pills
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  pillText: { fontSize: 13, fontWeight: '600' },

  // Card container
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },

  // Alert row
  alertRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  alertIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  alertInfo: { flex: 1 },
  alertCamera: { fontSize: 15, fontWeight: '800', color: '#111827', letterSpacing: 0.2 },
  alertPhone: { fontSize: 13, color: '#4b5563', marginTop: 3, fontWeight: '500' },
  alertRight: { alignItems: 'flex-end' },
  alertStatus: { fontSize: 13, fontWeight: '800' },
  alertTime: { fontSize: 12, color: '#6b7280', marginTop: 3, fontWeight: '500' },

  // Clip row
  clipRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  clipIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#22c55e15', alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  clipInfo: { flex: 1 },
  clipCamera: { fontSize: 15, fontWeight: '800', color: '#111827' },
  clipTime: { fontSize: 13, color: '#6b7280', marginTop: 3, fontWeight: '500' },
  clipBadges: { flexDirection: 'row' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center' },
  badgeText: { fontSize: 11, fontWeight: '800' },
});
