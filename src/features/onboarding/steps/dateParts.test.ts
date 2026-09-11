import { dateFromParts, draftFromParts, partsFromDate, partsFromDraft } from './dateParts';

describe('partsFromDraft', () => {
  it('bos taslakta uc alan da bos', () => {
    expect(partsFromDraft(undefined)).toEqual({ day: null, month: null, year: null });
    expect(partsFromDraft({ day: '', month: '', year: '' })).toEqual({
      day: null,
      month: null,
      year: null,
    });
  });

  it('yarim taslakta yalnizca verilen alani okuyor', () => {
    expect(partsFromDraft({ day: '14', month: '', year: '' })).toEqual({
      day: 14,
      month: null,
      year: null,
    });
  });

  it('tam taslagi okuyor', () => {
    expect(partsFromDraft({ day: '14', month: '3', year: '1996' })).toEqual({
      day: 14,
      month: 3,
      year: 1996,
    });
  });

  it('sayi olmayan bir alani bos sayiyor', () => {
    expect(partsFromDraft({ day: 'abc', month: '3', year: '1996' }).day).toBeNull();
  });
});

describe('draftFromParts', () => {
  it('taslak bicimini degistirmiyor', () => {
    expect(draftFromParts({ day: 5, month: 3, year: 1996 })).toEqual({
      day: '5',
      month: '3',
      year: '1996',
    });
  });

  it('verilmemis alani bos dize olarak yaziyor: dogrulama bunu eksik sayiyor', () => {
    expect(draftFromParts({ day: 5, month: null, year: null })).toEqual({
      day: '5',
      month: '',
      year: '',
    });
  });
});

describe('dateFromParts', () => {
  it('tamamlanmis tarihi takvimdeki noktaya cevirir', () => {
    expect(dateFromParts({ day: 14, month: 3, year: 1998 })).toEqual(new Date(1998, 2, 14, 12));
  });

  it('yarim tarihten nokta uretmez', () => {
    expect(dateFromParts({ day: 14, month: null, year: 1998 })).toBeNull();
  });

  it('takvimde olmayan tarihi kabul etmez', () => {
    // Sessizce 3 Mart'a kaymak, kullaniciya vermedigi bir cevabi gostermek olurdu.
    expect(dateFromParts({ day: 31, month: 2, year: 2023 })).toBeNull();
  });

  it('artik yilin 29 Subatini korur', () => {
    expect(dateFromParts({ day: 29, month: 2, year: 2024 })).toEqual(new Date(2024, 1, 29, 12));
  });
});

describe('partsFromDate', () => {
  it('ayi birden baslatarak taslak bicimine doner', () => {
    expect(partsFromDate(new Date(1998, 2, 14))).toEqual({ day: 14, month: 3, year: 1998 });
  });
});

describe('dateFromParts – saat dilimi yorumu ayrisirsa bile gun kaymiyor', () => {
  // Cihaz ile JS motorunun saat dilimi tablosu birbirinden habersiz iki ayri
  // kaynak; Turkiye 2016'ya kadar yaz saati uyguladigi icin gecmis bir tarih
  // icin bu iki kaynagin birkac saatlik farkli bir kaydirma uygulamasi
  // beklenmedik degil. Gece yarisi gun sinirina bitisik oldugu icin bu fark
  // hemen bir gun kaymasina donusuyor; ogle vakti bu sinirdan en uzak nokta.
  it.each([
    { day: 1, month: 3, year: 2003 },
    { day: 1, month: 1, year: 1950 },
    { day: 28, month: 2, year: 2003 },
    { day: 29, month: 2, year: 2024 },
    { day: 31, month: 12, year: 1999 },
  ])('%s: birkac saatlik bir yorum farkinda takvim gunu ayni kaliyor', ({ day, month, year }) => {
    const date = dateFromParts({ day, month, year })!;

    for (const skewHours of [-4, -1, 1, 4]) {
      const reinterpreted = new Date(date.getTime() + skewHours * 60 * 60 * 1000);
      expect(reinterpreted.getDate()).toBe(day);
      expect(reinterpreted.getMonth()).toBe(month - 1);
      expect(reinterpreted.getFullYear()).toBe(year);
    }
  });
});
