import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { usePhotoTransfers } from '@/features/onboarding/steps/photoTransfers';
import { storageKeys } from '@/storage/keys';

import { authBridge, useAuthStore } from './authStore';
import { useOnboardingStore, whenDraftHydrated } from './onboardingStore';

const session = {
  user_id: 'usr_1',
  access_token: 'access_1',
  refresh_token: 'refresh_1',
  onboarding_complete: false,
};

beforeEach(async () => {
  await SecureStore.deleteItemAsync(storageKeys.accessToken);
  await SecureStore.deleteItemAsync(storageKeys.refreshToken);
  await AsyncStorage.clear();

  useAuthStore.setState({
    status: 'unknown',
    userId: null,
    accessToken: null,
    refreshToken: null,
    onboardingComplete: false,
  });
  useOnboardingStore.getState().clearDraft();
});

describe('session store', () => {
  it('starts in a state that has not yet decided anything', () => {
    expect(useAuthStore.getState().status).toBe('unknown');
  });

  it('writes tokens to the device keystore and never the password', async () => {
    await useAuthStore.getState().startSession(session);

    expect(await SecureStore.getItemAsync(storageKeys.accessToken)).toBe('access_1');
    expect(await SecureStore.getItemAsync(storageKeys.refreshToken)).toBe('refresh_1');

    const persisted = JSON.stringify(useAuthStore.getState());
    expect(persisted).not.toContain('password');
  });

  it('restores a stored session on the next launch', async () => {
    await useAuthStore.getState().startSession(session);
    useAuthStore.setState({ status: 'unknown', accessToken: null, refreshToken: null });

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().accessToken).toBe('access_1');
  });

  it('treats a half-written session as no session at all', async () => {
    await SecureStore.setItemAsync(storageKeys.accessToken, 'access_only');

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe('anonymous');
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('clears the keystore when the session ends', async () => {
    await useAuthStore.getState().startSession(session);
    await useAuthStore.getState().endSession();

    expect(await SecureStore.getItemAsync(storageKeys.accessToken)).toBeNull();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('exposes the session to the network layer without a component', async () => {
    await useAuthStore.getState().startSession(session);

    expect(authBridge.getAccessToken()).toBe('access_1');
    expect(authBridge.getRefreshToken()).toBe('refresh_1');

    await authBridge.onRefreshed('access_2');
    expect(authBridge.getAccessToken()).toBe('access_2');
    expect(await SecureStore.getItemAsync(storageKeys.accessToken)).toBe('access_2');
  });

  it('leaves the draft alone when the session ends', async () => {
    // Taslak oturumun icinde yaziliyor, oncesinde degil: kayit adimlardan
    // once geliyor, yani sahipsiz bir taslak gercek akista olusmuyor.
    await useAuthStore.getState().startSession(session);
    useOnboardingStore.getState().setAnswers({ name: 'Deniz' });
    await useAuthStore.getState().endSession();

    expect(useOnboardingStore.getState().answers.name).toBe('Deniz');
  });
});

describe('draft store', () => {
  it('merges answers rather than replacing them', () => {
    const draft = useOnboardingStore.getState();
    draft.setAnswers({ name: 'Deniz' });
    draft.setAnswers({ intent: ['long_term'] });

    expect(useOnboardingStore.getState().answers).toEqual({
      name: 'Deniz',
      intent: ['long_term'],
    });
  });

  it('records a completed step once', () => {
    const draft = useOnboardingStore.getState();
    draft.markStepCompleted('identity');
    draft.markStepCompleted('identity');

    expect(useOnboardingStore.getState().completedStepIds).toEqual(['identity']);
  });

  it('persists the answers and the place in the flow', async () => {
    useOnboardingStore.getState().setAnswers({ name: 'Deniz' });
    useOnboardingStore.getState().setActiveStep('intent');

    await whenDraftHydrated();
    const raw = await AsyncStorage.getItem(storageKeys.onboardingDraft);
    expect(raw).not.toBeNull();

    const stored = JSON.parse(raw ?? '{}');
    expect(stored.state.answers.name).toBe('Deniz');
    expect(stored.state.activeStepId).toBe('intent');
    // Hidrasyon bayragi saklanmaz; saklansaydi uygulama bir sonraki acilista
    // kendini hidre olmus sanardi.
    expect(stored.state.hydrated).toBeUndefined();
  });

  it('clears everything when the server says the flow is already finished', () => {
    useOnboardingStore.getState().setAnswers({ name: 'Deniz' });
    useOnboardingStore.getState().setActiveStep('photos');

    useOnboardingStore.getState().clearDraft();

    expect(useOnboardingStore.getState().answers).toEqual({});
    expect(useOnboardingStore.getState().activeStepId).toBeNull();
  });
});

describe('photo transfers', () => {
  it('clearing the draft also drops a half-finished upload marker', () => {
    usePhotoTransfers.getState().mark(1, 'failed');

    useOnboardingStore.getState().clearDraft();

    // Bir sonraki akis, bir oncekinin "yuklenemedi" kutusunu miras almamali.
    expect(usePhotoTransfers.getState().transfers.size).toBe(0);
  });
});

describe('waiting steps', () => {
  it('drops only the step that was sent, not the whole queue', async () => {
    // Baglanti gidince birden fazla adim birlikte bekliyor. Biri gonderilince
    // digerinin isareti dusmemeli, yoksa o cevap kapanista hic gonderilmez ve
    // sunucu eksik profili "tamamlandi" damgalar.
    const draft = useOnboardingStore.getState();
    draft.markStepUnsynced('identity');
    draft.markStepUnsynced('intent');
    draft.markStepUnsynced('interests');

    draft.markStepSynced('intent');

    expect(useOnboardingStore.getState().unsyncedStepIds).toEqual(['identity', 'interests']);
  });

  it('drops nothing when the sent step was not waiting', () => {
    const draft = useOnboardingStore.getState();
    draft.markStepUnsynced('identity');

    draft.markStepSynced('photos');

    expect(useOnboardingStore.getState().unsyncedStepIds).toEqual(['identity']);
  });

  it('does not queue the same step twice', () => {
    // Ayni adim her denemede yeniden isaretleniyor; liste birikirse kapanista
    // ayni govde birden cok kez gider.
    const draft = useOnboardingStore.getState();
    draft.markStepUnsynced('identity');
    draft.markStepUnsynced('identity');

    expect(useOnboardingStore.getState().unsyncedStepIds).toEqual(['identity']);
  });

  it('keeps the queue on disk, so a restart does not lose it', async () => {
    // Kuyruk yalnizca bellekte dursaydi uygulamanin kapanmasi bekleyen adimi
    // silerdi: cevap taslakta durur ama kimse onu gondermeye calismaz ve
    // sunucu eksik profili "tamamlandi" damgalardi.
    useOnboardingStore.getState().markStepUnsynced('intent');

    await whenDraftHydrated();
    const raw = await AsyncStorage.getItem(storageKeys.onboardingDraft);

    const stored = JSON.parse(raw ?? '{}');
    expect(stored.state.unsyncedStepIds).toEqual(['intent']);
  });
});

describe('draft ownership', () => {
  const otherSession = { ...session, user_id: 'usr_2', access_token: 'access_2' };

  it('drops a draft left behind by another account', async () => {
    useOnboardingStore.getState().setAnswers({ name: 'Deniz' });
    useOnboardingStore.getState().setActiveStep('intent');
    await useAuthStore.getState().startSession(session);
    await useAuthStore.getState().endSession();

    await useAuthStore.getState().startSession(otherSession);

    expect(useOnboardingStore.getState().answers).toEqual({});
    expect(useOnboardingStore.getState().activeStepId).toBeNull();
  });

  it('keeps the draft when the same account signs in again', async () => {
    await useAuthStore.getState().startSession(session);
    useOnboardingStore.getState().setAnswers({ name: 'Deniz' });
    useOnboardingStore.getState().setActiveStep('intent');
    await useAuthStore.getState().endSession();

    await useAuthStore.getState().startSession(session);

    expect(useOnboardingStore.getState().answers.name).toBe('Deniz');
    expect(useOnboardingStore.getState().activeStepId).toBe('intent');
  });

  it('drops a draft that names no owner, because it predates ownership', async () => {
    // Surum yukseltmesinde diskte kalmis bir taslak: sahibi bilinmiyor ve
    // bilinmeyen bir sahip, yanlis kisiye acilmaktansa kaybedilir.
    useOnboardingStore.getState().setAnswers({ name: 'Deniz' });
    useOnboardingStore.setState({ ownerId: null });

    await useAuthStore.getState().startSession(session);

    expect(useOnboardingStore.getState().answers).toEqual({});
  });

  it('drops an unowned draft whose answers are empty but whose place is not', async () => {
    // Bir surum onceki kayitta cevap yok ama akista bir yer, tamamlanmis
    // adimlar ve gonderilmemis adimlar olabilir. Gonderilmemis adimlar
    // kapanista sunucuya yaziliyor: yabancinin isaretleri yeni hesabin
    // profiline gidiyordu.
    useOnboardingStore.setState({
      ownerId: null,
      activeStepId: 'photos',
      completedStepIds: ['name', 'intent'],
      unsyncedStepIds: ['intent'],
    });

    await useAuthStore.getState().startSession(session);

    expect(useOnboardingStore.getState().activeStepId).toBeNull();
    expect(useOnboardingStore.getState().completedStepIds).toEqual([]);
    expect(useOnboardingStore.getState().unsyncedStepIds).toEqual([]);
  });

  it('claims the draft before the new session becomes visible', async () => {
    // Sira onemli: ekran yeni oturumu gordugu anda yabancinin cevaplarini
    // cizmeye baslayabilir. Sahiplendirme oturum gorunur olmadan bitmeli.
    useOnboardingStore.setState({ ownerId: 'usr_2' });
    useOnboardingStore.getState().setAnswers({ name: 'Baskasinin adi' });

    let answersWhenSessionAppeared: unknown;
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state.status === 'authenticated' && answersWhenSessionAppeared === undefined) {
        answersWhenSessionAppeared = useOnboardingStore.getState().answers;
      }
    });

    await useAuthStore.getState().startSession(session);
    unsubscribe();

    expect(answersWhenSessionAppeared).toEqual({});
  });

  it('drops a half-finished upload marker left by the previous owner', async () => {
    useOnboardingStore.setState({ ownerId: 'usr_2' });
    usePhotoTransfers.getState().mark(1, 'failed');

    await useAuthStore.getState().startSession(session);

    // Yeni hesap, oncekinin "yuklenemedi" kutusunu gormemeli.
    expect(usePhotoTransfers.getState().transfers.size).toBe(0);
  });

  it('leaves an empty draft alone, whoever signs in', async () => {
    await useAuthStore.getState().startSession(session);

    expect(useOnboardingStore.getState().ownerId).toBe('usr_1');
    expect(useOnboardingStore.getState().answers).toEqual({});
  });

  it('remembers the owner across a relaunch', async () => {
    await useAuthStore.getState().startSession(session);
    useOnboardingStore.getState().setAnswers({ name: 'Deniz' });

    await whenDraftHydrated();
    const stored = JSON.parse((await AsyncStorage.getItem(storageKeys.onboardingDraft)) ?? '{}');

    expect(stored.state.ownerId).toBe('usr_1');
  });
});
