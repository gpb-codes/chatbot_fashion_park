import { cn } from '@/lib/utils';
import type { ActionExecutionV2 } from '@/types/actions';
import { StatusPill } from './StatusPill';
import { CategoryBadge } from './CategoryBadge';
import { EvidencePanel } from './EvidencePanel';
import { ActionProgressBar } from './ActionProgressBar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Monitor, 
  User, 
  Clock,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  FileSearch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ActionCardProps {
  execution: ActionExecutionV2;
  onRetry?: (id: string) => void;
  onEscalate?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  compact?: boolean;
  className?: string;
}

export function ActionCard({ 
  execution, 
  onRetry, 
  onEscalate, 
  onViewDetails,
  compact = false,
  className 
}: ActionCardProps) {
  const [showEvidence, setShowEvidence] = useState(false);

  const canRetry = execution.status === 'failed' && 
    (execution.retryCount ?? 0) < (execution.maxRetries ?? 3);
  const canEscalate = execution.status === 'failed' || execution.status === 'blocked';

  return (
    <div className={cn(
      'bg-card border border-border rounded-lg overflow-hidden transition-all hover:border-primary/30',
      className
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-start justify-between gap-4 border-b border-border',
        compact ? 'p-3' : 'p-4'
      )}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn(
              'font-semibold text-foreground',
              compact ? 'text-sm' : 'text-base'
            )}>
              {execution.actionName}
            </h3>
            <StatusPill status={execution.status} size={compact ? 'sm' : 'md'} />
            <CategoryBadge category={execution.category} size={compact ? 'sm' : 'md'} showLabel={false} />
          </div>
          
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Monitor className="w-3 h-3" />
              <span>{execution.posName}</span>
              <span className="text-border">•</span>
              <span>{execution.storeName}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              <span>{execution.requestedBy}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <Clock className="w-3 h-3" />
              <span>{format(new Date(execution.requestedAt), 'dd/MM HH:mm', { locale: es })}</span>
            </div>
          </div>

          <code className="text-[10px] text-primary font-mono mt-1 block">
            {execution.actionId}
          </code>
        </div>

        {onViewDetails && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewDetails(execution.id)}
            aria-label="Ver detalles"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Progress Bar (if in progress or queued) */}
      {(execution.status === 'in_progress' || execution.status === 'queued') && !compact && (
        <div className="p-4 border-b border-border">
          <ActionProgressBar phases={execution.phases} />
        </div>
      )}

      {/* Result/Error Message */}
      {(execution.result || execution.errorMessage || execution.blockReason) && (
        <div className={cn('border-b border-border', compact ? 'p-3' : 'p-4')}>
          {execution.status === 'success' && execution.result && (
            <p className="text-xs text-status-success">
              ✓ {execution.result}
            </p>
          )}
          {execution.status === 'failed' && execution.errorMessage && (
            <p className="text-xs text-status-error">
              FAILED: {execution.errorMessage}
            </p>
          )}
          {execution.status === 'blocked' && execution.blockReason && (
            <p className="text-xs text-status-warning">
              BLOCKED: {execution.blockReason}
            </p>
          )}
        </div>
      )}

      {/* Evidence Toggle */}
      {!compact && (
        <div className={cn('border-b border-border', compact ? 'p-3' : 'p-4')}>
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <FileSearch className="w-3 h-3" />
            {showEvidence ? 'Ocultar evidencia' : 'Ver evidencia'}
          </button>
          
          {showEvidence && (
            <div className="mt-3">
              <EvidencePanel evidence={execution.evidence} compact />
            </div>
          )}
        </div>
      )}

      {/* Actions Footer */}
      {(canRetry || canEscalate) && !compact && (
        <div className="p-4 flex items-center gap-2">
          {canRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetry(execution.id)}
              className="gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reintentar
            </Button>
          )}
          {canEscalate && onEscalate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEscalate(execution.id)}
              className="gap-1 text-status-warning border-status-warning/30 hover:bg-status-warning/10"
            >
              <AlertTriangle className="w-3 h-3" />
              Escalar incidente
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
