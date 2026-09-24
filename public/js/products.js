import { $, fmt } from './utils.js';
import { state } from './store.js';

const CATEGORY_SYNONYMS = {
  'T-shirts': 't-shirt t-shirts tshirt tshirts teeshirt tee-shirt tee shirt polo polos haut hauts vetement vetements habit habits',
  'Jeans': 'jean jeans pantalon pantalons denim cargo baggy wide leg vetement vetements habit habits',
  'Foot': 'foot football maillot maillots soccer sport survêtement survetement tracksuit veste vetement vetements',
  'Basket': 'basket baskets basketball nba maillot maillots short sport vetement vetements',
  'Chaussures': 'chaussure chaussures sneaker sneakers basket baskets soulier souliers tennis running skate crampon',
  'Vêtements': 'vetement vetements habit habits mode streetwear'
};

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

  const cleanDesc = p.desc && p.desc !== 'undefined' ? p.desc : (p.description && p.description !== 'undefined' ? p.description : '');
  const synonyms = CATEGORY_SYNONYMS[p.category] || '';

  const haystack = normalizeText([
    p.name,
    p.category,
    p.brand,
    cleanDesc,
    p.tag || '',
    synonyms
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

  const fallbackImg = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80';
  $('#productGrid').innerHTML = list.map(p => `<article class="card" onclick="openProduct(${p.id})"><div class="image-wrap"><img src="${p.img}" alt="${p.name}" onerror="this.onerror=null;this.src='${fallbackImg}';">${p.tag ? `<span class="tag">${p.tag}</span>` : ''}<button class="fav" onclick="event.stopPropagation()"><i data-lucide="heart" size="17"></i></button></div><div class="card-body"><div class="brand">${p.brand}</div><div class="product-name">${p.name}</div><div class="price">${fmt(p.price)} ${p.old ? `<span class="old-price">${fmt(p.old)}</span>` : ''}</div><div class="rating"><i data-lucide="star"></i> 4.8 <span>· 36 avis</span></div></div></article>`).join('') || '<p>Aucun produit trouvé pour votre recherche.</p>';
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
  const descText = state.selected.desc && state.selected.desc !== 'undefined'
    ? state.selected.desc
    : (state.selected.description && state.selected.description !== 'undefined' ? state.selected.description : '');
  $('#modalDesc').textContent = descText;
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
