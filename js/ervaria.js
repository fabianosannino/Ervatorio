// ============================================================
// ERVARIA SYNC MODULE — Supabase Integration
// ============================================================
const ervaria = {
  client: null,
  user: null,
  isOnline: false,
  isAdmin: false,

  async init() {
    try {
      const cfg = window.ERVATORIO_CONFIG;
      if (!cfg) throw new Error('ERVATORIO_CONFIG ausente — /js/config.js deve carregar antes de /js/ervaria.js');
      this.client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);

      // FAST PATH: lê a sessão cacheada do localStorage ANTES de qualquer
      // await. Resolve race onde outros módulos (checkout, pedidos, etc.)
      // consultam ervaria.user no mesmo tick de init() — antes do
      // getSession async resolver. A sessão do localStorage pode estar
      // expirada; getSession() abaixo confirma/renova.
      try {
        const projectRef = new URL(cfg.SUPABASE_URL).hostname.split('.')[0];
        const raw = localStorage.getItem(`sb-${projectRef}-auth-token`);
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached?.user?.id) {
            this.user = cached.user;
            this.isOnline = true;
          }
        }
      } catch (_) { /* cache corrompido — ignora */ }

      this.client.auth.onAuthStateChange((event, session) => {
        // Ignore INITIAL_SESSION — handled by getSession() below
        if (event === 'INITIAL_SESSION') return;
        if (event === 'SIGNED_IN' && session?.user) {
          this.user = session.user;
          this.isOnline = true;
          this.onLogin();
        } else if (event === 'SIGNED_OUT') {
          this.user = null;
          this.isOnline = false;
          this.onLogout();
        }
      });
      // Catálogo público: tentar hidratar mesmo sem login (RLS permite SELECT
      // com active=TRUE). Falha silenciosa cai no fallback local/cache.
      this.loadCatalog();
      const { data: { session } } = await this.client.auth.getSession();
      if (session?.user) {
        this.user = session.user;
        this.isOnline = true;
        // Restauração de sessão no carregamento: apenas atualiza UI e sincroniza,
        // SEM entrar no app automaticamente. A landing continua visível até o
        // usuário clicar num CTA (enterApp reconhece a sessão e não pede login).
        this.onLogin({ initial: true });
      } else {
        // Sessão não existe de verdade — se populamos no fast path, limpa.
        this.user = null;
        this.isOnline = false;
        this.updateAuthUI(false);
      }
      this.loadSiteSettings();
    } catch (e) {
      console.warn('Supabase offline:', e);
      this._applyCatalogCache();
      this.updateAuthUI(false);
    }
  },

  async loadSiteSettings() {
    try {
      const { data } = await this.client.from('site_settings').select('payments_enabled').eq('id', 1).maybeSingle();
      if (data) {
        window.SITE_SETTINGS = data;
        this.applyPaymentsState();
        try { typeof renderCart === 'function' && renderCart(); } catch (_) {}
      }
    } catch (_) {}
    this.loadInterruptores();
  },

  /**
   * Estado dos interruptores para a vitrine.
   *
   * Só de leitura e só para decidir o que MOSTRAR — quem recusa é o servidor
   * (`_shared/interruptores.ts`). A tabela é legível por `anon` de propósito:
   * a vitrine precisa saber se a indicação está no ar antes de o visitante ter
   * conta, e não há nada sensível no estado de uma capacidade que o próprio
   * site demonstra ao ser usado.
   *
   * Falha para DESLIGADO. Um erro de rede não pode fazer aparecer um card que
   * encaminha para fora — a rota recusaria o clique, e o visitante veria um
   * link que não leva a lugar nenhum.
   */
  async loadInterruptores() {
    window.ERV_INTERRUPTORES = window.ERV_INTERRUPTORES || {};
    try {
      const { data, error } = await this.client.from('interruptores').select('chave,ligado');
      if (error || !data) return;
      data.forEach((i) => { window.ERV_INTERRUPTORES[i.chave] = i.ligado === true; });
      try { typeof renderMkt === 'function' && renderMkt(); } catch (_) {}
    } catch (_) {}
  },

  applyPaymentsState() {
    const enabled = window.SITE_SETTINGS?.payments_enabled === true;
    const banner = document.getElementById('mkt-dev-banner');
    if (!banner) return;
    if (enabled) {
      banner.style.display = 'none';
    } else {
      banner.style.display = 'flex';
    }
  },

  // ── AUTH METHODS ─────────────────────────────────────────
  async loginEmail(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signupEmail(email, password, name) {
    const { data, error } = await this.client.auth.signUp({
      email, password,
      options: { data: { full_name: name || email.split('@')[0] } }
    });
    if (error) throw error;
    return data;
  },
  async loginGoogle() {
    const { error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        },
        scopes: 'openid email profile'
      }
    });
    if (error) this.showMsg(error.message, true);
  },
  async logout() {
    await this.client.auth.signOut();
    this.removeProfileMenu();
  },
  // ── Direitos do titular (LGPD art. 18 — Onda 2.3) ──
  async _dataRights(payload) {
    const { data: { session } } = await this.client.auth.getSession();
    if (!session) throw new Error('Sessão expirada — entre de novo');
    const res = await fetch(`${window.ERVATORIO_CONFIG.FUNCTIONS_URL}/user-data-rights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || `Erro ${res.status}`);
    return body;
  },
  async exportMyData() {
    try {
      toast('Preparando seus dados...');
      const { data } = await this._dataRights({ action: 'export' });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `ervatorio-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast('Dados exportados ✓');
    } catch (e) { toast('Erro ao exportar: ' + e.message); }
  },
  async deleteMyAccount() {
    const typed = prompt(
      'Isto excluirá sua conta e dados pessoais de forma DEFINITIVA.\n' +
      'Pedidos já realizados são mantidos anonimizados por obrigação fiscal.\n\n' +
      'Para confirmar, digite: EXCLUIR'
    );
    if (typed === null) return;
    if (typed.trim() !== 'EXCLUIR') { toast('Confirmação incorreta — conta mantida.'); return; }
    try {
      toast('Excluindo sua conta...');
      await this._dataRights({ action: 'delete', confirm: 'EXCLUIR' });
      await this.client.auth.signOut();
      localStorage.clear();
      alert('Sua conta foi excluída. Sentiremos sua falta. 🌿');
      location.reload();
    } catch (e) { toast('Erro ao excluir: ' + e.message); }
  },
  async resetPassword(email) {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });
    if (error) throw error;
  },

  // ── LOGIN/LOGOUT CALLBACKS ──────────────────────────────
  async onLogin(opts = {}) {
    // `initial: true` indica restauração de sessão no boot — nesse caso não
    // entramos no app nem abrimos o overlay de perfil; só atualizamos a UI e
    // sincronizamos, mantendo a landing visível até o usuário clicar num CTA.
    const isBoot = opts.initial === true;
    this.updateAuthUI(true);
    this.hideAuthModal();
    // Check if profile is completed
    const { data: profile } = await this.client
      .from('user_profiles')
      .select('profile_completed, display_name, email, extra_emails, phone, city, state, country, role, main_interest, referral_source, newsletter_optin, is_admin')
      .eq('id', this.user.id)
      .maybeSingle();

    this.isAdmin = profile?.is_admin || false;

    if (!profile || !profile.profile_completed) {
      // No boot, não interrompe com o overlay de perfil — apenas mantém a
      // sessão pronta. O usuário completa o perfil ao entrar de fato no app.
      if (isBoot) { this.syncFromCloud(); return; }
      // Pre-fill from Google data
      const meta = this.user.user_metadata || {};
      document.getElementById('pcName').value = meta.full_name || meta.name || profile?.display_name || '';
      document.getElementById('pcEmail').value = this.user.email || '';
      document.getElementById('pcPhone').value = profile?.phone || '';
      document.getElementById('pcExtraEmails').value = profile?.extra_emails || '';
      // Populate geo selects
      populateCountries();
      const savedCountry = profile?.country || 'Brasil';
      document.getElementById('pcCountry').value = savedCountry;
      onCountryChange();
      if (profile?.state) {
        // Try to find UF by name for select
        const states = GEO.states[savedCountry];
        if (states) {
          const st = states.find(s => s.name === profile.state || s.uf === profile.state);
          if (st) { document.getElementById('pcState').value = st.uf; onStateChange(); }
          else { document.getElementById('pcStateText').value = profile.state; }
        } else { document.getElementById('pcStateText').value = profile.state; }
      }
      if (profile?.city) {
        const cityVal = document.getElementById('pcCity').querySelector(`option[value="${profile.city}"]`);
        if (cityVal) { document.getElementById('pcCity').value = profile.city; }
        else { document.getElementById('pcCityText').value = profile.city; document.getElementById('pcCityText').style.display = ''; }
      }
      if (profile?.newsletter_optin != null) document.getElementById('pcNewsletter').checked = profile.newsletter_optin;
      if (profile?.role) {
        selectedRole = profile.role;
        document.querySelectorAll('#pcRoles .pc-role').forEach(b => {
          b.classList.toggle('on', b.dataset.role === profile.role);
        });
        document.getElementById('pcOtherField').style.display = profile.role === 'outro' ? 'block' : 'none';
      }
      if (profile?.main_interest) {
        selectedInterest = profile.main_interest;
        document.querySelectorAll('#pcInterests .pc-role').forEach(b => {
          b.classList.toggle('on', b.dataset.interest === profile.main_interest);
        });
      }
      if (profile?.referral_source) {
        selectedReferral = profile.referral_source;
        document.querySelectorAll('#pcReferral .pc-role').forEach(b => {
          b.classList.toggle('on', b.dataset.ref === profile.referral_source);
        });
      }
      // Show profile completion
      document.getElementById('profileCompleteOverlay').classList.add('on');
      document.body.style.overflow = 'hidden';
    } else {
      this.syncFromCloud();
      // Marca sessão como conhecida para que enterApp() não peça login de novo.
      localStorage.setItem('erb_entered', '1');
      localStorage.setItem('erb_auth', '1');
      // No boot, NÃO entra no app automaticamente: mantém a landing e espera o
      // usuário clicar num CTA. Só entramos direto após login interativo.
      if (!isBoot) {
        enterAppAfterAuth();
        toast('Bem-vindo, ' + (profile.display_name || this.user.email.split('@')[0]) + '!');
      }
    }
  },
  onLogout() {
    this.updateAuthUI(false);
    localStorage.removeItem('erb_entered');
    localStorage.removeItem('erb_auth');
    backToLanding();
    toast('Até logo!');
  },

  // ── SYNC: READ FROM CLOUD → localStorage ────────────────
  async syncFromCloud() {
    if (!this.isOnline) return;
    try {
      const [favRes, prefRes] = await Promise.all([
        this.client.from('user_favorites').select('tea_id').eq('user_id', this.user.id),
        this.client.from('user_preferences').select('*').eq('user_id', this.user.id).maybeSingle()
      ]);
      if (favRes.data) {
        const cloudFavs = favRes.data.map(r => parseInt(r.tea_id));
        // Merge: cloud + local
        const localFavs = JSON.parse(localStorage.getItem('erb_favs') || '[]');
        const merged = [...new Set([...cloudFavs, ...localFavs])];
        favorites = merged;
        localStorage.setItem('erb_favs', JSON.stringify(merged));
        // Push local-only favs to cloud
        const localOnly = localFavs.filter(id => !cloudFavs.includes(id));
        if (localOnly.length) {
          await this.client.from('user_favorites').insert(
            localOnly.map(id => ({ user_id: this.user.id, tea_id: String(id) }))
          );
        }
      }
      if (prefRes.data) {
        const p = prefRes.data;
        perfilState.saude = p.caffeine_pref ? [p.caffeine_pref] : perfilState.saude;
        perfilState.sabores = p.flavor_pref ? [p.flavor_pref] : perfilState.sabores;
        perfilState.momentos = p.moment_pref ? [p.moment_pref] : perfilState.momentos;
        localStorage.setItem('erb_perfil', JSON.stringify(perfilState));
      }
      // Receitas salvas
      await this.syncRecipes();
      // Re-render
      renderHerbs();
      renderFavs();
      renderPerfil();
      console.log('Ervaria: synced from cloud');
    } catch (e) {
      console.error('Sync error:', e);
    }
  },

  // ── SYNC: PUSH SINGLE ACTION TO CLOUD ───────────────────
  async pushFavorite(herbId, isFav) {
    if (!this.isOnline) return;
    try {
      if (isFav) {
        await this.client.from('user_favorites').insert({
          user_id: this.user.id, tea_id: String(herbId)
        });
      } else {
        await this.client.from('user_favorites')
          .delete()
          .eq('user_id', this.user.id)
          .eq('tea_id', String(herbId));
      }
    } catch (e) { console.error('Push fav error:', e); }
  },

  async pushPerfil(perfil) {
    if (!this.isOnline) return;
    try {
      await this.client.from('user_preferences').upsert({
        user_id: this.user.id,
        caffeine_pref: perfil.saude?.[0] || null,
        flavor_pref: perfil.sabores?.[0] || null,
        moment_pref: perfil.momentos?.[0] || null
      }, { onConflict: 'user_id' });
    } catch (e) { console.error('Push perfil error:', e); }
  },

  // ── SAVED RECIPES (blends) ────────────────────────────────
  async pushRecipe(recipe) {
    if (!this.isOnline || !recipe?.name) return;
    try {
      await this.client.from('saved_recipes').upsert({
        user_id: this.user.id,
        name: recipe.name,
        tagline: recipe.tagline || null,
        ingredients: recipe.ingredients || [],
      }, { onConflict: 'user_id,name' });
    } catch (e) { console.error('Push recipe error:', e); }
  },
  async deleteRecipeRemote(name) {
    if (!this.isOnline || !name) return;
    try {
      await this.client.from('saved_recipes')
        .delete()
        .eq('user_id', this.user.id)
        .eq('name', name);
    } catch (e) { console.error('Delete recipe error:', e); }
  },
  async syncRecipes() {
    if (!this.isOnline) return;
    try {
      const { data } = await this.client.from('saved_recipes')
        .select('name,tagline,ingredients,updated_at')
        .eq('user_id', this.user.id)
        .order('updated_at', { ascending: false });
      if (!data) return;
      const cloud = data.map(r => ({
        name: r.name, tagline: r.tagline || '', ingredients: r.ingredients || []
      }));
      const local = JSON.parse(localStorage.getItem('erb_recipes') || '[]');
      const localByName = Object.fromEntries(local.map(r => [r.name, r]));
      const cloudNames = new Set(cloud.map(r => r.name));
      // Push local-only to cloud
      const localOnly = local.filter(r => !cloudNames.has(r.name));
      if (localOnly.length) {
        await this.client.from('saved_recipes').upsert(
          localOnly.map(r => ({
            user_id: this.user.id,
            name: r.name,
            tagline: r.tagline || null,
            ingredients: r.ingredients || [],
          })),
          { onConflict: 'user_id,name' }
        );
      }
      // Merge cloud + local (cloud wins for duplicates)
      const merged = [...cloud];
      localOnly.forEach(r => merged.push(r));
      if (typeof savedRecipes !== 'undefined') {
        savedRecipes.length = 0;
        Array.prototype.push.apply(savedRecipes, merged);
      }
      localStorage.setItem('erb_recipes', JSON.stringify(merged));
      if (typeof renderFavs === 'function') renderFavs();
    } catch (e) { console.error('Sync recipes error:', e); }
  },

  // ── CATALOG: hidrata HERBS / SUPPLIERS e anota MKT_PRODUCTS do Supabase ──
  // Preserva ids locais por nome para não quebrar favoritos/carrinho
  // salvos em localStorage. Em caso de falha (offline), usa os arrays
  // embutidos no app.js ou o cache local.
  async loadCatalog() {
    if (!this.client) return this._applyCatalogCache();
    try {
      const [herbsRes, supRes, prodRes] = await Promise.all([
        this.client.from('admin_herbs').select('*').eq('active', true),
        this.client.from('admin_suppliers').select('*').eq('active', true),
        this.client.from('admin_products').select('*').eq('active', true),
      ]);
      const hasAny = herbsRes.data?.length || supRes.data?.length || prodRes.data?.length;
      if (!hasAny) return;
      if (herbsRes.data?.length && typeof HERBS !== 'undefined') {
        this._hydrateHerbs(herbsRes.data);
      }
      if (supRes.data?.length && typeof SUPPLIERS !== 'undefined') {
        this._hydrateSuppliers(supRes.data);
      }
      if (prodRes.data?.length) {
        this._annotateMktProducts(prodRes.data);
      }
      // cache para modo offline (PWA)
      try {
        localStorage.setItem('erb_catalog_cache', JSON.stringify({
          ts: Date.now(),
          herbs: herbsRes.data || [],
          suppliers: supRes.data || [],
          products: prodRes.data || [],
        }));
      } catch(_) {}
      this._rerenderAfterCatalog();
      console.log('Ervaria: catalog hydrated from Supabase',
        { herbs: herbsRes.data?.length, suppliers: supRes.data?.length, products: prodRes.data?.length });
    } catch (e) {
      console.warn('Catálogo offline — usando fallback local:', e?.message || e);
      this._applyCatalogCache();
    }
  },

  _applyCatalogCache() {
    try {
      const raw = localStorage.getItem('erb_catalog_cache');
      if (!raw) return;
      const cache = JSON.parse(raw);
      if (cache.herbs?.length && typeof HERBS !== 'undefined') this._hydrateHerbs(cache.herbs);
      if (cache.suppliers?.length && typeof SUPPLIERS !== 'undefined') this._hydrateSuppliers(cache.suppliers);
      if (cache.products?.length) this._annotateMktProducts(cache.products);
      this._rerenderAfterCatalog();
      console.log('Ervaria: catalog restored from local cache');
    } catch (_) {}
  },

  _hydrateHerbs(rows) {
    // Chave composta evita colisão quando duas linhas compartilham o mesmo
    // nome popular (ex.: dois "Maracujá" com Passiflora edulis e spp.).
    const keyOf = (name, lat) => `${name}|${lat || ''}`;
    const byKey = new Map(HERBS.map(h => [keyOf(h.n, h.lat), h.id]));
    const localImgByName = new Map(HERBS.filter(h => h.img).map(h => [h.n, h.img]));
    let next = Math.max(0, ...HERBS.map(h => h.id)) + 1;
    const mapped = rows.filter(r => !/^TESTE\b/i.test(String(r.name || ''))).map(r => {
      const k = keyOf(r.name, r.latin_name);
      const id = byKey.has(k) ? byKey.get(k) : next++;
      return {
        id,
        dbId: r.id,
        n: r.name,
        lat: r.latin_name || '',
        icon: r.icon || '🍃',
        img: r.img || localImgByName.get(r.name) || undefined,
        tagline: r.tagline || '',
        cat: r.category || '',
        linha: r.linha || undefined,
        ef: r.effects || '',
        detail: r.detail || '',
        safe: Array.isArray(r.safe_for) ? r.safe_for : [],
        avoid: Array.isArray(r.avoid_for) ? r.avoid_for : [],
        temp: r.temp || '',
        tempo: r.brew_time || '',
        dose: r.dose || '',
        freq: r.frequency || '',
        tags: Array.isArray(r.tags) ? r.tags : [],
        momento: Array.isArray(r.momento) ? r.momento : [],
        bioma: r.bioma || '',
        usos: Array.isArray(r.usos) ? r.usos : [],
        restricoes_pais: Array.isArray(r.restricoes_pais) ? r.restricoes_pais : [],
      };
    });
    if (!mapped.length) return;
    HERBS.length = 0;
    Array.prototype.push.apply(HERBS, mapped);
    // resetHerbCards() é declarada em app.js e invalida o cache do grid
    if (typeof resetHerbCards === 'function') resetHerbCards();
  },

  _hydrateSuppliers(rows) {
    const byName = new Map(SUPPLIERS.map(s => [s.name, s.id]));
    let next = Math.max(0, ...SUPPLIERS.map(s => s.id)) + 1;
    const mapped = rows.map(r => ({
      id: byName.has(r.name) ? byName.get(r.name) : next++,
      dbId: r.id,
      name: r.name,
      type: r.type || '',
      city: r.city || '',
      since: r.since || '',
      cert: r.certification || '',
      ship: r.shipping || '',
      minOrder: r.min_order || '',
      herbs: Array.isArray(r.herbs) ? r.herbs : [],
      color: r.color || '#2d5a3a',
    }));
    SUPPLIERS.length = 0;
    Array.prototype.push.apply(SUPPLIERS, mapped);
  },

  // Casa MKT_PRODUCTS (definido em app.js) com admin_products por nome e
  // injeta dbId. Produtos criados no Admin que não existem no array embutido
  // são anexados ao final para aparecerem no Marketplace. O lookup é feito
  // sobre MKT_PRODUCTS (não sobre rows) para que chamadas repetidas de
  // loadCatalog() não gerem duplicatas.
  _annotateMktProducts(rows) {
    if (typeof MKT_PRODUCTS === 'undefined' || !Array.isArray(MKT_PRODUCTS)) return;
    const normalize = (s) => String(s || '').toLowerCase().trim();
    const byName = new Map(MKT_PRODUCTS.map(p => [normalize(p.name), p]));
    const knownCats = new Set(
      (typeof MKT_CATS !== 'undefined' && Array.isArray(MKT_CATS))
        ? MKT_CATS.map(c => c.id)
        : []
    );
    let nextId = Math.max(0, ...MKT_PRODUCTS
      .map(p => typeof p.id === 'number' ? p.id : 0)) + 1;
    let matched = 0, added = 0;
    (rows || []).forEach(row => {
      const existing = byName.get(normalize(row.name));
      if (existing) {
        existing.dbId = row.id;
        if (typeof row.price === 'number') existing.price = row.price;
        else if (row.price) existing.price = parseFloat(row.price) || existing.price;
        if (row.stock) existing.stock = row.stock;
        if (row.images && row.images.length) existing.images = row.images;
        // Indicação: quem vende é o parceiro. Sem estes três campos o card
        // renderiza como produto nosso — com botão de carrinho — e o visitante
        // tenta comprar algo que a create-order recusa.
        existing.modo_de_venda = row.modo_de_venda || 'proprio';
        existing.link_externo = row.link_externo || null;
        existing.parceiro = row.parceiro || existing.seller || '';
        // Produtos-semente do catálogo curado (definidos em app.js) são sempre
        // itens reais da vitrine, independentemente do is_test vindo do
        // admin_products. Só sincronizamos is_test para produtos criados
        // exclusivamente via admin (que não casam com o catálogo fixo).
        existing.is_test = false;
        matched++;
        return;
      }
      const priceNum = typeof row.price === 'number'
        ? row.price
        : (parseFloat(row.price) || 0);
      const cat = (knownCats.size && knownCats.has(row.category))
        ? row.category
        : 'Ervas & Acessórios';
      const item = {
        id: nextId++,
        dbId: row.id,
        cat,
        type: row.category || 'Produto',
        name: row.name,
        seller: row.supplier || '',
        icon: row.icon || '📦',
        price: priceNum,
        unit: row.unit || '',
        desc: row.description || '',
        badge: '',
        stock: row.stock || 'in',
        images: row.images || [],
        is_test: row.is_test || false,
        modo_de_venda: row.modo_de_venda || 'proprio',
        link_externo: row.link_externo || null,
        parceiro: row.parceiro || row.supplier || '',
      };
      MKT_PRODUCTS.push(item);
      byName.set(normalize(row.name), item);
      added++;
    });
    if (matched > 0 || added > 0) {
      console.log('Ervaria: MKT_PRODUCTS sync —',
        { matched, added, total: MKT_PRODUCTS.length });
    }
  },

  _rerenderAfterCatalog() {
    try { if (typeof renderHerbs === 'function') renderHerbs(); } catch(_) {}
    try { if (typeof renderSuppliers === 'function' && document.getElementById('supGrid')) renderSuppliers(); } catch(_) {}
    // Re-render do Marketplace após anotar MKT_PRODUCTS com dbId
    try { if (typeof renderMkt === 'function' && document.getElementById('mktGrid')) renderMkt(); } catch(_) {}
  },

  // ── FICHAS EDITORIAIS ─────────────────────────────────────
  // Cache em memória + localStorage para modo offline. A fonte
  // da verdade é a tabela admin_herb_fichas no Supabase. Admin
  // importa o conteúdo inicial via painel.
  _fichaCache: {},

  _normalizeLatin(lat) {
    if (!lat) return '';
    // "Mentha × piperita L." → "Mentha piperita"
    return String(lat)
      .replace(/×/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 2)
      .join(' ');
  },

  async loadFichaByLatin(latinName) {
    const key = this._normalizeLatin(latinName);
    if (!key) return null;
    if (this._fichaCache[key]) return this._fichaCache[key];
    // Cache local (offline)
    try {
      const raw = localStorage.getItem('erb_ficha_' + key);
      if (raw) {
        const cached = JSON.parse(raw);
        this._fichaCache[key] = cached;
      }
    } catch(_) {}
    if (!this.client) return this._fichaCache[key] || null;
    try {
      const { data, error } = await this.client
        .from('admin_herb_fichas')
        .select('slug,schema_version,ficha,updated_at')
        .ilike('herb_latin_name', key + '%')
        .eq('active', true)
        .eq('status', 'published')
        .order('schema_version', { ascending: false })
        .limit(1);
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.ficha) {
        this._fichaCache[key] = row.ficha;
        try { localStorage.setItem('erb_ficha_' + key, JSON.stringify(row.ficha)); } catch(_) {}
        return row.ficha;
      }
    } catch (e) {
      console.warn('Ficha offline para', key, '—', e?.message || e);
    }
    return this._fichaCache[key] || null;
  },

  async loadFichaBySlug(slug) {
    if (!slug) return null;
    const memKey = '__slug:' + slug;
    if (this._fichaCache[memKey]) return this._fichaCache[memKey];
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('admin_herb_fichas')
        .select('slug,schema_version,ficha,updated_at,herb_latin_name')
        .eq('slug', slug)
        .eq('active', true)
        .eq('status', 'published')
        .order('schema_version', { ascending: false })
        .limit(1);
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.ficha) {
        this._fichaCache[memKey] = row.ficha;
        const latinKey = this._normalizeLatin(row.herb_latin_name);
        if (latinKey) this._fichaCache[latinKey] = row.ficha;
        return row.ficha;
      }
    } catch (e) {
      console.warn('Ficha offline para slug', slug, '—', e?.message || e);
    }
    return null;
  },

  // Importa um payload {schema_version, fichas:[...]} no Supabase.
  // Uso: admin seleciona um JSON e clica "Importar". Idempotente
  // via UPSERT em (slug, schema_version).
  async importFichas(payload) {
    if (!this.client) throw new Error('Supabase indisponível');
    if (!payload || !Array.isArray(payload.fichas)) {
      throw new Error('Payload inválido: esperado { fichas: [...] }');
    }
    const schema = payload.schema_version || '1.1';
    const rows = payload.fichas.map(f => ({
      slug: f.slug,
      herb_latin_name: (f.nome_cientifico || f.identificacao?.nome_cientifico || '')
        .split('(')[0].trim().split(' ').slice(0, 2).join(' '),
      schema_version: f.schema_version || schema,
      ficha: f,
      status: 'published',
      active: true,
    }));
    const { data, error } = await this.client
      .from('admin_herb_fichas')
      .upsert(rows, { onConflict: 'slug,schema_version' })
      .select('slug');
    if (error) throw error;
    // Limpa cache local para forçar refetch
    this._fichaCache = {};
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('erb_ficha_'))
        .forEach(k => localStorage.removeItem(k));
    } catch(_) {}
    return data || [];
  },

  // ── UI METHODS ──────────────────────────────────────────
  updateAuthUI(loggedIn) {
    const btn = document.getElementById('ervaria-auth-btn');
    if (!btn) return;
    if (loggedIn) {
      const name = this.user?.user_metadata?.full_name || this.user?.email?.split('@')[0] || 'Você';
      const avatar = this.user?.user_metadata?.avatar_url;
      btn.innerHTML = avatar
        ? `<img src="${esc(avatar)}" alt="${esc(name)}"> ${esc(name)}`
        : `<span class="auth-avatar">${esc(name[0].toUpperCase())}</span> ${esc(name)}`;
      btn.onclick = () => this.toggleProfileMenu();
    } else {
      btn.innerHTML = '⚷ Entrar';
      btn.onclick = () => this.showAuthModal();
    }
  },

  showAuthModal() {
    document.getElementById('authOverlay').classList.add('on');
    document.body.style.overflow = 'hidden';
  },
  hideAuthModal() {
    document.getElementById('authOverlay').classList.remove('on');
    document.body.style.overflow = '';
  },
  continueWithoutLogin() {
    this.hideAuthModal();
    if (typeof hideLanding === 'function') hideLanding();
    try { localStorage.setItem('erb_entered', '1'); } catch(e){}
  },
  switchTab(tab) {
    document.getElementById('formLogin').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('formSignup').style.display = tab === 'signup' ? 'block' : 'none';
    document.getElementById('tabLogin').classList.toggle('on', tab === 'login');
    document.getElementById('tabSignup').classList.toggle('on', tab === 'signup');
    document.getElementById('authMsg').textContent = '';
  },
  showMsg(text, isErr) {
    const m = document.getElementById('authMsg');
    m.textContent = text;
    m.className = 'auth-msg ' + (isErr ? 'err' : 'ok');
  },

  async handleLogin() {
    const email = document.getElementById('authEmail').value.trim();
    const pass = document.getElementById('authPass').value;
    if (!email || !pass) { this.showMsg('Preencha email e senha', true); return; }
    try {
      this.showMsg('Entrando...', false);
      await this.loginEmail(email, pass);
    } catch (e) {
      this.showMsg(e.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : e.message, true);
    }
  },
  async handleSignup() {
    const name = document.getElementById('authName').value.trim();
    const email = document.getElementById('authSignEmail').value.trim();
    const pass = document.getElementById('authSignPass').value;
    if (!email || !pass) { this.showMsg('Preencha email e senha', true); return; }
    if (pass.length < 6) { this.showMsg('Senha: mínimo 6 caracteres', true); return; }
    try {
      this.showMsg('Criando conta...', false);
      await this.signupEmail(email, pass, name);
      this.showMsg('Conta criada! Verifique seu email para confirmar.');
    } catch (e) { this.showMsg(e.message, true); }
  },
  async handleForgotPassword() {
    const email = document.getElementById('authEmail').value.trim();
    if (!email) { this.showMsg('Digite seu email acima primeiro', true); return; }
    try {
      await this.resetPassword(email);
      this.showMsg('Email de recuperação enviado!');
    } catch (e) { this.showMsg(e.message, true); }
  },

  toggleProfileMenu() {
    const existing = document.getElementById('profileMenu');
    if (existing) { existing.remove(); return; }
    const name = this.user?.user_metadata?.full_name || this.user?.email?.split('@')[0] || 'Usuário';
    const email = this.user?.email || '';
    const menu = document.createElement('div');
    menu.id = 'profileMenu';
    menu.className = 'profile-menu';
    menu.innerHTML = `
      <div class="profile-menu-header">
        <div class="profile-menu-name">${esc(name)}</div>
        <div class="profile-menu-email">${esc(email)}</div>
        <div class="profile-menu-sync">✓ Sincronizado</div>
      </div>
      <button onclick="goPage('pedidos');ervaria.removeProfileMenu()">📦 Meus pedidos</button>
      <button onclick="ervaria.syncFromCloud();ervaria.removeProfileMenu()">↻ Sincronizar agora</button>
      <button onclick="ervaria.exportMyData();ervaria.removeProfileMenu()">⬇ Baixar meus dados</button>
      <button onclick="ervaria.deleteMyAccount()" style="color:#e08080">🗑 Excluir minha conta</button>
      ${this.isAdmin?'<button onclick="window.location=\'/admin.html\'" style="color:var(--gold2)">⚙ Painel Admin</button>':''}
      <button onclick="ervaria.logout()" class="logout">Sair da conta</button>
    `;
    document.body.appendChild(menu);
    setTimeout(() => {
      document.addEventListener('click', function close(e) {
        if (!menu.contains(e.target) && e.target.id !== 'ervaria-auth-btn') {
          menu.remove();
          document.removeEventListener('click', close);
        }
      });
    }, 50);
  },
  removeProfileMenu() {
    document.getElementById('profileMenu')?.remove();
  }
};

