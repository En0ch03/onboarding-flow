'use strict';

/**
 * Onboarding'in tamamlanip tamamlanmadigina sunucu karar verir.
 *
 * Istemci de ayni kurallari biliyor ve kullaniciyi eksik bir adimdan ileri
 * birakmiyor; ama istemcinin bildigi sey bir nezaket, bir kapi degil.
 * Navigasyonda bir hata, elle atilmis bir istek veya eski bir surum
 * kullaniciyi eksik bir profille tamamlanmis sayamamali. Profilin
 * "tamamlandi" damgasi burada vuruluyor, dolayisiyla sartini da burasi
 * sormali.
 *
 * Sart dort parcali: ad, yas kapisini gecen bir dogum tarihi, fotograf
 * tabani, ve `required` isaretli her listeye gecerli bir cevap. Hangi
 * listenin zorunlu oldugu yine listenin kendi verisinden okunuyor: bir
 * soruyu zorunlu yapmak icin sunucuda tek bir alan degisiyor, iki yerde
 * iki kural degil.
 *
 * Sayisal esikler (yas, fotograf tabani) burada sabit. Bunlar taksonomi
 * degil; bolgeye gore degismiyorlar ve bir liste gelmediginde ne yapilacagi
 * sorusunu acmiyorlar.
 */

const MINIMUM_AGE = 18;

/** Istemcideki tabanla ayni sayi; ikisi de kendi tarafinin kapisi. */
const MINIMUM_PHOTOS = 2;

function ageOn(birth, today) {
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

/**
 * Takvimde olmayan bir tarih sessizce kaymamali: `new Date(1996, 1, 31)`
 * 2 Mart'a donuyor, o yuzden geri okuma yapiliyor.
 *
 * Parcalar yalnizca metin veya sayi kabul ediliyor. `true` gibi bir deger
 * `Number(...)` altinda 1'e donusup gecerli bir gune benziyordu.
 */
function readAge(value, today) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;

  const parts = [value.day, value.month, value.year];
  if (!parts.every((part) => typeof part === 'string' || typeof part === 'number')) return null;

  const [day, month, year] = parts.map(Number);

  if (![day, month, year].every(Number.isInteger)) return null;
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const birth = new Date(year, month - 1, day);
  if (
    birth.getFullYear() !== year ||
    birth.getMonth() !== month - 1 ||
    birth.getDate() !== day ||
    birth.getTime() > today.getTime()
  ) {
    return null;
  }

  return ageOn(birth, today);
}

/**
 * Sayilan sey fotograf kaydinin varligi degil, ayri ayri fotograflar.
 *
 * Bos metin de metindir ve ayni kimlik iki kez gonderilebiliyordu; kapi
 * sayiyi sayiyor ama neyi saydigini sormuyordu. Iki bos kayitla fotograf
 * tabani gecilebiliyordu.
 */
function countPhotos(value) {
  if (!Array.isArray(value)) return 0;

  const ids = new Set();

  for (const photo of value) {
    if (typeof photo !== 'object' || photo === null) continue;
    if (typeof photo.id !== 'string' || photo.id.trim() === '') continue;
    if (typeof photo.url !== 'string' || photo.url.trim() === '') continue;
    ids.add(photo.id);
  }

  return ids.size;
}

/**
 * Bir listenin acilis kosulu var mi: baska bir secenegin `unlocks` hedefi
 * olan listeler yalnizca o secenek verilmisse gorunuyor.
 */
function unlockedKeys(preferences, optionGroups) {
  const keys = new Set();

  for (const [key, group] of Object.entries(optionGroups)) {
    const chosen = new Set(chosenIds(preferences[key]));
    for (const option of group.options ?? []) {
      if (option.unlocks && chosen.has(option.id)) keys.add(option.unlocks);
    }
  }

  return keys;
}

/**
 * Bir liste, baska bir listenin varyanti mi -- ve hangisinin.
 *
 * Varyant, ayri bir soru degil: ayni sorunun baska bir etiket seti ve
 * cevabi taban listenin anahtari altinda duruyor. O yuzden kendi basina
 * zorunlu sayilmiyor; zorunluluk tabanda.
 *
 * Iliski veriden okunuyor, `unlocks` kenarlarindan cikarilmiyor. Cikarim
 * iki sekilde yanlis sonuc veriyordu: birbirini acan iki liste ikisi de
 * varyant sayilip butun zorunluluk denetimi sessizce kapaniyordu, ve
 * varyantin hangi tabana ait oldugu bilinmedigi icin oradan secilen bir
 * etiket her liste icin gecerli sayiliyordu -- "Kutu oyunlari" gecerli bir
 * cinsiyet cevabi oluyordu.
 *
 * Iliskinin kendisi de dogrulaniyor. Varyant olmak denetimden dusmek
 * demek, yani yanlis yazilmis bir `variantOf` kapiyi **acik** yonde
 * bozardi: kendini gosteren, olmayan bir listeyi gosteren veya karsilikli
 * isaret eden iki liste, zorunlu sorulari sessizce zorunsuz yapardi. Boyle
 * bir baglantı yok sayiliyor ve liste sıradan, zorunlu bir soru gibi
 * denetleniyor -- yapilandirma hatasinda kapi sıkı tarafa bozuluyor.
 */
