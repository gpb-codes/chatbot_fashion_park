import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CommandExecution } from '@/types/commands';

interface ExportOptions {
  title?: string;
  subtitle?: string;
  filename?: string;
  dateRange?: { from?: Date; to?: Date };
}

interface AuditRow {
  timestamp: string;
  command: string;
  posId: string;
  storeId: string;
  executedBy: string;
  role: string;
  status: string;
  result: string;
  correlationId: string;
  messageId: string;
}

/**
 * Transform executions to audit rows for export
 */
function transformToAuditRows(executions: CommandExecution[]): AuditRow[] {
  return executions.map(exec => ({
    timestamp: format(new Date(exec.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: es }),
    command: exec.command_message.command,
    posId: exec.command_message.target.pos_id,
    storeId: exec.command_message.target.store_id,
    executedBy: exec.command_message.issued_by.user_name,
    role: exec.command_message.issued_by.role,
    status: exec.status,
    result: exec.result_message?.status || 'N/A',
    correlationId: exec.command_message.correlation_id,
    messageId: exec.command_message.message_id,
  }));
}

/**
 * Export audit data to CSV format
 */
export function exportToCSV(
  executions: CommandExecution[], 
  options: ExportOptions = {}
): void {
  const { filename = 'auditoria-comandos' } = options;
  const rows = transformToAuditRows(executions);
  
  // CSV headers
  const headers = [
    'Fecha/Hora',
    'Comando',
    'POS ID',
    'Tienda ID',
    'Ejecutado Por',
    'Rol',
    'Estado',
    'Resultado',
    'Correlation ID',
    'Message ID',
  ];

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => [
      `"${row.timestamp}"`,
      `"${row.command}"`,
      `"${row.posId}"`,
      `"${row.storeId}"`,
      `"${row.executedBy}"`,
      `"${row.role}"`,
      `"${row.status}"`,
      `"${row.result}"`,
      `"${row.correlationId}"`,
      `"${row.messageId}"`,
    ].join(','))
  ].join('\n');

  // Add BOM for Excel compatibility with UTF-8
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Download file
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export audit data to PDF format
 */
export function exportToPDF(
  executions: CommandExecution[],
  options: ExportOptions = {}
): void {
  const { 
    title = 'Reporte de Auditoría de Comandos',
    subtitle = 'Plataforma de Automatización POS Gobernada',
    filename = 'auditoria-comandos',
    dateRange,
  } = options;

  const rows = transformToAuditRows(executions);
  
  // Create PDF document (landscape for more columns)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, pageWidth / 2, 22, { align: 'center' });

  // Date range info
  let yPos = 30;
  doc.setFontSize(10);
  doc.setTextColor(100);
  
  const generatedAt = `Generado: ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm:ss", { locale: es })}`;
  doc.text(generatedAt, 14, yPos);
  
  if (dateRange?.from || dateRange?.to) {
    const fromStr = dateRange.from ? format(dateRange.from, 'dd/MM/yyyy', { locale: es }) : 'Inicio';
    const toStr = dateRange.to ? format(dateRange.to, 'dd/MM/yyyy', { locale: es }) : 'Hoy';
    doc.text(`Período: ${fromStr} - ${toStr}`, 14, yPos + 5);
    yPos += 5;
  }

  doc.text(`Total de registros: ${executions.length}`, 14, yPos + 5);
  yPos += 12;

  // Statistics summary
  const stats = {
    completed: executions.filter(e => e.status === 'completed').length,
    failed: executions.filter(e => e.status === 'failed').length,
    blocked: executions.filter(e => e.status === 'blocked').length,
    pending: executions.filter(e => ['pending', 'sent', 'executing'].includes(e.status)).length,
  };

  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen:', 14, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Completados: ${stats.completed}  |  Fallidos: ${stats.failed}  |  Bloqueados: ${stats.blocked}  |  En proceso: ${stats.pending}`, 14, yPos + 5);
  yPos += 15;

  // Table with audit data
  autoTable(doc, {
    startY: yPos,
    head: [[
      'Fecha/Hora',
      'Comando',
      'POS',
      'Tienda',
      'Usuario',
      'Rol',
      'Estado',
      'Resultado',
      'Correlation ID',
    ]],
    body: rows.map(row => [
      row.timestamp,
      row.command,
      row.posId,
      row.storeId,
      row.executedBy,
      row.role,
      row.status,
      row.result,
      row.correlationId.substring(0, 20) + '...',
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 28 }, // Fecha
      1: { cellWidth: 35 }, // Comando
      2: { cellWidth: 18 }, // POS
      3: { cellWidth: 18 }, // Tienda
      4: { cellWidth: 25 }, // Usuario
      5: { cellWidth: 18 }, // Rol
      6: { cellWidth: 20 }, // Estado
      7: { cellWidth: 18 }, // Resultado
      8: { cellWidth: 40 }, // Correlation ID
    },
    didDrawPage: (data) => {
      // Footer with page numbers
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      doc.text(
        'Documento generado automáticamente - Plataforma POS Gobernada',
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: 'center' }
      );
    },
  });

  // Save PDF
  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
}

