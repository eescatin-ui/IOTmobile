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
  StatusBar,
  Platform,
  Vibration,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLatestSensorData, getActuatorStatus, controlActuator } from '../utils/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
};

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const { width, height } = Dimensions.get('window');

// VerdiX Green Security Theme - Matching Admin Web
const COLORS = {
  bg: '#050B07',
  bgSecondary: '#0E1C12',
  bgElevated: '#0D1810',
  bgCard: '#0A140E',
  bgGlass: 'rgba(10, 20, 14, 0.72)',
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

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [sensors, setSensors] = useState({
    light: null as number | null,
    motion: null as number | null,
  });
  const [displayMotion, setDisplayMotion] = useState<number | null>(null);
  const [actuators, setActuators] = useState({
    yellow_led: false,
    red_led: false,
    buzzer: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isNetworkBusy, setIsNetworkBusy] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(true);
  const [expandedPanels, setExpandedPanels] = useState({
    security: true,
    lighting: true,
  });
  const [motionEvents, setMotionEvents] = useState(0);
  const [securityLevel, setSecurityLevel] = useState(98);
  const [connectedDevices, setConnectedDevices] = useState(5);

  const motionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const isNetworkBusyRef = useRef(false);
  const networkBusyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const panelsSlide = useRef(new Animated.Value(40)).current;
  const securityScale = useRef(new Animated.Value(1)).current;
  const lightingScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const heroPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    isMountedRef.current = true;

    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(panelsSlide, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    // Pulse animation for live indicators
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Hero orb pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(heroPulse, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(heroPulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    return () => {
      isMountedRef.current = false;
      if (motionTimerRef.current) clearTimeout(motionTimerRef.current);
      if (networkBusyTimeout.current) clearTimeout(networkBusyTimeout.current);
    };
  }, []);

  const triggerHaptic = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(10);
    }
  };

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

  const fetchData = async (): Promise<void> => {
    try {
      const data = await getLatestSensorData().catch(() => null);
      if (!isMountedRef.current || !data) return;

      const sensorData = data.sensors || data;
      const rawMotion = sensorData.motion?.value ?? sensorData.motion;
      const newMotion = rawMotion !== undefined && rawMotion !== null ? Number(rawMotion) : null;
      const rawLight = sensorData.light?.value ?? sensorData.light;
      const newLight = rawLight !== undefined && rawLight !== null ? Number(rawLight) : null;

      setSensors({ light: newLight, motion: newMotion });

      if (newMotion === 1) {
        setDisplayMotion(1);
        setSecurityLevel(45);
        setMotionEvents(prev => prev + 1);
        Animated.sequence([
          Animated.timing(securityScale, { toValue: 1.02, duration: 100, useNativeDriver: true }),
          Animated.spring(securityScale, { toValue: 1, friction: 3, useNativeDriver: true }),
        ]).start();
        
        if (motionTimerRef.current) clearTimeout(motionTimerRef.current);
        motionTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setDisplayMotion(null);
            setSecurityLevel(98);
          }
        }, 4000);
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
      setConnectionStatus(true);
    } catch (error) {
      console.error('Fetch error:', error);
      setConnectionStatus(false);
    }
  };

  useEffect(() => {
    fetchData();
    const dataInterval = setInterval(fetchData, 3000);
    return () => clearInterval(dataInterval);
  }, []);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchData();
    if (isMountedRef.current) setRefreshing(false);
  };

  const toggleActuator = async (actuator: string, value: boolean) => {
    if (!acquireNetworkLock()) {
      Alert.alert('Network Busy', 'Previous command still processing.');
      return;
    }
    try {
      triggerHaptic();
      const result = await controlActuator(actuator, value);
      if (result?.success) {
        setActuators(prev => ({ ...prev, [actuator]: value }));
      } else {
        Alert.alert('Error', `Failed to update ${actuator}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      releaseNetworkLock();
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const motionActive = (displayMotion !== null ? displayMotion : sensors.motion) === 1;
  const lightOn = sensors.light === 1;
  const lightOff = sensors.light === 0;

  const togglePanel = (panel: 'security' | 'lighting') => {
    setExpandedPanels(prev => ({ ...prev, [panel]: !prev[panel] }));
    triggerHaptic();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            progressBackgroundColor={COLORS.bgElevated}
          />
        }
      >
        {/* ─── TOP NAVIGATION BAR ─── */}
        <Animated.View style={[styles.topNav, { opacity: headerFade }]}>
          <View style={styles.navBrand}>
            <View style={styles.navLogo}>
              <Text style={styles.navLogoText}>🛡️</Text>
            </View>
            <View>
              <Text style={styles.navTitle}>VerdiX</Text>
              <Text style={styles.navSubtitle}>IoT Security Platform</Text>
            </View>
          </View>
          <View style={styles.navActions}>
            <View style={styles.statusPill}>
              <Animated.View style={[styles.statusDot, { 
                backgroundColor: connectionStatus ? COLORS.primary : COLORS.danger,
                opacity: connectionStatus ? pulseAnim : 1
              }]} />
              <Text style={[styles.statusText, { 
                color: connectionStatus ? COLORS.primary : COLORS.danger 
              }]}>
                {connectionStatus ? 'Online' : 'Offline'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ─── SYNCING INDICATOR ─── */}
        {isNetworkBusy && (
          <View style={styles.syncingBar}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.syncingText}>Processing command...</Text>
          </View>
        )}

        {/* ─── STATS ROW ─── */}
        <Animated.View style={{ opacity: headerFade, transform: [{ translateY: panelsSlide }] }}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>MOTION EVENTS</Text>
                <Text style={styles.statIcon}>🏃</Text>
              </View>
              <Text style={styles.statValue}>{motionEvents}</Text>
              <Text style={styles.statChange}>↑ 12% from last week</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>LIGHT STATUS</Text>
                <Text style={styles.statIcon}>💡</Text>
              </View>
              <Text style={[styles.statValue, { 
                color: lightOn ? COLORS.warning : COLORS.textSecondary 
              }]}>
                {lightOn ? 'Bright' : 'Dark'}
              </Text>
              <Text style={styles.statChange}>{lightOn ? 'Day mode' : 'Night mode'}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>CONNECTED DEVICES</Text>
                <Text style={styles.statIcon}>📡</Text>
              </View>
              <Text style={styles.statValue}>{connectedDevices}</Text>
              <Text style={styles.statChange}>All active</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>SECURITY LEVEL</Text>
                <Text style={styles.statIcon}>🔒</Text>
              </View>
              <Text style={[styles.statValue, { 
                color: motionActive ? COLORS.danger : COLORS.primary 
              }]}>
                {securityLevel}%
              </Text>
              <Text style={[styles.statChange, { 
                color: motionActive ? COLORS.danger : COLORS.primary 
              }]}>
                {motionActive ? 'Alert active' : 'System secure'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── SECURITY STATUS CARD ─── */}
        <Animated.View style={[styles.securityCard, motionActive && styles.securityCardAlert, { transform: [{ scale: securityScale }] }]}>
          {/* Circular Progress Ring */}
          <View style={styles.securityRingOuter}>
            <View style={styles.securityRingBg} />
            <View style={[styles.securityRingSegment1, { 
              backgroundColor: motionActive ? COLORS.danger : COLORS.primary,
              opacity: securityLevel >= 25 ? 1 : 0.2
            }]} />
            <View style={[styles.securityRingSegment2, { 
              backgroundColor: motionActive ? COLORS.danger : COLORS.primary,
              opacity: securityLevel >= 50 ? 1 : 0.2
            }]} />
            <View style={[styles.securityRingSegment3, { 
              backgroundColor: motionActive ? COLORS.danger : COLORS.primary,
              opacity: securityLevel >= 75 ? 1 : 0.2
            }]} />
            <View style={[styles.securityRingSegment4, { 
              backgroundColor: motionActive ? COLORS.danger : COLORS.primary,
              opacity: securityLevel >= 100 ? 1 : 0.2
            }]} />
            <View style={styles.securityRingInner}>
              <Text style={styles.securityPercentage}>{securityLevel}%</Text>
              <Text style={styles.securityLabel}>Security Index</Text>
            </View>
          </View>

          <Text style={[styles.securityStatus, { 
            color: motionActive ? COLORS.danger : COLORS.primary 
          }]}>
            {motionActive ? 'ALERT ACTIVE' : 'ALL SECURE'}
          </Text>
          <View style={[styles.statusBadge, { 
            backgroundColor: motionActive ? 'rgba(239, 68, 68, 0.12)' : COLORS.primarySoft 
          }]}>
            <Text style={[styles.statusBadgeText, { 
              color: motionActive ? COLORS.danger : COLORS.primary 
            }]}>
              System Status: {connectionStatus ? 'Operational' : 'Disconnected'}
            </Text>
          </View>

          {/* System Metrics */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>System Uptime</Text>
              <Text style={styles.metricValue}>99.98%</Text>
            </View>
            <View style={styles.healthBar}>
              <View style={[styles.healthFill, { width: '99.98%' }]} />
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Response Time</Text>
              <Text style={styles.metricValue}>124ms</Text>
            </View>
            <View style={styles.healthBar}>
              <View style={[styles.healthFill, { width: '94%' }]} />
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Threat Level</Text>
              <Text style={[styles.metricValue, { 
                color: motionActive ? COLORS.danger : COLORS.primary 
              }]}>
                {motionActive ? 'High' : 'Low'}
              </Text>
            </View>
            <View style={styles.healthBar}>
              <View style={[styles.healthFill, { 
                width: motionActive ? '85%' : '15%', 
                backgroundColor: motionActive ? COLORS.danger : COLORS.primary 
              }]} />
            </View>
          </View>
        </Animated.View>

        {/* ─── SECURITY RESPONSE PANEL ─── */}
        <Animated.View style={[styles.featurePanel, { opacity: headerFade, transform: [{ translateY: panelsSlide }] }]}>
          <View style={styles.panelHeader}>
            <View style={[styles.panelIcon, styles.panelIconSecurity]}>
              <Text style={styles.panelIconText}>🛡️</Text>
            </View>
            <View style={styles.panelHeaderText}>
              <Text style={styles.panelTitle}>Security Response</Text>
              <Text style={styles.panelSubtitle}>Motion · Buzzer · Red LED</Text>
            </View>
          </View>

          <View style={styles.panelVisual}>
            <Text style={styles.panelVisualEmoji}>{motionActive ? '🚨' : '✅'}</Text>
            <Text style={[styles.panelVisualStatus, { color: motionActive ? COLORS.danger : COLORS.primary }]}>
              {motionActive ? 'Intrusion Alert' : 'Secure'}
            </Text>
            <Text style={styles.panelVisualLabel}>
              {motionActive ? 'Motion detected — respond immediately' : 'No activity — area is safe'}
            </Text>
          </View>

          <View style={styles.actuatorList}>
            <View style={styles.actuatorRow}>
              <View style={styles.actuatorLeft}>
                <View style={[styles.actuatorDot, { backgroundColor: COLORS.warning }]} />
                <View>
                  <Text style={styles.actuatorName}>Buzzer Alarm</Text>
                  <Text style={styles.actuatorDesc}>
                    {actuators.buzzer ? 'Armed — will sound on motion' : 'Disarmed — silent mode'}
                  </Text>
                </View>
              </View>
              <Switch
                value={actuators.buzzer}
                onValueChange={(v) => toggleActuator('buzzer', v)}
                trackColor={{ false: 'rgba(255,255,255,0.06)', true: COLORS.primary }}
                thumbColor={actuators.buzzer ? '#fff' : COLORS.textTertiary}
                disabled={isNetworkBusy}
              />
            </View>
            <View style={styles.actuatorRow}>
              <View style={styles.actuatorLeft}>
                <View style={[styles.actuatorDot, { backgroundColor: COLORS.danger }]} />
                <View>
                  <Text style={styles.actuatorName}>Red LED (D12)</Text>
                  <Text style={styles.actuatorDesc}>
                    {actuators.red_led ? 'Enabled — syncs with buzzer' : 'Disabled — stays off'}
                  </Text>
                </View>
              </View>
              <Switch
                value={actuators.red_led}
                onValueChange={(v) => toggleActuator('red_led', v)}
                trackColor={{ false: 'rgba(255,255,255,0.06)', true: COLORS.danger }}
                thumbColor={actuators.red_led ? '#fff' : COLORS.textTertiary}
                disabled={isNetworkBusy}
              />
            </View>
          </View>
        </Animated.View>

        {/* ─── LIGHTING AUTOMATION PANEL ─── */}
        <Animated.View style={[styles.featurePanel, { opacity: headerFade, transform: [{ translateY: panelsSlide }] }]}>
          <View style={styles.panelHeader}>
            <View style={[styles.panelIcon, styles.panelIconLighting]}>
              <Text style={styles.panelIconText}>💡</Text>
            </View>
            <View style={styles.panelHeaderText}>
              <Text style={styles.panelTitle}>Lighting Automation</Text>
              <Text style={styles.panelSubtitle}>Light Sensor · Yellow LED</Text>
            </View>
          </View>

          <View style={styles.panelVisual}>
            <Text style={styles.panelVisualEmoji}>{lightOn ? '☀️' : '🌙'}</Text>
            <Text style={[styles.panelVisualStatus, { color: lightOn ? COLORS.warning : COLORS.textTertiary }]}>
              {lightOn ? 'Daylight' : (lightOff ? 'Night' : 'Measuring...')}
            </Text>
            <Text style={styles.panelVisualLabel}>
              {lightOn ? 'Sufficient ambient light' : (lightOff ? 'Darkness detected — LED active' : 'Calibrating sensor reading')}
            </Text>
          </View>

          <View style={styles.actuatorList}>
            <View style={styles.actuatorRow}>
              <View style={styles.actuatorLeft}>
                <View style={[styles.actuatorDot, { backgroundColor: COLORS.warning }]} />
                <View>
                  <Text style={styles.actuatorName}>Yellow LED (D14)</Text>
                  <Text style={styles.actuatorDesc}>
                    {lightOff ? 'ON — dark environment' : 'OFF — sufficient light'} · {actuators.yellow_led ? 'Automation enabled' : 'Automation disabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={actuators.yellow_led}
                onValueChange={(v) => toggleActuator('yellow_led', v)}
                trackColor={{ false: 'rgba(255,255,255,0.06)', true: COLORS.primary }}
                thumbColor={actuators.yellow_led ? '#fff' : COLORS.textTertiary}
                disabled={isNetworkBusy}
              />
            </View>
          </View>
        </Animated.View>

        {/* ─── SENSORS GRID ─── */}
        <Text style={styles.sectionTitle}>Sensors & Actuators</Text>
        <View style={styles.sensorsGrid}>
          {/* Motion Sensor */}
          <View style={styles.sensorCard}>
            <View style={styles.sensorHeader}>
              <Text style={styles.sensorName}>Motion Sensor</Text>
              <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
            </View>
            <Text style={[styles.sensorValue, { 
              color: motionActive ? COLORS.danger : COLORS.primary 
            }]}>
              {motionActive ? '⚠️ Motion Detected' : '✓ Clear'}
            </Text>
            <View style={styles.sensorFooter}>
              <Text style={styles.sensorMeta}>
                Last triggered: {lastUpdate.toLocaleTimeString()}
              </Text>
            </View>
          </View>

          {/* Light Sensor */}
          <View style={styles.sensorCard}>
            <View style={styles.sensorHeader}>
              <Text style={styles.sensorName}>Light Sensor</Text>
              <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
            </View>
            <Text style={[styles.sensorValue, { 
              color: lightOn ? COLORS.warning : COLORS.textSecondary 
            }]}>
              {lightOn ? '☀️ Bright' : '🌙 Dark'}
            </Text>
            <View style={styles.sensorFooter}>
              <Text style={styles.sensorMeta}>
                Ambient: {lightOn ? 'High' : 'Low'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── DEVICE HEALTH ─── */}
        <Text style={styles.sectionTitle}>Device Health</Text>
        <View style={styles.deviceGrid}>
          <View style={styles.deviceCard}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceIcon}>🏃</Text>
              <View>
                <Text style={styles.deviceName}>Motion Sensor</Text>
                <Text style={styles.deviceStatus}>Online</Text>
              </View>
            </View>
            <View style={styles.healthBar}>
              <View style={[styles.healthFill, { width: '97%' }]} />
            </View>
            <View style={styles.deviceMetrics}>
              <Text style={styles.deviceMetricText}>Health 97%</Text>
              <Text style={styles.deviceMetricText}>Signal 94%</Text>
            </View>
          </View>

          <View style={styles.deviceCard}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceIcon}>💡</Text>
              <View>
                <Text style={styles.deviceName}>Light Sensor</Text>
                <Text style={styles.deviceStatus}>Online</Text>
              </View>
            </View>
            <View style={styles.healthBar}>
              <View style={[styles.healthFill, { width: '99%' }]} />
            </View>
            <View style={styles.deviceMetrics}>
              <Text style={styles.deviceMetricText}>Health 99%</Text>
              <Text style={styles.deviceMetricText}>Signal 98%</Text>
            </View>
          </View>

          <View style={styles.deviceCard}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceIcon}>🔊</Text>
              <View>
                <Text style={styles.deviceName}>Buzzer</Text>
                <Text style={styles.deviceStatus}>Standby</Text>
              </View>
            </View>
            <View style={styles.healthBar}>
              <View style={[styles.healthFill, { width: '100%' }]} />
            </View>
            <View style={styles.deviceMetrics}>
              <Text style={styles.deviceMetricText}>Health 100%</Text>
              <Text style={styles.deviceMetricText}>Signal 100%</Text>
            </View>
          </View>

          <View style={styles.deviceCard}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceIcon}>🔴</Text>
              <View>
                <Text style={styles.deviceName}>LED Controller</Text>
                <Text style={styles.deviceStatus}>Active</Text>
              </View>
            </View>
            <View style={styles.healthBar}>
              <View style={[styles.healthFill, { width: '96%' }]} />
            </View>
            <View style={styles.deviceMetrics}>
              <Text style={styles.deviceMetricText}>Health 96%</Text>
              <Text style={styles.deviceMetricText}>Signal 91%</Text>
            </View>
          </View>
        </View>

        {/* ─── FOOTER ─── */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Animated.View style={[styles.footerDot, { 
              backgroundColor: COLORS.primary,
              opacity: pulseAnim
            }]} />
            <Text style={styles.footerText}>Auto-refresh · 3s</Text>
          </View>
          <View style={styles.footerRow}>
            <View style={[styles.footerDot, { 
              backgroundColor: isNetworkBusy ? COLORS.warning : COLORS.primary 
            }]} />
            <Text style={styles.footerText}>
              {isNetworkBusy ? 'Syncing...' : 'Standby'}
            </Text>
          </View>
          <View style={styles.footerRow}>
            <View style={[styles.footerDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.footerText}>VerdiX v2.0</Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.bg 
  },
  scrollView: { 
    flex: 1 
  },
  contentContainer: { 
    paddingBottom: 20, 
    padding: 16 
  },

  // Top Navigation
  topNav: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: COLORS.bgGlass, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    borderRadius: 20, 
    padding: 14, 
    marginBottom: 16,
    ...Platform.select({
      ios: { 
        shadowColor: COLORS.primary, 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 12 
      },
      android: { 
        elevation: 8 
      },
    }),
  },
  navBrand: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10 
  },
  navLogo: {
    width: 40, 
    height: 40, 
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: COLORS.primary, 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 10,
  },
  navLogoText: { 
    fontSize: 18 
  },
  navTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: COLORS.textPrimary, 
    letterSpacing: -0.5 
  },
  navSubtitle: { 
    fontSize: 10, 
    color: COLORS.textTertiary, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  navActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  statusPill: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    paddingHorizontal: 10, 
    paddingVertical: 5,
    backgroundColor: COLORS.bgElevated, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    borderRadius: 100,
  },
  statusDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3 
  },
  statusText: { 
    fontSize: 10, 
    fontWeight: '600', 
    letterSpacing: 0.5 
  },
  iconBtn: {
    width: 36, 
    height: 36, 
    borderRadius: 12,
    backgroundColor: COLORS.bgElevated, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    justifyContent: 'center', 
    alignItems: 'center',
  },
  iconBtnText: { 
    fontSize: 16 
  },

  // Syncing Bar
  syncingBar: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    paddingVertical: 8, 
    borderRadius: 12, 
    marginBottom: 14, 
    gap: 8,
  },
  syncingText: { 
    color: COLORS.primary, 
    fontSize: 11, 
    fontWeight: '600' 
  },

  // Stats Row
  statsRow: { 
    flexDirection: 'row', 
    gap: 10, 
    marginBottom: 10 
  },
  statCard: {
    flex: 1, 
    backgroundColor: COLORS.bgCard,
    borderWidth: 1, 
    borderColor: COLORS.border,
    borderRadius: 20, 
    padding: 16,
  },
  statHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  statIcon: { 
    fontSize: 20 
  },
  statLabel: { 
    fontSize: 9, 
    fontWeight: '700', 
    color: COLORS.textTertiary, 
    letterSpacing: 1 
  },
  statValue: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: COLORS.textPrimary, 
    marginBottom: 4 
  },
  statChange: { 
    fontSize: 9, 
    color: COLORS.primary 
  },

  // Security Card
  securityCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  securityCardAlert: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  securityRingOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    position: 'relative',
    marginBottom: 16,
  },
  securityRingBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 90,
    borderWidth: 8,
    borderColor: COLORS.bgSecondary,
  },
  securityRingSegment1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 90,
    borderWidth: 8,
    borderColor: COLORS.primary,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  securityRingSegment2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 90,
    borderWidth: 8,
    borderColor: COLORS.primary,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  securityRingSegment3: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 90,
    borderWidth: 8,
    borderColor: COLORS.primary,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  securityRingSegment4: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 90,
    borderWidth: 8,
    borderColor: COLORS.primary,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  securityRingInner: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderRadius: 70,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityPercentage: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  securityLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  securityStatus: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 20,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Feature Panels (Security Response & Lighting)
  featurePanel: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  panelIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelIconSecurity: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.2)',
  },
  panelIconLighting: {
    backgroundColor: 'rgba(255, 179, 71, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 71, 0.2)',
  },
  panelIconText: {
    fontSize: 18,
  },
  panelHeaderText: {
    flex: 1,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  panelSubtitle: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  panelVisual: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  panelVisualEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  panelVisualStatus: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  panelVisualLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  actuatorList: {
    gap: 10,
  },
  actuatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  actuatorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actuatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actuatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  actuatorDesc: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  // Metrics
  metricsContainer: {
    width: '100%',
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  healthBar: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  healthFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },

  // Section Title
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 12,
    marginTop: 8,
  },

  // Sensors Grid
  sensorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  sensorCard: {
    width: (width - 42) / 2,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
  },
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sensorName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.primary,
  },
  actuatorBadge: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
  },
  sensorValue: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  sensorFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
  },
  sensorMeta: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  controlGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 12,
  },
  controlLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Device Health
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  deviceCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  deviceIcon: {
    fontSize: 28,
  },
  deviceName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  deviceStatus: {
    fontSize: 9,
    color: COLORS.textTertiary,
  },
  deviceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  deviceMetricText: {
    fontSize: 9,
    color: COLORS.textTertiary,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 14,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  footerText: {
    fontSize: 9,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
});

export default HomeScreen;