import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RecentActionsTable } from '@/components/dashboard/RecentActionsTable';
import { POSStatusChart } from '@/components/dashboard/POSStatusChart';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { RefreshIndicator } from '@/components/dashboard/RefreshIndicator';
import { LiveIndicator } from '@/components/dashboard/LiveIndicator';
import { 
  useMetricsPolling, 
  useExecutionsPolling
} from '@/hooks/usePOSData';
import { useAlertCounts } from '@/hooks/useAlertsData';
import { 
  Monitor, 
  AlertTriangle, 
  Zap, 
  Clock, 
  CheckCircle2, 
  TrendingUp 
} from 'lucide-react';

export default function Dashboard() {
  const { 
    data: metrics, 
    isLoading: metricsLoading, 
    isRefreshing: metricsRefreshing,
    lastUpdated: metricsUpdated,
    refetch: refetchMetrics 
  } = useMetricsPolling(30000);

  const { 
    data: executions, 
    isLoading: executionsLoading,
    isRefreshing: executionsRefreshing,
    refetch: refetchExecutions
  } = useExecutionsPolling(15000);

  const alertCounts = useAlertCounts();

  const handleRefreshAll = () => {
    refetchMetrics();
    refetchExecutions();
  };

  // Use loaded data or fallback
  const displayMetrics = metrics || {
    totalPOS: 0,
    onlinePOS: 0,
    offlinePOS: 0,
    criticalServices: 0,
    activeAlerts: 0,
    actionsToday: 0,
    mttrMinutes: 0,
    successRate: 0,
  };

  const displayExecutions = executions || [];

  const isAnyRefreshing = metricsRefreshing || executionsRefreshing;

  return (
    <MainLayout 
      title="Dashboard Ejecutivo" 
      subtitle="Visión general del estado operativo de la red POS"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Status Bar */}
        <div className="flex items-center justify-between">
          <LiveIndicator isLive={true} />
          <RefreshIndicator 
            isRefreshing={isAnyRefreshing}
            lastUpdated={metricsUpdated}
            onRefresh={handleRefreshAll}
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="POS Online"
            value={metricsLoading ? '...' : `${displayMetrics.onlinePOS}/${displayMetrics.totalPOS}`}
            subtitle={metricsLoading ? '' : `${((displayMetrics.onlinePOS / displayMetrics.totalPOS) * 100).toFixed(1)}% disponibilidad`}
            icon={<Monitor className="w-5 h-5" />}
            variant={displayMetrics.offlinePOS > 0 ? 'warning' : 'success'}
          />
          <MetricCard
            title="Servicios Críticos"
            value={metricsLoading ? '...' : displayMetrics.criticalServices}
            subtitle="Requieren atención"
            icon={<AlertTriangle className="w-5 h-5" />}
            variant={displayMetrics.criticalServices > 0 ? 'error' : 'default'}
          />
          <MetricCard
            title="Acciones Hoy"
            value={metricsLoading ? '...' : displayMetrics.actionsToday}
            icon={<Zap className="w-5 h-5" />}
            trend={{ value: 12, label: 'vs ayer' }}
          />
          <MetricCard
            title="MTTR Promedio"
            value={metricsLoading ? '...' : `${displayMetrics.mttrMinutes} min`}
            subtitle="Tiempo medio de resolución"
            icon={<Clock className="w-5 h-5" />}
            trend={{ value: -8, label: 'vs semana' }}
          />
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Tasa de Éxito"
            value={metricsLoading ? '...' : `${displayMetrics.successRate.toFixed(1)}%`}
            subtitle="Últimas 24 horas"
            icon={<CheckCircle2 className="w-5 h-5" />}
            variant="success"
          />
          <MetricCard
            title="Alertas Activas"
            value={metricsLoading ? '...' : alertCounts.active}
            icon={<AlertTriangle className="w-5 h-5" />}
            variant={alertCounts.active > 2 ? 'warning' : 'default'}
          />
          <MetricCard
            title="POS Offline"
            value={metricsLoading ? '...' : displayMetrics.offlinePOS}
            subtitle="Requieren verificación"
            icon={<Monitor className="w-5 h-5" />}
            variant={displayMetrics.offlinePOS > 0 ? 'error' : 'success'}
          />
          <MetricCard
            title="Uptime Mensual"
            value="99.2%"
            icon={<TrendingUp className="w-5 h-5" />}
            trend={{ value: 0.3, label: 'vs mes anterior' }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Actions - 2 columns */}
          <div className="lg:col-span-2">
            <RecentActionsTable 
              executions={displayExecutions}
              isLoading={executionsLoading}
              isRefreshing={executionsRefreshing}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <POSStatusChart 
              metrics={metrics}
              isLoading={metricsLoading}
              isRefreshing={metricsRefreshing}
            />
            <AlertsPanel 
              maxHeight="320px"
              showFilters={true}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
