/**
 * Theme System Types
 * 
 * Defines the structure for multi-mode visual themes.
 * Business logic and component semantics remain unchanged across themes.
 */

export type ThemeId = 'light' | 'dark' | 'high-contrast';

export interface Theme {
  id: ThemeId;
  label: string;
  description: string;
  icon: 'Sun' | 'Moon' | 'Eye';
  isDefault: boolean;
}

export const THEMES: Record<ThemeId, Theme> = {
  light: {
    id: 'light',
    label: 'Modo Claro',
    description: 'Alta legibilidad para ambientes iluminados (retail, oficinas)',
    icon: 'Sun',
    isDefault: true,
  },
  dark: {
    id: 'dark',
    label: 'Modo Oscuro',
    description: 'Reducción de deslumbramiento para turnos nocturnos',
    icon: 'Moon',
    isDefault: false,
  },
  'high-contrast': {
    id: 'high-contrast',
    label: 'Alto Contraste',
    description: 'Máxima visibilidad para incidentes y accesibilidad',
    icon: 'Eye',
    isDefault: false,
  },
};

export const DEFAULT_THEME: ThemeId = 'light';

export const THEME_STORAGE_KEY = 'retail-ops-theme';
