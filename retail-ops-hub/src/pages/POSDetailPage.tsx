import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useStoresData } from '@/hooks/useStoresData';
import { useActionsData } from '@/hooks/useActionsData';
import { StatusIndicator } from '@/components/dashboard/StatusIndicator';
import { RiskBadge } from '@/components/dashboard/RiskBadge';
import { 
  StatusPill, 
  CategoryBadge, 
  EvidencePanel, 
  ActionTimeline, 
  PreflightModal 
} from '@/components/operations';
import { riskLevelToCategory } from '@/types/actions';
import { getMockPOSContext, mockTimelineEvents } from '@/data/mockOperationsData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Monitor, 
  Activity, 
  Clock, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  ChevronLeft,
  Zap,
  Loader2,
  Server,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function POSDetailPage() {
  const { posId } = useParams<{ posId: string }>();
  const { posTerminals, stores, isLoading } = useStoresData();
  const { actions } = useActionsData();
  
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showPreflightModal, setShowPreflightModal] = useState(false);

  const pos = posTerminals.find(p => p.id === posId);
  const store = pos ? stores.find(s => s.id === pos.storeId) : null;
  const posContext = pos ? getMockPOSContext(pos.id) : null;
  
  // Filter timeline events for this POS
  const posEvents = mockTimelineEvents.filter(e => e.posId === posId);

  // Group actions by category
  const groupedActions = {
    observation: actions.filter(a => riskLevelToCategory(a.riskLevel) === 'observation'),
    diagnostic: actions.filter(a => riskLevelToCategory(a.riskLevel) === 'diagnostic'),
    operational: actions.filter(a => riskLevelToCategory(a.riskLevel) === 'operational'),
    critical: actions.filter(a => riskLevelToCategory(a.riskLevel) === 'critical'),
  };

  const selectedActionData = selectedAction ? actions.find(a => a.id === selectedAction) : null;

  const handleExecuteAction = () => {
    if (selectedActionData && posContext) {
      const category = riskLevelToCategory(selectedActionData.riskLevel);
      if (category === 'operational' || category === 'critical') {
        setShowPreflightModal(true);
      } else {
        // Direct execution for observation/diagnostic
        toast.success('Acción solicitada', {
          description: `${selectedActionData.name} en ${pos?.name}`,
        });
        setSelectedAction(null);
      }
    }
  };

  const handleConfirmExecution = (reason?: string) => {
    setShowPreflightModal(false);
    toast.success('Solicitud creada (QUEUED)', {
      description: `${selectedActionData?.name} en ${pos?.name}. Esperando ejecución en POS.`,
    });
    setSelectedAction(null);
  };

  if (isLoading) {
    return (
      <MainLayout title="Detalle POS" subtitle="Cargando...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!pos || !store) {
    return (
      <MainLayout title="POS no encontrado" subtitle="">
        <div className="text-center py-12">
          <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">El POS solicitado no existe</p>
          <Link to="/stores">
            <Button>Volver a Tiendas</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title={pos.name} 
      subtitle={store.name}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Back Navigation */}
        <Link 
          to="/stores" 
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Tiendas
        </Link>

        {/* Header Card */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'p-3 rounded-xl',
                  pos.status === 'online' ? 'bg-status-success/10' : 
                  pos.status === 'warning' ? 'bg-status-warning/10' : 
                  'bg-status-error/10'
                )}>
                  {pos.status === 'offline' ? (
                    <WifiOff className="w-6 h-6 text-status-error" />
                  ) : (
                    <Wifi className={cn(
                      'w-6 h-6',
                      pos.status === 'online' ? 'text-status-success' : 'text-status-warning'
                    )} />
                  )}
                </div>
                <div>
                  <CardTitle className="text-xl flex items-center gap-3">
                    {pos.name}
                    <StatusIndicator status={pos.status} showLabel size="md" />
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span>{store.name}</span>
                    <span className="text-border">•</span>
                    <code className="text-xs font-mono text-primary">{pos.id}</code>
                  </CardDescription>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Último heartbeat:</span>
                </div>
                <p className="text-sm font-mono">
                  {formatDistanceToNow(new Date(pos.lastHeartbeat), { addSuffix: true, locale: es })}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">IP Address</p>
                <p className="font-mono text-sm mt-1">{pos.ipAddress}</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Versión Agente</p>
                <p className="text-sm mt-1">{pos.agentVersion}</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 col-span-2">
                <p className="text-xs text-muted-foreground mb-2">Servicios</p>
                <div className="flex flex-wrap gap-2">
                  {pos.services.map((svc) => (
                    <Badge
                      key={svc.id}
                      variant="outline"
                      className={cn(
                        'gap-1 text-xs',
                        svc.status === 'running' 
                          ? 'border-status-success/30 text-status-success' 
                          : svc.status === 'error'
                          ? 'border-status-error/30 text-status-error'
                          : 'border-border text-muted-foreground'
                      )}
                    >
                      <Server className="w-3 h-3" />
                      {svc.name}: {svc.status}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Actions & Timeline */}
        <Tabs defaultValue="actions" className="space-y-4">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="actions" className="gap-2">
              <Zap className="w-4 h-4" />
              Acciones
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Activity className="w-4 h-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-6">
            {/* Warning if POS offline */}
            {pos.status === 'offline' && (
              <div className="flex items-start gap-3 p-4 bg-status-error/5 border border-status-error/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-status-error mt-0.5" />
                <div>
                  <p className="font-medium text-status-error">POS Desconectado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No es posible ejecutar acciones mientras el POS está offline. 
                    Último heartbeat: {format(new Date(pos.lastHeartbeat), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              </div>
            )}

            {/* Actions grouped by category */}
            <div className="grid gap-6">
              {/* Observation */}
              {groupedActions.observation.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category="observation" />
                    <span className="text-xs text-muted-foreground">Lectura de estado sin impacto</span>
                  </div>
                  <div className="grid gap-2">
                    {groupedActions.observation.map(action => (
                      <ActionButton
                        key={action.id}
                        action={action}
                        selected={selectedAction === action.id}
                        disabled={pos.status === 'offline'}
                        onSelect={() => setSelectedAction(action.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnostic */}
              {groupedActions.diagnostic.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category="diagnostic" />
                    <span className="text-xs text-muted-foreground">Análisis y recolección de información</span>
                  </div>
                  <div className="grid gap-2">
                    {groupedActions.diagnostic.map(action => (
                      <ActionButton
                        key={action.id}
                        action={action}
                        selected={selectedAction === action.id}
                        disabled={pos.status === 'offline'}
                        onSelect={() => setSelectedAction(action.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Operational */}
              {groupedActions.operational.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category="operational" />
                    <span className="text-xs text-muted-foreground">Requiere confirmación</span>
                  </div>
                  <div className="grid gap-2">
                    {groupedActions.operational.map(action => (
                      <ActionButton
                        key={action.id}
                        action={action}
                        selected={selectedAction === action.id}
                        disabled={pos.status === 'offline'}
                        onSelect={() => setSelectedAction(action.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Critical */}
              {groupedActions.critical.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category="critical" />
                    <span className="text-xs text-muted-foreground">Alto riesgo, confirmación reforzada</span>
                  </div>
                  <div className="grid gap-2">
                    {groupedActions.critical.map(action => (
                      <ActionButton
                        key={action.id}
                        action={action}
                        selected={selectedAction === action.id}
                        disabled={pos.status === 'offline'}
                        onSelect={() => setSelectedAction(action.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Execute Button */}
            {selectedAction && (
              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  onClick={handleExecuteAction}
                  disabled={pos.status === 'offline'}
                  className="gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Ejecutar {selectedActionData?.name}
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Historial de Eventos</CardTitle>
                <CardDescription>
                  Timeline de acciones y eventos en este POS
                </CardDescription>
              </CardHeader>
              <CardContent>
                {posEvents.length > 0 ? (
                  <ActionTimeline events={posEvents} showEvidence />
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No hay eventos recientes para este POS
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preflight Modal */}
        {selectedActionData && posContext && (
          <PreflightModal
            open={showPreflightModal}
            onOpenChange={setShowPreflightModal}
            action={selectedActionData}
            posContext={posContext}
            onConfirm={handleConfirmExecution}
          />
        )}
      </div>
    </MainLayout>
  );
}

// Action Button Component
interface ActionButtonProps {
  action: {
    id: string;
    name: string;
    actionId: string;
    description: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    requiresApproval: boolean;
  };
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}

function ActionButton({ action, selected, disabled, onSelect }: ActionButtonProps) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-accent/30',
        disabled && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent'
      )}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{action.name}</p>
            <RiskBadge level={action.riskLevel} />
          </div>
          <code className="text-[10px] text-primary font-mono">{action.actionId}</code>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {action.description}
          </p>
        </div>
        {action.requiresApproval && (
          <Badge variant="outline" className="shrink-0 text-[10px] text-status-warning border-status-warning/30">
            Aprobación
          </Badge>
        )}
      </div>
    </button>
  );
}
