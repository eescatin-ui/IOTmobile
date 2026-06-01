import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';

interface ActuatorCardProps {
  title: string;
  state: boolean;
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

const ActuatorCard: React.FC<ActuatorCardProps> = ({ 
  title, 
  state, 
  enabled,
  onToggle 
}) => {
  const getColor = () => {
    if (!enabled) return '#666';
    return state ? '#d9824c' : '#666';
  };

  const getStateText = () => {
    if (!enabled) return 'DISABLED';
    return state ? 'ON' : 'OFF';
  };

  const getStateIcon = () => {
    if (!enabled) return '⛔';
    if (title === 'LED') {
      return state ? '💡' : '🌑';
    }
    if (title === 'Buzzer') {
      return state ? '🔊' : '🔇';
    }
    return state ? '🟢' : '⚫';
  };

  return (
    <View style={[styles.card, { borderTopColor: getColor() }]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>
        {getStateIcon()} {getStateText()}
      </Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Enable/Disable</Text>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#767577', true: '#4ecdc4' }}
          thumbColor={enabled ? '#fff' : '#f4f3f4'}
        />
      </View>
      <Text style={[styles.cardNote, { color: getColor() }]}>
        {!enabled ? '⛔ Manual Override: OFF' : (title === 'LED' ? 'Dark → ON, Light → OFF' : 'Motion → ON, No Motion → OFF')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    width: '45%',
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  switchLabel: {
    fontSize: 11,
    color: '#aaa',
  },
  cardNote: {
    fontSize: 9,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default ActuatorCard;