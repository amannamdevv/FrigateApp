import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  StatusBar,
  Keyboard,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { TextInput, Text, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { aivmsApi } from '../api/frigateApi';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

export const LoginScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 70, animated: true });
      }, 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            isKeyboardVisible && { paddingBottom: 40, justifyContent: 'flex-start' }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Branding Section */}
          <View style={[styles.topBranding, isKeyboardVisible && { marginBottom: 6 }]}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.smallBrandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandTitleSmall}>Shroti Telecom Pvt. Ltd.</Text>
          </View>

          {/* Spacer to push AIVMS down */}
          <View style={{ height: isKeyboardVisible ? 6 : 20 }} />

          {/* Main AIVMS Section with Logo */}
          <View style={[styles.heroSection, isKeyboardVisible && { marginBottom: 8 }]}>
            <View style={[styles.logoContainer, isKeyboardVisible && styles.logoContainerCompact]}>
              <View style={[styles.whiteCircle, isKeyboardVisible && styles.whiteCircleCompact]}>
                <Image
                  source={require('../assets/logo.png')}
                  style={[styles.logoImage, isKeyboardVisible && styles.logoImageCompact]}
                  resizeMode="contain"
                />
              </View>
            </View>
            <View style={styles.heroCol}>
              <Text style={[styles.heroTitle, isKeyboardVisible && styles.heroTitleCompact]}>AIVMS</Text>
              <Text style={[styles.heroSideTextBelow, isKeyboardVisible && styles.heroSideTextBelowCompact]}>
                Artificial Intelligence Video Management System
              </Text>
              {/* Aligned with AIVMS start line, vertically in between AIVMS and Card */}
              <View style={[styles.heroTaglineBadge, isKeyboardVisible && { marginTop: 6 }]}>
                <Icon name="flash" size={13} color="#0284c7" style={{ marginRight: 5 }} />
                <Text style={styles.heroTaglineBadgeText}>Empowering Renewable Energy</Text>
              </View>
            </View>
          </View>

          {/* Spacer between Hero and Login Card */}
          <View style={{ height: isKeyboardVisible ? 12 : 30 }} />

          {/* Login Card - Premium Glassmorphism */}
          <View style={[styles.card, isKeyboardVisible && { marginBottom: 20 }]}>
            {/* Header */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.headerUserIconContainer}>
                <Icon name="account-outline" size={22} color="#0369a1" />
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.welcomeText}>Welcome Back</Text>
                <Text style={styles.pleaseLoginText}>Login to your account</Text>
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
              <View style={styles.inputIconBox}>
                <Icon name="account-outline" size={18} color="#0369a1" />
              </View>
              <View style={styles.inputTextWrap}>
                <TextInput
                  mode="flat"
                  value={username}
                  onChangeText={(v) => { setUsername(v); setError(''); }}
                  placeholder="Username"
                  placeholderTextColor="#5a8aab"
                  style={styles.textInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  underlineStyle={{ display: 'none', height: 0 }}
                  activeOutlineColor="transparent"
                  outlineColor="transparent"
                  textColor="#0c3a5c"
                  cursorColor="#0369a1"
                  selectionColor="rgba(3, 105, 161, 0.25)"
                  contentStyle={{ paddingLeft: 0, paddingRight: 0 }}
                  theme={{ colors: { background: 'transparent', surfaceVariant: 'transparent', onSurfaceVariant: 'transparent', primary: 'transparent' } }}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 70, animated: true });
                    }, 100);
                  }}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIconBox}>
                <Icon name="lock-outline" size={17} color="#0369a1" />
              </View>
              <View style={styles.inputTextWrap}>
                <TextInput
                  mode="flat"
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(''); }}
                  placeholder="Password"
                  placeholderTextColor="#5a8aab"
                  style={styles.textInput}
                  secureTextEntry={!showPass}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  underlineStyle={{ display: 'none', height: 0 }}
                  activeOutlineColor="transparent"
                  outlineColor="transparent"
                  textColor="#0c3a5c"
                  cursorColor="#0369a1"
                  selectionColor="rgba(3, 105, 161, 0.25)"
                  contentStyle={{ paddingLeft: 0, paddingRight: 0 }}
                  theme={{ colors: { background: 'transparent', surfaceVariant: 'transparent', onSurfaceVariant: 'transparent', primary: 'transparent' } }}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 120, animated: true });
                    }, 100);
                  }}
                />
              </View>
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Icon name={showPass ? 'eye-outline' : 'eye-off-outline'} size={19} color="#5a8aab" />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.82}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Icon name="login" size={19} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.loginBtnText}>Login</Text>
                </>
              )}
            </TouchableOpacity>
          </View>



          {/* Footer - Moved exactly to bottom with full width white bar */}
          {!isKeyboardVisible && (
            <View style={styles.footerContainer}>
              <Text style={styles.footerCopyright}>© 2026 Shroti Telecom Private Limited. All Rights Reserved.</Text>
            </View>
          )}

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
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  smallBrandLogo: {
    width: 28,
    height: 28,
    marginRight: 10,
    borderRadius: 14, // Crops the square white background into a perfect circle
    backgroundColor: '#ffffff',
  },
  brandTitleSmall: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.3,
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
  logoContainerCompact: {
    marginBottom: 8,
    transform: [{ translateX: -60 }],
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
  whiteCircleCompact: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  logoImage: {
    width: 125, // Restored/slightly larger to keep icon big while clipping the extra white space
    height: 125,
  },
  logoImageCompact: {
    width: 68,
    height: 68,
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
  heroTitleCompact: {
    fontSize: 34,
    letterSpacing: -0.5,
  },
  heroSideTextBelowCompact: {
    fontSize: 12.5,
    marginTop: -2,
    lineHeight: 16,
  },
  heroTaglineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(2, 82, 163, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'flex-start',
  },
  heroTaglineBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0252a3',
    letterSpacing: 0.3,
  },

  card: {
    backgroundColor: 'transparent',
    borderRadius: 22,
    padding: 20,
    paddingBottom: 22,
    marginHorizontal: 30,
    marginBottom: 40,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerUserIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(3, 105, 161, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextCol: {
    flexDirection: 'column',
  },
  welcomeText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0c3a5c',
    letterSpacing: -0.3,
  },
  pleaseLoginText: {
    fontSize: 12.5,
    color: '#3b6d8c',
    marginTop: 2,
    fontWeight: '600',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 242, 242, 0.88)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Inputs — Clean frosted glass pills, no white patches
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(190, 228, 255, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.50)',
    borderRadius: 16,
    marginBottom: 12,
    height: 52,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  inputIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(3, 105, 161, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  inputTextWrap: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    height: 48,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0c3a5c',
    paddingHorizontal: 0,
    margin: 0,
  },
  eyeBtn: {
    padding: 8,
    marginRight: 0,
  },

  // Login button — Centered professional capsule button (shorter width)
  loginBtn: {
    backgroundColor: '#0284c7',
    height: 48,
    borderRadius: 24,
    alignSelf: 'center',
    paddingHorizontal: 42,
    minWidth: 170,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.40)',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15.5,
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
