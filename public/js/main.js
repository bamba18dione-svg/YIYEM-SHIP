import { $ } from './utils.js';
import { state } from './store.js';
import { defaultProducts } from './data.js';
import * as api from './api.js';
import { renderProducts, setCategory } from './products.js?v=20260924';
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
  const searchInput = $('#search');
  if (searchInput) {
    searchInput.oninput = () => {
      renderProducts();
      if (searchInput.value.trim().length >= 2) {
        const cat = $('#catalogue');
        if (cat) {
          const rect = cat.getBoundingClientRect();
          if (rect.top > window.innerHeight * 0.65) {
            cat.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    };
    searchInput.onkeydown = e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        renderProducts();
        $('#catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
  }
}

function boot() {
  setupCategories();
  setupCart();
  setupManager();
  loadProducts();
  lucide.createIcons();
}

boot();

