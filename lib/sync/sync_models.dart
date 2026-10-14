import '../data/models/sync_log_model.dart';

enum SyncStatus {
  connected,
  syncing,
  offline,
  syncFailed,
}

class PeerDeviceInfo {
  final String ip;
  final int port;
  final String deviceId;
  final String memberName;
  final DateTime lastSeen;

  PeerDeviceInfo({
    required this.ip,
    required this.port,
    required this.deviceId,
    required this.memberName,
    required this.lastSeen,
  });

  PeerDeviceInfo copyWith({
    String? ip,
    int? port,
    String? deviceId,
    String? memberName,
    DateTime? lastSeen,
  }) {
    return PeerDeviceInfo(
      ip: ip ?? this.ip,
      port: port ?? this.port,
      deviceId: deviceId ?? this.deviceId,
      memberName: memberName ?? this.memberName,
      lastSeen: lastSeen ?? this.lastSeen,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'ip': ip,
      'port': port,
      'device_id': deviceId,
      'member_name': memberName,
      'last_seen': lastSeen.toIso8601String(),
    };
  }

  factory PeerDeviceInfo.fromMap(Map<String, dynamic> map) {
    return PeerDeviceInfo(
      ip: map['ip'] as String,
      port: (map['port'] as num?)?.toInt() ?? 8089,
      deviceId: map['device_id'] as String,
      memberName: map['member_name'] as String,
      lastSeen: DateTime.parse(map['last_seen'] as String),
    );
  }
}

class SyncPushRequest {
  final String groupId;
  final String pairingToken;
  final String senderDeviceId;
  final String senderMemberId;
  final List<SyncLogModel> logs;

  SyncPushRequest({
    required this.groupId,
    required this.pairingToken,
    required this.senderDeviceId,
    required this.senderMemberId,
    required this.logs,
  });

  Map<String, dynamic> toMap() {
    return {
      'group_id': groupId,
      'pairing_token': pairingToken,
      'sender_device_id': senderDeviceId,
      'sender_member_id': senderMemberId,
      'logs': logs.map((l) => l.toMap()).toList(),
    };
  }

  factory SyncPushRequest.fromMap(Map<String, dynamic> map) {
    final list = (map['logs'] as List<dynamic>?) ?? [];
    return SyncPushRequest(
      groupId: map['group_id'] as String,
      pairingToken: map['pairing_token'] as String,
      senderDeviceId: map['sender_device_id'] as String,
      senderMemberId: map['sender_member_id'] as String,
      logs: list.map((item) => SyncLogModel.fromMap(item as Map<String, dynamic>)).toList(),
    );
  }
}

class SyncPullRequest {
  final String groupId;
  final String pairingToken;
  final DateTime? sinceTimestamp;

  SyncPullRequest({
    required this.groupId,
    required this.pairingToken,
    this.sinceTimestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'group_id': groupId,
      'pairing_token': pairingToken,
      'since_timestamp': sinceTimestamp?.toIso8601String(),
    };
  }

  factory SyncPullRequest.fromMap(Map<String, dynamic> map) {
    return SyncPullRequest(
      groupId: map['group_id'] as String,
      pairingToken: map['pairing_token'] as String,
      sinceTimestamp: map['since_timestamp'] != null
          ? DateTime.tryParse(map['since_timestamp'] as String)
          : null,
    );
  }
}
