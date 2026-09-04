import { isAxiosError } from 'axios';
import { ZodError } from 'zod';

import { ApiErrorBodySchema } from './schemas';

/**
 * Her hata bu ayrik birlesimden birine duser.
 *
 * Taksonomi kod yazilirken degil onceden tasarlandi. Hatalar sirayla akla
 * geldikce ele alindiginda sonuc tutarsiz oluyor: bir ekranda alan alti mesaj,
 * digerinde bir bildirim, ucuncusunde hicbir sey. Turleri onden sabitlemek bu
 * tutarsizligi yapisal olarak imkansiz kiliyor.
 *
 * Ayni tablo test matrisi ve gelistirme sunucusunun kaos senaryolari olarak da
 * kullaniliyor; uc kullanim tek kaynaktan besleniyor.
 */
export type ApiError =
  | { kind: 'email_taken' }
  | { kind: 'validation_failed'; fields: Record<string, string> }
  | { kind: 'invalid_credentials' }
  | { kind: 'refresh_expired' }
  | { kind: 'server_error' }
  | { kind: 'network' }
  /**
   * Sunucu sozlesmeye uymayan bir sey dondurdu. Ayri bir tur olarak
   * modellenmesi kullanicinin cokme yerine anlamli bir hata gormesini
   * sagliyor.
   *
   * `detail` bugun hicbir yere ulasmiyor: uygulamada gunluk yok ve
   * kullaniciya teknik metin gosterilmiyor. Yine de tasiniyor, cunku
   * hatanin nerede uretildigini kaynakta okumak icin tek isaret bu -- ve
   * bir gunluk katmani geldiginde tasinacak veri hazir olsun diye.
   */
  | { kind: 'unexpected_response'; detail: string };

export type ApiErrorKind = ApiError['kind'];

function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && 'kind' in value;
}

/**
 * Firlatilan her degeri tek bir bicime indirger. Ekranlar durum kodu, axios
 * nesnesi veya ham sunucu metni gormez.
 */
export function normalizeApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  // Sema dogrulamasi burada bitiyor: yanit ayristirilamadiysa sunucu
  // sozlesmeden sapmis demektir.
  if (error instanceof ZodError) {
    return { kind: 'unexpected_response', detail: error.issues[0]?.message ?? 'schema mismatch' };
  }

  if (isAxiosError(error)) {
    // Yanit yoksa istek sunucuya hic ulasmadi ya da zaman asimina ugradi.
    if (!error.response) return { kind: 'network' };

    const { status, data } = error.response;
    const body = ApiErrorBodySchema.safeParse(data);
    const code = body.success ? body.data.error : null;

    if (status >= 500) return { kind: 'server_error' };

    if (status === 409 && code === 'email_taken') return { kind: 'email_taken' };

    if (status === 422 && code === 'validation_failed') {
      return { kind: 'validation_failed', fields: body.data?.fields ?? {} };
    }

    if (status === 401) {
      if (code === 'invalid_credentials') return { kind: 'invalid_credentials' };
      // Yenileme de basarisiz olduysa oturum gercekten bitti. Erisim
      // token'inin suresinin dolmasi buraya kadar gelmez; istemci onu
      // gorunmez sekilde yeniliyor.
      return { kind: 'refresh_expired' };
    }

    // Sozlesmede olmayan bir durum kodu: sunucu tarafinda bir sapma.
    return { kind: 'unexpected_response', detail: `unexpected status ${status}` };
  }

  return { kind: 'unexpected_response', detail: 'unknown failure' };
}
