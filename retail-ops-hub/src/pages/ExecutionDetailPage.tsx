import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ExecutionDetail } from '@/components/operations';
import { useExecution, useRetryExecution, useCancelExecution } from '@/hooks/useExecutionsData';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  RotateCcw, 
  XCircle, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ExecutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cancelReason, setCancelReason] = useState('');
  
  const { data: tracedExecution, isLoading, error, refetch } = useExecution(id || '');
  const retryMutation = useRetryExecution();
  const cancelMutation = useCancelExecution();

  const handleRetry = async () => {
    if (!id) return;
    try {
      await retryMutation.mutateAsync({ id });
      toast.success('Reintento iniciado correctamente');
    } catch (err) {
      toast.error('Error al reintentar la ejecución');
    }
  };

  const handleCancel = async () => {
    if (!id || !cancelReason.trim()) return;
    try {
      await cancelMutation.mutateAsync({ 
        id, 
        request: { reason: cancelReason } 
      });
      toast.success('Ejecución cancelada');
      setCancelReason('');
    } catch (err) {
      toast.error('Error al cancelar la ejecución');
    }
  };

  const execution = tracedExecution?.execution;
  const canRetry = execution && ['failed', 'blocked'].includes(execution.status);
  const canCancel = execution && ['pending_approval', 'queued'].includes(execution.status);

  return (
    <MainLayout title="Detalle de Ejecución" subtitle={id}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Detalle de Ejecución
              </h1>
              {id && (
                <p className="text-sm text-muted-foreground font-mono">
                  {id}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>

            {canRetry && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reintentar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Reintentar ejecución?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se creará una nueva ejecución con los mismos parámetros.
                      La ejecución anterior permanecerá en el historial.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleRetry}
                      disabled={retryMutation.isPending}
                    >
                      {retryMutation.isPending ? 'Reintentando...' : 'Reintentar'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar ejecución?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. La ejecución será marcada como cancelada.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Label htmlFor="cancel-reason">Motivo de cancelación</Label>
                    <Textarea
                      id="cancel-reason"
                      placeholder="Ingresa el motivo de la cancelación..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setCancelReason('')}>
                      Volver
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleCancel}
                      disabled={cancelMutation.isPending || !cancelReason.trim()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {cancelMutation.isPending ? 'Cancelando...' : 'Confirmar cancelación'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-status-error mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Error al cargar la ejecución
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              No se pudo obtener la información de la ejecución. 
              Verifica que el ID sea correcto.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        )}

        {execution && (
          <ExecutionDetail execution={execution} />
        )}
      </div>
    </MainLayout>
  );
}
