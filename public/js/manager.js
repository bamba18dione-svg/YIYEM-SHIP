import { $, fmt, showToast } from './utils.js';
import { state } from './store.js';
import * as api from './api.js';
import { renderProducts } from './products.js';
import { renderCart } from './cart.js';

export function showManager() {
  renderAdmin();
  renderDashboard();
  $('#managerModal').classList.add('show');
  lucide.createIcons();
}

async function managerLogout() {
  try {
    await fetch('/api?action=logout', { method: 'POST' });
  } catch (err) {
    console.error('Erreur de déconnexion:', err);
  }
  $('#managerModal').classList.remove('show');
  const loginModal = $('#loginModal');
  if (loginModal) loginModal.classList.remove('show');
  $('#managerPassword').value = '';
  $('#loginError').textContent = '';
  showToast('Vous êtes déconnecté.');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function clientValue(value) {
  const normalized = String(value ?? '').trim();
  return normalized || 'Non renseigné';
}

function optionalValue(value) {
  return String(value ?? '').trim();
}

function variantDetails(item) {
  const details = [];
  const size = optionalValue(item?.size || item?.selectedSize);
  const color = optionalValue(item?.color || item?.selectedColor);
  if (size) details.push(`Taille : ${size}`);
  if (color) details.push(`Couleur : ${color}`);
  return details;
}

function formatOrderDate(value) {
  return value ? new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Date inconnue';
}

function orderItems(order) {
  return Array.isArray(order?.items) ? order.items : [];
}

function renderOrderProduct(item) {
  const name = clientValue(item?.name || item?.product_name);
  const category = clientValue(item?.category || item?.type);
  const image = String(item?.image || item?.img || '').trim();
  const quantity = Math.max(1, Number(item?.quantity) || 1);
  const variants = variantDetails(item);
  const metadata = [...variants, `Qté ${quantity}`].join(' · ');
  const media = image
    ? `<img class="order-product-image" src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy">`
    : '<span class="order-product-image placeholder" aria-hidden="true"><i data-lucide="image-off"></i></span>';

  return `<div class="order-product">${media}<span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(category)} · ${escapeHtml(metadata)}</small></span></div>`;
}

function renderOrderProducts(order) {
  const items = orderItems(order);
  if (!items.length) {
    return '<div class="order-products order-products-empty"><span class="order-product-image placeholder" aria-hidden="true"><i data-lucide="package"></i></span><span><strong>Article non détaillé</strong><small>Commande antérieure</small></span></div>';
  }

  const visibleItems = items.slice(0, 2);
  const remaining = items.length - visibleItems.length;
  const more = remaining > 0
    ? `<small class="order-products-more">+ ${remaining} article${remaining > 1 ? 's' : ''}</small>`
    : '';

  return `<div class="order-products">${visibleItems.map(renderOrderProduct).join('')}${more}</div>`;
}

function statusClass(status) {
  const normalized = String(status).toLowerCase();
  if (['livrée', 'livrée', 'livré', 'livre', 'terminée', 'terminee', 'payée', 'payee'].some(k => normalized.includes(k))) return 'done';
  if (['expédié', 'expedie', 'en livraison', 'coursier'].some(k => normalized.includes(k))) return 'shipping';
  if (['annulé', 'annule', 'refusé', 'refuse'].some(k => normalized.includes(k))) return 'cancelled';
  return 'pending';
}

function renderOrderRow(order) {
  const customer = clientValue(order.customer);
  const phone = clientValue(order.phone);
  const address = clientValue(order.address);
  const payment = clientValue(order.payment) === 'Non renseigné' ? 'À la livraison' : clientValue(order.payment);
  const createdAt = formatOrderDate(order.created_at);
  const status = clientValue(order.status) === 'Non renseigné' ? 'En cours' : clientValue(order.status);

  return `<div class="order-row" data-id="${Number(order.id)}" role="button" tabindex="0" aria-label="Voir la commande NS-${Number(order.id)}"><div><strong>#NS-${Number(order.id)}</strong><small><b>Client :</b> ${escapeHtml(customer)}</small><small><b>Tél :</b> ${escapeHtml(phone)}</small><small><b>Paiement :</b> ${escapeHtml(payment)}</small><small>${escapeHtml(createdAt)}</small></div>${renderOrderProducts(order)}<span class="order-total">${fmt(order.total)}</span><span class="status ${statusClass(status)}">${escapeHtml(status)}</span></div>`;
}

function appendOrderItems(detailContent, order) {
  const heading = document.createElement('div');
  heading.className = 'order-detail-header';
  heading.textContent = 'Articles commandés';
  detailContent.append(heading);

  const list = document.createElement('div');
  list.className = 'order-detail-products';
  const items = orderItems(order);

  if (!items.length) {
    const empty = document.createElement('small');
    empty.className = 'empty-state compact';
    empty.textContent = 'Le détail des articles n’est pas disponible pour cette commande.';
    list.append(empty);
  } else {
    items.forEach(item => {
      const name = clientValue(item?.name || item?.product_name);
      const category = clientValue(item?.category || item?.type);
      const image = String(item?.image || item?.img || '').trim();
      const quantity = Math.max(1, Number(item?.quantity) || 1);
      const unitPrice = Number(item?.unit_price);
      const variants = variantDetails(item);
      const row = document.createElement('div');
      row.className = 'order-detail-product';

      if (image) {
        const imageElement = document.createElement('img');
        imageElement.src = image;
        imageElement.alt = `${name} — ${category}`;
        imageElement.loading = 'lazy';
        row.append(imageElement);
      } else {
        const placeholder = document.createElement('span');
        placeholder.className = 'order-detail-image-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.textContent = '—';
        row.append(placeholder);
      }

      const info = document.createElement('div');
      info.className = 'order-detail-product-info';
      const nameElement = document.createElement('strong');
      nameElement.textContent = name;
      const categoryElement = document.createElement('span');
      categoryElement.textContent = `Type : ${category}`;
      const variantElement = document.createElement('small');
      variantElement.textContent = variants.length ? variants.join(' · ') : 'Variante : non renseignée';
      const quantityElement = document.createElement('small');
      quantityElement.textContent = `Quantité : ${quantity}${Number.isFinite(unitPrice) && unitPrice > 0 ? ` · ${fmt(unitPrice)} / unité` : ''}`;
      info.append(nameElement, categoryElement, variantElement, quantityElement);
      row.append(info);
      list.append(row);
    });
  }

  detailContent.append(list);
}

function showOrderDetails(order) {
  const detailPanel = $('#orderDetailPanel');
  const detailContent = $('#orderDetailContent');
  const details = [
    ['Nom complet', clientValue(order.customer)],
    ['Téléphone', clientValue(order.phone)],
    ['Adresse', clientValue(order.address)],
    ['Mode de paiement', clientValue(order.payment) === 'Non renseigné' ? 'À la livraison' : clientValue(order.payment)],
    ['Date & heure', formatOrderDate(order.created_at)]
  ];

  detailContent.replaceChildren();
  details.forEach(([label, value]) => {
    const item = document.createElement('div');
    item.className = 'order-detail-item';
    const labelElement = document.createElement('span');
    labelElement.textContent = label;
    const valueElement = document.createElement('strong');
    valueElement.textContent = value;
    item.append(labelElement, valueElement);
    detailContent.append(item);
  });

  const statusItem = document.createElement('div');
  statusItem.className = 'order-detail-item order-status-item';
  const currentStatus = clientValue(order.status) === 'Non renseigné' ? 'En cours' : clientValue(order.status);
  statusItem.innerHTML = `
    <span>Changer le statut</span>
    <div class="status-action-group" style="display:flex;gap:8px;margin-top:4px;">
      <select id="updateStatusSelect" class="status-select" style="padding:6px 10px;border-radius:6px;border:1px solid var(--line);font-size:12px;font-weight:700;">
        <option value="En cours" ${currentStatus === 'En cours' ? 'selected' : ''}>⏳ En cours</option>
        <option value="Expédié" ${currentStatus === 'Expédié' ? 'selected' : ''}>🚚 Expédié</option>
        <option value="Livré" ${currentStatus === 'Livré' ? 'selected' : ''}>✅ Livré</option>
        <option value="Annulé" ${currentStatus === 'Annulé' ? 'selected' : ''}>❌ Annulé</option>
      </select>
      <button type="button" class="primary" id="saveStatusBtn" style="padding:6px 14px;font-size:12px;">Enregistrer</button>
    </div>
  `;
  detailContent.append(statusItem);

  const saveBtn = statusItem.querySelector('#saveStatusBtn');
  const statusSelect = statusItem.querySelector('#updateStatusSelect');
  saveBtn.onclick = async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Enregistrement...';
    const res = await api.updateOrderStatus(order.id, statusSelect.value);
    if (res.ok) {
      order.status = statusSelect.value;
      showToast(`Statut commande #${order.id} : ${statusSelect.value}`);
      renderDashboard();
    } else {
      alert(res.data?.error || 'Erreur lors de la mise à jour.');
    }
    saveBtn.disabled = false;
    saveBtn.textContent = 'Enregistrer';
  };

  appendOrderItems(detailContent, order);
  detailPanel.hidden = false;
}

