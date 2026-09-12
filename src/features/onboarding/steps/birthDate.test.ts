import { ageOn, inspectBirthDate, MINIMUM_AGE } from './birthDate';

describe('ageOn', () => {
  it('bugun tam 18 yasina giren biri 18 sayilir', () => {
    const birth = new Date(2008, 8, 12);
    const today = new Date(2026, 8, 12);
    expect(ageOn(birth, today)).toBe(18);
  });

  it('yarin 18 olacak biri bugun henuz 17', () => {
    const birth = new Date(2008, 8, 13);
    const today = new Date(2026, 8, 12);
    expect(ageOn(birth, today)).toBe(17);
  });

  it('dun 18 olmus biri 18 sayilir', () => {
    const birth = new Date(2008, 8, 11);
    const today = new Date(2026, 8, 12);
    expect(ageOn(birth, today)).toBe(18);
  });

  it('artik yilda 29 Subat doganin dogum gunu, artik olmayan yilda 1 Marta kayar', () => {
    const birth = new Date(2008, 1, 29);
    // 2026 artik yil degil: 28 Subat'ta dogum gunu henuz gelmedi.
    expect(ageOn(birth, new Date(2026, 1, 28))).toBe(17);
    // 1 Mart'ta artik olmayan yilin karsiligi gecmis sayilir.
    expect(ageOn(birth, new Date(2026, 2, 1))).toBe(18);
  });

  it('yil sinirini gun sayisi degil ay ve gun karsilastirmasiyla gecer', () => {
    const birth = new Date(2008, 0, 1);
    // 31 Aralik'ta dogum gunu henuz gelecek yilin isi.
    expect(ageOn(birth, new Date(2025, 11, 31))).toBe(17);
    // 1 Ocak'ta tam sinirdayiz.
    expect(ageOn(birth, new Date(2026, 0, 1))).toBe(18);
  });
});

describe('inspectBirthDate', () => {
  it('taslak yoksa eksik sayar', () => {
    expect(inspectBirthDate(undefined)).toBe('incomplete');
  });

  it('bos alanlari eksik sayar', () => {
    expect(inspectBirthDate({ day: '', month: '5', year: '1996' })).toBe('incomplete');
  });

  it('takvimde olmayan bir tarihi gecersiz sayar', () => {
    // 31 Subat diye bir gun yok; JS motoru bunu sessizce Mart'a kaydirir,
    // geri okuma kontrolu bu kaymayi yakalamali.
    expect(inspectBirthDate({ day: '31', month: '2', year: '1996' })).toBe('invalid');
  });

  it('1900 oncesini gecersiz sayar', () => {
    expect(inspectBirthDate({ day: '1', month: '1', year: '1899' })).toBe('invalid');
  });

  it('gelecekteki bir tarihi gecersiz sayar', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 12));
    try {
      expect(inspectBirthDate({ day: '13', month: '9', year: '2026' })).toBe('invalid');
    } finally {
      jest.useRealTimers();
    }
  });

  it('bugun tam 18 yasina giren tarihte kapi aciliyor', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 12));
    try {
      expect(inspectBirthDate({ day: '12', month: '9', year: '2008' })).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('yarin 18 olacak tarihte kapi henuz kapali', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 12));
    try {
      expect(inspectBirthDate({ day: '13', month: '9', year: '2008' })).toBe('too_young');
    } finally {
      jest.useRealTimers();
    }
  });

  it('MINIMUM_AGE sabiti 18', () => {
    expect(MINIMUM_AGE).toBe(18);
  });
});
