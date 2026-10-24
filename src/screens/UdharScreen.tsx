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
import {
  getUdharRecords,
  getUdharTotals,
  getUdharPayments,
} from '../db/queries/udhar';
import { UdharRecord, UdharDirection, UdharStatus } from '../types/database';

interface UdharScreenProps {
  onOpenAddUdhar: (direction: UdharDirection) => void;
  onOpenRecordRepayment: (record: UdharRecord) => void;
}

export const UdharScreen: React.FC<UdharScreenProps> = ({
  onOpenAddUdhar,
  onOpenRecordRepayment,
}) => {
  // Strictly separated direction selector
  const [activeDirection, setActiveDirection] = useState<UdharDirection>('GAVE');
  const [records, setRecords] = useState<UdharRecord[]>([]);
  const [totals, setTotals] = useState({ toReceive: 0, toPay: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedRecordPayments, setSelectedRecordPayments] = useState<any[]>([]);

  const loadUdharData = () => {
    try {
      const recs = getUdharRecords(activeDirection);
      setRecords(recs);
      setTotals(getUdharTotals());
    } catch (e) {
      console.error('Error loading udhar:', e);
    }
  };

  useEffect(() => {
    loadUdharData();
  }, [activeDirection]);

  const toggleExpand = (rec: UdharRecord) => {
    if (expandedId === rec.id) {
      setExpandedId(null);
      setSelectedRecordPayments([]);
    } else {
      setExpandedId(rec.id);
      setSelectedRecordPayments(getUdharPayments(rec.id));
    }
  };

  const getStatusColor = (status: UdharStatus) => {
    switch (status) {
      case 'Overdue':
        return Colors.danger;
      case 'Due Soon':
        return Colors.warning;
      case 'Settled':
        return Colors.success;
      case 'Partially Paid':
        return Colors.info;
      default:
        return Colors.textSecondary;
    }
  };

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
            <Text style={styles.pageTitle}>Udhar & Debts</Text>
            <Text style={styles.pageSubtitle}>Lending, Borrowing & Repayments</Text>
          </View>
          <GlassButton
            title="+ Add"
            onPress={() => onOpenAddUdhar(activeDirection)}
            style={styles.headerBtn}
          />
        </View>

        {/* Direction Switcher: Strictly Separated */}
        <View style={styles.section}>
          <View style={styles.directionToggleContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveDirection('GAVE')}
              style={[
                styles.directionTab,
                activeDirection === 'GAVE' && styles.activeDirectionTabGave,
              ]}
            >
              <Feather
                name="arrow-up-right"
                size={14}
                color={activeDirection === 'GAVE' ? Colors.black : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.directionTabText,
                  activeDirection === 'GAVE' && styles.activeDirectionTabText,
                ]}
              >
                I Gave (To Receive)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveDirection('BORROWED')}
              style={[
                styles.directionTab,
                activeDirection === 'BORROWED' && styles.activeDirectionTabBorrow,
              ]}
            >
              <Feather
                name="arrow-down-left"
                size={14}
                color={activeDirection === 'BORROWED' ? Colors.black : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.directionTabText,
                  activeDirection === 'BORROWED' && styles.activeDirectionTabText,
                ]}
              >
                I Borrowed (To Pay)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Outstanding Total Card */}
        <View style={styles.section}>
          <GlassCard style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <Text style={styles.heroLabel}>
                {activeDirection === 'GAVE'
                  ? 'Total Money People Owe You'
                  : 'Total Money You Owe Others'}
              </Text>
              <View
                style={[
                  styles.countPill,
                  {
                    backgroundColor:
                      activeDirection === 'GAVE' ? Colors.successSoft : Colors.warningSoft,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countPillText,
                    { color: activeDirection === 'GAVE' ? Colors.success : Colors.warning },
                  ]}
                >
                  {records.filter((r) => r.status !== 'Settled').length} Active
                </Text>
              </View>
            </View>

            <Text style={styles.heroAmount}>
              {formatINR(activeDirection === 'GAVE' ? totals.toReceive : totals.toPay)}
            </Text>
          </GlassCard>
        </View>

        {/* Records List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {activeDirection === 'GAVE' ? 'People Who Owe You' : 'Lenders You Need to Pay'}
          </Text>

          {records.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Feather name="users" size={34} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {activeDirection === 'GAVE'
                  ? 'No money lent records yet'
                  : 'No money borrowed records yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeDirection === 'GAVE'
                  ? 'Record money given to friends, family, or colleagues.'
                  : 'Record money borrowed so you never miss a promised repayment.'}
              </Text>
              <GlassButton
                title={activeDirection === 'GAVE' ? '+ Record Money Given' : '+ Record Borrowed Money'}
                onPress={() => onOpenAddUdhar(activeDirection)}
                style={{ marginTop: 14 }}
              />
            </GlassCard>
          ) : (
            <View style={{ gap: 12 }}>
              {records.map((rec) => {
                const isExpanded = expandedId === rec.id;
                const paidBack = rec.original_amount - rec.outstanding_amount;
                const statusColor = getStatusColor(rec.status);

                return (
                  <GlassCard key={rec.id} style={styles.recordCard}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => toggleExpand(rec)}
                      style={styles.cardHeaderRow}
                    >
                      <View style={styles.personInfo}>
                        <View style={styles.avatarMini}>
                          <Text style={styles.avatarLetter}>
                            {rec.person_name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.personName}>{rec.person_name}</Text>
                          <Text style={styles.personDate}>
                            Given: {formatDisplayDate(rec.transaction_date)}
                            {rec.due_date ? ` • Due: ${formatDisplayDate(rec.due_date)}` : ''}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.amountStatusCol}>
                        <Text style={styles.outstandingAmount}>
                          {formatINR(rec.outstanding_amount)}
                        </Text>
                        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                          <Text style={[styles.statusText, { color: statusColor }]}>
                            {rec.status}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Progress Bar of repayment */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${Math.min(
                                100,
                                Math.round((paidBack / rec.original_amount) * 100)
                              )}%`,
                              backgroundColor:
                                rec.status === 'Settled' ? Colors.success : Colors.white,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.progressLabels}>
                        <Text style={styles.progressSub}>
                          Original: {formatINR(rec.original_amount)}
                        </Text>
                        <Text style={styles.progressSub}>
                          Repaid: {formatINR(paidBack)}
                        </Text>
                      </View>
                    </View>

                    {/* Bottom Actions */}
                    <View style={styles.cardActionsRow}>
                      {rec.status !== 'Settled' && (
                        <TouchableOpacity
                          activeOpacity={0.75}
                          onPress={() => onOpenRecordRepayment(rec)}
                          style={styles.repayButton}
                        >
                          <Feather name="check-circle" size={14} color={Colors.black} />
                          <Text style={styles.repayButtonText}>
                            {activeDirection === 'GAVE' ? 'Receive Payment' : 'Record Repayment'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggleExpand(rec)}
                        style={styles.historyToggle}
                      >
                        <Text style={styles.historyToggleText}>
                          {isExpanded ? 'Hide History' : 'Payment History'}
                        </Text>
                        <Feather
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={14}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Expanded Payment History Ledger */}
                    {isExpanded && (
                      <View style={styles.historyContainer}>
                        <Text style={styles.historyHeader}>REPAYMENT LEDGER</Text>
                        {selectedRecordPayments.length === 0 ? (
                          <Text style={styles.noPaymentsText}>No partial repayments logged yet.</Text>
                        ) : (
                          selectedRecordPayments.map((p) => (
                            <View key={p.id} style={styles.historyRow}>
                              <View>
                                <Text style={styles.historyDate}>
                                  {formatDisplayDate(p.payment_date)}
                                </Text>
                                <Text style={styles.historyAccount}>
                                  Account: {p.account_name || 'Cash/Bank'}
                                </Text>
                              </View>
                              <Text style={styles.historyAmount}>+{formatINR(p.amount)}</Text>
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
  headerBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  directionToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfacePrimary,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 4,
  },
  directionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  activeDirectionTabGave: {
    backgroundColor: Colors.white,
  },
  activeDirectionTabBorrow: {
    backgroundColor: Colors.white,
  },
  directionTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeDirectionTabText: {
    color: Colors.black,
    fontWeight: '700',
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
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
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
  recordCard: {
    padding: 18,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  personName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  personDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  amountStatusCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  outstandingAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 14,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  repayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  repayButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.black,
  },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  historyToggleText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  historyContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  noPaymentsText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  historyDate: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500',
  },
  historyAccount: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  historyAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
});
