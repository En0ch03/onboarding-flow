import type { OptionGroup } from '@/api/schemas';

import { isBlockedByLimit, sortedOptions, toggleSelection } from './useSelection';

/** Kapsama iliskisi tasiyan grup: "herkes" digerlerini kapsiyor. */
const audience: OptionGroup = {
  key: 'audience',
  multiSelect: true,
  maxSelection: 3,
  required: true,
  options: [
    { id: 'women', label: 'Kadınlar', order: 1 },
    { id: 'men', label: 'Erkekler', order: 2 },
    { id: 'everyone', label: 'Herkes', covers: ['women', 'men'], order: 3 },
  ],
};

/** Kapsama iliskisi olmayan, sinirli grup. */
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

describe('kapsama iliskisi', () => {
  it('kapsananlarin hepsi isaretlenince secim kapsayana toplaniyor', () => {
    expect(toggleSelection(audience, ['women'], 'men').next).toEqual(['everyone']);
  });

  it('kapsayan isaretlenince kapsadiklari dusuyor', () => {
    expect(toggleSelection(audience, ['women'], 'everyone').next).toEqual(['everyone']);
    expect(toggleSelection(audience, ['women', 'men'], 'everyone').next).toEqual(['everyone']);
  });

  it('kapsayan isaretliyken dar bir cevap secilirse kapsayan dusuyor', () => {
    expect(toggleSelection(audience, ['everyone'], 'women').next).toEqual(['women']);
  });

  it('tek basina bir kapsanan secmek toplamaya yol acmiyor', () => {
    expect(toggleSelection(audience, [], 'women').next).toEqual(['women']);
  });

  it('kapsayanin isareti kaldirilabiliyor', () => {
    expect(toggleSelection(audience, ['everyone'], 'everyone').next).toEqual([]);
  });

  it('kapsananin isareti kaldirilinca digerine dokunulmuyor', () => {
    expect(toggleSelection(audience, ['women', 'men'], 'women').next).toEqual(['men']);
  });
});

describe('istemci hicbir secenek kimligi bilmiyor', () => {
  it('kapsama verisi gelmezse secenekler bagimsiz kaliyor', () => {
    const plain: OptionGroup = {
      ...audience,
      options: audience.options.map(({ covers: _covers, ...rest }) => rest),
    };
    expect(toggleSelection(plain, ['women'], 'men').next).toEqual(['women', 'men']);
  });

  it('kapsama iliskisi baska kimliklerle de calisiyor', () => {
    const other: OptionGroup = {
      key: 'diet',
      multiSelect: true,
      maxSelection: null,
      required: false,
      options: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
        { id: 'abc', label: 'Hepsi', covers: ['a', 'b', 'c'] },
      ],
    };
    expect(toggleSelection(other, ['a', 'b'], 'c').next).toEqual(['abc']);
    expect(toggleSelection(other, ['a'], 'b').next).toEqual(['a', 'b']);
  });
});

describe('sinir', () => {
  it('sinir dolunca yeni secim reddediliyor', () => {
    const result = toggleSelection(interests, ['books', 'coffee'], 'cinema');
    expect(result.refused).toBe(true);
    expect(result.next).toEqual(['books', 'coffee']);
  });

  it('sinir dolu gorunse de secimi kisaltan bir dokunus gecebiliyor', () => {
    // Iki secili, sinir iki. "Herkes" ucuncuyu eklemiyor, ikisini birine
    // indiriyor; onceden reddetmek yanlis olurdu.
    const tight: OptionGroup = { ...audience, maxSelection: 2 };
    expect(toggleSelection(tight, ['women', 'men'], 'everyone').next).toEqual(['everyone']);
    expect(isBlockedByLimit(tight, ['women', 'men'], 'everyone')).toBe(false);
  });

  it('sinir dolunca kapsamasiz secenek engelli gorunuyor', () => {
    expect(isBlockedByLimit(interests, ['books', 'coffee'], 'cinema')).toBe(true);
    expect(isBlockedByLimit(interests, ['books'], 'cinema')).toBe(false);
  });

  it('secili olan hicbir zaman engelli degil', () => {
    expect(isBlockedByLimit(interests, ['books', 'coffee'], 'books')).toBe(false);
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
    expect(isBlockedByLimit(gender, ['woman'], 'man')).toBe(false);
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
