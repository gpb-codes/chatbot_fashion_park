/**
 * Command Protocol Types
 * Contracts for the governed automation platform
 * Protocol Version: 1.0
 */

// ============= Enums & Constants =============

export const PROTOCOL_VERSION = '1.0' as const;

/**
 * Closed Catalog of Commands
 * The agent ONLY accepts commands explicitly defined here.
 * Any unknown command must be rejected.
 */
export const COMMAND_CATALOG = {
  RESTART_SPDH: 'RESTART_SPDH',
  RESTART_TRANSBANK: 'RESTART_TRANSBANK',
  RESTART_LLAVES_DIRECTO: 'RESTART_LLAVES_DIRECTO',
  FORCE_SYNC_KEYS: 'FORCE_SYNC_KEYS',
  CLEAR_TRANSACTION_CACHE: 'CLEAR_TRANSACTION_CACHE',
  RESTART_POS_AGENT: 'RESTART_POS_AGENT',
  UPDATE_AGENT_CONFIG: 'UPDATE_AGENT_CONFIG',
} as const;

export type CommandType = typeof COMMAND_CATALOG[keyof typeof COMMAND_CATALOG];

export type MessageType = 'COMMAND' | 'RESULT' | 'STATUS' | 'TELEMETRY';

export type CommandStatus = 'SUCCESS' | 'FAILED' | 'BLOCKED';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'auto_approved';

export type Environment = 'lab' | 'staging' | 'production';

// ============= Base Types =============

export interface Target {
  pos_id: string;
  store_id: string;
  environment: Environment;
}

export interface IssuedBy {
  user_id: string;
  user_name: string;
  role: 'operator' | 'admin' | 'auditor';
}

export interface Security {
  mtls_subject: string; // CN from client certificate
}

// ============= Message Contracts =============

/**
 * COMMAND Message (Control Plane -> POS Agent)
 * Sent via RabbitMQ to ex.commands with routing key: pos.<pos_id>.command
 */
export interface CommandMessage {
  protocol_version: typeof PROTOCOL_VERSION;
  message_id: string; // UUID - for idempotency
  correlation_id: string; // End-to-end tracing
  message_type: 'COMMAND';
  command: CommandType;
  target: Target;
  issued_by: IssuedBy;
  issued_at: string; // ISO 8601 timestamp
  expires_at?: string; // Optional TTL
  security: Security;
  payload: CommandPayload;
}

/**
 * Command-specific payloads
 */
export interface RestartSpdhPayload {
  force?: boolean;
  timeout_seconds?: number;
}

export interface RestartServicePayload {
  service_name: string;
  force?: boolean;
  timeout_seconds?: number;
}

export interface SyncKeysPayload {
  key_type?: 'all' | 'transactional' | 'configuration';
}

export interface UpdateConfigPayload {
  config_version: string;
  config_hash: string;
}

export type CommandPayload = 
  | RestartSpdhPayload 
  | RestartServicePayload 
  | SyncKeysPayload 
  | UpdateConfigPayload
  | Record<string, unknown>;

/**
 * RESULT Message (POS Agent -> Control Plane)
 * Sent via RabbitMQ to ex.results with routing key: pos.<pos_id>.result
 */
export interface ResultMessage {
  protocol_version: typeof PROTOCOL_VERSION;
  message_id: string;
  correlation_id: string;
  message_type: 'RESULT';
  command: CommandType;
  target: Target;
  status: CommandStatus;
  details: ResultDetails;
  started_at: string;
  finished_at: string;
}

export interface ResultDetails {
  // Success details
  execution_time_ms?: number;
  service_state?: 'running' | 'stopped';
  
  // Failure details
  error_code?: string;
  error_message?: string;
  stack_trace?: string;
  
  // Blocked details
  block_reason?: string;
  precondition_failed?: string;
  
  // Audit trail
  agent_version?: string;
  trace_id?: string;
}

/**
 * STATUS Message (POS Agent -> Control Plane)
 * Heartbeat sent periodically to ex.status
 */
export interface StatusMessage {
  protocol_version: typeof PROTOCOL_VERSION;
  message_id: string;
  message_type: 'STATUS';
  pos_id: string;
  store_id: string;
  environment: Environment;
  agent_version: string;
  uptime_seconds: number;
  last_command_at?: string;
  services: ServiceState[];
  system: SystemState;
  timestamp: string;
}

export interface ServiceState {
  service_id: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'unknown';
  pid?: number;
  memory_mb?: number;
  last_restart?: string;
}

export interface SystemState {
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  network_ok: boolean;
}

/**
 * TELEMETRY Message (POS Agent -> Observability)
 * Metrics and events for OpenTelemetry
 */
export interface TelemetryMessage {
  protocol_version: typeof PROTOCOL_VERSION;
  message_id: string;
  message_type: 'TELEMETRY';
  pos_id: string;
  timestamp: string;
  metrics: TelemetryMetrics;
  spans?: TelemetrySpan[];
}

