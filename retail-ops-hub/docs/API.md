# API REST - Documentación Técnica

> **Versión:** 2.1  
> **Última actualización:** 2026-02-06  
> **Entorno base:** `VITE_API_BASE_URL` (default: `http://localhost:4000`)

---

## Índice

1. [Configuración](#configuración)
2. [Autenticación](#autenticación)
3. [Headers Estándar](#headers-estándar)
4. [Endpoints](#endpoints)
   - [POS & Tiendas](#pos--tiendas)
   - [Catálogo de Acciones](#catálogo-de-acciones)
   - [Ejecuciones](#ejecuciones)
   - [Aprobaciones](#aprobaciones)
   - [Alertas](#alertas)
   - [Incidentes](#incidentes)
   - [Usuarios](#usuarios)
   - [Auditoría](#auditoría)
   - [Métricas](#métricas)
   - [Notificaciones](#notificaciones)
5. [Tipos de Datos](#tipos-de-datos)
6. [Ciclo de Vida de Acciones](#ciclo-de-vida-de-acciones)
7. [Trazabilidad y Evidencia](#trazabilidad-y-evidencia)
8. [Manejo de Errores](#manejo-de-errores)
9. [WebSocket Events](#websocket-events-futuro)
10. [Resumen CRUD por Entidad](#resumen-crud-por-entidad)

---

## Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | URL base del API REST | `http://localhost:4000` |
| `VITE_API_TIMEOUT_MS` | Timeout de requests (ms) | `15000` |
| `VITE_USE_MOCK_DATA` | Modo demo (true/false) | `true` |

### Modos de Operación

| Modo | Variable | Comportamiento |
|------|----------|----------------|
| **Demo** | `VITE_USE_MOCK_DATA=true` | Datos mock locales, sin HTTP |
| **API** | `VITE_USE_MOCK_DATA=false` | Conexión REST real |

---

## Autenticación

> ⚠️ **Pendiente de implementación completa**

### JWT Bearer Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "operator@fashionpark.cl",
  "password": "********"
}
```

**Response:**
```typescript
{
  token: string;           // JWT token
  refreshToken: string;    // Refresh token
  expiresIn: number;       // Segundos hasta expiración
  user: {
    id: string;
    email: string;
    name: string;
    role: 'operator' | 'admin' | 'auditor';
    permissions: string[];
  }
}
```

### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "..."
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

---

## Headers Estándar

Todos los requests deben incluir:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Request-ID: <uuid>              # Generado por cliente para correlación
X-Client-Version: 2.0.0           # Versión del frontend
```

Responses incluyen:

```http
X-Request-ID: <uuid>              # Echo del request
X-Trace-ID: <trace_id>            # OpenTelemetry trace ID
X-Correlation-ID: <correlation_id> # ID de correlación de negocio
```

---

## Endpoints

### POS & Tiendas

#### `GET /api/regions`
Lista todas las regiones.

**Response:** `Region[]`

```typescript
[
  {
    id: "region-rm",
    name: "Región Metropolitana",
    storeCount: 12,
    posCount: 48
  }
]
```

---

#### `GET /api/stores`
Lista todas las tiendas con resumen de estado.

**Query Parameters:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `regionId` | string | Filtrar por región |
| `status` | string | `online`, `offline`, `warning` |

**Response:** `Store[]`

```typescript
[
  {
    id: "store-001",
    name: "Mall Plaza Vespucio",
    code: "MPV",
    regionId: "region-rm",
    address: "Av. Vicuña Mackenna 7110",
    posCount: 4,
    onlineCount: 3,
    offlineCount: 1,
    lastSync: "2026-02-06T10:30:00Z"
  }
]
```

---

#### `GET /api/stores/:storeId`
Obtiene detalle de una tienda.

**Response:** `StoreDetail`

```typescript
{
  id: "store-001",
  name: "Mall Plaza Vespucio",
  code: "MPV",
  regionId: "region-rm",
  address: "Av. Vicuña Mackenna 7110",
  posCount: 4,
  onlineCount: 3,
  offlineCount: 1,
  pos: POS[],           // Lista de terminales
  recentActions: ActionExecutionV2[],  // Últimas 10 acciones
  alerts: Alert[]       // Alertas activas
}
```

---

#### `GET /api/stores/:storeId/pos`
Lista terminales POS de una tienda.

**Response:** `POS[]`

---

#### `GET /api/pos`
Lista todos los terminales POS.

**Query Parameters:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `storeId` | string | Filtrar por tienda |
| `status` | string | `online`, `offline`, `warning` |
| `limit` | number | Máximo de resultados |
| `offset` | number | Offset para paginación |

**Response:** `PaginatedResponse<POS>`

```typescript
{
  data: POS[],
  pagination: {
    total: 156,
    limit: 20,
    offset: 0,
    hasMore: true
  }
}
```

---

#### `GET /api/pos/:posId`
Obtiene detalle completo de un POS.

**Response:** `POSDetail`

```typescript
{
  id: "pos-001",
  name: "Caja Principal",
  storeId: "store-001",
  storeName: "Mall Plaza Vespucio",
  status: "online",
  lastHeartbeat: "2026-02-06T10:45:00Z",
  ipAddress: "192.168.1.101",
  agentVersion: "2.1.0",
  environment: "production",
  uptime: 345600,           // Segundos
  services: [
    {
      name: "SPDH",
      status: "healthy",
      lastCheck: "2026-02-06T10:45:00Z",
      version: "4.2.1"
    },
    {
      name: "Transbank",
      status: "healthy",
      lastCheck: "2026-02-06T10:45:00Z"
    }
  ],
  lastActions: ActionExecutionV2[],  // Últimas 5 acciones
  alerts: Alert[],
  healthScore: 98           // 0-100
}
```

---

### Catálogo de Acciones

#### `GET /api/actions`
Lista el catálogo de acciones disponibles.

**Query Parameters:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `category` | string | `observation`, `diagnostic`, `operational`, `critical` |
| `service` | string | Filtrar por servicio (`SPDH`, `Transbank`, etc.) |

**Response:** `ActionDefinition[]`

```typescript
[
  {
    id: "action-001",
    actionId: "GET_SPDH_STATUS",
    name: "Consultar Estado SPDH",
    description: "Obtiene el estado actual del servicio SPDH",
    category: "observation",
    riskLevel: "low",
    service: "SPDH",
    icon: "Activity",
    requiresApproval: false,
    requiresReason: false,
    requiresConfirmation: false,
    preconditions: [],
    estimatedDuration: "5s",
    cooldownMinutes: 0,
    impact: "Sin impacto operacional"
  },
  {
    id: "action-005",
    actionId: "RESTART_SPDH",
    name: "Reiniciar SPDH",
    description: "Reinicia el servicio SPDH completamente",
    category: "operational",
    riskLevel: "medium",
    service: "SPDH",
    icon: "RefreshCw",
    requiresApproval: false,
    requiresReason: true,
    requiresConfirmation: true,
    confirmationType: "checkbox",
    preconditions: [
      "No hay venta activa en proceso",
      "Última sincronización exitosa"
    ],
    estimatedDuration: "30s",
    cooldownMinutes: 5,
    impact: "Interrupción temporal del servicio SPDH (30s aprox)"
  },
  {
    id: "action-010",
    actionId: "FORCE_SYNC_KEYS",
    name: "Forzar Sincronización de Llaves",
    description: "Fuerza la resincronización de llaves criptográficas",
    category: "critical",
    riskLevel: "critical",
    service: "Security",
    icon: "Key",
    requiresApproval: true,
    requiresReason: true,
    requiresConfirmation: true,
    confirmationType: "text_match",
    confirmationText: "${posId}",  // Debe escribir el ID del POS
    preconditions: [
      "Conexión estable con servidor central",
      "No hay transacciones pendientes",
      "Backup de llaves actuales completado"
    ],
    estimatedDuration: "2m",
    cooldownMinutes: 30,
    impact: "Puede invalidar transacciones en vuelo. Requiere reconexión."
  }
]
```

---

#### `GET /api/actions/:actionId`
Obtiene definición de una acción específica.

**Response:** `ActionDefinition`

---

#### `GET /api/actions/:actionId/preconditions/:posId`
Valida precondiciones de una acción para un POS específico.

**Response:** `PreconditionCheck`

```typescript
{
  actionId: "RESTART_SPDH",
  posId: "pos-001",
  canExecute: true,
  preconditions: [
    {
      id: "no-active-sale",
      description: "No hay venta activa en proceso",
      status: "passed",
      checkedAt: "2026-02-06T10:45:00Z"
    },
    {
      id: "last-sync-ok",
      description: "Última sincronización exitosa",
      status: "passed",
      checkedAt: "2026-02-06T10:45:00Z"
    }
  ],
  cooldown: {
    active: false,
    remainingSeconds: 0,
    lastExecution: "2026-02-06T09:00:00Z"
  },
  posContext: {
    status: "online",
    lastHeartbeat: "2026-02-06T10:45:00Z",
    activeServices: ["SPDH", "Transbank"],
    lastAction: {
      actionId: "GET_SPDH_STATUS",
      status: "success",
      executedAt: "2026-02-06T10:30:00Z"
    }
  }
}
```

---

### Ejecuciones

#### `POST /api/executions`
Solicita la ejecución de una acción.

**Request:**
```typescript
{
  actionId: string;        // ID del catálogo (e.g., "RESTART_SPDH")
  posId: string;           // ID del terminal
  requestedBy: string;     // Usuario que solicita
  reason?: string;         // Obligatorio para operational/critical
  priority?: 'normal' | 'high' | 'urgent';
  metadata?: Record<string, unknown>;  // Datos adicionales
}
```

**Response:** `ActionExecutionV2`

```typescript
{
  id: "exec-uuid-123",
  actionId: "RESTART_SPDH",
  actionName: "Reiniciar SPDH",
  posId: "pos-001",
  posName: "Caja Principal",
  storeId: "store-001",
  storeName: "Mall Plaza Vespucio",
  category: "operational",
  status: "pending_approval",  // o "queued" si no requiere aprobación
  requestedBy: "jperez",
  requestedAt: "2026-02-06T10:50:00Z",
  reason: "Servicio SPDH no responde correctamente",
  evidence: {
    messageId: "msg-uuid-456",
    correlationId: "corr-uuid-789",
    traceId: "trace-abc123"
  },
  phases: [
    {
      name: "requested",
      status: "completed",
      timestamp: "2026-02-06T10:50:00Z"
    },
    {
      name: "pending_approval",
      status: "current",
      timestamp: "2026-02-06T10:50:00Z"
    },
    {
      name: "queued",
      status: "pending"
    },
    {
      name: "in_progress",
      status: "pending"
    },
    {
      name: "result",
      status: "pending"
    }
  ]
}
```

---

#### `GET /api/executions`
Lista ejecuciones con filtros.

**Query Parameters:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `status` | string | Estado del ciclo de vida |
| `posId` | string | Filtrar por POS |
| `storeId` | string | Filtrar por tienda |
| `actionId` | string | Filtrar por tipo de acción |
| `requestedBy` | string | Filtrar por usuario |
| `category` | string | `observation`, `diagnostic`, `operational`, `critical` |
| `startDate` | string | Fecha inicio (ISO 8601) |
| `endDate` | string | Fecha fin (ISO 8601) |
| `limit` | number | Máximo de resultados (default: 50) |
| `offset` | number | Offset para paginación |
| `sort` | string | `asc` o `desc` por fecha |

**Response:** `PaginatedResponse<ActionExecutionV2>`

---

#### `GET /api/executions/:id`
Obtiene detalle completo de una ejecución.

**Response:** `ActionExecutionV2`

---

#### `GET /api/executions/my`
Lista ejecuciones del usuario autenticado.

**Query Parameters:** (mismos que `GET /api/executions`)

**Response:** `PaginatedResponse<ActionExecutionV2>`

---

#### `POST /api/executions/:id/retry`
Reintenta una ejecución fallida.

**Request:**
```typescript
{
  reason?: string;  // Motivo del reintento
}
```

**Response:** `ActionExecutionV2` (nueva ejecución)

---

#### `POST /api/executions/:id/cancel`
Cancela una ejecución pendiente o en cola.

**Request:**
```typescript
{
  reason: string;  // Motivo de cancelación
}
```

**Response:**
```typescript
{
  success: true,
  message: "Ejecución cancelada exitosamente"
}
```

---

#### `POST /api/executions/:id/escalate`
Escala una ejecución fallida a incidente.

**Request:**
```typescript
{
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  assignTo?: string;  // Usuario asignado
}
```

**Response:** `Incident`

---

### Aprobaciones

#### `GET /api/approvals/pending`
Lista acciones pendientes de aprobación.

**Query Parameters:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `category` | string | Filtrar por categoría |
| `storeId` | string | Filtrar por tienda |
| `requestedBy` | string | Filtrar por solicitante |

**Response:** `ActionExecutionV2[]` (status = `pending_approval`)

---

#### `GET /api/approvals/history`
Lista historial de aprobaciones/rechazos.

**Query Parameters:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `startDate` | string | Fecha inicio |
| `endDate` | string | Fecha fin |
| `approvedBy` | string | Filtrar por aprobador |
| `decision` | string | `approved` o `rejected` |
| `limit` | number | Máximo de resultados |

**Response:** `PaginatedResponse<ApprovalRecord>`

```typescript
{
  data: [
    {
      id: "approval-001",
      executionId: "exec-uuid-123",
      actionId: "FORCE_SYNC_KEYS",
      actionName: "Forzar Sincronización de Llaves",
      posId: "pos-001",
      posName: "Caja Principal",
      requestedBy: "jperez",
      requestedAt: "2026-02-06T10:50:00Z",
      decision: "approved",
      decidedBy: "agarcia",
      decidedAt: "2026-02-06T10:55:00Z",
      notes: "Autorizado por incidente INC-042"
    }
  ],
  pagination: { ... }
}
```

---

#### `POST /api/approvals/:executionId/approve`
Aprueba una ejecución pendiente.

**Request:**
```typescript
{
  notes?: string;
}
```

**Response:** `ActionExecutionV2` (status actualizado a `queued`)

---

#### `POST /api/approvals/:executionId/reject`
Rechaza una ejecución pendiente.

**Request:**
```typescript
{
  reason: string;  // Obligatorio
}
```

**Response:** `ActionExecutionV2` (status = `cancelled`)

---

#### `POST /api/approvals/bulk`
Aprueba o rechaza múltiples ejecuciones. **(Solo Admin)**

**Request:**
```typescript
{
  action: 'approve' | 'reject';
  executionIds: string[];
  notes?: string;     // Para approve
  reason?: string;    // Para reject (obligatorio)
}
```

**Response:**
```typescript
{
  processed: number;
  failed: number;
  results: [
    { executionId: string; success: boolean; error?: string }
  ]
}
```

---

### Alertas

#### `GET /api/alerts`
Lista alertas activas y recientes.

**Query Parameters:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `status` | string | `active`, `acknowledged`, `resolved` |
| `severity` | string | `info`, `warning`, `critical` |
| `posId` | string | Filtrar por POS |
| `storeId` | string | Filtrar por tienda |
| `type` | string | Tipo de alerta (`pos_offline`, `service_down`, etc.) |
| `startDate` | string | Fecha inicio |
| `endDate` | string | Fecha fin |
| `limit` | number | Máximo de resultados |
| `offset` | number | Offset para paginación |

**Response:** `PaginatedResponse<Alert>`

```typescript
{
  data: [
    {
      id: "alert-001",
      type: "pos_offline",
      severity: "critical",
      status: "active",
      title: "POS sin conexión",
      message: "POS-04 no ha enviado heartbeat en los últimos 5 minutos",
      posId: "pos-004",
      posName: "Caja Express",
      storeId: "store-001",
      storeName: "Mall Plaza Vespucio",
      createdAt: "2026-02-06T10:40:00Z",
      acknowledgedAt: null,
      acknowledgedBy: null,
      resolvedAt: null,
      resolvedBy: null,
      autoResolvable: true,
      relatedExecutionId: null
    }
  ],
  pagination: { ... }
}
```

---

#### `GET /api/alerts/:id`
Obtiene detalle de una alerta.

**Response:** `AlertDetail`

```typescript
{
  id: "alert-001",
  type: "pos_offline",
  severity: "critical",
  status: "active",
  title: "POS sin conexión",
  message: "POS-04 no ha enviado heartbeat en los últimos 5 minutos",
  posId: "pos-004",
  posName: "Caja Express",
  storeId: "store-001",
  storeName: "Mall Plaza Vespucio",
  createdAt: "2026-02-06T10:40:00Z",
  history: [
    {
      timestamp: "2026-02-06T10:40:00Z",
      event: "created",
      details: "Último heartbeat: 2026-02-06T10:35:00Z"
    }
  ],
  suggestedActions: [
    {
      actionId: "RESTART_POS_AGENT",
      name: "Reiniciar Agente POS",
      reason: "Puede restaurar la conexión"
    }
  ],
  relatedAlerts: []
}
```

---

#### `POST /api/alerts/:id/acknowledge`
Marca una alerta como reconocida.

**Request:**
```typescript
{
  notes?: string;
}
```

**Response:** `Alert` (status = `acknowledged`)

---

#### `POST /api/alerts/:id/resolve`
Resuelve una alerta manualmente.

**Request:**
```typescript
{
  resolution: string;  // Descripción de la resolución
  preventive?: string; // Acciones preventivas tomadas
}
```

**Response:** `Alert` (status = `resolved`)

---

#### `POST /api/alerts/bulk/acknowledge`
Reconoce múltiples alertas.

**Request:**
```typescript
{
  alertIds: string[];
  notes?: string;
}
```

**Response:**
```typescript
{
  processed: number;
  failed: number;
}
```

---

#### `DELETE /api/alerts/:id`
Elimina una alerta resuelta. **(Solo Admin)**

> ⚠️ Solo alertas con status `resolved` pueden eliminarse.

**Response:** `204 No Content`

---

### Auditoría

#### `GET /api/audit/events`
Lista eventos de auditoría con filtros avanzados.

**Query Parameters:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `startDate` | string | Fecha inicio (ISO 8601) |
| `endDate` | string | Fecha fin (ISO 8601) |
| `posId` | string | Filtrar por POS |
| `storeId` | string | Filtrar por tienda |
| `userId` | string | Filtrar por usuario |
| `actionId` | string | Filtrar por acción |
| `status` | string | Estado final (`success`, `failed`, `blocked`) |
| `category` | string | Categoría de acción |
| `traceId` | string | Buscar por trace ID |
| `correlationId` | string | Buscar por correlation ID |
| `limit` | number | Máximo de resultados |
| `offset` | number | Offset para paginación |

**Response:** `PaginatedResponse<AuditEvent>`

```typescript
{
  data: [
    {
      id: "audit-001",
      timestamp: "2026-02-06T10:50:00Z",
      eventType: "action_executed",
      actor: {
        id: "user-001",
        name: "Juan Pérez",
        role: "operator"
      },
      target: {
        type: "pos",
        id: "pos-001",
        name: "Caja Principal"
      },
      action: {
        id: "RESTART_SPDH",
        name: "Reiniciar SPDH",
        category: "operational"
      },
      result: "success",
      evidence: {
        messageId: "msg-uuid-456",
        correlationId: "corr-uuid-789",
        traceId: "trace-abc123"
      },
      details: {
        duration: 28500,  // ms
        reason: "Servicio no responde",
        phases: [...]
      }
    }
  ],
  pagination: {
    total: 1250,
    limit: 50,
    offset: 0,
    hasMore: true
  }
}
```

---

#### `GET /api/audit/events/:id`
Obtiene detalle completo de un evento de auditoría.

**Response:** `AuditEventDetail`

---

#### `GET /api/audit/timeline/:posId`
Obtiene timeline de eventos para un POS específico.

**Query Parameters:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `startDate` | string | Fecha inicio |
| `endDate` | string | Fecha fin |
| `limit` | number | Máximo de eventos |

**Response:** `TimelineEvent[]`

```typescript
[
  {
    id: "event-001",
    timestamp: "2026-02-06T10:50:00Z",
    type: "action",
    title: "Reiniciar SPDH",
    description: "Ejecución completada exitosamente",
    status: "success",
    actor: "jperez",
    category: "operational",
    evidence: {
      messageId: "msg-uuid-456",
      correlationId: "corr-uuid-789",
      traceId: "trace-abc123"
    }
  },
  {
    id: "event-002",
    timestamp: "2026-02-06T10:45:00Z",
    type: "heartbeat",
    title: "Heartbeat recibido",
    description: "POS reporta estado online",
    status: "info"
  }
]
```

---

#### `GET /api/audit/export`
Exporta registros de auditoría.

**Query Parameters:** (mismos que `GET /api/audit/events`)
| Param | Tipo | Descripción |
|-------|------|-------------|
| `format` | string | `csv` o `pdf` |

**Response:** Binary file (CSV o PDF)

---

### Métricas

#### `GET /api/metrics/dashboard`
Obtiene métricas del dashboard principal.

**Response:** `DashboardMetrics`

```typescript
{
  timestamp: "2026-02-06T10:50:00Z",
  pos: {
    total: 156,
    online: 148,
    offline: 5,
    warning: 3,
    healthScore: 94.8
  },
  actions: {
    today: 42,
    pending: 3,
    inProgress: 2,
    successRate: 96.5,
    avgDuration: 28500  // ms
  },
  alerts: {
    critical: 1,
    warning: 4,
    info: 12
  },
  services: {
    spdh: { healthy: 145, unhealthy: 3 },
    transbank: { healthy: 148, unhealthy: 0 }
  },
  mttr: 180000  // Mean Time To Recovery (ms)
}
```

---

#### `GET /api/metrics/pos/:posId`
Obtiene métricas de un POS específico.

**Query Parameters:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `period` | string | `1h`, `24h`, `7d`, `30d` |

**Response:** `POSMetrics`

---

### Incidentes

#### `GET /api/incidents`
Lista incidentes activos y recientes.

**Query Parameters:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `status` | string | `open`, `investigating`, `resolved` |
| `severity` | string | `low`, `medium`, `high`, `critical` |
| `posId` | string | Filtrar por POS |
| `limit` | number | Máximo de resultados |

**Response:** `PaginatedResponse<Incident>`

---

#### `GET /api/incidents/:id`
Obtiene detalle de un incidente.

**Response:** `IncidentDetail`

---

#### `POST /api/incidents`
Crea un nuevo incidente manualmente.

**Request:**
```typescript
{
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  posId?: string;
  storeId?: string;
  relatedExecutionId?: string;
  assignTo?: string;
}
```

**Response:** `Incident`

---

#### `POST /api/incidents/:id/notes`
Añade una nota al timeline del incidente.

**Request:**
```typescript
{
  content: string;
  visibility?: 'internal' | 'public';  // default: internal
}
```

**Response:** `IncidentNote`

```typescript
{
  id: "note-001",
  incidentId: "inc-001",
  content: "Se contactó al equipo de redes para revisar conectividad",
  author: {
    id: "user-001",
    name: "Juan Pérez"
  },
  visibility: "internal",
  createdAt: "2026-02-06T11:00:00Z"
}
```

---

#### `DELETE /api/incidents/:id`
Elimina un incidente. **(Solo Admin, solo status `resolved`)**

**Response:** `204 No Content`

---

### Usuarios

> 🔒 **Solo accesible por rol `admin`**

#### `GET /api/users`
Lista todos los usuarios.

**Query Parameters:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `role` | string | Filtrar por rol |
| `status` | string | `active`, `inactive`, `suspended` |
| `search` | string | Buscar por nombre o email |
| `limit` | number | Máximo de resultados |
| `offset` | number | Offset para paginación |

**Response:** `PaginatedResponse<User>`

```typescript
{
  data: [
    {
      id: "user-001",
      email: "jperez@fashionpark.cl",
      name: "Juan Pérez",
      role: "operator",
      status: "active",
      lastLogin: "2026-02-06T08:30:00Z",
      createdAt: "2025-06-15T10:00:00Z",
      mfaEnabled: true,
      permissions: ["request_actions", "view_pos", "view_audit"]
    }
  ],
  pagination: { ... }
}
```

---

#### `GET /api/users/:id`
Obtiene detalle de un usuario.

**Response:** `UserDetail`

```typescript
{
  id: "user-001",
  email: "jperez@fashionpark.cl",
  name: "Juan Pérez",
  role: "operator",
  status: "active",
  lastLogin: "2026-02-06T08:30:00Z",
  createdAt: "2025-06-15T10:00:00Z",
  updatedAt: "2026-01-20T14:00:00Z",
  mfaEnabled: true,
  permissions: ["request_actions", "view_pos", "view_audit"],
  assignedStores: ["store-001", "store-002"],  // null = todas
  recentActivity: [
    {
      action: "login",
      timestamp: "2026-02-06T08:30:00Z",
      ipAddress: "192.168.1.50"
    }
  ],
  stats: {
    actionsRequested: 142,
    actionsApproved: 0,
    lastActionAt: "2026-02-06T10:45:00Z"
  }
}
```

---

#### `POST /api/users`
Crea un nuevo usuario. **(Solo Admin)**

**Request:**
```typescript
{
  email: string;
  name: string;
  role: 'operator' | 'admin' | 'auditor';
  permissions?: string[];          // Override de permisos por defecto
  assignedStores?: string[];       // null = acceso a todas
  sendInvite?: boolean;            // default: true
}
```

**Response:** `User`

---

#### `PUT /api/users/:id`
Actualiza un usuario. **(Solo Admin)**

**Request:**
```typescript
{
  name?: string;
  role?: 'operator' | 'admin' | 'auditor';
  status?: 'active' | 'inactive' | 'suspended';
  permissions?: string[];
  assignedStores?: string[];
}
```

**Response:** `User`

---

#### `DELETE /api/users/:id`
Desactiva un usuario (soft delete). **(Solo Admin)**

> ⚠️ No elimina el usuario, solo cambia status a `inactive`.

**Response:** `204 No Content`

---

#### `POST /api/users/:id/reset-password`
Envía email de reset de contraseña. **(Solo Admin)**

**Response:**
```typescript
{
  success: true,
  message: "Email de recuperación enviado"
}
```

---

#### `POST /api/users/:id/reset-mfa`
Resetea configuración MFA del usuario. **(Solo Admin)**

**Response:**
```typescript
{
  success: true,
  message: "MFA reseteado. El usuario deberá configurarlo en su próximo login."
}
```

---

#### `GET /api/users/me`
Obtiene el usuario autenticado actual.

**Response:** `UserDetail`

---

#### `PATCH /api/users/me`
Actualiza perfil del usuario autenticado.

**Request:**
```typescript
{
  name?: string;
  notificationPreferences?: NotificationPreferences;
}
```

**Response:** `User`

---

#### `POST /api/users/me/change-password`
Cambia contraseña del usuario autenticado.

**Request:**
```typescript
{
  currentPassword: string;
  newPassword: string;
}
```

**Response:**
```typescript
{
  success: true,
  message: "Contraseña actualizada"
}
```

---

### Notificaciones

#### `GET /api/notifications`
Lista notificaciones del usuario autenticado.

**Query Parameters:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `read` | boolean | Filtrar por leídas/no leídas |
| `type` | string | Tipo de notificación |
| `limit` | number | Máximo de resultados |

**Response:** `PaginatedResponse<Notification>`

```typescript
{
  data: [
    {
      id: "notif-001",
      type: "approval_pending",
      title: "Acción pendiente de aprobación",
      message: "FORCE_SYNC_KEYS en POS-04 requiere tu aprobación",
      read: false,
      createdAt: "2026-02-06T10:50:00Z",
      link: "/approvals",
      metadata: {
        executionId: "exec-uuid-123"
      }
    }
  ],
  pagination: { ... },
  unreadCount: 3
}
```

---

#### `POST /api/notifications/:id/read`
Marca una notificación como leída.

**Response:** `Notification`

---

#### `POST /api/notifications/read-all`
Marca todas las notificaciones como leídas.

**Response:**
```typescript
{
  markedAsRead: 5
}
```

---

#### `DELETE /api/notifications/:id`
Elimina una notificación.

**Response:** `204 No Content`

---

#### `GET /api/notifications/preferences`
Obtiene preferencias de notificación del usuario.

**Response:** `NotificationPreferences`

```typescript
{
  email: {
    enabled: true,
    approvalPending: true,
    actionCompleted: true,
    actionFailed: true,
    alertCritical: true,
    dailyDigest: false
  },
  push: {
    enabled: false
  },
  inApp: {
    enabled: true,
    sound: false
  }
}
```

---

#### `PUT /api/notifications/preferences`
Actualiza preferencias de notificación.

**Request:** `NotificationPreferences`

**Response:** `NotificationPreferences`

---

### Notificaciones del Navegador (Web Notifications API)

El frontend soporta notificaciones nativas del navegador para alertas críticas mediante la Web Notifications API.

#### Flujo de Activación

1. Usuario habilita notificaciones desde el icono de campana en el header
2. Navegador solicita permiso (`Notification.requestPermission()`)
3. Si se concede, las alertas críticas nuevas generan notificaciones del sistema

#### Configuración Frontend

```typescript
// Hook de notificaciones del navegador
import { useBrowserNotifications, useCriticalAlertNotifications } from '@/hooks';

// Verificar soporte y permisos
const { permission, isSupported, isGranted, requestPermission, sendNotification } = useBrowserNotifications();

// Monitorear alertas críticas automáticamente
useCriticalAlertNotifications(alerts, enabled);
```

#### Estados de Permiso

| Estado | Descripción |
|--------|-------------|
| `default` | Usuario no ha decidido |
| `granted` | Notificaciones permitidas |
| `denied` | Notificaciones bloqueadas |

#### Comportamiento

- Las notificaciones solo se envían para alertas con `severity: 'critical'`
- Se evitan duplicados mediante `seenAlertIds` tracking
- En la primera carga, se marcan las alertas existentes como vistas (sin notificar)
- Las notificaciones usan `requireInteraction: true` para permanecer visibles
- Auto-cierre después de 10 segundos

#### Preferencias Almacenadas

```typescript
// localStorage key
'alert-notifications-enabled': 'true' | 'false'
```

---

#### `PATCH /api/incidents/:id`
Actualiza estado de un incidente.

**Request:**
```typescript
{
  status?: 'investigating' | 'resolved';
  resolution?: string;
  notes?: string;
}
```

**Response:** `Incident`

---

## Tipos de Datos

### Enums

```typescript
// Categorías de acciones (jerarquía de riesgo)
type ActionCategory = 'observation' | 'diagnostic' | 'operational' | 'critical';

// Estados del ciclo de vida
type ActionLifecycleStatus = 
  | 'draft'
  | 'pending_approval'
  | 'queued'
  | 'in_progress'
  | 'success'
  | 'failed'
  | 'blocked'
  | 'cancelled';

// Niveles de riesgo
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Estados de POS
type POSStatus = 'online' | 'offline' | 'warning';

// Estados de servicios
type ServiceStatus = 'healthy' | 'unhealthy' | 'unknown';

// Roles de usuario
type UserRole = 'operator' | 'admin' | 'auditor';
```

### Interfaces Principales

```typescript
interface POS {
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  status: POSStatus;
  lastHeartbeat: string;
  ipAddress: string;
  agentVersion: string;
  environment: string;
  services: ServiceStatus[];
}

interface ActionExecutionV2 {
  id: string;
  actionId: string;
  actionName: string;
  posId: string;
  posName: string;
  storeId: string;
  storeName: string;
  category: ActionCategory;
  status: ActionLifecycleStatus;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  startedAt?: string;
  completedAt?: string;
  reason?: string;
  result?: string;
  errorMessage?: string;
  blockReason?: string;
  retryCount?: number;
  maxRetries?: number;
  evidence: EvidenceIds;
  phases: ExecutionPhase[];
}

interface EvidenceIds {
  messageId: string;
  correlationId: string;
  traceId?: string;
  spanId?: string;
}

interface ExecutionPhase {
  name: string;
  status: 'pending' | 'current' | 'completed' | 'failed' | 'skipped';
  timestamp?: string;
  message?: string;
}
```

---

## Ciclo de Vida de Acciones

```
┌─────────┐    ┌──────────────────┐    ┌────────┐    ┌─────────────┐    ┌─────────┐
│  draft  │───▶│ pending_approval │───▶│ queued │───▶│ in_progress │───▶│ success │
└─────────┘    └──────────────────┘    └────────┘    └─────────────┘    └─────────┘
                        │                   │               │                 
                        ▼                   ▼               ▼                 
                  ┌───────────┐      ┌───────────┐   ┌──────────┐           
                  │ cancelled │      │  blocked  │   │  failed  │           
                  └───────────┘      └───────────┘   └──────────┘           
```

### Transiciones de Estado

| Estado Actual | Transiciones Válidas |
|---------------|---------------------|
| `draft` | `pending_approval`, `queued`, `cancelled` |
| `pending_approval` | `queued`, `cancelled` |
| `queued` | `in_progress`, `blocked`, `cancelled` |
| `in_progress` | `success`, `failed` |
| `success` | (terminal) |
| `failed` | `queued` (retry) |
| `blocked` | `queued` (retry cuando precondición se cumple) |
| `cancelled` | (terminal) |

---

## Trazabilidad y Evidencia

Cada acción genera identificadores únicos para trazabilidad:

| Campo | Descripción | Formato |
|-------|-------------|---------|
| `messageId` | ID único del mensaje RabbitMQ | UUID v4 |
| `correlationId` | ID de correlación de negocio | UUID v4 |
| `traceId` | ID de trace OpenTelemetry | Hex 32 chars |
| `spanId` | ID de span OpenTelemetry (opcional) | Hex 16 chars |

### Uso en Headers

```http
X-Message-ID: 550e8400-e29b-41d4-a716-446655440000
X-Correlation-ID: 6ba7b810-9dad-11d1-80b4-00c04fd430c8
X-Trace-ID: 0af7651916cd43dd8448eb211c80319c
```

### Búsqueda por Evidencia

```http
GET /api/audit/events?traceId=0af7651916cd43dd8448eb211c80319c
GET /api/audit/events?correlationId=6ba7b810-9dad-11d1-80b4-00c04fd430c8
```

---

## Manejo de Errores

### Estructura de Error Estándar

```typescript
interface APIError {
  status: number;
  code: string;           // Código interno
  message: string;        // Mensaje legible
  details?: {
    field?: string;       // Campo con error (validación)
    constraint?: string;  // Restricción violada
    [key: string]: unknown;
  };
  traceId?: string;       // Para debugging
}
```

### Códigos de Error

| HTTP | Código | Descripción |
|------|--------|-------------|
| 400 | `VALIDATION_ERROR` | Datos de entrada inválidos |
| 400 | `INVALID_ACTION` | Acción no existe en catálogo |
| 401 | `UNAUTHORIZED` | Token inválido o expirado |
| 403 | `FORBIDDEN` | Sin permisos para esta operación |
| 403 | `ROLE_REQUIRED` | Rol insuficiente |
| 404 | `NOT_FOUND` | Recurso no encontrado |
| 409 | `COOLDOWN_ACTIVE` | Acción en período de cooldown |
| 409 | `POS_BUSY` | POS tiene acción en progreso |
| 409 | `PRECONDITION_FAILED` | Precondición no cumplida |
| 409 | `ALREADY_APPROVED` | Ya fue aprobado/rechazado |
| 422 | `UNPROCESSABLE` | No se puede procesar la solicitud |
| 429 | `RATE_LIMITED` | Demasiadas solicitudes |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |
| 503 | `SERVICE_UNAVAILABLE` | Servicio no disponible |

### Ejemplo de Error

```json
{
  "status": 409,
  "code": "COOLDOWN_ACTIVE",
  "message": "La acción RESTART_SPDH está en período de cooldown",
  "details": {
    "actionId": "RESTART_SPDH",
    "posId": "pos-001",
    "remainingSeconds": 180,
    "cooldownMinutes": 5,
    "lastExecution": "2026-02-06T10:45:00Z"
  },
  "traceId": "0af7651916cd43dd8448eb211c80319c"
}
```

---

## WebSocket Events (Futuro)

> ⚠️ **Pendiente de implementación**

### Conexión

```javascript
const ws = new WebSocket('wss://api.fashionpark.cl/ws');
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['pos:*', 'executions:my', 'alerts']
}));
```

### Eventos

| Canal | Evento | Descripción |
|-------|--------|-------------|
| `pos:{id}` | `status_changed` | Cambio de estado del POS |
| `pos:{id}` | `heartbeat` | Heartbeat recibido |
| `executions:{id}` | `phase_changed` | Cambio de fase en ejecución |
| `executions:{id}` | `completed` | Ejecución completada |
| `executions:my` | `new_execution` | Nueva ejecución del usuario |
| `approvals` | `pending` | Nueva aprobación pendiente |
| `alerts` | `new` | Nueva alerta |
| `alerts` | `resolved` | Alerta resuelta |

---

## Versionado

La API usa versionado en URL:

- **v1** (actual): `/api/v1/...`
- **v2** (futuro): `/api/v2/...`

Sin prefijo de versión se asume v1.

---

## Resumen CRUD por Entidad

### Matriz de Operaciones

| Entidad | Create | Read | Update | Delete | Notas |
|---------|--------|------|--------|--------|-------|
| **Regiones** | ❌ | ✅ | ❌ | ❌ | Solo lectura (config externa) |
| **Tiendas** | ❌ | ✅ | ❌ | ❌ | Solo lectura (config externa) |
| **POS** | ❌ | ✅ | ❌ | ❌ | Registro automático por agente |
| **Acciones (Catálogo)** | ❌ | ✅ | ❌ | ❌ | Catálogo cerrado (seguridad) |
| **Ejecuciones** | ✅ | ✅ | ⚠️ | ⚠️ | Update solo via acciones (retry, cancel, escalate) |
| **Aprobaciones** | ❌ | ✅ | ✅ | ❌ | Update = approve/reject |
| **Alertas** | ❌ | ✅ | ✅ | ✅* | Create automático; Delete solo resueltas |
| **Incidentes** | ✅ | ✅ | ✅ | ✅* | Delete solo resueltos (Admin) |
| **Usuarios** | ✅ | ✅ | ✅ | ⚠️ | Delete = soft delete (Admin) |
| **Notificaciones** | ❌ | ✅ | ✅ | ✅ | Create automático |
| **Auditoría** | ❌ | ✅ | ❌ | ❌ | Inmutable por diseño |

### Leyenda

- ✅ Operación disponible
- ❌ Operación no permitida (por diseño)
- ⚠️ Operación restringida o indirecta
- \* Requiere condiciones específicas

### Justificación de Restricciones

#### Entidades de Solo Lectura

| Entidad | Razón |
|---------|-------|
| **Regiones/Tiendas** | Configuración maestra gestionada externamente |
| **POS** | Se registran automáticamente vía heartbeat del agente |
| **Catálogo de Acciones** | Seguridad: solo acciones predefinidas (Governed Automation) |
| **Auditoría** | Inmutabilidad requerida para cumplimiento y trazabilidad |

#### Restricciones de Seguridad

| Operación | Restricción | Motivo |
|-----------|-------------|--------|
| `DELETE /users/:id` | Soft delete | Mantener trazabilidad de acciones históricas |
| `DELETE /alerts/:id` | Solo resueltas | Preservar evidencia de incidentes |
| `DELETE /incidents/:id` | Solo resueltos + Admin | Auditoría y análisis post-mortem |
| `POST /executions` | Catálogo cerrado | Prevenir ejecución de comandos arbitrarios |

### Operaciones Bulk

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/approvals/bulk` | POST | Aprobar/rechazar múltiples ejecuciones |
| `/api/alerts/bulk/acknowledge` | POST | Reconocer múltiples alertas |

### Permisos por Rol

| Operación | Operator | Admin | Auditor |
|-----------|----------|-------|---------|
| Read POS/Stores | ✅ | ✅ | ✅ |
| Request Action | ✅ | ✅ | ❌ |
| Approve Action | ❌ | ✅ | ❌ |
| CRUD Users | ❌ | ✅ | ❌ |
| Acknowledge Alert | ✅ | ✅ | ❌ |
| Create Incident | ✅ | ✅ | ❌ |
| Export Audit | ✅ | ✅ | ✅ |
| View All Data | ⚠️* | ✅ | ✅ |

\* Operator limitado a tiendas asignadas
