import { getDatabase } from '../database';
import { AttendanceRecord, AttendanceStatus, SalaryConfig } from '../../types/database';
import { formatDateToISO, getCurrentMonthPeriod, getTodayDateString } from '../../utils/date';

export function getSalaryConfig(): SalaryConfig {
  const db = getDatabase();
  let config = db.getFirstSync<SalaryConfig>('SELECT * FROM salary_config WHERE id = "primary";');
  if (!config) {
    const now = new Date().toISOString();
    db.runSync(
      `INSERT INTO salary_config (id, base_salary, in_hand_salary, salary_basis, salary_cycle, cycle_start_day, salary_payment_date, working_days_per_month, weekly_offs, paid_leaves_per_month, unpaid_leave_deduction_formula, half_day_deduction_fraction, sandwich_rule_enabled, overtime_hourly_rate, created_at, updated_at)
       VALUES ('primary', 55000, 50000, 'monthly', 'calendar', 1, 1, 26, 'Sunday', 1.5, 'per_day', 0.5, 0, 0, ?, ?);`,
      [now, now]
    );
    config = db.getFirstSync<SalaryConfig>('SELECT * FROM salary_config WHERE id = "primary";')!;
  }
  return config;
}

export function updateSalaryConfig(data: Partial<SalaryConfig>): SalaryConfig {
  const db = getDatabase();
  const current = getSalaryConfig();
  const updated: SalaryConfig = { ...current, ...data, updated_at: new Date().toISOString() };

  db.runSync(
    `UPDATE salary_config
     SET base_salary = ?,
         in_hand_salary = ?,
         salary_basis = ?,
         salary_cycle = ?,
         cycle_start_day = ?,
         salary_payment_date = ?,
         working_days_per_month = ?,
         weekly_offs = ?,
         paid_leaves_per_month = ?,
         unpaid_leave_deduction_formula = ?,
         half_day_deduction_fraction = ?,
         sandwich_rule_enabled = ?,
         overtime_hourly_rate = ?,
         updated_at = ?
     WHERE id = 'primary';`,
    [
      updated.base_salary,
      updated.in_hand_salary,
      updated.salary_basis,
      updated.salary_cycle,
      updated.cycle_start_day,
      updated.salary_payment_date,
      updated.working_days_per_month,
      updated.weekly_offs,
      updated.paid_leaves_per_month,
      updated.unpaid_leave_deduction_formula,
      updated.half_day_deduction_fraction,
      updated.sandwich_rule_enabled,
      updated.overtime_hourly_rate,
      updated.updated_at,
    ]
  );

  return updated;
}

export function markAttendance(
  date: string,
  status: AttendanceStatus,
  overtimeHours = 0,
  notes?: string
): AttendanceRecord {
  const db = getDatabase();
  const now = new Date().toISOString();

  db.runSync(
    `INSERT INTO attendance_records (date, status, overtime_hours, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       status = excluded.status,
       overtime_hours = excluded.overtime_hours,
       notes = excluded.notes,
       updated_at = excluded.updated_at;`,
    [date, status, overtimeHours, notes || null, now, now]
  );

  return db.getFirstSync<AttendanceRecord>('SELECT * FROM attendance_records WHERE date = ?;', [date])!;
}

export function getAttendanceForMonth(year: number, month: number): AttendanceRecord[] {
  const db = getDatabase();
  const start = formatDateToISO(new Date(year, month, 1));
  const end = formatDateToISO(new Date(year, month + 1, 0));

  return db.getAllSync<AttendanceRecord>(
    'SELECT * FROM attendance_records WHERE date >= ? AND date <= ? ORDER BY date ASC;',
    [start, end]
  );
}

export function calculateMonthlySalaryStats(year?: number, month?: number): {
  baseSalary: number;
  inHandSalary: number;
  perDayRate: number;
  fullDaysWorked: number;
  halfDays: number;
  absences: number;
  paidLeavesUsed: number;
  unpaidLeaves: number;
  weeklyOffs: number;
  holidays: number;
  totalWorkingDaysInMonth: number;
  attendancePercentage: number;
  leaveDeductions: number;
  overtimeEarnings: number;
  estimatedEarnedToDate: number;
  projectedMonthEndSalary: number;
} {
  const config = getSalaryConfig();
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth();

  const records = getAttendanceForMonth(targetYear, targetMonth);
  const totalDaysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const workingDaysDenominator = config.working_days_per_month > 0 ? config.working_days_per_month : 26;
  const perDayRate = config.in_hand_salary / workingDaysDenominator;

  let fullDaysWorked = 0;
  let halfDays = 0;
  let absences = 0;
  let paidLeavesUsed = 0;
  let unpaidLeaves = 0;
  let weeklyOffs = 0;
  let holidays = 0;
  let totalOvertimeHours = 0;

  for (const rec of records) {
    totalOvertimeHours += rec.overtime_hours || 0;
    switch (rec.status) {
      case 'Full Day':
        fullDaysWorked++;
        break;
      case 'Half Day':
        halfDays++;
        break;
      case 'Absent':
        absences++;
        break;
      case 'Paid Leave':
        paidLeavesUsed++;
        break;
      case 'Unpaid Leave':
        unpaidLeaves++;
        break;
      case 'Weekly Off':
        weeklyOffs++;
        break;
      case 'Holiday':
        holidays++;
        break;
    }
  }

  // Deductions:
  // Unpaid leaves + Absences beyond allowed paid leaves + half-day fractions
  const extraUnpaidFromAbsences = Math.max(0, absences - Math.max(0, config.paid_leaves_per_month - paidLeavesUsed));
  const effectiveUnpaidDays = unpaidLeaves + extraUnpaidFromAbsences + halfDays * (config.half_day_deduction_fraction || 0.5);
  const leaveDeductions = Math.round(effectiveUnpaidDays * perDayRate * 100) / 100;
  const overtimeEarnings = Math.round(totalOvertimeHours * (config.overtime_hourly_rate || (perDayRate / 8)) * 100) / 100;

  // Effective days credited towards earned salary to date
  const effectivePaidDays = fullDaysWorked + (halfDays * (1 - config.half_day_deduction_fraction)) + paidLeavesUsed + weeklyOffs + holidays;
  const estimatedEarnedToDate = Math.round((effectivePaidDays * perDayRate + overtimeEarnings) * 100) / 100;
  const projectedMonthEndSalary = Math.max(0, Math.round((config.in_hand_salary - leaveDeductions + overtimeEarnings) * 100) / 100);

  const loggedDays = records.length;
  const attendancePercentage = loggedDays > 0 ? Math.round(((fullDaysWorked + halfDays * 0.5) / loggedDays) * 100) : 0;

  return {
    baseSalary: config.base_salary,
    inHandSalary: config.in_hand_salary,
    perDayRate: Math.round(perDayRate * 100) / 100,
    fullDaysWorked,
    halfDays,
    absences,
    paidLeavesUsed,
    unpaidLeaves,
    weeklyOffs,
    holidays,
    totalWorkingDaysInMonth: workingDaysDenominator,
    attendancePercentage,
    leaveDeductions,
    overtimeEarnings,
    estimatedEarnedToDate,
    projectedMonthEndSalary,
  };
}
