import { useState, useCallback, useMemo, useEffect } from 'react';
import { apiConfig } from '@/config/apiConfig';
import { 
  mockActionRequests, 
  mockCommandExecutions, 
  mockActionAuditLogs,
  getPendingApprovals,
  getRecentExecutions,
} from '@/data/mockCommandData';
import type { 
  ActionRequest, 
  CommandExecution, 
  ActionAuditLog,
  CommandType,
  ApprovalStatus,
} from '@/types/commands';
import { COMMAND_CATALOG, generateMessageId, generateCorrelationId, PROTOCOL_VERSION } from '@/types/commands';
import { stores, posTerminals } from '@/data/mockData';

// ============= Action Requests Hook =============

interface UseActionRequestsResult {
  requests: ActionRequest[];
  pendingRequests: ActionRequest[];
  isLoading: boolean;
  error: Error | null;
  approveRequest: (requestId: string, approvedBy: { user_id: string; user_name: string; role: 'admin' }) => Promise<void>;
  rejectRequest: (requestId: string, reason: string, rejectedBy: { user_id: string; user_name: string; role: 'admin' }) => Promise<void>;
  createRequest: (request: Omit<ActionRequest, 'id' | 'requested_at' | 'approval_status'>) => Promise<ActionRequest>;
  refetch: () => Promise<void>;
}

export function useActionRequests(): UseActionRequestsResult {
  const [requests, setRequests] = useState<ActionRequest[]>(
    apiConfig.useMockData ? mockActionRequests : []
  );
  const [isLoading, setIsLoading] = useState(!apiConfig.useMockData);
  const [error, setError] = useState<Error | null>(null);

  const pendingRequests = useMemo(() => 
    requests.filter(r => r.approval_status === 'pending'),
    [requests]
  );

  const refetch = useCallback(async () => {
    if (apiConfig.useMockData) {
      setRequests(mockActionRequests);
      return;
    }
    // API implementation would go here
    setIsLoading(true);
    try {
      // const data = await commandService.listActionRequests();
      // setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar solicitudes'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!apiConfig.useMockData) {
      refetch();
    }
  }, [refetch]);

  const approveRequest = useCallback(async (
    requestId: string, 
    approvedBy: { user_id: string; user_name: string; role: 'admin' }
  ) => {
    if (apiConfig.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { 
              ...r, 
              approval_status: 'approved' as ApprovalStatus, 
              approved_by: approvedBy,
              approved_at: new Date().toISOString(),
            }
          : r
      ));
      return;
    }
    // API implementation would go here
  }, []);

  const rejectRequest = useCallback(async (
    requestId: string, 
    reason: string,
    rejectedBy: { user_id: string; user_name: string; role: 'admin' }
  ) => {
    if (apiConfig.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { 
              ...r, 
              approval_status: 'rejected' as ApprovalStatus, 
              approved_by: rejectedBy,
              approved_at: new Date().toISOString(),
              rejection_reason: reason,
            }
          : r
      ));
      return;
    }
    // API implementation would go here
  }, []);

  const createRequest = useCallback(async (
    request: Omit<ActionRequest, 'id' | 'requested_at' | 'approval_status'>
  ): Promise<ActionRequest> => {
    if (apiConfig.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const newRequest: ActionRequest = {
        ...request,
        id: `req-${Date.now()}`,
        requested_at: new Date().toISOString(),
        approval_status: 'pending',
      };
      setRequests(prev => [newRequest, ...prev]);
      return newRequest;
    }
    throw new Error('API not implemented');
  }, []);

  return {
    requests,
    pendingRequests,
    isLoading,
    error,
    approveRequest,
    rejectRequest,
    createRequest,
    refetch,
  };
}

// ============= Command Executions Hook =============

interface UseCommandExecutionsResult {
  executions: CommandExecution[];
  recentExecutions: CommandExecution[];
  isLoading: boolean;
  error: Error | null;
  executeCommand: (
    command: CommandType,
    posId: string,
    executedBy: { user_id: string; user_name: string; role: 'operator' | 'admin' },
    payload?: Record<string, unknown>
  ) => Promise<CommandExecution>;
  refetch: () => Promise<void>;
}

