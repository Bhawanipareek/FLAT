import { getDatabase } from '../database';
import {
  Vehicle,
  VehicleFuelLog,
  VehicleService,
  VehicleOtherExpense,
  VehicleType,
  FuelType,
} from '../../types/database';
import { getCurrentTimeString, getTodayDateString, getCurrentMonthPeriod } from '../../utils/date';
import { calculateMileage } from '../../utils/financial';

export function getAllVehicles(): Vehicle[] {
  const db = getDatabase();
  return db.getAllSync<Vehicle>('SELECT * FROM vehicles ORDER BY created_at DESC;');
}

export function getVehicleById(id: string): Vehicle | null {
  const db = getDatabase();
  return db.getFirstSync<Vehicle>('SELECT * FROM vehicles WHERE id = ?;', [id]);
}

export function createVehicle(data: {
  name: string;
  type: VehicleType;
  manufacturer?: string;
  model?: string;
  reg_number?: string;
  purchase_date?: string;
  fuel_type: FuelType;
  initial_odometer: number;
  insurance_expiry?: string;
  puc_expiry?: string;
}): Vehicle {
  const db = getDatabase();
  const id = `veh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  db.runSync(
    `INSERT INTO vehicles (id, name, type, manufacturer, model, reg_number, purchase_date, fuel_type, initial_odometer, current_odometer, insurance_expiry, puc_expiry, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      data.name,
      data.type,
      data.manufacturer || null,
      data.model || null,
      data.reg_number || null,
      data.purchase_date || null,
      data.fuel_type,
      data.initial_odometer,
      data.initial_odometer,
      data.insurance_expiry || null,
      data.puc_expiry || null,
      now,
    ]
  );

  return getVehicleById(id)!;
}

