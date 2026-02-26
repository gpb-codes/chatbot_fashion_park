/**
 * Mock Data for Governed Command Flow
 * Used in demo mode (VITE_USE_MOCK_DATA=true)
 */

import type { 
  ActionRequest, 
  CommandExecution, 
  ActionAuditLog,
  CommandMessage,
  ResultMessage,
  StatusMessage,
  CommandType
} from '@/types/commands';
import { PROTOCOL_VERSION, COMMAND_CATALOG, generateMessageId, generateCorrelationId } from '@/types/commands';

// ============= Action Requests (Pending Approvals) =============

export const mockActionRequests: ActionRequest[] = [
  {
    id: 'req-001',
    command: COMMAND_CATALOG.RESTART_SPDH,
    target: {
      pos_id: 'pos-003',
      store_id: 'store-002',
      environment: 'production',
    },
    requested_by: {
      user_id: 'user-001',
      user_name: 'Carlos Mendoza',
      role: 'operator',
    },
    requested_at: new Date(Date.now() - 600000).toISOString(), // 10 min ago
    approval_status: 'pending',
    priority: 'high',
    notes: 'POS reporta error en servicio SPDH desde hace 15 minutos',
    preconditions_met: true,
    precondition_details: ['Sin venta activa', 'Última transacción hace 8 minutos'],
  },
  {
    id: 'req-002',
    command: COMMAND_CATALOG.RESTART_POS_AGENT,
    target: {
      pos_id: 'pos-004',
      store_id: 'store-002',
      environment: 'production',
    },
    requested_by: {
      user_id: 'user-002',
      user_name: 'María González',
      role: 'operator',
    },
    requested_at: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    approval_status: 'pending',
    priority: 'critical',
    notes: 'POS no responde a heartbeats, se requiere reinicio de agente',
    preconditions_met: false,
    precondition_details: ['POS offline - no se puede verificar estado'],
  },
  {
    id: 'req-003',
    command: COMMAND_CATALOG.FORCE_SYNC_KEYS,
    target: {
      pos_id: 'pos-001',
      store_id: 'store-001',
      environment: 'production',
    },
    requested_by: {
      user_id: 'user-001',
      user_name: 'Carlos Mendoza',
      role: 'operator',
    },
    requested_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    approval_status: 'approved',
    approved_by: {
      user_id: 'user-003',
      user_name: 'Jefe TI',
      role: 'admin',
    },
    approved_at: new Date(Date.now() - 3500000).toISOString(),
    priority: 'normal',
    preconditions_met: true,
    precondition_details: ['Servicio Llaves Directo activo', 'Conexión a servidor central OK'],
  },
  {
    id: 'req-004',
    command: COMMAND_CATALOG.RESTART_TRANSBANK,
    target: {
      pos_id: 'pos-005',
      store_id: 'store-003',
      environment: 'production',
    },
    requested_by: {
      user_id: 'user-002',
      user_name: 'María González',
      role: 'operator',
    },
    requested_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    approval_status: 'rejected',
    approved_by: {
      user_id: 'user-003',
      user_name: 'Jefe TI',
      role: 'admin',
    },
    approved_at: new Date(Date.now() - 7000000).toISOString(),
    rejection_reason: 'Horario de cierre comercial, reprogramar para mañana',
    priority: 'low',
    preconditions_met: true,
  },
];

// ============= Command Executions =============

