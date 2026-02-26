import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiConfig } from '@/config/apiConfig';
import { alertsService } from '@/services/alertsService';
import { mockAlerts, mockAlertDetail, filterMockAlerts } from '@/data/mockAlertsData';
import type { 
  Alert, 
  AlertDetail, 
  AlertsFilter,
  AcknowledgeAlertRequest,
  ResolveAlertRequest,
  BulkAcknowledgeRequest 
} from '@/types/alerts';
import type { PaginatedResponse } from '@/types/pagination';

const QUERY_KEY = 'alerts';

/**
 * Hook for fetching alerts list
 */
export function useAlerts(filters?: AlertsFilter) {
  return useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: async (): Promise<PaginatedResponse<Alert>> => {
      if (apiConfig.useMockData) {
        const filteredAlerts = filterMockAlerts({
          status: filters?.status,
          severity: filters?.severity,
          posId: filters?.posId,
          storeId: filters?.storeId,
        });
        return {
          data: filteredAlerts,
          pagination: {
            total: filteredAlerts.length,
            limit: filters?.limit || 50,
            offset: filters?.offset || 0,
            hasMore: false,
          },
        };
      }
      return alertsService.listAlerts(filters);
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook for fetching active alerts only
 */
export function useActiveAlerts() {
  return useAlerts({ status: 'active' });
}

/**
 * Hook for fetching alert detail
 */
export function useAlertDetail(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async (): Promise<AlertDetail> => {
      if (apiConfig.useMockData) {
        const alert = mockAlerts.find(a => a.id === id);
        if (!alert) {
          throw new Error('Alert not found');
        }
        return {
          ...alert,
          history: mockAlertDetail.history,
          suggestedActions: mockAlertDetail.suggestedActions,
          relatedAlerts: [],
        };
      }
      return alertsService.getAlert(id);
    },
    enabled: !!id,
  });
}

/**
 * Hook for acknowledging an alert
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      request 
    }: { 
      id: string; 
      request?: AcknowledgeAlertRequest 
    }): Promise<Alert> => {
      if (apiConfig.useMockData) {
        const alert = mockAlerts.find(a => a.id === id);
        if (!alert) throw new Error('Alert not found');
        return {
          ...alert,
          status: 'acknowledged',
          acknowledgedAt: new Date().toISOString(),
          acknowledgedBy: 'current-user',
        };
      }
      return alertsService.acknowledgeAlert(id, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Hook for resolving an alert
 */
export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      request 
    }: { 
      id: string; 
      request: ResolveAlertRequest 
    }): Promise<Alert> => {
      if (apiConfig.useMockData) {
        const alert = mockAlerts.find(a => a.id === id);
        if (!alert) throw new Error('Alert not found');
        return {
          ...alert,
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
          resolvedBy: 'current-user',
        };
      }
      return alertsService.resolveAlert(id, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Hook for bulk acknowledging alerts
 */
export function useBulkAcknowledgeAlerts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: BulkAcknowledgeRequest) => {
      if (apiConfig.useMockData) {
        return {
          processed: request.alertIds.length,
          failed: 0,
        };
      }
      return alertsService.bulkAcknowledge(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Hook for deleting an alert
 */
export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (apiConfig.useMockData) {
        return;
      }
      return alertsService.deleteAlert(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Hook for getting alert counts by status
 */
export function useAlertCounts() {
  const { data } = useAlerts();
  
  const counts = {
    active: 0,
    acknowledged: 0,
    resolved: 0,
    critical: 0,
    warning: 0,
    info: 0,
  };
  
  if (data?.data) {
    data.data.forEach(alert => {
      counts[alert.status]++;
      counts[alert.severity]++;
    });
  }
  
  return counts;
}
