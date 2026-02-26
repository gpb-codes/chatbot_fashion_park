/**
 * Hooks Index
 * Re-exports all data hooks for convenient importing.
 */

export { usePolling } from './usePolling';
export { usePOSPolling, useMetricsPolling, useExecutionsPolling, useIncidentsPolling } from './usePOSData';
export { useStoresData } from './useStoresData';
export { useActionsData } from './useActionsData';
export { useAuditData } from './useAuditData';
export { useExecuteAction } from './useExecuteAction';
export { useObservabilityData } from './useObservabilityData';
export { useIsMobile } from './use-mobile';
export { useToast, toast } from './use-toast';

// Alerts hooks
export { 
  useAlerts, 
  useActiveAlerts, 
  useAlertDetail, 
  useAcknowledgeAlert,
  useResolveAlert,
  useBulkAcknowledgeAlerts,
  useDeleteAlert,
  useAlertCounts
} from './useAlertsData';

// Notifications hooks
export { 
  useNotifications, 
  useUnreadNotifications,
  useUnreadCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useNotificationPreferences,
  useUpdateNotificationPreferences
} from './useNotificationsData';

// Executions hooks
export {
  useExecutions,
  useExecution,
  useMyExecutions,
  usePendingApprovals,
  useCreateExecution,
  useRetryExecution,
  useCancelExecution,
  useEscalateToIncident,
  useApproveExecution,
  useRejectExecution
} from './useExecutionsData';

// Browser notifications hooks
export {
  useBrowserNotifications,
  useCriticalAlertNotifications
} from './useBrowserNotifications';
