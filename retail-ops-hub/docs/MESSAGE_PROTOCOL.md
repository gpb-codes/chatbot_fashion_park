# Protocolo de Mensajes - Documentación Técnica

> **Versión del Protocolo:** 1.0  
> **Última actualización:** 2026-02-06  
> **Transporte:** RabbitMQ con mTLS

---

## Índice

1. [Arquitectura](#arquitectura)
2. [Tipos de Mensaje](#tipos-de-mensaje)
3. [Catálogo de Comandos](#catálogo-de-comandos)
4. [Contratos de Mensaje](#contratos-de-mensaje)
   - [COMMAND](#command-message)
   - [RESULT](#result-message)
   - [STATUS](#status-message-heartbeat)
   - [TELEMETRY](#telemetry-message)
5. [Ciclo de Vida de Ejecución](#ciclo-de-vida-de-ejecución)
6. [Flujo de Aprobación](#flujo-de-aprobación)
7. [Validaciones y Precondiciones](#validaciones-y-precondiciones)
8. [Códigos de Error](#códigos-de-error)
9. [Topología RabbitMQ](#topología-rabbitmq)
10. [Seguridad](#seguridad)
11. [Trazabilidad OpenTelemetry](#trazabilidad-opentelemetry)

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CONTROL PLANE                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │  Backoffice │───►│   REST API  │───►│  RabbitMQ   │                  │
│  │   (React)   │    │   Gateway   │    │   Broker    │                  │
│  └─────────────┘    └──────┬──────┘    └──────┬──────┘                  │
│                            │                   │                         │
│                            ▼                   │                         │
│                    ┌─────────────┐             │                         │
│                    │ PostgreSQL  │             │                         │
│                    │ (Auditoría) │             │                         │
│                    └─────────────┘             │                         │
└────────────────────────────────────────────────┼─────────────────────────┘
                                                 │ mTLS
                    ┌────────────────────────────┼────────────────────────┐
                    │                            │                        │
                    ▼                            ▼                        ▼
              ┌───────────┐              ┌───────────┐            ┌───────────┐
              │ POS Agent │              │ POS Agent │            │ POS Agent │
              │  pos-001  │              │  pos-002  │            │  pos-003  │
              └─────┬─────┘              └─────┬─────┘            └─────┬─────┘
                    │                          │                        │
              ┌─────┴─────┐              ┌─────┴─────┐            ┌─────┴─────┐
              │   SPDH    │              │   SPDH    │            │   SPDH    │
              │ Transbank │              │ Transbank │            │ Transbank │
              └───────────┘              └───────────┘            └───────────┘
```

### Principios Fundamentales

| Principio | Descripción |
|-----------|-------------|
| **Governed Automation** | El Control Plane autoriza, el Edge ejecuta. Sin lógica de negocio en transporte. |
| **Catálogo Cerrado** | Solo comandos predefinidos son válidos. Rechazo automático de comandos desconocidos. |
| **Idempotencia** | Todo comando tiene `message_id` único. Reenvíos seguros. |
| **Trazabilidad** | `correlation_id` + `trace_id` vinculan todas las fases del ciclo de vida. |
| **TTL Estricto** | Comandos expiran en 2-5 minutos. Sin ejecución de comandos viejos. |
| **Evidencia Inmutable** | Cada acción genera registro de auditoría no modificable. |

---

## Tipos de Mensaje

| Tipo | Dirección | Exchange | Descripción | Frecuencia |
|------|-----------|----------|-------------|------------|
| `COMMAND` | Control → POS | `ex.commands` | Instrucción de ejecución | Por demanda |
| `RESULT` | POS → Control | `ex.results` | Resultado de ejecución | Por comando |
| `STATUS` | POS → Control | `ex.status` | Heartbeat y estado de servicios | Cada 30s |
| `TELEMETRY` | POS → Observability | `ex.telemetry` | Métricas y spans OpenTelemetry | Cada 60s |

### Flujo de Mensajes

```
        COMMAND                          RESULT
Control ────────► POS Agent    POS Agent ────────► Control
         ex.commands                      ex.results

        STATUS                           TELEMETRY
POS Agent ────────► Control    POS Agent ────────► OpenTelemetry
          ex.status                       ex.telemetry
```

---

## Catálogo de Comandos

El agente POS **solo acepta** los siguientes comandos. Cualquier otro será rechazado con status `BLOCKED` y razón `UNKNOWN_COMMAND`.

### Comandos de Observación (Bajo Riesgo)

| Comando | Descripción | Cooldown | Aprobación |
|---------|-------------|----------|------------|
| `GET_SPDH_STATUS` | Consulta estado del servicio SPDH | 0 | No |
| `GET_TRANSBANK_STATUS` | Consulta estado de Transbank | 0 | No |
| `GET_AGENT_INFO` | Información del agente y sistema | 0 | No |
| `GET_SERVICE_LOGS` | Obtiene logs recientes (últimos 100) | 60s | No |

### Comandos de Diagnóstico (Riesgo Bajo-Medio)

| Comando | Descripción | Cooldown | Aprobación |
|---------|-------------|----------|------------|
| `RUN_CONNECTIVITY_TEST` | Prueba conectividad con servicios | 60s | No |
| `RUN_HEALTH_CHECK` | Ejecuta health check completo | 120s | No |
| `VALIDATE_KEYS` | Valida estado de llaves criptográficas | 60s | No |

### Comandos Operacionales (Riesgo Medio)

| Comando | Descripción | Cooldown | Aprobación |
|---------|-------------|----------|------------|
| `RESTART_SPDH` | Reinicia el servicio SPDH | 5 min | Sí* |
| `RESTART_TRANSBANK` | Reinicia integración Transbank | 5 min | Sí* |
| `RESTART_LLAVES_DIRECTO` | Reinicia Llaves Directo | 5 min | Sí* |
| `CLEAR_TRANSACTION_CACHE` | Limpia caché de transacciones | 10 min | No |
| `UPDATE_AGENT_CONFIG` | Actualiza configuración del agente | 5 min | Sí |

\* Requiere aprobación si hay transacciones recientes en los últimos 5 minutos.

### Comandos Críticos (Alto Riesgo)

| Comando | Descripción | Cooldown | Aprobación |
|---------|-------------|----------|------------|
| `FORCE_SYNC_KEYS` | Fuerza sincronización de llaves criptográficas | 30 min | Sí |
| `RESTART_POS_AGENT` | Reinicia el agente POS completo | 15 min | Sí |
| `FACTORY_RESET_CONFIG` | Restaura configuración de fábrica | 60 min | Sí + Admin |

> ⚠️ **Seguridad**: El agente valida que el comando esté en el catálogo antes de procesar. Comandos no reconocidos se rechazan inmediatamente.

---

## Contratos de Mensaje

### COMMAND Message

Mensaje enviado desde el Control Plane hacia el POS Agent para solicitar la ejecución de una acción.

```typescript
interface CommandMessage {
  // === Identificación ===
  protocol_version: '1.0';
  message_id: string;           // UUID v4 - Garantiza idempotencia
  correlation_id: string;       // UUID v4 - Trazabilidad end-to-end
  message_type: 'COMMAND';
  
  // === Comando ===
  command: CommandType;         // Del catálogo cerrado
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // === Destino ===
  target: {
    pos_id: string;             // Identificador único del POS
    store_id: string;           // Identificador de la tienda
    region_id: string;          // Identificador de la región
    environment: 'lab' | 'staging' | 'production';
  };
  
  // === Emisor ===
  issued_by: {
    user_id: string;
    user_name: string;
    user_email: string;
    role: 'operator' | 'admin';
  };
  
  // === Aprobación (si aplica) ===
  approval?: {
    approved_by: {
      user_id: string;
      user_name: string;
      role: 'admin';
    };
    approved_at: string;        // ISO 8601
    approval_notes?: string;
  };
  
  // === Temporalidad ===
  issued_at: string;            // ISO 8601 - Momento de creación
  queued_at?: string;           // ISO 8601 - Momento de encolado
  expires_at: string;           // ISO 8601 - TTL obligatorio
  
  // === Seguridad ===
  security: {
    mtls_subject: string;       // CN del certificado cliente
    request_signature?: string; // HMAC-SHA256 del payload (opcional)
  };
  
  // === Payload del Comando ===
  payload: CommandPayload;      // Específico por comando
  
  // === Trazabilidad ===
  trace_context: {
    trace_id: string;           // OpenTelemetry trace ID (32 hex chars)
    span_id: string;            // OpenTelemetry span ID (16 hex chars)
    trace_flags?: string;       // Trace flags
  };
  
  // === Metadata ===
  metadata?: {
    reason?: string;            // Motivo de la ejecución
    ticket_id?: string;         // ID de ticket relacionado
    incident_id?: string;       // ID de incidente relacionado
    retry_of?: string;          // message_id del comando original si es reintento
    retry_count?: number;       // Número de reintento (0 = original)
  };
}
```

#### Payloads por Comando

```typescript
// Comandos de Observación
interface GetStatusPayload {
  include_metrics?: boolean;
  include_logs?: boolean;
  log_lines?: number;           // default: 50, max: 500
}

// Comandos de Reinicio
interface RestartServicePayload {
  force?: boolean;              // default: false - Forzar aunque haya actividad
  timeout_seconds?: number;     // default: 30, max: 120
  wait_for_ready?: boolean;     // default: true - Esperar confirmación de inicio
  graceful?: boolean;           // default: true - Intentar shutdown limpio primero
}

// Sincronización de Llaves
interface ForceSyncKeysPayload {
  backup_current?: boolean;     // default: true - Respaldar llaves actuales
  verify_after?: boolean;       // default: true - Verificar post-sync
  timeout_seconds?: number;     // default: 120
}

// Actualización de Configuración
interface UpdateConfigPayload {
  config_key: string;
  config_value: string | number | boolean;
  restart_required?: boolean;
}

// Limpieza de Caché
interface ClearCachePayload {
  cache_type: 'transactions' | 'sessions' | 'all';
  older_than_minutes?: number;  // default: 0 (todo)
}
```

#### Ejemplo Completo

```json
{
  "protocol_version": "1.0",
  "message_id": "550e8400-e29b-41d4-a716-446655440000",
  "correlation_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "message_type": "COMMAND",
  "command": "RESTART_SPDH",
  "priority": "normal",
  "target": {
    "pos_id": "pos-001",
    "store_id": "store-rm-01",
    "region_id": "region-rm",
    "environment": "production"
  },
  "issued_by": {
    "user_id": "user-001",
    "user_name": "Juan Pérez",
    "user_email": "jperez@fashionpark.cl",
    "role": "operator"
  },
  "approval": {
    "approved_by": {
      "user_id": "user-002",
      "user_name": "Ana García",
      "role": "admin"
    },
    "approved_at": "2026-02-06T10:29:30.000Z",
    "approval_notes": "Autorizado por incidente INC-042"
  },
  "issued_at": "2026-02-06T10:28:00.000Z",
  "queued_at": "2026-02-06T10:29:35.000Z",
  "expires_at": "2026-02-06T10:31:35.000Z",
  "security": {
    "mtls_subject": "CN=control-plane.fashionpark.cl"
  },
  "payload": {
    "force": false,
    "timeout_seconds": 30,
    "wait_for_ready": true,
    "graceful": true
  },
  "trace_context": {
    "trace_id": "0af7651916cd43dd8448eb211c80319c",
    "span_id": "b7ad6b7169203331"
  },
  "metadata": {
    "reason": "Servicio SPDH no responde correctamente",
    "incident_id": "INC-042"
  }
}
```

---

### RESULT Message

Mensaje enviado desde el POS Agent hacia el Control Plane con el resultado de la ejecución.

```typescript
interface ResultMessage {
  // === Identificación ===
  protocol_version: '1.0';
  message_id: string;           // UUID v4 - Nuevo para este resultado
  correlation_id: string;       // Mismo que el COMMAND original
  command_message_id: string;   // message_id del COMMAND que originó este resultado
  message_type: 'RESULT';
  
  // === Comando Ejecutado ===
  command: CommandType;
  
  // === Origen ===
  source: {
    pos_id: string;
    store_id: string;
    region_id: string;
    environment: Environment;
    agent_version: string;
    agent_hostname: string;
  };
  
  // === Estado ===
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'TIMEOUT' | 'PARTIAL';
  
  // === Detalles de Ejecución ===
  execution: {
    started_at: string;         // ISO 8601
    finished_at: string;        // ISO 8601
    duration_ms: number;
    phases: ExecutionPhase[];   // Fases de ejecución
  };
  
  // === Resultado (según status) ===
  result: SuccessResult | FailedResult | BlockedResult | TimeoutResult | PartialResult;
  
  // === Trazabilidad ===
  trace_context: {
    trace_id: string;
    span_id: string;
    parent_span_id: string;     // span_id del COMMAND
  };
  
  // === Estado del Sistema Post-Ejecución ===
  post_state?: {
    service_status: 'running' | 'stopped' | 'starting' | 'error';
    health_check_passed?: boolean;
    metrics?: Record<string, number>;
  };
}

interface ExecutionPhase {
  name: string;                 // e.g., "validating", "stopping", "starting", "verifying"
  status: 'completed' | 'failed' | 'skipped';
  started_at: string;
  finished_at: string;
  duration_ms: number;
  message?: string;
}

interface SuccessResult {
  type: 'success';
  message: string;
  data?: Record<string, unknown>;
}

interface FailedResult {
  type: 'failed';
  error_code: string;           // Código estructurado
  error_message: string;        // Mensaje legible
  error_details?: string;       // Detalles técnicos
  stack_trace?: string;         // Solo en ambientes no-producción
  recoverable: boolean;         // Indica si se puede reintentar
  suggested_action?: string;    // Sugerencia de siguiente paso
}

interface BlockedResult {
  type: 'blocked';
  block_code: string;           // Código de bloqueo
  block_reason: string;         // Razón legible
  precondition_failed: string;  // Precondición específica
  unblock_suggestion?: string;  // Cómo desbloquear
  retry_after_seconds?: number; // Sugerencia de cuándo reintentar
}

interface TimeoutResult {
  type: 'timeout';
  timeout_at_phase: string;     // Fase donde ocurrió el timeout
  timeout_seconds: number;
  partial_progress?: string;    // Progreso alcanzado
}

interface PartialResult {
  type: 'partial';
  completed_steps: string[];
  failed_step: string;
  error_message: string;
  rollback_performed: boolean;
}
```

#### Ejemplos de Resultados

**Éxito:**
```json
{
  "protocol_version": "1.0",
  "message_id": "660e8400-e29b-41d4-a716-446655440001",
  "correlation_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "command_message_id": "550e8400-e29b-41d4-a716-446655440000",
  "message_type": "RESULT",
  "command": "RESTART_SPDH",
  "source": {
    "pos_id": "pos-001",
    "store_id": "store-rm-01",
    "region_id": "region-rm",
    "environment": "production",
    "agent_version": "2.1.0",
    "agent_hostname": "pos-001.store-rm-01.fashionpark.local"
  },
  "status": "SUCCESS",
  "execution": {
    "started_at": "2026-02-06T10:29:36.000Z",
    "finished_at": "2026-02-06T10:30:04.340Z",
    "duration_ms": 28340,
    "phases": [
      {
        "name": "validating",
        "status": "completed",
        "started_at": "2026-02-06T10:29:36.000Z",
        "finished_at": "2026-02-06T10:29:36.500Z",
        "duration_ms": 500,
        "message": "Precondiciones validadas"
      },
      {
        "name": "stopping",
        "status": "completed",
        "started_at": "2026-02-06T10:29:36.500Z",
        "finished_at": "2026-02-06T10:29:42.000Z",
        "duration_ms": 5500,
        "message": "Servicio SPDH detenido (PID 1234)"
      },
      {
        "name": "starting",
        "status": "completed",
        "started_at": "2026-02-06T10:29:42.000Z",
        "finished_at": "2026-02-06T10:30:02.000Z",
        "duration_ms": 20000,
        "message": "Servicio SPDH iniciado (PID 5678)"
      },
      {
        "name": "verifying",
        "status": "completed",
        "started_at": "2026-02-06T10:30:02.000Z",
        "finished_at": "2026-02-06T10:30:04.340Z",
        "duration_ms": 2340,
        "message": "Health check passed"
      }
    ]
  },
  "result": {
    "type": "success",
    "message": "Servicio SPDH reiniciado exitosamente",
    "data": {
      "old_pid": 1234,
      "new_pid": 5678,
      "startup_time_ms": 20000
    }
  },
  "trace_context": {
    "trace_id": "0af7651916cd43dd8448eb211c80319c",
    "span_id": "c8ad6b7169203332",
    "parent_span_id": "b7ad6b7169203331"
  },
  "post_state": {
    "service_status": "running",
    "health_check_passed": true,
    "metrics": {
      "memory_mb": 256,
      "cpu_percent": 2.5
    }
  }
}
```

**Bloqueo:**
```json
{
  "protocol_version": "1.0",
  "message_id": "770e8400-e29b-41d4-a716-446655440002",
  "correlation_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "command_message_id": "550e8400-e29b-41d4-a716-446655440000",
  "message_type": "RESULT",
  "command": "RESTART_SPDH",
  "source": {
    "pos_id": "pos-001",
    "store_id": "store-rm-01",
    "region_id": "region-rm",
    "environment": "production",
    "agent_version": "2.1.0",
    "agent_hostname": "pos-001.store-rm-01.fashionpark.local"
  },
  "status": "BLOCKED",
  "execution": {
    "started_at": "2026-02-06T10:29:36.000Z",
    "finished_at": "2026-02-06T10:29:36.500Z",
    "duration_ms": 500,
    "phases": [
      {
        "name": "validating",
        "status": "failed",
        "started_at": "2026-02-06T10:29:36.000Z",
        "finished_at": "2026-02-06T10:29:36.500Z",
        "duration_ms": 500,
        "message": "Precondición no cumplida: transacción activa"
      }
    ]
  },
  "result": {
    "type": "blocked",
    "block_code": "ACTIVE_TRANSACTION",
    "block_reason": "No se puede reiniciar con transacción en proceso",
    "precondition_failed": "no_active_transaction",
    "unblock_suggestion": "Espere a que finalice la transacción actual",
    "retry_after_seconds": 60
  },
  "trace_context": {
    "trace_id": "0af7651916cd43dd8448eb211c80319c",
    "span_id": "d9ad6b7169203333",
    "parent_span_id": "b7ad6b7169203331"
  }
}
```

**Fallo:**
```json
{
  "status": "FAILED",
  "result": {
    "type": "failed",
    "error_code": "SERVICE_START_FAILED",
    "error_message": "El servicio SPDH no pudo iniciarse",
    "error_details": "Exit code 1: Configuration file missing",
    "recoverable": true,
    "suggested_action": "Verificar archivo de configuración /etc/spdh/config.xml"
  }
}
```

---

### STATUS Message (Heartbeat)

Mensaje periódico enviado por el POS Agent para reportar su estado y el de los servicios locales.

```typescript
interface StatusMessage {
  // === Identificación ===
  protocol_version: '1.0';
  message_id: string;
  message_type: 'STATUS';
  
  // === Origen ===
  pos_id: string;
  store_id: string;
  region_id: string;
  environment: Environment;
  
  // === Estado del Agente ===
  agent: {
    version: string;
    hostname: string;
    uptime_seconds: number;
    started_at: string;
    last_command_at?: string;
    last_command_status?: 'SUCCESS' | 'FAILED' | 'BLOCKED';
    pending_commands: number;
  };
  
  // === Estado de Servicios ===
  services: ServiceStatus[];
  
  // === Estado del Sistema ===
  system: {
    cpu_percent: number;
    memory_percent: number;
    memory_available_mb: number;
    disk_percent: number;
    disk_available_gb: number;
    network_ok: boolean;
    network_latency_ms?: number;
  };
  
  // === Conectividad ===
  connectivity: {
    rabbitmq_connected: boolean;
    central_api_reachable: boolean;
    last_successful_sync: string;
  };
  
  // === Alertas Locales ===
  local_alerts?: LocalAlert[];
  
  // === Timestamp ===
  timestamp: string;
  next_heartbeat_at: string;
}

interface ServiceStatus {
  service_id: string;           // e.g., "svc-spdh"
  name: string;                 // e.g., "SPDH"
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error' | 'unknown';
  health: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  pid?: number;
  memory_mb?: number;
  cpu_percent?: number;
  last_restart?: string;
  uptime_seconds?: number;
  version?: string;
  port?: number;
  last_health_check?: string;
  health_check_message?: string;
}

interface LocalAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  type: string;
  message: string;
  since: string;
  acknowledged: boolean;
}
```

#### Ejemplo

```json
{
  "protocol_version": "1.0",
  "message_id": "880e8400-e29b-41d4-a716-446655440003",
  "message_type": "STATUS",
  "pos_id": "pos-001",
  "store_id": "store-rm-01",
  "region_id": "region-rm",
  "environment": "production",
  "agent": {
    "version": "2.1.0",
    "hostname": "pos-001.store-rm-01.fashionpark.local",
    "uptime_seconds": 345600,
    "started_at": "2026-02-02T10:00:00.000Z",
    "last_command_at": "2026-02-06T10:30:04.340Z",
    "last_command_status": "SUCCESS",
    "pending_commands": 0
  },
  "services": [
    {
      "service_id": "svc-spdh",
      "name": "SPDH",
      "status": "running",
      "health": "healthy",
      "pid": 5678,
      "memory_mb": 256,
      "cpu_percent": 2.5,
      "last_restart": "2026-02-06T10:30:02.000Z",
      "uptime_seconds": 1798,
      "version": "4.2.1",
      "port": 8080,
      "last_health_check": "2026-02-06T11:00:00.000Z",
      "health_check_message": "All endpoints responding"
    },
    {
      "service_id": "svc-transbank",
      "name": "Transbank",
      "status": "running",
      "health": "healthy",
      "pid": 5679,
      "memory_mb": 128,
      "cpu_percent": 1.2,
      "uptime_seconds": 345600,
      "version": "3.1.0",
      "port": 8081,
      "last_health_check": "2026-02-06T11:00:00.000Z"
    }
  ],
  "system": {
    "cpu_percent": 23.5,
    "memory_percent": 45.2,
    "memory_available_mb": 4096,
    "disk_percent": 62.0,
    "disk_available_gb": 38,
    "network_ok": true,
    "network_latency_ms": 15
  },
  "connectivity": {
    "rabbitmq_connected": true,
    "central_api_reachable": true,
    "last_successful_sync": "2026-02-06T10:59:30.000Z"
  },
  "local_alerts": [],
  "timestamp": "2026-02-06T11:00:00.000Z",
  "next_heartbeat_at": "2026-02-06T11:00:30.000Z"
}
```

---

### TELEMETRY Message

Mensaje con métricas y spans de OpenTelemetry para observabilidad.

```typescript
interface TelemetryMessage {
  // === Identificación ===
  protocol_version: '1.0';
  message_id: string;
  message_type: 'TELEMETRY';
  
  // === Origen ===
  pos_id: string;
  store_id: string;
  environment: Environment;
  
  // === Métricas (Counters y Gauges) ===
  metrics: {
    // Contadores (acumulativos)
    commands_received_total: number;
    commands_success_total: number;
    commands_failed_total: number;
    commands_blocked_total: number;
    commands_timeout_total: number;
    heartbeats_sent_total: number;
    
    // Gauges (instantáneos)
    pending_commands: number;
    active_transactions: number;
    service_restart_count_24h: number;
    
    // Histogramas (latencias en ms)
    command_duration_p50: number;
    command_duration_p95: number;
    command_duration_p99: number;
    heartbeat_latency_ms: number;
  };
  
  // === Spans de Ejecución ===
  spans?: TelemetrySpan[];
  
  // === Logs Estructurados ===
  logs?: TelemetryLog[];
  
  // === Timestamp ===
  timestamp: string;
  period_start: string;
  period_end: string;
}

interface TelemetrySpan {
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  operation_name: string;
  service_name: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  status: 'ok' | 'error';
  status_message?: string;
  attributes: Record<string, string | number | boolean>;
  events?: SpanEvent[];
}

interface SpanEvent {
  name: string;
  timestamp: string;
  attributes?: Record<string, string | number | boolean>;
}

interface TelemetryLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  attributes?: Record<string, unknown>;
  trace_id?: string;
  span_id?: string;
}
```

#### Ejemplo

```json
{
  "protocol_version": "1.0",
  "message_id": "990e8400-e29b-41d4-a716-446655440004",
  "message_type": "TELEMETRY",
  "pos_id": "pos-001",
  "store_id": "store-rm-01",
  "environment": "production",
  "metrics": {
    "commands_received_total": 1250,
    "commands_success_total": 1200,
    "commands_failed_total": 35,
    "commands_blocked_total": 15,
    "commands_timeout_total": 0,
    "heartbeats_sent_total": 86400,
    "pending_commands": 0,
    "active_transactions": 0,
    "service_restart_count_24h": 2,
    "command_duration_p50": 2500,
    "command_duration_p95": 15000,
    "command_duration_p99": 28000,
    "heartbeat_latency_ms": 45
  },
  "spans": [
    {
      "trace_id": "0af7651916cd43dd8448eb211c80319c",
      "span_id": "c8ad6b7169203332",
      "parent_span_id": "b7ad6b7169203331",
      "operation_name": "execute_command",
      "service_name": "pos-agent",
      "start_time": "2026-02-06T10:29:36.000Z",
      "end_time": "2026-02-06T10:30:04.340Z",
      "duration_ms": 28340,
      "status": "ok",
      "attributes": {
        "command": "RESTART_SPDH",
        "pos_id": "pos-001",
        "user_id": "user-001"
      },
      "events": [
        {
          "name": "service_stopped",
          "timestamp": "2026-02-06T10:29:42.000Z",
          "attributes": { "pid": 1234 }
        },
        {
          "name": "service_started",
          "timestamp": "2026-02-06T10:30:02.000Z",
          "attributes": { "pid": 5678 }
        }
      ]
    }
  ],
  "timestamp": "2026-02-06T11:00:00.000Z",
  "period_start": "2026-02-06T10:00:00.000Z",
  "period_end": "2026-02-06T11:00:00.000Z"
}
```

---

## Ciclo de Vida de Ejecución

### Estados del Frontend (Backoffice)

```
┌─────────┐    ┌──────────────────┐    ┌────────┐    ┌─────────────┐    ┌─────────┐
│  draft  │───►│ pending_approval │───►│ queued │───►│ in_progress │───►│ success │
└─────────┘    └──────────────────┘    └────────┘    └─────────────┘    └─────────┘
                        │                   │               │                 
                        ▼                   ▼               ▼                 
                  ┌───────────┐      ┌───────────┐   ┌──────────┐           
                  │ cancelled │      │  blocked  │   │  failed  │           
                  └───────────┘      └───────────┘   └──────────┘           
```

### Mapeo Frontend ↔ Protocolo

| Estado Frontend | Evento/Mensaje Protocolo | Descripción |
|-----------------|--------------------------|-------------|
| `draft` | (local) | Borrador, no enviado |
| `pending_approval` | ActionRequest creado | Esperando aprobación |
| `queued` | COMMAND encolado | En cola RabbitMQ |
| `in_progress` | (inferido de timestamp) | Agente procesando |
| `success` | RESULT.status = SUCCESS | Ejecución exitosa |
| `failed` | RESULT.status = FAILED | Error en ejecución |
| `blocked` | RESULT.status = BLOCKED | Precondición no cumplida |
| `cancelled` | (local) | Cancelado por usuario/admin |

### Timeline de Evidencia

Cada ejecución genera una traza completa:

```
10:28:00.000  ─────  draft           Usuario crea solicitud
10:28:00.500  ─────  pending_approval Enviada para aprobación
10:29:30.000  ─────  approved        Admin aprueba
10:29:35.000  ─────  queued          COMMAND encolado en RabbitMQ
10:29:36.000  ─────  in_progress     Agente inicia ejecución
10:29:36.500  ─────  phase:validating Validando precondiciones
10:29:42.000  ─────  phase:stopping   Deteniendo servicio
10:30:02.000  ─────  phase:starting   Iniciando servicio
10:30:04.340  ─────  success         RESULT recibido: SUCCESS
```

---

## Flujo de Aprobación

### Diagrama de Estados

```
                    ┌─────────────┐
                    │   REQUEST   │
                    │  (Operator) │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │    AUTO    │  │  PENDING   │  │  BLOCKED   │
    │  APPROVED  │  │  APPROVAL  │  │ (cooldown) │
    │ (low-risk) │  │ (high-risk)│  └────────────┘
    └─────┬──────┘  └──────┬─────┘
          │                │
          │         ┌──────┴──────┐
          │         │             │
          │         ▼             ▼
          │  ┌────────────┐ ┌────────────┐
          │  │  APPROVED  │ │  REJECTED  │
          │  │   (Admin)  │ │   (Admin)  │
          │  └─────┬──────┘ └────────────┘
          │        │
          └────────┼────────┐
                   │        │
                   ▼        ▼
            ┌────────────────────┐
            │      QUEUED        │
            │ (COMMAND enviado)  │
            └────────────────────┘
```

### Reglas de Auto-Aprobación

| Categoría | Condición | Resultado |
|-----------|-----------|-----------|
| Observación | Siempre | Auto-aprobado |
| Diagnóstico | Sin transacciones activas | Auto-aprobado |
| Operacional | Sin transacciones + cooldown OK | Requiere aprobación |
| Crítica | Siempre | Requiere aprobación + Admin |

---

## Validaciones y Precondiciones

### Validaciones del Agente

El agente POS DEBE validar antes de ejecutar:

```python
def validate_command(message: CommandMessage) -> ValidationResult:
    # 1. Versión de protocolo
    if message.protocol_version != "1.0":
        return blocked("UNSUPPORTED_PROTOCOL", "Protocol version not supported")
    
    # 2. Comando en catálogo
    if message.command not in COMMAND_CATALOG:
        return blocked("UNKNOWN_COMMAND", f"Command {message.command} not in catalog")
    
    # 3. Certificado mTLS
    if not validate_mtls_subject(message.security.mtls_subject):
        return blocked("INVALID_CERTIFICATE", "mTLS subject not authorized")
    
    # 4. Expiración
    if datetime.now() > parse(message.expires_at):
        return blocked("COMMAND_EXPIRED", "Command TTL exceeded")
    
    # 5. Idempotencia
    if already_processed(message.message_id):
        return blocked("DUPLICATE_COMMAND", "Command already processed")
    
    # 6. Precondiciones específicas del comando
    precondition_result = check_preconditions(message.command)
    if not precondition_result.passed:
        return blocked(precondition_result.code, precondition_result.reason)
    
    return valid()
```

### Precondiciones por Comando

| Comando | Precondiciones |
|---------|----------------|
| `RESTART_SPDH` | No hay transacción activa, Servicio respondiendo |
| `RESTART_TRANSBANK` | No hay transacción activa, No en horario pico |
| `FORCE_SYNC_KEYS` | Conexión central estable, No hay transacciones pendientes |
| `RESTART_POS_AGENT` | No hay comandos en cola, Todos los servicios detenidos |
| `CLEAR_TRANSACTION_CACHE` | No hay transacción activa |

---

## Códigos de Error

### Códigos de Bloqueo (BLOCKED)

| Código | Descripción | Acción Sugerida |
|--------|-------------|-----------------|
| `UNKNOWN_COMMAND` | Comando no existe en catálogo | Verificar catálogo de comandos |
| `UNSUPPORTED_PROTOCOL` | Versión de protocolo no soportada | Actualizar agente |
| `INVALID_CERTIFICATE` | Certificado mTLS no válido | Verificar certificados |
| `COMMAND_EXPIRED` | TTL del comando expirado | Reenviar comando |
| `DUPLICATE_COMMAND` | Comando ya procesado (idempotencia) | Ninguna (ya ejecutado) |
| `ACTIVE_TRANSACTION` | Transacción en proceso | Esperar finalización |
| `COOLDOWN_ACTIVE` | Período de cooldown activo | Esperar cooldown |
| `SERVICE_NOT_FOUND` | Servicio objetivo no existe | Verificar configuración |
| `INSUFFICIENT_PERMISSIONS` | Permisos insuficientes | Solicitar con rol apropiado |
| `MAINTENANCE_MODE` | POS en modo mantenimiento | Contactar administrador |

### Códigos de Fallo (FAILED)

| Código | Descripción | Recuperable |
|--------|-------------|-------------|
| `SERVICE_START_FAILED` | Servicio no pudo iniciar | Sí |
| `SERVICE_STOP_FAILED` | Servicio no pudo detenerse | Sí |
| `SERVICE_TIMEOUT` | Timeout esperando servicio | Sí |
| `CONFIG_INVALID` | Configuración inválida | No* |
| `DISK_FULL` | Disco lleno | No* |
| `NETWORK_ERROR` | Error de red | Sí |
| `DEPENDENCY_FAILED` | Dependencia no disponible | Sí |
| `INTERNAL_ERROR` | Error interno del agente | Sí |

\* Requiere intervención manual

---

## Topología RabbitMQ

### Virtual Hosts

| Environment | vHost | Retención DLQ |
|-------------|-------|---------------|
| Lab | `/lab-pos` | 24 horas |
| Staging | `/staging-pos` | 7 días |
| Production | `/prod-pos` | 30 días |

### Exchanges

| Exchange | Type | Durable | Auto-Delete | Propósito |
|----------|------|---------|-------------|-----------|
| `ex.commands` | topic | ✅ | ❌ | Comandos Control → POS |
| `ex.results` | topic | ✅ | ❌ | Resultados POS → Control |
| `ex.status` | topic | ✅ | ❌ | Heartbeats |
| `ex.telemetry` | topic | ✅ | ❌ | Métricas OpenTelemetry |
| `ex.dlx` | fanout | ✅ | ❌ | Dead Letter Exchange |

### Routing Keys

| Patrón | Ejemplo | Uso |
|--------|---------|-----|
| `pos.<region>.<store>.<pos_id>.command` | `pos.rm.store01.pos001.command` | Enviar comando |
| `pos.<region>.<store>.<pos_id>.result` | `pos.rm.store01.pos001.result` | Recibir resultado |
| `pos.<region>.<store>.<pos_id>.status` | `pos.rm.store01.pos001.status` | Recibir heartbeat |
| `pos.<region>.<store>.<pos_id>.telemetry` | `pos.rm.store01.pos001.telemetry` | Métricas |
| `pos.<region>.#` | `pos.rm.#` | Suscribirse a región |
| `pos.*.*.*.status` | - | Todos los heartbeats |

### Queues

| Queue | Binding | TTL | DLQ |
|-------|---------|-----|-----|
| `q.pos.<pos_id>.commands` | `pos.*.*.*.command` | 2 min | ✅ |
| `q.pos.<pos_id>.commands.dlq` | Dead letters | ∞ | - |
| `q.results.central` | `pos.*.*.*.result` | 1 hora | ✅ |
| `q.status.central` | `pos.*.*.*.status` | 5 min | ❌ |
| `q.telemetry.otel` | `pos.*.*.*.telemetry` | 5 min | ❌ |

### Políticas de Queue

```json
{
  "command-queues": {
    "pattern": "q.pos.*.commands",
    "definition": {
      "message-ttl": 120000,
      "dead-letter-exchange": "ex.dlx",
      "dead-letter-routing-key": "dlq.commands",
      "max-length": 100,
      "overflow": "reject-publish"
    }
  }
}
```

### Diagrama de Topología

```
                         ex.commands (topic)
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
      pos.rm.s01.001     pos.rm.s01.002    pos.rm.s02.001
          .command           .command          .command
              │                 │                 │
              ▼                 ▼                 ▼
      ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
      │q.pos.001    │   │q.pos.002    │   │q.pos.003    │
      │.commands    │   │.commands    │   │.commands    │
      └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
             │                 │                 │
        ┌────┴────┐       ┌────┴────┐       ┌────┴────┐
        │Consumer │       │Consumer │       │Consumer │
        │POS Agent│       │POS Agent│       │POS Agent│
        └────┬────┘       └────┬────┘       └────┬────┘
             │                 │                 │
             ▼                 ▼                 ▼
      ex.results (topic) ◄─────┴─────────────────┘
             │
             ▼
      ┌─────────────────┐
      │q.results.central│
      └────────┬────────┘
               │
               ▼
      ┌─────────────────┐
      │  Control Plane  │
      │    (Backend)    │
      └─────────────────┘
```

---

## Seguridad

### mTLS (Mutual TLS)

Todas las conexiones RabbitMQ requieren certificados cliente:

| Componente | CN (Common Name) | Permisos |
|------------|------------------|----------|
| Control Plane | `CN=control-plane.fashionpark.cl` | Publish: `ex.commands`; Consume: `ex.results`, `ex.status` |
| POS Agent | `CN=pos-<pos_id>.fashionpark.cl` | Consume: `q.pos.<pos_id>.commands`; Publish: `ex.results`, `ex.status` |
| Observability | `CN=otel.fashionpark.cl` | Consume: `ex.telemetry` |

### Validación en el Agente

```python
VALIDATION_CHECKLIST = [
    "protocol_version == '1.0'",
    "command in COMMAND_CATALOG",
    "security.mtls_subject matches expected CN pattern",
    "issued_at within 5 minutes of current time",
    "expires_at has not passed",
    "message_id not in processed_commands (idempotency)",
    "correlation_id is valid UUID",
    "all required payload fields present",
]
```

### Firma de Mensajes (Opcional)

Para comandos críticos, se puede requerir firma HMAC:

```typescript
interface SignedCommand extends CommandMessage {
  security: {
    mtls_subject: string;
    request_signature: string;  // HMAC-SHA256(payload, shared_secret)
    signature_algorithm: 'HMAC-SHA256';
    signed_at: string;
  };
}
```

---

## Trazabilidad OpenTelemetry

### Propagación de Contexto

Todos los mensajes incluyen `trace_context` para correlación:

```typescript
interface TraceContext {
  trace_id: string;      // 32 caracteres hex (128 bits)
  span_id: string;       // 16 caracteres hex (64 bits)
  trace_flags?: string;  // 2 caracteres hex
  trace_state?: string;  // Vendor-specific key-value pairs
}
```

### Flujo de Spans

```
[Frontend: Create Request]
    │
    ▼ trace_id: abc123, span_id: 001
[API: Process Request]
    │
    ▼ trace_id: abc123, span_id: 002, parent: 001
[API: Enqueue Command]
    │
    ▼ trace_id: abc123, span_id: 003, parent: 002
[Agent: Receive Command]
    │
    ▼ trace_id: abc123, span_id: 004, parent: 003
[Agent: Execute Command]
    │
    ├──▶ [Phase: Validate] span_id: 005, parent: 004
    ├──▶ [Phase: Stop]     span_id: 006, parent: 004
    ├──▶ [Phase: Start]    span_id: 007, parent: 004
    └──▶ [Phase: Verify]   span_id: 008, parent: 004
    │
    ▼ trace_id: abc123, span_id: 009, parent: 004
[Agent: Send Result]
    │
    ▼ trace_id: abc123, span_id: 010, parent: 009
[API: Process Result]
    │
    ▼ trace_id: abc123, span_id: 011, parent: 010
[API: Notify Frontend]
```

### IDs de Evidencia

Cada acción genera tres IDs de evidencia inmutable:

| ID | Generado Por | Propósito |
|----|--------------|-----------|
| `message_id` | Control Plane | Idempotencia de comandos |
| `correlation_id` | Control Plane | Agrupar request/approval/execution |
| `trace_id` | OpenTelemetry | Trazabilidad distribuida completa |

### Consulta de Trazas

```http
# Por correlation_id (agrupa toda la operación)
GET /api/audit/events?correlationId=6ba7b810-9dad-11d1-80b4-00c04fd430c8

# Por trace_id (incluye spans detallados)
GET /api/observability/traces/0af7651916cd43dd8448eb211c80319c

# Link directo a Jaeger/Tempo
https://otel.fashionpark.cl/trace/0af7651916cd43dd8448eb211c80319c
```

---

## Registro de Auditoría

Cada acción genera un registro inmutable:

```typescript
interface ActionAuditLog {
  // === Identificación ===
  id: string;                   // ID único del registro
  action_id: string;            // ID de la acción/ejecución
  message_id: string;           // message_id del COMMAND
  correlation_id: string;       // correlation_id
  trace_id: string;             // OpenTelemetry trace ID
  
  // === Actor ===
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: 'operator' | 'admin' | 'auditor';
  user_ip: string;
  user_agent: string;
  
  // === Acción ===
  event_type: 'request' | 'approve' | 'reject' | 'queue' | 'start' | 'complete' | 'fail' | 'block' | 'cancel';
  command: CommandType;
  command_category: 'observation' | 'diagnostic' | 'operational' | 'critical';
  
  // === Destino ===
  pos_id: string;
  pos_name: string;
  store_id: string;
  store_name: string;
  region_id: string;
  environment: Environment;
  
  // === Resultado ===
  status: 'pending' | 'success' | 'failed' | 'blocked' | 'cancelled';
  status_code?: string;         // Código de error/bloqueo
  status_message?: string;      // Mensaje descriptivo
  duration_ms?: number;
  
  // === Metadata ===
  reason?: string;              // Motivo proporcionado por usuario
  notes?: string;               // Notas adicionales
  approval_notes?: string;      // Notas de aprobación
  rejection_reason?: string;    // Razón de rechazo
  
  // === Timestamps ===
  timestamp: string;            // Momento del evento
  created_at: string;           // Creación del registro
  
  // === Integridad ===
  checksum: string;             // SHA-256 del contenido
  previous_checksum?: string;   // Checksum del registro anterior (chain)
}
```

### Inmutabilidad

Los registros de auditoría son inmutables:

- ❌ No se pueden modificar
- ❌ No se pueden eliminar
- ✅ Solo se pueden agregar nuevos registros
- ✅ Cada registro referencia el anterior (blockchain-like)
- ✅ Checksum SHA-256 para verificar integridad
