class AppConstants {
  static const String appName = 'Flat Expense Manager';
  static const String appVersion = '1.0.0';

  // Network & P2P Sync
  static const int defaultHttpPort = 8089;
  static const int defaultDiscoveryPort = 8090;
  static const String syncProtocolVersion = '1.0';
  static const Duration syncTimeout = Duration(seconds: 10);
  static const Duration discoveryTimeout = Duration(seconds: 4);

  // Database
  static const String databaseName = 'flat_expense_manager.db';
  static const int databaseVersion = 1;

  // Defaults
  static const String defaultCurrency = '₹';
  static const String defaultCurrencyCode = 'INR';

  // Shared Preferences Keys
  static const String prefCurrentUserId = 'current_user_id';
  static const String prefCurrentUserName = 'current_user_name';
  static const String prefCurrentUserPhone = 'current_user_phone';
  static const String prefActiveGroupId = 'active_group_id';
  static const String prefDarkMode = 'dark_mode';
  static const String prefLastSyncTime = 'last_sync_time';
  static const String prefHttpPort = 'http_port';
  static const String prefAutoSync = 'auto_sync_enabled';
}
