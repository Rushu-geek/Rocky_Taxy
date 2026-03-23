import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, Platform, PermissionsAndroid,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { checkNotificationPermission } from '../services/firebase';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../constants/theme';
import { getCurrentPosition, isGeolocationAvailable } from '../utils/geolocation';

interface PermissionsBannerProps {
  style?: object;
}

const PermissionsBanner: React.FC<PermissionsBannerProps> = ({ style }) => {
  const [dismissed, setDismissed] = useState(false);
  const [notifDenied, setNotifDenied] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const checkPermissions = useCallback(async () => {
    // --- Notification check (Android only; iOS push not yet set up) ---
    if (Platform.OS === 'android') {
      const notifStatus = await checkNotificationPermission();
      setNotifDenied(notifStatus === 'denied');
    }

    // --- Location check ---
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        setLocationDenied(!granted);
      } catch {
        setLocationDenied(false);
      }
    } else {
      // iOS: attempt a passive position check to infer permission status
      if (isGeolocationAvailable()) {
        await new Promise<void>((resolve) => {
          getCurrentPosition(
            () => { setLocationDenied(false); resolve(); },
            (err) => {
              // code 1 = PERMISSION_DENIED
              setLocationDenied(err.code === 1);
              resolve();
            },
            { timeout: 3000, maximumAge: 60000 }
          );
        });
      }
    }
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  if (dismissed || (!notifDenied && !locationDenied)) {
    return null;
  }

  const missingItems: string[] = [];
  if (notifDenied) missingItems.push('Push Notifications');
  if (locationDenied) missingItems.push('Location Access');

  return (
    <View style={[styles.banner, Shadow.sm, style]}>
      <View style={styles.iconWrap}>
        <Feather name="alert-triangle" size={20} color="#F59E0B" />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Permissions Required</Text>
        <Text style={styles.body}>
          {missingItems.join(' & ')}{' '}
          {missingItems.length > 1 ? 'are' : 'is'} disabled.
          Some app features may not work correctly.
        </Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => Linking.openSettings()}>
          <Feather name="settings" size={12} color={Colors.white} style={{ marginRight: 4 }} />
          <Text style={styles.settingsBtnText}>Open Settings</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.closeBtn} onPress={() => setDismissed(true)}>
        <Feather name="x" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFFBEB',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: Spacing.base,
    marginBottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  iconWrap: { marginTop: 2 },
  content: { flex: 1 },
  title: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  body: {
    fontSize: Typography.size.xs,
    color: '#78350F',
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  settingsBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsBtnText: {
    fontSize: Typography.size.xs,
    color: Colors.white,
    fontWeight: '700',
  },
  closeBtn: { padding: 2, marginTop: -2 },
});

export default PermissionsBanner;
