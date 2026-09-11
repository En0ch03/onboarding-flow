import { within } from '@testing-library/react-native';
import { Platform, StyleSheet } from 'react-native';

import { BLUR_VIEW_TEST_ID } from '@/test/blurMock';
import { GLASS_VIEW_TEST_ID } from '@/test/glassEffectMock';
import { renderWithTheme } from '@/test/renderWithTheme';
import { palettes, radius, spacing, withAlpha } from '@/theme';

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

/** `rgba(...)` dizesinden opaklik degerini okuyor. */
function alphaOf(color: string) {
  return Number(/rgba\([^)]*,\s*([\d.]+)\)\s*$/.exec(color)?.[1]);
}

beforeEach(() => {
  isLiquidGlassAvailable.mockReturnValue(false);
  isGlassEffectAPIAvailable.mockReturnValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GlassPanel', () => {
  it('yedek kipte dekoratif katmanlar dokunusu gecirmiyor ve ekran okuyucudan gizli', async () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(false);
      const view = await renderWithTheme(
        <GlassPanel>
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );
      expect(view.getByText('İçerik')).toBeTruthy();

      // Katmanlar kartin tamamini kapliyor: dokunusu gecirmeseler formun
      // hicbir alanina basilamaz, gizli olmasalar ekran okuyucu bos ogeler
      // okur. Sorgu gizli ogeleri katmiyor; katman bulunursa gizli degildir.
      for (const id of ['glass-panel-fill', 'glass-panel-edge-top', 'glass-panel-edge-bottom']) {
        expect(view.getByTestId(id, hidden).props.pointerEvents).toBe('none');
        expect(view.queryByTestId(id)).toBeNull();
      }
    } finally {
      restore();
    }
  });

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
      // Yerel katman kartin `overflow: hidden` kirpmasini gormuyor, kendi kose
      // yaricapini okuyor: verilmezse cam dort koseli bir dikdortgen kaliyor.
      expect(StyleSheet.flatten(glass.props.style)).toMatchObject({
        borderRadius: radius.glass,
      });
      // Icerik camin icinde: sistemin materyali cocuklarini kendi icerik
      // katmanina aliyor, kirilma ve isik onlarin arkasinda kalmiyor.
      expect(within(glass).getByText('İçerik')).toBeTruthy();
      expect(view.queryByTestId(BLUR_VIEW_TEST_ID, hidden)).toBeNull();
    } finally {
      restore();
    }
  });

  it('kartin kosesi ve ic dolgusu kirilmaya yer biraktiriyor', async () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);

      const view = await renderWithTheme(
        <GlassPanel>
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );
      expect(view.getByText('İçerik')).toBeTruthy();

      // Cam kirilmayi kenarda gosteriyor: dar bir ic dolguda kenar bandi
      // icerigin altinda kaliyor ve kart dolu bir panel gibi okunuyor. Dolgu
      // camin icinde, cunku icerik artik camin cocugu.
      expect(StyleSheet.flatten(view.getByTestId('glass-panel').props.style)).toMatchObject({
        borderRadius: radius.glass,
      });
      expect(
        StyleSheet.flatten(view.getByTestId(GLASS_VIEW_TEST_ID, hidden).props.style),
      ).toMatchObject({
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.xl,
      });
    } finally {
      restore();
    }
  });

  it('cam kipte materyalin uzerine hicbir katman koymuyor', async () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);

      const view = await renderWithTheme(
        <GlassPanel>
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );
      expect(view.getByText('İçerik')).toBeTruthy();
      expect(view.getByTestId(GLASS_VIEW_TEST_ID, hidden)).toBeTruthy();

      // Dolgu, ust isigi ve alt golgesi yedek kiplerin isi. Cam kipte hepsi
      // materyalin kendi davranisinin uzerine binen taklit katmanlar.
      expect(view.queryByTestId('glass-panel-fill', hidden)).toBeNull();
      expect(view.queryByTestId('glass-panel-edge-top', hidden)).toBeNull();
      expect(view.queryByTestId('glass-panel-edge-bottom', hidden)).toBeNull();

      const panel = StyleSheet.flatten(view.getByTestId('glass-panel').props.style) as {
        borderWidth?: number;
        borderColor?: string;
      };
      expect(panel.borderWidth).toBeUndefined();
      expect(panel.borderColor).toBeUndefined();
    } finally {
      restore();
    }
  });

  it('istenirse saydam materyale geciyor, varsayilani uyum yapan', async () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);

      const clear = await renderWithTheme(
        <GlassPanel glassStyle="clear">
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );
      expect(clear.getByText('İçerik')).toBeTruthy();
      expect(clear.getByTestId(GLASS_VIEW_TEST_ID, hidden).props.glassEffectStyle).toBe('clear');

      const regular = await renderWithTheme(
        <GlassPanel>
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );
      expect(regular.getByText('İçerik')).toBeTruthy();
      // Varsayilan uyum yapan materyal: saydami isteyen yuzey bunu acikca
      // soyler, cunku kontrasti kendi arka planina gore ustlenmis olur.
      expect(regular.getByTestId(GLASS_VIEW_TEST_ID, hidden).props.glassEffectStyle).toBe(
        'regular',
      );
    } finally {
      restore();
    }
  });

  it('cam kipte tona karismiyor: optik sistemin', async () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);

      const view = await renderWithTheme(
        <GlassPanel>
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );
      expect(view.getByText('İçerik')).toBeTruthy();

      const glass = view.getByTestId(GLASS_VIEW_TEST_ID, hidden);
      // Ton verilirse materyal arkadaki parlakliga gore kendi ton
      // haritasini kuramiyor; kart yeniden elle boyanmis bir yuzeye donuyor.
      expect(glass.props.tintColor).toBeUndefined();
      // Sema `auto`: materyal arkadaki iceriğe gore kendi tonunu secer; kart
      // istedigi zaman prop ile ezebilir.
      expect(glass.props.colorScheme).toBe('auto');
      // Etkilesimli degil: kart bir kontrol degil, yuzey.
      expect(glass.props.isInteractive).toBe(false);
    } finally {
      restore();
    }
  });

  it('istenirse materyalin semasini uygulamanin temasindan ayri verebiliyor', async () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);

      const view = await renderWithTheme(
        <GlassPanel colorScheme="light">
          <AppText>İçerik</AppText>
        </GlassPanel>,
      );
      expect(view.getByText('İçerik')).toBeTruthy();
      expect(view.getByTestId(GLASS_VIEW_TEST_ID, hidden).props.colorScheme).toBe('light');
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
      // Cam icerigi tasiyor, o yuzden gizli degil; gizli olan arkasindaki
      // karartma katmani. Gizli ogeleri katmayan sorgu onu bulamamali ve
      // dokunusu gecirmemeli.
      expect(glassView.getByTestId(GLASS_VIEW_TEST_ID)).toBeTruthy();
      expect(glassView.queryByTestId('glass-panel-dimming')).toBeNull();
      expect(glassView.getByTestId('glass-panel-dimming', hidden).props.pointerEvents).toBe('none');

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
