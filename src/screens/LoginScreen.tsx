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

// Dark Violet Theme
const COLORS = {
  bg: '#0D0B1E',
  cardBg: '#1A1538',
  border: 'rgba(139, 92, 246, 0.15)',
  borderGlow: 'rgba(139, 92, 246, 0.3)',
  accentViolet: '#8B5CF6',
  accentVioletLight: '#A78BFA',
  accentPink: '#EC4899',
  accentPinkLight: '#F472B6',
  accentGreen: '#34D399',
  accentRed: '#F87171',
  text: '#F5F3FF',
  textSecondary: '#C4B5FD',
  textMuted: '#8B7EC8',
  surface: 'rgba(139, 92, 246, 0.08)',
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const glowAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const cardFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonPulseAnim = useRef(new Animated.Value(1)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkToken = async () => {
      const token = await getAuthToken();
      if (token) {
        navigation.replace('Home');
      }
    };
    checkToken();

    // Card fade in
    Animated.timing(cardFadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();

    // Ambient glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2500, useNativeDriver: false }),
      ])
    ).start();

    // Shimmer scan line
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    ).start();

    // Button pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulseAnim, { toValue: 1.03, duration: 1500, useNativeDriver: false }),
        Animated.timing(buttonPulseAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, [navigation]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: false }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: false }),
    ]).start();
  };

  const handleLogin = async () => {
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Email and password are required');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const response = await login(email.trim(), password);
      if (response?.token) {
        navigation.replace('Home');
      } else {
        setErrorMsg(response?.message || 'Invalid email or password');
        triggerShake();
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg('Unable to authenticate. Check server URL and credentials.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = () => {
    Animated.spring(inputFocusAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  const handleInputBlur = () => {
    Animated.spring(inputFocusAnim, {
      toValue: 0,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  const cardBorderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(139, 92, 246, 0.2)', 'rgba(236, 72, 153, 0.4)'],
  });

  const shimmerPosition = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '200%'],
  });

  const inputBorderColor = inputFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.6)'],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Background ambient glow */}
      <View style={styles.bgGlow} />

      <Animated.View
        style={[
          styles.card,
          {
            opacity: cardFadeAnim,
            borderColor: cardBorderColor,
            transform: [{ translateX: shakeAnim }],
          },
        ]}
      >
        {/* Shimmer line */}
        <View style={styles.shimmerLine}>
          <Animated.View style={[styles.shimmerInner, { left: shimmerPosition }]} />
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>AURA</Text>
        <Text style={styles.subtitle}>Administrative Console</Text>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <Animated.View style={[styles.inputWrapper, { borderColor: inputBorderColor }]}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrorMsg(null);
              }}
              placeholder="admin@example.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </Animated.View>
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <Animated.View style={[styles.inputWrapper, { borderColor: inputBorderColor }]}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorMsg(null);
              }}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              autoCapitalize="none"
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </Animated.View>
        </View>

        {/* Error */}
        {errorMsg && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Login Button */}
        <Animated.View style={{ transform: [{ scale: buttonPulseAnim }] }}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Access Console</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Register Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.linkContainer}
        >
          <Text style={styles.linkText}>
            Don't have an account?{' '}
            <Text style={styles.linkBold}>Create one</Text>
          </Text>
        </TouchableOpacity>

        {/* Help */}
        <View style={styles.helpContainer}>
          <View style={styles.helpDot} />
          <Text style={styles.helpText}>
            Use admin@example.com / password or your own registered user
          </Text>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bgGlow: {
    position: 'absolute',
    top: -150,
    left: -100,
    right: -100,
    height: 500,
    backgroundColor: COLORS.accentViolet,
    borderRadius: 250,
    opacity: 0.08,
    transform: [{ scale: 1.5 }],
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 36,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 12,
  },
  shimmerLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    overflow: 'hidden',
  },
  shimmerInner: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 3,
    backgroundColor: COLORS.accentViolet,
    shadowColor: COLORS.accentViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accentViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  logoIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    color: COLORS.accentVioletLight,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 11, 30, 0.6)',
  },
  input: {
    color: COLORS.text,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
  },
  errorContainer: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.accentRed,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    marginTop: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: COLORS.accentViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  linkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  linkBold: {
    color: COLORS.accentVioletLight,
    fontWeight: '700',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.12)',
    gap: 8,
  },
  helpDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
    marginTop: 6,
  },
  helpText: {
    color: COLORS.textMuted,
    textAlign: 'left',
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});

export default LoginScreen;