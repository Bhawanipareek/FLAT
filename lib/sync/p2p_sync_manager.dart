import 'dart:async';
import 'package:flutter/foundation.dart';
import '../core/constants/app_constants.dart';
import '../data/models/group_model.dart';
import '../data/models/pairing_payload.dart';
import '../data/repositories/group_repository.dart';
import '../data/repositories/sync_repository.dart';
import '../data/services/preferences_service.dart';
import 'network_discovery.dart';
import 'p2p_sync_client.dart';
import 'p2p_sync_server.dart';
import 'sync_models.dart';

class P2pSyncManager extends ChangeNotifier {
  final GroupRepository _groupRepository;
  final SyncRepository _syncRepository;
  final PreferencesService _prefs;
  final P2pSyncServer _server;
  final P2pSyncClient _client;
  final NetworkDiscovery _networkDiscovery;

  SyncStatus _status = SyncStatus.offline;
  String? _statusMessage;
  DateTime? _lastSyncTime;
  String? _localIp;
  Timer? _autoSyncTimer;
  bool _isSyncingInProgress = false;
  final StreamController<int> _dataChangedController = StreamController<int>.broadcast();
  final List<PeerDeviceInfo> _knownPeers = [];

  P2pSyncManager({
    required PreferencesService prefs,
    GroupRepository? groupRepository,
    SyncRepository? syncRepository,
    P2pSyncServer? server,
    P2pSyncClient? client,
    NetworkDiscovery? networkDiscovery,
  })  : _prefs = prefs,
        _groupRepository = groupRepository ?? GroupRepository(),
        _syncRepository = syncRepository ?? SyncRepository(),
        _server = server ?? P2pSyncServer(),
        _client = client ?? P2pSyncClient(),
        _networkDiscovery = networkDiscovery ?? NetworkDiscovery() {
    _lastSyncTime = _prefs.lastSyncTime;
  }

  SyncStatus get status => _status;
  String? get statusMessage => _statusMessage;
  DateTime? get lastSyncTime => _lastSyncTime;
  String? get localIp => _localIp;
  int get serverPort => _server.port;
  List<PeerDeviceInfo> get knownPeers => List.unmodifiable(_knownPeers);
  Stream<int> get onDataChanged => _dataChangedController.stream;

  /// Initializes local server and loads network IP
  Future<void> initialize({
    required String activeGroupId,
    required String deviceId,
    required String memberName,
  }) async {
    _localIp = await _networkDiscovery.getLocalIpAddress();

    try {
      await _server.start(
        port: _prefs.httpPort,
        activeGroupId: activeGroupId,
        deviceId: deviceId,
        memberName: memberName,
      );
      _status = _localIp != null ? SyncStatus.connected : SyncStatus.offline;
      _statusMessage = _localIp != null
          ? 'Wi-Fi Server active on $_localIp:${_server.port}'
          : 'Wi-Fi not connected';
    } catch (e) {
      _status = SyncStatus.syncFailed;
      _statusMessage = 'Could not start Wi-Fi sync server: $e';
    }

    notifyListeners();

    if (_prefs.autoSyncEnabled) {
      startAutoSync(activeGroupId);
    }
  }

