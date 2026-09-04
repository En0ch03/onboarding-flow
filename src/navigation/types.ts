/**
 * Rota parametreleri tek yerde: bir ekranin bekledigi veri degistiginde
 * cagiran taraf derleme zamaninda haberdar olur.
 */
export type AuthStackParamList = {
  WelcomePromise: undefined;
  WelcomeDifference: undefined;
  Register: undefined;
  /** Kayittan gelindiyse adres tasinir; kullanici tekrar yazmaz. */
  Login: { email?: string } | undefined;
};
