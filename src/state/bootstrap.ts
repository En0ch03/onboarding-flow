import { fetchOptionGroups, readCachedOptionGroups } from '@/api/config';
import { fetchProfile } from '@/api/endpoints';
import { normalizeApiError } from '@/api/errors';

import { reconcileDraftWithOptions } from '@/features/onboarding/steps/reconcileDraft';

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
 * cagri bir sure hic yoktu ve sonucu su oluyordu: baska bir cihazda -- ya da
 * uygulamayi silip yeniden kuran ayni cihazda -- verilmis cevaplar yerel
 * taslakta bulunmadigi icin kullanici birinci adimdan basliyor ve verdigi
 * cevaplari yeniden veriyordu. Ayni akis soguk acilista dogru calisiyordu,
 * yani davranis yola gore ayrisiyordu.
 *
 * Cakismada sunucu kazanir: cihazda kalmis eski bir cevap, baska bir
 * cihazdan verilmis yeni cevabin uzerine yazmamali.
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

  return 'in-progress';
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
