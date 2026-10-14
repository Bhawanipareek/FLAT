import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/app_constants.dart';

class PreferencesService {
  final SharedPreferences _prefs;

  PreferencesService(this._prefs);

  static Future<PreferencesService> create() async {
    final prefs = await SharedPreferences.getInstance();
    return PreferencesService(prefs);
  }

  String? get currentUserId => _prefs.getString(AppConstants.prefCurrentUserId);
  Future<bool> setCurrentUserId(String value) =>
      _prefs.setString(AppConstants.prefCurrentUserId, value);

  String? get currentUserName => _prefs.getString(AppConstants.prefCurrentUserName);
  Future<bool> setCurrentUserName(String value) =>
      _prefs.setString(AppConstants.prefCurrentUserName, value);

  String? get currentUserPhone => _prefs.getString(AppConstants.prefCurrentUserPhone);
  Future<bool> setCurrentCurrentUserPhone(String value) =>
      _prefs.setString(AppConstants.prefCurrentUserPhone, value);

  String? get activeGroupId => _prefs.getString(AppConstants.prefActiveGroupId);
  Future<bool> setActiveGroupId(String? value) {
    if (value == null) {
      return _prefs.remove(AppConstants.prefActiveGroupId);
    }
    return _prefs.setString(AppConstants.prefActiveGroupId, value);
  }

  bool get isDarkMode => _prefs.getBool(AppConstants.prefDarkMode) ?? false;
  Future<bool> setDarkMode(bool value) =>
      _prefs.setBool(AppConstants.prefDarkMode, value);

  DateTime? get lastSyncTime {
    final iso = _prefs.getString(AppConstants.prefLastSyncTime);
    return iso != null ? DateTime.tryParse(iso) : null;
  }

  Future<bool> setLastSyncTime(DateTime value) =>
      _prefs.setString(AppConstants.prefLastSyncTime, value.toIso8601String());

  int get httpPort => _prefs.getInt(AppConstants.prefHttpPort) ?? AppConstants.defaultHttpPort;
  Future<bool> setHttpPort(int value) => _prefs.setInt(AppConstants.prefHttpPort, value);

  bool get autoSyncEnabled => _prefs.getBool(AppConstants.prefAutoSync) ?? true;
  Future<bool> setAutoSyncEnabled(bool value) =>
      _prefs.setBool(AppConstants.prefAutoSync, value);
}
