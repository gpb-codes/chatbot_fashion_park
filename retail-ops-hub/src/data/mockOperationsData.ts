import type { 
  ActionExecutionV2, 
  TimelineEvent, 
  ActionCategory,
  ActionLifecycleStatus,
  ActionPhase,
  EvidenceIds,
  POSContext,
  PreflightCheck
} from '@/types/actions';

// Generate mock evidence IDs
function generateEvidenceIds(): EvidenceIds {
  const randomHex = (length: number) => 
    Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  
  return {
    messageId: `msg-${randomHex(8)}-${randomHex(4)}-${randomHex(4)}`,
    correlationId: `corr-${randomHex(8)}-${randomHex(4)}-${randomHex(4)}`,
    traceId: randomHex(32),
    spanId: randomHex(16),
  };
}

// Generate phases based on status
function generatePhases(status: ActionLifecycleStatus): ActionPhase[] {
  const baseTime = Date.now();
  
  const phases: ActionPhase[] = [
    { name: 'Solicitado', status: 'pending', timestamp: undefined, message: undefined },
    { name: 'Aprobado', status: 'pending', timestamp: undefined, message: undefined },
    { name: 'En Cola', status: 'pending', timestamp: undefined, message: undefined },
    { name: 'Ejecutando', status: 'pending', timestamp: undefined, message: undefined },
    { name: 'Resultado', status: 'pending', timestamp: undefined, message: undefined },
  ];

  switch (status) {
    case 'draft':
      break;
    case 'pending_approval':
      phases[0] = { ...phases[0], status: 'completed', timestamp: new Date(baseTime - 300000).toISOString() };
      phases[1] = { ...phases[1], status: 'active', message: 'Esperando aprobación de supervisor' };
      break;
    case 'queued':
      phases[0] = { ...phases[0], status: 'completed', timestamp: new Date(baseTime - 300000).toISOString() };
      phases[1] = { ...phases[1], status: 'completed', timestamp: new Date(baseTime - 240000).toISOString() };
      phases[2] = { ...phases[2], status: 'active', message: 'Solicitud creada. Esperando ejecución en POS.' };
      break;
    case 'in_progress':
      phases[0] = { ...phases[0], status: 'completed', timestamp: new Date(baseTime - 300000).toISOString() };
      phases[1] = { ...phases[1], status: 'completed', timestamp: new Date(baseTime - 240000).toISOString() };
      phases[2] = { ...phases[2], status: 'completed', timestamp: new Date(baseTime - 180000).toISOString() };
      phases[3] = { ...phases[3], status: 'active', message: 'Procesando acción en el POS...' };
      break;
    case 'success':
      phases[0] = { ...phases[0], status: 'completed', timestamp: new Date(baseTime - 300000).toISOString() };
      phases[1] = { ...phases[1], status: 'completed', timestamp: new Date(baseTime - 240000).toISOString() };
      phases[2] = { ...phases[2], status: 'completed', timestamp: new Date(baseTime - 180000).toISOString() };
      phases[3] = { ...phases[3], status: 'completed', timestamp: new Date(baseTime - 120000).toISOString() };
      phases[4] = { ...phases[4], status: 'completed', timestamp: new Date(baseTime - 60000).toISOString() };
      break;
    case 'failed':
      phases[0] = { ...phases[0], status: 'completed', timestamp: new Date(baseTime - 300000).toISOString() };
      phases[1] = { ...phases[1], status: 'completed', timestamp: new Date(baseTime - 240000).toISOString() };
      phases[2] = { ...phases[2], status: 'completed', timestamp: new Date(baseTime - 180000).toISOString() };
      phases[3] = { ...phases[3], status: 'completed', timestamp: new Date(baseTime - 120000).toISOString() };
      phases[4] = { ...phases[4], status: 'failed', message: 'Timeout: POS no responde después de 120s' };
      break;
    case 'blocked':
      phases[0] = { ...phases[0], status: 'completed', timestamp: new Date(baseTime - 300000).toISOString() };
      phases[1] = { ...phases[1], status: 'completed', timestamp: new Date(baseTime - 240000).toISOString() };
      phases[2] = { ...phases[2], status: 'failed', message: 'BLOCKED: Precondición no cumplida - venta activa detectada' };
      break;
    case 'cancelled':
      phases[0] = { ...phases[0], status: 'completed', timestamp: new Date(baseTime - 300000).toISOString() };
      phases[1] = { ...phases[1], status: 'failed', message: 'Cancelado por usuario' };
      break;
  }

  return phases;
}

