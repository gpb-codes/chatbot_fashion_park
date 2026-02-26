import { cn } from '@/lib/utils';
import type { ActionExecutionV2 } from '@/types/executions';
import type { ActionLifecycleStatus } from '@/types/actions';
import { StatusPill } from './StatusPill';
import { CategoryBadge } from './CategoryBadge';
import { EvidencePanel } from './EvidencePanel';
import { ExecutionPhaseTimeline } from './ExecutionPhaseTimeline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  User, 
  Monitor, 
  Store, 
  Calendar,
  RotateCcw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Map execution status to display status (handles 'expired' and 'sent' not in UI types)
function mapStatusForDisplay(status: string): ActionLifecycleStatus {
  const validStatuses: ActionLifecycleStatus[] = [
    'draft', 'pending_approval', 'queued', 'in_progress', 
    'success', 'failed', 'blocked', 'cancelled'
  ];
  if (validStatuses.includes(status as ActionLifecycleStatus)) {
    return status as ActionLifecycleStatus;
  }
  // Map API-only statuses to closest UI equivalent
  if (status === 'expired') return 'cancelled';
  if (status === 'sent') return 'queued';
  return 'queued';
}

interface ExecutionDetailProps {
  execution: ActionExecutionV2;
  className?: string;
}

interface InfoRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground min-w-[100px]">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  return format(new Date(dateString), "dd MMM yyyy 'a las' HH:mm:ss", { locale: es });
}

function calculateDuration(start?: string, end?: string): string {
  if (!start) return '—';
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const ms = endDate.getTime() - startDate.getTime();
  
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

export function ExecutionDetail({ execution, className }: ExecutionDetailProps) {
  const isTerminal = ['success', 'failed', 'cancelled', 'expired'].includes(execution.status);
  const hasError = execution.status === 'failed' || execution.status === 'blocked';
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              {execution.actionName}
            </h2>
            <p className="text-sm text-muted-foreground font-mono">
              ID: {execution.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CategoryBadge category={execution.category} />
            <StatusPill status={mapStatusForDisplay(execution.status)} />
          </div>
        </div>
      </div>

      {/* Error/Block message */}
      {hasError && (execution.errorMessage || execution.blockReason) && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-status-error/10 border border-status-error/20">
          <AlertTriangle className="w-5 h-5 text-status-error shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-status-error">
              {execution.status === 'blocked' ? 'Ejecución bloqueada' : 'Error en ejecución'}
            </p>
            <p className="text-sm text-muted-foreground">
              {execution.blockReason || execution.errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Result message */}
      {execution.status === 'success' && execution.result && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-status-success/10 border border-status-success/20">
          <CheckCircle2 className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-status-success">Ejecución exitosa</p>
            <p className="text-sm text-muted-foreground">{execution.result}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="evidence">Evidencia</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Target Info */}
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-foreground mb-3">Destino</h3>
                  <InfoRow 
                    icon={Monitor} 
                    label="POS" 
                    value={
                      <span>
                        {execution.posName}
                        <span className="text-muted-foreground ml-1">({execution.posId})</span>
                      </span>
                    } 
                  />
                  <InfoRow 
                    icon={Store} 
                    label="Tienda" 
                    value={
                      <span>
                        {execution.storeName}
                        <span className="text-muted-foreground ml-1">({execution.storeId})</span>
                      </span>
                    } 
                  />
                </div>

                {/* Request Info */}
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-foreground mb-3">Solicitud</h3>
                  <InfoRow 
                    icon={User} 
                    label="Solicitante" 
                    value={execution.requestedBy} 
                  />
                  <InfoRow 
                    icon={Calendar} 
                    label="Fecha solicitud" 
                    value={formatDate(execution.requestedAt)} 
                  />
                  {execution.reason && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground">Motivo:</p>
                      <p className="text-sm text-foreground mt-1">{execution.reason}</p>
                    </div>
                  )}
                </div>

                {/* Approval Info */}
                {execution.approvedBy && (
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-foreground mb-3">Aprobación</h3>
                    <InfoRow 
                      icon={User} 
                      label="Aprobador" 
                      value={execution.approvedBy} 
                    />
                    <InfoRow 
                      icon={Calendar} 
                      label="Fecha aprobación" 
                      value={formatDate(execution.approvedAt)} 
                    />
                  </div>
                )}

                {/* Timing Info */}
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-foreground mb-3">Tiempos</h3>
                  {execution.startedAt && (
                    <InfoRow 
                      icon={Clock} 
                      label="Inicio" 
                      value={formatDate(execution.startedAt)} 
                    />
                  )}
                  {execution.completedAt && (
                    <InfoRow 
                      icon={isTerminal && execution.status === 'success' ? CheckCircle2 : XCircle} 
                      label="Fin" 
                      value={formatDate(execution.completedAt)} 
                    />
                  )}
                  <InfoRow 
                    icon={Clock} 
                    label="Duración" 
                    value={calculateDuration(execution.startedAt, execution.completedAt)} 
                  />
                </div>
              </div>

              {/* Retry info */}
              {execution.retryCount !== undefined && execution.retryCount > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Reintentos: {execution.retryCount}
                      {execution.maxRetries !== undefined && ` / ${execution.maxRetries}`}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fases de Ejecución</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <ExecutionPhaseTimeline phases={execution.phases} />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trazabilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <EvidencePanel evidence={execution.evidence} />
              <p className="text-xs text-muted-foreground mt-4">
                Estos identificadores permiten rastrear la ejecución a través de todos los sistemas 
                involucrados y correlacionar logs en herramientas de observabilidad.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
