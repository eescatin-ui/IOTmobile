import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Switch,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLatestSensorData, getActuatorStatus, controlActuator, postBuzzerDuration, getBuzzerDuration } from '../utils/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
};

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const { width } = Dimensions.get('window');

// Dark Violet Theme
const COLORS = {
  bg: '#0D0B1E',
  bgGradient: '#13102A',
  cardBg: '#1A1538',
  cardBorder: 'rgba(139, 92, 246, 0.15)',
  accentViolet: '#8B5CF6',
  accentVioletLight: '#A78BFA',
  accentVioletDark: '#6D28D9',
  accentPink: '#EC4899',
  accentPinkLight: '#F472B6',
  accentCyan: '#22D3EE',
  accentGreen: '#34D399',
  accentRed: '#F87171',
  accentAmber: '#FBBF24',
  accentOrange: '#FB923C',
  text: '#F5F3FF',
  textSecondary: '#C4B5FD',
  textMuted: '#8B7EC8',
  surface: 'rgba(139, 92, 246, 0.08)',
  surfaceGlow: 'rgba(139, 92, 246, 0.2)',
  switchTrack: 'rgba(109, 40, 217, 0.3)',
  gradientStart: '#8B5CF6',
  gradientEnd: '#EC4899',
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [sensors, setSensors] = useState({
    light: null as number | null,
    motion: null as number | null,
  });
  const [displayMotion, setDisplayMotion] = useState<number | null>(null);
  const [actuators, setActuators] = useState({
    yellow_led: true,
    red_led: true,
    buzzer: true,
  });
  const [buzzerDuration, setBuzzerDuration] = useState(2);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isNetworkBusy, setIsNetworkBusy] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(true);

  const motionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const isNetworkBusyRef = useRef(false);
  const networkBusyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lightCardGlow = useRef(new Animated.Value(0)).current;
  const motionCardGlow = useRef(new Animated.Value(0)).current;
  const headerGlow = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isMountedRef.current = true;

    // Ambient shimmer animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 3000, useNativeDriver: false }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 3000, useNativeDriver: false }),
      ])
    ).start();

    // Header subtle glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(headerGlow, { toValue: 1, duration: 2500, useNativeDriver: false }),
        Animated.timing(headerGlow, { toValue: 0, duration: 2500, useNativeDriver: false }),
      ])
    ).start();

    return () => {
      isMountedRef.current = false;
      if (motionTimerRef.current) clearTimeout(motionTimerRef.current);
      if (networkBusyTimeout.current) clearTimeout(networkBusyTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (sensors.motion === 1) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(motionCardGlow, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(motionCardGlow, { toValue: 0.2, duration: 800, useNativeDriver: false }),
        ])
      ).start();
    } else {
      motionCardGlow.setValue(0);
    }
  }, [sensors.motion]);

  useEffect(() => {
    if (sensors.light === 1) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(lightCardGlow, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(lightCardGlow, { toValue: 0.2, duration: 1200, useNativeDriver: false }),
        ])
      ).start();
    } else {
      lightCardGlow.setValue(0);
    }
  }, [sensors.light]);

  const acquireNetworkLock = (): boolean => {
    if (isNetworkBusyRef.current) return false;
    setIsNetworkBusy(true);
    isNetworkBusyRef.current = true;
    return true;
  };

  const releaseNetworkLock = (): void => {
    if (networkBusyTimeout.current) clearTimeout(networkBusyTimeout.current);
    networkBusyTimeout.current = setTimeout(() => {
      if (isMountedRef.current) {
        setIsNetworkBusy(false);
        isNetworkBusyRef.current = false;
      }
    }, 500);
  };

// Add this new function to fetch buzzer duration separately
const fetchBuzzerDuration = async () => {
  try {
    const durationData = await getBuzzerDuration().catch(() => null);
    if (durationData?.duration && isMountedRef.current) {
      setBuzzerDuration(durationData.duration);
    }
  } catch (error) {
    console.error('Duration fetch error:', error);
  }
};

