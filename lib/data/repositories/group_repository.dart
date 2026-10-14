import 'package:sqflite/sqflite.dart';
import '../database/app_database.dart';
import '../database/database_tables.dart';
import '../models/group_model.dart';
import '../models/member_model.dart';

class GroupRepository {
  final AppDatabase _appDatabase;

  GroupRepository([AppDatabase? appDatabase])
      : _appDatabase = appDatabase ?? AppDatabase.instance;

  Future<void> insertGroup(GroupModel group, {DatabaseExecutor? txn}) async {
    final db = txn ?? await _appDatabase.database;
    await db.insert(
      DatabaseTables.tableGroups,
      group.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> updateGroup(GroupModel group, {DatabaseExecutor? txn}) async {
    final db = txn ?? await _appDatabase.database;
    await db.update(
      DatabaseTables.tableGroups,
      group.toMap(),
      where: 'id = ?',
      whereArgs: [group.id],
    );
  }

  Future<GroupModel?> getGroupById(String groupId) async {
    final db = await _appDatabase.database;
    final results = await db.query(
      DatabaseTables.tableGroups,
      where: 'id = ? AND is_deleted = 0',
      whereArgs: [groupId],
    );
    if (results.isNotEmpty) {
      return GroupModel.fromMap(results.first);
    }
    return null;
  }

  Future<List<GroupModel>> getAllGroups() async {
    final db = await _appDatabase.database;
    final results = await db.query(
      DatabaseTables.tableGroups,
      where: 'is_deleted = 0',
      orderBy: 'created_at DESC',
    );
    return results.map((map) => GroupModel.fromMap(map)).toList();
  }

  Future<void> insertMember(MemberModel member, {DatabaseExecutor? txn}) async {
    final db = txn ?? await _appDatabase.database;
    await db.insert(
      DatabaseTables.tableMembers,
      member.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> updateMember(MemberModel member, {DatabaseExecutor? txn}) async {
    final db = txn ?? await _appDatabase.database;
    await db.update(
      DatabaseTables.tableMembers,
      member.toMap(),
      where: 'id = ?',
      whereArgs: [member.id],
    );
  }

  Future<List<MemberModel>> getGroupMembers(String groupId) async {
    final db = await _appDatabase.database;
    final results = await db.query(
      DatabaseTables.tableMembers,
      where: 'group_id = ? AND is_deleted = 0',
      whereArgs: [groupId],
      orderBy: 'joined_at ASC',
    );
    return results.map((map) => MemberModel.fromMap(map)).toList();
  }

  Future<MemberModel?> getCurrentUserMember(String groupId) async {
    final db = await _appDatabase.database;
    final results = await db.query(
      DatabaseTables.tableMembers,
      where: 'group_id = ? AND is_current_user = 1 AND is_deleted = 0',
      whereArgs: [groupId],
    );
    if (results.isNotEmpty) {
      return MemberModel.fromMap(results.first);
    }
    return null;
  }

  Future<MemberModel?> getMemberById(String memberId) async {
    final db = await _appDatabase.database;
    final results = await db.query(
      DatabaseTables.tableMembers,
      where: 'id = ? AND is_deleted = 0',
      whereArgs: [memberId],
    );
    if (results.isNotEmpty) {
      return MemberModel.fromMap(results.first);
    }
    return null;
  }

  Future<void> deleteMember(String memberId) async {
    final db = await _appDatabase.database;
    await db.update(
      DatabaseTables.tableMembers,
      {
        'is_deleted': 1,
        'updated_at': DateTime.now().toIso8601String(),
      },
      where: 'id = ?',
      whereArgs: [memberId],
    );
  }
}
