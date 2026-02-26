import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useStoresData } from '@/hooks/useStoresData';
import { useActionsData } from '@/hooks/useActionsData';
import { useExecuteAction } from '@/hooks/useExecuteAction';
import { RiskBadge } from '@/components/dashboard/RiskBadge';
import { StatusIndicator } from '@/components/dashboard/StatusIndicator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Monitor, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  ArrowRight,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Step = 'select-pos' | 'select-action' | 'confirm' | 'executing' | 'complete';

export default function ExecuteActionPage() {
  const { posTerminals, stores, isLoading: isLoadingStores } = useStoresData();
  const { actions, isLoading: isLoadingActions } = useActionsData();
  const { execute, isExecuting } = useExecuteAction();

  const [currentStep, setCurrentStep] = useState<Step>('select-pos');
  const [selectedPOS, setSelectedPOS] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [executionResult, setExecutionResult] = useState<{ executionId: string } | null>(null);

  const pos = posTerminals.find(p => p.id === selectedPOS);
  const action = actions.find(a => a.id === selectedAction);
  const store = pos ? stores.find(s => s.id === pos.storeId) : null;

  const handleExecute = async () => {
    if (!pos || !action) return;

    setShowConfirmDialog(false);
    setCurrentStep('executing');

    try {
      const result = await execute({
        actionId: action.actionId,
        posId: pos.id,
        executedBy: 'Carlos Mendoza', // Would come from auth context
      });

      setExecutionResult({ executionId: result.executionId });
      setCurrentStep('complete');
      toast.success('Acción ejecutada correctamente', {
        description: `${action.name} en ${pos.name}`,
      });
    } catch (error) {
      setCurrentStep('select-action');
      toast.error('Error al ejecutar la acción', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  const resetFlow = () => {
    setCurrentStep('select-pos');
    setSelectedPOS('');
    setSelectedAction('');
    setExecutionResult(null);
  };

  const steps = [
    { id: 'select-pos', label: '1. Seleccionar POS' },
    { id: 'select-action', label: '2. Seleccionar Acción' },
    { id: 'confirm', label: '3. Confirmar' },
    { id: 'executing', label: '4. Ejecutando' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  if (isLoadingStores || isLoadingActions) {
    return (
      <MainLayout title="Ejecutar Acción" subtitle="Cargando...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Ejecutar Acción" 
      subtitle="Flujo guiado para ejecución de acciones en POS"
    >
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                  index < currentStepIndex 
                    ? "bg-status-success border-status-success text-primary-foreground"
                    : index === currentStepIndex
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-muted border-border text-muted-foreground"
                )}>
                  {index < currentStepIndex ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={cn(
                  "text-sm hidden md:block",
                  index === currentStepIndex ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 mx-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-card border border-border rounded-lg p-6">
          {/* Step 1: Select POS */}
          {currentStep === 'select-pos' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Seleccionar POS</h2>
                <p className="text-sm text-muted-foreground">
                  Seleccione el terminal punto de venta donde desea ejecutar la acción.
                </p>
              </div>

              <Select value={selectedPOS} onValueChange={setSelectedPOS}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un POS" />
                </SelectTrigger>
                <SelectContent>
                  {posTerminals.map((p) => {
                    const s = stores.find(st => st.id === p.storeId);
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <StatusIndicator status={p.status} size="sm" />
                          <span>{p.name}</span>
                          <span className="text-muted-foreground">- {s?.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {pos && (
                <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-primary" />
                    <span className="font-medium">{pos.name}</span>
                    <StatusIndicator status={pos.status} showLabel />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tienda:</span>
                      <span className="ml-2">{store?.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">IP:</span>
                      <span className="ml-2 font-mono">{pos.ipAddress}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Versión Agente:</span>
                      <span className="ml-2">{pos.agentVersion}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Servicios:</span>
                      <span className="ml-2">
                        {pos.services.map(s => (
                          <Badge key={s.id} variant="outline" className="mr-1 text-xs">
                            {s.name}: {s.status}
                          </Badge>
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  disabled={!selectedPOS || pos?.status === 'offline'}
                  onClick={() => setCurrentStep('select-action')}
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Select Action */}
          {currentStep === 'select-action' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Seleccionar Acción</h2>
                <p className="text-sm text-muted-foreground">
                  Seleccione la acción autorizada a ejecutar en <span className="text-primary">{pos?.name}</span>.
                </p>
              </div>

              <div className="grid gap-3">
                {actions.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAction(a.id)}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all",
                      selectedAction === a.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-accent/30"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Zap className={cn(
                          "w-5 h-5",
                          selectedAction === a.id ? "text-primary" : "text-muted-foreground"
                        )} />
                        <div>
                          <p className="font-medium">{a.name}</p>
                          <code className="text-xs text-primary font-mono">{a.actionId}</code>
                        </div>
                      </div>
                      <RiskBadge level={a.riskLevel} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 ml-8">
                      {a.description}
                    </p>
                    {a.requiresApproval && (
                      <div className="flex items-center gap-1 mt-2 ml-8 text-xs text-status-warning">
                        <AlertTriangle className="w-3 h-3" />
                        Requiere aprobación
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('select-pos')}>
                  Atrás
                </Button>
                <Button 
                  disabled={!selectedAction}
                  onClick={() => setShowConfirmDialog(true)}
                >
                  Revisar y Confirmar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Executing */}
          {currentStep === 'executing' && (
            <div className="py-12 text-center space-y-6">
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
              <div>
                <h2 className="text-lg font-semibold">Ejecutando acción...</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {action?.name} en {pos?.name}
                </p>
              </div>
              <div className="max-w-md mx-auto bg-secondary/30 rounded-lg p-4 text-left">
                <p className="text-xs text-muted-foreground font-mono">
                  [INFO] Enviando comando a RabbitMQ...<br />
                  [INFO] Esperando respuesta del agente...<br />
                  [INFO] Procesando acción {action?.actionId}...
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 'complete' && (
            <div className="py-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-status-success/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-status-success" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Acción ejecutada correctamente</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {action?.name} completado en {pos?.name}
                </p>
              </div>
              <div className="max-w-md mx-auto bg-secondary/30 rounded-lg p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge className="bg-status-success/20 text-status-success border-status-success/30">
                    Exitoso
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duración:</span>
                  <span>2.8 segundos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ID Ejecución:</span>
                  <code className="text-xs font-mono text-primary">
                    {executionResult?.executionId || `exec-${Date.now()}`}
                  </code>
                </div>
              </div>
              <Button onClick={resetFlow}>
                Ejecutar otra acción
              </Button>
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Confirmar Ejecución
              </DialogTitle>
              <DialogDescription>
                Revise los detalles antes de ejecutar la acción.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">POS:</span>
                  <span className="font-medium">{pos?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tienda:</span>
                  <span>{store?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Acción:</span>
                  <span className="font-medium">{action?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">action_id:</span>
                  <code className="text-primary font-mono">{action?.actionId}</code>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nivel de riesgo:</span>
                  {action && <RiskBadge level={action.riskLevel} />}
                </div>
              </div>

              {action?.riskLevel === 'high' || action?.riskLevel === 'critical' ? (
                <div className="flex items-start gap-2 p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-status-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-status-warning">Acción de alto riesgo</p>
                    <p className="text-muted-foreground">
                      Esta acción puede afectar la operación del POS. Asegúrese de que no hay transacciones en curso.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleExecute} disabled={isExecuting}>
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Ejecutando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Confirmar y Ejecutar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
