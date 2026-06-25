// ============================================================
// FacturaciÃ³n
// ============================================================

const VistaFacturacion = {
  async render() {
    const cont = document.getElementById('vistaContenido');
    cont.innerHTML = `<div class="spinner"></div>`;

    const [pendRes, factRes] = await Promise.all([
      supabaseClient.from('pedidos').select('*, clientes(nombre)').eq('estado', 'confirmado').order('creado_en', { ascending: false }),
      supabaseClient.from('facturas').select('*, pedidos(numero_pedido, clientes(nombre))').order('creada_en', { ascending: false }).limit(10),
    ]);

    const pendientes = pendRes.data || [];
    const facturas = factRes.data || [];

    cont.innerHTML = `
      <h2 class="titulo-seccion">FacturaciÃ³n</h2>
      <p class="subtitulo-seccion">Pedidos confirmados pendientes de facturar</p>

      <div id="factPendientes" style="margin-bottom:26px;"></div>

      <p class="panel__titulo" style="margin-bottom:10px;">Ãšltimas facturas emitidas</p>
      <div class="panel" style="padding:0;">
        <div class="tabla-wrap">
          <table class="tabla">
            <thead><tr><th>Factura</th><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead>
            <tbody>
              ${facturas.length === 0 ? `<tr><td colspan="5"><p class="vacio">AÃºn no se han emitido facturas.</p></td></tr>` : facturas.map(f => `
                <tr>
                  <td>#${f.numero_factura}</td>
                  <td>#${f.pedidos?.numero_pedido ?? 'â€”'}</td>
                  <td>${escapeHtml(f.pedidos?.clientes?.nombre || 'â€”')}</td>
                  <td>${fmtCOP(f.total)}</td>
                  <td><span class="badge badge--${f.estado === 'anulada' ? 'rojo' : 'verde'}">${f.estado}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.renderPendientes(pendientes);
  },

  renderPendientes(lista) {
    const cont = document.getElementById('factPendientes');
    if (lista.length === 0) {
      cont.innerHTML = `<p class="vacio">No hay pedidos pendientes de facturar.</p>`;
      return;
    }
    cont.innerHTML = lista.map(p => `
      <div class="panel" style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <div style="font-weight:600; font-size:14px;">Pedido #${p.numero_pedido} â€” ${escapeHtml(p.clientes?.nombre || '')}</div>
          <div style="font-size:12px; color:var(--texto-muted);">Total: ${fmtCOP(p.total)}</div>
        </div>
        <button class="btn btn--primary btn--sm" data-id="${p.id}" data-total="${p.total}">Generar factura</button>
      </div>
    `).join('');

    cont.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => this.generarFactura(btn.dataset.id, Number(btn.dataset.total)));
    });
  },

  async generarFactura(pedidoId, total) {
    const { error: errFact } = await supabaseClient.from('facturas').insert({
      pedido_id: pedidoId,
      total,
      emitida_por: Auth.perfil.id,
    });
    if (errFact) { mostrarToast('No se pudo generar la factura', 'error'); return; }

    await supabaseClient.from('pedidos').update({ estado: 'facturado' }).eq('id', pedidoId);

    mostrarToast('Factura generada con Ã©xito');
    this.render();
  },
};
