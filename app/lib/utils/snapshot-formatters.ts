/**
 * Format number as Vietnamese Dong (VND)
 * 1234567.89 → 1.234.567 ₫
 */
export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format percentage with 1 decimal place
 * 0.714 → 71.4%
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format completion rate as "completed / total (percentage)"
 * 71, 100 → "71/100 (71%)"
 */
export const formatCompletionRate = (completed: number, total: number): string => {
  if (total === 0) return '0/0 (0%)';
  const percentage = (completed / total) * 100;
  return `${completed}/${total} (${percentage.toFixed(0)}%)`;
};

/**
 * Format date to locale string (vi-VN)
 * "2026-04-01" → "01/04/2026"
 */
export const formatDate = (dateString: string, locale: string = 'vi-VN'): string => {
  try {
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString(locale);
  } catch {
    return dateString;
  }
};

/**
 * Format date range for display
 * "2026-04-01", "2026-04-30" → "01/04 - 30/04/2026"
 */
export const formatDateRange = (
  startDate: string,
  endDate: string,
  locale: string = 'vi-VN'
): string => {
  try {
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');

    const startDay = start.getDate();
    const startMonth = start.getMonth() + 1;
    const endDay = end.getDate();
    const endMonth = end.getMonth() + 1;
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${startDay}/${startMonth} - ${endDay}/${endMonth}/${year}`;
    }
    return `${startDay}/${startMonth} - ${endDay}/${endMonth}/${year}`;
  } catch {
    return `${startDate} - ${endDate}`;
  }
};

/**
 * Format large number with K/M suffix
 * 1000 → 1K
 * 1000000 → 1M
 */
export const formatShortNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Determine cancellation rate severity
 * Returns: 'normal' | 'warning' | 'danger'
 */
export const getCancellationSeverity = (cancelledCount: number, totalCount: number): string => {
  if (totalCount === 0) return 'normal';
  const rate = (cancelledCount / totalCount) * 100;
  if (rate > 10) return 'danger';
  if (rate > 5) return 'warning';
  return 'normal';
};

/**
 * Format month for yearly chart display
 * "2026-01-31" → "Tháng 1" or "Jan"
 */
export const formatMonthLabel = (dateString: string, locale: string = 'vi-VN'): string => {
  try {
    const date = new Date(dateString + 'T00:00:00Z');
    if (locale === 'vi-VN') {
      return `Tháng ${date.getMonth() + 1}`;
    }
    return date.toLocaleDateString(locale, { month: 'short' });
  } catch {
    return dateString;
  }
};

/**
 * Group daily breakdown data by month (for yearly period views)
 * Aggregates all daily entries within each month into a single entry per month
 */
export const groupBreakdownByMonth = (breakdown: any[]): any[] => {
  const monthMap = new Map<string, any>();

  breakdown.forEach((entry) => {
    const date = new Date(entry.date + 'T00:00:00Z');
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        date: monthKey,
        revenue: 0,
        discountAmount: 0,
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        newCustomers: 0,
        newReservations: 0,
        _count: 0,
      });
    }

    const monthEntry = monthMap.get(monthKey)!;
    monthEntry.revenue += entry.revenue ?? 0;
    monthEntry.discountAmount += entry.discountAmount ?? 0;
    monthEntry.totalOrders += entry.totalOrders ?? 0;
    monthEntry.completedOrders += entry.completedOrders ?? 0;
    monthEntry.cancelledOrders += entry.cancelledOrders ?? 0;
    monthEntry.newCustomers += entry.newCustomers ?? 0;
    monthEntry.newReservations += entry.newReservations ?? 0;
    monthEntry._count += 1;
  });

  return Array.from(monthMap.values()).sort((a, b) => a.date.localeCompare(b.date));
};
