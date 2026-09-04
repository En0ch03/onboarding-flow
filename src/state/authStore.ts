import { create } from 'zustand';

import { setAuthBridge, type AuthBridge } from '@/api/client';
import type { AuthSession } from '@/api/schemas';
import { clearTokens, readTokens, saveAccessToken, saveTokens } from '@/storage/secure';

/**
 * Oturum durumu.
 *
 * `unknown` bir gecis degil bir baslangic: acilista token'lar okunana kadar
 * uygulama oturumlu mu oturumsuz mu bilmiyor ve bu belirsizligi bir varsayimla
 * doldurmak, kullaniciyi bir an yanlis ekranda gostermek demek.
 */
export type SessionStatus = 'unknown' | 'anonymous' | 'authenticated';

type AuthState = {
  status: SessionStatus;
  userId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  onboardingComplete: boolean;

  /** Cihazda kayitli oturumu okur. */
  restore: () => Promise<void>;
  /** Kayit veya girisin ardindan cagrilir. Sifre hicbir alana yazilmaz. */
  startSession: (session: AuthSession) => Promise<void>;
  /** Gorunmez yenilemeden sonra cagrilir. */
  replaceAccessToken: (accessToken: string) => Promise<void>;
  /** Oturumu bitirir. Taslak cevaplara dokunmaz. */
  endSession: () => Promise<void>;
  markOnboardingComplete: () => void;
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'unknown',
  userId: null,
  accessToken: null,
  refreshToken: null,
  onboardingComplete: false,

  async restore() {
    const tokens = await readTokens();

    if (!tokens) {
      set({ status: 'anonymous', accessToken: null, refreshToken: null });
      return;
    }

    set({
      status: 'authenticated',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  },

  async startSession(session) {
    await saveTokens({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    });

    set({
      status: 'authenticated',
      userId: session.user_id,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      onboardingComplete: session.onboarding_complete,
    });
  },

  async replaceAccessToken(accessToken) {
    await saveAccessToken(accessToken);
    set({ accessToken });
  },

  async endSession() {
    // Once bellekteki oturum kapatiliyor, sonra disk temizleniyor. Ters sirada
    // keystore silme hatasi `set`'e hic ulasmiyordu: kullanici "cik" demisken
    // token'lar hem bellekte hem diskte kaliyor ve uygulama bir sonraki
    // acilista ayni oturumu geri yukluyordu. Ayrica bekleme suresince acilan
    // pencerede yeni bir oturum baslarsa, gec gelen `set` onu siliyordu.
    set({
      status: 'anonymous',
      userId: null,
      accessToken: null,
      refreshToken: null,
      onboardingComplete: false,
    });
    await clearTokens();
  },

  markOnboardingComplete() {
    if (!get().onboardingComplete) set({ onboardingComplete: true });
  },
}));

/**
 * Ag katmaninin oturumla temasi. React disindan okunuyor cunku interceptor bir
 * bilesenin icinde calismiyor; bir cengele bagli olsaydi token'a erisebilmek
 * icin ag katmanini agacin icine tasimak gerekirdi.
 */
export const authBridge: AuthBridge = {
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  onRefreshed: (accessToken) => useAuthStore.getState().replaceAccessToken(accessToken),
  onSessionEnded: () => useAuthStore.getState().endSession(),
};

export function connectAuthBridge(): void {
  setAuthBridge(authBridge);
}
