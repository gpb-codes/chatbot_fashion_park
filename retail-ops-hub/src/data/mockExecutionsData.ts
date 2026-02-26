import type { ActionExecutionV2, ExecutionPhase } from '@/types/executions';

const generatePhases = (status: string): ExecutionPhase[] => {
  const basePhases: ExecutionPhase[] = [
    { name: 'requested', status: 'completed', timestamp: '2026-02-06T10:50:00Z' },
    { name: 'queued', status: 'pending' },
    { name: 'in_progress', status: 'pending' },
    { name: 'result', status: 'pending' },
  ];

  switch (status) {
    case 'pending_approval':
      return [
        { name: 'requested', status: 'completed', timestamp: '2026-02-06T10:50:00Z' },
        { name: 'pending_approval', status: 'current', timestamp: '2026-02-06T10:50:00Z' },
        { name: 'queued', status: 'pending' },
        { name: 'in_progress', status: 'pending' },
        { name: 'result', status: 'pending' },
      ];
    case 'queued':
      return [
        { name: 'requested', status: 'completed', timestamp: '2026-02-06T10:50:00Z' },
        { name: 'queued', status: 'current', timestamp: '2026-02-06T10:51:00Z' },
        { name: 'in_progress', status: 'pending' },
        { name: 'result', status: 'pending' },
      ];
    case 'in_progress':
      return [
        { name: 'requested', status: 'completed', timestamp: '2026-02-06T10:50:00Z' },
        { name: 'queued', status: 'completed', timestamp: '2026-02-06T10:51:00Z' },
        { name: 'in_progress', status: 'current', timestamp: '2026-02-06T10:51:30Z' },
        { name: 'result', status: 'pending' },
      ];
    case 'success':
      return [
        { name: 'requested', status: 'completed', timestamp: '2026-02-06T10:50:00Z' },
        { name: 'queued', status: 'completed', timestamp: '2026-02-06T10:51:00Z' },
        { name: 'in_progress', status: 'completed', timestamp: '2026-02-06T10:51:30Z' },
        { name: 'result', status: 'completed', timestamp: '2026-02-06T10:52:00Z', message: 'Servicio reiniciado exitosamente' },
      ];
    case 'failed':
      return [
        { name: 'requested', status: 'completed', timestamp: '2026-02-06T10:50:00Z' },
        { name: 'queued', status: 'completed', timestamp: '2026-02-06T10:51:00Z' },
        { name: 'in_progress', status: 'completed', timestamp: '2026-02-06T10:51:30Z' },
        { name: 'result', status: 'failed', timestamp: '2026-02-06T10:52:00Z', message: 'Timeout al esperar respuesta' },
      ];
    case 'blocked':
      return [
        { name: 'requested', status: 'completed', timestamp: '2026-02-06T10:50:00Z' },
        { name: 'queued', status: 'completed', timestamp: '2026-02-06T10:51:00Z' },
        { name: 'blocked', status: 'failed', timestamp: '2026-02-06T10:51:30Z', message: 'Venta activa en progreso' },
      ];
    default:
      return basePhases;
  }
};