export function logFuel(data: {
  vehicle_id: string;
  date?: string;
  fuel_type: FuelType;
  quantity_litres: number;
  price_per_litre?: number;
  total_cost?: number;
  odometer: number;
  fuel_station?: string;
  is_full_tank: boolean;
  notes?: string;
  account_id?: string;
}): VehicleFuelLog {
  const db = getDatabase();
  const vehicle = getVehicleById(data.vehicle_id);
  if (!vehicle) throw new Error('Vehicle not found');

  // Prevent accidental negative odometer reading compared to current odometer
  if (data.odometer < vehicle.current_odometer) {
    throw new Error(
      `Odometer reading (${data.odometer}) cannot be less than current odometer (${vehicle.current_odometer})`
    );
  }

  // Calculate costs
  let totalCost = data.total_cost || 0;
  let pricePerLitre = data.price_per_litre || 0;

  if (totalCost > 0 && data.quantity_litres > 0 && pricePerLitre <= 0) {
    pricePerLitre = Math.round((totalCost / data.quantity_litres) * 100) / 100;
  } else if (pricePerLitre > 0 && data.quantity_litres > 0 && totalCost <= 0) {
    totalCost = Math.round(pricePerLitre * data.quantity_litres * 100) / 100;
  }

  const logId = `fuel_${Date.now()}`;
  const logDate = data.date || getTodayDateString();
  const now = new Date().toISOString();

  // Calculate mileage if previous full-tank log exists
  let calculatedMileage: number | null = null;
  if (data.is_full_tank) {
    const prevFullLog = db.getFirstSync<VehicleFuelLog>(
      'SELECT * FROM vehicle_fuel_logs WHERE vehicle_id = ? AND is_full_tank = 1 ORDER BY odometer DESC LIMIT 1;',
      [data.vehicle_id]
    );
    if (prevFullLog && data.odometer > prevFullLog.odometer) {
      calculatedMileage = calculateMileage(prevFullLog.odometer, data.odometer, data.quantity_litres);
    }
  }

  db.withTransactionSync(() => {
    // 1. Insert fuel log
    db.runSync(
      `INSERT INTO vehicle_fuel_logs (id, vehicle_id, date, fuel_type, quantity_litres, price_per_litre, total_cost, odometer, fuel_station, is_full_tank, calculated_mileage, notes, account_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        logId,
        data.vehicle_id,
        logDate,
        data.fuel_type,
        data.quantity_litres,
        pricePerLitre,
        totalCost,
        data.odometer,
        data.fuel_station || null,
        data.is_full_tank ? 1 : 0,
        calculatedMileage,
        data.notes || null,
        data.account_id || null,
        now,
      ]
    );

    // 2. Update vehicle's current odometer
    db.runSync('UPDATE vehicles SET current_odometer = ? WHERE id = ?;', [
      data.odometer,
      data.vehicle_id,
    ]);

    // 3. If account selected, deduct balance and log transaction
    if (data.account_id && totalCost > 0) {
      db.runSync('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?;', [
        totalCost,
        now,
        data.account_id,
      ]);

      db.runSync(
        `INSERT INTO transactions (id, amount, date, time, type, account_id, title, notes, reference_module, reference_id, created_at)
         VALUES (?, ?, ?, ?, 'expense', ?, ?, ?, 'vehicle', ?, ?);`,
        [
          `tx_fuel_${Date.now()}`,
          totalCost,
          logDate,
          getCurrentTimeString(),
          data.account_id,
          `Fuel: ${vehicle.name} (${data.quantity_litres}L)`,
          data.notes || null,
          logId,
          now,
        ]
      );
    }
  });

  return db.getFirstSync<VehicleFuelLog>('SELECT * FROM vehicle_fuel_logs WHERE id = ?;', [logId])!;
}

export function logService(data: {
  vehicle_id: string;
  service_date?: string;
  odometer: number;
  service_centre?: string;
  service_type: string;
  work_performed?: string;
  parts_cost: number;
  labour_cost: number;
  next_service_date?: string;
  next_service_odometer?: number;
  notes?: string;
  account_id?: string;
}): VehicleService {
  const db = getDatabase();
  const vehicle = getVehicleById(data.vehicle_id);
  if (!vehicle) throw new Error('Vehicle not found');

  const sId = `srv_${Date.now()}`;
  const sDate = data.service_date || getTodayDateString();
  const totalCost = (data.parts_cost || 0) + (data.labour_cost || 0);
  const now = new Date().toISOString();

  db.withTransactionSync(() => {
    // 1. Insert service log
    db.runSync(
      `INSERT INTO vehicle_services (id, vehicle_id, service_date, odometer, service_centre, service_type, work_performed, parts_cost, labour_cost, total_cost, next_service_date, next_service_odometer, account_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        sId,
        data.vehicle_id,
        sDate,
        data.odometer,
        data.service_centre || null,
        data.service_type,
        data.work_performed || null,
        data.parts_cost || 0,
        data.labour_cost || 0,
        totalCost,
        data.next_service_date || null,
        data.next_service_odometer || null,
        data.account_id || null,
        now,
      ]
    );

    // 2. Update current odometer if higher
    if (data.odometer > vehicle.current_odometer) {
      db.runSync('UPDATE vehicles SET current_odometer = ? WHERE id = ?;', [
        data.odometer,
        data.vehicle_id,
      ]);
    }

    // 3. Deduct from account if account provided
    if (data.account_id && totalCost > 0) {
      db.runSync('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?;', [
        totalCost,
        now,
        data.account_id,
      ]);

      db.runSync(
        `INSERT INTO transactions (id, amount, date, time, type, account_id, title, notes, reference_module, reference_id, created_at)
         VALUES (?, ?, ?, ?, 'expense', ?, ?, ?, 'vehicle', ?, ?);`,
        [
          `tx_srv_${Date.now()}`,
          totalCost,
          sDate,
          getCurrentTimeString(),
          data.account_id,
          `Vehicle Service: ${vehicle.name} - ${data.service_type}`,
          data.work_performed || null,
          sId,
          now,
        ]
      );
    }
  });

  return db.getFirstSync<VehicleService>('SELECT * FROM vehicle_services WHERE id = ?;', [sId])!;
}

export function logOtherVehicleExpense(data: {
  vehicle_id: string;
  date?: string;
  expense_type: string;
  amount: number;
  notes?: string;
  account_id?: string;
}): VehicleOtherExpense {
  if (data.amount <= 0) throw new Error('Amount must be greater than zero');
  const db = getDatabase();
  const vehicle = getVehicleById(data.vehicle_id);
  if (!vehicle) throw new Error('Vehicle not found');

  const expId = `vexp_${Date.now()}`;
  const expDate = data.date || getTodayDateString();
  const now = new Date().toISOString();

  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO vehicle_other_expenses (id, vehicle_id, date, expense_type, amount, notes, account_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        expId,
        data.vehicle_id,
        expDate,
        data.expense_type,
        data.amount,
        data.notes || null,
        data.account_id || null,
        now,
      ]
    );

    if (data.account_id) {
      db.runSync('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?;', [
        data.amount,
        now,
        data.account_id,
      ]);

      db.runSync(
        `INSERT INTO transactions (id, amount, date, time, type, account_id, title, notes, reference_module, reference_id, created_at)
         VALUES (?, ?, ?, ?, 'expense', ?, ?, ?, 'vehicle', ?, ?);`,
        [
          `tx_vexp_${Date.now()}`,
          data.amount,
          expDate,
          getCurrentTimeString(),
          data.account_id,
          `${vehicle.name} - ${data.expense_type}`,
          data.notes || null,
          expId,
          now,
        ]
      );
    }
  });

  return db.getFirstSync<VehicleOtherExpense>('SELECT * FROM vehicle_other_expenses WHERE id = ?;', [expId])!;
}

