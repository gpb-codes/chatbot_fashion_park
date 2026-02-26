import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { exportToCSV, exportToPDF } from '@/lib/exportAudit';
import { useToast } from '@/hooks/use-toast';
import type { CommandExecution } from '@/types/commands';
import type { HistoryFilters } from './CommandHistoryFilters';

interface ExportAuditButtonProps {
  executions: CommandExecution[];
  filters?: HistoryFilters;
  disabled?: boolean;
}

export function ExportAuditButton({ 
  executions, 
  filters,
  disabled = false 
}: ExportAuditButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportCSV = async () => {
    if (executions.length === 0) {
      toast({
        title: 'Sin datos',
        description: 'No hay registros para exportar',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      // Small delay for UX feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      exportToCSV(executions, {
        filename: 'auditoria-comandos',
      });

      toast({
        title: 'Exportación CSV exitosa',
        description: `Se exportaron ${executions.length} registros`,
      });
    } catch (error) {
      toast({
        title: 'Error de exportación',
        description: 'No se pudo generar el archivo CSV',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (executions.length === 0) {
      toast({
        title: 'Sin datos',
        description: 'No hay registros para exportar',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      // Small delay for UX feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      exportToPDF(executions, {
        title: 'Reporte de Auditoría de Comandos',
        subtitle: 'Plataforma de Automatización POS Gobernada',
        filename: 'auditoria-comandos',
        dateRange: {
          from: filters?.dateFrom,
          to: filters?.dateTo,
        },
      });

      toast({
        title: 'Exportación PDF exitosa',
        description: `Se exportaron ${executions.length} registros`,
      });
    } catch (error) {
      toast({
        title: 'Error de exportación',
        description: 'No se pudo generar el archivo PDF',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled || isExporting || executions.length === 0}
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 mr-2 text-status-success" />
          Exportar a CSV
          <span className="ml-auto text-xs text-muted-foreground">Excel</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2 text-destructive" />
          Exportar a PDF
          <span className="ml-auto text-xs text-muted-foreground">Auditoría</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
