import React from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme, Text, Appbar } from 'react-native-paper';
import { useRecordingsViewModel } from '../viewmodels/useRecordingsViewModel';
import { CardComponent } from '../components/CardComponent';

export const RecordingsScreen = () => {
  const theme = useTheme();
  const { recordings, loading, error, refetch } = useRecordingsViewModel();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading && recordings.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Recordings" color={theme.colors.onSurface} />
      </Appbar.Header>

      {error ? (
        <View style={styles.errorContainer}>
           <Text style={{ color: theme.colors.error }}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardComponent
            title={`Recording on ${item.camera}`}
            subtitle={`Start: ${formatDate(item.start_time)}`}
            onPress={() => console.log('Recording pressed', item.id)}
          />
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>No recordings found or endpoint placeholder used.</Text> : null
        }
      />
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
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#888',
  }
});
