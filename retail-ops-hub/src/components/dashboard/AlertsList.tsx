import { forwardRef } from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Incident } from '@/types';

const severityConfig = {
  low: { icon: Info, class: 'text-status-pending bg-status-pending/10 border-status-pending/30' },
  medium: { icon: AlertCircle, class: 'text-status-warning bg-status-warning/10 border-status-warning/30' },
  high: { icon: AlertTriangle, class: 'text-status-error bg-status-error/10 border-status-error/30' },
  critical: { icon: AlertTriangle, class: 'text-risk-critical bg-risk-critical/10 border-risk-critical/30' },
};

interface AlertsListProps {
  incidents: Incident[];
  isRefreshing?: boolean;
  className?: string;
}

export const AlertsList = forwardRef<HTMLDivElement, AlertsListProps>(
  function AlertsList({ incidents, isRefreshing, className }, ref) {
    const activeIncidents = incidents.filter(i => i.status !== 'closed' && i.status !== 'resolved');

    return (
      <div ref={ref} className={cn("rounded-lg border border-border bg-card", className)}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Alertas Activas</h3>
          <div className="flex items-center gap-2">
            {isRefreshing && (
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
            <span className="text-xs text-muted-foreground">{activeIncidents.length} activas</span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {activeIncidents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay alertas activas</p>
            </div>
          ) : (
            activeIncidents.map((incident) => {
              const config = severityConfig[incident.severity];
              const Icon = config.icon;
              return (
                <div key={incident.id} className="p-4 hover:bg-accent/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-1.5 rounded-md border", config.class)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {incident.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {incident.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn(
                          "text-[10px] uppercase font-medium px-1.5 py-0.5 rounded",
                          incident.status === 'open' ? 'bg-status-error/20 text-status-error' : 'bg-status-warning/20 text-status-warning'
                        )}>
                          {incident.status === 'open' ? 'Abierto' : 'Investigando'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
);
