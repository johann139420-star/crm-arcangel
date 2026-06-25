// ============================================================
// Ventas â€” Punto de venta
// ============================================================

const VistaVentas = {
  carrito: [],
  productos: [],
  clientes: [],

  async render() {
    const cont = document.getElementById('vistaContenido');
    cont.innerHTML = `<div class="spinner"></div>`;

    const [prodRes, cliRes] = await Promise.all([
      supabaseClient.from('productos').select('*').eq('activo', true).order('nombre'),
      supabaseClient.from('clientes').select('*').order('nombre'),
    ]);
    this.productos = prodRes.data || [];
    this.clientes = cliRes.data || [];

    cont.innerHTML = `
      <h2 class="titulo-seccion">Punto de venta</h2>
      <p class="subtitulo-seccion">Registra una venta en mostrador o desde una cotizaciÃ³n por WhatsApp</p>

      <div class="pos-grid">
        <div>
          <div class="buscador">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            <input type="text" id="posBuscador" placeholder="Buscar producto o referencia...">
          </div>
          <div class="productos-grid" id="posGrid"></div>
        </div>

        <div class="panel">
          <p class="panel__titulo">
            ${ICONOS.ventas} Carrito (<span id="carritoCount">0</span>)
          </p>

          <div class="campo">
            <label for="posCliente">Cliente</label>
            <select id="posCliente">
              <option value="">Selecciona un cliente...</option>
              ${this.clientes.map(c => `<option value="${c.id}">${escapeHtml(c.nombre)}</option>`).join('')}
              <option value="__nuevo__">+ Crear nuevo cliente</option>
            </select>
          </div>

          <div id="carritoLista"></div>
          <div class="carrito-total">
            <span>Total</span>
            <span id="carritoTotal" style="color:var(--oro-oscuro)">${fmtCOP(0)}</span>
          </div>
          <button class="btn btn--primary btn--block" id="btnConfirmarVenta" disabled>Confirmar venta</button>
        </div>
      </div>
    `;

    this.carrito = [];
    this.renderProductos(this.productos);
    this.renderCarrito();
    this.bindEventos();
  },

  renderProductos(lista) {
    const grid = document.getElementById('posGrid');
    if (lista.length === 0) {
      grid.innerHTML = `<p class="vacio">No encontramos productos con ese filtro.</p>`;
      return;
    }
    grid.innerHTML = lista.map(p => `
      <div class="producto-card" data-id="${p.id}" ${p.stock_actual <= 0 ? 'aria-disabled="true"' : ''} tabindex="0">
        <div class="producto-card__nombre">${escapeHtml(p.nombre)}</div>
        <div class="producto-card__ref">ref. ${escapeHtml(p.referencia)}${p.medida_cm ? ' Â· ' + escapeHtml(p.medida_cm) + ' cm' : ''}</div>
        <div class="producto-card__bottom">
          <span class="producto-card__precio">${fmtCOP(p.precio)}</span>
          <span class="producto-card__stock" style="${p.stock_actual <= 0 ? 'color:var(--rojo-text)' : ''}">${p.stock_actual <= 0 ? 'Agotado' : 'Stock: ' + p.stock_actual}</span>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.producto-card').forEach(card => {
      card.addEventListener('click', () => {
        if (card.getAttribute('aria-disabled') === 'true') return;
        this.agregarAlCarrito(card.dataset.id);
      });
    });
  },

  agregarAlCarrito(productoId) {
    const producto = this.productos.find(p => p.id === productoId);
    if (!producto) return;
    const existente = this.carrito.find(i => i.id === productoId);
    const cantidadActual = existente ? existente.cantidad : 0;
    if (cantidadActual + 1 > producto.stock_actual) {
      mostrarToast('No hay suficiente stock de este producto', 'error');
      return;
    }
    if (existente) {
      existente.cantidad += 1;
    } else {
      this.carrito.push({ id: producto.id, referencia: producto.referencia, nombre: producto.nombre, precio: Number(producto.precio), cantidad: 1, stockDisponible: producto.stock_actual });
    }
    this.renderCarrito();
  },

  cambiarCantidad(productoId, delta) {
    const item = this.carrito.find(i => i.id === productoId);
    if (!item) return;
    const nueva = item.cantidad + delta;
    if (nueva <= 0) {
      this.carrito = this.carrito.filter(i => i.id !== productoId);
    } else if (nueva > item.stockDisponible) {
      mostrarToast('No hay suficiente stock de este producto', 'error');
      return;
    } else {
      item.cantidad = nueva;
    }
    this.renderCarrito();
  },

  renderCarrito() {
    const lista = document.getElementById('carritoLista');
    const count = document.getElementById('carritoCount');
    const totalEl = document.getElementById('carritoTotal');
    const btnConfirmar = document.getElementById('btnConfirmarVenta');

    count.textContent = this.carrito.length;
    const total = this.carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
    totalEl.textContent = fmtCOP(total);
    btnConfirmar.disabled = this.carrito.length === 0;

    if (this.carrito.length === 0) {
      lista.innerHTML = `<p class="vacio" style="padding:16px 0;">Agrega productos haciendo clic en una tarjeta.</p>`;
      return;
    }

    lista.innerHTML = this.carrito.map(i => `
      <div class="carrito-item">
        <div>
          <div style="font-size:13px; font-weight:500;">${escapeHtml(i.nombre)}</div>
          <div style="font-size:11.5px; color:var(--texto-muted);">${fmtCOP(i.precio)} c/u</div>
        </div>
        <div class="carrito-item__qty">
          <button data-id="${i.id}" data-delta="-1" aria-label="Restar">âˆ’</button>
          <span style="min-width:20px; text-align:center; font-size:13px;">${i.cantidad}</span>
          <button data-id="${i.id}" data-delta="1" aria-label="Sumar">+</button>
        </div>
      </div>
    `).join('');

    lista.querySelectorAll('button[data-delta]').forEach(btn => {
      btn.addEventListener('click', () => this.cambiarCantidad(btn.dataset.id, Number(btn.dataset.delta)));
    });
  },

  bindEventos() {
    const buscador = document.getElementById('posBuscador');
    buscador.addEventListener('input', debounce(() => {
      const term = buscador.value.trim().toLowerCase();
      const filtrados = this.productos.filter(p =>
        p.nombre.toLowerCase().includes(term) || p.referencia.toLowerCase().includes(term)
      );
      this.renderProductos(filtrados);
    }, 150));

    const selectCliente = document.getElementById('posCliente');
    selectCliente.addEventListener('change', () => {
      if (selectCliente.value === '__nuevo__') {
        this.abrirModalNuevoCliente(selectCliente);
      }
    });

    document.getElementById('btnConfirmarVenta').addEventListener('click', () => this.confirmarVenta());
  },

  abrirModalNuevoCliente(selectEl) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <h3>Nuevo cliente</h3>
        <div class="campo"><label>Nombre *</label><input id="ncNombre" type="text"></div>
        <div class="campo"><label>TelÃ©fono</label><input id="ncTelefono" type="tel"></div>
        <div class="campo"><label>Ciudad</label><input id="ncCiudad" type="text"></div>
        <div class="campo">
          <label>Tipo de cliente</label>
          <select id="ncTipo">
            <option value="tienda">Tienda</option>
            <option value="distribuidor">Distribuidor</option>
            <option value="final">Cliente final</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn btn--outline" id="ncCancelar">Cancelar</button>
          <button class="btn btn--primary" id="ncGuardar">Guardar cliente</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#ncCancelar').addEventListener('click', () => {
      overlay.remove();
      selectEl.value = '';
    });

    overlay.querySelector('#ncGuardar').addEventListener('click', async () => {
      const nombre = overlay.querySelector('#ncNombre').value.trim();
      if (!nombre) { mostrarToast('El nombre es obligatorio', 'error'); return; }
      const { data, error } = await supabaseClient.from('clientes').insert({
        nombre,
        telefono: overlay.querySelector('#ncTelefono').value.trim() || null,
        ciudad: overlay.querySelector('#ncCiudad').value.trim() || null,
        tipo_cliente: overlay.querySelector('#ncTipo').value,
        creado_por: Auth.perfil.id,
      }).select().single();

      if (error) { mostrarToast('No se pudo crear el cliente', 'error'); return; }

      this.clientes.push(data);
      const opt = document.createElement('option');
      opt.value = data.id;
      opt.textContent = data.nombre;
      selectEl.insertBefore(opt, selectEl.querySelector('option[value="__nuevo__"]'));
      selectEl.value = data.id;
      overlay.remove();
      mostrarToast('Cliente creado');
    });
  },

  async confirmarVenta() {
    const clienteId = document.getElementById('posCliente').value;
    if (!clienteId || clienteId === '__nuevo__') {
      mostrarToast('Selecciona un cliente antes de confirmar', 'error');
      return;
    }
    if (this.carrito.length === 0) return;

    const btn = document.getElementById('btnConfirmarVenta');
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    const subtotal = this.carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

    try {
      const { data: pedido, error: errPedido } = await supabaseClient.from('pedidos').insert({
        cliente_id: clienteId,
        vendedor_id: Auth.perfil.id,
        canal: 'tienda_fisica',
        estado: 'confirmado',
        subtotal,
        total: subtotal,
      }).select().single();

      if (errPedido) throw errPedido;

      const items = this.carrito.map(i => ({
        pedido_id: pedido.id,
        producto_id: i.id,
        cantidad: i.cantidad,
        precio_unitario: i.precio,
        subtotal: i.precio * i.cantidad,
      }));

      const { error: errItems } = await supabaseClient.from('pedido_items').insert(items);
      if (errItems) throw errItems;

      mostrarToast(`Venta #${pedido.numero_pedido} registrada con Ã©xito`);
      this.render();
    } catch (err) {
      console.error(err);
      mostrarToast('OcurriÃ³ un error al registrar la venta', 'error');
      btn.disabled = false;
      btn.textContent = 'Confirmar venta';
    }
  },
};
