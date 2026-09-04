'use strict';

const { completionProblems } = require('./completion');

/**
 * Kapinin kendisi burada sinaniyor. Istemci tarafinda ayni kurallarin bir
 * kopyasi var ama o bir nezaket; bu testler kapinin sunucuda gercekten
 * kapali oldugunu gosteriyor.
 */

const groups = {
  gender: {
    key: 'gender',
    required: true,
    options: [{ id: 'woman' }, { id: 'man' }],
  },
  audience: {
    key: 'audience',
    required: true,
    options: [{ id: 'women' }, { id: 'men' }],
  },
  interests: {
    key: 'interests',
    required: false,
    options: [{ id: 'books' }],
  },
};

const today = new Date(2026, 8, 4);

function user(preferences) {
  return { display_name: 'Deniz', preferences };
}

const complete = {
  birth_date: { day: '14', month: '3', year: '1996' },
  gender: 'woman',
  audience: ['women'],
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
});
