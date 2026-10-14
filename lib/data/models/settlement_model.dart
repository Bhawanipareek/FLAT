class SettlementModel {
  final String id;
  final String groupId;
  final String fromMemberId;
  final String toMemberId;
  final double amount;
  final DateTime settledAt;
  final String paymentMethod; // 'cash', 'upi', 'bank_transfer', 'other'
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isDeleted;

  SettlementModel({
    required this.id,
    required this.groupId,
    required this.fromMemberId,
    required this.toMemberId,
    required this.amount,
    required this.settledAt,
    this.paymentMethod = 'upi',
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    this.isDeleted = false,
  });

  SettlementModel copyWith({
    String? id,
    String? groupId,
    String? fromMemberId,
    String? toMemberId,
    double? amount,
    DateTime? settledAt,
    String? paymentMethod,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isDeleted,
  }) {
    return SettlementModel(
      id: id ?? this.id,
      groupId: groupId ?? this.groupId,
      fromMemberId: fromMemberId ?? this.fromMemberId,
      toMemberId: toMemberId ?? this.toMemberId,
      amount: amount ?? this.amount,
      settledAt: settledAt ?? this.settledAt,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isDeleted: isDeleted ?? this.isDeleted,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'group_id': groupId,
      'from_member_id': fromMemberId,
      'to_member_id': toMemberId,
      'amount': amount,
      'settled_at': settledAt.toIso8601String(),
      'payment_method': paymentMethod,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'is_deleted': isDeleted ? 1 : 0,
    };
  }

  factory SettlementModel.fromMap(Map<String, dynamic> map) {
    return SettlementModel(
      id: map['id'] as String,
      groupId: map['group_id'] as String,
      fromMemberId: map['from_member_id'] as String,
      toMemberId: map['to_member_id'] as String,
      amount: (map['amount'] as num).toDouble(),
      settledAt: DateTime.parse(map['settled_at'] as String),
      paymentMethod: (map['payment_method'] as String?) ?? 'upi',
      notes: map['notes'] as String?,
      createdAt: DateTime.parse(map['created_at'] as String),
      updatedAt: DateTime.parse(map['updated_at'] as String),
      isDeleted: (map['is_deleted'] as int? ?? 0) == 1,
    );
  }

  Map<String, dynamic> toJson() => toMap();

  factory SettlementModel.fromJson(Map<String, dynamic> json) =>
      SettlementModel.fromMap(json);
}
