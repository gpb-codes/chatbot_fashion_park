import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Eye, Check, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ThemeId } from '@/types/theme';

const iconMap = {
  Sun,
  Moon,
  Eye,
} as const;

export function ThemeSwitch() {
  const { currentTheme, theme, availableThemes, isChanging, setTheme } = useTheme();
  
  const CurrentIcon = iconMap[theme.icon];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-3 relative"
          aria-label={`Modo visual actual: ${theme.label}. Haz clic para cambiar.`}
          disabled={isChanging}
        >
          {isChanging ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <CurrentIcon className="w-4 h-4" aria-hidden="true" />
          )}
          <span className="hidden sm:inline text-sm">
            {isChanging ? 'Cambiando...' : theme.label}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Modo Visual</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableThemes.map((t) => {
          const Icon = iconMap[t.icon];
          const isActive = t.id === currentTheme;
          
          return (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setTheme(t.id as ThemeId)}
              className={cn(
                'flex items-start gap-3 py-3 cursor-pointer',
                isActive && 'bg-accent'
              )}
              aria-current={isActive ? 'true' : undefined}
              disabled={isChanging}
            >
              <Icon 
                className={cn(
                  'w-5 h-5 mt-0.5 flex-shrink-0',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )} 
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-medium text-sm',
                    isActive && 'text-primary'
                  )}>
                    {t.label}
                  </span>
                  {isActive && (
                    <Check className="w-4 h-4 text-primary" aria-label="Activo" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {t.description}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
