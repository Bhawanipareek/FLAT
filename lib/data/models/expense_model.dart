import 'expense_split_model.dart';

class ExpenseModel {
  final String id;
  final String groupId;
  final String title;
  final double amount;
  final String category;
  final DateTime purchaseDate;
  final String payerMemberId;
  final String splitMethod; // 'equal', 'custom', 'percentage'
  final String? notes;
  final String? receiptImagePath;
  final String? shoppingItemId;
  final String createdByMemberId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isDeleted;
  final List<ExpenseSplitModel> splits;

  ExpenseModel({
    required this.id,
    required this.groupId,
    required this.title,
    required this.amount,
    required this.category,
    required this.purchaseDate,
    required this.payerMemberId,
    this.splitMethod = 'equal',
    this.notes,
    this.receiptImagePath,
    this.shoppingItemId,
    required this.createdByMemberId,
    required this.createdAt,
    required this.updatedAt,
    this.isDeleted = false,
    this.splits = const [],
  });

  bool get isPersonal => splitMethod == 'personal';

  ExpenseModel copyWith({
    String? id,
    String? groupId,
    String? title,
    double? amount,
    String? category,
    DateTime? purchaseDate,
    String? payerMemberId,
    String? splitMethod,
    String? notes,
    String? receiptImagePath,
    String? shoppingItemId,
    String? createdByMemberId,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isDeleted,
    List<ExpenseSplitModel>? splits,
  }) {
    return ExpenseModel(
      id: id ?? this.id,
      groupId: groupId ?? this.groupId,
      title: title ?? this.title,
      amount: amount ?? this.amount,
      category: category ?? this.category,
      purchaseDate: purchaseDate ?? this.purchaseDate,
      payerMemberId: payerMemberId ?? this.payerMemberId,
      splitMethod: splitMethod ?? this.splitMethod,
      notes: notes ?? this.notes,
      receiptImagePath: receiptImagePath ?? this.receiptImagePath,
      shoppingItemId: shoppingItemId ?? this.shoppingItemId,
      createdByMemberId: createdByMemberId ?? this.createdByMemberId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isDeleted: isDeleted ?? this.isDeleted,
      splits: splits ?? this.splits,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'group_id': groupId,
      'title': title,
      'amount': amount,
      'category': category,
      'purchase_date': purchaseDate.toIso8601String(),
      'payer_member_id': payerMemberId,
      'split_method': splitMethod,
      'notes': notes,
      'receipt_image_path': receiptImagePath,
      'shopping_item_id': shoppingItemId,
      'created_by_member_id': createdByMemberId,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'is_deleted': isDeleted ? 1 : 0,
    };
  }

  factory ExpenseModel.fromMap(Map<String, dynamic> map, {List<ExpenseSplitModel>? splits}) {
    return ExpenseModel(
      id: map['id'] as String,
      groupId: map['group_id'] as String,
      title: map['title'] as String,
      amount: (map['amount'] as num).toDouble(),
      category: map['category'] as String,
      purchaseDate: DateTime.parse(map['purchase_date'] as String),
      payerMemberId: map['payer_member_id'] as String,
      splitMethod: (map['split_method'] as String?) ?? 'equal',
      notes: map['notes'] as String?,
      receiptImagePath: map['receipt_image_path'] as String?,
      shoppingItemId: map['shopping_item_id'] as String?,
      createdByMemberId: map['created_by_member_id'] as String,
      createdAt: DateTime.parse(map['created_at'] as String),
      updatedAt: DateTime.parse(map['updated_at'] as String),
      isDeleted: (map['is_deleted'] as int? ?? 0) == 1,
      splits: splits ?? const [],
    );
  }

  Map<String, dynamic> toJson() {
    final map = toMap();
    map['splits'] = splits.map((s) => s.toJson()).toList();
    return map;
  }

  factory ExpenseModel.fromJson(Map<String, dynamic> json) {
    final splitList = (json['splits'] as List<dynamic>?)
            ?.map((e) => ExpenseSplitModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    return ExpenseModel.fromMap(json, splits: splitList);
  }
}
