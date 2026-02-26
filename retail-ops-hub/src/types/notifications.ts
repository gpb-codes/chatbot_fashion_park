/**
 * Notification Types
 * Based on API.md specification
 */

export type NotificationType = 
  | 'approval_pending'
  | 'approval_decided'
  | 'action_completed'
  | 'action_failed'
  | 'alert_critical'
  | 'alert_warning'
  | 'system_announcement';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationsFilter {
  read?: boolean;
  type?: NotificationType;
  limit?: number;
}

export interface NotificationsResponse {
  data: Notification[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  unreadCount: number;
}

export interface MarkReadAllResponse {
  markedAsRead: number;
}

export interface EmailPreferences {
  enabled: boolean;
  approvalPending: boolean;
  actionCompleted: boolean;
  actionFailed: boolean;
  alertCritical: boolean;
  dailyDigest: boolean;
}

export interface PushPreferences {
  enabled: boolean;
}

export interface InAppPreferences {
  enabled: boolean;
  sound: boolean;
}

export interface NotificationPreferences {
  email: EmailPreferences;
  push: PushPreferences;
  inApp: InAppPreferences;
}
