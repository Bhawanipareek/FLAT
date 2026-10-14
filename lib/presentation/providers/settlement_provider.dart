import 'package:flutter/foundation.dart';
import '../../core/utils/id_generator.dart';
import '../../data/models/expense_model.dart';
import '../../data/models/member_model.dart';
import '../../data/models/settlement_model.dart';
import '../../data/repositories/expense_repository.dart';
import '../../data/repositories/group_repository.dart';
import '../../data/repositories/settlement_repository.dart';
import '../../data/repositories/sync_repository.dart';
import '../../domain/settlement_calculator.dart';
import '../../sync/p2p_sync_manager.dart';

class SettlementProvider extends ChangeNotifier {
  final SettlementRepository _settlementRepository;
  final ExpenseRepository _expenseRepository;
  final GroupRepository _groupRepository;
  final SyncRepository _syncRepository;
  final P2pSyncManager _syncManager;

  List<SettlementModel> _settlements = [];
  SettlementCalculationResult? _calculationResult;
  bool _isLoading = false;

  SettlementProvider({
    required P2pSyncManager syncManager,
    SettlementRepository? settlementRepository,
    ExpenseRepository? expenseRepository,
    GroupRepository? groupRepository,
    SyncRepository? syncRepository,
  })  : _syncManager = syncManager,
        _settlementRepository = settlementRepository ?? SettlementRepository(),
        _expenseRepository = expenseRepository ?? ExpenseRepository(),
        _groupRepository = groupRepository ?? GroupRepository(),
        _syncRepository = syncRepository ?? SyncRepository();

  List<SettlementModel> get settlements => List.unmodifiable(_settlements);
  SettlementCalculationResult? get calculationResult => _calculationResult;
  bool get isLoading => _isLoading;

  Future<void> recalculate(String groupId, String currentUserId) async {
    _isLoading = true;
    notifyListeners();

    final members = await _groupRepository.getGroupMembers(groupId);
    final expenses = await _expenseRepository.getExpensesForGroup(groupId);
    _settlements = await _settlementRepository.getSettlementsForGroup(groupId);

    _calculationResult = SettlementCalculator.calculate(
      members: members,
      expenses: expenses,
      settlements: _settlements,
      currentUserId: currentUserId,
    );

    _isLoading = false;
    notifyListeners();
  }

  Future<void> recordSettlement({
    required String groupId,
    required String fromMemberId,
    required String toMemberId,
    required double amount,
    required DateTime settledAt,
    String paymentMethod = 'upi',
    String? notes,
    required String currentUserId,
  }) async {
    final settlement = SettlementModel(
      id: IdGenerator.generateId(),
      groupId: groupId,
      fromMemberId: fromMemberId,
      toMemberId: toMemberId,
      amount: amount,
      settledAt: settledAt,
      paymentMethod: paymentMethod,
      notes: notes,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    await _settlementRepository.saveSettlement(settlement);

    await _syncRepository.logChange(
      groupId: groupId,
      entityType: 'settlement',
      entityId: settlement.id,
      operation: 'insert',
      payload: settlement.toMap(),
    );

    await recalculate(groupId, currentUserId);
    _syncManager.syncNow(groupId);
  }

  Future<void> deleteSettlement(String id, String groupId, String currentUserId) async {
    await _settlementRepository.deleteSettlement(id);

    await _syncRepository.logChange(
      groupId: groupId,
      entityType: 'settlement',
      entityId: id,
      operation: 'delete',
      payload: {'id': id, 'is_deleted': 1, 'updated_at': DateTime.now().toIso8601String()},
    );

    await recalculate(groupId, currentUserId);
    _syncManager.syncNow(groupId);
  }
}
