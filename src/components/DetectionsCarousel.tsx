import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { DetectionCard } from './DetectionCard';
import { Detection } from '../models/MockData';

interface Props {
  title: string;
  data: Detection[];
  onViewAll: () => void;
}

const { width } = Dimensions.get('window');

export const DetectionsCarousel: React.FC<Props> = ({ title, data, onViewAll }) => {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scrolling logic like Hotstar
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (data.length > 0 && flatListRef.current) {
        let nextIndex = currentIndex + 1;
        if (nextIndex >= data.length) {
          nextIndex = 0; // Loop back to start
        }
        flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
        setCurrentIndex(nextIndex);
      }
    }, 4000); // Scroll every 4 seconds

    return () => clearInterval(intervalId);
  }, [currentIndex, data.length]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>{title}</Text>
        <Button mode="text" onPress={onViewAll} textColor="#3498db" compact>
          View all
        </Button>
      </View>
      <FlatList
        ref={flatListRef}
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DetectionCard detection={item} />}
        contentContainerStyle={styles.listContent}
        snapToInterval={280 + 16} // card width + margin
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    paddingLeft: 16,
    paddingRight: 16,
  },
});
