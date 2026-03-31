import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import { GOOGLE_PLACES_API_KEY_ANDROID, GOOGLE_PLACES_API_KEY_IOS } from '@env';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import Feather from 'react-native-vector-icons/Feather';

// const API_KEY = Platform.OS === 'ios' ? GOOGLE_PLACES_API_KEY_IOS : GOOGLE_PLACES_API_KEY_ANDROID;
const API_KEY = "AIzaSyCClj2Q0Pai63T6z4AVTJtTGtkoJKFz9JQ";

interface LocationAutocompleteProps {
  label: string;
  value: string;
  onSelect: (address: string) => void;
  placeholder?: string;
  error?: string;
  currentLocationText?: string; // e.g. "📍 Detecting your location..." or actual address
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  label,
  value,
  onSelect,
  placeholder = 'Search location',
  error,
  currentLocationText,
}) => {
  const [visible, setVisible] = useState(false);
  const [apiError, setApiError] = useState<string>('');
  const ref = useRef<GooglePlacesAutocompleteRef>(null);

  useEffect(() => {
    if (visible && ref.current) {
      setTimeout(() => ref.current?.focus(), 100);
    }
  }, [visible]);

  const handleSelect = (data: any, details: any = null) => {
    const address = data.description || details?.formatted_address || data.name;
    onSelect(address);
    setVisible(false);
  };

  const handleCurrentLocationSelect = () => {
    if (currentLocationText && currentLocationText.startsWith('📍 ') && !currentLocationText.includes('Detecting')) {
      onSelect(currentLocationText.replace('📍 ', ''));
      setVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.trigger, error ? styles.triggerError : null]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Feather name="search" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
              <Feather name="x" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <GooglePlacesAutocomplete
            ref={ref}
            placeholder={placeholder}
            minLength={2}
            keyboardShouldPersistTaps="handled"
            fetchDetails={true}
            onFail={(error) => {
              console.error('Places API Error:', error);
              setApiError(error?.toString() || 'Unknown Google Places API Error from network.');
            }}
            onPress={(data, details) => handleSelect(data, details)}
            query={{
              key: API_KEY,
              language: 'en',
              components: 'country:ca', // Restrict to Canada
            }}
            predefinedPlaces={
              currentLocationText && !currentLocationText.includes('Detecting')
                ? [{ description: currentLocationText, geometry: { location: { lat: 0, lng: 0 } as any } }]
                : []
            }
            textInputProps={{
              placeholderTextColor: Colors.textMuted,
            }}
            renderRow={(rowData) => {
              const isCurrentLoc = rowData.description === currentLocationText;
              const screenWidth = Dimensions.get('window').width;
              const textMaxWidth = screenWidth - Spacing.lg * 2 - 36 - Spacing.md - Spacing.lg;
              return (
                <View style={styles.rowContent}>
                  <View style={[styles.iconContainer, isCurrentLoc && { backgroundColor: `${Colors.accent}15` }]}>
                    <Feather 
                      name={isCurrentLoc ? 'navigation' : 'map-pin'} 
                      size={18} 
                      color={isCurrentLoc ? Colors.accent : Colors.textSecondary} 
                    />
                  </View>
                  <Text 
                    style={[
                      styles.rowText,
                      { maxWidth: textMaxWidth },
                      isCurrentLoc && { color: Colors.accent, fontWeight: '700' },
                    ]}
                    numberOfLines={2}
                  >
                    {rowData.description}
                  </Text>
                </View>
              );
            }}
            styles={{
              container: { flex: 1 },
              textInputContainer: {
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.sm,
                backgroundColor: Colors.white,
                borderBottomWidth: 1,
                borderBottomColor: Colors.borderLight,
              },
              textInput: {
                backgroundColor: Colors.inputBg,
                borderRadius: BorderRadius.xl,
                paddingHorizontal: Spacing.lg,
                fontSize: Typography.size.base,
                color: Colors.textPrimary,
                height: 52,
                borderWidth: 1,
                borderColor: Colors.borderLight,
              },
              listView: {
                backgroundColor: Colors.white,
                flex: 1,
              },
              row: {
                paddingVertical: Spacing.md,
                paddingHorizontal: Spacing.lg,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.white,
                width: '100%',
                overflow: 'hidden',
              },
              separator: {
                backgroundColor: Colors.borderLight,
                height: 1,
                marginLeft: 50, // aligns with the text, leaving the icon gutter clear
              },
              poweredContainer: {
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: Spacing.lg,
                opacity: 0.8,
              },
            }}
          />
          {!!apiError && (
            <Text style={{ color: Colors.danger, textAlign: 'center', padding: Spacing.lg, fontSize: Typography.size.sm }}>
              {apiError}
            </Text>
          )}
          {!API_KEY && (
            <Text style={{ color: 'red', textAlign: 'center', padding: 20 }}>
              API Key is missing! Please check your .env file and restart Metro with --reset-cache.
            </Text>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.base },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trigger: {
    backgroundColor: Colors.inputBg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  triggerError: { borderColor: Colors.danger },
  triggerText: { fontSize: Typography.size.base, color: Colors.textPrimary, flex: 1 },
  placeholder: { color: Colors.textMuted },
  errorText: { fontSize: Typography.size.xs, color: Colors.danger, marginTop: Spacing.xs, fontWeight: '500' },
  modal: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: Typography.size.md, fontWeight: '700', color: Colors.textPrimary },
  closeBtn: { padding: Spacing.xs },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  rowText: {
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.xs,
  },
});

export default LocationAutocomplete;
