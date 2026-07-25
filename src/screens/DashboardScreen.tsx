import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useCamerasViewModel } from '../viewmodels/useCamerasViewModel';
import { useEventsViewModel } from '../viewmodels/useEventsViewModel';

export const DashboardScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { cameras, loading: camerasLoading } = useCamerasViewModel();
  const { events, loading: eventsLoading } = useEventsViewModel();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>Dashboard</Text>
      </View>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard} onPress={() => navigation.navigate('CamerasTab')}>
          <Card.Content>
            <Text variant="titleMedium">Cameras</Text>
            <Text variant="displaySmall" style={{ color: theme.colors.primary }}>
              {camerasLoading ? '-' : cameras.length}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard} onPress={() => navigation.navigate('EventsTab')}>
          <Card.Content>
            <Text variant="titleMedium">Recent Events</Text>
            <Text variant="displaySmall" style={{ color: theme.colors.accent }}>
              {eventsLoading ? '-' : events.length}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.section}>
         <Text variant="titleLarge" style={styles.sectionTitle}>System Status</Text>
         <Card style={styles.statusCard}>
           <Card.Content>
             <Text>Frigate is running normally.</Text>
           </Card.Content>
         </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  section: {
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  statusCard: {
    marginBottom: 16,
  }
});
