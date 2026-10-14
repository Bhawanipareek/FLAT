import 'package:sqflite/sqflite.dart';
import '../database/app_database.dart';
import '../database/database_tables.dart';
import '../models/contribution_model.dart';

class ContributionRepository {
  final AppDatabase _appDatabase;

  ContributionRepository([AppDatabase? appDatabase])
      : _appDatabase = appDatabase ?? AppDatabase.instance;

  Future<void> saveContribution(ContributionModel contribution, {DatabaseExecutor? txn}) async {
    final db = txn ?? await _appDatabase.database;
    await db.insert(
      DatabaseTables.tableContributions,
      contribution.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<ContributionModel>> getContributionsForGroup(
    String groupId, {
    DateTime? month,
    String? payerMemberId,
    String? type,
  }) async {
    final db = await _appDatabase.database;
    final whereClauses = <String>['group_id = ?', 'is_deleted = 0'];
    final whereArgs = <dynamic>[groupId];

    if (month != null) {
      final start = DateTime(month.year, month.month, 1);
      final end = DateTime(month.year, month.month + 1, 0, 23, 59, 59);
      whereClauses.add('date >= ? AND date <= ?');
      whereArgs.add(start.toIso8601String());
      whereArgs.add(end.toIso8601String());
    }

    if (payerMemberId != null && payerMemberId.isNotEmpty) {
      whereClauses.add('payer_member_id = ?');
      whereArgs.add(payerMemberId);
    }

    if (type != null && type.isNotEmpty && type.toLowerCase() != 'all') {
      whereClauses.add('type = ?');
      whereArgs.add(type);
    }

    final results = await db.query(
      DatabaseTables.tableContributions,
      where: whereClauses.join(' AND '),
      whereArgs: whereArgs,
      orderBy: 'date DESC, created_at DESC',
    );

    return results.map((map) => ContributionModel.fromMap(map)).toList();
  }

  Future<double> getTotalContributionsForMonth(String groupId, DateTime month) async {
    final start = DateTime(month.year, month.month, 1);
    final end = DateTime(month.year, month.month + 1, 0, 23, 59, 59);

    final db = await _appDatabase.database;
    final result = await db.rawQuery('''
      SELECT SUM(amount) as total FROM ${DatabaseTables.tableContributions}
      WHERE group_id = ? AND date >= ? AND date <= ? AND is_deleted = 0 AND status = 'completed'
    ''', [groupId, start.toIso8601String(), end.toIso8601String()]);

    if (result.isNotEmpty && result.first['total'] != null) {
      return (result.first['total'] as num).toDouble();
    }
    return 0.0;
  }

  Future<void> deleteContribution(String id) async {
    final db = await _appDatabase.database;
    await db.update(
      DatabaseTables.tableContributions,
      {
        'is_deleted': 1,
        'updated_at': DateTime.now().toIso8601String(),
      },
      where: 'id = ?',
      whereArgs: [id],
    );
  }
}
