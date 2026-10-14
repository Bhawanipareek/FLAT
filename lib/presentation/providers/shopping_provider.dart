import 'package:flutter/foundation.dart';
import '../../core/utils/id_generator.dart';
import '../../data/models/shopping_item_model.dart';
import '../../data/repositories/shopping_repository.dart';
import '../../data/repositories/sync_repository.dart';
import '../../sync/p2p_sync_manager.dart';

class ShoppingProvider extends ChangeNotifier {
  final ShoppingRepository _shoppingRepository;
  final SyncRepository _syncRepository;
  final P2pSyncManager _syncManager;

  List<ShoppingItemModel> _items = [];
  bool _isLoading = false;
  String _filterStatus = 'all';

  ShoppingProvider({
    required P2pSyncManager syncManager,
    ShoppingRepository? shoppingRepository,
    SyncRepository? syncRepository,
  })  : _syncManager = syncManager,
        _shoppingRepository = shoppingRepository ?? ShoppingRepository(),
        _syncRepository = syncRepository ?? SyncRepository();

  List<ShoppingItemModel> get items => List.unmodifiable(_items);
  bool get isLoading => _isLoading;
  String get filterStatus => _filterStatus;

  List<ShoppingItemModel> get neededItems =>
      _items.where((i) => i.status == 'needed' || i.status == 'assigned').toList();

  List<ShoppingItemModel> get purchasedItems =>
      _items.where((i) => i.status == 'purchased').toList();

  double get upcomingBudget =>
      neededItems.fold(0.0, (sum, item) => sum + item.estimatedPrice);

  Future<void> loadItems(String groupId) async {
    _isLoading = true;
    notifyListeners();

    _items = await _shoppingRepository.getShoppingItems(
      groupId,
      status: _filterStatus == 'all' ? null : _filterStatus,
    );

    _isLoading = false;
    notifyListeners();
  }

  void setFilter(String status, String groupId) {
    _filterStatus = status;
    loadItems(groupId);
  }

  Future<void> saveItem({
    required String groupId,
    String? existingId,
    required String name,
    required double quantity,
    required String unit,
    required double estimatedPrice,
    required String priority,
    String? assignedMemberId,
    DateTime? dueDate,
    required String currentUserId,
  }) async {
    final now = DateTime.now();
    final item = ShoppingItemModel(
      id: existingId ?? IdGenerator.generateId(),
      groupId: groupId,
      name: name,
      quantity: quantity,
      unit: unit,
      estimatedPrice: estimatedPrice,
      priority: priority,
      assignedMemberId: assignedMemberId,
      addedByMemberId: currentUserId,
      dueDate: dueDate,
      status: assignedMemberId != null ? 'assigned' : 'needed',
      createdAt: now,
      updatedAt: now,
    );

    await _shoppingRepository.saveShoppingItem(item);

    await _syncRepository.logChange(
      groupId: groupId,
      entityType: 'shopping_item',
      entityId: item.id,
      operation: existingId == null ? 'insert' : 'update',
      payload: item.toMap(),
    );

    await loadItems(groupId);
    _syncManager.syncNow(groupId);
  }

  Future<void> convertItemToExpense({
    required ShoppingItemModel item,
    required double actualPrice,
    required String payerMemberId,
    required List<String> splitMemberIds,
    String? notes,
  }) async {
    final expense = await _shoppingRepository.convertToExpense(
      item: item,
      actualAmount: actualPrice,
      payerMemberId: payerMemberId,
      splitMemberIds: splitMemberIds,
      notes: notes,
    );

    if (expense != null) {
      // Log expense insertion
      await _syncRepository.logChange(
        groupId: item.groupId,
        entityType: 'expense',
        entityId: expense.id,
        operation: 'insert',
        payload: expense.toJson(),
      );

      // Log shopping item update
      final updatedItem = item.copyWith(
        status: 'purchased',
        actualPrice: actualPrice,
        convertedExpenseId: expense.id,
        updatedAt: DateTime.now(),
      );
      await _syncRepository.logChange(
        groupId: item.groupId,
        entityType: 'shopping_item',
        entityId: item.id,
        operation: 'update',
        payload: updatedItem.toMap(),
      );

      await loadItems(item.groupId);
      _syncManager.syncNow(item.groupId);
    }
  }

  Future<void> deleteItem(String id, String groupId) async {
    await _shoppingRepository.deleteShoppingItem(id);

    await _syncRepository.logChange(
      groupId: groupId,
      entityType: 'shopping_item',
      entityId: id,
      operation: 'delete',
      payload: {'id': id, 'is_deleted': 1, 'updated_at': DateTime.now().toIso8601String()},
    );

    await loadItems(groupId);
    _syncManager.syncNow(groupId);
  }
}
