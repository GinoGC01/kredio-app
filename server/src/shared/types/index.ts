export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type { Period, DateRangeFilter } from './date-filter.js';
export { calculateDateRange } from './date-filter.js';
