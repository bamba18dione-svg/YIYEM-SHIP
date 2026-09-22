import bcrypt from 'bcryptjs';
import { create, InsufficientStockError } from '../models/order.model.js';

function action(req) {
  return req.query.action;
}

async function placeOrder(req, res) {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const customer = req.body.customer || {};
  const fullName = String(customer.fullName || '').trim();
  const phone = String(customer.phone || '').trim();
  const address = String(customer.address || '').trim();
  const payment = String(req.body.payment || customer.payment || '').trim() || 'À la livraison';

  if (!items.length) {
    return res.status(422).json({ error: 'Panier vide.' });
  }
  if (!fullName || !phone || !address) {
    return res.status(422).json({ error: 'Veuillez renseigner votre nom, téléphone et adresse.' });
  }

  try {
    const orderId = await create({ items, fullName, phone, address, payment });
    return res.json({ ok: true, order: orderId });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return res.status(422).json({ error: error.message });
    }
    throw error;
  }
}

function login(req, res, next) {
  const user = process.env.MANAGER_USER || 'gerant';
  const configuredPassword = process.env.MANAGER_PASSWORD;

  if (!configuredPassword) {
    return res.status(500).json({ error: 'MANAGER_PASSWORD est manquant dans .env.' });
  }
  if (req.body.username !== user) {
    return res.status(401).json({ error: 'Identifiants incorrects.' });
  }

  const inputPassword = String(req.body.password || '');
  const isBcrypt = configuredPassword.startsWith('$2a$') || configuredPassword.startsWith('$2b$');
  const passwordMatches = isBcrypt
    ? bcrypt.compareSync(inputPassword, configuredPassword)
    : inputPassword === configuredPassword;

  if (!passwordMatches) {
    return res.status(401).json({ error: 'Identifiants incorrects.' });
  }

  req.session.regenerate(error => {
    if (error) return next(error);
    req.session.manager = true;
    res.json({ ok: true });
  });
}

function logout(req, res) {
  return req.session.destroy(() => res.json({ ok: true }));
}

function checkSession(req, res) {
  return res.json({ manager: Boolean(req.session?.manager) });
}

export async function handleStoreAction(req, res, next) {
  try {
    if (action(req) === 'order') return await placeOrder(req, res);
    if (action(req) === 'login') return login(req, res, next);
    if (action(req) === 'logout') return logout(req, res);
    if (action(req) === 'session') return checkSession(req, res);
    return res.status(404).json({ error: 'Action inconnue' });
  } catch (error) {
    next(error);
  }
}