/**
 * Export a single execution detail to PDF
 */
export function exportExecutionDetailToPDF(
  execution: CommandExecution,
  getStoreName: (id: string) => string,
  getPosName: (id: string) => string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Evidencia de Ejecución de Comando', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm:ss", { locale: es })}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Command Info Section
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Comando', 14, yPos);
  yPos += 8;

  const commandInfo = [
    ['Comando', execution.command_message.command],
    ['Estado', execution.status.toUpperCase()],
    ['Resultado', execution.result_message?.status || 'N/A'],
    ['POS', `${getPosName(execution.command_message.target.pos_id)} (${execution.command_message.target.pos_id})`],
    ['Tienda', `${getStoreName(execution.command_message.target.store_id)} (${execution.command_message.target.store_id})`],
    ['Entorno', execution.command_message.target.environment],
  ];

  autoTable(doc, {
    startY: yPos,
    body: commandInfo,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 100 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Execution Info Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Información de Ejecución', 14, yPos);
  yPos += 8;

  const executionInfo = [
    ['Ejecutado por', `${execution.command_message.issued_by.user_name} (${execution.command_message.issued_by.role})`],
    ['Fecha de emisión', format(new Date(execution.command_message.issued_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })],
    ['Fecha de creación', format(new Date(execution.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })],
    ...(execution.sent_at ? [['Fecha de envío', format(new Date(execution.sent_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })]] : []),
    ...(execution.completed_at ? [['Fecha de finalización', format(new Date(execution.completed_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })]] : []),
  ];

  autoTable(doc, {
    startY: yPos,
    body: executionInfo,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 90 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Traceability Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Trazabilidad', 14, yPos);
  yPos += 8;

  const traceInfo = [
    ['Message ID', execution.command_message.message_id],
    ['Correlation ID', execution.command_message.correlation_id],
    ['Protocol Version', execution.command_message.protocol_version],
    ['mTLS Subject', execution.command_message.security.mtls_subject],
    ...(execution.result_message?.details.trace_id ? [['Trace ID (OTel)', execution.result_message.details.trace_id]] : []),
  ];

  autoTable(doc, {
    startY: yPos,
    body: traceInfo,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 120 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Result Details (if available)
  if (execution.result_message?.details) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalles del Resultado', 14, yPos);
    yPos += 8;

    const details = execution.result_message.details;
    const resultInfo: string[][] = [];
    
    if (details.execution_time_ms) resultInfo.push(['Tiempo de ejecución', `${details.execution_time_ms} ms`]);
    if (details.service_state) resultInfo.push(['Estado del servicio', details.service_state]);
    if (details.agent_version) resultInfo.push(['Versión del agente', details.agent_version]);
    if (details.error_code) resultInfo.push(['Código de error', details.error_code]);
    if (details.error_message) resultInfo.push(['Mensaje de error', details.error_message]);
    if (details.block_reason) resultInfo.push(['Razón de bloqueo', details.block_reason]);
    if (details.precondition_failed) resultInfo.push(['Precondición fallida', details.precondition_failed]);

    if (resultInfo.length > 0) {
      autoTable(doc, {
        startY: yPos,
        body: resultInfo,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
          1: { cellWidth: 90 },
        },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    'Este documento constituye evidencia inmutable de la ejecución del comando.',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 15,
    { align: 'center' }
  );
  doc.text(
    'Plataforma de Automatización POS Gobernada - Generado automáticamente',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  // Save
  const filename = `evidencia-${execution.command_message.command}-${execution.command_message.target.pos_id}-${format(new Date(), 'yyyyMMdd-HHmm')}`;
  doc.save(`${filename}.pdf`);
}
