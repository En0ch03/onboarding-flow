import { StyleSheet, type ViewStyle } from 'react-native';

import { renderWithTheme } from '@/test/renderWithTheme';
import { palettes, withAlpha } from '@/theme';

import { ProgressBar } from './ProgressBar';

type View = Awaited<ReturnType<typeof renderWithTheme>>;

/** Cubuk ekran okuyucudan gizli oldugu icin sorgular gizli ogeleri de kapsiyor. */
const hidden = { includeHiddenElements: true } as const;

/**
 * Dolgunun duzlestirilmis bicimi. Yapiya gore degil adiyla bulunuyor: kaba
 * ileride bir donusum eklenirse yapisal arama sessizce yanlis dugumu olcerdi.
 */
function fill(view: View): ViewStyle {
  return StyleSheet.flatten(view.getByTestId('progress-fill', hidden).props.style) as ViewStyle;
}

describe('ProgressBar', () => {
  it('ekran okuyucuda sayaci tekrar etmiyor', async () => {
    const view = await renderWithTheme(<ProgressBar current={2} total={5} />);
    // Ayni bilgiyi ust seritteki sayac kelimelerle soyluyor; iki kez
    // duyurmak ayni cumleyi tekrar okutmak olurdu.
    expect(view.getByTestId('progress-track', hidden).props.accessibilityElementsHidden).toBe(true);
  });

  it('orani kendisi hesapliyor: cagiran yuzde gondermiyor', async () => {
    const view = await renderWithTheme(<ProgressBar current={2} total={5} />);
    expect(fill(view).transform).toEqual([{ scaleX: 0.4 }]);
  });

  it('dolgu soldan buyuyor', async () => {
    const view = await renderWithTheme(<ProgressBar current={2} total={5} />);
    // Varsayilan merkez olsaydi dolgu iki uctan birden acilirdi.
    expect(fill(view).transformOrigin).toBe('left');
  });

  it('toplam sifirken bolme yapmiyor', async () => {
    const view = await renderWithTheme(<ProgressBar current={0} total={0} />);
    // Korunan sey `scaleX`in `NaN` olmamasi.
    expect(fill(view).transform).toEqual([{ scaleX: 0 }]);
  });

  it('oran bire kirpiliyor', async () => {
    const view = await renderWithTheme(<ProgressBar current={9} total={5} />);
    expect(fill(view).transform).toEqual([{ scaleX: 1 }]);
  });
});

describe('ProgressBar izi', () => {
  it('iz gorseli bogmadan gorunur kaliyor', async () => {
    const view = await renderWithTheme(<ProgressBar current={2} total={5} />);
    const track = StyleSheet.flatten(
      view.getByTestId('progress-track', hidden).props.style,
    ) as ViewStyle;

    // Uc piksellik cubuk kizil zeminli bir ekranda kayboluyordu; iz ise ana
    // metnin renginden saydamlastirilarak turuyor, boylece iki varyantta da
    // ayni oranda goze carpiyor.
    expect(track.height).toBe(4);
    expect(track.backgroundColor).toBe(withAlpha(palettes.dark.ink, 0.14));
  });
});
