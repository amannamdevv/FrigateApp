import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Appbar, useTheme, Text, Surface, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const MOCK_EVENTS = [
  { id: '1', title: 'Person Detected', time: '10:45 AM', camera: 'Front Yard', type: 'person', severity: 'high' },
  { id: '2', title: 'Vehicle Detected', time: '09:30 AM', camera: 'Driveway', type: 'car', severity: 'medium' },
  { id: '3', title: 'Motion Detected', time: '08:15 AM', camera: 'Backyard', type: 'motion', severity: 'low' },
  { id: '4', title: 'Person Detected', time: '07:50 AM', camera: 'Side Gate', type: 'person', severity: 'high' },
  { id: '5', title: 'Camera Disconnected', time: '02:00 AM', camera: 'Garage', type: 'system', severity: 'critical' },
];

export const EventsScreen = ({ navigation }: any) => {
  const theme = useTheme();

  const getIconForType = (type: string) => {
    switch(type) {
      case 'person': return 'walk';
      case 'car': return 'car';
      case 'system': return 'alert';
      default: return 'motion-sensor';
    }
  };

  const getColorForSeverity = (severity: string) => {
    switch(severity) {
      case 'critical': return theme.colors.error;
      case 'high': return '#e67e22';
      case 'medium': return '#f1c40f';
      default: return theme.colors.primary;
    }
  };

  const renderEvent = ({ item }: { item: any }) => (
    <Surface style={[styles.eventCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={[styles.iconContainer, { backgroundColor: getColorForSeverity(item.severity) + '20' }]}>
        <Icon name={getIconForType(item.type)} size={24} color={getColorForSeverity(item.severity)} />
      </View>
      <View style={styles.eventInfo}>
        <Text style={[styles.eventTitle, { color: theme.colors.onSurface }]}>{item.title}</Text>
        <View style={styles.eventMeta}>
          <Icon name="cctv" size={14} color={theme.colors.onSurfaceVariant} style={{ marginRight: 4 }} />
          <Text style={[styles.eventCamera, { color: theme.colors.onSurfaceVariant }]}>{item.camera}</Text>
        </View>
      </View>
      <View style={styles.eventTimeContainer}>
        <Text style={[styles.eventTime, { color: theme.colors.onSurfaceVariant }]}>{item.time}</Text>
        <Icon name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} style={{ marginTop: 4 }} />
      </View>
    </Surface>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 4 }}>
        <Appbar.Action icon="bell" color={theme.colors.primary} size={28} />
        <Appbar.Content title="Events" titleStyle={styles.headerTitle} color={theme.colors.onSurface} />
        <Appbar.Action icon="magnify" onPress={() => {}} color={theme.colors.onSurface} />
      </Appbar.Header>

      <FlatList
        data={MOCK_EVENTS}
        keyExtractor={item => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { textAlign: 'center', fontWeight: 'bold' },
  listContent: { padding: 16 },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventCamera: {
    fontSize: 14,
  },
  eventTimeContainer: {
    alignItems: 'flex-end',
  },
  eventTime: {
    fontSize: 12,
  }
});
