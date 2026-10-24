import { getDatabase } from '../database';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export interface BackupData {
  version: number;
  appName: string;
  exportDate: string;
  data: {
    accounts: any[];
    categories: any[];
    transactions: any[];
    udhar_records: any[];
    udhar_payments: any[];
    emis: any[];
    emi_payments: any[];
    vehicles: any[];
    vehicle_fuel_logs: any[];
    vehicle_services: any[];
    vehicle_other_expenses: any[];
    bills: any[];
    salary_config: any[];
    attendance_records: any[];
    app_settings: any[];
  };
}

export async function exportDatabaseBackup(): Promise<string> {
  const db = getDatabase();

  const backup: BackupData = {
    version: 1,
    appName: 'Hisab OS',
    exportDate: new Date().toISOString(),
    data: {
      accounts: db.getAllSync('SELECT * FROM accounts;'),
      categories: db.getAllSync('SELECT * FROM categories;'),
      transactions: db.getAllSync('SELECT * FROM transactions;'),
      udhar_records: db.getAllSync('SELECT * FROM udhar_records;'),
      udhar_payments: db.getAllSync('SELECT * FROM udhar_payments;'),
      emis: db.getAllSync('SELECT * FROM emis;'),
      emi_payments: db.getAllSync('SELECT * FROM emi_payments;'),
      vehicles: db.getAllSync('SELECT * FROM vehicles;'),
      vehicle_fuel_logs: db.getAllSync('SELECT * FROM vehicle_fuel_logs;'),
      vehicle_services: db.getAllSync('SELECT * FROM vehicle_services;'),
      vehicle_other_expenses: db.getAllSync('SELECT * FROM vehicle_other_expenses;'),
      bills: db.getAllSync('SELECT * FROM bills;'),
      salary_config: db.getAllSync('SELECT * FROM salary_config;'),
      attendance_records: db.getAllSync('SELECT * FROM attendance_records;'),
      app_settings: db.getAllSync('SELECT * FROM app_settings;'),
    },
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const fileName = `HisabOS_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, jsonString, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Export Hisab OS Backup',
      UTI: 'public.json',
    });
  }

  return filePath;
}

export async function importDatabaseBackup(): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', '*/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return false;
  }

  const asset = result.assets[0];
  const content = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const parsed = JSON.parse(content) as BackupData;
  if (!parsed.data || parsed.appName !== 'Hisab OS') {
    throw new Error('Invalid backup file. Missing Hisab OS payload.');
  }

  const db = getDatabase();

  db.withTransactionSync(() => {
    // Clean current data
    db.runSync('DELETE FROM emi_payments;');
    db.runSync('DELETE FROM emis;');
    db.runSync('DELETE FROM vehicle_fuel_logs;');
    db.runSync('DELETE FROM vehicle_services;');
    db.runSync('DELETE FROM vehicle_other_expenses;');
    db.runSync('DELETE FROM vehicles;');
    db.runSync('DELETE FROM udhar_payments;');
    db.runSync('DELETE FROM udhar_records;');
    db.runSync('DELETE FROM transactions;');
    db.runSync('DELETE FROM bills;');
    db.runSync('DELETE FROM attendance_records;');
    db.runSync('DELETE FROM accounts;');
    db.runSync('DELETE FROM categories;');
    db.runSync('DELETE FROM salary_config;');
    db.runSync('DELETE FROM app_settings;');

    // Restore accounts
    for (const acc of parsed.data.accounts || []) {
      db.runSync(
        `INSERT INTO accounts (id, name, type, balance, opening_balance, description, last_four_digits, is_default, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [acc.id, acc.name, acc.type, acc.balance, acc.opening_balance, acc.description, acc.last_four_digits, acc.is_default, acc.created_at, acc.updated_at]
      );
    }

    // Restore categories
    for (const cat of parsed.data.categories || []) {
      db.runSync(
        'INSERT INTO categories (id, name, icon, type, is_system) VALUES (?, ?, ?, ?, ?);',
        [cat.id, cat.name, cat.icon, cat.type, cat.is_system]
      );
    }

    // Restore transactions
    for (const tx of parsed.data.transactions || []) {
      db.runSync(
        `INSERT INTO transactions (id, amount, date, time, type, account_id, to_account_id, category_id, category_name, title, notes, receipt_uri, reference_module, reference_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [tx.id, tx.amount, tx.date, tx.time, tx.type, tx.account_id, tx.to_account_id, tx.category_id, tx.category_name, tx.title, tx.notes, tx.receipt_uri, tx.reference_module, tx.reference_id, tx.created_at]
      );
    }

    // Restore udhar
    for (const u of parsed.data.udhar_records || []) {
      db.runSync(
        `INSERT INTO udhar_records (id, direction, person_name, phone, original_amount, outstanding_amount, transaction_date, due_date, purpose, notes, repayment_type, interest_rate, status, account_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [u.id, u.direction, u.person_name, u.phone, u.original_amount, u.outstanding_amount, u.transaction_date, u.due_date, u.purpose, u.notes, u.repayment_type, u.interest_rate, u.status, u.account_id, u.created_at, u.updated_at]
      );
    }
    for (const up of parsed.data.udhar_payments || []) {
      db.runSync(
        'INSERT INTO udhar_payments (id, udhar_id, amount, payment_date, account_id, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
        [up.id, up.udhar_id, up.amount, up.payment_date, up.account_id, up.notes, up.created_at]
      );
    }

    // Restore EMIs
    for (const emi of parsed.data.emis || []) {
      db.runSync(
        `INSERT INTO emis (id, name, purpose, lender, linked_debt_id, monthly_amount, principal_amount, interest_rate, start_date, due_day, total_installments, paid_installments, account_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [emi.id, emi.name, emi.purpose, emi.lender, emi.linked_debt_id, emi.monthly_amount, emi.principal_amount, emi.interest_rate, emi.start_date, emi.due_day, emi.total_installments, emi.paid_installments, emi.account_id, emi.status, emi.created_at]
      );
    }
    for (const ep of parsed.data.emi_payments || []) {
      db.runSync(
        `INSERT INTO emi_payments (id, emi_id, installment_number, amount, principal_component, interest_component, payment_date, account_id, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [ep.id, ep.emi_id, ep.installment_number, ep.amount, ep.principal_component, ep.interest_component, ep.payment_date, ep.account_id, ep.notes, ep.created_at]
      );
    }

    // Restore vehicles
    for (const v of parsed.data.vehicles || []) {
      db.runSync(
        `INSERT INTO vehicles (id, name, type, manufacturer, model, reg_number, purchase_date, fuel_type, initial_odometer, current_odometer, insurance_expiry, puc_expiry, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [v.id, v.name, v.type, v.manufacturer, v.model, v.reg_number, v.purchase_date, v.fuel_type, v.initial_odometer, v.current_odometer, v.insurance_expiry, v.puc_expiry, v.created_at]
      );
    }
    for (const f of parsed.data.vehicle_fuel_logs || []) {
      db.runSync(
        `INSERT INTO vehicle_fuel_logs (id, vehicle_id, date, fuel_type, quantity_litres, price_per_litre, total_cost, odometer, fuel_station, is_full_tank, calculated_mileage, notes, account_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [f.id, f.vehicle_id, f.date, f.fuel_type, f.quantity_litres, f.price_per_litre, f.total_cost, f.odometer, f.fuel_station, f.is_full_tank, f.calculated_mileage, f.notes, f.account_id, f.created_at]
      );
    }
    for (const s of parsed.data.vehicle_services || []) {
      db.runSync(
        `INSERT INTO vehicle_services (id, vehicle_id, service_date, odometer, service_centre, service_type, work_performed, parts_cost, labour_cost, total_cost, next_service_date, next_service_odometer, account_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [s.id, s.vehicle_id, s.service_date, s.odometer, s.service_centre, s.service_type, s.work_performed, s.parts_cost, s.labour_cost, s.total_cost, s.next_service_date, s.next_service_odometer, s.account_id, s.created_at]
      );
    }
    for (const o of parsed.data.vehicle_other_expenses || []) {
      db.runSync(
        `INSERT INTO vehicle_other_expenses (id, vehicle_id, date, expense_type, amount, notes, account_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [o.id, o.vehicle_id, o.date, o.expense_type, o.amount, o.notes, o.account_id, o.created_at]
      );
    }

    // Restore bills
    for (const b of parsed.data.bills || []) {
      db.runSync(
        `INSERT INTO bills (id, name, category, amount, billing_period, due_date, is_recurring, status, payment_date, account_id, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [b.id, b.name, b.category, b.amount, b.billing_period, b.due_date, b.is_recurring, b.status, b.payment_date, b.account_id, b.notes, b.created_at]
      );
    }

    // Restore salary config & attendance
    for (const sc of parsed.data.salary_config || []) {
      db.runSync(
        `INSERT INTO salary_config (id, base_salary, in_hand_salary, salary_basis, salary_cycle, cycle_start_day, salary_payment_date, working_days_per_month, weekly_offs, paid_leaves_per_month, unpaid_leave_deduction_formula, half_day_deduction_fraction, sandwich_rule_enabled, overtime_hourly_rate, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [sc.id, sc.base_salary, sc.in_hand_salary, sc.salary_basis, sc.salary_cycle, sc.cycle_start_day, sc.salary_payment_date, sc.working_days_per_month, sc.weekly_offs, sc.paid_leaves_per_month, sc.unpaid_leave_deduction_formula, sc.half_day_deduction_fraction, sc.sandwich_rule_enabled, sc.overtime_hourly_rate, sc.created_at, sc.updated_at]
      );
    }
    for (const att of parsed.data.attendance_records || []) {
      db.runSync(
        'INSERT INTO attendance_records (date, status, overtime_hours, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?);',
        [att.date, att.status, att.overtime_hours, att.notes, att.created_at, att.updated_at]
      );
    }

    // Restore settings
    for (const st of parsed.data.app_settings || []) {
      db.runSync('INSERT INTO app_settings (key, value) VALUES (?, ?);', [st.key, st.value]);
    }
  });

  return true;
}
