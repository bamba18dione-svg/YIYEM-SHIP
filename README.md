# YEYAM SHIP — MVC Express + JavaScript modulaire

YEYAM SHIP est une boutique Express dont le backend est organisé selon une structure MVC. PostgreSQL sur Neon stocke les produits et les commandes, tandis que le frontend reste en JavaScript vanilla modulaire.

## Structure MVC

```
server.js                 Démarrage du serveur et initialisation de la base
app.js                    Configuration Express, middlewares et montage des routes
controllers/              Contrôleurs HTTP et validation des entrées
  catalogue.controller.js Catalogue public
  store.controller.js    Commandes, connexion et déconnexion
  manager.controller.js  Dashboard et CRUD produits
models/                   Accès aux données PostgreSQL
  product.model.js        Requêtes et mapping des produits
  order.model.js          Transactions et statistiques de commandes
routes/                   Déclaration des endpoints Express
middleware/               Authentification gérant et upload d'images
lib/db.js                 Pool PostgreSQL, schéma et seed initial
views/index.html          Vue HTML de la boutique
public/                   Assets statiques servis par Express
  js/                     Modules frontend ES
  styles.css              Styles de la boutique
uploads/                  Images téléversées par le gérant
```

## Configuration

1. Créez un projet dans [Neon](https://neon.tech), puis ouvrez **Connect** et copiez la *connection string* PostgreSQL.
2. Copiez `.env.example` en `.env`.
3. Collez l'URL Neon à la place de `DATABASE_URL` et choisissez un mot de passe gérant dans `MANAGER_PASSWORD`.

Exemple :

```env
DATABASE_URL=postgresql://user:password@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
MANAGER_USER=gerant
MANAGER_PASSWORD=un-mot-de-passe-solide
SESSION_SECRET=une-cle-secrete-longue
```

## Démarrage

```bash
npm install
npm start
```

Ouvrez ensuite `http://localhost:3000`. Au premier démarrage, les tables et les produits de démonstration sont créés automatiquement dans Neon.

## API conservée

- `GET /api?action=products` — catalogue public
- `POST /api?action=order` — création d'une commande
- `POST /api?action=login` — connexion gérant
- `POST /api?action=logout` — déconnexion
- `GET /api/dashboard` — statistiques gérant
- `POST /api/product` — création ou modification d'un produit
- `DELETE /api/product/:id` — suppression d'un produit

Le refactor ne change pas ces URLs ni le contrat attendu par le frontend. Les routes délèguent désormais aux contrôleurs, qui délèguent aux modèles, et `server.js` ne fait plus que démarrer l'application.
