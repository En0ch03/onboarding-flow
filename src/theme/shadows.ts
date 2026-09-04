import type { ColorScheme } from './palette';

/**
 * Golgeler `boxShadow` dizgesi olarak tanimli; eski `shadow*` ve `elevation`
 * ozellikleri iki platformda ayri davraniyordu, bu tek bicim ikisini de kapsiyor.
 *
 * Koyu varyantta golge daha derin: acik zeminde golgeyi gorunur kilan sey
 * kontrast, koyu zeminde ise yogunluk.
 */
export const shadows: Record<ColorScheme, { soft: string; lift: string }> = {
  light: {
    soft: '0 1px 2px rgba(26, 22, 20, 0.04), 0 12px 32px rgba(26, 22, 20, 0.07)',
    lift: '0 2px 4px rgba(26, 22, 20, 0.05), 0 24px 60px rgba(26, 22, 20, 0.12)',
  },
  dark: {
    soft: '0 1px 2px rgba(0, 0, 0, 0.30), 0 12px 32px rgba(0, 0, 0, 0.35)',
    lift: '0 2px 4px rgba(0, 0, 0, 0.35), 0 24px 60px rgba(0, 0, 0, 0.50)',
  },
};

export type ShadowLevel = keyof (typeof shadows)['light'];
