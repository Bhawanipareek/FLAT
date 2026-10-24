export function getTodayDateString(): string {
  const now = new Date();
  return formatDateToISO(now);
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getCurrentMonthPeriod(): { start: string; end: string; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const start = formatDateToISO(new Date(year, month, 1));
  const end = formatDateToISO(new Date(year, month + 1, 0));
  const label = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  
  return { start, end, label };
}

export function isOverdue(dueDateStr?: string): boolean {
  if (!dueDateStr) return false;
  const today = getTodayDateString();
  return dueDateStr < today;
}

export function isDueSoon(dueDateStr?: string, daysWindow = 3): boolean {
  if (!dueDateStr) return false;
  const today = new Date();
  const todayStr = formatDateToISO(today);
  if (dueDateStr < todayStr) return false; // Already overdue

  const future = new Date();
  future.setDate(today.getDate() + daysWindow);
  const futureStr = formatDateToISO(future);
  return dueDateStr <= futureStr;
}
