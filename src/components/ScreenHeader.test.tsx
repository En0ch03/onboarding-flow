import { Platform, StyleSheet } from 'react-native';

import { stepCounterLabel, strings } from '@/constants/strings';
import { GLASS_CONTAINER_TEST_ID, GLASS_VIEW_TEST_ID } from '@/test/glassEffectMock';
import { renderWithTheme } from '@/test/renderWithTheme';
import { palettes, spacing } from '@/theme';

import { ScreenHeader } from './ScreenHeader';

const { isLiquidGlassAvailable, isGlassEffectAPIAvailable } = jest.requireMock('expo-glass-effect');

const noop = () => {};

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

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ScreenHeader', () => {
  it('geri hedefi platformlarin asgarisini karsiliyor', async () => {
    const view = await renderWithTheme(<ScreenHeader onBack={noop} />);
    const style = StyleSheet.flatten(
      view.getByLabelText(strings.common.back).props.style,
    ) as Record<string, number>;

    // Dokunma alanini gorunmez bir `hitSlop` ile buyutmek yetmiyor:
    // kullanici gordugu daireye nisan aliyor.
    expect(style.width).toBeGreaterThanOrEqual(48);
    expect(style.height).toBeGreaterThanOrEqual(48);
  });

  it('geri yoksa yerini bos tutuyor: baslik ekrandan ekrana ziplamiyor', async () => {
    const view = await renderWithTheme(<ScreenHeader step={{ current: 2, total: 5 }} />);
    expect(view.queryByLabelText(strings.common.back)).toBeNull();
    expect(view.getByText('02 / 05')).toBeTruthy();
  });

  it('sayaci iki haneli yaziyor ama ekran okuyucuya kelimelerle veriyor', async () => {
    const view = await renderWithTheme(<ScreenHeader step={{ current: 1, total: 6 }} />);
    const counter = view.getByText('01 / 06');

    // Sifir dolgu hizalama icin: sayac adim degistikce genislik degistirirse
    // ust serit her ekranda biraz kayiyor. Ekran okuyucu bu bicimi okumuyor,
    // kendi cumlesini aliyor.
    expect(counter).toBeTruthy();
    expect(counter.props.accessibilityLabel).toBe(stepCounterLabel(1, 6));
  });

  it('gecme dugmesi dokunma hedefini kendisi karsiliyor', async () => {
    const view = await renderWithTheme(
      <ScreenHeader skip={{ label: strings.common.skip, onPress: noop }} />,
    );
    const style = StyleSheet.flatten(
      view.getByLabelText(strings.common.skip).props.style,
    ) as Record<string, number>;

    // Onceki surumde bu bir alti cizili baglantiydi ve hedefi yalnizca
    // gorunmez bir `hitSlop` tasiyordu; cihazda kacirilan bir cikis yolu.
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
  });

  it('geri oku metin glifi degil, cizilmis bir sekil', async () => {
    const view = await renderWithTheme(<ScreenHeader onBack={noop} />);
    expect(view.getByLabelText(strings.common.back)).toBeTruthy();

    // Glif ailenin kesimine gore inceliyor ve dikeyde ortalanmiyordu; cizim
    // yazi tipinden bagimsiz.
    expect(view.queryByText('‹')).toBeNull();
    expect(view.getByTestId('back-chevron')).toBeTruthy();
  });

  it('ok, dairenin icinde bir kil payi kalmiyor', async () => {
    const view = await renderWithTheme(<ScreenHeader onBack={noop} />);
    const style = StyleSheet.flatten(view.getByTestId('back-chevron').props.style) as {
      width: number;
    };

    // Kol kirk bes derece donunce iki kenari bir "<" olusturuyor ve o seklin
    // yuksekligi kolun kosegen izdusumu kadar cikiyor. Kirk sekiz noktalik
    // dairenin icinde bu isaretin gorunur bir agirligi olmali: cok kucuk bir
    // ok, dokunulacak seyin nerede oldugunu soylemiyor.
    const height = style.width * Math.SQRT2;
    expect(height).toBeGreaterThanOrEqual(20);
    expect(height).toBeLessThanOrEqual(24);
  });

  describe('cam kipi', () => {
    /** Ust seridi cam kipinde ciziyor. */
    async function renderLiquid() {
      isLiquidGlassAvailable.mockReturnValue(true);
      return renderWithTheme(
        <ScreenHeader
          onBack={noop}
          step={{ current: 2, total: 5 }}
          skip={{ label: strings.common.skip, onPress: noop }}
        />,
      );
    }

    it('geri ve gecme ayni grubun icinde duruyor', async () => {
      const restore = onPlatform('ios');
      try {
        const view = await renderLiquid();
        // Once agacin gercekten cizildigi: bos bir agacta asagidaki sorgular
        // da "yok" derdi ve kural silinse bile test yesil kalirdi.
        expect(view.getByLabelText(strings.common.back)).toBeTruthy();

        const group = view.getByTestId(GLASS_CONTAINER_TEST_ID, hidden);
        // Mesafe, iki yuzeyin birbirini etkilemeye basladigi uzaklik; grup
        // olmadan sistem seridin iki ucundaki dugmeyi birbirinden habersiz
        // iki yuzey gibi ciziyor.
        expect(group.props.spacing).toBe(spacing.sm);

        expect(view.getByTestId('glass-back', hidden)).toBeTruthy();
        expect(view.getByTestId('glass-skip', hidden)).toBeTruthy();
        expect(
          view.getAllByTestId(/^glass-(back|skip)$/, hidden).map((node) => node.props.testID),
        ).toEqual(['glass-back', 'glass-skip']);
      } finally {
        restore();
      }
    });

    it('iki dugme de sistemin dokunma tepkisini aciyor', async () => {
      const restore = onPlatform('ios');
      try {
        const view = await renderLiquid();
        expect(view.getByLabelText(strings.common.back)).toBeTruthy();

        for (const id of ['glass-back', 'glass-skip']) {
          const glass = view.getByTestId(id, hidden);
          // Basili hali tasiyan sey bu bayrak: kapatilirsa dugme dokunulunca
          // hicbir tepki vermiyor, cunku yedek kipin dolgusu da yok.
          expect(glass.props.isInteractive).toBe(true);
          expect(glass.props.glassEffectStyle).toBe('regular');
          expect(glass.props.colorScheme).toBe('dark');
        }
      } finally {
        restore();
      }
    });

    it('dugmelerin kendi dolgusu ve kenarligi kalmiyor', async () => {
      const restore = onPlatform('ios');
      try {
        const view = await renderLiquid();

        const back = StyleSheet.flatten(
          view.getByLabelText(strings.common.back).props.style,
        ) as Record<string, unknown>;
        const skip = StyleSheet.flatten(
          view.getByLabelText(strings.common.skip).props.style,
        ) as Record<string, unknown>;

        // Opak bir dolgu ya da elle cizilmis bir kenarlik materyalin uzerine
        // biniyor ve onu taklit eden bir katmana donduruyor.
        expect(back.borderWidth).toBeUndefined();
        expect(back.backgroundColor).toBeUndefined();
        expect(skip.backgroundColor).toBeUndefined();
      } finally {
        restore();
      }
    });

    it('sayac cam degil: okunacak bir metin, dokunulacak bir hedef degil', async () => {
      const restore = onPlatform('ios');
      try {
        const view = await renderLiquid();
        expect(view.getByText('02 / 05')).toBeTruthy();

        // Serit uzerindeki cam yuzeyler yalnizca iki dugme; ucuncu bir yuzey
        // sayacin da cama alindigi anlamina gelir.
        expect(view.queryAllByTestId(GLASS_VIEW_TEST_ID, hidden)).toHaveLength(0);
      } finally {
        restore();
      }
    });

    it('cam yokken serit bugunku ciziminde kaliyor', async () => {
      const restore = onPlatform('ios');
      try {
        const view = await renderWithTheme(
          <ScreenHeader
            onBack={noop}
            skip={{ label: strings.common.skip, onPress: noop }}
          />,
        );
        expect(view.getByLabelText(strings.common.back)).toBeTruthy();

        expect(view.queryByTestId(GLASS_CONTAINER_TEST_ID, hidden)).toBeNull();
        expect(view.queryByTestId('glass-back', hidden)).toBeNull();

        const back = StyleSheet.flatten(
          view.getByLabelText(strings.common.back).props.style,
        ) as Record<string, unknown>;
        expect(back.backgroundColor).toBe(palettes.dark.surface);
        expect(back.borderWidth).toBe(1);
      } finally {
        restore();
      }
    });

    it('Android tarafinda hicbir sey degismiyor', async () => {
      const restore = onPlatform('android');
      try {
        // Tasarim dili acik olsa bile: cam yalnizca iOS'ta var ve kip secimi
        // once platformu soruyor.
        isLiquidGlassAvailable.mockReturnValue(true);

        const view = await renderWithTheme(
          <ScreenHeader
            onBack={noop}
            skip={{ label: strings.common.skip, onPress: noop }}
          />,
        );
        expect(view.getByLabelText(strings.common.back)).toBeTruthy();

        expect(view.queryByTestId(GLASS_CONTAINER_TEST_ID, hidden)).toBeNull();
        expect(view.queryByTestId('glass-back', hidden)).toBeNull();
        expect(view.queryByTestId('glass-skip', hidden)).toBeNull();
      } finally {
        restore();
      }
    });
  });
});
