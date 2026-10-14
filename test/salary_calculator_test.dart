import 'package:flutter_test/flutter_test.dart';
import 'package:flat_expense_manager/data/models/attendance_record_model.dart';
import 'package:flat_expense_manager/data/models/salary_profile_model.dart';
import 'package:flat_expense_manager/domain/salary_calculator.dart';

void main() {
  group('SalaryCalculator Tests', () {
    test('Calculates full in-hand salary with 0 leaves', () {
      final now = DateTime(2026, 10, 15);
      final profile = SalaryProfileModel(
        grossSalary: 60000.0,
        fixedDeductions: 2000.0,
        monthlyPaidLeaves: 2.0,
        workDaysPerWeek: 5,
        sandwichRuleEnabled: true,
        updatedAt: now,
      );

      final result = SalaryCalculator.calculate(
        profile: profile,
        records: [], // all defaults to full_day on weekdays, weekly_off on weekends
        month: DateTime(2026, 10),
      );

      expect(result.grossSalary, 60000.0);
      expect(result.leaveDeductionAmount, 0.0);
      expect(result.fixedDeductions, 2000.0);
      expect(result.netInHandSalary, 58000.0);
    });

    test('Half day deduction reduces salary by exactly 0.5 day rate', () {
      final now = DateTime(2026, 10, 15);
      final profile = SalaryProfileModel(
        grossSalary: 31000.0, // exactly ₹1000/day in 31-day October
        fixedDeductions: 0.0,
        monthlyPaidLeaves: 0.0,
        workDaysPerWeek: 5,
        sandwichRuleEnabled: false,
        updatedAt: now,
      );

      final records = [
        AttendanceRecordModel(
          id: 'att_1',
          dateString: '2026-10-05',
          status: 'half_day',
          updatedAt: now,
        ),
      ];

      final result = SalaryCalculator.calculate(
        profile: profile,
        records: records,
        month: DateTime(2026, 10),
      );

      expect(result.halfDaysCount, 1);
      expect(result.totalDeductionDays, 0.5);
      expect(result.perDaySalaryRate, 1000.0);
      expect(result.leaveDeductionAmount, 500.0);
      expect(result.netInHandSalary, 30500.0);
    });

    test('Sandwich leave rule penalizes weekend between Friday and Monday leaves', () {
      final now = DateTime(2026, 10, 15);
      // October 2026:
      // Oct 9 is Friday, Oct 10 is Saturday, Oct 11 is Sunday, Oct 12 is Monday
      final profile = SalaryProfileModel(
        grossSalary: 31000.0, // ₹1000/day in October (31 days)
        fixedDeductions: 0.0,
        monthlyPaidLeaves: 0.0,
        workDaysPerWeek: 5,
        sandwichRuleEnabled: true,
        updatedAt: now,
      );

      final records = [
        AttendanceRecordModel(
          id: 'att_fri',
          dateString: '2026-10-09',
          status: 'unpaid_leave',
          updatedAt: now,
        ),
        AttendanceRecordModel(
          id: 'att_mon',
          dateString: '2026-10-12',
          status: 'unpaid_leave',
          updatedAt: now,
        ),
      ];

      final result = SalaryCalculator.calculate(
        profile: profile,
        records: records,
        month: DateTime(2026, 10),
      );

      // Friday (1) + Monday (1) = 2 leave days
      // Weekend Oct 10 (Sat) & Oct 11 (Sun) = 2 sandwich days penalized!
      expect(result.sandwichDaysCount, 2);
      expect(result.leavesTakenCount, 2);
      expect(result.totalDeductionDays, 4.0);
      expect(result.leaveDeductionAmount, 4000.0);
      expect(result.netInHandSalary, 27000.0);
    });
  });
}
