import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/expense_categories.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_time_utils.dart';
import '../../../data/models/member_model.dart';
import '../../providers/app_state_provider.dart';
import '../../providers/expenses_provider.dart';
import '../../widgets/category_icon.dart';
import 'add_edit_expense_screen.dart';
import 'expense_detail_screen.dart';

class ExpensesListScreen extends StatefulWidget {
  const ExpensesListScreen({super.key});

  @override
  State<ExpensesListScreen> createState() => _ExpensesListScreenState();
}

class _ExpensesListScreenState extends State<ExpensesListScreen> {
  String _typeFilter = 'all'; // 'all', 'shared', 'personal'

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

    final filteredExpenses = expensesProv.expenses.where((e) {
      if (_typeFilter == 'personal') return e.isPersonal;
      if (_typeFilter == 'shared') return !e.isPersonal;
      return true;
    }).toList();

    final filteredTotal = filteredExpenses.fold(0.0, (sum, e) => sum + e.amount);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Expenses (Kharcha)'),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync_rounded),
            tooltip: 'Sync Now',
            onPressed: () => appState.syncManager.syncNow(activeGroup.id),
          ),
        ],
      ),
      body: Column(
        children: [
          // Personal vs Shared Filter Toggle
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'all', label: Text('Sabhi (All)')),
                ButtonSegment(value: 'shared', label: Text('Flat Shared')),
                ButtonSegment(value: 'personal', label: Text('🔒 Personal (Mera)')),
              ],
              selected: {_typeFilter},
              onSelectionChanged: (set) {
                setState(() => _typeFilter = set.first);
              },
            ),
          ),

          // Filter Chips (Categories)
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                FilterChip(
                  label: const Text('All Categories'),
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
                  '${filteredExpenses.length} Records',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
                Text(
                  'Total: ${CurrencyFormatter.format(filteredTotal, symbol: currency)}',
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
                : filteredExpenses.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.receipt_long_outlined, size: 48, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            Text(
                              _typeFilter == 'personal'
                                  ? 'No personal expenses recorded yet'
                                  : 'No expenses found',
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: filteredExpenses.length,
                        itemBuilder: (context, index) {
                          final expense = filteredExpenses[index];
                          final payer = appState.members.firstWhere(
                            (m) => m.id == expense.payerMemberId,
                            orElse: () => MemberModel(
                              id: expense.payerMemberId,
                              groupId: activeGroup.id,
                              name: 'Flatmate',
                              joinedAt: DateTime.now(),
                              updatedAt: DateTime.now(),
                            ),
                          );
                          final isCurrentPayer = expense.payerMemberId == currentUserId;

                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                            child: ListTile(
                              leading: CategoryIcon(categoryId: expense.category),
                              title: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      expense.title,
                                      style: const TextStyle(fontWeight: FontWeight.w600),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  if (expense.isPersonal)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.purple.shade50,
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: Colors.purple.shade200),
                                      ),
                                      child: const Text(
                                        'Personal',
                                        style: TextStyle(
                                          color: Colors.purple,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${isCurrentPayer ? 'You paid' : '${payer.name} paid'} • ${DateTimeUtils.formatShortDate(expense.purchaseDate)}',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                  if (!expense.isPersonal && expense.splits.isNotEmpty)
                                    Text(
                                      'Split among ${expense.splits.length} flatmates (${expense.splitMethod})',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                ],
                              ),
                              trailing: Text(
                                CurrencyFormatter.format(expense.amount, symbol: currency),
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                  color: expense.isPersonal ? Colors.purple : AppColors.primary,
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
