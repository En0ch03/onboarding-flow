import type { UploadedPhoto } from '@/api/media';

/** Bir kutunun devam eden isi: yukleniyor ya da yuklenemedi. */
export type Transfer = 'pending' | 'failed';

/** Kutu -> devam eden is. Anahtar izgaradaki yer, dizideki sira degil. */
export type Transfers = ReadonlyMap<number, Transfer>;

export type Slot =
  /** `position`, cevaptaki dizideki sirasi: silme ve degistirme onu kullaniyor. */
  | { kind: 'photo'; photo: UploadedPhoto; position: number }
  | { kind: 'pending' }
  | { kind: 'failed' }
  /** Siradaki bos kutu; dokunulabilen tek bos kutu bu. */
  | { kind: 'open' }
  /** Henuz sirasi gelmemis bos kutu. */
  | { kind: 'locked' };

/**
 * Izgaranin tek dogru kaynagi.
 *
 * Fotograflar sirali bir liste ve yeni gelen sona ekleniyor. Bunun bedeli,
 * bos bir kutu atlanarak doldurulmaya calisildiginda fotografin baska bir
 * kutuda belirmesiydi: kullanici ucuncu kutuya basip fotografi ikincide
 * goruyordu. Cozum listeyi degistirmek degil, atlamayi mumkun kilmamak --
 * dokunulabilen tek bos kutu siradaki olan.
 *
 * Devam eden isler yerlerini izgarada tutuyor. Bir yukleme surerken ikincisi
 * baslatilabiliyor ve once biten, once basladiginin kutusuna gecmiyor: her is
 * kendi kutusunda kaliyor, fotograflar aradaki bos kutulari sirayla dolduruyor.
 */
export function layoutSlots(
  photos: readonly UploadedPhoto[],
  transfers: Transfers,
  slotCount: number,
): Slot[] {
  const open = nextOpenIndex(photos, transfers, slotCount);
  const slots: Slot[] = [];
  let position = 0;

  for (let index = 0; index < slotCount; index += 1) {
    const transfer = transfers.get(index);

    if (transfer !== undefined) {
      slots.push({ kind: transfer });
      continue;
    }

    const photo = photos[position];

    if (photo !== undefined) {
      slots.push({ kind: 'photo', photo, position });
      position += 1;
      continue;
    }

    slots.push({ kind: index === open ? 'open' : 'locked' });
  }

  return slots;
}

/** Siradaki bos kutu; izgara doluysa `null`. */
export function nextOpenIndex(
  photos: readonly UploadedPhoto[],
  transfers: Transfers,
  slotCount: number,
): number | null {
  let remaining = photos.length;

  for (let index = 0; index < slotCount; index += 1) {
    if (transfers.has(index)) continue;
    if (remaining > 0) {
      remaining -= 1;
      continue;
    }
    return index;
  }

  return null;
}

/**
 * Bir kutuya yeni gelen fotografin cevap dizisindeki yeri.
 *
 * Onundeki bos kutular fotograflarla siradan doluyor; devam eden isler
 * sayilmiyor cunku onlarin fotografi henuz yok. Boylece once biten bir is,
 * kendinden onceki bir kutuda bekleyen isin yerini almiyor.
 */
export function insertPosition(transfers: Transfers, index: number, photoCount: number): number {
  let position = 0;

  for (let slot = 0; slot < index; slot += 1) {
    if (!transfers.has(slot)) position += 1;
  }

  return Math.min(position, photoCount);
}
