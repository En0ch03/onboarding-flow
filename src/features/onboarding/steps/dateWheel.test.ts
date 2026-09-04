import {
  clampParts,
  daysInMonth,
  draftFromParts,
  EARLIEST_YEAR,
  hasChosenDate,
  openingParts,
  OPENING_AGE,
  partsFromDraft,
  yearRange,
} from './dateWheel';

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

describe('clampParts', () => {
  it('ay kisaldiginda gunu son gune cekiyor', () => {
    expect(clampParts({ day: 31, month: 2, year: 2023 })).toEqual({ day: 28, month: 2, year: 2023 });
    expect(clampParts({ day: 31, month: 2, year: 2024 })).toEqual({ day: 29, month: 2, year: 2024 });
  });

  it('sigan gune dokunmuyor', () => {
    expect(clampParts({ day: 14, month: 3, year: 1996 })).toEqual({
      day: 14,
      month: 3,
      year: 1996,
    });
  });
});

describe('partsFromDraft', () => {
  it('bos taslakta akla yatkin bir satirdan aciliyor', () => {
    expect(partsFromDraft(undefined, today)).toEqual(openingParts(today));
    expect(openingParts(today)).toEqual({
      day: 1,
      month: 1,
      year: today.getFullYear() - OPENING_AGE,
    });
  });

  it('yarim taslakta acilis satirina dusuyor', () => {
    expect(partsFromDraft({ day: '14', month: '', year: '' }, today)).toEqual(openingParts(today));
  });

  it('takvimde olmayan bir taslakta acilis satirina dusuyor', () => {
    expect(partsFromDraft({ day: '31', month: '2', year: '1996' }, today)).toEqual(
      openingParts(today),
    );
  });

  it('kayitli tarihi oldugu gibi aciyor', () => {
    expect(partsFromDraft({ day: '14', month: '3', year: '1996' }, today)).toEqual({
      day: 14,
      month: 3,
      year: 1996,
    });
  });

  it('kucuk yasli bir tarihi de oldugu gibi aciyor: kapi ayri bir kontrol', () => {
    expect(partsFromDraft({ day: '1', month: '1', year: '2015' }, today)).toEqual({
      day: 1,
      month: 1,
      year: 2015,
    });
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
});

describe('hasChosenDate', () => {
  it('yalnizca uc alan da doluysa secilmis sayiyor', () => {
    expect(hasChosenDate(undefined)).toBe(false);
    expect(hasChosenDate({ day: '', month: '', year: '' })).toBe(false);
    expect(hasChosenDate({ day: '5', month: '3', year: '' })).toBe(false);
    expect(hasChosenDate({ day: '5', month: '3', year: '1996' })).toBe(true);
  });
});
