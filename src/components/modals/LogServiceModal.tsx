import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { ModalWrapper } from '../ModalWrapper';
import { GlassButton } from '../GlassButton';
import { useApp } from '../../context/AppContext';
import { logService, getVehicleById } from '../../db/queries/vehicles';

interface LogServiceModalProps {
  visible: boolean;
  onClose: () => void;
  vehicleId: string;
  onLogged: () => void;
}

export const LogServiceModal: React.FC<LogServiceModalProps> = ({
  visible,
  onClose,
  vehicleId,
  onLogged,
}) => {
  const { accounts, refreshData } = useApp();
  const [serviceType, setServiceType] = useState('Periodic Service');
  const [workPerformed, setWorkPerformed] = useState('');
  const [odometer, setOdometer] = useState('');
  const [partsCost, setPartsCost] = useState('');
  const [labourCost, setLabourCost] = useState('');
  const [serviceCentre, setServiceCentre] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const commonTypes = [
    'Periodic Service',
    'Engine Oil Change',
    'Brake Overhaul',
    'Chain Lubrication',
    'Tyre Change / Puncture',
    'Battery Replacement',
    'General Washing',
  ];

  useEffect(() => {
    if (visible && vehicleId) {
      const v = getVehicleById(vehicleId);
      if (v) {
        setOdometer(v.current_odometer > 0 ? v.current_odometer.toString() : '');
      }
      setWorkPerformed('');
      setPartsCost('');
      setLabourCost('');
      setServiceCentre('');
      if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }, [visible, vehicleId]);

  const handleSubmit = () => {
    const odo = parseFloat(odometer);
    const pCost = parseFloat(partsCost) || 0;
    const lCost = parseFloat(labourCost) || 0;
    const total = pCost + lCost;

    if (isNaN(odo) || odo <= 0) {
      Alert.alert('Required', 'Please enter odometer reading.');
      return;
    }
    if (total <= 0) {
      Alert.alert('Required', 'Please enter parts or labour cost.');
      return;
    }

    try {
      logService({
        vehicle_id: vehicleId,
        service_type: serviceType,
        work_performed: workPerformed.trim() || undefined,
        odometer: odo,
        parts_cost: pCost,
        labour_cost: lCost,
        service_centre: serviceCentre.trim() || undefined,
        account_id: selectedAccountId || undefined,
      });

      refreshData();
      onLogged();
      Alert.alert('Service Logged', 'Maintenance history and expense updated.');
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not log service.');
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Log Service & Repairs"
      subtitle="Track maintenance, spare parts & workshop bill"
    >
      <View style={styles.form}>
        {/* Service Type chips */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Service Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {commonTypes.map((t) => (
              <TouchableOpacity
                key={t}
                activeOpacity={0.75}
                onPress={() => setServiceType(t)}
                style={[styles.chip, serviceType === t && styles.activeChip]}
              >
                <Text style={[styles.chipText, serviceType === t && styles.activeChipText]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Odometer at Service (km)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 15000"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={odometer}
            onChangeText={setOdometer}
          />
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Parts Cost (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={partsCost}
              onChangeText={setPartsCost}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Labour / Service (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={labourCost}
              onChangeText={setLabourCost}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Work Done / Parts Replaced</Text>
          <TextInput
            style={[styles.input, { height: 60 }]}
            placeholder="e.g. Motul 7100 oil, oil filter, brake pads"
            placeholderTextColor={Colors.textMuted}
            value={workPerformed}
            onChangeText={setWorkPerformed}
            multiline
          />
        </View>

        {/* Account to debit */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Paid From Account</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                activeOpacity={0.75}
                onPress={() => setSelectedAccountId(acc.id)}
                style={[
                  styles.chip,
                  selectedAccountId === acc.id && styles.activeChip,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedAccountId === acc.id && styles.activeChipText,
                  ]}
                >
                  {acc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Service Centre / Mechanic (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Authorised Service Center, Local Garage"
            placeholderTextColor={Colors.textMuted}
            value={serviceCentre}
            onChangeText={setServiceCentre}
          />
        </View>

        <GlassButton title="Record Service" onPress={handleSubmit} style={{ marginTop: 10 }} />
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 13,
  },
  inputGroup: {
    gap: 5,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  input: {
    height: 44,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: Colors.white,
    fontSize: 14,
  },
  chipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  activeChip: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  chipText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  activeChipText: {
    color: Colors.black,
    fontWeight: '700',
  },
});
