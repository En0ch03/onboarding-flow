import { act, type RenderResult } from '@testing-library/react-native';
import { StyleSheet, type TextStyle } from 'react-native';

import { renderWithTheme } from '@/test/renderWithTheme';
import { palettes, withAlpha } from '@/theme';

import { GlassScreenProvider } from './glassScreenContext';
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

describe('TextField yuzeyi', () => {
  it('varsayilan alanin zemini neredeyse opak kaliyor', async () => {
    const view = await renderWithTheme(<TextField label={LABEL} />);
    // Once agacin cizildigi: bos bir agacta stil sorgusu da patlardi.
    expect(view.getByLabelText(LABEL)).toBeTruthy();

    const style = StyleSheet.flatten(view.getByLabelText(LABEL).props.style) as TextStyle;
    // Kartsiz ekranlarda yazilan metnin kontrasti bu zemine dayaniyor.
    expect(style.backgroundColor).toBe(withAlpha(palettes.dark.surface, 0.92));
  });

  it('cam yuzeyde alan kartin altindaki goruntuyu geciriyor', async () => {
    const view = await renderWithTheme(<TextField label={LABEL} surface="glass" />);
    expect(view.getByLabelText(LABEL)).toBeTruthy();

    const input = view.getByLabelText(LABEL);
    const style = StyleSheet.flatten(input.props.style) as TextStyle;
    // Alanin zemini kartin yuzeyinden ayrisacak kadar koyu, ama kartin
    // tamami degil: yalnizca alanin kendi dolgusu.
    expect(style.backgroundColor).toBe(withAlpha(palettes.dark.surface, 0.5));
    expect(style.borderColor).toBe(withAlpha(palettes.dark.ink, 0.18));
    expect(input.props.placeholderTextColor).toBe(palettes.dark.inkSoft);
  });
});

describe('TextField "field" yuzeyi', () => {
  const { isLiquidGlassAvailable, isGlassEffectAPIAvailable } =
    jest.requireMock('expo-glass-effect');
  const hidden = { includeHiddenElements: true } as const;

  beforeEach(() => {
    isLiquidGlassAvailable.mockReturnValue(false);
    isGlassEffectAPIAvailable.mockReturnValue(true);
  });

  it('cam kipi kapaliyken "Simdilik gec" ile ayni murekkep dolgusunu kullaniyor', async () => {
    const view = await renderWithTheme(<TextField label={LABEL} surface="field" />);
    const style = StyleSheet.flatten(view.getByLabelText(LABEL).props.style) as TextStyle;

    expect(style.backgroundColor).toBe(withAlpha(palettes.dark.ink, 0.08));
    expect(view.queryByTestId('glass-field', hidden)).toBeNull();
  });

  it('cam kipinde alanin kendi dolgusu yok, sistemin materyali cizmez', async () => {
    isLiquidGlassAvailable.mockReturnValue(true);
    const view = await renderWithTheme(<TextField label={LABEL} surface="field" />);

    const style = StyleSheet.flatten(view.getByLabelText(LABEL).props.style) as TextStyle;
    expect(style.backgroundColor).toBe('transparent');

    const glass = view.getByTestId('glass-field', hidden);
    expect(glass.props.glassEffectStyle).toBe('regular');
    expect(glass.props.isInteractive).toBe(true);
  });

  it('cami saran katman alanin kendi kenarligiyla ayni kose egrisini kullaniyor', async () => {
    // Kesim ile kenarlik farkli egride olursa cam kose alanin gorunen
    // kenarligindan tasar ya da geri kalir; ikisi ayni yaricapta olsa bile
    // "continuous" ile dairesel egri gozle ayirt edilebilir bir uyumsuzluk
    // birakiyor.
    isLiquidGlassAvailable.mockReturnValue(true);
    const view = await renderWithTheme(<TextField label={LABEL} surface="field" />);

    const inputStyle = StyleSheet.flatten(view.getByLabelText(LABEL).props.style) as TextStyle;
    const wrapperStyle = StyleSheet.flatten(
      view.getByTestId('glass-field', hidden).parent?.props.style,
    ) as TextStyle;

    expect(wrapperStyle.borderRadius).toBe(inputStyle.borderRadius);
    expect(wrapperStyle.borderCurve).toBe(inputStyle.borderCurve);
  });

  it('cam kapali baglamda "field" yuzeyi de cam cizmiyor', async () => {
    isLiquidGlassAvailable.mockReturnValue(true);
    const view = await renderWithTheme(
      <GlassScreenProvider value={false}>
        <TextField label={LABEL} surface="field" />
      </GlassScreenProvider>,
    );
    expect(view.queryByTestId('glass-field', hidden)).toBeNull();
  });

  it('kayit ve giris kartindaki alan kendi yolunu koruyor: "field" kipine kaymiyor', async () => {
    isLiquidGlassAvailable.mockReturnValue(true);
    const view = await renderWithTheme(<TextField label={LABEL} surface="glass" />);

    // "glass" hala kendi opak dolgusunu tasiyor; sistemin materyaline
    // gecmiyor. Kayit ve giris ekranlarindaki alanlar bu pakette degismiyor.
    expect(view.queryByTestId('glass-field', hidden)).toBeNull();
    const style = StyleSheet.flatten(view.getByLabelText(LABEL).props.style) as TextStyle;
    expect(style.backgroundColor).toBe(withAlpha(palettes.dark.surface, 0.5));
  });
});
