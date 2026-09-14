// ════════════════════════════════════════
// RECEITAS — Ervatório
// ════════════════════════════════════════

// RECEITAS mora em js/receitas-data.js (carregado antes deste arquivo) — o
// prerender lê a mesma lista para /receitas/<id>/ (PR 10).

// ─── Filtro ativo ───
let receitasFiltro = 'todas';
let receitaAberta = null;

// ─── Inicialização ───
function initReceitas() {
  receitasFiltro = 'todas';
  receitaAberta = null;
  renderReceitasHub();
}

// ──�� Hub com filtros e grid ───
function renderReceitasHub() {
  const el = document.getElementById('receitasContainer');
  if (!el) return;

  // Filtros como texto (handoff 14/09): emoji fora da identidade e ruim
  // para leitor de tela. Os rotulos vem do i18n (rec.filter_*).
  const _t = typeof t === 'function' ? t : (k, fb) => fb;
  const cats = [
    {id:'todas',    label:_t('rec.filter_all')       || 'Todas'},
    {id:'quente',   label:_t('rec.filter_hot')       || 'Quentes'},
    {id:'gelado',   label:_t('rec.filter_cold')      || 'Geladas'},
    {id:'mocktail', label:_t('rec.filter_mocktail')  || 'Mocktails'},
    {id:'medicinal',label:_t('rec.filter_medicinal') || 'Medicinais'},
    {id:'culinario',label:_t('rec.filter_culinary')  || 'Culinárias'},
    {id:'ritual',   label:_t('rec.filter_ritual')    || 'Rituais'},
  ].map(c => ({...c, label: c.label.startsWith('rec.') ? c.id : c.label}));

  const lista = receitasFiltro === 'todas'
    ? RECEITAS
    : RECEITAS.filter(r => r.categoria === receitasFiltro);

  el.innerHTML = `
    <div class="rec-intro">
      <div class="rec-intro-title">Receitas com Ervas</div>
      <div class="rec-intro-sub">Do chá clássico ao mocktail sofisticado — cada receita conta a história de uma planta</div>
    </div>
    <div class="rec-filter-bar">
      ${cats.map(c=>`
        <button class="rec-filter-btn${receitasFiltro===c.id?' on':''}"
                onclick="setReceitaFiltro('${c.id}')"
                aria-pressed="${receitasFiltro===c.id?'true':'false'}">
          ${c.label}
        </button>`).join('')}
    </div>
    <div class="rec-count" style="font-size:.7rem;color:var(--muted);margin-bottom:.75rem">
      ${lista.length} receita${lista.length!==1?'s':''}
    </div>
    <div class="rec-grid">
      ${lista.map(r=>buildReceitaCard(r)).join('')}
    </div>`;
}

// REC_IMG_EXT mora em js/receitas-data.js.
function recImgSrc(slug){
  const ext = REC_IMG_EXT[slug] || 'png';
  return `images/produtos/${slug}.${ext}`;
}

function buildReceitaCard(r) {
  const catColors = {quente:'#c86a30',gelado:'#2d7a8a',mocktail:'#7a2d8a',medicinal:'#2d7a3a',culinario:'#8a7a2d',ritual:'#3a2d8a'};
  const catLabel  = {quente:'Quente',gelado:'Gelada',mocktail:'Mocktail',medicinal:'Medicinal',culinario:'Culinária',ritual:'Ritual'};
  const color = catColors[r.categoria] || 'var(--gold)';
  const primarySrc = recImgSrc(r.img);
  const altExt = primarySrc.endsWith('.png') ? 'jpg' : 'png';
  const altSrc = `images/produtos/${r.img}.${altExt}`;
  return `
    <div class="rec-card" onclick="openReceita('${r.id}')">
      <div class="rec-card-img" style="background:linear-gradient(135deg,${color}18,${color}35)">
        <img src="${primarySrc}" onerror="if(this.src.indexOf('${altSrc}')<0){this.src='${altSrc}'}else{this.src='images/produtos/placeholder.svg';this.onerror=null}"
             alt="${r.nome}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;opacity:.85">
        <span class="rec-cat-badge" style="background:${color}">${catLabel[r.categoria]}</span>
      </div>
      <div class="rec-card-body">
        <div class="rec-card-title">${r.nome}</div>
        <div class="rec-card-sub">${r.subtitulo}</div>
        <div class="rec-card-meta">
          <span>⏱ ${r.tempo_total}</span>
          <span>🍽 ${r.porcoes}</span>
        </div>
        <div class="rec-card-tags">
          ${r.tags.slice(0,3).map(t=>`<span class="rec-tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>`;
}

