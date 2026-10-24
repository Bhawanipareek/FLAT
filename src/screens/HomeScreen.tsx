import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { BalanceCard } from '../components/BalanceCard';
import { QuickActions } from '../components/QuickActions';
import { GlassCard } from '../components/GlassCard';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/currency';
import { formatDisplayDate } from '../utils/date';
import { getTransactions, getMonthlyFinancialTotals, deleteTransaction } from '../db/queries/transactions';
import { getUdharTotals } from '../db/queries/udhar';
import { getUpcomingEmiTotal } from '../db/queries/emis';
import { getTotalMonthlyVehicleSpending } from '../db/queries/vehicles';
import { getMonthlyPendingBillsTotal } from '../db/queries/bills';
import { calculateMonthlySalaryStats } from '../db/queries/attendance';
import { Transaction } from '../types/database';

interface HomeScreenProps {
  onOpenQuickAction: (actionId: string) => void;
  onOpenProfile: () => void;
  onViewAllExpenses: () => void;
  onViewAllVehicles: () => void;
  onViewAllUdhar: () => void;
  onViewMore: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenQuickAction,
  onOpenProfile,
  onViewAllExpenses,
  onViewAllVehicles,
  onViewAllUdhar,
  onViewMore,
}) => {
  const { currentMonth, refreshData, hideBalances } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [netCashFlow, setNetCashFlow] = useState(0);
  const [moneyToReceive, setMoneyToReceive] = useState(0);
  const [moneyToPay, setMoneyToPay] = useState(0);
  const [upcomingEmi, setUpcomingEmi] = useState(0);
  const [vehicleSpending, setVehicleSpending] = useState(0);
  const [pendingBills, setPendingBills] = useState(0);
  const [salaryEarned, setSalaryEarned] = useState(0);

  const loadDashboardData = () => {
    try {
      const txs = getTransactions({ limit: 6 });
      setRecentTransactions(txs);

      const totals = getMonthlyFinancialTotals(currentMonth.start, currentMonth.end);
      setMonthlyIncome(totals.totalIncome);
      setMonthlyExpense(totals.totalExpense);
      setNetCashFlow(totals.netCashFlow);

      const udharTotals = getUdharTotals();
      setMoneyToReceive(udharTotals.toReceive);
      setMoneyToPay(udharTotals.toPay);

      setUpcomingEmi(getUpcomingEmiTotal());
      setVehicleSpending(getTotalMonthlyVehicleSpending());
      setPendingBills(getMonthlyPendingBillsTotal());

      const salStats = calculateMonthlySalaryStats();
      setSalaryEarned(salStats.estimatedEarnedToDate);
    } catch (e) {
      console.error('Error loading dashboard:', e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentMonth]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshData();
    loadDashboardData();
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleDeleteTx = (tx: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${tx.title}" of ${formatINR(tx.amount)}? Account balance will be restored.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTransaction(tx.id);
            refreshData();
            loadDashboardData();
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />
      }
    >
      {/* Header */}
      <Header
        onQuickAddPress={() => onOpenQuickAction('expense')}
        onProfilePress={onOpenProfile}
      />

      {/* Balance Command Cards */}
      <BalanceCard
        onAddCashPress={() => onOpenQuickAction('income')}
        onAddBankPress={() => onOpenQuickAction('transfer')}
        onTransferPress={() => onOpenQuickAction('transfer')}
      />

      {/* Quick Action Pills */}
      <QuickActions onActionPress={onOpenQuickAction} />

      {/* Monthly Financial Health Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Monthly Overview</Text>
          <Text style={styles.sectionSubtitle}>{currentMonth.label}</Text>
        </View>

        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryGrid}>
            {/* Income */}
            <View style={styles.metricBox}>
              <View style={styles.metricIconRow}>
                <View style={[styles.tinyDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.metricLabel}>Income</Text>
              </View>
              <Text style={styles.metricValue}>
                {hideBalances ? '••••••' : formatINR(monthlyIncome)}
              </Text>
            </View>

            {/* Expenses */}
            <View style={styles.metricBox}>
              <View style={styles.metricIconRow}>
                <View style={[styles.tinyDot, { backgroundColor: Colors.danger }]} />
                <Text style={styles.metricLabel}>Personal Spent</Text>
              </View>
              <Text style={styles.metricValue}>
                {hideBalances ? '••••••' : formatINR(monthlyExpense)}
              </Text>
            </View>

            {/* Net Cash Flow */}
            <View style={styles.metricBox}>
              <View style={styles.metricIconRow}>
                <View
                  style={[
                    styles.tinyDot,
                    { backgroundColor: netCashFlow >= 0 ? Colors.success : Colors.danger },
                  ]}
                />
                <Text style={styles.metricLabel}>Net Cash Flow</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: netCashFlow >= 0 ? Colors.success : Colors.danger },
                ]}
              >
                {hideBalances ? '••••••' : formatINR(netCashFlow)}
              </Text>
            </View>

            {/* Salary Earned */}
            <View style={styles.metricBox}>
              <View style={styles.metricIconRow}>
                <View style={[styles.tinyDot, { backgroundColor: '#34D399' }]} />
                <Text style={styles.metricLabel}>Earned Salary</Text>
              </View>
              <Text style={styles.metricValue}>
                {hideBalances ? '••••••' : formatINR(salaryEarned)}
              </Text>
            </View>
          </View>

          {/* Secondary Life Metrics: Udhar, EMI, Vehicles, Bills */}
          <View style={styles.subMetricsRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onViewAllUdhar}
              style={styles.subMetricItem}
            >
              <Text style={styles.subMetricTitle}>To Receive</Text>
              <Text style={[styles.subMetricAmount, { color: Colors.success }]}>
                {hideBalances ? '••••' : formatINR(moneyToReceive)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onViewAllUdhar}
              style={styles.subMetricItem}
            >
              <Text style={styles.subMetricTitle}>To Pay</Text>
              <Text style={[styles.subMetricAmount, { color: Colors.warning }]}>
                {hideBalances ? '••••' : formatINR(moneyToPay)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onViewAllVehicles}
              style={styles.subMetricItem}
            >
              <Text style={styles.subMetricTitle}>Vehicle Exp</Text>
              <Text style={styles.subMetricAmount}>
                {hideBalances ? '••••' : formatINR(vehicleSpending)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onViewMore}
              style={styles.subMetricItem}
            >
              <Text style={styles.subMetricTitle}>Due Bills</Text>
              <Text style={[styles.subMetricAmount, { color: pendingBills > 0 ? Colors.danger : Colors.textPrimary }]}>
                {hideBalances ? '••••' : formatINR(pendingBills)}
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={onViewAllExpenses}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Feather name="file-text" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No transactions recorded yet</Text>
            <Text style={styles.emptySubtitle}>Use Quick Actions above to add your first expense or income</Text>
          </GlassCard>
        ) : (
          <GlassCard style={styles.txListCard}>
            {recentTransactions.map((tx, idx) => {
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer' || tx.type === 'cash_deposit' || tx.type === 'cash_withdrawal';

              return (
                <View
                  key={tx.id}
                  style={[
                    styles.txRow,
                    idx !== recentTransactions.length - 1 && styles.txRowBorder,
                  ]}
                >
                  <View style={styles.txLeft}>
                    <View
                      style={[
                        styles.txIconCircle,
                        isIncome && { backgroundColor: Colors.successSoft },
                        isTransfer && { backgroundColor: Colors.infoSoft },
                      ]}
                    >
                      <Feather
                        name={isIncome ? 'arrow-down-left' : isTransfer ? 'repeat' : 'arrow-up-right'}
                        size={16}
                        color={isIncome ? Colors.success : isTransfer ? Colors.info : Colors.danger}
                      />
                    </View>
                    <View>
                      <Text style={styles.txTitle} numberOfLines={1}>
                        {tx.title}
                      </Text>
                      <Text style={styles.txSub}>
                        {formatDisplayDate(tx.date)} • {tx.account_name || 'Account'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.txRight}>
                    <Text
                      style={[
                        styles.txAmount,
                        isIncome && { color: Colors.success },
                        isTransfer && { color: Colors.info },
                      ]}
                    >
                      {isIncome ? '+' : isTransfer ? '⇄ ' : '-'}
                      {hideBalances ? '••••' : formatINR(tx.amount)}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleDeleteTx(tx)}
                      style={styles.txDeleteBtn}
                    >
                      <Feather name="trash-2" size={13} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </GlassCard>
        )}
      </View>

      {/* Extra space at bottom to ensure no content is hidden behind floating navbar */}
      <View style={{ height: 110 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  seeAllText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  summaryCard: {
    padding: 18,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tinyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  subMetricItem: {
    alignItems: 'center',
  },
  subMetricTitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  subMetricAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  txListCard: {
    paddingHorizontal: 16,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  txRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    maxWidth: 160,
  },
  txSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  txRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  txDeleteBtn: {
    padding: 6,
  },
});
