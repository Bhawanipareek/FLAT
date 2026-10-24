import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/currency';
import { formatDisplayDate } from '../utils/date';
import {
  getTransactions,
  getCategories,
  deleteTransaction,
  getExpenseBreakdownByCategory,
} from '../db/queries/transactions';
import { Transaction, Category } from '../types/database';

interface ExpensesScreenProps {
  onOpenAddExpense: (presetTitle?: string, presetCategory?: string) => void;
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({ onOpenAddExpense }) => {
  const { currentMonth, refreshData, hideBalances } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ categoryName: string; total: number }[]>([]);

  // Daily Quick Presets (minimal taps!)
  const quickPresets = [
    { label: 'Chai / Tea', amount: 20, icon: 'coffee', categoryId: 'cat_food' },
    { label: 'Snacks', amount: 50, icon: 'coffee', categoryId: 'cat_food' },
    { label: 'Milk Packet', amount: 66, icon: 'shopping-cart', categoryId: 'cat_milk' },
    { label: 'Auto / Cab', amount: 80, icon: 'navigation', categoryId: 'cat_transport' },
    { label: 'Groceries', amount: 350, icon: 'package', categoryId: 'cat_groceries' },
    { label: 'Parking', amount: 30, icon: 'navigation', categoryId: 'cat_transport' },
  ];

  const loadExpenseData = () => {
    try {
      const cats = getCategories('expense');
      setCategories(cats);

      const txs = getTransactions({
        type: 'expense',
        search: searchQuery || undefined,
        categoryId: selectedCategory || undefined,
      });
      setTransactions(txs);

      const breakdown = getExpenseBreakdownByCategory(currentMonth.start, currentMonth.end);
      setCategoryBreakdown(breakdown);
    } catch (e) {
      console.error('Error loading expenses:', e);
    }
  };

  useEffect(() => {
    loadExpenseData();
  }, [searchQuery, selectedCategory, currentMonth]);

  const handleDelete = (tx: Transaction) => {
    Alert.alert(
      'Delete Expense',
      `Delete "${tx.title}" of ${formatINR(tx.amount)}? The amount will be refunded to your ${tx.account_name || 'account'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTransaction(tx.id);
            refreshData();
            loadExpenseData();
          },
        },
      ]
    );
  };

  const totalSpent = transactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.pageTitle}>Expenses</Text>
            <Text style={styles.pageSubtitle}>Personal Spending & Cash Flow</Text>
          </View>
          <GlassButton
            title="+ Add"
            onPress={() => onOpenAddExpense()}
            style={styles.headerAddBtn}
          />
        </View>

        {/* Quick 1-Tap Presets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1-Tap Daily Presets</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetScroll}
          >
            {quickPresets.map((preset, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.75}
                onPress={() => onOpenAddExpense(preset.label, preset.categoryId)}
                style={styles.presetChip}
              >
                <Feather name={preset.icon as any} size={13} color={Colors.white} />
                <Text style={styles.presetLabel}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Total Expense Hero Card */}
        <View style={styles.section}>
          <GlassCard style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <Text style={styles.heroLabel}>Total Filtered Spending</Text>
              <Text style={styles.heroCount}>{transactions.length} items</Text>
            </View>
            <Text style={styles.heroAmount}>
              {hideBalances ? '••••••••' : formatINR(totalSpent)}
            </Text>
          </GlassCard>
        </View>

        {/* Category Breakdown Bar */}
        {categoryBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            <GlassCard style={styles.breakdownCard}>
              {categoryBreakdown.slice(0, 5).map((item, idx) => {
                const maxVal = categoryBreakdown[0].total || 1;
                const pct = Math.min(100, Math.round((item.total / maxVal) * 100));
                return (
                  <View key={idx} style={styles.breakdownRow}>
                    <View style={styles.breakdownHeader}>
                      <Text style={styles.breakdownName}>{item.categoryName}</Text>
                      <Text style={styles.breakdownTotal}>{formatINR(item.total)}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                );
              })}
            </GlassCard>
          </View>
        )}

        {/* Search & Category Filter */}
        <View style={styles.section}>
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title or notes..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedCategory(null)}
              style={[
                styles.filterPill,
                selectedCategory === null && styles.activeFilterPill,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedCategory === null && styles.activeFilterPillText,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.7}
                onPress={() =>
                  setSelectedCategory(selectedCategory === c.id ? null : c.id)
                }
                style={[
                  styles.filterPill,
                  selectedCategory === c.id && styles.activeFilterPill,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedCategory === c.id && styles.activeFilterPillText,
                  ]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Expense History List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense History</Text>

          {transactions.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Feather name="inbox" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No matching expenses found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or add a new expense</Text>
            </GlassCard>
          ) : (
            <GlassCard style={styles.listCard}>
              {transactions.map((tx, idx) => (
                <View
                  key={tx.id}
                  style={[
                    styles.itemRow,
                    idx !== transactions.length - 1 && styles.itemRowBorder,
                  ]}
                >
                  <View style={styles.itemLeft}>
                    <View style={styles.itemIconCircle}>
                      <Feather name="arrow-up-right" size={16} color={Colors.danger} />
                    </View>
                    <View>
                      <Text style={styles.itemTitle}>{tx.title}</Text>
                      <Text style={styles.itemSubtitle}>
                        {formatDisplayDate(tx.date)} • {tx.category_name || 'General'} • {tx.account_name}
                      </Text>
                      {tx.notes ? <Text style={styles.itemNotes}>{tx.notes}</Text> : null}
                    </View>
                  </View>

                  <View style={styles.itemRight}>
                    <Text style={styles.itemAmount}>
                      -{hideBalances ? '••••' : formatINR(tx.amount)}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleDelete(tx)}
                      style={styles.deleteBtn}
                    >
                      <Feather name="trash-2" size={13} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </GlassCard>
          )}
        </View>

        {/* Safe bottom spacing */}
        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 12,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  pageSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerAddBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  presetScroll: {
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  presetLabel: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  heroCard: {
    padding: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  heroCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  breakdownCard: {
    padding: 16,
    gap: 12,
  },
  breakdownRow: {
    gap: 6,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownName: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  breakdownTotal: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  barTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  activeFilterPill: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  filterPillText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeFilterPillText: {
    color: Colors.black,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  listCard: {
    paddingHorizontal: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    maxWidth: 180,
  },
  itemSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemNotes: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger,
  },
  deleteBtn: {
    padding: 6,
  },
});
