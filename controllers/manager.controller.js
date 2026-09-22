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
    const { id, name, brand, category, price, old, sizes, desc, tag, stock } = req.body;
    if (!name?.trim() || !brand?.trim() || !category?.trim() || !Number(price) || !sizes?.trim() || !desc?.trim()) {
      return res.status(422).json({ error: 'Veuillez compléter les champs obligatoires.' });
    }

    const productId = id ? Number(id) : null;
    let image = req.file ? `uploads/${req.file.filename}` : '';
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
