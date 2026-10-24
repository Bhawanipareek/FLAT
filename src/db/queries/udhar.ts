import { getDatabase } from '../database';
import { UdharRecord, UdharDirection, UdharStatus, UdharPayment } from '../../types/database';
import { getTodayDateString, getCurrentTimeString, isOverdue, isDueSoon } from '../../utils/date';

export function calculateUdharStatus(
  originalAmount: number,
  outstandingAmount: number,
  dueDate?: string
): UdharStatus {
  if (outstandingAmount <= 0) {
    return 'Settled';
  }
  if (dueDate && isOverdue(dueDate)) {
    return 'Overdue';
  }
  if (dueDate && isDueSoon(dueDate)) {
    return 'Due Soon';
  }
  if (outstandingAmount < originalAmount) {
    return 'Partially Paid';
  }
  return 'Active';
}

export function getUdharRecords(direction?: UdharDirection): UdharRecord[] {
  const db = getDatabase();
  let query = 'SELECT * FROM udhar_records';
  const params: any[] = [];
  if (direction) {
    query += ' WHERE direction = ?';
    params.push(direction);
  }
  query += ' ORDER BY status = "Overdue" DESC, status = "Due Soon" DESC, due_date ASC, created_at DESC;';

  const records = db.getAllSync<UdharRecord>(query, params);

  // Recalculate status dynamically in case due date passed
  return records.map((rec) => {
    const computedStatus = calculateUdharStatus(rec.original_amount, rec.outstanding_amount, rec.due_date);
    if (computedStatus !== rec.status) {
      db.runSync('UPDATE udhar_records SET status = ?, updated_at = ? WHERE id = ?;', [
        computedStatus,
        new Date().toISOString(),
        rec.id,
      ]);
      return { ...rec, status: computedStatus };
    }
    return rec;
  });
}

export function getUdharById(id: string): UdharRecord | null {
  const db = getDatabase();
  return db.getFirstSync<UdharRecord>('SELECT * FROM udhar_records WHERE id = ?;', [id]);
}

export function createUdharRecord(data: {
  direction: UdharDirection;
  person_name: string;
  phone?: string;
  amount: number;
  transaction_date?: string;
  due_date?: string;
  purpose?: string;
  notes?: string;
  repayment_type?: 'lump_sum' | 'installments' | 'flexible';
  interest_rate?: number;
  account_id?: string;
}): UdharRecord {
  if (data.amount <= 0) throw new Error('Amount must be greater than zero');
  const db = getDatabase();
  const id = `udh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const txDate = data.transaction_date || getTodayDateString();
  const now = new Date().toISOString();
  const initialStatus = calculateUdharStatus(data.amount, data.amount, data.due_date);

  db.withTransactionSync(() => {
    // If an account is selected for the initial lending / borrowing:
    if (data.account_id) {
      if (data.direction === 'GAVE') {
        // User lent money: decrease account balance
        db.runSync('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?;', [
          data.amount,
          now,
          data.account_id,
        ]);
        // Record transaction
        db.runSync(
          `INSERT INTO transactions (id, amount, date, time, type, account_id, title, notes, reference_module, reference_id, created_at)
           VALUES (?, ?, ?, ?, 'expense', ?, ?, ?, 'udhar', ?, ?);`,
          [
            `tx_udh_init_${Date.now()}`,
            data.amount,
            txDate,
            getCurrentTimeString(),
            data.account_id,
            `Udhar Given: ${data.person_name}`,
            data.purpose || data.notes || null,
            id,
            now,
          ]
        );
      } else {
        // User borrowed money: increase account balance
        db.runSync('UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?;', [
          data.amount,
          now,
          data.account_id,
        ]);
        // Record transaction
        db.runSync(
          `INSERT INTO transactions (id, amount, date, time, type, account_id, title, notes, reference_module, reference_id, created_at)
           VALUES (?, ?, ?, ?, 'income', ?, ?, ?, 'udhar', ?, ?);`,
          [
            `tx_udh_init_${Date.now()}`,
            data.amount,
            txDate,
            getCurrentTimeString(),
            data.account_id,
            `Udhar Borrowed: ${data.person_name}`,
            data.purpose || data.notes || null,
            id,
            now,
          ]
        );
      }
    }

    // Insert udhar record
    db.runSync(
      `INSERT INTO udhar_records (id, direction, person_name, phone, original_amount, outstanding_amount, transaction_date, due_date, purpose, notes, repayment_type, interest_rate, status, account_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.direction,
        data.person_name,
        data.phone || null,
        data.amount,
        data.amount,
        txDate,
        data.due_date || null,
        data.purpose || null,
        data.notes || null,
        data.repayment_type || 'lump_sum',
        data.interest_rate || 0,
        initialStatus,
        data.account_id || null,
        now,
        now,
      ]
    );
  });

  return getUdharById(id)!;
}

