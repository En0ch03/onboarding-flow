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
  },

  welcome: {
    promiseTitle: 'Doğru zamanda doğru yerde.',
    promiseSubtitle: 'O karşılaşmayı şansa bırakmamak için.',
    promisePrimary: 'Başlayalım',
    promiseSecondary: 'Zaten hesabım var',

    differenceTitle: 'Belki de birbirinizi aramıyordunuz. Sadece henüz karşılaşmamıştınız.',
    differenceSubtitle:
      'Onboarding’da günde birkaç kişi görürsün. Herkes ne aradığını yazmıştır. Gerisi size kalmış.',
    differencePrimary: 'Anladım, devam',
  },

  auth: {
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
    forgotPassword: 'Şifremi sıfırla',

    legal: 'Devam ederek Kullanım Şartları’nı ve Gizlilik Politikası’nı kabul etmiş olursun.',
  },

  steps: {
    identityTitle: 'Sana nasıl hitap edelim?',
    identitySubtitle: 'Adın profilinde görünür. Doğum tarihin görünmez, yalnızca yaşın görünür.',
    nameLabel: 'Ad',
    birthDateLabel: 'Doğum tarihi',
    dayLabel: 'Gün',
    monthLabel: 'Ay',
    yearLabel: 'Yıl',
    identityHint: 'Devam etmek için adını ve doğum tarihini yazman gerekiyor.',
    identityNameHint: 'Devam etmek için adını yazman gerekiyor.',
    identityDateHint: 'Devam etmek için doğum tarihini yazman gerekiyor.',

    audienceTitle: 'Kimlere görünmek istersin?',
    audienceSubtitle:
      'Bu iki cevap eşleşme havuzunu belirliyor. İstediğin zaman değiştirebilirsin.',
    genderLabel: 'Ben',
    audienceLabel: 'Beni görsün',
    audienceHint:
      'İki soruyu da yanıtlaman gerekiyor: kendini nasıl tanımladığın ve kimlere görünmek istediğin.',

    intentTitle: 'Ne arıyorsun?',
    intentSubtitle: 'Bu cevap profilinde görünür ve kimleri göreceğini etkiler.',
    intentHint: 'En az bir seçenek işaretlemen gerekiyor.',

    photosTitle: 'Birkaç fotoğraf ekle',
    photosSubtitle:
      'En az iki tane. İlk fotoğraf kapak olur, yüzünün göründüğü bir kare iyi çalışıyor.',
    photosCover: 'Kapak',
    photosHint: 'Devam etmek için en az iki fotoğraf gerekiyor.',
    photosReorderHint: 'sürükleyerek sıralayabilirsin',
    photosSkipCost: 'Fotoğrafsız profiller çok daha az görüntüleniyor.',

    interestsTitle: 'Neye vakit ayırırsın?',
    interestsSubtitle: 'Birkaç tane seç. Sohbet başlatmayı kolaylaştırıyor.',
    interestsSkipCost: 'Ortak ilgi alanı, ilk mesajı yazmayı kolaylaştırıyor.',
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
    cancel: 'Vazgeç',
    openSettings: 'Ayarları aç',
  },

  home: {
    title: 'Onboarding',
    subtitle: 'İlk önerilerin yarın sabah burada olacak.',
  },

  completion: {
    subtitle: 'Profilin yayında. İlk önerilerin yarın sabah burada olacak. Acelesi yok.',
    recapIntent: 'Ne aradığın',
    recapEmpty: 'Belirtmedin',
    recapPhotos: 'Fotoğraf',
    recapInterests: 'İlgi alanları',
    primary: 'Onboarding’a gir',
    secondary: 'Profilimi düzenle',
  },
} as const;

/** Adim sayaci. Yuzde degil sayac: akisla birebir ve dogruyu soyluyor. */
export function stepCounter(current: number, total: number): string {
  return `${current} / ${total}`;
}

/** Secim siniri ve o an secili sayi tek satirda. */
export function selectionLimit(max: number, selected: number): string {
  return `En fazla ${max} seçebilirsin · ${selected} seçili`;
}

/** Fotograf sayaci. */
export function photoCount(added: number, total: number): string {
  return `${added} / ${total} eklendi`;
}

/** Kapanis cumlesi. Isim yalin birakiliyor; ek getirilmiyor. */
export function completionTitle(name: string): string {
  return `Hazırsın, ${name}.`;
}
