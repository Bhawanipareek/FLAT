class GroupModel {
  final String id;
  final String name;
  final String currency;
  final String currencyCode;
  final String pairingCode;
  final String pairingSecret;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isDeleted;

  GroupModel({
    required this.id,
    required this.name,
    this.currency = '₹',
    this.currencyCode = 'INR',
    required this.pairingCode,
    required this.pairingSecret,
    required this.createdAt,
    required this.updatedAt,
    this.isDeleted = false,
  });

  GroupModel copyWith({
    String? id,
    String? name,
    String? currency,
    String? currencyCode,
    String? pairingCode,
    String? pairingSecret,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isDeleted,
  }) {
    return GroupModel(
      id: id ?? this.id,
      name: name ?? this.name,
      currency: currency ?? this.currency,
      currencyCode: currencyCode ?? this.currencyCode,
      pairingCode: pairingCode ?? this.pairingCode,
      pairingSecret: pairingSecret ?? this.pairingSecret,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isDeleted: isDeleted ?? this.isDeleted,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'currency': currency,
      'currency_code': currencyCode,
      'pairing_code': pairingCode,
      'pairing_secret': pairingSecret,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'is_deleted': isDeleted ? 1 : 0,
    };
  }

  factory GroupModel.fromMap(Map<String, dynamic> map) {
    return GroupModel(
      id: map['id'] as String,
      name: map['name'] as String,
      currency: (map['currency'] as String?) ?? '₹',
      currencyCode: (map['currency_code'] as String?) ?? 'INR',
      pairingCode: map['pairing_code'] as String,
      pairingSecret: map['pairing_secret'] as String,
      createdAt: DateTime.parse(map['created_at'] as String),
      updatedAt: DateTime.parse(map['updated_at'] as String),
      isDeleted: (map['is_deleted'] as int? ?? 0) == 1,
    );
  }

  Map<String, dynamic> toJson() => toMap();

  factory GroupModel.fromJson(Map<String, dynamic> json) => GroupModel.fromMap(json);
}