// Extended mock executions
export const mockExecutionsV2: ActionExecutionV2[] = [
  {
    id: 'exec-v2-001',
    actionId: 'RESTART_TRANSBANK',
    actionName: 'Reiniciar Servicio Transbank',
    posId: 'pos-003',
    posName: 'POS-03 Caja Express',
    storeId: 'store-002',
    storeName: 'Costanera Center',
    status: 'success',
    category: 'operational',
    phases: generatePhases('success'),
    evidence: generateEvidenceIds(),
    requestedBy: 'Carlos Mendoza',
    requestedAt: new Date(Date.now() - 1800000).toISOString(),
    approvedBy: undefined,
    approvedAt: undefined,
    startedAt: new Date(Date.now() - 1780000).toISOString(),
    completedAt: new Date(Date.now() - 1750000).toISOString(),
    result: 'Servicio reiniciado correctamente. Tiempo: 45s',
  },
  {
    id: 'exec-v2-002',
    actionId: 'RESTART_POS_AGENT',
    actionName: 'Reiniciar Agente POS',
    posId: 'pos-004',
    posName: 'POS-04 Caja Central',
    storeId: 'store-002',
    storeName: 'Costanera Center',
    status: 'failed',
    category: 'critical',
    phases: generatePhases('failed'),
    evidence: generateEvidenceIds(),
    requestedBy: 'Carlos Mendoza',
    requestedAt: new Date(Date.now() - 7200000).toISOString(),
    approvedBy: 'Jefe TI',
    approvedAt: new Date(Date.now() - 7100000).toISOString(),
    startedAt: new Date(Date.now() - 7000000).toISOString(),
    completedAt: new Date(Date.now() - 6900000).toISOString(),
    errorMessage: 'Timeout: POS no responde después de 120s',
    retryCount: 1,
    maxRetries: 3,
  },
  {
    id: 'exec-v2-003',
    actionId: 'FORCE_SYNC_KEYS',
    actionName: 'Forzar Sincronización de Claves',
    posId: 'pos-005',
    posName: 'POS-01 Principal',
    storeId: 'store-003',
    storeName: 'Parque Arauco',
    status: 'pending_approval',
    category: 'operational',
    phases: generatePhases('pending_approval'),
    evidence: generateEvidenceIds(),
    requestedBy: 'María González',
    requestedAt: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'exec-v2-004',
    actionId: 'RESTART_LLAVES_DIRECTO',
    actionName: 'Reiniciar Llaves Directo',
    posId: 'pos-001',
    posName: 'POS-01 Caja Principal',
    storeId: 'store-001',
    storeName: 'Mall Plaza Vespucio',
    status: 'in_progress',
    category: 'diagnostic',
    phases: generatePhases('in_progress'),
    evidence: generateEvidenceIds(),
    requestedBy: 'Carlos Mendoza',
    requestedAt: new Date(Date.now() - 120000).toISOString(),
    startedAt: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: 'exec-v2-005',
    actionId: 'CLEAR_TRANSACTION_CACHE',
    actionName: 'Limpiar Caché de Transacciones',
    posId: 'pos-002',
    posName: 'POS-02 Caja Secundaria',
    storeId: 'store-001',
    storeName: 'Mall Plaza Vespucio',
    status: 'blocked',
    category: 'operational',
    phases: generatePhases('blocked'),
    evidence: generateEvidenceIds(),
    requestedBy: 'María González',
    requestedAt: new Date(Date.now() - 600000).toISOString(),
    blockReason: 'Transacciones pendientes de cierre detectadas',
  },
  {
    id: 'exec-v2-006',
    actionId: 'UPDATE_AGENT_CONFIG',
    actionName: 'Actualizar Configuración',
    posId: 'pos-005',
    posName: 'POS-01 Principal',
    storeId: 'store-003',
    storeName: 'Parque Arauco',
    status: 'queued',
    category: 'observation',
    phases: generatePhases('queued'),
    evidence: generateEvidenceIds(),
    requestedBy: 'Carlos Mendoza',
    requestedAt: new Date(Date.now() - 180000).toISOString(),
  },
];

