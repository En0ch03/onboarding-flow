import { MAX_INPUT_LENGTH, inspectPhone, normalizePhone } from './phoneNumber';

describe('alanin kabul ettigi uzunluk', () => {
  // `maxLength` yapistirmayi `onChangeText`'ten **once** kirpiyor, yani dar bir
  // sinir temizligin hic gormedigi bir metin birakiyor. Sinir ile temizlik bu
  // yuzden ayni testte bulusuyor: biri digerinden habersiz degistirilemesin.
  it.each([
    ['+90 555 123 45 67'],
    ['+90 (555) 123 45 67'],
    ['0555 123 45 67'],
    ['90 555 123 45 67'],
  ])('yapistirilan %s alana sigiyor ve temizlendiginde gecerli kaliyor', (pasted) => {
    expect(pasted.length).toBeLessThanOrEqual(MAX_INPUT_LENGTH);
    expect(inspectPhone(pasted.slice(0, MAX_INPUT_LENGTH))).toBeNull();
  });
});

describe('normalizePhone', () => {
  it('yazim isaretlerini dusuruyor', () => {
    expect(normalizePhone('(555) 123 45 67')).toBe('5551234567');
  });

  it('bastaki sifiri dusuruyor', () => {
    // Alistigimiz yazim bu: kullanicilarin cogu numarayi sifirla yaziyor ve
    // bunu bir hata olarak geri cevirmek, duzeltmesi bize ait olan bir seyi
    // kullaniciya yikmak olurdu.
    expect(normalizePhone('05551234567')).toBe('5551234567');
  });

  it('bastaki sifiri yalnizca on birinci hane yazilinca dusuruyor', () => {
    // Kirpma uzunluga bagli. Yarim yazilmis bir numarada sifiri dusurmek,
    // kullanici yazmaya devam ederken alanin altindan kaymasi demek olurdu.
    expect(normalizePhone('0555')).toBe('0555');
    expect(normalizePhone('0555123456')).toBe('0555123456');
    expect(normalizePhone('05551234567')).toBe('5551234567');
  });

  it('bastaki ulke kodunu dusuruyor', () => {
    expect(normalizePhone('+90 555 123 45 67')).toBe('5551234567');
  });

  it('bes ile baslayan on haneli bir numaraya dokunmuyor', () => {
    // `5905551234` bastaki `90`a benziyor ama on hane; kirpilirsa gecerli bir
    // numara bozulurdu.
    expect(normalizePhone('5905551234')).toBe('5905551234');
  });
});

describe('inspectPhone', () => {
  it('bos deger eksik sayiliyor', () => {
    expect(inspectPhone(undefined)).toBe('incomplete');
    expect(inspectPhone('')).toBe('incomplete');
  });

  it('yarim numara eksik sayiliyor, yanlis degil', () => {
    // Yazmaya devam eden birine "gecersiz" demek, henuz yapmadigi bir hatayi
    // yuzune vurmak olurdu.
    expect(inspectPhone('555123')).toBe('incomplete');
  });

  it('on haneden uzun numara gecersiz', () => {
    expect(inspectPhone('55512345678')).toBe('invalid');
  });

  it('bes ile baslamayan numara gecersiz', () => {
    // Turkiye'de cep numaralari bes ile basliyor; sabit hat numarasi bu
    // alanda ise yaramaz ve bunu simdi soylemek, sonra sunucudan ogrenmekten
    // iyi.
    expect(inspectPhone('2121234567')).toBe('invalid');
  });

  it('gecerli numara sorun bildirmiyor', () => {
    expect(inspectPhone('5551234567')).toBeNull();
  });

  it('yazim isaretli gecerli numara da kabul ediliyor', () => {
    expect(inspectPhone('0555 123 45 67')).toBeNull();
  });
});
