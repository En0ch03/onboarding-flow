'use strict';

const { completionProblems } = require('./completion');

/**
 * Kapinin karar fonksiyonu burada sinaniyor: hangi profilin tamamlanabilir
 * sayildigi. Uc noktanin bu karari 422'ye cevirmesi ayri bir sey ve burada
 * kapsanmiyor; sinanan, kararin kendisi.
 */

const groups = {
  gender: {
    key: 'gender',
    multiSelect: false,
    maxSelection: null,
    required: true,
    options: [{ id: 'woman' }, { id: 'man' }],
  },
  audience: {
    key: 'audience',
    multiSelect: true,
    maxSelection: 2,
    required: true,
    options: [{ id: 'women' }, { id: 'men' }],
  },
  intent: {
    key: 'intent',
    multiSelect: true,
    maxSelection: 2,
    required: false,
    options: [{ id: 'long_term' }, { id: 'friendship', unlocks: 'interests_friendship' }],
  },
  interests: {
    key: 'interests',
    multiSelect: true,
    maxSelection: 8,
    required: false,
    options: [{ id: 'books' }],
  },
  interests_friendship: {
    key: 'interests_friendship',
    variantOf: 'interests',
    multiSelect: true,
    maxSelection: 8,
    required: false,
    options: [{ id: 'board_games' }],
  },
};

const today = new Date(2026, 8, 4);

function user(preferences) {
  return { display_name: 'Deniz', preferences };
}

const photos = [
  { id: 'p1', url: 'http://example.test/p1' },
  { id: 'p2', url: 'http://example.test/p2' },
];

const complete = {
  birth_date: { day: '14', month: '3', year: '1996' },
  gender: 'woman',
  audience: ['women'],
  photos,
};

