import { waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Platform, StyleSheet } from 'react-native';

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

/**
 * Gelistirme bayragini gecici olarak degistirir. Rozetin urun derlemesinde hic
 * cizilmedigi ancak bayrak kapatilarak sinanabilir.
 */
function onDevFlag(value: boolean) {
  const scope = globalThis as unknown as { __DEV__: boolean };
  const original = scope.__DEV__;
  scope.__DEV__ = value;
  return () => {
    scope.__DEV__ = original;
  };
}

/** Rozetin ekrandaki metnini tek parca dizeye ceviriyor. */
function badgeText(node: { props: Record<string, unknown> }) {
  return String(node.props.children);
}

/** `rgba(...)` dizesinden opaklik degerini okuyor. */
function alphaOf(color: string) {
  return Number(/rgba\([^)]*,\s*([\d.]+)\)\s*$/.exec(color)?.[1]);
}

beforeEach(() => {
  isLiquidGlassAvailable.mockReturnValue(false);
  isGlassEffectAPIAvailable.mockReturnValue(true);
  jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(false);
});

afterEach(() => {
  jest.restoreAllMocks();
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
      expect(glass.props.tintColor).toBe(withAlpha(palettes.dark.paper, 0.4));
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

  it('cam efekti olmayan surumde sistemin kendi materyaline dusuyor', async () => {
    const restore = onPlatform('ios');
    try {
      const view = await renderWithTheme(
        <GlassPanel>
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );
      expect(view.getByText('İçerik')).toBeTruthy();

      const blur = view.getByTestId(BLUR_VIEW_TEST_ID, hidden);
      // `dark` iOS 10 oncesinden kalma duz bir bulaniklik; sistemin materyal
      // ailesi ayri ve arkadaki renkleri koruyan tek secenek o.
      expect(blur.props.tint).toBe('systemThinMaterialDark');
      // Siddet, materyali kuran animatorun ilerleme orani olarak okunuyor: 100
      // disindaki her deger materyali yarida birakiyor.
      expect(blur.props.intensity).toBe(100);
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
      expect(fill.backgroundColor).toBe(withAlpha(palettes.dark.paper, 0.4));
    } finally {
      restore();
    }
  });

  it('dolgunun opakligi okunabilirlikle cam hissi arasindaki citin icinde', async () => {
    const restore = onPlatform('ios');
    try {
      const view = await renderWithTheme(
        <GlassPanel>
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );
      expect(view.getByText('İçerik')).toBeTruthy();

      const fill = StyleSheet.flatten(view.getByTestId('glass-panel-fill', hidden).props.style) as {
        backgroundColor: string;
      };
      // Alt sinir metnin zemini, ust sinir camin kendisi: daha opak bir dolgu
      // arkadaki gorseli bogar ve kart yeniden duz panele doner.
      expect(alphaOf(fill.backgroundColor)).toBeGreaterThanOrEqual(0.4);
      expect(alphaOf(fill.backgroundColor)).toBeLessThanOrEqual(0.5);
    } finally {
      restore();
    }
  });

  it('kartin ustunde isik, altinda golge var', async () => {
    const restore = onPlatform('ios');
    try {
      const view = await renderWithTheme(
        <GlassPanel>
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );
      expect(view.getByText('İçerik')).toBeTruthy();

      const top = StyleSheet.flatten(view.getByTestId('glass-panel-edge-top', hidden).props.style);
      const bottom = StyleSheet.flatten(
        view.getByTestId('glass-panel-edge-bottom', hidden).props.style,
      );
      expect(top).toMatchObject({ backgroundColor: withAlpha(palettes.dark.ink, 0.3) });
      expect(bottom).toMatchObject({ backgroundColor: withAlpha(palettes.dark.veil, 0.35) });

      // Kenarlik iki cizginin arasinda kalmali; kendi tonu one cikarsa kart
      // yuzey degil cerceve gibi duruyor.
      expect(StyleSheet.flatten(view.getByTestId('glass-panel').props.style)).toMatchObject({
        borderColor: withAlpha(palettes.dark.ink, 0.12),
      });
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

  describe('teshis rozeti', () => {
    it('urun derlemesinde hic cizilmiyor', async () => {
      const restore = onPlatform('ios');
      const restoreDev = onDevFlag(false);
      try {
        const view = await renderWithTheme(
          <GlassPanel>
            <AppText>İçerik</AppText>
          </GlassPanel>,
        );
        expect(view.getByText('İçerik')).toBeTruthy();

        expect(view.queryByTestId('glass-mode-badge', hidden)).toBeNull();
      } finally {
        restoreDev();
        restore();
      }
    });

    it('bulanik kipte kipin harfini gosteriyor', async () => {
      const restore = onPlatform('ios');
      const restoreDev = onDevFlag(true);
      try {
        const view = await renderWithTheme(
          <GlassPanel>
            <AppText>İçerik</AppText>
          </GlassPanel>,
        );
        expect(view.getByText('İçerik')).toBeTruthy();

        expect(badgeText(view.getByTestId('glass-mode-badge', hidden))).toMatch(/^B · /);
      } finally {
        restoreDev();
        restore();
      }
    });

    it('cam kipte kipin harfini gosteriyor', async () => {
      const restore = onPlatform('ios');
      const restoreDev = onDevFlag(true);
      try {
        isLiquidGlassAvailable.mockReturnValue(true);
        const view = await renderWithTheme(
          <GlassPanel>
            <AppText>İçerik</AppText>
          </GlassPanel>,
        );
        expect(view.getByText('İçerik')).toBeTruthy();

        expect(badgeText(view.getByTestId('glass-mode-badge', hidden))).toMatch(/^L · /);
      } finally {
        restoreDev();
        restore();
      }
    });

    it('Android tarafinda duz kartin harfini gosteriyor', async () => {
      const restore = onPlatform('android');
      const restoreDev = onDevFlag(true);
      try {
        const view = await renderWithTheme(
          <GlassPanel>
            <AppText>İçerik</AppText>
          </GlassPanel>,
        );
        expect(view.getByText('İçerik')).toBeTruthy();

        expect(badgeText(view.getByTestId('glass-mode-badge', hidden))).toMatch(/^F · /);
      } finally {
        restoreDev();
        restore();
      }
    });

    it('saydamligin kisitli oldugunu yaziyor', async () => {
      const restore = onPlatform('ios');
      const restoreDev = onDevFlag(true);
      try {
        jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(true);

        const view = await renderWithTheme(
          <GlassPanel>
            <AppText>İçerik</AppText>
          </GlassPanel>,
        );
        expect(view.getByText('İçerik')).toBeTruthy();

        // Sistem saydamligi kisitliyorsa cam duz bir yuzeye duser; "efekt tam
        // olmamis" gorunumunun kod disindaki aciklamasi bu.
        await waitFor(() =>
          expect(badgeText(view.getByTestId('glass-mode-badge', hidden))).toContain(
            'saydamlık kısıtlı',
          ),
        );
      } finally {
        restoreDev();
        restore();
      }
    });

    it('saydamlik sorusu cevapsiz kalirsa soru isareti yaziyor', async () => {
      const restore = onPlatform('ios');
      const restoreDev = onDevFlag(true);
      try {
        jest
          .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
          .mockRejectedValue(new Error('yok'));

        const view = await renderWithTheme(
          <GlassPanel>
            <AppText>İçerik</AppText>
          </GlassPanel>,
        );
        expect(view.getByText('İçerik')).toBeTruthy();

        await waitFor(() =>
          expect(badgeText(view.getByTestId('glass-mode-badge', hidden))).toContain('saydamlık ?'),
        );
      } finally {
        restoreDev();
        restore();
      }
    });

    it('rozet ekran okuyucudan gizli', async () => {
      const restore = onPlatform('ios');
      const restoreDev = onDevFlag(true);
      try {
        const view = await renderWithTheme(
          <GlassPanel>
            <AppText>İçerik</AppText>
          </GlassPanel>,
        );
        expect(view.getByText('İçerik')).toBeTruthy();

        // Gizli ogeleri katmayan sorgu: rozet gelistiriciye ait, ekran
        // okuyucunun okuyacagi bir icerik degil.
        expect(view.queryByTestId('glass-mode-badge')).toBeNull();
      } finally {
        restoreDev();
        restore();
      }
    });
  });
});
