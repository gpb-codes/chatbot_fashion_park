/**
 * Alert Types
 * Based on API.md specification
 */

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type AlertType = 
  | 'pos_offline' 
  | 'service_down' 
  | 'heartbeat_missing' 
  | 'execution_failed'
  | 'cooldown_active'
  | 'high_error_rate'
  | 'agent_outdated';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  posId?: string;
  posName?: string;
  storeId?: string;
  storeName?: string;
  createdAt: string;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  autoResolvable: boolean;
  relatedExecutionId?: string | null;
}

export interface AlertHistoryEvent {
  timestamp: string;
  event: 'created' | 'acknowledged' | 'resolved' | 'escalated';
  details: string;
  userId?: string;
  userName?: string;
}

export interface SuggestedAction {
  actionId: string;
  name: string;
  reason: string;
}

export interface AlertDetail extends Alert {
  history: AlertHistoryEvent[];
  suggestedActions: SuggestedAction[];
  relatedAlerts: Alert[];
}

// Request/Response types
export interface AlertsFilter {
  status?: AlertStatus;
  severity?: AlertSeverity;
  posId?: string;
  storeId?: string;
  type?: AlertType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AcknowledgeAlertRequest {
  notes?: string;
}

export interface ResolveAlertRequest {
  resolution: string;
  preventive?: string;
}

export interface BulkAcknowledgeRequest {
  alertIds: string[];
  notes?: string;
}

export interface BulkOperationResponse {
  processed: number;
  failed: number;
}
