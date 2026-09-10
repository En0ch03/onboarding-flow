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
    expect(dateFromParts({ day: 14, month: 3, year: 1998 })).toEqual(new Date(1998, 2, 14));
  });

  it('yarim tarihten nokta uretmez', () => {
    expect(dateFromParts({ day: 14, month: null, year: 1998 })).toBeNull();
  });

  it('takvimde olmayan tarihi kabul etmez', () => {
    // Sessizce 3 Mart'a kaymak, kullaniciya vermedigi bir cevabi gostermek olurdu.
    expect(dateFromParts({ day: 31, month: 2, year: 2023 })).toBeNull();
  });

  it('artik yilin 29 Subatini korur', () => {
    expect(dateFromParts({ day: 29, month: 2, year: 2024 })).toEqual(new Date(2024, 1, 29));
  });
});

describe('partsFromDate', () => {
  it('ayi birden baslatarak taslak bicimine doner', () => {
    expect(partsFromDate(new Date(1998, 2, 14))).toEqual({ day: 14, month: 3, year: 1998 });
  });
});
