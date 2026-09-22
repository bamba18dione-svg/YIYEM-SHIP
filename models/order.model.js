import { db } from '../lib/db.js';
import { decrementStock, findByIdForUpdate } from './product.model.js';

export class InsufficientStockError extends Error {
  constructor() {
    super('Stock insuffisant.');
    this.name = 'InsufficientStockError';
  }
}

function optionalValue(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

export async function create({ items, fullName, phone, address, payment }) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    let total = 0;
    const verifiedItems = [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      const product = await findByIdForUpdate(client, item.id);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || product.stock < quantity) {
        throw new InsufficientStockError();
      }

      total += Number(product.price) * quantity;
      verifiedItems.push({
        productId: Number(product.id),
        name: product.name,
        category: product.category,
        image: product.image,
        size: optionalValue(item.size),
        color: optionalValue(item.color),
        quantity,
        unitPrice: Number(product.price)
      });
    }

    const paymentMethod = optionalValue(payment) || 'À la livraison';
    const { rows: [order] } = await client.query(
      "INSERT INTO orders(customer,total,status,payment,phone,address) VALUES($1,$2,'En cours',$3,$4,$5) RETURNING id",
      [fullName, total, paymentMethod, phone, address]
    );

    for (const item of verifiedItems) {
      await decrementStock(client, item.productId, item.quantity);
      await client.query(
        'INSERT INTO order_items(order_id,product_id,product_name,category,image,size,color,quantity,unit_price) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [order.id, item.productId, item.name, item.category, item.image, item.size, item.color, item.quantity, item.unitPrice]
      );
    }

    await client.query('COMMIT');
    return Number(order.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateStatus(id, status) {
  const { rows: [order] } = await db.query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, status',
    [status, id]
  );
  return order;
}

export async function getStats() {
  const { rows: [stats] } = await db.query(
    'SELECT COALESCE(SUM(total),0)::int AS revenue, COUNT(*)::int AS orders, COUNT(DISTINCT customer)::int AS clients FROM orders'
  );
  return stats;
}

function toOrder(row) {
  return {
    id: Number(row.id),
    customer: row.customer || '',
    total: Number(row.total),
    status: row.status || '',
    payment: row.payment || '',
    created_at: row.created_at,
    phone: row.phone || '',
    address: row.address || '',
    items: Array.isArray(row.items) ? row.items : []
  };
}

export async function findRecent(limit = 5) {
  const { rows } = await db.query(
    `SELECT o.id, o.customer, o.total, o.status, o.payment, o.created_at, o.phone, o.address,
      COALESCE(
        json_agg(
          json_build_object(
            'name', oi.product_name,
            'category', oi.category,
            'image', oi.image,
            'size', oi.size,
            'color', oi.color,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price
          ) ORDER BY oi.id
        ) FILTER (WHERE oi.id IS NOT NULL),
        '[]'::json
      ) AS items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id
    ORDER BY o.id DESC
    LIMIT $1`,
    [limit]
  );
  return rows.map(toOrder);
}
