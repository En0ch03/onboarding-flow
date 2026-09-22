import { renderWithTheme } from '@/test/renderWithTheme';

import { JourneyBackdrop } from './JourneyBackdrop';

/** Sorgular, ekran okuyucudan gizli ogeleri de kapsiyor. */
const hidden = { includeHiddenElements: true } as const;

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
    ).toEqual(require('../../../../assets/onboarding/journey-crimson-master-v2.png'));
  });
});

describe('JourneyBackdrop karartmasiz', () => {
  it('gorselin uzerine karartma perdesi cekmiyor', async () => {
    const screen = await renderWithTheme(<JourneyBackdrop progress={0.5} />);
    // Once agacin gercekten cizildigi: bos bir agacta asagidaki sorgu da
    // patlardi ama sebebini yanlis yere yazardik.
    expect(screen.getByTestId('journey-artwork', hidden)).toBeTruthy();

    expect(screen.queryByTestId('journey-veil', hidden)).toBeNull();
  });

  it('gorsele kizil bir parilti katmani eklemiyor', async () => {
    const screen = await renderWithTheme(<JourneyBackdrop progress={0.5} />);
    expect(screen.getByTestId('journey-artwork', hidden)).toBeTruthy();

    expect(screen.queryByTestId('journey-glow', hidden)).toBeNull();
  });
});
