import '../data/models/attendance_record_model.dart';
import '../data/models/salary_profile_model.dart';

class SalaryCalculationResult {
  final double grossSalary;
  final int daysInMonth;
  final int totalWorkingDays;
  final double presentDays;
  final int fullDaysCount;
  final int halfDaysCount;
  final int leavesTakenCount;
  final double paidLeavesAllowed;
  final double paidLeavesUsed;
  final double unpaidLeaveDays;
  final int sandwichDaysCount;
  final List<DateTime> sandwichDates;
  final double totalDeductionDays;
  final double perDaySalaryRate;
  final double leaveDeductionAmount;
  final double fixedDeductions;
  final double netInHandSalary;

  SalaryCalculationResult({
    required this.grossSalary,
    required this.daysInMonth,
    required this.totalWorkingDays,
    required this.presentDays,
    required this.fullDaysCount,
    required this.halfDaysCount,
    required this.leavesTakenCount,
    required this.paidLeavesAllowed,
    required this.paidLeavesUsed,
    required this.unpaidLeaveDays,
    required this.sandwichDaysCount,
    required this.sandwichDates,
    required this.totalDeductionDays,
    required this.perDaySalaryRate,
    required this.leaveDeductionAmount,
    required this.fixedDeductions,
    required this.netInHandSalary,
  });
}

class SalaryCalculator {
  static SalaryCalculationResult calculate({
    required SalaryProfileModel profile,
    required List<AttendanceRecordModel> records,
    required DateTime month,
  }) {
    final year = month.year;
    final m = month.month;
    final daysInMonth = DateTime(year, m + 1, 0).day;

    final recordMap = <int, AttendanceRecordModel>{};
    for (final r in records) {
      if (r.date.year == year && r.date.month == m) {
        recordMap[r.date.day] = r;
      }
    }

    int fullDays = 0;
    int halfDays = 0;
    int paidLeaves = 0;
    int unpaidLeaves = 0;
    int holidays = 0;
    int weeklyOffs = 0;
    int workingDays = 0;

    final isOffDay = <int, bool>{};
    final isLeaveDay = <int, bool>{};

    for (int day = 1; day <= daysInMonth; day++) {
      final date = DateTime(year, m, day);
      final isWeekend = profile.workDaysPerWeek == 5
          ? (date.weekday == DateTime.saturday || date.weekday == DateTime.sunday)
          : (date.weekday == DateTime.sunday);

      final rec = recordMap[day];
      final status = rec?.status ?? (isWeekend ? 'weekly_off' : 'full_day');

      if (!isWeekend && status != 'holiday' && status != 'weekly_off') {
        workingDays++;
      }

      switch (status) {
        case 'full_day':
          fullDays++;
          isOffDay[day] = false;
          isLeaveDay[day] = false;
          break;
        case 'half_day':
          halfDays++;
          isOffDay[day] = false;
          isLeaveDay[day] = true;
          break;
        case 'paid_leave':
          paidLeaves++;
          isOffDay[day] = false;
          isLeaveDay[day] = true;
          break;
        case 'unpaid_leave':
          unpaidLeaves++;
          isOffDay[day] = false;
          isLeaveDay[day] = true;
          break;
        case 'holiday':
          holidays++;
          isOffDay[day] = true;
          isLeaveDay[day] = false;
          break;
        case 'weekly_off':
        default:
          weeklyOffs++;
          isOffDay[day] = true;
          isLeaveDay[day] = false;
          break;
      }
    }

    // Sandwich Rule Detection:
    // If weekend / holiday block is preceded and followed by a leave day
    final List<DateTime> sandwichDates = [];
    if (profile.sandwichRuleEnabled) {
      int d = 1;
      while (d <= daysInMonth) {
        if (isOffDay[d] == true) {
          final blockStart = d;
          while (d <= daysInMonth && isOffDay[d] == true) {
            d++;
          }
          final blockEnd = d - 1;

          // Check day before block
          final prevDay = blockStart - 1;
          final nextDay = blockEnd + 1;

          final prevIsLeave = prevDay >= 1 && (isLeaveDay[prevDay] == true);
          final nextIsLeave = nextDay <= daysInMonth && (isLeaveDay[nextDay] == true);

          if (prevIsLeave && nextIsLeave) {
            for (int sDay = blockStart; sDay <= blockEnd; sDay++) {
              sandwichDates.add(DateTime(year, m, sDay));
            }
          }
        } else {
          d++;
        }
      }
    }

    final sandwichDaysCount = sandwichDates.length;
    final totalLeavesTaken = paidLeaves + unpaidLeaves;
    final paidLeavesAllowed = profile.monthlyPaidLeaves;

    // Leaves beyond allowed quota count as unpaid
    final paidLeavesUsed = totalLeavesTaken > paidLeavesAllowed
        ? paidLeavesAllowed
        : totalLeavesTaken.toDouble();
    final excessLeaveDays = totalLeavesTaken > paidLeavesAllowed
        ? (totalLeavesTaken - paidLeavesAllowed)
        : 0.0;

    // Total deduction days = excess leaves + (half days * 0.5) + sandwich penalty days
    final totalDeductionDays = excessLeaveDays + (halfDays * 0.5) + sandwichDaysCount;

    final divisor = profile.deductionBasis == 'working_days' && workingDays > 0
        ? workingDays.toDouble()
        : daysInMonth.toDouble();

    final perDaySalaryRate = profile.grossSalary > 0 ? (profile.grossSalary / divisor) : 0.0;
    final leaveDeductionAmount = totalDeductionDays * perDaySalaryRate;
    final netInHand = profile.grossSalary > 0
        ? (profile.grossSalary - leaveDeductionAmount - profile.fixedDeductions)
        : 0.0;

    return SalaryCalculationResult(
      grossSalary: profile.grossSalary,
      daysInMonth: daysInMonth,
      totalWorkingDays: workingDays,
      presentDays: fullDays + (halfDays * 0.5),
      fullDaysCount: fullDays,
      halfDaysCount: halfDays,
      leavesTakenCount: totalLeavesTaken,
      paidLeavesAllowed: paidLeavesAllowed,
      paidLeavesUsed: paidLeavesUsed,
      unpaidLeaveDays: excessLeaveDays,
      sandwichDaysCount: sandwichDaysCount,
      sandwichDates: sandwichDates,
      totalDeductionDays: totalDeductionDays,
      perDaySalaryRate: perDaySalaryRate,
      leaveDeductionAmount: leaveDeductionAmount,
      fixedDeductions: profile.fixedDeductions,
      netInHandSalary: netInHand > 0 ? netInHand : 0.0,
    );
  }
}
