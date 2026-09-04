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

async function mount(selected: string[]) {
  const onPress = jest.fn();
  const view = await renderWithTheme(
    <ChipGrid
      options={options}
      isSelected={(id) => selected.includes(id)}
      isDisabled={() => false}
      onPress={onPress}
    />,
  );
  return { view, onPress };
}

/** Cipin dis kabugunun duzlestirilmis bicimi. */
function chipStyle(view: Awaited<ReturnType<typeof renderWithTheme>>, label: string) {
  return StyleSheet.flatten(view.getByLabelText(label).props.style) as Record<string, unknown>;
}

async function layout(view: Awaited<ReturnType<typeof renderWithTheme>>, width: number) {
  await act(async () => {
    fireEvent(view.getByLabelText('Kitap').parent!, 'layout', {
      nativeEvent: { layout: { width, height: 0, x: 0, y: 0 } },
    });
  });
}

describe('ChipGrid', () => {
  it('etikete secim isareti karistirmiyor', async () => {
    const { view } = await mount(['books']);
    // Eski surumde secili cipin metni "✓  Kitap" oluyordu ve cip genisliyordu.
    expect(view.getByText('Kitap')).toBeTruthy();
    expect(view.queryByText('✓  Kitap')).toBeNull();
  });

  it('secili ve secili olmayan cip ayni olculerde', async () => {
    const off = await mount([]);
    const on = await mount(['books']);

    const a = chipStyle(off.view, 'Kitap');
    const b = chipStyle(on.view, 'Kitap');

    for (const key of ['paddingVertical', 'paddingHorizontal', 'borderWidth', 'width'] as const) {
      expect(b[key]).toBe(a[key]);
    }
  });

  it('olculen genisligi esit sutunlara boluyor', async () => {
    const { view } = await mount([]);
    await layout(view, 342);

    const widths = options.map((option) => chipStyle(view, option.label).width);
    // 342 genislik, uc sutun, aralarinda 8 birim bosluk.
    expect(widths).toEqual([108, 108, 108, 108]);
  });

  it('dar ekranda iki sutuna, tablette dorde gidiyor', async () => {
    const narrow = await mount([]);
    await layout(narrow.view, 260);
    expect(chipStyle(narrow.view, 'Kitap').width).toBe(126);

    const wide = await mount([]);
    await layout(wide.view, 700);
    expect(chipStyle(wide.view, 'Kitap').width).toBe(169);
  });

  it('secim degisince genislik degismiyor', async () => {
    const off = await mount([]);
    await layout(off.view, 342);
    const on = await mount(['books']);
    await layout(on.view, 342);

    expect(chipStyle(on.view, 'Kitap').width).toBe(chipStyle(off.view, 'Kitap').width);
  });

  it('dokunulan secenegin kimligini bildiriyor', async () => {
    const { view, onPress } = await mount([]);
    await act(async () => {
      fireEvent.press(view.getByLabelText('Kahve'));
    });
    expect(onPress).toHaveBeenCalledWith('coffee');
  });

  it('etiket kirpilmiyor', async () => {
    // Kesilmis bir etiket kullaniciya ne sectigini soylemiyor.
    const { view } = await mount([]);
    expect(view.getByText('Uzun yürüyüş').props.numberOfLines).toBeUndefined();
  });

  it('etiket sabit genislikteki hucrede sarabiliyor', async () => {
    // Sarmayi mumkun kilan tek sey bu: bu ortamda varsayilan sifir, yani
    // stil silinirse etiket kirpilmaz ama cipten tasar ve kapanan hata
    // sessizce geri gelir.
    const { view } = await mount([]);
    const label = StyleSheet.flatten(view.getByText('Uzun yürüyüş').props.style) as Record<
      string,
      unknown
    >;

    expect(label.flexShrink).toBe(1);
  });

  it('secim isareti sistem yazisiyla sinirsiz buyumuyor', async () => {
    // Yuva sabit genislikte; tavansiz bir glif onu asip etiketin uzerine
    // biniyordu. Isaretin tasidigi bilgi ekran okuyucuya ayrica veriliyor.
    const { view } = await mount(['books']);
    const mark = view.getByText('✓');

    expect(mark.props.maxFontSizeMultiplier).toBe(1.5);
  });
});
