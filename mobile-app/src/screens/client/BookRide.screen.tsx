import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  KeyboardAvoidingView, Platform, Switch, TouchableOpacity,
  PermissionsAndroid,
} from 'react-native';
import CustomDatePicker from '../../components/CustomDatePicker';
import Feather from 'react-native-vector-icons/Feather';
import { useRide } from '../../hooks/useRide';
import InputField from '../../components/InputField';
import Dropdown, { DropdownOption } from '../../components/Dropdown';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { getCurrentPosition, isGeolocationAvailable, GeoPosition, GeoError } from '../../utils/geolocation';

const PRESET_LOCATIONS: DropdownOption[] = [
  { label: '✈️ Airport Terminal 1', value: 'Airport Terminal 1' },
  { label: '✈️ Airport Terminal 2', value: 'Airport Terminal 2' },
  { label: '🏙️ City Center', value: 'City Center' },
  { label: '🏥 City Hospital', value: 'City Hospital' },
  { label: '🏢 Business District', value: 'Business District' },
  { label: '🛍️ Central Mall', value: 'Central Mall' },
  { label: '🚉 Railway Station', value: 'Railway Station' },
  { label: '🎓 University Campus', value: 'University Campus' },
  { label: '🏨 Grand Hotel', value: 'Grand Hotel' },
  { label: '🏠 Residential Zone A', value: 'Residential Zone A' },
  { label: '🏠 Residential Zone B', value: 'Residential Zone B' },
];

/** Request location permission on Android; iOS prompts automatically on first GPS call. */
async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'TaxiApp needs your location to automatically set your pickup point. ' +
            'You can still choose a pickup manually if you prefer.',
          buttonPositive: 'Allow',
          buttonNegative: 'No Thanks',
          buttonNeutral: 'Ask Me Later',
        }
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }
  // iOS: OS prompts automatically when we call getCurrentPosition
  return true;
}

/** Reverse-geocode lat/lng → human-readable address using OSM Nominatim. */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'TaxiApp/1.0' },
    });
    if (!res.ok) throw new Error('Geocode request failed');
    const json = (await res.json()) as {
      address?: Record<string, string>;
      display_name?: string;
    };

    const addr = json.address ?? {};
    const parts: string[] = [];
    const poi = addr.amenity ?? addr.shop ?? addr.building ?? addr.neighbourhood;
    if (poi) parts.push(poi);
    const road = addr.road ?? addr.pedestrian ?? addr.residential;
    if (road) parts.push(road);
    const city = addr.city ?? addr.town ?? addr.village ?? addr.county;
    if (city) parts.push(city);

    if (parts.length > 0) return parts.join(', ');
    return json.display_name?.split(',').slice(0, 3).join(', ') ?? 'Current Location';
  } catch {
    return 'Current Location';
  }
}

