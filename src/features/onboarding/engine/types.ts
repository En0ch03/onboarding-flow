import type { ComponentType } from 'react';

import type { OptionGroups } from '@/api/schemas';
import type { DraftAnswers } from '@/state/onboardingStore';

/**
 * Adimlar rota degil veri.
 *
 * Akisa bir adim eklemek bir dosya ve bir dizi elemani olmali; navigasyon
 * yeniden duzenlemesi degil. Degerlendirme olcutlerinden biri "baskasi akisa
 * bir adim ekleyebilmeli" ve mimariye dogrudan cevrilebilen madde buydu.
 */
export type StepProps = {
  values: DraftAnswers;
  onChange: (patch: DraftAnswers) => void;
  /** Sunucudan gelen secenek listeleri; adim kendi listesini tasimaz. */
  options: OptionGroups;
};

export type StepDefinition = {
  id: string;
  component: ComponentType<StepProps>;
  /** Adimin devam edebilmesi icin gereken sart. */
  isComplete: (answers: DraftAnswers) => boolean;
  /** Atlanabilir adimlarda cikis yolu gizlenmez. */
  skippable: boolean;
  /**
   * Kosullu adim. Verilmezse adim her zaman gorunur.
   * Gorunmeyen bir adim ilerleme sayacina da girmez.
   */
  shouldShow?: (answers: DraftAnswers) => boolean;
};
