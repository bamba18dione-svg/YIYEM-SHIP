import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { catalogueRouter } from './routes/catalogue.js';
import { storeRouter } from './routes/store-api.js';
import { managerRouter } from './routes/manager.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, 'public');
const viewsDir = path.join(root, 'views');
const uploadsDir = path.join(root, 'uploads');

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(session({
    secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  }));

  app.use(catalogueRouter);
  app.use(storeRouter);
  app.use(managerRouter);

  app.use(express.static(publicDir));
  app.use('/uploads', express.static(uploadsDir));
  app.get('/', (_req, res) => res.sendFile(path.join(viewsDir, 'index.html')));

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  });

  return app;
}
