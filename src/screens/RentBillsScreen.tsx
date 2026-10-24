import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { formatINR } from '../utils/currency';
import { formatDisplayDate } from '../utils/date';
import { getAllBills, markBillAsPaid, getMonthlyPendingBillsTotal } from '../db/queries/bills';
import { Bill } from '../types/database';
import { useApp } from '../context/AppContext';

interface RentBillsScreenProps {
  onBack: () => void;
  onOpenAddBill: () => void;
  onPayBill: (bill: Bill) => void;
}

export const RentBillsScreen: React.FC<RentBillsScreenProps> = ({
  onBack,
  onOpenAddBill,
  onPayBill,
}) => {
  const { refreshData } = useApp();
  const [bills, setBills] = useState<Bill[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);

  const loadBillsData = () => {
    try {
      setBills(getAllBills());
      setPendingTotal(getMonthlyPendingBillsTotal());
    } catch (e) {
      console.error('Error loading bills:', e);
    }
  };

  useEffect(() => {
    loadBillsData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Overdue':
        return Colors.danger;
      case 'Paid':
        return Colors.success;
      default:
        return Colors.warning;
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Nav Header */}
        <View style={styles.topNav}>
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={Colors.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Rent & Bills</Text>
            <Text style={styles.pageSubtitle}>Rent, Utilities & Recurring Household Costs</Text>
          </View>
          <GlassButton title="+ Bill" onPress={onOpenAddBill} style={styles.addBtn} />
        </View>

        {/* Hero Card */}
        <View style={styles.section}>
          <GlassCard style={styles.heroCard}>
            <Text style={styles.heroLabel}>Total Pending Living Costs</Text>
            <Text style={styles.heroAmount}>{formatINR(pendingTotal)}</Text>
            <Text style={styles.heroSub}>
              {bills.filter((b) => b.status !== 'Paid').length} bills due this period
            </Text>
          </GlassCard>
        </View>

        {/* Bills List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Bills & Living Expenses</Text>

          {bills.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Feather name="file-text" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No bills scheduled</Text>
              <Text style={styles.emptySubtitle}>
                Add your room rent, electricity, Wi-Fi or maintenance to keep track of monthly living costs.
              </Text>
              <GlassButton
                title="+ Add First Bill"
                onPress={onOpenAddBill}
                style={{ marginTop: 14 }}
              />
            </GlassCard>
          ) : (
            <View style={{ gap: 12 }}>
              {bills.map((bill) => {
                const statusColor = getStatusColor(bill.status);
                const isPaid = bill.status === 'Paid';

                return (
                  <GlassCard key={bill.id} style={styles.billCard}>
                    <View style={styles.billRow}>
                      <View style={styles.billLeft}>
                        <View
                          style={[
                            styles.billIconCircle,
                            isPaid && { backgroundColor: Colors.successSoft },
                          ]}
                        >
                          <Feather
                            name={isPaid ? 'check' : 'file-text'}
                            size={16}
                            color={isPaid ? Colors.success : Colors.white}
                          />
                        </View>
                        <View>
                          <Text style={styles.billName}>{bill.name}</Text>
                          <Text style={styles.billSub}>
                            {bill.category} • Due: {formatDisplayDate(bill.due_date)}
                          </Text>
                          {bill.billing_period ? (
                            <Text style={styles.billPeriod}>Period: {bill.billing_period}</Text>
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.billRight}>
                        <Text style={styles.billAmount}>{formatINR(bill.amount)}</Text>
                        <View style={[styles.statusPill, { borderColor: statusColor }]}>
                          <Text style={[styles.statusPillText, { color: statusColor }]}>
                            {bill.status}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Action button if pending */}
                    {!isPaid && (
                      <View style={styles.billActionRow}>
                        <TouchableOpacity
                          activeOpacity={0.75}
                          onPress={() => onPayBill(bill)}
                          style={styles.payNowBtn}
                        >
                          <Feather name="credit-card" size={13} color={Colors.black} />
                          <Text style={styles.payNowText}>Mark as Paid & Debit Account</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </GlassCard>
                );
              })}
            </View>
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
  addBtn: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  heroCard: {
    padding: 20,
  },
  heroLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  heroSub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  billCard: {
    padding: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  billIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  billSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  billPeriod: {
    fontSize: 10.5,
    color: Colors.textMuted,
    marginTop: 1,
  },
  billRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  billAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  billActionRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingVertical: 8,
    borderRadius: 10,
  },
  payNowText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.black,
  },
});