export async function renderDashboard() {
  const d = await api.fetchDashboard();
  if (!d) return;
  const values = d.orders === 0 ? [0, 0, 0, 0, 0, 0, 0] : [52, 72, 44, 85, 65, 91, 60];
  const recentOrders = Array.isArray(d.recent) ? d.recent : [];
  $('#revenueStat').textContent = fmt(d.revenue);
  $('#ordersStat').textContent = d.orders;
  $('#clientsStat').textContent = d.clients;
  $('#stockStat').textContent = d.stock;
  $('#lowStockStat').textContent = `${d.low.length} à surveiller`;
  $('#weeklyRevenue').textContent = fmt(d.revenue);
  $('#salesChart').innerHTML = values.map(v => `<span class="chart-bar" style="height:${v}%"></span>`).join('');
  const paymentStatsEl = $('#paymentStats');
  if (paymentStatsEl && d.orders === 0) {
    paymentStatsEl.innerHTML = `
      <div><span>Orange Money</span><strong>0%</strong></div>
      <div><span>Wave</span><strong>0%</strong></div>
      <div><span>À la livraison</span><strong>0%</strong></div>
    `;
  }
  $('#ordersTable').innerHTML = recentOrders.length
    ? recentOrders.map(renderOrderRow).join('')
    : '<div class="empty-state"><span class="empty-icon">🛒</span><strong>Aucune commande</strong><small>Les commandes récentes apparaîtront ici.</small></div>';

  $('#ordersTable').querySelectorAll('.order-row').forEach((row, index) => {
    const openDetails = () => showOrderDetails(recentOrders[index]);
    row.onclick = openDetails;
    row.onkeydown = event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDetails();
      }
    };
  });

  $('#lowStockList').innerHTML = (d.low || []).length
    ? (d.low || []).map(p => `<div class="low-stock-item"><img src="${p.img}"><div><strong>${p.name}</strong><small>Plus que ${p.stock} en stock</small></div></div>`).join('')
    : '<div class="empty-state compact"><span class="empty-icon">📦</span><strong>Stock sain</strong><small>Aucun article à surveiller pour le moment.</small></div>';
  lucide.createIcons();
}

