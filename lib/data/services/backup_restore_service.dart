import 'dart:convert';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../repositories/sync_repository.dart';

class BackupRestoreService {
  final SyncRepository _syncRepository;

  BackupRestoreService([SyncRepository? syncRepository])
      : _syncRepository = syncRepository ?? SyncRepository();

  /// Export complete group data to a timestamped JSON file and trigger share sheet
  Future<String?> exportBackupJson(String groupId, String groupName) async {
    final snapshot = await _syncRepository.exportGroupSnapshot(groupId);
    final jsonStr = const JsonEncoder.withIndent('  ').convert(snapshot);

    final tempDir = await getTemporaryDirectory();
    final dateStr = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    final sanitizedName = groupName.replaceAll(RegExp(r'[^\w\s]+'), '').replaceAll(' ', '_');
    final fileName = 'flat_expense_${sanitizedName}_$dateStr.json';
    final file = File('${tempDir.path}/$fileName');

    await file.writeAsString(jsonStr);

    await Share.shareXFiles(
      [XFile(file.path)],
      subject: 'Flat Expense Manager Backup - $groupName',
      text: 'Backup of $groupName data exported on ${DateTime.now().toLocal()}',
    );

    return file.path;
  }

  /// Pick and import a JSON backup file
  Future<bool> importBackupJson({required String currentUserId}) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['json'],
    );

    if (result == null || result.files.single.path == null) {
      return false;
    }

    final file = File(result.files.single.path!);
    final content = await file.readAsString();

    final decoded = jsonDecode(content) as Map<String, dynamic>;
    if (decoded['groups'] == null || decoded['members'] == null) {
      throw const FormatException('Invalid Flat Expense Manager backup format');
    }

    await _syncRepository.importGroupSnapshot(decoded, currentUserId: currentUserId);
    return true;
  }
}
