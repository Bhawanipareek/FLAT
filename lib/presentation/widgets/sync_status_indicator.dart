import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/date_time_utils.dart';
import '../../sync/sync_models.dart';

class SyncStatusIndicator extends StatelessWidget {
  final SyncStatus status;
  final String? statusMessage;
  final DateTime? lastSyncTime;
  final VoidCallback? onSyncTap;

  const SyncStatusIndicator({
    super.key,
    required this.status,
    this.statusMessage,
    this.lastSyncTime,
    this.onSyncTap,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label;
    IconData icon;

    switch (status) {
      case SyncStatus.connected:
        bg = AppColors.primaryContainer;
        fg = AppColors.onPrimaryContainer;
        label = 'Connected';
        icon = Icons.wifi_rounded;
        break;
      case SyncStatus.syncing:
        bg = const Color(0xFFDBEAFE);
        fg = const Color(0xFF1E40AF);
        label = 'Syncing...';
        icon = Icons.sync_rounded;
        break;
      case SyncStatus.offline:
        bg = const Color(0xFFF3F4F6);
        fg = const Color(0xFF4B5563);
        label = 'Offline';
        icon = Icons.wifi_off_rounded;
        break;
      case SyncStatus.syncFailed:
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFF991B1B);
        label = 'Sync Failed';
        icon = Icons.error_outline_rounded;
        break;
    }

    return InkWell(
      onTap: onSyncTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: fg.withOpacity(0.2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            status == SyncStatus.syncing
                ? SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(fg),
                    ),
                  )
                : Icon(icon, size: 14, color: fg),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: fg,
              ),
            ),
            if (lastSyncTime != null && status == SyncStatus.connected) ...[
              const SizedBox(width: 4),
              Text(
                '• ${DateTimeUtils.formatRelative(lastSyncTime!)}',
                style: TextStyle(fontSize: 11, color: fg.withOpacity(0.8)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
