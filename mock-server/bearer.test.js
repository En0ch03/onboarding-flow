'use strict';

const { requireBearer } = require('./bearer');

/**
 * Bu kapinin verdigi soz dar ve acik: token'in gecerliligini aramiyor ama
 * varligini ariyor. Sozun kendisi kolayca kaybolabilir -- tek satirlik bir
 * kontrol, silindiginde hicbir sey gorunur bicimde bozulmaz. Testi burada.
 */
function fakeExchange(authorization) {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  const req = {
    get: (name) => (name.toLowerCase() === 'authorization' ? authorization : undefined),
  };
  let passed = false;

  requireBearer(req, res, () => {
    passed = true;
  });

  return { passed, res };
}

describe('requireBearer', () => {
  it('lets through a token it cannot verify, because another server issued it', () => {
    const { passed, res } = fakeExchange(
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.baska-sunucudan',
    );

    expect(passed).toBe(true);
    expect(res.statusCode).toBeNull();
  });

  it('still refuses a request that carries no token at all', () => {
    const { passed, res } = fakeExchange(undefined);

    expect(passed).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'token_expired' });
  });

  it('refuses a header that is not a bearer scheme', () => {
    const { passed, res } = fakeExchange('Basic a2VyZW06c2lmcmU=');

    expect(passed).toBe(false);
    expect(res.statusCode).toBe(401);
  });
});
