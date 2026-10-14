import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_time_utils.dart';
import '../../../data/models/expense_model.dart';
import '../../providers/app_state_provider.dart';
import '../../providers/expenses_provider.dart';
import '../../widgets/category_icon.dart';
import '../../widgets/member_avatar.dart';
import 'add_edit_expense_screen.dart';

class ExpenseDetailScreen extends StatelessWidget {
  final ExpenseModel expense;

  const ExpenseDetailScreen({super.key, required this.expense});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final expensesProv = context.watch<ExpensesProvider>();
    final currency = appState.activeGroup?.currency ?? '₹';

    final payer = appState.members.firstWhere(
      (m) => m.id == expense.payerMemberId,
      orElse: () => appState.currentUserMember!,
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Expense Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => AddEditExpenseScreen(existingExpense: expense),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded, color: AppColors.error),
            onPressed: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Delete Expense?'),
                  content: Text('Are you sure you want to delete "${expense.title}"? This will sync with all flatmates.'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      style: TextButton.styleFrom(foregroundColor: AppColors.error),
                      child: const Text('Delete'),
                    ),
                  ],
                ),
              );

              if (confirm == true && context.mounted) {
                await expensesProv.deleteExpense(expense.id, expense.groupId);
                if (context.mounted) {
                  Navigator.pop(context);
                }
              }
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header Card
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  CategoryIcon(categoryId: expense.category, size: 56),
                  const SizedBox(height: 12),
                  Text(
                    expense.title,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    CurrencyFormatter.format(expense.amount, symbol: currency),
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.primaryContainer,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'Paid by ${payer.isCurrentUser ? 'You' : payer.name}',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.onPrimaryContainer,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Metadata List
          Card(
            margin: EdgeInsets.zero,
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.calendar_today_rounded, size: 20),
                  title: const Text('Date & Time'),
                  trailing: Text(
                    DateTimeUtils.formatDateTime(expense.purchaseDate),
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.call_split_rounded, size: 20),
                  title: const Text('Split Method'),
                  trailing: Text(
                    expense.splitMethod.toUpperCase(),
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
                if (expense.notes != null && expense.notes!.isNotEmpty) ...[
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.notes_rounded, size: 20),
                    title: const Text('Notes'),
                    subtitle: Text(expense.notes!),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Splits Breakdown
          const Text(
            'Split Breakdown',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Card(
            margin: EdgeInsets.zero,
            child: Column(
              children: expense.splits.map((split) {
                final member = appState.members.firstWhere(
                  (m) => m.id == split.memberId,
                  orElse: () => MemberModel(
                    id: split.memberId,
                    groupId: expense.groupId,
                    name: 'Flatmate',
                    joinedAt: DateTime.now(),
                    updatedAt: DateTime.now(),
                  ),
                );

                return ListTile(
                  leading: MemberAvatar(name: member.name, isCurrentUser: member.isCurrentUser),
                  title: Text(member.isCurrentUser ? '${member.name} (You)' : member.name),
                  subtitle: split.allocatedPercentage != null
                      ? Text('${split.allocatedPercentage!.toStringAsFixed(1)}% share')
                      : null,
                  trailing: Text(
                    CurrencyFormatter.format(split.allocatedAmount, symbol: currency),
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 16),

          // Receipt Preview
          if (expense.receiptImagePath != null) ...[
            const Text(
              'Receipt Image',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.file(
                File(expense.receiptImagePath!),
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Text('Could not load local receipt image.'),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
