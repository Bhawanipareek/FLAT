class SyncLogModel {
  final String id;
  final String groupId;
  final String entityType;
  final String entityId;
  final String operation; // 'insert', 'update', 'delete'
  final String payloadJson;
  final DateTime timestamp;
  final bool syncedWithPeers;

  SyncLogModel({
    required this.id,
    required this.groupId,
    required this.entityType,
    required this.entityId,
    required this.operation,
    required this.payloadJson,
    required this.timestamp,
    this.syncedWithPeers = false,
  });

  SyncLogModel copyWith({
    String? id,
    String? groupId,
    String? entityType,
    String? entityId,
    String? operation,
    String? payloadJson,
    DateTime? timestamp,
    bool? syncedWithPeers,
  }) {
    return SyncLogModel(
      id: id ?? this.id,
      groupId: groupId ?? this.groupId,
      entityType: entityType ?? this.entityType,
      entityId: entityId ?? this.entityId,
      operation: operation ?? this.operation,
      payloadJson: payloadJson ?? this.payloadJson,
      timestamp: timestamp ?? this.timestamp,
      syncedWithPeers: syncedWithPeers ?? this.syncedWithPeers,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'group_id': groupId,
      'entity_type': entityType,
      'entity_id': entityId,
      'operation': operation,
      'payload_json': payloadJson,
      'timestamp': timestamp.toIso8601String(),
      'synced_with_peers': syncedWithPeers ? 1 : 0,
    };
  }

  factory SyncLogModel.fromMap(Map<String, dynamic> map) {
    return SyncLogModel(
      id: map['id'] as String,
      groupId: map['group_id'] as String,
      entityType: map['entity_type'] as String,
      entityId: map['entity_id'] as String,
      operation: map['operation'] as String,
      payloadJson: map['payload_json'] as String,
      timestamp: DateTime.parse(map['timestamp'] as String),
      syncedWithPeers: (map['synced_with_peers'] as int? ?? 0) == 1,
    );
  }

  Map<String, dynamic> toJson() => toMap();

  factory SyncLogModel.fromJson(Map<String, dynamic> json) =>
      SyncLogModel.fromMap(json);
}
