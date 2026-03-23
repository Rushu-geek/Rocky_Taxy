import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import StatusBadge from './StatusBadge';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../constants/theme';
import { formatName } from '../utils/stringUtils';
import { Ride } from '../hooks/useRide';

interface RideCardProps {
  ride: Ride;
  onPress?: () => void;
  style?: ViewStyle;
}

const RideCard: React.FC<RideCardProps> = ({ ride, onPress, style }) => {
  const driverInfo = typeof ride.driverId === 'object' && ride.driverId
    ? ride.driverId as { name: string; phone: string }
    : null;

  const clientInfo = typeof ride.clientId === 'object' && ride.clientId
    ? ride.clientId as { name: string; phone: string }
    : null;

  const formattedDate = new Date(ride.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const content = (
    <View style={[styles.card, Shadow.sm, style]}>
      <View style={styles.header}>
        <StatusBadge status={ride.status} />
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeRow}>
          <View style={[styles.dot, styles.dotFrom]} />
          <Text style={styles.location} numberOfLines={1}>{ride.fromLocation}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.dot, styles.dotTo]} />
          <Text style={styles.location} numberOfLines={1}>{ride.toLocation}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.metaTag}>
          <Feather name="users" size={10} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{ride.passengers}</Text>
        </View>
        <View style={styles.metaTag}>
          <Feather name={ride.type === 'scheduled' ? 'calendar' : 'zap'} size={10} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{ride.type === 'scheduled' ? 'Scheduled' : 'Instant'}</Text>
        </View>
        {ride.fare && (
          <View style={[styles.metaTag, styles.fareTag]}>
            <Text style={styles.fareText}>₹{ride.fare}</Text>
          </View>
        )}
      </View>

      {(driverInfo || clientInfo) && (
        <View style={styles.personRow}>
          <Feather
            name={driverInfo ? 'truck' : 'user'}
            size={12}
            color={Colors.textSecondary}
          />
          <Text style={styles.personLabel}>{driverInfo ? 'Driver' : 'Client'}:</Text>
          <Text style={styles.personName}>{formatName(driverInfo?.name || clientInfo?.name)}</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  date: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  routeContainer: {
    marginBottom: Spacing.md,
    paddingLeft: Spacing.sm,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  routeLine: {
    width: 2, height: 12,
    backgroundColor: Colors.border,
    marginLeft: 5, marginVertical: 2,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotFrom: { backgroundColor: Colors.success },
  dotTo: { backgroundColor: Colors.accent },
  location: {
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  metaTag: {
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Typography.size.xs, color: Colors.textSecondary, fontWeight: '600',
  },
  fareTag: { backgroundColor: '#E8F5E9' },
  fareText: { color: Colors.success, fontWeight: '700', fontSize: Typography.size.xs },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  personLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  personName: { fontSize: Typography.size.sm, color: Colors.textPrimary, fontWeight: '700' },
});

export default RideCard;
