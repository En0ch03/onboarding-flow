'use strict';

/**
 * Kaos anahtarlari. Sozlesme "her uc nokta 500 dondurebilir veya zaman
 * asimina ugrayabilir, demonuz sirasinda olacagini varsayin" diyor; bu ara
 * katman o durumlari istege bagli olarak uretiyor.
 *
 * Anahtar istek basligiyla veriliyor cunku hata yolunu tetiklemek icin
 * sunucuyu yeniden baslatmak veya uygulamayi degistirmek gerekmemeli:
 *
 *   x-chaos: 500            sunucu hatasi
 *   x-chaos: slow           istemci zaman asimini tetikleyecek kadar bekler
 *   x-chaos: expire-token   istegi isler, sonra access token'i gecersiz kilar
 *   x-chaos: end-session    access ve refresh token'larin ikisini de gecersiz kilar
 *   x-chaos: malformed      sozlesmeye uymayan bir govde dondurur
 */

const SLOW_MS = 20000;

function chaos(state) {
  return function chaosMiddleware(req, res, next) {
    const mode = req.get('x-chaos');
    if (!mode) return next();

    if (mode === '500') {
      return res.status(500).json({ error: 'internal_error' });
    }

    if (mode === 'slow') {
      // Yanit hic gonderilmiyor: istemcinin kendi zaman asimini yakalamasi
      // gerekiyor. Gec bir yanit gondermek, zaman asimini test etmez.
      return setTimeout(() => {
        if (!res.headersSent) res.status(504).json({ error: 'timeout' });
      }, SLOW_MS);
    }

    if (mode === 'malformed') {
      // Sozlesmeye uymayan govde: sinirdaki dogrulamanin gercekten
      // tetiklendigini gormenin tek yolu.
      return res.status(200).json({ unexpected: true });
    }

    if (mode === 'expire-token' || mode === 'end-session') {
      // Istek normal islensin; token gecersizlestirme yanit gonderildikten
      // sonra yapiliyor ki bir sonraki istek yenileme yoluna dussun.
      res.on('finish', () => {
        const userId = req.userId;
        if (!userId) return;
        state.expireAccessTokensFor(userId);
        if (mode === 'end-session') state.expireRefreshTokensFor(userId);
      });
    }

    return next();
  };
}

module.exports = { chaos, SLOW_MS };
