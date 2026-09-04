import type { ApiError, ApiErrorKind } from '@/api/errors';

/**
 * Her hata turunun insan dilindeki karsiligi ve cikis yolu.
 *
 * Bir hata bir cikmaz olmamali: mesaj neyin yanlis gittigini soyler ve yaninda
 * kullanicinin atabilecegi bir adim durur. Ham sunucu metni, durum kodu veya
 * teknik terim hicbir zaman ekrana ulasmaz.
 */
type ErrorPresentation = {
  /** Kullaniciya gosterilen metin. */
  message: string;
  /** Cikis yolunun etiketi; yoksa mesaj tek basina yeterlidir. */
  action: string | null;
};

const presentations: Record<ApiErrorKind, ErrorPresentation> = {
  email_taken: {
    message: 'Bu e-posta ile açılmış bir hesap var.',
    action: 'Bu e-postayla giriş yap',
  },
  validation_failed: {
    message: 'Birkaç alanı gözden geçirmen gerekiyor.',
    action: null,
  },
  invalid_credentials: {
    message: 'E-posta veya şifre eşleşmedi. Bir daha dener misin?',
    action: 'Şifremi sıfırla',
  },
  refresh_expired: {
    message:
      'Oturumun sona erdi. Girdiğin cevaplar duruyor; giriş yapınca kaldığın yerden devam edeceksin.',
    action: 'Giriş yap',
  },
  server_error: {
    message: 'Bizim tarafta bir şeyler ters gitti. Cevapların kayıtlı.',
    action: 'Tekrar dene',
  },
  network: {
    message: 'Sunucuya ulaşamadık. Bağlantını kontrol edip tekrar dene — yazdıkların duruyor.',
    action: 'Tekrar dene',
  },
  // Sozlesme sapmasi kullaniciyi ilgilendirmiyor; onun icin sunucu hatasindan
  // farksiz. Ayrimin degeri gelistirme tarafinda.
  unexpected_response: {
    message: 'Bizim tarafta bir şeyler ters gitti. Cevapların kayıtlı.',
    action: 'Tekrar dene',
  },
};

export function presentError(error: ApiError): ErrorPresentation {
  return presentations[error.kind];
}

/** Sunucunun bildigi alan adlari; bilinmeyen alan adi oldugu gibi kullanilmaz. */
const fieldLabels: Record<string, string> = {
  email: 'E-posta',
  password: 'Şifre',
  display_name: 'Ad',
  avatar_url: 'Fotoğraf',
  preferences: 'Tercihler',
  file: 'Dosya',
};

/**
 * Alan bazli dogrulama mesajlari. Sozlesme 422 icin tam bir kod sozlugu
 * vermiyor, o yuzden bilinmeyen kod alan adiyla birlikte genel bir mesaja
 * duser: kullanici hangi alani duzeltecegini yine de bilir.
 */
const fieldReasons: Record<string, (label: string) => string> = {
  too_short: (label) => `${label} çok kısa.`,
  too_long: (label) => `${label} çok uzun.`,
  invalid: (label) => `${label} geçerli görünmüyor.`,
  required: (label) => `${label} boş bırakılamaz.`,
  taken: (label) => `${label} zaten kullanılıyor.`,
};

/**
 * Bir alanin kendi kurali varsa genel mesaji ezer: "çok kısa" tek basina
 * kullaniciya ne yapacagini soylemiyor, sinir soyluyor.
 */
const specificMessages: Record<string, string> = {
  'password:too_short': 'Şifren çok kısa. En az 8 karakter olmalı.',
  'email:invalid': 'Bu e-posta adresi geçerli görünmüyor. Yazımını kontrol eder misin?',
};

export function fieldErrorMessage(field: string, code: string): string {
  const specific = specificMessages[`${field}:${code}`];
  if (specific) return specific;

  const label = fieldLabels[field] ?? 'Bu alan';
  const reason = fieldReasons[code];
  return reason ? reason(label) : `${label} kabul edilmedi. Gözden geçirir misin?`;
}
