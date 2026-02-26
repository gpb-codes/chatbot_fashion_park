import { cn } from '@/lib/utils';
import type { ActionStatus } from '@/types';
import { CheckCircle2, XCircle, Clock, Loader2, Ban } from 'lucide-react';

interface ActionStatusBadgeProps {
  status: ActionStatus;
  className?: string;
}

const statusConfig: Record<ActionStatus, { label: string; icon: React.ElementType; class: string }> = {
  pending: { 
    label: 'Pendiente', 
    icon: Clock, 
    class: 'bg-status-pending/15 text-status-pending border-status-pending/30' 
  },
  in_progress: { 
    label: 'En Progreso', 
    icon: Loader2, 
    class: 'bg-status-warning/15 text-status-warning border-status-warning/30' 
  },
  success: { 
    label: 'Exitoso', 
    icon: CheckCircle2, 
    class: 'bg-status-success/15 text-status-success border-status-success/30' 
  },
  failed: { 
    label: 'Fallido', 
    icon: XCircle, 
    class: 'bg-status-error/15 text-status-error border-status-error/30' 
  },
  cancelled: { 
    label: 'Cancelado', 
    icon: Ban, 
    class: 'bg-muted text-muted-foreground border-border' 
  },
};

export function ActionStatusBadge({ status, className }: ActionStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border",
      config.class,
      className
    )}>
      <Icon className={cn("w-3 h-3", status === 'in_progress' && "animate-spin")} />
      {config.label}
    </span>
  );
}
