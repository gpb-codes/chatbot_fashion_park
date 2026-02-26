import { httpClient, TracedResponse } from '@/lib/httpClient';
import type { PaginatedResponse } from '@/types/pagination';
import type { Incident } from '@/types';
import type { 
  ActionExecutionV2,
  TracedExecution,
  ExecutionsFilter,
  CreateExecutionRequest,
  RetryExecutionRequest,
  CancelExecutionRequest,
  EscalateExecutionRequest,
  SuccessResponse
} from '@/types/executions';

const API_PREFIX = '/api';

/**
 * Build query string from filters
 */
function buildQueryString(filters?: ExecutionsFilter): string {
  if (!filters) return '';
  
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.posId) params.append('posId', filters.posId);
  if (filters.storeId) params.append('storeId', filters.storeId);
  if (filters.actionId) params.append('actionId', filters.actionId);
  if (filters.requestedBy) params.append('requestedBy', filters.requestedBy);
  if (filters.category) params.append('category', filters.category);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());
  if (filters.sort) params.append('sort', filters.sort);
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Executions Service
 * Handles all execution-related API operations with full traceability.
 * 
 * Key features:
 * - Uses postTraced/getTraced for operations that need trace IDs
 * - Captures evidence (messageId, correlationId, traceId) from responses
 * - Provides both simple and traced versions of operations
 */
export const executionsService = {
  /**
   * Create a new execution request
   * Returns the execution with full traceability info
   */
  async createExecution(request: CreateExecutionRequest): Promise<TracedExecution> {
    const response = await httpClient.postTraced<ActionExecutionV2>(
      `${API_PREFIX}/executions`,
      request
    );
    
    return {
      execution: response.data,
      traceability: response.traceability,
    };
  },

  /**
   * Create execution (simple version without trace info)
   */
  async createExecutionSimple(request: CreateExecutionRequest): Promise<ActionExecutionV2> {
    return httpClient.post<ActionExecutionV2>(
      `${API_PREFIX}/executions`,
      request
    );
  },

  /**
   * List executions with filters
   */
  async listExecutions(filters?: ExecutionsFilter): Promise<PaginatedResponse<ActionExecutionV2>> {
    const queryString = buildQueryString(filters);
    return httpClient.get<PaginatedResponse<ActionExecutionV2>>(
      `${API_PREFIX}/executions${queryString}`
    );
  },

  /**
   * Get execution by ID with traceability
   */
  async getExecution(id: string): Promise<TracedExecution> {
    const response = await httpClient.getTraced<ActionExecutionV2>(
      `${API_PREFIX}/executions/${id}`
    );
    
    return {
      execution: response.data,
      traceability: response.traceability,
    };
  },

  /**
   * Get execution by ID (simple version)
   */
  async getExecutionSimple(id: string): Promise<ActionExecutionV2> {
    return httpClient.get<ActionExecutionV2>(
      `${API_PREFIX}/executions/${id}`
    );
  },

  /**
   * List executions for the authenticated user
   */
  async listMyExecutions(filters?: ExecutionsFilter): Promise<PaginatedResponse<ActionExecutionV2>> {
    const queryString = buildQueryString(filters);
    return httpClient.get<PaginatedResponse<ActionExecutionV2>>(
      `${API_PREFIX}/executions/my${queryString}`
    );
  },

  /**
   * Retry a failed execution
   * Returns a new execution with traceability
   */
  async retryExecution(id: string, request?: RetryExecutionRequest): Promise<TracedExecution> {
    const response = await httpClient.postTraced<ActionExecutionV2>(
      `${API_PREFIX}/executions/${id}/retry`,
      request
    );
    
    return {
      execution: response.data,
      traceability: response.traceability,
    };
  },

  /**
   * Cancel a pending or queued execution
   */
  async cancelExecution(id: string, request: CancelExecutionRequest): Promise<SuccessResponse> {
    return httpClient.post<SuccessResponse>(
      `${API_PREFIX}/executions/${id}/cancel`,
      request
    );
  },

  /**
   * Escalate a failed execution to an incident
   */
  async escalateToIncident(id: string, request: EscalateExecutionRequest): Promise<Incident> {
    return httpClient.post<Incident>(
      `${API_PREFIX}/executions/${id}/escalate`,
      request
    );
  },

  /**
   * Get executions pending approval
   */
  async getPendingApprovals(filters?: {
    category?: string;
    storeId?: string;
    requestedBy?: string;
  }): Promise<ActionExecutionV2[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.storeId) params.append('storeId', filters.storeId);
    if (filters?.requestedBy) params.append('requestedBy', filters.requestedBy);
    
    const queryString = params.toString();
    const path = queryString 
      ? `${API_PREFIX}/approvals/pending?${queryString}`
      : `${API_PREFIX}/approvals/pending`;
    
    return httpClient.get<ActionExecutionV2[]>(path);
  },

  /**
   * Approve an execution
   */
  async approveExecution(id: string, notes?: string): Promise<ActionExecutionV2> {
    return httpClient.post<ActionExecutionV2>(
      `${API_PREFIX}/approvals/${id}/approve`,
      notes ? { notes } : undefined
    );
  },

  /**
   * Reject an execution
   */
  async rejectExecution(id: string, reason: string): Promise<ActionExecutionV2> {
    return httpClient.post<ActionExecutionV2>(
      `${API_PREFIX}/approvals/${id}/reject`,
      { reason }
    );
  },

  /**
   * Bulk approve/reject executions
   */
  async bulkDecision(request: {
    action: 'approve' | 'reject';
    executionIds: string[];
    notes?: string;
    reason?: string;
  }): Promise<{
    processed: number;
    failed: number;
    results: Array<{ executionId: string; success: boolean; error?: string }>;
  }> {
    return httpClient.post(`${API_PREFIX}/approvals/bulk`, request);
  },
};
