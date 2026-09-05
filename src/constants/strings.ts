/**
 * Kullanicinin gordugu her metin burada. Ekran dosyalarinda yazili metin bulunmaz.
 *
 * Turkce metin yazarken isme veya kullanicinin sectigi bir degere ek getirilmez.
 * Unlu uyumu ve kesme isareti isimden isime degisiyor; `{ad}'in profili` kalibi
 * bir isimde dogru, digerinde bozuk. Dogru kalip ismi yalin birakir.
 */
export const strings = {
  common: {
    continue: 'Devam',
    back: 'Geri',
    skip: 'Geç',
    skipForNow: 'Şimdilik geç',
    retry: 'Tekrar dene',
    finish: 'Bitir',
    close: 'Kapat',
  },

  welcome: {
    promiseTitle: 'Doğru zamanda doğru yerde.',
    promiseSubtitle: 'O karşılaşmayı şansa bırakmamak için.',
    promisePrimary: 'Başlayalım',
    promiseSecondary: 'Zaten hesabım var',

    differenceTitleFirst: 'Belki de birbirinizi aramıyordunuz.',
    differenceTitleSecond: 'Sadece henüz karşılaşmamıştınız.',
    differenceSubtitle:
      'Onboarding’da günde birkaç kişi görürsün. Herkes ne aradığını yazmıştır. Gerisi size kalmış.',
    differencePrimary: 'Anladım, devam',
  },

  auth: {
    // Bu iki cumle hem alan dogrulamasinda hem sunucu 422'sinde gerekiyor.
    // Iki yere yazilirsa biri degisip digeri kalir; sifre cumlesindeki sayi
    // da sinirin kendisinden geliyor.
    emailInvalid: 'Bu e-posta adresi geçerli görünmüyor. Yazımını kontrol eder misin?',
    passwordTooShort: (length: number) => `Şifren çok kısa. En az ${length} karakter olmalı.`,
    registerTitle: 'Hesabını oluşturalım',
    registerSubtitle: 'E-postanı yalnızca giriş için kullanıyoruz. Profilinde görünmez.',
    registerSubmit: 'Hesap oluştur',

    loginTitle: 'Tekrar hoş geldin',
    loginSubtitle: 'Kaldığın yerden devam edelim.',
    loginSubmit: 'Giriş yap',

    emailLabel: 'E-posta',
    passwordLabel: 'Şifre',
    showPassword: 'Şifreyi göster',
    hidePassword: 'Şifreyi gizle',

    legal: 'Devam ederek Kullanım Şartları’nı ve Gizlilik Politikası’nı kabul etmiş olursun.',
  },

  photoSlot: {
    cover: 'Kapak fotoğrafı',
    filled: 'Fotoğraf',
    failed: 'Yüklenemeyen fotoğraf, tekrar dene',
    empty: 'Fotoğraf ekle',
    locked: 'Sırası gelmemiş fotoğraf kutusu',
    remove: 'Fotoğrafı kaldır',
  },

  photoSource: {
    title: 'Fotoğrafı nereden alalım?',
    camera: 'Kamerayla çek',
    library: 'Galeriden seç',
  },

  steps: {
    identityTitle: 'Sana nasıl hitap edelim?',
    identitySubtitle: 'Adın profilinde görünür. Doğum tarihin görünmez, yalnızca yaşın görünür.',
    nameLabel: 'Ad',
    birthDateLabel: 'Doğum tarihi',
    dayLabel: 'Gün',
    monthLabel: 'Ay',
    yearLabel: 'Yıl',
    identityHint: 'Devam etmek için adını yazman ve doğum tarihini seçmen gerekiyor.',
    identityNameHint: 'Devam etmek için adını yazman gerekiyor.',
    identityDateHint: 'Devam etmek için doğum tarihini seçmen gerekiyor.',

    audienceTitle: 'Kimlere görünmek istersin?',
    audienceSubtitle:
      'Bu iki cevap eşleşme havuzunu belirliyor. İstediğin zaman değiştirebilirsin.',
    genderLabel: 'Ben',
    genderHelp: 'Profilinde görünür. Bir tane seç.',
    audienceLabel: 'Beni görsün',
    audienceHelp: 'Birden fazla seçebilirsin.',
    audienceSkipCost: 'Bu iki cevap olmadan sana kimseyi gösteremeyiz.',
    audienceHint:
      'İki soruyu da yanıtlaman gerekiyor: kendini nasıl tanımladığın ve kimlere görünmek istediğin.',

    intentTitle: 'Ne arıyorsun?',
    intentSubtitle: 'Bu cevap profilinde görünür ve kimleri göreceğini etkiler.',
    intentHint: 'En az bir seçenek işaretlemen gerekiyor.',
    intentSkipCost: 'Ne aradığını yazmayan profiller çok daha az yanıt alıyor.',

    photosTitle: 'Birkaç fotoğraf ekle',
    photosSubtitle:
      'En az iki tane. İlk fotoğraf kapak olur. Yüzünün göründüğü bir kare iyi çalışıyor.',
    photosCover: 'Kapak',
    photosHint: 'Devam etmek için en az iki fotoğraf gerekiyor.',
    photosSkipCost: 'Fotoğrafsız profiller çok daha az görüntüleniyor.',

    interestsTitle: 'Neye vakit ayırırsın?',
    interestsSubtitle: 'Birkaç tane seç. Sohbet başlatmayı kolaylaştırıyor.',
    interestsSkipCost: 'Ortak ilgi alanı, ilk mesajı yazmayı kolaylaştırıyor.',
    interestsHint: 'En az bir ilgi alanı seçmen gerekiyor.',
  },

  birthDate: {
    incomplete: 'Doğum tarihini seçmen gerekiyor.',
    invalid: 'Böyle bir tarih yok. Gün, ay ve yılı kontrol eder misin?',
    tooYoung: 'Bu uygulama {age} yaşından küçüklere açık değil. Seni burada göremeyeceğiz.',
  },

  errors: {
    optionsUnavailableTitle: 'Seçenekleri getiremedik',
    optionsUnavailableBody:
      'Sunucuya ulaşamadığımız için bu adımın seçeneklerini gösteremiyoruz. Bağlantını kontrol edip tekrar dene.',
  },

  exitFlow: {
    title: 'Akıştan çıkılsın mı?',
    body: 'Cevapların kayıtlı; geri döndüğünde kaldığın yerden devam edersin.',
    stay: 'Devam edeyim',
    leave: 'Çık',
  },

  photoPermission: {
    title: 'Galeriye erişemiyoruz',
    body: 'Fotoğraf ekleyebilmek için galeri iznini açman gerekiyor.',
    cameraTitle: 'Kameraya erişemiyoruz',
    cameraBody: 'Fotoğraf çekebilmek için kamera iznini açman gerekiyor.',
    cancel: 'Vazgeç',
    openSettings: 'Ayarları aç',
  },

  home: {
    title: 'Onboarding',
    subtitle: 'İlk önerilerin yarın sabah burada olacak.',
  },

  completion: {
    subtitle: 'Profilin yayında. İlk önerilerin yarın sabah burada olacak. Acelesi yok.',
    recapAudience: 'Kimler görecek',
    recapIntent: 'Ne aradığın',
    recapEmpty: 'Belirtmedin',
    recapPhotos: 'Fotoğraf',
    recapInterests: 'İlgi alanları',
    primary: 'Onboarding’a gir',
    secondary: 'Profilimi düzenle',
    // Sunucu profili eksik buldugunda: sebep degil cikis yolu soyleniyor,
    // cunku eksigin ne oldugunu adimin kendisi zaten gosterecek.
    incomplete: 'Profilinde tamamlanmamış bir soru kalmış. Cevaplara dönüp bitirelim.',
    incompleteAction: 'Cevaplara dön',
  },
} as const;

