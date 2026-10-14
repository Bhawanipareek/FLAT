import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/date_time_utils.dart';
import '../../providers/app_state_provider.dart';
import '../../widgets/member_avatar.dart';
import 'backup_restore_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final syncManager = appState.syncManager;
    final activeGroup = appState.activeGroup;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings & Profile'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile Card
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  MemberAvatar(
                    name: appState.currentUserName ?? 'Me',
                    size: 54,
                    isCurrentUser: true,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          appState.currentUserName ?? 'My Name',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          activeGroup != null
                              ? 'Member in ${activeGroup.name}'
                              : 'No flat group joined',
                          style: const TextStyle(fontSize: 13, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit_outlined),
                    onPressed: () => _showEditProfileDialog(context),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Preferences Section
          const Text(
            'Appearance & Display',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.grey),
          ),
          const SizedBox(height: 8),
          Card(
            margin: EdgeInsets.zero,
            child: SwitchListTile(
              secondary: const Icon(Icons.dark_mode_outlined),
              title: const Text('Dark Mode'),
              subtitle: const Text('Switch between light and dark themes'),
              value: appState.isDarkMode,
              onChanged: (_) => appState.toggleDarkMode(),
            ),
          ),
          const SizedBox(height: 20),

          // Wi-Fi P2P Synchronization Section
          const Text(
            'Local Wi-Fi Synchronization',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.grey),
          ),
          const SizedBox(height: 8),
          Card(
            margin: EdgeInsets.zero,
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.wifi_rounded, color: AppColors.primary),
                  title: const Text('Local Device IP'),
                  subtitle: Text(
                    syncManager.localIp != null
                        ? '${syncManager.localIp}:${syncManager.serverPort}'
                        : 'Wi-Fi not connected',
                  ),
                  trailing: ElevatedButton(
                    onPressed: activeGroup != null
                        ? () => syncManager.syncNow(activeGroup.id)
                        : null,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    child: const Text('Sync Now'),
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.history_rounded),
                  title: const Text('Last Successful Sync'),
                  subtitle: Text(
                    syncManager.lastSyncTime != null
                        ? DateTimeUtils.formatDateTime(syncManager.lastSyncTime!)
                        : 'Never synced',
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.devices_rounded),
                  title: const Text('Paired Flatmate Devices'),
                  subtitle: Text('${syncManager.knownPeers.length} active peers registered'),
                  trailing: TextButton(
                    onPressed: activeGroup != null
                        ? () => syncManager.syncNow(activeGroup.id)
                        : null,
                    child: const Text('Reconnect'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Backup & Data Recovery
          const Text(
            'Data Safety & Portability',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.grey),
          ),
          const SizedBox(height: 8),
          Card(
            margin: EdgeInsets.zero,
            child: ListTile(
              leading: const Icon(Icons.backup_outlined, color: AppColors.primary),
              title: const Text('JSON Backup & Restore'),
              subtitle: const Text('Export or import full flat data offline'),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const BackupRestoreScreen()),
                );
              },
            ),
          ),
          const SizedBox(height: 20),

          // Privacy & Security Guarantee
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.lock_outline_rounded, color: AppColors.primary),
                      SizedBox(width: 8),
                      Text('Privacy Guarantee', style: TextStyle(fontWeight: FontWeight.w700)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Flat Expense Manager is strictly offline-first. Your financial records, grocery lists, and flatmate debts never touch any cloud server, third-party analytics, or external trackers. Data stays on your phone and syncs only directly between phones on your trusted home Wi-Fi network.',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600, height: 1.4),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  void _showEditProfileDialog(BuildContext context) {
    final appState = context.read<AppStateProvider>();
    final nameController = TextEditingController(text: appState.currentUserName);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Your Profile'),
        content: TextField(
          controller: nameController,
          decoration: const InputDecoration(
            labelText: 'Your Name',
            hintText: 'Enter name',
            prefixIcon: Icon(Icons.person_outline),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final newName = nameController.text.trim();
              if (newName.isNotEmpty) {
                await appState.updateProfile(newName);
              }
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
