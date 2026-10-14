import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/currency_formatter.dart';

class BalanceCard extends StatelessWidget {
  final double netBalance;
  final String currency;
  final VoidCallback onSettleTap;

  const BalanceCard({
    super.key,
    required this.netBalance,
    this.currency = '₹',
    required this.onSettleTap,
  });

  @override
  Widget build(BuildContext context) {
    final isPositive = netBalance > 0.01;
    final isNegative = netBalance < -0.01;
    final isSettled = !isPositive && !isNegative;

    final badgeColor = isPositive
        ? AppColors.success
        : isNegative
            ? AppColors.error
            : AppColors.primary;

    final badgeBg = badgeColor.withOpacity(0.12);
    final statusText = isPositive
        ? 'You will receive'
        : isNegative
            ? 'You owe'
            : 'All settled up';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isPositive
              ? [const Color(0xFF059669), const Color(0xFF10B981)]
              : isNegative
                  ? [const Color(0xFFDC2626), const Color(0xFFEF4444)]
                  : [const Color(0xFF0F766E), const Color(0xFF14B8A6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: badgeColor.withOpacity(0.25),
            offset: const Offset(0, 8),
            blurRadius: 16,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    Icon(
                      isPositive
                          ? Icons.arrow_downward_rounded
                          : isNegative
                              ? Icons.arrow_upward_rounded
                              : Icons.check_circle_outline_rounded,
                      color: Colors.white,
                      size: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      statusText,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              InkWell(
                onTap: onSettleTap,
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.handshake_outlined, size: 14, color: badgeColor),
                      const SizedBox(width: 4),
                      Text(
                        'Settle Up',
                        style: TextStyle(
                          color: badgeColor,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            CurrencyFormatter.format(netBalance.abs(), symbol: currency),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            isPositive
                ? 'Your flatmates owe you this amount'
                : isNegative
                    ? 'You need to pay your flatmates'
                    : 'No pending balances for you',
            style: TextStyle(
              color: Colors.white.withOpacity(0.85),
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
