import { processColor } from 'react-native';

import { renderWithTheme } from '@/test/renderWithTheme';
import { palettes, withAlpha } from '@/theme';

import { JourneyBackdrop } from './JourneyBackdrop';

describe('JourneyBackdrop', () => {
  it('keeps the journey artwork decorative and outside the touch tree', async () => {
    const screen = await renderWithTheme(<JourneyBackdrop progress={0.5} />);
    const backdrop = screen.getByTestId('journey-backdrop', { includeHiddenElements: true });

    expect(backdrop.props.pointerEvents).toBe('none');
    expect(backdrop.props.accessibilityElementsHidden).toBe(true);
    expect(backdrop.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('renders the approved master artwork', async () => {
    const screen = await renderWithTheme(<JourneyBackdrop progress={0.5} />);

    expect(
      screen.getByTestId('journey-artwork', { includeHiddenElements: true }).props.source,
    ).toEqual(require('../../../../assets/onboarding/onboarding-crimson-journey-master-v2.png'));
  });
});

describe('JourneyBackdrop perdeleri', () => {
  it('kizil aydinlatmayi paletten aliyor', async () => {
    const screen = await renderWithTheme(<JourneyBackdrop progress={0.5} />);
    // Once agacin gercekten cizildigi: bos bir agacta asagidaki sorgular da
    // patlardi ama sebebini yanlis yere yazardik.
    expect(screen.getByTestId('journey-artwork', { includeHiddenElements: true })).toBeTruthy();

    // Renkler yerli tarafa sayiya cevrilmis halde gidiyor; karsilastirma da
    // ayni cevrimden geciyor, yoksa test her zaman kirmizi kalirdi.
    const glow = screen.getByTestId('journey-glow', { includeHiddenElements: true });
    expect(glow.props.colors).toEqual([
      processColor(withAlpha(palettes.dark.glowStrong, 0.34)),
      processColor(withAlpha(palettes.dark.glowDeep, 0.16)),
      processColor(withAlpha(palettes.dark.veil, 0)),
    ]);
  });

  it('alt perde metnin arkasini gercekten karartiyor', async () => {
    const screen = await renderWithTheme(<JourneyBackdrop progress={0.5} />);
    expect(screen.getByTestId('journey-artwork', { includeHiddenElements: true })).toBeTruthy();

    const veil = screen.getByTestId('journey-veil', { includeHiddenElements: true });
    // Metin gorselin uzerine ciplak yazilmiyor: perdenin metin bolgesindeki
    // opakligi kontrasti gorselden bagimsiz kiliyor. Deger dusurulurse
    // okunabilirlik sessizce kaybolur.
    expect(veil.props.colors).toEqual([
      processColor(withAlpha(palettes.dark.veil, 0)),
      processColor(withAlpha(palettes.dark.veil, 0.86)),
    ]);
    expect(veil.props.locations).toEqual([0.36, 1]);
  });
});
