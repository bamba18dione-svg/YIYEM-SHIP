import { $, fmt } from './utils.js';
import { state } from './store.js';

function normalizeText(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function productMatchesQuery(p, rawQuery) {
  const qNorm = normalizeText(rawQuery);
  if (!qNorm) return true;
  const qCompact = qNorm.replace(/\s+/g, '');

  const haystack = normalizeText([
    p.name,
    p.category,
    p.brand,
    p.desc || p.description || '',
    p.tag || ''
  ].join(' '));
  const haystackCompact = haystack.replace(/\s+/g, '');

  if (haystack.includes(qNorm) || haystackCompact.includes(qCompact)) {
    return true;
  }

  const words = qNorm.split(' ').filter(Boolean);
  return words.every(w => {
    const wSingular = w.endsWith('s') && w.length > 2 ? w.slice(0, -1) : w;
    return haystack.includes(w) || haystack.includes(wSingular) || haystackCompact.includes(wSingular);
  });
}

export function renderProducts() {
  const rawQuery = ($('#search')?.value || '').trim();
  const isSearching = rawQuery.length > 0;

  if (isSearching && state.category !== 'Tous') {
    state.category = 'Tous';
    document.querySelectorAll('.chip').forEach(x => x.classList.toggle('selected', x.dataset.category === 'Tous'));
    document.querySelectorAll('.categorybar a[data-filter]').forEach(a => a.classList.toggle('active', a.dataset.filter === 'Tous'));
  }

  const list = state.products.filter(p => {
    const catMatch = isSearching || state.category === 'Tous' || p.category === state.category;
    return catMatch && productMatchesQuery(p, rawQuery);
  });

  $('#productGrid').innerHTML = list.map(p => `<article class="card" onclick="openProduct(${p.id})"><div class="image-wrap"><img src="${p.img}" alt="${p.name}">${p.tag ? `<span class="tag">${p.tag}</span>` : ''}<button class="fav" onclick="event.stopPropagation()"><i data-lucide="heart" size="17"></i></button></div><div class="card-body"><div class="brand">${p.brand}</div><div class="product-name">${p.name}</div><div class="price">${fmt(p.price)} ${p.old ? `<span class="old-price">${fmt(p.old)}</span>` : ''}</div><div class="rating"><i data-lucide="star"></i> 4.8 <span>· 36 avis</span></div></div></article>`).join('') || '<p>Aucun produit trouvé pour votre recherche.</p>';
  lucide.createIcons();
}

export function setCategory(c) {
  state.category = c;
  const searchInput = $('#search');
  if (searchInput && searchInput.value) {
    searchInput.value = '';
  }
  document.querySelectorAll('.chip').forEach(x => x.classList.toggle('selected', x.dataset.category === c));
  document.querySelectorAll('.categorybar a[data-filter]').forEach(a => a.classList.toggle('active', a.dataset.filter === c));
  renderProducts();
  $('#catalogue').scrollIntoView({ behavior: 'smooth' });
}

export function openProduct(id) {
  state.selected = state.products.find(p => p.id === id);
  state.selectedSize = state.selected.sizes[0];
  state.quantity = 1;
  $('#modalImg').src = state.selected.img;
  $('#modalBrand').textContent = state.selected.brand;
  $('#modalName').textContent = state.selected.name;
  $('#modalPrice').innerHTML = fmt(state.selected.price) + (state.selected.old ? ` <span class="old-price">${fmt(state.selected.old)}</span>` : '');
  $('#modalDesc').textContent = state.selected.desc;
  $('#qty').textContent = state.quantity;
  renderSizes();
  $('#modal').classList.add('show');
  $('#overlay').classList.add('show');
}

function renderSizes() {
  $('#sizes').innerHTML = state.selected.sizes.map(s => `<button class="size ${s === state.selectedSize ? 'active' : ''}" onclick="selectSize('${s}')">${s}</button>`).join('');
  $('#stock').textContent = state.selectedSize === 'XL' || state.selectedSize === '44' ? 'Plus que 2 articles en stock' : '✓ En stock — livraison disponible';
}

export function selectSize(s) {
  state.selectedSize = s;
  renderSizes();
}

window.openProduct = openProduct;
window.selectSize = selectSize;
window.setCategory = setCategory;
