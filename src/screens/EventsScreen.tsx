import React, { useContext } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme, Text, Appbar } from 'react-native-paper';
import { useEventsViewModel } from '../viewmodels/useEventsViewModel';
import { CardComponent } from '../components/CardComponent';
import { AuthContext } from '../store/AuthContext';

export const EventsScreen = () => {
  const theme = useTheme();
  const { events, loading, error, refetch } = useEventsViewModel();
  const auth = useContext(AuthContext);

  const getThumbnailUrl = (eventId: string) => {
    return `${auth?.serverUrl}/api/events/${eventId}/thumbnail.jpg`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading && events.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Events" color={theme.colors.onSurface} />
      </Appbar.Header>

      {error ? (
        <View style={styles.errorContainer}>
           <Text style={{ color: theme.colors.error }}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardComponent
            title={`${item.label} on ${item.camera}`}
            subtitle={`Time: ${formatDate(item.start_time)} | Score: ${Math.round(item.top_score * 100)}%`}
            imageUrl={item.has_snapshot ? getThumbnailUrl(item.id) : undefined}
            onPress={() => console.log('Event pressed', item.id)}
          />
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>No events found.</Text> : null
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
