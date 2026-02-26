import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/types';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

const riskConfig = {
  low: { label: 'Bajo', class: 'risk-low' },
  medium: { label: 'Medio', class: 'risk-medium' },
  high: { label: 'Alto', class: 'risk-high' },
  critical: { label: 'Crítico', class: 'risk-critical' },
};

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const config = riskConfig[level];

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
      config.class,
      className
    )}>
      {config.label}
    </span>
  );
}
