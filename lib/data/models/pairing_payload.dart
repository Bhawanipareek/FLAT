import 'dart:convert';

class PairingPayload {
  final String protocol;
  final String groupId;
  final String groupName;
  final String currency;
  final String pairingCode;
  final String pairingToken;
  final String hostIp;
  final int port;
  final String senderDeviceId;
  final String senderMemberName;

  static const String currentProtocol = 'flatexpense_p2p_v1';

  PairingPayload({
    this.protocol = currentProtocol,
    required this.groupId,
    required this.groupName,
    this.currency = '₹',
    required this.pairingCode,
    required this.pairingToken,
    required this.hostIp,
    required this.port,
    required this.senderDeviceId,
    required this.senderMemberName,
  });

  Map<String, dynamic> toMap() {
    return {
      'protocol': protocol,
      'group_id': groupId,
      'group_name': groupName,
      'currency': currency,
      'pairing_code': pairingCode,
      'pairing_token': pairingToken,
      'host_ip': hostIp,
      'port': port,
      'sender_device_id': senderDeviceId,
      'sender_member_name': senderMemberName,
    };
  }

  factory PairingPayload.fromMap(Map<String, dynamic> map) {
    return PairingPayload(
      protocol: (map['protocol'] as String?) ?? currentProtocol,
      groupId: map['group_id'] as String,
      groupName: map['group_name'] as String,
      currency: (map['currency'] as String?) ?? '₹',
      pairingCode: map['pairing_code'] as String,
      pairingToken: map['pairing_token'] as String,
      hostIp: map['host_ip'] as String,
      port: (map['port'] as num?)?.toInt() ?? 8089,
      senderDeviceId: map['sender_device_id'] as String,
      senderMemberName: map['sender_member_name'] as String,
    );
  }

  String toQrString() {
    return jsonEncode(toMap());
  }

  static PairingPayload? fromQrString(String qrString) {
    try {
      final decoded = jsonDecode(qrString) as Map<String, dynamic>;
      if (decoded['group_id'] != null && decoded['pairing_token'] != null) {
        return PairingPayload.fromMap(decoded);
      }
    } catch (_) {
      // Invalid format
    }
    return null;
  }
}
