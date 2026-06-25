// ============================================================
// AutenticaciÃ³n y perfil de usuario
// ============================================================

const ROLES_CONFIG = {
  admin:       { label: 'Administrador', modulos: ['dashboard','ventas','inventario','pedidos','despacho','facturacion'] },
  ventas:      { label: 'Ventas',        modulos: ['dashboard','ventas','pedidos'] },
  inventario:  { label: 'Inventario',    modulos: ['dashboard','inventario'] },
  facturacion: { label: 'FacturaciÃ³n',   modulos: ['dashboard','facturacion','pedidos'] },
  despacho:    { label: 'Despacho',      modulos: ['dashboard','despacho','pedidos'] },
};

const Auth = {
  usuario: null,   // sesiÃ³n de supabase auth
  perfil: null,    // fila de la tabla perfiles (nombre, rol)

  async init() {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
      await this.cargarPerfil(data.session.user);
    }
    return this.perfil;
  },

  async cargarPerfil(usuarioAuth) {
    this.usuario = usuarioAuth;
    const { data, error } = await supabaseClient
      .from('perfiles')
      .select('*')
      .eq('id', usuarioAuth.id)
      .single();
    if (error) {
      console.error('Error cargando perfil', error);
      this.perfil = null;
      return null;
    }
    this.perfil = data;
    return data;
  },

  async login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await this.cargarPerfil(data.user);
    return this.perfil;
  },

  async logout() {
    await supabaseClient.auth.signOut();
    this.usuario = null;
    this.perfil = null;
  },

  modulosPermitidos() {
    if (!this.perfil) return [];
    return ROLES_CONFIG[this.perfil.rol]?.modulos || [];
  },

  puedeVer(modulo) {
    return this.modulosPermitidos().includes(modulo);
  },

  rolLabel() {
    if (!this.perfil) return '';
    return ROLES_CONFIG[this.perfil.rol]?.label || this.perfil.rol;
  },
};

function bindFormLogin() {
  const form = document.getElementById('formLogin');
  const errorEl = document.getElementById('loginError');
  const btn = document.getElementById('btnLogin');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Ingresando...';

    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;

    try {
      await Auth.login(email, pass);
      iniciarApp();
    } catch (err) {
      errorEl.textContent = 'Correo o contraseÃ±a incorrectos. Intenta de nuevo.';
      errorEl.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Ingresar';
    }
  });
}
