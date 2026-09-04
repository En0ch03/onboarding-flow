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

export type UploadedPhoto = { id: string; url: string };

export async function uploadPhoto(uri: string): Promise<UploadedPhoto> {
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
