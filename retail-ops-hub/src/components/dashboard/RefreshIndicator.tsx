import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RefreshIndicatorProps {
  isRefreshing: boolean;
  lastUpdated: Date | null;
  onRefresh?: () => void;
  className?: string;
}

export function RefreshIndicator({ 
  isRefreshing, 
  lastUpdated, 
  onRefresh,
  className 
}: RefreshIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-1.5 hover:text-foreground transition-colors disabled:opacity-50"
      >
        <RefreshCw className={cn(
          "w-3.5 h-3.5",
          isRefreshing && "animate-spin text-primary"
        )} />
        {isRefreshing ? (
          <span className="text-primary">Actualizando...</span>
        ) : (
          <span>Actualizar</span>
        )}
      </button>
      {lastUpdated && !isRefreshing && (
        <>
          <span className="text-border">•</span>
          <span>
            Última actualización: {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: es })}
          </span>
        </>
      )}
    </div>
  );
}
