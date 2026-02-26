import { useState } from 'react';
import { Bell, Check, CheckCheck, ExternalLink, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  useNotifications, 
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification
} from '@/hooks/useNotificationsData';
import type { Notification, NotificationType } from '@/types/notifications';

const notificationTypeConfig: Record<NotificationType, { 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  approval_pending: { 
    color: 'text-[hsl(var(--status-warning))]', 
    bgColor: 'bg-[hsl(var(--status-warning))]',
    label: 'Aprobación' 
  },
  approval_decided: { 
    color: 'text-[hsl(var(--status-success))]', 
    bgColor: 'bg-[hsl(var(--status-success))]',
    label: 'Aprobado' 
  },
  action_completed: { 
    color: 'text-[hsl(var(--status-success))]', 
    bgColor: 'bg-[hsl(var(--status-success))]',
    label: 'Completado' 
  },
  action_failed: { 
    color: 'text-[hsl(var(--status-error))]', 
    bgColor: 'bg-[hsl(var(--status-error))]',
    label: 'Fallido' 
  },
  alert_critical: { 
    color: 'text-[hsl(var(--status-error))]', 
    bgColor: 'bg-[hsl(var(--status-error))]',
    label: 'Crítico' 
  },
  alert_warning: { 
    color: 'text-[hsl(var(--status-warning))]', 
    bgColor: 'bg-[hsl(var(--status-warning))]',
    label: 'Alerta' 
  },
  system_announcement: { 
    color: 'text-[hsl(var(--status-pending))]', 
    bgColor: 'bg-[hsl(var(--status-pending))]',
    label: 'Sistema' 
  },
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate?: (link: string) => void;
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  onNavigate 
}: NotificationItemProps) {
  const config = notificationTypeConfig[notification.type];
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { 
    addSuffix: true,
    locale: es 
  });

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.link && onNavigate) {
      onNavigate(notification.link);
    }
  };

  return (
    <div 
      className={cn(
        "group relative flex gap-3 p-3 hover:bg-accent/50 transition-colors cursor-pointer",
        !notification.read && "bg-accent/30"
      )}
      onClick={handleClick}
    >
      {/* Indicator dot */}
      <div className="flex-shrink-0 pt-1">
        <div className={cn("w-2 h-2 rounded-full", config.bgColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-medium truncate",
              !notification.read ? "text-foreground" : "text-muted-foreground"
            )}>
              {notification.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          </div>
          
          {/* Actions - visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notification.read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                title="Marcar como leída"
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              title="Eliminar"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1.5">
          <Badge 
            variant="outline" 
            className={cn("text-[10px] px-1.5 py-0", config.color)}
          >
            {config.label}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
          {notification.link && (
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
      )}
    </div>
  );
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id);
  };

  const handleNavigate = (link: string) => {
    setOpen(false);
    // In a real app, you would use router.push(link)
    window.location.href = link;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        align="end" 
        className="w-96 p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Marcar todas
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setOpen(false);
                  window.location.href = '/notifications';
                }}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
