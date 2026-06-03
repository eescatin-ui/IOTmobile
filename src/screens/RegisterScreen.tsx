import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  StatusBar,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { registerUser } from '../utils/api';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Settings: undefined;
};

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

// VerdiX Green Security Theme
const COLORS = {
  bg: '#050B07',
  bgSecondary: '#0E1C12',
  bgElevated: '#0D1810',
  bgGlass: 'rgba(10, 20, 14, 0.75)',
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
  
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#5B6E8C',
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const heroPulse = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const ambientGlow = useRef(new Animated.Value(0)).current;
  const strengthBarWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 700, 
        useNativeDriver: true 
      }),
      Animated.spring(slideAnim, { 
        toValue: 0, 
        friction: 8, 
        tension: 40, 
        useNativeDriver: true 
      }),
    ]).start();

    // Hero logo pulse
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

    // Ambient background glow
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
  }, []);

  useEffect(() => {
    // Animate strength bar
    Animated.timing(strengthBarWidth, {
      toValue: passwordStrength / 5,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [passwordStrength]);

  const checkPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 6) strength += 1;
    if (pass.length >= 10) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    setPasswordStrength(Math.min(strength, 5));
  };

  const handlePasswordChange = (pass: string) => {
    setPassword(pass);
    checkPasswordStrength(pass);
    setErrorMsg(null);
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleRegister = async () => {
    setErrorMsg(null);

    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg('All fields are required');
      triggerShake();
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      triggerShake();
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const response = await registerUser(name, email.trim(), password, confirmPassword);
      if (response?.token) {
        Alert.alert(
          'Operator Registered',
          'Your VerdiX security console account has been created.',
          [{ text: 'Access Console', onPress: () => navigation.replace('Home') }],
        );
      } else {
        const message =
          response?.message ||
          (response?.errors
            ? Object.values(response.errors).flat().join('\n')
            : 'Registration failed. Please try again.');
        setErrorMsg(message);
        triggerShake();
      }
    } catch (error) {
      console.error('Register error:', error);
      setErrorMsg('Unable to connect. Check server URL.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return COLORS.danger;
    if (passwordStrength <= 3) return COLORS.warning;
    return COLORS.success;
  };

  const getStrengthLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 1) return 'vulnerable';
    if (passwordStrength <= 3) return 'moderate';
    if (passwordStrength <= 4) return 'strong';
    return 'fortified';
  };

  const getStrengthIcon = () => {
    if (passwordStrength === 0) return '🔓';
    if (passwordStrength <= 1) return '⚠️';
    if (passwordStrength <= 3) return '🔐';
    if (passwordStrength <= 4) return '🛡️';
    return '🏰';
  };

  const getConfirmBorderColor = () => {
    if (confirmPassword.length === 0) return COLORS.border;
    return password === confirmPassword 
      ? 'rgba(34, 197, 94, 0.4)' 
      : 'rgba(239, 68, 68, 0.4)';
  };

  const glowOpacity = ambientGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const strengthWidthInterpolated = strengthBarWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Ambient background elements */}
      <Animated.View style={[styles.ambientOrb1, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.ambientOrb2, { opacity: glowOpacity }]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { translateX: shakeAnim },
              ],
            },
          ]}
        >
          {/* Hero Logo Section */}
          <View style={styles.heroSection}>
            <Animated.View style={[styles.logoRing, { transform: [{ scale: heroPulse }] }]}>
              <View style={styles.logoInner}>
                <Text style={styles.logoIcon}>🛡️</Text>
              </View>
            </Animated.View>
          </View>

          {/* Brand Title */}
          <Text style={styles.title}>VerdiX</Text>
          <Text style={styles.subtitle}>Register Operator</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Operator Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setErrorMsg(null);
                }}
                placeholder="Enter operator name"
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMsg(null);
                }}
                placeholder="operator@verdix.security"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Minimum 6 characters"
                placeholderTextColor={COLORS.textTertiary}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            
            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthHeader}>
                  <Text style={styles.strengthIcon}>{getStrengthIcon()}</Text>
                  <Text style={[styles.strengthLabel, { color: getStrengthColor() }]}>
                    {getStrengthLabel()}
                  </Text>
                </View>
                <View style={styles.strengthBarBg}>
                  <Animated.View 
                    style={[
                      styles.strengthBarFill,
                      { 
                        width: strengthWidthInterpolated,
                        backgroundColor: getStrengthColor(),
                      },
                    ]} 
                  />
                </View>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={[
              styles.inputWrapper,
              { borderColor: getConfirmBorderColor() },
            ]}>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrorMsg(null);
                }}
                placeholder="Re-enter password"
                placeholderTextColor={COLORS.textTertiary}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            {confirmPassword.length > 0 && (
              <Text style={[styles.matchText, {
                color: password === confirmPassword ? COLORS.success : COLORS.danger,
              }]}>
                {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </Text>
            )}
          </View>

          {/* Error Message */}
          {errorMsg && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#FFF" size="small" />
                <Text style={styles.buttonText}>CREATING ACCOUNT...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>REGISTER OPERATOR</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.linkContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              Already registered?{' '}
              <Text style={styles.linkAccent}>Sign In →</Text>
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>Secure Registration</Text>
            </View>
            <Text style={styles.footerDesc}>
              By creating an account, you'll gain access to the VerdiX IoT Security Platform
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  
  // Ambient Background
  ambientOrb1: {
    position: 'absolute',
    top: '25%',
    left: '-10%',
    width: 300,
    height: 300,
    backgroundColor: COLORS.primary,
    borderRadius: 150,
    opacity: 0.06,
    transform: [{ translateX: -150 }, { translateY: -150 }],
  },
  ambientOrb2: {
    position: 'absolute',
    bottom: '25%',
    right: '-10%',
    width: 250,
    height: 250,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 125,
    opacity: 0.04,
    transform: [{ translateX: 125 }, { translateY: 125 }],
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // Card
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: COLORS.bgGlass,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 20,
  },

  // Hero Logo
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderGlow,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 10,
  },
  logoInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  logoIcon: {
    fontSize: 26,
  },

  // Brand
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 2,
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
    backgroundColor: COLORS.bgSecondary,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    padding: 14,
    fontSize: 15,
    fontWeight: '500',
  },

  // Password Strength
  strengthContainer: {
    marginTop: 10,
    gap: 8,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strengthIcon: {
    fontSize: 14,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  strengthBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Match indicator
  matchText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
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
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
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
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    alignItems: 'center',
    gap: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  footerText: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  footerDesc: {
    color: COLORS.textTertiary,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default RegisterScreen;