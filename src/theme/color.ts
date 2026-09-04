/**
 * Bir rengin saydam halini uretir.
 *
 * `transparent` anahtar kelimesi kullanilmiyor cunku o `rgba(0,0,0,0)` demek
 * ve Android'de gradyanin saydam ucu griye caliyor. Solmanin gorunmez olmasi
 * icin iki uc da ayni renk olmali, yalnizca alfasi degismeli.
 */
export function withAlpha(color: string, alpha: number): string {
  // Altili hex disinda bir bicim gelirse cevirmeye calismak `rgba(NaN, ...)`
  // uretiyor ve Android bunu gecersiz renk diye reddediyor. Solmadan vazgecip
  // duz rengi dondurmek, cokmekten iyi.
  if (!/^#[0-9a-f]{6}$/i.test(color)) return color;
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
