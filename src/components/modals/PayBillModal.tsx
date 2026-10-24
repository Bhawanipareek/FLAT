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
import { markBillAsPaid } from '../../db/queries/bills';
import { Bill } from '../../types/database';
import { formatINR } from '../../utils/currency';

interface PayBillModalProps {
  visible: boolean;
  onClose: () => void;
  bill: Bill | null;
  onPaid: () => void;
}

export const PayBillModal: React.FC<PayBillModalProps> = ({
  visible,
  onClose,
  bill,
  onPaid,
}) => {
  const { accounts, refreshData } = useApp();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
      setNotes('');
    }
  }, [visible, accounts]);

  if (!bill) return null;

  const handleSubmit = () => {
    if (!selectedAccountId) {
      Alert.alert('Account Required', 'Please select the bank or cash account used to pay.');
      return;
    }

    try {
      markBillAsPaid({
        billId: bill.id,
        accountId: selectedAccountId,
        notes: notes.trim() || undefined,
      });

      refreshData();
      onPaid();
      Alert.alert('Bill Paid', `${bill.name} marked as paid. Amount debited from your account.`);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not record bill payment.');
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Mark Bill as Paid"
      subtitle={`Debit ${formatINR(bill.amount)} from your account`}
    >
      <View style={styles.form}>
        <View style={styles.summaryCard}>
          <Text style={styles.billTitle}>{bill.name}</Text>
          <Text style={styles.billSub}>{bill.category} • Due: {bill.due_date}</Text>
          <Text style={styles.billAmt}>{formatINR(bill.amount)}</Text>
        </View>

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
          <Text style={styles.label}>Transaction Reference / Notes (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. UPI Ref, NEFT UTR, Cash handed to owner"
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <GlassButton title="Confirm Payment" onPress={handleSubmit} style={{ marginTop: 12 }} />
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  billTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  billSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  billAmt: {
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