export const mockCommandExecutions: CommandExecution[] = [
  {
    id: 'exec-cmd-001',
    request_id: 'req-003',
    command_message: {
      protocol_version: PROTOCOL_VERSION,
      message_id: 'msg-uuid-001',
      correlation_id: 'corr-1234567890-abc123',
      message_type: 'COMMAND',
      command: COMMAND_CATALOG.FORCE_SYNC_KEYS,
      target: {
        pos_id: 'pos-001',
        store_id: 'store-001',
        environment: 'production',
      },
      issued_by: {
        user_id: 'user-001',
        user_name: 'Carlos Mendoza',
        role: 'operator',
      },
      issued_at: new Date(Date.now() - 3400000).toISOString(),
      security: { mtls_subject: 'CN=pos-001.store-001.fashionpark.cl' },
      payload: { key_type: 'all' },
    },
    result_message: {
      protocol_version: PROTOCOL_VERSION,
      message_id: 'msg-uuid-001-result',
      correlation_id: 'corr-1234567890-abc123',
      message_type: 'RESULT',
      command: COMMAND_CATALOG.FORCE_SYNC_KEYS,
      target: {
        pos_id: 'pos-001',
        store_id: 'store-001',
        environment: 'production',
      },
      status: 'SUCCESS',
      details: {
        execution_time_ms: 4523,
        service_state: 'running',
        agent_version: '2.4.1',
        trace_id: 'trace-abcdef123456',
      },
      started_at: new Date(Date.now() - 3400000).toISOString(),
      finished_at: new Date(Date.now() - 3395477).toISOString(),
    },
    status: 'completed',
    created_at: new Date(Date.now() - 3500000).toISOString(),
    sent_at: new Date(Date.now() - 3400000).toISOString(),
    acknowledged_at: new Date(Date.now() - 3399500).toISOString(),
    completed_at: new Date(Date.now() - 3395477).toISOString(),
    ttl_seconds: 120,
    retry_count: 0,
    max_retries: 3,
  },
  {
    id: 'exec-cmd-002',
    command_message: {
      protocol_version: PROTOCOL_VERSION,
      message_id: 'msg-uuid-002',
      correlation_id: 'corr-9876543210-def456',
      message_type: 'COMMAND',
      command: COMMAND_CATALOG.RESTART_TRANSBANK,
      target: {
        pos_id: 'pos-003',
        store_id: 'store-002',
        environment: 'production',
      },
      issued_by: {
        user_id: 'user-001',
        user_name: 'Carlos Mendoza',
        role: 'admin',
      },
      issued_at: new Date(Date.now() - 1800000).toISOString(),
      security: { mtls_subject: 'CN=pos-003.store-002.fashionpark.cl' },
      payload: { service_name: 'transbank', force: false, timeout_seconds: 60 },
    },
    result_message: {
      protocol_version: PROTOCOL_VERSION,
      message_id: 'msg-uuid-002-result',
      correlation_id: 'corr-9876543210-def456',
      message_type: 'RESULT',
      command: COMMAND_CATALOG.RESTART_TRANSBANK,
      target: {
        pos_id: 'pos-003',
        store_id: 'store-002',
        environment: 'production',
      },
      status: 'SUCCESS',
      details: {
        execution_time_ms: 45230,
        service_state: 'running',
        agent_version: '2.4.0',
        trace_id: 'trace-fedcba654321',
      },
      started_at: new Date(Date.now() - 1800000).toISOString(),
      finished_at: new Date(Date.now() - 1754770).toISOString(),
    },
    status: 'completed',
    created_at: new Date(Date.now() - 1810000).toISOString(),
    sent_at: new Date(Date.now() - 1800000).toISOString(),
    acknowledged_at: new Date(Date.now() - 1799000).toISOString(),
    completed_at: new Date(Date.now() - 1754770).toISOString(),
    ttl_seconds: 120,
    retry_count: 0,
    max_retries: 3,
  },
  {
    id: 'exec-cmd-003',
    command_message: {
      protocol_version: PROTOCOL_VERSION,
      message_id: 'msg-uuid-003',
      correlation_id: 'corr-5555555555-xyz789',
      message_type: 'COMMAND',
      command: COMMAND_CATALOG.RESTART_POS_AGENT,
      target: {
        pos_id: 'pos-004',
        store_id: 'store-002',
        environment: 'production',
      },
      issued_by: {
        user_id: 'user-001',
        user_name: 'Carlos Mendoza',
        role: 'admin',
      },
      issued_at: new Date(Date.now() - 7200000).toISOString(),
      security: { mtls_subject: 'CN=pos-004.store-002.fashionpark.cl' },
      payload: { force: true, timeout_seconds: 120 },
    },
    result_message: {
      protocol_version: PROTOCOL_VERSION,
      message_id: 'msg-uuid-003-result',
      correlation_id: 'corr-5555555555-xyz789',
      message_type: 'RESULT',
      command: COMMAND_CATALOG.RESTART_POS_AGENT,
      target: {
        pos_id: 'pos-004',
        store_id: 'store-002',
        environment: 'production',
      },
      status: 'FAILED',
      details: {
        error_code: 'TIMEOUT',
        error_message: 'POS no responde después de 120 segundos',
        agent_version: '2.3.9',
        trace_id: 'trace-error123456',
      },
      started_at: new Date(Date.now() - 7200000).toISOString(),
      finished_at: new Date(Date.now() - 7080000).toISOString(),
    },
    status: 'failed',
    created_at: new Date(Date.now() - 7210000).toISOString(),
    sent_at: new Date(Date.now() - 7200000).toISOString(),
    completed_at: new Date(Date.now() - 7080000).toISOString(),
    ttl_seconds: 120,
    retry_count: 1,
    max_retries: 3,
  },
  {
    id: 'exec-cmd-004',
    command_message: {
      protocol_version: PROTOCOL_VERSION,
      message_id: 'msg-uuid-004',
      correlation_id: 'corr-blocked-001',
      message_type: 'COMMAND',
      command: COMMAND_CATALOG.RESTART_SPDH,
      target: {
        pos_id: 'pos-002',
        store_id: 'store-001',
        environment: 'production',
      },
      issued_by: {
        user_id: 'user-002',
        user_name: 'María González',
        role: 'operator',
      },
      issued_at: new Date(Date.now() - 900000).toISOString(),
      security: { mtls_subject: 'CN=pos-002.store-001.fashionpark.cl' },
      payload: { force: false },
    },
    result_message: {
      protocol_version: PROTOCOL_VERSION,
      message_id: 'msg-uuid-004-result',
      correlation_id: 'corr-blocked-001',
      message_type: 'RESULT',
      command: COMMAND_CATALOG.RESTART_SPDH,
      target: {
        pos_id: 'pos-002',
        store_id: 'store-001',
        environment: 'production',
      },
      status: 'BLOCKED',
      details: {
        block_reason: 'Precondición no cumplida',
        precondition_failed: 'Venta activa detectada en POS',
        agent_version: '2.4.1',
        trace_id: 'trace-blocked789',
      },
      started_at: new Date(Date.now() - 900000).toISOString(),
      finished_at: new Date(Date.now() - 899500).toISOString(),
    },
    status: 'blocked',
    created_at: new Date(Date.now() - 910000).toISOString(),
    sent_at: new Date(Date.now() - 900000).toISOString(),
    acknowledged_at: new Date(Date.now() - 899800).toISOString(),
    completed_at: new Date(Date.now() - 899500).toISOString(),
    ttl_seconds: 120,
    retry_count: 0,
    max_retries: 3,
  },
];

