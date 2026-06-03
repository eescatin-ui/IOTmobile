import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  ScrollView,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAuthToken, login } from '../utils/api';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Settings: undefined;
};

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

// VerdiX Green Security Theme
const COLORS = {
  bg: '#050B07',
  bgSecondary: '#0A140E',
  bgElevated: '#0D1810',
  bgGlass: 'rgba(10, 20, 14, 0.95)',
  borderLight: 'rgba(34, 197, 94, 0.08)',
  border: 'rgba(34, 197, 94, 0.15)',
  borderGlow: 'rgba(34, 197, 94, 0.35)',
  
  primary: '#22C55E',
  primaryLight: '#4ADE80',
  primaryDark: '#16A34A',
  primaryGlow: 'rgba(34, 197, 94, 0.35)',
  primarySoft: 'rgba(34, 197, 94, 0.12)',
  
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textTertiary: '#5B6E8C',
  textPlaceholder: '#64748B',
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;
  const heroPulse = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const ambientGlow = useRef(new Animated.Value(0)).current;
  const logoGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkToken = async () => {
      const token = await getAuthToken();
      if (token) {
        navigation.replace('Home');
      }
    };
    checkToken();

    Animated.parallel([
      Animated.timing(cardFade, { 
        toValue: 1, 
        duration: 700, 
        useNativeDriver: true 
      }),
      Animated.spring(cardSlide, { 
        toValue: 0, 
        friction: 8, 
        tension: 40, 
        useNativeDriver: true 
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ambientGlow, { 
          toValue: 1, 
          duration: 4000, 
          useNativeDriver: true 
        }),
        Animated.timing(ambientGlow, { 
          toValue: 0.3, 
          duration: 4000, 
          useNativeDriver: true 
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(heroPulse, { 
          toValue: 1.05, 
          duration: 2000, 
          useNativeDriver: true 
        }),
        Animated.timing(heroPulse, { 
          toValue: 1, 
          duration: 2000, 
          useNativeDriver: true 
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlow, { 
          toValue: 1, 
          duration: 3000, 
          useNativeDriver: true 
        }),
        Animated.timing(logoGlow, { 
          toValue: 0.5, 
          duration: 3000, 
          useNativeDriver: true 
        }),
      ])
    ).start();
  }, [navigation]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Email and password required');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const response = await login(email.trim(), password);
      if (response?.token) {
        navigation.replace('Home');
      } else {
        setErrorMsg(response?.message || 'Invalid credentials');
        triggerShake();
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg('Unable to connect. Check server URL.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const glowOpacity = ambientGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const logoShadowOpacity = logoGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Ambient background elements - positioned behind everything */}
      <Animated.View style={[styles.ambientOrb1, { opacity: glowOpacity }]} pointerEvents="none" />
      <Animated.View style={[styles.ambientOrb2, { opacity: glowOpacity }]} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardFade,
                transform: [
                  { translateY: cardSlide },
                  { translateX: shakeAnim },
                ],
              },
            ]}
          >
            {/* Hero Logo Section */}
            <View style={styles.heroSection}>
              <Animated.View style={[
                styles.logoRing, 
                { 
                  transform: [{ scale: heroPulse }],
                  shadowOpacity: logoShadowOpacity,
                }
              ]}>
                <View style={styles.logoInner}>
                  <Text style={styles.logoIcon}>🛡️</Text>
                </View>
              </Animated.View>
            </View>

            {/* Brand Title */}
            <Text style={styles.title}>VerdiX</Text>
            <Text style={styles.subtitle}>IoT Security Monitoring Platform</Text>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(text) => { setEmail(text); setErrorMsg(null); }}
                  placeholder="admin@example.com"
                  placeholderTextColor={COLORS.textPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={COLORS.primary}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(text) => { setPassword(text); setErrorMsg(null); }}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textPlaceholder}
                  secureTextEntry
                  autoCapitalize="none"
                  selectionColor={COLORS.primary}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Error Message */}
            {errorMsg && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="#FFF" size="small" />
                  <Text style={styles.buttonText}>AUTHENTICATING...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>ACCESS SYSTEM</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('Register')} 
              style={styles.linkContainer}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>
                New operator?{' '}
                <Text style={styles.linkAccent}>Request Access →</Text>
              </Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>IoT Security Monitoring Platform</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  
  keyboardView: {
    flex: 1,
    zIndex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1,
  },

  // Ambient Background - explicitly positioned behind
  ambientOrb1: {
    position: 'absolute',
    top: '20%',
    left: '-10%',
    width: 300,
    height: 300,
    backgroundColor: COLORS.primary,
    borderRadius: 150,
    opacity: 0.06,
    transform: [{ translateX: -150 }, { translateY: -150 }],
    zIndex: 0,
  },
  ambientOrb2: {
    position: 'absolute',
    bottom: '20%',
    right: '-10%',
    width: 250,
    height: 250,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 125,
    opacity: 0.04,
    transform: [{ translateX: 125 }, { translateY: 125 }],
    zIndex: 0,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.bgGlass,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 2,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 40,
      },
      android: {
        elevation: 20,
      },
    }),
  },

  // Hero Logo
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderGlow,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  logoInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  logoIcon: {
    fontSize: 30,
  },

  // Brand
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginBottom: 24,
  },

  // Inputs
  inputGroup: {
    marginBottom: 16,
    zIndex: 3,
  },
  label: {
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: '#0D1810', // Solid dark background
    overflow: 'hidden',
  },
  input: {
    color: '#FFFFFF', // Pure white text
    padding: 14,
    fontSize: 15,
    fontWeight: '500',
    backgroundColor: 'transparent',
    zIndex: 4,
  },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  // Button
  button: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1.5,
  },

  // Link
  linkContainer: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  linkAccent: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 8,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  footerText: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default LoginScreen;