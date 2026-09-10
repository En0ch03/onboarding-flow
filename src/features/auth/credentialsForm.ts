import { strings } from '@/constants/strings';
import { z } from 'zod';

/**
 * Istemci tarafi dogrulama.
 *
 * Sunucu da ayni kurallari uyguluyor; buradaki kontrol onun yerine gecmiyor,
 * kullaniciyi bir ag turu beklemekten kurtariyor.
 *
 * Sifre kurali yalnizca uzunluk. Zorunlu karakter siniflari (buyuk harf,
 * rakam, sembol) olculebilir bir guvenlik kazanci saglamadan tahmin edilebilir
 * kaliplar uretiyor ve guncel rehberler bu zorunlulugu birakti. Uzunluk
 * kaliyor cunku etkisi olan tek degisken o.
 */
export const MIN_PASSWORD_LENGTH = 8;

export const credentialsFormSchema = z.object({
  email: z
    .string()
    // Bastaki ve sondaki bosluk kullanicinin hatasi degil, klavyenin;
    // reddetmek yerine temizleniyor.
    .trim()
    .min(1, 'E-posta adresini yazman gerekiyor.')
    .email(strings.auth.emailInvalid),
  password: z.string().min(MIN_PASSWORD_LENGTH, strings.auth.passwordTooShort(MIN_PASSWORD_LENGTH)),
});

export type CredentialsForm = z.infer<typeof credentialsFormSchema>;

/**
 * Kayit formu ayni ikiliye bir ucuncu alan ekliyor: sifrenin dogrulanmasi.
 *
 * Urunde sifre sifirlama yolu yok. Yanlis yazilmis tek bir sifre, hesabi ilk
 * girisin ardindan erisilemez birakiyor ve kullanicinin bunu ogrendigi an
 * cok gec oluyor. Gorunurluk anahtari yaziyi gosteriyor ama gosterilen seye
 * bakmayan bir kullaniciyi durdurmuyor; iki alan durduruyor.
 *
 * Hata ikinci alanin yoluna yaziliyor: duzeltmenin yapilacagi yer orasi.
 */
export const registerFormSchema = credentialsFormSchema
  .extend({ confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: strings.auth.passwordMismatch,
  });

export type RegisterForm = z.infer<typeof registerFormSchema>;
