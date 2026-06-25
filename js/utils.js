// ============================================================
// Utilidades compartidas
// ============================================================

function fmtCOP(n) {
  if (n == null) return 'â€”';
  return '$ ' + Math.round(n).toLocaleString('es-CO');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function mostrarToast(mensaje, tipo = 'ok') {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.className = 'toast' + (tipo === 'error' ? ' toast--error' : '');
  toast.hidden = false;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.hidden = true; }, 3200);
}

function badgeEstadoPedido(estado) {
  const map = {
    cotizacion: 'gris',
    confirmado: 'amarillo',
    facturado: 'azul',
    despachado: 'verde',
    entregado: 'verde',
    cancelado: 'rojo',
  };
  return map[estado] || 'gris';
}

function badgeEstadoEnvio(estado) {
  const map = {
    pendiente: 'gris',
    preparando: 'amarillo',
    en_transito: 'azul',
    entregado: 'verde',
    devuelto: 'rojo',
  };
  return map[estado] || 'gris';
}

function capitalizar(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

const ICONOS = {
  dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" stroke-width="2"/></svg>',
  ventas: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="21" r="1.5" fill="currentColor"/><circle cx="19" cy="21" r="1.5" fill="currentColor"/><path d="M2.5 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 8H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  inventario: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M3.5 8.5L12 13l8.5-4.5M12 13v8" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  pedidos: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" stroke-width="2"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="2"/><path d="M8 12h8M8 16h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  despacho: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="1" y="6" width="13" height="11" rx="1" stroke="currentColor" stroke-width="2"/><path d="M14 9h4l4 4v4h-8" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="5.5" cy="19.5" r="1.8" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="19.5" r="1.8" stroke="currentColor" stroke-width="2"/></svg>',
  facturacion: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 3h10l3 3v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 9h6M9 13h6M9 17h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};
