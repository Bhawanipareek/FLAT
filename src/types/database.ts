export type AccountType = 'cash' | 'savings' | 'current' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  opening_balance: number;
  description?: string;
  last_four_digits?: string;
  is_default: number;
  created_at: string;
  updated_at: string;
}

export type TransactionType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'cash_deposit'
  | 'cash_withdrawal'
  | 'adjustment'
  | 'refund';

export type ReferenceModule =
  | 'expense'
  | 'udhar'
  | 'emi'
  | 'vehicle'
  | 'bill'
  | 'salary'
  | 'manual';

export interface Transaction {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  type: TransactionType;
  account_id: string;
  account_name?: string;
  to_account_id?: string;
  to_account_name?: string;
  category_id?: string;
  category_name?: string;
  title: string;
  notes?: string;
  receipt_uri?: string;
  reference_module?: ReferenceModule;
  reference_id?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'expense' | 'income';
  is_system: number;
}

export type UdharDirection = 'GAVE' | 'BORROWED';
export type UdharStatus = 'Active' | 'Partially Paid' | 'Settled' | 'Due Soon' | 'Overdue';

export interface UdharRecord {
  id: string;
  direction: UdharDirection;
  person_name: string;
  phone?: string;
  original_amount: number;
  outstanding_amount: number;
  transaction_date: string; // YYYY-MM-DD
  due_date?: string; // YYYY-MM-DD
  purpose?: string;
  notes?: string;
  repayment_type: 'lump_sum' | 'installments' | 'flexible';
  interest_rate: number;
  status: UdharStatus;
  account_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UdharPayment {
  id: string;
  udhar_id: string;
  amount: number;
  payment_date: string;
  account_id: string;
  account_name?: string;
  notes?: string;
  created_at: string;
}

export type EmiStatus = 'Active' | 'Completed' | 'Cancelled';

export interface EmiPlan {
  id: string;
  name: string;
  purpose?: string;
  lender?: string;
  linked_debt_id?: string;
  monthly_amount: number;
  principal_amount?: number;
  interest_rate?: number;
  start_date: string;
  due_day: number; // 1-31
  total_installments: number;
  paid_installments: number;
  account_id?: string;
  status: EmiStatus;
  created_at: string;
}

export interface EmiPayment {
  id: string;
  emi_id: string;
  installment_number: number;
  amount: number;
  principal_component?: number;
  interest_component?: number;
  payment_date: string;
  account_id: string;
  notes?: string;
  created_at: string;
}

export type VehicleType = 'Bike' | 'Scooter' | 'Car' | 'Other';
export type FuelType = 'Petrol' | 'Diesel' | 'CNG' | 'Electric';

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  manufacturer?: string;
  model?: string;
  reg_number?: string;
  purchase_date?: string;
  fuel_type: FuelType;
  initial_odometer: number;
  current_odometer: number;
  insurance_expiry?: string;
  puc_expiry?: string;
  created_at: string;
}

export interface VehicleFuelLog {
  id: string;
  vehicle_id: string;
  date: string;
  fuel_type: FuelType;
  quantity_litres: number;
  price_per_litre: number;
  total_cost: number;
  odometer: number;
  fuel_station?: string;
  is_full_tank: number; // 1 or 0
  calculated_mileage?: number; // km/l
  notes?: string;
  account_id?: string;
  created_at: string;
}

export interface VehicleService {
  id: string;
  vehicle_id: string;
  service_date: string;
  odometer: number;
  service_centre?: string;
  service_type: string;
  work_performed?: string;
  parts_cost: number;
  labour_cost: number;
  total_cost: number;
  next_service_date?: string;
  next_service_odometer?: number;
  account_id?: string;
  created_at: string;
}

export interface VehicleOtherExpense {
  id: string;
  vehicle_id: string;
  date: string;
  expense_type: string;
  amount: number;
  notes?: string;
  account_id?: string;
  created_at: string;
}

export type BillStatus = 'Pending' | 'Paid' | 'Overdue';

export interface Bill {
  id: string;
  name: string;
  category: string;
  amount: number;
  billing_period?: string;
  due_date: string;
  is_recurring: number;
  status: BillStatus;
  payment_date?: string;
  account_id?: string;
  account_name?: string;
  notes?: string;
  created_at: string;
}

export type AttendanceStatus =
  | 'Full Day'
  | 'Half Day'
  | 'Absent'
  | 'Paid Leave'
  | 'Unpaid Leave'
  | 'Weekly Off'
  | 'Holiday';

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  overtime_hours: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SalaryConfig {
  id: string;
  base_salary: number;
  in_hand_salary: number;
  salary_basis: 'monthly' | 'daily' | 'hourly';
  salary_cycle: 'calendar' | 'custom_day';
  cycle_start_day: number;
  salary_payment_date: number;
  working_days_per_month: number;
  weekly_offs: string; // e.g. "Sunday"
  paid_leaves_per_month: number;
  unpaid_leave_deduction_formula: string;
  half_day_deduction_fraction: number;
  sandwich_rule_enabled: number;
  overtime_hourly_rate: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  name: string;
  greeting?: string;
  avatar_uri?: string;
  hide_balances: boolean;
  biometric_enabled: boolean;
  app_pin?: string;
  dark_mode: boolean;
}
