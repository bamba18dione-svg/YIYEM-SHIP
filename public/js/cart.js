import { $, fmt, showToast } from './utils.js';
import { state } from './store.js';
import * as api from './api.js';
import { renderProducts } from './products.js';

export function closeAll() {
  $('#modal').classList.remove('show');
  $('#drawer').classList.remove('open');
  $('#overlay').classList.remove('show');
}

export function renderCart() {
  const count = state.cart.reduce((a, x) => a + x.quantity, 0);
  $('#basketCount').textContent = count;
  $('#drawerCount').textContent = count ? '(' + count + ')' : '';
  $('#total').textContent = fmt(state.cart.reduce((a, x) => a + x.price * x.quantity, 0));
  $('#cartItems').innerHTML = state.cart.length
    ? state.cart.map((x, i) => `<div class="cart-item"><img src="${x.img}"><div><h5>${x.name}</h5><p>Taille : ${x.size} · Qté : ${x.quantity}</p><strong>${fmt(x.price * x.quantity)}</strong></div><button class="icon-btn" style="margin-left:auto" onclick="removeCart(${i})"><i data-lucide="trash-2" size="16"></i></button></div>`).join('')
    : '<div class="empty"><i data-lucide="shopping-bag" size="35"></i><p>Votre panier est encore vide.</p></div>';
  lucide.createIcons();
}

export function removeCart(i) {
  state.cart.splice(i, 1);
  renderCart();
}

export function openDrawer() {
  $('#drawer').classList.add('open');
  $('#overlay').classList.add('show');
}

function getSelectedPayment() {
  const checked = document.querySelector('input[name="paymentMethod"]:checked');
  return checked ? checked.value : 'À la livraison';
}

export async function checkout() {
  if (!state.cart.length) return showToast('Votre panier est vide.');

  const fullName = $('#customerName').value.trim();
  const phone = $('#customerPhone').value.trim();
  const address = $('#customerAddress').value.trim();
  const payment = getSelectedPayment();

  if (!fullName || !phone || !address) {
    showToast('Veuillez remplir votre nom, téléphone et adresse.');
    return;
  }

  const { ok, data } = await api.placeOrder(state.cart, {
    fullName,
    phone,
    address
  }, payment);

  if (!ok) return alert(data.error);
  state.cart = [];
  renderCart();
  closeAll();
  $('#customerName').value = '';
  $('#customerPhone').value = '';
  $('#customerAddress').value = '';
  await reloadProducts();
  showToast(`Commande #${data.order} enregistrée.`);
}

export async function orderViaWhatsApp() {
  if (!state.cart.length) return showToast('Votre panier est vide.');

  const fullName = $('#customerName').value.trim() || 'Client YIYEM SHIP';
  const phone = $('#customerPhone').value.trim() || 'Non renseigné';
  const address = $('#customerAddress').value.trim() || 'Non renseignée';
  const payment = getSelectedPayment();

  const total = state.cart.reduce((a, x) => a + x.price * x.quantity, 0);

  let message = `Bonjour *YIYEM SHIP* ! 👋\nJe souhaite passer une commande :\n\n`;
  message += `🛒 *ARTICLES COMMANDÉS :*\n`;
  state.cart.forEach((item, idx) => {
    const size = item.size ? ` (Taille: ${item.size})` : '';
    message += `${idx + 1}. *${item.name}*${size} x${item.quantity} — ${fmt(item.price * item.quantity)}\n`;
  });
  message += `\n💰 *Total :* ${fmt(total)}\n`;
  message += `💳 *Paiement :* ${payment}\n\n`;
  message += `📍 *LIVRAISON :*\n`;
  message += `• *Nom :* ${fullName}\n`;
  message += `• *Téléphone :* ${phone}\n`;
  message += `• *Adresse :* ${address}\n`;

  if (fullName !== 'Client YIYEM SHIP' && phone !== 'Non renseigné' && address !== 'Non renseignée') {
    try {
      await api.placeOrder(state.cart, { fullName, phone, address }, `WhatsApp (${payment})`);
      state.cart = [];
      renderCart();
      closeAll();
      $('#customerName').value = '';
      $('#customerPhone').value = '';
      $('#customerAddress').value = '';
      await reloadProducts();
      showToast('Commande enregistrée et redirection WhatsApp...');
    } catch (e) {
      console.error('Erreur enregistrement DB WhatsApp:', e);
    }
  }

  const phoneShop = '221777770961';
  const waUrl = `https://wa.me/${phoneShop}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');
}

async function reloadProducts() {
  const r = await api.fetchProducts();
  state.products = Array.isArray(r) ? r : state.products;
  renderProducts();
  renderCart();
}

window.removeCart = removeCart;

export function setupCart() {
  $('#closeModal').onclick = closeAll;
  $('#closeCart').onclick = closeAll;
  $('#overlay').onclick = closeAll;
  $('#plus').onclick = () => $('#qty').textContent = ++state.quantity;
  $('#minus').onclick = () => { if (state.quantity > 1) $('#qty').textContent = --state.quantity; };
  $('#addToCart').onclick = () => {
    state.cart.push({ ...state.selected, size: state.selectedSize, quantity: state.quantity });
    renderCart();
    closeAll();
    showToast('Produit ajouté au panier');
  };
  $('#cartTrigger').onclick = openDrawer;
  $('#checkout').onclick = checkout;
  const waBtn = $('#whatsappOrder');
  if (waBtn) waBtn.onclick = orderViaWhatsApp;
}
