import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'pending' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

const statusConfig = {
  online: { label: 'Online', colorClass: 'status-online' },
  offline: { label: 'Offline', colorClass: 'status-offline' },
  warning: { label: 'Advertencia', colorClass: 'status-warning' },
  pending: { label: 'Pendiente', colorClass: 'bg-status-pending' },
  success: { label: 'Éxito', colorClass: 'status-online' },
  error: { label: 'Error', colorClass: 'status-offline' },
};

const sizeClasses = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-3 h-3',
};

export function StatusIndicator({ 
  status, 
  size = 'md', 
  showLabel = false,
  label 
}: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "status-dot rounded-full",
        sizeClasses[size],
        config.colorClass
      )} />
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {label || config.label}
        </span>
      )}
    </div>
  );
}
