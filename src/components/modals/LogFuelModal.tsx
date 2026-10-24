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
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { ModalWrapper } from '../ModalWrapper';
import { GlassButton } from '../GlassButton';
import { useApp } from '../../context/AppContext';
import { logFuel, getVehicleById } from '../../db/queries/vehicles';
import { FuelType } from '../../types/database';

interface LogFuelModalProps {
  visible: boolean;
  onClose: () => void;
  vehicleId: string;
  onLogged: () => void;
}

export const LogFuelModal: React.FC<LogFuelModalProps> = ({
  visible,
  onClose,
  vehicleId,
  onLogged,
}) => {
  const { accounts, refreshData } = useApp();
  const [litres, setLitres] = useState('');
  const [pricePerLitre, setPricePerLitre] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [odometer, setOdometer] = useState('');
  const [fuelStation, setFuelStation] = useState('');
  const [isFullTank, setIsFullTank] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>('Petrol');

  useEffect(() => {
    if (visible && vehicleId) {
      const v = getVehicleById(vehicleId);
      if (v) {
        setOdometer(v.current_odometer > 0 ? v.current_odometer.toString() : '');
        setFuelType(v.fuel_type);
      }
      setLitres('');
      setPricePerLitre('');
      setTotalCost('');
      setFuelStation('');
      setIsFullTank(true);
      if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }, [visible, vehicleId]);

  // Two-way cost / quantity synchronization
  const handleLitresChange = (val: string) => {
    setLitres(val);
    const l = parseFloat(val);
    const p = parseFloat(pricePerLitre);
    if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) {
      setTotalCost((Math.round(l * p * 100) / 100).toString());
    }
  };

  const handlePriceChange = (val: string) => {
    setPricePerLitre(val);
    const l = parseFloat(litres);
    const p = parseFloat(val);
    if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) {
      setTotalCost((Math.round(l * p * 100) / 100).toString());
    }
  };

  const handleTotalCostChange = (val: string) => {
    setTotalCost(val);
    const tot = parseFloat(val);
    const l = parseFloat(litres);
    if (!isNaN(tot) && !isNaN(l) && tot > 0 && l > 0) {
      setPricePerLitre((Math.round((tot / l) * 100) / 100).toString());
    }
  };

  const handleSubmit = () => {
    const l = parseFloat(litres);
    const tot = parseFloat(totalCost);
    const odo = parseFloat(odometer);

    if (isNaN(l) || l <= 0) {
      Alert.alert('Required', 'Please enter fuel quantity in litres.');
      return;
    }
    if (isNaN(tot) || tot <= 0) {
      Alert.alert('Required', 'Please enter total cost or price per litre.');
      return;
    }
    if (isNaN(odo) || odo <= 0) {
      Alert.alert('Required', 'Please enter current odometer reading.');
      return;
    }

    try {
      logFuel({
        vehicle_id: vehicleId,
        fuel_type: fuelType,
        quantity_litres: l,
        total_cost: tot,
        price_per_litre: parseFloat(pricePerLitre) || undefined,
        odometer: odo,
        is_full_tank: isFullTank,
        fuel_station: fuelStation.trim() || undefined,
        account_id: selectedAccountId || undefined,
      });

      refreshData();
      onLogged();
      Alert.alert('Fuel Logged', 'Refill details and mileage updated.');
      onClose();
    } catch (e: any) {
      Alert.alert('Log Fuel Error', e.message || 'Could not record fuel log.');
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Log Petrol / Fuel"
      subtitle="Record refuel, odometer & compute mileage"
    >
      <View style={styles.form}>
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Quantity (Litres)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5.5"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={litres}
              onChangeText={handleLitresChange}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Price / Litre (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 96.50"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={pricePerLitre}
              onChangeText={handlePriceChange}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total Fuel Cost (₹)</Text>
          <TextInput
            style={[styles.input, styles.amountInput]}
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            value={totalCost}
            onChangeText={handleTotalCostChange}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Odometer Reading at Refill (km)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 12450"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={odometer}
            onChangeText={setOdometer}
          />
        </View>

        {/* Full Tank Toggle */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsFullTank(!isFullTank)}
          style={styles.toggleRow}
        >
          <Feather
            name={isFullTank ? 'check-square' : 'square'}
            size={18}
            color={isFullTank ? Colors.white : Colors.textMuted}
          />
          <Text style={styles.toggleText}>Filled to Full Tank (enables exact mileage calculation)</Text>
        </TouchableOpacity>

        {/* Account to debit */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Paid Out Of Account</Text>
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
          <Text style={styles.label}>Fuel Pump / Station (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. IndianOil, HPCL, Shell"
            placeholderTextColor={Colors.textMuted}
            value={fuelStation}
            onChangeText={setFuelStation}
          />
        </View>

        <GlassButton title="Record Refuel" onPress={handleSubmit} style={{ marginTop: 10 }} />
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
  amountInput: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  toggleText: {
    fontSize: 12,
    color: Colors.textPrimary,
    flex: 1,
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
