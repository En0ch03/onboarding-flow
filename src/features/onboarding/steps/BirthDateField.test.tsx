import { act, cleanup, fireEvent } from '@testing-library/react-native';

import { strings } from '@/constants/strings';
import { renderWithTheme } from '@/test/renderWithTheme';

import { BirthDateField } from './BirthDateField';
import { openingParts, type DateParts } from './dateWheel';

const today = new Date(2026, 8, 4);
const opening = openingParts(today);

afterEach(cleanup);

async function mount(value: DateParts | null) {
  const onChange = jest.fn();
  // RNTL 14'te render bir Promise donduruyor; beklenmezse agac bos kaliyor.
  const view = await renderWithTheme(
    <BirthDateField value={value} opening={opening} onChange={onChange} today={today} />,
  );
  return { view, onChange };
}

async function press(element: Parameters<typeof fireEvent.press>[0]) {
  await act(async () => {
    fireEvent.press(element);
  });
}

describe('BirthDateField', () => {
  it('secim yapilmadiginda ipucu metnini gosteriyor', async () => {
    const { view } = await mount(null);
    expect(view.getByText(strings.steps.birthDatePlaceholder)).toBeTruthy();
  });

  it('secili tarihi okunur bicimde gosteriyor', async () => {
    const { view } = await mount({ day: 14, month: 3, year: 1996 });
    expect(view.getByText('14 Mart 1996')).toBeTruthy();
  });

  it('alan bir girdi kutusu degil: yazilabilir bir alan sunmuyor', async () => {
    const { view } = await mount(null);
    // Klavye acacak tek sey bir TextInput olurdu; agacta hic yok.
    expect(view.queryByLabelText(strings.steps.birthDateLabel)?.props.editable).toBeUndefined();
  });

  it('sayfa acilip vazgecilince deger degismiyor', async () => {
    const { view, onChange } = await mount(null);
    await press(view.getByLabelText(strings.steps.birthDateLabel));
    expect(view.getByText(strings.steps.birthDateSheetTitle)).toBeTruthy();

    await press(view.getByText(strings.common.cancel));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Tamam denince carkin durdugu tarih isleniyor', async () => {
    const { view, onChange } = await mount(null);
    await press(view.getByLabelText(strings.steps.birthDateLabel));
    await press(view.getByText(strings.common.done));

    expect(onChange).toHaveBeenCalledWith(opening);
  });

  it('cark, secili tarihin ayina ait gunleri sunuyor', async () => {
    // Subat 2023: yirmi sekiz gun. Yirmi dokuzuncu satir carkta yok, yani
    // "29 Subat 2023" arayuzden gecemiyor.
    const { view } = await mount({ day: 28, month: 2, year: 2023 });
    await press(view.getByLabelText(strings.steps.birthDateLabel));

    expect(view.getByText('28')).toBeTruthy();
    expect(view.queryByText('29')).toBeNull();
  });

  it('yil carki gelecege acilmiyor', async () => {
    const { view } = await mount(null);
    await press(view.getByLabelText(strings.steps.birthDateLabel));

    expect(view.getByText(String(today.getFullYear()))).toBeTruthy();
    expect(view.queryByText(String(today.getFullYear() + 1))).toBeNull();
  });
});
