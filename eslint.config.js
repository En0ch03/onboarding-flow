// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
  },
  {
    rules: {
      // Kullanicinin gordugu metinler tek bir sozlukten gelir; ekran dosyalarina
      // dogrudan yazilan bir metin ceviri ve tutarlilik disinda kalir.
      'react-native/no-raw-text': 'off',
    },
  },
  {
    // Uygulama kodunda ortam degiskeni bir degiskenle okunamaz. Paketleyici
    // yalnizca adiyla gordugu degiskenleri satir icine gomuyor; hesaplanmis
    // bir erisim gelistirmede calisip paketlenmis uygulamada sessizce bos
    // donuyor. Bir kez oldu ve hicbir test yakalamadi, cunku testler gercek
    // ortami okuyor - bu yuzden koruma burada, testte degil.
    //
    // Testler kuralin disinda: bir test kosumu ortam degiskenlerini isimlerini
    // onceden bilmeden yazip siliyor ve o kod pakete hic girmiyor.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[computed=true][object.property.name='env']",
          message:
            'Ortam degiskenini adiyla oku (process.env.EXPO_PUBLIC_X); hesaplanmis erisim paketlenmis uygulamada bos doner.',
        },
      ],
    },
  },
  {
    // Sahte sunucu Node tarafinda ve kendi testleri var; uygulama tarafinin
    // ortam varsayimlari oraya uymuyor.
    files: ['mock-server/**/*.test.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
      },
    },
  },
]);
