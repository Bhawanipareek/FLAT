import 'dart:convert';
import 'dart:io';
import '../data/models/member_model.dart';
import '../data/models/sync_log_model.dart';
import '../data/repositories/group_repository.dart';
import '../data/repositories/sync_repository.dart';
import 'sync_models.dart';

class P2pSyncServer {
  final GroupRepository _groupRepository;
  final SyncRepository _syncRepository;
  HttpServer? _server;
  int _port = 8089;
  String? _activeGroupId;
  String? _deviceId;
  String? _memberName;

  P2pSyncServer({
    GroupRepository? groupRepository,
    SyncRepository? syncRepository,
  })  : _groupRepository = groupRepository ?? GroupRepository(),
        _syncRepository = syncRepository ?? SyncRepository();

  bool get isRunning => _server != null;
  int get port => _port;

  Future<void> start({
    required int port,
    required String activeGroupId,
    required String deviceId,
    required String memberName,
  }) async {
    if (_server != null) {
      await stop();
    }

    _port = port;
    _activeGroupId = activeGroupId;
    _deviceId = deviceId;
    _memberName = memberName;

    try {
      _server = await HttpServer.bind(InternetAddress.anyIPv4, _port);
      _server!.listen(_handleRequest);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> stop() async {
    await _server?.close(force: true);
    _server = null;
  }

  void updateActiveGroup(String groupId) {
    _activeGroupId = groupId;
  }

  Future<void> _handleRequest(HttpRequest request) async {
    // Enable CORS for flexibility
    request.response.headers.add('Access-Control-Allow-Origin', '*');
    request.response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    request.response.headers.add('Access-Control-Allow-Headers', 'Content-Type, X-Pairing-Token');
    request.response.headers.contentType = ContentType.json;

    if (request.method == 'OPTIONS') {
      request.response.statusCode = HttpStatus.ok;
      await request.response.close();
      return;
    }

    final path = request.uri.path;

    try {
      if (request.method == 'GET' && path == '/api/v1/ping') {
        await _handlePing(request);
      } else if (request.method == 'POST' && path == '/api/v1/pair') {
        await _handlePair(request);
      } else if (request.method == 'POST' && path == '/api/v1/sync/push') {
        await _handleSyncPush(request);
      } else if (request.method == 'POST' && path == '/api/v1/sync/pull') {
        await _handleSyncPull(request);
      } else {
        request.response.statusCode = HttpStatus.notFound;
        request.response.write(jsonEncode({'error': 'Not Found'}));
        await request.response.close();
      }
    } catch (e) {
      request.response.statusCode = HttpStatus.internalServerError;
      request.response.write(jsonEncode({'error': e.toString()}));
      await request.response.close();
    }
  }

  Future<void> _handlePing(HttpRequest request) async {
    request.response.statusCode = HttpStatus.ok;
    request.response.write(jsonEncode({
      'status': 'ok',
      'app': 'flat_expense_manager',
      'device_id': _deviceId,
      'member_name': _memberName,
      'group_id': _activeGroupId,
      'timestamp': DateTime.now().toIso8601String(),
    }));
    await request.response.close();
  }

  Future<void> _handlePair(HttpRequest request) async {
    final body = await utf8.decoder.bind(request).join();
    final data = jsonDecode(body) as Map<String, dynamic>;

    final reqGroupId = data['group_id'] as String?;
    final pairingToken = data['pairing_token'] as String?;
    final newMemberName = data['member_name'] as String?;
    final newMemberId = data['member_id'] as String?;
    final newMemberPhone = data['member_phone'] as String?;

    if (reqGroupId == null || pairingToken == null || newMemberId == null || newMemberName == null) {
      request.response.statusCode = HttpStatus.badRequest;
      request.response.write(jsonEncode({'error': 'Missing required fields'}));
      await request.response.close();
      return;
    }

    final group = await _groupRepository.getGroupById(reqGroupId);
    if (group == null || group.pairingSecret != pairingToken) {
      request.response.statusCode = HttpStatus.unauthorized;
      request.response.write(jsonEncode({'error': 'Unauthorized pairing token'}));
      await request.response.close();
      return;
    }

    // Add this new peer member to local group if not already present
    final existingMember = await _groupRepository.getMemberById(newMemberId);
    if (existingMember == null) {
      final now = DateTime.now();
      final newMember = MemberModel(
        id: newMemberId,
        groupId: reqGroupId,
        name: newMemberName,
        phone: newMemberPhone,
        isCurrentUser: false,
        role: 'member',
        joinedAt: now,
        updatedAt: now,
      );
      await _groupRepository.insertMember(newMember);

      // Log this member addition to sync logs
      await _syncRepository.logChange(
        groupId: reqGroupId,
        entityType: 'member',
        entityId: newMemberId,
        operation: 'insert',
        payload: newMember.toMap(),
      );
    }

    // Return complete snapshot of the group database to initialize the new device
    final snapshot = await _syncRepository.exportGroupSnapshot(reqGroupId);
    request.response.statusCode = HttpStatus.ok;
    request.response.write(jsonEncode({
      'success': true,
      'snapshot': snapshot,
      'host_member_name': _memberName,
      'host_device_id': _deviceId,
    }));
    await request.response.close();
  }

  Future<void> _handleSyncPush(HttpRequest request) async {
    final body = await utf8.decoder.bind(request).join();
    final data = jsonDecode(body) as Map<String, dynamic>;

    final pushReq = SyncPushRequest.fromMap(data);

    final group = await _groupRepository.getGroupById(pushReq.groupId);
    if (group == null || group.pairingSecret != pushReq.pairingToken) {
      request.response.statusCode = HttpStatus.unauthorized;
      request.response.write(jsonEncode({'error': 'Unauthorized pairing token'}));
      await request.response.close();
      return;
    }

    final appliedCount = await _syncRepository.ingestPeerChanges(
      groupId: pushReq.groupId,
      peerLogs: pushReq.logs,
    );

    request.response.statusCode = HttpStatus.ok;
    request.response.write(jsonEncode({
      'success': true,
      'applied_count': appliedCount,
      'server_timestamp': DateTime.now().toIso8601String(),
    }));
    await request.response.close();
  }

  Future<void> _handleSyncPull(HttpRequest request) async {
    final body = await utf8.decoder.bind(request).join();
    final data = jsonDecode(body) as Map<String, dynamic>;

    final pullReq = SyncPullRequest.fromMap(data);

    final group = await _groupRepository.getGroupById(pullReq.groupId);
    if (group == null || group.pairingSecret != pullReq.pairingToken) {
      request.response.statusCode = HttpStatus.unauthorized;
      request.response.write(jsonEncode({'error': 'Unauthorized pairing token'}));
      await request.response.close();
      return;
    }

    final changes = await _syncRepository.getChangesSince(
      pullReq.groupId,
      pullReq.sinceTimestamp,
    );

    request.response.statusCode = HttpStatus.ok;
    request.response.write(jsonEncode({
      'success': true,
      'logs': changes.map((c) => c.toMap()).toList(),
      'server_timestamp': DateTime.now().toIso8601String(),
    }));
    await request.response.close();
  }
}
