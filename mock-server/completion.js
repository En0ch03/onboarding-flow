'use strict';

/**
 * Onboarding'in tamamlanip tamamlanmadigina sunucu karar verir.
 *
 * Istemci de ayni kurallari biliyor ve kullaniciyi eksik bir adimdan ileri
 * birakmiyor; ama istemcinin bildigi sey bir nezaket, bir kapi degil.
 * Navigasyonda bir hata, elle atilmis bir istek veya eski bir surum
 * kullaniciyi eksik bir profille tamamlanmis sayamamali. Profilin
 * "tamamlandi" damgasi burada vuruluyor, dolayisiyla sarti da burasi
 * sormali.
 *
 * Hangi listenin zorunlu oldugu yine listenin kendi verisinden okunuyor:
 * bir soruyu zorunlu yapmak icin sunucuda tek bir alan degisiyor, iki
 * yerde iki kural degil.
 */

const MINIMUM_AGE = 18;

function ageOn(birth, today) {
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

/**
 * Takvimde olmayan bir tarih sessizce kaymamali: `new Date(1996, 1, 31)`
 * 2 Mart'a donuyor, o yuzden geri okuma yapiliyor.
 */
function readAge(value, today) {
  if (typeof value !== 'object' || value === null) return null;

  const day = Number(value.day);
  const month = Number(value.month);
  const year = Number(value.year);

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

/** Bir listeye verilmis cevabi, tekli ve coklu ayrimini gormeden diziye cevirir. */
function chosenIds(answer) {
  if (Array.isArray(answer)) return answer.filter((id) => typeof id === 'string');
  return typeof answer === 'string' ? [answer] : [];
}

/**
 * Tamamlanmaya engel olan alanlar. Bos nesne donerse profil tamamlanabilir.
 *
 * Sunucudan kaldirilmis bir secenegin kimligi cevabi ayakta tutmuyor:
 * kaldirilan bir cevapla tamamlanmis sayilmak, kullanicinin bir daha hic
 * gormeyecegi bir soruyu cevaplamis gorunmesi demek.
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

  for (const [key, group] of Object.entries(optionGroups)) {
    if (!group.required) continue;

    const known = chosenIds(preferences[key]).filter((id) =>
      group.options.some((option) => option.id === id),
    );

    if (known.length === 0) fields[key] = 'required';
  }

  return fields;
}

module.exports = { completionProblems, MINIMUM_AGE };
