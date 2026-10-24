export interface EmiScheduleItem {
  installmentNumber: number;
  paymentAmount: number;
  principalComponent: number;
  interestComponent: number;
  remainingPrincipal: number;
}

/**
 * Calculates monthly EMI given principal P, annual interest rate r (percentage), and tenure in months n
 */
export function calculateMonthlyEmi(principal: number, annualRatePct: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRatePct <= 0) {
    return principal / tenureMonths;
  }
  const monthlyRate = annualRatePct / (12 * 100);
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
}

/**
 * Generates full amortisation schedule
 */
export function generateAmortizationSchedule(principal: number, annualRatePct: number, tenureMonths: number): EmiScheduleItem[] {
  const schedule: EmiScheduleItem[] = [];
  if (principal <= 0 || tenureMonths <= 0) return schedule;

  const monthlyEmi = calculateMonthlyEmi(principal, annualRatePct, tenureMonths);
  const monthlyRate = (annualRatePct || 0) / (12 * 100);
  let remaining = principal;

  for (let i = 1; i <= tenureMonths; i++) {
    const interest = remaining * monthlyRate;
    const principalPaid = monthlyEmi - interest;
    remaining = Math.max(0, remaining - principalPaid);

    schedule.push({
      installmentNumber: i,
      paymentAmount: monthlyEmi,
      principalComponent: Math.round(principalPaid * 100) / 100,
      interestComponent: Math.round(interest * 100) / 100,
      remainingPrincipal: Math.round(remaining * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Calculates Fuel Mileage (km / litre) from two consecutive full-tank logs
 */
export function calculateMileage(startOdo: number, endOdo: number, litresConsumed: number): number | null {
  if (endOdo <= startOdo || litresConsumed <= 0) {
    return null;
  }
  const distance = endOdo - startOdo;
  const mileage = distance / litresConsumed;
  return Math.round(mileage * 100) / 100;
}
