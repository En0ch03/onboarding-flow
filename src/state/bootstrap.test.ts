import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosError, AxiosHeaders } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { storageKeys } from '@/storage/keys';

import { useAuthStore } from './authStore';
import { adoptServerProfile, bootstrap } from './bootstrap';
import { steps } from '@/features/onboarding/steps/steps';

import type { DraftAnswers } from './onboardingStore';
import { useOnboardingStore } from './onboardingStore';

jest.mock('@/api/endpoints', () => ({ fetchProfile: jest.fn() }));
jest.mock('@/api/config', () => ({
  fetchOptionGroups: jest.fn(),
  readCachedOptionGroups: jest.fn(() => null),
}));

const { fetchProfile } = jest.requireMock('@/api/endpoints');
const { fetchOptionGroups, readCachedOptionGroups } = jest.requireMock('@/api/config');

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

describe('sunucudan dusen secenekler', () => {
  const groups = {
    intent: {
      key: 'intent',
      multiSelect: true,
      maxSelection: 2,
      required: true,
      options: [{ id: 'long_term', label: 'Uzun soluklu' }],
    },
  };

  it('cevabi dusen adim yeniden soruluyor', async () => {
    await signIn();
    fetchOptionGroups.mockResolvedValue(groups);
    readCachedOptionGroups.mockReturnValue(groups);
    fetchProfile.mockResolvedValue({
      ...incompleteProfile,
      preferences: { intent: ['kaldirilmis'] },
    });
    // Kullanici akisin sonundaydi ve niyet adimini tamamlamis sayiliyordu.
    useOnboardingStore.setState({ activeStepId: 'interests', completedStepIds: ['intent'] });

    await bootstrap();

    // Yalnizca cevabi dusurmek yetmiyordu: tamamlanmis isaret yerinde kalinca
    // kullanici o adimi hic gormeden akisi bitirebiliyordu.
    const state = useOnboardingStore.getState();
    expect(state.answers.intent).toEqual([]);
    expect(state.activeStepId).toBe('intent');
    expect(state.completedStepIds).not.toContain('intent');
  });

  it('hicbir cevap dusmediyse kullanici yerinde kaliyor', async () => {
    await signIn();
    fetchOptionGroups.mockResolvedValue(groups);
    readCachedOptionGroups.mockReturnValue(groups);
    fetchProfile.mockResolvedValue({
      ...incompleteProfile,
      preferences: { intent: ['long_term'] },
    });
    useOnboardingStore.setState({ activeStepId: 'photos', completedStepIds: ['intent'] });

    await bootstrap();

    // Her acilista geri sarmak, akisin ortasindaki birini nedensiz geriye atardi.
    expect(useOnboardingStore.getState().activeStepId).toBe('photos');
  });

  it('artik sunulmayan bir cevap acilista taslaktan dusuyor', async () => {
    await signIn();
    fetchOptionGroups.mockResolvedValue(groups);
    readCachedOptionGroups.mockReturnValue(groups);
    fetchProfile.mockResolvedValue({
      ...incompleteProfile,
      preferences: { intent: ['long_term', 'kaldirilmis'] },
    });

    await bootstrap();

    // Kalan hayalet kimlik, ekranda hicbir sey secili gorunmezken adimi
    // tamamlanmis gosteriyor ve sunucuya geri yaziliyordu.
    expect(useOnboardingStore.getState().answers.intent).toEqual(['long_term']);
  });

  it('liste hic gelmediyse cevaba dokunulmuyor', async () => {
    await signIn();
    fetchOptionGroups.mockRejectedValue(new Error('offline'));
    readCachedOptionGroups.mockReturnValue(null);
    fetchProfile.mockResolvedValue({
      ...incompleteProfile,
      preferences: { intent: ['long_term', 'bilinmeyen'] },
    });

    await bootstrap();

    expect(useOnboardingStore.getState().answers.intent).toEqual(['long_term', 'bilinmeyen']);
  });
});

