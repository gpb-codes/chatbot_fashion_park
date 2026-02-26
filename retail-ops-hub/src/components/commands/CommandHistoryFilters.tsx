import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { COMMAND_CATALOG } from '@/types/commands';

export interface HistoryFilters {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  command: string | undefined;
  status: string | undefined;
}

interface CommandHistoryFiltersProps {
  filters: HistoryFilters;
  onFiltersChange: (filters: HistoryFilters) => void;
  onClearFilters: () => void;
}

const EXECUTION_STATUSES = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'sent', label: 'Enviado' },
  { value: 'executing', label: 'Ejecutando' },
  { value: 'completed', label: 'Completado' },
  { value: 'failed', label: 'Fallido' },
  { value: 'blocked', label: 'Bloqueado' },
  { value: 'expired', label: 'Expirado' },
];

const COMMAND_OPTIONS = Object.entries(COMMAND_CATALOG).map(([key, value]) => ({
  value: value,
  label: key.replace(/_/g, ' '),
}));

export function CommandHistoryFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: CommandHistoryFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.command,
    filters.status,
  ].filter(Boolean).length;

  const updateFilter = <K extends keyof HistoryFilters>(
    key: K, 
    value: HistoryFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Toggle Button */}
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(activeFilterCount > 0 && "border-primary")}
      >
        <Filter className="w-4 h-4 mr-2" />
        Filtros
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-secondary/30 rounded-lg border border-border animate-fade-in">
          {/* Date From */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Desde</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-[150px] justify-start text-left font-normal",
                    !filters.dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? (
                    format(filters.dateFrom, "dd/MM/yyyy", { locale: es })
                  ) : (
                    <span>Fecha inicio</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => updateFilter('dateFrom', date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Hasta</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-[150px] justify-start text-left font-normal",
                    !filters.dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? (
                    format(filters.dateTo, "dd/MM/yyyy", { locale: es })
                  ) : (
                    <span>Fecha fin</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => updateFilter('dateTo', date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  locale={es}
                  disabled={(date) => 
                    filters.dateFrom ? date < filters.dateFrom : false
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Command Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Comando</span>
            <Select
              value={filters.command || "all"}
              onValueChange={(value) => 
                updateFilter('command', value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Todos los comandos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los comandos</SelectItem>
                {COMMAND_OPTIONS.map((cmd) => (
                  <SelectItem key={cmd.value} value={cmd.value}>
                    <code className="text-xs">{cmd.value}</code>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Estado</span>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => 
                updateFilter('status', value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {EXECUTION_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-transparent">Limpiar</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClearFilters}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary (when collapsed) */}
      {!isExpanded && activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.dateFrom && (
            <Badge variant="secondary" className="text-xs">
              Desde: {format(filters.dateFrom, "dd/MM/yyyy", { locale: es })}
              <button 
                onClick={() => updateFilter('dateFrom', undefined)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.dateTo && (
            <Badge variant="secondary" className="text-xs">
              Hasta: {format(filters.dateTo, "dd/MM/yyyy", { locale: es })}
              <button 
                onClick={() => updateFilter('dateTo', undefined)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.command && (
            <Badge variant="secondary" className="text-xs">
              Comando: {filters.command}
              <button 
                onClick={() => updateFilter('command', undefined)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="text-xs">
              Estado: {EXECUTION_STATUSES.find(s => s.value === filters.status)?.label}
              <button 
                onClick={() => updateFilter('status', undefined)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export const defaultFilters: HistoryFilters = {
  dateFrom: undefined,
  dateTo: undefined,
  command: undefined,
  status: undefined,
};
