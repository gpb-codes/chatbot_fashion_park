import { Database, Search, Settings, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiConfig } from '@/config/apiConfig';
import { ThemeSwitch } from './ThemeSwitch';
import { NotificationCenter } from './NotificationCenter';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { useAlertNotifications } from '@/contexts/AlertNotificationsContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { enabled, setEnabled } = useAlertNotifications();

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Switch */}
        <ThemeSwitch />

        {/* Data Mode Indicator */}
        {apiConfig.useMockData ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--mode-demo)/0.1)] border border-[hsl(var(--mode-demo)/0.3)]">
            <TestTube className="w-4 h-4 text-[hsl(var(--mode-demo))]" aria-hidden="true" />
            <span className="text-xs font-medium text-[hsl(var(--mode-demo))]">Demo</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--mode-api)/0.1)] border border-[hsl(var(--mode-api)/0.3)]">
            <Database className="w-4 h-4 text-[hsl(var(--mode-api))]" aria-hidden="true" />
            <span className="text-xs font-medium text-[hsl(var(--mode-api))]">API</span>
          </div>
        )}

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input 
            placeholder="Buscar POS, tienda, acción..." 
            className="w-64 pl-9 bg-secondary/50 border-border"
            aria-label="Buscar en el sistema"
          />
        </div>

        {/* Browser Notifications Settings */}
        <NotificationSettings 
          enabled={enabled} 
          onEnabledChange={setEnabled} 
        />

        {/* In-app Notifications */}
        <NotificationCenter />

        {/* Settings */}
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
