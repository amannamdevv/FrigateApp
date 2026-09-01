import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  StatusBar
} from 'react-native';
import { TextInput, Text, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { aivmsApi } from '../api/frigateApi';

const { width, height } = Dimensions.get('window');

export const LoginScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await aivmsApi.login(username.trim(), password.trim());
    setLoading(false);
    if (result.success) {
      navigation.replace('MainApp');
    } else {
      setError(result.message || 'Login failed. Check credentials.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Absolute Background Image so keyboard doesn't squish it */}
      <Image
        source={require('../assets/login_bg_final.jpg')}
        style={styles.bgImage}
        resizeMode="cover"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Branding Section */}
          <View style={styles.topBranding}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.smallBrandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandTitleSmall}>Shroti Telecom Pvt. Ltd.</Text>
          </View>

          {/* Spacer to push AIVMS down (Reduced to move content up) */}
          <View style={{ height: 20 }} />

          {/* Main AIVMS Section with Logo */}
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <View style={styles.whiteCircle}>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <View style={styles.heroCol}>
              <Text style={styles.heroTitle}>AIVMS</Text>
              <Text style={styles.heroSideTextBelow}>Artificial Intelligence Video Management System</Text>
            </View>
          </View>

          {/* Spacer between Hero and Login Card */}
          <View style={{ height: 30 }} />

          {/* Login Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.welcomeText}>Welcome to STPL</Text>
                <Text style={styles.pleaseLoginText}>Please login to continue</Text>
              </View>
            </View>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Icon name="alert-circle-outline" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Icon name="account-outline" size={22} color="#135d9d" style={styles.inputIcon} />
              <TextInput
                value={username}
                onChangeText={(v) => { setUsername(v); setError(''); }}
                placeholder="Username"
                placeholderTextColor="#6b7280"
                style={styles.textInput}
                autoCapitalize="none"
                autoCorrect={false}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                textColor="#111827"
                cursorColor="#0252a3"
                selectionColor="rgba(2, 82, 163, 0.3)"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Icon name="lock-outline" size={22} color="#135d9d" style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={(v) => { setPassword(v); setError(''); }}
                placeholder="Password"
                placeholderTextColor="#6b7280"
                style={styles.textInput}
                secureTextEntry={!showPass}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                textColor="#111827"
                cursorColor="#0252a3"
                selectionColor="rgba(2, 82, 163, 0.3)"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Icon name={showPass ? 'eye-outline' : 'eye-off-outline'} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Primary Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Icon name="login" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.loginBtnText}>Login</Text>
                </>
              )}
            </TouchableOpacity>
          </View>



          {/* Footer - Moved exactly to bottom with full width white bar */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerCopyright}>© 2026 Shroti Telecom Private Limited. All Rights Reserved.</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  bgImage: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    justifyContent: 'space-between',
  },

  // Branding (Inset with padding)
  topBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, // Reduced since logo is gone
    paddingHorizontal: 24,
  },
  smallBrandLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
    borderRadius: 12, // Crops the square white background into a perfect circle
  },
  brandTitleSmall: {
    fontSize: 11, // Very small text as requested
    fontWeight: '700',
    color: '#0f172a',
    opacity: 0.6, // Make it subtle
    letterSpacing: 0.5,
  },

  // Hero (Inset)
  heroSection: {
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center', // Center the logo horizontally
    marginBottom: 16,
    transform: [{ translateX: -60 }], // Shift logo further to the left
  },
  whiteCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 125, // Restored/slightly larger to keep icon big while clipping the extra white space
    height: 125,
  },
  heroCol: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginLeft: 44, // Shifting AIVMS text a bit more to the right
    maxWidth: 240, // Constrain width so the long text wraps before hitting the tower
  },
  heroTitle: {
    fontSize: 52,
    fontWeight: '900',
    color: '#0252a3',
    letterSpacing: -1,
  },
  heroSideTextBelow: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: -4, // Bring it closer to AIVMS
  },

  // Card (Inset)
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 40,
  },
  cardHeaderRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  shieldIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  pleaseLoginText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Inputs
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    marginBottom: 16,
    height: 54,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    height: 50,
    fontSize: 15,
  },
  eyeBtn: {
    padding: 8,
  },

  // Button
  loginBtn: {
    backgroundColor: '#0252a3',
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0252a3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Footer
  footerContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Solid clean white bar at bottom
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerCopyright: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    textAlign: 'center',
  },
});