function variantBase(key, optionGroups) {
  const base = optionGroups[key]?.variantOf;
  if (typeof base !== 'string') return null;

  // Kendini gosteren veya olmayan bir listeyi gosteren baglanti gecersiz.
  if (base === key || optionGroups[base] === undefined) return null;

  // Tabanin kendisi varyantsa zincir var demektir; varyantlar tek duzeyli
  // ve karsilikli isaret eden iki liste boylece ikisi de denetleniyor.
  if (typeof optionGroups[base].variantOf === 'string') return null;

  return base;
}

/** Bir listeye verilmis cevabi, tekli ve coklu ayrimini gormeden diziye cevirir. */
function chosenIds(answer) {
  if (Array.isArray(answer)) return answer.filter((id) => typeof id === 'string');
  return typeof answer === 'string' ? [answer] : [];
}

/**
 * Bir listeye verilen cevabin bicimi ve buyuklugu.
 *
 * Bir varyant liste acikken cevaplar yine taban listenin anahtari altinda
 * saklaniyor; o yuzden **o tabanin** acilmis varyantlarinin secenekleri de
 * gecerli sayiliyor. Aksi halde "arkadaslik" cevabini verip o listeden bir
 * etiket secen kullanici, taban listede olmayan bir kimlik tasidigi icin
 * reddedilirdi.
 *
 * Genisletme yalnizca o tabana ait varyantlarla sinirli. Once her acilmis
 * varyant her liste icin gecerli sayiliyordu ve bu, zorunlu bir listeyi
 * alakasiz bir kimlikle gecmenin yolunu aciyordu.
 */
function inspectAnswer(key, group, preferences, optionGroups, unlocked) {
  const answer = preferences[key];

  // Tekli bir soruya dizi gelmesi bir bicim hatasi: iki cevap veren bir
  // istemci, tek cevap kuralini hic uygulamamis demektir.
  if (!group.multiSelect && (Array.isArray(answer) || chosenIds(answer).length > 1)) {
    return 'invalid';
  }

  const acceptable = new Set((group.options ?? []).map((option) => option.id));
  for (const unlockedKey of unlocked) {
    if (variantBase(unlockedKey, optionGroups) !== key) continue;
    for (const option of optionGroups[unlockedKey]?.options ?? []) acceptable.add(option.id);
  }

  // Sunucudan kaldirilmis bir secenegin kimligi cevabi ayakta tutmuyor:
  // kaldirilan bir cevapla tamamlanmis sayilmak, kullanicinin bir daha hic
  // gormeyecegi bir soruyu cevaplamis gorunmesi demek. Ama tanimadigimiz
  // kimlik tek basina bir engel degil - dusuyor, reddetmiyor.
  const known = chosenIds(answer).filter((id) => acceptable.has(id));

  if (typeof group.maxSelection === 'number' && known.length > group.maxSelection) {
    return 'invalid';
  }
  if (group.required && known.length === 0) return 'required';

  return null;
}

/**
 * Tamamlanmaya engel olan alanlar. Bos nesne donerse profil tamamlanabilir.
 */
function completionProblems(user, optionGroups, today = new Date()) {
  const fields = {};
  const preferences = user.preferences || {};

  if (typeof user.display_name !== 'string' || user.display_name.trim().length === 0) {
    fields.display_name = 'required';
  }

  const age = readAge(preferences.birth_date, today);
  if (age === null) fields.birth_date = 'required';
  else if (age < MINIMUM_AGE) fields.birth_date = 'invalid';

  if (countPhotos(preferences.photos) < MINIMUM_PHOTOS) fields.photos = 'required';

  const unlocked = unlockedKeys(preferences, optionGroups);

  for (const [key, group] of Object.entries(optionGroups)) {
    // Varyant listeler kendi anahtarlariyla saklanmiyor; cevaplari tabanin
    // altinda duruyor ve orada denetleniyor.
    if (variantBase(key, optionGroups) !== null) continue;

    const problem = inspectAnswer(key, group, preferences, optionGroups, unlocked);
    if (problem !== null) fields[key] = problem;
  }

  return fields;
}

module.exports = { completionProblems, MINIMUM_AGE, MINIMUM_PHOTOS };
