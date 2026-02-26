import { MainLayout } from '@/components/layout/MainLayout';
import { useExecutionsPolling } from '@/hooks/usePOSData';
import { useActionsData } from '@/hooks/useActionsData';
import { useObservabilityData } from '@/hooks/useObservabilityData';
import { ActionStatusBadge } from '@/components/dashboard/ActionStatusBadge';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { 
  Activity, 
  Clock, 
  TrendingUp,
  BarChart3,
  Zap,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export default function ObservabilityPage() {
  const { data: executions, isLoading: isLoadingExecutions } = useExecutionsPolling();
  const { actions, isLoading: isLoadingActions } = useActionsData();
  const { 
    hourlyActions, 
    responseTimeData, 
    storeHeatmapData, 
    summary,
    isLoading: isLoadingObservability 
  } = useObservabilityData();

  const isLoading = isLoadingExecutions || isLoadingActions || isLoadingObservability;
  const executionsList = executions || [];

  const getActionName = (actionId: string) => {
    return actions.find(a => a.actionId === actionId)?.name || actionId;
  };

  if (isLoading) {
    return (
      <MainLayout title="Observabilidad" subtitle="Cargando...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Observabilidad" 
      subtitle="Métricas y telemetría de operaciones (OpenTelemetry)"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.totalActions24h}</p>
                <p className="text-sm text-muted-foreground">Acciones (24h)</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-success/10">
                <TrendingUp className="w-5 h-5 text-status-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.successRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Tasa de éxito</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-warning/10">
                <Clock className="w-5 h-5 text-status-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.avgResponseTime}s</p>
                <p className="text-sm text-muted-foreground">Tiempo promedio</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-error/10">
                <Activity className="w-5 h-5 text-status-error" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.recurringErrors}</p>
                <p className="text-sm text-muted-foreground">Errores recurrentes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Actions */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold">Acciones por Hora (Hoy)</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyActions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(222, 30%, 18%)' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(222, 30%, 18%)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(222, 47%, 10%)', 
                      border: '1px solid hsl(222, 30%, 18%)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(210, 20%, 95%)' }}
                  />
                  <Bar dataKey="acciones" fill="hsl(173, 58%, 39%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Response Time Trend */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold">Tiempo de Respuesta (Semana)</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(222, 30%, 18%)' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(222, 30%, 18%)' }}
                    unit="s"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(222, 47%, 10%)', 
                      border: '1px solid hsl(222, 30%, 18%)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(210, 20%, 95%)' }}
                    formatter={(value) => [`${value}s`, 'Tiempo']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tiempo" 
                    stroke="hsl(173, 58%, 39%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(173, 58%, 39%)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Errores por Tienda / Servicio (Últimos 7 días)</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-sm text-muted-foreground p-2">Tienda</th>
                  <th className="text-center text-sm text-muted-foreground p-2">Transbank</th>
                  <th className="text-center text-sm text-muted-foreground p-2">Llaves Directo</th>
                  <th className="text-center text-sm text-muted-foreground p-2">Sistema</th>
                </tr>
              </thead>
              <tbody>
                {storeHeatmapData.map((row) => (
                  <tr key={row.store} className="border-t border-border">
                    <td className="p-2 font-medium">{row.store}</td>
                    <td className="p-2 text-center">
                      <div 
                        className="inline-block w-12 h-8 rounded flex items-center justify-center text-xs font-medium"
                        style={{
                          backgroundColor: `hsl(0, ${Math.min(row.transbank * 10, 72)}%, ${50 - row.transbank * 2}%)`,
                          color: row.transbank > 5 ? 'white' : 'hsl(210, 20%, 95%)'
                        }}
                      >
                        {row.transbank}
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div 
                        className="inline-block w-12 h-8 rounded flex items-center justify-center text-xs font-medium"
                        style={{
                          backgroundColor: `hsl(0, ${Math.min(row.llaves * 10, 72)}%, ${50 - row.llaves * 2}%)`,
                          color: row.llaves > 5 ? 'white' : 'hsl(210, 20%, 95%)'
                        }}
                      >
                        {row.llaves}
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div 
                        className="inline-block w-12 h-8 rounded flex items-center justify-center text-xs font-medium"
                        style={{
                          backgroundColor: `hsl(0, ${Math.min(row.sistema * 10, 72)}%, ${50 - row.sistema * 2}%)`,
                          color: row.sistema > 5 ? 'white' : 'hsl(210, 20%, 95%)'
                        }}
                      >
                        {row.sistema}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Timeline de Acciones Recientes</h3>
          <div className="space-y-4">
            {executionsList.map((exec, index) => (
              <div key={exec.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    exec.status === 'success' ? 'bg-status-success' :
                    exec.status === 'failed' ? 'bg-status-error' :
                    exec.status === 'pending' ? 'bg-status-pending' :
                    'bg-status-warning'
                  }`} />
                  {index < executionsList.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{getActionName(exec.actionId)}</p>
                      <ActionStatusBadge status={exec.status} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(exec.executedAt), 'HH:mm:ss')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>Por: {exec.executedBy}</span>
                    <Badge variant="outline" className="text-[10px]">{exec.actionId}</Badge>
                    {exec.completedAt && (
                      <span>Duración: {Math.round((new Date(exec.completedAt).getTime() - new Date(exec.executedAt).getTime()) / 1000)}s</span>
                    )}
                  </div>
                  {exec.errorMessage && (
                    <p className="text-xs text-status-error mt-1">{exec.errorMessage}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
