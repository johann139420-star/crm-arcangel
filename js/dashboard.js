// ============================================================
// Dashboard
// ============================================================

const VistaDashboard = {
  async render() {
    const cont = document.getElementById('vistaContenido');
    cont.innerHTML = `<div class="spinner"></div>`;

    const [pedidosRes, productosRes] = await Promise.all([
      supabaseClient.from('pedidos').select('*, clientes(nombre)').order('creado_en', { ascending: false }).limit(8),
      supabaseClient.from('productos').select('referencia, nombre, stock_actual, stock_minimo').eq('activo', true),
    ]);

    const pedidos = pedidosRes.data || [];
    const productos = productosRes.data || [];

    const hoy = new Date().toISOString().slice(0, 10);
    const ventasHoy = pedidos
      .filter(p => p.creado_en && p.creado_en.slice(0, 10) === hoy && p.estado !== 'cancelado')
      .reduce((s, p) => s + Number(p.total || 0), 0);

    const abiertos = pedidos.filter(p => ['cotizacion', 'confirmado'].includes(p.estado)).length;
    const porDespachar = pedidos.filter(p => p.estado === 'facturado').length;
    const bajoStock = productos.filter(p => p.stock_actual <= p.stock_minimo);

    const nombre = Auth.perfil?.nombre_completo?.split(' ')[0] || '';
    const fechaTexto = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });

    cont.innerHTML = `
      <h2 class="titulo-seccion">Hola, ${escapeHtml(nombre)}</h2>
      <p class="subtitulo-seccion">Resumen de hoy, ${fechaTexto}</p>

      <div class="metricas">
        <div class="metrica">
          <div class="metrica__top"><span class="metrica__label">Ventas de hoy</span></div>
          <div class="metrica__valor">${fmtCOP(ventasHoy)}</div>
        </div>
        <div class="metrica">
          <div class="metrica__top"><span class="metrica__label">Pedidos abiertos</span></div>
          <div class="metrica__valor">${abiertos}</div>
        </div>
        <div class="metrica">
          <div class="metrica__top"><span class="metrica__label">Por despachar</span></div>
          <div class="metrica__valor">${porDespachar}</div>
        </div>
        <div class="metrica">
          <div class="metrica__top"><span class="metrica__label">Stock bajo</span></div>
          <div class="metrica__valor" style="color:${bajoStock.length ? 'var(--rojo-text)' : 'inherit'}">${bajoStock.length}</div>
        </div>
      </div>

      <div style="display:flex; gap:16px; flex-wrap:wrap;">
        <div class="panel" style="flex:1.3; min-width:280px;">
          <p class="panel__titulo">Pedidos recientes</p>
          ${pedidos.length === 0 ? '<p class="vacio">TodavÃ­a no hay pedidos registrados.</p>' : pedidos.map(p => `
            <div class="lista-fila">
              <div>
                <div style="font-weight:600; font-size:13.5px;">#${p.numero_pedido} Â· ${escapeHtml(p.clientes?.nombre || 'Cliente')}</div>
                <div style="font-size:12px; color:var(--texto-muted);">${capitalizar(p.canal.replace('_',' '))}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:600; font-size:13.5px;">${fmtCOP(p.total)}</div>
                <span class="badge badge--${badgeEstadoPedido(p.estado)}">${p.estado}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="panel" style="flex:1; min-width:260px;">
          <p class="panel__titulo" style="color:var(--rojo-text);">Alertas de inventario</p>
          ${bajoStock.length === 0 ? '<p class="vacio">Todo el inventario estÃ¡ en niveles saludables.</p>' : bajoStock.slice(0, 8).map(p => `
            <div class="lista-fila">
              <div>
                <div style="font-weight:600; font-size:13px;">${escapeHtml(p.nombre)}</div>
                <div style="font-size:11.5px; color:var(--texto-muted);">ref. ${escapeHtml(p.referencia)}</div>
              </div>
              <span class="badge badge--${p.stock_actual === 0 ? 'rojo' : 'amarillo'}">${p.stock_actual === 0 ? 'Agotado' : p.stock_actual + ' uds'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
};
