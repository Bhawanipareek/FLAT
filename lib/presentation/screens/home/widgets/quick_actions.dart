import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';

class QuickActionsBar extends StatelessWidget {
  final VoidCallback onAddExpense;
  final VoidCallback onAddShopping;
  final VoidCallback onAddContribution;
  final VoidCallback onSettleUp;
  final VoidCallback onSyncNow;

  const QuickActionsBar({
    super.key,
    required this.onAddExpense,
    required this.onAddShopping,
    required this.onAddContribution,
    required this.onSettleUp,
    required this.onSyncNow,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _ActionButton(
            label: 'Expense',
            icon: Icons.receipt_long_rounded,
            color: AppColors.primary,
            onTap: onAddExpense,
          ),
          _ActionButton(
            label: 'Shopping',
            icon: Icons.add_shopping_cart_rounded,
            color: const Color(0xFFF59E0B),
            onTap: onAddShopping,
          ),
          _ActionButton(
            label: 'Money In',
            icon: Icons.savings_rounded,
            color: const Color(0xFF0284C7),
            onTap: onAddContribution,
          ),
          _ActionButton(
            label: 'Settle',
            icon: Icons.handshake_rounded,
            color: const Color(0xFF8B5CF6),
            onTap: onSettleUp,
          ),
          _ActionButton(
            label: 'Sync Now',
            icon: Icons.sync_rounded,
            color: const Color(0xFF10B981),
            onTap: onSyncNow,
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ActionButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        child: Column(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withOpacity(isDark ? 0.2 : 0.12),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Icon(icon, color: color, size: 24),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isDark ? AppColors.textSecondaryDark : AppColors.textPrimaryLight,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
