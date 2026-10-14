import 'package:flutter/foundation.dart';
import '../../data/models/attendance_record_model.dart';
import '../../data/models/salary_profile_model.dart';
import '../../data/repositories/salary_repository.dart';
import '../../domain/salary_calculator.dart';

class SalaryProvider extends ChangeNotifier {
  final SalaryRepository _salaryRepository;

  SalaryProfileModel _profile = SalaryProfileModel(updatedAt: DateTime.now());
  List<AttendanceRecordModel> _monthlyAttendance = [];
  DateTime _selectedMonth = DateTime(DateTime.now().year, DateTime.now().month);
  SalaryCalculationResult? _calculationResult;
  bool _isLoading = false;

  SalaryProvider({SalaryRepository? salaryRepository})
      : _salaryRepository = salaryRepository ?? SalaryRepository();

  SalaryProfileModel get profile => _profile;
  List<AttendanceRecordModel> get monthlyAttendance => List.unmodifiable(_monthlyAttendance);
  DateTime get selectedMonth => _selectedMonth;
  SalaryCalculationResult? get calculationResult => _calculationResult;
  bool get isLoading => _isLoading;

  Future<void> loadData() async {
    _isLoading = true;
    notifyListeners();

    _profile = await _salaryRepository.getSalaryProfile();
    _monthlyAttendance = await _salaryRepository.getAttendanceForMonth(_selectedMonth);
    _recalculate();

    _isLoading = false;
    notifyListeners();
  }

  void setSelectedMonth(DateTime month) {
    _selectedMonth = DateTime(month.year, month.month);
    loadData();
  }

  void _recalculate() {
    _calculationResult = SalaryCalculator.calculate(
      profile: _profile,
      records: _monthlyAttendance,
      month: _selectedMonth,
    );
  }

  Future<void> updateSalaryProfile({
    required double grossSalary,
    required double fixedDeductions,
    required double monthlyPaidLeaves,
    required int workDaysPerWeek,
    required bool sandwichRuleEnabled,
    required String deductionBasis,
  }) async {
    _profile = _profile.copyWith(
      grossSalary: grossSalary,
      fixedDeductions: fixedDeductions,
      monthlyPaidLeaves: monthlyPaidLeaves,
      workDaysPerWeek: workDaysPerWeek,
      sandwichRuleEnabled: sandwichRuleEnabled,
      deductionBasis: deductionBasis,
      updatedAt: DateTime.now(),
    );

    await _salaryRepository.saveSalaryProfile(_profile);
    _recalculate();
    notifyListeners();
  }

  Future<void> markAttendance({
    required DateTime date,
    required String status,
    String? notes,
  }) async {
    await _salaryRepository.markAttendance(
      date: date,
      status: status,
      notes: notes,
    );

    _monthlyAttendance = await _salaryRepository.getAttendanceForMonth(_selectedMonth);
    _recalculate();
    notifyListeners();
  }

  AttendanceRecordModel? getRecordForDay(int day) {
    final dateString =
        "${_selectedMonth.year}-${_selectedMonth.month.toString().padLeft(2, '0')}-${day.toString().padLeft(2, '0')}";
    try {
      return _monthlyAttendance.firstWhere((r) => r.dateString == dateString);
    } catch (_) {
      return null;
    }
  }

  String getEffectiveStatusForDay(int day) {
    final rec = getRecordForDay(day);
    if (rec != null) return rec.status;

    final date = DateTime(_selectedMonth.year, _selectedMonth.month, day);
    final isWeekend = _profile.workDaysPerWeek == 5
        ? (date.weekday == DateTime.saturday || date.weekday == DateTime.sunday)
        : (date.weekday == DateTime.sunday);

    return isWeekend ? 'weekly_off' : 'full_day';
  }
}
