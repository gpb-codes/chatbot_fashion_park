// User & Auth Types
export type UserRole = 'operator' | 'admin' | 'auditor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// POS & Store Types
export type POSStatus = 'online' | 'offline' | 'warning';
export type ServiceStatus = 'running' | 'stopped' | 'error' | 'unknown';

export interface Service {
  id: string;
  name: string;
  status: ServiceStatus;
  lastCheck: string;
}

export interface POS {
  id: string;
  name: string;
  storeId: string;
  status: POSStatus;
  lastHeartbeat: string;
  services: Service[];
  lastAction?: ActionExecution;
  ipAddress: string;
  agentVersion: string;
}

export interface Store {
  id: string;
  name: string;
  regionId: string;
  code: string;
  address: string;
  posCount: number;
  onlineCount: number;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  storeCount: number;
}

// Action Types
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ActionStatus = 'pending' | 'in_progress' | 'success' | 'failed' | 'cancelled';

export interface Action {
  id: string;
  actionId: string; // The immutable action_id
  name: string;
  description: string;
  service: string;
  riskLevel: RiskLevel;
  preconditions: string[];
  requiresApproval: boolean;
  cooldownMinutes: number;
  estimatedDuration: string;
}

export interface ActionExecution {
  id: string;
  actionId: string;
  posId: string;
  status: ActionStatus;
  executedBy: string;
  executedAt: string;
  completedAt?: string;
  result?: string;
  errorMessage?: string;
  approvedBy?: string;
}

// Incident Types
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  posId?: string;
  serviceId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  relatedActions: string[];
}

// Audit Types
export interface AuditLog {
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
}

// Dashboard Metrics
export interface DashboardMetrics {
  totalPOS: number;
  onlinePOS: number;
  offlinePOS: number;
  criticalServices: number;
  activeAlerts: number;
  actionsToday: number;
  mttrMinutes: number;
  successRate: number;
}
