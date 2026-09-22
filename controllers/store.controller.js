import bcrypt from 'bcryptjs';
import { db } from '../lib/db.js';
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

async function login(req, res, next) {
  try {
    const inputUsername = String(req.body.username || '').trim();
    const inputPassword = String(req.body.password || '');

    if (!inputUsername || !inputPassword) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    const { rows: managers } = await db.query(
      'SELECT id, username, password_hash FROM managers WHERE username = $1',
      [inputUsername]
    );

    let passwordMatches = false;

    if (managers.length > 0) {
      passwordMatches = bcrypt.compareSync(inputPassword, managers[0].password_hash);
    } else {
      const envUser = process.env.MANAGER_USER || 'gerant';
      const envPassword = process.env.MANAGER_PASSWORD;
      if (envPassword && inputUsername === envUser) {
        const isBcrypt = envPassword.startsWith('$2a$') || envPassword.startsWith('$2b$');
        passwordMatches = isBcrypt
          ? bcrypt.compareSync(inputPassword, envPassword)
          : inputPassword === envPassword;
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    req.session.regenerate(error => {
      if (error) return next(error);
      req.session.manager = true;
      req.session.managerUser = inputUsername;
      res.json({ ok: true });
    });
  } catch (err) {
    next(err);
  }
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
    if (action(req) === 'login') return await login(req, res, next);
    if (action(req) === 'logout') return logout(req, res);
    if (action(req) === 'session') return checkSession(req, res);
    return res.status(404).json({ error: 'Action inconnue' });
  } catch (error) {
    next(error);
  }
}
