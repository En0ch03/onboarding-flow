import { fieldErrorMessage } from './errorMessages';

/**
 * Alan adi ve sebep kodu sunucudan geliyor. Tamamlanma reddi bu yuzeyi
 * genisletti: sunucu artik kendi alan adlariyla konusuyor ve o adlar
 * dogrudan bu sozluklere gidiyor.
 */
describe('fieldErrorMessage', () => {
  it('bildigi alani kendi cumlesiyle anlatiyor', () => {
    expect(fieldErrorMessage('photos', 'required')).toBe('Fotoğraflar boş bırakılamaz.');
  });

  it('alanin kendi kurali genel mesaji eziyor', () => {
    expect(fieldErrorMessage('password', 'too_short')).toContain('8 karakter');
  });

  it('tanimadigi alanda da anlamli konusuyor', () => {
    expect(fieldErrorMessage('mystery', 'required')).toBe('Bu alan boş bırakılamaz.');
  });

  it('kalitilan bir anahtar ekrana ic JS metni tasimiyor', () => {
    // `fieldLabels['constructor']` duz indekslemede `function Object() {
    // [native code] }` donuyordu; sebep tarafinda ise metin degil fonksiyon
    // donup React cocugu olarak gecersiz bir deger uretiyordu.
    for (const key of ['constructor', 'toString', 'valueOf', '__proto__']) {
      const byField = fieldErrorMessage(key, 'required');
      const byCode = fieldErrorMessage('email', key);

      expect(typeof byField).toBe('string');
      expect(typeof byCode).toBe('string');
      expect(byField).not.toContain('native code');
      expect(byCode).not.toContain('native code');
    }
  });
});
