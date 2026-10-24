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
import { recordUdharRepayment } from '../../db/queries/udhar';
import { UdharRecord } from '../../types/database';
import { formatINR } from '../../utils/currency';

interface RepayUdharModalProps {
  visible: boolean;
  onClose: () => void;
  record: UdharRecord | null;
}

export const RepayUdharModal: React.FC<RepayUdharModalProps> = ({
  visible,
  onClose,
  record,
}) => {
  const { accounts, refreshData } = useApp();
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible && record) {
      setAmount(record.outstanding_amount.toString());
      setNotes('');
      if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }, [visible, record]);

  if (!record) return null;

  const isReceive = record.direction === 'GAVE';

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid repayment amount.');
      return;
    }
    if (!selectedAccountId) {
      Alert.alert('Account Required', 'Please select a cash or bank account.');
      return;
    }

    try {
      recordUdharRepayment({
        udharId: record.id,
        amount: numAmount,
        accountId: selectedAccountId,
        notes: notes.trim() || undefined,
      });

      refreshData();
      Alert.alert('Repayment Recorded', `Logged ${formatINR(numAmount)} towards ${record.person_name}.`);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not record repayment.');
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title={isReceive ? 'Receive Repayment' : 'Repay Borrowed Money'}
      subtitle={`Outstanding balance: ${formatINR(record.outstanding_amount)}`}
    >
      <View style={styles.form}>
        <View style={styles.personHeader}>
          <Text style={styles.personLabel}>Counterparty</Text>
          <Text style={styles.personVal}>{record.person_name}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Repayment Amount (₹)</Text>
          <TextInput
            style={[styles.input, styles.amountInput]}
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {isReceive ? 'Deposit Repayment Into Account' : 'Pay Out Of Account'}
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Partial payment, GPay, cash received"
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <GlassButton
          title={isReceive ? 'Record Payment Received' : 'Record Repayment Paid'}
          onPress={handleSubmit}
          style={{ marginTop: 12 }}
        />
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSecondary,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  personLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  personVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
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
});
