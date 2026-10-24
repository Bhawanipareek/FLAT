import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onQuickAddPress: () => void;
  onProfilePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onQuickAddPress, onProfilePress }) => {
  const { userName, hideBalances, toggleHideBalances, currentMonth } = useApp();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <View style={styles.header}>
      {/* Left: Avatar & Name */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onProfilePress}
        style={styles.profileSection}
      >
        <View style={styles.walletLogoAvatar}>
          <Feather name="credit-card" size={16} color={Colors.white} />
        </View>
        <View>
          <Text style={styles.greetingText}>{getGreeting()},</Text>
          <Text style={styles.userNameText}>{userName}</Text>
        </View>
      </TouchableOpacity>

      {/* Right: Actions */}
      <View style={styles.rightActions}>
        {/* Privacy toggle */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleHideBalances}
          style={styles.iconButton}
          accessibilityLabel="Toggle balance visibility"
        >
          <Feather
            name={hideBalances ? 'eye-off' : 'eye'}
            size={18}
            color={hideBalances ? Colors.warning : Colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Quick Add Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onQuickAddPress}
          style={styles.quickAddButton}
          accessibilityLabel="Quick add transaction"
        >
          <Feather name="plus" size={20} color={Colors.black} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletLogoAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.2,
    borderColor: Colors.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  userNameText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
