import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { AuthContext } from '../../context/AuthContext';
import { useRide, Ride } from '../../hooks/useRide';
import RideCard from '../../components/RideCard';
import { RideCardSkeleton } from '../../components/SkeletonLoader';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { formatName } from '../../utils/stringUtils';
import { setupForegroundListener } from '../../services/firebase';
import type { DriverTabParamList } from '../../navigation/DriverNavigator';
import PermissionsBanner from '../../components/PermissionsBanner';

type NavProp = BottomTabNavigationProp<DriverTabParamList, 'DriverHome'>;

const DriverHomeScreen: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const { availableRides, fetchAvailableRides, acceptRide, isLoading, error } = useRide();
  const navigation = useNavigation<NavProp>();
  const [accepting, setAccepting] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchAvailableRides();
    }, [fetchAvailableRides])
  );

  useEffect(() => {
    const unsub = setupForegroundListener((msg) => {
      if (msg.data?.type === 'NEW_RIDE_REQUEST') {
        fetchAvailableRides();
      }
    });
    return unsub;
  }, [fetchAvailableRides]);

  const handleAccept = async (ride: Ride) => {
    setAcceptError('');
    setAccepting(ride._id);
    try {
      await acceptRide(ride._id);
      navigation.navigate('ActiveRide');
    } catch (e: unknown) {
      setAcceptError(e instanceof Error ? e.message : 'Could not accept ride.');
      // Refresh the list — the ride was likely taken by another driver
      fetchAvailableRides();
    } finally {
      setAccepting(null);
    }
  };

  const renderRide = ({ item }: { item: Ride }) => (
    <View style={[styles.rideItem, Shadow.sm]}>
      <RideCard ride={item} />
      {acceptError && accepting === item._id ? (
        <Text style={styles.acceptError}>{acceptError}</Text>
      ) : null}
      <PrimaryButton
        title={accepting === item._id ? 'Accepting...' : 'Accept Ride'}
        onPress={() => handleAccept(item)}
        loading={accepting === item._id}
        style={styles.acceptBtn}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={availableRides}
        keyExtractor={(item) => item._id}
        renderItem={renderRide}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchAvailableRides} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Permissions reminder — critical for drivers to receive ride notifications */}
            <PermissionsBanner style={{ marginBottom: Spacing.base }} />
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.greeting}>Welcome back,</Text>
                <Text style={styles.name}>{formatName(user?.name?.split(' ')[0])}</Text>
              </View>
              <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                <Feather name="log-out" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <><RideCardSkeleton /><RideCardSkeleton /></>
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Feather name="inbox" size={28} color={Colors.accent} />
              </View>
              <Text style={styles.emptyTitle}>No ride requests</Text>
              <Text style={styles.emptySubtitle}>Pull down to refresh or wait for new requests</Text>
              {error ? <Text style={styles.errMsg}>{error}</Text> : null}
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  header: { marginBottom: Spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: Typography.size.sm, color: Colors.textSecondary, letterSpacing: 0.2 },
  name: { fontSize: Typography.size.xl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  rideItem: { marginBottom: Spacing.base },
  acceptBtn: { marginTop: Spacing.xs },
  acceptError: { color: Colors.danger, fontSize: Typography.size.sm, fontWeight: '600', marginBottom: Spacing.xs, textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.sm },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(233, 69, 96, 0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  emptyTitle: { fontSize: Typography.size.md, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: Typography.size.sm, color: Colors.textSecondary, textAlign: 'center' },
  errMsg: { color: Colors.danger, marginTop: Spacing.sm, fontSize: Typography.size.sm },
});

export default DriverHomeScreen;
