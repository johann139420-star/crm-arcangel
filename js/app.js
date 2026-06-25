// ============================================================
// App â€” orquestaciÃ³n principal
// ============================================================

const MODULOS_INFO = {
  dashboard:   { label: 'Dashboard',     vista: VistaDashboard },
  ventas:      { label: 'Punto de venta', vista: VistaVentas },
  inventario:  { label: 'Inventario',    vista: VistaInventario },
  pedidos:     { label: 'Pedidos',       vista: VistaPedidos },
  despacho:    { label: 'Despacho',      vista: VistaDespacho },
  facturacion: { label: 'FacturaciÃ³n',   vista: VistaFacturacion },
};

let vistaActual = 'dashboard';

function construirMenu() {
  const permitidos = Auth.modulosPermitidos();

  // Sidebar de escritorio
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = permitidos.map(id => `
    <button class="navlink" data-modulo="${id}">
      ${ICONOS[id]}
      <span>${MODULOS_INFO[id].label}</span>
    </button>
  `).join('');
  nav.querySelectorAll('.navlink').forEach(btn => {
    btn.addEventListener('click', () => navegarA(btn.dataset.modulo));
  });

  // Barra inferior mÃ³vil (mÃ¡ximo 5 Ã­tems visibles cÃ³modamente)
  const bottombar = document.getElementById('bottombarMobile');
  bottombar.innerHTML = permitidos.slice(0, 5).map(id => `
    <button class="bottomlink" data-modulo="${id}">
      ${ICONOS[id]}
      <span>${MODULOS_INFO[id].label}</span>
    </button>
  `).join('');
  bottombar.querySelectorAll('.bottomlink').forEach(btn => {
    btn.addEventListener('click', () => navegarA(btn.dataset.modulo));
  });

  document.getElementById('nombreUsuario').textContent = Auth.perfil.nombre_completo;
  document.getElementById('rolUsuario').textContent = Auth.rolLabel();
}

function marcarActivo(modulo) {
  document.querySelectorAll('.navlink').forEach(b => b.classList.toggle('navlink--active', b.dataset.modulo === modulo));
  document.querySelectorAll('.bottomlink').forEach(b => b.classList.toggle('bottomlink--active', b.dataset.modulo === modulo));
  document.getElementById('tituloMobile').textContent = MODULOS_INFO[modulo]?.label || '';
}

async function navegarA(modulo) {
  if (!Auth.puedeVer(modulo)) return;
  vistaActual = modulo;
  marcarActivo(modulo);
  window.scrollTo(0, 0);
  await MODULOS_INFO[modulo].vista.render();
}

function iniciarApp() {
  document.getElementById('vistaLogin').hidden = true;
  document.getElementById('vistaApp').hidden = false;
  construirMenu();
  const permitidos = Auth.modulosPermitidos();
  navegarA(permitidos[0] || 'dashboard');
}

function bindLogout() {
  document.getElementById('btnLogout').addEventListener('click', async () => {
    await Auth.logout();
    document.getElementById('vistaApp').hidden = true;
    document.getElementById('vistaLogin').hidden = false;
    document.getElementById('formLogin').reset();
  });
}

async function arrancar() {
  bindFormLogin();
  bindLogout();

  const perfil = await Auth.init();
  if (perfil) {
    iniciarApp();
  }
}

document.addEventListener('DOMContentLoaded', arrancar);
