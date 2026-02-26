import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Action } from '@/types';
import type { POSContext, ActionCategory } from '@/types/actions';
import { ACTION_CATEGORY_CONFIG, riskLevelToCategory } from '@/types/actions';
import { CategoryBadge } from './CategoryBadge';
import { StatusIndicator } from '@/components/dashboard/StatusIndicator';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Monitor,
  Clock,
  Zap,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PreflightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: Action;
  posContext: POSContext;
  onConfirm: (reason?: string) => void;
  isExecuting?: boolean;
}

export function PreflightModal({
  open,
  onOpenChange,
  action,
  posContext,
  onConfirm,
  isExecuting = false,
}: PreflightModalProps) {
  const category = riskLevelToCategory(action.riskLevel);
  const config = ACTION_CATEGORY_CONFIG[category];

  const [understood, setUnderstood] = useState(false);
  const [reason, setReason] = useState('');
  const [textConfirmation, setTextConfirmation] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setUnderstood(false);
      setReason('');
      setTextConfirmation('');
    }
  }, [open]);

  const preflightPassed = posContext.preflightChecks.filter(c => c.required).every(
    c => c.status === 'passed' || c.status === 'unknown'
  );

  const canConfirm = () => {
    if (!preflightPassed) return false;
    if (config.requiresConfirmation && !understood) return false;
    if (config.requiresReason && reason.trim().length < 10) return false;
    if (config.requiresTextConfirmation) {
      // Must type the POS name to confirm
      const expectedText = posContext.posName.toUpperCase();
      if (textConfirmation.toUpperCase() !== expectedText) return false;
    }
    return true;
  };

  const handleConfirm = () => {
    if (canConfirm()) {
      onConfirm(reason || undefined);
    }
  };

  const checkStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-status-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-status-error" />;
      case 'unknown':
        return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Confirmar Ejecución
          </DialogTitle>
          <DialogDescription>
            Revise el contexto y precondiciones antes de ejecutar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Action Summary */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <p className="font-medium">{action.name}</p>
                </div>
                <code className="text-xs text-primary font-mono">{action.actionId}</code>
              </div>
              <CategoryBadge category={category} />
            </div>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </div>

          {/* POS Context */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Contexto del POS
            </h4>
            
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{posContext.posName}</span>
                  <StatusIndicator status={posContext.status} showLabel />
                </div>
                <span className="text-sm text-muted-foreground">{posContext.storeName}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">ID:</span>
                  <code className="ml-2 text-xs font-mono">{posContext.posId}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Último heartbeat:</span>
                  <span className="ml-2 font-mono text-xs">
                    {format(new Date(posContext.lastHeartbeat), 'HH:mm:ss', { locale: es })}
                  </span>
                </div>
              </div>

              {/* Services */}
              <div className="flex flex-wrap gap-2">
                {posContext.services.map((svc) => (
                  <span
                    key={svc.name}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border',
                      svc.status === 'running' 
                        ? 'bg-status-success/10 text-status-success border-status-success/30'
                        : svc.status === 'error'
                        ? 'bg-status-error/10 text-status-error border-status-error/30'
                        : 'bg-muted text-muted-foreground border-border'
                    )}
                  >
                    {svc.name}: {svc.status}
                  </span>
                ))}
              </div>

              {/* Last Action */}
              {posContext.lastAction && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-3">
                  <Clock className="w-3 h-3" />
                  <span>Última acción:</span>
                  <span className="font-medium">{posContext.lastAction.name}</span>
                  <span>•</span>
                  <span>{posContext.lastAction.status}</span>
                  <span>•</span>
                  <span className="font-mono">
                    {format(new Date(posContext.lastAction.timestamp), 'dd/MM HH:mm', { locale: es })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Preconditions Checklist */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Precondiciones</h4>
            <div className="space-y-2">
              {posContext.preflightChecks.length > 0 ? (
                posContext.preflightChecks.map((check) => (
                  <div
                    key={check.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-lg border',
                      check.status === 'passed' 
                        ? 'bg-status-success/5 border-status-success/20'
                        : check.status === 'failed'
                        ? 'bg-status-error/5 border-status-error/20'
                        : 'bg-muted/50 border-border'
                    )}
                  >
                    {checkStatusIcon(check.status)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{check.name}</p>
                      {check.message && (
                        <p className="text-xs text-muted-foreground">{check.message}</p>
                      )}
                    </div>
                    {check.required && (
                      <span className="text-[10px] text-muted-foreground">Requerido</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Precondiciones: no disponibles
                </p>
              )}
            </div>
          </div>

          {/* Risk Warning for Operational/Critical */}
          {(category === 'operational' || category === 'critical') && (
            <div className={cn(
              'flex items-start gap-3 p-4 rounded-lg border',
              category === 'critical' 
                ? 'bg-status-error/5 border-status-error/30'
                : 'bg-status-warning/5 border-status-warning/30'
            )}>
              <AlertTriangle className={cn(
                'w-5 h-5 mt-0.5',
                category === 'critical' ? 'text-status-error' : 'text-status-warning'
              )} />
              <div>
                <p className={cn(
                  'font-medium text-sm',
                  category === 'critical' ? 'text-status-error' : 'text-status-warning'
                )}>
                  {category === 'critical' ? 'Acción Crítica' : 'Acción Operacional'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {category === 'critical'
                    ? 'Esta acción tiene alto riesgo y puede afectar significativamente la operación del POS. Requiere confirmación reforzada.'
                    : 'Esta acción puede afectar temporalmente la operación del POS. Asegúrese de que no hay transacciones en curso.'}
                </p>
              </div>
            </div>
          )}

          {/* Confirmation Requirements */}
          {config.requiresConfirmation && (
            <div className="space-y-4 border-t border-border pt-4">
              {/* Understanding checkbox */}
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="understand" 
                  checked={understood}
                  onCheckedChange={(checked) => setUnderstood(checked === true)}
                />
                <Label 
                  htmlFor="understand" 
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  Entiendo el impacto de esta acción y he verificado las precondiciones
                </Label>
              </div>

              {/* Reason field for critical actions */}
              {config.requiresReason && (
                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-sm font-medium">
                    Motivo de la ejecución <span className="text-status-error">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Describa el motivo por el cual ejecuta esta acción (mínimo 10 caracteres)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="min-h-[80px]"
                  />
                  {reason.length > 0 && reason.length < 10 && (
                    <p className="text-xs text-status-error">
                      El motivo debe tener al menos 10 caracteres
                    </p>
                  )}
                </div>
              )}

              {/* Text confirmation for critical actions */}
              {config.requiresTextConfirmation && (
                <div className="space-y-2">
                  <Label htmlFor="textConfirm" className="text-sm font-medium">
                    Escriba <code className="text-primary">{posContext.posName.toUpperCase()}</code> para confirmar
                  </Label>
                  <Input
                    id="textConfirm"
                    placeholder={posContext.posName.toUpperCase()}
                    value={textConfirmation}
                    onChange={(e) => setTextConfirmation(e.target.value)}
                    className="font-mono"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isExecuting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!canConfirm() || isExecuting}
            className={cn(
              category === 'critical' && 'bg-status-error hover:bg-status-error/90'
            )}
          >
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
  );
}
