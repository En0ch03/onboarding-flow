import { Platform, StyleSheet } from 'react-native';

import { BLUR_VIEW_TEST_ID } from '@/test/blurMock';
import { GLASS_VIEW_TEST_ID } from '@/test/glassEffectMock';
import { renderWithTheme } from '@/test/renderWithTheme';
import { palettes, radius, withAlpha } from '@/theme';

import { AppText } from './AppText';
import { GlassPanel } from './GlassPanel';

const { isLiquidGlassAvailable, isGlassEffectAPIAvailable } = jest.requireMock('expo-glass-effect');

/** Arka katmanlar ekran okuyucudan gizli; sorgular gizli ogeleri de kapsiyor. */
const hidden = { includeHiddenElements: true } as const;

/** Platformu gecici olarak degistirir; test bitince eski tanimi geri koyar. */
function onPlatform(os: 'ios' | 'android') {
  const original = Object.getOwnPropertyDescriptor(Platform, 'OS');
  Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
  return () => {
    if (original) Object.defineProperty(Platform, 'OS', original);
  };
}

beforeEach(() => {
  isLiquidGlassAvailable.mockReturnValue(false);
  isGlassEffectAPIAvailable.mockReturnValue(true);
});

describe('GlassPanel', () => {
  it('sistemin cam efekti varken gercek cami ciziyor', async () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);

      const view = await renderWithTheme(
        <GlassPanel>
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );

      // Once agacin gercekten cizildigi: bos bir agacta asagidaki sorgular da
      // "yok" derdi ve kural silinse bile test yesil kalirdi.
      expect(view.getByText('İçerik')).toBeTruthy();

      const glass = view.getByTestId(GLASS_VIEW_TEST_ID, hidden);
      expect(glass.props.glassEffectStyle).toBe('regular');
      expect(glass.props.tintColor).toBe(withAlpha(palettes.dark.paper, 0.55));
      // Yerel katman kartin `overflow: hidden` kirpmasini gormuyor, kendi kose
      // yaricapini okuyor: verilmezse cam dort koseli bir dikdortgen kaliyor.
      expect(StyleSheet.flatten(glass.props.style)).toMatchObject({
        borderRadius: radius.lg,
      });
      expect(view.queryByTestId(BLUR_VIEW_TEST_ID, hidden)).toBeNull();
    } finally {
      restore();
    }
  });

  it('cam efekti olmayan surumde bulanikliga dusuyor', async () => {
    const restore = onPlatform('ios');
    try {
      const view = await renderWithTheme(
        <GlassPanel>
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );
      expect(view.getByText('İçerik')).toBeTruthy();

      const blur = view.getByTestId(BLUR_VIEW_TEST_ID, hidden);
      expect(blur.props.tint).toBe('dark');
      expect(blur.props.intensity).toBe(50);
      expect(view.queryByTestId(GLASS_VIEW_TEST_ID, hidden)).toBeNull();
    } finally {
      restore();
    }
  });

  it('bulanikligin uzerinde metnin zeminini tasiyan dolgu duruyor', async () => {
    const restore = onPlatform('ios');
    try {
      const view = await renderWithTheme(
        <GlassPanel>
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );
      expect(view.getByText('İçerik')).toBeTruthy();

      // Okunabilirlik bulanikliga degil dolguya bagli: bulaniklik arkadaki
      // gorsele gore degisir, dolgunun opakligi degismez.
      const fill = StyleSheet.flatten(view.getByTestId('glass-panel-fill', hidden).props.style) as {
        backgroundColor: string;
      };
      expect(fill.backgroundColor).toBe(withAlpha(palettes.dark.paper, 0.55));
    } finally {
      restore();
    }
  });

  it('Android tarafinda bulaniklik olmadan duz kart ciziyor', async () => {
    const restore = onPlatform('android');
    try {
      const view = await renderWithTheme(
        <GlassPanel>
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );
      expect(view.getByText('İçerik')).toBeTruthy();

      expect(view.queryByTestId(GLASS_VIEW_TEST_ID, hidden)).toBeNull();
      expect(view.queryByTestId(BLUR_VIEW_TEST_ID, hidden)).toBeNull();

      const fill = StyleSheet.flatten(view.getByTestId('glass-panel-fill', hidden).props.style) as {
        backgroundColor: string;
      };
      // Bulaniklik yoksa dolgu tek basina calisiyor; daha opak olmasi gerek.
      expect(fill.backgroundColor).toBe(withAlpha(palettes.dark.surface, 0.86));
    } finally {
      restore();
    }
  });

  it('cam gorunumu acik ama yerel API yokken bulanikliga dusuyor', async () => {
    const restore = onPlatform('ios');
    try {
      // Bazi iOS 26 derlemelerinde tasarim dili acik ama cam API'si yok;
      // orada `GlassView` saydam ciziliyor ve metnin zemini hic kalmiyor.
      isLiquidGlassAvailable.mockReturnValue(true);
      isGlassEffectAPIAvailable.mockReturnValue(false);

      const view = await renderWithTheme(
        <GlassPanel>
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );
      expect(view.getByText('İçerik')).toBeTruthy();

      expect(view.queryByTestId(GLASS_VIEW_TEST_ID, hidden)).toBeNull();
      expect(view.getByTestId(BLUR_VIEW_TEST_ID, hidden)).toBeTruthy();
    } finally {
      restore();
    }
  });

  it('cam ve bulanik katmanlari ekran okuyucudan gizliyor', async () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);
      const glassView = await renderWithTheme(
        <GlassPanel>
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );
      expect(glassView.getByText('İçerik')).toBeTruthy();
      // Gizli ogeleri katmayan sorgu: katman dekoratif, ekran okuyucuya
      // okunacak bir sey vermiyor.
      expect(glassView.queryByTestId(GLASS_VIEW_TEST_ID)).toBeNull();

      isLiquidGlassAvailable.mockReturnValue(false);
      const blurView = await renderWithTheme(
        <GlassPanel>
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );
      expect(blurView.getByText('İçerik')).toBeTruthy();
      expect(blurView.queryByTestId(BLUR_VIEW_TEST_ID)).toBeNull();
    } finally {
      restore();
    }
  });

  it('kart dekoratif, icerigi ekran okuyucudan gizlemiyor', async () => {
    const restore = onPlatform('android');
    try {
      const view = await renderWithTheme(
        <GlassPanel>
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );

      // Gizli ogeleri katmayan sorgu: kart icerigi gizleseydi bu bulunamazdi.
      expect(view.getByText('İçerik')).toBeTruthy();
      expect(view.getByTestId('glass-panel')).toBeTruthy();
    } finally {
      restore();
    }
  });
});