export function recordUdharRepayment(data: {
  udharId: string;
  amount: number;
  accountId: string;
  paymentDate?: string;
  notes?: string;
}): UdharPayment {
  if (data.amount <= 0) throw new Error('Repayment amount must be greater than zero');
  const db = getDatabase();
  const udhar = getUdharById(data.udharId);
  if (!udhar) throw new Error('Udhar record not found');

  const payId = `upay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const payDate = data.paymentDate || getTodayDateString();
  const now = new Date().toISOString();
  const newOutstanding = Math.max(0, udhar.outstanding_amount - data.amount);
  const newStatus = calculateUdharStatus(udhar.original_amount, newOutstanding, udhar.due_date);

  db.withTransactionSync(() => {
    // 1. Insert repayment record
    db.runSync(
      `INSERT INTO udhar_payments (id, udhar_id, amount, payment_date, account_id, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [payId, data.udharId, data.amount, payDate, data.accountId, data.notes || null, now]
    );

    // 2. Update udhar record outstanding & status
    db.runSync(
      'UPDATE udhar_records SET outstanding_amount = ?, status = ?, updated_at = ? WHERE id = ?;',
      [newOutstanding, newStatus, now, data.udharId]
    );

    // 3. Adjust account balance:
    // If user gave money, receiving repayment increases balance.
    // If user borrowed money, repaying decreases balance.
    if (udhar.direction === 'GAVE') {
      db.runSync('UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?;', [
        data.amount,
        now,
        data.accountId,
      ]);
      // Record transaction
      db.runSync(
        `INSERT INTO transactions (id, amount, date, time, type, account_id, title, notes, reference_module, reference_id, created_at)
         VALUES (?, ?, ?, ?, 'income', ?, ?, ?, 'udhar', ?, ?);`,
        [
          `tx_upay_${Date.now()}`,
          data.amount,
          payDate,
          getCurrentTimeString(),
          data.accountId,
          `Udhar Repayment Received: ${udhar.person_name}`,
          data.notes || null,
          data.udharId,
          now,
        ]
      );
    } else {
      db.runSync('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?;', [
        data.amount,
        now,
        data.accountId,
      ]);
      // Record transaction
      db.runSync(
        `INSERT INTO transactions (id, amount, date, time, type, account_id, title, notes, reference_module, reference_id, created_at)
         VALUES (?, ?, ?, ?, 'expense', ?, ?, ?, 'udhar', ?, ?);`,
        [
          `tx_upay_${Date.now()}`,
          data.amount,
          payDate,
          getCurrentTimeString(),
          data.accountId,
          `Udhar Repaid To: ${udhar.person_name}`,
          data.notes || null,
          data.udharId,
          now,
        ]
      );
    }
  });

  return db.getFirstSync<UdharPayment>('SELECT * FROM udhar_payments WHERE id = ?;', [payId])!;
}

export function getUdharPayments(udharId: string): UdharPayment[] {
  const db = getDatabase();
  return db.getAllSync<UdharPayment>(
    `SELECT p.*, a.name as account_name
     FROM udhar_payments p
     LEFT JOIN accounts a ON p.account_id = a.id
     WHERE p.udhar_id = ?
     ORDER BY p.payment_date DESC, p.created_at DESC;`,
    [udharId]
  );
}

export function getUdharTotals(): { toReceive: number; toPay: number } {
  const db = getDatabase();
  const receiveRes = db.getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(outstanding_amount), 0) as total FROM udhar_records WHERE direction = 'GAVE' AND status != 'Settled';"
  );
  const payRes = db.getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(outstanding_amount), 0) as total FROM udhar_records WHERE direction = 'BORROWED' AND status != 'Settled';"
  );
  return {
    toReceive: receiveRes ? receiveRes.total : 0,
    toPay: payRes ? payRes.total : 0,
  };
}
