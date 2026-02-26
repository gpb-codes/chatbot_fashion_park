import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Store, 
  PlayCircle, 
  Zap, 
  AlertTriangle, 
  Activity, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Bell
} from 'lucide-react';
import { currentUser } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAlertCounts } from '@/hooks/useAlertsData';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number | 'dynamic';
  badgeKey?: 'alerts';
  roles?: ('operator' | 'admin' | 'auditor')[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Tiendas y POS', href: '/stores', icon: Store },
  { label: 'Catálogo de Acciones', href: '/actions', icon: PlayCircle },
  { label: 'Solicitar Acción', href: '/request', icon: Zap, roles: ['operator', 'admin'] },
  { label: 'Mis Acciones', href: '/my-actions', icon: Activity },
  { label: 'Cola de Aprobación', href: '/approvals', icon: Shield, roles: ['admin'], badge: 2 },
  { label: 'Alertas', href: '/alerts', icon: Bell, badge: 'dynamic', badgeKey: 'alerts' },
  { label: 'Historial Comandos', href: '/history', icon: Activity },
  { label: 'Incidentes', href: '/incidents', icon: AlertTriangle },
  { label: 'Observabilidad', href: '/observability', icon: Activity },
  { label: 'Auditoría', href: '/audit', icon: FileText, roles: ['admin', 'auditor'] },
];

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'admin':
      return { label: 'Administrador', variant: 'default' as const };
    case 'operator':
      return { label: 'Operador', variant: 'secondary' as const };
    case 'auditor':
      return { label: 'Auditor', variant: 'outline' as const };
    default:
      return { label: role, variant: 'outline' as const };
  }
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const roleInfo = getRoleBadge(currentUser.role);
  const alertCounts = useAlertCounts();

  // Helper to get dynamic badge count
  const getBadgeCount = (item: NavItem): number | undefined => {
    if (item.badge === 'dynamic' && item.badgeKey === 'alerts') {
      return alertCounts.active > 0 ? alertCounts.active : undefined;
    }
    if (typeof item.badge === 'number') {
      return item.badge;
    }
    return undefined;
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">FashionPark</span>
              <span className="text-[10px] text-muted-foreground">Control Plane v2.0</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          const badgeCount = getBadgeCount(item);
          
          // Check role permissions
          if (item.roles && !item.roles.includes(currentUser.role)) {
            return null;
          }

          const navLink = (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive 
                  ? "bg-sidebar-accent text-primary" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {badgeCount !== undefined && badgeCount > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                      {badgeCount}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  {navLink}
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-2">
                  {item.label}
                  {badgeCount !== undefined && badgeCount > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                      {badgeCount}
                    </Badge>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          }

          return navLink;
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/30",
          collapsed && "justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {currentUser.name}
              </p>
              <Badge variant={roleInfo.variant} className="text-[10px] h-4 mt-0.5">
                {roleInfo.label}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center hover:bg-sidebar-accent transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-sidebar-foreground" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-sidebar-foreground" />
        )}
      </button>
    </aside>
  );
}
