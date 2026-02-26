import { cn } from '@/lib/utils';
import type { ActionLifecycleStatus } from '@/types/actions';
import { ACTION_STATUS_CONFIG } from '@/types/actions';
import { 
  FileEdit, 
  Clock, 
  ListOrdered, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Ban 
} from 'lucide-react';

interface StatusPillProps {
  status: ActionLifecycleStatus;
  showLabel?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileEdit,
  Clock,
  ListOrdered,
  Loader: Loader2,
  CheckCircle2,
  XCircle,
  Ban,
};

export function StatusPill({ 
  status, 
  showLabel = true, 
  showIcon = true,
  size = 'md',
  className 
}: StatusPillProps) {
  const config = ACTION_STATUS_CONFIG[status];
  const Icon = iconMap[config.icon];

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-medium border',
        config.colorClass,
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={`Estado: ${config.label}`}
    >
      {showIcon && Icon && (
        <Icon className={cn(
          iconSizes[size],
          status === 'in_progress' && 'animate-spin'
        )} />
      )}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

// Accessible tooltip wrapper
export function StatusPillWithTooltip({ status, ...props }: StatusPillProps) {
  const config = ACTION_STATUS_CONFIG[status];
  
  return (
    <div className="group relative inline-flex">
      <StatusPill status={status} {...props} />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {config.description}
      </div>
    </div>
  );
}
