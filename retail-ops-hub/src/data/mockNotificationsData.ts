import type { Notification, NotificationPreferences, NotificationsResponse } from '@/types/notifications';

export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'approval_pending',
    title: 'Acción pendiente de aprobación',
    message: 'FORCE_SYNC_KEYS en POS-04 requiere tu aprobación',
    read: false,
    createdAt: '2026-02-06T10:50:00Z',
    link: '/approvals',
    metadata: {
      executionId: 'exec-uuid-123',
    },
  },
  {
    id: 'notif-002',
    type: 'action_completed',
    title: 'Acción completada',
    message: 'RESTART_SPDH en POS-02 se completó exitosamente',
    read: false,
    createdAt: '2026-02-06T10:45:00Z',
    link: '/executions/exec-002',
    metadata: {
      executionId: 'exec-002',
      actionId: 'RESTART_SPDH',
    },
  },
  {
    id: 'notif-003',
    type: 'alert_critical',
    title: 'Alerta crítica',
    message: 'POS-04 sin conexión desde hace 5 minutos',
    read: false,
    createdAt: '2026-02-06T10:40:00Z',
    link: '/alerts/alert-001',
    metadata: {
      alertId: 'alert-001',
    },
  },
  {
    id: 'notif-004',
    type: 'action_failed',
    title: 'Acción fallida',
    message: 'RESTART_TRANSBANK en POS-03 falló: Timeout',
    read: true,
    createdAt: '2026-02-06T09:30:00Z',
    link: '/executions/exec-003',
    metadata: {
      executionId: 'exec-003',
      actionId: 'RESTART_TRANSBANK',
      errorCode: 'TIMEOUT',
    },
  },
  {
    id: 'notif-005',
    type: 'approval_decided',
    title: 'Solicitud aprobada',
    message: 'Tu solicitud de FORCE_SYNC_KEYS fue aprobada por Admin',
    read: true,
    createdAt: '2026-02-06T09:00:00Z',
    link: '/executions/exec-004',
    metadata: {
      executionId: 'exec-004',
      approvedBy: 'agarcia',
    },
  },
  {
    id: 'notif-006',
    type: 'system_announcement',
    title: 'Mantenimiento programado',
    message: 'El sistema estará en mantenimiento el 07/02 de 02:00 a 04:00',
    read: true,
    createdAt: '2026-02-05T16:00:00Z',
    link: undefined,
    metadata: {
      maintenanceStart: '2026-02-07T02:00:00Z',
      maintenanceEnd: '2026-02-07T04:00:00Z',
    },
  },
];

export const mockNotificationPreferences: NotificationPreferences = {
  email: {
    enabled: true,
    approvalPending: true,
    actionCompleted: true,
    actionFailed: true,
    alertCritical: true,
    dailyDigest: false,
  },
  push: {
    enabled: false,
  },
  inApp: {
    enabled: true,
    sound: false,
  },
};

export function getMockNotificationsResponse(filters?: {
  read?: boolean;
  type?: string;
  limit?: number;
}): NotificationsResponse {
  let result = [...mockNotifications];
  
  if (filters?.read !== undefined) {
    result = result.filter(n => n.read === filters.read);
  }
  if (filters?.type) {
    result = result.filter(n => n.type === filters.type);
  }
  
  const limit = filters?.limit || 50;
  result = result.slice(0, limit);
  
  const unreadCount = mockNotifications.filter(n => !n.read).length;
  
  return {
    data: result,
    pagination: {
      total: result.length,
      limit,
      offset: 0,
      hasMore: false,
    },
    unreadCount,
  };
}
