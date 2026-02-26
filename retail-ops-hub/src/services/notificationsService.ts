import { httpClient } from '@/lib/httpClient';
import type { 
  Notification,
  NotificationsFilter,
  NotificationsResponse,
  MarkReadAllResponse,
  NotificationPreferences
} from '@/types/notifications';

const API_PREFIX = '/api';

/**
 * Notifications Service
 * Handles all notification-related API operations.
 */
export const notificationsService = {
  /**
   * List notifications for the authenticated user
   */
  async listNotifications(filters?: NotificationsFilter): Promise<NotificationsResponse> {
    const params = new URLSearchParams();
    
    if (filters?.read !== undefined) params.append('read', filters.read.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const path = queryString 
      ? `${API_PREFIX}/notifications?${queryString}` 
      : `${API_PREFIX}/notifications`;
    
    return httpClient.get<NotificationsResponse>(path);
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    return httpClient.post<Notification>(
      `${API_PREFIX}/notifications/${id}/read`
    );
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<MarkReadAllResponse> {
    return httpClient.post<MarkReadAllResponse>(
      `${API_PREFIX}/notifications/read-all`
    );
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    return httpClient.delete<void>(`${API_PREFIX}/notifications/${id}`);
  },

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    return httpClient.get<NotificationPreferences>(
      `${API_PREFIX}/notifications/preferences`
    );
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> {
    return httpClient.put<NotificationPreferences>(
      `${API_PREFIX}/notifications/preferences`,
      preferences
    );
  },
};
