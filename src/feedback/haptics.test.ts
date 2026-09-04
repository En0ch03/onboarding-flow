import * as Haptics from 'expo-haptics';

import { haptics } from './haptics';

const mocked = Haptics as jest.Mocked<typeof Haptics>;

beforeEach(() => {
  mocked.selectionAsync.mockReset().mockResolvedValue();
  mocked.impactAsync.mockReset().mockResolvedValue();
  mocked.notificationAsync.mockReset().mockResolvedValue();
});

describe('haptics', () => {
  it('secim, ilerleme ve ret icin farkli hisler kullaniyor', () => {
    haptics.select();
    haptics.advance();
    haptics.refuse();

    expect(mocked.selectionAsync).toHaveBeenCalledTimes(1);
    expect(mocked.impactAsync).toHaveBeenCalledTimes(1);
    expect(mocked.notificationAsync).toHaveBeenCalledTimes(1);
  });

  it('titresim veremeyen bir cihazda hatayi yutuyor', async () => {
    // His bir ek, bilginin tasiyicisi degil: motoru olmayan ya da izin
    // vermeyen bir cihazda hata akisa cikmamali. `not.toThrow()` yetmiyor,
    // o yalnizca senkron firlatmayi olcuyor.
    mocked.selectionAsync.mockRejectedValue(new Error('no motor'));
    await expect(haptics.select()).resolves.toBeUndefined();
  });

  it('modul beklenmedik bicimde yoksa akisa hata kacirmiyor', async () => {
    mocked.impactAsync.mockImplementation(() => {
      throw new TypeError('not a function');
    });
    await expect(haptics.advance()).resolves.toBeUndefined();
  });
});
