import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FCM_TOKEN_KEY = '@taxi_app_fcm_token';

export type PermissionStatus = 'granted' | 'denied' | 'not_determined';

/**
 * Check the current notification permission status without prompting.
 * Returns 'granted', 'denied', or 'not_determined'.
 */
export const checkNotificationPermission = async (): Promise<PermissionStatus> => {
  try {
    const authStatus = await messaging().hasPermission();
    if (authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
      return 'granted';
    }
    if (authStatus === messaging.AuthorizationStatus.DENIED) {
      return 'denied';
    }
    return 'not_determined';
  } catch {
    return 'not_determined';
  }
};

/**
 * Check the current location permission status without prompting.
 */
export const checkLocationPermission = async (): Promise<PermissionStatus> => {
  if (Platform.OS === 'android') {
    try {
      const result = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return result ? 'granted' : 'denied';
    } catch {
      return 'not_determined';
    }
  }
  // iOS — we don't call the API without prompting; infer from a passive getCurrentPosition check
  // The PermissionsBanner on iOS will attempt a geolocation request to determine status
  return 'not_determined';
};

/**
 * Request notification permission and get FCM token.
 * Android only — no-op on iOS until iOS push is configured.
 * The iOS guard is intentional: iOS Firebase push setup is pending.
 */
export const requestPermissionAndGetToken = async (): Promise<string | null> => {
  if (Platform.OS !== 'android') return null;

  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('FCM permission not granted');
      return null;
    }

    const token = await messaging().getToken();
    if (token) {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    }
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Setup foreground message listener.
 * Android only — no-op on iOS until iOS push is configured.
 */
export const setupForegroundListener = (
  onMessage: (notification: { title?: string; body?: string; data?: Record<string, string> }) => void
): (() => void) => {
  if (Platform.OS !== 'android') return () => {};

  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    onMessage({
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      data: remoteMessage.data as Record<string, string>,
    });
  });

  return unsubscribe;
};

/**
 * Get the notification that opened the app from a killed/background state.
 * Android only — returns null on iOS until iOS push is configured.
 */
export const getInitialNotification = async () => {
  if (Platform.OS !== 'android') return null;

  try {
    return await messaging().getInitialNotification();
  } catch {
    return null;
  }
};

/**
 * Listen for FCM token refresh. When Firebase rotates the token, send it to the server.
 * Android only — no-op on iOS until iOS push is configured.
 */
export const onTokenRefresh = (
  callback: (token: string) => void
): (() => void) => {
  if (Platform.OS !== 'android') return () => {};

  return messaging().onTokenRefresh(callback);
};
