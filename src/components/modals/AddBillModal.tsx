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
import { createBill } from '../../db/queries/bills';

interface AddBillModalProps {
  visible: boolean;
  onClose: () => void;
  onBillCreated: () => void;
}

export const AddBillModal: React.FC<AddBillModalProps> = ({
  visible,
  onClose,
  onBillCreated,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Flat Rent');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('');
  const [notes, setNotes] = useState('');

  const billCategories = [
    'Flat Rent',
    'Room Rent',
    'Hostel Fee',
    'Electricity',
    'Internet / Wi-Fi',
    'Water',
    'Gas / Cylinder',
    'Society Maintenance',
    'Cook / Maid',
    'Other Recurring',
  ];

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a bill name (e.g. October Rent, Electricity Bill).');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid bill amount.');
      return;
    }
    if (!dueDate.trim()) {
      Alert.alert('Required', 'Please enter due date in YYYY-MM-DD format.');
      return;
    }

    try {
      createBill({
        name: name.trim(),
        category,
        amount: numAmount,
        due_date: dueDate.trim(),
        billing_period: billingPeriod.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onBillCreated();
      Alert.alert('Bill Created', `${name} scheduled.`);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not schedule bill.');
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Add Rent or Bill"
      subtitle="Track monthly living costs & due dates"
    >
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bill Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. October Flat Rent, Broadband Wi-Fi"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {billCategories.map((c) => (
              <TouchableOpacity
                key={c}
                activeOpacity={0.75}
                onPress={() => setCategory(c)}
                style={[styles.chip, category === c && styles.activeChip]}
              >
                <Text style={[styles.chipText, category === c && styles.activeChipText]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={[styles.input, styles.amountInput]}
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2026-10-31"
              placeholderTextColor={Colors.textMuted}
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Billing Period</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Oct 2026"
              placeholderTextColor={Colors.textMuted}
              value={billingPeriod}
              onChangeText={setBillingPeriod}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Account number, consumer ID or landlord details"
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <GlassButton title="Schedule Bill" onPress={handleSubmit} style={{ marginTop: 10 }} />
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
