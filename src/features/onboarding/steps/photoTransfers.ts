import { create } from 'zustand';

import type { Transfer, Transfers } from './photoSlots';

type PhotoTransfersState = {
  transfers: Transfers;
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
 */
export const usePhotoTransfers = create<PhotoTransfersState>()((set) => ({
  transfers: new Map(),

  mark(index, value) {
    set((state) => {
      const next = new Map(state.transfers);
      if (value === null) next.delete(index);
      else next.set(index, value);
      return { transfers: next };
    });
  },

  reset() {
    set({ transfers: new Map() });
  },
}));