// Mock timeline events
export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 'evt-001',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    type: 'execution',
    title: 'Acción en progreso',
    description: 'RESTART_LLAVES_DIRECTO ejecutándose en POS-01',
    user: 'Carlos Mendoza',
    status: 'in_progress',
    evidence: generateEvidenceIds(),
    posId: 'pos-001',
    posName: 'POS-01 Caja Principal',
    storeId: 'store-001',
    storeName: 'Mall Plaza Vespucio',
    actionId: 'RESTART_LLAVES_DIRECTO',
    actionName: 'Reiniciar Llaves Directo',
    category: 'diagnostic',
  },
  {
    id: 'evt-002',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    type: 'request',
    title: 'Solicitud de aprobación',
    description: 'Pendiente aprobación para FORCE_SYNC_KEYS',
    user: 'María González',
    status: 'pending_approval',
    evidence: generateEvidenceIds(),
    posId: 'pos-005',
    posName: 'POS-01 Principal',
    storeId: 'store-003',
    storeName: 'Parque Arauco',
    actionId: 'FORCE_SYNC_KEYS',
    actionName: 'Forzar Sincronización de Claves',
    category: 'operational',
  },
  {
    id: 'evt-003',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    type: 'result',
    title: 'Acción bloqueada',
    description: 'BLOCKED: Transacciones pendientes de cierre detectadas',
    user: 'María González',
    status: 'blocked',
    evidence: generateEvidenceIds(),
    posId: 'pos-002',
    posName: 'POS-02 Caja Secundaria',
    storeId: 'store-001',
    storeName: 'Mall Plaza Vespucio',
    actionId: 'CLEAR_TRANSACTION_CACHE',
    actionName: 'Limpiar Caché de Transacciones',
    category: 'operational',
  },
  {
    id: 'evt-004',
    timestamp: new Date(Date.now() - 1750000).toISOString(),
    type: 'result',
    title: 'Acción completada',
    description: 'Servicio reiniciado correctamente. Tiempo: 45s',
    user: 'Carlos Mendoza',
    status: 'success',
    evidence: generateEvidenceIds(),
    posId: 'pos-003',
    posName: 'POS-03 Caja Express',
    storeId: 'store-002',
    storeName: 'Costanera Center',
    actionId: 'RESTART_TRANSBANK',
    actionName: 'Reiniciar Servicio Transbank',
    category: 'operational',
  },
  {
    id: 'evt-005',
    timestamp: new Date(Date.now() - 6900000).toISOString(),
    type: 'result',
    title: 'Acción fallida',
    description: 'FAILED: Timeout: POS no responde después de 120s',
    user: 'Carlos Mendoza',
    status: 'failed',
    evidence: generateEvidenceIds(),
    posId: 'pos-004',
    posName: 'POS-04 Caja Central',
    storeId: 'store-002',
    storeName: 'Costanera Center',
    actionId: 'RESTART_POS_AGENT',
    actionName: 'Reiniciar Agente POS',
    category: 'critical',
  },
  {
    id: 'evt-006',
    timestamp: new Date(Date.now() - 7100000).toISOString(),
    type: 'approval',
    title: 'Acción aprobada',
    description: 'Aprobado para ejecución en POS-04',
    user: 'Jefe TI',
    status: 'queued',
    evidence: generateEvidenceIds(),
    posId: 'pos-004',
    posName: 'POS-04 Caja Central',
    storeId: 'store-002',
    storeName: 'Costanera Center',
    actionId: 'RESTART_POS_AGENT',
    actionName: 'Reiniciar Agente POS',
    category: 'critical',
  },
];

