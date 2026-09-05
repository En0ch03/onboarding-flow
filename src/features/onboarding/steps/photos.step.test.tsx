import { act, cleanup, fireEvent, type RenderResult } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import { uploadPhoto } from '@/api/media';
import { strings } from '@/constants/strings';
import { renderWithTheme } from '@/test/renderWithTheme';

import { PhotosStep } from './photos.step';

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

beforeEach(() => {
  // Yalnizca cagri gecmisi siliniyor; davranislar hemen asagida yeniden
  // kuruluyor. `resetAllMocks` bunlari da silip her testi bos birakirdi.
  jest.clearAllMocks();

  picker.requestMediaLibraryPermissionsAsync.mockResolvedValue(granted);
  picker.requestCameraPermissionsAsync.mockResolvedValue(granted);
  picker.launchImageLibraryAsync.mockResolvedValue(result('file:///library.jpg'));
  picker.launchCameraAsync.mockResolvedValue(result('file:///camera.jpg'));
  upload.mockResolvedValue({ id: 'a', url: 'https://example.test/a.jpg' });
});

afterEach(cleanup);

async function renderStep(photos: { id: string; url: string }[] = []) {
  const onChange = jest.fn();
  // RNTL 14'te `render` bir soz donduruyor; beklenmezse sorgusuz bos bir
  // nesne geliyor ve test hicbir sey sinamiyor.
  const view = await renderWithTheme(
    <PhotosStep values={{ photos }} onChange={onChange} options={{}} />,
  );
  return { view, onChange };
}

/** Kaynak sayfasini acip verilen kaynagi secer. */
async function chooseSource(view: RenderResult, source: 'camera' | 'library') {
  await act(async () => {
    fireEvent.press(view.getAllByLabelText(strings.photoSlot.empty)[0]!);
  });

  await act(async () => {
    fireEvent.press(
      view.getByLabelText(
        source === 'camera' ? strings.photoSource.camera : strings.photoSource.library,
      ),
    );
  });
}

describe('PhotosStep — kutu duzeni', () => {
  it('yalnizca bir bos kutu dokunulabilir; gerisi kilitli', async () => {
    const { view } = await renderStep();

    expect(view.getAllByLabelText(strings.photoSlot.empty)).toHaveLength(1);
    expect(view.getAllByLabelText(strings.photoSlot.locked)).toHaveLength(5);
  });

  it('bir fotograf eklendikce acik kutu bir ilerliyor', async () => {
    const { view } = await renderStep([{ id: 'a', url: 'https://example.test/a.jpg' }]);

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
});

describe('PhotosStep — kaynak secimi', () => {
  it('kamera secilince kamera aciliyor, galeri degil', async () => {
    const { view } = await renderStep();
    await chooseSource(view, 'camera');

    expect(picker.launchCameraAsync).toHaveBeenCalled();
    expect(picker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it('galeri secilince galeri aciliyor, kamera degil', async () => {
    const { view } = await renderStep();
    await chooseSource(view, 'library');

    expect(picker.launchImageLibraryAsync).toHaveBeenCalled();
    expect(picker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('kamera izni reddedilirse kamera acilmiyor', async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValue({
      granted: false,
    } as Awaited<ReturnType<typeof ImagePicker.requestCameraPermissionsAsync>>);

    const { view } = await renderStep();
    await chooseSource(view, 'camera');

    expect(picker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('kamera izni istenirken galeri izni istenmiyor', async () => {
    const { view } = await renderStep();
    await chooseSource(view, 'camera');

    expect(picker.requestCameraPermissionsAsync).toHaveBeenCalled();
    expect(picker.requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe('PhotosStep — fotograf nereye yerlesiyor', () => {
  it('bos izgarada eklenen fotograf listenin basina giriyor', async () => {
    const { view, onChange } = await renderStep();
    await chooseSource(view, 'library');

    expect(onChange).toHaveBeenCalledWith({
      photos: [{ id: 'a', url: 'https://example.test/a.jpg' }],
    });
  });

  it('dolu bir izgarada eklenen fotograf sona giriyor, arasina degil', async () => {
    const existing = [
      { id: 'x', url: 'https://example.test/x.jpg' },
      { id: 'y', url: 'https://example.test/y.jpg' },
    ];
    const { view, onChange } = await renderStep(existing);
    await chooseSource(view, 'library');

    expect(onChange).toHaveBeenCalledWith({
      photos: [...existing, { id: 'a', url: 'https://example.test/a.jpg' }],
    });
  });

  it('yukleme basarisiz olursa cevap yazilmiyor ve kutu tekrar denemeye aciliyor', async () => {
    upload.mockRejectedValue(new Error('down'));

    const { view, onChange } = await renderStep();
    await chooseSource(view, 'library');

    expect(onChange).not.toHaveBeenCalled();
    expect(view.getAllByLabelText(strings.photoSlot.failed)).toHaveLength(1);
  });
});