// ============= Action Audit Logs =============

export const mockActionAuditLogs: ActionAuditLog[] = [
  {
    id: 'audit-001',
    action_id: 'req-001',
    message_id: '',
    correlation_id: '',
    user_id: 'user-001',
    user_name: 'Carlos Mendoza',
    user_role: 'operator',
    command: COMMAND_CATALOG.RESTART_SPDH,
    action_type: 'request',
    pos_id: 'pos-003',
    store_id: 'store-002',
    environment: 'production',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    status: 'pending',
    details: 'Solicitud de reinicio SPDH creada',
    ip_address: '10.0.1.45',
  },
  {
    id: 'audit-002',
    action_id: 'req-003',
    message_id: '',
    correlation_id: '',
    user_id: 'user-001',
    user_name: 'Carlos Mendoza',
    user_role: 'operator',
    command: COMMAND_CATALOG.FORCE_SYNC_KEYS,
    action_type: 'request',
    pos_id: 'pos-001',
    store_id: 'store-001',
    environment: 'production',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'pending',
    details: 'Solicitud de sincronización de claves creada',
    ip_address: '10.0.1.45',
  },
  {
    id: 'audit-003',
    action_id: 'req-003',
    message_id: '',
    correlation_id: '',
    user_id: 'user-003',
    user_name: 'Jefe TI',
    user_role: 'admin',
    command: COMMAND_CATALOG.FORCE_SYNC_KEYS,
    action_type: 'approve',
    pos_id: 'pos-001',
    store_id: 'store-001',
    environment: 'production',
    timestamp: new Date(Date.now() - 3500000).toISOString(),
    status: 'approved',
    details: 'Solicitud aprobada por administrador',
    ip_address: '10.0.1.10',
  },
  {
    id: 'audit-004',
    action_id: 'req-003',
    message_id: 'msg-uuid-001',
    correlation_id: 'corr-1234567890-abc123',
    user_id: 'user-001',
    user_name: 'Carlos Mendoza',
    user_role: 'operator',
    command: COMMAND_CATALOG.FORCE_SYNC_KEYS,
    action_type: 'execute',
    pos_id: 'pos-001',
    store_id: 'store-001',
    environment: 'production',
    timestamp: new Date(Date.now() - 3400000).toISOString(),
    status: 'pending',
    details: 'Comando enviado a RabbitMQ',
    trace_id: 'trace-abcdef123456',
    ip_address: '10.0.1.45',
  },
  {
    id: 'audit-005',
    action_id: 'req-003',
    message_id: 'msg-uuid-001',
    correlation_id: 'corr-1234567890-abc123',
    user_id: 'system',
    user_name: 'Sistema',
    user_role: 'admin',
    command: COMMAND_CATALOG.FORCE_SYNC_KEYS,
    action_type: 'complete',
    pos_id: 'pos-001',
    store_id: 'store-001',
    environment: 'production',
    timestamp: new Date(Date.now() - 3395477).toISOString(),
    status: 'SUCCESS',
    details: 'Sincronización completada en 4523ms',
    trace_id: 'trace-abcdef123456',
    otel_link: 'https://jaeger.fashionpark.cl/trace/trace-abcdef123456',
    ip_address: '192.168.1.101',
  },
  {
    id: 'audit-006',
    action_id: 'exec-cmd-002',
    message_id: 'msg-uuid-002',
    correlation_id: 'corr-9876543210-def456',
    user_id: 'user-001',
    user_name: 'Carlos Mendoza',
    user_role: 'admin',
    command: COMMAND_CATALOG.RESTART_TRANSBANK,
    action_type: 'execute',
    pos_id: 'pos-003',
    store_id: 'store-002',
    environment: 'production',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    status: 'pending',
    details: 'Comando auto-aprobado (acción de riesgo medio)',
    trace_id: 'trace-fedcba654321',
    ip_address: '10.0.1.45',
  },
  {
    id: 'audit-007',
    action_id: 'exec-cmd-002',
    message_id: 'msg-uuid-002',
    correlation_id: 'corr-9876543210-def456',
    user_id: 'system',
    user_name: 'Sistema',
    user_role: 'admin',
    command: COMMAND_CATALOG.RESTART_TRANSBANK,
    action_type: 'complete',
    pos_id: 'pos-003',
    store_id: 'store-002',
    environment: 'production',
    timestamp: new Date(Date.now() - 1754770).toISOString(),
    status: 'SUCCESS',
    details: 'Servicio Transbank reiniciado correctamente en 45.2s',
    trace_id: 'trace-fedcba654321',
    otel_link: 'https://jaeger.fashionpark.cl/trace/trace-fedcba654321',
    ip_address: '192.168.2.101',
  },
  {
    id: 'audit-008',
    action_id: 'exec-cmd-004',
    message_id: 'msg-uuid-004',
    correlation_id: 'corr-blocked-001',
    user_id: 'system',
    user_name: 'Sistema',
    user_role: 'admin',
    command: COMMAND_CATALOG.RESTART_SPDH,
    action_type: 'block',
    pos_id: 'pos-002',
    store_id: 'store-001',
    environment: 'production',
    timestamp: new Date(Date.now() - 899500).toISOString(),
    status: 'BLOCKED',
    details: 'Bloqueado: Venta activa detectada en POS',
    trace_id: 'trace-blocked789',
    ip_address: '192.168.1.102',
  },
];

