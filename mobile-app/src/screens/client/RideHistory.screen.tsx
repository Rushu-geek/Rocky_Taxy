import React, { useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useRide } from '../../hooks/useRide';
import RideCard from '../../components/RideCard';
import { RideCardSkeleton } from '../../components/SkeletonLoader';
import { Colors, Typography, Spacing } from '../../constants/theme';

const RideHistoryScreen: React.FC = () => {
  const { rides, fetchMyRides, isLoading } = useRide();

  useFocusEffect(
    useCallback(() => {
      fetchMyRides();
    }, [fetchMyRides])
  );

  if (isLoading && rides.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>Ride History</Text>
          <RideCardSkeleton /><RideCardSkeleton /><RideCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={rides}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <RideCard ride={item} />}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchMyRides} />}
        ListHeaderComponent={<Text style={styles.title}>Ride History</Text>}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Feather name="clipboard" size={28} color={Colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>No rides yet</Text>
            <Text style={styles.emptySubtitle}>Your ride history will appear here</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  title: { fontSize: Typography.size.xxl, fontWeight: '800', color: Colors.primary, marginBottom: Spacing.xl },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.sm },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(233, 69, 96, 0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  emptyTitle: { fontSize: Typography.size.md, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: Typography.size.sm, color: Colors.textSecondary },
});

export default RideHistoryScreen;
