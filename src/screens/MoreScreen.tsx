import React from 'react';
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

interface MoreScreenProps {
  onNavigateTo: (subScreen: string) => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ onNavigateTo }) => {
  const menuItems = [
    {
      id: 'attendance',
      title: 'Attendance & Salary',
      desc: 'Salary structure, leaves, deductions & calendar',
      icon: 'calendar',
      color: '#34D399',
    },
    {
      id: 'bills',
      title: 'Rent & Household Bills',
      desc: 'Room rent, electricity, Wi-Fi, water & utilities',
      icon: 'file-text',
      color: '#F472B6',
    },
    {
      id: 'accounts',
      title: 'Accounts & Transfers',
      desc: 'Bank accounts, cash wallet & instant transfers',
      icon: 'credit-card',
      color: Colors.info,
    },
    {
      id: 'emi',
      title: 'EMI & Loans',
      desc: 'Monthly amortisation schedules & instalment tracking',
      icon: 'percent',
      color: '#38BDF8',
    },
    {
      id: 'reports',
      title: 'Detailed Reports',
      desc: 'Monthly cash flow, category charts & net worth',
      icon: 'pie-chart',
      color: '#A78BFA',
    },
    {
      id: 'backup',
      title: 'Backup & Restore',
      desc: 'Offline JSON export & import to device storage',
      icon: 'hard-drive',
      color: Colors.warning,
    },
    {
      id: 'settings',
      title: 'Profile & Settings',
      desc: 'Biometrics, privacy mask & display name',
      icon: 'settings',
      color: Colors.white,
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topHeader}>
          <Text style={styles.pageTitle}>More Management</Text>
          <Text style={styles.pageSubtitle}>Extended Personal Life & Finance Tools</Text>
        </View>

        <View style={styles.section}>
          <View style={{ gap: 10 }}>
            {menuItems.map((item) => (
              <GlassCard key={item.id} style={styles.card}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => onNavigateTo(item.id)}
                  style={styles.cardButton}
                >
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                    <Feather name={item.icon as any} size={20} color={item.color} />
                  </View>

                  <View style={styles.cardTextCol}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDesc}>{item.desc}</Text>
                  </View>

                  <Feather name="chevron-right" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </GlassCard>
            ))}
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
  topHeader: {
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    padding: 0,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  cardDesc: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
