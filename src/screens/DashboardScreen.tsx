import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme, Text, Card, Title, Paragraph, Appbar, Surface } from 'react-native-paper';
import { DetectionsCarousel } from '../components/DetectionsCarousel';
import { MOCK_DETECTIONS } from '../models/MockData';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Helper component for stat cards
const StatCard = ({ title, value, icon, color }: any) => {
  const theme = useTheme();
  return (
    <Surface style={[styles.statCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={2}>
      <View style={styles.statCardContent}>
        <View style={styles.statTextContainer}>
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>{title}</Text>
          <Text style={{ color: theme.colors.onSurface, fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>{value}</Text>
        </View>
        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
          <Icon name={icon} size={28} color={color} />
        </View>
      </View>
    </Surface>
  );
};

export const DashboardScreen = ({ navigation }: any) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 4 }}>
        <Appbar.Action icon="view-dashboard" color={theme.colors.primary} size={28} />
        <Appbar.Content title="Dashboard" titleStyle={{ textAlign: 'center', fontWeight: 'bold' }} color={theme.colors.onSurface} />
        <Appbar.Action icon="account-circle" onPress={() => {}} color={theme.colors.onSurface} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <DetectionsCarousel
          title="Recent Detections"
          data={MOCK_DETECTIONS}
          onViewAll={() => navigation.navigate('AllDetections')}
        />

        <View style={styles.statsContainer}>
          <StatCard title="Total Cameras" value="32" icon="cctv" color="#3498db" />
          <StatCard title="Active Cameras" value="12" icon="check-circle" color="#2ecc71" />
        </View>
        <View style={styles.statsContainer}>
          <StatCard title="Inactive Cameras" value="20" icon="camera-off" color="#e74c3c" />
          <StatCard title="Disabled Cameras" value="0" icon="video-off" color="#95a5a6" />
        </View>

        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Title title="Review Analytics" subtitle="Event trends over the last 7 days" />
          <Card.Content>
             {/* Placeholder for chart */}
             <View style={styles.chartPlaceholder}>
                <Text style={{ color: '#888' }}>Analytics Chart Placeholder</Text>
             </View>
          </Card.Content>
        </Card>

        {/* Bottom row of stats - Row 1 */}
        <View style={styles.bottomStatsContainer}>
          <Surface style={[styles.bottomStat, { backgroundColor: theme.colors.surfaceVariant }]} elevation={2}>
             <View style={styles.bottomStatHeader}>
               <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>Live Person Count</Text>
               <View style={[styles.smallIconBox, { backgroundColor: '#f39c1220' }]}>
                 <Icon name="account-group" size={16} color="#f39c12" />
               </View>
             </View>
             <Text style={{ color: '#f39c12', fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>14</Text>
          </Surface>
          
          <Surface style={[styles.bottomStat, { backgroundColor: theme.colors.surfaceVariant }]} elevation={2}>
             <View style={styles.bottomStatHeader}>
               <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>Alerts</Text>
               <View style={[styles.smallIconBox, { backgroundColor: '#9b59b620' }]}>
                 <Icon name="bell-alert" size={16} color="#9b59b6" />
               </View>
             </View>
             <Text style={{ color: '#9b59b6', fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>1274</Text>
             <Text style={{ color: theme.colors.error, fontSize: 10, marginTop: 4 }}>▼ Call Declined: 1208</Text>
          </Surface>
        </View>

        {/* Bottom row of stats - Row 2 */}
        <View style={[styles.bottomStatsContainer, { marginTop: 12 }]}>
          <Surface style={[styles.bottomStat, { backgroundColor: theme.colors.surfaceVariant }]} elevation={2}>
             <View style={styles.bottomStatHeader}>
               <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>WhatsApp Clips</Text>
               <View style={[styles.smallIconBox, { backgroundColor: '#2ecc7120' }]}>
                 <Icon name="whatsapp" size={16} color="#2ecc71" />
               </View>
             </View>
             <Text style={{ color: '#2ecc71', fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>2109</Text>
          </Surface>

          <Surface style={[styles.bottomStat, { backgroundColor: theme.colors.surfaceVariant }]} elevation={2}>
             <View style={styles.bottomStatHeader}>
               <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>Telegram Clips</Text>
               <View style={[styles.smallIconBox, { backgroundColor: '#3498db20' }]}>
                 <Icon name="send" size={16} color="#3498db" />
               </View>
             </View>
             <Text style={{ color: '#3498db', fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>1082</Text>
          </Surface>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  statTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  iconBox: {
    padding: 10,
    borderRadius: 12,
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  chartPlaceholder: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#444',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 16,
  },
  bottomStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  bottomStat: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 6,
    elevation: 2,
  },
  bottomStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  smallIconBox: {
    padding: 6,
    borderRadius: 16,
  }
});
