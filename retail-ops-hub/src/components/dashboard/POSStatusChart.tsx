import { forwardRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { DashboardMetrics } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface POSStatusChartProps {
  metrics: DashboardMetrics | null;
  isLoading?: boolean;
  isRefreshing?: boolean;
}

export const POSStatusChart = forwardRef<HTMLDivElement, POSStatusChartProps>(
  function POSStatusChart({ metrics, isLoading, isRefreshing }, ref) {
    if (isLoading || !metrics) {
      return (
        <div ref={ref} className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
      );
    }

    const data = [
      { name: 'Online', value: metrics.onlinePOS, color: 'hsl(142, 71%, 45%)' },
      { name: 'Offline', value: metrics.offlinePOS, color: 'hsl(0, 72%, 51%)' },
    ];

    return (
      <div ref={ref} className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Estado de POS</h3>
          {isRefreshing && (
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(222, 47%, 10%)', 
                  border: '1px solid hsl(222, 30%, 18%)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(210, 20%, 95%)' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-2">
          <p className="text-2xl font-bold text-foreground">{metrics.totalPOS}</p>
          <p className="text-xs text-muted-foreground">Total POS</p>
        </div>
      </div>
    );
  }
);
