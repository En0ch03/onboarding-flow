import { completionTitle } from './strings';

/**
 * Kapanis cumlesi, akisin son ekranindaki tek kisisel cumle. Ad iki yoldan
 * gelebiliyor: kullanicinin yazdigi taslak ve sunucudaki profil.
 */
describe('completionTitle', () => {
  it('ismi yalin birakiyor: ek getirmiyor', () => {
    // Unlu uyumu ve kesme isareti isimden isime degisiyor; bir isimde dogru
    // olan kalip digerinde bozuk. Dogru kalip ismi yalin birakan.
    expect(completionTitle('Ayşe')).toBe('Hazırsın, Ayşe.');
    expect(completionTitle('Ahmet')).toBe('Hazırsın, Ahmet.');
  });

  it('bastaki ve sondaki boslugu atiyor', () => {
    // Mobil klavyeler kelime sonuna bosluk ekliyor ve cumle "Hazirsin, Ayse ."
    // oluyordu.
    expect(completionTitle('Ayşe ')).toBe('Hazırsın, Ayşe.');
    expect(completionTitle('  Ayşe  ')).toBe('Hazırsın, Ayşe.');
  });

  it('iki ad arasindaki boslugu koruyor', () => {
    expect(completionTitle(' Ayşe Yılmaz ')).toBe('Hazırsın, Ayşe Yılmaz.');
  });
});
