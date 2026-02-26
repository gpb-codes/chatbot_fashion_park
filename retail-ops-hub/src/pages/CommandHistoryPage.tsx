import { useState, useMemo, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCommandExecutions, useActionAudit } from '@/hooks/useCommandData';
import { useStoresData } from '@/hooks/useStoresData';
import { ExecutionStatusBadge, ResultStatusBadge } from '@/components/commands/CommandStatusBadge';
import { CommandHistoryFilters, defaultFilters, type HistoryFilters } from '@/components/commands/CommandHistoryFilters';
import { ExportAuditButton } from '@/components/commands/ExportAuditButton';
import { TablePagination } from '@/components/ui/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  Ban,
  Loader2,
  FileJson,
  Activity,
  Download
} from 'lucide-react';
import { formatDistanceToNow, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { exportExecutionDetailToPDF } from '@/lib/exportAudit';
import { useToast } from '@/hooks/use-toast';
import type { CommandExecution } from '@/types/commands';

export default function CommandHistoryPage() {
  const { executions, isLoading } = useCommandExecutions();
  const { auditLogs, getLogsByCorrelationId } = useActionAudit();
  const { stores, posTerminals } = useStoresData();
  const { toast } = useToast();
  
  const [selectedExecution, setSelectedExecution] = useState<CommandExecution | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<HistoryFilters>(defaultFilters);

  const getStoreName = useCallback((storeId: string) => 
    stores.find(s => s.id === storeId)?.name || storeId, [stores]);
  const getPosName = useCallback((posId: string) => 
    posTerminals.find(p => p.id === posId)?.name || posId, [posTerminals]);

  const openDetail = (execution: CommandExecution) => {
    setSelectedExecution(execution);
    setShowDetailDialog(true);
  };

  const handleExportDetail = (execution: CommandExecution) => {
    try {
      exportExecutionDetailToPDF(execution, getStoreName, getPosName);
      toast({
        title: 'Evidencia exportada',
        description: `Se generó el PDF de evidencia para ${execution.command_message.command}`,
      });
    } catch (error) {
      toast({
        title: 'Error de exportación',
        description: 'No se pudo generar el archivo PDF',
        variant: 'destructive',
      });
    }
  };

  // Filter executions based on search and filters
  const filteredExecutions = useMemo(() => {
    return executions.filter(exec => {
      // Text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
          exec.command_message.command.toLowerCase().includes(query) ||
          exec.command_message.target.pos_id.toLowerCase().includes(query) ||
          exec.command_message.correlation_id.toLowerCase().includes(query) ||
          exec.status.toLowerCase().includes(query)
        );
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const execDate = new Date(exec.created_at);
        const from = filters.dateFrom ? startOfDay(filters.dateFrom) : new Date(0);
        const to = filters.dateTo ? endOfDay(filters.dateTo) : new Date();
        
        if (!isWithinInterval(execDate, { start: from, end: to })) {
          return false;
        }
      }

      // Command filter
      if (filters.command && exec.command_message.command !== filters.command) {
        return false;
      }

      // Status filter
      if (filters.status && exec.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [executions, searchQuery, filters]);

  const clearFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1); // Reset pagination when clearing filters
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 when filters change
  const handleFiltersChange = (newFilters: HistoryFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredExecutions.length / pageSize);
  const paginatedExecutions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredExecutions.slice(start, end);
  }, [filteredExecutions, currentPage, pageSize]);

  // Reset page if it exceeds total pages
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Stats based on filtered results
  const stats = useMemo(() => ({
    total: filteredExecutions.length,
    completed: filteredExecutions.filter(e => e.status === 'completed').length,
    failed: filteredExecutions.filter(e => e.status === 'failed').length,
    blocked: filteredExecutions.filter(e => e.status === 'blocked').length,
  }), [filteredExecutions]);

  if (isLoading) {
    return (
      <MainLayout title="Historial de Comandos" subtitle="Cargando...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Historial de Comandos" 
      subtitle="Trazabilidad end-to-end de comandos ejecutados"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Comandos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completados</p>
                <p className="text-2xl font-bold text-status-success">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-status-success" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fallidos</p>
                <p className="text-2xl font-bold text-status-error">{stats.failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-status-error" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bloqueados</p>
                <p className="text-2xl font-bold text-status-warning">{stats.blocked}</p>
              </div>
              <Ban className="w-8 h-8 text-status-warning" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por comando, POS, correlation_id..." 
                className="pl-9 bg-secondary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <CommandHistoryFilters 
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={clearFilters}
            />
            <ExportAuditButton 
              executions={filteredExecutions}
              filters={filters}
            />
          </div>
        </div>

        {/* Executions Table */}
        <div className="bg-card border border-border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground">Comando</TableHead>
                <TableHead className="text-muted-foreground">POS / Tienda</TableHead>
                <TableHead className="text-muted-foreground">Ejecutado por</TableHead>
                <TableHead className="text-muted-foreground">Correlation ID</TableHead>
                <TableHead className="text-muted-foreground">Tiempo</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-muted-foreground">Resultado</TableHead>
                <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedExecutions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No se encontraron comandos
                  </TableCell>
                </TableRow>
              ) : (
                paginatedExecutions.map((execution) => (
                  <TableRow key={execution.id} className="data-row">
                    <TableCell>
                      <code className="text-xs text-primary font-mono">
                        {execution.command_message.command}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {getPosName(execution.command_message.target.pos_id)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getStoreName(execution.command_message.target.store_id)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {execution.command_message.issued_by.user_name}
                    </TableCell>
                    <TableCell>
                      <code className="text-[10px] text-muted-foreground font-mono">
                        {execution.command_message.correlation_id.substring(0, 20)}...
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(execution.created_at), { addSuffix: true, locale: es })}
                    </TableCell>
                    <TableCell>
                      <ExecutionStatusBadge status={execution.status} />
                    </TableCell>
                    <TableCell>
                      {execution.result_message && (
                        <ResultStatusBadge status={execution.result_message.status} />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openDetail(execution)}
                        >
                          <FileJson className="w-4 h-4 mr-1" />
                          Detalle
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleExportDetail(execution)}
                          title="Exportar evidencia PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredExecutions.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-primary" />
                Detalle de Ejecución
              </DialogTitle>
              <DialogDescription>
                Información completa del comando y su resultado
              </DialogDescription>
            </DialogHeader>

            {selectedExecution && (
              <div className="space-y-6 py-4">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                  <div>
                    <span className="text-xs text-muted-foreground">Comando</span>
                    <code className="block text-sm text-primary font-mono mt-1">
                      {selectedExecution.command_message.command}
                    </code>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Estado</span>
                    <div className="mt-1">
                      <ExecutionStatusBadge status={selectedExecution.status} />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">POS</span>
                    <p className="text-sm mt-1">
                      {getPosName(selectedExecution.command_message.target.pos_id)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Tienda</span>
                    <p className="text-sm mt-1">
                      {getStoreName(selectedExecution.command_message.target.store_id)}
                    </p>
                  </div>
                </div>

                {/* Correlation & Tracing */}
                <div className="p-4 bg-secondary/30 rounded-lg space-y-3">
                  <h4 className="text-sm font-medium">Trazabilidad</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">message_id:</span>
                      <code className="text-xs font-mono">{selectedExecution.command_message.message_id}</code>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">correlation_id:</span>
                      <code className="text-xs font-mono">{selectedExecution.command_message.correlation_id}</code>
                    </div>
                    {selectedExecution.result_message?.details.trace_id && (
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground">trace_id (OTel):</span>
                        <a 
                          href="#" 
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {selectedExecution.result_message.details.trace_id}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-4 bg-secondary/30 rounded-lg space-y-3">
                  <h4 className="text-sm font-medium">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-muted" />
                      <span className="text-muted-foreground">Creado:</span>
                      <span>{format(new Date(selectedExecution.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })}</span>
                    </div>
                    {selectedExecution.sent_at && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-muted-foreground">Enviado:</span>
                        <span>{format(new Date(selectedExecution.sent_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })}</span>
                      </div>
                    )}
                    {selectedExecution.acknowledged_at && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-muted-foreground">Recibido:</span>
                        <span>{format(new Date(selectedExecution.acknowledged_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })}</span>
                      </div>
                    )}
                    {selectedExecution.completed_at && (
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          selectedExecution.status === 'completed' ? "bg-status-success" :
                          selectedExecution.status === 'failed' ? "bg-status-error" : "bg-status-warning"
                        )} />
                        <span className="text-muted-foreground">Finalizado:</span>
                        <span>{format(new Date(selectedExecution.completed_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Result Details */}
                {selectedExecution.result_message && (
                  <div className="p-4 bg-secondary/30 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Resultado</h4>
                      <ResultStatusBadge status={selectedExecution.result_message.status} />
                    </div>
                    <div className="space-y-2 text-sm">
                      {selectedExecution.result_message.details.execution_time_ms && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tiempo de ejecución:</span>
                          <span>{selectedExecution.result_message.details.execution_time_ms} ms</span>
                        </div>
                      )}
                      {selectedExecution.result_message.details.service_state && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estado del servicio:</span>
                          <Badge variant="outline" className="text-xs">
                            {selectedExecution.result_message.details.service_state}
                          </Badge>
                        </div>
                      )}
                      {selectedExecution.result_message.details.error_code && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Código de error:</span>
                          <code className="text-xs text-status-error">
                            {selectedExecution.result_message.details.error_code}
                          </code>
                        </div>
                      )}
                      {selectedExecution.result_message.details.error_message && (
                        <div>
                          <span className="text-muted-foreground">Mensaje de error:</span>
                          <p className="text-sm text-status-error mt-1">
                            {selectedExecution.result_message.details.error_message}
                          </p>
                        </div>
                      )}
                      {selectedExecution.result_message.details.block_reason && (
                        <div>
                          <span className="text-muted-foreground">Razón de bloqueo:</span>
                          <p className="text-sm text-status-warning mt-1">
                            {selectedExecution.result_message.details.block_reason}
                          </p>
                        </div>
                      )}
                      {selectedExecution.result_message.details.precondition_failed && (
                        <div>
                          <span className="text-muted-foreground">Precondición fallida:</span>
                          <p className="text-sm text-status-warning mt-1">
                            {selectedExecution.result_message.details.precondition_failed}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Command JSON */}
                <div className="p-4 bg-secondary/30 rounded-lg space-y-3">
                  <h4 className="text-sm font-medium">Mensaje COMMAND (JSON)</h4>
                  <pre className="text-xs font-mono bg-background p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedExecution.command_message, null, 2)}
                  </pre>
                </div>

                {/* Result JSON */}
                {selectedExecution.result_message && (
                  <div className="p-4 bg-secondary/30 rounded-lg space-y-3">
                    <h4 className="text-sm font-medium">Mensaje RESULT (JSON)</h4>
                    <pre className="text-xs font-mono bg-background p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedExecution.result_message, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
