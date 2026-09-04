/**
 * Depolama anahtarlari surumlu.
 *
 * Saklanan bir seyin sekli degistiginde eski kayit okunamaz hale gelir.
 * Surumu anahtarin icine koymak, o ani bir cokme yerine bir gecise
 * cevirebilmeyi mumkun kiliyor: eski anahtar okunur, tasinir, silinir.
 */
export const storageKeys = {
  accessToken: 'onboarding.auth.access_token.v1',
  refreshToken: 'onboarding.auth.refresh_token.v1',
  onboardingDraft: 'onboarding.onboarding.draft.v1',
} as const;
