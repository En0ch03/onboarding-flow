import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';

import { strings } from '@/constants/strings';
import { opacitiesAbove } from '@/test/opacitiesAbove';
import { renderWithTheme } from '@/test/renderWithTheme';
import { palettes } from '@/theme';

import { BottomSheet } from './BottomSheet';

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

/**
 * Sayfa, ekrandan tamamen kalktigini haber veriyor ve cagiran taraf native bir
 * seciciyi ancak o haberle aciyor. Haberin **ne zaman gitmedigi** de en az ne
 * zaman gittigi kadar onemli: hic acilmamis bir sayfadan gelen haber, bekleyen
 * bir isi zamanindan once calistirirdi.
 */
function Host({ visible, onClosed }: { visible: boolean; onClosed: () => void }) {
  return (
    <BottomSheet visible={visible} title="Baslik" onClose={() => {}} onClosed={onClosed}>
      <Text>icerik</Text>
    </BottomSheet>
  );
}

function Toggling({ onClosed }: { onClosed: () => void }) {
  const [visible, setVisible] = useState(true);

  return (
    <>
      <Text testID="kapat" onPress={() => setVisible(false)}>
        kapat
      </Text>
      <Host visible={visible} onClosed={onClosed} />
    </>
  );
}

describe('BottomSheet', () => {
  it('hic acilmamis sayfa kapanmis sayilmiyor', async () => {
    const onClosed = jest.fn();
    await renderWithTheme(<Host visible={false} onClosed={onClosed} />);

    // Ilk cizimde sayfa zaten yok; buradan gidecek bir haber, cagirani
    // bekleyen isini bosa calistirmaya iterdi.
    expect(onClosed).not.toHaveBeenCalled();
  });

  it('acilip kapanan sayfa bir kez haber veriyor', async () => {
    const onClosed = jest.fn();
    const view = await renderWithTheme(<Toggling onClosed={onClosed} />);

    expect(view.queryByText('icerik')).not.toBeNull();
    expect(onClosed).not.toHaveBeenCalled();

    await act(async () => {
      view.getByTestId('kapat').props.onPress();
    });

    // Kapanis animasyonu suruyor: sayfa hala ekranda ve haber gitmemis olmali.
    expect(onClosed).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(view.queryByText('icerik')).toBeNull();
    });
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it('perdeye dokunarak kapatmak da ayni haberi veriyor', async () => {
    const onClosed = jest.fn();
    const view = await renderWithTheme(<Toggling onClosed={onClosed} />);

    await act(async () => {
      fireEvent.press(view.getByLabelText(strings.common.close));
    });

    // Perde `onClose` cagiriyor; gorunurlugu kaldirmak cagirana ait ve bu
    // testte `Toggling` onu yapmiyor. Sayfa acik kaldigi surece haber de
    // gitmiyor.
    expect(onClosed).not.toHaveBeenCalled();

    await act(async () => {
      view.getByTestId('kapat').props.onPress();
    });
    await waitFor(() => {
      expect(view.queryByText('icerik')).toBeNull();
    });

    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  describe('yuzey', () => {
    it('cam kipte sistemin materyaliyle ciziliyor', async () => {
      const restore = onPlatform('ios');
      try {
        isLiquidGlassAvailable.mockReturnValue(true);

        const view = await renderWithTheme(<Host visible onClosed={() => {}} />);
        // Once agacin gercekten cizildigi: bos bir agacta asagidaki sorgular
        // da "yok" derdi ve kural silinse bile test yesil kalirdi.
        expect(view.getByText('icerik')).toBeTruthy();

        const glass = view.getByTestId('glass-sheet', hidden);
        expect(glass.props.glassEffectStyle).toBe('regular');
        expect(glass.props.colorScheme).toBe('dark');
        // Sayfa suruklenen bir yuzey ama dokunusu tutan sey tutamak
        // bolgesindeki dinleyici; materyalin kendi deformasyonu burada ikinci
        // bir tepki olurdu.
        expect(glass.props.isInteractive).toBeUndefined();
        // Yerel katman kabin yaricapini gormuyor, kendi kosesini okuyor.
        expect(StyleSheet.flatten(glass.props.style)).toMatchObject({
          borderTopLeftRadius: expect.any(Number),
          borderTopRightRadius: expect.any(Number),
        });
      } finally {
        restore();
      }
    });

    it('cam kipte yuzeyin kendi rengi kalmiyor', async () => {
      const restore = onPlatform('ios');
      try {
        isLiquidGlassAvailable.mockReturnValue(true);

        const view = await renderWithTheme(<Host visible onClosed={() => {}} />);
        const surface = StyleSheet.flatten(
          view.getByText('Baslik').parent?.parent?.props.style,
        ) as { backgroundColor?: string };

        // Opak bir dolgu materyali tamamen ortuyor ve cam yeniden duz bir
        // panele donuyor.
        expect(surface.backgroundColor).toBe('transparent');
      } finally {
        restore();
      }
    });

    it('cam yokken bugunku opak yuzey duruyor', async () => {
      const restore = onPlatform('ios');
      try {
        const view = await renderWithTheme(<Host visible onClosed={() => {}} />);
        expect(view.getByText('icerik')).toBeTruthy();

        expect(view.queryByTestId('glass-sheet', hidden)).toBeNull();
        const surface = StyleSheet.flatten(
          view.getByText('Baslik').parent?.parent?.props.style,
        ) as { backgroundColor?: string };
        expect(surface.backgroundColor).toBe(palettes.dark.surfaceRaised);
      } finally {
        restore();
      }
    });

    it('cam yuzey solan bir kabin icinde durmuyor', async () => {
      const restore = onPlatform('ios');
      try {
        isLiquidGlassAvailable.mockReturnValue(true);

        const view = await renderWithTheme(<Host visible onClosed={() => {}} />);
        expect(view.getByText('icerik')).toBeTruthy();

        const glass = view.getByTestId('glass-sheet', hidden);
        // Perde soluyor ama sayfa kayiyor: solan bir kapta sistem materyali de
        // soluyor ve yarim uygulanmis bir efekt gibi gorunuyor.
        expect(opacitiesAbove(glass)).toEqual([]);
        // Ustlerin gercekten gezildigi: gezinme kirilirsa liste bos doner ve
        // iddia hicbir sey olcmez.
        expect(glass.parent).not.toBeNull();
      } finally {
        restore();
      }
    });

    it('Android tarafinda hicbir sey degismiyor', async () => {
      const restore = onPlatform('android');
      try {
        isLiquidGlassAvailable.mockReturnValue(true);

        const view = await renderWithTheme(<Host visible onClosed={() => {}} />);
        expect(view.getByText('icerik')).toBeTruthy();

        expect(view.queryByTestId('glass-sheet', hidden)).toBeNull();
      } finally {
        restore();
      }
    });
  });
});
