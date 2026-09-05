import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { z } from 'zod';

import { api } from './client';

/**
 * Yukleme dikisi.
 *
 * Sozlesmede dosya yukleme uc noktasi yok ve `Content-Type` JSON'a sabit;
 * profilde ise doldurulmasi beklenen bir gorsel alani var. Bu celiskinin
 * cozumu sorulmus durumda. Cevap gelene kadar mekanizma tek bir fonksiyonun
 * arkasinda duruyor: degistiginde degisecek dosya bu.
 */
const UploadResponseSchema = z.object({ url: z.string() });

/** Ham telefon fotografi birkac megabayt; oldugu gibi gondermek adimi kullanilamaz kiliyor. */
const MAX_EDGE = 1440;
const QUALITY = 0.8;
const UPLOAD_TIMEOUT_MS = 45000;
/**
 * Hazirlama ile gondermenin toplami icin ust sinir. Gondermenin kendi zaman
 * asimi var; hazirlamanin yok ve iptal de edilemiyor. Sonuclanmayan bir
 * hazirlama, kutuyu sonsuza kadar "yukleniyor"da birakiyordu: dokunulamiyor,
 * yeniden denenemiyor. Bekleyen her isin bir cikisi olmali.
 */
const UPLOAD_DEADLINE_MS = 60000;

export type UploadedPhoto = { id: string; url: string };

export function uploadPhoto(uri: string): Promise<UploadedPhoto> {
  return withDeadline(prepareAndSend(uri), UPLOAD_DEADLINE_MS);
}

function withDeadline<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('upload deadline passed')), ms);
  });
  return Promise.race([work, deadline]).finally(() => clearTimeout(timer));
}

async function prepareAndSend(uri: string): Promise<UploadedPhoto> {
  const prepared = await manipulateAsync(uri, [{ resize: { width: MAX_EDGE } }], {
    compress: QUALITY,
    format: SaveFormat.JPEG,
  });

  const form = new FormData();
  form.append('file', {
    uri: prepared.uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
    // React Native'in FormData dosya girdisi web'deki `File` ile ayni sekle
    // sahip degil; tip burada bilerek gevsetildi.
  } as unknown as Blob);

  const response = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // Yukleme diger isteklerden uzun surer; genel zaman asimi burada gecerli olmamali.
    timeout: UPLOAD_TIMEOUT_MS,
  });

  const { url } = UploadResponseSchema.parse(response.data);
  return { id: url, url };
}
