import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type NotificationPermission = 'default' | 'granted' | 'denied';

interface UseBrowserNotificationsOptions {
  /** Title prefix for notifications */
  appName?: string;
  /** Whether to show a toast when permission is denied */
  showToastOnDenied?: boolean;
}

interface UseBrowserNotificationsReturn {
  /** Current permission status */
  permission: NotificationPermission;
  /** Whether notifications are supported */
  isSupported: boolean;
  /** Whether permission has been granted */
  isGranted: boolean;
  /** Request permission from user */
  requestPermission: () => Promise<boolean>;
  /** Send a notification */
  sendNotification: (title: string, options?: NotificationOptions) => Notification | null;
}

/**
 * Hook for managing browser notifications (Web Notifications API)
 */
export function useBrowserNotifications(
  options: UseBrowserNotificationsOptions = {}
): UseBrowserNotificationsReturn {
  const { appName = 'POS Manager', showToastOnDenied = true } = options;
  
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  });

  const isSupported = typeof window !== 'undefined' && 'Notification' in window;
  const isGranted = permission === 'granted';

  // Update permission state when it changes
  useEffect(() => {
    if (!isSupported) return;
    
    const handleVisibilityChange = () => {
      // Check permission when tab becomes visible (user might have changed it in settings)
      if (document.visibilityState === 'visible') {
        setPermission(Notification.permission);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      if (showToastOnDenied) {
        toast.error('Tu navegador no soporta notificaciones');
      }
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notificaciones activadas');
        return true;
      } else if (result === 'denied' && showToastOnDenied) {
        toast.error('Notificaciones bloqueadas. Puedes habilitarlas en la configuración del navegador.');
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, permission, showToastOnDenied]);

  const sendNotification = useCallback((
    title: string, 
    options?: NotificationOptions
  ): Notification | null => {
    if (!isSupported || !isGranted) {
      return null;
    }

    try {
      const notification = new Notification(`${appName}: ${title}`, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, [isSupported, isGranted, appName]);

  return {
    permission,
    isSupported,
    isGranted,
    requestPermission,
    sendNotification,
  };
}

/**
 * Hook for monitoring critical alerts and sending browser notifications
 */
export function useCriticalAlertNotifications(
  alerts: Array<{ id: string; severity: string; title: string; message: string; createdAt: string }> | undefined,
  enabled: boolean = true
) {
  const { isGranted, sendNotification } = useBrowserNotifications();
  const seenAlertIds = useRef<Set<string>>(new Set());
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!enabled || !isGranted || !alerts) return;

    // On first load, just mark all existing alerts as seen (don't notify)
    if (!isInitialized.current) {
      alerts.forEach(alert => seenAlertIds.current.add(alert.id));
      isInitialized.current = true;
      return;
    }

    // Find new critical alerts
    const newCriticalAlerts = alerts.filter(
      alert => 
        alert.severity === 'critical' && 
        !seenAlertIds.current.has(alert.id)
    );

    // Send notification for each new critical alert
    newCriticalAlerts.forEach(alert => {
      sendNotification(alert.title, {
        body: alert.message,
        tag: alert.id, // Prevents duplicate notifications
        requireInteraction: true, // Keep notification visible until user interacts
      });
      seenAlertIds.current.add(alert.id);
    });
  }, [alerts, enabled, isGranted, sendNotification]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isInitialized.current = false;
    };
  }, []);
}