describe('adoptServerProfile', () => {
  it('cevaplarin isaret ettigi adimdan devam ediyor', async () => {
    // Cevaplari almak yetmiyor: yer alinmazsa ekran "Adim 1 / 5"te aciliyor
    // ve kullanici doldurulmus adimlari tek tek geciyor.
    await signIn();
    readCachedOptionGroups.mockReturnValue({});
    fetchProfile.mockResolvedValue({
      ...incompleteProfile,
      preferences: {
        birth_date: { day: '14', month: '3', year: '1996' },
        gender: 'woman',
        audience: ['everyone'],
      },
    });

    await adoptServerProfile();

    // Ilk iki adim dolu; devam edilecek yer ucuncusu.
    expect(useOnboardingStore.getState().activeStepId).toBe('intent');
  });

  it('cihazdaki yeri sunucu cevabiyla geri almiyor', async () => {
    // Kullanicinin en son durdugu nokta cihazda; sunucudaki cevaplar onu
    // geri sarmamali.
    await signIn();
    readCachedOptionGroups.mockReturnValue({});
    useOnboardingStore.getState().setActiveStep('photos');
    fetchProfile.mockResolvedValue(incompleteProfile);

    await adoptServerProfile();

    expect(useOnboardingStore.getState().activeStepId).toBe('photos');
  });

  it('brings answers given on another device into the draft', async () => {
    // Giris yolu bu cagriyi bir sure hic yapmiyordu: yeni bir telefona
    // giren kullanici cevaplarini gormuyordu.
    await signIn();
    fetchProfile.mockResolvedValue(incompleteProfile);

    const adoption = await adoptServerProfile();

    expect(adoption).toBe('in-progress');
    expect(useOnboardingStore.getState().answers.intent).toEqual(['long_term']);
    expect(useOnboardingStore.getState().answers.name).toBe('Deniz');
  });

  it('reports a finished profile and drops the local draft', async () => {
    await signIn();
    useOnboardingStore.getState().setAnswers({ name: 'Eski' });
    fetchProfile.mockResolvedValue({ ...incompleteProfile, onboarding_complete: true });

    expect(await adoptServerProfile()).toBe('complete');
    expect(useOnboardingStore.getState().answers).toEqual({});
    expect(useAuthStore.getState().onboardingComplete).toBe(true);
  });

  it('reports a lost session rather than swallowing it', async () => {
    await signIn();
    fetchProfile.mockRejectedValue(unauthorised());

    expect(await adoptServerProfile()).toBe('session-lost');
  });

  it('okunamayan bir profilden sonra yer yazmiyor', async () => {
    // Basarisiz bir okumadan sonra yer kurmak, uygulamanin kendi yazdigi bir
    // yer tutucuyu diske yaziyordu; sonraki acilista cevaplar dolu gelse
    // bile "cihazda bir yer var" denip birinci adimda kalinirdi.
    await signIn();
    readCachedOptionGroups.mockReturnValue({});
    fetchProfile.mockRejectedValue(new AxiosError('offline'));

    await adoptServerProfile();

    expect(useOnboardingStore.getState().activeStepId).toBeNull();
  });

  it('drops a draft owned by another account on a cold launch', async () => {
    // Soguk acilista oturum token'lardan geri geliyor ve bir kullanici
    // kimligi tasimiyor; sahibi ogrenebilecegimiz tek yer profilin kendisi.
    useOnboardingStore.setState({ ownerId: 'usr_2' });
    useOnboardingStore.getState().setAnswers({ name: 'Baskasinin adi' });
    useAuthStore.setState({ status: 'authenticated' });
    fetchProfile.mockResolvedValue(incompleteProfile);

    await adoptServerProfile();

    expect(useOnboardingStore.getState().answers.name).toBe('Deniz');
    expect(useOnboardingStore.getState().ownerId).toBe('usr_1');
  });

  it('keeps a draft the launching account already owns', async () => {
    useOnboardingStore.setState({ ownerId: 'usr_1' });
    useOnboardingStore.getState().setAnswers({ interests: ['music'] });
    useAuthStore.setState({ status: 'authenticated' });
    fetchProfile.mockResolvedValue(incompleteProfile);

    await adoptServerProfile();

    // Sunucuda karsiligi olmayan yerel cevap, sahibi ayni oldugu icin duruyor.
    expect(useOnboardingStore.getState().answers.interests).toEqual(['music']);
  });

  it('does not let the server overwrite a step that has not been sent yet', async () => {
    // Cevrimdisi verilen bir cevap, sunucuya yazilamadigi icin bekleyenler
    // listesinde duruyor. Acilista sunucudaki eski deger onun ustune
    // yazilirsa, kullanici degisikligini sessizce kaybediyor.
    await signIn();
    useOnboardingStore.getState().setAnswers({ intent: ['friendship'] });
    useOnboardingStore.getState().markStepUnsynced('intent');
    fetchProfile.mockResolvedValue(incompleteProfile);

    await adoptServerProfile();

    expect(useOnboardingStore.getState().answers.intent).toEqual(['friendship']);
  });

  it('lets the server win on a step that has been sent', async () => {
    // Bekleyen olmayan bir alanda sunucu kazanmaya devam ediyor: baska bir
    // cihazdan verilmis yeni cevap, buradaki eskiyi gecmeli.
    await signIn();
    useOnboardingStore.getState().setAnswers({ intent: ['friendship'] });
    fetchProfile.mockResolvedValue(incompleteProfile);

    await adoptServerProfile();

    expect(useOnboardingStore.getState().answers.intent).toEqual(['long_term']);
  });

  it('adopts a field the server has and the device does not, even while another step waits', async () => {
    await signIn();
    useOnboardingStore.getState().setAnswers({ interests: ['music'] });
    useOnboardingStore.getState().markStepUnsynced('interests');
    fetchProfile.mockResolvedValue(incompleteProfile);

    await adoptServerProfile();

    expect(useOnboardingStore.getState().answers.interests).toEqual(['music']);
    // Bekleyen adim yalnizca kendi alanlarini koruyor, digerlerini degil.
    expect(useOnboardingStore.getState().answers.intent).toEqual(['long_term']);
  });

  // Sunucunun her alanda bir cevabi var ve hepsi yereldekinden farkli.
  // Bir alan burada eksik kalirsa o alanin korunup korunmadigi sinanamaz:
  // sunucu zaten bir sey gondermiyorsa ezilecek bir sey de yoktur.
  const fullProfile = {
    user_id: 'usr_1',
    display_name: 'Sunucudaki ad',
    avatar_url: null,
    preferences: {
      birth_date: { day: '02', month: '02', year: '1980' },
      gender: 'man',
      audience: ['women'],
      intent: ['long_term'],
      interests: ['cinema'],
      photos: [{ id: 'sunucu', url: 'https://example.test/sunucu.jpg' }],
    },
    onboarding_complete: false,
  };

  const localAnswers: DraftAnswers = {
    name: 'Cihazdaki ad',
    birthDate: { day: '01', month: '01', year: '1990' },
    gender: 'woman',
    audience: ['men'],
    intent: ['friendship'],
    interests: ['music'],
    photos: [{ id: 'cihaz', url: 'https://example.test/cihaz.jpg' }],
  };

  // Beklenen alan listesi burada elle yaziliyor, sinanan eslemeden
  // uretilmiyor. Uretilseydi eslemeden bir alan dusuruldugunde test o alani
  // aramaktan da vazgecer ve yesil kalirdi.
  const fieldsOfStep: Record<string, (keyof DraftAnswers)[]> = {
    identity: ['name', 'birthDate'],
    audience: ['gender', 'audience'],
    intent: ['intent'],
    photos: ['photos'],
    interests: ['interests'],
  };

  it('covers the whole flow with the expected field table', () => {
    expect(steps.map((step) => step.id).sort()).toEqual(Object.keys(fieldsOfStep).sort());
  });

  it.each(Object.entries(fieldsOfStep))(
    'protects every field of the waiting step %s',
    async (stepId, fields) => {
      await signIn();
      useOnboardingStore.getState().setAnswers(localAnswers);
      useOnboardingStore.getState().markStepUnsynced(stepId);
      fetchProfile.mockResolvedValue(fullProfile);

      await adoptServerProfile();

      const after = useOnboardingStore.getState().answers;
      for (const field of fields) {
        expect(`${field}: ${JSON.stringify(after[field])}`).toBe(
          `${field}: ${JSON.stringify(localAnswers[field])}`,
        );
      }
    },
  );

  it.each(Object.entries(fieldsOfStep))(
    'lets the server win on step %s once it has been sent',
    async (stepId, fields) => {
      await signIn();
      useOnboardingStore.getState().setAnswers(localAnswers);
      fetchProfile.mockResolvedValue(fullProfile);

      await adoptServerProfile();

      const after = useOnboardingStore.getState().answers;
      for (const field of fields) {
        expect(`${field}: ${JSON.stringify(after[field])}`).not.toBe(
          `${field}: ${JSON.stringify(localAnswers[field])}`,
        );
      }
    },
  );

  it('keeps the local draft when the profile cannot be read', async () => {
    // Baglantiyi kaybetmek, cihazdaki cevaplara mal olmamali.
    await signIn();
    useOnboardingStore.getState().setAnswers({ name: 'Deniz' });
    fetchProfile.mockRejectedValue(new AxiosError('offline'));

    expect(await adoptServerProfile()).toBe('in-progress');
    expect(useOnboardingStore.getState().answers.name).toBe('Deniz');
  });
});
