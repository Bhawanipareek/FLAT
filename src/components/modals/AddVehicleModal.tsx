import React, { useState } from 'react';
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
import { createVehicle } from '../../db/queries/vehicles';
import { VehicleType, FuelType } from '../../types/database';

interface AddVehicleModalProps {
  visible: boolean;
  onClose: () => void;
  onVehicleCreated: () => void;
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  visible,
  onClose,
  onVehicleCreated,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<VehicleType>('Bike');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [initialOdometer, setInitialOdometer] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>('Petrol');

  const vehicleTypes: VehicleType[] = ['Bike', 'Scooter', 'Car', 'Other'];
  const fuelTypes: FuelType[] = ['Petrol', 'Diesel', 'CNG', 'Electric'];

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a vehicle name (e.g. Royal Enfield, Activa).');
      return;
    }
    const odo = parseFloat(initialOdometer) || 0;

    try {
      createVehicle({
        name: name.trim(),
        type,
        manufacturer: manufacturer.trim() || undefined,
        model: model.trim() || undefined,
        reg_number: regNumber.trim() || undefined,
        fuel_type: fuelType,
        initial_odometer: odo,
      });

      onVehicleCreated();
      Alert.alert('Vehicle Added', `${name} is ready for tracking.`);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add vehicle');
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Add Vehicle"
      subtitle="Track petrol, mileage & service schedule"
    >
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vehicle Nickname / Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. My Hunter 350, Daily Activa"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Type Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vehicle Type</Text>
          <View style={styles.chipsRow}>
            {vehicleTypes.map((t) => (
              <TouchableOpacity
                key={t}
                activeOpacity={0.75}
                onPress={() => setType(t)}
                style={[styles.chip, type === t && styles.activeChip]}
              >
                <Text style={[styles.chipText, type === t && styles.activeChipText]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fuel Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fuel Type</Text>
          <View style={styles.chipsRow}>
            {fuelTypes.map((f) => (
              <TouchableOpacity
                key={f}
                activeOpacity={0.75}
                onPress={() => setFuelType(f)}
                style={[styles.chip, fuelType === f && styles.activeChip]}
              >
                <Text style={[styles.chipText, fuelType === f && styles.activeChipText]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Manufacturer</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Honda, Royal Enfield"
              placeholderTextColor={Colors.textMuted}
              value={manufacturer}
              onChangeText={setManufacturer}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Model</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 6G, Classic"
              placeholderTextColor={Colors.textMuted}
              value={model}
              onChangeText={setModel}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Registration Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. DL 01 AB 1234"
              placeholderTextColor={Colors.textMuted}
              value={regNumber}
              onChangeText={setRegNumber}
              autoCapitalize="characters"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Current Odometer (km)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={initialOdometer}
              onChangeText={setInitialOdometer}
            />
          </View>
        </View>

        <GlassButton title="Save Vehicle" onPress={handleSubmit} style={{ marginTop: 12 }} />
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
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
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
