import { forwardRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { actionCatalog, posTerminals, stores } from '@/data/mockData';
import { ActionStatusBadge } from './ActionStatusBadge';
import type { ActionExecution } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentActionsTableProps {
  executions: ActionExecution[];
  isLoading?: boolean;
  isRefreshing?: boolean;
}

export const RecentActionsTable = forwardRef<HTMLDivElement, RecentActionsTableProps>(
  function RecentActionsTable({ executions, isLoading, isRefreshing }, ref) {
    const getActionName = (actionId: string) => {
      return actionCatalog.find(a => a.actionId === actionId)?.name || actionId;
    };

    const getPosInfo = (posId: string) => {
      const pos = posTerminals.find(p => p.id === posId);
      if (!pos) return { posName: posId, storeName: '' };
      const store = stores.find(s => s.id === pos.storeId);
      return { posName: pos.name, storeName: store?.name || '' };
    };

    if (isLoading) {
      return (
        <div ref={ref} className="rounded-lg border border-border bg-card">
          <div className="p-4 border-b border-border">
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Acciones Recientes</h3>
          {isRefreshing && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-muted-foreground">Actualizando...</span>
            </div>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground">Acción</TableHead>
              <TableHead className="text-muted-foreground">POS / Tienda</TableHead>
              <TableHead className="text-muted-foreground">Ejecutado por</TableHead>
              <TableHead className="text-muted-foreground">Tiempo</TableHead>
              <TableHead className="text-muted-foreground">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executions.slice(0, 5).map((exec) => {
              const { posName, storeName } = getPosInfo(exec.posId);
              return (
                <TableRow key={exec.id} className="data-row">
                  <TableCell>
                    <span className="font-mono text-xs text-primary">{exec.actionId}</span>
                    <p className="text-sm text-foreground">{getActionName(exec.actionId)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-foreground">{posName}</p>
                    <p className="text-xs text-muted-foreground">{storeName}</p>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">{exec.executedBy}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(exec.executedAt), { addSuffix: true, locale: es })}
                  </TableCell>
                  <TableCell>
                    <ActionStatusBadge status={exec.status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }
);