function setReceitaFiltro(cat) {
  receitasFiltro = cat;
  renderReceitasHub();
}

// ─── Detalhe da receita ───
function openReceita(id) {
  const r = RECEITAS.find(x=>x.id===id);
  if (!r) return;
  receitaAberta = id;
  const catColors = {quente:'#c86a30',gelado:'#2d7a8a',mocktail:'#7a2d8a',medicinal:'#2d7a3a',culinario:'#8a7a2d',ritual:'#3a2d8a'};
  const color = catColors[r.categoria] || 'var(--gold)';
  const el = document.getElementById('receitasContainer');
  if (!el) return;

  // Herb links
  const herbLinks = (r.ervas_ids||[]).map(hid=>{
    const herbs = typeof HERBS !== 'undefined' ? HERBS : [];
    const h = herbs.find(x=>x.id===hid);
    return h ? `<button class="rec-herb-link" onclick="goPage('ficha',null,'${h.id}')">${h.icon||'🌿'} ${h.n}</button>` : '';
  }).filter(Boolean).join('');

  el.innerHTML = `
    <button class="rec-back-btn" onclick="renderReceitasHub()">← Todas as receitas</button>

    <div class="rec-detail-header" style="border-left:3px solid ${color}">
      <div class="rec-detail-cat" style="color:${color}">${r.categoria.toUpperCase()} · ${r.nivel.toUpperCase()}</div>
      <h2 class="rec-detail-title">${r.nome}</h2>
      <div class="rec-detail-sub">${r.subtitulo}</div>
      <div class="rec-detail-meta">
        <span>⏱ ${r.tempo_total}</span>
        <span>🍽 ${r.porcoes}</span>
        ${r.tempo_prep?`<span>🔪 ${r.tempo_prep} preparo</span>`:''}
      </div>
    </div>

    ${herbLinks?`<div class="rec-herbs-row">
      <div style="font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.5rem">Ervas desta receita</div>
      ${herbLinks}
    </div>`:''}

    <div class="rec-section">
      <div class="rec-section-title">📦 Ingredientes</div>
      <ul class="rec-ingredientes">
        ${r.ingredientes.map(i=>`<li>${i}</li>`).join('')}
      </ul>
    </div>

    <div class="rec-section">
      <div class="rec-section-title">📋 Modo de Preparo</div>
      <div class="rec-steps">
        ${r.modo.map((s,i)=>`
          <div class="rec-step">
            <div class="rec-step-num" style="background:${color}22;color:${color};border:1px solid ${color}44">${i+1}</div>
            <div class="rec-step-text">${s}</div>
          </div>`).join('')}
      </div>
    </div>

    ${r.dica?`<div class="rec-dica">💡 <strong>Dica:</strong> ${r.dica}</div>`:''}
    ${r.beneficios?`<div class="rec-section"><div class="rec-section-title">✦ Benefícios</div><div style="font-size:.83rem;color:var(--cream2);line-height:1.7">${r.beneficios}</div></div>`:''}
    ${r.pairing?`<div class="rec-section"><div class="rec-section-title">🍽 Harmonização</div><div style="font-size:.83rem;color:var(--cream2);line-height:1.7">${r.pairing}</div></div>`:''}

    <div style="display:flex;gap:8px;margin-top:1.5rem;flex-wrap:wrap">
      ${r.ervas_ids&&r.ervas_ids.length?`
        <button class="roda-start-btn" style="background:${color}22;border:1px solid ${color}44;color:${color}"
                onclick="sendReceitaToBlend(${JSON.stringify(r.ervas_ids)})">
          ＋ Adicionar ervas ao blend
        </button>`:'' }
      <button class="roda-start-btn" onclick="renderReceitasHub()">← Mais receitas</button>
    </div>`;
}

function sendReceitaToBlend(ids) {
  if (typeof blendTray === 'undefined') { toast('Blend não disponível'); return; }
  let added = 0;
  ids.forEach(id => {
    if (!blendTray.includes(id)) { blendTray.push(id); added++; }
  });
  if (added > 0) {
    localStorage.setItem('erb_tray', JSON.stringify(blendTray));
    if (typeof toastLink === 'function') {
      toastLink(`${added} erva${added!==1?'s':''} adicionada${added!==1?'s':''} ao blend`,
        'Ver blend →', ()=>{ goPage('blends'); if(typeof switchBlendTab==='function') switchBlendTab('assistente'); });
    }
  } else {
    if (typeof toast === 'function') toast('Ervas já estão no blend');
  }
}
