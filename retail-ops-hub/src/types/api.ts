/**
 * API Domain Types
 * These represent the frontend-backend contract.
 * Re-exports from main types for API layer consistency.
 */

export type {
  User,
  UserRole,
  POS,
  POSStatus,
  Service,
  ServiceStatus,
  Store,
  Region,
  Action,
  RiskLevel,
  ActionExecution,
  ActionStatus,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  AuditLog,
  DashboardMetrics,
} from '@/types';

/**
 * API Response Wrappers
 */
export interface ApiListResponse<T> {
  data: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Action Execution Request
 */
export interface ExecuteActionRequest {
  actionId: string;
  posId: string;
  executedBy: string;
  notes?: string;
}

/**
 * Action Execution Response
 */
export interface ExecuteActionResponse {
  executionId: string;
  status: 'pending' | 'in_progress';
  message: string;
}

/**
 * Audit Log Filter
 */
export interface AuditLogFilter {
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: string;
  result?: 'success' | 'failure';
}
