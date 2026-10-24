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
import { createEmiPlan } from '../../db/queries/emis';
import { calculateMonthlyEmi } from '../../utils/financial';
import { formatINR } from '../../utils/currency';

interface AddEmiModalProps {
  visible: boolean;
  onClose: () => void;
  onEmiCreated: () => void;
}

export const AddEmiModal: React.FC<AddEmiModalProps> = ({
  visible,
  onClose,
  onEmiCreated,
}) => {
  const [name, setName] = useState('');
  const [lender, setLender] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [totalMonths, setTotalMonths] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');

  // Auto calculate EMI if principal, rate and months entered
  const handleAutoComputeEmi = () => {
    const p = parseFloat(principal);
    const r = parseFloat(interestRate) || 0;
    const n = parseInt(totalMonths, 10);
    if (!isNaN(p) && p > 0 && !isNaN(n) && n > 0) {
      const computed = calculateMonthlyEmi(p, r, n);
      setMonthlyAmount(computed.toString());
    }
  };

  const handleSubmit = () => {
    const mAmount = parseFloat(monthlyAmount);
    const nMonths = parseInt(totalMonths, 10);
    const dDay = parseInt(dueDay, 10) || 1;

    if (!name.trim()) {
      Alert.alert('Required', 'Please enter EMI plan name (e.g. iPhone EMI, Car Loan).');
      return;
    }
    if (isNaN(mAmount) || mAmount <= 0) {
      Alert.alert('Required', 'Please enter monthly instalment amount.');
      return;
    }
    if (isNaN(nMonths) || nMonths <= 0) {
      Alert.alert('Required', 'Please enter total number of instalments/months.');
      return;
    }

    try {
      createEmiPlan({
        name: name.trim(),
        monthly_amount: mAmount,
        total_installments: nMonths,
        due_day: dDay,
        lender: lender.trim() || undefined,
        principal_amount: parseFloat(principal) || undefined,
        interest_rate: parseFloat(interestRate) || undefined,
      });

      onEmiCreated();
      Alert.alert('EMI Plan Saved', `${name} plan created.`);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not create EMI plan.');
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Add EMI Plan"
      subtitle="Track monthly loans & instalments"
    >
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>EMI Name / Item</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. MacBook Air M2, Home Loan, Bike EMI"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Bank / Lender</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. HDFC, Bajaj Finserv"
              placeholderTextColor={Colors.textMuted}
              value={lender}
              onChangeText={setLender}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Due Day of Month</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={dueDay}
              onChangeText={setDueDay}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Principal Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="Total loan amount"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={principal}
              onChangeText={setPrincipal}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Interest Rate (% p.a.)</Text>
            <TextInput
              style={styles.input}
              placeholder="0% if No Cost"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={interestRate}
              onChangeText={setInterestRate}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Total Instalments (Mo)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 6, 12, 24"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={totalMonths}
              onChangeText={setTotalMonths}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Monthly EMI (₹)</Text>
            <TextInput
              style={[styles.input, { fontWeight: '700' }]}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={monthlyAmount}
              onChangeText={setMonthlyAmount}
            />
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.75} onPress={handleAutoComputeEmi} style={styles.calcHelperBtn}>
          <Text style={styles.calcHelperText}>⚡ Auto-calculate monthly EMI from principal & interest</Text>
        </TouchableOpacity>

        <GlassButton title="Save EMI Plan" onPress={handleSubmit} style={{ marginTop: 10 }} />
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
  calcHelperBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  calcHelperText: {
    fontSize: 11.5,
    color: Colors.info,
    fontWeight: '500',
  },
});