// �������─ HOOK: Override toggleFav to sync ──
const _origToggleFav = toggleFav;
toggleFav = function(e, id) {
  _origToggleFav(e, id);
  const isFav = favorites.includes(id);
  ervaria.pushFavorite(id, isFav);
};

// ── HOOK: Override savePerfil to sync ──
const _origSavePerfil = savePerfil;
savePerfil = function() {
  _origSavePerfil();
  ervaria.pushPerfil(perfilState);
};

// ── PROFILE COMPLETION ──
let selectedRole = '';
let selectedInterest = '';
let selectedReferral = '';

function selectRole(btn) {
  document.querySelectorAll('#pcRoles .pc-role').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  selectedRole = btn.dataset.role;
  document.getElementById('pcOtherField').style.display = selectedRole === 'outro' ? 'block' : 'none';
}
function selectInterest(btn) {
  document.querySelectorAll('#pcInterests .pc-role').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  selectedInterest = btn.dataset.interest;
}
function selectReferral(btn) {
  document.querySelectorAll('#pcReferral .pc-role').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  selectedReferral = btn.dataset.ref;
}
function goStep2() {
  const name = document.getElementById('pcName').value.trim();
  const email = document.getElementById('pcEmail').value.trim();
  const geo = getGeoValues();
  const msg = document.getElementById('pcMsg1');
  if (!name) { msg.textContent = 'Preencha seu nome'; msg.style.color = '#e08080'; return; }
  if (!email) { msg.textContent = 'Preencha seu email'; msg.style.color = '#e08080'; return; }
  if (!geo.country) { msg.textContent = 'Selecione o país'; msg.style.color = '#e08080'; return; }
  if (!geo.state) { msg.textContent = 'Preencha o estado'; msg.style.color = '#e08080'; return; }
  if (!geo.city) { msg.textContent = 'Preencha a cidade'; msg.style.color = '#e08080'; return; }
  msg.textContent = '';
  document.getElementById('pcStep1').style.display = 'none';
  document.getElementById('pcStep2').style.display = 'block';
  document.querySelector('.profile-complete-overlay').scrollTop = 0;
}
function goStep1() {
  document.getElementById('pcStep2').style.display = 'none';
  document.getElementById('pcStep1').style.display = 'block';
  document.querySelector('.profile-complete-overlay').scrollTop = 0;
}
function skipProfile() {
  document.getElementById('profileCompleteOverlay').classList.remove('on');
  document.body.style.overflow = '';
  enterAppAfterAuth();
  toast('Você pode completar seu perfil depois. Acesso limitado à Busca.');
}

