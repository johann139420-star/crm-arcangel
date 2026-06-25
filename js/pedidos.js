// ============================================================
// Pedidos â€” seguimiento general
// ============================================================

const VistaPedidos = {
  pedidos: [],
  filtroEstado: 'todos',

  async render() {
    const cont = document.getElementById('vistaContenido');
    cont.innerHTML = `<div class="spinner"></div>`;

    const { data } = await supabaseClient
      .from('pedidos')
      .select('*, clientes(nombre)')
      .order('creado_en', { ascending: false });
    this.pedidos = data || [];

    const estados = ['todos', 'cotizacion', 'confirmado', 'facturado', 'despachado', 'entregado', 'cancelado'];

    cont.innerHTML = `
      <h2 class="titulo-seccion">Pedidos</h2>
      <p class="subtitulo-seccion">Seguimiento de inicio a fin de cada venta</p>

      <div class="chips" id="pedChips">
        ${estados.map(e => `<button class="chip ${e === 'todos' ? 'chip--active' : ''}" data-estado="${e}">${capitalizar(e)}</button>`).join('')}
      </div>

      <div id="pedLista"></div>
    `;

    this.renderLista(this.pedidos);
    this.bindEventos();
  },

  renderLista(lista) {
    const cont = document.getElementById('pedLista');
    if (lista.length === 0) {
      cont.innerHTML = `<p class="vacio">No hay pedidos con ese filtro.</p>`;
      return;
    }
    cont.innerHTML = lista.map(p => `
      <div class="panel" style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <div style="font-weight:600; font-size:14px;">Pedido #${p.numero_pedido} â€” ${escapeHtml(p.clientes?.nombre || 'Cliente')}</div>
          <div style="font-size:12px; color:var(--texto-muted);">Canal: ${capitalizar(p.canal.replace('_',' '))} Â· ${new Date(p.creado_en).toLocaleDateString('es-CO')}</div>
        </div>
        <div style="display:flex; align-items:center; gap:14px;">
          <span style="font-weight:600; font-size:14px;">${fmtCOP(p.total)}</span>
          <span class="badge badge--${badgeEstadoPedido(p.estado)}">${p.estado}</span>
        </div>
      </div>
    `).join('');
  },

  bindEventos() {
    document.getElementById('pedChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      this.filtroEstado = chip.dataset.estado;
      document.querySelectorAll('#pedChips .chip').forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
      const lista = this.filtroEstado === 'todos' ? this.pedidos : this.pedidos.filter(p => p.estado === this.filtroEstado);
      this.renderLista(lista);
    });
  },
};
