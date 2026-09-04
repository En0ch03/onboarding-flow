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
