import { fetchOptionGroups, readCachedOptionGroups } from '@/api/config';
import { fetchProfile } from '@/api/endpoints';
import { normalizeApiError } from '@/api/errors';

import { pruneAnswers } from '@/features/onboarding/steps/answerHygiene';

import { connectAuthBridge, useAuthStore } from './authStore';
import { useOnboardingStore, whenDraftHydrated } from './onboardingStore';
import { draftFromProfile } from './profileMapping';

/**
 * Acilista uygulamanin gidecegi yer.
 *
 * `optionsAvailable` ayri tutuluyor: listeler hic gelmediyse secim adimlari
 * bos gosterilmez, anlamli bir hata ve yeniden deneme sunulur.
 */
export type BootstrapResult = {
  destination: 'welcome' | 'onboarding' | 'app';
  /** Onboarding'e donuluyorsa kaldigi adim. */
  resumeStepId: string | null;
  optionsAvailable: boolean;
};

/**
 * Akisi kesintiye dayanikli kilan sey bu sira.
 *
 * En sik yapilan hata hidrasyon bitmeden yonlendirmek: kullanici bir an
 * karsilama ekranini gorup sonra adimina firliyor. Bu yuzden taslak okunmadan
 * hicbir hedef hesaplanmiyor.
 *
 * Profil veya liste cagrisi basarisiz olursa akis durmuyor: son bilinen
 * veriyle devam ediliyor ve mutabakat ilk firsatta yapiliyor.
 */
export async function bootstrap(): Promise<BootstrapResult> {
  connectAuthBridge();

  await useAuthStore.getState().restore();
  await whenDraftHydrated();

  const options = await loadOptionGroups();

  if (useAuthStore.getState().status !== 'authenticated') {
    return { destination: 'welcome', resumeStepId: null, optionsAvailable: options };
  }

  try {
    const profile = await fetchProfile();

    if (profile.onboarding_complete) {
      // Sunucu tek gercek kaynak; yerel durum bir onbellek.
      useAuthStore.getState().markOnboardingComplete();
      useOnboardingStore.getState().clearDraft();
      return { destination: 'app', resumeStepId: null, optionsAvailable: options };
    }

    // Cakismada sunucu kazanir: cihazda kalmis eski bir cevap, baska bir
    // cihazdan verilmis yeni cevabin uzerine yazmamali.
    useOnboardingStore.getState().setAnswers(draftFromProfile(profile));
  } catch (thrown) {
    const error = normalizeApiError(thrown);

    // Yenileme de basarisiz olduysa oturum bitti; taslak yerinde duruyor ve
    // kullanici giris yapinca kaldigi adimdan devam edecek.
    if (error.kind === 'refresh_expired') {
      return { destination: 'welcome', resumeStepId: null, optionsAvailable: options };
    }
    // Diger hatalar akisi durdurmuyor: elimizdeki taslakla devam ediliyor.
  }

  // Sunucunun artik sunmadigi cevaplar burada dusuyor. Tek yer ve tek an:
  // bundan sonra ekran, tamamlanma kontrolu ve sunucuya yazma ayni gercegi
  // goruyor.
  const groups = readCachedOptionGroups();
  if (groups !== null) {
    const store = useOnboardingStore.getState();
    store.replaceAnswers(pruneAnswers(store.answers, groups));
  }

  return {
    destination: 'onboarding',
    resumeStepId: useOnboardingStore.getState().activeStepId,
    optionsAvailable: options,
  };
}

async function loadOptionGroups(): Promise<boolean> {
  try {
    await fetchOptionGroups();
    return true;
  } catch {
    // Uygulama acildigindan beri alinmis bir liste varsa onunla devam edilir.
    return readCachedOptionGroups() !== null;
  }
}