export function getVehicleFuelLogs(vehicleId: string): VehicleFuelLog[] {
  const db = getDatabase();
  return db.getAllSync<VehicleFuelLog>(
    'SELECT * FROM vehicle_fuel_logs WHERE vehicle_id = ? ORDER BY date DESC, odometer DESC;',
    [vehicleId]
  );
}

export function getVehicleServices(vehicleId: string): VehicleService[] {
  const db = getDatabase();
  return db.getAllSync<VehicleService>(
    'SELECT * FROM vehicle_services WHERE vehicle_id = ? ORDER BY service_date DESC, odometer DESC;',
    [vehicleId]
  );
}

export function getVehicleOtherExpenses(vehicleId: string): VehicleOtherExpense[] {
  const db = getDatabase();
  return db.getAllSync<VehicleOtherExpense>(
    'SELECT * FROM vehicle_other_expenses WHERE vehicle_id = ? ORDER BY date DESC;',
    [vehicleId]
  );
}

export function getVehicleStats(vehicleId: string): {
  monthlyExpense: number;
  lifetimeExpense: number;
  totalFuelCost: number;
  totalServiceCost: number;
  totalOtherCost: number;
  averageMileage: number | null;
  lastOdometer: number;
} {
  const db = getDatabase();
  const { start, end } = getCurrentMonthPeriod();

  const fuelMonth = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(total_cost), 0) as total FROM vehicle_fuel_logs WHERE vehicle_id = ? AND date >= ? AND date <= ?;',
    [vehicleId, start, end]
  );
  const serviceMonth = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(total_cost), 0) as total FROM vehicle_services WHERE vehicle_id = ? AND service_date >= ? AND service_date <= ?;',
    [vehicleId, start, end]
  );
  const otherMonth = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM vehicle_other_expenses WHERE vehicle_id = ? AND date >= ? AND date <= ?;',
    [vehicleId, start, end]
  );

  const fuelLife = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(total_cost), 0) as total FROM vehicle_fuel_logs WHERE vehicle_id = ?;',
    [vehicleId]
  );
  const serviceLife = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(total_cost), 0) as total FROM vehicle_services WHERE vehicle_id = ?;',
    [vehicleId]
  );
  const otherLife = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM vehicle_other_expenses WHERE vehicle_id = ?;',
    [vehicleId]
  );

  const mileageAvg = db.getFirstSync<{ avg: number }>(
    'SELECT AVG(calculated_mileage) as avg FROM vehicle_fuel_logs WHERE vehicle_id = ? AND calculated_mileage IS NOT NULL;',
    [vehicleId]
  );

  const veh = getVehicleById(vehicleId);

  const monthlyExpense = (fuelMonth?.total || 0) + (serviceMonth?.total || 0) + (otherMonth?.total || 0);
  const totalFuelCost = fuelLife?.total || 0;
  const totalServiceCost = serviceLife?.total || 0;
  const totalOtherCost = otherLife?.total || 0;
  const lifetimeExpense = totalFuelCost + totalServiceCost + totalOtherCost;

  return {
    monthlyExpense,
    lifetimeExpense,
    totalFuelCost,
    totalServiceCost,
    totalOtherCost,
    averageMileage: mileageAvg?.avg ? Math.round(mileageAvg.avg * 100) / 100 : null,
    lastOdometer: veh?.current_odometer || 0,
  };
}

export function getTotalMonthlyVehicleSpending(): number {
  const db = getDatabase();
  const { start, end } = getCurrentMonthPeriod();

  const fuel = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(total_cost), 0) as total FROM vehicle_fuel_logs WHERE date >= ? AND date <= ?;',
    [start, end]
  );
  const srv = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(total_cost), 0) as total FROM vehicle_services WHERE service_date >= ? AND service_date <= ?;',
    [start, end]
  );
  const oth = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM vehicle_other_expenses WHERE date >= ? AND date <= ?;',
    [start, end]
  );

  return (fuel?.total || 0) + (srv?.total || 0) + (oth?.total || 0);
}
