import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { usePhotoTransfers } from '@/features/onboarding/steps/photoTransfers';
import { storageKeys } from '@/storage/keys';

/**
 * Kullanicinin akis boyunca verdigi cevaplar.
 *
 * Sifre burada yok ve olamaz: taslak diske yaziliyor ve bir kimlik bilgisi
 * orada durmamali. Alan listesinin acik olmasi bunu gozle gorunur kiliyor.
 */
export type DraftAnswers = {
  /** Yalnizca rakamlar, on hane. Ulke kodu ekranda sabit; degerde tutulmuyor. */
  phone?: string;
  name?: string;
  /** Uc ayri alan: yerel tarih secici mobilde daha cok hata uretiyor. */
  birthDate?: { day: string; month: string; year: string };
  gender?: string;
  audience?: string[];
  intent?: string[];
  photos?: { id: string; url: string }[];
  interests?: string[];
};

/**
 * Bir yama ya da guncel cevaplardan yama ureten bir fonksiyon.
 *
 * Fonksiyon bicimi, cevabi bir bekleme sonrasinda yazan yerler icin: iki
 * fotograf yuklemesi ayni anda bitince ikisi de ekranin son gordugu listeyi
 * okuyup ustune yaziyordu ve biri kayboluyordu. Yazma aninda guncel olani
 * okumak yalnizca deponun icinde mumkun; ekran o an henuz yenilenmemis
 * olabiliyor.
 */
export type AnswersUpdate = DraftAnswers | ((current: DraftAnswers) => DraftAnswers);

type OnboardingState = {
  answers: DraftAnswers;
  /**
   * Taslagin sahibi olan kullanici.
   *
   * Taslak diskte yasiyor ve cihaz bir kisiye ait degil: birinin yarim
   * biraktigi cevaplar, ayni telefonda hesap acan bir baskasinin ekraninda
   * belirmemeli.
   */
  ownerId: string | null;
  activeStepId: string | null;
  completedStepIds: string[];
  /** Sunucuya yazilamamis adimlar; tamamlanmadan once tekrar denenir. */
  unsyncedStepIds: string[];
  /** Diskteki taslak okunana kadar hicbir yonlendirme yapilmaz. */
  hydrated: boolean;

  setAnswers: (update: AnswersUpdate) => void;
  /**
   * Cevaplarin tamamini degistirir. `setAnswers` birlestirdigi icin bir alani
   * kaldiramiyor; kaldirmanin gerektigi tek yer sunucudan dusen seceneklerin
   * temizligi ve orasi tam bir kume yaziyor.
   */
  replaceAnswers: (answers: DraftAnswers) => void;
  setActiveStep: (stepId: string) => void;
  /**
   * Kullaniciyi bir adima geri alir ve o adimin tamamlanmis isaretini kaldirir.
   * Cevabi elinden alinan bir adim, tamamlanmis sayilmaya devam edemez.
   */
  rewindTo: (stepId: string) => void;
  markStepCompleted: (stepId: string) => void;
  markStepUnsynced: (stepId: string) => void;
  markStepSynced: (stepId: string) => void;
  /** Sunucu akisi tamamlanmis sayiyorsa yerel taslak bir onbellekten ibarettir. */
  clearDraft: () => void;
  /**
   * Taslagi bir kullaniciya baglar; baskasinin taslagiysa once siler.
   *
   * Kapatma noktasi cikis degil giris: cikista silmek, yenilemesi tukenmis
   * bir oturumun da taslagi goturmesi demekti ve bir ag arizasi veri kaybina
   * donusuyordu. Girise koyunca kayip yalnizca gercekten baska biri
   * girdiginde oluyor.
   */
  claimDraft: (userId: string) => void;
};

const emptyDraft = {
  answers: {} as DraftAnswers,
  ownerId: null as string | null,
  activeStepId: null,
  completedStepIds: [] as string[],
  unsyncedStepIds: [] as string[],
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...emptyDraft,
      hydrated: false,

      setAnswers(update) {
        set((state) => ({
          answers: {
            ...state.answers,
            ...(typeof update === 'function' ? update(state.answers) : update),
          },
        }));
      },

      replaceAnswers(answers) {
        set({ answers });
      },

      setActiveStep(stepId) {
        set({ activeStepId: stepId });
      },

      rewindTo(stepId) {
        set({
          activeStepId: stepId,
          completedStepIds: get().completedStepIds.filter((id) => id !== stepId),
        });
      },

      markStepCompleted(stepId) {
        const completed = get().completedStepIds;
        if (completed.includes(stepId)) return;
        set({ completedStepIds: [...completed, stepId] });
      },

      markStepUnsynced(stepId) {
        const pending = get().unsyncedStepIds;
        if (pending.includes(stepId)) return;
        set({ unsyncedStepIds: [...pending, stepId] });
      },

      markStepSynced(stepId) {
        set({ unsyncedStepIds: get().unsyncedStepIds.filter((item) => item !== stepId) });
      },

      claimDraft(userId) {
        if (get().ownerId === userId) return;

        // Sahip degisiyorsa oncekinden hicbir kalinti birakilmaz. Nesi kaldigini
        // tek tek olcmek denendi ve yanlisti: cevabi bos bir taslak bile bir
        // yer, tamamlanmis adimlar ve gonderilmemis adimlar tasiyabiliyor, ve
        // gonderilmemis adimlar kapanista sunucuya yaziliyor -- yani yabancinin
        // isaretleri yeni hesabin profiline gidiyordu. Sahibi hic yazilmamis bir
        // taslak da buraya dusuyor: sahiplik alanindan onceki surumden kalmis
        // olabilir ve kimin oldugu bilinmiyorsa yanlis kisiye acmaktansa
        // kaybedilir.
        get().clearDraft();
        set({ ownerId: userId });
      },

      clearDraft() {
        set({ ...emptyDraft });
        // Yarim kalmis bir yuklemenin isareti taslakla birlikte gider: bir
        // sonraki akis, bir oncekinin "yuklenemedi" kutusunu miras almamali.
        usePhotoTransfers.getState().reset();
      },
    }),
    {
      name: storageKeys.onboardingDraft,
      storage: createJSONStorage(() => AsyncStorage),
      // Yalnizca cevaplar ve akistaki yer saklanir; hidrasyon bayragi
      // saklanirsa uygulama bir sonraki acilista kendini hidre olmus sanir.
      partialize: (state) => ({
        answers: state.answers,
        ownerId: state.ownerId,
        activeStepId: state.activeStepId,
        completedStepIds: state.completedStepIds,
        unsyncedStepIds: state.unsyncedStepIds,
      }),
      onRehydrateStorage: () => (state) => {
        // Okuma basarisiz olsa bile bayrak kalkar: bozuk bir kayit yuzunden
        // uygulamanin acilis ekraninda asili kalmasi, taslagi kaybetmekten kotu.
        useOnboardingStore.setState({ hydrated: true });
        if (!state) return;
      },
    },
  ),
);

/** Hidrasyonun bitmesini bekler; acilis sekansi bunu bekliyor. */
export function whenDraftHydrated(): Promise<void> {
  if (useOnboardingStore.getState().hydrated) return Promise.resolve();

  return new Promise((resolve) => {
    const unsubscribe = useOnboardingStore.subscribe((state) => {
      if (state.hydrated) {
        unsubscribe();
        resolve();
      }
    });
  });
}
