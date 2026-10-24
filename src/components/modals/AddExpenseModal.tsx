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
import { createExpense, getCategories } from '../../db/queries/transactions';
import { Category } from '../../types/database';
import { getTodayDateString } from '../../utils/date';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  presetTitle?: string;
  presetCategoryId?: string;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  presetTitle,
  presetCategoryId,
}) => {
  const { accounts, refreshData } = useApp();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [isLargePurchase, setIsLargePurchase] = useState(false);
  const [warrantyMonths, setWarrantyMonths] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (visible) {
      setTitle(presetTitle || '');
      setAmount('');
      setNotes('');
      setIsLargePurchase(false);
      setWarrantyMonths('');
      const cats = getCategories('expense');
      setCategories(cats);
      setSelectedCategoryId(presetCategoryId || (cats.length > 0 ? cats[0].id : ''));
      if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }, [visible, presetTitle, presetCategoryId]);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter an expense title.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount.');
      return;
    }
    if (!selectedAccountId) {
      Alert.alert('Account Required', 'Please select a payment account.');
      return;
    }

    let finalNotes = notes.trim();
    if (isLargePurchase && warrantyMonths) {
      finalNotes += ` [Large Purchase | Warranty: ${warrantyMonths} Months]`;
    }

    try {
      createExpense({
        title: title.trim(),
        amount: numAmount,
        accountId: selectedAccountId,
        categoryId: selectedCategoryId || undefined,
        notes: finalNotes || undefined,
      });

      refreshData();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not record expense');
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Add Expense"
      subtitle="Record spending & deduct account balance"
    >
      <View style={styles.form}>
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Expense Title / Item</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Chai & Samosa, Groceries, Dinner"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Amount */}
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

        {/* Account Selector */}
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

        {/* Category Selector */}
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

        {/* Large purchase toggle */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsLargePurchase(!isLargePurchase)}
          style={styles.toggleRow}
        >
          <Feather
            name={isLargePurchase ? 'check-square' : 'square'}
            size={18}
            color={isLargePurchase ? Colors.white : Colors.textMuted}
          />
          <Text style={styles.toggleText}>This is a major item (Phone, Laptop, Appliance)</Text>
        </TouchableOpacity>

        {isLargePurchase && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Warranty Period (Months)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 12"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={warrantyMonths}
              onChangeText={setWarrantyMonths}
            />
          </View>
        )}

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Add bill reference or extra details"
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <GlassButton title="Record Expense" onPress={handleSubmit} style={{ marginTop: 12 }} />
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
    color: Colors.white,
  },
  notesInput: {
    height: 70,
    paddingTop: 10,
    textAlignVertical: 'top',
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: 12.5,
    color: Colors.textPrimary,
  },
});
