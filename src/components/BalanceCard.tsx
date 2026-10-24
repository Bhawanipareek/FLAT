import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { formatINR } from '../utils/currency';
import { useApp } from '../context/AppContext';

interface BalanceCardProps {
  onAddCashPress: () => void;
  onAddBankPress: () => void;
  onTransferPress: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  onAddCashPress,
  onAddBankPress,
  onTransferPress,
}) => {
  const { cashBalance, bankBalance, totalBalance, hideBalances } = useApp();
  const [activeSegment, setActiveSegment] = useState<'total' | 'cash' | 'bank'>('total');

  const renderAmount = (amount: number) => {
    if (hideBalances) {
      return '••••••••';
    }
    return formatINR(amount);
  };

  const getSubLabel = () => {
    switch (activeSegment) {
      case 'cash':
        return 'Physical Cash in Hand';
      case 'bank':
        return 'All Linked Bank Accounts';
      default:
        return 'Cash + Liquid Bank Balances';
    }
  };

  const getCurrentBalance = () => {
    switch (activeSegment) {
      case 'cash':
        return cashBalance;
      case 'bank':
        return bankBalance;
      default:
        return totalBalance;
    }
  };

  return (
    <View style={styles.container}>
      {/* Segment Selector */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveSegment('total')}
          style={[styles.segmentTab, activeSegment === 'total' && styles.activeSegmentTab]}
        >
          <Text style={[styles.segmentText, activeSegment === 'total' && styles.activeSegmentText]}>
            Total Available
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveSegment('cash')}
          style={[styles.segmentTab, activeSegment === 'cash' && styles.activeSegmentTab]}
        >
          <Text style={[styles.segmentText, activeSegment === 'cash' && styles.activeSegmentText]}>
            Cash
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveSegment('bank')}
          style={[styles.segmentTab, activeSegment === 'bank' && styles.activeSegmentTab]}
        >
          <Text style={[styles.segmentText, activeSegment === 'bank' && styles.activeSegmentText]}>
            Bank
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Glass Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardSubtitle}>{getSubLabel()}</Text>
          <View style={styles.statusPill}>
            <View style={styles.greenDot} />
            <Text style={styles.statusPillText}>Liquid</Text>
          </View>
        </View>

        {/* Large Currency numeral */}
        <Text style={styles.balanceText} numberOfLines={1} adjustsFontSizeToFit>
          {renderAmount(getCurrentBalance())}
        </Text>

        {/* Quick balance actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onAddCashPress}
            style={styles.actionButton}
          >
            <Feather name="plus-circle" size={15} color={Colors.white} />
            <Text style={styles.actionText}>Add Cash</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onAddBankPress}
            style={styles.actionButton}
          >
            <Feather name="credit-card" size={15} color={Colors.white} />
            <Text style={styles.actionText}>Add Bank</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onTransferPress}
            style={styles.actionButton}
          >
            <Feather name="repeat" size={15} color={Colors.white} />
            <Text style={styles.actionText}>Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 3,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 11,
  },
  activeSegmentTab: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  segmentText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeSegmentText: {
    color: Colors.white,
    fontWeight: '700',
  },
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderWidth: 1,
    borderColor: Colors.glassBorderStrong,
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  statusPillText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
  },
  balanceText: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
    marginVertical: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    marginTop: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
});
