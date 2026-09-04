'use strict';

/**
 * Kullaniciya sunulan secenek listeleri.
 *
 * Bu uc nokta sozlesmede yok; talep edildi ve cevap gelene kadar buradan
 * servis ediliyor. Listeler burada duruyor cunku bu taksonomiler bolgeye ve
 * hukuki cerceveye gore degisiyor; istemciye gomulmus bir liste, her
 * degisiklikte yeni bir uygulama surumu ve magaza onayi demek olurdu.
 *
 * `required` ve `maxSelection` gibi kurallarin da buradan gelmesi bilincli:
 * bir sorunun zorunlu olup olmadigi da bir urun karari.
 *
 * Bir etiketi degistirip sunucuyu yeniden baslatmak, uygulamada tek satir
 * degisiklik olmadan yeni etiketi gostermeye yeter.
 */

const optionGroups = {
  gender: {
    key: 'gender',
    multiSelect: false,
    maxSelection: null,
    required: true,
    options: [
      { id: 'woman', label: 'Kadınım', order: 1 },
      { id: 'man', label: 'Erkeğim', order: 2 },
      { id: 'nonbinary', label: 'Başka bir şekilde tanımlıyorum', order: 3 },
    ],
  },

  audience: {
    key: 'audience',
    multiSelect: true,
    maxSelection: 3,
    required: true,
    options: [
      { id: 'women', label: 'Kadınlar', order: 1 },
      { id: 'men', label: 'Erkekler', order: 2 },
      { id: 'everyone', label: 'Herkes', order: 3 },
    ],
  },

  orientation: {
    key: 'orientation',
    multiSelect: true,
    maxSelection: 2,
    required: false,
    options: [
      { id: 'straight', label: 'Heteroseksüel', order: 1 },
      { id: 'gay', label: 'Eşcinsel', order: 2 },
      { id: 'bisexual', label: 'Biseksüel', order: 3 },
      { id: 'pansexual', label: 'Panseksüel', order: 4 },
      { id: 'asexual', label: 'Aseksüel', order: 5 },
      { id: 'questioning', label: 'Henüz tanımlamadım', order: 6 },
    ],
  },

  intent: {
    key: 'intent',
    multiSelect: true,
    maxSelection: 2,
    required: true,
    options: [
      {
        id: 'long_term',
        label: 'Uzun soluklu bir ilişki',
        hint: 'Ciddi, zaman tanıyan',
        order: 1,
      },
      {
        id: 'long_term_open',
        label: 'Uzun soluklu, kısaya da açığım',
        hint: 'Önceliğim uzun vadeli',
        order: 2,
      },
      { id: 'friendship', label: 'Arkadaşlık', hint: 'Önce tanışalım', order: 3 },
      {
        id: 'unsure',
        label: 'Henüz emin değilim',
        hint: 'Bakalım nereye gidiyor',
        order: 4,
      },
    ],
  },

  interests: {
    key: 'interests',
    multiSelect: true,
    maxSelection: 8,
    required: false,
    options: [
      { id: 'walking', label: 'Uzun yürüyüş', order: 1 },
      { id: 'cinema', label: 'Sinema', order: 2 },
      { id: 'cooking', label: 'Yemek yapmak', order: 3 },
      { id: 'concert', label: 'Konser', order: 4 },
      { id: 'books', label: 'Kitap', order: 5 },
      { id: 'coffee', label: 'Kahve', order: 6 },
      { id: 'swimming', label: 'Yüzme', order: 7 },
      { id: 'museum', label: 'Müze', order: 8 },
      { id: 'cycling', label: 'Bisiklet', order: 9 },
      { id: 'podcast', label: 'Podcast', order: 10 },
      { id: 'theatre', label: 'Tiyatro', order: 11 },
      { id: 'camping', label: 'Kamp', order: 12 },
    ],
  },

  /**
   * Arkadaslik arayan kullaniciya farkli bir etiket seti gosteriliyor: ikili
   * bulusmayi cagristiran etiketler yerine birlikte yapilan seyler.
   */
  interests_friendship: {
    key: 'interests_friendship',
    multiSelect: true,
    maxSelection: 8,
    required: false,
    options: [
      { id: 'board_games', label: 'Kutu oyunları', order: 1 },
      { id: 'hiking', label: 'Doğa yürüyüşü', order: 2 },
      { id: 'football', label: 'Halı saha', order: 3 },
      { id: 'volunteering', label: 'Gönüllülük', order: 4 },
      { id: 'language', label: 'Dil pratiği', order: 5 },
      { id: 'gym', label: 'Spor salonu', order: 6 },
      { id: 'coffee', label: 'Kahve', order: 7 },
      { id: 'cinema', label: 'Sinema', order: 8 },
      { id: 'podcast', label: 'Podcast', order: 9 },
      { id: 'photography', label: 'Fotoğraf', order: 10 },
    ],
  },
};

module.exports = { optionGroups };
