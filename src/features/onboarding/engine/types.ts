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
  /** Ekranin basligi ve alt satiri; ikisi de metin sozlugunden gelir. */
  title: string;
  subtitle: string;
  component: ComponentType<StepProps>;
  /** Adimin devam edebilmesi icin gereken sart. */
  isComplete: (answers: DraftAnswers) => boolean;
  /**
   * Sart saglanmadan ileri basildiginda gosterilen satir. Buton gri
   * yapilmiyor: devre disi bir buton neyin eksik oldugunu soylemiyor.
   *
   * Fonksiyon verilirse cevaplara gore konusabilir ve `null` donerek
   * susabilir. Susmasi gereken durum su: adimin govdesi zaten alanin
   * altinda daha kesin bir sey soyluyorsa, burada daha bulanik bir cumle
   * tekrar etmek kesin olani bastirir.
   */
  incompleteHint?: string | ((answers: DraftAnswers) => string | null);
  /**
   * Atlanabilir adimlarda cikis yolu gizlenmez.
   *
   * Buradaki deger sunucu bir sey soylemediginde gecerli olan. `requiredGroup`
   * verilmisse ve sunucu o grubu gonderiyorsa, zorunluluk kararini sunucu
   * veriyor: bir sorunun zorunlu olup olmadigi bir urun karari ve istemci
   * surumune gomulmemeli.
   */
  skippable: boolean;
  /** Bu adimin zorunlulugunu belirleyen sunucu grubu. */
  requiredGroup?: string;
  /** Atlamanin ne kaybettirdigini soyleyen tek satir. Zorlama degil bilgilendirme. */
  skipCost?: string;
  /**
   * Kosullu adim. Verilmezse adim her zaman gorunur.
   * Gorunmeyen bir adim ilerleme sayacina da girmez.
   */
  shouldShow?: (answers: DraftAnswers) => boolean;
};
