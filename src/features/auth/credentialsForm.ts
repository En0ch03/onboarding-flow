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
    .email('Bu e-posta adresi geçerli görünmüyor. Yazımını kontrol eder misin?'),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Şifren çok kısa. En az ${MIN_PASSWORD_LENGTH} karakter olmalı.`),
});

export type CredentialsForm = z.infer<typeof credentialsFormSchema>;
