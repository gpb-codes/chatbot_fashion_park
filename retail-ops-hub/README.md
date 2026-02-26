# FashionPark POS Control Plane

> Backoffice de supervisión y orquestación para terminales POS en la red de tiendas FashionPark.

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![Protocol](https://img.shields.io/badge/protocol-v1.0-green)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)

---

## 📋 Descripción

Sistema de **Governed Automation** para la gestión remota de terminales POS. Implementa un modelo de Control Plane donde:

- **El Backoffice autoriza** → Solo envía `action_id` predefinidos
- **El POS Agent ejecuta** → En el edge, sin lógica de negocio en el transporte
- **RabbitMQ transporta** → Mensajes con TTL y Dead Letter Queues
- **OpenTelemetry evidencia** → Trazabilidad end-to-end

### Características Principales

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | Vista en tiempo real del estado de la red POS |
| **Tiendas y POS** | Navegación jerárquica Región → Tienda → Terminal |
| **Acciones** | Catálogo cerrado con jerarquía de riesgo (Observación/Diagnóstico/Operacional/Crítica) |
| **Mis Acciones** | Seguimiento de acciones solicitadas con estados de ciclo de vida |
| **Aprobaciones** | Flujo de aprobación para acciones de alto riesgo |
| **Auditoría** | Modo auditor con timeline, evidencia y trazabilidad |
| **Observabilidad** | Métricas y telemetría de servicios |

---

## 🎨 Sistema de Temas Visuales

El sistema soporta **3 modos visuales** diseñados para ambientes operativos retail:

| Modo | Uso Principal | Default |
|------|---------------|---------|
| **Modo Claro** | Oficinas, reporting, auditoría | ✅ Sí |
| **Modo Oscuro** | Turnos nocturnos, reducción de fatiga visual | |
| **Alto Contraste** | Accesibilidad, incidentes, pantallas lejanas | |

### Características del Sistema de Temas

- ✅ Cambio instantáneo sin reload (transición suave de 200ms)
- ✅ Persistencia por usuario (localStorage)
- ✅ Indicador de carga durante transición
- ✅ Accesibilidad AA en todos los modos
- ✅ Estados críticos siempre legibles (icono + texto + color)

Ver documentación completa: [docs/THEMING.md](docs/THEMING.md)

---

## 🚀 Instalación

### Requisitos Previos

- **Node.js** >= 18.x
- **npm** >= 9.x o **bun** >= 1.x

### Instalación Rápida

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd fashionpark-pos-control

# 2. Instalar dependencias
npm install
# o con bun:
bun install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Iniciar en modo desarrollo
npm run dev
# o con bun:
bun dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## ⚙️ Configuración

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# URL del API REST Backend
VITE_API_BASE_URL=http://localhost:4000

# Timeout de requests HTTP (ms)
VITE_API_TIMEOUT_MS=15000

# Modo de datos:
#   true  → Demo: usa datos mock locales
#   false → API: conecta al backend real
VITE_USE_MOCK_DATA=true
```

### Modos de Operación

| Modo | Variable | Indicador UI |
|------|----------|--------------|
| **Demo** | `VITE_USE_MOCK_DATA=true` | 🧪 Badge ámbar "Demo" |
| **API** | `VITE_USE_MOCK_DATA=false` | 🗄️ Badge verde "API" |

El indicador visual en el header muestra el modo activo.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      CONTROL PLANE                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Backoffice │──│   REST API  │──│  RabbitMQ   │         │
│  │   (React)   │  │   Gateway   │  │   Broker    │         │
│  └─────────────┘  └─────────────┘  └──────┬──────┘         │
└────────────────────────────────────────────┼────────────────┘
                                             │ mTLS
                    ┌────────────────────────┼────────────────┐
                    ▼                        ▼                ▼
              ┌───────────┐          ┌───────────┐    ┌───────────┐
              │ POS Agent │          │ POS Agent │    │ POS Agent │
              └───────────┘          └───────────┘    └───────────┘
```

### Estructura del Proyecto

```
src/
├── components/
│   ├── commands/        # Filtros y badges de comandos
│   ├── dashboard/       # Widgets del dashboard
│   ├── layout/          # Header, Sidebar, ThemeSwitch
│   ├── operations/      # StatusPill, CategoryBadge, ActionCard, etc.
│   └── ui/              # shadcn/ui components
├── config/
│   └── apiConfig.ts     # Configuración centralizada
├── contexts/
│   └── ThemeContext.tsx # Provider y hook useTheme
├── data/                # Datos mock para modo demo
├── hooks/               # Custom hooks (useXxxData)
├── lib/
│   └── httpClient.ts    # Cliente HTTP centralizado
├── pages/               # Vistas principales
├── services/            # Servicios de dominio
└── types/
    ├── index.ts         # Tipos de dominio
    ├── actions.ts       # Tipos de acciones y estados
    ├── api.ts           # Tipos de API
    ├── commands.ts      # Protocolo de mensajes v1.0
    └── theme.ts         # Tipos del sistema de temas
```

---

## 🎯 Jerarquía de Riesgo

Las acciones se clasifican en niveles con comportamientos diferenciados:

| Nivel | Color | Confirmación |
|-------|-------|--------------|
| **Observación** | Azul | Sin confirmación |
| **Diagnóstico** | Teal | Sin confirmación |
| **Operacional** | Ámbar | Modal con checkbox |
| **Crítica** | Rojo | Modal reforzado + texto de confirmación |

---

## 📊 Estados del Ciclo de Vida

Las acciones asíncronas pasan por estados definidos:

| Estado | Descripción |
|--------|-------------|
| `draft` | Borrador, no enviado |
| `pending_approval` | Esperando aprobación |
| `queued` | En cola de ejecución |
| `in_progress` | Ejecutándose en POS |
| `success` | Completado exitosamente |
| `failed` | Error en ejecución |
| `blocked` | Precondición no cumplida |
| `cancelled` | Cancelado por usuario |

---

## 📡 Protocolo de Mensajes

El sistema utiliza un protocolo de mensajes estructurado (v1.0):

### Tipos de Mensaje

| Tipo | Dirección | Descripción |
|------|-----------|-------------|
| `COMMAND` | Control → POS | Instrucción de ejecución |
| `RESULT` | POS → Control | Resultado de ejecución |
| `STATUS` | POS → Control | Heartbeat periódico |
| `TELEMETRY` | POS → Observability | Métricas OpenTelemetry |

### Catálogo de Comandos

```typescript
const COMMAND_CATALOG = {
  RESTART_SPDH: 'RESTART_SPDH',
  RESTART_TRANSBANK: 'RESTART_TRANSBANK',
  RESTART_LLAVES_DIRECTO: 'RESTART_LLAVES_DIRECTO',
  FORCE_SYNC_KEYS: 'FORCE_SYNC_KEYS',
  CLEAR_TRANSACTION_CACHE: 'CLEAR_TRANSACTION_CACHE',
  RESTART_POS_AGENT: 'RESTART_POS_AGENT',
  UPDATE_AGENT_CONFIG: 'UPDATE_AGENT_CONFIG',
};
```

> ⚠️ Solo los comandos del catálogo son aceptados. Cualquier otro será rechazado con status `BLOCKED`.

---

## 📚 Documentación

Documentación técnica disponible en `/docs`:

| Documento | Descripción |
|-----------|-------------|
| [API.md](docs/API.md) | Endpoints REST y tipos de respuesta |
| [MESSAGE_PROTOCOL.md](docs/MESSAGE_PROTOCOL.md) | Contratos de mensaje y topología RabbitMQ |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura del sistema y patrones |
| [THEMING.md](docs/THEMING.md) | Sistema de temas visuales |

---

## 🛠️ Scripts Disponibles

```bash
# Desarrollo con hot-reload
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

---

## 🔒 Seguridad

### Restricciones del Backoffice

| ❌ Prohibido | ✅ Permitido |
|-------------|-------------|
| Ejecutar scripts arbitrarios | Enviar `action_id` predefinidos |
| Acceso SSH/Shell a POS | Ver estado via heartbeat |
| Modificar configuración directa | Solicitar cambio de config |

### Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **Operator** | Solicitar acciones, ver estado |
| **Admin** | Aprobar/Rechazar, ejecutar acciones críticas |
| **Auditor** | Solo lectura, exportar logs, modo auditor |

---

## 🛣️ Roadmap

- [x] Sistema de temas visuales (Light/Dark/High-Contrast)
- [x] Jerarquía de riesgo en acciones
- [x] Estados de ciclo de vida asíncronos
- [x] Modo auditor con evidencia
- [ ] Autenticación con JWT
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Dashboard de métricas avanzadas
- [ ] Integración con OpenTelemetry UI
- [ ] Soporte multi-tenant

---

## 📄 Licencia

Proyecto propietario de FashionPark. Todos los derechos reservados.

---

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit de cambios: `git commit -m 'feat: descripción'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abrir Pull Request

---

<p align="center">
  <strong>FashionPark POS Control Plane</strong><br>
  <sub>Built with ❤️ using React + TypeScript + Tailwind</sub>
</p>
