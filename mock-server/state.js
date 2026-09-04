'use strict';

/**
 * Bellek ici depo. Kaliciligi bilerek yok: sunucuyu yeniden baslatmak temiz bir
 * baslangic demek ve bir demo sirasinda ihtiyac duyulan sey tam olarak bu.
 */

const crypto = require('node:crypto');

/** E-posta -> kullanici. */
const usersByEmail = new Map();
/** Kullanici kimligi -> kullanici. */
const usersById = new Map();
/** Access token -> { userId, expiresAt }. */
const accessTokens = new Map();
/** Refresh token -> { userId, expiresAt }. */
const refreshTokens = new Map();

/** Access token omru ortam degiskeniyle kisaltilabilir; demoda saniyelere iner. */
const ACCESS_TTL_SECONDS = Number(process.env.MOCK_TOKEN_TTL_SECONDS || 900);
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30;

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function createUser(email, password) {
  const user = {
    user_id: newId('usr'),
    email,
    password,
    display_name: null,
    avatar_url: null,
    preferences: {},
    onboarding_complete: false,
  };

  usersByEmail.set(email.toLowerCase(), user);
  usersById.set(user.user_id, user);
  return user;
}

function findUserByEmail(email) {
  return usersByEmail.get(String(email).toLowerCase()) || null;
}

function findUserById(userId) {
  return usersById.get(userId) || null;
}

function issueTokens(userId) {
  const access = newId('at');
  const refresh = newId('rt');
  const now = Date.now();

  accessTokens.set(access, { userId, expiresAt: now + ACCESS_TTL_SECONDS * 1000 });
  refreshTokens.set(refresh, { userId, expiresAt: now + REFRESH_TTL_SECONDS * 1000 });

  return { access_token: access, refresh_token: refresh };
}

function issueAccessToken(userId) {
  const access = newId('at');
  accessTokens.set(access, { userId, expiresAt: Date.now() + ACCESS_TTL_SECONDS * 1000 });
  return access;
}

function readAccessToken(token) {
  const entry = accessTokens.get(token);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    accessTokens.delete(token);
    return null;
  }
  return entry;
}

function readRefreshToken(token) {
  const entry = refreshTokens.get(token);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    refreshTokens.delete(token);
    return null;
  }
  return entry;
}

/** Kaos anahtari icin: kullanicinin tum access token'larini gecersiz kilar. */
function expireAccessTokensFor(userId) {
  for (const [token, entry] of accessTokens) {
    if (entry.userId === userId) accessTokens.delete(token);
  }
}

/** Kaos anahtari icin: oturumu tumden bitirir. */
function expireRefreshTokensFor(userId) {
  for (const [token, entry] of refreshTokens) {
    if (entry.userId === userId) refreshTokens.delete(token);
  }
}

/** Sozlesmedeki profil nesnesi; parola ve e-posta disarida kalir. */
function toProfile(user) {
  return {
    user_id: user.user_id,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    preferences: user.preferences,
    onboarding_complete: user.onboarding_complete,
  };
}

module.exports = {
  ACCESS_TTL_SECONDS,
  createUser,
  expireAccessTokensFor,
  expireRefreshTokensFor,
  findUserByEmail,
  findUserById,
  issueAccessToken,
  issueTokens,
  newId,
  readAccessToken,
  readRefreshToken,
  toProfile,
};
