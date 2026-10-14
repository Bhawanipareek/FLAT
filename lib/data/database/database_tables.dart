class DatabaseTables {
  static const String tableGroups = 'groups';
  static const String tableMembers = 'members';
  static const String tableExpenses = 'expenses';
  static const String tableExpenseSplits = 'expense_splits';
  static const String tableShoppingItems = 'shopping_items';
  static const String tableContributions = 'contributions';
  static const String tableSettlements = 'settlements';
  static const String tableSyncLogs = 'sync_logs';

  static const String createGroupsTable = '''
    CREATE TABLE $tableGroups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      currency TEXT NOT NULL,
      currency_code TEXT NOT NULL,
      pairing_code TEXT NOT NULL,
      pairing_secret TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0
    );
  ''';

  static const String createMembersTable = '''
    CREATE TABLE $tableMembers (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      is_current_user INTEGER NOT NULL DEFAULT 0,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(group_id) REFERENCES $tableGroups(id) ON DELETE CASCADE
    );
  ''';

  static const String createExpensesTable = '''
    CREATE TABLE $tableExpenses (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      purchase_date TEXT NOT NULL,
      payer_member_id TEXT NOT NULL,
      split_method TEXT NOT NULL DEFAULT 'equal',
      notes TEXT,
      receipt_image_path TEXT,
      shopping_item_id TEXT,
      created_by_member_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(group_id) REFERENCES $tableGroups(id) ON DELETE CASCADE
    );
  ''';

  static const String createExpenseSplitsTable = '''
    CREATE TABLE $tableExpenseSplits (
      id TEXT PRIMARY KEY,
      expense_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      allocated_amount REAL NOT NULL,
      allocated_percentage REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(expense_id) REFERENCES $tableExpenses(id) ON DELETE CASCADE
    );
  ''';

  static const String createShoppingItemsTable = '''
    CREATE TABLE $tableShoppingItems (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1.0,
      unit TEXT NOT NULL DEFAULT 'unit',
      estimated_price REAL NOT NULL DEFAULT 0.0,
      actual_price REAL,
      priority TEXT NOT NULL DEFAULT 'medium',
      assigned_member_id TEXT,
      added_by_member_id TEXT NOT NULL,
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'needed',
      converted_expense_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(group_id) REFERENCES $tableGroups(id) ON DELETE CASCADE
    );
  ''';

  static const String createContributionsTable = '''
    CREATE TABLE $tableContributions (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      payer_member_id TEXT NOT NULL,
      receiver_member_id TEXT,
      type TEXT NOT NULL DEFAULT 'flat_fund',
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(group_id) REFERENCES $tableGroups(id) ON DELETE CASCADE
    );
  ''';

  static const String createSettlementsTable = '''
    CREATE TABLE $tableSettlements (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      from_member_id TEXT NOT NULL,
      to_member_id TEXT NOT NULL,
      amount REAL NOT NULL,
      settled_at TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'upi',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(group_id) REFERENCES $tableGroups(id) ON DELETE CASCADE
    );
  ''';

  static const String createSyncLogsTable = '''
    CREATE TABLE $tableSyncLogs (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      synced_with_peers INTEGER NOT NULL DEFAULT 0
    );
  ''';
}
