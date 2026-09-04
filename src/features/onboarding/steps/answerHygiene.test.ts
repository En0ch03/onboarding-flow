import type { OptionGroups } from '@/api/schemas';

import { pruneAnswers } from './answerHygiene';

const options: OptionGroups = {
  gender: {
    key: 'gender',
    multiSelect: false,
    maxSelection: null,
    required: true,
    options: [
      { id: 'woman', label: 'Kadınım' },
      { id: 'man', label: 'Erkeğim' },
    ],
  },
  audience: {
    key: 'audience',
    multiSelect: true,
    maxSelection: 3,
    required: true,
    options: [
      { id: 'women', label: 'Kadınlar' },
      { id: 'men', label: 'Erkekler' },
    ],
  },
  intent: {
    key: 'intent',
    multiSelect: true,
    maxSelection: 2,
    required: true,
    options: [
      { id: 'long_term', label: 'Uzun soluklu' },
      { id: 'friendship', label: 'Arkadaşlık', unlocks: 'interests_friendship' },
    ],
  },
  interests: {
    key: 'interests',
    multiSelect: true,
    maxSelection: 8,
    required: false,
    options: [{ id: 'books', label: 'Kitap' }],
  },
  interests_friendship: {
    key: 'interests_friendship',
    multiSelect: true,
    maxSelection: 8,
    required: false,
    options: [{ id: 'board_games', label: 'Kutu oyunları' }],
  },
};

describe('pruneAnswers', () => {
  it('sunulan cevaplara dokunmuyor', () => {
    const answers = { gender: 'woman', audience: ['women'], intent: ['long_term'] };
    expect(pruneAnswers(answers, options)).toEqual(answers);
  });

  it('sunucudan dusen tekli cevabi kaldiriyor', () => {
    expect(pruneAnswers({ gender: 'nonbinary' }, options).gender).toBeUndefined();
  });

  it('sunucudan dusen coklu cevaplari suzuyor', () => {
    expect(pruneAnswers({ audience: ['women', 'everyone'] }, options).audience).toEqual(['women']);
  });

  it('hepsi dustuyse alan bos kaliyor ve adim tamamlanmis sayilmiyor', () => {
    // Bosalan bir dizi, "cevap yok" demek: adim yeniden soruluyor.
    expect(pruneAnswers({ intent: ['unsure'] }, options).intent).toEqual([]);
  });

  it('ilgi alanlarini niyete gore dogru gruba karsi suzuyor', () => {
    expect(
      pruneAnswers({ intent: ['friendship'], interests: ['board_games', 'books'] }, options)
        .interests,
    ).toEqual(['board_games']);

    expect(
      pruneAnswers({ intent: ['long_term'], interests: ['board_games', 'books'] }, options)
        .interests,
    ).toEqual(['books']);
  });

  it('grup hic gelmediyse cevaba dokunmuyor', () => {
    // Eksik bir liste, cevabin gecersiz oldugu anlamina gelmiyor.
    const { gender: _gender, ...withoutGender } = options;
    expect(pruneAnswers({ gender: 'woman' }, withoutGender).gender).toBe('woman');
  });

  it('acilan grup sunulmuyorsa genel listeye karsi suzuyor', () => {
    // Sunucu `unlocks` gonderip o grubu sunmazsa ekran genel listeyi
    // ciziyordu; temizlik baska bir listeye baksaydi hayalet cevap kalirdi.
    const { interests_friendship: _missing, ...partial } = options;
    expect(
      pruneAnswers({ intent: ['friendship'], interests: ['board_games', 'books'] }, partial)
        .interests,
    ).toEqual(['books']);
  });

  it('hicbir sey dusmediyse ayni nesneyi donduruyor', () => {
    // Cagiran, temizligin gercekten bir sey degistirip degistirmedigini
    // referans karsilastirmasiyla anliyor.
    const answers = { gender: 'woman', audience: ['women'] };
    expect(pruneAnswers(answers, options)).toBe(answers);
  });

  it('verilmemis alanlari uydurmuyor', () => {
    expect(pruneAnswers({ name: 'Deniz' }, options)).toEqual({ name: 'Deniz' });
  });
});
