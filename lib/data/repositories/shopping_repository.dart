import 'package:sqflite/sqflite.dart';
import '../database/app_database.dart';
import '../database/database_tables.dart';
import '../models/expense_model.dart';
import '../models/expense_split_model.dart';
import '../models/shopping_item_model.dart';

class ShoppingRepository {
  final AppDatabase _appDatabase;

  ShoppingRepository([AppDatabase? appDatabase])
      : _appDatabase = appDatabase ?? AppDatabase.instance;

  Future<void> saveShoppingItem(ShoppingItemModel item, {DatabaseExecutor? txn}) async {
    final db = txn ?? await _appDatabase.database;
    await db.insert(
      DatabaseTables.tableShoppingItems,
      item.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<ShoppingItemModel>> getShoppingItems(
    String groupId, {
    String? status,
    bool includePurchased = true,
  }) async {
    final db = await _appDatabase.database;
    final whereClauses = <String>['group_id = ?', 'is_deleted = 0'];
    final whereArgs = <dynamic>[groupId];

    if (status != null && status.isNotEmpty) {
      whereClauses.add('status = ?');
      whereArgs.add(status);
    } else if (!includePurchased) {
      whereClauses.add('status != ?');
      whereArgs.add('purchased');
    }

    final results = await db.query(
      DatabaseTables.tableShoppingItems,
      where: whereClauses.join(' AND '),
      whereArgs: whereArgs,
      orderBy: "CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END, created_at DESC",
    );

    return results.map((map) => ShoppingItemModel.fromMap(map)).toList();
  }

  Future<ShoppingItemModel?> getItemById(String id) async {
    final db = await _appDatabase.database;
    final results = await db.query(
      DatabaseTables.tableShoppingItems,
      where: 'id = ? AND is_deleted = 0',
      whereArgs: [id],
    );
    if (results.isNotEmpty) {
      return ShoppingItemModel.fromMap(results.first);
    }
    return null;
  }

  /// Converts a shopping item into an expense atomically in a single transaction
  /// Avoids duplicate expense creation if already converted
  Future<ExpenseModel?> convertToExpense({
    required ShoppingItemModel item,
    required double actualAmount,
    required String payerMemberId,
    required List<String> splitMemberIds,
    String? notes,
  }) async {
    final db = await _appDatabase.database;

    return await db.transaction((txn) async {
      // Re-verify item status to prevent race conditions / duplicate conversion
      final currentList = await txn.query(
        DatabaseTables.tableShoppingItems,
        where: 'id = ?',
        whereArgs: [item.id],
      );
      if (currentList.isEmpty) return null;
      final currentItem = ShoppingItemModel.fromMap(currentList.first);
      if (currentItem.convertedExpenseId != null || currentItem.status == 'purchased') {
        // Already converted!
        return null;
      }

      final now = DateTime.now();
      final expenseId = 'exp_${item.id}'; // Deterministic ID prevents duplicate conversion

      // Calculate splits
      final splitCount = splitMemberIds.isEmpty ? 1 : splitMemberIds.length;
      final perMemberAmount = (actualAmount / splitCount);

      final splits = splitMemberIds.map((mId) {
        return ExpenseSplitModel(
          id: 'spl_${expenseId}_$mId',
          expenseId: expenseId,
          memberId: mId,
          allocatedAmount: perMemberAmount,
          allocatedPercentage: 100.0 / splitCount,
          createdAt: now,
          updatedAt: now,
        );
      }).toList();

      final expense = ExpenseModel(
        id: expenseId,
        groupId: item.groupId,
        title: '${item.name} (${item.quantity} ${item.unit})',
        amount: actualAmount,
        category: 'grocery',
        purchaseDate: now,
        payerMemberId: payerMemberId,
        splitMethod: 'equal',
        notes: notes ?? 'Converted from shopping item',
        shoppingItemId: item.id,
        createdByMemberId: payerMemberId,
        createdAt: now,
        updatedAt: now,
        splits: splits,
      );

      // Save expense
      await txn.insert(
        DatabaseTables.tableExpenses,
        expense.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      for (final split in splits) {
        await txn.insert(
          DatabaseTables.tableExpenseSplits,
          split.toMap(),
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }

      // Update shopping item
      final updatedItem = item.copyWith(
        status: 'purchased',
        actualPrice: actualAmount,
        convertedExpenseId: expenseId,
        updatedAt: now,
      );

      await txn.update(
        DatabaseTables.tableShoppingItems,
        updatedItem.toMap(),
        where: 'id = ?',
        whereArgs: [item.id],
      );

      return expense;
    });
  }

  Future<void> deleteShoppingItem(String id) async {
    final db = await _appDatabase.database;
    await db.update(
      DatabaseTables.tableShoppingItems,
      {
        'is_deleted': 1,
        'updated_at': DateTime.now().toIso8601String(),
      },
      where: 'id = ?',
      whereArgs: [id],
    );
  }
}