// Mock POS context for preflight
export function getMockPOSContext(posId: string): POSContext {
  const posData: Record<string, POSContext> = {
    'pos-001': {
      posId: 'pos-001',
      posName: 'POS-01 Caja Principal',
      storeId: 'store-001',
      storeName: 'Mall Plaza Vespucio',
      status: 'online',
      lastHeartbeat: new Date(Date.now() - 30000).toISOString(),
      lastAction: {
        name: 'Reiniciar Llaves Directo',
        status: 'in_progress',
        timestamp: new Date(Date.now() - 60000).toISOString(),
      },
      services: [
        { name: 'Transbank', status: 'running' },
        { name: 'Llaves Directo', status: 'running' },
      ],
      preflightChecks: [
        { id: 'check-1', name: 'Sin venta activa', status: 'passed', required: true },
        { id: 'check-2', name: 'Última transacción > 2 min', status: 'passed', required: true },
        { id: 'check-3', name: 'Conexión estable', status: 'passed', required: false },
      ],
    },
    'pos-002': {
      posId: 'pos-002',
      posName: 'POS-02 Caja Secundaria',
      storeId: 'store-001',
      storeName: 'Mall Plaza Vespucio',
      status: 'online',
      lastHeartbeat: new Date(Date.now() - 45000).toISOString(),
      services: [
        { name: 'Transbank', status: 'running' },
        { name: 'Llaves Directo', status: 'running' },
      ],
      preflightChecks: [
        { id: 'check-1', name: 'Sin venta activa', status: 'failed', message: 'Venta en curso detectada', required: true },
        { id: 'check-2', name: 'Última transacción > 2 min', status: 'failed', message: 'Última transacción hace 30s', required: true },
      ],
    },
    'pos-003': {
      posId: 'pos-003',
      posName: 'POS-03 Caja Express',
      storeId: 'store-002',
      storeName: 'Costanera Center',
      status: 'warning',
      lastHeartbeat: new Date(Date.now() - 120000).toISOString(),
      lastAction: {
        name: 'Reiniciar Servicio Transbank',
        status: 'success',
        timestamp: new Date(Date.now() - 1750000).toISOString(),
      },
      services: [
        { name: 'Transbank', status: 'error' },
        { name: 'Llaves Directo', status: 'running' },
      ],
      preflightChecks: [
        { id: 'check-1', name: 'Sin venta activa', status: 'passed', required: true },
        { id: 'check-2', name: 'Última transacción > 2 min', status: 'passed', required: true },
        { id: 'check-3', name: 'Servicio Transbank activo', status: 'failed', message: 'Servicio en estado de error', required: false },
      ],
    },
    'pos-004': {
      posId: 'pos-004',
      posName: 'POS-04 Caja Central',
      storeId: 'store-002',
      storeName: 'Costanera Center',
      status: 'offline',
      lastHeartbeat: new Date(Date.now() - 600000).toISOString(),
      lastAction: {
        name: 'Reiniciar Agente POS',
        status: 'failed',
        timestamp: new Date(Date.now() - 6900000).toISOString(),
      },
      services: [
        { name: 'Transbank', status: 'unknown' },
        { name: 'Llaves Directo', status: 'unknown' },
      ],
      preflightChecks: [
        { id: 'check-1', name: 'POS conectado', status: 'failed', message: 'Sin heartbeat en últimos 10 minutos', required: true },
      ],
    },
    'pos-005': {
      posId: 'pos-005',
      posName: 'POS-01 Principal',
      storeId: 'store-003',
      storeName: 'Parque Arauco',
      status: 'online',
      lastHeartbeat: new Date(Date.now() - 15000).toISOString(),
      services: [
        { name: 'Transbank', status: 'running' },
        { name: 'Llaves Directo', status: 'running' },
      ],
      preflightChecks: [
        { id: 'check-1', name: 'Sin venta activa', status: 'passed', required: true },
        { id: 'check-2', name: 'Conexión a servidor central', status: 'passed', required: true },
        { id: 'check-3', name: 'Servicio Llaves Directo activo', status: 'passed', required: true },
      ],
    },
  };

  return posData[posId] || posData['pos-001'];
}

// Audit events with evidence (extended)
export interface AuditEventV2 {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  result: 'success' | 'failure';
  ipAddress: string;
  evidence: EvidenceIds;
  posId?: string;
  posName?: string;
  storeId?: string;
  storeName?: string;
  category?: ActionCategory;
  severity?: 'info' | 'warning' | 'error';
}

