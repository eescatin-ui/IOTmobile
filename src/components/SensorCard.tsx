import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SensorCardProps {
  title: string;
  value: number | null;
  unit?: string;
  icon?: string;
  status?: string;
}

const SensorCard: React.FC<SensorCardProps> = ({ title, value, unit = '', icon, status }) => {
  const getStatusColor = (): string => {
    if (title === 'Light Sensor') {
      return value === 1 ? '#4cd964' : '#ff3b30';
    }
    if (title === 'Motion Sensor') {
      return value === 1 ? '#ff9500' : '#34c759';
    }
    return '#4ecdc4';
  };

  const getStatusText = (): string => {
    if (title === 'Light Sensor') {
      return value === 1 ? 'Light Detected ☀️' : 'Dark 🌙';
    }
    if (title === 'Motion Sensor') {
      return value === 1 ? 'Motion Detected! 🚨' : 'No Motion ✓';
    }
    return status || 'Active';
  };

  return (
    <View style={[styles.card, { borderTopColor: getStatusColor() }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>
        {value !== null && value !== undefined ? value : '--'}
        <Text style={styles.unit}>{unit}</Text>
      </Text>
      <Text style={[styles.status, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    margin: 10,
    width: '45%',
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 10,
  },
  value: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  unit: {
    fontSize: 14,
    color: '#aaa',
  },
  status: {
    fontSize: 12,
    marginTop: 10,
  },
});

export default SensorCard;