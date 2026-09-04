import type { OptionGroups } from '@/api/schemas';

import type { StepDefinition } from '../engine/types';

/**
 * Adim tanimlarini sunucunun kurallariyla birlestirir.
 *
 * Bugun tek kural zorunluluk: bir adim, cevapladigi grubu sunucu `required`
 * isaretlediyse atlanamaz. Kural istemci surumune gomulmus olsaydi, bir
 * sorunun zorunlulugunu degistirmek yeni bir surum ve magaza onayi
 * gerektirirdi - oysa bu bir urun karari.
 *
 * Sunucu grubu gondermiyorsa tanimdaki deger gecerli kaliyor: eksik bir
 * liste, akisin kurallarini silmemeli.
 */
export function resolveSteps(steps: StepDefinition[], options: OptionGroups): StepDefinition[] {
  return steps.map((step) => {
    const group = step.requiredGroup === undefined ? undefined : options[step.requiredGroup];
    if (group === undefined) return step;

    // Sunucunun soyledigi tanimdakiyle ayniysa nesne yeniden kurulmuyor:
    // yeni bir referans, adim listesini tutan her seyi bosuna yeniliyor.
    return group.required === !step.skippable ? step : { ...step, skippable: !group.required };
  });
}
