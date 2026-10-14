import 'package:flutter/foundation.dart';
import '../../core/utils/id_generator.dart';
import '../../data/models/contribution_model.dart';
import '../../data/repositories/contribution_repository.dart';
import '../../data/repositories/sync_repository.dart';
import '../../sync/p2p_sync_manager.dart';

class ContributionsProvider extends ChangeNotifier {
  final ContributionRepository _contributionRepository;
  final SyncRepository _syncRepository;
  final P2pSyncManager _syncManager;

  List<ContributionModel> _contributions = [];
  bool _isLoading = false;
  DateTime _selectedMonth = DateTime(DateTime.now().year, DateTime.now().month);
  double _monthlyTotal = 0.0;

  ContributionsProvider({
    required P2pSyncManager syncManager,
    ContributionRepository? contributionRepository,
    SyncRepository? syncRepository,
  })  : _syncManager = syncManager,
        _contributionRepository = contributionRepository ?? ContributionRepository(),
        _syncRepository = syncRepository ?? SyncRepository();

  List<ContributionModel> get contributions => List.unmodifiable(_contributions);
  bool get isLoading => _isLoading;
  DateTime get selectedMonth => _selectedMonth;
  double get monthlyTotal => _monthlyTotal;

  Future<void> loadContributions(String groupId) async {
    _isLoading = true;
    notifyListeners();

    _contributions = await _contributionRepository.getContributionsForGroup(
      groupId,
      month: _selectedMonth,
    );

    _monthlyTotal = await _contributionRepository.getTotalContributionsForMonth(
      groupId,
      _selectedMonth,
    );

    _isLoading = false;
    notifyListeners();
  }

  void setSelectedMonth(DateTime month, String groupId) {
    _selectedMonth = DateTime(month.year, month.month);
    loadContributions(groupId);
  }

  Future<void> saveContribution({
    required String groupId,
    String? existingId,
    required String title,
    required double amount,
    required DateTime date,
    required String payerMemberId,
    String? receiverMemberId,
    String type = 'flat_fund',
    String? notes,
  }) async {
    final now = DateTime.now();
    final item = ContributionModel(
      id: existingId ?? IdGenerator.generateId(),
      groupId: groupId,
      title: title,
      amount: amount,
      date: date,
      payerMemberId: payerMemberId,
      receiverMemberId: receiverMemberId,
      type: type,
      notes: notes,
      status: 'completed',
      createdAt: now,
      updatedAt: now,
    );

    await _contributionRepository.saveContribution(item);

    await _syncRepository.logChange(
      groupId: groupId,
      entityType: 'contribution',
      entityId: item.id,
      operation: existingId == null ? 'insert' : 'update',
      payload: item.toMap(),
    );

    await loadContributions(groupId);
    _syncManager.syncNow(groupId);
  }

  Future<void> deleteContribution(String id, String groupId) async {
    await _contributionRepository.deleteContribution(id);

    await _syncRepository.logChange(
      groupId: groupId,
      entityType: 'contribution',
      entityId: id,
      operation: 'delete',
      payload: {'id': id, 'is_deleted': 1, 'updated_at': DateTime.now().toIso8601String()},
    );

    await loadContributions(groupId);
    _syncManager.syncNow(groupId);
  }
}
