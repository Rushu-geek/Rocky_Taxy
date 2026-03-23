import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { AuthContext } from '../../context/AuthContext';
import { useRide } from '../../hooks/useRide';
import RideCard from '../../components/RideCard';
import { RideCardSkeleton } from '../../components/SkeletonLoader';
import PrimaryButton from '../../components/PrimaryButton';
import StatusBadge from '../../components/StatusBadge';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { formatName } from '../../utils/stringUtils';
import { setupForegroundListener } from '../../services/firebase';
import PermissionsBanner from '../../components/PermissionsBanner';

const ClientHomeScreen: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const { rides, fetchMyRides, isLoading } = useRide();
  const [notification, setNotification] = useState<{ title?: string; body?: string } | null>(null);

  const activeRide = rides.find((r) =>
    !['RIDE_ENDED', 'CANCELLED'].includes(r.status)
  );

  useFocusEffect(
    useCallback(() => {
      fetchMyRides();
    }, [fetchMyRides])
  );

  // Listen for push notifications
  useEffect(() => {
    const unsub = setupForegroundListener((msg) => {
      setNotification(msg);
      fetchMyRides();
      setTimeout(() => setNotification(null), 5000);
    });
    return unsub;
  }, [fetchMyRides]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchMyRides} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Permissions reminder banner */}
        <PermissionsBanner />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.username}>
              {formatName(user?.name?.split(' ')[0])}
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Feather name="log-out" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Notification banner */}
        {notification && (
          <View style={[styles.notifBanner, Shadow.sm]}>
            <Feather name="bell" size={16} color={Colors.white} style={styles.notifIcon} />
            <View>
              <Text style={styles.notifTitle}>{notification.title}</Text>
              <Text style={styles.notifBody}>{notification.body}</Text>
            </View>
          </View>
        )}

        {/* Active Ride Card */}
        {activeRide ? (
          <View style={[styles.activeCard, Shadow.md]}>
            <Text style={styles.activeLabel}>Active Ride</Text>
            <View style={styles.activeRoute}>
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.routeText} numberOfLines={1}>{activeRide.fromLocation}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: Colors.accent }]} />
                <Text style={styles.routeText} numberOfLines={1}>{activeRide.toLocation}</Text>
              </View>
            </View>
            <StatusBadge status={activeRide.status} style={styles.activeBadge} />
          </View>
        ) : (
          <View style={[styles.emptyActive, Shadow.sm]}>
            <View style={styles.emptyIconWrap}>
              <Feather name="navigation" size={28} color={Colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>No active ride</Text>
            <Text style={styles.emptySubtitle}>Book a ride to get started</Text>
          </View>
        )}

        {/* Recent Rides */}
        <Text style={styles.sectionTitle}>Recent Rides</Text>

        {isLoading ? (
          <><RideCardSkeleton /><RideCardSkeleton /></>
        ) : rides.length === 0 ? (
          <View style={styles.emptySection}>
            <Feather name="inbox" size={40} color={Colors.border} />
            <Text style={styles.emptyMsg}>No rides yet. Book your first one!</Text>
            <PrimaryButton title="Book a Ride" onPress={() => {}} style={{ marginTop: Spacing.md }} />
          </View>
        ) : (
          rides.slice(0, 5).map((r) => <RideCard key={r._id} ride={r} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  greeting: { fontSize: Typography.size.sm, color: Colors.textSecondary, letterSpacing: 0.2 },
  username: { fontSize: Typography.size.xl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  notifBanner: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.base, marginBottom: Spacing.base,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  notifIcon: { marginRight: Spacing.xs },
  notifTitle: { color: Colors.white, fontWeight: '700', fontSize: Typography.size.sm },
  notifBody: { color: 'rgba(255,255,255,0.75)', fontSize: Typography.size.xs, marginTop: 2 },
  activeCard: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, marginBottom: Spacing.xl,
  },
  activeLabel: { color: 'rgba(255,255,255,0.55)', fontSize: Typography.size.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md },
  activeRoute: { marginBottom: Spacing.md },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { width: 2, height: 20, backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: 3, marginVertical: 3 },
  routeText: { color: Colors.white, fontSize: Typography.size.base, fontWeight: '600', flex: 1 },
  activeBadge: { alignSelf: 'flex-start' },
  emptyActive: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xxl, alignItems: 'center', marginBottom: Spacing.xl,
  },
  emptyIconWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(233, 69, 96, 0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.base,
  },
  emptyTitle: { fontSize: Typography.size.md, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  sectionTitle: { fontSize: Typography.size.base, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.base, textTransform: 'uppercase', letterSpacing: 0.8 },
  emptySection: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyMsg: { fontSize: Typography.size.base, color: Colors.textSecondary, textAlign: 'center' },
});

export default ClientHomeScreen;
