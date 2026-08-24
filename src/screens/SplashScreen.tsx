import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { aivmsApi } from '../api/frigateApi';

export const SplashScreen = ({ navigation }: any) => {
  useEffect(() => {
    const checkSession = async () => {
      // Small delay for splash aesthetics
      await new Promise<void>(r => setTimeout(() => r(), 1800));

      const hasSession = await aivmsApi.hasSession();
      if (hasSession) {
        // Verify session is still valid by hitting profile
        const profile = await aivmsApi.getProfile();
        if (profile) {
          navigation.replace('MainApp');
          return;
        }
      }
      navigation.replace('Login');
    };

    checkSession();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <View style={styles.centerContent}>
        <View style={styles.iconRing}>
          <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        </View>
        <Text style={styles.title}>AIVMS</Text>
        <Text style={styles.subtitle}>AI Video Management System</Text>
        <ActivityIndicator
          size="small"
          color="#3b82f6"
          style={styles.loader}
        />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>

      <Text style={styles.footer}>Powered by Shroti Tele • 2026</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Light background
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: '#135d9d10', // Light blue tint
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#135d9d08',
  },
  centerContent: {
    alignItems: 'center',
  },
  iconRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#135d9d30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#135d9d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: 130,
    height: 130,
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: '#135d9d', // Shroti Blue

    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  loader: {
    marginTop: 40,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    color: '#9ca3af',
    fontSize: 11,
  },
});
