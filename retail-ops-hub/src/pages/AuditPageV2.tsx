import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { mockAuditEventsV2, mockTimelineEvents } from '@/data/mockOperationsData';
import { 
  StatusPill, 
  CategoryBadge, 
  EvidencePanel, 
  ActionTimeline 
} from '@/components/operations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Download,
  FileText,
  Shield,
  Eye,
  EyeOff,
  Activity,
  List,
  CheckCircle2,
  XCircle,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AuditEventV2 } from '@/data/mockOperationsData';
import { cn } from '@/lib/utils';

export default function AuditPageV2() {
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [auditorMode, setAuditorMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AuditEventV2 | null>(null);

  // Filter events
  const filteredEvents = mockAuditEventsV2.filter(e => {
    if (statusFilter !== 'all' && e.result !== statusFilter) return false;
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        e.userName.toLowerCase().includes(query) ||
        e.action.toLowerCase().includes(query) ||
        e.resourceId.toLowerCase().includes(query) ||
        e.details.toLowerCase().includes(query) ||
        e.posName?.toLowerCase().includes(query) ||
        e.storeName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <MainLayout 
      title="Auditoría" 
      subtitle="Registro inmutable con evidencia de trazabilidad"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Auditor Mode Banner */}
        {auditorMode && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
            <Eye className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Modo Auditor Activo</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vista de solo lectura. No es posible ejecutar acciones.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAuditorMode(false)}
              className="gap-2"
            >
              <EyeOff className="w-4 h-4" />
              Salir
            </Button>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-secondary/30 border border-border rounded-lg p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Registro de Auditoría</p>
            <p className="text-sm text-muted-foreground mt-1">
              Registro inmutable con evidencia de OpenTelemetry. Cada entrada incluye 
              <code className="text-primary mx-1">message_id</code>,
              <code className="text-primary mx-1">correlation_id</code> y 
              <code className="text-primary mx-1">trace_id</code> para trazabilidad completa.
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar en logs..." 
                className="pl-9 bg-secondary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'success' | 'failure')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Éxito</SelectItem>
                <SelectItem value="failure">Fallo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="observation">Observación</SelectItem>
                <SelectItem value="diagnostic">Diagnóstico</SelectItem>
                <SelectItem value="operational">Operacional</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Auditor Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="auditor-mode"
                checked={auditorMode}
                onCheckedChange={setAuditorMode}
              />
              <Label htmlFor="auditor-mode" className="text-sm cursor-pointer">
                Modo Auditor
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'timeline')} className="space-y-4">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="table" className="gap-2">
              <List className="w-4 h-4" />
              Tabla
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Activity className="w-4 h-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Table View */}
          <TabsContent value="table">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-muted-foreground w-[160px]">Timestamp</TableHead>
                    <TableHead className="text-muted-foreground">Usuario</TableHead>
                    <TableHead className="text-muted-foreground">Acción</TableHead>
                    <TableHead className="text-muted-foreground">POS / Tienda</TableHead>
                    <TableHead className="text-muted-foreground">Categoría</TableHead>
                    <TableHead className="text-muted-foreground">Resultado</TableHead>
                    <TableHead className="text-muted-foreground w-[80px]">Evidencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id} className="data-row">
                      <TableCell className="font-mono text-xs">
                        {format(new Date(event.timestamp), 'dd/MM/yy HH:mm:ss', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{event.userName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{event.ipAddress}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {event.action}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                            {event.details}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.posName ? (
                          <div className="text-xs">
                            <p className="font-medium">{event.posName}</p>
                            <p className="text-muted-foreground">{event.storeName}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.category ? (
                          <CategoryBadge category={event.category} size="sm" />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.result === 'success' ? (
                          <Badge className="gap-1 bg-status-success/15 text-status-success border-status-success/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Éxito
                          </Badge>
                        ) : (
                          <Badge className="gap-1 bg-status-error/15 text-status-error border-status-error/30">
                            <XCircle className="w-3 h-3" />
                            Fallo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                          className="h-7 px-2 text-xs"
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {filteredEvents.length} de {mockAuditEventsV2.length} registros
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Siguiente
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Timeline View */}
          <TabsContent value="timeline">
            <div className="bg-card border border-border rounded-lg p-6">
              <ActionTimeline events={mockTimelineEvents} showEvidence />
            </div>
          </TabsContent>
        </Tabs>

        {/* Evidence Dialog */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Evidencia del Evento
              </DialogTitle>
            </DialogHeader>
            
            {selectedEvent && (
              <div className="space-y-4">
                {/* Event Summary */}
                <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Timestamp:</span>
                    <span className="font-mono">
                      {format(new Date(selectedEvent.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Usuario:</span>
                    <span>{selectedEvent.userName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Acción:</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {selectedEvent.action}
                    </Badge>
                  </div>
                  {selectedEvent.posName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">POS:</span>
                      <span>{selectedEvent.posName}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Resultado:</span>
                    {selectedEvent.result === 'success' ? (
                      <Badge className="gap-1 bg-status-success/15 text-status-success border-status-success/30">
                        Éxito
                      </Badge>
                    ) : (
                      <Badge className="gap-1 bg-status-error/15 text-status-error border-status-error/30">
                        Fallo
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Evidence Panel */}
                <EvidencePanel evidence={selectedEvent.evidence} />

                {/* Details */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Detalles:</p>
                  <p className="text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3">
                    {selectedEvent.details}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
