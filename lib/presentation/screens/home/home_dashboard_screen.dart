import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_time_utils.dart';
import '../../providers/app_state_provider.dart';
import '../../providers/contributions_provider.dart';
import '../../providers/expenses_provider.dart';
import '../../providers/settlement_provider.dart';
import '../../providers/shopping_provider.dart';
import '../../widgets/category_icon.dart';
import '../../widgets/member_avatar.dart';
import '../../widgets/sync_status_indicator.dart';
import '../contributions/add_contribution_screen.dart';
import '../expenses/add_edit_expense_screen.dart';
import '../expenses/expense_detail_screen.dart';
import '../group/create_group_screen.dart';
import '../group/qr_scan_screen.dart';
import '../settlements/settlements_screen.dart';
import '../shopping/add_edit_shopping_item_screen.dart';
import 'widgets/balance_card.dart';
import 'widgets/monthly_summary_card.dart';
import 'widgets/quick_actions.dart';

class HomeDashboardScreen extends StatelessWidget {
  final VoidCallback onNavigateToExpenses;
  final VoidCallback onNavigateToShopping;
  final VoidCallback onNavigateToGroup;

  const HomeDashboardScreen({
    super.key,
    required this.onNavigateToExpenses,
    required this.onNavigateToShopping,
    required this.onNavigateToGroup,
  });

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final expensesProv = context.watch<ExpensesProvider>();
    final shoppingProv = context.watch<ShoppingProvider>();
    final contributionsProv = context.watch<ContributionsProvider>();
    final settlementProv = context.watch<SettlementProvider>();
    final syncManager = appState.syncManager;

    final activeGroup = appState.activeGroup;

    if (activeGroup == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Flat Expense Manager'),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    color: AppColors.primaryContainer,
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(Icons.apartment_rounded, size: 48, color: AppColors.primary),
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'No Flat Group Joined',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Create a new flat group or join an existing flatmate by scanning their QR code on the same Wi-Fi.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondaryLight, fontSize: 14),
                ),
                const SizedBox(height: 32),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const CreateGroupScreen()),
                    );
                  },
                  icon: const Icon(Icons.add_home_rounded),
                  label: const Text('Create New Group'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                  ),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const QrScanScreen()),
                    );
                  },
                  icon: const Icon(Icons.qr_code_scanner_rounded),
                  label: const Text('Scan QR to Join Flat'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final currency = activeGroup.currency;
    final currentUserId = appState.currentUserId ?? '';
    final netBalance = settlementProv.calculationResult?.currentUserNetBalance ?? 0.0;
    final totalMonthly = expensesProv.totalMonthlyExpenses;
    final userPaid = expensesProv.currentUserPaid(currentUserId);
    final othersPaid = expensesProv.otherMembersPaid(currentUserId);
    final moneyReceived = contributionsProv.monthlyTotal;
    final upcomingShopping = shoppingProv.upcomingBudget;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              activeGroup.name,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
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
        actions: [
          IconButton(
            tooltip: 'Sync Now with Flatmates',
            icon: const Icon(Icons.sync_rounded),
            onPressed: () => syncManager.syncNow(activeGroup.id),
          ),
          IconButton(
            tooltip: 'Flatmates',
            icon: const Icon(Icons.people_outline_rounded),
            onPressed: onNavigateToGroup,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await expensesProv.loadExpenses(activeGroup.id);
          await shoppingProv.loadItems(activeGroup.id);
          await contributionsProv.loadContributions(activeGroup.id);
          await settlementProv.recalculate(activeGroup.id, currentUserId);
          await syncManager.syncNow(activeGroup.id);
        },
        child: ListView(
          padding: const EdgeInsets.only(bottom: 32),
          children: [
            // Month Selector
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left_rounded),
                    onPressed: () {
                      final prevMonth = DateTime(
                        expensesProv.selectedMonth.year,
                        expensesProv.selectedMonth.month - 1,
                      );
                      expensesProv.setSelectedMonth(prevMonth, activeGroup.id);
                      contributionsProv.setSelectedMonth(prevMonth, activeGroup.id);
                    },
                  ),
                  Text(
                    DateFormat('MMMM yyyy').format(expensesProv.selectedMonth),
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_right_rounded),
                    onPressed: () {
                      final nextMonth = DateTime(
                        expensesProv.selectedMonth.year,
                        expensesProv.selectedMonth.month + 1,
                      );
                      expensesProv.setSelectedMonth(nextMonth, activeGroup.id);
                      contributionsProv.setSelectedMonth(nextMonth, activeGroup.id);
                    },
                  ),
                ],
              ),
            ),

            // Balance Card
            BalanceCard(
              netBalance: netBalance,
              currency: currency,
              onSettleTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const SettlementsScreen()),
                );
              },
            ),

            // Monthly Summary Card
            MonthlySummaryCard(
              totalGroupExpense: totalMonthly,
              currentUserPaid: userPaid,
              otherMembersPaid: othersPaid,
              totalMoneyReceived: moneyReceived,
              upcomingShoppingBudget: upcomingShopping,
              currency: currency,
            ),

            // Quick Actions Bar
            QuickActionsBar(
              onAddExpense: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AddEditExpenseScreen()),
                );
              },
              onAddShopping: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AddEditShoppingItemScreen()),
                );
              },
              onAddContribution: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AddContributionScreen()),
                );
              },
              onSettleUp: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const SettlementsScreen()),
                );
              },
              onSyncNow: () => syncManager.syncNow(activeGroup.id),
            ),

            // Recent Activity Section
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Recent Expenses',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                  TextButton(
                    onPressed: onNavigateToExpenses,
                    child: const Text('See All'),
                  ),
                ],
              ),
            ),

            if (expensesProv.expenses.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.receipt_outlined, size: 40, color: Colors.grey.shade400),
                      const SizedBox(height: 8),
                      Text(
                        'No expenses recorded for ${DateFormat('MMMM yyyy').format(expensesProv.selectedMonth)}',
                        style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              )
            else
              ...expensesProv.expenses.take(5).map((expense) {
                final payer = appState.members.firstWhere(
                  (m) => m.id == expense.payerMemberId,
                  orElse: () => appState.currentUserMember!,
                );
                final isCurrentPayer = expense.payerMemberId == currentUserId;

                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    leading: CategoryIcon(categoryId: expense.category),
                    title: Text(
                      expense.title,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Text(
                      '${isCurrentPayer ? 'You paid' : '${payer.name} paid'} • ${DateTimeUtils.formatRelative(expense.purchaseDate)}',
                      style: const TextStyle(fontSize: 12),
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
              }),
          ],
        ),
      ),
    );
  }
}
