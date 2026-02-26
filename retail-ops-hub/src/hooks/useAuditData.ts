import { useState, useCallback, useMemo, useEffect } from 'react';
import { apiConfig } from '@/config/apiConfig';
import { auditLogs as mockAuditLogs } from '@/data/mockData';
import { auditService } from '@/services';
import type { AuditLog } from '@/types';
import type { AuditLogFilter } from '@/types/api';

interface UseAuditDataResult {
  auditLogs: AuditLog[];
  isLoading: boolean;
  error: Error | null;
  filter: AuditLogFilter;
  setFilter: (filter: AuditLogFilter) => void;
  refetch: () => Promise<void>;
}

/**
 * Audit Logs Hook
 * Uses mock data when VITE_USE_MOCK_DATA=true, otherwise calls REST API
 */
export function useAuditData(): UseAuditDataResult {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(
    apiConfig.useMockData ? mockAuditLogs : []
  );
  const [isLoading, setIsLoading] = useState(!apiConfig.useMockData);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<AuditLogFilter>({});

  const refetch = useCallback(async () => {
    if (apiConfig.useMockData) {
      // Apply filters to mock data
      let filtered = [...mockAuditLogs];
      
      if (filter.result) {
        filtered = filtered.filter(log => log.result === filter.result);
      }
      if (filter.action) {
        filtered = filtered.filter(log => log.action === filter.action);
      }
      if (filter.userId) {
        filtered = filtered.filter(log => log.userId === filter.userId);
      }
      
      setAuditLogs(filtered);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await auditService.listAuditLogs(filter);
      setAuditLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar auditoría'));
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  // Refetch when filter changes
  useEffect(() => {
    refetch();
  }, [refetch]);

  return useMemo(() => ({
    auditLogs,
    isLoading,
    error,
    filter,
    setFilter,
    refetch,
  }), [auditLogs, isLoading, error, filter, refetch]);
}
