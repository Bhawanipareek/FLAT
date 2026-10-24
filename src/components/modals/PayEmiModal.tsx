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
import { recordEmiPayment } from '../../db/queries/emis';
import { EmiPlan } from '../../types/database';
import { formatINR } from '../../utils/currency';

interface PayEmiModalProps {
  visible: boolean;
  onClose: () => void;
  emi: EmiPlan | null;
  onPaid: () => void;
}

export const PayEmiModal: React.FC<PayEmiModalProps> = ({
  visible,
  onClose,
  emi,
  onPaid,
}) => {
  const { accounts, refreshData } = useApp();
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible && emi) {
      setAmount(emi.monthly_amount.toString());
      setNotes('');
      if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }, [visible, emi, accounts]);

  if (!emi) return null;

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Required', 'Please enter a valid instalment payment amount.');
      return;
    }
    if (!selectedAccountId) {
      Alert.alert('Required', 'Please select an account.');
      return;
    }

    try {
      recordEmiPayment({
        emiId: emi.id,
        amount: numAmount,
        accountId: selectedAccountId,
        notes: notes.trim() || undefined,
      });

      refreshData();
      onPaid();
      Alert.alert('EMI Paid', `Instalment recorded for ${emi.name}.`);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not record EMI payment.');
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Record EMI Payment"
      subtitle={`Instalment #${emi.paid_installments + 1} of ${emi.total_installments}`}
    >
      <View style={styles.form}>
        <View style={styles.summaryBox}>
          <Text style={styles.emiTitle}>{emi.name}</Text>
          <Text style={styles.emiSub}>{emi.lender ? `${emi.lender} • ` : ''}Due Day {emi.due_day}</Text>
          <Text style={styles.emiAmt}>{formatINR(emi.monthly_amount)}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Instalment Amount (₹)</Text>
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
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Auto-debit, ECS reference or receipt"
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <GlassButton title="Record Payment" onPress={handleSubmit} style={{ marginTop: 12 }} />
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
  summaryBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  emiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  emiSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emiAmt: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 8,
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
