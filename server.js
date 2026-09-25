import 'dotenv/config';
import { createApp } from './app.js';
import { initialiseDatabase } from './lib/db.js';

const port = process.env.PORT || 3000;
const app = createApp();

initialiseDatabase()
  .then(() => app.listen(port, () => console.log(`YEYAM SHOP: http://localhost:${port}`)))
  .catch(error => {
    console.error('Connexion Neon impossible:', error.message);
    process.exit(1);
  });
