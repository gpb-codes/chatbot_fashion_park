import { httpClient } from '@/lib/httpClient';
import type { AuditLog, AuditLogFilter } from '@/types/api';

const API_PREFIX = '/api';

/**
 * Audit Service
 * Handles audit log operations.
 */
export const auditService = {
  /**
   * List audit logs
   */
  async listAuditLogs(filter?: AuditLogFilter): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.userId) params.append('userId', filter.userId);
    if (filter?.action) params.append('action', filter.action);
    if (filter?.result) params.append('result', filter.result);

    const queryString = params.toString();
    const url = queryString 
      ? `${API_PREFIX}/audit?${queryString}` 
      : `${API_PREFIX}/audit`;

    return httpClient.get<AuditLog[]>(url);
  },

  /**
   * Get audit log entry by ID
   */
  async getAuditLog(id: string): Promise<AuditLog> {
    return httpClient.get<AuditLog>(`${API_PREFIX}/audit/${id}`);
  },

  /**
   * Export audit logs (returns blob URL)
   */
  async exportAuditLogs(format: 'csv' | 'pdf', filter?: AuditLogFilter): Promise<string> {
    const params = new URLSearchParams({ format });
    
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.userId) params.append('userId', filter.userId);
    if (filter?.action) params.append('action', filter.action);
    if (filter?.result) params.append('result', filter.result);

    return httpClient.get<string>(`${API_PREFIX}/audit/export?${params.toString()}`);
  },
};