async function submitProfile() {
  const name = document.getElementById('pcName').value.trim();
  const email = document.getElementById('pcEmail').value.trim();
  const extraEmails = document.getElementById('pcExtraEmails').value.trim();
  const phone = document.getElementById('pcPhone').value.trim();
  const geo = getGeoValues();
  const otherRole = document.getElementById('pcOtherRole')?.value.trim();
  const newsletter = document.getElementById('pcNewsletter').checked;
  const lgpd = document.getElementById('pcLgpd').checked;
  const msg = document.getElementById('pcMsg');

  if (!name) { msg.textContent = 'Preencha seu nome'; msg.style.color = '#e08080'; return; }
  if (!email) { msg.textContent = 'Preencha seu email'; msg.style.color = '#e08080'; return; }
  if (!selectedRole) { msg.textContent = 'Selecione seu perfil'; msg.style.color = '#e08080'; return; }
  if (!geo.country) { msg.textContent = 'Selecione o país'; msg.style.color = '#e08080'; return; }
  if (!geo.state) { msg.textContent = 'Preencha o estado'; msg.style.color = '#e08080'; return; }
  if (!geo.city) { msg.textContent = 'Preencha a cidade'; msg.style.color = '#e08080'; return; }
  if (!lgpd) { msg.textContent = 'É necessário aceitar os termos da LGPD'; msg.style.color = '#e08080'; return; }

  msg.textContent = 'Salvando...'; msg.style.color = 'var(--gold)';
  document.getElementById('pcSubmit').disabled = true;

  try {
    const { error } = await ervaria.client
      .from('user_profiles')
      .update({
        display_name: name,
        email: email,
        extra_emails: extraEmails || null,
        phone: phone,
        city: geo.city,
        state: geo.state,
        country: geo.country,
        role: selectedRole,
        role_other: selectedRole === 'outro' ? otherRole : null,
        main_interest: selectedInterest || null,
        referral_source: selectedReferral || null,
        newsletter_optin: newsletter,
        lgpd_accepted: true,
        lgpd_accepted_at: new Date().toISOString(),
        profile_completed: true
      })
      .eq('id', ervaria.user.id);

    if (error) throw error;

    document.getElementById('profileCompleteOverlay').classList.remove('on');
    document.body.style.overflow = '';
    enterAppAfterAuth();
    localStorage.setItem('erb_entered', '1');
    ervaria.syncFromCloud();
    ervaria.updateAuthUI(true);
    toast('Bem-vindo ao Ervatório, ' + name + '!');
  } catch (e) {
    msg.textContent = 'Erro: ' + e.message; msg.style.color = '#e08080';
  }
  document.getElementById('pcSubmit').disabled = false;
}