/** Ay adlari. Cark ayi numarayla gostermiyor: "3" ile "Mart" ayni sey degil. */
export const monthNames = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
] as const;

/** Adim sayaci. Yuzde degil sayac: akisla birebir ve dogruyu soyluyor. */
export function stepCounter(current: number, total: number): string {
  return `${current} / ${total}`;
}

/** Ayni sayacin ekran okuyucuya soylenen hali; bolu isareti okunmuyor. */
export function stepCounterLabel(current: number, total: number): string {
  return `${total} adımdan ${current}.`;
}

/** Secim siniri ve o an secili sayi tek satirda. */
export function selectionLimit(max: number, selected: number): string {
  return `En fazla ${max} seçebilirsin · ${selected} seçili`;
}

/** Fotograf sayaci. */
export function photoCount(added: number, total: number): string {
  return `${added} / ${total} eklendi`;
}

/** Ozet satirinda fotograf sayisi. Cıplak bir rakam ne oldugunu soylemiyor. */
export function photoSummary(count: number): string {
  return count === 1 ? '1 fotoğraf' : `${count} fotoğraf`;
}

/**
 * Ozet basligindaki ad ve yas. Yas, kullanicinin profilde gorunecek olan
 * tek sayi; dogum tarihi gorunmuyor.
 */
export function nameWithAge(name: string, age: number | null): string {
  const trimmed = name.trim();
  // Ad yoksa satir yasin tek basina durdugu bozuk bir hale dusmuyor.
  if (trimmed === '') return '';
  return age === null ? trimmed : `${trimmed}, ${age}`;
}

/** Kapanis cumlesi. Isim yalin birakiliyor; ek getirilmiyor. */
export function completionTitle(name: string): string {
  return `Hazırsın, ${name}.`;
}
