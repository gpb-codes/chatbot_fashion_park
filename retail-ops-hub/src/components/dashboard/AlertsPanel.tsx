import { useState } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Check, 
  CheckCheck,
  ChevronRight,
  Filter,
  RefreshCw,
  Bell,
  BellOff,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  useAlerts, 
  useAcknowledgeAlert, 
  useResolveAlert,
  useBulkAcknowledgeAlerts,
  useAlertCounts
} from '@/hooks/useAlertsData';
import type { Alert, AlertSeverity, AlertStatus } from '@/types/alerts';

const severityConfig: Record<AlertSeverity, { 
  icon: typeof AlertTriangle; 
  class: string;
  label: string;
  priority: number;
}> = {
  critical: { 
    icon: AlertTriangle, 
    class: 'text-[hsl(var(--status-error))] bg-[hsl(var(--status-error)/0.1)] border-[hsl(var(--status-error)/0.3)]',
    label: 'Crítico',
    priority: 1
  },
  warning: { 
    icon: AlertCircle, 
    class: 'text-[hsl(var(--status-warning))] bg-[hsl(var(--status-warning)/0.1)] border-[hsl(var(--status-warning)/0.3)]',
    label: 'Advertencia',
    priority: 2
  },
  info: { 
    icon: Info, 
    class: 'text-[hsl(var(--status-pending))] bg-[hsl(var(--status-pending)/0.1)] border-[hsl(var(--status-pending)/0.3)]',
    label: 'Info',
    priority: 3
  },
};

const statusConfig: Record<AlertStatus, { label: string; class: string }> = {
  active: { 
    label: 'Activa', 
    class: 'bg-[hsl(var(--status-error)/0.2)] text-[hsl(var(--status-error))]' 
  },
  acknowledged: { 
    label: 'Reconocida', 
    class: 'bg-[hsl(var(--status-warning)/0.2)] text-[hsl(var(--status-warning))]' 
  },
  resolved: { 
    label: 'Resuelta', 
    class: 'bg-[hsl(var(--status-success)/0.2)] text-[hsl(var(--status-success))]' 
  },
};

interface AlertItemProps {
  alert: Alert;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onViewDetails: (alert: Alert) => void;
  isAcknowledging?: boolean;
}

