import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/expense_categories.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_time_utils.dart';
import '../../providers/app_state_provider.dart';
import '../../providers/expenses_provider.dart';
import '../../widgets/category_icon.dart';
import 'add_edit_expense_screen.dart';
import 'expense_detail_screen.dart';

class ExpensesListScreen extends StatelessWidget {
  const ExpensesListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final expensesProv = context.watch<ExpensesProvider>();
    final activeGroup = appState.activeGroup;

    if (activeGroup == null) {
      return const Scaffold(
        body: Center(child: Text('Please create or join a group first.')),
      );
    }

    final currency = activeGroup.currency;
    final currentUserId = appState.currentUserId ?? '';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Group Expenses'),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync_rounded),
            onPressed: () => appState.syncManager.syncNow(activeGroup.id),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips (Categories)
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                FilterChip(
                  label: const Text('All'),
                  selected: expensesProv.selectedCategory == 'all',
                  onSelected: (selected) {
                    expensesProv.setFilters(
                      groupId: activeGroup.id,
                      category: 'all',
                    );
                  },
                ),
                const SizedBox(width: 8),
                ...ExpenseCategories.all.map((cat) {
                  final isSelected = expensesProv.selectedCategory == cat.id;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      avatar: Icon(cat.icon, size: 16, color: isSelected ? Colors.white : cat.color),
                      label: Text(cat.name),
                      selected: isSelected,
                      onSelected: (selected) {
                        expensesProv.setFilters(
                          groupId: activeGroup.id,
                          category: selected ? cat.id : 'all',
                        );
                      },
                    ),
                  );
                }),
              ],
            ),
          ),

          // Total bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Theme.of(context).cardColor,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${expensesProv.expenses.length} Records',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
                Text(
                  'Total: ${CurrencyFormatter.format(expensesProv.totalMonthlyExpenses, symbol: currency)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Expense items
          Expanded(
            child: expensesProv.isLoading
                ? const Center(child: CircularProgressIndicator())
                : expensesProv.expenses.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.receipt_long_outlined, size: 48, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            const Text(
                              'No expenses found',
                              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Tap + button below to add an expense',
                              style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: expensesProv.expenses.length,
                        itemBuilder: (context, index) {
                          final expense = expensesProv.expenses[index];
                          final payer = appState.members.firstWhere(
                            (m) => m.id == expense.payerMemberId,
                            orElse: () => appState.currentUserMember!,
                          );
                          final isCurrentPayer = expense.payerMemberId == currentUserId;

                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                            child: ListTile(
                              leading: CategoryIcon(categoryId: expense.category),
                              title: Text(
                                expense.title,
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${isCurrentPayer ? 'You paid' : '${payer.name} paid'} • ${DateTimeUtils.formatShortDate(expense.purchaseDate)}',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                  if (expense.splits.isNotEmpty)
                                    Text(
                                      'Split among ${expense.splits.length} members (${expense.splitMethod})',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                ],
                              ),
                              trailing: Text(
                                CurrencyFormatter.format(expense.amount, symbol: currency),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                ),
                              ),
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ExpenseDetailScreen(expense: expense),
                                  ),
                                );
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
            MaterialPageRoute(builder: (_) => const AddEditExpenseScreen()),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('Add Expense'),
      ),
    );
  }
}