// Modified fetchData with proper motion display timing
const fetchData = async (): Promise<void> => {
    try {
      // Fetch buzzer duration first
      const durationData = await getBuzzerDuration().catch(() => null);
      if (durationData?.duration && isMountedRef.current) {
        setBuzzerDuration(durationData.duration);
      }

      const data = await getLatestSensorData().catch(() => null);
      if (!isMountedRef.current || !data) return;

      const sensorData = data.sensors || data;
      const rawMotion = sensorData.motion?.value ?? sensorData.motion;
      const newMotion = rawMotion !== undefined && rawMotion !== null ? Number(rawMotion) : null;
      const rawLight = sensorData.light?.value ?? sensorData.light;
      const newLight = rawLight !== undefined && rawLight !== null ? Number(rawLight) : null;

      setSensors({ light: newLight, motion: newMotion });

      // Use current buzzer duration for motion display timing
      if (newMotion === 1) {
        setDisplayMotion(1);
        if (motionTimerRef.current) clearTimeout(motionTimerRef.current);
        
        // Calculate display duration based on current buzzer setting
        const currentDuration = durationData?.duration || buzzerDuration;
        const displayTime = currentDuration === 1 ? 2000 : currentDuration === 2 ? 4000 : 6000;
        
        console.log(`Motion detected! Displaying for ${displayTime/1000} seconds (duration setting: ${currentDuration})`);
        
        motionTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setDisplayMotion(null);
            console.log('Motion display cleared');
          }
        }, displayTime);
      }

      const actuatorData = data.actuators || data;
      if (actuatorData.yellow_led !== undefined) {
        setActuators({
          yellow_led: actuatorData.yellow_led === 1 || actuatorData.yellow_led === true,
          red_led: actuatorData.red_led === 1 || actuatorData.red_led === true,
          buzzer: actuatorData.buzzer === 1 || actuatorData.buzzer === true,
        });
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

// Update polling to include duration fetch
useEffect(() => {
    fetchData();
    const dataInterval = setInterval(fetchData, 5000);
    const durationInterval = setInterval(fetchBuzzerDuration, 10000); // Poll duration every 10s
    return () => {
      clearInterval(dataInterval);
      clearInterval(durationInterval);
    };
  }, []);
  
  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchData();
    if (isMountedRef.current) setRefreshing(false);
  };

  const toggleActuator = async (actuator: string, value: boolean) => {
    if (!acquireNetworkLock()) {
      Alert.alert('Please wait', 'Network update in progress.');
      return;
    }
    try {
      const result = await controlActuator(actuator, value);
      if (result?.success) {
        setActuators(prev => ({ ...prev, [actuator]: value }));
      } else {
        Alert.alert('Error', `Failed to update ${actuator}`);
      }
    } finally {
      releaseNetworkLock();
    }
  };

  

  const handleSetBuzzerDuration = async (duration: number) => {
    if (!acquireNetworkLock()) {
      Alert.alert('Please wait', 'Network update in progress.');
      return;
    }
    try {
      const result = await postBuzzerDuration(duration);
      if (result?.success) setBuzzerDuration(duration);
      else Alert.alert('Error', 'Failed to update buzzer duration');
    } finally {
      releaseNetworkLock();
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const motionActive = (displayMotion !== null ? displayMotion : sensors.motion) === 1;
  const lightOn = sensors.light === 1;
  const lightOff = sensors.light === 0;

  const headerBorderColor = headerGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(139, 92, 246, 0.2)', 'rgba(236, 72, 153, 0.4)'],
  });

  const motionGlowBorder = motionCardGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(139, 92, 246, 0.2)', 'rgba(248, 113, 113, 0.6)'],
  });

  const lightGlowBorder = lightCardGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(139, 92, 246, 0.2)', 'rgba(251, 191, 36, 0.6)'],
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.accentVioletLight}
          colors={[COLORS.accentViolet]}
          progressBackgroundColor={COLORS.cardBg}
        />
      }
    >
      {/* Animated Background Glow */}
      <Animated.View style={[styles.bgGlow, { opacity: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] }) }]} />

      {/* Header */}
      <Animated.View style={[styles.header, { borderBottomColor: headerBorderColor }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>⚡</Text>
            </View>
            <View>
              <Text style={styles.title}>AURA</Text>
              <Text style={styles.subtitle}>Control Center</Text>
              <View style={styles.connectionRow}>
                <View style={[styles.statusDot, { backgroundColor: connectionStatus ? COLORS.accentGreen : COLORS.accentRed }]} />
                <Text style={[styles.connectionText, { color: connectionStatus ? COLORS.accentGreen : COLORS.accentRed }]}>
                  {connectionStatus ? 'System Online' : 'System Offline'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.lastUpdate}>
          Last sync · {lastUpdate.toLocaleTimeString()}
        </Text>
      </Animated.View>

      {isNetworkBusy && (
        <View style={styles.syncingBar}>
          <ActivityIndicator size="small" color={COLORS.accentVioletLight} />
          <Text style={styles.syncingText}>Processing changes...</Text>
        </View>
      )}

      {/* ============ MOTION SENSOR CARD ============ */}
      <Animated.View style={[
        styles.card,
        {
          borderColor: motionActive ? motionGlowBorder : COLORS.cardBorder,
          shadowColor: motionActive ? COLORS.accentRed : COLORS.accentViolet,
          shadowOpacity: motionActive ? motionCardGlow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] }) : 0.1,
        },
      ]}>
        {/* Card Top Accent Line */}
        <View style={[styles.cardAccent, { backgroundColor: motionActive ? COLORS.accentRed : COLORS.accentViolet }]} />
        
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconCircle, motionActive ? styles.iconCircleActive : styles.iconCircleInactive]}>
              <Text style={styles.cardIcon}>{motionActive ? '🏃' : '🧍'}</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>Motion Sensor</Text>
              <Text style={[styles.cardStatus, { color: motionActive ? COLORS.accentRed : COLORS.accentGreen }]}>
                {motionActive ? 'Activity Detected' : 'Area Clear'}
              </Text>
            </View>
          </View>
          <View style={[styles.sensorValueBadge, motionActive ? styles.badgeActive : styles.badgeInactive]}>
            <Text style={[styles.sensorValue, { color: motionActive ? COLORS.accentRed : COLORS.textSecondary }]}>
              {sensors.motion !== null ? sensors.motion : '--'}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Buzzer Controls */}
        <View style={styles.controlsSection}>
          <Text style={styles.controlsLabel}>Actuator Controls</Text>
          
          {/* Buzzer Toggle */}
          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <View style={[styles.controlIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Text style={styles.controlIcon}>🔊</Text>
              </View>
              <View>
                <Text style={styles.controlName}>Buzzer Alarm</Text>
                <Text style={styles.controlHint}>
                  Triggers on motion · {actuators.buzzer ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={actuators.buzzer}
              onValueChange={(v) => toggleActuator('buzzer', v)}
              trackColor={{ false: COLORS.switchTrack, true: 'rgba(139, 92, 246, 0.4)' }}
              thumbColor={actuators.buzzer ? COLORS.accentVioletLight : COLORS.textMuted}
              disabled={isNetworkBusy}
            />
          </View>

          {/* Buzzer Duration */}
          <Text style={styles.durationLabel}>Alarm Duration</Text>
          <View style={styles.durationRow}>
            {[
              { value: 1, label: '2 sec' },
              { value: 2, label: '4 sec' },
              { value: 3, label: '6 sec' },
            ].map(d => (
              <TouchableOpacity
                key={d.value}
                style={[styles.durationBtn, buzzerDuration === d.value && styles.durationBtnActive]}
                onPress={() => handleSetBuzzerDuration(d.value)}
                disabled={isNetworkBusy}
                activeOpacity={0.7}
              >
                <Text style={[styles.durationBtnText, buzzerDuration === d.value && styles.durationBtnTextActive]}>
                  {d.label}
                </Text>
                {buzzerDuration === d.value && <View style={styles.durationActiveDot} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* ============ LIGHT SENSOR CARD ============ */}
      <Animated.View style={[
        styles.card,
        {
          borderColor: lightOn ? lightGlowBorder : COLORS.cardBorder,
          shadowColor: lightOn ? COLORS.accentAmber : COLORS.accentViolet,
          shadowOpacity: lightOn ? lightCardGlow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] }) : 0.1,
        },
      ]}>
        {/* Card Top Accent Line */}
        <View style={[styles.cardAccent, { backgroundColor: lightOn ? COLORS.accentAmber : COLORS.accentViolet }]} />
        
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconCircle, lightOn ? styles.iconCircleLight : styles.iconCircleDark]}>
              <Text style={styles.cardIcon}>{lightOn ? '☀️' : '🌙'}</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>Light Sensor</Text>
              <Text style={[styles.cardStatus, { color: lightOn ? COLORS.accentAmber : COLORS.accentVioletLight }]}>
                {lightOn ? 'Illuminated' : lightOff ? 'Darkness' : 'Reading...'}
              </Text>
            </View>
          </View>
          <View style={[styles.sensorValueBadge, lightOn ? styles.badgeLight : styles.badgeDark]}>
            <Text style={[styles.sensorValue, { color: lightOn ? COLORS.accentAmber : COLORS.textSecondary }]}>
              {sensors.light !== null ? sensors.light : '--'}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* LED Controls */}
        <View style={styles.controlsSection}>
          <Text style={styles.controlsLabel}>Lighting Controls</Text>
          
          {/* Yellow LED */}
          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <View style={[styles.controlIconBox, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <View style={[styles.ledIndicator, { backgroundColor: COLORS.accentAmber }]} />
              </View>
              <View>
                <Text style={styles.controlName}>Amber Light</Text>
                <Text style={styles.controlHint}>
                  Day indicator · {actuators.yellow_led ? 'Active' : 'Off'}
                </Text>
              </View>
            </View>
            <Switch
              value={actuators.yellow_led}
              onValueChange={(v) => toggleActuator('yellow_led', v)}
              trackColor={{ false: COLORS.switchTrack, true: 'rgba(251, 191, 36, 0.35)' }}
              thumbColor={actuators.yellow_led ? COLORS.accentAmber : COLORS.textMuted}
              disabled={isNetworkBusy}
            />
          </View>

          {/* Red LED */}
          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <View style={[styles.controlIconBox, { backgroundColor: 'rgba(248, 113, 113, 0.15)' }]}>
                <View style={[styles.ledIndicator, { backgroundColor: COLORS.accentRed }]} />
              </View>
              <View>
                <Text style={styles.controlName}>Crimson Light</Text>
                <Text style={styles.controlHint}>
                  Night indicator · {actuators.red_led ? 'Active' : 'Off'}
                </Text>
              </View>
            </View>
            <Switch
              value={actuators.red_led}
              onValueChange={(v) => toggleActuator('red_led', v)}
              trackColor={{ false: COLORS.switchTrack, true: 'rgba(248, 113, 113, 0.35)' }}
              thumbColor={actuators.red_led ? COLORS.accentRed : COLORS.textMuted}
              disabled={isNetworkBusy}
            />
          </View>
        </View>
      </Animated.View>

      {/* Footer Status */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>Auto-refresh active · 5s interval</Text>
        </View>
        <View style={styles.footerRow}>
          <View style={[styles.footerDot, { backgroundColor: isNetworkBusy ? COLORS.accentAmber : COLORS.accentGreen }]} />
          <Text style={styles.footerText}>
            {isNetworkBusy ? 'Lock engaged · Syncing' : 'Ready for commands'}
          </Text>
        </View>
      </View>

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
  bgGlow: {
    position: 'absolute',
    top: -100,
    left: -50,
    right: -50,
    height: 400,
    backgroundColor: COLORS.accentViolet,
    borderRadius: 200,
    opacity: 0.15,
    transform: [{ scale: 1.5 }],
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 55,
    paddingBottom: 24,
    borderBottomWidth: 1,
    backgroundColor: 'rgba(13, 11, 30, 0.8)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  logoIcon: {
    fontSize: 22,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: -2,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  settingsIcon: {
    fontSize: 20,
  },
  lastUpdate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 16,
    fontWeight: '500',
  },
  syncingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    marginHorizontal: 24,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  syncingText: {
    color: COLORS.accentVioletLight,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },
  cardAccent: {
    height: 3,
    width: '100%',
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 0,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleActive: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  iconCircleInactive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  iconCircleLight: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  iconCircleDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  cardIcon: {
    fontSize: 26,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  cardStatus: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  sensorValueBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  badgeInactive: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  badgeLight: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  badgeDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  sensorValue: {
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    marginHorizontal: 20,
    marginTop: 16,
  },
  controlsSection: {
    padding: 20,
    gap: 16,
  },
  controlsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  controlIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 18,
  },
  ledIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  controlName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  controlHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  durationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  durationBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    alignItems: 'center',
    position: 'relative',
  },
  durationBtnActive: {
    borderColor: COLORS.accentViolet,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    shadowColor: COLORS.accentViolet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  durationBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  durationBtnTextActive: {
    color: COLORS.accentVioletLight,
  },
  durationActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accentVioletLight,
    position: 'absolute',
    bottom: 6,
  },
  footer: {
    marginHorizontal: 24,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
    gap: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentVioletLight,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

export default HomeScreen;