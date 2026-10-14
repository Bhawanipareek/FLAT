import 'package:sqflite/sqflite.dart';
import '../database/app_database.dart';
import '../database/database_tables.dart';
import '../models/attendance_record_model.dart';
import '../models/salary_profile_model.dart';

class SalaryRepository {
  final AppDatabase _appDatabase;

  SalaryRepository([AppDatabase? appDatabase])
      : _appDatabase = appDatabase ?? AppDatabase.instance;

  Future<SalaryProfileModel> getSalaryProfile() async {
    final db = await _appDatabase.database;
    final results = await db.query(
      DatabaseTables.tableSalaryProfile,
      where: 'id = ?',
      whereArgs: ['default_profile'],
    );

    if (results.isNotEmpty) {
      return SalaryProfileModel.fromMap(results.first);
    }

    // Default profile if none saved
    final defaultProfile = SalaryProfileModel(updatedAt: DateTime.now());
    await saveSalaryProfile(defaultProfile);
    return defaultProfile;
  }

  Future<void> saveSalaryProfile(SalaryProfileModel profile) async {
    final db = await _appDatabase.database;
    await db.insert(
      DatabaseTables.tableSalaryProfile,
      profile.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<AttendanceRecordModel>> getAttendanceForMonth(DateTime month) async {
    final db = await _appDatabase.database;
    final year = month.year;
    final m = month.month.toString().padLeft(2, '0');
    final prefix = '$year-$m';

    final results = await db.query(
      DatabaseTables.tableAttendance,
      where: "date LIKE '$prefix%'",
      orderBy: 'date ASC',
    );

    return results.map((map) => AttendanceRecordModel.fromMap(map)).toList();
  }

  Future<void> markAttendance({
    required DateTime date,
    required String status,
    String? notes,
  }) async {
    final db = await _appDatabase.database;
    final dateString =
        "${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}";
    final record = AttendanceRecordModel(
      id: 'att_$dateString',
      dateString: dateString,
      status: status,
      notes: notes,
      updatedAt: DateTime.now(),
    );

    await db.insert(
      DatabaseTables.tableAttendance,
      record.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> deleteAttendanceRecord(String dateString) async {
    final db = await _appDatabase.database;
    await db.delete(
      DatabaseTables.tableAttendance,
      where: 'date = ?',
      whereArgs: [dateString],
    );
  }
}
