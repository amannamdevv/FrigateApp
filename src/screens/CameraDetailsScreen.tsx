import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Appbar, useTheme, Text, Surface, Button, Divider, List } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const CameraDetailsScreen = ({ route, navigation }: any) => {
  const theme = useTheme();
  const { camera } = route.params || { camera: { name: 'Unknown Camera', status: 'offline', imageUrl: null } };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 4 }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={theme.colors.onSurface} />
        <Appbar.Content title={camera.name} titleStyle={styles.headerTitle} color={theme.colors.onSurface} />
        <Appbar.Action icon="cog" onPress={() => {}} color={theme.colors.onSurface} />
      </Appbar.Header>

      <ScrollView>
        {/* Live View Placeholder */}
        <Surface style={[styles.videoContainer, { backgroundColor: '#000' }]} elevation={4}>
          {camera.imageUrl ? (
            <Image source={{ uri: camera.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.noSignal}>
              <Icon name="camera-off" size={64} color="#555" />
              <Text style={{ color: '#555', marginTop: 16 }}>No Signal Available</Text>
            </View>
          )}
          <View style={styles.videoOverlay}>
            <View style={styles.liveBadge}>
              <Icon name="record-circle" size={12} color="#e74c3c" style={{ marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>LIVE</Text>
            </View>
            <View style={styles.controlsBadge}>
              <Icon name="fullscreen" size={24} color="#fff" />
            </View>
          </View>
        </Surface>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Button icon="camera-iris" mode="contained-tonal" onPress={() => {}} style={styles.actionBtn}>
            Snapshot
          </Button>
          <Button icon="record-rec" mode="contained-tonal" onPress={() => {}} style={styles.actionBtn}>
            Record
          </Button>
          <Button icon="microphone" mode="contained-tonal" onPress={() => {}} style={styles.actionBtn}>
            Speak
          </Button>
        </View>

        <Divider style={{ backgroundColor: theme.colors.surfaceVariant, height: 1 }} />

        {/* Details List */}
        <List.Section>
          <List.Subheader style={{ color: theme.colors.primary }}>Camera Information</List.Subheader>
          <List.Item
            title="Status"
            description={camera.status.toUpperCase()}
            left={props => <List.Icon {...props} icon="information" />}
            descriptionStyle={{ color: camera.status === 'online' ? theme.colors.primary : theme.colors.error }}
          />
          <List.Item
            title="Resolution"
            description="1920x1080 (1080p)"
            left={props => <List.Icon {...props} icon="monitor" />}
          />
          <List.Item
            title="Frame Rate"
            description="30 FPS"
            left={props => <List.Icon {...props} icon="filmstrip" />}
          />
          <List.Item
            title="IP Address"
            description="192.168.1.105"
            left={props => <List.Icon {...props} icon="lan" />}
          />
        </List.Section>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { textAlign: 'center', fontWeight: 'bold' },
  videoContainer: { width: '100%', height: 250, position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  noSignal: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  videoOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'space-between', padding: 12
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)',
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4
  },
  controlsBadge: {
    alignSelf: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 24,
    marginTop: 'auto'
  },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: 16 },
  actionBtn: { flex: 1, marginHorizontal: 8, borderRadius: 8 },
});
