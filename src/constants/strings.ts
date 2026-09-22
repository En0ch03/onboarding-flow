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
    // Sayisal klavyenin kendi bitirme tusu yok; serit onun yerine geciyor.
    dismissKeyboard: 'Bitti',
  },

  // Acilis ekrani: kullanicinin gordugu ilk metin. Ilk satir selam veriyor,
  // altindaki iki satir bekletmenin sebebini soyluyor.
  launch: {
    title: 'Hoş geldin',
    status: 'Hazırlanıyor',
    hint: 'Senin için her şeyi yoluna koyuyoruz.',
  },

  welcome: {
    promiseTitle: 'Doğru zamanda doğru yerde.',
    promiseSubtitle: 'O karşılaşmayı şansa bırakmamak için.',
    promisePrimary: 'Başlayalım',
    promiseSecondary: 'Zaten hesabım var',

    differenceTitleFirst: 'Belki de birbirinizi aramıyordunuz.',
    differenceTitleSecond: 'Sadece henüz karşılaşmamıştınız.',
    differenceSubtitle:
      'Her gün yalnızca birkaç kişi. Her biri ne aradığını söylemiş. Gerisi sana kalmış.',
    differencePrimary: 'Devam',
  },

  auth: {
    // Bu iki cumle hem alan dogrulamasinda hem sunucu 422'sinde gerekiyor.
    // Iki yere yazilirsa biri degisip digeri kalir; sifre cumlesindeki sayi
    // da sinirin kendisinden geliyor.
    emailInvalid: 'Bu e-posta adresi geçerli görünmüyor. Yazımını kontrol eder misin?',
    passwordTooShort: (length: number) => `Şifren çok kısa. En az ${length} karakter olmalı.`,
    registerTitle: 'Hesabını oluştur',
    registerSubtitle: 'Bir e-posta ve bir şifre yeter. E-postan profilinde görünmez.',
    registerSubmit: 'Hesap oluştur',

    loginTitle: 'Tekrar hoş geldin',
    loginSubtitle: 'Giriş yap, kaldığın yerden devam et.',
    loginSubmit: 'Giriş yap',

    emailLabel: 'E-posta',
    passwordLabel: 'Şifre',
    confirmPasswordLabel: 'Şifreyi doğrula',
    // Cumle hangi alanin yanlis oldugunu iddia etmiyor: kullanici hangisini
    // duzeltecegini kendi biliyor, biz bilmiyoruz.
    passwordMismatch: 'Şifreler birbiriyle aynı değil.',
    showPassword: 'Şifreyi göster',
    hidePassword: 'Şifreyi gizle',

    legal: 'Devam ederek Kullanım Şartları’nı ve Gizlilik Politikası’nı kabul etmiş olursun.',
  },

  photoSlot: {
    cover: 'Kapak fotoğrafı',
    filled: 'Fotoğraf',
    failed: 'Yüklenemeyen fotoğraf, tekrar dene',
    empty: 'Fotoğraf ekle',
    uploading: 'Fotoğraf yükleniyor',
    locked: 'Sırası gelmemiş fotoğraf kutusu',
    remove: 'Fotoğrafı kaldır',
  },

  selection: {
    blockedHint: 'Sınır dolu. Önce seçtiklerinden birini bırak.',
  },

  photoSource: {
    title: 'Fotoğrafı nereden alalım?',
    camera: 'Kamerayla çek',
    library: 'Galeriden seç',
  },

  steps: {
    phoneTitle: 'Telefon numaran',
    phoneSubtitle: 'Yalnızca hesabını korumak için. Profilinde görünmez.',
    phoneLabel: 'Cep telefonu',
    /** Alanda sabit duran ülke kodu; kullanıcı yazmıyor. */
    phonePrefix: '+90',
    phonePlaceholder: '5XX XXX XX XX',

    identityTitle: 'Sana nasıl seslenelim?',
    identitySubtitle: 'Adın profilinde görünür. Doğum tarihinden yalnızca yaşın görünür.',
    nameLabel: 'Adın',
    birthDateLabel: 'Doğum tarihin',
    dayLabel: 'Gün',
    monthLabel: 'Ay',
    yearLabel: 'Yıl',
    identityHint: 'Devam etmek için adını yazman ve doğum tarihini seçmen gerekiyor.',
    identityNameHint: 'Devam etmek için adını yazman gerekiyor.',
    identityDateHint: 'Devam etmek için doğum tarihini seçmen gerekiyor.',

    audienceTitle: 'Kimi görmek istersin?',
    audienceSubtitle: 'İkisini de sonra değiştirebilirsin.',
    genderLabel: 'Cinsiyetin',
    genderHelp: 'Bir tane seç.',
    audienceLabel: 'Kimleri göstereyim',
    audienceHelp: 'Birden fazla seçebilirsin.',
    audienceSkipCost: 'Bu iki cevap olmadan sana kimseyi gösteremeyiz.',
    audienceHint:
      'İki soruyu da yanıtlaman gerekiyor: kendini nasıl tanımladığın ve kimlere görünmek istediğin.',

    intentTitle: 'Ne arıyorsun?',
    intentSubtitle: 'Dürüst ol. Önerilerin buna göre gelir.',
    intentHint: 'En az bir seçenek işaretlemen gerekiyor.',
    intentSkipCost: 'Ne aradığını yazmayan profiller çok daha az yanıt alıyor.',

    photosTitle: 'Fotoğraflarını ekle',
    photosSubtitle: 'En az iki fotoğraf. İlki kapak olur; yüzünün net göründüğü bir tane seç.',
    photosCover: 'Kapak',
    photosHint: 'Devam etmek için en az iki fotoğraf gerekiyor.',
    photosSkipCost: 'Fotoğrafsız profiller çok daha az görüntüleniyor.',
    // Kutunun ustundeki "Tekrar dene" neyin olmadigini soylemiyor; bu satir
    // hem nedeni hem cikis yolunu soyluyor.
    photosUploadFailed: 'Fotoğraf yüklenemedi. Kutuya dokunup tekrar deneyebilirsin.',

    interestsTitle: 'Neye vakit ayırıyorsun?',
    interestsSubtitle: 'Ortak noktalar sohbeti başlatır.',
    interestsSkipCost: 'Ortak ilgi alanı, ilk mesajı yazmayı kolaylaştırıyor.',
    interestsHint: 'En az bir ilgi alanı seçmen gerekiyor.',
  },

  phone: {
    // Hic yazmamis kullanici ile yarim birakmis kullanici ayni cumleyi
    // almiyor: birine ne yapacagi soyleniyor, digerine neyin eksik oldugu.
    // Tek cumle ikisine de yaziliyordu ve bos alana bakan birine "on hane"
    // demek, henuz sormadigi bir soruya cevap vermek oluyordu.
    empty: 'Devam etmek için telefon numaranı yaz.',
    partial: 'Numara eksik görünüyor. 5 ile başlayan on hane olmalı.',
    // Eksik ile yanlis ayri konusuyor. Yazmaya devam eden birine "gecersiz"
    // demek, henuz yapmadigi bir hatayi yuzune vurmak olurdu.
    invalid: 'Bu numara doğru görünmüyor. Cep numaraları 5 ile başlar ve on hanedir.',
  },

  birthDate: {
    // Carkin altindaki onay. Cark cevrilirken deger surekli degisiyor; onaysiz
    // her donusu cevap saymak, kullanicinin ustunden gectigi tarihi kaydederdi.
    confirm: 'Seç',
    incomplete: 'Doğum tarihini seçmen gerekiyor.',
    invalid: 'Böyle bir tarih yok. Gün, ay ve yılı kontrol eder misin?',
    tooYoung: 'Bu uygulama {age} yaşından küçüklere açık değil. Seni burada göremeyeceğiz.',
    // Sunucu tarihi reddettiginde sebebi tek kelimeyle bildiriyor ve o kelime
    // hem bozuk bir tarihi hem yas sinirini karsilayabiliyor. Cumle ikisini de
    // dogru anlatiyor; kullaniciyi olmayan bir hataya bakmaya gondermiyor.
    rejected: (age: number) =>
      `Doğum tarihini kabul edemedik. Tarihi kontrol eder misin? Bu uygulama ${age} yaşından küçüklere açık değil.`,
  },

  errors: {
    optionsUnavailableTitle: 'Seçenekleri getiremedik',
    optionsUnavailableBody: 'Sunucuya ulaşamadık. Bağlantını kontrol edip tekrar dene.',
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
    title: 'Ana sayfa',
    subtitle: 'İlk önerilerin yarın sabah burada.',
    signOut: 'Çıkış yap',
  },

  completion: {
    subtitle: 'Profilin hazır. İlk önerilerin yarın sabah burada.',
    recapAudience: 'Kimler görecek',
    recapIntent: 'Ne aradığın',
    recapEmpty: 'Belirtmedin',
    recapPhone: 'Telefon',
    recapPhotos: 'Fotoğraf',
    recapInterests: 'İlgi alanları',
    primary: 'Uygulamaya gir',
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
  // Sifir dolgulu iki hane: sayac adim degistikce genislik degistirirse ust
  // serit her ekranda biraz kayiyor.
  return `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
}

/** Ayni sayacin ekran okuyucuya soylenen hali; bolu isareti okunmuyor. */
export function stepCounterLabel(current: number, total: number): string {
  return `${total} adımdan ${current}.`;
}

/** Secim siniri ve o an secili sayi tek satirda. */
export function selectionLimit(max: number, selected: number): string {
  return `En fazla ${max} seçebilirsin · ${selected} seçili`;
}

/** Sinira carpan dokunusun cevabi: ne oldu ve ne yapilir. */
export function selectionLimitReached(max: number): string {
  return `En fazla ${max} seçebilirsin. Yeni bir tane için önce birini bırak.`;
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
 * Ozet satirindaki telefon numarasi.
 *
 * Ulke kodu burada yeniden ekleniyor: saklanan deger on hane ve kullanici
 * numarasini `+90` ile taniyor. Numara yoksa satir bos bir tire yerine
 * "Belirtmedin" diyor.
 */
export function phoneSummary(digits: string | undefined): string {
  const value = (digits ?? '').trim();
  return value === '' ? strings.completion.recapEmpty : `${strings.steps.phonePrefix} ${value}`;
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

/**
 * Kapanis cumlesi. Isim yalin birakiliyor; ek getirilmiyor.
 *
 * Kirpiliyor cunku isim buraya iki yoldan gelebiliyor: kullanicinin yazdigi
 * taslak ve sunucudaki profil. Mobil klavyeler kelime sonuna bosluk ekliyor
 * ve akisin son ekranindaki tek kisisel cumle "Hazirsin, Ayse ." oluyordu.
 */
export function completionTitle(name: string): string {
  return `Hazırsın, ${name.trim()}.`;
}