export function renderAdmin() {
  $('#adminList').innerHTML = state.products.map(p => `<div class="admin-product"><img src="${p.img}" alt=""><div class="admin-product-info"><strong>${p.name}</strong><small>${fmt(p.price)} · ${p.category}</small></div><button class="small-button" onclick="editProduct(${p.id})"><i data-lucide="pencil" size="15"></i></button><button class="small-button delete" onclick="deleteProduct(${p.id})"><i data-lucide="trash-2" size="15"></i></button></div>`).join('');
  lucide.createIcons();
}

function openForm(p) {
  $('#productForm').reset();
  $('#productFormModal').classList.add('show');
  $('#formTitle').textContent = p ? 'Modifier l’article' : 'Ajouter un article';
  if (p) {
    $('#productId').value = p.id;
    $('#formName').value = p.name;
    $('#formBrand').value = p.brand;
    $('#formCategory').value = p.category;
    $('#formPrice').value = p.price;
    $('#formOld').value = p.old || '';
    $('#formSizes').value = p.sizes.join(', ');
    $('#formDesc').value = (p.desc && p.desc !== 'undefined') ? p.desc : (p.description && p.description !== 'undefined' ? p.description : '');
    $('#formTag').value = p.tag || '';
    $('#formStock').value = p.stock || 10;
  }
}

