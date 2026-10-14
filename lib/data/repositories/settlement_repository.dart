import 'package:sqflite/sqflite.dart';
import '../database/app_database.dart';
import '../database/database_tables.dart';
import '../models/settlement_model.dart';

class SettlementRepository {
  final AppDatabase _appDatabase;

  SettlementRepository([AppDatabase? appDatabase])
      : _appDatabase = appDatabase ?? AppDatabase.instance;

  Future<void> saveSettlement(SettlementModel settlement, {DatabaseExecutor? txn}) async {
    final db = txn ?? await _appDatabase.database;
    await db.insert(
      DatabaseTables.tableSettlements,
      settlement.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<SettlementModel>> getSettlementsForGroup(String groupId) async {
    final db = await _appDatabase.database;
    final results = await db.query(
      DatabaseTables.tableSettlements,
      where: 'group_id = ? AND is_deleted = 0',
      whereArgs: [groupId],
      orderBy: 'settled_at DESC, created_at DESC',
    );
    return results.map((map) => SettlementModel.fromMap(map)).toList();
  }

  Future<void> deleteSettlement(String id) async {
    final db = await _appDatabase.database;
    await db.update(
      DatabaseTables.tableSettlements,
      {
        'is_deleted': 1,
        'updated_at': DateTime.now().toIso8601String(),
      },
      where: 'id = ?',
      whereArgs: [id],
    );
  }
}
