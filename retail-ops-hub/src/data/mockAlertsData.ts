import type { Alert, AlertDetail } from '@/types/alerts';

export const mockAlerts: Alert[] = [
  {
    id: 'alert-001',
    type: 'pos_offline',
    severity: 'critical',
    status: 'active',
    title: 'POS sin conexión',
    message: 'POS-04 no ha enviado heartbeat en los últimos 5 minutos',
    posId: 'pos-004',
    posName: 'Caja Express',
    storeId: 'store-001',
    storeName: 'Mall Plaza Vespucio',
    createdAt: '2026-02-06T10:40:00Z',
    acknowledgedAt: null,
    acknowledgedBy: null,
    resolvedAt: null,
    resolvedBy: null,
    autoResolvable: true,
    relatedExecutionId: null,
  },
  {
    id: 'alert-002',
    type: 'service_down',
    severity: 'warning',
    status: 'acknowledged',
    title: 'Servicio SPDH degradado',
    message: 'El servicio SPDH en POS-02 reporta latencia elevada',
    posId: 'pos-002',
    posName: 'Caja Principal',
    storeId: 'store-001',
    storeName: 'Mall Plaza Vespucio',
    createdAt: '2026-02-06T09:30:00Z',
    acknowledgedAt: '2026-02-06T09:35:00Z',
    acknowledgedBy: 'jperez',
    resolvedAt: null,
    resolvedBy: null,
    autoResolvable: false,
    relatedExecutionId: null,
  },
  {
    id: 'alert-003',
    type: 'execution_failed',
    severity: 'warning',
    status: 'resolved',
    title: 'Ejecución fallida',
    message: 'RESTART_SPDH falló en POS-03 - Timeout',
    posId: 'pos-003',
    posName: 'Caja Rápida',
    storeId: 'store-002',
    storeName: 'Costanera Center',
    createdAt: '2026-02-06T08:00:00Z',
    acknowledgedAt: '2026-02-06T08:05:00Z',
    acknowledgedBy: 'agarcia',
    resolvedAt: '2026-02-06T08:30:00Z',
    resolvedBy: 'agarcia',
    autoResolvable: false,
    relatedExecutionId: 'exec-001',
  },
  {
    id: 'alert-004',
    type: 'agent_outdated',
    severity: 'info',
    status: 'active',
    title: 'Agente desactualizado',
    message: 'POS-05 tiene versión 2.0.1, se recomienda actualizar a 2.1.0',
    posId: 'pos-005',
    posName: 'Caja 5',
    storeId: 'store-003',
    storeName: 'Parque Arauco',
    createdAt: '2026-02-05T14:00:00Z',
    acknowledgedAt: null,
    acknowledgedBy: null,
    resolvedAt: null,
    resolvedBy: null,
    autoResolvable: false,
    relatedExecutionId: null,
  },
  {
    id: 'alert-005',
    type: 'high_error_rate',
    severity: 'critical',
    status: 'active',
    title: 'Alta tasa de errores',
    message: 'POS-01 reporta más del 10% de transacciones fallidas en la última hora',
    posId: 'pos-001',
    posName: 'Caja Central',
    storeId: 'store-001',
    storeName: 'Mall Plaza Vespucio',
    createdAt: '2026-02-06T11:00:00Z',
    acknowledgedAt: null,
    acknowledgedBy: null,
    resolvedAt: null,
    resolvedBy: null,
    autoResolvable: false,
    relatedExecutionId: null,
  },
];

export const mockAlertDetail: AlertDetail = {
  ...mockAlerts[0],
  history: [
    {
      timestamp: '2026-02-06T10:40:00Z',
      event: 'created',
      details: 'Último heartbeat: 2026-02-06T10:35:00Z',
    },
  ],
  suggestedActions: [
    {
      actionId: 'RESTART_POS_AGENT',
      name: 'Reiniciar Agente POS',
      reason: 'Puede restaurar la conexión',
    },
    {
      actionId: 'GET_SPDH_STATUS',
      name: 'Consultar Estado SPDH',
      reason: 'Verificar estado de servicios',
    },
  ],
  relatedAlerts: [],
};

// Helper function to get alerts by filter
export function filterMockAlerts(filters?: {
  status?: string;
  severity?: string;
  posId?: string;
  storeId?: string;
}): Alert[] {
  let result = [...mockAlerts];
  
  if (filters?.status) {
    result = result.filter(a => a.status === filters.status);
  }
  if (filters?.severity) {
    result = result.filter(a => a.severity === filters.severity);
  }
  if (filters?.posId) {
    result = result.filter(a => a.posId === filters.posId);
  }
  if (filters?.storeId) {
    result = result.filter(a => a.storeId === filters.storeId);
  }
  
  return result;
}
