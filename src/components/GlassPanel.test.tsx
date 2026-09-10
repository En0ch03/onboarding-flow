import { Platform, StyleSheet } from 'react-native';

import { BLUR_VIEW_TEST_ID } from '@/test/blurMock';
import { GLASS_VIEW_TEST_ID } from '@/test/glassEffectMock';
import { renderWithTheme } from '@/test/renderWithTheme';
import { palettes, withAlpha } from '@/theme';

import { AppText } from './AppText';
import { GlassPanel } from './GlassPanel';

const { isLiquidGlassAvailable } = jest.requireMock('expo-glass-effect');

/** Kart ekran okuyucudan gizli; sorgular gizli ogeleri de kapsiyor. */
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
