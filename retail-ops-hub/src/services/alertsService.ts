import { httpClient } from '@/lib/httpClient';
import type { 
  Alert, 
  AlertDetail, 
  AlertsFilter,
  AcknowledgeAlertRequest,
  ResolveAlertRequest,
  BulkAcknowledgeRequest,
  BulkOperationResponse
} from '@/types/alerts';
import type { PaginatedResponse } from '@/types/pagination';

const API_PREFIX = '/api';

/**
 * Alerts Service
 * Handles all alert-related API operations.
 */
export const alertsService = {
  /**
   * List alerts with filters
   */
  async listAlerts(filters?: AlertsFilter): Promise<PaginatedResponse<Alert>> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.posId) params.append('posId', filters.posId);
    if (filters?.storeId) params.append('storeId', filters.storeId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    const queryString = params.toString();
    const path = queryString 
      ? `${API_PREFIX}/alerts?${queryString}` 
      : `${API_PREFIX}/alerts`;
    
    return httpClient.get<PaginatedResponse<Alert>>(path);
  },

  /**
   * Get alert by ID with full details
   */
  async getAlert(id: string): Promise<AlertDetail> {
    return httpClient.get<AlertDetail>(`${API_PREFIX}/alerts/${id}`);
  },

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(id: string, request?: AcknowledgeAlertRequest): Promise<Alert> {
    return httpClient.post<Alert>(
      `${API_PREFIX}/alerts/${id}/acknowledge`,
      request
    );
  },

  /**
   * Resolve an alert
   */
  async resolveAlert(id: string, request: ResolveAlertRequest): Promise<Alert> {
    return httpClient.post<Alert>(
      `${API_PREFIX}/alerts/${id}/resolve`,
      request
    );
  },

  /**
   * Bulk acknowledge multiple alerts
   */
  async bulkAcknowledge(request: BulkAcknowledgeRequest): Promise<BulkOperationResponse> {
    return httpClient.post<BulkOperationResponse>(
      `${API_PREFIX}/alerts/bulk/acknowledge`,
      request
    );
  },

  /**
   * Delete a resolved alert (Admin only)
   */
  async deleteAlert(id: string): Promise<void> {
    return httpClient.delete<void>(`${API_PREFIX}/alerts/${id}`);
  },
};