// ── THEME TOGGLE ──
function _setThemeIcon(icon){
  ['themeToggle', 'landingThemeToggle'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.textContent = icon;
  });
}
function toggleTheme(){
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  localStorage.setItem('erb_theme', isLight ? 'light' : 'dark');
  _setThemeIcon(isLight ? '☽' : '☀');
}
// Restore saved theme (default: light / creme legível — como pela manhã)
(function(){
  const saved = localStorage.getItem('erb_theme');
  if(saved === 'dark'){
    _setThemeIcon('☀');
  } else {
    document.body.classList.add('light');
    _setThemeIcon('☽');
  }
})();

// ── LANDING PAGE ──
function hasEnteredApp(){
  // Already authenticated OR entrou como guest (flag persistente no localStorage)
  try { if (localStorage.getItem('erb_entered')) return true; } catch(_) {}
  return !!(window.ervaria && ervaria.user);
}
function enterApp(){
  // Se já entrou antes, apenas revela o app — não pede login de novo.
  if (hasEnteredApp()) {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    return;
  }
  // Caso contrário, abre modal de login/cadastro/guest.
  ervaria.showAuthModal();
}
function enterAppAfterAuth(){
  // Only enter app if user is actually authenticated
  if (!window.ervaria || !ervaria.user) return;
  document.getElementById('landingPage').style.display = 'none';
  document.getElementById('appContainer').style.display = 'block';
  localStorage.setItem('erb_entered', '1');
  localStorage.setItem('erb_auth', '1');
}
function backToLanding(){
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('landingPage').style.display = 'block';
}
// Atalho para o CTA "Consultar a Roda" na landing — guarda o texto do
// input (se preenchido) em sessionStorage para eventual uso futuro pela
// página Roda, e navega.
function goToRodaFromLanding(btn){
  try {
    const input = btn && btn.parentElement && btn.parentElement.querySelector('.roda-input');
    const value = input && input.value ? input.value.trim() : '';
    if (value) sessionStorage.setItem('erb_roda_hint', value);
  } catch(_) {}
  enterApp();
  if (typeof goPage === 'function') goPage('roda');
  return false;
}
// Landing page é sempre exibida ao carregar — usuário entra no app
// clicando num CTA ("Entrar", "Descobrir meu chá", etc.). enterApp() já
// detecta sessão prévia (erb_entered) e pula o modal de login se possível.