export interface TelemetryMetrics {
  restart_latency_ms?: number;
  commands_success_total?: number;
  commands_failed_total?: number;
  commands_blocked_total?: number;
  heartbeat_interval_ms?: number;
}

export interface TelemetrySpan {
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  operation_name: string;
  start_time: string;
  end_time: string;
  status: 'ok' | 'error';
  attributes: Record<string, string | number | boolean>;
}

// ============= Approval Flow Types =============

/**
 * Action Request - UI representation of a pending action
 */
export interface ActionRequest {
  id: string;
  command: CommandType;
  target: Target;
  requested_by: IssuedBy;
  requested_at: string;
  approval_status: ApprovalStatus;
  approved_by?: IssuedBy;
  approved_at?: string;
  rejection_reason?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  notes?: string;
  preconditions_met: boolean;
  precondition_details?: string[];
}

/**
 * Command Execution - Full lifecycle tracking
 */
export interface CommandExecution {
  id: string;
  request_id?: string; // Links to ActionRequest if approval was needed
  command_message: CommandMessage;
  result_message?: ResultMessage;
  status: 'pending' | 'sent' | 'acknowledged' | 'executing' | 'completed' | 'failed' | 'blocked' | 'expired';
  created_at: string;
  sent_at?: string;
  acknowledged_at?: string;
  completed_at?: string;
  ttl_seconds: number;
  retry_count: number;
  max_retries: number;
}

// ============= Audit Types =============

/**
 * Action Audit Log - Immutable evidence record
 */
export interface ActionAuditLog {
  id: string;
  action_id: string;
  message_id: string;
  correlation_id: string;
  // Who
  user_id: string;
  user_name: string;
  user_role: string;
  // What
  command: CommandType;
  action_type: 'request' | 'approve' | 'reject' | 'execute' | 'complete' | 'fail' | 'block';
  // Where
  pos_id: string;
  store_id: string;
  environment: Environment;
  // When
  timestamp: string;
  // Result
  status: CommandStatus | ApprovalStatus | 'pending';
  details: string;
  // Evidence
  trace_id?: string;
  otel_link?: string;
  ip_address: string;
}

// ============= RabbitMQ Topology Types =============

export interface QueueConfig {
  name: string;
  durable: boolean;
  exclusive: boolean;
  auto_delete: boolean;
  ttl_ms?: number;
  dlq?: string;
}

export interface ExchangeConfig {
  name: string;
  type: 'topic' | 'direct' | 'fanout';
  durable: boolean;
}

export interface BindingConfig {
  exchange: string;
  queue: string;
  routing_key: string;
}

/**
 * RabbitMQ Topology Definition
 */
export const RABBITMQ_TOPOLOGY = {
  vhosts: {
    lab: '/lab-pos',
    staging: '/staging-pos',
    production: '/prod-pos',
  },
  exchanges: {
    commands: { name: 'ex.commands', type: 'topic' as const, durable: true },
    results: { name: 'ex.results', type: 'topic' as const, durable: true },
    status: { name: 'ex.status', type: 'topic' as const, durable: true },
    telemetry: { name: 'ex.telemetry', type: 'topic' as const, durable: true },
  },
  routing_keys: {
    command: (posId: string) => `pos.${posId}.command`,
    result: (posId: string) => `pos.${posId}.result`,
    status: (posId: string) => `pos.${posId}.status`,
    telemetry: (posId: string) => `pos.${posId}.telemetry`,
  },
  queues: {
    commands: (posId: string) => `q.pos.${posId}.commands`,
    commands_dlq: (posId: string) => `q.pos.${posId}.commands.dlq`,
    results: 'q.results',
    status: 'q.status',
    telemetry: 'q.telemetry',
  },
  ttl_ms: {
    commands: 120000, // 2 minutes
    results: 3600000, // 1 hour
    status: 300000, // 5 minutes
  },
} as const;

// ============= Helper Functions =============

/**
 * Check if a command is in the closed catalog
 */
export function isValidCommand(command: string): command is CommandType {
  return Object.values(COMMAND_CATALOG).includes(command as CommandType);
}

/**
 * Generate a new message ID (UUID v4)
 */
export function generateMessageId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a correlation ID for end-to-end tracing
 */
export function generateCorrelationId(): string {
  return `corr-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;
}

/**
 * Build a command message
 */
export function buildCommandMessage(
  command: CommandType,
  target: Target,
  issuedBy: IssuedBy,
  payload: CommandPayload = {},
  mtlsSubject = 'CN=control-plane.fashionpark.cl'
): CommandMessage {
  return {
    protocol_version: PROTOCOL_VERSION,
    message_id: generateMessageId(),
    correlation_id: generateCorrelationId(),
    message_type: 'COMMAND',
    command,
    target,
    issued_by: issuedBy,
    issued_at: new Date().toISOString(),
    security: { mtls_subject: mtlsSubject },
    payload,
  };
}
