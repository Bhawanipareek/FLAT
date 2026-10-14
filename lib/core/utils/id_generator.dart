import 'package:uuid/uuid.dart';

class IdGenerator {
  static const Uuid _uuid = Uuid();

  static String generateId() {
    return _uuid.v4();
  }

  static String generateGroupCode() {
    // 6-character human friendly alphanumeric code for easy verification
    return _uuid.v4().substring(0, 8).toUpperCase();
  }

  static String generateToken() {
    // 32-character secure pairing token
    return '${_uuid.v4()}${_uuid.v4()}'.replaceAll('-', '');
  }
}
