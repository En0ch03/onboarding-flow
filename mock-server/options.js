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
      { id: 'woman', label: 'Kadın', order: 1 },
      { id: 'man', label: 'Erkek', order: 2 },
      {
        id: 'non_binary',
        label: 'Non-binary',
        hint: 'Kadın ve erkek ikiliğinin dışında',
        order: 3,
      },
    ],
  },

  audience: {
    key: 'audience',
    multiSelect: true,
    // Seceneklerin hepsi birlikte secilebiliyor; bir sinir yazmak, hicbir sey
    // yapmayan bir kural ilan etmek olurdu.
    maxSelection: null,
    required: true,
    options: [
      { id: 'women', label: 'Kadınlar', order: 1 },
      { id: 'men', label: 'Erkekler', order: 2 },
      { id: 'non_binary', label: 'Non-binary kişiler', order: 3 },
      { id: 'everyone', label: 'Herkes', order: 4 },
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
        label: 'Uzun süreli ilişki',
        hint: 'Ciddi bir bağ arıyorum',
        order: 1,
      },
      {
        id: 'long_term_open',
        label: 'Uzun süreli, kısaya açık',
        hint: 'Önceliğim kalıcı olan',
        order: 2,
      },
      {
        id: 'short_term_open',
        label: 'Kısa süreli, uzuna açık',
        hint: 'Akışına bırakıyorum',
        order: 3,
      },
      {
        id: 'short_term',
        label: 'Kısa süreli ilişki',
        hint: 'Şimdilik ciddi bir bağ aramıyorum',
        order: 4,
      },
      {
        id: 'friendship',
        label: 'Yeni arkadaşlar',
        hint: 'Önce tanışalım',
        // Bu cevap ilgi alanlarinin baska bir setini aciyor. Iliski burada
        // duruyor; istemci hangi cevabin hangi listeyi actigini bilmiyor.
        unlocks: 'interests_friendship',
        order: 5,
      },
      {
        id: 'unsure',
        label: 'Henüz karar vermedim',
        hint: 'Bakalım nereye gidiyor',
        order: 6,
      },
    ],
  },

  interests: {
    key: 'interests',
    multiSelect: true,
    maxSelection: 8,
    required: false,
    options: [
      { id: 'walking', label: 'Yürüyüş', order: 1 },
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
      { id: 'travel', label: 'Seyahat', order: 13 },
      { id: 'photography', label: 'Fotoğraf', order: 14 },
      { id: 'yoga', label: 'Yoga', order: 15 },
      { id: 'gaming', label: 'Oyun', order: 16 },
    ],
  },

  /**
   * Arkadaslik arayan kullaniciya farkli bir etiket seti gosteriliyor: ikili
   * bulusmayi cagristiran etiketler yerine birlikte yapilan seyler.
   */
  interests_friendship: {
    key: 'interests_friendship',
    // Bu liste ayri bir soru degil, `interests` sorusunun baska bir etiket
    // seti. Cevap taban listenin anahtari altinda saklaniyor, o yuzden
    // hangi tabanin varyanti oldugu veride yaziyor: sunucu, buradan secilen
    // bir etiketi yalnizca `interests` icin gecerli sayiyor, her liste icin
    // degil.
    variantOf: 'interests',
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
      { id: 'running', label: 'Koşu', order: 11 },
      { id: 'festival', label: 'Festival', order: 12 },
    ],
  },
};

module.exports = { optionGroups };
