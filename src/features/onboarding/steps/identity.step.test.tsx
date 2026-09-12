import { StyleSheet } from 'react-native';

import { strings } from '@/constants/strings';
import { renderWithTheme } from '@/test/renderWithTheme';
import { palettes, withAlpha } from '@/theme';

import { IdentityStep } from './identity.step';

const noop = () => {};

describe('IdentityStep', () => {
  it('ad alani kendi cam yuzeyini tasiyor, kartsiz ekranin opak zeminini degil', async () => {
    const view = await renderWithTheme(<IdentityStep values={{}} onChange={noop} options={{}} />);

    const style = StyleSheet.flatten(
      view.getByLabelText(strings.steps.nameLabel).props.style,
    ) as Record<string, unknown>;
    // `field` yuzeyi cam kipi kapaliyken "Simdilik gec" ile ayni murekkep
    // dolgusunu kullaniyor; varsayilan `solid` zemininden (surface, %92) ayri.
    expect(style.backgroundColor).toBe(withAlpha(palettes.dark.ink, 0.08));
  });
});
