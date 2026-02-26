import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  variant = 'default',
  className 
}: MetricCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-status-success/30 glow-success',
    warning: 'border-status-warning/30',
    error: 'border-status-error/30 glow-error',
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend.value < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-status-success';
    if (trend.value < 0) return 'text-status-error';
    return 'text-muted-foreground';
  };

  return (
    <div className={cn(
      "metric-card border transition-all hover:scale-[1.02]",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs", getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
