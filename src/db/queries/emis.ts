import { getDatabase } from '../database';
import { EmiPlan, EmiPayment } from '../../types/database';
import { getCurrentTimeString, getTodayDateString } from '../../utils/date';

export function getAllEmis(): EmiPlan[] {
  const db = getDatabase();
  return db.getAllSync<EmiPlan>('SELECT * FROM emis ORDER BY status = "Active" DESC, due_day ASC;');
}

export function getEmiById(id: string): EmiPlan | null {
  const db = getDatabase();
  return db.getFirstSync<EmiPlan>('SELECT * FROM emis WHERE id = ?;', [id]);
}

export function createEmiPlan(data: {
  name: string;
  monthly_amount: number;
  due_day: number;
  total_installments: number;
  purpose?: string;
  lender?: string;
  principal_amount?: number;
  interest_rate?: number;
  start_date?: string;
  account_id?: string;
}): EmiPlan {
  if (data.monthly_amount <= 0) throw new Error('Monthly amount must be greater than zero');
  if (data.total_installments <= 0) throw new Error('Total installments must be greater than zero');

  const db = getDatabase();
  const id = `emi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const startDate = data.start_date || getTodayDateString();
  const now = new Date().toISOString();

  db.runSync(
    `INSERT INTO emis (id, name, purpose, lender, monthly_amount, principal_amount, interest_rate, start_date, due_day, total_installments, paid_installments, account_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'Active', ?);`,
    [
      id,
      data.name,
      data.purpose || null,
      data.lender || null,
      data.monthly_amount,
      data.principal_amount || null,
      data.interest_rate || null,
      startDate,
      data.due_day,
      data.total_installments,
      data.account_id || null,
      now,
    ]
  );

  return getEmiById(id)!;
}

export function recordEmiPayment(data: {
  emiId: string;
  amount: number;
  accountId: string;
  paymentDate?: string;
  notes?: string;
}): EmiPayment {
  if (data.amount <= 0) throw new Error('Payment amount must be greater than zero');
  const db = getDatabase();
  const emi = getEmiById(data.emiId);
  if (!emi) throw new Error('EMI plan not found');

  const paymentDate = data.paymentDate || getTodayDateString();
  const now = new Date().toISOString();
  const paymentId = `emipay_${Date.now()}`;
  const nextInstallmentNum = emi.paid_installments + 1;
  const newPaidCount = nextInstallmentNum;
  const isCompleted = newPaidCount >= emi.total_installments;

  db.withTransactionSync(() => {
    // 1. Insert EMI payment
    db.runSync(
      `INSERT INTO emi_payments (id, emi_id, installment_number, amount, payment_date, account_id, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [paymentId, data.emiId, nextInstallmentNum, data.amount, paymentDate, data.accountId, data.notes || null, now]
    );

    // 2. Update EMI record
    db.runSync(
      'UPDATE emis SET paid_installments = ?, status = ? WHERE id = ?;',
      [newPaidCount, isCompleted ? 'Completed' : 'Active', data.emiId]
    );

    // 3. Deduct from account balance
    db.runSync('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?;', [
      data.amount,
      now,
      data.accountId,
    ]);

    // 4. Record account transaction
    db.runSync(
      `INSERT INTO transactions (id, amount, date, time, type, account_id, title, notes, reference_module, reference_id, created_at)
       VALUES (?, ?, ?, ?, 'expense', ?, ?, ?, 'emi', ?, ?);`,
      [
        `tx_emi_${Date.now()}`,
        data.amount,
        paymentDate,
        getCurrentTimeString(),
        data.accountId,
        `EMI Paid: ${emi.name} (#${nextInstallmentNum}/${emi.total_installments})`,
        data.notes || null,
        data.emiId,
        now,
      ]
    );
  });

  return db.getFirstSync<EmiPayment>('SELECT * FROM emi_payments WHERE id = ?;', [paymentId])!;
}

export function getEmiPayments(emiId: string): EmiPayment[] {
  const db = getDatabase();
  return db.getAllSync<EmiPayment>(
    'SELECT * FROM emi_payments WHERE emi_id = ? ORDER BY installment_number DESC;',
    [emiId]
  );
}

export function cancelEmiPlan(emiId: string): void {
  const db = getDatabase();
  db.runSync('UPDATE emis SET status = "Cancelled" WHERE id = ?;', [emiId]);
}

export function getUpcomingEmiTotal(): number {
  const db = getDatabase();
  const res = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(monthly_amount), 0) as total FROM emis WHERE status = "Active";'
  );
  return res ? res.total : 0;
}
