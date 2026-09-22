const API = '/api';

async function postJson(url, data) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return { ok: r.ok, data: await r.json(), http: r };
}

export function fetchProducts() {
  return fetch(`${API}?action=products`).then(r => r.json());
}

export function placeOrder(items, customer, payment) {
  return postJson(`${API}?action=order`, {
    items: items.map(x => ({
      id: x.id,
      quantity: x.quantity,
      size: x.size || x.selectedSize || null,
      color: x.color || x.selectedColor || null
    })),
    customer: customer || {},
    payment: payment || 'À la livraison'
  });
}

export function login(credentials) {
  return postJson(`${API}?action=login`, credentials);
}

export function logout() {
  return postJson(`${API}?action=logout`, {});
}

export function checkSession() {
  return fetch(`${API}?action=session`).then(r => r.json()).catch(() => ({ manager: false }));
}

export function fetchDashboard() {
  return fetch(`${API}/dashboard`).then(r => (r.ok ? r.json() : null));
}

export function saveProduct(formData) {
  return fetch(`${API}/product`, { method: 'POST', body: formData }).then(r => r.json());
}

export function deleteProduct(id) {
  return fetch(`${API}/product/${id}`, { method: 'DELETE' }).then(r => r.json());
}

export function updateOrderStatus(id, status) {
  return postJson(`${API}/order/${id}/status`, { status });
}
