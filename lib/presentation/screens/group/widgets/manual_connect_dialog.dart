import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../providers/app_state_provider.dart';

class ManualConnectDialog extends StatefulWidget {
  const ManualConnectDialog({super.key});

  @override
  State<ManualConnectDialog> createState() => _ManualConnectDialogState();
}

class _ManualConnectDialogState extends State<ManualConnectDialog> {
  final _ipController = TextEditingController(text: '192.168.');
  final _portController = TextEditingController(text: AppConstants.defaultHttpPort.toString());
  bool _isConnecting = false;

  @override
  void dispose() {
    _ipController.dispose();
    _portController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final activeGroup = appState.activeGroup;

    return AlertDialog(
      title: const Text('Manual Wi-Fi Connect'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Enter your flatmate\'s Wi-Fi IP address shown on their QR pairing screen.',
            style: TextStyle(fontSize: 13, color: Colors.grey),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _ipController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Flatmate IP Address',
              hintText: 'e.g. 192.168.1.45',
              prefixIcon: Icon(Icons.lan_outlined),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _portController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Port',
              hintText: '8089',
              prefixIcon: Icon(Icons.numbers_outlined),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _isConnecting
              ? null
              : () async {
                  final ip = _ipController.text.trim();
                  final port = int.tryParse(_portController.text.trim()) ?? AppConstants.defaultHttpPort;

                  if (ip.isEmpty || activeGroup == null) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Please enter valid IP address')),
                    );
                    return;
                  }

                  setState(() => _isConnecting = true);

                  try {
                    await appState.syncManager.connectToPeerManual(
                      ip: ip,
                      port: port,
                      groupId: activeGroup.id,
                    );
                    if (context.mounted) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Connected to flatmate at $ip:$port!')),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Connection failed: $e')),
                      );
                    }
                  } finally {
                    if (mounted) setState(() => _isConnecting = false);
                  }
                },
          child: _isConnecting
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Connect & Sync'),
        ),
      ],
    );
  }
}
