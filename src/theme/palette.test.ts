import { palettes } from './palette';

describe('palet', () => {
  it('koyu varyantta ikincil metin tonu, perdesiz kurdele ustunde AA gecen deger', () => {
    // Deger olculdu: eski ton (#B5ADA8) K1 ve K2'de kurdelenin parlak
    // bolgelerinde 4,5:1 esiginin altina dusuyordu. Literal yazildi; sinanan
    // koddan uretilmedi.
    expect(palettes.dark.inkSoft).toBe('#D5D0CB');
  });
});
