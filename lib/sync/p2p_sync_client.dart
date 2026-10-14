import 'dart:async';
import 'dart:convert';
import 'dart:io';
import '../core/constants/app_constants.dart';
import '../data/models/sync_log_model.dart';
import 'sync_models.dart';

class SyncClientException implements Exception {
  final String message;
  final bool isRouterIsolation;

  SyncClientException(this.message, {this.isRouterIsolation = false});

  @override
  String toString() => message;
}

class P2pSyncClient {
  final HttpClient _httpClient = HttpClient()
    ..connectionTimeout = AppConstants.syncTimeout;

  Future<Map<String, dynamic>> ping(String ip, int port) async {
    try {
      final request = await _httpClient.get(ip, port, '/api/v1/ping');
      final response = await request.close().timeout(AppConstants.syncTimeout);
      final body = await utf8.decoder.bind(response).join();

      if (response.statusCode == HttpStatus.ok) {
        return jsonDecode(body) as Map<String, dynamic>;
      } else {
        throw SyncClientException('Ping returned HTTP ${response.statusCode}');
      }
    } on SocketException catch (e) {
      throw SyncClientException(
        'Cannot connect to $ip:$port. Check that both phones are on the same Wi-Fi and router client isolation is off. (${e.message})',
        isRouterIsolation: true,
      );
    } on TimeoutException {
      throw SyncClientException(
        'Connection to $ip:$port timed out. The device may have changed Wi-Fi or router blocked peer communication.',
        isRouterIsolation: true,
      );
    } catch (e) {
      throw SyncClientException('Ping failed: $e');
    }
  }

  Future<Map<String, dynamic>> pairWithHost({
    required String ip,
    required int port,
    required String groupId,
    required String pairingToken,
    required String memberId,
    required String memberName,
    String? memberPhone,
  }) async {
    try {
      final request = await _httpClient.post(ip, port, '/api/v1/pair');
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode({
        'group_id': groupId,
        'pairing_token': pairingToken,
        'member_id': memberId,
        'member_name': memberName,
        'member_phone': memberPhone,
      }));

      final response = await request.close().timeout(AppConstants.syncTimeout);
      final body = await utf8.decoder.bind(response).join();

      if (response.statusCode == HttpStatus.ok) {
        return jsonDecode(body) as Map<String, dynamic>;
      } else if (response.statusCode == HttpStatus.unauthorized) {
        throw SyncClientException('Invalid pairing code or security token.');
      } else {
        throw SyncClientException('Pairing failed: HTTP ${response.statusCode} - $body');
      }
    } on SocketException catch (e) {
      throw SyncClientException(
        'Cannot connect to host $ip:$port. Ensure both phones are connected to the same Wi-Fi network. (${e.message})',
        isRouterIsolation: true,
      );
    } on TimeoutException {
      throw SyncClientException(
        'Pairing request timed out. Local network may block device-to-device communication.',
        isRouterIsolation: true,
      );
    } catch (e) {
      throw SyncClientException('Pairing error: $e');
    }
  }

  Future<int> pushChanges({
    required String ip,
    required int port,
    required SyncPushRequest pushRequest,
  }) async {
    try {
      final request = await _httpClient.post(ip, port, '/api/v1/sync/push');
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode(pushRequest.toMap()));

      final response = await request.close().timeout(AppConstants.syncTimeout);
      final body = await utf8.decoder.bind(response).join();

      if (response.statusCode == HttpStatus.ok) {
        final data = jsonDecode(body) as Map<String, dynamic>;
        return (data['applied_count'] as num?)?.toInt() ?? 0;
      } else {
        throw SyncClientException('Push failed: HTTP ${response.statusCode}');
      }
    } catch (e) {
      if (e is SyncClientException) rethrow;
      throw SyncClientException('Failed to push changes to $ip:$port: $e');
    }
  }

  Future<List<SyncLogModel>> pullChanges({
    required String ip,
    required int port,
    required SyncPullRequest pullRequest,
  }) async {
    try {
      final request = await _httpClient.post(ip, port, '/api/v1/sync/pull');
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode(pullRequest.toMap()));

      final response = await request.close().timeout(AppConstants.syncTimeout);
      final body = await utf8.decoder.bind(response).join();

      if (response.statusCode == HttpStatus.ok) {
        final data = jsonDecode(body) as Map<String, dynamic>;
        final logsList = (data['logs'] as List<dynamic>?) ?? [];
        return logsList.map((m) => SyncLogModel.fromMap(m as Map<String, dynamic>)).toList();
      } else {
        throw SyncClientException('Pull failed: HTTP ${response.statusCode}');
      }
    } catch (e) {
      if (e is SyncClientException) rethrow;
      throw SyncClientException('Failed to pull changes from $ip:$port: $e');
    }
  }

  void close() {
    _httpClient.close(force: true);
  }
}