export const mockExecutions: ActionExecutionV2[] = [
  {
    id: 'exec-001',
    actionId: 'RESTART_SPDH',
    actionName: 'Reiniciar SPDH',
    posId: 'pos-001',
    posName: 'Caja Principal',
    storeId: 'store-001',
    storeName: 'Mall Plaza Vespucio',
    category: 'operational',
    status: 'success',
    requestedBy: 'jperez',
    requestedAt: '2026-02-06T10:50:00Z',
    completedAt: '2026-02-06T10:52:00Z',
    reason: 'Servicio SPDH no responde correctamente',
    result: 'Servicio reiniciado exitosamente',
    evidence: {
      messageId: 'msg-001-uuid',
      correlationId: 'corr-001-uuid',
      traceId: 'trace-001-abc123',
    },
    phases: generatePhases('success'),
  },
  {
    id: 'exec-002',
    actionId: 'FORCE_SYNC_KEYS',
    actionName: 'Forzar Sincronización de Llaves',
    posId: 'pos-004',
    posName: 'Caja Express',
    storeId: 'store-001',
    storeName: 'Mall Plaza Vespucio',
    category: 'critical',
    status: 'pending_approval',
    requestedBy: 'mrodriguez',
    requestedAt: '2026-02-06T11:00:00Z',
    reason: 'Llaves desincronizadas después de corte de energía',
    evidence: {
      messageId: 'msg-002-uuid',
      correlationId: 'corr-002-uuid',
    },
    phases: generatePhases('pending_approval'),
  },
  {
    id: 'exec-003',
    actionId: 'RESTART_TRANSBANK',
    actionName: 'Reiniciar Transbank',
    posId: 'pos-003',
    posName: 'Caja Rápida',
    storeId: 'store-002',
    storeName: 'Costanera Center',
    category: 'operational',
    status: 'failed',
    requestedBy: 'agarcia',
    requestedAt: '2026-02-06T09:30:00Z',
    completedAt: '2026-02-06T09:32:00Z',
    reason: 'Error de conexión con Transbank',
    errorMessage: 'Timeout al esperar respuesta del servicio',
    retryCount: 1,
    maxRetries: 3,
    evidence: {
      messageId: 'msg-003-uuid',
      correlationId: 'corr-003-uuid',
      traceId: 'trace-003-def456',
    },
    phases: generatePhases('failed'),
  },
  {
    id: 'exec-004',
    actionId: 'GET_SPDH_STATUS',
    actionName: 'Consultar Estado SPDH',
    posId: 'pos-002',
    posName: 'Caja 2',
    storeId: 'store-001',
    storeName: 'Mall Plaza Vespucio',
    category: 'observation',
    status: 'in_progress',
    requestedBy: 'jperez',
    requestedAt: '2026-02-06T11:05:00Z',
    startedAt: '2026-02-06T11:05:30Z',
    evidence: {
      messageId: 'msg-004-uuid',
      correlationId: 'corr-004-uuid',
      traceId: 'trace-004-ghi789',
    },
    phases: generatePhases('in_progress'),
  },
  {
    id: 'exec-005',
    actionId: 'RESTART_SPDH',
    actionName: 'Reiniciar SPDH',
    posId: 'pos-005',
    posName: 'Caja 5',
    storeId: 'store-003',
    storeName: 'Parque Arauco',
    category: 'operational',
    status: 'blocked',
    requestedBy: 'clopez',
    requestedAt: '2026-02-06T10:00:00Z',
    blockReason: 'Venta activa en progreso - no se puede reiniciar',
    evidence: {
      messageId: 'msg-005-uuid',
      correlationId: 'corr-005-uuid',
    },
    phases: generatePhases('blocked'),
  },
  {
    id: 'exec-006',
    actionId: 'CLEAR_TRANSACTION_CACHE',
    actionName: 'Limpiar Caché de Transacciones',
    posId: 'pos-001',
    posName: 'Caja Principal',
    storeId: 'store-001',
    storeName: 'Mall Plaza Vespucio',
    category: 'diagnostic',
    status: 'queued',
    requestedBy: 'jperez',
    requestedAt: '2026-02-06T11:10:00Z',
    reason: 'Diagnóstico de lentitud en procesamiento',
    evidence: {
      messageId: 'msg-006-uuid',
      correlationId: 'corr-006-uuid',
    },
    phases: generatePhases('queued'),
  },
];

export const mockPendingApprovals = mockExecutions.filter(e => e.status === 'pending_approval');

export function filterMockExecutions(filters?: {
  status?: string;
  posId?: string;
  storeId?: string;
  actionId?: string;
  category?: string;
  requestedBy?: string;
}): ActionExecutionV2[] {
  let result = [...mockExecutions];
  
  if (filters?.status) {
    result = result.filter(e => e.status === filters.status);
  }
  if (filters?.posId) {
    result = result.filter(e => e.posId === filters.posId);
  }
  if (filters?.storeId) {
    result = result.filter(e => e.storeId === filters.storeId);
  }
  if (filters?.actionId) {
    result = result.filter(e => e.actionId === filters.actionId);
  }
  if (filters?.category) {
    result = result.filter(e => e.category === filters.category);
  }
  if (filters?.requestedBy) {
    result = result.filter(e => e.requestedBy === filters.requestedBy);
  }
  
  return result;
}