const BookRideScreen: React.FC = () => {
  const { bookRide, isLoading } = useRide();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Location state
  const [locationOptions, setLocationOptions] = useState<DropdownOption[]>(PRESET_LOCATIONS);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const locationFetched = useRef(false);

  // Auto-fetch and pre-fill current location as pickup on mount
  useEffect(() => {
    if (locationFetched.current) return;
    locationFetched.current = true;

    const autoFillPickup = async () => {
      setLocationLoading(true);
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        setLocationDenied(true);
        setLocationLoading(false);
        return;
      }

      if (!isGeolocationAvailable()) {
        setLocationDenied(true);
        setLocationLoading(false);
        return;
      }

      getCurrentPosition(
        async (position: GeoPosition) => {
          const { latitude, longitude } = position.coords;
          const address = await reverseGeocode(latitude, longitude);

          const currentLocOption: DropdownOption = {
            label: `📍 ${address}`,
            value: address,
          };

          setLocationOptions([currentLocOption, ...PRESET_LOCATIONS]);
          setFrom(address);
          setLocationLoading(false);
        },
        (_err: GeoError) => {
          setLocationDenied(true);
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    };

    autoFillPickup();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!from) e.from = 'Select pickup location.';
    if (!to) e.to = 'Select destination.';
    if (from && to && from === to) e.to = 'From and To locations must be different.';
    const p = parseInt(passengers, 10);
    if (!passengers || isNaN(p) || p < 1 || p > 10) e.passengers = 'Enter 1-10 passengers.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBook = async () => {
    setError('');
    setSuccess(false);
    if (!validate()) return;

    try {
      await bookRide({
        fromLocation: from,
        toLocation: to,
        passengers: parseInt(passengers, 10),
        type: isScheduled ? 'scheduled' : 'instant',
        scheduledAt: isScheduled ? scheduledDate.toISOString() : undefined,
      });
      setSuccess(true);
      setTo(''); setPassengers('1'); setIsScheduled(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to book ride.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Book a Ride</Text>
          <Text style={styles.subtitle}>Tell us where you're going</Text>

          <View style={[styles.card, Shadow.md]}>
            {success && (
              <View style={styles.successBanner}>
                <Feather name="check-circle" size={20} color={Colors.success} />
                <Text style={styles.successText}>Ride booked! Waiting for a driver...</Text>
              </View>
            )}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Location denied inline hint */}
            {locationDenied && (
              <View style={styles.locationHint}>
                <Feather name="map-pin" size={14} color="#F59E0B" />
                <Text style={styles.locationHintText}>
                  Location access denied — please select your pickup manually.
                </Text>
              </View>
            )}

            <Dropdown
              label="Pickup Location"
              value={from}
              options={locationOptions}
              onSelect={(opt) => { setFrom(opt.value); setErrors((p) => ({ ...p, from: '' })); }}
              placeholder={locationLoading ? '📍 Detecting your location…' : 'Select pickup point'}
              error={errors.from}
              searchable
            />

            <Dropdown
              label="Destination"
              value={to}
              options={PRESET_LOCATIONS}
              onSelect={(opt) => { setTo(opt.value); setErrors((p) => ({ ...p, to: '' })); }}
              placeholder="Select destination"
              error={errors.to}
              searchable
            />

            <InputField
              label="Number of Passengers"
              value={passengers}
              onChangeText={(t) => { setPassengers(t); setErrors((p) => ({ ...p, passengers: '' })); }}
              error={errors.passengers}
              keyboardType="numeric"
              maxLength={2}
              placeholder="1"
            />

            {/* Scheduled toggle */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Schedule for Later</Text>
                <Text style={styles.toggleSub}>
                  {isScheduled ? 'Scheduled ride' : 'Instant ride'}
                </Text>
              </View>
              <Switch
                value={isScheduled}
                onValueChange={setIsScheduled}
                trackColor={{ false: Colors.border, true: Colors.accent }}
                thumbColor={Colors.white}
              />
            </View>

            {/* Date picker for scheduled */}
            {isScheduled && (
              <View style={styles.datePicker}>
                <Text style={styles.toggleLabel}>Scheduled Date &amp; Time</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    📅 {scheduledDate.toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </Text>
                </TouchableOpacity>
                <CustomDatePicker
                  visible={showDatePicker}
                  value={scheduledDate}
                  mode="datetime"
                  minimumDate={new Date()}
                  onChange={setScheduledDate}
                  onClose={() => setShowDatePicker(false)}
                />
              </View>
            )}

            <PrimaryButton
              title={isScheduled ? 'Schedule Ride' : 'Book Now'}
              onPress={handleBook}
              loading={isLoading}
              style={styles.btn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  title: { fontSize: Typography.size.xxl, fontWeight: '800', color: Colors.primary, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.size.base, color: Colors.textSecondary, marginBottom: Spacing.xl },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.xl },
  successBanner: {
    backgroundColor: '#E8F5E9', borderRadius: BorderRadius.md, padding: Spacing.md,
    marginBottom: Spacing.base, borderLeftWidth: 3, borderLeftColor: Colors.success,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  successText: { color: Colors.success, fontWeight: '700', fontSize: Typography.size.sm, flex: 1 },
  errorBanner: {
    backgroundColor: '#FFEBEE', borderRadius: BorderRadius.md, padding: Spacing.md,
    marginBottom: Spacing.base, borderLeftWidth: 3, borderLeftColor: Colors.danger,
  },
  errorText: { color: Colors.danger, fontWeight: '600', fontSize: Typography.size.sm },
  locationHint: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: '#FFFBEB', borderRadius: BorderRadius.sm,
    padding: Spacing.sm, marginBottom: Spacing.base,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  locationHintText: { color: '#78350F', fontSize: Typography.size.xs, flex: 1 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.inputBg, borderRadius: BorderRadius.md, padding: Spacing.base,
    marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border,
  },
  toggleLabel: {
    fontSize: Typography.size.sm, fontWeight: '700', color: Colors.textPrimary,
    textTransform: 'uppercase', letterSpacing: 0.3,
  },
  toggleSub: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 2 },
  datePicker: { marginBottom: Spacing.base },
  dateButton: {
    backgroundColor: Colors.inputBg, borderRadius: BorderRadius.md, padding: Spacing.base,
    borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.xs,
  },
  dateButtonText: { fontSize: Typography.size.base, color: Colors.textPrimary },
  btn: { marginTop: Spacing.md },
});

export default BookRideScreen;
