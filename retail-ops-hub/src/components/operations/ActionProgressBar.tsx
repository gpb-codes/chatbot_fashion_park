import { cn } from '@/lib/utils';
import type { ActionPhase } from '@/types/actions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';

interface ActionProgressBarProps {
  phases: ActionPhase[];
  className?: string;
}

const phaseStatusIcon: Record<ActionPhase['status'], React.ComponentType<{ className?: string }>> = {
  pending: Circle,
  active: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
};

const phaseStatusColor: Record<ActionPhase['status'], string> = {
  pending: 'text-muted-foreground border-border',
  active: 'text-primary border-primary',
  completed: 'text-status-success border-status-success',
  failed: 'text-status-error border-status-error',
};

export function ActionProgressBar({ phases, className }: ActionProgressBarProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {phases.map((phase, index) => {
          const Icon = phaseStatusIcon[phase.status];
          const isLast = index === phases.length - 1;

          return (
            <div key={phase.name} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center',
                  phaseStatusColor[phase.status],
                  phase.status === 'completed' && 'bg-status-success/10',
                  phase.status === 'active' && 'bg-primary/10',
                  phase.status === 'failed' && 'bg-status-error/10'
                )}>
                  <Icon className={cn(
                    'w-4 h-4',
                    phase.status === 'active' && 'animate-spin'
                  )} />
                </div>
                <div className="mt-2 text-center">
                  <p className={cn(
                    'text-xs font-medium',
                    phase.status === 'active' ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {phase.name}
                  </p>
                  {phase.timestamp && (
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {format(new Date(phase.timestamp), 'HH:mm:ss', { locale: es })}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2',
                  phase.status === 'completed' ? 'bg-status-success' : 'bg-border'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Phase Message */}
      {phases.find(p => p.status === 'active')?.message && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <p className="text-xs text-primary font-mono">
            {phases.find(p => p.status === 'active')?.message}
          </p>
        </div>
      )}

      {/* Error Message */}
      {phases.find(p => p.status === 'failed')?.message && (
        <div className="bg-status-error/5 border border-status-error/20 rounded-lg p-3">
          <p className="text-xs text-status-error">
            {phases.find(p => p.status === 'failed')?.message}
          </p>
        </div>
      )}
    </div>
  );
}
