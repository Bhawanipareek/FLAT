import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/currency_formatter.dart';

class BalanceCard extends StatelessWidget {
  final double netBalance;
  final double toReceive;
  final double toPay;
  final double personalSpent;
  final String currency;
  final VoidCallback onSettleTap;

  const BalanceCard({
    super.key,
    required this.netBalance,
    this.toReceive = 0.0,
    this.toPay = 0.0,
    this.personalSpent = 0.0,
    this.currency = '₹',
    required this.onSettleTap,
  });

  @override
  Widget build(BuildContext context) {
    final isPositive = netBalance > 0.01;
    final isNegative = netBalance < -0.01;

    final badgeColor = isPositive
        ? AppColors.success
        : isNegative
            ? AppColors.error
            : AppColors.primary;

    final statusText = isPositive
        ? 'Total: You will receive (Aana Hai)'
        : isNegative
            ? 'Total: You owe (Dena Hai)'
            : 'All settled up';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isPositive
              ? [const Color(0xFF047857), const Color(0xFF10B981)]
              : isNegative
                  ? [const Color(0xFFB91C1C), const Color(0xFFEF4444)]
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
                        'Hisab Chukta',
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
          const SizedBox(height: 12),
          Text(
            (netBalance >= 0 ? '+ ' : '- ') +
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
                ? 'Flatmates se itna paisa aana hai'
                : isNegative
                    ? 'Flatmates ko itna paisa dena hai'
                    : 'Hisab barabar hai',
            style: TextStyle(
              color: Colors.white.withOpacity(0.9),
              fontSize: 13,
            ),
          ),
          const Divider(color: Colors.white24, height: 24),
          // 3-way breakdown: Kitna Aana Hai | Kitna Jana Hai | Personal Kharcha
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _MiniMetric(
                label: 'Kitna Aana H',
                amount: toReceive,
                currency: currency,
                color: Colors.white,
                prefix: '+',
              ),
              _MiniMetric(
                label: 'Kitna Jana H',
                amount: toPay,
                currency: currency,
                color: Colors.yellowAccent,
                prefix: '-',
              ),
              _MiniMetric(
                label: 'Niji Kharcha',
                amount: personalSpent,
                currency: currency,
                color: Colors.white70,
                prefix: '',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniMetric extends StatelessWidget {
  final String label;
  final double amount;
  final String currency;
  final Color color;
  final String prefix;

  const _MiniMetric({
    required this.label,
    required this.amount,
    required this.currency,
    required this.color,
    required this.prefix,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.white70),
        ),
        const SizedBox(height: 2),
        Text(
          amount > 0
              ? '$prefix${CurrencyFormatter.format(amount, symbol: currency)}'
              : '$currency 0',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ],
    );
  }
}
