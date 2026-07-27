import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { Appbar, useTheme, Text, Chip, Searchbar } from 'react-native-paper';
import { DetectionCard } from '../components/DetectionCard';
import { MOCK_DETECTIONS } from '../models/MockData';

const { width } = Dimensions.get('window');

// We show 2 columns for a better mobile grid view
const numColumns = 2;
// Calculate item width accounting for margins
const itemWidth = (width - 48) / numColumns; 

export const AllDetectionsScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Dummy filters like the screenshot
  const filters = ['All', 'Person', 'Car', 'Dog'];

  const filteredDetections = MOCK_DETECTIONS.filter(d => {
    if (activeFilter !== 'All' && d.label !== activeFilter) return false;
    if (searchQuery && !d.camera.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 4 }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={theme.colors.onSurface} />
        <Appbar.Content title="All Detections" titleStyle={{ textAlign: 'center', fontWeight: 'bold' }} color={theme.colors.onSurface} />
        <Appbar.Action icon="filter-variant" onPress={() => {}} color={theme.colors.onSurface} />
      </Appbar.Header>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search cameras..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ backgroundColor: theme.colors.surfaceVariant }}
          iconColor={theme.colors.onSurfaceVariant}
          inputStyle={{ color: theme.colors.onSurface }}
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <Chip
              key={filter}
              selected={activeFilter === filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.chip,
                { backgroundColor: activeFilter === filter ? theme.colors.primary : theme.colors.surfaceVariant }
              ]}
              textStyle={{ color: activeFilter === filter ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}
            >
              {filter}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredDetections}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => (
          <DetectionCard
            detection={item}
            style={styles.gridItem}
            onPress={() => {}}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
             <Text style={{ color: theme.colors.onSurfaceVariant }}>No detections found.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chip: {
    marginRight: 8,
  },
  gridContent: {
    paddingHorizontal: 8, // 8 on each side + 8 margin on item = 16 total edge margin
    paddingBottom: 24,
  },
  gridItem: {
    width: itemWidth,
    height: 120, // slightly shorter for grid
    margin: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  }
});
