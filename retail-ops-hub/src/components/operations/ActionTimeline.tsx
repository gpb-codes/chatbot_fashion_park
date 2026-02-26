import { cn } from '@/lib/utils';
import type { TimelineEvent, ActionCategory } from '@/types/actions';
import { StatusPill } from './StatusPill';
import { CategoryBadge } from './CategoryBadge';
import { EvidencePanel } from './EvidencePanel';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  User, 
  Zap, 
  CheckCircle2, 
  Shield,
  AlertCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

interface ActionTimelineProps {
  events: TimelineEvent[];
  maxItems?: number;
  showEvidence?: boolean;
  className?: string;
}

interface TimelineItemProps {
  event: TimelineEvent;
  isLast: boolean;
  showEvidence: boolean;
}

const typeIconMap: Record<TimelineEvent['type'], React.ComponentType<{ className?: string }>> = {
  request: Zap,
  approval: Shield,
  execution: Zap,
  result: CheckCircle2,
  system: AlertCircle,
};

const typeColorMap: Record<TimelineEvent['type'], string> = {
  request: 'bg-status-pending/20 text-status-pending border-status-pending/30',
  approval: 'bg-primary/20 text-primary border-primary/30',
  execution: 'bg-status-warning/20 text-status-warning border-status-warning/30',
  result: 'bg-status-success/20 text-status-success border-status-success/30',
  system: 'bg-muted text-muted-foreground border-border',
};

function TimelineItem({ event, isLast, showEvidence }: TimelineItemProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = typeIconMap[event.type];
  const hasDetails = event.evidence || event.description;

  return (
    <div className="relative flex gap-4">
      {/* Line */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-px bg-border" />
      )}

      {/* Icon */}
      <div className={cn(
        'shrink-0 w-8 h-8 rounded-full flex items-center justify-center border',
        typeColorMap[event.type]
      )}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-foreground">
                {event.title}
              </p>
              {event.status && <StatusPill status={event.status} size="sm" />}
              {event.category && <CategoryBadge category={event.category} size="sm" showLabel={false} />}
            </div>
            
            {event.user && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span>{event.user}</span>
              </div>
            )}

            {event.posName && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {event.posName} • {event.storeName}
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground font-mono">
              {format(new Date(event.timestamp), 'HH:mm:ss', { locale: es })}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {format(new Date(event.timestamp), 'dd/MM/yyyy', { locale: es })}
            </p>
          </div>
        </div>

        {/* Expandable details */}
        {hasDetails && (
          <div className="mt-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              aria-expanded={expanded}
            >
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {expanded ? 'Ocultar detalles' : 'Ver detalles'}
            </button>

            {expanded && (
              <div className="mt-2 space-y-2 animate-fade-in">
                {event.description && (
                  <p className="text-xs text-muted-foreground bg-secondary/30 rounded p-2">
                    {event.description}
                  </p>
                )}
                {showEvidence && event.evidence && (
                  <EvidencePanel evidence={event.evidence} compact />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ActionTimeline({ 
  events, 
  maxItems,
  showEvidence = true,
  className 
}: ActionTimelineProps) {
  const displayedEvents = maxItems ? events.slice(0, maxItems) : events;
  const hasMore = maxItems && events.length > maxItems;

  if (events.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No hay eventos para mostrar</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)}>
      {displayedEvents.map((event, index) => (
        <TimelineItem
          key={event.id}
          event={event}
          isLast={index === displayedEvents.length - 1 && !hasMore}
          showEvidence={showEvidence}
        />
      ))}

      {hasMore && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-12">
          <div className="w-2 h-2 rounded-full bg-border" />
          <span>{events.length - maxItems} eventos más</span>
        </div>
      )}
    </div>
  );
}
