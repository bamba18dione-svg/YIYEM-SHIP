const API = '/api';

export const $ = s => document.querySelector(s);
export const fmt = n => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

export function showToast(message) {
  const t = $('#toast');
  t.textContent = message;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}
