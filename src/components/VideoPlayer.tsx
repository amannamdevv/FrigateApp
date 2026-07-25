import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';

interface VideoPlayerProps {
  url: string;
  isLive?: boolean;
}

// Since react-native-video can be complex to setup on a fresh template without native linking steps
// we'll provide a placeholder for a real video player or an MJPEG stream handler.
export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, isLive }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1976D2" />
      <Text style={styles.text}>
        {isLive ? 'Loading Live Stream...' : 'Loading Video...'}
      </Text>
      <Text style={styles.urlText}>{url}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 250,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    marginTop: 16,
  },
  urlText: {
    color: '#888',
    fontSize: 10,
    marginTop: 8,
  }
});
