import { act, fireEvent } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';

import { strings } from '@/constants/strings';
import { renderWithTheme } from '@/test/renderWithTheme';

import { LaunchScreen } from './LaunchScreen';

/** Erisilebilirlik tercihi cihazdan geliyor; testte ikisi de kurulabilmeli. */
function setReduceMotion(enabled: boolean) {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(enabled);
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() } as unknown as ReturnType<
      typeof AccessibilityInfo.addEventListener
    >);
}

/** Iz olculmeden hareket baslamiyor; cihazda bu olcumu duzen yapiyor. */
async function layoutTrack(view: Awaited<ReturnType<typeof renderWithTheme>>) {
  await act(async () => {
    fireEvent(view.getByTestId('launch-progress'), 'layout', {
      nativeEvent: { layout: { width: 342, height: 3, x: 0, y: 0 } },
    });
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('LaunchScreen', () => {
  it('karsilamadan once markayi ve bekleme satirlarini gosteriyor', async () => {
    setReduceMotion(false);

    const screen = await renderWithTheme(<LaunchScreen />);

    // Metinler sozlukten degil harfi harfine sinaniyor: sozluk uzerinden
    // yazilan bir iddia, girdi bosaltildiginda kendisi de bosalir ve test
    // hicbir sey soylemeden gecer.
    expect(screen.getByText('Onboarding')).toBeTruthy();
    expect(screen.getByText('Hazırlanıyor')).toBeTruthy();
    expect(screen.getByText('Senin için her şeyi yoluna koyuyoruz.')).toBeTruthy();
  });

  it('bekleme cubugunu ekran okuyucuya bir ilerleme gostergesi olarak veriyor', async () => {
    setReduceMotion(false);

    const screen = await renderWithTheme(<LaunchScreen />);
    // Once agacin gercekten cizildigi: bos bir agacta asagidaki sorgu da
    // patlardi ama sebebini yanlis yere yazardik.
    expect(screen.getByText(strings.launch.title)).toBeTruthy();

    expect(screen.getByTestId('launch-progress').props.accessibilityRole).toBe('progressbar');
  });

  it('hareket azaltma acikken cubuk suzulmuyor', async () => {
    // Bitmeyen bir dongu, hareketi azaltma tercihini yok sayan tek ogedir:
    // ekranda baska hicbir sey kimildamiyor.
    setReduceMotion(true);
    const loop = jest.spyOn(Animated, 'loop');

    const screen = await renderWithTheme(<LaunchScreen />);
    await layoutTrack(screen);

    expect(screen.getByText(strings.launch.status)).toBeTruthy();
    expect(loop).not.toHaveBeenCalled();
  });

  it('hareket azaltma kapaliyken cubuk suzuluyor', async () => {
    setReduceMotion(false);
    const loop = jest.spyOn(Animated, 'loop');

    const screen = await renderWithTheme(<LaunchScreen />);
    await layoutTrack(screen);

    expect(screen.getByText(strings.launch.status)).toBeTruthy();
    expect(loop).toHaveBeenCalled();
  });
});

describe('LaunchScreen: yazi tipi gelmeden cizilen satirlar', () => {
  /**
   * Bu ekran yazi tipleri yuklenirken gorunuyor, yani satirlar yedek yazi
   * tipiyle olculuyor. Olculen cerceve gercek yazi tipi gelince buyumuyor;
   * satirlar kendi genisliklerine yapisirsa genisleyen harfler kesiliyor.
   * Uc satirin da satir boyunca uzamasi bu yuzden bir gorunum tercihi degil,
   * kesilmeye karsi tek yapisal onlem.
   */
  it.each([
    ['marka adi', () => strings.launch.title],
    ['durum satiri', () => strings.launch.status],
    ['aciklama satiri', () => strings.launch.hint],
  ])('%s cercevesi metnin olcusune yapismiyor', async (_label, read) => {
    setReduceMotion(true);
    const view = await renderWithTheme(<LaunchScreen />);

    expect(view.getByText(read())).toHaveStyle({
      alignSelf: 'stretch',
      textAlign: 'center',
    });
  });
});
