import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useStoresData } from '@/hooks/useStoresData';
import { StatusIndicator } from '@/components/dashboard/StatusIndicator';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChevronRight, 
  ChevronDown, 
  MapPin, 
  Monitor, 
  Wifi, 
  WifiOff,
  Server,
  Loader2,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function StoresPage() {
  const { regions, stores, posTerminals, isLoading, error, getStoresByRegion, getPOSByStore } = useStoresData();
  const [expandedRegions, setExpandedRegions] = useState<string[]>(['reg-rm']);
  const [expandedStores, setExpandedStores] = useState<string[]>([]);

  const toggleRegion = (regionId: string) => {
    setExpandedRegions(prev => 
      prev.includes(regionId) 
        ? prev.filter(id => id !== regionId)
        : [...prev, regionId]
    );
  };

  const toggleStore = (storeId: string) => {
    setExpandedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  if (isLoading) {
    return (
      <MainLayout title="Tiendas y POS" subtitle="Cargando...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Tiendas y POS" subtitle="Error al cargar datos">
        <div className="text-center py-12 text-status-error">
          {error.message}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Tiendas y POS" 
      subtitle="Gestión jerárquica de la red de puntos de venta"
    >
      <div className="space-y-4 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{regions.length}</p>
                <p className="text-sm text-muted-foreground">Regiones</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Server className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stores.length}</p>
                <p className="text-sm text-muted-foreground">Tiendas</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-success/10">
                <Wifi className="w-5 h-5 text-status-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {posTerminals.filter(p => p.status === 'online').length}
                </p>
                <p className="text-sm text-muted-foreground">POS Online</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-error/10">
                <WifiOff className="w-5 h-5 text-status-error" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {posTerminals.filter(p => p.status === 'offline').length}
                </p>
                <p className="text-sm text-muted-foreground">POS Offline</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hierarchy Tree */}
        <div className="bg-card border border-border rounded-lg">
          {regions.map((region) => (
            <Collapsible 
              key={region.id} 
              open={expandedRegions.includes(region.id)}
              onOpenChange={() => toggleRegion(region.id)}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30 border-b border-border transition-colors">
                  <div className="flex items-center gap-3">
                    {expandedRegions.includes(region.id) ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{region.name}</p>
                      <p className="text-xs text-muted-foreground">Código: {region.code}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{region.storeCount} tiendas</Badge>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                {getStoresByRegion(region.id).map((store) => (
                  <Collapsible 
                    key={store.id}
                    open={expandedStores.includes(store.id)}
                    onOpenChange={() => toggleStore(store.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 pl-12 cursor-pointer hover:bg-accent/20 border-b border-border/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {expandedStores.includes(store.id) ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <Server className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground">{store.name}</p>
                            <p className="text-xs text-muted-foreground">{store.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm">
                              <span className="text-status-success">{store.onlineCount}</span>
                              <span className="text-muted-foreground"> / {store.posCount}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">POS activos</p>
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="bg-secondary/20">
                        {getPOSByStore(store.id).map((pos) => (
                          <Link 
                            key={pos.id}
                            to={`/stores/pos/${pos.id}`}
                            className="flex items-center justify-between p-4 pl-20 border-b border-border/30 hover:bg-accent/10 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <Monitor className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                    {pos.name}
                                  </p>
                                  <StatusIndicator status={pos.status} size="sm" />
                                </div>
                                <p className="text-xs text-muted-foreground font-mono">{pos.ipAddress}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              {/* Services Status */}
                              <div className="flex gap-3">
                                {pos.services.map((service) => (
                                  <div key={service.id} className="text-center">
                                    <StatusIndicator 
                                      status={
                                        service.status === 'running' ? 'online' :
                                        service.status === 'error' ? 'error' : 'offline'
                                      } 
                                      size="sm" 
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {service.name}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              {/* Last Heartbeat */}
                              <div className="text-right min-w-[120px]">
                                <p className="text-xs text-muted-foreground">Último heartbeat</p>
                                <p className={cn(
                                  "text-xs",
                                  pos.status === 'offline' ? 'text-status-error' : 'text-foreground'
                                )}>
                                  {formatDistanceToNow(new Date(pos.lastHeartbeat), { addSuffix: true, locale: es })}
                                </p>
                              </div>
                              {/* Agent Version */}
                              <Badge variant="outline" className="font-mono text-[10px]">
                                v{pos.agentVersion}
                              </Badge>
                              {/* Arrow indicator */}
                              <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
