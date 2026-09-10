import {
  ARTWORK_PRELOAD_CEILING_MS,
  journeyArtworkModule,
  journeyOffset,
  journeyStops,
  preloadJourneyArtwork,
  stepJourneyProgress,
} from './journeyArtwork';

jest.mock('expo-asset', () => ({ Asset: { fromModule: jest.fn() } }));

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

describe('journey artwork preloading', () => {
  const { Asset } = jest.requireMock('expo-asset');

  afterEach(() => {
    jest.useRealTimers();
  });

  it('reports the artwork ready once the download settles', async () => {
    Asset.fromModule.mockReturnValue({ downloadAsync: jest.fn(async () => {}) });

    await expect(preloadJourneyArtwork()).resolves.toBe('ready');
    expect(Asset.fromModule).toHaveBeenCalledWith(journeyArtworkModule);
  });

  it('opens the app without the artwork when the download fails', async () => {
    // Gorsel bir sus; indirilemedi diye kullanici kapida bekletilmez.
    Asset.fromModule.mockReturnValue({
      downloadAsync: jest.fn(async () => {
        throw new Error('network');
      }),
    });

    await expect(preloadJourneyArtwork()).resolves.toBe('skipped');
  });

  it('keeps the ceiling short enough to still be a launch', async () => {
    // Ust sinirin varligi yetmiyor: yeterince buyuk bir sinir, sinirsiz
    // beklemekle ayni sey. On saniye, bir acilisin kullanicinin sabrini
    // asmadan bekleyebilecegi en ust nokta.
    expect(ARTWORK_PRELOAD_CEILING_MS).toBeLessThanOrEqual(10_000);
  });

  it('gives up on the artwork once the ceiling passes', async () => {
    jest.useFakeTimers();
    // Hicbir zaman cozulmeyen bir indirme: ust sinir olmasa acilis burada
    // sonsuza kadar beklerdi.
    Asset.fromModule.mockReturnValue({ downloadAsync: jest.fn(() => new Promise(() => {})) });

    const outcome = preloadJourneyArtwork();
    await jest.advanceTimersByTimeAsync(ARTWORK_PRELOAD_CEILING_MS);

    await expect(outcome).resolves.toBe('skipped');
  });
});
