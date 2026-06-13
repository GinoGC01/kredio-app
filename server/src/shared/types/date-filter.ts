export type Period = 'last_week' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year' | 'all';

export interface DateRangeFilter {
  period?: Period;
  from?: string;
  to?: string;
}

export function calculateDateRange(filter: DateRangeFilter): { fromDate?: Date; toDate?: Date } {
  if (filter.from || filter.to) {
    return {
      fromDate: filter.from ? new Date(filter.from) : undefined,
      toDate: filter.to ? new Date(filter.to) : undefined,
    };
  }

  const now = new Date();
  let fromDate: Date | undefined;

  switch (filter.period) {
    case 'last_week':
      fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - 7);
      break;
    case 'last_month':
      fromDate = new Date(now);
      fromDate.setMonth(fromDate.getMonth() - 1);
      break;
    case 'last_3_months':
      fromDate = new Date(now);
      fromDate.setMonth(fromDate.getMonth() - 3);
      break;
    case 'last_6_months':
      fromDate = new Date(now);
      fromDate.setMonth(fromDate.getMonth() - 6);
      break;
    case 'last_year':
      fromDate = new Date(now);
      fromDate.setFullYear(fromDate.getFullYear() - 1);
      break;
    case 'all':
    default:
      fromDate = undefined;
      break;
  }

  return { fromDate, toDate: undefined };
}
