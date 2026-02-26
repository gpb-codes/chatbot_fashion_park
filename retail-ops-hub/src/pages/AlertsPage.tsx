import { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Search,
  Filter,
  RefreshCw,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Bell,
  BellOff,
  ExternalLink,
  MoreHorizontal,
  X,
  Calendar
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { 
  useAlerts, 
  useAcknowledgeAlert, 
  useResolveAlert,
  useBulkAcknowledgeAlerts,
  useAlertCounts
} from '@/hooks/useAlertsData';
import type { Alert, AlertSeverity, AlertStatus } from '@/types/alerts';

const severityConfig: Record<AlertSeverity, { 
  icon: typeof AlertTriangle; 
  class: string;
  bgClass: string;
  label: string;
  priority: number;
}> = {
  critical: { 
    icon: AlertTriangle, 
    class: 'text-[hsl(var(--status-error))]',
    bgClass: 'bg-[hsl(var(--status-error)/0.1)] border-[hsl(var(--status-error)/0.3)]',
    label: 'Crítico',
    priority: 1
  },
  warning: { 
    icon: AlertCircle, 
    class: 'text-[hsl(var(--status-warning))]',
    bgClass: 'bg-[hsl(var(--status-warning)/0.1)] border-[hsl(var(--status-warning)/0.3)]',
    label: 'Advertencia',
    priority: 2
  },
  info: { 
    icon: Info, 
    class: 'text-[hsl(var(--status-pending))]',
    bgClass: 'bg-[hsl(var(--status-pending)/0.1)] border-[hsl(var(--status-pending)/0.3)]',
    label: 'Información',
    priority: 3
  },
};

const statusConfig: Record<AlertStatus, { label: string; class: string }> = {
  active: { 
    label: 'Activa', 
    class: 'bg-[hsl(var(--status-error)/0.15)] text-[hsl(var(--status-error))] border-[hsl(var(--status-error)/0.3)]' 
  },
  acknowledged: { 
    label: 'Reconocida', 
    class: 'bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.3)]' 
  },
  resolved: { 
    label: 'Resuelta', 
    class: 'bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))] border-[hsl(var(--status-success)/0.3)]' 
  },
};

const ITEMS_PER_PAGE = 10;

export default function AlertsPage() {
  // Filters state
  const [activeTab, setActiveTab] = useState<'all' | AlertStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  
  // Dialogs state
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [resolution, setResolution] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { toast } = useToast();
  const counts = useAlertCounts();
  
  // Build filters for API
  const statusFilter = activeTab === 'all' ? undefined : activeTab;
  const { data, isLoading, refetch, isRefetching } = useAlerts({
    status: statusFilter,
    severity: severityFilter !== 'all' ? severityFilter as AlertSeverity : undefined,
    startDate: dateRange.from?.toISOString(),
    endDate: dateRange.to?.toISOString(),
  });

  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();
  const bulkAcknowledge = useBulkAcknowledgeAlerts();

  // Filter and sort alerts
  const filteredAlerts = useMemo(() => {
    let alerts = data?.data ?? [];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      alerts = alerts.filter(alert => 
        alert.title.toLowerCase().includes(query) ||
        alert.message.toLowerCase().includes(query) ||
        alert.posName?.toLowerCase().includes(query) ||
        alert.storeName?.toLowerCase().includes(query)
      );
    }
    
    // Sort by severity priority, then by date
    return [...alerts].sort((a, b) => {
      const priorityDiff = severityConfig[a.severity].priority - severityConfig[b.severity].priority;
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [data?.data, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE);
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedAlerts.size === paginatedAlerts.length) {
      setSelectedAlerts(new Set());
    } else {
      setSelectedAlerts(new Set(paginatedAlerts.map(a => a.id)));
    }
  };

  const toggleSelectAlert = (id: string) => {
    const newSelection = new Set(selectedAlerts);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedAlerts(newSelection);
  };

  // Action handlers
  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert.mutateAsync({ id });
      toast({
        title: 'Alerta reconocida',
        description: 'La alerta ha sido marcada como reconocida.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo reconocer la alerta.',
        variant: 'destructive',
      });
    }
  };

  const handleResolve = (alert: Alert) => {
    setSelectedAlert(alert);
    setResolveDialogOpen(true);
  };

  const confirmResolve = async () => {
    if (!selectedAlert || !resolution.trim()) return;
    
    try {
      await resolveAlert.mutateAsync({ 
        id: selectedAlert.id, 
        request: { resolution: resolution.trim() } 
      });
      toast({
        title: 'Alerta resuelta',
        description: 'La alerta ha sido marcada como resuelta.',
      });
      setResolveDialogOpen(false);
      setResolution('');
      setSelectedAlert(null);
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo resolver la alerta.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAcknowledge = async () => {
    if (selectedAlerts.size === 0) return;
    
    try {
      await bulkAcknowledge.mutateAsync({
        alertIds: Array.from(selectedAlerts),
      });
      toast({
        title: 'Alertas reconocidas',
        description: `${selectedAlerts.size} alertas han sido reconocidas.`,
      });
      setSelectedAlerts(new Set());
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudieron reconocer las alertas.',
        variant: 'destructive',
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSeverityFilter('all');
    setDateRange({});
    setActiveTab('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || severityFilter !== 'all' || dateRange.from || dateRange.to;

  return (
    <MainLayout 
      title="Gestión de Alertas" 
      subtitle="Monitoreo y gestión de alertas del sistema"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            activeTab === 'active' && "ring-2 ring-primary"
          )} onClick={() => setActiveTab('active')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alertas Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-[hsl(var(--status-error))]">
                  {counts.active}
                </span>
                <AlertTriangle className="h-5 w-5 text-[hsl(var(--status-error))]" />
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            activeTab === 'acknowledged' && "ring-2 ring-primary"
          )} onClick={() => setActiveTab('acknowledged')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reconocidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-[hsl(var(--status-warning))]">
                  {counts.acknowledged}
                </span>
                <Check className="h-5 w-5 text-[hsl(var(--status-warning))]" />
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            activeTab === 'resolved' && "ring-2 ring-primary"
          )} onClick={() => setActiveTab('resolved')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resueltas (Hoy)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-[hsl(var(--status-success))]">
                  {counts.resolved}
                </span>
                <CheckCheck className="h-5 w-5 text-[hsl(var(--status-success))]" />
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            activeTab === 'all' && "ring-2 ring-primary"
          )} onClick={() => setActiveTab('all')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Críticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-[hsl(var(--risk-critical))]">
                  {counts.critical}
                </span>
                <AlertTriangle className="h-5 w-5 text-[hsl(var(--risk-critical))]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Top row: Search and actions */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-1 gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por título, mensaje, POS..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(showFilters && "bg-accent")}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedAlerts.size > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkAcknowledge}
                      disabled={bulkAcknowledge.isPending}
                    >
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Reconocer ({selectedAlerts.size})
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetch()}
                    disabled={isRefetching}
                  >
                    <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded filters */}
              {showFilters && (
                <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Severidad</Label>
                    <Select value={severityFilter} onValueChange={(v) => {
                      setSeverityFilter(v);
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="critical">Crítico</SelectItem>
                        <SelectItem value="warning">Advertencia</SelectItem>
                        <SelectItem value="info">Información</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Fecha desde</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-40 justify-start font-normal">
                          <Calendar className="h-4 w-4 mr-2" />
                          {dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Seleccionar'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Fecha hasta</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-40 justify-start font-normal">
                          <Calendar className="h-4 w-4 mr-2" />
                          {dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Seleccionar'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {hasActiveFilters && (
                    <div className="flex items-end">
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-1" />
                        Limpiar filtros
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Status tabs */}
              <Tabs value={activeTab} onValueChange={(v) => {
                setActiveTab(v as typeof activeTab);
                setCurrentPage(1);
              }}>
                <TabsList>
                  <TabsTrigger value="all" className="gap-2">
                    Todas
                    <Badge variant="secondary" className="text-xs">
                      {filteredAlerts.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="active" className="gap-2">
                    Activas
                    {counts.active > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {counts.active}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="acknowledged" className="gap-2">
                    Reconocidas
                  </TabsTrigger>
                  <TabsTrigger value="resolved" className="gap-2">
                    Resueltas
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : paginatedAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BellOff className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No se encontraron alertas</p>
                <p className="text-sm">
                  {hasActiveFilters 
                    ? 'Intenta ajustar los filtros de búsqueda' 
                    : 'No hay alertas en esta categoría'}
                </p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
                  <div className="col-span-1 flex items-center">
                    <Checkbox
                      checked={selectedAlerts.size === paginatedAlerts.length && paginatedAlerts.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </div>
                  <div className="col-span-1">Severidad</div>
                  <div className="col-span-3">Alerta</div>
                  <div className="col-span-2">Ubicación</div>
                  <div className="col-span-2">Estado</div>
                  <div className="col-span-2">Fecha</div>
                  <div className="col-span-1">Acciones</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-border">
                  {paginatedAlerts.map((alert) => {
                    const severity = severityConfig[alert.severity];
                    const status = statusConfig[alert.status];
                    const SeverityIcon = severity.icon;
                    const isSelected = selectedAlerts.has(alert.id);

                    return (
                      <div 
                        key={alert.id} 
                        className={cn(
                          "grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-accent/30 transition-colors",
                          isSelected && "bg-accent/20"
                        )}
                      >
                        <div className="col-span-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectAlert(alert.id)}
                          />
                        </div>
                        
                        <div className="col-span-1">
                          <div className={cn("p-1.5 rounded-md border w-fit", severity.bgClass)}>
                            <SeverityIcon className={cn("h-4 w-4", severity.class)} />
                          </div>
                        </div>
                        
                        <div className="col-span-3 min-w-0">
                          <p className="font-medium text-sm truncate">{alert.title}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {alert.message}
                          </p>
                        </div>
                        
                        <div className="col-span-2 min-w-0">
                          {alert.posName && (
                            <p className="text-sm truncate">{alert.posName}</p>
                          )}
                          {alert.storeName && (
                            <p className="text-xs text-muted-foreground truncate">
                              {alert.storeName}
                            </p>
                          )}
                        </div>
                        
                        <div className="col-span-2">
                          <Badge variant="outline" className={cn("text-xs", status.class)}>
                            {status.label}
                          </Badge>
                        </div>
                        
                        <div className="col-span-2">
                          <p className="text-sm">
                            {format(new Date(alert.createdAt), 'dd/MM/yyyy HH:mm')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: es })}
                          </p>
                        </div>
                        
                        <div className="col-span-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Ver detalles
                              </DropdownMenuItem>
                              {alert.status === 'active' && (
                                <DropdownMenuItem onClick={() => handleAcknowledge(alert.id)}>
                                  <Check className="h-4 w-4 mr-2" />
                                  Reconocer
                                </DropdownMenuItem>
                              )}
                              {alert.status !== 'resolved' && (
                                <DropdownMenuItem onClick={() => handleResolve(alert)}>
                                  <CheckCheck className="h-4 w-4 mr-2" />
                                  Resolver
                                </DropdownMenuItem>
                              )}
                              {alert.posId && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => window.location.href = `/stores/pos/${alert.posId}`}
                                  >
                                    Ir a POS
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredAlerts.length)} de {filteredAlerts.length} alertas
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let page: number;
                          if (totalPages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                          } else {
                            page = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              className="w-8"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Alerta</DialogTitle>
            <DialogDescription>
              Indica cómo se resolvió esta alerta para el registro de auditoría.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={severityConfig[selectedAlert.severity].class}>
                    {severityConfig[selectedAlert.severity].label}
                  </Badge>
                </div>
                <p className="text-sm font-medium">{selectedAlert.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedAlert.message}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolución *</Label>
                <Textarea
                  id="resolution"
                  placeholder="Describe cómo se resolvió el problema..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResolveDialogOpen(false);
                setResolution('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmResolve}
              disabled={!resolution.trim() || resolveAlert.isPending}
            >
              {resolveAlert.isPending ? 'Resolviendo...' : 'Resolver Alerta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