describe('completionProblems', () => {
  it('tam bir profile engel cikarmiyor', () => {
    expect(completionProblems(user(complete), groups, today)).toEqual({});
  });

  it('zorunlu bir liste cevapsizsa tamamlamayi reddediyor', () => {
    const { audience: _omitted, ...missing } = complete;
    expect(completionProblems(user(missing), groups, today)).toEqual({ audience: 'required' });
  });

  it('zorunlu olmayan liste engel degil', () => {
    expect(completionProblems(user(complete), groups, today).interests).toBeUndefined();
  });

  it('adsiz profili tamamlamiyor', () => {
    const nameless = { display_name: '   ', preferences: complete };
    expect(completionProblems(nameless, groups, today).display_name).toBe('required');
  });

  it('yas kapisini sunucuda da kapatiyor', () => {
    const young = { ...complete, birth_date: { day: '1', month: '1', year: '2015' } };
    expect(completionProblems(user(young), groups, today).birth_date).toBe('invalid');
  });

  it('dogum tarihi yoksa tamamlamiyor', () => {
    const { birth_date: _omitted, ...missing } = complete;
    expect(completionProblems(user(missing), groups, today).birth_date).toBe('required');
  });

  it('takvimde olmayan tarihi kabul etmiyor', () => {
    const impossible = { ...complete, birth_date: { day: '31', month: '2', year: '1996' } };
    expect(completionProblems(user(impossible), groups, today).birth_date).toBe('required');
  });

  it('listeden kaldirilmis bir kimlik cevabi ayakta tutmuyor', () => {
    // Sunucudan silinen bir secenek, kullanicinin bir daha hic gormeyecegi
    // bir soruyu cevaplamis gorunmesine yol acmamali.
    const stale = { ...complete, gender: 'removed_option' };
    expect(completionProblems(user(stale), groups, today).gender).toBe('required');
  });

  it('fotograf tabani altinda tamamlamiyor', () => {
    const single = { ...complete, photos: [photos[0]] };
    expect(completionProblems(user(single), groups, today).photos).toBe('required');

    const none = { ...complete, photos: [] };
    expect(completionProblems(user(none), groups, today).photos).toBe('required');
  });

  it('fotograf gibi gorunen ama olmayan girdileri saymiyor', () => {
    const junk = { ...complete, photos: [photos[0], { id: 'p2' }] };
    expect(completionProblems(user(junk), groups, today).photos).toBe('required');
  });

  it('tekli bir soruya iki cevap gelirse reddediyor', () => {
    const two = { ...complete, gender: ['woman', 'man'] };
    expect(completionProblems(user(two), groups, today).gender).toBe('invalid');
  });

  it('tekli bir soruya dizi gelmesi tek elemanli olsa da bicim hatasi', () => {
    const boxed = { ...complete, gender: ['woman'] };
    expect(completionProblems(user(boxed), groups, today).gender).toBe('invalid');
  });

  it('sinira kadar secim kabul ediliyor', () => {
    const full = { ...complete, audience: ['women', 'men'] };
    expect(completionProblems(user(full), groups, today)).toEqual({});
  });

  it('sinirdan fazla secim reddediliyor', () => {
    // Sinir istemcide de var ama orada bir nezaket; kurali cignemis bir
    // istemci profili tamamlatamamali.
    const tight = { ...groups, audience: { ...groups.audience, maxSelection: 1 } };
    const over = { ...complete, audience: ['women', 'men'] };

    expect(completionProblems(user(over), tight, today).audience).toBe('invalid');
  });

  it('tanimadigi kimlikler sayilmiyor, sinir onlarla dolmuyor', () => {
    const noisy = { ...complete, audience: ['women', 'gone_a', 'gone_b'] };
    expect(completionProblems(user(noisy), groups, today)).toEqual({});
  });

  it('dogum tarihi parcalari mantiksal deger olamaz', () => {
    // `Number(true)` 1 veriyor ve bu gecerli bir gune benziyordu.
    const bool = { ...complete, birth_date: { day: true, month: '3', year: '1996' } };
    expect(completionProblems(user(bool), groups, today).birth_date).toBe('required');
  });

  it('acilan listeden secilen etiket taban listenin cevabi olarak kabul ediliyor', () => {
    // Kosullu liste kendi anahtariyla saklanmiyor; cevap `interests`
    // altinda duruyor ve orada taninmali.
    const required = { ...groups, interests: { ...groups.interests, required: true } };
    const unlocked = { ...complete, intent: ['friendship'], interests: ['board_games'] };

    expect(completionProblems(user(unlocked), required, today)).toEqual({});
  });

  it('birbirini acan iki liste denetimden kacamiyor', () => {
    // Varyant olmak veriden okunuyor, `unlocks` kenarlarindan cikarilmiyor.
    // Cikarimla, birbirini acan iki liste ikisi de varyant sayilip butun
    // zorunluluk kurallari sessizce kapaniyordu.
    const cyclic = {
      a: {
        key: 'a',
        multiSelect: true,
        maxSelection: 1,
        required: true,
        options: [{ id: 'a1', unlocks: 'b' }],
      },
      b: {
        key: 'b',
        multiSelect: true,
        maxSelection: 1,
        required: true,
        options: [{ id: 'b1', unlocks: 'a' }],
      },
    };

    const bare = { birth_date: complete.birth_date, photos };
    expect(completionProblems(user(bare), cyclic, today)).toEqual({
      a: 'required',
      b: 'required',
    });
  });

  it('varyantin etiketi baska bir listenin cevabi sayilmiyor', () => {
    // Bir varyant acildiginda oradan gelen kimlikler her liste icin gecerli
    // sayiliyordu: "Kutu oyunlari" gecerli bir cinsiyet cevabi oluyor ve
    // zorunlu kapilar boyle geciliyordu.
    const crossed = {
      ...complete,
      gender: 'board_games',
      intent: ['friendship'],
    };

    expect(completionProblems(user(crossed), groups, today).gender).toBe('required');
  });

  it('bos kimlikli veya adressiz fotograf sayilmiyor', () => {
    const blank = {
      ...complete,
      photos: [
        { id: '', url: '' },
        { id: ' ', url: ' ' },
      ],
    };
    expect(completionProblems(user(blank), groups, today).photos).toBe('required');
  });

  it('ayni fotograf iki kez gonderilse de bir taniyor', () => {
    const twice = { ...complete, photos: [photos[0], photos[0]] };
    expect(completionProblems(user(twice), groups, today).photos).toBe('required');
  });

  it('sinir alani gelmezse sinir uydurulmuyor', () => {
    // Sozlesme `maxSelection`i zorunlu ve nullable tanimliyor, yani alanin
    // hic gelmemesi sozlesme disi bir bicim. Kapi o durumda bir sinir
    // uydurmuyor: uydurulacak dogru sayi yok. Sinirin gercekten
    // uygulandigi durum bir ustteki testte.
    const { maxSelection: _omitted, ...loose } = groups.audience;
    const missing = { ...groups, audience: loose };
    const many = { ...complete, audience: ['women', 'men'] };

    expect(completionProblems(user(many), missing, today)).toEqual({});
  });

  it('kendini gosteren bir varyant baglantisi soruyu zorunsuz yapmiyor', () => {
    // Varyant olmak denetimden dusmek demek, yani yanlis yazilmis bir
    // baglanti kapiyi acik yonde bozardi.
    const broken = { ...groups, gender: { ...groups.gender, variantOf: 'gender' } };
    const bare = { ...complete, gender: undefined };

    expect(completionProblems(user(bare), broken, today).gender).toBe('required');
  });

  it('olmayan bir listeyi gosteren varyant baglantisi yok sayiliyor', () => {
    const broken = { ...groups, gender: { ...groups.gender, variantOf: 'nope' } };
    const bare = { ...complete, gender: undefined };

    expect(completionProblems(user(bare), broken, today).gender).toBe('required');
  });

  it('karsilikli varyant baglantisi iki soruyu birden dusurmuyor', () => {
    const mutual = {
      x: {
        key: 'x',
        variantOf: 'y',
        multiSelect: true,
        maxSelection: 1,
        required: true,
        options: [{ id: 'x1' }],
      },
      y: {
        key: 'y',
        variantOf: 'x',
        multiSelect: true,
        maxSelection: 1,
        required: true,
        options: [{ id: 'y1' }],
      },
    };

    const bare = { birth_date: complete.birth_date, photos };
    expect(completionProblems(user(bare), mutual, today)).toEqual({
      x: 'required',
      y: 'required',
    });
  });

  it('acilmamis bir liste zorunlu sayilmiyor', () => {
    const required = {
      ...groups,
      interests_friendship: { ...groups.interests_friendship, required: true },
    };

    expect(completionProblems(user(complete), required, today)).toEqual({});
  });
});
