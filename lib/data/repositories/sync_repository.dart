import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import '../../core/utils/id_generator.dart';
import '../../domain/conflict_resolver.dart';
import '../database/app_database.dart';
import '../database/database_tables.dart';
import '../models/contribution_model.dart';
import '../models/expense_model.dart';
import '../models/expense_split_model.dart';
import '../models/group_model.dart';
import '../models/member_model.dart';
import '../models/settlement_model.dart';
import '../models/shopping_item_model.dart';
import '../models/sync_log_model.dart';

class SyncRepository {
  final AppDatabase _appDatabase;

  SyncRepository([AppDatabase? appDatabase])
      : _appDatabase = appDatabase ?? AppDatabase.instance;

  /// Log a local change for Wi-Fi synchronization
  Future<void> logChange({
    required String groupId,
    required String entityType,
    required String entityId,
    required String operation,
    required Map<String, dynamic> payload,
    DatabaseExecutor? txn,
  }) async {
    final log = SyncLogModel(
      id: IdGenerator.generateId(),
      groupId: groupId,
      entityType: entityType,
      entityId: entityId,
      operation: operation,
      payloadJson: jsonEncode(payload),
      timestamp: DateTime.now(),
      syncedWithPeers: false,
    );

    final db = txn ?? await _appDatabase.database;
    await db.insert(
      DatabaseTables.tableSyncLogs,
      log.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Get pending unsynced changes or changes since a specific timestamp
  Future<List<SyncLogModel>> getChangesSince(
    String groupId,
    DateTime? sinceTime,
  ) async {
    final db = await _appDatabase.database;
    final List<Map<String, dynamic>> results;

    if (sinceTime != null) {
      results = await db.query(
        DatabaseTables.tableSyncLogs,
        where: 'group_id = ? AND timestamp > ?',
        whereArgs: [groupId, sinceTime.toIso8601String()],
        orderBy: 'timestamp ASC',
      );
    } else {
      results = await db.query(
        DatabaseTables.tableSyncLogs,
        where: 'group_id = ? AND synced_with_peers = 0',
        whereArgs: [groupId],
        orderBy: 'timestamp ASC',
      );
    }

    return results.map((m) => SyncLogModel.fromMap(m)).toList();
  }

  /// Mark changes as synced up to a timestamp
  Future<void> markChangesSynced(String groupId, DateTime upToTime) async {
    final db = await _appDatabase.database;
    await db.update(
      DatabaseTables.tableSyncLogs,
      {'synced_with_peers': 1},
      where: 'group_id = ? AND timestamp <= ?',
      whereArgs: [groupId, upToTime.toIso8601String()],
    );
  }

  /// Ingests incoming batch changes from peer with Last-Write-Wins conflict resolution
  Future<int> ingestPeerChanges({
    required String groupId,
    required List<SyncLogModel> peerLogs,
  }) async {
    if (peerLogs.isEmpty) return 0;

    final db = await _appDatabase.database;
    int appliedCount = 0;

    await db.transaction((txn) async {
      for (final log in peerLogs) {
        if (log.groupId != groupId) continue;

        try {
          final payload = jsonDecode(log.payloadJson) as Map<String, dynamic>;
          final incomingUpdatedAt = DateTime.parse(payload['updated_at'] as String);

          switch (log.entityType) {
            case 'group':
              final localGroupData = await txn.query(
                DatabaseTables.tableGroups,
                where: 'id = ?',
                whereArgs: [log.entityId],
              );
              bool apply = true;
              if (localGroupData.isNotEmpty) {
                final localUpdatedAt = DateTime.parse(localGroupData.first['updated_at'] as String);
                apply = ConflictResolver.shouldIncomingOverwrite(
                  localUpdatedAt: localUpdatedAt,
                  incomingUpdatedAt: incomingUpdatedAt,
                  localId: log.entityId,
                  incomingId: log.entityId,
                );
              }
              if (apply) {
                await txn.insert(
                  DatabaseTables.tableGroups,
                  payload,
                  conflictAlgorithm: ConflictAlgorithm.replace,
                );
                appliedCount++;
              }
              break;

            case 'member':
              final localData = await txn.query(
                DatabaseTables.tableMembers,
                where: 'id = ?',
                whereArgs: [log.entityId],
              );
              bool apply = true;
              if (localData.isNotEmpty) {
                final localUpdatedAt = DateTime.parse(localData.first['updated_at'] as String);
                apply = ConflictResolver.shouldIncomingOverwrite(
                  localUpdatedAt: localUpdatedAt,
                  incomingUpdatedAt: incomingUpdatedAt,
                  localId: log.entityId,
                  incomingId: log.entityId,
                );
                // Keep local is_current_user flag unchanged
                payload['is_current_user'] = localData.first['is_current_user'];
              } else {
                // If peer is adding a member, on this device it's not the current user
                payload['is_current_user'] = 0;
              }
              if (apply) {
                await txn.insert(
                  DatabaseTables.tableMembers,
                  payload,
                  conflictAlgorithm: ConflictAlgorithm.replace,
                );
                appliedCount++;
              }
              break;

            case 'expense':
              final localData = await txn.query(
                DatabaseTables.tableExpenses,
                where: 'id = ?',
                whereArgs: [log.entityId],
              );
              bool apply = true;
              if (localData.isNotEmpty) {
                final localUpdatedAt = DateTime.parse(localData.first['updated_at'] as String);
                apply = ConflictResolver.shouldIncomingOverwrite(
                  localUpdatedAt: localUpdatedAt,
                  incomingUpdatedAt: incomingUpdatedAt,
                  localId: log.entityId,
                  incomingId: log.entityId,
                );
              }
              if (apply) {
                final splitsData = payload['splits'] as List<dynamic>?;
                final expenseMap = Map<String, dynamic>.from(payload);
                expenseMap.remove('splits');

                await txn.insert(
                  DatabaseTables.tableExpenses,
                  expenseMap,
                  conflictAlgorithm: ConflictAlgorithm.replace,
                );

                if (splitsData != null) {
                  await txn.delete(
                    DatabaseTables.tableExpenseSplits,
                    where: 'expense_id = ?',
                    whereArgs: [log.entityId],
                  );
                  for (final splitItem in splitsData) {
                    await txn.insert(
                      DatabaseTables.tableExpenseSplits,
                      splitItem as Map<String, dynamic>,
                      conflictAlgorithm: ConflictAlgorithm.replace,
                    );
                  }
                }
                appliedCount++;
              }
              break;

            case 'shopping_item':
              final localData = await txn.query(
                DatabaseTables.tableShoppingItems,
                where: 'id = ?',
                whereArgs: [log.entityId],
              );
              bool apply = true;
              if (localData.isNotEmpty) {
                final localUpdatedAt = DateTime.parse(localData.first['updated_at'] as String);
                apply = ConflictResolver.shouldIncomingOverwrite(
                  localUpdatedAt: localUpdatedAt,
                  incomingUpdatedAt: incomingUpdatedAt,
                  localId: log.entityId,
                  incomingId: log.entityId,
                );
              }
              if (apply) {
                await txn.insert(
                  DatabaseTables.tableShoppingItems,
                  payload,
                  conflictAlgorithm: ConflictAlgorithm.replace,
                );
                appliedCount++;
              }
              break;

            case 'contribution':
              final localData = await txn.query(
                DatabaseTables.tableContributions,
                where: 'id = ?',
                whereArgs: [log.entityId],
              );
              bool apply = true;
              if (localData.isNotEmpty) {
                final localUpdatedAt = DateTime.parse(localData.first['updated_at'] as String);
                apply = ConflictResolver.shouldIncomingOverwrite(
                  localUpdatedAt: localUpdatedAt,
                  incomingUpdatedAt: incomingUpdatedAt,
                  localId: log.entityId,
                  incomingId: log.entityId,
                );
              }
              if (apply) {
                await txn.insert(
                  DatabaseTables.tableContributions,
                  payload,
                  conflictAlgorithm: ConflictAlgorithm.replace,
                );
                appliedCount++;
              }
              break;

            case 'settlement':
              final localData = await txn.query(
                DatabaseTables.tableSettlements,
                where: 'id = ?',
                whereArgs: [log.entityId],
              );
              bool apply = true;
              if (localData.isNotEmpty) {
                final localUpdatedAt = DateTime.parse(localData.first['updated_at'] as String);
                apply = ConflictResolver.shouldIncomingOverwrite(
                  localUpdatedAt: localUpdatedAt,
                  incomingUpdatedAt: incomingUpdatedAt,
                  localId: log.entityId,
                  incomingId: log.entityId,
                );
              }
              if (apply) {
                await txn.insert(
                  DatabaseTables.tableSettlements,
                  payload,
                  conflictAlgorithm: ConflictAlgorithm.replace,
                );
                appliedCount++;
              }
              break;
          }
        } catch (_) {
          // Skip malformed log record
        }
      }
    });

    return appliedCount;
  }

  /// Snapshot of entire group database for initial pairing and backup
  Future<Map<String, dynamic>> exportGroupSnapshot(String groupId) async {
    final db = await _appDatabase.database;

    final groups = await db.query(DatabaseTables.tableGroups, where: 'id = ?', whereArgs: [groupId]);
    final members = await db.query(DatabaseTables.tableMembers, where: 'group_id = ?', whereArgs: [groupId]);
    final expenses = await db.query(DatabaseTables.tableExpenses, where: 'group_id = ?', whereArgs: [groupId]);
    final splits = await db.rawQuery('''
      SELECT s.* FROM ${DatabaseTables.tableExpenseSplits} s
      INNER JOIN ${DatabaseTables.tableExpenses} e ON s.expense_id = e.id
      WHERE e.group_id = ?
    ''', [groupId]);
    final shopping = await db.query(DatabaseTables.tableShoppingItems, where: 'group_id = ?', whereArgs: [groupId]);
    final contributions = await db.query(DatabaseTables.tableContributions, where: 'group_id = ?', whereArgs: [groupId]);
    final settlements = await db.query(DatabaseTables.tableSettlements, where: 'group_id = ?', whereArgs: [groupId]);

    return {
      'version': '1.0',
      'exported_at': DateTime.now().toIso8601String(),
      'group_id': groupId,
      'groups': groups,
      'members': members,
      'expenses': expenses,
      'splits': splits,
      'shopping_items': shopping,
      'contributions': contributions,
      'settlements': settlements,
    };
  }

  /// Restore snapshot into local database
  Future<void> importGroupSnapshot(Map<String, dynamic> snapshot, {String? currentUserId}) async {
    final db = await _appDatabase.database;

    await db.transaction((txn) async {
      final groups = snapshot['groups'] as List<dynamic>? ?? [];
      for (final g in groups) {
        await txn.insert(DatabaseTables.tableGroups, g as Map<String, dynamic>, conflictAlgorithm: ConflictAlgorithm.replace);
      }

      final members = snapshot['members'] as List<dynamic>? ?? [];
      for (final m in members) {
        final memberMap = Map<String, dynamic>.from(m as Map<String, dynamic>);
        if (currentUserId != null) {
          memberMap['is_current_user'] = (memberMap['id'] == currentUserId) ? 1 : 0;
        }
        await txn.insert(DatabaseTables.tableMembers, memberMap, conflictAlgorithm: ConflictAlgorithm.replace);
      }

      final expenses = snapshot['expenses'] as List<dynamic>? ?? [];
      for (final e in expenses) {
        await txn.insert(DatabaseTables.tableExpenses, e as Map<String, dynamic>, conflictAlgorithm: ConflictAlgorithm.replace);
      }

      final splits = snapshot['splits'] as List<dynamic>? ?? [];
      for (final s in splits) {
        await txn.insert(DatabaseTables.tableExpenseSplits, s as Map<String, dynamic>, conflictAlgorithm: ConflictAlgorithm.replace);
      }

      final shopping = snapshot['shopping_items'] as List<dynamic>? ?? [];
      for (final item in shopping) {
        await txn.insert(DatabaseTables.tableShoppingItems, item as Map<String, dynamic>, conflictAlgorithm: ConflictAlgorithm.replace);
      }

      final contributions = snapshot['contributions'] as List<dynamic>? ?? [];
      for (final c in contributions) {
        await txn.insert(DatabaseTables.tableContributions, c as Map<String, dynamic>, conflictAlgorithm: ConflictAlgorithm.replace);
      }

      final settlements = snapshot['settlements'] as List<dynamic>? ?? [];
      for (final set in settlements) {
        await txn.insert(DatabaseTables.tableSettlements, set as Map<String, dynamic>, conflictAlgorithm: ConflictAlgorithm.replace);
      }
    });
  }
}
