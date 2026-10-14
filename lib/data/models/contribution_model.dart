class ContributionModel {
  final String id;
  final String groupId;
  final String title;
  final double amount;
  final DateTime date;
  final String payerMemberId;
  final String? receiverMemberId;
  final String type; // 'flat_fund', 'rent_contribution', 'refund', 'other'
  final String? notes;
  final String status; // 'completed', 'pending'
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isDeleted;

  ContributionModel({
    required this.id,
    required this.groupId,
    required this.title,
    required this.amount,
    required this.date,
    required this.payerMemberId,
    this.receiverMemberId,
    this.type = 'flat_fund',
    this.notes,
    this.status = 'completed',
    required this.createdAt,
    required this.updatedAt,
    this.isDeleted = false,
  });

  ContributionModel copyWith({
    String? id,
    String? groupId,
    String? title,
    double? amount,
    DateTime? date,
    String? payerMemberId,
    String? receiverMemberId,
    String? type,
    String? notes,
    String? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isDeleted,
  }) {
    return ContributionModel(
      id: id ?? this.id,
      groupId: groupId ?? this.groupId,
      title: title ?? this.title,
      amount: amount ?? this.amount,
      date: date ?? this.date,
      payerMemberId: payerMemberId ?? this.payerMemberId,
      receiverMemberId: receiverMemberId ?? this.receiverMemberId,
      type: type ?? this.type,
      notes: notes ?? this.notes,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isDeleted: isDeleted ?? this.isDeleted,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'group_id': groupId,
      'title': title,
      'amount': amount,
      'date': date.toIso8601String(),
      'payer_member_id': payerMemberId,
      'receiver_member_id': receiverMemberId,
      'type': type,
      'notes': notes,
      'status': status,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'is_deleted': isDeleted ? 1 : 0,
    };
  }

  factory ContributionModel.fromMap(Map<String, dynamic> map) {
    return ContributionModel(
      id: map['id'] as String,
      groupId: map['group_id'] as String,
      title: map['title'] as String,
      amount: (map['amount'] as num).toDouble(),
      date: DateTime.parse(map['date'] as String),
      payerMemberId: map['payer_member_id'] as String,
      receiverMemberId: map['receiver_member_id'] as String?,
      type: (map['type'] as String?) ?? 'flat_fund',
      notes: map['notes'] as String?,
      status: (map['status'] as String?) ?? 'completed',
      createdAt: DateTime.parse(map['created_at'] as String),
      updatedAt: DateTime.parse(map['updated_at'] as String),
      isDeleted: (map['is_deleted'] as int? ?? 0) == 1,
    );
  }

  Map<String, dynamic> toJson() => toMap();

  factory ContributionModel.fromJson(Map<String, dynamic> json) =>
      ContributionModel.fromMap(json);
}
