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
import { getAllEmis, getUpcomingEmiTotal, getEmiPayments } from '../db/queries/emis';
import { EmiPlan } from '../types/database';

interface EmiScreenProps {
  onBack: () => void;
  onOpenAddEmi: () => void;
  onPayEmi: (emi: EmiPlan) => void;
}

export const EmiScreen: React.FC<EmiScreenProps> = ({ onBack, onOpenAddEmi, onPayEmi }) => {
  const [emis, setEmis] = useState<EmiPlan[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);

  const loadData = () => {
    try {
      setEmis(getAllEmis());
      setMonthlyTotal(getUpcomingEmiTotal());
    } catch (e) {
      console.error('Error loading EMIs:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpand = (emi: EmiPlan) => {
    if (expandedId === emi.id) {
      setExpandedId(null);
      setPayments([]);
    } else {
      setExpandedId(emi.id);
      setPayments(getEmiPayments(emi.id));
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
            <Text style={styles.pageTitle}>EMI & Loans</Text>
            <Text style={styles.pageSubtitle}>Instalment Tracking & Amortisation</Text>
          </View>
          <GlassButton title="+ Add" onPress={onOpenAddEmi} style={styles.addBtn} />
        </View>

        {/* Hero Summary */}
        <View style={styles.section}>
          <GlassCard style={styles.heroCard}>
            <Text style={styles.heroLabel}>Total Monthly EMI Obligation</Text>
            <Text style={styles.heroAmount}>{formatINR(monthlyTotal)}</Text>
            <Text style={styles.heroSub}>
              {emis.filter((e) => e.status === 'Active').length} active instalment plans
            </Text>
          </GlassCard>
        </View>

        {/* EMI List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your EMI Plans</Text>

          {emis.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Feather name="percent" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No active EMI plans</Text>
              <Text style={styles.emptySubtitle}>
                Add phone EMIs, vehicle loans, personal loans, or electronics No-Cost EMIs.
              </Text>
              <GlassButton
                title="+ Add Your First EMI"
                onPress={onOpenAddEmi}
                style={{ marginTop: 14 }}
              />
            </GlassCard>
          ) : (
            <View style={{ gap: 12 }}>
              {emis.map((emi) => {
                const remaining = emi.total_installments - emi.paid_installments;
                const progressPct = Math.round(
                  (emi.paid_installments / emi.total_installments) * 100
                );
                const isExpanded = expandedId === emi.id;

                return (
                  <GlassCard key={emi.id} style={styles.emiCard}>
                    <View style={styles.emiHeader}>
                      <View>
                        <Text style={styles.emiName}>{emi.name}</Text>
                        <Text style={styles.emiLender}>
                          {emi.lender ? `${emi.lender} • ` : ''}Due Day {emi.due_day} of month
                        </Text>
                      </View>
                      <View style={styles.emiAmountCol}>
                        <Text style={styles.emiMonthlyAmount}>{formatINR(emi.monthly_amount)}</Text>
                        <Text style={styles.emiPerMonthText}>/ month</Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
                      </View>
                      <View style={styles.progressTextRow}>
                        <Text style={styles.progressText}>
                          Paid: {emi.paid_installments} / {emi.total_installments} ({progressPct}%)
                        </Text>
                        <Text style={styles.progressText}>{remaining} months left</Text>
                      </View>
                    </View>

                    {/* Action Row */}
                    <View style={styles.actionRow}>
                      {emi.status === 'Active' && remaining > 0 && (
                        <TouchableOpacity
                          activeOpacity={0.75}
                          onPress={() => onPayEmi(emi)}
                          style={styles.payBtn}
                        >
                          <Feather name="check" size={14} color={Colors.black} />
                          <Text style={styles.payBtnText}>Pay Month #{emi.paid_installments + 1}</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggleExpand(emi)}
                        style={styles.historyBtn}
                      >
                        <Text style={styles.historyBtnText}>
                          {isExpanded ? 'Hide History' : 'Payment History'}
                        </Text>
                        <Feather
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={14}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Expandable History */}
                    {isExpanded && (
                      <View style={styles.historyBox}>
                        <Text style={styles.historyTitle}>RECORDED INSTALMENT PAYMENTS</Text>
                        {payments.length === 0 ? (
                          <Text style={styles.noPayments}>No payments recorded yet.</Text>
                        ) : (
                          payments.map((p) => (
                            <View key={p.id} style={styles.paymentRow}>
                              <Text style={styles.paymentInst}>
                                Instalment #{p.installment_number} ({p.payment_date})
                              </Text>
                              <Text style={styles.paymentAmt}>{formatINR(p.amount)}</Text>
                            </View>
                          ))
                        )}
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
  emiCard: {
    padding: 18,
  },
  emiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  emiName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  emiLender: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emiAmountCol: {
    alignItems: 'flex-end',
  },
  emiMonthlyAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  emiPerMonthText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  progressContainer: {
    marginTop: 14,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 2.5,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  progressText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  payBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.black,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyBtnText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historyBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  noPayments: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  paymentInst: {
    fontSize: 11.5,
    color: Colors.textSecondary,
  },
  paymentAmt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.white,
  },
});
