import { StyleSheet, type TextStyle } from 'react-native';

import { renderWithTheme } from '@/test/renderWithTheme';

import { TextField } from './TextField';

const LABEL = 'Telefon numarası';
const PREFIX = '+90';

/** Alanin duzlestirilmis bicimi; sorgu oneki de tasiyan etiketle yapiliyor. */
async function paddingLeftOf(prefix?: string): Promise<number> {
  const view = await renderWithTheme(
    prefix === undefined ? (
      <TextField label={LABEL} value="" onChangeText={() => {}} />
    ) : (
      <TextField label={LABEL} prefix={prefix} value="" onChangeText={() => {}} />
    ),
  );

  const field = view.getByLabelText(prefix === undefined ? LABEL : `${LABEL}, ${prefix}`);
  const style = StyleSheet.flatten(field.props.style) as TextStyle;
  return style.paddingLeft as number;
}

describe('TextField öneki', () => {
  it('metin, onegin genisligi kadar iceriden basliyor', async () => {
    // Onek mutlak konumlu ve alanin ustunde duruyor; sol bosluk onun
    // genisligi kadar buyumezse kullanicinin yazdigi numara `+90`in altindan
    // baslar. Genislik olculuyor, sabit yazilmiyor: sistem yazi tipi
    // buyudugunde sabit bir bosluk cakismaya yol acardi.
    expect(await paddingLeftOf(PREFIX)).toBeGreaterThan(await paddingLeftOf());
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
