export function requireManager(req, res, next) {
  if (!req.session.manager) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  next();
}
