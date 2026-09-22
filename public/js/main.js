import { $ } from './utils.js';
import { state } from './store.js';
import { defaultProducts } from './data.js';
import * as api from './api.js';
import { renderProducts, setCategory } from './products.js';
import { renderCart, setupCart } from './cart.js';
import { setupManager } from './manager.js';

async function loadProducts() {
  try {
    const data = await api.fetchProducts();
    if (!Array.isArray(data)) throw new Error('Format inattendu');
    state.products = data;
  } catch {
    state.products = defaultProducts;
    const t = $('#toast');
    t.textContent = 'Serveur indisponible : mode aperçu local.';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  }
  renderProducts();
  renderCart();
}

function setupCategories() {
  $('#chips').onclick = e => { if (e.target.dataset.category) setCategory(e.target.dataset.category); };
  document.querySelectorAll('[data-filter]').forEach(a => a.onclick = () => setCategory(a.dataset.filter));
  $('#search').oninput = renderProducts;
}

function boot() {
  setupCategories();
  setupCart();
  setupManager();
  loadProducts();
  lucide.createIcons();
}

boot();

