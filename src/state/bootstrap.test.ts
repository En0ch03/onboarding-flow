import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosError, AxiosHeaders } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { storageKeys } from '@/storage/keys';

import { useAuthStore } from './authStore';
import { bootstrap } from './bootstrap';
import { useOnboardingStore } from './onboardingStore';

jest.mock('@/api/endpoints', () => ({ fetchProfile: jest.fn() }));
jest.mock('@/api/config', () => ({
  fetchOptionGroups: jest.fn(),
  readCachedOptionGroups: jest.fn(() => null),
}));

const { fetchProfile } = jest.requireMock('@/api/endpoints');
const { fetchOptionGroups } = jest.requireMock('@/api/config');

const incompleteProfile = {
  user_id: 'usr_1',
  display_name: 'Deniz',
  avatar_url: null,
  preferences: { intent: ['long_term'] },
  onboarding_complete: false,
};

function unauthorised() {
  const error = new AxiosError('unauthorised');
  error.response = {
    status: 401,
    data: { error: 'refresh_expired' },
    statusText: '',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

async function signIn() {
  await useAuthStore.getState().startSession({
    user_id: 'usr_1',
    access_token: 'access_1',
    refresh_token: 'refresh_1',
    onboarding_complete: false,
  });
}

beforeEach(async () => {
  jest.clearAllMocks();
  fetchOptionGroups.mockResolvedValue({});

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
  useOnboardingStore.setState({ hydrated: true });
});

describe('bootstrap', () => {
  it('sends a launch with no session to the welcome screens', async () => {
    const result = await bootstrap();

    expect(result.destination).toBe('welcome');
    expect(fetchProfile).not.toHaveBeenCalled();
  });

  it('waits for the draft before deciding anything', async () => {
    useOnboardingStore.setState({ hydrated: false });
    await signIn();
    fetchProfile.mockResolvedValue(incompleteProfile);

    let settled = false;
    const pending = bootstrap().then((result) => {
      settled = true;
      return result;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    useOnboardingStore.setState({ hydrated: true });
    const result = await pending;
    expect(result.destination).toBe('onboarding');
  });

  it('lands in the app and drops the local draft when the server says the flow is finished', async () => {
    await signIn();
    useOnboardingStore.getState().setAnswers({ name: 'Stale' });
    useOnboardingStore.getState().setActiveStep('photos');
    fetchProfile.mockResolvedValue({ ...incompleteProfile, onboarding_complete: true });

    const result = await bootstrap();

    expect(result.destination).toBe('app');
    expect(useOnboardingStore.getState().answers).toEqual({});
    expect(useAuthStore.getState().onboardingComplete).toBe(true);
  });

  it('resumes the flow with the server winning any disagreement', async () => {
    await signIn();
    useOnboardingStore.getState().setAnswers({ name: 'Stale', interests: ['coffee'] });
    useOnboardingStore.getState().setActiveStep('intent');
    fetchProfile.mockResolvedValue(incompleteProfile);

    const result = await bootstrap();

    expect(result).toMatchObject({ destination: 'onboarding', resumeStepId: 'intent' });
    expect(useOnboardingStore.getState().answers.name).toBe('Deniz');
    // Sunucunun bilmedigi bir cevap silinmiyor, yalnizca bildikleri kazaniyor.
    expect(useOnboardingStore.getState().answers.interests).toEqual(['coffee']);
    expect(useOnboardingStore.getState().answers.intent).toEqual(['long_term']);
  });

  it('still resumes the flow when the profile call fails', async () => {
    await signIn();
    useOnboardingStore.getState().setAnswers({ name: 'Deniz' });
    useOnboardingStore.getState().setActiveStep('audience');
    fetchProfile.mockRejectedValue(new AxiosError('timeout of 10000ms exceeded'));

    const result = await bootstrap();

    expect(result).toMatchObject({ destination: 'onboarding', resumeStepId: 'audience' });
    expect(useOnboardingStore.getState().answers.name).toBe('Deniz');
  });

  it('returns to the welcome screens but keeps the draft when the session is over', async () => {
    await signIn();
    useOnboardingStore.getState().setAnswers({ name: 'Deniz' });
    fetchProfile.mockRejectedValue(unauthorised());

    const result = await bootstrap();

    expect(result.destination).toBe('welcome');
    expect(useOnboardingStore.getState().answers.name).toBe('Deniz');
  });

  it('reports that the option lists never arrived', async () => {
    fetchOptionGroups.mockRejectedValue(new AxiosError('offline'));

    const result = await bootstrap();

    expect(result.optionsAvailable).toBe(false);
  });
});
