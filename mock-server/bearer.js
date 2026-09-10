'use strict';

/**
 * Sozlesmede yeri olmayan uclarin kimlik kontrolu.
 *
 * Bu sunucu, sozlesmenin tamami baska bir yerde karsilanirken de ayakta
 * kalabiliyor: o durumda token'i baska bir sunucu veriyor ve burasi onu
 * cozemiyor. Kendi defterinde bulamadigi bir token'i reddetseydi, sozlesmeyi
 * tasiyan sunucu degistiginde yukleme yolu sessizce olurdu.
 *
 * Yine de token'in **varligi** araniyor: istemcinin bu ucu kimliksiz
 * cagirmadigi sinanmaya devam etsin.
 */
function requireBearer(req, res, next) {
  const header = req.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'token_expired' });
  next();
}

module.exports = { requireBearer };
