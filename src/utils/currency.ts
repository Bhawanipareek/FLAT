/**
 * Indian Number Formatting and Currency Formatter
 * Formats numbers into Indian numbering system: 1,00,000 (Lakhs) and 1,00,00,000 (Crores)
 */

export function formatINR(amount: number | null | undefined, hideSymbol = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return hideSymbol ? '0.00' : '₹0.00';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Split into integer and decimal portions
  const fixedStr = absAmount.toFixed(2);
  const [intPart, decPart] = fixedStr.split('.');

  let formattedInt = '';
  if (intPart.length <= 3) {
    formattedInt = intPart;
  } else {
    // Last 3 digits
    const lastThree = intPart.substring(intPart.length - 3);
    const otherDigits = intPart.substring(0, intPart.length - 3);
    // Group remaining into pairs of 2 digits
    const grouped = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedInt = `${grouped},${lastThree}`;
  }

  const sign = isNegative ? '-' : '';
  const prefix = hideSymbol ? '' : '₹';
  return `${sign}${prefix}${formattedInt}.${decPart}`;
}

export function formatCompactINR(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  let formatted = '';
  if (abs >= 10000000) {
    formatted = `${(abs / 10000000).toFixed(2)} Cr`;
  } else if (abs >= 100000) {
    formatted = `${(abs / 100000).toFixed(2)} L`;
  } else if (abs >= 1000) {
    formatted = `${(abs / 1000).toFixed(1)}k`;
  } else {
    formatted = abs.toFixed(0);
  }

  return `${isNegative ? '-' : ''}₹${formatted}`;
}
