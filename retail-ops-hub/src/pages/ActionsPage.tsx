import { MainLayout } from '@/components/layout/MainLayout';
import { useActionsData } from '@/hooks/useActionsData';
import { RiskBadge } from '@/components/dashboard/RiskBadge';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Shield, 
  AlertCircle, 
  CheckCircle2,
  Zap,
  Loader2
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ActionsPage() {
  const { actions, isLoading, error } = useActionsData();

  if (isLoading) {
    return (
      <MainLayout title="Catálogo de Acciones" subtitle="Cargando...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Catálogo de Acciones" subtitle="Error al cargar datos">
        <div className="text-center py-12 text-status-error">
          {error.message}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Catálogo de Acciones" 
      subtitle="Acciones autorizadas disponibles para ejecución en POS"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Info Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Catálogo de Acciones Autorizadas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Todas las acciones están predefinidas y auditadas. No es posible ejecutar comandos arbitrarios 
              ni modificar los scripts asociados. Cada acción se referencia únicamente por su <code className="text-primary font-mono">action_id</code>.
            </p>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => (
            <Card key={action.id} className="bg-card border-border hover:border-primary/30 transition-all hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{action.name}</CardTitle>
                      <code className="text-[10px] text-primary font-mono">{action.actionId}</code>
                    </div>
                  </div>
                  <RiskBadge level={action.riskLevel} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-sm">
                  {action.description}
                </CardDescription>

                <div className="space-y-3">
                  {/* Service */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Servicio</span>
                    <Badge variant="secondary">{action.service}</Badge>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Duración est.
                    </span>
                    <span className="text-foreground">{action.estimatedDuration}</span>
                  </div>

                  {/* Cooldown */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cooldown</span>
                    <span className="text-foreground">{action.cooldownMinutes} min</span>
                  </div>

                  {/* Approval */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Aprobación</span>
                    {action.requiresApproval ? (
                      <Badge variant="destructive" className="text-[10px]">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Requerida
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-status-success border-status-success/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        No requerida
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Preconditions */}
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Precondiciones:</p>
                  <ul className="space-y-1">
                    {action.preconditions.map((pre, index) => (
                      <li key={index} className="text-xs text-foreground flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        {pre}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
