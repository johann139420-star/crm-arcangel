// ============================================================
// Inventario
// ============================================================

const VistaInventario = {
  productos: [],
  categoriaActiva: 'todas',

  async render() {
    const cont = document.getElementById('vistaContenido');
    cont.innerHTML = `<div class="spinner"></div>`;

    const { data, error } = await supabaseClient.from('productos').select('*').order('categoria').order('nombre');
    this.productos = data || [];

    const categorias = [...new Set(this.productos.map(p => p.categoria))];

    cont.innerHTML = `
      <h2 class="titulo-seccion">Inventario</h2>
      <p class="subtitulo-seccion">${this.productos.length} referencias registradas</p>

      <div class="buscador">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <input type="text" id="invBuscador" placeholder="Buscar por nombre o referencia...">
      </div>

      <div class="chips" id="invChips">
        <button class="chip chip--active" data-cat="todas">Todas</button>
        ${categorias.map(c => `<button class="chip" data-cat="${escapeHtml(c)}">${escapeHtml(capitalizar(c.toLowerCase()))}</button>`).join('')}
      </div>

      <div class="panel" style="padding:0;">
        <div class="tabla-wrap">
          <table class="tabla" id="invTabla">
            <thead>
              <tr><th>Referencia</th><th>Producto</th><th>CategorÃ­a</th><th>Precio</th><th>Stock</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody id="invTbody"></tbody>
          </table>
        </div>
      </div>
    `;

    this.renderTabla(this.productos);
    this.bindEventos();
  },

  renderTabla(lista) {
    const tbody = document.getElementById('invTbody');
    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><p class="vacio">No encontramos productos con ese filtro.</p></td></tr>`;
      return;
    }
    tbody.innerHTML = lista.map(p => {
      const estado = p.stock_actual <= 0
        ? `<span class="badge badge--rojo">Agotado</span>`
        : p.stock_actual <= p.stock_minimo
        ? `<span class="badge badge--amarillo">Stock bajo</span>`
        : `<span class="badge badge--verde">Disponible</span>`;
      return `
        <tr>
          <td style="color:var(--texto-muted);">${escapeHtml(p.referencia)}</td>
          <td style="font-weight:500;">${escapeHtml(p.nombre)}</td>
          <td style="color:var(--texto-muted);">${escapeHtml(capitalizar((p.categoria||'').toLowerCase()))}</td>
          <td>${fmtCOP(p.precio)}</td>
          <td>${p.stock_actual}</td>
          <td>${estado}</td>
          <td><button class="btn btn--outline btn--sm" data-id="${p.id}" data-ref="${escapeHtml(p.referencia)}" data-stock="${p.stock_actual}">Ajustar</button></td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => this.abrirModalAjuste(btn.dataset.id, btn.dataset.ref, Number(btn.dataset.stock)));
    });
  },

  aplicarFiltros() {
    const term = document.getElementById('invBuscador').value.trim().toLowerCase();
    let lista = this.productos;
    if (this.categoriaActiva !== 'todas') {
      lista = lista.filter(p => p.categoria === this.categoriaActiva);
    }
    if (term) {
      lista = lista.filter(p => p.nombre.toLowerCase().includes(term) || p.referencia.toLowerCase().includes(term));
    }
    this.renderTabla(lista);
  },

  bindEventos() {
    document.getElementById('invBuscador').addEventListener('input', debounce(() => this.aplicarFiltros(), 150));

    document.getElementById('invChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      this.categoriaActiva = chip.dataset.cat;
      document.querySelectorAll('#invChips .chip').forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
      this.aplicarFiltros();
    });
  },

  abrirModalAjuste(productoId, referencia, stockActual) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <h3>Ajustar stock â€” ${escapeHtml(referencia)}</h3>
        <p style="font-size:13px; color:var(--texto-muted); margin-top:-8px;">Stock actual: <strong>${stockActual}</strong> unidades</p>
        <div class="campo">
          <label>Tipo de movimiento</label>
          <select id="ajTipo">
            <option value="entrada">Entrada (compra a proveedor)</option>
            <option value="ajuste">Ajuste (conteo fÃ­sico)</option>
            <option value="salida">Salida (daÃ±o, pÃ©rdida, devoluciÃ³n a proveedor)</option>
          </select>
        </div>
        <div class="campo">
          <label id="ajCantidadLabel">Cantidad a agregar</label>
          <input id="ajCantidad" type="number" min="0" value="0">
        </div>
        <div class="campo">
          <label>Motivo (opcional)</label>
          <input id="ajMotivo" type="text" placeholder="Ej. Compra a proveedor X">
        </div>
        <div class="modal-actions">
          <button class="btn btn--outline" id="ajCancelar">Cancelar</button>
          <button class="btn btn--primary" id="ajGuardar">Guardar ajuste</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const tipoSel = overlay.querySelector('#ajTipo');
    const label = overlay.querySelector('#ajCantidadLabel');
    tipoSel.addEventListener('change', () => {
      label.textContent = tipoSel.value === 'ajuste' ? 'Nueva cantidad total' : tipoSel.value === 'entrada' ? 'Cantidad a agregar' : 'Cantidad a restar';
    });

    overlay.querySelector('#ajCancelar').addEventListener('click', () => overlay.remove());

    overlay.querySelector('#ajGuardar').addEventListener('click', async () => {
      const tipo = tipoSel.value;
      const cantidadInput = Number(overlay.querySelector('#ajCantidad').value);
      const motivo = overlay.querySelector('#ajMotivo').value.trim();

      if (!cantidadInput || cantidadInput <= 0) {
        mostrarToast('Ingresa una cantidad vÃ¡lida', 'error');
        return;
      }

      let nuevoStock;
      let cantidadMovimiento;
      if (tipo === 'entrada') {
        nuevoStock = stockActual + cantidadInput;
        cantidadMovimiento = cantidadInput;
      } else if (tipo === 'salida') {
        nuevoStock = Math.max(0, stockActual - cantidadInput);
        cantidadMovimiento = cantidadInput;
      } else {
        nuevoStock = cantidadInput;
        cantidadMovimiento = Math.abs(cantidadInput - stockActual);
      }

      const { error: errStock } = await supabaseClient.from('productos').update({ stock_actual: nuevoStock }).eq('id', productoId);
      if (errStock) { mostrarToast('No se pudo actualizar el stock', 'error'); return; }

      await supabaseClient.from('movimientos_inventario').insert({
        producto_id: productoId,
        tipo,
        cantidad: cantidadMovimiento,
        motivo: motivo || (tipo === 'entrada' ? 'Compra a proveedor' : tipo === 'ajuste' ? 'Ajuste por conteo fÃ­sico' : 'Salida manual'),
        usuario_id: Auth.perfil.id,
      });

      overlay.remove();
      mostrarToast('Stock actualizado correctamente');
      this.render();
    });
  },
};
