import { getDatabase } from '../database';
import { Bill, BillStatus } from '../../types/database';
import { getCurrentTimeString, getTodayDateString, isOverdue } from '../../utils/date';

export function getAllBills(): Bill[] {
  const db = getDatabase();
  const bills = db.getAllSync<Bill>(
    `SELECT b.*, a.name as account_name
     FROM bills b
     LEFT JOIN accounts a ON b.account_id = a.id
     ORDER BY b.status = 'Pending' DESC, b.due_date ASC, b.created_at DESC;`
  );

  // Recalculate overdue status dynamically
  return bills.map((bill) => {
    if (bill.status === 'Pending' && isOverdue(bill.due_date)) {
      db.runSync('UPDATE bills SET status = "Overdue" WHERE id = ?;', [bill.id]);
      return { ...bill, status: 'Overdue' as BillStatus };
    }
    return bill;
  });
}

export function getBillById(id: string): Bill | null {
  const db = getDatabase();
  return db.getFirstSync<Bill>('SELECT * FROM bills WHERE id = ?;', [id]);
}

export function createBill(data: {
  name: string;
  category: string;
  amount: number;
  billing_period?: string;
  due_date: string;
  is_recurring?: boolean;
  notes?: string;
}): Bill {
  if (data.amount <= 0) throw new Error('Bill amount must be greater than zero');
  const db = getDatabase();
  const id = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const status: BillStatus = isOverdue(data.due_date) ? 'Overdue' : 'Pending';
  const now = new Date().toISOString();

  db.runSync(
    `INSERT INTO bills (id, name, category, amount, billing_period, due_date, is_recurring, status, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      data.name,
      data.category,
      data.amount,
      data.billing_period || null,
      data.due_date,
      data.is_recurring !== false ? 1 : 0,
      status,
      data.notes || null,
      now,
    ]
  );

  return getBillById(id)!;
}

export function markBillAsPaid(data: {
  billId: string;
  accountId: string;
  paymentDate?: string;
  notes?: string;
}): void {
  const db = getDatabase();
  const bill = getBillById(data.billId);
  if (!bill) throw new Error('Bill not found');
  if (bill.status === 'Paid') {
    throw new Error('This bill has already been marked as paid');
  }

  const payDate = data.paymentDate || getTodayDateString();
  const now = new Date().toISOString();

  db.withTransactionSync(() => {
    // 1. Update bill status
    db.runSync(
      'UPDATE bills SET status = "Paid", payment_date = ?, account_id = ? WHERE id = ?;',
      [payDate, data.accountId, data.billId]
    );

    // 2. Deduct from account balance
    db.runSync('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?;', [
      bill.amount,
      now,
      data.accountId,
    ]);

    // 3. Insert account transaction exactly once
    db.runSync(
      `INSERT INTO transactions (id, amount, date, time, type, account_id, title, notes, reference_module, reference_id, created_at)
       VALUES (?, ?, ?, ?, 'expense', ?, ?, ?, 'bill', ?, ?);`,
      [
        `tx_bill_${Date.now()}`,
        bill.amount,
        payDate,
        getCurrentTimeString(),
        data.accountId,
        `Bill Paid: ${bill.name} (${bill.category})`,
        data.notes || bill.notes || null,
        data.billId,
        now,
      ]
    );
  });
}

export function getMonthlyPendingBillsTotal(): number {
  const db = getDatabase();
  const res = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM bills WHERE status != "Paid";'
  );
  return res ? res.total : 0;
}
