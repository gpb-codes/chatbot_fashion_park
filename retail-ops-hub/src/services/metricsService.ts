import { httpClient } from '@/lib/httpClient';
import type { DashboardMetrics } from '@/types/api';

const API_PREFIX = '/api';

/**
 * Metrics Service
 * Handles dashboard and observability metrics.
 */
export const metricsService = {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return httpClient.get<DashboardMetrics>(`${API_PREFIX}/metrics/dashboard`);
  },

  /**
   * Get metrics by time range
   */
  async getMetricsByRange(startDate: string, endDate: string): Promise<DashboardMetrics> {
    return httpClient.get<DashboardMetrics>(
      `${API_PREFIX}/metrics/dashboard?startDate=${startDate}&endDate=${endDate}`
    );
  },
};
