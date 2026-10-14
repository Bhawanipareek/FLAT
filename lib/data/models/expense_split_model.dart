class ExpenseSplitModel {
  final String id;
  final String expenseId;
  final String memberId;
  final double allocatedAmount;
  final double? allocatedPercentage;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isDeleted;

  ExpenseSplitModel({
    required this.id,
    required this.expenseId,
    required this.memberId,
    required this.allocatedAmount,
    this.allocatedPercentage,
    required this.createdAt,
    required this.updatedAt,
    this.isDeleted = false,
  });

  ExpenseSplitModel copyWith({
    String? id,
    String? expenseId,
    String? memberId,
    double? allocatedAmount,
    double? allocatedPercentage,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isDeleted,
  }) {
    return ExpenseSplitModel(
      id: id ?? this.id,
      expenseId: expenseId ?? this.expenseId,
      memberId: memberId ?? this.memberId,
      allocatedAmount: allocatedAmount ?? this.allocatedAmount,
      allocatedPercentage: allocatedPercentage ?? this.allocatedPercentage,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isDeleted: isDeleted ?? this.isDeleted,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'expense_id': expenseId,
      'member_id': memberId,
      'allocated_amount': allocatedAmount,
      'allocated_percentage': allocatedPercentage,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'is_deleted': isDeleted ? 1 : 0,
    };
  }

  factory ExpenseSplitModel.fromMap(Map<String, dynamic> map) {
    return ExpenseSplitModel(
      id: map['id'] as String,
      expenseId: map['expense_id'] as String,
      memberId: map['member_id'] as String,
      allocatedAmount: (map['allocated_amount'] as num).toDouble(),
      allocatedPercentage: (map['allocated_percentage'] as num?)?.toDouble(),
      createdAt: DateTime.parse(map['created_at'] as String),
      updatedAt: DateTime.parse(map['updated_at'] as String),
      isDeleted: (map['is_deleted'] as int? ?? 0) == 1,
    );
  }

  Map<String, dynamic> toJson() => toMap();

  factory ExpenseSplitModel.fromJson(Map<String, dynamic> json) =>
      ExpenseSplitModel.fromMap(json);
}
