import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/theme';

/**
 * Guvenli alan olculeri testte cihazdan gelmiyor; saglayiciya sabit degerler
 * veriliyor. Aksi halde ekran olcum bekleyip bos render ediyor.
 */
const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/**
 * Ekran testleri belirtecleri gercek saglayicidan alir. Sahte bir tema
 * gecmek, testin gectigi ama uygulamanin patladigi bir durum yaratirdi.
 *
 * Testlerdeki her etkilesim `await act(...)` icinde yapilmali: yarim kalan
 * bir guncelleme, ayni dosyadaki sonraki testin agacini bos render ediyor.
 */
export function renderWithTheme(ui: ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>{ui}</ThemeProvider>
    </SafeAreaProvider>,
  );
}
