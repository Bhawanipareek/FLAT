import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_time_utils.dart';
import '../../../data/models/member_model.dart';
import '../../providers/app_state_provider.dart';
import '../../providers/contributions_provider.dart';
import '../../widgets/member_avatar.dart';
import 'add_contribution_screen.dart';

class ContributionsScreen extends StatelessWidget {
  const ContributionsScreen({super.key});

  String _formatType(String type) {
    switch (type) {
      case 'flat_fund':
        return 'Flat Fund Deposit';
      case 'rent_contribution':
        return 'Rent Advance / Contribution';
      case 'refund':
        return 'Refund / Return';
      default:
        return 'General Receipt';
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final contributionsProv = context.watch<ContributionsProvider>();
    final activeGroup = appState.activeGroup;

    if (activeGroup == null) {
      return const Scaffold(
        body: Center(child: Text('No active flat group')),
      );
    }

    final currency = activeGroup.currency;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Money In & Contributions'),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync_rounded),
            onPressed: () => appState.syncManager.syncNow(activeGroup.id),
          ),
        ],
      ),
      body: Column(
        children: [
          // Total Month Banner
          Container(
            padding: const EdgeInsets.all(16),
            color: Theme.of(context).cardColor,
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0284C7).withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(Icons.savings_rounded, color: Color(0xFF0284C7)),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Total Money Received This Month',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      Text(
                        CurrencyFormatter.format(contributionsProv.monthlyTotal, symbol: currency),
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0284C7),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          Expanded(
            child: contributionsProv.contributions.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.savings_outlined, size: 48, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        const Text(
                          'No contributions recorded',
                          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Record shared flat funds, rent advances, or deposits',
                          style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: contributionsProv.contributions.length,
                    itemBuilder: (context, index) {
                      final item = contributionsProv.contributions[index];
                      final payer = appState.members.firstWhere(
                        (m) => m.id == item.payerMemberId,
                        orElse: () => MemberModel(
                          id: item.payerMemberId,
                          groupId: activeGroup.id,
                          name: 'Flatmate',
                          joinedAt: DateTime.now(),
                          updatedAt: DateTime.now(),
                        ),
                      );

                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: MemberAvatar(name: payer.name, isCurrentUser: payer.isCurrentUser),
                          title: Text(item.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text(
                            '${payer.name} • ${_formatType(item.type)}\n${DateTimeUtils.formatShortDate(item.date)}${item.notes != null ? ' • ${item.notes}' : ''}',
                            style: const TextStyle(fontSize: 12),
                          ),
                          isThreeLine: item.notes != null,
                          trailing: Text(
                            '+ ${CurrencyFormatter.format(item.amount, symbol: currency)}',
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 15,
                              color: Color(0xFF0284C7),
                            ),
                          ),
                          onLongPress: () async {
                            final confirm = await showDialog<bool>(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                title: const Text('Delete Contribution?'),
                                content: Text('Delete "${item.title}"?'),
                                actions: [
                                  TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                                  TextButton(
                                    onPressed: () => Navigator.pop(ctx, true),
                                    style: TextButton.styleFrom(foregroundColor: AppColors.error),
                                    child: const Text('Delete'),
                                  ),
                                ],
                              ),
                            );
                            if (confirm == true) {
                              await contributionsProv.deleteContribution(item.id, item.groupId);
                            }
                          },
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const AddContributionScreen()),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('Add Money In'),
      ),
    );
  }
}
