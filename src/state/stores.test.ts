import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { storageKeys } from '@/storage/keys';

import { authBridge, useAuthStore } from './authStore';
import { useOnboardingStore, whenDraftHydrated } from './onboardingStore';
import { usePhotoTransfers } from '@/features/onboarding/steps/photoTransfers';

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
    useOnboardingStore.getState().setAnswers({ name: 'Deniz' });
    await useAuthStore.getState().startSession(session);
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
