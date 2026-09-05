import { act, cleanup, fireEvent, type RenderResult } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';

import { uploadPhoto, type UploadedPhoto } from '@/api/media';
import { strings } from '@/constants/strings';
import {
  useOnboardingStore,
  type AnswersUpdate,
  type DraftAnswers,
} from '@/state/onboardingStore';
import { renderWithTheme } from '@/test/renderWithTheme';

import { PHOTO_SLOTS, PhotosStep } from './photos.step';
import { usePhotoTransfers } from './photoTransfers';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

jest.mock('@/api/media', () => ({ uploadPhoto: jest.fn() }));

const picker = jest.mocked(ImagePicker);
const upload = jest.mocked(uploadPhoto);

const granted = { granted: true } as Awaited<
  ReturnType<typeof ImagePicker.requestCameraPermissionsAsync>
>;

const result = (uri: string) =>
  ({ canceled: false, assets: [{ uri }] }) as Awaited<
    ReturnType<typeof ImagePicker.launchCameraAsync>
  >;

const photo = (id: string): UploadedPhoto => ({ id, url: `https://example.test/${id}.jpg` });

beforeEach(() => {
  // Yalnizca cagri gecmisi siliniyor; davranislar hemen asagida yeniden
  // kuruluyor. `resetAllMocks` bunlari da silip her testi bos birakirdi.
  jest.clearAllMocks();
  // Isaretler ekranin disinda yasiyor; bir testin yarim biraktigi yukleme
  // sonrakinin izgarasinda gorunmemeli.
  usePhotoTransfers.getState().reset();

  picker.requestMediaLibraryPermissionsAsync.mockResolvedValue(granted);
  picker.requestCameraPermissionsAsync.mockResolvedValue(granted);
  picker.launchImageLibraryAsync.mockResolvedValue(result('file:///library.jpg'));
  picker.launchCameraAsync.mockResolvedValue(result('file:///camera.jpg'));
  upload.mockResolvedValue(photo('a'));
});

afterEach(cleanup);

/** Son cevaplarin okunabildigi, disaridan doldurulan kutu. */
type Seen = { answers: DraftAnswers };

/**
 * Adim, cevaplari depodan aliyor ve depoya yaziyor. Burada depo yerine ayni
 * sozlesmeyi tasiyan kucuk bir sarmalayici var: yama da fonksiyon da kabul
 * ediyor ve fonksiyonu yazma anindaki cevaplarla cagiriyor. Ayni anda biten
 * iki yuklemenin birbirini ezmedigi ancak boyle sinanabiliyor.
 */
function Harness({
  initial,
  onAnswers,
}: {
  initial: DraftAnswers;
  onAnswers: (answers: DraftAnswers) => void;
}) {
  const [answers, setAnswers] = useState(initial);

  useEffect(() => {
    onAnswers(answers);
  });

  const onChange = (update: AnswersUpdate) =>
    setAnswers((current) => ({
      ...current,
      ...(typeof update === 'function' ? update(current) : update),
    }));

  return <PhotosStep values={answers} onChange={onChange} options={{}} />;
}

async function renderStep(photos: UploadedPhoto[] = []) {
  const seen: Seen = { answers: { photos } };
  // RNTL 14'te `render` bir soz donduruyor; beklenmezse sorgusuz bos bir
  // nesne geliyor ve test hicbir sey sinamiyor.
  const view = await renderWithTheme(
    <Harness
      initial={{ photos }}
      onAnswers={(answers) => {
        seen.answers = answers;
      }}
    />,
  );
  return { view, seen };
}

/** Siradaki bos kutuya dokunup kaynak secer. */
async function addPhoto(view: RenderResult, source: 'camera' | 'library' = 'library') {
  await act(async () => {
    fireEvent.press(view.getByLabelText(strings.photoSlot.empty));
  });

  await act(async () => {
    fireEvent.press(
      view.getByLabelText(
        source === 'camera' ? strings.photoSource.camera : strings.photoSource.library,
      ),
    );
  });
}

