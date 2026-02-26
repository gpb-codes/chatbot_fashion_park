import { MainLayout } from '@/components/layout/MainLayout';
import { useIncidentsPolling } from '@/hooks/usePOSData';
import { useStoresData } from '@/hooks/useStoresData';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2,
  Clock,
  User,
  Link2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const severityConfig = {
  low: { icon: Info, label: 'Bajo', class: 'bg-status-pending/15 text-status-pending border-status-pending/30' },
  medium: { icon: AlertCircle, label: 'Medio', class: 'bg-status-warning/15 text-status-warning border-status-warning/30' },
  high: { icon: AlertTriangle, label: 'Alto', class: 'bg-status-error/15 text-status-error border-status-error/30' },
  critical: { icon: AlertTriangle, label: 'Crítico', class: 'bg-risk-critical/15 text-risk-critical border-risk-critical/30' },
};

const statusConfig = {
  open: { label: 'Abierto', class: 'bg-status-error/15 text-status-error' },
  investigating: { label: 'Investigando', class: 'bg-status-warning/15 text-status-warning' },
  resolved: { label: 'Resuelto', class: 'bg-status-success/15 text-status-success' },
  closed: { label: 'Cerrado', class: 'bg-muted text-muted-foreground' },
};

export default function IncidentsPage() {
  const { data: incidents, isLoading: isLoadingIncidents } = useIncidentsPolling();
  const { posTerminals, stores, isLoading: isLoadingStores } = useStoresData();

  const isLoading = isLoadingIncidents || isLoadingStores;
  const incidentsList = incidents || [];

  const getPosInfo = (posId?: string) => {
    if (!posId) return null;
    const pos = posTerminals.find(p => p.id === posId);
    if (!pos) return null;
    const store = stores.find(s => s.id === pos.storeId);
    return { pos, store };
  };

  const activeCount = incidentsList.filter(i => i.status === 'open' || i.status === 'investigating').length;
  const resolvedCount = incidentsList.filter(i => i.status === 'resolved' || i.status === 'closed').length;

  if (isLoading) {
    return (
      <MainLayout title="Incidentes" subtitle="Cargando...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Incidentes" 
      subtitle="Gestión y seguimiento de incidentes operativos"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-error/10">
                <AlertTriangle className="w-5 h-5 text-status-error" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-success/10">
                <CheckCircle2 className="w-5 h-5 text-status-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resolvedCount}</p>
                <p className="text-sm text-muted-foreground">Resueltos</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">8.5m</p>
                <p className="text-sm text-muted-foreground">MTTR Promedio</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-risk-critical/10">
                <AlertTriangle className="w-5 h-5 text-risk-critical" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {incidentsList.filter(i => i.severity === 'critical' && i.status !== 'closed').length}
                </p>
                <p className="text-sm text-muted-foreground">Críticos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold">Todos los Incidentes</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground">Severidad</TableHead>
                <TableHead className="text-muted-foreground">Incidente</TableHead>
                <TableHead className="text-muted-foreground">POS / Tienda</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-muted-foreground">Asignado</TableHead>
                <TableHead className="text-muted-foreground">Creado</TableHead>
                <TableHead className="text-muted-foreground">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidentsList.map((incident) => {
                const severity = severityConfig[incident.severity];
                const status = statusConfig[incident.status];
                const posInfo = getPosInfo(incident.posId);
                const SeverityIcon = severity.icon;

                return (
                  <TableRow key={incident.id} className="data-row">
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn("gap-1", severity.class)}
                      >
                        <SeverityIcon className="w-3 h-3" />
                        {severity.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{incident.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                        {incident.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      {posInfo ? (
                        <div>
                          <p className="text-sm">{posInfo.pos.name}</p>
                          <p className="text-xs text-muted-foreground">{posInfo.store?.name}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={status.class}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {incident.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{incident.assignedTo}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true, locale: es })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(incident.createdAt), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {incident.relatedActions.length > 0 && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Link2 className="w-3 h-3" />
                          {incident.relatedActions.length} acciones
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
