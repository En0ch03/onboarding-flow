import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Deponun kendisi hakkindaki iki iddia.
 *
 * Ikisi de tek bir dosyaya bakarak dogrulanamiyor: biri bir yapilandirma
 * alaninin **yoklugu**, digeri depoya giren dosyalarin tamami hakkinda. Elle
 * bakilarak korunan boyle bir sey bir sonraki degisiklikte sessizce bozulur.
 */

const repoRoot = join(__dirname, '..', '..');

/** Taramanin kendisi aradigi kelimeyi icerdigi icin disarida kaliyor. */
const scanner = 'src/test/repositoryHygiene.test.ts';

describe('the repository carries no server address', () => {
  it('ships no address in the app configuration, so nothing has to be kept private', () => {
    // Adres tasinsaydi ya ozel bir sunucu herkese acilirdi ya da klonlayan
    // kisi cevap vermeyen bir adrese istek atardi. Adresi uygulama, bagli
    // oldugu makineden turetiyor; baska bir sunucu isteyen onu acikca veriyor.
    const config = JSON.parse(readFileSync(join(repoRoot, 'app.json'), 'utf8'));

    expect(config.expo.extra?.apiUrl).toBeUndefined();
  });
});

describe('the repository names no product', () => {
  /** Depoya giren metin dosyalari; ikili dosyalar disarida. */
  function trackedTextFiles(): string[] {
    const output = execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' });
    const files = output.split('\n').filter(Boolean);

    // Komut calismadiginda bos bir liste donerdi ve tarama hicbir sey
    // bulamadigi icin gecerdi. Gecmesi gereken tek sey bos olmayan bir liste.
    expect(files.length).toBeGreaterThan(50);

    return files.filter(
      (file) => file !== scanner && !/\.(png|jpg|jpeg|webp|ttf|otf|ico)$/i.test(file),
    );
  }

  it('leaves no product name in any committed file, in its contents or in its name', () => {
    // Kelime sinirindan basliyor: "above" gibi kelimelerin icinde gecen
    // harf dizisi urun adi degil.
    const forbidden = /\bbove/i;
    const offenders = trackedTextFiles().filter(
      (file) => forbidden.test(file) || forbidden.test(readFileSync(join(repoRoot, file), 'utf8')),
    );

    expect(offenders).toEqual([]);
  });
});
