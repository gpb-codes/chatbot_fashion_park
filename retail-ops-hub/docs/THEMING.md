# Sistema de Temas Visuales - Retail Ops Hub

## Resumen

El sistema soporta **3 modos visuales** diseñados para ambientes operativos retail:

| Modo | ID | Uso Principal |
|------|----|---------------|
| **Modo Claro** | `light` | Default. Oficinas, reporting, auditoría |
| **Modo Oscuro** | `dark` | Turnos nocturnos, reducción de fatiga visual |
| **Alto Contraste** | `high-contrast` | Accesibilidad, incidentes, pantallas lejanas |

## Arquitectura

```
src/
├── types/theme.ts          # Tipos y configuración de temas
├── contexts/ThemeContext.tsx   # Provider y hook useTheme
├── components/layout/ThemeSwitch.tsx  # Selector de modo
└── index.css               # Variables CSS por tema
```

## Uso

### En componentes

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { currentTheme, theme, setTheme, availableThemes } = useTheme();
  
  return (
    <div>
      <p>Tema actual: {theme.label}</p>
      <button onClick={() => setTheme('dark')}>
        Cambiar a oscuro
      </button>
    </div>
  );
}
```

### Tokens CSS Semánticos

Los componentes usan variables CSS, **nunca colores hardcodeados**:

```tsx
// ✅ Correcto
className="bg-background text-foreground border-border"
className="text-[hsl(var(--status-success))]"

// ❌ Incorrecto
className="bg-white text-black"
className="text-green-500"
```

## Persistencia

- Almacenamiento: `localStorage` (key: `retail-ops-theme`)
- Default: `light` (retail-safe)
- Sin detección automática del SO

## Estados Críticos

Los estados operacionales mantienen consistencia en todos los modos:

| Estado | Token CSS | Light | Dark | High-Contrast |
|--------|-----------|-------|------|---------------|
| SUCCESS | `--status-success` | Verde AA | Verde | Verde brillante |
| FAILED | `--status-error` | Rojo AA | Rojo | Rojo brillante |
| BLOCKED | `--status-blocked` | Magenta AA | Magenta | Magenta brillante |
| PENDING | `--status-pending` | Azul AA | Azul | Azul brillante |
| IN_PROGRESS | `--status-progress` | Ámbar AA | Ámbar | Amarillo brillante |

**Importante**: Los estados siempre incluyen icono + texto + color (no solo color).

## Validación de Accesibilidad

- [x] Contraste AA mínimo en todos los modos
- [x] Navegación por teclado en switch de tema
- [x] aria-labels en controles
- [x] Foco visible (especialmente en high-contrast)
- [x] Estados no dependen solo del color

## Extensibilidad

Para agregar un nuevo tema (ej: "SOC", "Minimal"):

1. Agregar ID al tipo `ThemeId` en `src/types/theme.ts`
2. Definir metadata en `THEMES`
3. Agregar clase `.theme-{id}` con variables en `src/index.css`
