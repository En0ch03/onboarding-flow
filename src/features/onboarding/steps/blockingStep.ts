import type { StepDefinition } from '../engine/types';

/**
 * Sunucunun reddettigi alan adindan, kullanicinin donecegi adima.
 *
 * Sunucu hangi alanin eksik oldugunu soyluyor ama akisin adimlarini
 * bilmiyor; ceviri istemcinin isi. Secenek listeleri adim tanimlarindaki
 * sorulardan okunuyor, yani sunucuya yeni bir liste eklendiginde burasi
 * kendiliginden dogru kaliyor. Sozlesmenin secenek listesi olmayan uc
 * alani ise adiyla esleniyor.
 *
 * Bu ceviri olmadan tek secenek, kullaniciyi son adima birakmakti; son adim
 * zaten doluysa "Bitir" ayni reddi bir daha alir ve kullanici dongude
 * kalirdi.
 */
const fieldsByStep: Record<string, string[]> = {
  identity: ['display_name', 'birth_date'],
  photos: ['photos'],
};

/** Verilen alanlardan herhangi birine sahip ilk adim; hicbiri eslesmezse `null`. */
export function stepForFields(steps: StepDefinition[], fields: string[]): string | null {
  const wanted = new Set(fields);

  const match = steps.find((step) => {
    const owned = [
      ...(step.questions ?? []).map((question) => question.group),
      ...(fieldsByStep[step.id] ?? []),
    ];

    return owned.some((field) => wanted.has(field));
  });

  return match?.id ?? null;
}
