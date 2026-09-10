import { journeyOffset, journeyStops, stepJourneyProgress } from './journeyArtwork';

describe('journey artwork geometry', () => {
  it('keeps the opening crop at the start of the master strip', () => {
    expect(journeyOffset(0, 400, 800)).toEqual({ width: 2400, translateX: -0 });
  });

  it('moves the completion crop to the end of the master strip', () => {
    expect(journeyOffset(1, 400, 800)).toEqual({ width: 2400, translateX: -2000 });
  });

  it('clamps invalid progress before calculating the crop', () => {
    expect(journeyOffset(-1, 400, 800).translateX).toBe(-0);
    expect(journeyOffset(2, 400, 800).translateX).toBe(-2000);
  });

  it('never renders the master narrower than the viewport', () => {
    expect(journeyOffset(0.5, 1200, 300)).toEqual({ width: 1200, translateX: -0 });
  });

  it('maps the first and last profile steps inside the auth and completion stops', () => {
    expect(stepJourneyProgress(1, 6)).toBe(journeyStops.stepStart);
    expect(stepJourneyProgress(6, 6)).toBe(journeyStops.stepEnd);
  });

  it('uses the first profile stop when only one visible step remains', () => {
    expect(stepJourneyProgress(1, 1)).toBe(journeyStops.stepStart);
  });
});