  void startAutoSync(String groupId) {
    _autoSyncTimer?.cancel();
    // Real-time synchronization every 2 seconds across flatmate devices on Wi-Fi
    _autoSyncTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      syncNow(groupId);
    });
  }

  void stopAutoSync() {
    _autoSyncTimer?.cancel();
    _autoSyncTimer = null;
  }

  void addOrUpdatePeer(PeerDeviceInfo peer) {
    final index = _knownPeers.indexWhere((p) => p.ip == peer.ip && p.port == peer.port);
    if (index >= 0) {
      _knownPeers[index] = peer;
    } else {
      _knownPeers.add(peer);
    }
    notifyListeners();
  }

  /// Triggers immediate 2-way incremental sync with all known peers
  Future<void> syncNow(String groupId) async {
    if (_isSyncingInProgress) return;
    _isSyncingInProgress = true;

    try {
      final group = await _groupRepository.getGroupById(groupId);
      if (group == null) {
        _status = SyncStatus.offline;
        _statusMessage = 'No active group found';
        notifyListeners();
        return;
      }

      _localIp = await _networkDiscovery.getLocalIpAddress();
      if (_localIp == null) {
        _status = SyncStatus.offline;
        _statusMessage = 'Device is offline. Connect to Wi-Fi to sync.';
        notifyListeners();
        return;
      }

      if (_knownPeers.isEmpty) {
        _status = SyncStatus.connected;
        _statusMessage = 'Ready to sync. Pair with a flatmate over Wi-Fi.';
        notifyListeners();
        return;
      }

      _status = SyncStatus.syncing;
      _statusMessage = 'Syncing with flatmate devices...';
      notifyListeners();

      int totalApplied = 0;
      bool anySuccess = false;
      String? lastError;

      final myDeviceId = _prefs.currentUserId ?? 'unknown_device';
      final myMemberId = _prefs.currentUserId ?? 'unknown_member';

      for (final peer in List<PeerDeviceInfo>.from(_knownPeers)) {
        try {
          // 1. Fetch pending local changes to push
          final pendingLogs = await _syncRepository.getChangesSince(groupId, _lastSyncTime);
          if (pendingLogs.isNotEmpty) {
            final pushReq = SyncPushRequest(
              groupId: groupId,
              pairingToken: group.pairingSecret,
              senderDeviceId: myDeviceId,
              senderMemberId: myMemberId,
              logs: pendingLogs,
            );
            await _client.pushChanges(ip: peer.ip, port: peer.port, pushRequest: pushReq);
          }

          // 2. Pull latest peer changes
          final pullReq = SyncPullRequest(
            groupId: groupId,
            pairingToken: group.pairingSecret,
            sinceTimestamp: _lastSyncTime,
          );
          final incomingLogs = await _client.pullChanges(ip: peer.ip, port: peer.port, pullRequest: pullReq);

          if (incomingLogs.isNotEmpty) {
            final applied = await _syncRepository.ingestPeerChanges(groupId: groupId, peerLogs: incomingLogs);
            totalApplied += applied;
          }

          anySuccess = true;
          addOrUpdatePeer(peer.copyWith(lastSeen: DateTime.now()));
        } catch (e) {
          lastError = e.toString();
        }
      }

      if (anySuccess) {
        _lastSyncTime = DateTime.now();
        await _prefs.setLastSyncTime(_lastSyncTime!);
        await _syncRepository.markChangesSynced(groupId, _lastSyncTime!);
        _status = SyncStatus.connected;
        _statusMessage = 'Synced ($totalApplied changes received)';
        if (totalApplied > 0) {
          _dataChangedController.add(totalApplied);
        }
      } else {
        _status = SyncStatus.syncFailed;
        _statusMessage = lastError ?? 'Failed to reach flatmate phones on Wi-Fi';
      }

      notifyListeners();
    } finally {
      _isSyncingInProgress = false;
    }
  }

  /// Pair with host device using QR Payload
  Future<GroupModel> pairWithQr({
    required PairingPayload payload,
    required String myMemberName,
    String? myMemberPhone,
  }) async {
    _status = SyncStatus.syncing;
    _statusMessage = 'Pairing with ${payload.senderMemberName}...';
    notifyListeners();

    try {
      final myMemberId = _prefs.currentUserId ?? DateTime.now().millisecondsSinceEpoch.toString();

      final result = await _client.pairWithHost(
        ip: payload.hostIp,
        port: payload.port,
        groupId: payload.groupId,
        pairingToken: payload.pairingToken,
        memberId: myMemberId,
        memberName: myMemberName,
        memberPhone: myMemberPhone,
      );

      final snapshot = result['snapshot'] as Map<String, dynamic>;
      await _syncRepository.importGroupSnapshot(snapshot, currentUserId: myMemberId);

      // Register host as a known peer
      addOrUpdatePeer(PeerDeviceInfo(
        ip: payload.hostIp,
        port: payload.port,
        deviceId: payload.senderDeviceId,
        memberName: payload.senderMemberName,
        lastSeen: DateTime.now(),
      ));

      _server.updateActiveGroup(payload.groupId);
      await _prefs.setActiveGroupId(payload.groupId);

      _lastSyncTime = DateTime.now();
      await _prefs.setLastSyncTime(_lastSyncTime!);

      _status = SyncStatus.connected;
      _statusMessage = 'Paired with ${payload.groupName}!';
      notifyListeners();

      final group = await _groupRepository.getGroupById(payload.groupId);
      return group!;
    } catch (e) {
      _status = SyncStatus.syncFailed;
      _statusMessage = 'Pairing failed: $e';
      notifyListeners();
      rethrow;
    }
  }

  /// Manual IP Connection fallback
  Future<void> connectToPeerManual({
    required String ip,
    required int port,
    required String groupId,
  }) async {
    _status = SyncStatus.syncing;
    _statusMessage = 'Connecting to $ip:$port...';
    notifyListeners();

    try {
      final pingRes = await _client.ping(ip, port);
      final peerMemberName = (pingRes['member_name'] as String?) ?? 'Flatmate';
      final peerDeviceId = (pingRes['device_id'] as String?) ?? 'unknown_device';

      addOrUpdatePeer(PeerDeviceInfo(
        ip: ip,
        port: port,
        deviceId: peerDeviceId,
        memberName: peerMemberName,
        lastSeen: DateTime.now(),
      ));

      await syncNow(groupId);
    } catch (e) {
      _status = SyncStatus.syncFailed;
      _statusMessage = 'Manual connection failed: $e';
      notifyListeners();
      rethrow;
    }
  }

  @override
  void dispose() {
    _autoSyncTimer?.cancel();
    _server.stop();
    _client.close();
    super.dispose();
  }
}
