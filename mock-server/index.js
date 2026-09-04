'use strict';

/**
 * Sozlesmeyi birebir uygulayan gelistirme sunucusu.
 *
 * Uygulamanin icinde sahte veri veya sahte dal yok; uygulama yalnizca bir
 * temel adres biliyor. Gercek sunucuya gecis tek bir ortam degiskeni.
 */

const express = require('express');
const multer = require('multer');

const { chaos, setArmed, readArmed, MODES } = require('./chaos');
const { optionGroups } = require('./options');
const state = require('./state');

const app = express();
const port = Number(process.env.PORT || 4000);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });

/** Yuklenen gorseller bellekte tutulur; sunucu yeniden basladiginda gider. */
const media = new Map();

app.use(express.json({ limit: '1mb' }));

/** Token varsa cozulur; reddetme isi uc noktanin kendisine birakilir. */
app.use((req, _res, next) => {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const entry = token ? state.readAccessToken(token) : null;
  if (entry) req.userId = entry.userId;
  next();
});

/**
 * Kaos anahtari. Telefonda test yaparken hata yolunu tetiklemenin tek yolu:
 * uygulama kendi isteklerine `x-chaos` basligi koymuyor, dolayisiyla baslik
 * yontemi yalnizca curl'den erisilebiliyor.
 *
 *   curl -X POST http://localhost:4000/api/v1/__chaos -H 'content-type: application/json' -d '{"mode":"500"}'
 *   curl -X POST http://localhost:4000/api/v1/__chaos -H 'content-type: application/json' -d '{"mode":"off"}'
 */
app.post('/api/v1/__chaos', (req, res) => {
  const result = setArmed(req.body?.mode ?? 'off', req.body?.once);
  if (result === null) {
    return res.status(422).json({ error: 'unknown_mode', allowed: [...MODES, 'off'] });
  }
  console.log(`Chaos switch: ${result.mode ?? 'off'}${result.once ? ' (tek atislik)' : ''}`);
  res.status(200).json(result);
});

app.get('/api/v1/__chaos', (_req, res) => res.status(200).json(readArmed()));

app.use(chaos(state));

function requireAuth(req, res, next) {
  if (!req.userId) return res.status(401).json({ error: 'token_expired' });
  const user = state.findUserById(req.userId);
  if (!user) return res.status(401).json({ error: 'token_expired' });
  req.user = user;
  next();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sozlesmedeki 422 govdesi: alan adindan makine okur bir sebep koduna harita. */
function validateCredentials(body) {
  const fields = {};
  if (!body || typeof body.email !== 'string' || !EMAIL_PATTERN.test(body.email.trim())) {
    fields.email = 'invalid';
  }
  if (!body || typeof body.password !== 'string' || body.password.length < 8) {
    fields.password = 'too_short';
  }
  return Object.keys(fields).length > 0 ? fields : null;
}

/* ------------------------------------------------------------------ */
/* Kimlik dogrulama                                                    */
/* ------------------------------------------------------------------ */

app.post('/api/v1/auth/register', (req, res) => {
  const fields = validateCredentials(req.body);
  if (fields) return res.status(422).json({ error: 'validation_failed', fields });

  const email = req.body.email.trim();
  if (state.findUserByEmail(email)) return res.status(409).json({ error: 'email_taken' });

  const user = state.createUser(email, req.body.password);
  const tokens = state.issueTokens(user.user_id);

  res.status(201).json({
    user_id: user.user_id,
    ...tokens,
    onboarding_complete: false,
  });
});

app.post('/api/v1/auth/login', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const user = state.findUserByEmail(email);

  if (!user || user.password !== req.body?.password) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  res.status(200).json({
    user_id: user.user_id,
    ...state.issueTokens(user.user_id),
    onboarding_complete: user.onboarding_complete,
  });
});

app.post('/api/v1/auth/refresh', (req, res) => {
  const entry = state.readRefreshToken(req.body?.refresh_token);
  if (!entry) return res.status(401).json({ error: 'refresh_expired' });

  // Sozlesme yalnizca yeni bir access token donduruyor; refresh token donmuyor.
  res.status(200).json({ access_token: state.issueAccessToken(entry.userId) });
});

/* ------------------------------------------------------------------ */
/* Profil                                                              */
/* ------------------------------------------------------------------ */

app.get('/api/v1/profile', requireAuth, (req, res) => {
  res.status(200).json(state.toProfile(req.user));
});

app.patch('/api/v1/profile', requireAuth, (req, res) => {
  const body = req.body || {};
  const fields = {};

  if ('display_name' in body) {
    if (body.display_name !== null && typeof body.display_name !== 'string') {
      fields.display_name = 'invalid';
    } else if (typeof body.display_name === 'string' && body.display_name.trim().length === 0) {
      fields.display_name = 'required';
    } else if (typeof body.display_name === 'string' && body.display_name.length > 50) {
      fields.display_name = 'too_long';
    }
  }

  if ('avatar_url' in body && body.avatar_url !== null && typeof body.avatar_url !== 'string') {
    fields.avatar_url = 'invalid';
  }

  if (
    'preferences' in body &&
    (typeof body.preferences !== 'object' || body.preferences === null)
  ) {
    fields.preferences = 'invalid';
  }

  if (Object.keys(fields).length > 0) {
    return res.status(422).json({ error: 'validation_failed', fields });
  }

  if ('display_name' in body) req.user.display_name = body.display_name;
  if ('avatar_url' in body) req.user.avatar_url = body.avatar_url;
  // Tercihler birlestirilerek yaziliyor: adim bazli kayit, her seferinde
  // nesnenin tamamini gondermek zorunda kalmamali.
  if ('preferences' in body) {
    req.user.preferences = { ...req.user.preferences, ...body.preferences };
  }

  res.status(200).json(state.toProfile(req.user));
});

app.post('/api/v1/onboarding/complete', requireAuth, (req, res) => {
  req.user.onboarding_complete = true;
  res.status(200).json({ onboarding_complete: true });
});

/* ------------------------------------------------------------------ */
/* Sozlesmede olmayan, gecici uc noktalar                              */
/* ------------------------------------------------------------------ */

/**
 * Secenek listeleri. Sozlesmede yok; talep edildi, cevap bekleniyor.
 */
app.get('/api/v1/config/options', (_req, res) => {
  res.status(200).json(optionGroups);
});

/**
 * Gorsel yukleme. Sozlesmede dosya yukleme ucu yok ve `Content-Type` JSON'a
 * sabit; bu uc nokta gecicidir ve gercek mekanizma netlestiginde degisecek.
 * Istemci tarafinda tek bir fonksiyonun arkasinda yalitildi.
 */
app.post('/api/v1/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file)
    return res.status(422).json({ error: 'validation_failed', fields: { file: 'required' } });

  const id = state.newId('med');
  media.set(id, { buffer: req.file.buffer, mime: req.file.mimetype || 'image/jpeg' });

  res.status(201).json({ url: `${req.protocol}://${req.get('host')}/api/v1/media/${id}` });
});

app.get('/api/v1/media/:id', (req, res) => {
  const item = media.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'not_found' });
  res.set('content-type', item.mime).send(item.buffer);
});

app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

app.listen(port, () => {
  console.log(`Mock API listening on http://localhost:${port}/api/v1`);
  console.log(`Access token lifetime: ${state.ACCESS_TTL_SECONDS}s`);
});
