import 'package:flutter/foundation.dart';
import '../../core/constants/app_constants.dart';
import '../../core/utils/id_generator.dart';
import '../../data/models/group_model.dart';
import '../../data/models/member_model.dart';
import '../../data/repositories/group_repository.dart';
import '../../data/repositories/sync_repository.dart';
import '../../data/services/preferences_service.dart';
import '../../sync/p2p_sync_manager.dart';

class AppStateProvider extends ChangeNotifier {
  final PreferencesService _prefs;
  final GroupRepository _groupRepository;
  final SyncRepository _syncRepository;
  final P2pSyncManager syncManager;

  GroupModel? _activeGroup;
  List<MemberModel> _members = [];
  bool _isLoading = true;
  bool _isDarkMode = false;
  String? _currentUserId;
  String? _currentUserName;

  AppStateProvider({
    required PreferencesService prefs,
    required this.syncManager,
    GroupRepository? groupRepository,
    SyncRepository? syncRepository,
  })  : _prefs = prefs,
        _groupRepository = groupRepository ?? GroupRepository(),
        _syncRepository = syncRepository ?? SyncRepository() {
    _isDarkMode = _prefs.isDarkMode;
    _currentUserId = _prefs.currentUserId;
    _currentUserName = _prefs.currentUserName;
  }

  bool get isLoading => _isLoading;
  bool get isDarkMode => _isDarkMode;
  GroupModel? get activeGroup => _activeGroup;
  List<MemberModel> get members => List.unmodifiable(_members);
  String? get currentUserId => _currentUserId;
  String? get currentUserName => _currentUserName;
  MemberModel? get currentUserMember {
    if (_currentUserId == null) return null;
    try {
      return _members.firstWhere((m) => m.id == _currentUserId || m.isCurrentUser);
    } catch (_) {
      return null;
    }
  }

  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    // Ensure user profile exists
    if (_currentUserId == null) {
      _currentUserId = IdGenerator.generateId();
      _currentUserName = 'Me';
      await _prefs.setCurrentUserId(_currentUserId!);
      await _prefs.setCurrentUserName(_currentUserName!);
    }

    final activeGroupId = _prefs.activeGroupId;
    if (activeGroupId != null) {
      _activeGroup = await _groupRepository.getGroupById(activeGroupId);
      if (_activeGroup != null) {
        _members = await _groupRepository.getGroupMembers(activeGroupId);
        await syncManager.initialize(
          activeGroupId: _activeGroup!.id,
          deviceId: _currentUserId!,
          memberName: _currentUserName ?? 'Roommate',
        );
      }
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> updateProfile(String name, {String? phone}) async {
    _currentUserName = name;
    await _prefs.setCurrentUserName(name);
    if (phone != null) {
      await _prefs.setCurrentCurrentUserPhone(phone);
    }

    if (_activeGroup != null && _currentUserId != null) {
      final myMember = currentUserMember;
      if (myMember != null) {
        final updated = myMember.copyWith(
          name: name,
          phone: phone,
          updatedAt: DateTime.now(),
        );
        await _groupRepository.updateMember(updated);
        await _syncRepository.logChange(
          groupId: _activeGroup!.id,
          entityType: 'member',
          entityId: updated.id,
          operation: 'update',
          payload: updated.toMap(),
        );
        await refreshMembers();
      }
    }
    notifyListeners();
  }

  Future<void> toggleDarkMode() async {
    _isDarkMode = !_isDarkMode;
    await _prefs.setDarkMode(_isDarkMode);
    notifyListeners();
  }

  Future<GroupModel> createGroup({
    required String name,
    String currency = AppConstants.defaultCurrency,
    String currencyCode = AppConstants.defaultCurrencyCode,
  }) async {
    final now = DateTime.now();
    final groupId = IdGenerator.generateId();
    final pairingCode = IdGenerator.generateGroupCode();
    final pairingSecret = IdGenerator.generateToken();

    final group = GroupModel(
      id: groupId,
      name: name,
      currency: currency,
      currencyCode: currencyCode,
      pairingCode: pairingCode,
      pairingSecret: pairingSecret,
      createdAt: now,
      updatedAt: now,
    );

    await _groupRepository.insertGroup(group);

    // Create current user as admin member
    final myMember = MemberModel(
      id: _currentUserId!,
      groupId: groupId,
      name: _currentUserName ?? 'Roommate',
      phone: _prefs.currentUserPhone,
      isCurrentUser: true,
      role: 'admin',
      joinedAt: now,
      updatedAt: now,
    );

    await _groupRepository.insertMember(myMember);

    // Log to sync queue
    await _syncRepository.logChange(
      groupId: groupId,
      entityType: 'group',
      entityId: groupId,
      operation: 'insert',
      payload: group.toMap(),
    );
    await _syncRepository.logChange(
      groupId: groupId,
      entityType: 'member',
      entityId: myMember.id,
      operation: 'insert',
      payload: myMember.toMap(),
    );

    _activeGroup = group;
    await _prefs.setActiveGroupId(groupId);
    await refreshMembers();

    await syncManager.initialize(
      activeGroupId: groupId,
      deviceId: _currentUserId!,
      memberName: _currentUserName ?? 'Roommate',
    );

    notifyListeners();
    return group;
  }

  Future<void> addMember({
    required String name,
    String? phone,
    String role = 'member',
  }) async {
    if (_activeGroup == null) return;

    final now = DateTime.now();
    final member = MemberModel(
      id: IdGenerator.generateId(),
      groupId: _activeGroup!.id,
      name: name,
      phone: phone,
      isCurrentUser: false,
      role: role,
      joinedAt: now,
      updatedAt: now,
    );

    await _groupRepository.insertMember(member);
    await _syncRepository.logChange(
      groupId: _activeGroup!.id,
      entityType: 'member',
      entityId: member.id,
      operation: 'insert',
      payload: member.toMap(),
    );

    await refreshMembers();
    syncManager.syncNow(_activeGroup!.id);
  }

  Future<void> refreshMembers() async {
    if (_activeGroup == null) return;
    _members = await _groupRepository.getGroupMembers(_activeGroup!.id);
    notifyListeners();
  }

  Future<void> setActiveGroup(GroupModel group) async {
    _activeGroup = group;
    await _prefs.setActiveGroupId(group.id);
    await refreshMembers();
    await syncManager.initialize(
      activeGroupId: group.id,
      deviceId: _currentUserId!,
      memberName: _currentUserName ?? 'Roommate',
    );
    notifyListeners();
  }
}
