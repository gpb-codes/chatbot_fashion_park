import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { mockExecutionsV2 } from '@/data/mockOperationsData';
import { ActionCard } from '@/components/operations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  User, 
  Globe,
  RefreshCw,
  Zap
} from 'lucide-react';
import type { ActionLifecycleStatus } from '@/types/actions';
import { toast } from 'sonner';

export default function MyActionsPage() {
  const [statusFilter, setStatusFilter] = useState<ActionLifecycleStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter my actions (simulated - would come from auth context)
  const myActions = mockExecutionsV2.filter(e => e.requestedBy === 'Carlos Mendoza');
  const allActions = mockExecutionsV2;

  const filteredMyActions = myActions.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        e.actionName.toLowerCase().includes(query) ||
        e.actionId.toLowerCase().includes(query) ||
        e.posName.toLowerCase().includes(query) ||
        e.storeName.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const filteredAllActions = allActions.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        e.actionName.toLowerCase().includes(query) ||
        e.actionId.toLowerCase().includes(query) ||
        e.posName.toLowerCase().includes(query) ||
        e.storeName.toLowerCase().includes(query) ||
        e.requestedBy.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleRetry = (id: string) => {
    toast.info('Reintentando acción', { description: `ID: ${id}` });
  };

  const handleEscalate = (id: string) => {
    toast.info('Escalando incidente', { description: `ID: ${id}` });
  };

  const handleViewDetails = (id: string) => {
    toast.info('Ver detalles', { description: `ID: ${id}` });
  };

  // Count by status
  const statusCounts = {
    pending: allActions.filter(e => e.status === 'pending_approval' || e.status === 'queued').length,
    inProgress: allActions.filter(e => e.status === 'in_progress').length,
    completed: allActions.filter(e => e.status === 'success').length,
    failed: allActions.filter(e => e.status === 'failed' || e.status === 'blocked').length,
  };

  return (
    <MainLayout 
      title="Mis Acciones" 
      subtitle="Seguimiento de acciones solicitadas y del sistema"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="text-2xl font-semibold text-status-pending">{statusCounts.pending}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">En Progreso</p>
            <p className="text-2xl font-semibold text-status-warning">{statusCounts.inProgress}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Completadas</p>
            <p className="text-2xl font-semibold text-status-success">{statusCounts.completed}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Fallidas/Bloqueadas</p>
            <p className="text-2xl font-semibold text-status-error">{statusCounts.failed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar acciones..." 
                className="pl-9 bg-secondary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ActionLifecycleStatus | 'all')}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending_approval">Pendiente Aprobación</SelectItem>
                <SelectItem value="queued">En Cola</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="success">Exitoso</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="my" className="space-y-4">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="my" className="gap-2">
              <User className="w-4 h-4" />
              Mis Acciones
              <Badge variant="secondary" className="ml-1">{myActions.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Globe className="w-4 h-4" />
              Sistema
              <Badge variant="secondary" className="ml-1">{allActions.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* My Actions */}
          <TabsContent value="my" className="space-y-4">
            {filteredMyActions.length > 0 ? (
              filteredMyActions.map(execution => (
                <ActionCard
                  key={execution.id}
                  execution={execution}
                  onRetry={handleRetry}
                  onEscalate={handleEscalate}
                  onViewDetails={handleViewDetails}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No tienes acciones que coincidan con los filtros
                </p>
              </div>
            )}
          </TabsContent>

          {/* All System Actions */}
          <TabsContent value="all" className="space-y-4">
            {filteredAllActions.length > 0 ? (
              filteredAllActions.map(execution => (
                <ActionCard
                  key={execution.id}
                  execution={execution}
                  onRetry={handleRetry}
                  onEscalate={handleEscalate}
                  onViewDetails={handleViewDetails}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No hay acciones que coincidan con los filtros
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
