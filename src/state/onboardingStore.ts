import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storageKeys } from '@/storage/keys';

/**
 * Kullanicinin akis boyunca verdigi cevaplar.
 *
 * Sifre burada yok ve olamaz: taslak diske yaziliyor ve bir kimlik bilgisi
 * orada durmamali. Alan listesinin acik olmasi bunu gozle gorunur kiliyor.
 */
export type DraftAnswers = {
  name?: string;
  /** Uc ayri alan: yerel tarih secici mobilde daha cok hata uretiyor. */
  birthDate?: { day: string; month: string; year: string };
  gender?: string;
  audience?: string[];
  orientation?: string[];
  /** Isaretlenmediyse yonelim alani istege hic eklenmez. */
  orientationConsent?: boolean;
  intent?: string[];
  photos?: { id: string; url: string }[];
  interests?: string[];
};

type OnboardingState = {
  answers: DraftAnswers;
  activeStepId: string | null;
  completedStepIds: string[];
  /** Diskteki taslak okunana kadar hicbir yonlendirme yapilmaz. */
  hydrated: boolean;

  setAnswers: (patch: DraftAnswers) => void;
  setActiveStep: (stepId: string) => void;
  markStepCompleted: (stepId: string) => void;
  /** Sunucu akisi tamamlanmis sayiyorsa yerel taslak bir onbellekten ibarettir. */
  clearDraft: () => void;
};

const emptyDraft = {
  answers: {} as DraftAnswers,
  activeStepId: null,
  completedStepIds: [] as string[],
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...emptyDraft,
      hydrated: false,

      setAnswers(patch) {
        set({ answers: { ...get().answers, ...patch } });
      },

      setActiveStep(stepId) {
        set({ activeStepId: stepId });
      },

      markStepCompleted(stepId) {
        const completed = get().completedStepIds;
        if (completed.includes(stepId)) return;
        set({ completedStepIds: [...completed, stepId] });
      },

      clearDraft() {
        set({ ...emptyDraft });
      },
    }),
    {
      name: storageKeys.onboardingDraft,
      storage: createJSONStorage(() => AsyncStorage),
      // Yalnizca cevaplar ve akistaki yer saklanir; hidrasyon bayragi
      // saklanirsa uygulama bir sonraki acilista kendini hidre olmus sanir.
      partialize: (state) => ({
        answers: state.answers,
        activeStepId: state.activeStepId,
        completedStepIds: state.completedStepIds,
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
