import { z } from 'zod';

/**
 * Sunucudan gelen her yanit uygulamaya girmeden once burada dogrulanir.
 * Bir alan `null` geldigi icin ekran bozuluyorsa bu bizim hatamiz; sinir
 * kontrolu o hatanin olusabilecegi tek yeri tek dosyaya indiriyor.
 *
 * Tipler semadan turetilir. Elle yazilan ikinci bir tip, semayla ayrisan bir
 * ikinci gercek kaynak demek olurdu.
 */

/* ------------------------------------------------------------------ */
/* Kimlik dogrulama                                                    */
/* ------------------------------------------------------------------ */

export const CredentialsSchema = z.object({
  email: z.string(),
  password: z.string(),
});

/** Kayit ve giris ayni govdeyi donduruyor; tek sema ikisini de karsiliyor. */
export const AuthSessionSchema = z.object({
  user_id: z.string(),
  access_token: z.string(),
  refresh_token: z.string(),
  onboarding_complete: z.boolean(),
});

export const RefreshRequestSchema = z.object({
  refresh_token: z.string(),
});

/**
 * Yenileme yalnizca yeni bir access token donduruyor; refresh token donmuyor.
 * Yine de yenileme kodu rotasyona dayanikli yazildi: sunucu ileride rotasyona
 * gecerse istemci degismeden calismaya devam etsin.
 */
export const RefreshResponseSchema = z.object({
  access_token: z.string(),
});

/* ------------------------------------------------------------------ */
/* Profil                                                              */
/* ------------------------------------------------------------------ */

/**
 * `preferences` sunucuda opak saklaniyor ve icerigi sozlesmede tanimli degil.
 * Bilmedigimiz anahtarlar tolere edilir: sunucunun alan eklemesi istemcinin
 * bozulmasi anlamina gelmemeli.
 */
export const PreferencesSchema = z.record(z.string(), z.unknown());

/**
 * Ust duzeyde de gevsek: sozlesmede olmayan bir alanin eklenmesi yaniti
 * gecersiz kilmaz, yalnizca gormezden gelinir.
 */
export const ProfileSchema = z.looseObject({
  user_id: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  preferences: PreferencesSchema,
  onboarding_complete: z.boolean(),
});

/** Kismi profil govdesi: sozlesme yalnizca bu uc alani yazilabilir birakiyor. */
export const ProfilePatchSchema = z.object({
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  preferences: PreferencesSchema.optional(),
});

export const CompletionResponseSchema = z.object({
  onboarding_complete: z.literal(true),
});

/* ------------------------------------------------------------------ */
/* Hata govdeleri                                                      */
/* ------------------------------------------------------------------ */

/** Sozlesmede adi gecen kodlar. Liste kapali degil; bilinmeyen kod tolere edilir. */
export const knownErrorCodes = [
  'email_taken',
  'validation_failed',
  'invalid_credentials',
  'refresh_expired',
] as const;

/**
 * `error` bilerek serbest dizge: sunucunun sozlesmede olmayan bir kod
 * dondurmesi, yanitin ayristirilamamasindan iyi. Bilinmeyen kod, alan bazli
 * geri dusus mesajiyla karsilanir.
 */
export const ApiErrorBodySchema = z.object({
  error: z.string(),
  fields: z.record(z.string(), z.string()).optional(),
});

/* ------------------------------------------------------------------ */
/* Secenek listeleri                                                   */
/* ------------------------------------------------------------------ */

/**
 * Secenekler sunucudan gelir; istemci yalnizca bu sekli bilir. Hangi
 * seceneklerin var oldugunu, sirasini, etiketini ve kac tane secilebilecegini
 * sunucu belirler. Bu taksonomiler bolgeye ve zamana gore degisiyor ve her
 * degisiklik yeni bir uygulama surumu gerektirmemeli.
 *
 * Sozlesmede bu uc nokta yok; talep edildi ve cevap gelene kadar gelistirme
 * sunucusundan servis ediliyor.
 */
export const OptionSchema = z.object({
  /** Sunucuya geri gonderilen deger. */
  id: z.string(),
  /** Kullaniciya gosterilen metin. */
  label: z.string(),
  /** Karti aciklayan ikinci satir. */
  hint: z.string().optional(),
  /**
   * Bu secenek isaretlendiginde acilan secenek grubu. "Arkadaslik" cevabi
   * ilgi alanlarinin baska bir setini aciyor.
   *
   * Iliski burada duruyor cunku istemcinin hangi cevabin hangi listeyi
   * actigini bilmesi, listeyi sunucudan alip anlamini gomulu birakmak olurdu:
   * sunucu kimligi degistirdiginde kosullu liste sessizce kapanirdi.
   */
  unlocks: z.string().optional(),
  order: z.number().optional(),
});

export const OptionGroupSchema = z.object({
  key: z.string(),
  multiSelect: z.boolean(),
  maxSelection: z.number().nullable(),
  required: z.boolean(),
  options: z.array(OptionSchema),
});

export const OptionGroupsSchema = z.record(z.string(), OptionGroupSchema);

/* ------------------------------------------------------------------ */
/* Turetilen tipler                                                    */
/* ------------------------------------------------------------------ */

export type Credentials = z.infer<typeof CredentialsSchema>;
export type AuthSession = z.infer<typeof AuthSessionSchema>;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type ProfilePatch = z.infer<typeof ProfilePatchSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
export type CompletionResponse = z.infer<typeof CompletionResponseSchema>;
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;
export type Option = z.infer<typeof OptionSchema>;
export type OptionGroup = z.infer<typeof OptionGroupSchema>;
export type OptionGroups = z.infer<typeof OptionGroupsSchema>;
