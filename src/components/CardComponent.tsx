import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Card, Text } from 'react-native-paper';

interface CardComponentProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const CardComponent: React.FC<CardComponentProps> = ({ title, subtitle, imageUrl, onPress, style }) => {
  return (
    <Card style={[styles.card, style]} onPress={onPress}>
      {imageUrl && <Card.Cover source={{ uri: imageUrl }} />}
      <Card.Content style={styles.content}>
        <Text variant="titleMedium">{title}</Text>
        {subtitle && <Text variant="bodyMedium" style={styles.subtitle}>{subtitle}</Text>}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 4,
  },
  content: {
    paddingTop: 12,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
});
