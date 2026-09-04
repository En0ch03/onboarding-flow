import { fetchOptionGroups, readCachedOptionGroups } from '@/api/config';
import type { OptionGroups } from '@/api/schemas';
import { fetchProfile } from '@/api/endpoints';
import { normalizeApiError } from '@/api/errors';

import { firstIncompleteStepId } from '@/features/onboarding/engine/stepFlow';
import { reconcileDraftWithOptions } from '@/features/onboarding/steps/reconcileDraft';
import { resolveSteps } from '@/features/onboarding/steps/resolveSteps';
import { steps } from '@/features/onboarding/steps/steps';

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

  const adoption = await adoptServerProfile();

  if (adoption === 'session-lost') {
    return { destination: 'welcome', resumeStepId: null, optionsAvailable: options };
  }

  if (adoption === 'complete') {
    return { destination: 'app', resumeStepId: null, optionsAvailable: options };
  }

  return {
    destination: 'onboarding',
    resumeStepId: useOnboardingStore.getState().activeStepId,
    optionsAvailable: options,
  };
}

/** Sunucudaki profilin yerel taslak karsisindaki sonucu. */
export type ProfileAdoption = 'complete' | 'in-progress' | 'session-lost';

/**
 * Sunucudaki profili yerel taslaga benimsetir.
 *
 * Iki yol da buradan geciyor: acilis sekansi ve giris. Giris yolunda bu
 * cagri bir sure hic yoktu; baska bir cihazda verilmis cevaplar yerel
 * taslakta bulunmadigi icin gorunmuyorlardi.
 *
 * Cevaplari almak yetmiyor, **yeri** de almak gerekiyor. Yeni bir cihazda
 * `activeStepId` bos ve motor bos kimligi ilk gorunur adima dusuruyor -- ilk
 * *eksik* adima degil. Yani cevaplar dolu gelse bile ekran "Adim 1 / 5"te
 * aciliyor ve kullanici doldurulmus uc adimi tek tek geciyordu. Bu, soguk
 * acilista da boyleydi: eksik olan sey giris yolu degil, yerin hic
 * benimsenmemesiydi.
 *
 * Cakismada sunucu kazanir: cihazda kalmis eski bir cevap, baska bir
 * cihazdan verilmis yeni cevabin uzerine yazmamali. Ama yer icin tersi
 * gecerli: cihazda bir yer varsa ona dokunulmuyor, cunku kullanicinin en son
 * durdugu yer orasi.
 */
export async function adoptServerProfile(): Promise<ProfileAdoption> {
  try {
    const profile = await fetchProfile();

    if (profile.onboarding_complete) {
      // Sunucu tek gercek kaynak; yerel durum bir onbellek.
      useAuthStore.getState().markOnboardingComplete();
      useOnboardingStore.getState().clearDraft();
      return 'complete';
    }

    useOnboardingStore.getState().setAnswers(draftFromProfile(profile));
  } catch (thrown) {
    // Yenileme de basarisiz olduysa oturum bitti; taslak yerinde duruyor ve
    // kullanici giris yapinca kaldigi adimdan devam edecek.
    if (normalizeApiError(thrown).kind === 'refresh_expired') return 'session-lost';
    // Diger hatalar akisi durdurmuyor: elimizdeki taslakla devam ediliyor.
  }

  // Sunucunun artik sunmadigi cevaplar burada dusuyor ve cevabi dusen adim
  // yeniden soruluyor. Tek yer ve tek an: bundan sonra ekran, tamamlanma
  // kontrolu ve sunucuya yazma ayni gercegi goruyor.
  const groups = readCachedOptionGroups();
  if (groups !== null) reconcileDraftWithOptions(groups);

  resumeWhereTheFlowStopped(groups);

  return 'in-progress';
}

/**
 * Taslakta bir yer yoksa, cevaplarin isaret ettigi yeri kurar.
 *
 * Yalnizca bos oldugunda: cihazda bir yer varsa kullanicinin en son durdugu
 * nokta odur ve sunucudaki cevaplar onu geri almamali.
 *
 * Butun adimlar doluysa yer son adim oluyor. Ilk adima birakmak, cevabini
 * vermis birini bastan gezdirmek olurdu; son adim ise "Bitir"in bir dokunus
 * uzakta oldugu yer.
 */
function resumeWhereTheFlowStopped(groups: OptionGroups | null): void {
  const store = useOnboardingStore.getState();
  if (store.activeStepId !== null) return;

  const flow = resolveSteps(steps, groups ?? {});
  const blocking = firstIncompleteStepId(flow, store.answers);

  const target = blocking ?? flow[flow.length - 1]?.id;
  if (target !== undefined) store.setActiveStep(target);
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
