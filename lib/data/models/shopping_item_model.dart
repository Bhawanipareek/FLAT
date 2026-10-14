class ShoppingItemModel {
  final String id;
  final String groupId;
  final String name;
  final double quantity;
  final String unit;
  final double estimatedPrice;
  final double? actualPrice;
  final String priority; // 'low', 'medium', 'high'
  final String? assignedMemberId;
  final String addedByMemberId;
  final DateTime? dueDate;
  final String status; // 'needed', 'assigned', 'purchased', 'cancelled'
  final String? convertedExpenseId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isDeleted;

  ShoppingItemModel({
    required this.id,
    required this.groupId,
    required this.name,
    this.quantity = 1.0,
    this.unit = 'unit',
    this.estimatedPrice = 0.0,
    this.actualPrice,
    this.priority = 'medium',
    this.assignedMemberId,
    required this.addedByMemberId,
    this.dueDate,
    this.status = 'needed',
    this.convertedExpenseId,
    required this.createdAt,
    required this.updatedAt,
    this.isDeleted = false,
  });

  ShoppingItemModel copyWith({
    String? id,
    String? groupId,
    String? name,
    double? quantity,
    String? unit,
    double? estimatedPrice,
    double? actualPrice,
    String? priority,
    String? assignedMemberId,
    String? addedByMemberId,
    DateTime? dueDate,
    String? status,
    String? convertedExpenseId,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isDeleted,
  }) {
    return ShoppingItemModel(
      id: id ?? this.id,
      groupId: groupId ?? this.groupId,
      name: name ?? this.name,
      quantity: quantity ?? this.quantity,
      unit: unit ?? this.unit,
      estimatedPrice: estimatedPrice ?? this.estimatedPrice,
      actualPrice: actualPrice ?? this.actualPrice,
      priority: priority ?? this.priority,
      assignedMemberId: assignedMemberId ?? this.assignedMemberId,
      addedByMemberId: addedByMemberId ?? this.addedByMemberId,
      dueDate: dueDate ?? this.dueDate,
      status: status ?? this.status,
      convertedExpenseId: convertedExpenseId ?? this.convertedExpenseId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isDeleted: isDeleted ?? this.isDeleted,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'group_id': groupId,
      'name': name,
      'quantity': quantity,
      'unit': unit,
      'estimated_price': estimatedPrice,
      'actual_price': actualPrice,
      'priority': priority,
      'assigned_member_id': assignedMemberId,
      'added_by_member_id': addedByMemberId,
      'due_date': dueDate?.toIso8601String(),
      'status': status,
      'converted_expense_id': convertedExpenseId,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'is_deleted': isDeleted ? 1 : 0,
    };
  }

  factory ShoppingItemModel.fromMap(Map<String, dynamic> map) {
    return ShoppingItemModel(
      id: map['id'] as String,
      groupId: map['group_id'] as String,
      name: map['name'] as String,
      quantity: (map['quantity'] as num?)?.toDouble() ?? 1.0,
      unit: (map['unit'] as String?) ?? 'unit',
      estimatedPrice: (map['estimated_price'] as num?)?.toDouble() ?? 0.0,
      actualPrice: (map['actual_price'] as num?)?.toDouble(),
      priority: (map['priority'] as String?) ?? 'medium',
      assignedMemberId: map['assigned_member_id'] as String?,
      addedByMemberId: map['added_by_member_id'] as String,
      dueDate: map['due_date'] != null ? DateTime.parse(map['due_date'] as String) : null,
      status: (map['status'] as String?) ?? 'needed',
      convertedExpenseId: map['converted_expense_id'] as String?,
      createdAt: DateTime.parse(map['created_at'] as String),
      updatedAt: DateTime.parse(map['updated_at'] as String),
      isDeleted: (map['is_deleted'] as int? ?? 0) == 1,
    );
  }

  Map<String, dynamic> toJson() => toMap();

  factory ShoppingItemModel.fromJson(Map<String, dynamic> json) =>
      ShoppingItemModel.fromMap(json);
}