/** Elle cozulen bir yukleme: sira ve es zamanlilik testin elinde. */
function deferred() {
  let resolve!: (value: UploadedPhoto) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<UploadedPhoto>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const ids = (seen: Seen) => (seen.answers.photos ?? []).map((item) => item.id);

describe('PhotosStep — kutu duzeni', () => {
  it('yalnizca bir bos kutu dokunulabilir; gerisi kilitli', async () => {
    const { view } = await renderStep();

    expect(view.getAllByLabelText(strings.photoSlot.empty)).toHaveLength(1);
    expect(view.getAllByLabelText(strings.photoSlot.locked)).toHaveLength(5);
  });

  it('bir fotograf eklendikce acik kutu bir ilerliyor', async () => {
    const { view } = await renderStep([photo('a')]);

    expect(view.getAllByLabelText(strings.photoSlot.empty)).toHaveLength(1);
    expect(view.getAllByLabelText(strings.photoSlot.locked)).toHaveLength(4);
  });

  it('kilitli kutu dokunulunca kaynak sayfasi acilmiyor', async () => {
    const { view } = await renderStep();

    await act(async () => {
      fireEvent.press(view.getAllByLabelText(strings.photoSlot.locked)[0]!);
    });

    expect(view.queryByLabelText(strings.photoSource.camera)).toBeNull();
  });

  it('yuklenen kutu ekran okuyucuya bos kutu degil yukleniyor diyor', async () => {
    const pending = deferred();
    upload.mockReturnValueOnce(pending.promise);

    const { view } = await renderStep();
    await addPhoto(view);

    expect(view.getByLabelText(strings.photoSlot.uploading)).toBeTruthy();
    expect(view.getAllByLabelText(strings.photoSlot.empty)).toHaveLength(1);

    await act(async () => pending.resolve(photo('a')));
  });
});

describe('PhotosStep — kaynak secimi', () => {
  it('kamera secilince kamera aciliyor, galeri degil', async () => {
    const { view } = await renderStep();
    await addPhoto(view, 'camera');

    expect(picker.launchCameraAsync).toHaveBeenCalled();
    expect(picker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it('galeri secilince galeri aciliyor, kamera degil', async () => {
    const { view } = await renderStep();
    await addPhoto(view, 'library');

    expect(picker.launchImageLibraryAsync).toHaveBeenCalled();
    expect(picker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('kamera izni reddedilirse kamera acilmiyor', async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValue({
      granted: false,
    } as Awaited<ReturnType<typeof ImagePicker.requestCameraPermissionsAsync>>);

    const { view } = await renderStep();
    await addPhoto(view, 'camera');

    expect(picker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('kamera izni istenirken galeri izni istenmiyor', async () => {
    const { view } = await renderStep();
    await addPhoto(view, 'camera');

    expect(picker.requestCameraPermissionsAsync).toHaveBeenCalled();
    expect(picker.requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe('PhotosStep — fotograf nereye yerlesiyor', () => {
  it('bos izgarada eklenen fotograf listenin basina giriyor', async () => {
    const { view, seen } = await renderStep();
    await addPhoto(view);

    expect(ids(seen)).toEqual(['a']);
  });

  it('dolu bir izgarada eklenen fotograf sona giriyor, arasina degil', async () => {
    const { view, seen } = await renderStep([photo('x'), photo('y')]);
    await addPhoto(view);

    expect(ids(seen)).toEqual(['x', 'y', 'a']);
  });

  it('once baslayan once bitince sira bastigi gibi kaliyor', async () => {
    // 0'a basildi, o yuklenirken 1'e basildi; 0 once bitti. Dokunma anindaki
    // goruntuyle hesaplanan yer, 0'in fotografa donustugunu gormuyor ve
    // ikinciyi basa yaziyordu: kapak, kullanicinin ikinci sectigi oluyordu.
    const first = deferred();
    const second = deferred();
    upload.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { view, seen } = await renderStep();
    await addPhoto(view);
    await addPhoto(view);

    await act(async () => first.resolve(photo('a')));
    await act(async () => second.resolve(photo('b')));

    expect(ids(seen)).toEqual(['a', 'b']);
  });

  it('sonra baslayan once bitince de sira bastigi gibi kaliyor', async () => {
    const first = deferred();
    const second = deferred();
    upload.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { view, seen } = await renderStep();
    await addPhoto(view);
    await addPhoto(view);

    await act(async () => second.resolve(photo('b')));
    await act(async () => first.resolve(photo('a')));

    expect(ids(seen)).toEqual(['a', 'b']);
  });

  it('ayni anda biten iki yukleme birbirini ezmiyor', async () => {
    // Ikisi de ekranin yenilenmesini beklemeden yaziyor; ekranin son gordugu
    // listeyi okuyan bir yazma, ilk gelen fotografi kaybediyordu.
    const first = deferred();
    const second = deferred();
    upload.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { view, seen } = await renderStep();
    await addPhoto(view);
    await addPhoto(view);

    await act(async () => {
      first.resolve(photo('a'));
      second.resolve(photo('b'));
    });

    expect(ids(seen)).toEqual(['a', 'b']);
  });

  it('yukleme surerken onceki fotograf silinse de yeni gelen sona giriyor', async () => {
    const pending = deferred();
    upload.mockReturnValueOnce(pending.promise);

    const { view, seen } = await renderStep([photo('x'), photo('y')]);
    await addPhoto(view);

    await act(async () => {
      fireEvent.press(view.getAllByLabelText(strings.photoSlot.remove)[0]!);
    });
    await act(async () => pending.resolve(photo('a')));

    expect(ids(seen)).toEqual(['y', 'a']);
  });

  it('yukleme basarisiz olursa cevap yazilmiyor ve kutu tekrar denemeye aciliyor', async () => {
    upload.mockRejectedValueOnce(new Error('down'));

    const { view, seen } = await renderStep();
    await addPhoto(view);

    expect(ids(seen)).toEqual([]);
    expect(view.getAllByLabelText(strings.photoSlot.failed)).toHaveLength(1);
  });

  it('basarisiz kutu yeniden denenince kendi yerine giriyor, sonrakini itmiyor', async () => {
    // Kutu 1 dustu, kullanici 2'ye devam edip doldurdu, sonra 1'i yeniden
    // denedi. Yeni fotograf 1'e girmeli; 2'deki fotograf yerinde kalmali.
    upload.mockRejectedValueOnce(new Error('down'));

    const { view, seen } = await renderStep([photo('x')]);
    await addPhoto(view);
    expect(view.getAllByLabelText(strings.photoSlot.failed)).toHaveLength(1);

    upload.mockResolvedValueOnce(photo('z'));
    await addPhoto(view);
    expect(ids(seen)).toEqual(['x', 'z']);

    upload.mockResolvedValueOnce(photo('r'));
    await act(async () => {
      fireEvent.press(view.getByLabelText(strings.photoSlot.failed));
    });
    await act(async () => {
      fireEvent.press(view.getByLabelText(strings.photoSource.library));
    });

    expect(ids(seen)).toEqual(['x', 'r', 'z']);
  });
});

/**
 * Gercek depoyla: adim terk edilip donuldugunde bilesen sokulup yeniden
 * kuruluyor, ama yukleme ve depo yerinde duruyor. Sarmalayici burada ise
 * yaramaz -- onun durumu da bilesenle birlikte gider.
 */
function StoreBound() {
  const answers = useOnboardingStore((state) => state.answers);
  const setAnswers = useOnboardingStore((state) => state.setAnswers);
  return <PhotosStep values={answers} onChange={setAnswers} options={{}} />;
}

const storeIds = () => (useOnboardingStore.getState().answers.photos ?? []).map((item) => item.id);

describe('PhotosStep — adim terk edilip donuldugunde', () => {
  beforeEach(() => {
    useOnboardingStore.getState().replaceAnswers({});
  });

  it('suren yukleme kutusunda gorunmeye devam ediyor ve sira bozulmuyor', async () => {
    useOnboardingStore.getState().setAnswers({ photos: [photo('a')] });
    const pending = deferred();
    upload.mockReturnValueOnce(pending.promise);

    const first = await renderWithTheme(<StoreBound />);
    await addPhoto(first);
    await first.unmount();

    const second = await renderWithTheme(<StoreBound />);

    // Kutu bos gorunseydi kullanici ayni kutuyu yeniden doldururdu.
    expect(second.getByLabelText(strings.photoSlot.uploading)).toBeTruthy();
    expect(second.getAllByLabelText(strings.photoSlot.empty)).toHaveLength(1);
    expect(second.getAllByLabelText(strings.photoSlot.locked)).toHaveLength(3);

    await act(async () => pending.resolve(photo('b')));
    expect(storeIds()).toEqual(['a', 'b']);
  });

  it('izgara doluyken gelen fotograf yazilmiyor', async () => {
    // Isaretlerin kaybolmasi artik olmamali; ama olursa bile yedinci fotograf
    // depoya girmemeli. Kayip burada elle taklit ediliyor.
    const five = Array.from({ length: PHOTO_SLOTS - 1 }, (_, at) => photo(`p${at}`));
    useOnboardingStore.getState().setAnswers({ photos: five });

    const first = deferred();
    const second = deferred();
    upload.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const before = await renderWithTheme(<StoreBound />);
    await addPhoto(before);
    await before.unmount();
    usePhotoTransfers.getState().reset();

    const after = await renderWithTheme(<StoreBound />);
    await addPhoto(after);

    await act(async () => {
      first.resolve(photo('x'));
      second.resolve(photo('y'));
    });

    expect(storeIds()).toHaveLength(PHOTO_SLOTS);
  });
});

describe('PhotosStep — akis terk edildikten sonra biten yukleme', () => {
  beforeEach(() => {
    useOnboardingStore.getState().replaceAnswers({});
  });

  it('basarili bitse de cevap yazmiyor', async () => {
    // Akis bitip taslak silindikten sonra gec gelen bir fotograf, temizlenmis
    // taslagi yeniden dolduruyordu: sunucuya gitmeyen, kullaniciya gorunmeyen
    // ama diskte duran bir cevap.
    const pending = deferred();
    upload.mockReturnValueOnce(pending.promise);

    const view = await renderWithTheme(<StoreBound />);
    await addPhoto(view);
    await view.unmount();
    useOnboardingStore.getState().clearDraft();

    await act(async () => pending.resolve(photo('late')));

    expect(storeIds()).toEqual([]);
    expect(usePhotoTransfers.getState().transfers.size).toBe(0);
  });

  it('dusse de baska bir akisin izgarasina isaret koymuyor', async () => {
    // Bir kullanicinin cikistan sonra dusen yuklemesi, ayni cihazda giris
    // yapan bir sonrakinin kapak kutusunda "yuklenemedi" diye beliriyordu.
    const pending = deferred();
    upload.mockReturnValueOnce(pending.promise);

    const view = await renderWithTheme(<StoreBound />);
    await addPhoto(view);
    await view.unmount();
    usePhotoTransfers.getState().reset();

    await act(async () => pending.reject(new Error('down')));

    expect(usePhotoTransfers.getState().transfers.size).toBe(0);
  });
});
