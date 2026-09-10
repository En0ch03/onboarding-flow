import { strings } from '@/constants/strings';

import { credentialsFormSchema, registerFormSchema } from './credentialsForm';

const filled = {
  email: 'deniz@ornek.com',
  password: 'agirates2026',
  confirmPassword: 'agirates2026',
};

describe('kayit formu', () => {
  it('iki sifre ayni oldugunda gecerli', () => {
    expect(registerFormSchema.safeParse(filled).success).toBe(true);
  });

  it('eslesmeyen sifreyi ikinci alanin altina dusuruyor', () => {
    // Hata forma degil alana yaziliyor: kullanici hangi kutuya bakacagini
    // aramadan goruyor.
    const result = registerFormSchema.safeParse({ ...filled, confirmPassword: 'agirates2027' });

    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((each) => each.path.join('.') === 'confirmPassword');
    expect(issue?.message).toBe(strings.auth.passwordMismatch);
  });

  it('bos birakilan dogrulama alani da eslesmiyor sayiliyor', () => {
    const result = registerFormSchema.safeParse({ ...filled, confirmPassword: '' });
    expect(result.success).toBe(false);
  });
});

describe('giris formu', () => {
  it('dogrulama alani istemiyor', () => {
    // Giris kayitli sifreyi soruyor; ikinci kez yazdirmak, hatirlayan
    // kullaniciya bir is daha yuklemek olurdu.
    expect(
      credentialsFormSchema.safeParse({ email: filled.email, password: filled.password }),
    ).toMatchObject({ success: true });
  });

  it('fazladan gelen dogrulama alanini disarida birakiyor', () => {
    const result = credentialsFormSchema.parse(filled);
    expect(result).toEqual({ email: filled.email, password: filled.password });
  });
});
