import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Appbar, useTheme, Text, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const MOCK_STREAMS = [
  { id: '1', name: 'Front Yard', imageUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?q=80&w=600&auto=format&fit=crop' },
  { id: '2', name: 'Driveway', imageUrl: 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?q=80&w=600&auto=format&fit=crop' },
  { id: '3', name: 'Backyard', imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600&auto=format&fit=crop' },
  { id: '4', name: 'Side Gate', imageUrl: 'https://images.unsplash.com/photo-1517732306149-e8f829eb588a?q=80&w=600&auto=format&fit=crop' },
];

export const LiveViewScreen = ({ navigation }: any) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 4 }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={theme.colors.onSurface} />
        <Appbar.Content title="Live View Grid" titleStyle={styles.headerTitle} color={theme.colors.onSurface} />
        <Appbar.Action icon="view-grid" onPress={() => {}} color={theme.colors.onSurface} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.gridContainer}>
        {MOCK_STREAMS.map(stream => (
          <Surface key={stream.id} style={[styles.streamCard, { backgroundColor: '#000' }]} elevation={2}>
            <Image source={{ uri: stream.imageUrl }} style={styles.image} />
            <View style={styles.overlay}>
              <View style={styles.liveBadge}>
                <Icon name="record-circle" size={10} color="#e74c3c" style={{ marginRight: 4 }} />
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>LIVE</Text>
              </View>
              <Text style={styles.streamName}>{stream.name}</Text>
            </View>
          </Surface>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { textAlign: 'center', fontWeight: 'bold' },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  streamCard: {
    width: '50%', // 2 columns
    aspectRatio: 16 / 9,
    padding: 2,
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 6, left: 6, right: 6, bottom: 6,
    justifyContent: 'space-between'
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  streamName: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    fontSize: 12
  }
});
