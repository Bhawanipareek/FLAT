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
import { formatINR } from '../utils/currency';
import { formatDateToISO, formatDisplayDate, getTodayDateString } from '../utils/date';
import {
  getSalaryConfig,
  updateSalaryConfig,
  markAttendance,
  getAttendanceForMonth,
  calculateMonthlySalaryStats,
} from '../db/queries/attendance';
import { AttendanceStatus, SalaryConfig, AttendanceRecord } from '../types/database';

interface AttendanceSalaryScreenProps {
  onBack: () => void;
}

export const AttendanceSalaryScreen: React.FC<AttendanceSalaryScreenProps> = ({ onBack }) => {
  const [config, setConfig] = useState<SalaryConfig>(getSalaryConfig());
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Form edit states
  const [baseSalaryInput, setBaseSalaryInput] = useState(config.base_salary.toString());
  const [inHandInput, setInHandInput] = useState(config.in_hand_salary.toString());
  const [workingDaysInput, setWorkingDaysInput] = useState(config.working_days_per_month.toString());
  const [paidLeavesInput, setPaidLeavesInput] = useState(config.paid_leaves_per_month.toString());

  const loadData = () => {
    try {
      const cfg = getSalaryConfig();
      setConfig(cfg);
      setStats(calculateMonthlySalaryStats());
      const now = new Date();
      setRecords(getAttendanceForMonth(now.getFullYear(), now.getMonth()));
    } catch (e) {
      console.error('Error loading attendance & salary:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = () => {
    const base = parseFloat(baseSalaryInput) || config.base_salary;
    const inHand = parseFloat(inHandInput) || config.in_hand_salary;
    const workingDays = parseInt(workingDaysInput, 10) || config.working_days_per_month;
    const paidLeaves = parseFloat(paidLeavesInput) || config.paid_leaves_per_month;

    updateSalaryConfig({
      base_salary: base,
      in_hand_salary: inHand,
      working_days_per_month: workingDays,
      paid_leaves_per_month: paidLeaves,
    });

    setIsEditingConfig(false);
    loadData();
    Alert.alert('Settings Updated', 'Your salary structure has been updated.');
  };

  const handleMarkDay = (status: AttendanceStatus) => {
    markAttendance(selectedDate, status);
    loadData();
  };

  const attendanceStatuses: { label: AttendanceStatus; icon: string; color: string }[] = [
    { label: 'Full Day', icon: 'check', color: Colors.success },
    { label: 'Half Day', icon: 'clock', color: Colors.warning },
    { label: 'Absent', icon: 'x', color: Colors.danger },
    { label: 'Paid Leave', icon: 'shield', color: '#60A5FA' },
    { label: 'Unpaid Leave', icon: 'slash', color: '#F87171' },
    { label: 'Weekly Off', icon: 'coffee', color: Colors.textSecondary },
    { label: 'Holiday', icon: 'gift', color: '#F472B6' },
  ];

  const currentDayRecord = records.find((r) => r.date === selectedDate);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Bar */}
        <View style={styles.topNav}>
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={Colors.white} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Attendance & Salary</Text>
            <Text style={styles.pageSubtitle}>Automatic In-Hand Deductions & Earnings</Text>
          </View>
        </View>

        {/* Salary Projection Hero Card */}
        <View style={styles.section}>
          <GlassCard style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <Text style={styles.heroLabel}>Estimated Salary Earned To Date</Text>
              <TouchableOpacity
                onPress={() => setIsEditingConfig(!isEditingConfig)}
                style={styles.configBtn}
              >
                <Feather name="settings" size={14} color={Colors.white} />
                <Text style={styles.configBtnText}>Setup</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.heroAmount}>{formatINR(stats?.estimatedEarnedToDate || 0)}</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Monthly Base</Text>
                <Text style={styles.statBoxValue}>{formatINR(config.base_salary)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Target In-Hand</Text>
                <Text style={styles.statBoxValue}>{formatINR(config.in_hand_salary)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Per Day Rate</Text>
                <Text style={styles.statBoxValue}>{formatINR(stats?.perDayRate || 0)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Leave Deductions</Text>
                <Text style={[styles.statBoxValue, { color: Colors.danger }]}>
                  -{formatINR(stats?.leaveDeductions || 0)}
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Setup Salary Form if toggled */}
        {isEditingConfig && (
          <View style={styles.section}>
            <GlassCard style={styles.configCard}>
              <Text style={styles.configTitle}>Configure Salary & Rules</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Monthly Gross / Base Salary (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={baseSalaryInput}
                  onChangeText={setBaseSalaryInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Expected Monthly In-Hand Salary (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={inHandInput}
                  onChangeText={setInHandInput}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Working Days / Mo</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={workingDaysInput}
                    onChangeText={setWorkingDaysInput}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Paid Leaves / Mo</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={paidLeavesInput}
                    onChangeText={setPaidLeavesInput}
                  />
                </View>
              </View>

              <GlassButton
                title="Save Configuration"
                onPress={handleSaveConfig}
                style={{ marginTop: 8 }}
              />
            </GlassCard>
          </View>
        )}

        {/* Mark Attendance for Selected Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mark Attendance ({formatDisplayDate(selectedDate)})</Text>
          <GlassCard style={styles.markCard}>
            <View style={styles.currentStatusRow}>
              <Text style={styles.currentStatusLabel}>Status for Selected Date:</Text>
              <Text style={styles.currentStatusValue}>
                {currentDayRecord ? currentDayRecord.status : 'Not marked yet'}
              </Text>
            </View>

            <View style={styles.buttonGrid}>
              {attendanceStatuses.map((st) => (
                <TouchableOpacity
                  key={st.label}
                  activeOpacity={0.75}
                  onPress={() => handleMarkDay(st.label)}
                  style={[
                    styles.statusPillBtn,
                    currentDayRecord?.status === st.label && styles.activeStatusPillBtn,
                  ]}
                >
                  <Feather
                    name={st.icon as any}
                    size={14}
                    color={currentDayRecord?.status === st.label ? Colors.black : st.color}
                  />
                  <Text
                    style={[
                      styles.statusPillBtnText,
                      currentDayRecord?.status === st.label && styles.activeStatusPillBtnText,
                    ]}
                  >
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        </View>

        {/* Monthly Attendance Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Attendance Metrics</Text>
          <GlassCard style={styles.breakdownCard}>
            <View style={styles.metricRow}>
              <Text style={styles.metricRowText}>Full Days Worked</Text>
              <Text style={styles.metricRowVal}>{stats?.fullDaysWorked || 0} days</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricRowText}>Half Days</Text>
              <Text style={styles.metricRowVal}>{stats?.halfDays || 0} days</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricRowText}>Paid Leaves Used</Text>
              <Text style={styles.metricRowVal}>
                {stats?.paidLeavesUsed || 0} / {config.paid_leaves_per_month}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricRowText}>Unpaid Leaves / Absences</Text>
              <Text style={[styles.metricRowVal, { color: Colors.danger }]}>
                {stats?.unpaidLeaves || 0} days
              </Text>
            </View>
            <View style={[styles.metricRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.metricRowText}>Attendance Ratio</Text>
              <Text style={[styles.metricRowVal, { color: Colors.success }]}>
                {stats?.attendancePercentage || 0}%
              </Text>
            </View>
          </GlassCard>
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
    gap: 14,
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
    fontSize: 12.5,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  configBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  configBtnText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '600',
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  statBoxLabel: {
    fontSize: 10.5,
    color: Colors.textSecondary,
  },
  statBoxValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 2,
  },
  configCard: {
    padding: 18,
  },
  configTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    height: 44,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: Colors.white,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  markCard: {
    padding: 16,
  },
  currentStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  currentStatusLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  currentStatusValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.white,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeStatusPillBtn: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  statusPillBtnText: {
    fontSize: 11.5,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  activeStatusPillBtnText: {
    color: Colors.black,
    fontWeight: '700',
  },
  breakdownCard: {
    paddingHorizontal: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  metricRowText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  metricRowVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});
