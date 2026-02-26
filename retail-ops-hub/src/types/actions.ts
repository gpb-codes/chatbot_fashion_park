// Action Risk Categories (Operational Hierarchy)
export type ActionCategory = 'observation' | 'diagnostic' | 'operational' | 'critical';

// Action Lifecycle States
export type ActionLifecycleStatus = 
  | 'draft'
  | 'pending_approval'
  | 'queued'
  | 'in_progress'
  | 'success'
  | 'failed'
  | 'blocked'
  | 'cancelled';

// Evidence IDs for OpenTelemetry integration
export interface EvidenceIds {
  messageId: string;
  correlationId: string;
  traceId?: string;
  spanId?: string;
}

// Action Phase for progress tracking
export interface ActionPhase {
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  timestamp?: string;
  message?: string;
}

// Enhanced Action Execution with full lifecycle
export interface ActionExecutionV2 {
  id: string;
  actionId: string;
  actionName: string;
  posId: string;
  posName: string;
  storeId: string;
  storeName: string;
  status: ActionLifecycleStatus;
  category: ActionCategory;
  phases: ActionPhase[];
  evidence: EvidenceIds;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  startedAt?: string;
  completedAt?: string;
  result?: string;
  errorMessage?: string;
  blockReason?: string;
  // For retry/escalation
  retryCount?: number;
  maxRetries?: number;
  parentExecutionId?: string;
}

// Preflight Check
export interface PreflightCheck {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'unknown' | 'pending';
  message?: string;
  required: boolean;
}

// POS Context for Preflight Summary
export interface POSContext {
  posId: string;
  posName: string;
  storeId: string;
  storeName: string;
  status: 'online' | 'offline' | 'warning';
  lastHeartbeat: string;
  lastAction?: {
    name: string;
    status: ActionLifecycleStatus;
    timestamp: string;
  };
  services: {
    name: string;
    status: 'running' | 'stopped' | 'error' | 'unknown';
  }[];
  preflightChecks: PreflightCheck[];
}

// Action Category Configuration
export const ACTION_CATEGORY_CONFIG: Record<ActionCategory, {
  label: string;
  description: string;
  icon: string;
  requiresConfirmation: boolean;
  requiresReason: boolean;
  requiresTextConfirmation: boolean;
  colorClass: string;
}> = {
  observation: {
    label: 'Observación',
    description: 'Lectura de estado sin impacto operacional',
    icon: 'Eye',
    requiresConfirmation: false,
    requiresReason: false,
    requiresTextConfirmation: false,
    colorClass: 'action-observation',
  },
  diagnostic: {
    label: 'Diagnóstico',
    description: 'Análisis y recolección de información',
    icon: 'Search',
    requiresConfirmation: false,
    requiresReason: false,
    requiresTextConfirmation: false,
    colorClass: 'action-diagnostic',
  },
  operational: {
    label: 'Operacional',
    description: 'Acción con impacto moderado en servicio',
    icon: 'Settings',
    requiresConfirmation: true,
    requiresReason: false,
    requiresTextConfirmation: false,
    colorClass: 'action-operational',
  },
  critical: {
    label: 'Crítica',
    description: 'Alto riesgo, requiere confirmación reforzada',
    icon: 'AlertTriangle',
    requiresConfirmation: true,
    requiresReason: true,
    requiresTextConfirmation: true,
    colorClass: 'action-critical',
  },
};

// Status Configuration
export const ACTION_STATUS_CONFIG: Record<ActionLifecycleStatus, {
  label: string;
  description: string;
  colorClass: string;
  icon: string;
}> = {
  draft: {
    label: 'Borrador',
    description: 'Solicitud en preparación',
    colorClass: 'status-draft',
    icon: 'FileEdit',
  },
  pending_approval: {
    label: 'Pendiente Aprobación',
    description: 'Esperando autorización de supervisor',
    colorClass: 'status-pending',
    icon: 'Clock',
  },
  queued: {
    label: 'En Cola',
    description: 'Solicitud creada. Esperando ejecución en POS.',
    colorClass: 'status-queued',
    icon: 'ListOrdered',
  },
  in_progress: {
    label: 'En Progreso',
    description: 'Acción siendo ejecutada en el POS',
    colorClass: 'status-progress',
    icon: 'Loader',
  },
  success: {
    label: 'Exitoso',
    description: 'Acción completada correctamente',
    colorClass: 'status-success',
    icon: 'CheckCircle2',
  },
  failed: {
    label: 'Fallido',
    description: 'La acción no pudo completarse',
    colorClass: 'status-failed',
    icon: 'XCircle',
  },
  blocked: {
    label: 'Bloqueado',
    description: 'Precondición no cumplida',
    colorClass: 'status-blocked',
    icon: 'Ban',
  },
  cancelled: {
    label: 'Cancelado',
    description: 'Acción cancelada por usuario',
    colorClass: 'status-cancelled',
    icon: 'XCircle',
  },
};

// Timeline Event
export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'request' | 'approval' | 'execution' | 'result' | 'system';
  title: string;
  description?: string;
  user?: string;
  status?: ActionLifecycleStatus;
  evidence?: EvidenceIds;
  posId?: string;
  posName?: string;
  storeId?: string;
  storeName?: string;
  actionId?: string;
  actionName?: string;
  category?: ActionCategory;
}

// Map risk level to category
export function riskLevelToCategory(riskLevel: 'low' | 'medium' | 'high' | 'critical'): ActionCategory {
  switch (riskLevel) {
    case 'low':
      return 'observation';
    case 'medium':
      return 'diagnostic';
    case 'high':
      return 'operational';
    case 'critical':
      return 'critical';
    default:
      return 'observation';
  }
}
