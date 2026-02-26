import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { EvidenceIds } from '@/types/actions';
import { Copy, Check, ExternalLink, FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface EvidencePanelProps {
  evidence: EvidenceIds;
  compact?: boolean;
  className?: string;
}

interface EvidenceFieldProps {
  label: string;
  value: string;
  compact?: boolean;
}

function EvidenceField({ label, value, compact }: EvidenceFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copiado al portapapeles`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Error al copiar');
    }
  };

  return (
    <div className={cn(
      'flex items-center justify-between gap-2',
      compact ? 'py-1' : 'py-2'
    )}>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-muted-foreground',
          compact ? 'text-[10px]' : 'text-xs'
        )}>
          {label}
        </p>
        <code className={cn(
          'font-mono text-primary block truncate',
          compact ? 'text-[10px]' : 'text-xs'
        )}>
          {value}
        </code>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'shrink-0',
          compact ? 'h-6 w-6' : 'h-8 w-8'
        )}
        onClick={handleCopy}
        aria-label={`Copiar ${label}`}
      >
        {copied ? (
          <Check className={cn(compact ? 'w-3 h-3' : 'w-4 h-4', 'text-status-success')} />
        ) : (
          <Copy className={cn(compact ? 'w-3 h-3' : 'w-4 h-4')} />
        )}
      </Button>
    </div>
  );
}

export function EvidencePanel({ evidence, compact = false, className }: EvidencePanelProps) {
  return (
    <div className={cn(
      'bg-secondary/30 rounded-lg border border-border',
      compact ? 'p-2' : 'p-4',
      className
    )}>
      <div className={cn(
        'flex items-center gap-2 border-b border-border',
        compact ? 'pb-2 mb-2' : 'pb-3 mb-3'
      )}>
        <FileSearch className={cn(compact ? 'w-3 h-3' : 'w-4 h-4', 'text-primary')} />
        <span className={cn(
          'font-medium text-foreground',
          compact ? 'text-xs' : 'text-sm'
        )}>
          Evidencia
        </span>
      </div>

      <div className="space-y-1">
        <EvidenceField 
          label="message_id" 
          value={evidence.messageId} 
          compact={compact}
        />
        <EvidenceField 
          label="correlation_id" 
          value={evidence.correlationId} 
          compact={compact}
        />
        {evidence.traceId && (
          <EvidenceField 
            label="trace_id" 
            value={evidence.traceId} 
            compact={compact}
          />
        )}
        {evidence.spanId && (
          <EvidenceField 
            label="span_id" 
            value={evidence.spanId} 
            compact={compact}
          />
        )}
      </div>

      {evidence.traceId && (
        <div className={cn('border-t border-border', compact ? 'pt-2 mt-2' : 'pt-3 mt-3')}>
          <Button
            variant="outline"
            size={compact ? 'sm' : 'default'}
            className="w-full gap-2 text-xs"
            disabled
          >
            <ExternalLink className="w-3 h-3" />
            Ver traza en observabilidad
          </Button>
        </div>
      )}
    </div>
  );
}
