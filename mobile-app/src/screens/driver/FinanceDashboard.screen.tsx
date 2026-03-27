import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Platform,
} from 'react-native';
import CustomDatePicker from '../../components/CustomDatePicker';
import Feather from 'react-native-vector-icons/Feather';
import { useRide } from '../../hooks/useRide';
import RideCard from '../../components/RideCard';
import { RideCardSkeleton } from '../../components/SkeletonLoader';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';

const FinanceDashboardScreen: React.FC = () => {
  const { earnings, fetchEarnings, isLoading, error } = useRide();

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // first of current month
    return d;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-CA', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleFetch = () => {
    fetchEarnings(startDate.toISOString(), endDate.toISOString());
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.subtitle}>Filter by date range</Text>

        {/* Date filter card */}
        <View style={[styles.filterCard, Shadow.sm]}>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>FROM</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowStart(true)}>
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
              </TouchableOpacity>
              <CustomDatePicker
                visible={showStart}
                value={startDate}
                mode="date"
                maximumDate={endDate}
                onChange={setStartDate}
                onClose={() => setShowStart(false)}
              />
            </View>

            <View style={styles.dateSeparator}><Text style={styles.arrowText}>→</Text></View>

            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>TO</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowEnd(true)}>
                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
              </TouchableOpacity>
              <CustomDatePicker
                visible={showEnd}
                value={endDate}
                mode="date"
                minimumDate={startDate}
                maximumDate={new Date()}
                onChange={setEndDate}
                onClose={() => setShowEnd(false)}
              />
            </View>
          </View>

          <PrimaryButton
            title="Calculate Earnings"
            onPress={handleFetch}
            loading={isLoading}
          />
        </View>

        {/* Summary card */}
        {earnings && (
          <>
            <View style={[styles.summaryCard, Shadow.md]}>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
              <Text style={styles.totalAmount}>${earnings.totalEarnings.toLocaleString('en-CA')}</Text>
              <Text style={styles.summaryMeta}>{earnings.count} ride{earnings.count !== 1 ? 's' : ''} completed</Text>
            </View>

            <Text style={styles.sectionTitle}>Ride Breakdown</Text>

            {isLoading ? (
              <><RideCardSkeleton /><RideCardSkeleton /></>
            ) : earnings.rides.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No completed rides in this period.</Text>
              </View>
            ) : (
              earnings.rides.map((ride) => <RideCard key={ride._id} ride={ride} />)
            )}
          </>
        )}

        {!earnings && !isLoading && (
          <View style={styles.emptyStart}>
            <View style={styles.emptyIconWrap}>
              <Feather name="bar-chart-2" size={32} color={Colors.accent} />
            </View>
            <Text style={styles.emptyStartText}>Set a date range and tap Calculate</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  title: { fontSize: Typography.size.xxl, fontWeight: '800', color: Colors.primary, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.size.base, color: Colors.textSecondary, marginBottom: Spacing.xl },
  filterCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.xl },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.base, gap: Spacing.sm },
  dateField: { flex: 1 },
  dateLabel: { fontSize: Typography.size.xs, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  dateButton: { backgroundColor: Colors.inputBg, borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  dateText: { fontSize: Typography.size.sm, color: Colors.textPrimary, fontWeight: '600', textAlign: 'center' },
  dateSeparator: { paddingTop: 20 },
  arrowText: { fontSize: 16, color: Colors.textMuted },
  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  summaryLabel: { fontSize: Typography.size.sm, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  totalAmount: { fontSize: 48, fontWeight: '900', color: Colors.white, letterSpacing: -2 },
  summaryMeta: { fontSize: Typography.size.base, color: 'rgba(255,255,255,0.6)', marginTop: Spacing.xs },
  sectionTitle: { fontSize: Typography.size.lg, fontWeight: '800', color: Colors.primary, marginBottom: Spacing.base },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.size.base, color: Colors.textSecondary },
  emptyStart: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.base },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(233, 69, 96, 0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyStartText: { color: Colors.textSecondary, fontSize: Typography.size.base, textAlign: 'center' },
});

export default FinanceDashboardScreen;
