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

  it('titresim veremeyen bir cihazda akisi durdurmuyor', async () => {
    // His bir ek, bilginin tasiyicisi degil: motoru olmayan ya da izin
    // vermeyen bir cihazda hata akisa cikmamali.
    mocked.selectionAsync.mockRejectedValue(new Error('no motor'));

    expect(() => haptics.select()).not.toThrow();
    await Promise.resolve();
  });
});
