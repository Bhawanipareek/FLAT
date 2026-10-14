import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/services/backup_restore_service.dart';
import '../../providers/app_state_provider.dart';
import '../../providers/contributions_provider.dart';
import '../../providers/expenses_provider.dart';
import '../../providers/settlement_provider.dart';
import '../../providers/shopping_provider.dart';

class BackupRestoreScreen extends StatefulWidget {
  const BackupRestoreScreen({super.key});

  @override
  State<BackupRestoreScreen> createState() => _BackupRestoreScreenState();
}

class _BackupRestoreScreenState extends State<BackupRestoreScreen> {
  final BackupRestoreService _backupService = BackupRestoreService();
  bool _isExporting = false;
  bool _isImporting = false;

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final activeGroup = appState.activeGroup;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Backup & Data Recovery'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primaryContainer.withOpacity(0.5),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Row(
              children: [
                Icon(Icons.shield_outlined, color: AppColors.primary, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'All flat data is stored 100% locally on this phone. Use JSON backups to transfer data if Wi-Fi router isolation blocks direct sync.',
                    style: TextStyle(fontSize: 13, color: AppColors.onPrimaryContainer),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Export Card
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.file_upload_outlined, color: AppColors.primary),
                      SizedBox(width: 8),
                      Text('Export JSON Backup', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Export all groups, members, expenses, shopping items, and settlement records to a standard JSON file. You can share it with flatmates via WhatsApp, Nearby Share, or Email.',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: (_isExporting || activeGroup == null)
                        ? null
                        : () async {
                            setState(() => _isExporting = true);
                            try {
                              await _backupService.exportBackupJson(
                                activeGroup.id,
                                activeGroup.name,
                              );
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Export failed: $e')),
                                );
                              }
                            } finally {
                              if (mounted) setState(() => _isExporting = false);
                            }
                          },
                    icon: _isExporting
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.share_rounded),
                    label: const Text('Export & Share Backup'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Import Card
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.file_download_outlined, color: AppColors.secondary),
                      SizedBox(width: 8),
                      Text('Import JSON Backup', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Import a JSON file generated by your flatmate or an earlier backup. Existing records will be updated idempotently without losing newer edits.',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: _isImporting
                        ? null
                        : () async {
                            final confirm = await showDialog<bool>(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                title: const Text('Import Backup File?'),
                                content: const Text(
                                  'This will import records from the selected JSON backup into your local SQLite database.',
                                ),
                                actions: [
                                  TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                                  ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Select File')),
                                ],
                              ),
                            );

                            if (confirm != true) return;

                            setState(() => _isImporting = true);
                            try {
                              final currentUserId = appState.currentUserId ?? 'user_1';
                              final success = await _backupService.importBackupJson(currentUserId: currentUserId);

                              if (success && mounted) {
                                await appState.initialize();
                                final expensesProv = context.read<ExpensesProvider>();
                                final shoppingProv = context.read<ShoppingProvider>();
                                final contribProv = context.read<ContributionsProvider>();
                                final settlementProv = context.read<SettlementProvider>();

                                if (appState.activeGroup != null) {
                                  await expensesProv.loadExpenses(appState.activeGroup!.id);
                                  await shoppingProv.loadItems(appState.activeGroup!.id);
                                  await contribProv.loadContributions(appState.activeGroup!.id);
                                  await settlementProv.recalculate(appState.activeGroup!.id, currentUserId);
                                }

                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Backup restored successfully!')),
                                );
                              }
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Import failed: $e')),
                                );
                              }
                            } finally {
                              if (mounted) setState(() => _isImporting = false);
                            }
                          },
                    icon: _isImporting
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.folder_open_rounded),
                    label: const Text('Choose JSON File to Restore'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Router Isolation Info
          Card(
            margin: EdgeInsets.zero,
            child: ExpansionTile(
              leading: const Icon(Icons.help_outline_rounded),
              title: const Text('Router Isolation Troubleshooting'),
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Text(
                    'Some college/hostel Wi-Fi routers enable "AP Client Isolation", which blocks phones on the same Wi-Fi from talking directly to each other.\n\n'
                    'Solutions:\n'
                    '1. Connect both phones to a mobile Wi-Fi hotspot created by one flatmate\'s phone.\n'
                    '2. Or use the "Export JSON Backup" button above to send a backup file to your flatmate via WhatsApp or Nearby Share.',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade700, height: 1.4),
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
