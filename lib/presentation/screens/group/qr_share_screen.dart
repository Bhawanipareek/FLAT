import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/models/group_model.dart';
import '../../../data/models/pairing_payload.dart';
import '../../providers/app_state_provider.dart';

class QrShareScreen extends StatelessWidget {
  final GroupModel group;

  const QrShareScreen({super.key, required this.group});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final syncManager = appState.syncManager;

    final hostIp = syncManager.localIp ?? '127.0.0.1';
    final port = syncManager.serverPort;

    final payload = PairingPayload(
      groupId: group.id,
      groupName: group.name,
      currency: group.currency,
      pairingCode: group.pairingCode,
      pairingToken: group.pairingSecret,
      hostIp: hostIp,
      port: port,
      senderDeviceId: appState.currentUserId ?? 'device_1',
      senderMemberName: appState.currentUserName ?? 'Roommate',
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pair Flatmate Device'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primaryContainer.withOpacity(0.5),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.wifi_rounded, color: AppColors.primary, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Both phones must be connected to the same Wi-Fi network: ${hostIp != '127.0.0.1' ? '(Device IP: $hostIp)' : '(Not connected to Wi-Fi)'}',
                    style: const TextStyle(fontSize: 13, color: AppColors.onPrimaryContainer),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // QR Code Card
          Center(
            child: Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    QrImageView(
                      data: payload.toQrString(),
                      version: QrVersions.auto,
                      size: 240.0,
                      eyeStyle: const QrEyeStyle(
                        eyeShape: QrEyeShape.square,
                        color: AppColors.primary,
                      ),
                      dataModuleStyle: const QrDataModuleStyle(
                        dataModuleShape: QrDataModuleShape.square,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      group.name,
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Pairing Code: ${group.pairingCode}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                        letterSpacing: 2,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Instructions
          const Text(
            'How to Pair:',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          const _StepRow(
            number: '1',
            text: 'Ensure your flatmate is connected to this same Wi-Fi network.',
          ),
          const _StepRow(
            number: '2',
            text: 'Ask them to install & open Flat Expense Manager.',
          ),
          const _StepRow(
            number: '3',
            text: 'They tap "Scan QR" and point their camera at this code.',
          ),
          const _StepRow(
            number: '4',
            text: 'Once paired, all expenses & shopping updates sync directly between your phones!',
          ),
          const SizedBox(height: 24),

          // Network details accordion
          Card(
            margin: EdgeInsets.zero,
            child: ExpansionTile(
              leading: const Icon(Icons.info_outline_rounded),
              title: const Text('Manual Connection Details'),
              subtitle: const Text('Use if camera is unavailable or router isolates clients'),
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _DetailRow(label: 'Host IP Address', value: hostIp),
                      _DetailRow(label: 'HTTP Sync Port', value: port.toString()),
                      _DetailRow(label: 'Group ID', value: group.id),
                      _DetailRow(label: 'Pairing Code', value: group.pairingCode),
                      const SizedBox(height: 8),
                      const Text(
                        'Note: If your Wi-Fi router blocks device-to-device communication (client isolation), you can use the JSON Backup & Restore feature in Settings.',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StepRow extends StatelessWidget {
  final String number;
  final String text;

  const _StepRow({required this.number, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 20,
            height: 20,
            decoration: BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                number,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text, style: const TextStyle(fontSize: 13)),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
