import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useActiveAlerts } from '@/hooks/useAlertsData';
import { useCriticalAlertNotifications } from '@/hooks/useBrowserNotifications';

interface AlertNotificationsContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const AlertNotificationsContext = createContext<AlertNotificationsContextType | null>(null);

const STORAGE_KEY = 'alert-notifications-enabled';

interface AlertNotificationsProviderProps {
  children: ReactNode;
}

export function AlertNotificationsProvider({ children }: AlertNotificationsProviderProps) {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    }
    return false;
  });

  // Persist preference
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, [enabled]);

  // Fetch active alerts for monitoring
  const { data: alertsData } = useActiveAlerts();
  const alerts = alertsData?.data;

  // Monitor for new critical alerts
  useCriticalAlertNotifications(alerts, enabled);

  return (
    <AlertNotificationsContext.Provider value={{ enabled, setEnabled }}>
      {children}
    </AlertNotificationsContext.Provider>
  );
}

export function useAlertNotifications() {
  const context = useContext(AlertNotificationsContext);
  if (!context) {
    throw new Error('useAlertNotifications must be used within AlertNotificationsProvider');
  }
  return context;
}
