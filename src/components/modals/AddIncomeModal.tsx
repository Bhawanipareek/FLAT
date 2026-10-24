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
import { createIncome, getCategories } from '../../db/queries/transactions';
import { Category } from '../../types/database';

interface AddIncomeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({ visible, onClose }) => {
  const { accounts, refreshData } = useApp();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setAmount('');
      setNotes('');
      const cats = getCategories('income');
      setCategories(cats);
      setSelectedCategoryId(cats.length > 0 ? cats[0].id : '');
      if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }, [visible]);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter an income source/title.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!selectedAccountId) {
      Alert.alert('Account Required', 'Please select a receiving account.');
      return;
    }

    try {
      createIncome({
        title: title.trim(),
        amount: numAmount,
        accountId: selectedAccountId,
        categoryId: selectedCategoryId || undefined,
        notes: notes.trim() || undefined,
      });

      refreshData();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not record income');
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Add Income"
      subtitle="Deposit earnings into cash or bank"
    >
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Income Source / Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Monthly Salary, Freelance project, Cashback"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount Received (₹)</Text>
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
          <Text style={styles.label}>Deposit Into Account</Text>
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
                <Feather
                  name={acc.type === 'cash' ? 'pocket' : 'credit-card'}
                  size={13}
                  color={selectedAccountId === acc.id ? Colors.black : Colors.white}
                />
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
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.75}
                onPress={() => setSelectedCategoryId(c.id)}
                style={[
                  styles.chip,
                  selectedCategoryId === c.id && styles.activeChip,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedCategoryId === c.id && styles.activeChipText,
                  ]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, { height: 60 }]}
            placeholder="Client name or deposit details"
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <GlassButton title="Deposit Income" onPress={handleSubmit} style={{ marginTop: 12 }} />
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
    fontSize: 20,
    fontWeight: '700',
    color: Colors.success,
  },
  chipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
