import { Platform } from 'react-native';

import { resolveGlassMode } from './glassMode';

/**
 * Dosya sistemi `require` ile aliniyor, `import` ile degil: proje tip
 * tanimlarinda Node'un kutuphanesini acmiyor ve uygulama kodunun yanlislikla
 * dosya sistemine uzanmasi da bu yuzden. Kaynagi tarayan tek yer bu test.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports -- yukaridaki gerekce
const { readFileSync, readdirSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
  readdirSync: (
    path: string,
    options: { withFileTypes: true },
  ) => { name: string; isDirectory: () => boolean }[];
};
// eslint-disable-next-line @typescript-eslint/no-require-imports -- yukaridaki gerekce
const { join, sep } = require('path') as {
  join: (...parts: string[]) => string;
  sep: string;
};

const { isLiquidGlassAvailable, isGlassEffectAPIAvailable } = jest.requireMock('expo-glass-effect');

/** Platformu gecici olarak degistirir; test bitince eski tanimi geri koyar. */
function onPlatform(os: 'ios' | 'android') {
  const original = Object.getOwnPropertyDescriptor(Platform, 'OS');
  Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
  return () => {
    if (original) Object.defineProperty(Platform, 'OS', original);
  };
}

/** `src` altindaki her kaynak dosyasi; testler ve taklitler haric. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry): string[] => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    if (!/\.tsx?$/.test(entry.name)) return [];
    if (/\.test\.tsx?$/.test(entry.name)) return [];
    // Taklitler gercek modulu yeniden yaziyor; ad orada gecmek zorunda.
    if (path.startsWith(`${join('src', 'test')}${sep}`)) return [];
    return [path];
  });
}

beforeEach(() => {
  isLiquidGlassAvailable.mockReturnValue(false);
  isGlassEffectAPIAvailable.mockReturnValue(true);
});

describe('resolveGlassMode', () => {
  it('iki soru da evet derse cam kipi seciyor', () => {
    const restore = onPlatform('ios');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);
      expect(resolveGlassMode()).toBe('liquid');
    } finally {
      restore();
    }
  });

  it('tasarim dili acik ama yerel API yoksa bulanikliga dusuyor', () => {
    const restore = onPlatform('ios');
    try {
      // Bazi iOS 26 derlemelerinde cam katman saydam ciziliyor ve metnin
      // altinda hicbir zemin kalmiyor.
      isLiquidGlassAvailable.mockReturnValue(true);
      isGlassEffectAPIAvailable.mockReturnValue(false);
      expect(resolveGlassMode()).toBe('blur');
    } finally {
      restore();
    }
  });

  it('Android tarafinda duz kipe dusuyor', () => {
    const restore = onPlatform('android');
    try {
      isLiquidGlassAvailable.mockReturnValue(true);
      expect(resolveGlassMode()).toBe('flat');
    } finally {
      restore();
    }
  });

  it('cevabi soran tek yer bu dosya', () => {
    const files = sourceFiles('src');
    // Bos bir liste her iddiayi dogrular; once gercekten tarandigi.
    expect(files.length).toBeGreaterThan(50);

    const askers = files.filter((path) =>
      /isLiquidGlassAvailable|isGlassEffectAPIAvailable/.test(readFileSync(path, 'utf8')),
    );

    // Iki yuzey ayni ekranda ayri kiplerde cizilmesin: cevap kopyalanirsa
    // kart cam, seridi tasiyan dugmeler bulanik olur ve ekran iki ayri
    // tasarim dilini ayni anda gosterir.
    expect(askers).toEqual([join('src', 'components', 'glassMode.ts')]);
  });
});
