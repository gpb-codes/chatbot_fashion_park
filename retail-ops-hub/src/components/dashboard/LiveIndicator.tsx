import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  isLive?: boolean;
  className?: string;
}

export function LiveIndicator({ isLive = true, className }: LiveIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex items-center justify-center">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isLive ? "bg-status-success" : "bg-muted-foreground"
        )} />
        {isLive && (
          <div className="absolute w-2 h-2 rounded-full bg-status-success animate-ping" />
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {isLive ? "En vivo" : "Pausado"}
      </span>
    </div>
  );
}
