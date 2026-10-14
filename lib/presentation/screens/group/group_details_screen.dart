import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/date_time_utils.dart';
import '../../providers/app_state_provider.dart';
import '../../widgets/member_avatar.dart';
import '../../widgets/sync_status_indicator.dart';
import '../settings/settings_screen.dart';
import 'create_group_screen.dart';
import 'qr_scan_screen.dart';
import 'qr_share_screen.dart';
import 'widgets/manual_connect_dialog.dart';

class GroupDetailsScreen extends StatelessWidget {
  const GroupDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final activeGroup = appState.activeGroup;
    final syncManager = appState.syncManager;

    if (activeGroup == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Flat Group')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('No group joined'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CreateGroupScreen()),
                  );
                },
                child: const Text('Create Group'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Flat & Members'),
        actions: [
          IconButton(
            tooltip: 'Sync Now',
            icon: const Icon(Icons.sync_rounded),
            onPressed: () => syncManager.syncNow(activeGroup.id),
          ),
          IconButton(
            tooltip: 'Settings & Profile',
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              );
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Group Summary Card
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppColors.primaryContainer,
                      shape: BoxShape.circle,
                    ),
                    child: const Center(
                      child: Icon(Icons.apartment_rounded, size: 36, color: AppColors.primary),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    activeGroup.name,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Pairing Code: ${activeGroup.pairingCode} • Currency: ${activeGroup.currency} (${activeGroup.currencyCode})',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 16),
                  AnimatedBuilder(
                    animation: syncManager,
                    builder: (context, _) {
                      return SyncStatusIndicator(
                        status: syncManager.status,
                        statusMessage: syncManager.statusMessage,
                        lastSyncTime: syncManager.lastSyncTime,
                        onSyncTap: () => syncManager.syncNow(activeGroup.id),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => QrShareScreen(group: activeGroup)),
                    );
                  },
                  icon: const Icon(Icons.qr_code_rounded),
                  label: const Text('Pair Flatmate'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const QrScanScreen()),
                    );
                  },
                  icon: const Icon(Icons.qr_code_scanner_rounded),
                  label: const Text('Scan QR'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Authorized Group Members Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Authorized Flatmates (${appState.members.length})',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
              TextButton.icon(
                onPressed: () => _showAddMemberDialog(context),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Add Member'),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Member List
          Card(
            margin: EdgeInsets.zero,
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: appState.members.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final member = appState.members[index];
                return ListTile(
                  leading: MemberAvatar(
                    name: member.name,
                    isCurrentUser: member.isCurrentUser,
                  ),
                  title: Row(
                    children: [
                      Text(
                        member.name,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      if (member.isCurrentUser) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primaryContainer,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'YOU',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: AppColors.onPrimaryContainer,
                            ),
                          ),
                        ),
                      ],
                      if (member.role == 'admin') ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'ADMIN',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF92400E),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  subtitle: Text(
                    member.phone != null && member.phone!.isNotEmpty
                        ? '${member.phone} • Joined ${DateTimeUtils.formatShortDate(member.joinedAt)}'
                        : 'Joined ${DateTimeUtils.formatShortDate(member.joinedAt)}',
                    style: const TextStyle(fontSize: 12),
                  ),
                  trailing: member.isCurrentUser
                      ? null
                      : IconButton(
                          icon: const Icon(Icons.more_vert_rounded),
                          onPressed: () {
                            // Options
                          },
                        ),
                );
              },
            ),
          ),
          const SizedBox(height: 24),

          // Network & Direct Sync Details
          Card(
            margin: EdgeInsets.zero,
            child: ListTile(
              leading: const Icon(Icons.wifi_tethering_rounded, color: AppColors.primary),
              title: const Text('Wi-Fi Sync Server Info'),
              subtitle: Text(
                syncManager.localIp != null
                    ? 'Listening on ${syncManager.localIp}:${syncManager.serverPort}'
                    : 'Not connected to Wi-Fi. Offline local mode.',
                style: const TextStyle(fontSize: 12),
              ),
              trailing: TextButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (_) => const ManualConnectDialog(),
                  );
                },
                child: const Text('Manual IP'),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showAddMemberDialog(BuildContext context) {
    final appState = context.read<AppStateProvider>();
    final nameController = TextEditingController();
    final phoneController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Flatmate Manually'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Add a flatmate to split expenses with. They can also scan your QR code later to link their phone.',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: 'Name',
                hintText: 'e.g. Rahul, Priya, Alex',
                prefixIcon: Icon(Icons.person_outline),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Phone (Optional)',
                prefixIcon: Icon(Icons.phone_outlined),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final name = nameController.text.trim();
              if (name.isEmpty) return;

              await appState.addMember(
                name: name,
                phone: phoneController.text.trim().isEmpty ? null : phoneController.text.trim(),
              );

              if (ctx.mounted) {
                Navigator.pop(ctx);
              }
            },
            child: const Text('Add Member'),
          ),
        ],
      ),
    );
  }
}
