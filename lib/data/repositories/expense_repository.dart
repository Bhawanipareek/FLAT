import 'package:sqflite/sqflite.dart';
import '../database/app_database.dart';
import '../database/database_tables.dart';
import '../models/expense_model.dart';
import '../models/expense_split_model.dart';

class ExpenseRepository {
  final AppDatabase _appDatabase;

  ExpenseRepository([AppDatabase? appDatabase])
      : _appDatabase = appDatabase ?? AppDatabase.instance;

  Future<void> saveExpenseWithSplits(ExpenseModel expense, {DatabaseExecutor? txn}) async {
    final runner = txn ?? await _appDatabase.database;
    if (txn == null) {
      final db = await _appDatabase.database;
      await db.transaction((transaction) async {
        await _saveExpenseInternal(transaction, expense);
      });
    } else {
      await _saveExpenseInternal(runner, expense);
    }
  }

  Future<void> _saveExpenseInternal(DatabaseExecutor executor, ExpenseModel expense) async {
    await executor.insert(
      DatabaseTables.tableExpenses,
      expense.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );

    // Delete existing splits for this expense before inserting new ones
    await executor.delete(
      DatabaseTables.tableExpenseSplits,
      where: 'expense_id = ?',
      whereArgs: [expense.id],
    );

    for (final split in expense.splits) {
      final safeSplit = split.expenseId == expense.id
          ? split
          : split.copyWith(expenseId: expense.id);
      await executor.insert(
        DatabaseTables.tableExpenseSplits,
        safeSplit.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
  }

  Future<ExpenseModel?> getExpenseById(String expenseId) async {
    final db = await _appDatabase.database;
    final results = await db.query(
      DatabaseTables.tableExpenses,
      where: 'id = ? AND is_deleted = 0',
      whereArgs: [expenseId],
    );

    if (results.isEmpty) return null;

    final splitsData = await db.query(
      DatabaseTables.tableExpenseSplits,
      where: 'expense_id = ? AND is_deleted = 0',
      whereArgs: [expenseId],
    );

    final splits = splitsData.map((s) => ExpenseSplitModel.fromMap(s)).toList();
    return ExpenseModel.fromMap(results.first, splits: splits);
  }

  Future<List<ExpenseModel>> getExpensesForGroup(
    String groupId, {
    DateTime? month,
    String? category,
    String? payerMemberId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final db = await _appDatabase.database;

    final whereClauses = <String>['group_id = ?', 'is_deleted = 0'];
    final whereArgs = <dynamic>[groupId];

    if (month != null) {
      final start = DateTime(month.year, month.month, 1);
      final end = DateTime(month.year, month.month + 1, 0, 23, 59, 59);
      whereClauses.add('purchase_date >= ? AND purchase_date <= ?');
      whereArgs.add(start.toIso8601String());
      whereArgs.add(end.toIso8601String());
    }

    if (startDate != null && endDate != null) {
      whereClauses.add('purchase_date >= ? AND purchase_date <= ?');
      whereArgs.add(startDate.toIso8601String());
      whereArgs.add(endDate.toIso8601String());
    }

    if (category != null && category.isNotEmpty && category.toLowerCase() != 'all') {
      whereClauses.add('category = ?');
      whereArgs.add(category);
    }

    if (payerMemberId != null && payerMemberId.isNotEmpty) {
      whereClauses.add('payer_member_id = ?');
      whereArgs.add(payerMemberId);
    }

    final results = await db.query(
      DatabaseTables.tableExpenses,
      where: whereClauses.join(' AND '),
      whereArgs: whereArgs,
      orderBy: 'purchase_date DESC, created_at DESC',
    );

    if (results.isEmpty) return [];

    final expenseIds = results.map((r) => r['id'] as String).toList();
    final placeholders = List.filled(expenseIds.length, '?').join(',');

    final splitsResults = await db.query(
      DatabaseTables.tableExpenseSplits,
      where: 'expense_id IN ($placeholders) AND is_deleted = 0',
      whereArgs: expenseIds,
    );

    final splitsByExpense = <String, List<ExpenseSplitModel>>{};
    for (final splitMap in splitsResults) {
      final split = ExpenseSplitModel.fromMap(splitMap);
      splitsByExpense.putIfAbsent(split.expenseId, () => []).add(split);
    }

    return results.map((r) {
      final id = r['id'] as String;
      return ExpenseModel.fromMap(r, splits: splitsByExpense[id] ?? []);
    }).toList();
  }

  Future<void> deleteExpense(String expenseId) async {
    final db = await _appDatabase.database;
    final nowIso = DateTime.now().toIso8601String();
    await db.transaction((txn) async {
      await txn.update(
        DatabaseTables.tableExpenses,
        {'is_deleted': 1, 'updated_at': nowIso},
        where: 'id = ?',
        whereArgs: [expenseId],
      );
      await txn.update(
        DatabaseTables.tableExpenseSplits,
        {'is_deleted': 1, 'updated_at': nowIso},
        where: 'expense_id = ?',
        whereArgs: [expenseId],
      );
    });
  }
}
