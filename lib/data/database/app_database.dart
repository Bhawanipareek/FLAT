import 'dart:async';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';
import '../../core/constants/app_constants.dart';
import 'database_tables.dart';

class AppDatabase {
  static final AppDatabase instance = AppDatabase._internal();
  static Database? _database;

  AppDatabase._internal();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final docsDir = await getApplicationDocumentsDirectory();
    final path = join(docsDir.path, AppConstants.databaseName);

    return await openDatabase(
      path,
      version: AppConstants.databaseVersion,
      onConfigure: (db) async {
        await db.execute('PRAGMA foreign_keys = ON;');
      },
      onCreate: (db, version) async {
        await _createDb(db);
      },
    );
  }

  Future<void> _createDb(Database db) async {
    final batch = db.batch();

    batch.execute(DatabaseTables.createGroupsTable);
    batch.execute(DatabaseTables.createMembersTable);
    batch.execute(DatabaseTables.createExpensesTable);
    batch.execute(DatabaseTables.createExpenseSplitsTable);
    batch.execute(DatabaseTables.createShoppingItemsTable);
    batch.execute(DatabaseTables.createContributionsTable);
    batch.execute(DatabaseTables.createSettlementsTable);
    batch.execute(DatabaseTables.createSyncLogsTable);

    // Performance Indices
    batch.execute('CREATE INDEX idx_members_group ON ${DatabaseTables.tableMembers}(group_id);');
    batch.execute('CREATE INDEX idx_expenses_group ON ${DatabaseTables.tableExpenses}(group_id);');
    batch.execute('CREATE INDEX idx_expenses_date ON ${DatabaseTables.tableExpenses}(purchase_date);');
    batch.execute('CREATE INDEX idx_splits_expense ON ${DatabaseTables.tableExpenseSplits}(expense_id);');
    batch.execute('CREATE INDEX idx_shopping_group ON ${DatabaseTables.tableShoppingItems}(group_id);');
    batch.execute('CREATE INDEX idx_contributions_group ON ${DatabaseTables.tableContributions}(group_id);');
    batch.execute('CREATE INDEX idx_settlements_group ON ${DatabaseTables.tableSettlements}(group_id);');
    batch.execute('CREATE INDEX idx_sync_logs_group ON ${DatabaseTables.tableSyncLogs}(group_id, timestamp);');

    await batch.commit(noResult: true);
  }

  Future<void> close() async {
    final db = _database;
    if (db != null) {
      await db.close();
      _database = null;
    }
  }

  Future<void> clearAllData() async {
    final db = await database;
    await db.transaction((txn) async {
      await txn.delete(DatabaseTables.tableSyncLogs);
      await txn.delete(DatabaseTables.tableSettlements);
      await txn.delete(DatabaseTables.tableContributions);
      await txn.delete(DatabaseTables.tableShoppingItems);
      await txn.delete(DatabaseTables.tableExpenseSplits);
      await txn.delete(DatabaseTables.tableExpenses);
      await txn.delete(DatabaseTables.tableMembers);
      await txn.delete(DatabaseTables.tableGroups);
    });
  }
}
