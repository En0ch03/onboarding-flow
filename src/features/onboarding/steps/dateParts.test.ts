import {
  dayCount,
  daysInMonth,
  draftFromParts,
  EARLIEST_YEAR,
  partsFromDraft,
  yearRange,
} from './dateParts';

const today = new Date(2026, 8, 4);

describe('daysInMonth', () => {
  it('artik yili biliyor', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
  });

  it('yuzyil kuralini biliyor', () => {
    expect(daysInMonth(1900, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
  });

  it('kisa ve uzun aylari ayirt ediyor', () => {
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });
});

describe('yearRange', () => {
  const years = yearRange(today);

  it('bu yildan baslayip 1900e iniyor', () => {
    expect(years[0]).toBe(2026);
    expect(years[years.length - 1]).toBe(EARLIEST_YEAR);
  });

  it('gelecek bir yil sunmuyor', () => {
    expect(years.some((year) => year > today.getFullYear())).toBe(false);
  });

  it('yas kapisinin atesleyebilmesi icin kucuk yaslari da sunuyor', () => {
    expect(years).toContain(today.getFullYear() - 10);
  });
});

describe('dayCount', () => {
  it('ay secilmeden takvimin en uzun ayini sunuyor', () => {
    expect(dayCount(null, null)).toBe(31);
    expect(dayCount(null, 2024)).toBe(31);
  });

  it('yil verilmemisken ayin en uzun halini sunuyor', () => {
    // Yili beklemek "31 Subat" ara durumunu mumkun kiliyor ve gun, kullanici
    // yili sectigi anda aciklamasiz kayboluyordu.
    expect(dayCount(2, null)).toBe(29);
    expect(dayCount(4, null)).toBe(30);
  });

  it('ay ve yil seciliyken o ayin uzunlugunu veriyor', () => {
    expect(dayCount(2, 2023)).toBe(28);
    expect(dayCount(2, 2024)).toBe(29);
    expect(dayCount(4, 2026)).toBe(30);
  });
});

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
