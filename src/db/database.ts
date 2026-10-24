import * as SQLite from 'expo-sqlite';
import { getTodayDateString } from '../utils/date';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('hisab_os.db');
  }
  return dbInstance;
}

export function initDatabase(): void {
  const db = getDatabase();

  // Enforce WAL mode and foreign keys
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  // Create tables
  db.execSync(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'cash' | 'savings' | 'current' | 'other'
      balance REAL NOT NULL DEFAULT 0,
      opening_balance REAL NOT NULL DEFAULT 0,
      description TEXT,
      last_four_digits TEXT,
      is_default INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      type TEXT NOT NULL, -- 'expense' | 'income'
      is_system INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      type TEXT NOT NULL, -- 'income' | 'expense' | 'transfer' | 'cash_deposit' | 'cash_withdrawal' | 'adjustment' | 'refund'
      account_id TEXT NOT NULL,
      to_account_id TEXT,
      category_id TEXT,
      category_name TEXT,
      title TEXT NOT NULL,
      notes TEXT,
      receipt_uri TEXT,
      reference_module TEXT, -- 'expense' | 'udhar' | 'emi' | 'vehicle' | 'bill' | 'salary' | 'manual'
      reference_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

    CREATE TABLE IF NOT EXISTS udhar_records (
      id TEXT PRIMARY KEY,
      direction TEXT NOT NULL, -- 'GAVE' | 'BORROWED'
      person_name TEXT NOT NULL,
      phone TEXT,
      original_amount REAL NOT NULL,
      outstanding_amount REAL NOT NULL,
      transaction_date TEXT NOT NULL,
      due_date TEXT,
      purpose TEXT,
      notes TEXT,
      repayment_type TEXT DEFAULT 'lump_sum',
      interest_rate REAL DEFAULT 0,
      status TEXT NOT NULL, -- 'Active' | 'Partially Paid' | 'Settled' | 'Due Soon' | 'Overdue'
      account_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_udhar_direction ON udhar_records(direction);
    CREATE INDEX IF NOT EXISTS idx_udhar_status ON udhar_records(status);

    CREATE TABLE IF NOT EXISTS udhar_payments (
      id TEXT PRIMARY KEY,
      udhar_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      account_id TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (udhar_id) REFERENCES udhar_records(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS emis (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      purpose TEXT,
      lender TEXT,
      linked_debt_id TEXT,
      monthly_amount REAL NOT NULL,
      principal_amount REAL,
      interest_rate REAL,
      start_date TEXT NOT NULL,
      due_day INTEGER NOT NULL,
      total_installments INTEGER NOT NULL,
      paid_installments INTEGER NOT NULL DEFAULT 0,
      account_id TEXT,
      status TEXT NOT NULL DEFAULT 'Active', -- 'Active' | 'Completed' | 'Cancelled'
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS emi_payments (
      id TEXT PRIMARY KEY,
      emi_id TEXT NOT NULL,
      installment_number INTEGER NOT NULL,
      amount REAL NOT NULL,
      principal_component REAL,
      interest_component REAL,
      payment_date TEXT NOT NULL,
      account_id TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (emi_id) REFERENCES emis(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'Bike' | 'Scooter' | 'Car' | 'Other'
      manufacturer TEXT,
      model TEXT,
      reg_number TEXT,
      purchase_date TEXT,
      fuel_type TEXT NOT NULL DEFAULT 'Petrol',
      initial_odometer REAL NOT NULL DEFAULT 0,
      current_odometer REAL NOT NULL DEFAULT 0,
      insurance_expiry TEXT,
      puc_expiry TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vehicle_fuel_logs (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      date TEXT NOT NULL,
      fuel_type TEXT NOT NULL,
      quantity_litres REAL NOT NULL,
      price_per_litre REAL NOT NULL,
      total_cost REAL NOT NULL,
      odometer REAL NOT NULL,
      fuel_station TEXT,
      is_full_tank INTEGER NOT NULL DEFAULT 1,
      calculated_mileage REAL,
      notes TEXT,
      account_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vehicle_services (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      service_date TEXT NOT NULL,
      odometer REAL NOT NULL,
      service_centre TEXT,
      service_type TEXT NOT NULL,
      work_performed TEXT,
      parts_cost REAL NOT NULL DEFAULT 0,
      labour_cost REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL,
      next_service_date TEXT,
      next_service_odometer REAL,
      account_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vehicle_other_expenses (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      date TEXT NOT NULL,
      expense_type TEXT NOT NULL,
      amount REAL NOT NULL,
      notes TEXT,
      account_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      billing_period TEXT,
      due_date TEXT NOT NULL,
      is_recurring INTEGER DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending' | 'Paid' | 'Overdue'
      payment_date TEXT,
      account_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS salary_config (
      id TEXT PRIMARY KEY,
      base_salary REAL NOT NULL DEFAULT 50000,
      in_hand_salary REAL NOT NULL DEFAULT 45000,
      salary_basis TEXT NOT NULL DEFAULT 'monthly',
      salary_cycle TEXT NOT NULL DEFAULT 'calendar',
      cycle_start_day INTEGER NOT NULL DEFAULT 1,
      salary_payment_date INTEGER NOT NULL DEFAULT 1,
      working_days_per_month INTEGER NOT NULL DEFAULT 26,
      weekly_offs TEXT NOT NULL DEFAULT 'Sunday',
      paid_leaves_per_month REAL NOT NULL DEFAULT 1.5,
      unpaid_leave_deduction_formula TEXT NOT NULL DEFAULT 'per_day',
      half_day_deduction_fraction REAL NOT NULL DEFAULT 0.5,
      sandwich_rule_enabled INTEGER NOT NULL DEFAULT 0,
      overtime_hourly_rate REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      date TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      overtime_hours REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default data if not already seeded
  seedDefaultData(db);
}

function seedDefaultData(db: SQLite.SQLiteDatabase): void {
  // Check if default accounts exist
  const accountCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM accounts;');
  if (!accountCount || accountCount.count === 0) {
    const now = new Date().toISOString();
    // Default Cash Wallet
    db.runSync(
      `INSERT INTO accounts (id, name, type, balance, opening_balance, description, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      ['acc_cash_default', 'Cash Wallet', 'cash', 5000, 5000, 'Physical cash in pocket and drawer', 1, now, now]
    );
    // Default Bank Account
    db.runSync(
      `INSERT INTO accounts (id, name, type, balance, opening_balance, description, last_four_digits, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      ['acc_bank_default', 'Primary Bank', 'savings', 25000, 25000, 'Main savings and salary account', '4321', 0, now, now]
    );
  }

  // Check categories
  const catCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories;');
  if (!catCount || catCount.count === 0) {
    const expenseCats = [
      { id: 'cat_food', name: 'Food and Snacks', icon: 'coffee' },
      { id: 'cat_milk', name: 'Milk and Dairy', icon: 'shopping-cart' },
      { id: 'cat_groceries', name: 'Groceries', icon: 'package' },
      { id: 'cat_shopping', name: 'Shopping', icon: 'shopping-bag' },
      { id: 'cat_phone', name: 'Phone and Electronics', icon: 'smartphone' },
      { id: 'cat_transport', name: 'Transport', icon: 'navigation' },
      { id: 'cat_petrol', name: 'Petrol', icon: 'zap' },
      { id: 'cat_medical', name: 'Medical', icon: 'heart' },
      { id: 'cat_education', name: 'Education', icon: 'book' },
      { id: 'cat_rent', name: 'Rent', icon: 'home' },
      { id: 'cat_electricity', name: 'Electricity', icon: 'activity' },
      { id: 'cat_internet', name: 'Internet', icon: 'wifi' },
      { id: 'cat_entertainment', name: 'Entertainment', icon: 'film' },
      { id: 'cat_subscriptions', name: 'Subscriptions', icon: 'repeat' },
      { id: 'cat_personal_care', name: 'Personal Care', icon: 'smile' },
      { id: 'cat_other_exp', name: 'Other', icon: 'more-horizontal' },
    ];

    for (const cat of expenseCats) {
      db.runSync(
        'INSERT INTO categories (id, name, icon, type, is_system) VALUES (?, ?, ?, ?, ?);',
        [cat.id, cat.name, cat.icon, 'expense', 1]
      );
    }

    const incomeCats = [
      { id: 'cat_salary', name: 'Salary', icon: 'briefcase' },
      { id: 'cat_freelance', name: 'Freelance & Business', icon: 'cpu' },
      { id: 'cat_investments', name: 'Investments & Returns', icon: 'trending-up' },
      { id: 'cat_gift', name: 'Gifts & Cashback', icon: 'gift' },
      { id: 'cat_other_inc', name: 'Other Income', icon: 'plus-circle' },
    ];

    for (const cat of incomeCats) {
      db.runSync(
        'INSERT INTO categories (id, name, icon, type, is_system) VALUES (?, ?, ?, ?, ?);',
        [cat.id, cat.name, cat.icon, 'income', 1]
      );
    }
  }

  // Salary config
  const salConfig = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM salary_config;');
  if (!salConfig || salConfig.count === 0) {
    const now = new Date().toISOString();
    db.runSync(
      `INSERT INTO salary_config (id, base_salary, in_hand_salary, salary_basis, salary_cycle, cycle_start_day, salary_payment_date, working_days_per_month, weekly_offs, paid_leaves_per_month, unpaid_leave_deduction_formula, half_day_deduction_fraction, sandwich_rule_enabled, overtime_hourly_rate, created_at, updated_at)
       VALUES ('primary', 55000, 50000, 'monthly', 'calendar', 1, 1, 26, 'Sunday', 1.5, 'per_day', 0.5, 0, 0, ?, ?);`,
      [now, now]
    );
  }

  // App settings default
  const settingsCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM app_settings;');
  if (!settingsCount || settingsCount.count === 0) {
    db.runSync("INSERT INTO app_settings (key, value) VALUES ('user_name', 'Bhawani Singh');");
    db.runSync("INSERT INTO app_settings (key, value) VALUES ('hide_balances', 'false');");
    db.runSync("INSERT INTO app_settings (key, value) VALUES ('biometric_enabled', 'false');");
    db.runSync("INSERT INTO app_settings (key, value) VALUES ('theme', 'dark');");
  }
}
