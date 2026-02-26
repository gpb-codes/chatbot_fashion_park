import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useActionRequests, useCommandExecutions } from '@/hooks/useCommandData';
import { useStoresData } from '@/hooks/useStoresData';
import { ApprovalStatusBadge, PriorityBadge } from '@/components/commands/CommandStatusBadge';
import { ApprovalFiltersBar, defaultApprovalFilters, type ApprovalFilters } from '@/components/commands/ApprovalFilters';
import { TablePagination } from '@/components/ui/table-pagination';
import { RiskBadge } from '@/components/dashboard/RiskBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Shield,
  Loader2,
  Eye,
  Play
} from 'lucide-react';
import { formatDistanceToNow, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { currentUser } from '@/data/mockData';
import type { ActionRequest, CommandType } from '@/types/commands';

export default function ApprovalsPage() {
  const { requests, pendingRequests, approveRequest, rejectRequest, isLoading } = useActionRequests();
  const { executeCommand } = useCommandExecutions();
  const { stores, posTerminals } = useStoresData();
  
  const [selectedRequest, setSelectedRequest] = useState<ActionRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filters, setFilters] = useState<ApprovalFilters>(defaultApprovalFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getStoreName = (storeId: string) => stores.find(s => s.id === storeId)?.name || storeId;
  const getPosName = (posId: string) => posTerminals.find(p => p.id === posId)?.name || posId;

  const handleApprove = async (request: ActionRequest) => {
    setIsProcessing(true);
    try {
      await approveRequest(request.id, {
        user_id: currentUser.id,
        user_name: currentUser.name,
        role: 'admin',
      });
      
      toast.success('Solicitud aprobada', {
        description: `${request.command} en ${getPosName(request.target.pos_id)}`,
      });

      // If preconditions are met, auto-execute
      if (request.preconditions_met) {
        const role = request.requested_by.role === 'auditor' ? 'operator' : request.requested_by.role;
        await executeCommand(
          request.command as CommandType,
          request.target.pos_id,
          {
            user_id: request.requested_by.user_id,
            user_name: request.requested_by.user_name,
            role,
          }
        );
        toast.success('Comando enviado para ejecución');
      }

      setShowDetailDialog(false);
    } catch (error) {
      toast.error('Error al aprobar', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;

    setIsProcessing(true);
    try {
      await rejectRequest(selectedRequest.id, rejectReason, {
        user_id: currentUser.id,
        user_name: currentUser.name,
        role: 'admin',
      });
      
      toast.success('Solicitud rechazada', {
        description: selectedRequest.command,
      });

      setShowRejectDialog(false);
      setShowDetailDialog(false);
      setRejectReason('');
    } catch (error) {
      toast.error('Error al rechazar');
    } finally {
      setIsProcessing(false);
    }
  };

  const openDetail = (request: ActionRequest) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);
  };

  const openRejectDialog = (request: ActionRequest) => {
    setSelectedRequest(request);
    setRejectReason('');
    setShowRejectDialog(true);
  };

  // Helper function to filter requests
  const filterRequests = (requestsToFilter: ActionRequest[]) => {
    return requestsToFilter.filter(req => {
      // Text search
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch = (
          req.command.toLowerCase().includes(query) ||
          req.target.pos_id.toLowerCase().includes(query) ||
          req.requested_by.user_name.toLowerCase().includes(query) ||
          getStoreName(req.target.store_id).toLowerCase().includes(query)
        );
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const reqDate = new Date(req.requested_at);
        const from = filters.dateFrom ? startOfDay(filters.dateFrom) : new Date(0);
        const to = filters.dateTo ? endOfDay(filters.dateTo) : new Date();
        
        if (!isWithinInterval(reqDate, { start: from, end: to })) {
          return false;
        }
      }

      // Command filter
      if (filters.command && req.command !== filters.command) {
        return false;
      }

      // Priority filter
      if (filters.priority && req.priority !== filters.priority) {
        return false;
      }

      return true;
    });
  };

  // Filter requests by status and apply filters
  const filteredPending = useMemo(() => filterRequests(pendingRequests), [pendingRequests, filters]);
  const approvedRequests = useMemo(() => filterRequests(requests.filter(r => r.approval_status === 'approved')), [requests, filters]);
  const rejectedRequests = useMemo(() => filterRequests(requests.filter(r => r.approval_status === 'rejected')), [requests, filters]);

  // Pagination for pending requests
  const totalPages = Math.ceil(filteredPending.length / pageSize);
  const paginatedPending = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPending.slice(start, start + pageSize);
  }, [filteredPending, currentPage, pageSize]);

  const handleFiltersChange = (newFilters: ApprovalFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(defaultApprovalFilters);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <MainLayout title="Cola de Aprobación" subtitle="Cargando...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Cola de Aprobación" 
      subtitle="Gestión de solicitudes de acciones que requieren autorización"
    >
      <div className="space-y-6 animate-fade-in">
        {/* RBAC Info Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Control de Acceso Basado en Roles</p>
            <p className="text-sm text-muted-foreground mt-1">
              Las acciones de alto riesgo requieren aprobación de un administrador. 
              Rol actual: <Badge variant="secondary" className="ml-1">{currentUser.role}</Badge>
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-status-warning">{filteredPending.length}</p>
              </div>
              <Clock className="w-8 h-8 text-status-warning" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprobadas Hoy</p>
                <p className="text-2xl font-bold text-status-success">{approvedRequests.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-status-success" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rechazadas</p>
                <p className="text-2xl font-bold text-status-error">{rejectedRequests.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-status-error" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <ApprovalFiltersBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={clearFilters}
        />

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pendientes
              {filteredPending.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {filteredPending.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Aprobadas
              {approvedRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {approvedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="w-4 h-4" />
              Rechazadas
              {rejectedRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {rejectedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending">
            <div className="bg-card border border-border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Comando</TableHead>
                    <TableHead className="text-muted-foreground">POS / Tienda</TableHead>
                    <TableHead className="text-muted-foreground">Solicitante</TableHead>
                    <TableHead className="text-muted-foreground">Prioridad</TableHead>
                    <TableHead className="text-muted-foreground">Tiempo</TableHead>
                    <TableHead className="text-muted-foreground">Precondiciones</TableHead>
                    <TableHead className="text-muted-foreground text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPending.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {filteredPending.length === 0 && filters.searchQuery ? 
                          'No se encontraron solicitudes con los filtros actuales' :
                          'No hay solicitudes pendientes de aprobación'
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPending.map((request) => (
                      <TableRow key={request.id} className="data-row">
                        <TableCell>
                          <div>
                            <code className="text-xs text-primary font-mono">{request.command}</code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{getPosName(request.target.pos_id)}</p>
                            <p className="text-xs text-muted-foreground">{getStoreName(request.target.store_id)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{request.requested_by.user_name}</p>
                            <Badge variant="outline" className="text-[10px]">{request.requested_by.role}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={request.priority} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true, locale: es })}
                        </TableCell>
                        <TableCell>
                          {request.preconditions_met ? (
                            <Badge className="gap-1 bg-status-success/15 text-status-success border-status-success/30 text-xs">
                              <CheckCircle2 className="w-3 h-3" />
                              OK
                            </Badge>
                          ) : (
                            <Badge className="gap-1 bg-status-warning/15 text-status-warning border-status-warning/30 text-xs">
                              <AlertTriangle className="w-3 h-3" />
                              Revisar
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openDetail(request)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-status-error hover:text-status-error hover:bg-status-error/10"
                              onClick={() => openRejectDialog(request)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm"
                              className="gap-1"
                              onClick={() => handleApprove(request)}
                              disabled={isProcessing}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Aprobar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination for pending */}
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredPending.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          </TabsContent>

          {/* Approved Tab */}
          <TabsContent value="approved">
            <div className="bg-card border border-border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Comando</TableHead>
                    <TableHead className="text-muted-foreground">POS / Tienda</TableHead>
                    <TableHead className="text-muted-foreground">Solicitante</TableHead>
                    <TableHead className="text-muted-foreground">Aprobado por</TableHead>
                    <TableHead className="text-muted-foreground">Fecha Aprobación</TableHead>
                    <TableHead className="text-muted-foreground">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay solicitudes aprobadas
                      </TableCell>
                    </TableRow>
                  ) : (
                    approvedRequests.map((request) => (
                      <TableRow key={request.id} className="data-row">
                        <TableCell>
                          <code className="text-xs text-primary font-mono">{request.command}</code>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{getPosName(request.target.pos_id)}</p>
                            <p className="text-xs text-muted-foreground">{getStoreName(request.target.store_id)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{request.requested_by.user_name}</TableCell>
                        <TableCell className="text-sm">{request.approved_by?.user_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {request.approved_at && format(new Date(request.approved_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </TableCell>
                        <TableCell>
                          <ApprovalStatusBadge status={request.approval_status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Rejected Tab */}
          <TabsContent value="rejected">
            <div className="bg-card border border-border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Comando</TableHead>
                    <TableHead className="text-muted-foreground">POS / Tienda</TableHead>
                    <TableHead className="text-muted-foreground">Solicitante</TableHead>
                    <TableHead className="text-muted-foreground">Rechazado por</TableHead>
                    <TableHead className="text-muted-foreground">Motivo</TableHead>
                    <TableHead className="text-muted-foreground">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay solicitudes rechazadas
                      </TableCell>
                    </TableRow>
                  ) : (
                    rejectedRequests.map((request) => (
                      <TableRow key={request.id} className="data-row">
                        <TableCell>
                          <code className="text-xs text-primary font-mono">{request.command}</code>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{getPosName(request.target.pos_id)}</p>
                            <p className="text-xs text-muted-foreground">{getStoreName(request.target.store_id)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{request.requested_by.user_name}</TableCell>
                        <TableCell className="text-sm">{request.approved_by?.user_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {request.rejection_reason}
                        </TableCell>
                        <TableCell>
                          <ApprovalStatusBadge status={request.approval_status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalle de Solicitud</DialogTitle>
              <DialogDescription>
                Revise los detalles antes de aprobar o rechazar.
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4 py-4">
                <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Comando:</span>
                    <code className="text-primary font-mono">{selectedRequest.command}</code>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">POS:</span>
                    <span>{getPosName(selectedRequest.target.pos_id)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tienda:</span>
                    <span>{getStoreName(selectedRequest.target.store_id)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Solicitante:</span>
                    <span>{selectedRequest.requested_by.user_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Prioridad:</span>
                    <PriorityBadge priority={selectedRequest.priority} />
                  </div>
                </div>

                {/* Preconditions */}
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">Precondiciones</h4>
                  <ul className="space-y-1">
                    {selectedRequest.precondition_details?.map((detail, idx) => (
                      <li key={idx} className="text-sm">{detail}</li>
                    ))}
                  </ul>
                </div>

                {/* Notes */}
                {selectedRequest.notes && (
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2">Notas del Solicitante</h4>
                    <p className="text-sm text-muted-foreground">{selectedRequest.notes}</p>
                  </div>
                )}

                {!selectedRequest.preconditions_met && (
                  <div className="flex items-start gap-2 p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-status-warning mt-0.5" />
                    <p className="text-sm text-status-warning">
                      Las precondiciones no están cumplidas. El comando podría ser bloqueado por el agente.
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Cerrar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  setShowDetailDialog(false);
                  if (selectedRequest) openRejectDialog(selectedRequest);
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
              <Button 
                onClick={() => selectedRequest && handleApprove(selectedRequest)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Aprobar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-status-error">
                <XCircle className="w-5 h-5" />
                Rechazar Solicitud
              </DialogTitle>
              <DialogDescription>
                Proporcione un motivo para el rechazo. Esta información será visible para el solicitante.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motivo del rechazo..."
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim() || isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Confirmar Rechazo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
