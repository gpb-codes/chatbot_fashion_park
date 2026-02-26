import { cn } from '@/lib/utils';
import type { ExecutionPhase, PhaseStatus } from '@/types/executions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Circle,
  SkipForward
} from 'lucide-react';

interface ExecutionPhaseTimelineProps {
  phases: ExecutionPhase[];
  className?: string;
}

const statusConfig: Record<PhaseStatus, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  lineColor: string;
}> = {
  pending: {
    icon: Circle,
    color: 'bg-muted text-muted-foreground border-border',
    lineColor: 'bg-border',
  },
  current: {
    icon: Loader2,
    color: 'bg-primary/20 text-primary border-primary/30',
    lineColor: 'bg-primary/50',
  },
  completed: {
    icon: CheckCircle2,
    color: 'bg-status-success/20 text-status-success border-status-success/30',
    lineColor: 'bg-status-success/50',
  },
  failed: {
    icon: XCircle,
    color: 'bg-status-error/20 text-status-error border-status-error/30',
    lineColor: 'bg-status-error/50',
  },
  skipped: {
    icon: SkipForward,
    color: 'bg-muted text-muted-foreground border-border',
    lineColor: 'bg-border',
  },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

interface PhaseItemProps {
  phase: ExecutionPhase;
  isLast: boolean;
}

function PhaseItem({ phase, isLast }: PhaseItemProps) {
  const config = statusConfig[phase.status];
  const Icon = config.icon;

  return (
    <div className="relative flex gap-4">
      {/* Connector line */}
      {!isLast && (
        <div 
          className={cn(
            'absolute left-[15px] top-8 bottom-0 w-0.5',
            config.lineColor
          )} 
        />
      )}

      {/* Icon */}
      <div className={cn(
        'shrink-0 w-8 h-8 rounded-full flex items-center justify-center border',
        config.color
      )}>
        <Icon className={cn(
          'w-4 h-4',
          phase.status === 'current' && 'animate-spin'
        )} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-sm font-medium',
              phase.status === 'pending' || phase.status === 'skipped' 
                ? 'text-muted-foreground' 
                : 'text-foreground'
            )}>
              {phase.name}
            </p>
            
            {phase.message && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {phase.message}
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            {phase.timestamp && (
              <p className="text-xs text-muted-foreground font-mono">
                {format(new Date(phase.timestamp), 'HH:mm:ss', { locale: es })}
              </p>
            )}
            {phase.duration !== undefined && (
              <p className="text-[10px] text-muted-foreground">
                {formatDuration(phase.duration)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExecutionPhaseTimeline({ phases, className }: ExecutionPhaseTimelineProps) {
  if (phases.length === 0) {
    return (
      <div className={cn('text-center py-6', className)}>
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Sin fases registradas</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)}>
      {phases.map((phase, index) => (
        <PhaseItem
          key={`${phase.name}-${index}`}
          phase={phase}
          isLast={index === phases.length - 1}
        />
      ))}
    </div>
  );
}
