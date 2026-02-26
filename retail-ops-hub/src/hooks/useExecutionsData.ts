import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiConfig } from '@/config/apiConfig';
import { executionsService } from '@/services/executionsService';
import { 
  mockExecutions, 
  mockPendingApprovals, 
  filterMockExecutions 
} from '@/data/mockExecutionsData';
import type { 
  ActionExecutionV2, 
  TracedExecution,
  ExecutionsFilter,
  CreateExecutionRequest,
  RetryExecutionRequest,
  CancelExecutionRequest,
  EscalateExecutionRequest
} from '@/types/executions';
import type { PaginatedResponse } from '@/types/pagination';

const QUERY_KEY = 'executions';
const PENDING_KEY = 'pending-approvals';

/**
 * Hook for listing executions with filters
 */
export function useExecutions(filters?: ExecutionsFilter) {
  return useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: async (): Promise<PaginatedResponse<ActionExecutionV2>> => {
      if (apiConfig.useMockData) {
        const filtered = filterMockExecutions(filters);
        return {
          data: filtered,
          pagination: {
            total: filtered.length,
            limit: filters?.limit || 50,
            offset: filters?.offset || 0,
            hasMore: false,
          },
        };
      }
      return executionsService.listExecutions(filters);
    },
  });
}

/**
 * Hook for fetching a single execution with traceability
 */
export function useExecution(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async (): Promise<TracedExecution> => {
      if (apiConfig.useMockData) {
        const execution = mockExecutions.find(e => e.id === id);
        if (!execution) throw new Error('Execution not found');
        return {
          execution,
          traceability: {
            requestId: `req-${id}`,
            traceId: execution.evidence.traceId,
            correlationId: execution.evidence.correlationId,
          },
        };
      }
      return executionsService.getExecution(id);
    },
    enabled: !!id,
  });
}

/**
 * Hook for fetching user's own executions
 */
export function useMyExecutions(filters?: ExecutionsFilter) {
  return useQuery({
    queryKey: [QUERY_KEY, 'my', filters],
    queryFn: async (): Promise<PaginatedResponse<ActionExecutionV2>> => {
      if (apiConfig.useMockData) {
        // Simulate filtering by current user
        const filtered = mockExecutions.filter(e => e.requestedBy === 'jperez');
        return {
          data: filtered,
          pagination: {
            total: filtered.length,
            limit: filters?.limit || 50,
            offset: filters?.offset || 0,
            hasMore: false,
          },
        };
      }
      return executionsService.listMyExecutions(filters);
    },
  });
}

/**
 * Hook for fetching pending approvals
 */
export function usePendingApprovals(filters?: {
  category?: string;
  storeId?: string;
  requestedBy?: string;
}) {
  return useQuery({
    queryKey: [PENDING_KEY, filters],
    queryFn: async (): Promise<ActionExecutionV2[]> => {
      if (apiConfig.useMockData) {
        return mockPendingApprovals;
      }
      return executionsService.getPendingApprovals(filters);
    },
    refetchInterval: 30000, // Refresh every 30s
  });
}

/**
 * Hook for creating a new execution
 * Returns TracedExecution with full traceability info
 */
export function useCreateExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateExecutionRequest): Promise<TracedExecution> => {
      if (apiConfig.useMockData) {
        // Simulate creation
        const newExecution: ActionExecutionV2 = {
          id: `exec-${Date.now()}`,
          actionId: request.actionId,
          actionName: request.actionId.replace(/_/g, ' '),
          posId: request.posId,
          posName: 'POS Mock',
          storeId: 'store-001',
          storeName: 'Tienda Mock',
          category: 'operational',
          status: 'queued',
          requestedBy: request.requestedBy,
          requestedAt: new Date().toISOString(),
          reason: request.reason,
          evidence: {
            messageId: `msg-${Date.now()}`,
            correlationId: `corr-${Date.now()}`,
            traceId: `trace-${Date.now()}`,
          },
          phases: [
            { name: 'requested', status: 'completed', timestamp: new Date().toISOString() },
            { name: 'queued', status: 'current', timestamp: new Date().toISOString() },
            { name: 'in_progress', status: 'pending' },
            { name: 'result', status: 'pending' },
          ],
        };
        
        return {
          execution: newExecution,
          traceability: {
            requestId: `req-${Date.now()}`,
            traceId: newExecution.evidence.traceId,
            correlationId: newExecution.evidence.correlationId,
          },
        };
      }
      return executionsService.createExecution(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PENDING_KEY] });
    },
  });
}

/**
 * Hook for retrying a failed execution
 */
export function useRetryExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      request 
    }: { 
      id: string; 
      request?: RetryExecutionRequest 
    }): Promise<TracedExecution> => {
      if (apiConfig.useMockData) {
        const original = mockExecutions.find(e => e.id === id);
        if (!original) throw new Error('Execution not found');
        
        const retryExecution: ActionExecutionV2 = {
          ...original,
          id: `exec-retry-${Date.now()}`,
          status: 'queued',
          requestedAt: new Date().toISOString(),
          retryCount: (original.retryCount || 0) + 1,
          evidence: {
            messageId: `msg-retry-${Date.now()}`,
            correlationId: original.evidence.correlationId,
            traceId: `trace-retry-${Date.now()}`,
          },
        };
        
        return {
          execution: retryExecution,
          traceability: {
            requestId: `req-retry-${Date.now()}`,
            traceId: retryExecution.evidence.traceId,
            correlationId: retryExecution.evidence.correlationId,
          },
        };
      }
      return executionsService.retryExecution(id, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Hook for canceling an execution
 */
export function useCancelExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      request 
    }: { 
      id: string; 
      request: CancelExecutionRequest 
    }) => {
      if (apiConfig.useMockData) {
        return { success: true, message: 'Ejecución cancelada exitosamente' };
      }
      return executionsService.cancelExecution(id, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PENDING_KEY] });
    },
  });
}

/**
 * Hook for escalating to incident
 */
export function useEscalateToIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      request 
    }: { 
      id: string; 
      request: EscalateExecutionRequest 
    }) => {
      if (apiConfig.useMockData) {
        return {
          id: `inc-${Date.now()}`,
          title: `Escalación de ${id}`,
          description: request.description,
          severity: request.severity,
          status: 'open' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          relatedActions: [id],
        };
      }
      return executionsService.escalateToIncident(id, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

/**
 * Hook for approving an execution
 */
export function useApproveExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      if (apiConfig.useMockData) {
        const execution = mockExecutions.find(e => e.id === id);
        if (!execution) throw new Error('Execution not found');
        return {
          ...execution,
          status: 'queued' as const,
          approvedBy: 'admin',
          approvedAt: new Date().toISOString(),
        };
      }
      return executionsService.approveExecution(id, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PENDING_KEY] });
    },
  });
}

/**
 * Hook for rejecting an execution
 */
export function useRejectExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (apiConfig.useMockData) {
        const execution = mockExecutions.find(e => e.id === id);
        if (!execution) throw new Error('Execution not found');
        return {
          ...execution,
          status: 'cancelled' as const,
        };
      }
      return executionsService.rejectExecution(id, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PENDING_KEY] });
    },
  });
}
