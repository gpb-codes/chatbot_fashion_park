/**
 * Mock Data Simulation Utilities
 * These functions simulate real-time changes for demo mode.
 */

import type { POS, DashboardMetrics, ActionExecution, Incident } from '@/types';

/**
 * Simulate POS status changes (demo mode only)
 */
export function simulatePOSChanges(terminals: POS[]): POS[] {
  return terminals.map(pos => {
    const now = new Date();
    const randomOffset = Math.floor(Math.random() * 60000);
    
    let status = pos.status;
    if (Math.random() < 0.05) {
      if (status === 'online') status = Math.random() < 0.3 ? 'warning' : 'online';
      else if (status === 'warning') status = Math.random() < 0.5 ? 'online' : 'warning';
    }

    const services = pos.services.map(svc => ({
      ...svc,
      lastCheck: now.toISOString(),
      status: Math.random() < 0.02 
        ? (svc.status === 'running' ? 'error' : 'running') 
        : svc.status,
    }));

    return {
      ...pos,
      status,
      lastHeartbeat: new Date(now.getTime() - randomOffset).toISOString(),
      services,
    };
  });
}

/**
 * Simulate metrics changes (demo mode only)
 */
export function simulateMetricsChanges(metrics: DashboardMetrics): DashboardMetrics {
  return {
    ...metrics,
    actionsToday: metrics.actionsToday + (Math.random() < 0.3 ? 1 : 0),
    mttrMinutes: Math.round((metrics.mttrMinutes + (Math.random() - 0.5)) * 10) / 10,
    successRate: Math.min(100, Math.max(90, metrics.successRate + (Math.random() - 0.5))),
  };
}

/**
 * Simulate execution status changes (demo mode only)
 */
export function simulateExecutionsChanges(executions: ActionExecution[]): ActionExecution[] {
  return executions.map(exec => {
    if (exec.status === 'pending' && Math.random() < 0.2) {
      return { ...exec, status: 'in_progress' as const };
    }
    if (exec.status === 'in_progress' && Math.random() < 0.3) {
      return {
        ...exec,
        status: 'success' as const,
        completedAt: new Date().toISOString(),
        result: 'Completado correctamente',
      };
    }
    return exec;
  });
}

/**
 * Simulate network delay (demo mode only)
 */
export function simulateNetworkDelay(minMs = 150, maxMs = 300): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise(resolve => setTimeout(resolve, delay));
}
