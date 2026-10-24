import React, { useState } from 'react';
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
import { useApp } from '../context/AppContext';
import { Account } from '../types/database';

interface AccountsScreenProps {
  onBack: () => void;
  onOpenAddAccount: () => void;
  onOpenTransfer: (fromAccountId?: string) => void;
}

export const AccountsScreen: React.FC<AccountsScreenProps> = ({
  onBack,
  onOpenAddAccount,
  onOpenTransfer,
}) => {
  const { accounts, totalBalance, cashBalance, bankBalance, hideBalances } = useApp();

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
            <Text style={styles.pageTitle}>Accounts & Cash</Text>
            <Text style={styles.pageSubtitle}>Wallets, Bank Accounts & Transfers</Text>
          </View>
          <GlassButton title="+ Account" onPress={onOpenAddAccount} style={styles.addBtn} />
        </View>

        {/* Total Available Balance Card */}
        <View style={styles.section}>
          <GlassCard style={styles.heroCard}>
            <Text style={styles.heroLabel}>Total Liquid Balance</Text>
            <Text style={styles.heroAmount}>
              {hideBalances ? '••••••••' : formatINR(totalBalance)}
            </Text>
            <View style={styles.heroSplitRow}>
              <View>
                <Text style={styles.heroSplitLabel}>Physical Cash</Text>
                <Text style={styles.heroSplitVal}>
                  {hideBalances ? '••••' : formatINR(cashBalance)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View>
                <Text style={styles.heroSplitLabel}>Bank Accounts</Text>
                <Text style={styles.heroSplitVal}>
                  {hideBalances ? '••••' : formatINR(bankBalance)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onOpenTransfer()}
              style={styles.heroTransferBtn}
            >
              <Feather name="repeat" size={14} color={Colors.black} />
              <Text style={styles.heroTransferText}>Transfer Between Accounts</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>

        {/* All Accounts List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Financial Accounts</Text>

          <View style={{ gap: 12 }}>
            {accounts.map((acc) => {
              const isCash = acc.type === 'cash';

              return (
                <GlassCard key={acc.id} style={styles.accCard}>
                  <View style={styles.accHeader}>
                    <View style={styles.accLeft}>
                      <View
                        style={[
                          styles.accIconCircle,
                          isCash && { backgroundColor: Colors.warningSoft },
                        ]}
                      >
                        <Feather
                          name={isCash ? 'pocket' : 'credit-card'}
                          size={18}
                          color={isCash ? Colors.warning : Colors.white}
                        />
                      </View>
                      <View>
                        <Text style={styles.accName}>{acc.name}</Text>
                        <Text style={styles.accType}>
                          {isCash ? 'Physical Cash' : `${acc.type.toUpperCase()} •••• ${acc.last_four_digits || '0000'}`}
                        </Text>
                        {acc.description ? (
                          <Text style={styles.accDesc}>{acc.description}</Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.accRight}>
                      <Text style={styles.accBalance}>
                        {hideBalances ? '••••' : formatINR(acc.balance)}
                      </Text>
                      {acc.is_default === 1 && (
                        <View style={styles.defaultPill}>
                          <Text style={styles.defaultPillText}>Default</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.accActionRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => onOpenTransfer(acc.id)}
                      style={styles.accActionBtn}
                    >
                      <Feather name="repeat" size={12} color={Colors.white} />
                      <Text style={styles.accActionText}>Transfer Out</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              );
            })}
          </View>
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
    fontSize: 34,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  heroSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.glassBorder,
  },
  heroSplitLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  heroSplitVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 2,
  },
  heroTransferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    height: 42,
    borderRadius: 12,
    marginTop: 16,
  },
  heroTransferText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.black,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  accCard: {
    padding: 16,
  },
  accHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  accIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  accType: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  accDesc: {
    fontSize: 10.5,
    color: Colors.textMuted,
    marginTop: 1,
  },
  accRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  accBalance: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  defaultPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultPillText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  accActionRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  accActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  accActionText: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
