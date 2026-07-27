import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Appbar, useTheme, Text, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Dummy Camera Data
const MOCK_CAMERAS = [
  { id: '1', name: 'Front Yard', status: 'online', type: 'cctv', imageUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?q=80&w=600&auto=format&fit=crop' },
  { id: '2', name: 'Backyard', status: 'online', type: 'camera', imageUrl: 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?q=80&w=600&auto=format&fit=crop' },
  { id: '3', name: 'Garage', status: 'offline', type: 'cctv', imageUrl: null },
  { id: '4', name: 'Living Room', status: 'online', type: 'webcam', imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600&auto=format&fit=crop' },
  { id: '5', name: 'Side Gate', status: 'recording', type: 'cctv', imageUrl: 'https://images.unsplash.com/photo-1517732306149-e8f829eb588a?q=80&w=600&auto=format&fit=crop' },
];

export const CamerasScreen = ({ navigation }: any) => {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return theme.colors.primary; // Blue or green
      case 'offline': return theme.colors.error;
      case 'recording': return '#e74c3c'; // Red
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'online': return 'check-circle';
      case 'offline': return 'alert-circle';
      case 'recording': return 'record-circle';
      default: return 'help-circle';
    }
  };

  const renderCamera = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => navigation.navigate('CameraDetails', { camera: item })}
      style={styles.cardContainer}
    >
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Icon name="camera-off" size={48} color={theme.colors.onSurfaceVariant} />
              <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>No Signal</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
             <Icon name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} style={{ marginRight: 4 }} />
             <Text style={{ color: '#fff', fontSize: 12, textTransform: 'capitalize' }}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.cardInfo}>
          <Icon name="cctv" size={24} color={theme.colors.primary} />
          <View style={styles.cardTextContent}>
            <Text style={[styles.cameraName, { color: theme.colors.onSurface }]}>{item.name}</Text>
            <Text style={[styles.cameraType, { color: theme.colors.onSurfaceVariant }]}>1080p • 30fps</Text>
          </View>
          <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
        </View>
      </Surface>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 4 }}>
        <Appbar.Action icon="cctv" color={theme.colors.primary} size={28} />
        <Appbar.Content title="Cameras" titleStyle={styles.headerTitle} color={theme.colors.onSurface} />
        <Appbar.Action icon="plus" onPress={() => {}} color={theme.colors.onSurface} />
      </Appbar.Header>

      <FlatList
        data={MOCK_CAMERAS}
        keyExtractor={item => item.id}
        renderItem={renderCamera}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { textAlign: 'center', fontWeight: 'bold' },
  listContent: { padding: 16 },
  cardContainer: { marginBottom: 16 },
  card: { borderRadius: 12, overflow: 'hidden' },
  imageContainer: { height: 180, width: '100%', position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  statusBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12,
  },
  cardInfo: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16,
  },
  cardTextContent: { flex: 1, marginLeft: 12 },
  cameraName: { fontSize: 16, fontWeight: '600' },
  cameraType: { fontSize: 12, marginTop: 2 },
});
