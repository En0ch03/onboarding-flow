import { create } from 'zustand';

import type { Transfer, Transfers } from './photoSlots';

type PhotoTransfersState = {
  transfers: Transfers;
  /**
   * Her sifirlama bir nesil kapatir. Sifirlamadan once baslamis bir
   * yukleme, bittiginde kendi neslinin gectigini gorur ve sonucunu atar:
   * ne isaret koyar ne cevap yazar.
   */
  generation: number;
  mark: (index: number, value: Transfer | null) => void;
  reset: () => void;
};

/**
 * Devam eden yuklemelerin isaretleri, ekranin degil akisin omrunde yasiyor.
 *
 * Isaretler bilesenin icinde tutuldugunda adimi terk edip donmek onlari
 * siliyordu: yukleme arkada surerken kutu bos gorunuyor, kullanici ayni
 * kutuyu yeniden dolduruyor ve ikisi de bitince izgara yediye tasiyordu --
 * yedincisi ekranda gorunmuyor, silinemiyor ve sonraki acilista sinirdaki
 * kirpma onu sessizce yok ediyordu.
 *
 * Diske yazilmiyor: uygulama kapanirsa yukleme de olur ve isaretin bir
 * anlami kalmaz. Kaldigi yerden devam, cevaplar icin gecerli; yarim kalmis
 * bir ag istegi cevap degil.
 *
 * Omru akisin omru, surecin degil: akis terk edildiginde (adim yigini
 * sokuldugunde) ve taslak silindiginde sifirlaniyor. Aksi halde bir
 * kullanicinin dusen yuklemesi, ayni cihazda giris yapan bir sonrakinin
 * kapak kutusunda "yuklenemedi" diye beliriyordu.
 */
export const usePhotoTransfers = create<PhotoTransfersState>()((set) => ({
  transfers: new Map(),
  generation: 0,

  mark(index, value) {
    set((state) => {
      const next = new Map(state.transfers);
      if (value === null) next.delete(index);
      else next.set(index, value);
      return { transfers: next };
    });
  },

  reset() {
    set((state) => ({ transfers: new Map(), generation: state.generation + 1 }));
  },
}));
