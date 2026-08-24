import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Appbar, Text, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { aivmsApi, UserProfile } from '../api/frigateApi';

const SettingRow = ({
  icon,
  iconColor = '#3b82f6',
  label,
  value,
  onPress,
  dangerous = false,
}: {
  icon: string;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  dangerous?: boolean;
}) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={[styles.settingIconWrap, { backgroundColor: (dangerous ? '#ef4444' : iconColor) + '18' }]}>
      <Icon name={icon} size={20} color={dangerous ? '#ef4444' : iconColor} />
    </View>
    <View style={styles.settingText}>
      <Text style={[styles.settingLabel, dangerous && { color: '#ef4444' }]}>{label}</Text>
      {!!value && <Text style={styles.settingValue}>{value}</Text>}
    </View>
    {onPress && (
      <Icon name="chevron-right" size={18} color="#374151" />
    )}
  </TouchableOpacity>
);

export const SettingsScreen = ({ navigation }: any) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const p = await aivmsApi.getProfile();
    setProfile(p);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await aivmsApi.logout();
            navigation.replace('Login');
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#9ca3af" />
        <Appbar.Content title="Settings" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {loading ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <>
              <View style={styles.avatarRing}>
                <Icon name="account" size={36} color="#3b82f6" />
              </View>
              <Text style={styles.profileName}>{profile?.username || '—'}</Text>
              <View style={styles.roleBadge}>
                <Icon name="shield-check" size={12} color="#22c55e" style={{ marginRight: 4 }} />
                <Text style={styles.roleText}>{profile?.role?.toUpperCase() || '—'}</Text>
              </View>
              <Text style={styles.profileSub}>
                {profile?.allowed_cameras?.length || 0} cameras accessible
              </Text>
            </>
          )}
        </View>

        {/* Server Info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SERVER</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="server-network"
              iconColor="#3b82f6"
              label="Server URL"
              value="aivms.shrotitele.com"
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="wifi"
              iconColor="#22c55e"
              label="Connection"
              value="HTTPS Secure"
            />
          </View>
        </View>

        {/* Allowed Cameras */}
        {profile && profile.allowed_cameras.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ALLOWED CAMERAS ({profile.allowed_cameras.length})</Text>
            <View style={styles.sectionCard}>
              <View style={styles.camTagsWrap}>
                {profile.allowed_cameras.map((cam) => (
                  <View key={cam} style={styles.camTag}>
                    <Icon name="cctv" size={10} color="#60a5fa" style={{ marginRight: 3 }} />
                    <Text style={styles.camTagText}>{cam}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>APP INFO</Text>
          <View style={styles.sectionCard}>
            <SettingRow icon="information-outline" iconColor="#a78bfa" label="Version" value="v1.0.0" />
            <View style={styles.rowDivider} />
            <SettingRow icon="code-tags" iconColor="#f97316" label="Platform" value="React Native" />
            <View style={styles.rowDivider} />
            <SettingRow icon="domain" iconColor="#6b7280" label="Organization" value="Shroti Tele" />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="logout"
              label="Sign Out"
              onPress={handleLogout}
              dangerous
            />
          </View>
        </View>

        <Text style={styles.footer}>AIVMS • Shroti Tele • 2026</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  appbar: { backgroundColor: '#161b22', elevation: 0, borderBottomWidth: 1, borderBottomColor: '#21262d' },
  appbarTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  scrollContent: { paddingBottom: 40 },

  profileCard: {
    alignItems: 'center',
    backgroundColor: '#161b22',
    margin: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#21262d',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  avatarRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#1e3a5f',
    borderWidth: 2, borderColor: '#3b82f640',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 6,
  },
  profileName: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#22c55e15', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4, marginTop: 8,
    borderWidth: 1, borderColor: '#22c55e30',
  },
  roleText: { fontSize: 11, color: '#22c55e', fontWeight: '800', letterSpacing: 1 },
  profileSub: { fontSize: 12, color: '#6b7280', marginTop: 6 },

  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionLabel: { fontSize: 11, color: '#4b5563', fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  sectionCard: {
    backgroundColor: '#161b22',
    borderRadius: 14, borderWidth: 1, borderColor: '#21262d', overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14,
  },
  settingIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 14, color: '#e5e7eb', fontWeight: '600' },
  settingValue: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  rowDivider: { height: 1, backgroundColor: '#21262d', marginLeft: 62 },

  camTagsWrap: {
    flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 6,
  },
  camTag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1e3a5f30', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: '#3b82f630',
  },
  camTagText: { fontSize: 10, color: '#93c5fd', fontWeight: '600' },

  footer: { textAlign: 'center', color: '#374151', fontSize: 11, marginTop: 8 },
});
