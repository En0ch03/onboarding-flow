import { manipulateAsync } from 'expo-image-manipulator';

import { api } from './client';
import { uploadPhoto } from './media';

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('./client', () => ({ api: { post: jest.fn() } }));

const prepare = jest.mocked(manipulateAsync);
const post = jest.mocked(api.post);

beforeEach(() => {
  jest.useFakeTimers();
  prepare.mockReset();
  post.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('uploadPhoto', () => {
  it('sonuclanmayan bir hazirlama sonsuza kadar beklenmiyor', async () => {
    // Hazirlamanin kendi zaman asimi yok. Sonuclanmazsa kutu sonsuza kadar
    // "yukleniyor"da kaliyordu: dokunulamiyor, yeniden denenemiyor.
    prepare.mockReturnValue(new Promise(() => {}));

    const outcome = uploadPhoto('file:///photo.jpg');
    // Reddin ele alindigi bilinsin: aksi halde jest islenmemis red uyarisi verir.
    const settled = outcome.then(
      () => 'resolved',
      () => 'rejected',
    );

    await jest.advanceTimersByTimeAsync(60000);

    // Sinir yoksa soz hic yerlesmez; testi zaman asimina birakmak yerine
    // yerlesmedigini aninda soylemek gerekiyor.
    const outcomeNow = await Promise.race([settled, Promise.resolve('still pending')]);
    expect(outcomeNow).toBe('rejected');
    expect(post).not.toHaveBeenCalled();
  });

  it('zamaninda biten yukleme sinirdan etkilenmiyor', async () => {
    prepare.mockResolvedValue({ uri: 'file:///prepared.jpg', width: 1, height: 1 });
    post.mockResolvedValue({ data: { url: 'https://example.test/p.jpg' } });

    const uploaded = await uploadPhoto('file:///photo.jpg');

    expect(uploaded).toEqual({
      id: 'https://example.test/p.jpg',
      url: 'https://example.test/p.jpg',
    });
  });
});
