import { Platform, StyleSheet } from 'react-native';

import { GLASS_VIEW_TEST_ID } from '@/test/glassEffectMock';
import { renderWithTheme } from '@/test/renderWithTheme';
import { palettes, radius, shadows, withAlpha } from '@/theme';

import { Button } from './Button';

const { isLiquidGlassAvailable, isGlassEffectAPIAvailable } = jest.requireMock('expo-glass-effect');

/** Arka katmanlar ekran okuyucudan gizli; sorgular gizli ogeleri de kapsiyor. */
const hidden = { includeHiddenElements: true } as const;

const noop = () => {};

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

describe('Button', () => {
  it('ikincil eylem cam kipte sistemin materyaliyle ciziliyor', async () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);

      const view = await renderWithTheme(<Button title="Vazgeç" onPress={noop} variant="ghost" />);
      // Once agacin gercekten cizildigi: bos bir agacta asagidaki sorgular da
      // "yok" derdi ve kural silinse bile test yesil kalirdi.
      expect(view.getByText('Vazgeç')).toBeTruthy();

      const glass = view.getByTestId('glass-ghost', hidden);
      expect(glass.props.glassEffectStyle).toBe('regular');
      // Basili hali tasiyan sey bu bayrak: kapatilirsa dugme dokunulunca
      // hicbir tepki vermiyor, cunku yedek kipin kenarligi da yok.
      expect(glass.props.isInteractive).toBe(true);
      expect(glass.props.colorScheme).toBe('dark');
      expect(StyleSheet.flatten(glass.props.style)).toMatchObject({
        borderRadius: radius.full,
      });
    } finally {
      restore();
    }
  });

  it('birincil eylem yedek kipte kizil gradyanla kaliyor, cama cevrilmiyor', async () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(false);

      const view = await renderWithTheme(<Button title="Devam" onPress={noop} />);
      expect(view.getByText('Devam')).toBeTruthy();

      // Yerel cam yoksa (blur kipi) bugunku gradyan ve golge oldugu gibi
      // kaliyor.
      expect(view.queryByTestId('glass-primary', hidden)).toBeNull();
      expect(view.queryByTestId(GLASS_VIEW_TEST_ID, hidden)).toBeNull();
      expect(StyleSheet.flatten(view.getByRole('button').props.style)).toMatchObject({
        boxShadow: shadows.dark.soft,
      });
    } finally {
      restore();
    }
  });

  it('birincil eylem liquid kipte kizil tonuyla cama ciziliyor, gradyan ve golge kalkiyor', async () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);

      const view = await renderWithTheme(<Button title="Devam" onPress={noop} />);
      expect(view.getByText('Devam')).toBeTruthy();

      const glass = view.getByTestId('glass-primary', hidden);
      expect(glass.props.glassEffectStyle).toBe('regular');
      // Renk camin ustune boyanmiyor, malzemenin kendi tonu olarak veriliyor.
      expect(glass.props.tintColor).toBe(palettes.dark.clay);
      expect(glass.props.isInteractive).toBe(true);
      expect(glass.props.colorScheme).toBe('dark');
      expect(StyleSheet.flatten(glass.props.style)).toMatchObject({
        borderRadius: radius.full,
      });

      // Cam kendi derinligini tasiyor; altina golge eklemek malzemenin
      // optigini bozardi.
      expect(StyleSheet.flatten(view.getByRole('button').props.style)).not.toMatchObject({
        boxShadow: shadows.dark.soft,
      });
    } finally {
      restore();
    }
  });

  it('yukleyen birincil eylem liquid kipte cama girmiyor', async () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);

      const view = await renderWithTheme(<Button title="Devam" onPress={noop} loading />);

      // Yukleniyor hali butun butonun solmasiyla anlatiliyor; solan bir kapta
      // sistem materyali de soluyor ve yarim uygulanmis bir efekte donerdi.
      expect(view.queryByTestId('glass-primary', hidden)).toBeNull();
    } finally {
      restore();
    }
  });

  it('devre disi birincil eylem liquid kipte cama girmiyor', async () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);

      const view = await renderWithTheme(<Button title="Devam" onPress={noop} disabled />);

      expect(view.queryByTestId('glass-primary', hidden)).toBeNull();
    } finally {
      restore();
    }
  });

  it('birincil eylem Android tarafinda cama girmiyor', async () => {
    const restore = onPlatform('android');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);

      const view = await renderWithTheme(<Button title="Devam" onPress={noop} />);
      expect(view.getByText('Devam')).toBeTruthy();

      expect(view.queryByTestId('glass-primary', hidden)).toBeNull();
    } finally {
      restore();
    }
  });

  it('yuklenen ikincil eylem dokununca deforme olmuyor', async () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);

      const view = await renderWithTheme(
        <Button title="Vazgeç" onPress={noop} variant="ghost" loading />,
      );
      expect(view.getByText('Vazgeç')).toBeTruthy();

      // Buton hala cam -- solmuyor, yerinde duruyor. Ama dokunusu kabul
      // etmiyor ve dokununca deforme olmasi, olmayan bir tepkiyi vaat ederdi.
      expect(view.getByTestId('glass-ghost', hidden).props.isInteractive).toBe(false);
    } finally {
      restore();
    }
  });

  it('devre disi ikincil eylem cama alinmiyor', async () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);

      const view = await renderWithTheme(
        <Button title="Vazgeç" onPress={noop} variant="ghost" disabled />,
      );
      expect(view.getByText('Vazgeç')).toBeTruthy();

      // Devre disi hali anlatan sey butun butonun solmasi; solan bir kapta
      // sistem materyali de soluyor ve yarim uygulanmis bir efekte donuyor.
      expect(view.queryByTestId('glass-ghost', hidden)).toBeNull();
    } finally {
      restore();
    }
  });

  it('cam yokken ikincil eylem bugunku kenarligini koruyor', async () => {
    const restore = onPlatform('ios');
    try {
      const view = await renderWithTheme(<Button title="Vazgeç" onPress={noop} variant="ghost" />);
      expect(view.getByText('Vazgeç')).toBeTruthy();

      expect(view.queryByTestId('glass-ghost', hidden)).toBeNull();

      expect(StyleSheet.flatten(view.getByTestId('ghost-edge', hidden).props.style)).toMatchObject({
        borderWidth: 1,
        borderColor: withAlpha(palettes.dark.ink, 0.4),
      });
    } finally {
      restore();
    }
  });

  it('Android tarafinda ikincil eylem degismiyor', async () => {
    const restore = onPlatform('android');
    try {
      // Tasarim dili acik olsa bile: cam yalnizca iOS'ta var ve kip secimi
      // once platformu soruyor.
      isLiquidGlassAvailable.mockReturnValue(true);

      const view = await renderWithTheme(<Button title="Vazgeç" onPress={noop} variant="ghost" />);
      expect(view.getByText('Vazgeç')).toBeTruthy();

      expect(view.queryByTestId('glass-ghost', hidden)).toBeNull();
    } finally {
      restore();
    }
  });
});
