import { StyleSheet } from 'react-native';

import type { Option } from '@/api/schemas';
import { renderWithTheme } from '@/test/renderWithTheme';
import { palettes } from '@/theme';

import { Chip } from './Chip';
import { GlassScreenProvider } from './glassScreenContext';

const { isLiquidGlassAvailable, isGlassEffectAPIAvailable } = jest.requireMock('expo-glass-effect');

const option: Option = { id: 'walking', label: 'Uzun yürüyüş' };
const noop = () => {};

/** Ekran okuyucudan gizli arka katmanlar da sorguya girsin. */
const hidden = { includeHiddenElements: true } as const;

beforeEach(() => {
  isLiquidGlassAvailable.mockReturnValue(false);
  isGlassEffectAPIAvailable.mockReturnValue(true);
});

describe('Chip', () => {
  it('cam kipi kapaliyken yuzey "Simdilik gec" ile ayni murekkep dolgusunu kullaniyor', async () => {
    const view = await renderWithTheme(<Chip option={option} selected={false} onPress={noop} />);

    const style = StyleSheet.flatten(view.getByLabelText(option.label).props.style) as Record<
      string,
      unknown
    >;
    expect(style.backgroundColor).toBe('rgba(245, 242, 237, 0.08)');
    expect(view.queryByTestId('glass-chip', hidden)).toBeNull();
  });

  it('cam kipinde cipin kendi dolgusu yok, sistemin materyali cizmez', async () => {
    isLiquidGlassAvailable.mockReturnValue(true);
    const view = await renderWithTheme(<Chip option={option} selected={false} onPress={noop} />);

    const style = StyleSheet.flatten(view.getByLabelText(option.label).props.style) as Record<
      string,
      unknown
    >;
    expect(style.backgroundColor).toBeUndefined();

    const glass = view.getByTestId('glass-chip', hidden);
    expect(glass.props.glassEffectStyle).toBe('regular');
    expect(glass.props.isInteractive).toBe(true);
  });

  it('secili cip cam kipteyken de camin ustune kendi tonunu koyuyor', async () => {
    isLiquidGlassAvailable.mockReturnValue(true);
    const view = await renderWithTheme(<Chip option={option} selected onPress={noop} />);

    expect(view.getByTestId('glass-chip', hidden)).toBeTruthy();
    const tint = StyleSheet.flatten(
      view.getByTestId('chip-selected-tint', hidden).props.style,
    ) as Record<string, unknown>;
    expect(tint.backgroundColor).toBe(palettes.dark.clayTint);
  });

  it('secili olmayan cipte secim tonu yok', async () => {
    const view = await renderWithTheme(<Chip option={option} selected={false} onPress={noop} />);
    expect(view.queryByTestId('chip-selected-tint', hidden)).toBeNull();
  });

  it('yazi ekranlari gibi cam kapali bir baglamda cam cizmiyor', async () => {
    isLiquidGlassAvailable.mockReturnValue(true);
    const view = await renderWithTheme(
      <GlassScreenProvider value={false}>
        <Chip option={option} selected={false} onPress={noop} />
      </GlassScreenProvider>,
    );
    expect(view.queryByTestId('glass-chip', hidden)).toBeNull();
  });
});
