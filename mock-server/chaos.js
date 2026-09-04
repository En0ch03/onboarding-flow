'use strict';

/**
 * Kaos anahtarlari. Sozlesme "her uc nokta 500 dondurebilir veya zaman
 * asimina ugrayabilir, demonuz sirasinda olacagini varsayin" diyor; bu ara
 * katman o durumlari istege bagli olarak uretiyor.
 *
 * Iki yol var ve ikisi de gerekli.
 *
 * 1. Istek basligi: `x-chaos: 500`. Tek bir istegi bozar, digerlerine
 *    dokunmaz. curl ile calisirken dogru olan bu.
 *
 * 2. Sunucu anahtari: `POST /api/v1/__chaos {"mode":"500"}`. Bir sonraki
 *    isteklerin hepsini bozar, kapatilana kadar.
 *
 * Ikincisi telefonda test yapabilmek icin var. Uygulama kendi isteklerine
 * `x-chaos` basligi koymuyor - koymamali da, cunku o baslik uretimde var
 * olmayacak bir seye bagimlilik demek olurdu. Dolayisiyla baslik yontemi
 * yalnizca curl'den erisilebilir ve cihazda hata yolunu gormenin bir yolu
 * kalmiyordu. Anahtar bu bosluğu kapatiyor: laptoptan cevriliyor, telefondaki
 * uygulama hicbir sey bilmeden hatayi yasiyor.
 *
 *   500            sunucu hatasi
 *   slow           istemci zaman asimini tetikleyecek kadar bekler
 *   expire-token   istegi isler, sonra access token'i gecersiz kilar
 *   end-session    access ve refresh token'larin ikisini de gecersiz kilar
 *   malformed      sozlesmeye uymayan bir govde dondurur
 *   off            anahtari kapatir
 */

const SLOW_MS = 20000;

const MODES = ['500', 'slow', 'expire-token', 'end-session', 'malformed'];

/** Sunucu genelinde acik olan mod; null ise yalnizca baslik yontemi calisir. */
let armed = null;
/** Anahtar tek atislik mi: bir istekte tetiklenip kendini kapatir. */
let armedOnce = false;

function readArmed() {
  return { mode: armed, once: armedOnce };
}

function setArmed(mode, once = false) {
  if (mode === 'off' || mode === null) {
    armed = null;
    armedOnce = false;
    return readArmed();
  }
  if (!MODES.includes(mode)) return null;
  armed = mode;
  armedOnce = once === true;
  return readArmed();
}

function chaos(state) {
  return function chaosMiddleware(req, res, next) {
    // Anahtarin kendi uc noktasi kaosa tabi degil; aksi halde kaosu
    // kapatmak icin once kaosu kapatmak gerekirdi.
    if (req.path === '/api/v1/__chaos') return next();

    const header = req.get('x-chaos');
    const mode = header || armed;
    if (!mode) return next();

    // Tek atislik anahtar tetiklendi: bir sonraki istek temiz gecsin.
    if (!header && armed && armedOnce) {
      armed = null;
      armedOnce = false;
    }

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

module.exports = { chaos, setArmed, readArmed, MODES, SLOW_MS };
