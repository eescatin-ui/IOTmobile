import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { clearAuthToken, getServerUrl, setServerUrl, getUserData, fetchUserProfile, UserData } from '../utils/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Settings: undefined;
};

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

// VerdiX Green Security Theme
const COLORS = {
  bg: '#050B07',
  bgSecondary: '#0E1C12',
  bgElevated: '#0D1810',
  bgCard: '#0A140E',
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
  info: '#3B82F6',
  
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#5B6E8C',
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const profileScaleAnim = useRef(new Animated.Value(0.8)).current;
  const ambientGlow = useRef(new Animated.Value(0)).current;
  const heroPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData();

    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      Animated.spring(profileScaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();

    // Ambient background glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(ambientGlow, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(ambientGlow, { toValue: 0.3, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    // Hero logo pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(heroPulse, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(heroPulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadData = async (): Promise<void> => {
    const currentUrl = await getServerUrl();
    setUrl(currentUrl);

    const cachedUser = await getUserData();
    if (cachedUser) setUser(cachedUser);

    const freshUser = await fetchUserProfile();
    if (freshUser) setUser(freshUser);

    setLoading(false);
  };

  const handleSave = async (): Promise<void> => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Alert.alert('Invalid Configuration', 'URL must start with http:// or https://');
      return;
    }

    setSaving(true);
    await setServerUrl(url);
    setSaving(false);
    setSettingsSaved(true);
    
    setTimeout(() => {
      setSettingsSaved(false);
    }, 3000);
  };

  const handleLogout = async (): Promise<void> => {
    Alert.alert(
      'Terminate Session',
      'Are you sure you want to sign out of the console?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await clearAuthToken();
            navigation.replace('Login');
          },
        },
      ],
    );
  };

  const glowOpacity = ambientGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      
      {/* Ambient background elements */}
      <Animated.View style={[styles.ambientOrb1, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.ambientOrb2, { opacity: glowOpacity }]} />

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Settings</Text>
              <Text style={styles.headerSubtitle}>VerdiX Console</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </Animated.View>

        {/* Profile Section */}
        <Animated.View
          style={[
            styles.profileSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: profileScaleAnim },
              ],
            },
          ]}
        >
          <View style={styles.heroSection}>
            <Animated.View style={[styles.logoRing, { transform: [{ scale: heroPulse }] }]}>
              <View style={styles.logoInner}>
                <Text style={styles.logoIcon}>
                  {user?.name?.charAt(0)?.toUpperCase() || '🛡️'}
                </Text>
              </View>
            </Animated.View>
          </View>
          
          <Text style={styles.profileName}>{user?.name || 'Operator'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'admin@verdix.security'}</Text>
          
          {user?.role && (
            <View style={[styles.profileBadge, { 
              backgroundColor: user.role === 'admin' ? COLORS.primarySoft : COLORS.primarySoft 
            }]}>
              <Text style={[styles.profileBadgeText, { 
                color: user.role === 'admin' ? COLORS.primary : COLORS.primary 
              }]}>
                {user.role === 'admin' ? '⚡ Administrator' : '🔒 Operator'}
              </Text>
            </View>
          )}
          
          <View style={styles.profileDivider} />
          
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatLabel}>Operator ID</Text>
              <Text style={styles.profileStatValue}>{user?.id || '--'}</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatLabel}>Clearance</Text>
              <Text style={[styles.profileStatValue, { 
                color: COLORS.primary
              }]}>
                {user?.role || 'user'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Server Configuration */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>
              <Text style={styles.sectionIcon}>🔗</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Server Configuration</Text>
              <Text style={styles.sectionHint}>Backend API Endpoint</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>API URL</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="http://192.168.1.250:8000/api"
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.hintContainer}>
              <Text style={styles.hintIcon}>ℹ️</Text>
              <Text style={styles.hint}>
                Include the full path to your backend API endpoint. This is used by the ESP32 to communicate with the server.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="#FFF" size="small" />
                  <Text style={styles.saveButtonText}>SAVING...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonIcon}>💾</Text>
                  <Text style={styles.saveButtonText}>SAVE CONFIGURATION</Text>
                </View>
              )}
            </TouchableOpacity>

            {settingsSaved && (
              <View style={styles.savedMessage}>
                <Text style={styles.savedIcon}>✅</Text>
                <Text style={styles.savedText}>Configuration saved successfully!</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* System Information */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>
              <Text style={styles.sectionIcon}>📋</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>System Information</Text>
              <Text style={styles.sectionHint}>Platform details</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Platform</Text>
              <Text style={styles.infoValue}>VerdiX</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>v2.0.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Framework</Text>
              <Text style={styles.infoValue}>React Native</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Environment</Text>
              <Text style={styles.infoValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>API Status</Text>
              <Text style={[styles.infoValue, { color: COLORS.primary }]}>Connected</Text>
            </View>
          </View>
        </Animated.View>

        {/* Session Management */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <Text style={styles.sectionIcon}>⏻</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Session Control</Text>
              <Text style={styles.sectionHint}>Manage active connection</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.logoutContent}>
              <View style={styles.logoutTextContainer}>
                <Text style={styles.logoutText}>Terminate Session</Text>
                <Text style={styles.logoutHint}>Sign out of the console</Text>
              </View>
              <Text style={styles.logoutArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* App Info */}
        <Animated.View
          style={[
            styles.appInfo,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoText}>VerdiX</Text>
            <View style={styles.appInfoDot} />
            <Text style={styles.appInfoVersion}>v2.0.0</Text>
          </View>
          <Text style={styles.appInfoDesc}>IoT Security Monitoring Platform</Text>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  
  // Loading
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },

  // Ambient Background
  ambientOrb1: {
    position: 'absolute',
    top: '15%',
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
    bottom: '15%',
    right: '-10%',
    width: 250,
    height: 250,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 125,
    opacity: 0.04,
    transform: [{ translateX: 125 }, { translateY: 125 }],
  },

  contentContainer: {
    paddingBottom: 40,
  },

  // Header
  header: {
    backgroundColor: COLORS.bgGlass,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: Platform.OS === 'ios' ? 55 : 45,
    paddingBottom: 20,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontSize: 22,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 10,
    color: COLORS.textTertiary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 44,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: COLORS.bgCard,
    marginBottom: 24,
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 16,
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
    color: '#FFF',
    fontWeight: '800',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginBottom: 12,
    fontWeight: '500',
  },
  profileBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
  },
  profileBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  profileDivider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 20,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  profileStat: {
    alignItems: 'center',
    flex: 1,
  },
  profileStatDivider: {
    width: 1,
    backgroundColor: COLORS.borderLight,
  },
  profileStatLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  profileStatValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Sections
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  sectionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionHint: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
    fontWeight: '500',
  },

  // Card
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '500',
  },
  hintContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 20,
    gap: 8,
    alignItems: 'flex-start',
  },
  hintIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  hint: {
    color: COLORS.textTertiary,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
    fontWeight: '500',
  },
  
  // Save Button
  saveButton: {
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonIcon: {
    fontSize: 16,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // Saved Message
  savedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  savedIcon: {
    fontSize: 14,
  },
  savedText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  // System Info
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // Logout
  logoutButton: {
    backgroundColor: COLORS.bgCard,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutTextContainer: {
    flex: 1,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  logoutHint: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  logoutArrow: {
    fontSize: 18,
    color: COLORS.danger,
    fontWeight: '600',
  },

  // App Info
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
    gap: 8,
  },
  appInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appInfoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  appInfoText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: 2,
  },
  appInfoVersion: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  appInfoDesc: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default SettingsScreen;