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

describe('ChipGrid', () => {
  it('etikete secim isareti karistirmiyor', async () => {
    const { view } = await mount(['books']);
    // Eski surumde secili cipin metni "✓  Kitap" oluyordu ve cip genisliyordu.
    expect(view.getByText('Kitap')).toBeTruthy();
    expect(view.queryByText('✓  Kitap')).toBeNull();
  });

  it('cipe genislik dayatmiyor: her cip kendi etiketi kadar', async () => {
    const { view } = await mount([]);
    for (const option of options) {
      expect(chipStyle(view, option.label).width).toBeUndefined();
    }
  });

  it('cipler satirdaki artan bosluğu paylasiyor', async () => {
    const { view } = await mount([]);
    for (const option of options) {
      expect(chipStyle(view, option.label).flexGrow).toBe(1);
    }
  });

  it('etiket kirpilmiyor', async () => {
    const { view } = await mount([]);
    expect(view.getByText('Uzun yürüyüş').props.numberOfLines).toBeUndefined();
  });

  it('secili ve secili olmayan cip ayni olculerde', async () => {
    const off = await mount([]);
    const on = await mount(['books']);

    const a = chipStyle(off.view, 'Kitap');
    const b = chipStyle(on.view, 'Kitap');

    for (const key of ['paddingVertical', 'paddingHorizontal', 'borderWidth', 'width'] as const) {
      expect(b[key]).toBe(a[key]);
    }
    // Isaret yuvasi secili olmayan cipte de var: metin yer degistirmiyor.
    expect(on.view.getByText('Kitap')).toBeTruthy();
  });

  it('dokunulan secenegin kimligini bildiriyor', async () => {
    const { view, onPress } = await mount([]);
    await act(async () => {
      fireEvent.press(view.getByLabelText('Kahve'));
    });
    expect(onPress).toHaveBeenCalledWith('coffee');
  });
});
