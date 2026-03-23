import { StyleSheet } from 'react-native';

export const Colors = {
  // Uber/Ola-inspired: deep black primary + amber-gold accent
  primary: '#000000',           // Pure black (Uber-like)
  primaryDark: '#1A1A1A',       // Slightly lifted dark
  primarySurface: '#111111',    // Surface-level dark

  accent: '#F5A623',            // Amber gold — iconic cab colour
  accentLight: 'rgba(245,166,35,0.12)', // Subtle amber tint for backgrounds
  accentDark: '#C07E00',        // Darker amber for pressed states

  success: '#00A651',           // Ola-style green
  successLight: 'rgba(0,166,81,0.1)',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#0A84FF',

  // Status colours
  statusPending: '#FF9500',
  statusAccepted: '#0A84FF',
  statusOnTheWay: '#AF52DE',
  statusWaiting: '#32ADE6',
  statusOngoing: '#00A651',
  statusEnded: '#8E8E93',

  // Neutrals — clean whites + warm grays (Uber aesthetic)
  white: '#FFFFFF',
  black: '#000000',
  background: '#F7F7F7',        // Slightly off-white background
  card: '#FFFFFF',
  border: 'rgba(0,0,0,0.08)',
  borderLight: 'rgba(0,0,0,0.04)',
  inputBg: '#F5F5F5',
  divider: 'rgba(0,0,0,0.06)',

  // Text — high contrast
  textPrimary: '#000000',
  textSecondary: '#666666',
  textMuted: '#999999',
  textOnDark: '#FFFFFF',
  textOnAccent: '#000000',      // Black text on amber for readability

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.55)',
  skeletonBase: '#EBEBEB',
  skeletonHighlight: '#F5F5F5',
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    xxxl: 38,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const Shadow = StyleSheet.create({
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
});
