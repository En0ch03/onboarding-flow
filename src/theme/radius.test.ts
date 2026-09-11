import { radius } from './radius';

describe('kose yaricaplari', () => {
  it('kart yaricapini olcegin geri kalanindan belirgin sekilde ayiriyor', () => {
    // Deger burada sayiyla yaziliyor: `radius.xl`'i kendisiyle karsilastiran
    // bir test, deger degistiginde de yesil kalirdi. Cam kirilmayi kose yayinda
    // topluyor ve yay `lg` kadar darsa kirilma keskin bir kenar cizgisine
    // iniyor; kart o zaman camdan cok cerceveli bir panel gibi okunuyor.
    expect(radius.xl).toBe(32);
    expect(radius.glass).toBe(46);
    expect(radius.xl).toBeGreaterThan(radius.lg);
  });
});
