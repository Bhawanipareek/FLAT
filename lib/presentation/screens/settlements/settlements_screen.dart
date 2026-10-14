import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_time_utils.dart';
import '../../../data/models/member_model.dart';
import '../../providers/app_state_provider.dart';
import '../../providers/settlement_provider.dart';
import '../../widgets/member_avatar.dart';

class SettlementsScreen extends StatelessWidget {
  const SettlementsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final settlementProv = context.watch<SettlementProvider>();
    final activeGroup = appState.activeGroup;

    if (activeGroup == null) {
      return const Scaffold(
        body: Center(child: Text('No active group')),
      );
    }

    final currency = activeGroup.currency;
    final currentUserId = appState.currentUserId ?? '';
    final result = settlementProv.calculationResult;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settlements & Balances'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => settlementProv.recalculate(activeGroup.id, currentUserId),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => settlementProv.recalculate(activeGroup.id, currentUserId),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Suggested Minimal Debt Transfers
            const Text(
              'Suggested Debt Clearances',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            Text(
              'Simplified transfers to clear all flat debts with minimum payments',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 12),

            if (result == null || result.suggestedTransfers.isEmpty)
              Card(
                margin: EdgeInsets.zero,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle_outline_rounded, color: AppColors.success, size: 32),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Everyone is settled up!',
                              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                            ),
                            Text(
                              'No pending payments between flatmates.',
                              style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              ...result.suggestedTransfers.map((transfer) {
                final debtor = appState.members.firstWhere(
                  (m) => m.id == transfer.fromMemberId,
                  orElse: () => MemberModel(
                    id: transfer.fromMemberId,
                    groupId: activeGroup.id,
                    name: 'Flatmate',
                    joinedAt: DateTime.now(),
                    updatedAt: DateTime.now(),
                  ),
                );
                final creditor = appState.members.firstWhere(
                  (m) => m.id == transfer.toMemberId,
                  orElse: () => MemberModel(
                    id: transfer.toMemberId,
                    groupId: activeGroup.id,
                    name: 'Flatmate',
                    joinedAt: DateTime.now(),
                    updatedAt: DateTime.now(),
                  ),
                );

                final isDebtorMe = debtor.id == currentUserId;
                final isCreditorMe = creditor.id == currentUserId;

                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        MemberAvatar(name: debtor.name, isCurrentUser: isDebtorMe),
                        const SizedBox(width: 8),
                        const Icon(Icons.arrow_forward_rounded, size: 16, color: Colors.grey),
                        const SizedBox(width: 8),
                        MemberAvatar(name: creditor.name, isCurrentUser: isCreditorMe),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${isDebtorMe ? 'You owe' : debtor.name} owes ${isCreditorMe ? 'you' : creditor.name}',
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                              ),
                              Text(
                                CurrencyFormatter.format(transfer.amount, symbol: currency),
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          onPressed: () => _showRecordSettlementDialog(
                            context,
                            debtorId: debtor.id,
                            creditorId: creditor.id,
                            suggestedAmount: transfer.amount,
                          ),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          ),
                          child: const Text('Settle'),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            const SizedBox(height: 24),

            // Individual Member Balances
            const Text(
              'Member Balances',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Card(
              margin: EdgeInsets.zero,
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: appState.members.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final member = appState.members[index];
                  final bal = result?.memberBalances[member.id] ?? 0.0;
                  final isOwed = bal > 0.01;
                  final isOwing = bal < -0.01;

                  return ListTile(
                    leading: MemberAvatar(
                      name: member.name,
                      isCurrentUser: member.isCurrentUser,
                    ),
                    title: Text(member.isCurrentUser ? '${member.name} (You)' : member.name),
                    subtitle: Text(
                      isOwed
                          ? 'Gets back ${CurrencyFormatter.format(bal, symbol: currency)}'
                          : isOwing
                              ? 'Owes ${CurrencyFormatter.format(bal.abs(), symbol: currency)}'
                              : 'Settled',
                      style: TextStyle(
                        color: isOwed
                            ? AppColors.success
                            : isOwing
                                ? AppColors.error
                                : Colors.grey,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                    trailing: Text(
                      isOwed
                          ? '+ ${CurrencyFormatter.format(bal, symbol: currency)}'
                          : isOwing
                              ? '- ${CurrencyFormatter.format(bal.abs(), symbol: currency)}'
                              : '0.00',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: isOwed
                            ? AppColors.success
                            : isOwing
                                ? AppColors.error
                                : Colors.grey,
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 24),

            // Settlement History
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Settlement History',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
                TextButton(
                  onPressed: () => _showRecordSettlementDialog(context),
                  child: const Text('+ Record Settlement'),
                ),
              ],
            ),
            const SizedBox(height: 8),

            if (settlementProv.settlements.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Center(
                  child: Text(
                    'No settlements recorded yet.',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                  ),
                ),
              )
            else
              ...settlementProv.settlements.map((s) {
                final fromMember = appState.members.firstWhere(
                  (m) => m.id == s.fromMemberId,
                  orElse: () => MemberModel(
                    id: s.fromMemberId,
                    groupId: activeGroup.id,
                    name: 'Flatmate',
                    joinedAt: DateTime.now(),
                    updatedAt: DateTime.now(),
                  ),
                );
                final toMember = appState.members.firstWhere(
                  (m) => m.id == s.toMemberId,
                  orElse: () => MemberModel(
                    id: s.toMemberId,
                    groupId: activeGroup.id,
                    name: 'Flatmate',
                    joinedAt: DateTime.now(),
                    updatedAt: DateTime.now(),
                  ),
                );

                return Card(
                  margin: const EdgeInsets.only(bottom: 6),
                  child: ListTile(
                    leading: const Icon(Icons.handshake_rounded, color: AppColors.primary),
                    title: Text('${fromMember.name} paid ${toMember.name}'),
                    subtitle: Text(
                      '${DateTimeUtils.formatShortDate(s.settledAt)} • Via ${s.paymentMethod.toUpperCase()}${s.notes != null ? ' • ${s.notes}' : ''}',
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: Text(
                      CurrencyFormatter.format(s.amount, symbol: currency),
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  void _showRecordSettlementDialog(
    BuildContext context, {
    String? debtorId,
    String? creditorId,
    double? suggestedAmount,
  }) {
    final appState = context.read<AppStateProvider>();
    final settlementProv = context.read<SettlementProvider>();
    final currency = appState.activeGroup?.currency ?? '₹';

    String? selectedFrom = debtorId ?? (appState.members.isNotEmpty ? appState.members.first.id : null);
    String? selectedTo = creditorId ?? (appState.members.length > 1 ? appState.members[1].id : null);
    final amountController = TextEditingController(
      text: suggestedAmount != null ? suggestedAmount.toStringAsFixed(2) : '',
    );
    final notesController = TextEditingController();
    String paymentMethod = 'upi';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
            title: const Text('Record Settlement'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Record money paid from one flatmate to another to settle debts. This updates balances without counting as a household expense.',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: selectedFrom,
                    decoration: const InputDecoration(labelText: 'Who Paid? (Payer)'),
                    items: appState.members.map((m) {
                      return DropdownMenuItem(
                        value: m.id,
                        child: Text(m.isCurrentUser ? '${m.name} (You)' : m.name),
                      );
                    }).toList(),
                    onChanged: (val) => setState(() => selectedFrom = val),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: selectedTo,
                    decoration: const InputDecoration(labelText: 'Paid To Whom? (Receiver)'),
                    items: appState.members.map((m) {
                      return DropdownMenuItem(
                        value: m.id,
                        child: Text(m.isCurrentUser ? '${m.name} (You)' : m.name),
                      );
                    }).toList(),
                    onChanged: (val) => setState(() => selectedTo = val),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: amountController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      labelText: 'Amount ($currency)',
                      prefixText: '$currency ',
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: paymentMethod,
                    decoration: const InputDecoration(labelText: 'Payment Method'),
                    items: const [
                      DropdownMenuItem(value: 'upi', child: Text('UPI / Google Pay / PhonePe')),
                      DropdownMenuItem(value: 'cash', child: Text('Cash')),
                      DropdownMenuItem(value: 'bank_transfer', child: Text('Bank Transfer / IMPS')),
                      DropdownMenuItem(value: 'other', child: Text('Other')),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => paymentMethod = val);
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: notesController,
                    decoration: const InputDecoration(
                      labelText: 'Notes (Optional)',
                      hintText: 'e.g. Cleared October milk & rent share',
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
              ElevatedButton(
                onPressed: () async {
                  final amount = double.tryParse(amountController.text);
                  if (amount == null || amount <= 0 || selectedFrom == null || selectedTo == null) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Please enter valid amount and select members')),
                    );
                    return;
                  }
                  if (selectedFrom == selectedTo) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Payer and receiver cannot be the same person')),
                    );
                    return;
                  }

                  await settlementProv.recordSettlement(
                    groupId: appState.activeGroup!.id,
                    fromMemberId: selectedFrom!,
                    toMemberId: selectedTo!,
                    amount: amount,
                    settledAt: DateTime.now(),
                    paymentMethod: paymentMethod,
                    notes: notesController.text.trim().isEmpty ? null : notesController.text.trim(),
                    currentUserId: appState.currentUserId!,
                  );

                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                  }
                },
                child: const Text('Record'),
              ),
            ],
          );
        },
      ),
    );
  }
}
