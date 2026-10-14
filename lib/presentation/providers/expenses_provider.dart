import 'package:flutter/foundation.dart';
import '../../core/utils/id_generator.dart';
import '../../data/models/expense_model.dart';
import '../../data/models/expense_split_model.dart';
import '../../data/repositories/expense_repository.dart';
import '../../data/repositories/sync_repository.dart';
import '../../sync/p2p_sync_manager.dart';

class ExpensesProvider extends ChangeNotifier {
  final ExpenseRepository _expenseRepository;
  final SyncRepository _syncRepository;
  final P2pSyncManager _syncManager;

  List<ExpenseModel> _expenses = [];
  DateTime _selectedMonth = DateTime(DateTime.now().year, DateTime.now().month);
  String _selectedCategory = 'all';
  String? _selectedPayerId;
  bool _isLoading = false;

  ExpensesProvider({
    required P2pSyncManager syncManager,
    ExpenseRepository? expenseRepository,
    SyncRepository? syncRepository,
  })  : _syncManager = syncManager,
        _expenseRepository = expenseRepository ?? ExpenseRepository(),
        _syncRepository = syncRepository ?? SyncRepository();

  List<ExpenseModel> get expenses => List.unmodifiable(_expenses);
  DateTime get selectedMonth => _selectedMonth;
  String get selectedCategory => _selectedCategory;
  String? get selectedPayerId => _selectedPayerId;
  bool get isLoading => _isLoading;

  double get totalMonthlyExpenses =>
      _expenses.fold(0.0, (sum, item) => sum + item.amount);

  double currentUserPaid(String currentUserId) => _expenses
      .where((e) => e.payerMemberId == currentUserId)
      .fold(0.0, (sum, item) => sum + item.amount);

  double otherMembersPaid(String currentUserId) => _expenses
      .where((e) => e.payerMemberId != currentUserId)
      .fold(0.0, (sum, item) => sum + item.amount);

  Future<void> loadExpenses(String groupId) async {
    _isLoading = true;
    notifyListeners();

    _expenses = await _expenseRepository.getExpensesForGroup(
      groupId,
      month: _selectedMonth,
      category: _selectedCategory,
      payerMemberId: _selectedPayerId,
    );

    _isLoading = false;
    notifyListeners();
  }

  void setSelectedMonth(DateTime month, String groupId) {
    _selectedMonth = DateTime(month.year, month.month);
    loadExpenses(groupId);
  }

  void setFilters({
    required String groupId,
    String? category,
    String? payerId,
  }) {
    if (category != null) _selectedCategory = category;
    _selectedPayerId = payerId;
    loadExpenses(groupId);
  }

  Future<void> saveExpense({
    required String groupId,
    String? existingId,
    required String title,
    required double amount,
    required String category,
    required DateTime purchaseDate,
    required String payerMemberId,
    required String splitMethod,
    required List<ExpenseSplitModel> splits,
    String? notes,
    String? receiptImagePath,
    String? shoppingItemId,
    required String currentUserId,
  }) async {
    final now = DateTime.now();
    final expenseId = existingId ?? IdGenerator.generateId();

    final expense = ExpenseModel(
      id: expenseId,
      groupId: groupId,
      title: title,
      amount: amount,
      category: category,
      purchaseDate: purchaseDate,
      payerMemberId: payerMemberId,
      splitMethod: splitMethod,
      splits: splits,
      notes: notes,
      receiptImagePath: receiptImagePath,
      shoppingItemId: shoppingItemId,
      createdByMemberId: currentUserId,
      createdAt: now,
      updatedAt: now,
    );

    await _expenseRepository.saveExpenseWithSplits(expense);

    await _syncRepository.logChange(
      groupId: groupId,
      entityType: 'expense',
      entityId: expense.id,
      operation: existingId == null ? 'insert' : 'update',
      payload: expense.toJson(),
    );

    await loadExpenses(groupId);
    _syncManager.syncNow(groupId);
  }

  Future<void> deleteExpense(String expenseId, String groupId) async {
    await _expenseRepository.deleteExpense(expenseId);

    await _syncRepository.logChange(
      groupId: groupId,
      entityType: 'expense',
      entityId: expenseId,
      operation: 'delete',
      payload: {'id': expenseId, 'is_deleted': 1, 'updated_at': DateTime.now().toIso8601String()},
    );

    await loadExpenses(groupId);
    _syncManager.syncNow(groupId);
  }
}
