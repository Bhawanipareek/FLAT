class SalaryProfileModel {
  final String id;
  final double grossSalary;
  final double fixedDeductions;
  final double monthlyPaidLeaves;
  final int workDaysPerWeek; // 5 (Mon-Fri) or 6 (Mon-Sat)
  final bool sandwichRuleEnabled;
  final String deductionBasis; // 'calendar_days' (30/31) or 'working_days'
  final DateTime updatedAt;

  SalaryProfileModel({
    this.id = 'default_profile',
    this.grossSalary = 0.0,
    this.fixedDeductions = 0.0,
    this.monthlyPaidLeaves = 1.5,
    this.workDaysPerWeek = 5,
    this.sandwichRuleEnabled = true,
    this.deductionBasis = 'calendar_days',
    required this.updatedAt,
  });

  SalaryProfileModel copyWith({
    String? id,
    double? grossSalary,
    double? fixedDeductions,
    double? monthlyPaidLeaves,
    int? workDaysPerWeek,
    bool? sandwichRuleEnabled,
    String? deductionBasis,
    DateTime? updatedAt,
  }) {
    return SalaryProfileModel(
      id: id ?? this.id,
      grossSalary: grossSalary ?? this.grossSalary,
      fixedDeductions: fixedDeductions ?? this.fixedDeductions,
      monthlyPaidLeaves: monthlyPaidLeaves ?? this.monthlyPaidLeaves,
      workDaysPerWeek: workDaysPerWeek ?? this.workDaysPerWeek,
      sandwichRuleEnabled: sandwichRuleEnabled ?? this.sandwichRuleEnabled,
      deductionBasis: deductionBasis ?? this.deductionBasis,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'gross_salary': grossSalary,
      'fixed_deductions': fixedDeductions,
      'monthly_paid_leaves': monthlyPaidLeaves,
      'work_days_per_week': workDaysPerWeek,
      'sandwich_rule_enabled': sandwichRuleEnabled ? 1 : 0,
      'deduction_basis': deductionBasis,
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  factory SalaryProfileModel.fromMap(Map<String, dynamic> map) {
    return SalaryProfileModel(
      id: map['id'] as String? ?? 'default_profile',
      grossSalary: (map['gross_salary'] as num?)?.toDouble() ?? 0.0,
      fixedDeductions: (map['fixed_deductions'] as num?)?.toDouble() ?? 0.0,
      monthlyPaidLeaves: (map['monthly_paid_leaves'] as num?)?.toDouble() ?? 1.5,
      workDaysPerWeek: map['work_days_per_week'] as int? ?? 5,
      sandwichRuleEnabled: (map['sandwich_rule_enabled'] as int? ?? 1) == 1,
      deductionBasis: map['deduction_basis'] as String? ?? 'calendar_days',
      updatedAt: map['updated_at'] != null
          ? DateTime.parse(map['updated_at'] as String)
          : DateTime.now(),
    );
  }
}
