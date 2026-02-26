import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  Loader2,
  AlertTriangle,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommandExecution, ApprovalStatus, CommandStatus } from '@/types/commands';

// ============= Execution Status Badge =============

interface ExecutionStatusBadgeProps {
  status: CommandExecution['status'];
  className?: string;
}

const executionStatusConfig: Record<CommandExecution['status'], { 
  label: string; 
  icon: React.ElementType;
  className: string;
}> = {
  pending: { 
    label: 'Pendiente', 
    icon: Clock, 
    className: 'bg-muted text-muted-foreground border-border' 
  },
  sent: { 
    label: 'Enviado', 
    icon: Send, 
    className: 'bg-primary/15 text-primary border-primary/30' 
  },
  acknowledged: { 
    label: 'Recibido', 
    icon: CheckCircle2, 
    className: 'bg-primary/15 text-primary border-primary/30' 
  },
  executing: { 
    label: 'Ejecutando', 
    icon: Loader2, 
    className: 'bg-status-warning/15 text-status-warning border-status-warning/30' 
  },
  completed: { 
    label: 'Completado', 
    icon: CheckCircle2, 
    className: 'bg-status-success/15 text-status-success border-status-success/30' 
  },
  failed: { 
    label: 'Fallido', 
    icon: XCircle, 
    className: 'bg-status-error/15 text-status-error border-status-error/30' 
  },
  blocked: { 
    label: 'Bloqueado', 
    icon: Ban, 
    className: 'bg-status-warning/15 text-status-warning border-status-warning/30' 
  },
  expired: { 
    label: 'Expirado', 
    icon: Timer, 
    className: 'bg-muted text-muted-foreground border-border' 
  },
};

export function ExecutionStatusBadge({ status, className }: ExecutionStatusBadgeProps) {
  const config = executionStatusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'gap-1 font-medium',
        config.className,
        className
      )}
    >
      <Icon className={cn(
        'w-3 h-3',
        status === 'executing' && 'animate-spin'
      )} />
      {config.label}
    </Badge>
  );
}

// ============= Approval Status Badge =============

interface ApprovalStatusBadgeProps {
  status: ApprovalStatus;
  className?: string;
}

const approvalStatusConfig: Record<ApprovalStatus, { 
  label: string; 
  icon: React.ElementType;
  className: string;
}> = {
  pending: { 
    label: 'Pendiente', 
    icon: Clock, 
    className: 'bg-status-warning/15 text-status-warning border-status-warning/30' 
  },
  approved: { 
    label: 'Aprobado', 
    icon: CheckCircle2, 
    className: 'bg-status-success/15 text-status-success border-status-success/30' 
  },
  rejected: { 
    label: 'Rechazado', 
    icon: XCircle, 
    className: 'bg-status-error/15 text-status-error border-status-error/30' 
  },
  auto_approved: { 
    label: 'Auto-aprobado', 
    icon: CheckCircle2, 
    className: 'bg-primary/15 text-primary border-primary/30' 
  },
};

export function ApprovalStatusBadge({ status, className }: ApprovalStatusBadgeProps) {
  const config = approvalStatusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'gap-1 font-medium',
        config.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

// ============= Result Status Badge =============

interface ResultStatusBadgeProps {
  status: CommandStatus;
  className?: string;
}

const resultStatusConfig: Record<CommandStatus, { 
  label: string; 
  icon: React.ElementType;
  className: string;
}> = {
  SUCCESS: { 
    label: 'Éxito', 
    icon: CheckCircle2, 
    className: 'bg-status-success/15 text-status-success border-status-success/30' 
  },
  FAILED: { 
    label: 'Fallido', 
    icon: XCircle, 
    className: 'bg-status-error/15 text-status-error border-status-error/30' 
  },
  BLOCKED: { 
    label: 'Bloqueado', 
    icon: Ban, 
    className: 'bg-status-warning/15 text-status-warning border-status-warning/30' 
  },
};

export function ResultStatusBadge({ status, className }: ResultStatusBadgeProps) {
  const config = resultStatusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'gap-1 font-medium',
        config.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

// ============= Priority Badge =============

interface PriorityBadgeProps {
  priority: 'low' | 'normal' | 'high' | 'critical';
  className?: string;
}

const priorityConfig: Record<PriorityBadgeProps['priority'], { 
  label: string; 
  className: string;
}> = {
  low: { label: 'Baja', className: 'bg-muted text-muted-foreground border-border' },
  normal: { label: 'Normal', className: 'bg-primary/15 text-primary border-primary/30' },
  high: { label: 'Alta', className: 'bg-status-warning/15 text-status-warning border-status-warning/30' },
  critical: { label: 'Crítica', className: 'bg-status-error/15 text-status-error border-status-error/30' },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
