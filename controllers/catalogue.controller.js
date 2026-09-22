import { findAll } from '../models/product.model.js';

export async function getProducts(req, res, next) {
  if (req.query.action !== 'products') {
    return res.status(404).json({ error: 'Action inconnue' });
  }

  try {
    res.json(await findAll());
  } catch (error) {
    next(error);
  }
}
