import { act, type RenderResult } from '@testing-library/react-native';
import { StyleSheet, type TextStyle } from 'react-native';

import { renderWithTheme } from '@/test/renderWithTheme';

import { TextField } from './TextField';

const LABEL = 'Telefon numarası';
const PREFIX = '+90';

/** Alanin duzlestirilmis sol boslugu. */
function paddingLeft(view: RenderResult, label: string): number {
  const style = StyleSheet.flatten(view.getByLabelText(label).props.style) as TextStyle;
  return style.paddingLeft as number;
}

/**
 * Onegin olculdugu ani taklit eder.
 *
 * Test ortaminda yerlesim hic calismiyor, yani `onLayout` kendiliginden
 * tetiklenmiyor ve olculen genislik sifir kaliyor. Bu cagri olmadan yazilan
 * her iddia, olcumu hic gormeden gecer.
 *
 * Sinirini bilerek yaziyorum: burada sinanan sey **olcumun kullanildigi**.
 * Olcumun gercekten geldigi -- yani cihazda o dugum icin `onLayout`in sifirdan
 * farkli bir genislik verdigi -- burada yanlislanamaz; o, cihazda goze bakan
 * bir madde.
 */
async function measurePrefix(view: RenderResult, width: number) {
  const node = view.getByText(PREFIX, { includeHiddenElements: true }).parent;

  await act(async () => {
    node?.props.onLayout({ nativeEvent: { layout: { width, height: 12, x: 0, y: 0 } } });
  });
}

describe('TextField öneki', () => {
  it('sol bosluk olculen onek genisligi kadar buyuyor', async () => {
    // Onek mutlak konumlu ve alanin ustunde duruyor; sol bosluk onun genisligi
    // kadar buyumezse kullanicinin yazdigi numara `+90`in altindan baslar.
    // Genislik olculuyor, sabit yazilmiyor: sistem yazi tipi buyudugunde sabit
    // bir bosluk cakismaya yol acardi.
    //
    // Olcum oncesi ve sonrasi karsilastiriliyor, mutlak bir deger degil:
    // aradaki farkin olculen genislige esit olmasi, degerin gercekten
    // kullanildigini gosteren tek sey. Belirtec degerlerine baglanmiyor.
    const view = await renderWithTheme(
      <TextField label={LABEL} prefix={PREFIX} value="" onChangeText={() => {}} />,
    );

    const label = `${LABEL}, ${PREFIX}`;
    const before = paddingLeft(view, label);

    const measured = 40;
    await measurePrefix(view, measured);

    expect(paddingLeft(view, label) - before).toBe(measured);
  });

  it('oneksiz alan eskisi gibi duruyor', async () => {
    // Kayit ve giris formlari bu bileseni oneksiz kullaniyor; onek desteginin
    // onlarda hicbir sey degistirmemesi gerekiyor.
    const view = await renderWithTheme(
      <TextField label={LABEL} value="" onChangeText={() => {}} />,
    );

    expect(view.getByLabelText(LABEL)).toBeTruthy();
    expect(view.queryByText(PREFIX, { includeHiddenElements: true })).toBeNull();
  });
});
