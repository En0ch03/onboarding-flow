import { renderWithTheme } from '@/test/renderWithTheme';

import { JourneyBackdrop } from './JourneyBackdrop';

describe('JourneyBackdrop', () => {
  it('keeps the journey artwork decorative and outside the touch tree', async () => {
    const screen = await renderWithTheme(<JourneyBackdrop progress={0.5} />);
    const backdrop = screen.getByTestId('journey-backdrop', { includeHiddenElements: true });

    expect(backdrop.props.pointerEvents).toBe('none');
    expect(backdrop.props.accessibilityElementsHidden).toBe(true);
    expect(backdrop.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('renders the approved master artwork', async () => {
    const screen = await renderWithTheme(<JourneyBackdrop progress={0.5} />);

    expect(
      screen.getByTestId('journey-artwork', { includeHiddenElements: true }).props.source,
    ).toEqual(require('../../../../assets/onboarding/onboarding-crimson-journey-master-v2.png'));
  });
});
