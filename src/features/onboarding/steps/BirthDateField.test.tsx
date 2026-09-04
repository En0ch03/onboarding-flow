import { act, cleanup, fireEvent, type RenderResult } from '@testing-library/react-native';

import { strings } from '@/constants/strings';
import { renderWithTheme } from '@/test/renderWithTheme';

import { BirthDateField } from './BirthDateField';
import type { PartialDate } from './dateParts';

const today = new Date(2026, 8, 4);
const empty: PartialDate = { day: null, month: null, year: null };

afterEach(cleanup);

async function mount(value: PartialDate) {
  const onChange = jest.fn();
  const view = await renderWithTheme(
    <BirthDateField value={value} onChange={onChange} today={today} />,
  );
  return { view, onChange };
}

async function press(view: RenderResult, element: Parameters<typeof fireEvent.press>[0]) {
  await act(async () => {
    fireEvent.press(element);
  });
}

/** Sayfa acikken listenin satirlari; alanin kendi etiketi disarida kaliyor. */
function rows(view: RenderResult, label: string) {
  return view.queryAllByLabelText(label);
}

describe('BirthDateField', () => {
  it('uc ayri alan sunuyor', async () => {
    const { view } = await mount(empty);
    expect(view.getByLabelText(strings.steps.dayLabel)).toBeTruthy();
    expect(view.getByLabelText(strings.steps.monthLabel)).toBeTruthy();
    expect(view.getByLabelText(strings.steps.yearLabel)).toBeTruthy();
  });

  it('secilmemis alan kendi adini gosteriyor', async () => {
    const { view } = await mount(empty);
    expect(view.getByText(strings.steps.dayLabel)).toBeTruthy();
  });

  it('secili degerleri gosteriyor, ay adiyla', async () => {
    const { view } = await mount({ day: 14, month: 3, year: 1996 });
    expect(view.getByText('14')).toBeTruthy();
    expect(view.getByText('Mart')).toBeTruthy();
    expect(view.getByText('1996')).toBeTruthy();
  });

  it('hicbir alan yazilabilir degil: klavye acacak bir sey yok', async () => {
    const { view } = await mount(empty);
    expect(view.queryAllByLabelText(strings.steps.dayLabel)[0]?.props.editable).toBeUndefined();
  });

  it('gune dokununca yalnizca gun sayfasi aciliyor', async () => {
    const { view } = await mount(empty);
    await press(view, view.getByLabelText(strings.steps.dayLabel));

    // Gun satirlari geldi; ay ya da yil listesi acilmadi.
    expect(rows(view, '1').length).toBeGreaterThan(0);
    expect(view.queryByText('Ocak')).toBeNull();
    expect(view.queryByText('2026')).toBeNull();
  });

  it('aya dokununca yalnizca ay sayfasi aciliyor', async () => {
    const { view } = await mount(empty);
    await press(view, view.getByLabelText(strings.steps.monthLabel));

    // Ay adlari geldi; gun ya da yil listesi acilmadi. Liste sanallastirildigi
    // icin yalnizca gorunen satirlar agacta.
    expect(rows(view, 'Ocak').length).toBeGreaterThan(0);
    expect(view.queryByText('2026')).toBeNull();
  });

  it('bir satira dokunmak o alani isliyor', async () => {
    const { view, onChange } = await mount(empty);
    await press(view, view.getByLabelText(strings.steps.monthLabel));
    await press(view, rows(view, 'Mart')[0]!);

    expect(onChange).toHaveBeenCalledWith({ day: null, month: 3, year: null });
  });

  it('yil listesi bu yildan basliyor, gelecege acilmiyor', async () => {
    const { view } = await mount(empty);
    await press(view, view.getByLabelText(strings.steps.yearLabel));

    expect(rows(view, String(today.getFullYear())).length).toBeGreaterThan(0);
    expect(view.queryByText(String(today.getFullYear() + 1))).toBeNull();
  });

  it('ay degisip secili gun o aya sigmiyorsa gun dusuyor', async () => {
    const { view, onChange } = await mount({ day: 31, month: 1, year: 2023 });
    await press(view, view.getByLabelText(strings.steps.monthLabel));
    await press(view, rows(view, 'Şubat')[0]!);

    // Sessizce 28'e cekmek, kullanicinin vermedigi bir cevabi vermek olurdu.
    expect(onChange).toHaveBeenCalledWith({ day: null, month: 2, year: 2023 });
  });

  it('siğan gun ay degisince yerinde kaliyor', async () => {
    const { view, onChange } = await mount({ day: 14, month: 1, year: 2023 });
    await press(view, view.getByLabelText(strings.steps.monthLabel));
    await press(view, rows(view, 'Şubat')[0]!);

    expect(onChange).toHaveBeenCalledWith({ day: 14, month: 2, year: 2023 });
  });
});
