import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useStoresData } from '@/hooks/useStoresData';
import { useActionsData } from '@/hooks/useActionsData';
import { useActionRequests } from '@/hooks/useCommandData';
import { RiskBadge } from '@/components/dashboard/RiskBadge';
import { StatusIndicator } from '@/components/dashboard/StatusIndicator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  Shield,
  Send,
  Clock,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { currentUser } from '@/data/mockData';
import { COMMAND_CATALOG, type CommandType } from '@/types/commands';

type Step = 'select-pos' | 'select-action' | 'review' | 'submitting' | 'complete';

export default function RequestActionPage() {
  const navigate = useNavigate();
  const { posTerminals, stores, isLoading: isLoadingStores } = useStoresData();
  const { actions, isLoading: isLoadingActions, getActionByActionId } = useActionsData();
  const { createRequest } = useActionRequests();

  const [currentStep, setCurrentStep] = useState<Step>('select-pos');
  const [selectedPOS, setSelectedPOS] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<{ id: string; requiresApproval: boolean } | null>(null);

  const pos = posTerminals.find(p => p.id === selectedPOS);
  const action = actions.find(a => a.id === selectedAction);
  const store = pos ? stores.find(s => s.id === pos.storeId) : null;

  // Filter actions based on what commands are in the closed catalog
  const governedActions = useMemo(() => {
    return actions.filter(a => 
      Object.values(COMMAND_CATALOG).includes(a.actionId as CommandType)
    );
  }, [actions]);

  // Check preconditions (mock implementation)
  const preconditionsCheck = useMemo(() => {
    if (!pos || !action) return { met: false, details: [] };
    
    // Simulate precondition checks
    const details: string[] = [];
    let met = true;

    if (pos.status === 'offline') {
      met = false;
      details.push('❌ POS está offline');
    } else {
      details.push('✅ POS está online');
    }

    // Simulate "no active sale" check
    if (Math.random() > 0.3) {
      details.push('✅ Sin venta activa');
    } else {
      met = false;
      details.push('❌ Venta activa detectada');
    }

    // Check service status for relevant actions
    if (action.service !== 'Sistema') {
      const service = pos.services.find(s => 
        s.name.toLowerCase().includes(action.service.toLowerCase())
      );
      if (service?.status === 'running') {
        details.push(`✅ Servicio ${action.service} activo`);
      } else if (service?.status === 'error') {
        details.push(`⚠️ Servicio ${action.service} en error`);
      }
    }

    return { met, details };
  }, [pos, action]);

  const handleSubmit = async () => {
    if (!pos || !action || !store) return;

    setShowSubmitDialog(false);
    setIsSubmitting(true);
    setCurrentStep('submitting');

    try {
      const request = await createRequest({
        command: action.actionId as CommandType,
        target: {
          pos_id: pos.id,
          store_id: store.id,
          environment: 'production',
        },
        requested_by: {
          user_id: currentUser.id,
          user_name: currentUser.name,
          role: currentUser.role as 'operator' | 'admin',
        },
        priority: action.riskLevel === 'critical' ? 'critical' : 
                  action.riskLevel === 'high' ? 'high' : 'normal',
        notes: notes || undefined,
        preconditions_met: preconditionsCheck.met,
        precondition_details: preconditionsCheck.details,
      });

      setSubmittedRequest({ 
        id: request.id, 
        requiresApproval: action.requiresApproval 
      });
      setCurrentStep('complete');
      
      toast.success(
        action.requiresApproval 
          ? 'Solicitud enviada para aprobación'
          : 'Solicitud creada correctamente',
        { description: `${action.name} en ${pos.name}` }
      );
    } catch (error) {
      setCurrentStep('review');
      toast.error('Error al crear la solicitud', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFlow = () => {
    setCurrentStep('select-pos');
    setSelectedPOS('');
    setSelectedAction('');
    setNotes('');
    setSubmittedRequest(null);
  };

  const steps = [
    { id: 'select-pos', label: '1. Seleccionar POS', icon: Monitor },
    { id: 'select-action', label: '2. Seleccionar Acción', icon: Zap },
    { id: 'review', label: '3. Revisar y Enviar', icon: FileCheck },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  if (isLoadingStores || isLoadingActions) {
    return (
      <MainLayout title="Solicitar Acción" subtitle="Cargando...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Solicitar Acción Gobernada" 
      subtitle="Flujo seguro para solicitud de comandos en POS"
    >
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Info Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Catálogo Cerrado de Comandos</p>
            <p className="text-sm text-muted-foreground mt-1">
              Solo se pueden solicitar comandos del catálogo autorizado. Las acciones de alto riesgo 
              requieren aprobación de un administrador antes de ejecutarse.
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    index < currentStepIndex 
                      ? "bg-status-success border-status-success text-primary-foreground"
                      : index === currentStepIndex
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-muted border-border text-muted-foreground"
                  )}>
                    {index < currentStepIndex ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
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
            );
          })}
        </div>

        {/* Step Content */}
        <div className="bg-card border border-border rounded-lg p-6">
          {/* Step 1: Select POS */}
          {currentStep === 'select-pos' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Seleccionar POS Destino</h2>
                <p className="text-sm text-muted-foreground">
                  El comando será enviado al agente instalado en este terminal.
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
                      <span className="text-muted-foreground">Entorno:</span>
                      <Badge variant="outline" className="ml-2 text-xs">production</Badge>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">Servicios:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pos.services.map(s => (
                        <Badge 
                          key={s.id} 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            s.status === 'running' && "border-status-success/30 text-status-success",
                            s.status === 'error' && "border-status-error/30 text-status-error",
                            s.status === 'stopped' && "border-status-warning/30 text-status-warning"
                          )}
                        >
                          {s.name}: {s.status}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  disabled={!selectedPOS}
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
                <h2 className="text-lg font-semibold mb-2">Seleccionar Comando del Catálogo</h2>
                <p className="text-sm text-muted-foreground">
                  Comandos gobernados disponibles para <span className="text-primary">{pos?.name}</span>.
                  <span className="text-status-warning ml-2">
                    Las acciones con 🔒 requieren aprobación.
                  </span>
                </p>
              </div>

              <div className="grid gap-3">
                {governedActions.map((a) => (
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
                        <div className={cn(
                          "p-2 rounded-lg",
                          selectedAction === a.id ? "bg-primary/20" : "bg-muted"
                        )}>
                          <Zap className={cn(
                            "w-4 h-4",
                            selectedAction === a.id ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{a.name}</p>
                            {a.requiresApproval && (
                              <span className="text-status-warning text-sm">🔒</span>
                            )}
                          </div>
                          <code className="text-xs text-primary font-mono">{a.actionId}</code>
                        </div>
                      </div>
                      <RiskBadge level={a.riskLevel} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 ml-12">
                      {a.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3 ml-12 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {a.estimatedDuration}
                      </span>
                      <span>Cooldown: {a.cooldownMinutes} min</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('select-pos')}>
                  Atrás
                </Button>
                <Button 
                  disabled={!selectedAction}
                  onClick={() => setCurrentStep('review')}
                >
                  Revisar Solicitud
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Revisar y Confirmar Solicitud</h2>
                <p className="text-sm text-muted-foreground">
                  Verifique los detalles antes de enviar la solicitud.
                </p>
              </div>

              {/* Summary */}
              <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">POS Destino:</span>
                    <p className="font-medium mt-1">{pos?.name}</p>
                    <p className="text-xs text-muted-foreground">{store?.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Comando:</span>
                    <p className="font-medium mt-1">{action?.name}</p>
                    <code className="text-xs text-primary font-mono">{action?.actionId}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nivel de Riesgo:</span>
                    <div className="mt-1">{action && <RiskBadge level={action.riskLevel} />}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Requiere Aprobación:</span>
                    <div className="mt-1">
                      {action?.requiresApproval ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Sí, requiere aprobación
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-status-success border-status-success/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          No, auto-aprobación
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">Solicitado por:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">{currentUser.name}</span>
                    <Badge variant="secondary" className="text-xs">{currentUser.role}</Badge>
                  </div>
                </div>
              </div>

              {/* Preconditions */}
              <div className="bg-secondary/30 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Verificación de Precondiciones</h3>
                <ul className="space-y-2">
                  {preconditionsCheck.details.map((detail, idx) => (
                    <li key={idx} className="text-sm">{detail}</li>
                  ))}
                </ul>
                {!preconditionsCheck.met && (
                  <div className="flex items-start gap-2 mt-4 p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-status-warning mt-0.5" />
                    <p className="text-sm text-status-warning">
                      No se cumplen todas las precondiciones. El comando podría ser bloqueado por el agente.
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Notas (opcional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe el motivo de esta solicitud..."
                  rows={3}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('select-action')}>
                  Atrás
                </Button>
                <Button onClick={() => setShowSubmitDialog(true)}>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Solicitud
                </Button>
              </div>
            </div>
          )}

          {/* Submitting */}
          {currentStep === 'submitting' && (
            <div className="py-12 text-center space-y-6">
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
              <div>
                <h2 className="text-lg font-semibold">Procesando solicitud...</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Creando solicitud de {action?.actionId} para {pos?.name}
                </p>
              </div>
            </div>
          )}

          {/* Complete */}
          {currentStep === 'complete' && submittedRequest && (
            <div className="py-12 text-center space-y-6">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto",
                submittedRequest.requiresApproval 
                  ? "bg-status-warning/20" 
                  : "bg-status-success/20"
              )}>
                {submittedRequest.requiresApproval ? (
                  <Clock className="w-10 h-10 text-status-warning" />
                ) : (
                  <CheckCircle2 className="w-10 h-10 text-status-success" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {submittedRequest.requiresApproval 
                    ? 'Solicitud Enviada para Aprobación'
                    : 'Solicitud Creada Correctamente'}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {submittedRequest.requiresApproval 
                    ? 'Un administrador debe aprobar esta acción antes de ejecutarla.'
                    : 'La acción será ejecutada automáticamente.'}
                </p>
              </div>
              <div className="max-w-md mx-auto bg-secondary/30 rounded-lg p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ID Solicitud:</span>
                  <code className="text-xs font-mono text-primary">{submittedRequest.id}</code>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge className={cn(
                    "text-xs",
                    submittedRequest.requiresApproval 
                      ? "bg-status-warning/20 text-status-warning border-status-warning/30"
                      : "bg-status-success/20 text-status-success border-status-success/30"
                  )}>
                    {submittedRequest.requiresApproval ? 'Pendiente de Aprobación' : 'Auto-aprobado'}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={resetFlow}>
                  Nueva Solicitud
                </Button>
                <Button onClick={() => navigate('/approvals')}>
                  Ver Cola de Aprobación
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Confirmar Solicitud
              </DialogTitle>
              <DialogDescription>
                {action?.requiresApproval 
                  ? 'Esta acción requiere aprobación de un administrador.'
                  : 'Esta acción se procesará automáticamente.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Comando:</span>
                  <code className="text-primary font-mono">{action?.actionId}</code>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Destino:</span>
                  <span>{pos?.name} ({store?.name})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Riesgo:</span>
                  {action && <RiskBadge level={action.riskLevel} />}
                </div>
              </div>

              {action?.requiresApproval && (
                <div className="flex items-start gap-2 p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
                  <Clock className="w-5 h-5 text-status-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-status-warning">Requiere Aprobación</p>
                    <p className="text-muted-foreground">
                      La solicitud quedará pendiente hasta que un administrador la apruebe.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Confirmar y Enviar
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
