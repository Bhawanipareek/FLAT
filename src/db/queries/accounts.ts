import { getDatabase } from '../database';
import { Account, AccountType } from '../../types/database';
import { getCurrentTimeString, getTodayDateString } from '../../utils/date';

export function getAllAccounts(): Account[] {
  const db = getDatabase();
  return db.getAllSync<Account>('SELECT * FROM accounts ORDER BY is_default DESC, name ASC;');
}

export function getAccountById(id: string): Account | null {
  const db = getDatabase();
  return db.getFirstSync<Account>('SELECT * FROM accounts WHERE id = ?;', [id]);
}

export function createAccount(data: {
  name: string;
  type: AccountType;
  opening_balance: number;
  description?: string;
  last_four_digits?: string;
}): Account {
  const db = getDatabase();
  const id = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  db.runSync(
    `INSERT INTO accounts (id, name, type, balance, opening_balance, description, last_four_digits, is_default, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?);`,
    [
      id,
      data.name,
      data.type,
      data.opening_balance,
      data.opening_balance,
      data.description || null,
      data.last_four_digits || null,
      now,
      now,
    ]
  );

  return getAccountById(id)!;
}

export function updateAccount(id: string, data: Partial<Account>): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE accounts 
     SET name = COALESCE(?, name),
         description = COALESCE(?, description),
         last_four_digits = COALESCE(?, last_four_digits),
         updated_at = ?
     WHERE id = ?;`,
    [data.name ?? null, data.description ?? null, data.last_four_digits ?? null, now, id]
  );
}

export function deleteAccount(id: string): boolean {
  const db = getDatabase();
  const count = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM accounts;');
  if (count && count.count <= 1) {
    throw new Error('Cannot delete the only remaining account.');
  }
  db.runSync('DELETE FROM accounts WHERE id = ?;', [id]);
  return true;
}

/**
 * Transfers money atomically between two accounts.
 * Bank-to-Cash, Cash-to-Bank, Bank-to-Bank.
 * Total Available balance remains unchanged.
 * Monthly income & expense remain unchanged.
 */
export function transferMoney(
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  date?: string,
  notes?: string
): void {
  if (amount <= 0) throw new Error('Transfer amount must be greater than zero');
  if (fromAccountId === toAccountId) throw new Error('Source and destination accounts must be different');

  const db = getDatabase();
  const fromAcc = getAccountById(fromAccountId);
  const toAcc = getAccountById(toAccountId);

  if (!fromAcc || !toAcc) {
    throw new Error('Invalid account selection');
  }

  const txDate = date || getTodayDateString();
  const txTime = getCurrentTimeString();
  const txId = `tx_trf_${Date.now()}`;
  const now = new Date().toISOString();

  // Determine transfer subtype
  let transferType: 'transfer' | 'cash_deposit' | 'cash_withdrawal' = 'transfer';
  if (fromAcc.type === 'cash' && toAcc.type !== 'cash') {
    transferType = 'cash_deposit';
  } else if (fromAcc.type !== 'cash' && toAcc.type === 'cash') {
    transferType = 'cash_withdrawal';
  }

  db.withTransactionSync(() => {
    // 1. Deduct from source
    db.runSync(
      'UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?;',
      [amount, now, fromAccountId]
    );

    // 2. Add to destination
    db.runSync(
      'UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?;',
      [amount, now, toAccountId]
    );

    // 3. Record transfer transaction record
    db.runSync(
      `INSERT INTO transactions (id, amount, date, time, type, account_id, to_account_id, title, notes, reference_module, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?);`,
      [
        txId,
        amount,
        txDate,
        txTime,
        transferType,
        fromAccountId,
        toAccountId,
        `Transfer: ${fromAcc.name} → ${toAcc.name}`,
        notes || null,
        now,
      ]
    );
  });
}

export function getCashBalance(): number {
  const db = getDatabase();
  const res = db.getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(balance), 0) as total FROM accounts WHERE type = 'cash';"
  );
  return res ? res.total : 0;
}

export function getBankBalance(): number {
  const db = getDatabase();
  const res = db.getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(balance), 0) as total FROM accounts WHERE type != 'cash';"
  );
  return res ? res.total : 0;
}

export function getTotalAvailableBalance(): number {
  const db = getDatabase();
  const res = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(balance), 0) as total FROM accounts;'
  );
  return res ? res.total : 0;
}
