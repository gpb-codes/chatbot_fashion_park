/**
 * Pagination Types
 * Common pagination interfaces for API responses
 */

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}
