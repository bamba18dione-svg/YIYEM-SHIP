import bcrypt from 'bcryptjs';
import { db } from '../lib/db.js';
import { getStats, findRecent, updateStatus } from '../models/order.model.js';
import * as Product from '../models/product.model.js';

export async function getDashboard(_req, res, next) {
  try {
    const [stats, recent, low, stock] = await Promise.all([
      getStats(),
      findRecent(),
      Product.findLowStock(),
      Product.getTotalStock()
    ]);
    res.json({ ...stats, stock, recent, low });
  } catch (error) {
    next(error);
  }
}

export async function saveProduct(req, res, next) {
  try {
    const { id, name, brand, category, price, old, sizes, colors, desc, tag, stock } = req.body;
    if (!name?.trim() || !brand?.trim() || !category?.trim() || !Number(price) || !sizes?.trim() || !desc?.trim()) {
      return res.status(422).json({ error: 'Veuillez compléter les champs obligatoires.' });
    }

    const productId = id ? Number(id) : null;
    let image = req.file && req.file.buffer
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
      : (req.file ? `uploads/${req.file.filename}` : '');
    if (productId) {
      const existing = await Product.findImageById(productId);
      if (!existing) return res.status(404).json({ error: 'Produit introuvable.' });
      image ||= existing.image;
    }
    if (!image) {
      return res.status(422).json({ error: 'Ajoutez une photo du produit.' });
    }

    const saved = await Product.save({
      id: productId,
      name: name.trim(),
      brand: brand.trim(),
      category: category.trim(),
      price: Number(price),
      oldPrice: Number(old) || null,
      image,
      sizes: sizes.trim(),
      colors: (colors || '').trim(),
      description: desc.trim(),
      tag: tag?.trim() || '',
      stock: Math.max(0, Number(stock) || 0)
    });

    res.json(saved);
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    await Product.remove(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status || '').trim();
    const validStatuses = ['En cours', 'Expédié', 'Livré', 'Annulé'];
    if (!id || !validStatuses.includes(status)) {
      return res.status(422).json({ error: 'Statut invalide.' });
    }
    const updated = await updateStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }
    res.json({ ok: true, order: updated });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    const confirmPassword = String(req.body.confirmPassword || '');
    const username = req.session.managerUser || process.env.MANAGER_USER || 'gerant';

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(422).json({ error: 'Veuillez remplir tous les champs.' });
    }

    if (newPassword.length < 6) {
      return res.status(422).json({ error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(422).json({ error: 'Les deux nouveaux mots de passe ne correspondent pas.' });
    }

    const { rows: managers } = await db.query(
      'SELECT id, username, password_hash FROM managers WHERE username = $1',
      [username]
    );

    let currentMatches = false;
    if (managers.length > 0) {
      currentMatches = bcrypt.compareSync(currentPassword, managers[0].password_hash);
    } else {
      const envPassword = process.env.MANAGER_PASSWORD;
      if (envPassword) {
        const isBcrypt = envPassword.startsWith('$2a$') || envPassword.startsWith('$2b$');
        currentMatches = isBcrypt
          ? bcrypt.compareSync(currentPassword, envPassword)
          : currentPassword === envPassword;
      }
    }

    if (!currentMatches) {
      return res.status(401).json({ error: 'Le mot de passe actuel est incorrect.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.query(
      `INSERT INTO managers (username, password_hash, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (username) DO UPDATE
       SET password_hash = EXCLUDED.password_hash, updated_at = NOW()`,
      [username, newHash]
    );

    return res.json({ ok: true, message: 'Mot de passe modifié avec succès.' });
  } catch (error) {
    next(error);
  }
}
