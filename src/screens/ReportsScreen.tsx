import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { formatINR } from '../utils/currency';
import { useApp } from '../context/AppContext';
import { getMonthlyFinancialTotals, getExpenseBreakdownByCategory } from '../db/queries/transactions';
import { getUdharTotals } from '../db/queries/udhar';
import { getTotalMonthlyVehicleSpending } from '../db/queries/vehicles';
import { getMonthlyPendingBillsTotal } from '../db/queries/bills';

interface ReportsScreenProps {
  onBack: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ onBack }) => {
  const { currentMonth, totalBalance, cashBalance, bankBalance } = useApp();
  const [financialTotals, setFinancialTotals] = useState({ totalIncome: 0, totalExpense: 0, netCashFlow: 0 });
  const [categories, setCategories] = useState<{ categoryName: string; total: number }[]>([]);
  const [udharTotals, setUdharTotals] = useState({ toReceive: 0, toPay: 0 });
  const [vehicleCost, setVehicleCost] = useState(0);
  const [pendingBills, setPendingBills] = useState(0);

  useEffect(() => {
    try {
      setFinancialTotals(getMonthlyFinancialTotals(currentMonth.start, currentMonth.end));
      setCategories(getExpenseBreakdownByCategory(currentMonth.start, currentMonth.end));
      setUdharTotals(getUdharTotals());
      setVehicleCost(getTotalMonthlyVehicleSpending());
      setPendingBills(getMonthlyPendingBillsTotal());
    } catch (e) {
      console.error('Error loading reports:', e);
    }
  }, [currentMonth]);

  const maxCat = categories.length > 0 ? categories[0].total : 1;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Nav */}
        <View style={styles.topNav}>
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={Colors.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Financial Reports</Text>
            <Text style={styles.pageSubtitle}>{currentMonth.label} Insights</Text>
          </View>
        </View>

        {/* Cash Flow Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Cash Flow</Text>
          <GlassCard style={styles.reportCard}>
            <View style={styles.flowRow}>
              <Text style={styles.flowLabel}>Total Income Received</Text>
              <Text style={[styles.flowVal, { color: Colors.success }]}>
                +{formatINR(financialTotals.totalIncome)}
              </Text>
            </View>
            <View style={styles.flowRow}>
              <Text style={styles.flowLabel}>Total Personal Expenses</Text>
              <Text style={[styles.flowVal, { color: Colors.danger }]}>
                -{formatINR(financialTotals.totalExpense)}
              </Text>
            </View>
            <View style={[styles.flowRow, styles.netRow]}>
              <Text style={styles.netLabel}>Net Cash Flow</Text>
              <Text
                style={[
                  styles.netVal,
                  { color: financialTotals.netCashFlow >= 0 ? Colors.success : Colors.danger },
                ]}
              >
                {financialTotals.netCashFlow >= 0 ? '+' : ''}
                {formatINR(financialTotals.netCashFlow)}
              </Text>
            </View>
          </GlassCard>
        </View>

        {/* Balance Sheet / Liquidity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liquid Balance & Debt Position</Text>
          <GlassCard style={styles.reportCard}>
            <View style={styles.flowRow}>
              <Text style={styles.flowLabel}>Cash in Pocket</Text>
              <Text style={styles.flowVal}>{formatINR(cashBalance)}</Text>
            </View>
            <View style={styles.flowRow}>
              <Text style={styles.flowLabel}>Bank Balances</Text>
              <Text style={styles.flowVal}>{formatINR(bankBalance)}</Text>
            </View>
            <View style={styles.flowRow}>
              <Text style={styles.flowLabel}>Money Owed To You (Udhar)</Text>
              <Text style={[styles.flowVal, { color: Colors.success }]}>
                +{formatINR(udharTotals.toReceive)}
              </Text>
            </View>
            <View style={styles.flowRow}>
              <Text style={styles.flowLabel}>Money You Owe (Udhar)</Text>
              <Text style={[styles.flowVal, { color: Colors.warning }]}>
                -{formatINR(udharTotals.toPay)}
              </Text>
            </View>
            <View style={[styles.flowRow, styles.netRow]}>
              <Text style={styles.netLabel}>Estimated Net Worth</Text>
              <Text style={[styles.netVal, { color: Colors.white }]}>
                {formatINR(totalBalance + udharTotals.toReceive - udharTotals.toPay)}
              </Text>
            </View>
          </GlassCard>
        </View>

        {/* Top Expense Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Spending Breakdown</Text>
          {categories.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>No spending recorded this month.</Text>
            </GlassCard>
          ) : (
            <GlassCard style={styles.reportCard}>
              {categories.map((c, i) => {
                const pct = Math.min(100, Math.round((c.total / maxCat) * 100));
                return (
                  <View key={i} style={styles.catItem}>
                    <View style={styles.catHeader}>
                      <Text style={styles.catName}>{c.categoryName}</Text>
                      <Text style={styles.catAmt}>{formatINR(c.total)}</Text>
                    </View>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                );
              })}
            </GlassCard>
          )}
        </View>

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
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  pageSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
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
  reportCard: {
    padding: 16,
  },
  flowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  flowLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  flowVal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.white,
  },
  netRow: {
    borderBottomWidth: 0,
    paddingTop: 14,
  },
  netLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  netVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  catItem: {
    marginBottom: 12,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  catName: {
    fontSize: 12.5,
    color: Colors.textPrimary,
  },
  catAmt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.white,
  },
  barBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 3,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
