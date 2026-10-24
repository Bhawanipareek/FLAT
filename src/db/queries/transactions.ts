import { getDatabase } from '../database';
import { Transaction, TransactionType, Category, ReferenceModule } from '../../types/database';
import { getCurrentTimeString, getTodayDateString } from '../../utils/date';

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  search?: string;
  limit?: number;
  offset?: number;
}

export function getTransactions(filters: TransactionFilter = {}): Transaction[] {
  const db = getDatabase();
  let query = `
    SELECT t.*, 
           a.name as account_name, 
           toa.name as to_account_name,
           c.name as category_name
    FROM transactions t
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN accounts toa ON t.to_account_id = toa.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters.startDate) {
    query += ' AND t.date >= ?';
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    query += ' AND t.date <= ?';
    params.push(filters.endDate);
  }
  if (filters.accountId) {
    query += ' AND (t.account_id = ? OR t.to_account_id = ?)';
    params.push(filters.accountId, filters.accountId);
  }
  if (filters.categoryId) {
    query += ' AND t.category_id = ?';
    params.push(filters.categoryId);
  }
  if (filters.type) {
    query += ' AND t.type = ?';
    params.push(filters.type);
  }
  if (filters.search) {
    query += ' AND (t.title LIKE ? OR t.notes LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  query += ' ORDER BY t.date DESC, t.time DESC, t.created_at DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }
  }

  return db.getAllSync<Transaction>(query, params);
}

export function createExpense(data: {
  title: string;
  amount: number;
  accountId: string;
  categoryId?: string;
  date?: string;
  notes?: string;
  receiptUri?: string;
  referenceModule?: ReferenceModule;
  referenceId?: string;
}): Transaction {
  if (data.amount <= 0) throw new Error('Expense amount must be greater than zero');
  const db = getDatabase();
  const txId = `tx_exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const txDate = data.date || getTodayDateString();
  const txTime = getCurrentTimeString();
  const now = new Date().toISOString();

  db.withTransactionSync(() => {
    // 1. Deduct from account balance
    db.runSync(
      'UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?;',
      [data.amount, now, data.accountId]
    );

    // 2. Insert transaction
    db.runSync(
      `INSERT INTO transactions (id, amount, date, time, type, account_id, category_id, title, notes, receipt_uri, reference_module, reference_id, created_at)
       VALUES (?, ?, ?, ?, 'expense', ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        txId,
        data.amount,
        txDate,
        txTime,
        data.accountId,
        data.categoryId || null,
        data.title,
        data.notes || null,
        data.receiptUri || null,
        data.referenceModule || 'expense',
        data.referenceId || null,
        now,
      ]
    );
  });

  return db.getFirstSync<Transaction>('SELECT * FROM transactions WHERE id = ?;', [txId])!;
}

export function createIncome(data: {
  title: string;
  amount: number;
  accountId: string;
  categoryId?: string;
  date?: string;
  notes?: string;
  referenceModule?: ReferenceModule;
  referenceId?: string;
}): Transaction {
  if (data.amount <= 0) throw new Error('Income amount must be greater than zero');
  const db = getDatabase();
  const txId = `tx_inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const txDate = data.date || getTodayDateString();
  const txTime = getCurrentTimeString();
  const now = new Date().toISOString();

  db.withTransactionSync(() => {
    // 1. Increase account balance
    db.runSync(
      'UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?;',
      [data.amount, now, data.accountId]
    );

    // 2. Insert transaction
    db.runSync(
      `INSERT INTO transactions (id, amount, date, time, type, account_id, category_id, title, notes, reference_module, reference_id, created_at)
       VALUES (?, ?, ?, ?, 'income', ?, ?, ?, ?, ?, ?);`,
      [
        txId,
        data.amount,
        txDate,
        txTime,
        data.accountId,
        data.categoryId || null,
        data.title,
        data.notes || null,
        data.referenceModule || 'manual',
        data.referenceId || null,
        now,
      ]
    );
  });

  return db.getFirstSync<Transaction>('SELECT * FROM transactions WHERE id = ?;', [txId])!;
}

/**
 * Reverses a transaction safely and restores balances
 */
export function deleteTransaction(id: string): void {
  const db = getDatabase();
  const tx = db.getFirstSync<Transaction>('SELECT * FROM transactions WHERE id = ?;', [id]);
  if (!tx) return;

  const now = new Date().toISOString();

  db.withTransactionSync(() => {
    if (tx.type === 'expense') {
      // Refund back to account
      db.runSync('UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?;', [
        tx.amount,
        now,
        tx.account_id,
      ]);
    } else if (tx.type === 'income') {
      // Deduct from account
      db.runSync('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?;', [
        tx.amount,
        now,
        tx.account_id,
      ]);
    } else if (tx.type === 'transfer' || tx.type === 'cash_deposit' || tx.type === 'cash_withdrawal') {
      // Reverse transfer: add back to source, deduct from destination
      db.runSync('UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?;', [
        tx.amount,
        now,
        tx.account_id,
      ]);
      if (tx.to_account_id) {
        db.runSync('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?;', [
          tx.amount,
          now,
          tx.to_account_id,
        ]);
      }
    }

    // Delete transaction row
    db.runSync('DELETE FROM transactions WHERE id = ?;', [id]);
  });
}

export function getCategories(type?: 'expense' | 'income'): Category[] {
  const db = getDatabase();
  if (type) {
    return db.getAllSync<Category>('SELECT * FROM categories WHERE type = ? ORDER BY name ASC;', [type]);
  }
  return db.getAllSync<Category>('SELECT * FROM categories ORDER BY name ASC;');
}

export function createCategory(name: string, icon: string, type: 'expense' | 'income'): Category {
  const db = getDatabase();
  const id = `cat_${Date.now()}`;
  db.runSync('INSERT INTO categories (id, name, icon, type, is_system) VALUES (?, ?, ?, ?, 0);', [
    id,
    name,
    icon,
    type,
  ]);
  return db.getFirstSync<Category>('SELECT * FROM categories WHERE id = ?;', [id])!;
}

export function getMonthlyFinancialTotals(startDate: string, endDate: string): {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
} {
  const db = getDatabase();
  const incomeRes = db.getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income' AND date >= ? AND date <= ?;",
    [startDate, endDate]
  );
  const expenseRes = db.getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense' AND date >= ? AND date <= ?;",
    [startDate, endDate]
  );

  const totalIncome = incomeRes ? incomeRes.total : 0;
  const totalExpense = expenseRes ? expenseRes.total : 0;
  return {
    totalIncome,
    totalExpense,
    netCashFlow: totalIncome - totalExpense,
  };
}

export function getExpenseBreakdownByCategory(startDate: string, endDate: string): {
  categoryName: string;
  total: number;
}[] {
  const db = getDatabase();
  return db.getAllSync<{ categoryName: string; total: number }>(
    `SELECT COALESCE(c.name, 'Uncategorized') as categoryName, SUM(t.amount) as total
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
     GROUP BY c.name
     ORDER BY total DESC;`,
    [startDate, endDate]
  );
}
