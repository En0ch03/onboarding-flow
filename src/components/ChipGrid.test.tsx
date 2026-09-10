import { act, cleanup, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import type { Option } from '@/api/schemas';
import { renderWithTheme } from '@/test/renderWithTheme';

import { ChipGrid } from './ChipGrid';

const options: Option[] = [
  { id: 'books', label: 'Kitap' },
  { id: 'coffee', label: 'Kahve' },
  { id: 'cinema', label: 'Sinema' },
  { id: 'walking', label: 'Uzun yürüyüş' },
];

afterEach(cleanup);

async function mount(selected: string[], blocked: string[] = []) {
  const onPress = jest.fn();
  const view = await renderWithTheme(
    <ChipGrid
      options={options}
      isSelected={(id) => selected.includes(id)}
      isBlocked={(id) => blocked.includes(id)}
      blockedHint={(id) => (blocked.includes(id) ? 'Once birini birak' : undefined)}
      onPress={onPress}
    />,
  );
  // Agac gercekten cizildi mi: bos bir agacta asagidaki negatif iddialar da
  // gecerdi ve test yanlis sebeple yesil kalirdi.
  expect(view.getByText('Kitap')).toBeTruthy();
  return { view, onPress };
}

type ChipShell = {
  borderWidth: number;
  paddingHorizontal: number;
  paddingVertical: number;
  opacity: number;
  width?: number;
};

/** Cipin dis kabugunun duzlestirilmis bicimi. */
function chipStyle(view: Awaited<ReturnType<typeof renderWithTheme>>, label: string): ChipShell {
  return StyleSheet.flatten(view.getByLabelText(label).props.style) as ChipShell;
}

describe('ChipGrid', () => {
  it('hicbir cipte onay isareti yok', async () => {
    const { view } = await mount(['books']);
    // Secim kenarlik ve dolguyla anlatiliyor. Bos bir isaret yuvasi
    // kullaniciya hicbir sey soylemiyordu, dolu olani da etiketin yerini
    // caliyordu.
    expect(view.queryByText('✓')).toBeNull();
  });

  it('secim cipin olculerini degistirmiyor', async () => {
    const off = await mount([]);
    const on = await mount(['books']);

    const a = chipStyle(off.view, 'Kitap');
    const b = chipStyle(on.view, 'Kitap');

    // Kenarlik secilince kalinlasiyor; ic bosluk ayni miktarda kucululuyor.
    // Toplam ayni kalmazsa dokunulan cip parmagin altinda buyur ve komsu
    // cipler kayar.
    expect(b.borderWidth + b.paddingHorizontal).toBe(a.borderWidth + a.paddingHorizontal);
    expect(b.borderWidth + b.paddingVertical).toBe(a.borderWidth + a.paddingVertical);
  });

  it('secili durumu yalnizca renkle anlatmiyor', async () => {
    const off = await mount([]);
    const on = await mount(['books']);

    // Rengi ayirt edemeyen kullanici icin kenarlik kalinligi ikinci kanal.
    expect(chipStyle(off.view, 'Kitap').borderWidth).toBe(1);
    expect(chipStyle(on.view, 'Kitap').borderWidth).toBe(2);
  });

  it('etiket tek satirda kaliyor', async () => {
    const { view } = await mount([]);
    // Cip etiketi kadar genisledigi icin kirilmasina gerek yok; alt alta
    // yazilan bir etiket cipi bir karta cevirir.
    expect(view.getByText('Uzun yürüyüş').props.numberOfLines).toBe(1);
  });

  it('cip kendi genisligini etiketinden aliyor', async () => {
    const { view } = await mount([]);
    // Disaridan dayatilan bir hucre genisligi yok: esit sutun, uzun etiketi
    // dikey kiriyordu.
    expect(chipStyle(view, 'Uzun yürüyüş').width).toBeUndefined();
  });

  it('cipler dolan satirin ardindan alta sariyor', async () => {
    const { view } = await mount([]);
    const container = StyleSheet.flatten(
      view.getByTestId('chip-grid').props.style,
    ) as unknown as Record<string, unknown>;

    expect(container.flexDirection).toBe('row');
    expect(container.flexWrap).toBe('wrap');
  });

  it('secili durum ekran okuyucuya tasiniyor', async () => {
    const { view } = await mount(['books']);

    expect(view.getByLabelText('Kitap').props.accessibilityState.checked).toBe(true);
    expect(view.getByLabelText('Kahve').props.accessibilityState.checked).toBe(false);
  });

  it('dokunulan secenegin kimligini bildiriyor', async () => {
    const { view, onPress } = await mount([]);
    await act(async () => {
      fireEvent.press(view.getByLabelText('Kahve'));
    });
    expect(onPress).toHaveBeenCalledWith('coffee');
  });

  it('sinir dolunca cip sonuk ama dokunulabilir kaliyor', async () => {
    const { view, onPress } = await mount([], ['cinema']);

    expect(chipStyle(view, 'Sinema').opacity).toBe(0.45);
    await act(async () => {
      fireEvent.press(view.getByLabelText('Sinema'));
    });
    // Dokunus reddi soyluyor; sessizce olen bir cip sebebini anlatamaz.
    expect(onPress).toHaveBeenCalledWith('cinema');
  });

  it('nabiz durgun halde cipi yerinden oynatmiyor', async () => {
    const { view } = await mount(['books']);
    const pulse = StyleSheet.flatten(view.getByTestId('chip-pulse-books').props.style) as {
      transform: { scale: number }[];
    };

    // Nabiz secim anina ait; durgun cip bir olcekte duruyor, yoksa izgara
    // kalici olarak kaymis olurdu.
    expect(pulse.transform).toEqual([{ scale: 1 }]);
  });
});
