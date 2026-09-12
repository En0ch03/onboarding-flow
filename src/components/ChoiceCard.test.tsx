import { StyleSheet } from 'react-native';

import type { Option } from '@/api/schemas';
import { renderWithTheme } from '@/test/renderWithTheme';
import { palettes } from '@/theme';

import { ChoiceCard } from './ChoiceCard';
import { GlassScreenProvider } from './glassScreenContext';

const { isLiquidGlassAvailable, isGlassEffectAPIAvailable } = jest.requireMock('expo-glass-effect');

const option: Option = { id: 'friendship', label: 'Arkadaslik' };
const noop = () => {};

/** Ekran okuyucudan gizli arka katmanlar da sorguya girsin. */
const hidden = { includeHiddenElements: true } as const;

beforeEach(() => {
  isLiquidGlassAvailable.mockReturnValue(false);
  isGlassEffectAPIAvailable.mockReturnValue(true);
});

describe('ChoiceCard', () => {
  it('cam kipi kapaliyken yuzey "Simdilik gec" ile ayni murekkep dolgusunu kullaniyor', async () => {
    const view = await renderWithTheme(
      <ChoiceCard option={option} selected={false} onPress={noop} multiple={false} />,
    );

    const style = StyleSheet.flatten(view.getByLabelText(option.label).props.style) as Record<
      string,
      unknown
    >;

    // withAlpha(colors.ink, 0.08) -- "Simdilik gec" kapsulunun durgun dolgusuyla ayni deger.
    expect(style.backgroundColor).toBe('rgba(245, 242, 237, 0.08)');
    expect(view.queryByTestId('glass-choice-card', hidden)).toBeNull();
  });

  it('cam kipinde kartin kendi dolgusu yok, sistemin materyali cizmez', async () => {
    isLiquidGlassAvailable.mockReturnValue(true);
    const view = await renderWithTheme(
      <ChoiceCard option={option} selected={false} onPress={noop} multiple={false} />,
    );

    const style = StyleSheet.flatten(view.getByLabelText(option.label).props.style) as Record<
      string,
      unknown
    >;
    expect(style.backgroundColor).toBeUndefined();

    const glass = view.getByTestId('glass-choice-card', hidden);
    expect(glass.props.glassEffectStyle).toBe('regular');
    expect(glass.props.isInteractive).toBe(true);
  });

  it('secili kart cam kipteyken de camin ustune kendi tonunu koyuyor', async () => {
    isLiquidGlassAvailable.mockReturnValue(true);
    const view = await renderWithTheme(
      <ChoiceCard option={option} selected onPress={noop} multiple={false} />,
    );

    expect(view.getByTestId('glass-choice-card', hidden)).toBeTruthy();
    const tint = StyleSheet.flatten(
      view.getByTestId('choice-card-selected-tint', hidden).props.style,
    ) as Record<string, unknown>;
    expect(tint.backgroundColor).toBe(palettes.dark.clayTint);
  });

  it('secili olmayan kartta secim tonu yok', async () => {
    const view = await renderWithTheme(
      <ChoiceCard option={option} selected={false} onPress={noop} multiple={false} />,
    );
    expect(view.queryByTestId('choice-card-selected-tint', hidden)).toBeNull();
  });

  it('secim kenarlikla anlatiliyor, camdan bagimsiz', async () => {
    isLiquidGlassAvailable.mockReturnValue(true);
    const off = await renderWithTheme(
      <ChoiceCard option={option} selected={false} onPress={noop} multiple={false} />,
    );
    const on = await renderWithTheme(
      <ChoiceCard option={option} selected onPress={noop} multiple={false} />,
    );

    const offStyle = StyleSheet.flatten(off.getByLabelText(option.label).props.style) as Record<
      string,
      number
    >;
    const onStyle = StyleSheet.flatten(on.getByLabelText(option.label).props.style) as Record<
      string,
      number
    >;

    expect(offStyle.borderWidth).toBe(1);
    expect(onStyle.borderWidth).toBe(2);
  });

  it('yazi ekranlari gibi cam kapali bir baglamda cam cizmiyor', async () => {
    isLiquidGlassAvailable.mockReturnValue(true);
    const view = await renderWithTheme(
      <GlassScreenProvider value={false}>
        <ChoiceCard option={option} selected={false} onPress={noop} multiple={false} />
      </GlassScreenProvider>,
    );
    expect(view.queryByTestId('glass-choice-card', hidden)).toBeNull();
  });
});