export const mockAuditEventsV2: AuditEventV2[] = [
  {
    id: 'audit-001',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    userId: 'user-001',
    userName: 'Carlos Mendoza',
    action: 'EXECUTE_ACTION',
    resource: 'action',
    resourceId: 'RESTART_LLAVES_DIRECTO',
    details: 'Ejecutó reinicio de Llaves Directo en POS-01 (Mall Plaza Vespucio)',
    result: 'success',
    ipAddress: '10.0.1.45',
    evidence: generateEvidenceIds(),
    posId: 'pos-001',
    posName: 'POS-01 Caja Principal',
    storeId: 'store-001',
    storeName: 'Mall Plaza Vespucio',
    category: 'diagnostic',
    severity: 'info',
  },
  {
    id: 'audit-002',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    userId: 'user-002',
    userName: 'María González',
    action: 'REQUEST_APPROVAL',
    resource: 'action',
    resourceId: 'FORCE_SYNC_KEYS',
    details: 'Solicitó aprobación para sincronización de claves en POS-01 Principal',
    result: 'success',
    ipAddress: '10.0.1.52',
    evidence: generateEvidenceIds(),
    posId: 'pos-005',
    posName: 'POS-01 Principal',
    storeId: 'store-003',
    storeName: 'Parque Arauco',
    category: 'operational',
    severity: 'warning',
  },
  {
    id: 'audit-003',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    userId: 'user-002',
    userName: 'María González',
    action: 'EXECUTE_ACTION',
    resource: 'action',
    resourceId: 'CLEAR_TRANSACTION_CACHE',
    details: 'Acción bloqueada - BLOCKED: Transacciones pendientes de cierre',
    result: 'failure',
    ipAddress: '10.0.1.52',
    evidence: generateEvidenceIds(),
    posId: 'pos-002',
    posName: 'POS-02 Caja Secundaria',
    storeId: 'store-001',
    storeName: 'Mall Plaza Vespucio',
    category: 'operational',
    severity: 'error',
  },
  {
    id: 'audit-004',
    timestamp: new Date(Date.now() - 1750000).toISOString(),
    userId: 'user-001',
    userName: 'Carlos Mendoza',
    action: 'EXECUTE_ACTION',
    resource: 'action',
    resourceId: 'RESTART_TRANSBANK',
    details: 'Ejecutó reinicio de Transbank en POS-03 (Costanera Center) - Exitoso',
    result: 'success',
    ipAddress: '10.0.1.45',
    evidence: generateEvidenceIds(),
    posId: 'pos-003',
    posName: 'POS-03 Caja Express',
    storeId: 'store-002',
    storeName: 'Costanera Center',
    category: 'operational',
    severity: 'info',
  },
  {
    id: 'audit-005',
    timestamp: new Date(Date.now() - 6900000).toISOString(),
    userId: 'user-001',
    userName: 'Carlos Mendoza',
    action: 'EXECUTE_ACTION',
    resource: 'action',
    resourceId: 'RESTART_POS_AGENT',
    details: 'Ejecutó reinicio de agente en POS-04 - FAILED: Timeout',
    result: 'failure',
    ipAddress: '10.0.1.45',
    evidence: generateEvidenceIds(),
    posId: 'pos-004',
    posName: 'POS-04 Caja Central',
    storeId: 'store-002',
    storeName: 'Costanera Center',
    category: 'critical',
    severity: 'error',
  },
  {
    id: 'audit-006',
    timestamp: new Date(Date.now() - 7100000).toISOString(),
    userId: 'user-003',
    userName: 'Jefe TI',
    action: 'APPROVE_ACTION',
    resource: 'action',
    resourceId: 'RESTART_POS_AGENT',
    details: 'Aprobó reinicio de agente para POS-04',
    result: 'success',
    ipAddress: '10.0.1.10',
    evidence: generateEvidenceIds(),
    posId: 'pos-004',
    posName: 'POS-04 Caja Central',
    storeId: 'store-002',
    storeName: 'Costanera Center',
    category: 'critical',
    severity: 'warning',
  },
];
