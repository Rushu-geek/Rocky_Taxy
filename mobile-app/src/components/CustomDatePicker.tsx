import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

interface CustomDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
  visible: boolean;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  onClose,
  visible,
  mode = 'date',
  minimumDate,
  maximumDate,
}) => {
  const [tempDate, setTempDate] = useState(value);

  // Sync tempDate when picker opens or value changes
  useEffect(() => {
    if (visible) setTempDate(value);
  }, [value, visible]);

  // ── Android: use imperative API (v8+ requirement, no JSX component) ──
  useEffect(() => {
    if (Platform.OS !== 'android' || !visible) return;

    const openPicker = (currentMode: 'date' | 'time', currentDate: Date) => {
      DateTimePickerAndroid.open({
        value: currentDate,
        mode: currentMode,
        minimumDate,
        maximumDate,
        onChange: (event, selectedDate) => {
          if (event.type === 'dismissed') {
            onClose();
            return;
          }
          const picked = selectedDate ?? currentDate;
          if (mode === 'datetime' && currentMode === 'date') {
            // After date is picked, open time picker
            openPicker('time', picked);
          } else {
            onChange(picked);
            onClose();
          }
        },
      });
    };

    openPicker(mode === 'time' ? 'time' : 'date', value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Android renders nothing — picker is shown imperatively
  if (Platform.OS === 'android') return null;

  // ── iOS: beautiful bottom-sheet modal with spinner ──
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.pickerContainer}>
          <View style={styles.toolbar}>
            <TouchableOpacity onPress={onClose} style={styles.btn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.toolbarTitle}>
              {mode === 'datetime' ? 'Pick date & time' : mode === 'time' ? 'Pick time' : 'Pick date'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                onChange(tempDate);
                onClose();
              }}
              style={styles.btn}
            >
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerWrapper}>
            <DateTimePicker
              value={tempDate}
              mode={mode}
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={(e, d) => { if (d) setTempDate(d); }}
              textColor={Colors.textPrimary}
              style={styles.picker}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.inputBg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  toolbarTitle: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  btn: { padding: Spacing.sm, minWidth: 64 },
  cancelText: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  doneText: {
    fontSize: Typography.size.base,
    color: Colors.accent,
    fontWeight: '700',
    textAlign: 'right',
  },
  pickerWrapper: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  picker: {
    height: 200,
    width: '100%',
  },
});

export default CustomDatePicker;
