import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

type RideStatus =
  | 'PENDING' | 'ACCEPTED' | 'ON_THE_WAY'
  | 'WAITING_FOR_PICKUP' | 'ONGOING_RIDE' | 'RIDE_ENDED' | 'CANCELLED';

const STATUS_CONFIG: Record<RideStatus, { label: string; color: string; bg: string }> = {
  PENDING:           { label: 'Pending',          color: Colors.statusPending,  bg: '#FFF3E0' },
  ACCEPTED:          { label: 'Accepted',          color: Colors.statusAccepted, bg: '#E3F2FD' },
  ON_THE_WAY:        { label: 'On the Way',        color: Colors.statusOnTheWay, bg: '#F3E5F5' },
  WAITING_FOR_PICKUP:{ label: 'Driver Waiting',    color: Colors.statusWaiting,  bg: '#E0F7FA' },
  ONGOING_RIDE:      { label: 'In Progress',       color: Colors.statusOngoing,  bg: '#E8F5E9' },
  RIDE_ENDED:        { label: 'Completed',         color: Colors.statusEnded,    bg: '#ECEFF1' },
  CANCELLED:         { label: 'Cancelled',         color: Colors.danger,         bg: '#FFEBEE' },
};

interface StatusBadgeProps {
  status: string;
  style?: ViewStyle;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const config = STATUS_CONFIG[status as RideStatus] || {
    label: status,
    color: Colors.textSecondary,
    bg: Colors.borderLight,
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: Typography.size.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default StatusBadge;
