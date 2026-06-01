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

// Dark Violet Theme
const COLORS = {
  bg: '#0D0B1E',
  cardBg: '#1A1538',
  border: 'rgba(139, 92, 246, 0.15)',
  borderGlow: 'rgba(139, 92, 246, 0.3)',
  accentViolet: '#8B5CF6',
  accentVioletLight: '#A78BFA',
  accentVioletDark: '#6D28D9',
  accentPink: '#EC4899',
  accentPinkLight: '#F472B6',
  accentGreen: '#34D399',
  accentRed: '#F87171',
  accentAmber: '#FBBF24',
  text: '#F5F3FF',
  textSecondary: '#C4B5FD',
  textMuted: '#8B7EC8',
  surface: 'rgba(139, 92, 246, 0.08)',
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const profileScaleAnim = useRef(new Animated.Value(0.8)).current;
  const savePulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData();

    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
      Animated.spring(profileScaleAnim, { toValue: 1, friction: 6, useNativeDriver: false }),
    ]).start();

    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    ).start();

    // Save button pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(savePulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: false }),
        Animated.timing(savePulseAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
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
      Animated.sequence([
        Animated.timing(savePulseAnim, { toValue: 0.95, duration: 100, useNativeDriver: false }),
        Animated.timing(savePulseAnim, { toValue: 1, duration: 100, useNativeDriver: false }),
      ]).start();
      Alert.alert('Invalid URL', 'URL must start with http:// or https://');
      return;
    }

    setSaving(true);
    await setServerUrl(url);
    setSaving(false);

    Alert.alert('Success', 'Server URL saved successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const handleLogout = async (): Promise<void> => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await clearAuthToken();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  const shimmerPosition = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '200%'],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.shimmerLine}>
          <Animated.View style={[styles.shimmerInner, { left: shimmerPosition }]} />
        </View>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.backButton} />
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
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '👤'}</Text>
          </View>
        </View>
        <Text style={styles.profileName}>{user?.name || 'User'}</Text>
        <Text style={styles.profileEmail}>{user?.email || ''}</Text>
        {user?.role && (
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Text>
          </View>
        )}
        <View style={styles.profileDivider} />
        <View style={styles.profileStats}>
          <View style={styles.profileStat}>
            <Text style={styles.profileStatLabel}>ID</Text>
            <Text style={styles.profileStatValue}>{user?.id || '--'}</Text>
          </View>
          <View style={styles.profileStatDivider} />
          <View style={styles.profileStat}>
            <Text style={styles.profileStatLabel}>Role</Text>
            <Text style={styles.profileStatValue}>{user?.role || 'user'}</Text>
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
            <Text style={styles.sectionHint}>Backend API endpoint for IoT system</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Backend API URL</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="http://192.168.1.250:8000/api"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.hint}>
            ⚡ Include the full path to your API endpoint
          </Text>

          <Animated.View style={{ transform: [{ scale: savePulseAnim }] }}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Configuration</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Account */}
      <Animated.View
        style={[
          styles.section,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconBox}>
            <Text style={styles.sectionIcon}>👤</Text>
          </View>
          <View>
            <Text style={styles.sectionTitle}>Account</Text>
            <Text style={styles.sectionHint}>Manage your session</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={styles.logoutIconBox}>
            <Text style={styles.logoutIcon}>🚪</Text>
          </View>
          <Text style={styles.logoutText}>Sign Out</Text>
          <Text style={styles.logoutArrow}>→</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* App Info */}
      <Animated.View
        style={[
          styles.appInfo,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.appInfoText}>AURA Control Panel</Text>
        <Text style={styles.appInfoVersion}>Version 2.0.0</Text>
      </Animated.View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: 'rgba(26, 21, 56, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 50,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
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
    height: 2,
    backgroundColor: COLORS.accentViolet,
    shadowColor: COLORS.accentViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.accentVioletLight,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: COLORS.cardBg,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: COLORS.accentViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  avatarText: {
    fontSize: 32,
    color: COLORS.text,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  profileBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.25)',
  },
  profileBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentPinkLight,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  profileDivider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.border,
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
    backgroundColor: COLORS.border,
  },
  profileStatLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileStatValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  sectionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
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
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 11, 30, 0.6)',
  },
  input: {
    color: COLORS.text,
    padding: 14,
    borderRadius: 12,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 10,
    marginBottom: 20,
    lineHeight: 16,
  },
  saveButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    padding: 16,
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  logoutIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutIcon: {
    fontSize: 16,
  },
  logoutText: {
    color: COLORS.accentRed,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  logoutArrow: {
    fontSize: 18,
    color: COLORS.accentRed,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  appInfoVersion: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});

export default SettingsScreen;