import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { ModalWrapper } from '../ModalWrapper';
import { GlassButton } from '../GlassButton';
import { useApp } from '../../context/AppContext';
import { createAccount } from '../../db/queries/accounts';
import { AccountType } from '../../types/database';

interface AddAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onAccountCreated: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  visible,
  onClose,
  onAccountCreated,
}) => {
  const { refreshData } = useApp();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('savings');
  const [openingBalance, setOpeningBalance] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [description, setDescription] = useState('');

  const accountTypes: { label: string; value: AccountType }[] = [
    { label: 'Savings', value: 'savings' },
    { label: 'Current', value: 'current' },
    { label: 'Cash Wallet', value: 'cash' },
    { label: 'Other', value: 'other' },
  ];

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter an account name (e.g. HDFC Salary, SBI Savings).');
      return;
    }
    const balance = parseFloat(openingBalance) || 0;

    try {
      createAccount({
        name: name.trim(),
        type,
        opening_balance: balance,
        last_four_digits: lastFour.trim() || undefined,
        description: description.trim() || undefined,
      });

      refreshData();
      onAccountCreated();
      Alert.alert('Account Created', `${name} is ready for transactions.`);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not create account');
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Add Account"
      subtitle="Track cash or liquid bank accounts"
    >
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Account Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. ICICI Salary, Emergency Cash"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Account Type</Text>
          <View style={styles.chipsRow}>
            {accountTypes.map((t) => (
              <TouchableOpacity
                key={t.value}
                activeOpacity={0.75}
                onPress={() => setType(t.value)}
                style={[styles.chip, type === t.value && styles.activeChip]}
              >
                <Text style={[styles.chipText, type === t.value && styles.activeChipText]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Opening Balance (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={openingBalance}
              onChangeText={setOpeningBalance}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Last 4 Digits</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5432"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              maxLength={4}
              value={lastFour}
              onChangeText={setLastFour}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description / Purpose (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Daily spending, primary salary account"
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <GlassButton title="Create Account" onPress={handleSubmit} style={{ marginTop: 10 }} />
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
