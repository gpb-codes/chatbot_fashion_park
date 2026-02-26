/**
 * Execution Types
 * Based on API.md specification for action executions
 */

export type ActionCategory = 'observation' | 'diagnostic' | 'operational' | 'critical';

export type ActionLifecycleStatus = 
  | 'draft'
  | 'pending_approval'
  | 'queued'
  | 'sent'
  | 'in_progress'
  | 'success'
  | 'failed'
  | 'blocked'
  | 'cancelled'
  | 'expired';

export type ExecutionPriority = 'normal' | 'high' | 'urgent';

export type PhaseStatus = 'pending' | 'current' | 'completed' | 'failed' | 'skipped';

/**
 * Evidence IDs for end-to-end traceability
 */
export interface EvidenceIds {
  messageId: string;
  correlationId: string;
  traceId?: string;
  spanId?: string;
}

/**
 * Execution phase in the lifecycle
 */
export interface ExecutionPhase {
  name: string;
  status: PhaseStatus;
  timestamp?: string;
  message?: string;
  duration?: number; // ms
}

/**
 * Request to create a new execution
 */
export interface CreateExecutionRequest {
  actionId: string;
  posId: string;
  requestedBy: string;
  reason?: string;
  priority?: ExecutionPriority;
  metadata?: Record<string, unknown>;
}

/**
 * Retry execution request
 */
export interface RetryExecutionRequest {
  reason?: string;
}

/**
 * Cancel execution request
 */
export interface CancelExecutionRequest {
  reason: string;
}

/**
 * Escalate to incident request
 */
export interface EscalateExecutionRequest {
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  assignTo?: string;
}

/**
 * Action Execution V2 - Full lifecycle tracking
 */
export interface ActionExecutionV2 {
  id: string;
  actionId: string;
  actionName: string;
  posId: string;
  posName: string;
  storeId: string;
  storeName: string;
  category: ActionCategory;
  status: ActionLifecycleStatus;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  startedAt?: string;
  completedAt?: string;
  reason?: string;
  result?: string;
  errorMessage?: string;
  blockReason?: string;
  retryCount?: number;
  maxRetries?: number;
  evidence: EvidenceIds;
  phases: ExecutionPhase[];
}

/**
 * Execution with client-side traceability
 */
export interface TracedExecution {
  execution: ActionExecutionV2;
  traceability: {
    requestId: string;
    traceId?: string;
    correlationId?: string;
  };
}

/**
 * Filters for listing executions
 */
export interface ExecutionsFilter {
  status?: ActionLifecycleStatus;
  posId?: string;
  storeId?: string;
  actionId?: string;
  requestedBy?: string;
  category?: ActionCategory;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sort?: 'asc' | 'desc';
}

/**
 * Simple success response
 */
export interface SuccessResponse {
  success: boolean;
  message: string;
}
