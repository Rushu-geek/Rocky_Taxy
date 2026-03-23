/**
 * Typed wrapper around @react-native-community/geolocation.
 *
 * This package (installed separately since RN 0.60 removed Geolocation from core)
 * provides the native geolocation API for React Native apps.
 *
 * For Android, ensure ACCESS_FINE_LOCATION is declared in AndroidManifest.xml
 * and runtime permission is requested before calling getCurrentPosition.
 */

import Geolocation from '@react-native-community/geolocation';

export type GeoPosition = {
  coords: { latitude: number; longitude: number; accuracy: number };
  timestamp: number;
};

export type GeoError = { code: number; message: string };

export type GeoOptions = {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
};

/** Returns true — the native geolocation module is always available after install. */
export function isGeolocationAvailable(): boolean {
  return !!Geolocation;
}

/**
 * Get the device's current GPS position.
 * On Android, call PermissionsAndroid.request(ACCESS_FINE_LOCATION) first.
 * On iOS, the OS prompts automatically on first call.
 */
export function getCurrentPosition(
  success: (pos: GeoPosition) => void,
  error: (err: GeoError) => void,
  options?: GeoOptions,
): void {
  Geolocation.getCurrentPosition(
    success as Parameters<typeof Geolocation.getCurrentPosition>[0],
    error as Parameters<typeof Geolocation.getCurrentPosition>[1],
    options,
  );
}
