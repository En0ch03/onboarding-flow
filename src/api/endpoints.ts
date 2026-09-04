import { api } from './client';
import {
  AuthSessionSchema,
  CompletionResponseSchema,
  ProfileSchema,
  type AuthSession,
  type CompletionResponse,
  type Credentials,
  type Profile,
  type ProfilePatch,
} from './schemas';

/**
 * Sozlesmedeki alti uc nokta. Her biri yaniti kendi semasindan geciriyor:
 * dogrulanmamis bir govde uygulamanin icine hic girmiyor.
 *
 * Yenileme burada yok cunku uygulama kodu onu hic cagirmiyor; istemcinin
 * icinde, kullaniciya gorunmeden yurutuluyor.
 */

export async function register(credentials: Credentials): Promise<AuthSession> {
  const response = await api.post('/auth/register', credentials);
  return AuthSessionSchema.parse(response.data);
}

export async function login(credentials: Credentials): Promise<AuthSession> {
  const response = await api.post('/auth/login', credentials);
  return AuthSessionSchema.parse(response.data);
}

export async function fetchProfile(): Promise<Profile> {
  const response = await api.get('/profile');
  return ProfileSchema.parse(response.data);
}

/**
 * Kismi govde gonderiliyor: her adim kendi cevabini yaziyor, tek buyuk bir
 * gonderim yok. Boylece akis ortasinda kesilse bile sunucu tarafi guncel kalir.
 */
export async function patchProfile(patch: ProfilePatch): Promise<Profile> {
  const response = await api.patch('/profile', patch);
  return ProfileSchema.parse(response.data);
}

export async function completeOnboarding(): Promise<CompletionResponse> {
  const response = await api.post('/onboarding/complete');
  return CompletionResponseSchema.parse(response.data);
}
