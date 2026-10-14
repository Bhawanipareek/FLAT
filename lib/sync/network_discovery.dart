import 'dart:async';
import 'dart:io';
import 'package:network_info_plus/network_info_plus.dart';

class NetworkDiscovery {
  final NetworkInfo _networkInfo = NetworkInfo();

  /// Get the current device's Wi-Fi IPv4 address
  Future<String?> getLocalIpAddress() async {
    try {
      final wifiIp = await _networkInfo.getWifiIP();
      if (wifiIp != null && wifiIp.isNotEmpty && wifiIp != '0.0.0.0') {
        return wifiIp;
      }
    } catch (_) {
      // Fallback to NetworkInterface
    }

    try {
      final interfaces = await NetworkInterface.list(
        type: InternetAddressType.IPv4,
        includeLoopback: false,
      );

      for (final interface in interfaces) {
        for (final addr in interface.addresses) {
          final ip = addr.address;
          // Prefer private local subnets (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
          if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
            return ip;
          }
        }
      }

      if (interfaces.isNotEmpty && interfaces.first.addresses.isNotEmpty) {
        return interfaces.first.addresses.first.address;
      }
    } catch (_) {
      // Network lookup failed
    }

    return null;
  }

  /// Extracts subnet prefix, e.g. "192.168.1." from "192.168.1.45"
  static String? getSubnetPrefix(String ip) {
    final parts = ip.split('.');
    if (parts.length == 4) {
      return '${parts[0]}.${parts[1]}.${parts[2]}.';
    }
    return null;
  }

  /// Quickly probe a list of candidate IPs or subnet range on given port
  Stream<String> scanSubnet(String localIp, int targetPort, {int maxHosts = 254}) async* {
    final prefix = getSubnetPrefix(localIp);
    if (prefix == null) return;

    final myLastOctet = int.tryParse(localIp.split('.').last) ?? 0;

    // Scan in parallel batches of 20
    const batchSize = 20;
    for (int i = 1; i <= maxHosts; i += batchSize) {
      final batchTasks = <Future<String?>>[];
      for (int j = i; j < i + batchSize && j <= maxHosts; j++) {
        if (j == myLastOctet) continue; // skip self
        final targetIp = '$prefix$j';
        batchTasks.add(_probeSocket(targetIp, targetPort));
      }

      final results = await Future.wait(batchTasks);
      for (final foundIp in results) {
        if (foundIp != null) {
          yield foundIp;
        }
      }
    }
  }

  static Future<String?> _probeSocket(String host, int port) async {
    try {
      final socket = await Socket.connect(
        host,
        port,
        timeout: const Duration(milliseconds: 350),
      );
      socket.destroy();
      return host;
    } catch (_) {
      return null;
    }
  }
}
