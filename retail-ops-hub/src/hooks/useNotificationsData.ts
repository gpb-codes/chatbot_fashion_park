import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiConfig } from '@/config/apiConfig';
import { notificationsService } from '@/services/notificationsService';
import { 
  mockNotifications, 
  mockNotificationPreferences, 
  getMockNotificationsResponse 
} from '@/data/mockNotificationsData';
import type { 
  Notification,
  NotificationsFilter,
  NotificationsResponse,
  NotificationPreferences 
} from '@/types/notifications';

const QUERY_KEY = 'notifications';
const PREFERENCES_KEY = 'notification-preferences';

/**
 * Hook for fetching notifications
 */
export function useNotifications(filters?: NotificationsFilter) {
  return useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: async (): Promise<NotificationsResponse> => {
      if (apiConfig.useMockData) {
        return getMockNotificationsResponse(filters);
      }
      return notificationsService.listNotifications(filters);
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook for fetching unread notifications only
 */
export function useUnreadNotifications() {
  return useNotifications({ read: false });
}

/**
 * Hook for getting unread count
 */
export function useUnreadCount() {
  const { data } = useNotifications();
  return data?.unreadCount ?? 0;
}

/**
 * Hook for marking a notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<Notification> => {
      if (apiConfig.useMockData) {
        const notification = mockNotifications.find(n => n.id === id);
        if (!notification) throw new Error('Notification not found');
        return { ...notification, read: true };
      }
      return notificationsService.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Hook for marking all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (apiConfig.useMockData) {
        const unreadCount = mockNotifications.filter(n => !n.read).length;
        return { markedAsRead: unreadCount };
      }
      return notificationsService.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Hook for deleting a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (apiConfig.useMockData) {
        return;
      }
      return notificationsService.deleteNotification(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Hook for fetching notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: [PREFERENCES_KEY],
    queryFn: async (): Promise<NotificationPreferences> => {
      if (apiConfig.useMockData) {
        return mockNotificationPreferences;
      }
      return notificationsService.getPreferences();
    },
  });
}

/**
 * Hook for updating notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      preferences: NotificationPreferences
    ): Promise<NotificationPreferences> => {
      if (apiConfig.useMockData) {
        return preferences;
      }
      return notificationsService.updatePreferences(preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PREFERENCES_KEY] });
    },
  });
}
