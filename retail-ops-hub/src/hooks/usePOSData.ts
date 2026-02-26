import { usePolling } from './usePolling';
import { apiConfig } from '@/config/apiConfig';
import { posService, actionsService, incidentsService, metricsService } from '@/services';
import { 
  posTerminals as initialPOS, 
  dashboardMetrics as initialMetrics,
  recentExecutions as initialExecutions,
  incidents as initialIncidents 
} from '@/data/mockData';
import {
  simulatePOSChanges,
  simulateMetricsChanges,
  simulateExecutionsChanges,
  simulateNetworkDelay,
} from '@/data/mockSimulation';
import type { POS, DashboardMetrics, ActionExecution, Incident } from '@/types';

/**
 * Mock data fetchers (for demo mode)
 */
async function fetchPOSMock(): Promise<POS[]> {
  await simulateNetworkDelay(200, 500);
  return simulatePOSChanges([...initialPOS]);
}

async function fetchMetricsMock(): Promise<DashboardMetrics> {
  await simulateNetworkDelay(150, 350);
  return simulateMetricsChanges({ ...initialMetrics });
}

async function fetchExecutionsMock(): Promise<ActionExecution[]> {
  await simulateNetworkDelay(200, 400);
  return simulateExecutionsChanges([...initialExecutions]);
}

async function fetchIncidentsMock(): Promise<Incident[]> {
  await simulateNetworkDelay(150, 300);
  return [...initialIncidents];
}

/**
 * POS Polling Hook
 * Uses mock data when VITE_USE_MOCK_DATA=true, otherwise calls REST API
 */
export function usePOSPolling(interval = 30000) {
  const fetchFn = apiConfig.useMockData 
    ? fetchPOSMock 
    : () => posService.listPOS();

  return usePolling<POS[]>({
    fetchFn,
    interval,
    enabled: true,
    initialData: apiConfig.useMockData ? initialPOS : undefined,
  });
}

/**
 * Dashboard Metrics Polling Hook
 * Uses mock data when VITE_USE_MOCK_DATA=true, otherwise calls REST API
 */
export function useMetricsPolling(interval = 30000) {
  const fetchFn = apiConfig.useMockData 
    ? fetchMetricsMock 
    : () => metricsService.getDashboardMetrics();

  return usePolling<DashboardMetrics>({
    fetchFn,
    interval,
    enabled: true,
    initialData: apiConfig.useMockData ? initialMetrics : undefined,
  });
}

/**
 * Action Executions Polling Hook
 * Uses mock data when VITE_USE_MOCK_DATA=true, otherwise calls REST API
 */
export function useExecutionsPolling(interval = 15000) {
  const fetchFn = apiConfig.useMockData 
    ? fetchExecutionsMock 
    : () => actionsService.listRecentExecutions();

  return usePolling<ActionExecution[]>({
    fetchFn,
    interval,
    enabled: true,
    initialData: apiConfig.useMockData ? initialExecutions : undefined,
  });
}

/**
 * Incidents Polling Hook
 * Uses mock data when VITE_USE_MOCK_DATA=true, otherwise calls REST API
 */
export function useIncidentsPolling(interval = 30000) {
  const fetchFn = apiConfig.useMockData 
    ? fetchIncidentsMock 
    : () => incidentsService.listActiveIncidents();

  return usePolling<Incident[]>({
    fetchFn,
    interval,
    enabled: true,
    initialData: apiConfig.useMockData ? initialIncidents : undefined,
  });
}
