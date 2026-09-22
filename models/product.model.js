import { db } from '../lib/db.js';

function toProduct(row) {
  return {
    ...row,
    id: Number(row.id),
    price: Number(row.price),
    old: row.old_price ? Number(row.old_price) : null,
    img: row.image,
    sizes: row.sizes.split(',').map(size => size.trim()).filter(Boolean),
    stock: Number(row.stock)
  };
}

export async function findAll() {
  const { rows } = await db.query('SELECT * FROM products ORDER BY id DESC');
  return rows.map(toProduct);
}

export async function findByIdForUpdate(client, id) {
  const { rows: [product] } = await client.query(
    'SELECT id, name, category, image, price, stock FROM products WHERE id=$1 FOR UPDATE',
    [Number(id)]
  );
  return product || null;
}

export async function decrementStock(client, id, quantity) {
  await client.query('UPDATE products SET stock=stock-$1 WHERE id=$2', [quantity, Number(id)]);
}

export async function findLowStock(limit = 5) {
  const { rows } = await db.query(
    'SELECT * FROM products WHERE stock<=5 ORDER BY stock ASC LIMIT $1',
    [limit]
  );
  return rows.map(toProduct);
}

export async function getTotalStock() {
  const { rows: [{ stock }] } = await db.query(
    'SELECT COALESCE(SUM(stock),0)::int AS stock FROM products'
  );
  return Number(stock);
}

export async function findImageById(id) {
  const { rows: [product] } = await db.query(
    'SELECT image FROM products WHERE id=$1',
    [Number(id)]
  );
  return product || null;
}

export async function save({ id, name, brand, category, price, oldPrice, image, sizes, description, tag, stock }) {
  const values = [name, brand, category, price, oldPrice, image, sizes, description, tag, stock];
  const query = id
    ? 'UPDATE products SET name=$1,brand=$2,category=$3,price=$4,old_price=$5,image=$6,sizes=$7,description=$8,tag=$9,stock=$10 WHERE id=$11 RETURNING *'
    : 'INSERT INTO products(name,brand,category,price,old_price,image,sizes,description,tag,stock) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *';
  const { rows: [saved] } = await db.query(query, id ? [...values, Number(id)] : values);
  return toProduct(saved);
}

export async function remove(id) {
  await db.query('DELETE FROM products WHERE id=$1', [Number(id)]);
}
