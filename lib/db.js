import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL est manquante. Copiez .env.example vers .env et ajoutez votre URL Neon.');
}

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const seedProducts = [
  // T-shirts
  ['T-shirt Essential', 'Ndar Studio', 'T-shirts', 8500, 10500, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80', 'S,M,L,XL', 'Un essentiel du vestiaire, confectionné dans un coton doux et résistant.', '-20%', 12, 'Blanc, Noir, Gris'],
  ['T-shirt Oversize Dakar Spirit', 'Ndar Studio', 'T-shirts', 9500, null, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80', 'S,M,L,XL,XXL', 'Coupe boxy streetwear en coton lourd 240g, sérigraphie exclusive au dos.', 'Tendance', 14, 'Noir, Beige, Blanc'],
  ['Polo Maille Texturée', 'Ndar Studio', 'T-shirts', 12900, 15000, 'https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=600&q=80', 'S,M,L,XL', 'Polo rétro en maille respirante au tomber impeccable.', '-15%', 9, 'Crème, Noir, Vert'],
  ['T-shirt Acid Wash Vintage', 'Ndar Studio', 'T-shirts', 10500, null, 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80', 'S,M,L,XL', 'Finition délavée vintage unique, col côtelé épais et coupe décontractée.', 'Nouveau', 11, 'Anthracite, Noir'],

  // Jeans
  ['Jean Wide Leg', 'Ndar Studio', 'Jeans', 18500, null, 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80', '36,38,40,42,44', 'Jean taille haute à jambe large, souple et confortable.', 'Nouveau', 7, 'Bleu clair, Bleu brut'],
  ['Jean Baggy Skater Cargo', 'Ndar Studio', 'Jeans', 21500, 25000, 'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&w=600&q=80', '38,40,42,44', 'Coupe ultra baggy avec poches cargo utilitaires, denim délavé premium.', 'Tendance', 8, 'Bleu délavé, Noir'],
  ['Jean Brut Droit Selvedge', 'Ndar Studio', 'Jeans', 23900, null, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80', '38,40,42,44,46', 'Denim brut de qualité supérieure, finitions soignées et coupe intemporelle.', 'Premium', 10, 'Indigo brut, Noir'],
  ['Jean Carpenter Vintage Washed', 'Ndar Studio', 'Jeans', 19900, null, 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=600&q=80', '36,38,40,42,44', 'Coupe décontractée avec boucle marteau et poches fonctionnelles.', 'Bestseller', 12, 'Bleu vintage, Gris'],

  // Foot
  ['Maillot Sénégal 2025', 'Puma', 'Foot', 22900, 28000, 'https://images.unsplash.com/photo-1570498839593-e565b39455fc?auto=format&fit=crop&w=600&q=80', 'S,M,L,XL', 'Portez les couleurs des Lions avec ce maillot respirant.', '-18%', 5, 'Blanc, Vert'],
  ['Maillot Sénégal Extérieur 2025', 'Puma', 'Foot', 23900, 28000, 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80', 'S,M,L,XL,XXL', 'Édition extérieure verte et or avec motifs inspirés de la Teranga.', 'Tendance', 7, 'Vert, Or'],
  ['Maillot Club Prestige Madrid', 'Adidas', 'Foot', 24500, null, 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80', 'S,M,L,XL', 'Tissu technique ultra-respirant Heat.Rdy pour un style sport chic.', 'Populaire', 6, 'Blanc, Bleu marine'],
  ['Veste Tracksuit Football Retro', 'Puma', 'Foot', 27000, 32000, 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80', 'S,M,L,XL', 'Veste zippée style athleisure rétro 90s, finitions côtelées.', '-15%', 8, 'Noir, Vert'],

  // Basket
  ['Maillot NBA Lakers City Edition', 'Nike', 'Basket', 21900, 26000, 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=600&q=80', 'S,M,L,XL,XXL', 'Maillot hommage noir et or, tissu mesh respirant double épaisseur.', 'Tendance', 8, 'Jaune Or, Violet, Noir'],
  ['Maillot Jordan Bulls Classic 23', 'Jordan', 'Basket', 23500, null, 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80', 'S,M,L,XL', 'Le grand classique rouge des Chicago Bulls floqué Jordan 23.', 'Bestseller', 6, 'Rouge, Noir, Blanc'],
  ['Short Basket Retro Mesh Pro', 'Nike', 'Basket', 12900, null, 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?auto=format&fit=crop&w=600&q=80', 'S,M,L,XL', 'Short de basketball au-dessus du genou avec taille élastique à cordon.', 'Nouveau', 15, 'Noir, Blanc, Rouge'],

  // Chaussures
  ['Air Run Velocity', 'Nike', 'Chaussures', 34900, null, 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80', '39,40,41,42,43,44', 'Une sneaker légère à l’amorti dynamique.', 'Bestseller', 3, 'Noir, Blanc, Rouge'],
  ['Dunk Low Retro Panda', 'Nike', 'Chaussures', 36000, 42000, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80', '39,40,41,42,43,44,45', 'L’icône streetwear incontournable en cuir bicolore noir et blanc.', 'Bestseller', 9, 'Noir/Blanc'],
  ['Terrace Samba Classic', 'Adidas', 'Chaussures', 32500, null, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80', '39,40,41,42,43,44', 'Silhouette basse rétro en cuir souple avec semelle en gomme naturelle.', 'Tendance', 7, 'Blanc/Noir, Noir/Blanc'],
  ['Old Skool Skate Classic', 'Vans', 'Chaussures', 26900, 30000, 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=600&q=80', '38,39,40,41,42,43,44', 'Sneaker basse légendaire en toile et suède avec la rayure latérale signature.', '-10%', 10, 'Noir/Blanc, Bleu marine']
];

export async function initialiseDatabase() {
  await db.query(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL, brand TEXT NOT NULL, category TEXT NOT NULL,
    price INTEGER NOT NULL, old_price INTEGER, image TEXT NOT NULL,
    sizes TEXT NOT NULL, colors TEXT NOT NULL DEFAULT '', description TEXT NOT NULL, tag TEXT,
    stock INTEGER NOT NULL DEFAULT 10, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await db.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT NOT NULL DEFAULT ''");
  await db.query(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer TEXT NOT NULL, total INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'En cours',
    payment TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    phone TEXT, address TEXT, city TEXT, postal_code TEXT, email TEXT, note TEXT
  )`);
  await db.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT');
  await db.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS address TEXT');
  await db.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS city TEXT');
  await db.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS postal_code TEXT');
  await db.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS email TEXT');
  await db.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS note TEXT');
  await db.query(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    image TEXT NOT NULL,
    size TEXT,
    color TEXT,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL
  )`);
  await db.query('ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size TEXT');
  await db.query('ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color TEXT');

  for (const product of seedProducts) {
    const { rows } = await db.query('SELECT id, image, description, colors FROM products WHERE name = $1', [product[0]]);
    if (rows.length === 0) {
      await db.query(
        'INSERT INTO products(name,brand,category,price,old_price,image,sizes,description,tag,stock,colors) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
        product
      );
    } else {
      for (const row of rows) {
        const needsImageFix = !row.image || row.image === 'undefined' || row.image.startsWith('uploads/');
        const needsDescFix = !row.description || row.description === 'undefined';
        const needsColorsFix = !row.colors || row.colors.trim() === '';
        if (needsImageFix || needsDescFix || needsColorsFix) {
          await db.query(
            'UPDATE products SET image = $1, description = $2, colors = $3 WHERE id = $4',
            [
              needsImageFix ? product[5] : row.image,
              needsDescFix ? product[7] : row.description,
              needsColorsFix ? (product[10] || '') : row.colors,
              row.id
            ]
          );
        }
      }
    }
  }

  await db.query(`CREATE TABLE IF NOT EXISTS managers (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);

  const managerUser = process.env.MANAGER_USER || 'gerant';
  const managerPassword = process.env.MANAGER_PASSWORD || 'ndar2026';
  const { rows: existingManagers } = await db.query('SELECT id FROM managers WHERE username = $1', [managerUser]);
  if (existingManagers.length === 0) {
    const isAlreadyHash = managerPassword.startsWith('$2a$') || managerPassword.startsWith('$2b$');
    const hash = isAlreadyHash ? managerPassword : bcrypt.hashSync(managerPassword, 10);
    await db.query(
      'INSERT INTO managers (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING',
      [managerUser, hash]
    );
  }
}
