import type { OptionGroup } from '@/api/schemas';

import { isAtLimit, sortedOptions, toggleSelection } from './useSelection';

const audience: OptionGroup = {
  key: 'audience',
  multiSelect: true,
  maxSelection: 3,
  required: true,
  options: [
    { id: 'women', label: 'Kadınlar', order: 1 },
    { id: 'men', label: 'Erkekler', order: 2 },
    { id: 'everyone', label: 'Herkes', order: 3 },
  ],
};

/** Sinirli grup. */
const interests: OptionGroup = {
  key: 'interests',
  multiSelect: true,
  maxSelection: 2,
  required: false,
  options: [
    { id: 'books', label: 'Kitap' },
    { id: 'coffee', label: 'Kahve' },
    { id: 'cinema', label: 'Sinema' },
  ],
};

const gender: OptionGroup = {
  key: 'gender',
  multiSelect: false,
  maxSelection: null,
  required: true,
  options: [
    { id: 'woman', label: 'Kadınım' },
    { id: 'man', label: 'Erkeğim' },
  ],
};

describe('bir dokunus yalnizca dokunulan secenegi degistiriyor', () => {
  it('iki secenek isaretlemek ucuncusunu isaretlemiyor', () => {
    // Eski surumde "Kadinlar" ve "Erkekler" birlikte isaretlenince secim
    // kendiliginden "Herkes"e toplaniyordu. Cihazda tersine cevrildi:
    // kullanicinin vermedigi bir cevabi ona gostermek, geri almasi belirsiz
    // bir durum yaratiyordu.
    expect(toggleSelection(audience, ['women'], 'men').next).toEqual(['women', 'men']);
  });

  it('genis bir secenek isaretlemek digerlerini dusurmuyor', () => {
    expect(toggleSelection(audience, ['women'], 'everyone').next).toEqual(['women', 'everyone']);
  });

  it('isaret kaldirmak yalnizca dokunulani kaldiriyor', () => {
    expect(toggleSelection(audience, ['women', 'men'], 'women').next).toEqual(['men']);
  });

  it('bos secimden baslamak calisiyor', () => {
    expect(toggleSelection(audience, [], 'women').next).toEqual(['women']);
  });

  it('secim sirasi korunuyor', () => {
    expect(toggleSelection(audience, ['everyone'], 'women').next).toEqual(['everyone', 'women']);
  });
});

describe('sinir', () => {
  it('sinir dolunca yeni secim reddediliyor', () => {
    const result = toggleSelection(interests, ['books', 'coffee'], 'cinema');
    expect(result.refused).toBe(true);
    expect(result.next).toEqual(['books', 'coffee']);
  });

  it('reddedilen dokunusta ayni dizi donuyor', () => {
    // Cagiran taraf degismeyen secimde his uretmiyor; kimlik karsilastirmasi
    // buna dayaniyor.
    const current = ['books', 'coffee'];
    expect(toggleSelection(interests, current, 'cinema').next).toBe(current);
  });

  it('sinir dolunca secili olmayan secenek engelli gorunuyor', () => {
    expect(isAtLimit(interests, ['books', 'coffee'], 'cinema')).toBe(true);
    expect(isAtLimit(interests, ['books'], 'cinema')).toBe(false);
  });

  it('secili olan hicbir zaman engelli degil', () => {
    expect(isAtLimit(interests, ['books', 'coffee'], 'books')).toBe(false);
  });

  it('sinir yoksa hicbir secenek engelli degil', () => {
    const open: OptionGroup = { ...interests, maxSelection: null };
    expect(isAtLimit(open, ['books', 'coffee'], 'cinema')).toBe(false);
  });
});

describe('tekli secim', () => {
  it('yeni secim eskisinin yerini aliyor', () => {
    expect(toggleSelection(gender, ['woman'], 'man').next).toEqual(['man']);
  });

  it('secili olana tekrar dokunmak secimi bosaltmiyor', () => {
    expect(toggleSelection(gender, ['woman'], 'woman').next).toEqual(['woman']);
  });

  it('tekli grupta sinir kontrolu yok', () => {
    expect(isAtLimit(gender, ['woman'], 'man')).toBe(false);
  });
});

describe('sortedOptions', () => {
  it('sirasi verilmeyen secenekleri de kabul ediyor', () => {
    expect(sortedOptions(interests).map((option) => option.id)).toEqual([
      'books',
      'coffee',
      'cinema',
    ]);
  });

  it('sunucunun verdigi siraya uyuyor', () => {
    expect(sortedOptions(audience).map((option) => option.id)).toEqual([
      'women',
      'men',
      'everyone',
    ]);
  });
});
