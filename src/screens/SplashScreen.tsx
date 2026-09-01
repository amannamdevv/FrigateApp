import React, { useEffect } from 'react';
import { StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { aivmsApi } from '../api/frigateApi';

export const SplashScreen = ({ navigation }: any) => {
  useEffect(() => {
    const checkSession = async () => {
      // Small delay for splash aesthetics (similar to RMSApp's 3000ms delay)
      await new Promise<void>(r => setTimeout(() => r(), 3000));

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animatable.View
        style={styles.whiteCircle}
        duration={2000}
        animation="zoomIn"
      >
        <Image
          source={require('../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animatable.View>
      <Animatable.Text
        style={styles.text}
        duration={2000}
        animation="bounceInDown"
      >
        {'Welcome to Shroti Telecom \nPvt Ltd'}
      </Animatable.Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#c5d4eeff',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  logoImage: {
    width: 150,
    height: 150,
  },
  text: {
    color: '#02006B',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
});
