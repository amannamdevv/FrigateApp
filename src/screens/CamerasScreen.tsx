import React, { useContext } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme, Text, Appbar } from 'react-native-paper';
import { useCamerasViewModel } from '../viewmodels/useCamerasViewModel';
import { CardComponent } from '../components/CardComponent';
import { AuthContext } from '../store/AuthContext';

export const CamerasScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const { cameras, loading, error, refetch } = useCamerasViewModel();
  const auth = useContext(AuthContext);

  const getSnapshotUrl = (cameraName: string) => {
    return `${auth?.serverUrl}/api/${cameraName}/latest.jpg?h=300`;
  };

  if (loading && cameras.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Cameras" color={theme.colors.onSurface} />
      </Appbar.Header>

      {error ? (
        <View style={styles.errorContainer}>
           <Text style={{ color: theme.colors.error }}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={cameras}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <CardComponent
            title={item.name}
            subtitle={`Resolution: ${item.width}x${item.height} | Detect: ${item.detect.enabled ? 'On' : 'Off'}`}
            imageUrl={getSnapshotUrl(item.name)}
            onPress={() => navigation.navigate('CameraLive', { camera: item })}
          />
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

// Sub-screen for Live view
export const CameraLiveScreen = ({ route, navigation }: any) => {
  const { camera } = route.params;
  const theme = useTheme();
  const auth = useContext(AuthContext);

  // Simple MJPEG url for live view
  const streamUrl = `${auth?.serverUrl}/api/${camera.name}/video`;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={theme.colors.onSurface} />
        <Appbar.Content title={`${camera.name} Live`} color={theme.colors.onSurface} />
      </Appbar.Header>

      <View style={styles.videoContainer}>
         <CardComponent
           title="Live Stream"
           subtitle={streamUrl}
         />
         <Text style={{color: 'white', textAlign: 'center', marginTop: 20}}>
           Note: Native Video Player component requires native linking.
           Here we simulate live view with MJPEG URL: {streamUrl}
         </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  videoContainer: {
    flex: 1,
    padding: 16,
  }
});