// Atualiza o contador de "Ervas catalogadas" da landing com o total real
// de fichas v1.1 publicadas no Supabase. Mantém o número da landing sempre
// alinhado ao catálogo conforme novas fichas são importadas.
(function(){
  function updateStat(){
    var el = document.getElementById('statErvas');
    if (!el || typeof ErvatorioData === 'undefined') return;
    ErvatorioData.getAllFichas().then(function(fichas){
      if (fichas && fichas.length) el.textContent = String(fichas.length);
    }).catch(function(){ /* mantém valor estático se offline */ });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateStat);
  } else {
    updateStat();
  }
})();

// ── PWA INSTALL ──
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('installBtn');
  if(btn) btn.style.display = 'inline-block';
});
function installPWA() {
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(r => {
    if(r.outcome === 'accepted') toast('App instalado!');
    deferredPrompt = null;
    document.getElementById('installBtn').style.display = 'none';
  });
}
// Register service worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js').catch(()=>{});
}

// ── INIT SUPABASE ──
// Expõe `ervaria` como global no window para que outros classic scripts
// (checkout.js, admin.js, e qualquer código inline em index.html) acessem
// via `window.ervaria`. `const` no topo de classic script fica no script
// scope, NÃO vira propriedade do window automaticamente.
window.ervaria = ervaria;
ervaria.init();