function AlertItem({ 
  alert, 
  onAcknowledge, 
  onResolve,
  onViewDetails,
  isAcknowledging 
}: AlertItemProps) {
  const config = severityConfig[alert.severity];
  const status = statusConfig[alert.status];
  const Icon = config.icon;
  const timeAgo = formatDistanceToNow(new Date(alert.createdAt), { 
    addSuffix: true, 
    locale: es 
  });

  return (
    <div className="group p-4 hover:bg-accent/30 transition-colors border-b border-border last:border-0">
      <div className="flex items-start gap-3">
        {/* Severity Icon */}
        <div className={cn("p-1.5 rounded-md border flex-shrink-0", config.class)}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {alert.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {alert.message}
              </p>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(alert)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver detalles
                </DropdownMenuItem>
                {alert.status === 'active' && (
                  <DropdownMenuItem 
                    onClick={() => onAcknowledge(alert.id)}
                    disabled={isAcknowledging}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Reconocer
                  </DropdownMenuItem>
                )}
                {alert.status !== 'resolved' && (
                  <DropdownMenuItem onClick={() => onResolve(alert.id)}>
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Resolver
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {alert.posId && (
                  <DropdownMenuItem>
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Ir a POS
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Metadata */}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <Badge 
              variant="outline" 
              className={cn("text-[10px] px-1.5 py-0", status.class)}
            >
              {status.label}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {config.label}
            </Badge>
            {alert.posName && (
              <span className="text-[10px] text-muted-foreground">
                {alert.posName}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {timeAgo}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AlertsPanelProps {
  className?: string;
  maxHeight?: string;
  showFilters?: boolean;
  compact?: boolean;
}

export function AlertsPanel({ 
  className, 
  maxHeight = '400px',
  showFilters = true,
  compact = false
}: AlertsPanelProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'acknowledged'>('active');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  
  const { toast } = useToast();
  const counts = useAlertCounts();
  
  const statusFilter = activeTab === 'all' ? undefined : activeTab;
  const { data, isLoading, refetch, isRefetching } = useAlerts(
    statusFilter ? { status: statusFilter } : undefined
  );
  
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();
  const bulkAcknowledge = useBulkAcknowledgeAlerts();

  const alerts = data?.data ?? [];
  
  // Sort by severity priority
  const sortedAlerts = [...alerts].sort((a, b) => {
    return severityConfig[a.severity].priority - severityConfig[b.severity].priority;
  });

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert.mutateAsync({ id });
      toast({
        title: 'Alerta reconocida',
        description: 'La alerta ha sido marcada como reconocida.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo reconocer la alerta.',
        variant: 'destructive',
      });
    }
  };

  const handleResolve = (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      setSelectedAlert(alert);
      setResolveDialogOpen(true);
    }
  };

  const confirmResolve = async () => {
    if (!selectedAlert || !resolution.trim()) return;
    
    try {
      await resolveAlert.mutateAsync({ 
        id: selectedAlert.id, 
        request: { resolution: resolution.trim() } 
      });
      toast({
        title: 'Alerta resuelta',
        description: 'La alerta ha sido marcada como resuelta.',
      });
      setResolveDialogOpen(false);
      setResolution('');
      setSelectedAlert(null);
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo resolver la alerta.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAcknowledge = async () => {
    const activeAlerts = alerts.filter(a => a.status === 'active');
    if (activeAlerts.length === 0) return;
    
    try {
      await bulkAcknowledge.mutateAsync({
        alertIds: activeAlerts.map(a => a.id),
      });
      toast({
        title: 'Alertas reconocidas',
        description: `${activeAlerts.length} alertas han sido reconocidas.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudieron reconocer las alertas.',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (alert: Alert) => {
    // Navigate to alert details or open a modal
    window.location.href = `/alerts/${alert.id}`;
  };

  return (
    <>
      <div className={cn("rounded-lg border border-border bg-card", className)}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Alertas del Sistema
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {isRefetching && (
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          {showFilters && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="h-8 w-full">
                <TabsTrigger value="active" className="flex-1 text-xs gap-1.5">
                  Activas
                  {counts.active > 0 && (
                    <Badge variant="destructive" className="h-4 min-w-4 text-[10px] px-1">
                      {counts.active}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="acknowledged" className="flex-1 text-xs gap-1.5">
                  Reconocidas
                  {counts.acknowledged > 0 && (
                    <Badge variant="secondary" className="h-4 min-w-4 text-[10px] px-1">
                      {counts.acknowledged}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all" className="flex-1 text-xs">
                  Todas
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Bulk Actions */}
          {activeTab === 'active' && counts.active > 1 && (
            <div className="flex items-center justify-end mt-3">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleBulkAcknowledge}
                disabled={bulkAcknowledge.isPending}
              >
                <CheckCheck className="h-3 w-3 mr-1.5" />
                Reconocer todas ({counts.active})
              </Button>
            </div>
          )}
        </div>

        {/* Alerts List */}
        <ScrollArea style={{ maxHeight }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : sortedAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <BellOff className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">
                {activeTab === 'active' 
                  ? 'No hay alertas activas' 
                  : activeTab === 'acknowledged'
                    ? 'No hay alertas reconocidas'
                    : 'No hay alertas'}
              </p>
            </div>
          ) : (
            <div>
              {sortedAlerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={handleAcknowledge}
                  onResolve={handleResolve}
                  onViewDetails={handleViewDetails}
                  isAcknowledging={acknowledgeAlert.isPending}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {!compact && sortedAlerts.length > 0 && (
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = '/alerts'}
            >
              Ver todas las alertas
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Alerta</DialogTitle>
            <DialogDescription>
              Indica cómo se resolvió esta alerta para el registro de auditoría.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">{selectedAlert.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedAlert.message}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolución</Label>
                <Textarea
                  id="resolution"
                  placeholder="Describe cómo se resolvió el problema..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResolveDialogOpen(false);
                setResolution('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmResolve}
              disabled={!resolution.trim() || resolveAlert.isPending}
            >
              {resolveAlert.isPending ? 'Resolviendo...' : 'Resolver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
