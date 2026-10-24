import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface QuickActionsProps {
  onActionPress: (action: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionPress }) => {
  const actions = [
    { id: 'income', label: 'Add Income', icon: 'arrow-down-left', color: Colors.success },
    { id: 'expense', label: 'Add Expense', icon: 'arrow-up-right', color: Colors.danger },
    { id: 'transfer', label: 'Transfer', icon: 'repeat', color: Colors.info },
    { id: 'udhar', label: 'Add Udhar', icon: 'users', color: Colors.warning },
    { id: 'vehicle', label: 'Vehicle Cost', icon: 'navigation', color: '#A78BFA' },
    { id: 'bill', label: 'Pay Bill', icon: 'file-text', color: '#F472B6' },
    { id: 'emi', label: 'Add EMI', icon: 'percent', color: '#38BDF8' },
    { id: 'attendance', label: 'Attendance', icon: 'calendar', color: '#34D399' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {actions.map((act) => (
          <TouchableOpacity
            key={act.id}
            activeOpacity={0.75}
            onPress={() => onActionPress(act.id)}
            style={styles.actionCard}
          >
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
              <Feather name={act.icon as any} size={18} color={act.color} />
            </View>
            <Text style={styles.actionLabel}>{act.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginHorizontal: 20,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  actionCard: {
    width: 86,
    height: 86,
    backgroundColor: Colors.surfacePrimary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionLabel: {
    fontSize: 10.5,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
