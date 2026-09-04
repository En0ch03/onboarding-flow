import { act, cleanup, fireEvent, type RenderResult } from '@testing-library/react-native';

import { renderWithTheme } from '@/test/renderWithTheme';

import { WheelPicker, wheelRowHeight, type WheelItem } from './WheelPicker';

const ROW = wheelRowHeight(1);

/** Kucukten buyuge: gun ve ay carklari boyle diziliyor. */
const ascending: WheelItem[] = [1, 2, 3, 4, 5].map((value) => ({
  value,
  label: String(value),
}));

/** Buyukten kucuge: yil carki boyle diziliyor. */
const descending: WheelItem[] = [2026, 2025, 2024, 2023].map((value) => ({
  value,
  label: String(value),
}));

afterEach(cleanup);

async function mount(items: WheelItem[], value: number) {
  const onChange = jest.fn();
  const view = await renderWithTheme(
    <WheelPicker
      items={items}
      value={value}
      onChange={onChange}
      accessibilityLabel="Çark"
      background="#000000"
      fontScale={1}
    />,
  );
  return { view, onChange, wheel: view.getByLabelText('Çark') };
}

async function fire(view: RenderResult, event: string, payload: object) {
  await act(async () => {
    fireEvent(view.getByLabelText('Çark'), event, payload);
  });
}

const at = (row: number) => ({ nativeEvent: { contentOffset: { y: row * ROW } } });

describe('WheelPicker', () => {
  it('parmak durarak birakildiginda deger isleniyor', async () => {
    const { view, onChange } = await mount(ascending, 1);

    await fire(view, 'scrollBeginDrag', at(0));
    await fire(view, 'scrollEndDrag', at(2));
    // Suzulme baslamadi; bir kare sonra deger kesinlesiyor.
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('suzulme baslarsa aradan gecilen satir islenmiyor', async () => {
    const { view, onChange } = await mount(ascending, 1);

    await fire(view, 'scrollBeginDrag', at(0));
    await fire(view, 'scrollEndDrag', at(1));
    // Parmak birakildiginda cark hala hareket halinde: bu satirin uzerinden
    // yalnizca geciliyor, burada durulmuyor.
    await fire(view, 'momentumScrollBegin', at(1));
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(onChange).not.toHaveBeenCalled();

    await fire(view, 'momentumScrollEnd', at(4));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('liste disina tasan bir konum son satira kirpiliyor', async () => {
    const { view, onChange } = await mount(ascending, 1);

    await fire(view, 'scrollBeginDrag', at(0));
    await fire(view, 'momentumScrollBegin', at(0));
    await fire(view, 'momentumScrollEnd', at(99));

    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('artan listede artir buyuk degeri seciyor', async () => {
    const { view, onChange } = await mount(ascending, 3);
    await fire(view, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('azalan listede de artir buyuk degeri seciyor', async () => {
    // Yil carki buyukten kucuge dizili; "artir" yine daha buyuk yili secmeli,
    // bir satir yukari gitmeyi degil.
    const { view, onChange } = await mount(descending, 2024);
    await fire(view, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onChange).toHaveBeenCalledWith(2025);
  });

  it('azalan listede azalt kucuk degeri seciyor', async () => {
    const { view, onChange } = await mount(descending, 2024);
    await fire(view, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(onChange).toHaveBeenCalledWith(2023);
  });

  it('listenin ucunda kalindiginda deger degismiyor', async () => {
    const { view, onChange } = await mount(ascending, 5);
    await fire(view, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onChange).not.toHaveBeenCalled();
  });
});
