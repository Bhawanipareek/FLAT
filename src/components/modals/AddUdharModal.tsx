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
import { createUdharRecord } from '../../db/queries/udhar';
import { UdharDirection } from '../../types/database';
import { getTodayDateString } from '../../utils/date';

interface AddUdharModalProps {
  visible: boolean;
  onClose: () => void;
  presetDirection: UdharDirection;
}

export const AddUdharModal: React.FC<AddUdharModalProps> = ({
  visible,
  onClose,
  presetDirection,
}) => {
  const { accounts, refreshData } = useApp();
  const [direction, setDirection] = useState<UdharDirection>(presetDirection);
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    if (visible) {
      setDirection(presetDirection);
      setPersonName('');
      setPhone('');
      setAmount('');
      setDueDate('');
      setPurpose('');
      setNotes('');
      if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }, [visible, presetDirection]);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!personName.trim()) {
      Alert.alert('Required', 'Please enter person/lender name.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    try {
      createUdharRecord({
        direction,
        person_name: personName.trim(),
        phone: phone.trim() || undefined,
        amount: numAmount,
        due_date: dueDate.trim() || undefined,
        purpose: purpose.trim() || undefined,
        notes: notes.trim() || undefined,
        account_id: selectedAccountId || undefined,
      });

      refreshData();
      Alert.alert('Udhar Saved', `Record created successfully for ${personName}.`);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save udhar record.');
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title={direction === 'GAVE' ? 'Record Money Given' : 'Record Money Borrowed'}
      subtitle={
        direction === 'GAVE'
          ? 'Track money lent to receive back later'
          : 'Track money you borrowed to repay later'
      }
    >
      <View style={styles.form}>
        {/* Direction Switcher */}
        <View style={styles.directionToggle}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setDirection('GAVE')}
            style={[styles.toggleBtn, direction === 'GAVE' && styles.activeToggleBtn]}
          >
            <Text style={[styles.toggleBtnText, direction === 'GAVE' && styles.activeToggleText]}>
              I Gave (To Receive)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setDirection('BORROWED')}
            style={[styles.toggleBtn, direction === 'BORROWED' && styles.activeToggleBtn]}
          >
            <Text style={[styles.toggleBtnText, direction === 'BORROWED' && styles.activeToggleText]}>
              I Borrowed (To Pay)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Person's Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {direction === 'GAVE' ? "Borrower / Person's Name" : "Lender / Lender's Name"}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rahul Sharma, Amit, Roommate"
            placeholderTextColor={Colors.textMuted}
            value={personName}
            onChangeText={setPersonName}
          />
        </View>

        {/* Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Principal Amount (₹)</Text>
          <TextInput
            style={[styles.input, styles.amountInput]}
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Promised Due Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Promised Repayment Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2026-11-15"
            placeholderTextColor={Colors.textMuted}
            value={dueDate}
            onChangeText={setDueDate}
          />
        </View>

        {/* Phone number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* Linked Account */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {direction === 'GAVE' ? 'Given From Account (Deduct)' : 'Received In Account (Add)'}
          </Text>
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

        {/* Purpose / Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Purpose / Reason (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Emergency, Trip split, Advance"
            placeholderTextColor={Colors.textMuted}
            value={purpose}
            onChangeText={setPurpose}
          />
        </View>

        <GlassButton
          title={direction === 'GAVE' ? 'Record Money Given' : 'Record Money Borrowed'}
          onPress={handleSubmit}
          style={{ marginTop: 10 }}
        />
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 13,
  },
  directionToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 11,
  },
  activeToggleBtn: {
    backgroundColor: Colors.white,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeToggleText: {
    color: Colors.black,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 5,
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
