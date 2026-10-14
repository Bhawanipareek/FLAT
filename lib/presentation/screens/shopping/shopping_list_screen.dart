import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/models/shopping_item_model.dart';
import '../../providers/app_state_provider.dart';
import '../../providers/shopping_provider.dart';
import '../../widgets/member_avatar.dart';
import 'add_edit_shopping_item_screen.dart';
import 'widgets/convert_to_expense_dialog.dart';

class ShoppingListScreen extends StatefulWidget {
  const ShoppingListScreen({super.key});

  @override
  State<ShoppingListScreen> createState() => _ShoppingListScreenState();
}

class _ShoppingListScreenState extends State<ShoppingListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Color _getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'high':
        return AppColors.error;
      case 'medium':
        return AppColors.warning;
      case 'low':
      default:
        return AppColors.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();
    final shoppingProv = context.watch<ShoppingProvider>();
    final activeGroup = appState.activeGroup;

    if (activeGroup == null) {
      return const Scaffold(
        body: Center(child: Text('Please select or join a flat group first.')),
      );
    }

    final currency = activeGroup.currency;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Shopping List'),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync_rounded),
            onPressed: () => appState.syncManager.syncNow(activeGroup.id),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.grey,
          tabs: [
            Tab(text: 'Items to Buy (${shoppingProv.neededItems.length})'),
            Tab(text: 'Purchased (${shoppingProv.purchasedItems.length})'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Needed / Assigned
          _buildItemsList(
            items: shoppingProv.neededItems,
            currency: currency,
            isPurchasedTab: false,
          ),

          // Tab 2: Purchased
          _buildItemsList(
            items: shoppingProv.purchasedItems,
            currency: currency,
            isPurchasedTab: true,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const AddEditShoppingItemScreen()),
          );
        },
        icon: const Icon(Icons.add_shopping_cart_rounded),
        label: const Text('Add Item'),
      ),
    );
  }

  Widget _buildItemsList({
    required List<ShoppingItemModel> items,
    required String currency,
    required bool isPurchasedTab,
  }) {
    final appState = context.watch<AppStateProvider>();
    final shoppingProv = context.watch<ShoppingProvider>();

    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isPurchasedTab ? Icons.shopping_bag_outlined : Icons.checklist_rounded,
              size: 48,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 12),
            Text(
              isPurchasedTab ? 'No purchased items yet' : 'Shopping list is empty!',
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
            ),
            const SizedBox(height: 4),
            Text(
              isPurchasedTab
                ? 'Purchased items will appear here after conversion'
                : 'Add groceries or essentials flatmates should buy',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        final assignedMember = item.assignedMemberId != null
            ? appState.members.firstWhere(
                (m) => m.id == item.assignedMemberId,
                orElse: () => MemberModel(
                  id: item.assignedMemberId!,
                  groupId: item.groupId,
                  name: 'Flatmate',
                  joinedAt: DateTime.now(),
                  updatedAt: DateTime.now(),
                ),
              )
            : null;

        return Card(
          margin: const EdgeInsets.symmetric(vertical: 4),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            leading: isPurchasedTab
                ? const Icon(Icons.check_circle_rounded, color: AppColors.success)
                : Checkbox(
                    value: false,
                    onChanged: (_) {
                      showDialog(
                        context: context,
                        builder: (_) => ConvertToExpenseDialog(item: item),
                      );
                    },
                  ),
            title: Text(
              item.name,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                decoration: isPurchasedTab ? TextDecoration.lineThrough : null,
              ),
            ),
            subtitle: Row(
              children: [
                Text('${item.quantity} ${item.unit}'),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: _getPriorityColor(item.priority).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    item.priority.toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: _getPriorityColor(item.priority),
                    ),
                  ),
                ),
                if (assignedMember != null) ...[
                  const SizedBox(width: 8),
                  Text(
                    '• ${assignedMember.name}',
                    style: const TextStyle(fontSize: 12),
                  ),
                ],
              ],
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  item.actualPrice != null
                      ? CurrencyFormatter.format(item.actualPrice!, symbol: currency)
                      : item.estimatedPrice > 0
                          ? '~ ${CurrencyFormatter.format(item.estimatedPrice, symbol: currency)}'
                          : '₹ -',
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
                if (isPurchasedTab)
                  const Text(
                    'Converted',
                    style: TextStyle(fontSize: 11, color: AppColors.success, fontWeight: FontWeight.w600),
                  ),
              ],
            ),
            onLongPress: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Delete Shopping Item?'),
                  content: Text('Remove "${item.name}" from the list?'),
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
                await shoppingProv.deleteItem(item.id, item.groupId);
              }
            },
          ),
        );
      },
    );
  }
}
