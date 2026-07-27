import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Detection } from '../models/MockData';

interface Props {
  detection: Detection;
  onPress?: () => void;
  style?: any;
}

export const DetectionCard: React.FC<Props> = ({ detection, onPress, style }) => {
  const theme = useTheme();

  // Dynamically select icon based on label
  let iconName = 'walk';
  if (detection.label.toLowerCase() === 'car') iconName = 'car';
  else if (detection.label.toLowerCase() === 'dog') iconName = 'dog';
  else if (detection.label.toLowerCase() === 'person') iconName = 'walk';
  else iconName = 'crosshairs'; // fallback

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }, style]}
    >
      <Image source={{ uri: detection.imageUrl }} style={styles.image} />
      
      {/* Top Left Icon */}
      <View style={styles.iconContainer}>
        <Icon name={iconName} size={16} color="#FFF" />
      </View>
      
      {/* Bottom Info Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.timeAgo}>{detection.timeAgo}</Text>
        <Text style={styles.dateText}>
          {new Date(detection.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    width: 280, // Fixed width for carousel
    height: 160,
    marginRight: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  iconContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', // Gradient-like dark overlay at bottom
  },
  timeAgo: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#FFF',
    fontSize: 12,
  },
});
