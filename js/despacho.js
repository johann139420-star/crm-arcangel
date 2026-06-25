// ============================================================
// Despacho
// ============================================================

const VistaDespacho = {
  async render() {
    const cont = document.getElementById('vistaContenido');
    cont.innerHTML = `<div class="spinner"></div>`;

    const { data } = await supabaseClient
      .from('pedidos')
      .select('*, clientes(nombre, ciudad, direccion), envios(*)')
      .in('estado', ['facturado', 'despachado'])
      .order('creado_en', { ascending: false });

    const pedidos = data || [];
    const pendientes = pedidos.filter(p => p.estado === 'facturado');
    const enCurso = pedidos.filter(p => p.estado === 'despachado');

    cont.innerHTML = `
      <h2 class="titulo-seccion">Despacho</h2>
      <p class="subtitulo-seccion">Pedidos listos para enviar y en trÃ¡nsito</p>

      <p class="panel__titulo" style="margin-bottom:10px;">Pendientes de despacho (${pendientes.length})</p>
      <div id="despPendientes" style="margin-bottom:24px;"></div>

      <p class="panel__titulo" style="margin-bottom:10px;">En trÃ¡nsito (${enCurso.length})</p>
      <div id="despEnCurso"></div>
    `;

    this.renderPendientes(pendientes);
    this.renderEnCurso(enCurso);
  },

  renderPendientes(lista) {
    const cont = document.getElementById('despPendientes');
    if (lista.length === 0) {
      cont.innerHTML = `<p class="vacio">No hay pedidos pendientes de despacho.</p>`;
      return;
    }
    cont.innerHTML = lista.map(p => `
      <div class="panel" style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <div style="font-weight:600; font-size:14px;">Pedido #${p.numero_pedido} â€” ${escapeHtml(p.clientes?.nombre || '')}</div>
          <div style="font-size:12px; color:var(--texto-muted);">${escapeHtml(p.clientes?.ciudad || 'Ciudad no especificada')}</div>
        </div>
        <button class="btn btn--primary btn--sm" data-id="${p.id}">Marcar despachado</button>
      </div>
    `).join('');

    cont.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => this.abrirModalDespacho(btn.dataset.id));
    });
  },

  renderEnCurso(lista) {
    const cont = document.getElementById('despEnCurso');
    if (lista.length === 0) {
      cont.innerHTML = `<p class="vacio">No hay envÃ­os en trÃ¡nsito.</p>`;
      return;
    }
    cont.innerHTML = lista.map(p => {
      const envio = Array.isArray(p.envios) ? p.envios[0] : p.envios;
      return `
      <div class="panel" style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <div style="font-weight:600; font-size:14px;">Pedido #${p.numero_pedido} â€” ${escapeHtml(p.clientes?.nombre || '')}</div>
          <div style="font-size:12px; color:var(--texto-muted);">${envio?.transportadora ? escapeHtml(envio.transportadora) + ' Â· ' : ''}GuÃ­a: ${escapeHtml(envio?.numero_guia || 'sin asignar')}</div>
        </div>
        <button class="btn btn--outline btn--sm" data-envio="${envio?.id}">Marcar entregado</button>
      </div>
    `;
    }).join('');

    cont.querySelectorAll('button[data-envio]').forEach(btn => {
      btn.addEventListener('click', () => this.marcarEntregado(btn.dataset.envio));
    });
  },

  abrirModalDespacho(pedidoId) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <h3>Confirmar despacho</h3>
        <div class="campo"><label>Transportadora</label><input id="despTrans" type="text" placeholder="Ej. Servientrega, TCC, InterrapidÃ­simo"></div>
        <div class="campo"><label>NÃºmero de guÃ­a</label><input id="despGuia" type="text"></div>
        <div class="modal-actions">
          <button class="btn btn--outline" id="despCancelar">Cancelar</button>
          <button class="btn btn--primary" id="despGuardar">Confirmar despacho</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#despCancelar').addEventListener('click', () => overlay.remove());

    overlay.querySelector('#despGuardar').addEventListener('click', async () => {
      const transportadora = overlay.querySelector('#despTrans').value.trim();
      const guia = overlay.querySelector('#despGuia').value.trim();

      const { error: errEnvio } = await supabaseClient.from('envios').insert({
        pedido_id: pedidoId,
        estado: 'en_transito',
        transportadora: transportadora || null,
        numero_guia: guia || null,
        despachado_por: Auth.perfil.id,
        despachado_en: new Date().toISOString(),
      });
      if (errEnvio) { mostrarToast('No se pudo registrar el despacho', 'error'); return; }

      await supabaseClient.from('pedidos').update({ estado: 'despachado' }).eq('id', pedidoId);

      overlay.remove();
      mostrarToast('Pedido marcado como despachado');
      VistaDespacho.render();
    });
  },

  async marcarEntregado(envioId) {
    if (!envioId) return;
    const { error } = await supabaseClient.from('envios').update({ estado: 'entregado', entregado_en: new Date().toISOString() }).eq('id', envioId);
    if (error) { mostrarToast('No se pudo actualizar el envÃ­o', 'error'); return; }

    const { data: envio } = await supabaseClient.from('envios').select('pedido_id').eq('id', envioId).single();
    if (envio) {
      await supabaseClient.from('pedidos').update({ estado: 'entregado' }).eq('id', envio.pedido_id);
    }
    mostrarToast('Pedido marcado como entregado');
    VistaDespacho.render();
  },
};
