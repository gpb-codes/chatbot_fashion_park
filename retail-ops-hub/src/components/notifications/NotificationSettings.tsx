import { useState } from 'react';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, BellRing, Settings } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface NotificationSettingsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  className?: string;
}

export function NotificationSettings({ 
  enabled, 
  onEnabledChange,
  className 
}: NotificationSettingsProps) {
  const { permission, isSupported, isGranted, requestPermission } = useBrowserNotifications();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    const granted = await requestPermission();
    if (granted) {
      onEnabledChange(true);
    }
    setIsRequesting(false);
  };

  const handleToggle = (checked: boolean) => {
    if (checked && !isGranted) {
      handleRequestPermission();
    } else {
      onEnabledChange(checked);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={cn('relative', className)}
          aria-label="Configuración de notificaciones"
        >
          {enabled && isGranted ? (
            <BellRing className="h-5 w-5" />
          ) : permission === 'denied' ? (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {enabled && isGranted && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-status-success rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">Notificaciones</h4>
          </div>

          {permission === 'denied' ? (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Las notificaciones están bloqueadas.</p>
              <p className="text-xs">
                Para habilitarlas, haz clic en el ícono del candado en la barra de direcciones 
                y permite las notificaciones.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="critical-alerts" className="text-sm cursor-pointer">
                  Alertas críticas
                </Label>
                <Switch
                  id="critical-alerts"
                  checked={enabled && isGranted}
                  onCheckedChange={handleToggle}
                  disabled={isRequesting}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Recibe notificaciones del navegador cuando se detecte una alerta crítica nueva.
              </p>
            </>
          )}

          {!isGranted && permission !== 'denied' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={handleRequestPermission}
              disabled={isRequesting}
            >
              {isRequesting ? 'Solicitando...' : 'Habilitar notificaciones'}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
