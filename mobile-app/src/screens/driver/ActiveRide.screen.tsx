import React, { useContext, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  KeyboardAvoidingView, Platform, TextInput, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { AuthContext } from '../../context/AuthContext';
import { useRide, Ride } from '../../hooks/useRide';
import StatusBadge from '../../components/StatusBadge';
import PrimaryButton from '../../components/PrimaryButton';
import InputField from '../../components/InputField';
import { RideCardSkeleton } from '../../components/SkeletonLoader';
import { formatName } from '../../utils/stringUtils';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_FLOW = ['ACCEPTED', 'ON_THE_WAY', 'WAITING_FOR_PICKUP', 'ONGOING_RIDE', 'RIDE_ENDED'];

const STATUS_LABELS: Record<string, { label: string; icon: string; btn: string }> = {
  ACCEPTED:           { label: 'Ride Accepted',      icon: 'check-circle', btn: 'Start Driving' },
  ON_THE_WAY:         { label: 'On the Way',         icon: 'navigation',   btn: 'Mark as Arrived' },
  WAITING_FOR_PICKUP: { label: 'Waiting at Pickup',  icon: 'map-pin',      btn: 'Start Ride' },
  ONGOING_RIDE:       { label: 'Ride in Progress',   icon: 'activity',     btn: 'End Ride & Collect Fare' },
  RIDE_ENDED:         { label: 'Ride Completed',     icon: 'flag',         btn: '' },
};

const NEXT_STATUS: Record<string, string> = {
  ACCEPTED: 'ON_THE_WAY',
  ON_THE_WAY: 'WAITING_FOR_PICKUP',
  WAITING_FOR_PICKUP: 'ONGOING_RIDE',
  ONGOING_RIDE: 'RIDE_ENDED',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
/** A ride is "currently active" (in-motion, driver occupied) */
const isCurrentlyActive = (r: Ride) =>
  ['ON_THE_WAY', 'WAITING_FOR_PICKUP', 'ONGOING_RIDE'].includes(r.status);

/** A ride is "upcoming" — accepted but scheduledAt is in the future */
const isUpcoming = (r: Ride) => {
  if (r.status !== 'ACCEPTED') return false;
  if (!r.scheduledAt) return false; // instant accepted → belongs to in-progress block
  return new Date(r.scheduledAt) > new Date();
};

/** An ACCEPTED instant ride (ready to start driving) */
const isReadyToStart = (r: Ride) =>
  r.status === 'ACCEPTED' && !isUpcoming(r);

const formatScheduled = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-CA', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });

// ── Component ──────────────────────────────────────────────────────────────────
const ActiveRideScreen: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { fetchMyRides, updateStatus, endRide, isLoading } = useRide();

  const [allRides, setAllRides] = useState<Ride[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fare, setFare] = useState('');
  const [note, setNote] = useState('');
  const [fareError, setFareError] = useState('');
  const noteRef = useRef<TextInput>(null);

  // ── Load all driver rides ──────────────────────────────────────────────────
  const loadRides = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await fetchMyRides();
      const rides: Ride[] = (response as unknown as Ride[]) ?? [];
      // Filter out completed / cancelled
      setAllRides(rides.filter(r => !['RIDE_ENDED', 'CANCELLED'].includes(r.status)));
    } catch {
      // errors handled by useRide toast
    } finally {
      setIsFetching(false);
    }
  }, [fetchMyRides]);

  useFocusEffect(useCallback(() => { loadRides(); }, [loadRides]));

  // Categorise
  const currentRide = allRides.find(isCurrentlyActive) ?? allRides.find(isReadyToStart) ?? null;
  const upcomingRides = allRides.filter(isUpcoming);

  // ── Status update handlers ─────────────────────────────────────────────────
  const handleUpdateStatus = async () => {
    if (!currentRide) return;
    const next = NEXT_STATUS[currentRide.status];
    if (!next) return;

    if (currentRide.status === 'ONGOING_RIDE') {
      if (!fare || isNaN(parseFloat(fare)) || parseFloat(fare) <= 0) {
        setFareError('Please enter a valid fare amount.');
        return;
      }
      const updated = await endRide(currentRide._id, parseFloat(fare), note.trim() || undefined);
      setAllRides(prev => prev.map(r => r._id === updated._id ? updated : r).filter(r => !['RIDE_ENDED', 'CANCELLED'].includes(r.status)));
    } else {
      const updated = await updateStatus(currentRide._id, next);
      setAllRides(prev => prev.map(r => r._id === updated._id ? updated : r));
    }
  };

  const stepIndex = currentRide ? STATUS_FLOW.indexOf(currentRide.status) : -1;
  const info = currentRide ? STATUS_LABELS[currentRide.status] : null;

  const clientName = (() => {
    const c = currentRide?.clientId;
    if (!c || typeof c === 'string') return null;
    return formatName((c as { name: string }).name);
  })();

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isFetching) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.headerTitle}>Active</Text>
          <RideCardSkeleton /><RideCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!currentRide && upcomingRides.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={loadRides} />}
        >
          <View style={styles.emptyIconWrap}>
            <Feather name="zap" size={32} color={Colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>No Active Rides</Text>
          <Text style={styles.emptySubtitle}>
            Accept a ride request from the Requests tab to get started.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={loadRides} />}
        >
          <Text style={styles.headerTitle}>Active</Text>

          {/* ── Current / In-progress ride ──────────────────────────────── */}
          {currentRide ? (
            <>
              {/* Status card */}
              <View style={[styles.statusCard, Shadow.md]}>
                <View style={styles.statusIconWrap}>
                  <Feather name={info?.icon || 'circle'} size={26} color={Colors.white} />
                </View>
                <Text style={styles.statusLabel}>{info?.label}</Text>
                <StatusBadge status={currentRide.status} style={styles.badge} />
              </View>

              {/* Progress bar */}
              <View style={styles.progressRow}>
                {STATUS_FLOW.map((step, i) => (
                  <View key={step} style={styles.progressStep}>
                    <View style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]} />
                    {i < STATUS_FLOW.length - 1 && (
                      <View style={[styles.progressLine, i < stepIndex && styles.progressLineActive]} />
                    )}
                  </View>
                ))}
              </View>

              {/* Ride info */}
              <View style={[styles.card, Shadow.sm]}>
                <Text style={styles.cardLabel}>Ride Details</Text>
                <View style={styles.routeRow}>
                  <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.routeTxt} numberOfLines={1}>{currentRide.fromLocation}</Text>
                </View>
                <View style={styles.routeConnector} />
                <View style={styles.routeRow}>
                  <View style={[styles.routeDot, { backgroundColor: Colors.accent }]} />
                  <Text style={styles.routeTxt} numberOfLines={1}>{currentRide.toLocation}</Text>
                </View>
                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Feather name="users" size={11} color={Colors.textSecondary} />
                    <Text style={styles.metaTxt}>{currentRide.passengers}</Text>
                  </View>
                  {currentRide.type === 'scheduled' && currentRide.scheduledAt && (
                    <View style={styles.metaChip}>
                      <Feather name="calendar" size={11} color={Colors.textSecondary} />
                      <Text style={styles.metaTxt}>{formatScheduled(currentRide.scheduledAt)}</Text>
                    </View>
                  )}
                  {clientName && (
                    <View style={styles.metaChip}>
                      <Feather name="user" size={11} color={Colors.textSecondary} />
                      <Text style={styles.metaTxt}>{clientName}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Fare input */}
              {currentRide.status === 'ONGOING_RIDE' && (
                <View style={[styles.card, Shadow.sm]}>
                  <Text style={styles.cardLabel}>Collect Fare</Text>
                  <InputField
                    label="Fare Amount ($)"
                    value={fare}
                    onChangeText={(t) => { setFare(t); setFareError(''); }}
                    error={fareError}
                    keyboardType="numeric"
                    placeholder="Enter amount collected"
                    returnKeyType="next"
                    onSubmitEditing={() => noteRef.current?.focus()}
                  />
                  <InputField
                    ref={noteRef}
                    label="Note (Optional)"
                    value={note}
                    onChangeText={setNote}
                    placeholder="Any notes about this ride..."
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}

              {info?.btn ? (
                <PrimaryButton
                  title={info.btn}
                  onPress={handleUpdateStatus}
                  loading={isLoading}
                  style={styles.actionBtn}
                />
              ) : null}
            </>
          ) : null}

          {/* ── Upcoming scheduled rides ────────────────────────────────── */}
          {upcomingRides.length > 0 && (
            <>
              <View style={styles.sectionHeaderRow}>
                <Feather name="calendar" size={14} color={Colors.textSecondary} />
                <Text style={styles.sectionHeader}>Upcoming Scheduled</Text>
              </View>
              <Text style={styles.sectionNote}>
                These rides are confirmed for the future. You can freely accept instant rides in the meantime.
              </Text>
              {upcomingRides.map((ride) => (
                <View key={ride._id} style={[styles.upcomingCard, Shadow.sm]}>
                  <View style={styles.upcomingHeader}>
                    <View style={styles.upcomingBadge}>
                      <Feather name="calendar" size={11} color={Colors.accent} />
                      <Text style={styles.upcomingBadgeTxt}>Scheduled</Text>
                    </View>
                    <Text style={styles.scheduledTime}>
                      {ride.scheduledAt ? formatScheduled(ride.scheduledAt) : '—'}
                    </Text>
                  </View>
                  <View style={styles.routeRow}>
                    <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                    <Text style={styles.routeTxt} numberOfLines={1}>{ride.fromLocation}</Text>
                  </View>
                  <View style={styles.routeConnector} />
                  <View style={styles.routeRow}>
                    <View style={[styles.routeDot, { backgroundColor: Colors.accent }]} />
                    <Text style={styles.routeTxt} numberOfLines={1}>{ride.toLocation}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                      <Feather name="users" size={11} color={Colors.textSecondary} />
                      <Text style={styles.metaTxt}>{ride.passengers}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  headerTitle: { fontSize: Typography.size.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xl, letterSpacing: -0.5 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  emptyTitle: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: Typography.size.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Status card
  statusCard: { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl },
  statusIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  statusLabel: { fontSize: Typography.size.lg, fontWeight: '800', color: Colors.white, marginBottom: Spacing.md },
  badge: { alignSelf: 'center' },

  // Progress
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  progressStep: { flexDirection: 'row', alignItems: 'center' },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border },
  progressDotActive: { backgroundColor: Colors.accent },
  progressLine: { width: 28, height: 3, backgroundColor: Colors.border, marginHorizontal: 2 },
  progressLineActive: { backgroundColor: Colors.accent },

  // Cards
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.base },
  cardLabel: { fontSize: Typography.size.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  routeDot: { width: 9, height: 9, borderRadius: 5 },
  routeConnector: { width: 2, height: 16, backgroundColor: Colors.border, marginLeft: 4, marginVertical: 2 },
  routeTxt: { fontSize: Typography.size.base, color: Colors.textPrimary, fontWeight: '500', flex: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.borderLight, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  metaTxt: { fontSize: Typography.size.xs, color: Colors.textSecondary, fontWeight: '600' },

  actionBtn: { marginTop: Spacing.md },

  // Upcoming section
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xl, marginBottom: Spacing.xs },
  sectionHeader: { fontSize: Typography.size.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionNote: { fontSize: Typography.size.xs, color: Colors.textMuted, lineHeight: 18, marginBottom: Spacing.base },

  upcomingCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.base, borderLeftWidth: 3, borderLeftColor: Colors.accent },
  upcomingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base },
  upcomingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.accentLight, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  upcomingBadgeTxt: { fontSize: Typography.size.xs, color: Colors.accent, fontWeight: '700' },
  scheduledTime: { fontSize: Typography.size.xs, color: Colors.textSecondary, fontWeight: '600' },
});

export default ActiveRideScreen;
