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
import { transferMoney } from '../../db/queries/accounts';

interface TransferModalProps {
  visible: boolean;
  onClose: () => void;
  presetFromAccountId?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  visible,
  onClose,
  presetFromAccountId,
}) => {
  const { accounts, refreshData } = useApp();
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible && accounts.length >= 2) {
      const from = presetFromAccountId || accounts[0].id;
      setFromAccountId(from);
      const to = accounts.find((a) => a.id !== from)?.id || accounts[1].id;
      setToAccountId(to);
      setAmount('');
      setNotes('');
    }
  }, [visible, presetFromAccountId, accounts]);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid transfer amount.');
      return;
    }
    if (fromAccountId === toAccountId) {
      Alert.alert('Invalid Accounts', 'Source and destination accounts must be different.');
      return;
    }

    try {
      transferMoney(fromAccountId, toAccountId, numAmount, undefined, notes.trim() || undefined);
      refreshData();
      Alert.alert('Transfer Complete', 'Funds moved successfully.');
      onClose();
    } catch (e: any) {
      Alert.alert('Transfer Error', e.message || 'Could not execute transfer.');
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Transfer Money"
      subtitle="Bank-to-cash, cash-to-bank or bank-to-bank"
    >
      <View style={styles.form}>
        {/* Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Transfer Amount (₹)</Text>
          <TextInput
            style={[styles.input, styles.amountInput]}
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* From Account */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Transfer From (Source)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                activeOpacity={0.75}
                onPress={() => setFromAccountId(acc.id)}
                style={[
                  styles.chip,
                  fromAccountId === acc.id && styles.activeChip,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    fromAccountId === acc.id && styles.activeChipText,
                  ]}
                >
                  {acc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Transfer Indicator */}
        <View style={styles.arrowRow}>
          <Feather name="arrow-down" size={20} color={Colors.white} />
        </View>

        {/* To Account */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Transfer To (Destination)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                activeOpacity={0.75}
                onPress={() => setToAccountId(acc.id)}
                style={[
                  styles.chip,
                  toAccountId === acc.id && styles.activeChip,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    toAccountId === acc.id && styles.activeChipText,
                  ]}
                >
                  {acc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. ATM cash withdrawal, self transfer"
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <GlassButton title="Confirm Transfer" onPress={handleSubmit} style={{ marginTop: 12 }} />
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  input: {
    height: 46,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: Colors.white,
    fontSize: 14,
  },
  amountInput: {
    fontSize: 22,
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
  arrowRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
});
