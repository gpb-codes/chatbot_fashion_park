import { cn } from '@/lib/utils';
import type { ActionCategory } from '@/types/actions';
import { ACTION_CATEGORY_CONFIG } from '@/types/actions';
import { Eye, Search, Settings, AlertTriangle } from 'lucide-react';

interface CategoryBadgeProps {
  category: ActionCategory;
  showLabel?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Eye,
  Search,
  Settings,
  AlertTriangle,
};

export function CategoryBadge({ 
  category, 
  showLabel = true, 
  showIcon = true,
  size = 'md',
  className 
}: CategoryBadgeProps) {
  const config = ACTION_CATEGORY_CONFIG[category];
  const Icon = iconMap[config.icon];

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-medium border',
        config.colorClass,
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={`Categoría: ${config.label}`}
    >
      {showIcon && Icon && <Icon className={iconSizes[size]} />}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