// ============= Mock Status Messages =============

export const mockPOSStatuses: StatusMessage[] = [
  {
    protocol_version: PROTOCOL_VERSION,
    message_id: generateMessageId(),
    message_type: 'STATUS',
    pos_id: 'pos-001',
    store_id: 'store-001',
    environment: 'production',
    agent_version: '2.4.1',
    uptime_seconds: 345600, // 4 days
    last_command_at: new Date(Date.now() - 3395477).toISOString(),
    services: [
      { service_id: 'spdh', name: 'SPDH', status: 'running', pid: 1234, memory_mb: 128 },
      { service_id: 'transbank', name: 'Transbank', status: 'running', pid: 1235, memory_mb: 256 },
      { service_id: 'llaves', name: 'Llaves Directo', status: 'running', pid: 1236, memory_mb: 64 },
    ],
    system: {
      cpu_percent: 12.5,
      memory_percent: 45.2,
      disk_percent: 32.1,
      network_ok: true,
    },
    timestamp: new Date().toISOString(),
  },
  {
    protocol_version: PROTOCOL_VERSION,
    message_id: generateMessageId(),
    message_type: 'STATUS',
    pos_id: 'pos-003',
    store_id: 'store-002',
    environment: 'production',
    agent_version: '2.4.0',
    uptime_seconds: 86400, // 1 day
    last_command_at: new Date(Date.now() - 1754770).toISOString(),
    services: [
      { service_id: 'spdh', name: 'SPDH', status: 'running', pid: 2234, memory_mb: 130 },
      { service_id: 'transbank', name: 'Transbank', status: 'running', pid: 2235, memory_mb: 260, last_restart: new Date(Date.now() - 1754770).toISOString() },
      { service_id: 'llaves', name: 'Llaves Directo', status: 'running', pid: 2236, memory_mb: 65 },
    ],
    system: {
      cpu_percent: 28.3,
      memory_percent: 62.1,
      disk_percent: 45.8,
      network_ok: true,
    },
    timestamp: new Date().toISOString(),
  },
];

// ============= Helper Functions =============

export function getActionRequestsByStatus(status: ActionRequest['approval_status']): ActionRequest[] {
  return mockActionRequests.filter(r => r.approval_status === status);
}

export function getPendingApprovals(): ActionRequest[] {
  return getActionRequestsByStatus('pending');
}

export function getRecentExecutions(limit = 10): CommandExecution[] {
  return [...mockCommandExecutions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export function getAuditLogsByCorrelationId(correlationId: string): ActionAuditLog[] {
  return mockActionAuditLogs.filter(log => log.correlation_id === correlationId);
}