function compressImageFile(file, maxDim = 800, quality = 0.8) {
  return new Promise(resolve => {
    if (!file || !file.type.startsWith('image/')) return resolve(file);
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          blob => {
            if (!blob || blob.size >= file.size) return resolve(file);
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = ev.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export function editProduct(id) {
  openForm(state.products.find(p => p.id === id));
}

export async function deleteProduct(id) {
  if (!confirm('Supprimer cet article du catalogue ?')) return;
  const previousProducts = [...state.products];
  state.products = state.products.filter(p => p.id !== id);
  renderProducts();
  renderCart();
  renderAdmin();
  renderDashboard();

  const r = await api.deleteProduct(id);
  if (r.error) {
    state.products = previousProducts;
    renderProducts();
    renderCart();
    renderAdmin();
    renderDashboard();
    return alert(r.error);
  }

  showToast('Article supprimé.');
}

export async function productFormSubmit(e) {
  e.preventDefault();
  const fieldMap = {
    id: 'productId',
    name: 'formName',
    brand: 'formBrand',
    category: 'formCategory',
    price: 'formPrice',
    old: 'formOld',
    sizes: 'formSizes',
    desc: 'formDesc',
    tag: 'formTag',
    stock: 'formStock'
  };

  const f = new FormData();
  Object.entries(fieldMap).forEach(([key, id]) => {
    const field = document.getElementById(id);
    if (field) f.append(key, field.value);
  });

  if ($('#formImg').files[0]) {
    const optimizedFile = await compressImageFile($('#formImg').files[0]);
    f.append('image', optimizedFile);
  }
  const d = await api.saveProduct(f);
  if (d.error) { alert(d.error); return; }
  const { fetchProducts } = api;
  const list = await fetchProducts();
  state.products = Array.isArray(list) ? list : state.products;
  renderProducts();
  renderCart();
  renderAdmin();
  renderDashboard();
  $('#productFormModal').classList.remove('show');
  showToast('Article enregistré.');
}

window.editProduct = editProduct;
window.deleteProduct = deleteProduct;

export async function openManagerAccess() {
  const session = await api.checkSession();
  if (session.manager) {
    showManager();
  } else {
    const loginModal = $('#loginModal');
    if (loginModal) loginModal.classList.add('show');
    $('#managerEmail')?.focus();
  }
}

export function closeLoginModal() {
  const loginModal = $('#loginModal');
  if (loginModal) loginModal.classList.remove('show');
  const err = $('#loginError');
  if (err) err.textContent = '';
}

async function managerLogin(e) {
  e.preventDefault();
  const r = await fetch('/api?action=login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: $('#managerEmail').value, password: $('#managerPassword').value })
  });
  if (r.ok) {
    $('#loginError').textContent = '';
    closeLoginModal();
    showManager();
  } else {
    $('#loginError').textContent = (await r.json()).error || 'Identifiants incorrects.';
  }
}

window.openManagerAccess = openManagerAccess;

export function setupManager() {
  const managerTrigger = $('#managerTrigger');
  if (managerTrigger) managerTrigger.onclick = openManagerAccess;
  const footerManagerLink = $('#footerManagerLink');
  if (footerManagerLink) {
    footerManagerLink.onclick = e => {
      e.preventDefault();
      openManagerAccess();
    };
  }
  const closeLoginBtn = $('#closeLoginModal');
  if (closeLoginBtn) closeLoginBtn.onclick = closeLoginModal;
  const loginModal = $('#loginModal');
  if (loginModal) {
    loginModal.onclick = e => {
      if (e.target === loginModal) closeLoginModal();
    };
  }
  const visitorAccess = $('#visitorAccess');
  if (visitorAccess) visitorAccess.onclick = closeLoginModal;

  $('#loginForm').onsubmit = managerLogin;
  $('#logout').onclick = managerLogout;
  $('#newProduct').onclick = () => openForm();
  $('#closeProductForm').onclick = () => $('#productFormModal').classList.remove('show');
  $('#productForm').onsubmit = productFormSubmit;
  document.querySelectorAll('.dash-tab').forEach(tab => tab.onclick = () => {
    document.querySelectorAll('.dash-tab').forEach(x => x.classList.toggle('active', x === tab));
    const section = tab.dataset.section;
    $('#overviewSection').hidden = section !== 'overview';
    $('#productsSection').hidden = section !== 'products';
    const securitySection = $('#securitySection');
    if (securitySection) securitySection.hidden = section !== 'security';
  });

  const changePasswordForm = $('#changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.onsubmit = async e => {
      e.preventDefault();
      const currentPassword = $('#currentPassword').value;
      const newPassword = $('#newPassword').value;
      const confirmNewPassword = $('#confirmNewPassword').value;
      const errorEl = $('#changePasswordError');
      const submitBtn = $('#savePasswordBtn');

      if (errorEl) errorEl.textContent = '';

      if (newPassword.length < 6) {
        if (errorEl) errorEl.textContent = 'Le nouveau mot de passe doit comporter au moins 6 caractères.';
        return;
      }

      if (newPassword !== confirmNewPassword) {
        if (errorEl) errorEl.textContent = 'Les deux nouveaux mots de passe ne correspondent pas.';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Enregistrement...</span>';

      const res = await api.changePassword(currentPassword, newPassword, confirmNewPassword);
      if (res.ok) {
        changePasswordForm.reset();
        showToast('✓ Mot de passe gérant mis à jour avec succès !');
      } else {
        if (errorEl) errorEl.textContent = res.data?.error || 'Erreur lors de la mise à jour.';
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Mettre à jour le mot de passe</span>';
    };
  }
}
