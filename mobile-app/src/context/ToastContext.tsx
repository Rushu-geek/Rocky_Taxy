import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Platform,
  TouchableOpacity, StatusBar, Dimensions,
} from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '../constants/theme';

export type SnackType = 'success' | 'error' | 'info' | 'warning';

interface SnackOptions {
  message: string;
  type?: SnackType;
  duration?: number;
  action?: { label: string; onPress: () => void };
}

interface SnackContextData {
  showToast: (options: SnackOptions | string) => void;
}

const SnackContext = createContext<SnackContextData>({ showToast: () => {} });
export const useToast = () => useContext(SnackContext);

const { width } = Dimensions.get('window');
const BOTTOM_OFFSET = Platform.OS === 'ios' ? 100 : 80;

const SNACK_CONFIG: Record<SnackType, { icon: string; iconColor: string; barColor: string }> = {
  success: { icon: '✓', iconColor: '#00C853', barColor: '#00C853' },
  error:   { icon: '✕', iconColor: '#FF3B30', barColor: '#FF3B30' },
  warning: { icon: '!', iconColor: '#FF9500', barColor: '#FF9500' },
  info:    { icon: 'i', iconColor: Colors.accent, barColor: Colors.accent },
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [snack, setSnack] = useState<SnackOptions | null>(null);
  const translateY = useRef(new Animated.Value(200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVisible = useRef(false);

  const dismiss = useCallback(() => {
    if (!isVisible.current) return;
    isVisible.current = false;
    Animated.parallel([
      Animated.timing(translateY, { toValue: 200, duration: 280, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setSnack(null));
  }, [translateY, opacity]);

  const showToast = useCallback((opts: SnackOptions | string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const config: SnackOptions = typeof opts === 'string'
      ? { message: opts, type: 'info', duration: 3500 }
      : { type: 'info', duration: 3500, ...opts };

    setSnack(config);
    isVisible.current = true;

    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0, tension: 70, friction: 10, useNativeDriver: true,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    timerRef.current = setTimeout(dismiss, config.duration ?? 3500);
  }, [translateY, opacity, dismiss]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const cfg = snack ? SNACK_CONFIG[snack.type ?? 'info'] : null;

  return (
    <SnackContext.Provider value={{ showToast }}>
      {children}
      {snack && cfg && (
        <Animated.View
          style={[
            styles.snackbar,
            { transform: [{ translateY }], opacity },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={dismiss}
            style={styles.snackContent}
          >
            {/* Colored left accent bar */}
            <View style={[styles.accentBar, { backgroundColor: cfg.barColor }]} />

            {/* Circle icon */}
            <View style={[styles.iconCircle, { borderColor: cfg.iconColor }]}>
              <Text style={[styles.iconText, { color: cfg.iconColor }]}>{cfg.icon}</Text>
            </View>

            {/* Message */}
            <Text style={styles.messageText} numberOfLines={2}>
              {snack.message}
            </Text>

            {/* Optional action */}
            {snack.action && (
              <TouchableOpacity
                onPress={() => { snack.action?.onPress(); dismiss(); }}
                style={styles.actionBtn}
              >
                <Text style={[styles.actionText, { color: cfg.barColor }]}>
                  {snack.action.label}
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </SnackContext.Provider>
  );
};

const styles = StyleSheet.create({
  snackbar: {
    position: 'absolute',
    bottom: BOTTOM_OFFSET,
    left: Spacing.xl,
    right: Spacing.xl,
    zIndex: 9999,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 16,
    overflow: 'hidden',
  },
  snackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    paddingRight: Spacing.base,
    gap: Spacing.sm,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  iconText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 15,
  },
  messageText: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: '#1A1A2E',
    lineHeight: 20,
  },
  actionBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  actionText: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
