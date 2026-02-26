import { useMemo } from 'react';
import { apiConfig } from '@/config/apiConfig';
import { useStoresData } from './useStoresData';
import { recentExecutions as mockExecutions, dashboardMetrics as mockMetrics } from '@/data/mockData';

/**
 * Mock data for observability charts (demo mode)
 */
const mockHourlyActions = [
  { hour: '08:00', acciones: 2 },
  { hour: '09:00', acciones: 5 },
  { hour: '10:00', acciones: 3 },
  { hour: '11:00', acciones: 8 },
  { hour: '12:00', acciones: 4 },
  { hour: '13:00', acciones: 2 },
  { hour: '14:00', acciones: 6 },
  { hour: '15:00', acciones: 9 },
  { hour: '16:00', acciones: 7 },
  { hour: '17:00', acciones: 4 },
];

const mockResponseTimeData = [
  { name: 'Lun', tiempo: 2.3 },
  { name: 'Mar', tiempo: 1.8 },
  { name: 'Mié', tiempo: 3.1 },
  { name: 'Jue', tiempo: 2.5 },
  { name: 'Vie', tiempo: 1.9 },
  { name: 'Sáb', tiempo: 2.1 },
  { name: 'Dom', tiempo: 1.5 },
];

export interface HourlyAction {
  hour: string;
  acciones: number;
}

export interface ResponseTimePoint {
  name: string;
  tiempo: number;
}

export interface StoreHeatmapRow {
  store: string;
  transbank: number;
  llaves: number;
  sistema: number;
}

export interface ObservabilitySummary {
  totalActions24h: number;
  successRate: number;
  avgResponseTime: number;
  recurringErrors: number;
}

interface UseObservabilityDataResult {
  hourlyActions: HourlyAction[];
  responseTimeData: ResponseTimePoint[];
  storeHeatmapData: StoreHeatmapRow[];
  summary: ObservabilitySummary;
  isLoading: boolean;
}

/**
 * Observability Data Hook
 * Provides chart and summary data for the observability page
 * Uses mock data when VITE_USE_MOCK_DATA=true
 */
export function useObservabilityData(): UseObservabilityDataResult {
  const { stores, isLoading: storesLoading } = useStoresData();

  // Generate heatmap data from stores
  const storeHeatmapData = useMemo(() => {
    if (apiConfig.useMockData) {
      // Use seeded random for consistency in demo mode
      return stores.slice(0, 4).map((store, index) => ({
        store: store.code,
        transbank: [3, 7, 2, 5][index] || 0,
        llaves: [2, 4, 1, 6][index] || 0,
        sistema: [1, 0, 2, 1][index] || 0,
      }));
    }
    // In API mode, this would come from the backend
    return stores.slice(0, 4).map(store => ({
      store: store.code,
      transbank: 0,
      llaves: 0,
      sistema: 0,
    }));
  }, [stores]);

  const summary = useMemo((): ObservabilitySummary => {
    if (apiConfig.useMockData) {
      return {
        totalActions24h: mockMetrics.actionsToday + 23, // Today + some extra
        successRate: mockMetrics.successRate,
        avgResponseTime: 2.4,
        recurringErrors: 3,
      };
    }
    // In API mode, this would be fetched from metrics endpoint
    return {
      totalActions24h: 0,
      successRate: 0,
      avgResponseTime: 0,
      recurringErrors: 0,
    };
  }, []);

  return {
    hourlyActions: apiConfig.useMockData ? mockHourlyActions : [],
    responseTimeData: apiConfig.useMockData ? mockResponseTimeData : [],
    storeHeatmapData,
    summary,
    isLoading: storesLoading,
  };
}