export function useCommandExecutions(): UseCommandExecutionsResult {
  const [executions, setExecutions] = useState<CommandExecution[]>(
    apiConfig.useMockData ? mockCommandExecutions : []
  );
  const [isLoading, setIsLoading] = useState(!apiConfig.useMockData);
  const [error, setError] = useState<Error | null>(null);

  const recentExecutions = useMemo(() => 
    [...executions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10),
    [executions]
  );

  const refetch = useCallback(async () => {
    if (apiConfig.useMockData) {
      setExecutions(mockCommandExecutions);
      return;
    }
    setIsLoading(true);
    try {
      // API implementation
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar ejecuciones'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!apiConfig.useMockData) {
      refetch();
    }
  }, [refetch]);

  const executeCommand = useCallback(async (
    command: CommandType,
    posId: string,
    executedBy: { user_id: string; user_name: string; role: 'operator' | 'admin' },
    payload: Record<string, unknown> = {}
  ): Promise<CommandExecution> => {
    const pos = posTerminals.find(p => p.id === posId);
    const store = pos ? stores.find(s => s.id === pos.storeId) : null;

    if (!pos || !store) {
      throw new Error('POS o tienda no encontrada');
    }

    const messageId = generateMessageId();
    const correlationId = generateCorrelationId();

    const newExecution: CommandExecution = {
      id: `exec-${Date.now()}`,
      command_message: {
        protocol_version: PROTOCOL_VERSION,
        message_id: messageId,
        correlation_id: correlationId,
        message_type: 'COMMAND',
        command,
        target: {
          pos_id: posId,
          store_id: store.id,
          environment: 'production',
        },
        issued_by: executedBy,
        issued_at: new Date().toISOString(),
        security: { mtls_subject: `CN=${posId}.${store.id}.fashionpark.cl` },
        payload,
      },
      status: 'pending',
      created_at: new Date().toISOString(),
      ttl_seconds: 120,
      retry_count: 0,
      max_retries: 3,
    };

    if (apiConfig.useMockData) {
      // Simulate async execution
      setExecutions(prev => [newExecution, ...prev]);

      // Simulate command being sent
      await new Promise(resolve => setTimeout(resolve, 500));
      setExecutions(prev => prev.map(e => 
        e.id === newExecution.id 
          ? { ...e, status: 'sent', sent_at: new Date().toISOString() } 
          : e
      ));

      // Simulate acknowledgment
      await new Promise(resolve => setTimeout(resolve, 300));
      setExecutions(prev => prev.map(e => 
        e.id === newExecution.id 
          ? { ...e, status: 'executing', acknowledged_at: new Date().toISOString() } 
          : e
      ));

      // Simulate completion (random success/fail/block)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      const outcomes: Array<'completed' | 'failed' | 'blocked'> = ['completed', 'completed', 'completed', 'failed', 'blocked'];
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      
      const resultStatus = outcome === 'completed' ? 'SUCCESS' : outcome === 'failed' ? 'FAILED' : 'BLOCKED';
      
      setExecutions(prev => prev.map(e => 
        e.id === newExecution.id 
          ? { 
              ...e, 
              status: outcome,
              completed_at: new Date().toISOString(),
              result_message: {
                protocol_version: PROTOCOL_VERSION,
                message_id: `${messageId}-result`,
                correlation_id: correlationId,
                message_type: 'RESULT',
                command,
                target: newExecution.command_message.target,
                status: resultStatus,
                details: outcome === 'completed' 
                  ? { execution_time_ms: 1500 + Math.random() * 3000, service_state: 'running', agent_version: '2.4.1' }
                  : outcome === 'failed'
                  ? { error_code: 'TIMEOUT', error_message: 'Operación excedió tiempo límite' }
                  : { block_reason: 'Precondición no cumplida', precondition_failed: 'Venta activa detectada' },
                started_at: newExecution.command_message.issued_at,
                finished_at: new Date().toISOString(),
              },
            } 
          : e
      ));

      return newExecution;
    }

    throw new Error('API not implemented');
  }, []);

  return {
    executions,
    recentExecutions,
    isLoading,
    error,
    executeCommand,
    refetch,
  };
}

// ============= Action Audit Hook =============

interface UseActionAuditResult {
  auditLogs: ActionAuditLog[];
  isLoading: boolean;
  error: Error | null;
  getLogsByCorrelationId: (correlationId: string) => ActionAuditLog[];
  refetch: () => Promise<void>;
}

export function useActionAudit(): UseActionAuditResult {
  const [auditLogs, setAuditLogs] = useState<ActionAuditLog[]>(
    apiConfig.useMockData ? mockActionAuditLogs : []
  );
  const [isLoading, setIsLoading] = useState(!apiConfig.useMockData);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (apiConfig.useMockData) {
      setAuditLogs(mockActionAuditLogs);
      return;
    }
    setIsLoading(true);
    try {
      // API implementation
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar auditoría'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!apiConfig.useMockData) {
      refetch();
    }
  }, [refetch]);

  const getLogsByCorrelationId = useCallback((correlationId: string) => {
    return auditLogs.filter(log => log.correlation_id === correlationId);
  }, [auditLogs]);

  return {
    auditLogs,
    isLoading,
    error,
    getLogsByCorrelationId,
    refetch,
  };
}
