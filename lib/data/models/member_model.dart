class MemberModel {
  final String id;
  final String groupId;
  final String name;
  final String? phone;
  final bool isCurrentUser;
  final String role; // 'admin', 'member'
  final DateTime joinedAt;
  final DateTime updatedAt;
  final bool isDeleted;

  MemberModel({
    required this.id,
    required this.groupId,
    required this.name,
    this.phone,
    this.isCurrentUser = false,
    this.role = 'member',
    required this.joinedAt,
    required this.updatedAt,
    this.isDeleted = false,
  });

  MemberModel copyWith({
    String? id,
    String? groupId,
    String? name,
    String? phone,
    bool? isCurrentUser,
    String? role,
    DateTime? joinedAt,
    DateTime? updatedAt,
    bool? isDeleted,
  }) {
    return MemberModel(
      id: id ?? this.id,
      groupId: groupId ?? this.groupId,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      isCurrentUser: isCurrentUser ?? this.isCurrentUser,
      role: role ?? this.role,
      joinedAt: joinedAt ?? this.joinedAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isDeleted: isDeleted ?? this.isDeleted,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'group_id': groupId,
      'name': name,
      'phone': phone,
      'is_current_user': isCurrentUser ? 1 : 0,
      'role': role,
      'joined_at': joinedAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'is_deleted': isDeleted ? 1 : 0,
    };
  }

  factory MemberModel.fromMap(Map<String, dynamic> map) {
    return MemberModel(
      id: map['id'] as String,
      groupId: map['group_id'] as String,
      name: map['name'] as String,
      phone: map['phone'] as String?,
      isCurrentUser: (map['is_current_user'] as int? ?? 0) == 1,
      role: (map['role'] as String?) ?? 'member',
      joinedAt: DateTime.parse(map['joined_at'] as String),
      updatedAt: DateTime.parse(map['updated_at'] as String),
      isDeleted: (map['is_deleted'] as int? ?? 0) == 1,
    );
  }

  Map<String, dynamic> toJson() => toMap();

  factory MemberModel.fromJson(Map<String, dynamic> json) => MemberModel.fromMap(json);
}
