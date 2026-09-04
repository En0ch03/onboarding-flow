import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { motion } from './motion';
import { palettes, type ColorScheme, type Palette } from './palette';
import { radius } from './radius';
import { shadows } from './shadows';
import { screenPadding, spacing } from './spacing';
import { type as typeScale } from './typography';

export type Theme = {
  scheme: ColorScheme;
  colors: Palette;
  shadows: (typeof shadows)[ColorScheme];
  spacing: typeof spacing;
  screenPadding: number;
  radius: typeof radius;
  type: typeof typeScale;
  motion: typeof motion;
  setScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<Theme | null>(null);

/**
 * Uygulama koyu varyantla acilir. Sistem tercihi baslangic noktasi olarak
 * alinmiyor: koyu varyant bir tercih degil, urunun birincil gorunumu. Acik
 * varyant tam tanimli ve desteklenir; kullaniciya bir tercih kontrolu
 * eklendiginde `setScheme` ile devreye girer.
 */
export function ThemeProvider({
  children,
  initialScheme = 'dark',
}: {
  children: ReactNode;
  initialScheme?: ColorScheme;
}) {
  const [scheme, setScheme] = useState<ColorScheme>(initialScheme);

  const value = useMemo<Theme>(
    () => ({
      scheme,
      colors: palettes[scheme],
      shadows: shadows[scheme],
      spacing,
      screenPadding,
      radius,
      type: typeScale,
      motion,
      setScheme,
    }),
    [scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (theme === null) {
    // Saglayici disinda kalan bir agac, belirtecleri sessizce kaybedip ham
    // degerlere dusmek yerine burada duruyor: sessiz kayip, gec fark edilir.
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return theme;
}
