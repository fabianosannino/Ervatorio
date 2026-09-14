// ── UTILS ─────────────────────────────────────────────────────────────────

/** Escapa HTML para prevenir XSS ao interpolar dados em innerHTML */
function esc(s){
  if(s==null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/**
 * Ícones de linha editoriais (substituem emojis na UI, alinhados ao pausa.html).
 * Uso: svgIcon('leaf') -> string SVG. Herda a cor via currentColor e o tamanho
 * via font-size/width do contexto. Passe size para fixar (px).
 */
const _ICON_PATHS = {
  leaf: '<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z"/><path d="M6 18C10 14 13.5 10.5 17 7.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.5 4 5.6 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.6-4-9s1.4-6.5 4-9z"/>',
  map: '<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z"/><path d="M9 4v14"/><path d="M15 6v14"/>',
  cart: '<circle cx="9" cy="20" r="1.2"/><circle cx="17" cy="20" r="1.2"/><path d="M2.5 4h2.2l2 12h11l2-8H6.7"/>',
  tea: '<path d="M4 9h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M17 10h1.8a2.2 2.2 0 0 1 0 4.4H17"/><path d="M8 3c-.6.8-.6 1.6 0 2.4M12 3c-.6.8-.6 1.6 0 2.4"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  cone: '<path d="M6 3h12l-1.5 5.5a5 5 0 0 1-9 0L6 3z"/><path d="M8 21h8"/><path d="M12 14v7"/>',
  thermometer: '<path d="M12 3a2 2 0 0 1 2 2v8a4 4 0 1 1-4 0V5a2 2 0 0 1 2-2z"/>',
  spoon: '<path d="M12 12v9"/><ellipse cx="12" cy="7" rx="3.5" ry="4.5"/>',
  calendar: '<rect x="4" y="5" width="16" height="16" rx="1.5"/><path d="M4 9h16M8 3v4M16 3v4"/>',
  pin: '<path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/>',
  // Cabeçalho unificado (handoff 14/09)
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  heart: '<path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>'
};
function svgIcon(name, size){
  const p = _ICON_PATHS[name];
  if(!p) return '';
  const dim = size ? `width="${size}" height="${size}"` : 'width="1em" height="1em"';
  return `<svg class="ui-ico" viewBox="0 0 24 24" ${dim} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline-block;vertical-align:-.15em">${p}</svg>`;
}

// ── DATA ──────────────────────────────────────────────────────────────────

// HERBS mora em js/herbs-data.js (carregado antes deste arquivo) — o
// prerender lê o mesmo catálogo para a ficha estática (PR 06).

// ── LINHAS ──
// Classificação comercial da erva (linha de produto).
// Essencial: tradicionais brasileiras de uso diário.
// Global: importadas / reconhecidas mundialmente.
// Funcional: nootrópicas, adaptogênicas e especiarias funcionais.
const LINHAS = [
  {id:'Essencial', label:'Essencial', color:'#6fa86a', desc:'Ervas tradicionais brasileiras de uso diário.'},
  {id:'Global',    label:'Global',    color:'#6aa0d8', desc:'Ervas internacionais e chás finos reconhecidos mundialmente.'},
  {id:'Funcional', label:'Funcional', color:'#d89a5a', desc:'Ervas funcionais, adaptógenos e especiarias bioativas.'},
];

const HERB_LINE_MAP = {
  Essencial: [1,3,4,5,9,10,14,15,16,17,18,19,20,21,24,28],
  Global:    [6,7,22,23,25,26,27],
  Funcional: [2,8,11,12,13],
};
(function applyLinhas(){
  for(const [linha, ids] of Object.entries(HERB_LINE_MAP)){
    ids.forEach(id=>{ const h=HERBS.find(x=>x.id===id); if(h) h.linha=linha; });
  }
})();

const SUPPLIERS = [
  {id:1,name:"Ervas & Raízes",type:"Produtor Orgânico",city:"São Paulo, SP",since:"2008",cert:"IBD Orgânico",ship:"Todo Brasil",minOrder:"R$ 80",herbs:["Camomila","Melissa","Erva Cidreira","Calêndula","Alfazema"],color:"#2d5a3a"},
  {id:2,name:"Casa das Plantas",type:"Ervateiro Tradicional",city:"Belo Horizonte, MG",since:"1992",cert:"Artesanal",ship:"Sul/Sudeste",minOrder:"R$ 50",herbs:["Boldo","Guaco","Carqueja","Arruda","Erva-doce"],color:"#4a3a1a"},
  {id:3,name:"Phytofarm Brasil",type:"Distribuidor Nacional",city:"Curitiba, PR",since:"2005",cert:"GMP + ANVISA",ship:"Todo Brasil",minOrder:"R$ 120",herbs:["Ginkgo Biloba","Ashwagandha","Bacopa","Valeriana","Rooibos"],color:"#2a3a5a"},
  {id:4,name:"Verde Vivo",type:"Orgânico & Biodinâmico",city:"Florianópolis, SC",since:"2015",cert:"Demeter Biodinâmico",ship:"Todo Brasil",minOrder:"R$ 100",herbs:["Cúrcuma","Gengibre","Canela","Hibisco","Capim-Limão"],color:"#3a5a2a"},
  {id:5,name:"Temperos do Cerrado",type:"Produtor Regional",city:"Goiânia, GO",since:"2010",cert:"Agroecológico",ship:"Centro-Oeste/Norte",minOrder:"R$ 60",herbs:["Espinheira Santa","Barbatimão","Sucupira","Jatobá","Pau-terra"],color:"#5a4a1a"},
  {id:6,name:"TeaImport",type:"Importador Especializado",city:"São Paulo, SP",since:"2012",cert:"SIF + Vigilância",ship:"Todo Brasil",minOrder:"R$ 150",herbs:["Chá Verde","Chá Branco","Rooibos","Hibisco Azul","Tulsi"],color:"#1a3a5a"},
];

// STATE — safe localStorage parser with fallback
function safeLoad(key, fallback){
  try { const v = JSON.parse(localStorage.getItem(key)); return Array.isArray(fallback) ? (Array.isArray(v) ? v : fallback) : (v && typeof v === 'object' ? v : fallback); }
  catch(e){ return fallback; }
}
let favorites = safeLoad('erb_favs', []);
let blendTray = safeLoad('erb_tray', []);
let savedRecipes = safeLoad('erb_recipes', []);
let cart = safeLoad('erb_cart', []);
let activeFilters = {search:'',cat:'Todos',safe:'',avoid:'',momento:'',linha:''};
let activeSup = 'Todos';
let currentHerb = null;

// ── NAVEGAÇÃO EM GRUPOS (handoff 14/09, PR 03) ─────────────────
// Três grupos + Loja condicional + ícones (Buscar, Estante, Meu Ervatório).
// O menu de 18 itens descrevia a arquitetura do app.js; este descreve a
// pergunta de quem chega. Cada grupo tem uma página inicial e uma
// sub-navegação com as páginas que já existem — os renderizadores não mudam.
//
// A lista é UX: quem decide o que aparece de comércio é lojaAtiva() (D3).
// NAV_GROUPS e PAGE_HASH moram em js/nav-data.js (PR 03b): o gerador das
// páginas estáticas (scripts/prerender.mjs) lê o mesmo arquivo, para que o
// cabeçalho seja um só. Carregado antes deste script no index.html.

function navT(key){ return (typeof t === 'function') ? t(key) : key; }
function navGroupOf(pageId){
  for(var i=0;i<NAV_GROUPS.length;i++){
    var g=NAV_GROUPS[i];
    for(var j=0;j<g.pages.length;j++) if(g.pages[j].id===pageId) return g;
  }
  return null;
}
function navHref(p){ return p.href ? p.href : pageHash(p.id, p.slug); }

// Barra do desktop: um botão por grupo. Loja só com lojaAtiva() (o atributo
// data-loja deixa o CSS esconder e o applyLojaState remover).
function renderNav(){
  var el=document.getElementById('ervNavGroups'); if(!el) return;
  el.innerHTML=NAV_GROUPS.filter(function(g){ return !g.icone && (!g.loja || lojaAtiva()); }).map(function(g){
    var home=g.pages[0];
    return '<a class="erv-nav-item" data-group="'+g.id+'" href="'+navHref(home)+'"'+(g.loja?' data-loja':'')+'>'+esc(navT(g.label))+'</a>';
  }).join('');
  var fav=document.getElementById('navFavCount');
  if(fav){ var n=(typeof favorites!=='undefined'&&Array.isArray(favorites))?favorites.length:0; fav.textContent=n?String(n):''; fav.hidden=!n; }
  updateNavState(window._currentPage, window._currentSlug);
}

// Sub-navegação: as páginas do grupo da tela atual. aria-current anda junto
// com a classe `on` — a classe pinta, o atributo é o que o leitor de tela anuncia.
function renderSubnav(pageId, slug){
  var el=document.getElementById('ervSubnav'); if(!el) return;
  var g=navGroupOf(pageId);
  if(!g){ el.innerHTML=''; el.hidden=true; return; }
  var items=g.pages.filter(function(p){ return !p.hidden && (!p.flag || flagLigada(p.flag)); });
  if(items.length<2){ el.innerHTML=''; el.hidden=true; return; }
  el.hidden=false;
  el.innerHTML='<div class="erv-subnav-inner">'+items.map(function(p){
    // Entrada com slug marca só a sua visão (blends/manual, mundo/beber);
    // entrada sem slug marca a tela sem slug. Blends sem slug abre em Prontos.
    var on = p.id===pageId && (p.slug ? (p.slug===slug || (!slug && p.slug==='prontos')) : !slug);
    return '<a class="erv-subnav-item'+(on?' on':'')+'" href="'+navHref(p)+'"'+(on?' aria-current="page"':'')+'>'+esc(navT(p.label))+'</a>';
  }).join('')+'</div>';
}

function updateNavState(pageId, slug){
  var g=navGroupOf(pageId);
  document.querySelectorAll('.erv-nav-item').forEach(function(b){
    var on = !!g && b.getAttribute('data-group')===g.id;
    b.classList.toggle('on', on);
    if(on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
  });
  var conta=document.getElementById('ervNavConta');
  if(conta){ var onC = !!g && g.id==='conta'; conta.classList.toggle('on', onC); if(onC) conta.setAttribute('aria-current','page'); else conta.removeAttribute('aria-current'); }
  renderSubnav(pageId, slug);
}

// Folha do menu (mobile): tela cheia, 4 grupos de 56 px, grade de Meu
// Ervatório, rodapé com Sobre · Clube · Pausa · Privacidade. a11yDialog cuida
// de ESC, foco inicial, focus-trap e devolução do foco.
function openMenuSheet(){
  if(document.getElementById('ervMenuSheet')) return;
  window._sheetOpener = document.activeElement;
  var conta=NAV_GROUPS.filter(function(g){ return g.id==='conta'; })[0];
  var sheet=document.createElement('div');
  sheet.id='ervMenuSheet'; sheet.className='erv-sheet';
  sheet.innerHTML=
    '<div class="erv-sheet-top"><span class="erv-sheet-title">'+esc(navT('nav.menu'))+'</span>'+
    '<button type="button" class="erv-sheet-close" aria-label="'+esc(navT('nav.close'))+'" onclick="closeMenuSheet()">'+svgIcon('close',22)+'</button></div>'+
    '<div class="erv-sheet-groups">'+NAV_GROUPS.filter(function(g){ return !g.icone && (!g.loja || lojaAtiva()); }).map(function(g){
      return '<a class="erv-sheet-group" href="'+navHref(g.pages[0])+'"><span class="erv-sheet-group-name">'+esc(navT(g.label))+'</span>'+(g.sub?'<span class="erv-sheet-group-sub">'+esc(navT(g.sub))+'</span>':'')+'</a>';
    }).join('')+'</div>'+
    '<div class="erv-sheet-label">'+esc(navT('nav.account'))+'</div>'+
    '<div class="erv-sheet-grid">'+conta.pages.filter(function(p){ return p.id!=='sobre' && (!p.flag || flagLigada(p.flag)); }).map(function(p){
      return '<a class="erv-sheet-cell" href="'+navHref(p)+'">'+esc(navT(p.label))+'</a>';
    }).join('')+'</div>'+
    '<div class="erv-sheet-foot">'+
      '<a href="'+pageHash('sobre')+'">'+esc(navT('footer.sobre'))+'</a><span aria-hidden="true">·</span>'+
      '<a href="/#lp-clube">'+esc(navT('footer.clube'))+'</a><span aria-hidden="true">·</span>'+
      '<a href="/pausa.html">'+esc(navT('footer.pausa'))+'</a><span aria-hidden="true">·</span>'+
      '<a href="/privacidade.html">'+esc(navT('footer.privacidade'))+'</a>'+
      '<span class="erv-sheet-langs" id="sheetLangSwitcher"></span>'+
    '</div>';
  document.body.appendChild(sheet);
  document.body.classList.add('erv-sheet-open');
  // Fecha DEPOIS do clique terminar: remover o <a> durante o dispatch cancela
  // a navegação do próprio link no Chromium.
  sheet.addEventListener('click', function(e){ var a=e.target.closest('a[href]'); if(a) setTimeout(closeMenuSheet, 0); });
  // Seletor de idioma dentro da folha (mesmo markup do header).
  var ls=document.getElementById('sheetLangSwitcher');
  var src=document.querySelector('.lang-switcher');
  if(ls && src) ls.innerHTML=src.innerHTML;
  document.querySelectorAll('[aria-controls="ervMenuSheet"]').forEach(function(b){ b.setAttribute('aria-expanded','true'); });
  if(typeof a11yDialog==='function') a11yDialog(sheet, { label: navT('nav.menu'), onClose: closeMenuSheet });
  // a11yDialog só foca quando `offsetParent` existe — e a folha é position:fixed
  // (offsetParent null). Foco explícito no ✕ para que Esc e Tab caiam dentro.
  var close=sheet.querySelector('.erv-sheet-close'); if(close) try{ close.focus(); }catch(e){}
}
function closeMenuSheet(){
  var sheet=document.getElementById('ervMenuSheet');
  if(!sheet) return;
  sheet.remove();
  document.body.classList.remove('erv-sheet-open');
  document.querySelectorAll('[aria-controls="ervMenuSheet"]').forEach(function(b){ b.setAttribute('aria-expanded','false'); });
  // Devolve o foco a quem abriu (o ☰), se ainda estiver na tela.
  var op=window._sheetOpener; window._sheetOpener=null;
  if(op && op.focus && document.body.contains(op)) try{ op.focus(); }catch(e){}
}

// ── LOJA: um interruptor, uma função ─────────────────────────
// D3/D4 em docs/estrategia/2026-09-14-plano-handoff-ux.md.
//
// `loja_ativa` do handoff É o interruptor `pagamentos` (migration
// 20260815230000), que já projeta `site_settings.payments_enabled`. Aqui no
// cliente **só esta função** decide o que aparece. Quem recusa a compra é o
// servidor (`exigirLigado`) — isto é UX.
//
// Falha para DESLIGADO: sem resposta do banco, nada de compra aparece.
function lojaAtiva(){
  var i = window.ERV_INTERRUPTORES;
  if(i && typeof i.pagamentos === 'boolean') return i.pagamentos;
  if(window.SITE_SETTINGS) return window.SITE_SETTINGS.payments_enabled === true;
  return false;
}
var LOJA_PAGES = ['marketplace','suppliers','pedidos'];

// Interruptor genérico (página com `flag` em NAV_GROUPS). Sem resposta do
// banco: desligado — a tela avisa em vez de prometer o que o servidor recusa.
function flagLigada(chave){
  var i = window.ERV_INTERRUPTORES;
  return !!(i && i[chave] === true);
}

// Chamada quando os interruptores respondem (ervaria.loadInterruptores) e no
// boot. Ligado → a classe `loja-on` no <html> revela os blocos [data-loja].
// Desligado → os blocos saem do DOM: nenhum carrinho, nenhuma Loja, nenhum
// "Meus pedidos" para clicar e falhar.
// `confirmado`: a resposta do banco chegou. Sem ela (rede fora, CDN
// bloqueado), os blocos ficam só escondidos — remover e depois receber
// "ligado" deixaria a loja sem tela até o próximo reload.
function applyLojaState(confirmado){
  var on = lojaAtiva();
  document.documentElement.classList.toggle('loja-on', on);
  if(!on){
    if(confirmado) document.querySelectorAll('[data-loja]').forEach(function(el){ el.remove(); });
    // Sem carrinho no DOM, o que estiver no localStorage não tem para onde ir —
    // e o contador (se ainda existir em algum lugar) não deve dizer "3".
    if(LOJA_PAGES.indexOf(window._currentPage) !== -1) goPage('search');
  } else {
    if(typeof updateCartCount === 'function') updateCartCount();
  }
  document.querySelectorAll('[data-loja-href]').forEach(function(a){
    a.setAttribute('href', on ? a.getAttribute('data-loja-href') : (a.getAttribute('data-loja-href-off') || '#lp-loja'));
  });
  renderNav();
}

// "Avise-me quando a loja abrir" (home). Mesmo contrato de pausa.html:
// fetch para newsletter-subscribe, resposta igual para novo e duplicado.
function subscribeLojaAviso(form){ return subscribeEmail(form, 'loja', 'lp.loja.ok', 'lp.loja.err', 'erv_loja_optin'); }

// Um contrato para todos os formulários de e-mail (home, ficha): o que muda
// é a `source`, que o banco e a Edge Function conferem (D10). A resposta é
// a mesma para e-mail novo e repetido — nada aqui diz se alguém já assinou.
function subscribeEmail(form, source, okKey, errKey, optinKey){
  var cfg = window.ERVATORIO_CONFIG || {};
  var input = form.querySelector('input[type="email"]');
  var btn = form.querySelector('button[type="submit"]');
  var msg = form.parentElement.querySelector('[data-email-msg],[data-loja-msg]');
  var v = (input.value || '').trim().toLowerCase();
  var _t = typeof t === 'function' ? t : function(k, fb){ return fb; };
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){ input.focus(); input.setAttribute('aria-invalid','true'); return false; }
  input.removeAttribute('aria-invalid');
  if(btn) btn.disabled = true;
  var locale = 'pt';
  try { locale = localStorage.getItem('erb_lang') || 'pt'; } catch(e){}
  if(['pt','en','es'].indexOf(locale) === -1) locale = 'pt';
  fetch(cfg.FUNCTIONS_URL + '/newsletter-subscribe', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', apikey: cfg.SUPABASE_PUBLISHABLE_KEY, Authorization: 'Bearer ' + cfg.SUPABASE_PUBLISHABLE_KEY },
    body: JSON.stringify({ email: v, source: source, locale: locale })
  }).then(function(res){
    if(!res.ok) throw new Error('HTTP ' + res.status);
    form.style.display = 'none';
    if(msg){ msg.textContent = _t(okKey, 'Anotado. Você será avisado primeiro.'); msg.hidden = false; }
    try { if(optinKey) localStorage.setItem(optinKey, '1'); } catch(e){}
  }).catch(function(err){
    console.error('[Loja/avise-me]', err);
    if(btn) btn.disabled = false;
    if(msg){ msg.textContent = _t(errKey, 'Não consegui salvar agora. Tente de novo em instantes.'); msg.hidden = false; }
  });
  return false;
}

// ── NAVIGATION ──
function goPage(id,btn){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.getElementById('page-'+id).classList.add('on');
  if(id==='favs') renderFavs();
  if(id==='suppliers') renderSuppliers();
  if(id==='roda') initRoda();
  if(id==='perfil') renderPerfil();
  if(id==='sobre') renderSobre();
}

// ── FILTER STATE — 3 independent dimensions ──
// activeFilters.cat   = category string | 'Todos'
// activeFilters.safe  = safe/avoid id string | ''
// activeFilters.momento = moment id string | ''

// ── RING DATA ──
const CATS = ['Todos','Calmante','Sono','Digestivo','Estimulante','Respiratório','Metabólico','Cognitivo','Hormonal','Cardiovascular','Anti-inflamatório','Antioxidante','Adaptogênico','Pele'];
const SAFE_OPTIONS = [{id:'gestantes',label:'Seguro Gestantes',cls:'safe'},{id:'hipertensos',label:'Seguro Hipertensos',cls:'safe'},{id:'crianças',label:'Seguro Crianças',cls:'safe'},{id:'sem-cafeina',label:'Sem Cafeína',cls:'safe'},{id:'evitar-gestantes',label:'Evitar Gestantes',cls:'danger'},{id:'evitar-hipertensos',label:'Evitar Hipertensos',cls:'danger'}];

const WHEEL_CATS = ['Calmante','Sono','Digestivo','Estimulante','Respiratório','Metabólico','Cognitivo','Hormonal','Cardiovasc.','Anti-inflam.','Antioxidante','Adaptogên.','Pele'];
const CAT_COLORS = ['#2d5a4a','#1e3d5c','#5a3a1a','#3a5a1e','#1e4a3a','#5a4a1a','#3a2d6b','#6b3a5a','#6b2d3a','#4a1e4a','#2d4a6b','#3d5a2a','#5a3a4a'];

const RING2 = [
  {id:'gestantes', label:'Gestantes', color:'#2d5a3a', type:'safe'},
  {id:'hipertensos',label:'Hipertensos',color:'#1e3d5c', type:'safe'},
  {id:'crianças',  label:'Crianças',   color:'#3a4a2a', type:'safe'},
  {id:'sem-cafeina',label:'S/ Cafeína',color:'#4a3a2a', type:'safe'},
  {id:'evitar-gestantes',  label:'Evitar Gest.', color:'#5a2a2a', type:'avoid'},
  {id:'evitar-hipertensos',label:'Evitar Hiper.',color:'#4a2a3a', type:'avoid'},
];

// Ring 3: moment — each has tags that map to herb tags
const RING3 = [
  {id:'manha', label:'Manhã',   color:'#7a5c2a', tags:['energia','estimulante','termogênico','foco'],
   desc:'Ervas energizantes, termogênicas e de foco para começar o dia com disposição.'},
  {id:'tarde',  label:'Tarde',   color:'#3a5a2a', tags:['foco','digestivo','antioxidante'],
   desc:'Ervas digestivas e de foco para a tarde produtiva, sem comprometer o sono.'},
  {id:'noite',  label:'Noite',   color:'#1a2a4a', tags:['sono','calmante','ansiedade'],
   desc:'Ervas calmantes e sedativas para relaxar e preparar o corpo para o descanso.'},
  {id:'qualquer',label:'Sempre', color:'#2d3a2d', tags:['digestivo','anti-inflamatório','antioxidante'],
   desc:'Ervas de uso livre, seguras e benéficas em qualquer horário do dia.'},
];

// Context descriptions per ring selection
const CAT_CONTEXT = {
  'Calmante':'Ervas que reduzem excitação do sistema nervoso, aliviam ansiedade e promovem relaxamento físico e mental.',
  'Sono':'Ervas sedativas e hipnóticas que facilitam adormecer e melhoram a qualidade do sono profundo.',
  'Digestivo':'Ervas que estimulam a digestão, eliminam gases, protegem a mucosa e suportam fígado e vesícula.',
  'Estimulante':'Ervas que elevam energia, foco e disposição através de cafeína natural ou compostos adaptogênicos.',
  'Respiratório':'Ervas broncodilatadoras, expectorantes e descongestionantes para vias aéreas e pulmões.',
  'Metabólico':'Ervas termogênicas que aceleram o metabolismo, regulam glicemia e apoiam o emagrecimento.',
  'Cognitivo':'Ervas nootrópicas que melhoram memória, concentração, circulação cerebral e clareza mental.',
  'Hormonal':'Ervas com fitoestrogênios e reguladores do ciclo feminino, menopausa e equilíbrio endócrino.',
  'Cardiovascular':'Ervas hipotensoras, vasodilatadoras e protetoras do coração e sistema circulatório.',
  'Anti-inflamatório':'Ervas que inibem vias inflamatórias (COX-2, LOX), aliviando dores e inflamações sistêmicas.',
  'Antioxidante':'Ervas ricas em polifenóis, antocianinas e catequinas que combatem radicais livres e envelhecimento.',
  'Adaptogênico':'Ervas que equilibram o organismo sob estresse — acalmam quando agitado, energizam quando fatigado.',
  'Pele':'Ervas depurativas, cicatrizantes e antioxidantes que melhoram a pele de dentro para fora.',
};

const SAFE_CONTEXT = {
  'gestantes':'Filtrando apenas ervas seguras e comprovadas para gestantes. Excluindo estimulantes, abortivos e contraindicados.',
  'hipertensos':'Mostrando ervas seguras para hipertensos. Excluindo estimulantes e vasoconstritores.',
  'crianças':'Ervas suaves e seguras para uso infantil, sem sedativos fortes nem estimulantes.',
  'sem-cafeina':'Excluindo todas as ervas com cafeína, mateína ou guaranina. Ideal para à noite ou sensíveis.',
  'evitar-gestantes':'Atenção: estas ervas devem ser evitadas na gestação. Use com acompanhamento profissional.',
  'evitar-hipertensos':'Atenção: estas ervas podem elevar pressão ou interagir com anti-hipertensivos.',
};

// HERB_MOMENTO agora integrado em HERBS[].momento

// ── WHEEL ENGINE ──
let wheelHov1=-1, wheelHov2=-1, wheelHov3=-1;
const wheelCanvas = document.getElementById('filterWheel');
const wheelCtx = wheelCanvas.getContext('2d');
// HiDPI: scale canvas 2x for retina sharpness
const DPR = window.devicePixelRatio || 1;
const WHEEL_CSS = 400; // visual size in CSS pixels (bigger)
const WHEEL_SIZE = Math.round(WHEEL_CSS * DPR);
wheelCanvas.width = WHEEL_SIZE;
wheelCanvas.height = WHEEL_SIZE;
wheelCanvas.style.width = WHEEL_CSS + 'px';
wheelCanvas.style.height = WHEEL_CSS + 'px';
wheelCtx.scale(DPR, DPR);
const WHEEL_CX = WHEEL_CSS/2, WHEEL_CY = WHEEL_CSS/2;
const R_OUTER = 190, R_MIDDLE = 135, R_INNER = 88, R_CENTER = 44; // ring radii (px) — scaled up

function lightenW(hex,amt){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgb(${Math.min(255,r+Math.round(90*amt))},${Math.min(255,g+Math.round(90*amt))},${Math.min(255,b+Math.round(90*amt))})`;
}

function getRing(mx,my){
  const dx=mx-WHEEL_CX, dy=my-WHEEL_CY, d=Math.sqrt(dx*dx+dy*dy);
  if(d<R_CENTER) return {ring:0,idx:-1};
  let a=Math.atan2(dy,dx)+Math.PI/2;
  if(a<0)a+=2*Math.PI; if(a>=2*Math.PI)a-=2*Math.PI;
  if(d<=R_INNER)  return {ring:3, idx:Math.floor(a/(2*Math.PI/RING3.length))%RING3.length};
  if(d<=R_MIDDLE) return {ring:2, idx:Math.floor(a/(2*Math.PI/RING2.length))%RING2.length};
  if(d<=R_OUTER) return {ring:1, idx:Math.floor(a/(2*Math.PI/WHEEL_CATS.length))%WHEEL_CATS.length};
  return {ring:0,idx:-1};
}

function drawRingSlices(n, rOuter, rInner, items, getColor, isSel, isHov, getLabel){
  const arc=2*Math.PI/n, start=-Math.PI/2;
  items.forEach((item,i)=>{
    const a0=start+i*arc, a1=a0+arc;
    const sel=isSel(i), hov=isHov(i);
    // slice
    wheelCtx.beginPath(); wheelCtx.moveTo(WHEEL_CX,WHEEL_CY);
    wheelCtx.arc(WHEEL_CX,WHEEL_CY,rOuter,a0,a1); wheelCtx.closePath();
    wheelCtx.fillStyle = sel ? lightenW(getColor(i),.42) : hov ? lightenW(getColor(i),.2) : getColor(i);
    wheelCtx.fill();
    // border
    wheelCtx.strokeStyle = sel ? 'rgba(200,168,75,.7)' : 'rgba(11,10,8,.65)';
    wheelCtx.lineWidth = sel ? 1.5 : 1;
    wheelCtx.stroke();
    // selected glow ring
    if(sel){
      wheelCtx.beginPath(); wheelCtx.moveTo(WHEEL_CX,WHEEL_CY);
      wheelCtx.arc(WHEEL_CX,WHEEL_CY,rOuter-1,a0+.02,a1-.02); wheelCtx.closePath();
      wheelCtx.strokeStyle='rgba(240,217,138,.35)'; wheelCtx.lineWidth=2; wheelCtx.stroke();
    }
    // label
    const mA=a0+arc/2, lr=(rOuter+rInner)/2;
    const lx=WHEEL_CX+lr*Math.cos(mA), ly=WHEEL_CY+lr*Math.sin(mA);
    wheelCtx.save(); wheelCtx.translate(lx,ly); wheelCtx.rotate(mA+Math.PI/2);
    wheelCtx.fillStyle = sel?'#f0d98a': hov?'#e6c96e':'rgba(235,225,205,.75)';
    const fsize = rOuter===R_OUTER ? 11.5 : rOuter===R_MIDDLE ? 10 : 9.5;
    wheelCtx.font=`${sel?'500':'400'} ${fsize}px Jost,sans-serif`;
    wheelCtx.textAlign='center'; wheelCtx.textBaseline='middle';
    const lbl=getLabel(i); const parts=lbl.split(' ');
    if(parts.length>1){ wheelCtx.fillText(parts[0],0,-5); wheelCtx.fillText(parts.slice(1).join(' '),0,5); }
    else wheelCtx.fillText(lbl,0,0);
    wheelCtx.restore();
  });
}

function drawWheel(){
  wheelCtx.clearRect(0,0,WHEEL_CSS,WHEEL_CSS);

  // Ring 1: Categories (outer)
  drawRingSlices(WHEEL_CATS.length, R_OUTER, R_MIDDLE, WHEEL_CATS,
    i=>CAT_COLORS[i],
    i=>activeFilters.cat===WHEEL_CATS[i],
    i=>wheelHov1===i,
    i=>WHEEL_CATS[i]);

  // Ring 2: Safe/Avoid (middle)
  drawRingSlices(RING2.length, R_MIDDLE, R_INNER, RING2,
    i=>RING2[i].color,
    i=>activeFilters.safe===RING2[i].id,
    i=>wheelHov2===i,
    i=>RING2[i].label);

  // Ring 3: Momento (inner)
  drawRingSlices(RING3.length, R_INNER, R_CENTER, RING3,
    i=>RING3[i].color,
    i=>activeFilters.momento===RING3[i].id,
    i=>wheelHov3===i,
    i=>RING3[i].label);

  // Ring separator lines
  [R_MIDDLE,R_INNER].forEach(r=>{
    wheelCtx.beginPath(); wheelCtx.arc(WHEEL_CX,WHEEL_CY,r,0,Math.PI*2);
    wheelCtx.strokeStyle='rgba(200,168,75,.3)'; wheelCtx.lineWidth=1.5; wheelCtx.stroke();
  });
  // outer ring
  wheelCtx.beginPath(); wheelCtx.arc(WHEEL_CX,WHEEL_CY,R_OUTER+3,0,Math.PI*2);
  wheelCtx.strokeStyle='rgba(200,168,75,.12)'; wheelCtx.lineWidth=1; wheelCtx.stroke();

  // Center
  wheelCtx.beginPath(); wheelCtx.arc(WHEEL_CX,WHEEL_CY,R_CENTER,0,Math.PI*2);
  wheelCtx.fillStyle=getComputedStyle(document.body).getPropertyValue('--bg').trim()||'#1a3a2a'; wheelCtx.fill();
  wheelCtx.strokeStyle='rgba(200,168,75,.45)'; wheelCtx.lineWidth=1.5; wheelCtx.stroke();

  updateWheelCenter();
  updateFilterContext();
  buildLegend();
}

// Hover
wheelCanvas.addEventListener('mousemove',e=>{
  const rect=wheelCanvas.getBoundingClientRect();
  const {ring,idx}=getRing(e.clientX-rect.left, e.clientY-rect.top);
  wheelHov1=ring===1?idx:-1; wheelHov2=ring===2?idx:-1; wheelHov3=ring===3?idx:-1;
  wheelCanvas.style.cursor=(ring>0&&idx>=0)?'pointer':'default';
  drawWheel();
});
wheelCanvas.addEventListener('mouseleave',()=>{ wheelHov1=wheelHov2=wheelHov3=-1; drawWheel(); });

// Click — each ring is fully independent
function handleWheelClick(ring,idx){
  if(ring===1 && idx>=0){
    const cat=WHEEL_CATS[idx];
    activeFilters.cat = activeFilters.cat===cat ? 'Todos' : cat;
  } else if(ring===2 && idx>=0){
    const item=RING2[idx];
    activeFilters.safe = activeFilters.safe===item.id ? '' : item.id;
  } else if(ring===3 && idx>=0){
    const m=RING3[idx];
    activeFilters.momento = activeFilters.momento===m.id ? '' : m.id;
  }
  drawWheel(); buildFilters(); renderHerbs();
}
wheelCanvas.addEventListener('click',e=>{
  const rect=wheelCanvas.getBoundingClientRect();
  const {ring,idx}=getRing(e.clientX-rect.left,e.clientY-rect.top);
  handleWheelClick(ring,idx);
});
wheelCanvas.addEventListener('touchstart',e=>{
  e.preventDefault();
  const t=e.touches[0], rect=wheelCanvas.getBoundingClientRect();
  const {ring,idx}=getRing(t.clientX-rect.left,t.clientY-rect.top);
  handleWheelClick(ring,idx);
},{passive:false});

function updateWheelCenter(){
  const activeCount = [
    activeFilters.cat&&activeFilters.cat!=='Todos',
    activeFilters.safe!=='',
    activeFilters.momento!=='',
    activeFilters.linha!=='',
  ].filter(Boolean).length;
  const el=document.getElementById('wcCat');
  if(activeCount===0){ el.textContent='Toque\num anel'; el.style.fontSize='.55rem'; }
  else { el.textContent=`${activeCount} filtro${activeCount>1?'s':''}`;  el.style.fontSize='.65rem'; }
  // lines
  const parts=[];
  if(activeFilters.cat&&activeFilters.cat!=='Todos') parts.push(activeFilters.cat);
  if(activeFilters.linha) parts.push(LINHAS.find(l=>l.id===activeFilters.linha)?.label||'');
  if(activeFilters.safe) parts.push(RING2.find(r=>r.id===activeFilters.safe)?.label||'');
  if(activeFilters.momento) parts.push(RING3.find(r=>r.id===activeFilters.momento)?.label||'');
  document.getElementById('wcSafe').textContent=parts.join(' + ');
}

function updateFilterContext(){
  const box=document.getElementById('filterContext');
  if(!box) return;
  const lines=[];
  if(activeFilters.momento){
    const m=RING3.find(r=>r.id===activeFilters.momento);
    if(m) lines.push({label:`Momento: ${m.label}`, text:m.desc, color:'#4a6a9a'});
  }
  if(activeFilters.cat&&activeFilters.cat!=='Todos'){
    const text=CAT_CONTEXT[activeFilters.cat]||'';
    if(text) lines.push({label:`Categoria: ${activeFilters.cat}`, text, color:'#c8a84b'});
  }
  if(activeFilters.linha){
    const l=LINHAS.find(x=>x.id===activeFilters.linha);
    if(l) lines.push({label:`Linha: ${l.label}`, text:l.desc, color:l.color});
  }
  if(activeFilters.safe){
    const text=SAFE_CONTEXT[activeFilters.safe]||'';
    if(text){
      const item=RING2.find(r=>r.id===activeFilters.safe);
      lines.push({label:`Filtro de segurança: ${item?.label||''}`, text, color:item?.type==='avoid'?'#c86060':'#4a8a5a'});
    }
  }
  if(!lines.length){ box.innerHTML=''; box.style.display='none'; return; }
  box.style.display='block';
  box.innerHTML=lines.map(l=>`
    <div style="margin-bottom:${lines.length>1?.75:0}rem;padding-left:.75rem;border-left:2px solid ${l.color}">
      <div style="font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;color:${l.color};margin-bottom:2px">${l.label}</div>
      <div style="font-size:.78rem;color:var(--cream2);line-height:1.6">${l.text}</div>
    </div>`).join('');
}

function buildLegend(){
  const leg=document.getElementById('wheelLegend');
  leg.innerHTML='';
  const rings=[
    {label:'Categoria',    color:'#c8a84b', active: activeFilters.cat&&activeFilters.cat!=='Todos' ? activeFilters.cat : null},
    {label:'Linha',        color:'#b8854a', active: activeFilters.linha ? (LINHAS.find(l=>l.id===activeFilters.linha)?.label||null) : null},
    {label:'Segurança',    color:'#4a8a5a', active: activeFilters.safe ? (RING2.find(r=>r.id===activeFilters.safe)?.label||null) : null},
    {label:'Momento',      color:'#4a6a9a', active: activeFilters.momento ? (RING3.find(r=>r.id===activeFilters.momento)?.label||null) : null},
  ];
  rings.forEach(({label,color,active})=>{
    const d=document.createElement('div');
    d.className='legend-item'+(active?' active':'');
    d.innerHTML=`<span class="legend-dot" style="background:${color};${active?'':'opacity:.4'}"></span>`+
      `<span style="color:${active?color:'var(--muted)'}">${active?active:label}</span>`+
      (active?`<span style="color:var(--muted);font-size:.65rem;margin-left:4px">✕</span>`:'');
    if(active){
      d.style.cursor='pointer';
      d.onclick=()=>{
        if(label==='Categoria') activeFilters.cat='Todos';
        else if(label==='Linha') activeFilters.linha='';
        else if(label==='Segurança') activeFilters.safe='';
        else activeFilters.momento='';
        drawWheel(); buildFilters(); renderHerbs();
      };
    }
    leg.appendChild(d);
  });
}

// ── COLLAPSE TOGGLE ──
let filtersOpen=false;
function toggleFilters(){
  filtersOpen=!filtersOpen;
  document.getElementById('filtersCollapse').classList.toggle('open',filtersOpen);
  document.getElementById('toggleArrow').classList.toggle('open',filtersOpen);
}

function clearAllFilters(){
  activeFilters={search:'',cat:'Todos',safe:'',avoid:'',momento:'',linha:''};
  document.getElementById('searchInput').value='';
  drawWheel(); buildFilters(); renderHerbs();
  toast('Filtros limpos');
}

// ============================================================
// ENCONTRE SEU CHÁ (handoff, PR 05) — três passos, um motor
// ============================================================
// `recomendar()` é a única regra de recomendação: o passo 3 e o blend
// sugerido saem dela. Intenção → categorias e tags de HERBS; restrição →
// `avoid`, pela mesma barreira do Perfil (ervaContraindicada); momento é
// preferência (pontua), não filtro — nunca zera o resultado. A restrição
// vive em encState, só nesta sessão; com conta e consentimento, o Perfil
// pré-marca (encRestricoesDoPerfil). Sem campo de texto livre (D17).
const INTENCOES = {
  sono:      { cats:['Sono','Calmante'],         tags:['sono','sedativa','calmante','insônia'],                 momento:'noite', blend:'Insônia' },
  foco:      { cats:['Estimulante','Cognitivo'], tags:['foco','energia','memória','cognitivo'],                 momento:'manha', blend:'Foco' },
  digestao:  { cats:['Digestivo'],               tags:['digestivo','digestao','digestiva','gases','gastrite','náusea'], momento:'', blend:'Dor de estômago' },
  ansiedade: { cats:['Calmante','Adaptogênico'], tags:['ansiedade','calmante','antidepressiva','estresse'],     momento:'', blend:'Ansiedade' },
  imunidade: { cats:['Respiratório'],            tags:['gripe','tosse','expectorante','vitamina c','respiratorio','congestão','bronquite'], momento:'', blend:'Gripe/Tosse' },
  explorar:  { cats:[],                          tags:[],                                                       momento:'', blend:'default' },
};
const ENC_INTENT_LABEL = { sono:'intent.sleep', foco:'intent.focus', digestao:'intent.digestive', ansiedade:'intent.anxiety', imunidade:'intent.immunity', explorar:'intent.explore' };
const ENC_MOMENTOS = ['manha','tarde','noite','qualquer'];
// Chips de restrição do passo 2 → condições de SAUDE_CONDICOES (a barreira).
const ENC_RESTRICOES = [
  { id:'gestante',       cond:['gestante','amamentando'], label:'enc.r_gestante' },
  { id:'hipertensao',    cond:['hipertensao'],            label:'perfil.cond_hipertensao' },
  { id:'anticoagulante', cond:['anticoagulante'],         label:'perfil.cond_anticoagulante' },
  { id:'crianca',        cond:['crianca'],                label:'perfil.cond_crianca' },
];
// Grupos cuja contraindicação rende o selo «Cautela» mesmo sem restrição informada.
const ENC_CAUTELA = ['gestantes','hipertensos','anticoagulantes','crianças','lactantes','amamentação'];
let encState = { passo:1, intencao:null, momento:'qualquer', restricoes:[] };

function encT(k){ return (typeof t === 'function') ? t(k) : k; }
function encCondicoes(restricoes){
  var out=[];
  (restricoes||[]).forEach(function(r){
    var d=ENC_RESTRICOES.filter(function(x){ return x.id===r; })[0];
    if(d) d.cond.forEach(function(c){ if(out.indexOf(c)===-1) out.push(c); });
  });
  return out;
}
function encTemCautela(h){
  var av=(h.avoid||[]).map(function(a){ return String(a).toLowerCase(); });
  return ENC_CAUTELA.some(function(g){ return av.some(function(v){ return v===g || v.indexOf(g+' ')===0 || v.indexOf(g+' (')===0; }); });
}

/** O motor único. Puro: recebe {intencao, momento, restricoes}, devolve as três
 *  ervas, o que foi removido pela restrição e o blend sugerido. */
function recomendar(opts){
  opts=opts||{};
  var def=INTENCOES[opts.intencao]||INTENCOES.explorar;
  var momento=(opts.momento && opts.momento!=='qualquer') ? opts.momento : '';
  var condicoes=encCondicoes(opts.restricoes);
  var lista=HERBS.map(function(h){
    var tags=(h.tags||[]).map(function(x){ return String(x).toLowerCase(); });
    var pontos=0;
    if(def.cats.indexOf(h.cat)!==-1) pontos+=3;
    def.tags.forEach(function(x){ if(tags.indexOf(x)!==-1) pontos+=2; });
    if(def.cats.length && pontos===0) return null;              // fora da intenção
    if(momento){ var m=h.momento||[]; if(m.indexOf(momento)!==-1) pontos+=2; else if(m.indexOf('qualquer')!==-1) pontos+=1; }
    pontos+=(h.safe||[]).length*0.5;
    return { h:h, pontos:pontos };
  }).filter(Boolean);
  var removidas=lista.filter(function(x){ return ervaContraindicada(x.h, condicoes); }).map(function(x){ return x.h; });
  var aptas=lista.filter(function(x){ return !ervaContraindicada(x.h, condicoes); });
  aptas.sort(function(a,b){ return (b.pontos-a.pontos) || a.h.n.localeCompare(b.h.n,'pt'); });
  return {
    ervas: aptas.slice(0,3).map(function(x){ return { herb:x.h, cautela:encTemCautela(x.h) }; }),
    removidas: removidas,
    condicoes: condicoes,
    blend: blendParaIntencao(opts.intencao, condicoes),
  };
}
function blendParaIntencao(intencao, condicoes){
  var def=INTENCOES[intencao]||INTENCOES.explorar;
  var chave=BLEND_DB[def.blend] ? def.blend : 'default';
  var rec=BLEND_DB[chave];
  var contra=(condicoes||[]).length ? rec.ings.filter(function(i){ return ervaContraindicada(HERBS.find(function(h){ return h.id===i.id; }), condicoes); }) : [];
  return { chave:chave, rec:rec, contra:contra };
}
function encRestricoesDoPerfil(){
  var ativas=saudeCondicoesAtivas();
  return ENC_RESTRICOES.filter(function(r){ return r.cond.some(function(c){ return ativas.indexOf(c)!==-1; }); }).map(function(r){ return r.id; });
}

// ── A tela ──
function encHashAtual(){
  if(!encState.intencao) return pageHash('search');
  var parts=[encState.intencao];
  if(encState.passo>=3){ parts.push(encState.momento||'qualquer'); parts.push(encState.restricoes.length ? encState.restricoes.join(',') : 'nenhuma'); }
  return pageHash('search', parts.join('/'));
}
// Só sincroniza quando a tela está de fato aberta pelo usuário (nunca no boot,
// com a landing por cima — mudar o hash ali faria o roteador abrir o app).
function encSincronizarHash(){
  if(window._currentPage!=='search') return;
  var lp=document.getElementById('landingPage'); if(lp && lp.style.display!=='none') return;
  try { history.replaceState(null, '', encHashAtual()); } catch(e){}
}
function encPintar(passo){
  var p1=document.getElementById('encPasso1'), p2=document.getElementById('encPasso2'), p3=document.getElementById('encPasso3');
  if(!p1||!p2||!p3) return false;
  encState.passo=passo;
  p1.hidden=passo!==1; p2.hidden=passo!==2; p3.hidden=passo!==3;
  var titulos={1:'enc.t1',2:'enc.t2',3:'enc.t3'};
  var tt=document.getElementById('encTitle'); if(tt) tt.textContent=encT(titulos[passo]);
  var ey=document.getElementById('encEyebrow'); if(ey) ey.textContent=encT('enc.step').replace('{n}', String(passo));
  document.querySelectorAll('#encProgress span').forEach(function(sp,i){ sp.classList.toggle('on', i<passo); });
  document.querySelectorAll('#encPasso1 .intencao-card').forEach(function(b){ var on=b.dataset.intencao===encState.intencao; b.classList.toggle('on',on); b.setAttribute('aria-pressed', on?'true':'false'); });
  if(passo===2) encRenderPasso2();
  if(passo===3) encRenderPasso3();
  return true;
}
// Estado inicial da tela (boot e #encontrar sem intenção): passo 1, sem mexer no hash.
function encReset(){
  encState={ passo:1, intencao:null, momento:'qualquer', restricoes:[] };
  encPintar(1);
  encMostrarBusca(false);
}
function encIrPara(passo){
  if(passo===1){ encState.intencao=null; encMostrarBusca(false); }
  if(!encPintar(passo)) return;
  encSincronizarHash();
  if(passo!==1){ var head=document.querySelector('.enc-head'); if(head && head.scrollIntoView) head.scrollIntoView({behavior:'smooth',block:'start'}); }
}
function encEscolherIntencao(intencao){
  if(!INTENCOES[intencao]) return;
  encState.intencao=intencao;
  if(!encState.restricoes.length) encState.restricoes=encRestricoesDoPerfil();
  if(typeof trackAction==='function') trackAction('intencao', intencao);
  encIrPara(2);
}
function encVerOpcoes(){ if(!encState.intencao){ encIrPara(1); return; } encIrPara(3); }
function encChip(texto, on, data, onclick){
  var b=document.createElement('button'); b.type='button';
  b.className='enc-chip'+(on?' on':''); b.setAttribute('aria-pressed', on?'true':'false');
  Object.keys(data).forEach(function(k){ b.dataset[k]=data[k]; });
  b.textContent=texto; b.onclick=onclick; return b;
}
function encRenderPasso2(){
  var e=document.getElementById('encEscolha'); if(e) e.textContent=encT(ENC_INTENT_LABEL[encState.intencao]||'intent.explore');
  var m=document.getElementById('encMomentos');
  if(m){ m.innerHTML=''; ENC_MOMENTOS.forEach(function(id){ m.appendChild(encChip(encT('enc.m_'+id), encState.momento===id, {momento:id}, function(){ encState.momento=id; encRenderPasso2(); })); }); }
  var r=document.getElementById('encRestricoes');
  if(r){
    r.innerHTML='';
    r.appendChild(encChip(encT('enc.r_none'), !encState.restricoes.length, {restricao:'nenhuma'}, function(){ encState.restricoes=[]; encRenderPasso2(); }));
    ENC_RESTRICOES.forEach(function(rd){
      var on=encState.restricoes.indexOf(rd.id)!==-1;
      r.appendChild(encChip(encT(rd.label), on, {restricao:rd.id}, function(){
        if(on) encState.restricoes=encState.restricoes.filter(function(x){ return x!==rd.id; }); else encState.restricoes.push(rd.id);
        encRenderPasso2();
      }));
    });
  }
}
function encRenderPasso3(){
  var res=recomendar({ intencao:encState.intencao, momento:encState.momento, restricoes:encState.restricoes });
  var aviso=document.getElementById('encAviso');
  if(aviso){
    if(encState.restricoes.length){
      var quem=encState.restricoes.map(function(id){ var d=ENC_RESTRICOES.filter(function(x){ return x.id===id; })[0]; return d ? encT(d.label) : id; }).join(', ');
      aviso.innerHTML='<div class="enc-aviso">'+esc(encT('encontrar.safety').replace('{restrição}',quem).replace('{restriction}',quem))+'</div>';
    } else aviso.innerHTML='';
  }
  var cards=document.getElementById('encCards');
  if(cards){
    cards.innerHTML = res.ervas.length ? res.ervas.map(function(x){
      var h=x.herb, fav=favorites.includes(h.id);
      return '<article class="enc-card" data-herb-id="'+h.id+'">'+
        '<div class="enc-card-top"><h2 class="enc-card-nome">'+esc(h.n)+'</h2><span class="enc-badge '+(x.cautela?'cautela':'seguro')+'">'+esc(encT(x.cautela?'enc.badge_caution':'enc.badge_safe'))+'</span></div>'+
        '<p class="enc-card-why">'+esc(h.tagline||h.ef||'')+'</p>'+
        '<p class="enc-card-prep">'+esc(encT('enc.prep'))+': '+esc([h.temp,h.tempo,h.dose].filter(Boolean).join(' · '))+'</p>'+
        (x.cautela ? '<p class="enc-card-avoid">'+esc((h.avoid||[]).slice(0,2).join(' · '))+'</p>' : '')+
        '<div class="enc-card-actions">'+
          '<button type="button" class="enc-btn enc-btn-gold" onclick="openHerbModal('+h.id+')">'+esc(encT('enc.ficha'))+'</button>'+
          '<button type="button" class="enc-btn enc-fav'+(fav?' on':'')+'" onclick="toggleFav(event,'+h.id+');encRenderPasso3()">'+(fav?'♥ ':'♡ ')+esc(encT(fav?'enc.saved':'enc.save'))+'</button>'+
        '</div></article>';
    }).join('') : '<p class="enc-note">'+esc(encT('enc.empty'))+'</p>';
  }
  var bl=document.getElementById('encBlend');
  if(bl){
    var b=res.blend, rec=b.rec;
    bl.innerHTML='<div class="enc-blend-box"><div class="enc-sublabel">'+esc(encT('enc.blend_title'))+'</div>'+
      '<div class="enc-blend-nome">'+esc(rec.name)+'</div><p class="enc-note">'+esc(rec.tagline)+'</p>'+
      '<p class="enc-blend-ings">'+rec.ings.map(function(i){ return esc(i.n)+' <span>'+esc(i.amount)+'</span>'; }).join(' · ')+'</p>'+
      (b.contra.length ? '<div class="warn-box">'+esc(encT('enc.blend_contra').replace('{ervas}', b.contra.map(function(i){ return i.n; }).join(', ')))+'</div>' : '')+
      '<div class="enc-card-actions">'+
        '<button type="button" class="enc-btn enc-btn-gold" onclick=\'sendWizardToManual('+JSON.stringify(rec.ings.map(function(i){ return i.id; }))+')\'>'+esc(encT('enc.blend_edit'))+'</button>'+
        '<button type="button" class="enc-btn save-recipe-btn" onclick="saveRecipe('+JSON.stringify(b.chave).replace(/"/g,'&quot;')+')">'+esc(encT('enc.blend_save'))+'</button>'+
      '</div></div>';
  }
}
// Modo avançado: a roda de filtros, os chips e a grade (a antiga Busca).
function encMostrarBusca(mostrar){
  var box=document.getElementById('encBusca'), btn=document.getElementById('encBuscaToggle');
  if(!box) return;
  box.hidden=!mostrar;
  if(btn) btn.setAttribute('aria-expanded', mostrar?'true':'false');
  if(mostrar){ try { drawWheel(); buildFilters(); renderHerbs(); } catch(e){} }
}
function encBuscaDigitou(){
  var v=(document.getElementById('searchInput')||{}).value||'';
  if(v.trim()) encMostrarBusca(true);
  renderHerbs();
}
// #encontrar/<intencao>[/<momento>/<restricoes>] — chips do hero da landing e
// link compartilhado do resultado. Intenção desconhecida cai no passo 1.
function aplicarIntencao(slug){
  var parts=String(slug||'').split('/');
  var intencao=parts[0];
  if(!INTENCOES[intencao]){ encReset(); return; }
  encState.intencao=intencao;
  var mom=parts[1]; encState.momento = ENC_MOMENTOS.indexOf(mom)!==-1 ? mom : 'qualquer';
  var restr=parts[2];
  if(restr!==undefined){
    encState.restricoes = restr==='nenhuma' ? [] : restr.split(',').filter(function(r){ return ENC_RESTRICOES.some(function(x){ return x.id===r; }); });
  } else if(!encState.restricoes.length) encState.restricoes=encRestricoesDoPerfil();
  encIrPara(parts.length>=3 ? 3 : 2);
}

function buildFilters(){
  const row = document.getElementById('filterRow');
  row.innerHTML = '';
  // ── label helper ──
  const addLabel = (txt,color)=>{
    const l=document.createElement('div');
    l.style.cssText=`width:100%;font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:${color};margin:6px 0 3px;font-weight:400`;
    l.textContent=txt; row.appendChild(l);
  };
  addLabel('Categoria','#c8a84b');
  CATS.forEach(c=>{
    const b=document.createElement('button');
    b.className='fchip'+(activeFilters.cat===c?' on':'');
    b.textContent=c;
    b.onclick=()=>{ activeFilters.cat=c; drawWheel(); buildFilters(); renderHerbs(); };
    row.appendChild(b);
  });
  addLabel('Linha','#b8854a');
  LINHAS.forEach(l=>{
    const b=document.createElement('button');
    const isOn = activeFilters.linha===l.id;
    b.className=`fchip fchip-linha linha-${l.id.toLowerCase()}`+(isOn?' on':'');
    b.textContent=l.label;
    b.onclick=()=>{ activeFilters.linha = activeFilters.linha===l.id?'':l.id; drawWheel(); buildFilters(); renderHerbs(); };
    row.appendChild(b);
  });
  addLabel('Momento do dia','#4a6a9a');
  RING3.forEach(m=>{
    const b=document.createElement('button');
    b.className='fchip'+(activeFilters.momento===m.id?' on':'');
    b.textContent=m.label;
    b.onclick=()=>{ activeFilters.momento=activeFilters.momento===m.id?'':m.id; drawWheel(); buildFilters(); renderHerbs(); };
    row.appendChild(b);
  });
  addLabel('Segurança','#4a8a5a');
  SAFE_OPTIONS.forEach(s=>{
    const b=document.createElement('button');
    const isOn = activeFilters.safe===s.id;
    b.className=`fchip ${s.cls}`+(isOn?' on':'');
    b.textContent=s.label;
    b.onclick=()=>{
      if(s.cls==='safe') activeFilters.safe = activeFilters.safe===s.id?'':s.id;
      else activeFilters.safe = activeFilters.safe===s.id?'':s.id;
      drawWheel(); buildFilters(); renderHerbs();
    };
    row.appendChild(b);
  });
}

/** Pure filter logic — testable without DOM */
function filterHerbs(herbs, query, filters){
  return herbs.filter(h=>{
    const txt = (h.n+h.lat+h.ef+h.tags.join(' ')).toLowerCase();
    if(query && !txt.includes(query)) return false;
    if(filters.cat!=='Todos' && h.cat!==filters.cat) return false;
    if(filters.linha && h.linha!==filters.linha) return false;
    if(filters.momento && !(h.momento||[]).includes(filters.momento)) return false;
    if(filters.safe==='gestantes' && !h.safe.includes('gestantes')) return false;
    if(filters.safe==='hipertensos' && !h.safe.includes('hipertensos')) return false;
    if(filters.safe==='crianças' && !h.safe.includes('crianças')) return false;
    if(filters.safe==='sem-cafeina' && h.avoid.some(a=>a.includes('cafeína'))) return false;
    if(filters.safe==='evitar-gestantes' && !h.avoid.some(a=>a.includes('gestantes'))) return false;
    if(filters.safe==='evitar-hipertensos' && !h.avoid.some(a=>a.includes('hipertensos'))) return false;
    return true;
  });
}

let _herbCardsBuilt = false;
function resetHerbCards(){ _herbCardsBuilt = false; }

function buildHerbCards(){
  if(_herbCardsBuilt) return;
  const grid = document.getElementById('herbGrid');
  grid.innerHTML = HERBS.map(h=>`
    <div class="herb-card" data-herb-id="${h.id}" onclick="openHerbModal(${h.id})">
      <div class="hc-top">
        ${h.img
          ? `<img class="herb-img" src="${h.img}" data-responsive="${h.img}" alt="${esc(h.n)}" loading="lazy" decoding="async" onerror="this.outerHTML='<span style=\\'font-size:1.3rem\\'>${h.icon}</span>'">`
          : `<span style="font-size:1.3rem">${h.icon}</span>`
        }
        <button class="hc-fav ${favorites.includes(h.id)?'on':''}" onclick="toggleFav(event,${h.id})" title="Favoritar" aria-label="Favoritar ${esc(h.n)}">♥</button>
        <button class="hc-blend ${blendTray.includes(h.id)?'on':''}" data-blend-herb="${h.id}" onclick="event.stopPropagation();toggleTrayModal(${h.id})" title="Selecionar para blend">＋</button>
      </div>
      <div class="hc-name">${esc(h.n)}</div>
      ${h.tagline ? `<div class="hc-tagline">${esc(h.tagline)}</div>` : ''}
      <div class="hc-latin">${esc(h.lat)}</div>
      <div class="hc-effect">${esc(h.ef)}</div>
      <div class="hc-tags">
        <span class="htag htag-cat">${esc(h.cat)}</span>
        ${h.linha?`<span class="htag htag-linha linha-${h.linha.toLowerCase()}">${esc(h.linha)}</span>`:''}
        ${(h.momento||[]).map(m=>{const mo=RING3.find(r=>r.id===m); return mo?`<span class="htag" style="background:${mo.color}22;border:0.5px solid ${mo.color}44;color:${mo.color}">${esc(mo.label)}</span>`:''}).join('')}
        ${h.safe.slice(0,1).map(s=>`<span class="htag htag-safe">✓ ${esc(s)}</span>`).join('')}
        ${h.avoid.length?`<span class="htag htag-warn">⚠ ${esc(h.avoid[0])}</span>`:''}
      </div>
    </div>
  `).join('');
  _herbCardsBuilt = true;
}

function renderHerbs(){
  buildHerbCards();
  const q = document.getElementById('searchInput').value.toLowerCase();
  const visibleIds = new Set(filterHerbs(HERBS, q, activeFilters).map(h=>h.id));
  const grid = document.getElementById('herbGrid');
  const cards = grid.querySelectorAll('.herb-card');
  cards.forEach(card => {
    const id = parseInt(card.dataset.herbId);
    card.style.display = visibleIds.has(id) ? '' : 'none';
    // Update fav state without full rebuild
    const favBtn = card.querySelector('.hc-fav');
    if(favBtn) favBtn.classList.toggle('on', favorites.includes(id));
  });
  // Update count summary
  let countEl = grid.querySelector('.herb-count');
  const hasFilter = activeFilters.cat!=='Todos'||activeFilters.safe||activeFilters.momento||activeFilters.linha||q;
  if(!countEl){ countEl=document.createElement('div'); countEl.className='herb-count'; countEl.style.cssText='font-size:.75rem;color:var(--muted);margin-bottom:.75rem;grid-column:1/-1'; grid.prepend(countEl); }
  countEl.textContent = hasFilter ? `${visibleIds.size} de ${HERBS.length} ervas` : '';
  countEl.style.display = hasFilter ? '' : 'none';
  // No-results message
  let noRes = grid.querySelector('.no-results');
  if(!visibleIds.size && !noRes){ noRes=document.createElement('div'); noRes.className='no-results'; noRes.style.gridColumn='1/-1'; noRes.textContent='Nenhuma erva encontrada com esses filtros'; grid.appendChild(noRes); }
  if(noRes) noRes.style.display = visibleIds.size ? 'none' : '';
}

// ── HERB MODAL ──
function openHerbModal(id){
  currentHerb = HERBS.find(h=>h.id===id);
  if(typeof trackAction==='function') trackAction('view-herb', id);
  const h = currentHerb;
  const inTray = blendTray.includes(h.id);
  document.getElementById('modalContent').innerHTML=`
    <div class="modal-handle"></div>
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-herb-header">
      ${h.img
        ? `<img class="modal-herb-img" src="${h.img}" data-responsive="${h.img}" alt="${esc(h.n)}" loading="lazy" decoding="async" onerror="this.outerHTML='<div class=\\'modal-herb-img modal-herb-icon\\'>${h.icon}</div>'">`
        : `<div class="modal-herb-img modal-herb-icon">${h.icon}</div>`
      }
      <div class="modal-herb-header-info">
        <div class="modal-herb-name">${esc(h.n)}</div>
        ${h.tagline ? `<div class="modal-tagline">${esc(h.tagline)}</div>` : ''}
        <div class="modal-latin">${esc(h.lat)}</div>
        ${h.linha?`<div class="modal-linha"><span class="htag htag-linha linha-${h.linha.toLowerCase()}">Linha ${esc(h.linha)}</span></div>`:''}
        ${h.bioma?`<div class="modal-bioma-row"><span class="herb-bioma-badge">${svgIcon('globe')} ${esc(h.bioma)}</span></div>`:''}
      </div>
    </div>
    ${h.usos&&h.usos.length?`<div class="modal-usos-row">${h.usos.map(u=>`<span class="herb-uso-chip">${esc(u)}</span>`).join('')}</div>`:''}
    <button id="modalBlendBtn" data-blend-herb="${h.id}" class="modal-blend-toggle ${inTray?'in-tray':''}" onclick="toggleTrayModal(${h.id})">
      ${inTray?'✓ Selecionado para blend':'＋ Selecionar para blend'}
    </button>
    <div class="modal-section">
      <div class="modal-label">Sobre</div>
      <div class="modal-text">${esc(h.detail)}</div>
    </div>
    <div class="modal-section">
      <div class="modal-label">Como preparar</div>
      <div class="prep-grid">
        <div class="prep-item"><div class="prep-val">${esc(h.temp)}</div><div class="prep-key">Temperatura</div></div>
        <div class="prep-item"><div class="prep-val">${esc(h.tempo)}</div><div class="prep-key">Infusão</div></div>
        <div class="prep-item"><div class="prep-val">${esc(h.dose)}</div><div class="prep-key">Dose</div></div>
        <div class="prep-item"><div class="prep-val">${esc(h.freq)}</div><div class="prep-key">Frequência</div></div>
      </div>
    </div>
    ${h.avoid&&h.avoid.length?`<div class="warn-box">⚠ Contraindicações: ${h.avoid.map(a=>esc(a)).join(', ')}</div>`:''}
    ${h.safe&&h.safe.length?`<div class="safe-box">✓ Seguro para: ${h.safe.map(s=>esc(s)).join(', ')}</div>`:''}
    ${h.restricoes_pais&&h.restricoes_pais.length?`<div class="restricoes-box">${svgIcon('globe')} Restrições regionais:<ul>${h.restricoes_pais.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></div>`:''}
    <div id="modalFichaSlot"></div>
    <div style="display:flex;gap:8px;margin-top:1rem">
                <button class="add-blend-btn" style="flex:1;background:rgba(200,168,75,.15)" onclick="openTimer(${h.id})">${_clockIcon()} Preparar agora</button>
          <button class="add-blend-btn" style="flex:1" onclick="addToTray(${h.id})">${svgIcon('leaf')} Ver no Blend</button>
    </div>
  `;
  document.getElementById('herbModal').classList.add('on');
  loadFichaForHerb(h);
}

// Resolve ficha local (FICHAS_ANCORA) pelo nome ou nome científico da erva
function _fichaAncoraForHerb(h){
  if(typeof FICHAS_ANCORA==='undefined') return null;
  const _n = s=>String(s||'').normalize('NFC').toLowerCase().replace(/[àáâãä]/g,'a').replace(/[èéêë]/g,'e').replace(/[ìíîï]/g,'i').replace(/[òóôõö]/g,'o').replace(/[ùúûü]/g,'u').replace(/ç/g,'c').trim();
  const hn = _n(h.n);
  const hl = h.lat ? _n(h.lat.split(' ').slice(0,2).join(' ')) : '';
  for(const [slug, f] of Object.entries(FICHAS_ANCORA)){
    if(_n(f.nome_popular)===hn) return f;
    if(hl && f.nome_cientifico && _n(f.nome_cientifico).startsWith(hl)) return f;
  }
  return null;
}

// Busca a ficha editorial — primeiro no cache local, depois no Supabase.
async function loadFichaForHerb(h){
  const slot = document.getElementById('modalFichaSlot');
  if(!slot) return;
  if(slot.dataset.herbId===String(h.id)) return;
  slot.dataset.herbId = String(h.id);

  // 1. Tentar cache local imediatamente (sem latência)
  const ancora = _fichaAncoraForHerb(h);
  if(ancora){
    slot.innerHTML = `<button class="ficha-cta" onclick="openFichaAncora('${esc(ancora.slug)}')">Ver ficha completa<span class="ficha-cta-arrow">→</span></button>`;
    return;
  }

  // 2. Fallback: Supabase
  if(typeof ervaria==='undefined') return;
  try {
    const ficha = await ervaria.loadFichaByLatin(h.lat);
    if(!ficha) return;
    slot.innerHTML = `<button class="ficha-cta" onclick="openFicha('${esc(ficha.slug||'')}')">Ver ficha completa<span class="ficha-cta-arrow">→</span></button>`;
  } catch(_) {}
}

// Slug da ficha editorial de uma erva do catálogo (ou null).
function fichaSlugPorId(herbId){
  const h=HERBS.find(x=>x.id===herbId);
  const f=h?_fichaAncoraForHerb(h):null;
  return f&&f.slug?f.slug:null;
}

// A ficha tem UMA tela (D33): quem antes abria o overlay vai para
// #ficha/<slug>. renderFichaPage (js/ervatorio-pages.js) lê a mesma
// FICHAS_ANCORA primeiro, então a navegação é instantânea e funciona offline.
function openFichaAncora(slug){ openFicha(slug); }
function openFicha(slug){
  if(!slug){ toast('Ficha indisponível'); return; }
  const hm=document.getElementById('herbModal'); if(hm) hm.classList.remove('on');
  goPage('ficha', null, String(slug));
}

function closeModal(e){
  if(!e||e.target===document.getElementById('herbModal'))
    document.getElementById('herbModal').classList.remove('on');
}

// ── FAVORITES ──
function updateNavFavCount(){
  var fav=document.getElementById('navFavCount'); if(!fav) return;
  var n=Array.isArray(favorites)?favorites.length:0; fav.textContent=n?String(n):''; fav.hidden=!n;
}
function toggleFav(e,id){
  e.stopPropagation();
  if(favorites.includes(id)) favorites=favorites.filter(f=>f!==id);
  else { favorites.push(id); if(typeof trackAction==='function') trackAction('fav-herb', id); }
  localStorage.setItem('erb_favs',JSON.stringify(favorites)); updateNavFavCount();
  renderHerbs();
  const now=favorites.includes(id);
  document.querySelectorAll(`[data-fav-herb="${id}"]`).forEach(btn=>{
    btn.textContent=now?(btn.dataset.labelOn||'♥ Favorito'):(btn.dataset.labelOff||'♡ Favoritar');
    btn.classList.toggle('on',now);
    btn.setAttribute('aria-pressed', now?'true':'false');
  });
  toast(now?'Adicionado aos favoritos':'Removido dos favoritos');
}

function renderFavs(){
  const grid=document.getElementById('favGrid');
  const favHerbs=HERBS.filter(h=>favorites.includes(h.id));
  if(!favHerbs.length){ grid.innerHTML='<div class="no-results">Nenhum favorito ainda. Explore as ervas e clique em ♥</div>'; }
  else { grid.innerHTML=favHerbs.map(h=>`
    <div class="fav-card" onclick="openHerbModal(${h.id})">
      ${h.img
        ? `<img class="fav-img" src="${h.img}" data-responsive="${h.img}" alt="${esc(h.n)}" loading="lazy" decoding="async" onerror="this.outerHTML='<div class=\\'fav-icon\\'>${h.icon}</div>'">`
        : `<div class="fav-icon">${h.icon}</div>`
      }
      <div style="flex:1;min-width:0">
        <div class="fav-name">${esc(h.n)}</div>
        <div class="fav-lat">${esc(h.lat)}</div>
        <div class="fav-ef">${esc(h.ef.substring(0,50))}...</div>
      </div>
      <button class="fav-blend-btn${blendTray.includes(h.id)?' in-tray':''}" data-blend-herb="${h.id}" onclick="event.stopPropagation();toggleTrayModal(${h.id})" title="Adicionar ao blend">
        ${blendTray.includes(h.id)?'✓':'＋'}
      </button>
    </div>`).join(''); }
  const sr=document.getElementById('savedRecipes');
  if(savedRecipes.length){
    sr.innerHTML=`<div class="sec-title" style="font-size:1.1rem;margin-bottom:.75rem">Blends Salvos</div>`+
    savedRecipes.map((r,i)=>`
      <div class="recipe-card">
        <div class="recipe-header">
          <div class="recipe-name">${esc(r.name)}</div>
          <div class="recipe-tagline">${esc(r.tagline)}</div>
        </div>
        <div class="recipe-body">
          ${r.ingredients.map(ing=>`<div class="ing-row"><div><div class="ing-name">${esc(ing.n)}</div></div><div class="ing-amount">${esc(ing.amount)}</div></div>`).join('')}
          <button onclick="deleteSavedRecipe(${i})" title="Excluir receita" style="margin-top:.75rem;background:none;border:none;color:var(--muted);font-size:.72rem;cursor:pointer;display:inline-flex;align-items:center;gap:5px">${svgIcon('trash')} Remover</button>
        </div>
      </div>`).join('');
  } else { sr.innerHTML=''; }
}

function deleteSavedRecipe(i){
  const removed=savedRecipes[i];
  savedRecipes.splice(i,1);
  localStorage.setItem('erb_recipes',JSON.stringify(savedRecipes));
  if(removed && typeof ervaria!=='undefined') ervaria.deleteRecipeRemote(removed.name);
  renderFavs();
}

// Favoritar a partir de uma ficha (overlay ou página completa)
function toggleFichaFav(id){
  if(favorites.includes(id)) favorites=favorites.filter(f=>f!==id);
  else favorites.push(id);
  localStorage.setItem('erb_favs',JSON.stringify(favorites)); updateNavFavCount();
  renderHerbs();
  const now=favorites.includes(id);
  document.querySelectorAll(`[data-fav-herb="${id}"]`).forEach(btn=>{
    btn.textContent=now?(btn.dataset.labelOn||'♥ Favorito'):(btn.dataset.labelOff||'♡ Favoritar');
    btn.classList.toggle('on',now);
    btn.setAttribute('aria-pressed', now?'true':'false');
  });
  toast(now?'Adicionado aos favoritos':'Removido dos favoritos');
}

// ── BLEND TRAY ──
function toggleTrayModal(id){
  const inTray=blendTray.includes(id);
  if(inTray){ blendTray=blendTray.filter(i=>i!==id); }
  else { blendTray.push(id); }
  localStorage.setItem('erb_tray',JSON.stringify(blendTray));
  renderTray();
  const now=blendTray.includes(id);
  document.querySelectorAll(`[data-blend-herb="${id}"]`).forEach(btn=>{
    if(btn.classList.contains('hc-blend')){
      btn.textContent=now?'✓':'＋';
      btn.classList.toggle('on',now);
    } else if(btn.classList.contains('fav-blend-btn')){
      btn.textContent=now?'✓':'＋';
      btn.classList.toggle('in-tray',now);
    } else {
      btn.textContent=now?(btn.dataset.labelOn||'✓ Selecionado para blend'):(btn.dataset.labelOff||'＋ Selecionar para blend');
      btn.setAttribute('aria-pressed', now?'true':'false');
      btn.classList.toggle('in-tray',now);
    }
  });
  if(now) toastLink('Adicionado ao blend','Ver blend →',()=>{ goPage('blends'); if(typeof switchBlendTab==='function') switchBlendTab('assistente'); });
  else toast('Removido do blend');
}

function addToTray(id){
  if(!blendTray.includes(id)) blendTray.push(id);
  localStorage.setItem('erb_tray',JSON.stringify(blendTray));
  renderTray(); closeModal();
  goPage('blends');
  if(typeof switchBlendTab==='function') switchBlendTab('assistente');
  toast('Erva adicionada ao blend!');
}

function renderTray(){
  const items=document.getElementById('trayItems');
  if(!items) return;
  if(!blendTray.length){ items.innerHTML='<span class="tray-empty">Selecione ervas nas fichas do Ervatório para montar seu blend</span>'; return; }
  const herbs=HERBS.filter(h=>blendTray.includes(h.id));
  items.innerHTML=herbs.map(h=>`
    <span class="tray-item">${h.icon} ${esc(h.n)}
      <button class="tray-remove" onclick="removeTray(${h.id})">✕</button>
    </span>`).join('')+
      `<button class="tray-open-manual" onclick="importTrayToManual()">${svgIcon('leaf')} Abrir no construtor →</button>`;
}

function importTrayToManual(){
  ctrBlend=blendTray.filter(id=>HERBS.find(h=>h.id===id)).map(id=>({id,qty:1}));
  goPage('blends');
  if(typeof switchBlendTab==='function') switchBlendTab('manual');
  renderCtrBlend(); renderCtrHerbs();
  toast('Ervas carregadas no construtor!');
}

function removeTray(id){ blendTray=blendTray.filter(i=>i!==id); localStorage.setItem('erb_tray',JSON.stringify(blendTray)); renderTray(); }

// ── WIZARD ──
// O assistente de blends (WIZ_*, buildWizard, generateBlend) saiu no PR 05:
// virou o Encontre seu chá. BLEND_DB fica — é o blend sugerido por intenção.
// BLEND_DB mora em js/blends-data.js (carregado antes deste arquivo) — o
// prerender lê os mesmos blends para /blends/<slug>/ (PR 10).

function getSaborAdj(sabor,rec){
  const adj={
    'Doce':'Adicione 1 col. chá de alcaçuz ou canela para adoçar naturalmente, sem açúcar.',
    'Suave':'Reduza as quantidades em 30% e infuse por menos tempo (5 min) para sabor mais delicado.',
    'Cítrico':'Adicione casca de limão siciliano (1 tira) durante a infusão. Espete no final.',
    'Amargo':'Adicione 1/4 col. de carqueja ou boldo. Beba puro.',
    'Picante':'Adicione 2 fatias de gengibre fresco e uma pitada de pimenta caiena.',
    'Floral':'Adicione 1 col. sopa de camomila ou rosas secas para perfumar.',
  };
  return adj[sabor]||'';
}

function getHoraAdj(hora){
  const adj={
    'Ao acordar':'Em jejum, com água a 85°C. Espere 20 min para o café.',
    'Manhã':'Com café da manhã leve. Evitar combinação com café.',
    'Pós-refeição':'15-20 min após comer, ainda morno.',
    'Tarde':'Temperatura ambiente ou gelado é ótimo.',
    'À noite':'Beba 1h antes de dormir. Luz baixa no ambiente.',
    'Antes de dormir':'30-40 min antes de deitar. Celular fora do alcance.',
  };
  return adj[hora]||'';
}

function sendWizardToManual(ids){
  ctrBlend=ids.filter(id=>HERBS.find(h=>h.id===id)).map(id=>({id,qty:1}));
  switchBlendTab('manual');
  renderCtrBlend(); renderCtrHerbs();
  toast('Blend carregado no construtor!');
}

function saveRecipe(chave){
  const rec=BLEND_DB[chave]||BLEND_DB['default'];
  if(savedRecipes.find(r=>r.name===rec.name)){ toast('Blend já foi salvo!'); return; }
  const entry={name:rec.name,tagline:rec.tagline,ingredients:rec.ings};
  savedRecipes.unshift(entry);
  localStorage.setItem('erb_recipes',JSON.stringify(savedRecipes));
  if(typeof ervaria!=='undefined') ervaria.pushRecipe(entry);
  toast('Blend salvo nos favoritos!');
  document.querySelectorAll('.save-recipe-btn').forEach(b=>{ b.textContent='✓ '+navT('enc.saved'); });
}

// ── SUPPLIERS ──
const SUP_TYPES=['Todos','Produtor Orgânico','Ervateiro Tradicional','Distribuidor Nacional','Orgânico & Biodinâmico','Produtor Regional','Importador Especializado'];

function renderSuppliers(){
  const sf=document.getElementById('supFilter');
  sf.innerHTML='';
  SUP_TYPES.forEach(t=>{
    const b=document.createElement('button');
    b.className='fchip'+(activeSup===t?' on':'');
    b.textContent=t;
    b.onclick=()=>{ activeSup=t; renderSuppliers(); };
    sf.appendChild(b);
  });
  const list=SUPPLIERS.filter(s=>activeSup==='Todos'||s.type===activeSup);
  document.getElementById('supGrid').innerHTML=list.map(s=>`
    <div class="sup-card">
      <div class="sup-header">
        <div>
          <div class="sup-name">${esc(s.name)}</div>
          <div style="font-size:.7rem;color:var(--muted);margin-top:2px">${esc(s.city)}</div>
        </div>
        <span class="sup-type" style="background:${s.color}22;border-color:${s.color}55;color:${s.color}">${esc(s.type.split(' ')[0])}</span>
      </div>
      <div class="sup-body">
        <div class="sup-row"><span>Desde</span>${esc(s.since)}</div>
        <div class="sup-row"><span>Certificação</span>${esc(s.cert)}</div>
        <div class="sup-row"><span>Envio</span>${esc(s.ship)}</div>
        <div class="sup-row"><span>Pedido mínimo</span>${esc(s.minOrder)}</div>
        <div class="sup-herbs">
          ${s.herbs.map(h=>`<span class="sup-herb-tag">${esc(h)}</span>`).join('')}
        </div>
        <button class="shop-btn" onclick="filterShopBySup(${s.id})">Ver produtos na loja →</button>
      </div>
    </div>`).join('');
}

function filterShopBySup(supId){
  const sup=(typeof SUPPLIERS!=='undefined')?SUPPLIERS.find(s=>s.id===supId):null;
  if(typeof mktCatActive!=='undefined') mktCatActive='Todos';
  if(typeof mktSearchVal!=='undefined') mktSearchVal=sup?sup.name.toLowerCase():'';
  const searchInput=document.getElementById('mktSearch');
  if(searchInput) searchInput.value=sup?sup.name:'';
  goPage('marketplace');
}

function updateCartCount(){
  const total=cart.reduce((s,c)=>s+c.qty,0);
  const el=document.getElementById('mktCartCount');
  if(el) el.textContent=total?`(${total})`:'';
}

function openCart(){
  const ol=document.getElementById('cartOverlay');
  ol.classList.toggle('on');
  if(ol.classList.contains('on')) renderCart();
}

function closeCartOverlay(e){ if(e.target===document.getElementById('cartOverlay')) openCart(); }

function renderCart(){
  const ci=document.getElementById('cartItems');
  const cf=document.getElementById('cartFooter');
  if(!cart.length){ ci.innerHTML='<div class="empty-cart">Seu carrinho está vazio</div>'; cf.innerHTML=''; return; }
  ci.innerHTML=cart.map(c=>`
    <div class="cart-item">
      <div class="cart-item-icon">${c.icon}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${esc(c.name)}</div>
        <div class="cart-item-sup">${esc(c.seller||c.sup||'')} · ${esc(c.unit)}</div>
        <div class="cart-qty">
          <button class="qty-btn" onclick="changeQty(${c.id},-1)">−</button>
          <span class="qty-val">${c.qty}</span>
          <button class="qty-btn" onclick="changeQty(${c.id},1)">+</button>
        </div>
      </div>
      <div class="cart-item-price">R$ ${(c.price*c.qty).toFixed(2)}</div>
    </div>`).join('');
  const sub=cart.reduce((s,c)=>s+c.price*c.qty,0);
  const frete=sub>150?0:15.9;
  const paymentsOn=window.SITE_SETTINGS!=null?window.SITE_SETTINGS.payments_enabled===true:window.ERVATORIO_CONFIG?.PAYMENTS_ENABLED!==false;
  const maintMsg=window.ERVATORIO_CONFIG?.PAYMENTS_DISABLED_MSG||'Pagamentos em manutenção';
  const checkoutBlock=paymentsOn
    ? `<button class="checkout-btn" onclick="openCart();openCheckout()">Finalizar pedido →</button>`
    : `<div style="margin-top:.75rem;padding:.75rem;background:rgba(200,168,75,.08);border:1px solid rgba(200,168,75,.25);border-radius:8px;text-align:center;font-size:.78rem;color:var(--gold2);line-height:1.4">⏳ ${esc(maintMsg)}</div>`;
  cf.innerHTML=`<div class="cart-total">
    <div class="total-row"><span>Subtotal</span><span>R$ ${sub.toFixed(2)}</span></div>
    <div class="total-row"><span>Frete</span><span>${frete===0?'Grátis':'R$ '+frete.toFixed(2)}</span></div>
    ${frete>0?`<div style="font-size:.68rem;color:var(--muted);text-align:right">Frete grátis acima de R$ 150</div>`:''}
    <div class="total-final"><span>Total</span><span>R$ ${(sub+frete).toFixed(2)}</span></div>
    ${checkoutBlock}
    <button onclick="clearCart()" style="width:100%;margin-top:.5rem;background:none;border:none;color:var(--muted);font-size:.72rem;cursor:pointer">Esvaziar carrinho</button>
  </div>`;
}

function changeQty(id,delta){
  const item=cart.find(c=>c.id===id);
  if(item){ item.qty+=delta; if(item.qty<=0) cart=cart.filter(c=>c.id!==id); }
  localStorage.setItem('erb_cart',JSON.stringify(cart));
  updateCartCount(); renderCart();
  if(typeof renderMkt==='function' && document.getElementById('mktGrid')) renderMkt();
}
function clearCart(){
  cart=[]; localStorage.setItem('erb_cart','[]');
  updateCartCount(); renderCart();
  if(typeof renderMkt==='function' && document.getElementById('mktGrid')) renderMkt();
}

// ════════════════════════════════════════
// ── RODA DOS CHÁS ──
// ════════════════════════════════════════
const RODA_LAYERS = [
  {id:'sintoma', label:'Sintoma'},
  {id:'sistema', label:'Sistema'},
  {id:'momento', label:'Momento'},
  {id:'sabor',   label:'Sabor'},
];
const RODA_DATA = {
  sintoma:[
    {name:'Insônia',color:'#1e3d5c',herbs:[{n:'Valeriana',icon:'🌸',ef:'Sedativa potente'},{n:'Maracujá',icon:'🍃',ef:'Ansiolítico natural'},{n:'Camomila',icon:'🌼',ef:'Apigenina / GABA'},{n:'Melissa',icon:'🍃',ef:'Inibe excitação neural'},{n:'Lúpulo',icon:'🌿',ef:'Sedativo forte'}],combo:['Valeriana + Maracujá','Camomila + Melissa'],prep:{temp:'85°C',tempo:'10 min',dose:'2 col / 250ml',freq:'1x à noite'}},
    {name:'Ansiedade',color:'#2d5a4a',herbs:[{n:'Maracujá',icon:'🍃',ef:'Ansiolítico clínico'},{n:'Alfazema',icon:'💜',ef:'Reduz ondas beta'},{n:'Ashwagandha',icon:'🌿',ef:'Reduz cortisol 30%'},{n:'Melissa',icon:'🍃',ef:'Eleva serotonina'},{n:'Tília',icon:'🌸',ef:'Age em 30 min'}],combo:['Maracujá + Melissa','Alfazema + Ashwagandha'],prep:{temp:'85°C',tempo:'8 min',dose:'2 col / 250ml',freq:'2-3x ao dia'}},
    {name:'Foco',color:'#3a2d6b',herbs:[{n:'Ginkgo Biloba',icon:'🍃',ef:'Circulação cerebral'},{n:'Chá Verde',icon:'🍵',ef:'L-teanina + cafeína'},{n:'Alecrim',icon:'🌿',ef:'1,8-cineol cognitivo'},{n:'Bacopa',icon:'🌱',ef:'Memória longo prazo'},{n:'Erva-mate',icon:'🌿',ef:'Mateína + vitaminas B'}],combo:['Ginkgo + Chá Verde','Alecrim + Bacopa'],prep:{temp:'75°C',tempo:'4 min',dose:'1 col / 200ml',freq:'manhã'}},
    {name:'Digestão',color:'#5a3a1a',herbs:[{n:'Boldo',icon:'🍃',ef:'Estimula bile'},{n:'Hortelã',icon:'🌿',ef:'Antiespasmódico'},{n:'Erva-doce',icon:'🌾',ef:'Carminativa clássica'},{n:'Gengibre',icon:'🫚',ef:'Procinético'},{n:'Alcachofra',icon:'🌱',ef:'Colerético'}],combo:['Boldo + Alcachofra','Hortelã + Erva-doce'],prep:{temp:'90°C',tempo:'7 min',dose:'1 col / 250ml',freq:'após refeições'}},
    {name:'Energia',color:'#6b5a2d',herbs:[{n:'Guaraná',icon:'🫐',ef:'Estimulante potente'},{n:'Ginseng',icon:'🌿',ef:'Tônico nervoso'},{n:'Erva-mate',icon:'🌿',ef:'Energia sustentada'},{n:'Gengibre',icon:'🫚',ef:'Termogênico'},{n:'Canela',icon:'🌿',ef:'Glicemia estável'}],combo:['Guaraná + Canela','Ginseng + Gengibre'],prep:{temp:'85°C',tempo:'5 min',dose:'1 col / 250ml',freq:'manhã'}},
    {name:'Gripe',color:'#2d4a3a',herbs:[{n:'Guaco',icon:'🍃',ef:'Broncodilatador ANVISA'},{n:'Gengibre',icon:'🫚',ef:'Antiviral natural'},{n:'Tomilho',icon:'🌿',ef:'Antisséptico pulmonar'},{n:'Sabugueiro',icon:'🌸',ef:'Encurta gripe 2-4d'},{n:'Pitanga',icon:'🍃',ef:'Antifebril nativo'}],combo:['Guaco + Gengibre','Tomilho + Sabugueiro'],prep:{temp:'95°C',tempo:'10 min',dose:'2 col / 300ml',freq:'3-4x ao dia'}},
    {name:'Pressão Alta',color:'#6b2d3a',herbs:[{n:'Hibisco',icon:'🌺',ef:'-7mmHg sistólica'},{n:'Alho',icon:'🧄',ef:'Vasodilatador'},{n:'Melissa',icon:'🍃',ef:'Relaxa artérias'},{n:'Cúrcuma',icon:'🫚',ef:'Elasticidade vascular'},{n:'Cavalinha',icon:'🌾',ef:'Diurética'}],combo:['Hibisco + Melissa','Alho + Cúrcuma'],prep:{temp:'90°C',tempo:'10 min',dose:'2 col / 300ml',freq:'2-3x ao dia'}},
    {name:'Emagrecimento',color:'#2d5a2d',herbs:[{n:'Chá Verde',icon:'🍵',ef:'EGCG queima gordura'},{n:'Carqueja',icon:'🌿',ef:'Termogênico'},{n:'Hibisco',icon:'🌺',ef:'Inibe amilase'},{n:'Gengibre',icon:'🫚',ef:'Termogênico'},{n:'Garcinia',icon:'🍃',ef:'Inibe lipase'}],combo:['Chá Verde + Gengibre','Carqueja + Hibisco'],prep:{temp:'80°C',tempo:'6 min',dose:'1 col / 250ml',freq:'antes das refeições'}},
  ],
  sistema:[
    {name:'Nervoso',color:'#3a2d6b',herbs:[{n:'Valeriana',icon:'🌸',ef:'Sedativa SNC'},{n:'Ginkgo',icon:'🍃',ef:'Circulação cerebral'},{n:'Melissa',icon:'🍃',ef:'Inibe MAO-B'},{n:'Ashwagandha',icon:'🌿',ef:'Reduz cortisol'},{n:'Bacopa',icon:'🌱',ef:'Memória'}],combo:['Ginkgo + Bacopa','Valeriana + Melissa'],prep:{temp:'85°C',tempo:'8 min',dose:'1 col',freq:'2x dia'}},
    {name:'Digestivo',color:'#5a3a1a',herbs:[{n:'Boldo',icon:'🍃',ef:'Hepático'},{n:'Hortelã',icon:'🌿',ef:'Antiespasmódico'},{n:'Erva-doce',icon:'🌾',ef:'Carminativa'},{n:'Alcachofra',icon:'🌱',ef:'Colerética'},{n:'Gengibre',icon:'🫚',ef:'Procinético'}],combo:['Boldo + Alcachofra','Hortelã + Erva-doce'],prep:{temp:'90°C',tempo:'8 min',dose:'1 col',freq:'após refeições'}},
    {name:'Cardiovascular',color:'#6b2d3a',herbs:[{n:'Hibisco',icon:'🌺',ef:'Hipotensor'},{n:'Alho',icon:'🧄',ef:'Vasodilatador'},{n:'Cúrcuma',icon:'🫚',ef:'Artérias'},{n:'Castanha Índia',icon:'🍃',ef:'Venoso'},{n:'Ginkgo',icon:'🍃',ef:'Microcirculação'}],combo:['Hibisco + Alho','Cúrcuma + Gengibre'],prep:{temp:'90°C',tempo:'10 min',dose:'2 col',freq:'2x dia'}},
    {name:'Respiratório',color:'#1e4a3a',herbs:[{n:'Guaco',icon:'🍃',ef:'Broncodilatador'},{n:'Tomilho',icon:'🌿',ef:'Expectorante'},{n:'Eucalipto',icon:'🌿',ef:'Descongestionante'},{n:'Alcaçuz',icon:'🌿',ef:'Suaviza mucosa'},{n:'Sabugueiro',icon:'🌸',ef:'Antiviral'}],combo:['Guaco + Tomilho','Eucalipto + Hortelã'],prep:{temp:'95°C',tempo:'10 min',dose:'2 col',freq:'3x dia'}},
    {name:'Hormonal',color:'#6b3a5a',herbs:[{n:'Maca Peruana',icon:'🌾',ef:'Equilibra hormônios'},{n:'Folha de Amora',icon:'🍃',ef:'Fitoestrogênios'},{n:'Sálvia',icon:'🌿',ef:'Menopausa'},{n:'Dong Quai',icon:'🌸',ef:'MTC feminina'},{n:'Pata de Vaca',icon:'🍃',ef:'Hipoglicemiante'}],combo:['Maca + Dong Quai','Folha Amora + Sálvia'],prep:{temp:'88°C',tempo:'10 min',dose:'2 col',freq:'2x dia'}},
    {name:'Renal',color:'#2d4a6b',herbs:[{n:'Cavalinha',icon:'🌾',ef:'Diurética potente'},{n:'Quebra Pedra',icon:'🌿',ef:'Cálculos'},{n:'Cana do Brejo',icon:'🌱',ef:'ITU e rins'},{n:'Dente-de-leão',icon:'🌼',ef:'Diurético suave'},{n:'Bardana',icon:'🌿',ef:'Depurativo'}],combo:['Cavalinha + Quebra Pedra','Dente-de-leão + Bardana'],prep:{temp:'90°C',tempo:'10 min',dose:'2 col',freq:'3x dia'}},
  ],
  momento:[
    {name:'Ao Acordar',color:'#7a5c2a',herbs:[{n:'Gengibre + Limão',icon:'🫚',ef:'Alcaliniza e ativa'},{n:'Chá Verde',icon:'🍵',ef:'Energia focada'},{n:'Canela',icon:'🌿',ef:'Regula glicemia'},{n:'Hortelã',icon:'🌿',ef:'Desperta sentidos'},{n:'Alecrim',icon:'🌿',ef:'Circulação cerebral'}],combo:['Gengibre + Limão + Mel','Chá Verde + Hortelã'],prep:{temp:'85°C',tempo:'5 min',dose:'1 col',freq:'em jejum'}},
    {name:'Pré-Treino',color:'#5a3a1a',herbs:[{n:'Guaraná',icon:'🫐',ef:'Energia e resistência'},{n:'Gengibre',icon:'🫚',ef:'Termogênico'},{n:'Erva-mate',icon:'🌿',ef:'+24% VO2max'},{n:'Pimenta Caiena',icon:'🌶',ef:'Capsaicina'},{n:'Maca Peruana',icon:'🌾',ef:'Desempenho'}],combo:['Guaraná + Gengibre','Erva-mate + Pimenta'],prep:{temp:'80°C',tempo:'5 min',dose:'1 col',freq:'30min antes'}},
    {name:'Pós-Refeição',color:'#3a4a1a',herbs:[{n:'Hortelã',icon:'🌿',ef:'Digestiva'},{n:'Erva-doce',icon:'🌾',ef:'Carminativa'},{n:'Boldo',icon:'🍃',ef:'Estimula bile'},{n:'Gengibre',icon:'🫚',ef:'Procinético'},{n:'Louro',icon:'🍃',ef:'Carminativo'}],combo:['Hortelã + Erva-doce','Boldo + Gengibre'],prep:{temp:'90°C',tempo:'7 min',dose:'1 col',freq:'logo após comer'}},
    {name:'Tarde',color:'#2d4a2d',herbs:[{n:'Chá Verde',icon:'🍵',ef:'Foco + calma'},{n:'Rooibos',icon:'🍃',ef:'Sem cafeína'},{n:'Alecrim',icon:'🌿',ef:'Clareza mental'},{n:'Tulsi',icon:'🌱',ef:'Anti-estresse'},{n:'Hibisco',icon:'🌺',ef:'Refrescante'}],combo:['Chá Verde + Hortelã','Rooibos + Hibisco'],prep:{temp:'80°C',tempo:'5 min',dose:'1 col',freq:'14h-16h'}},
    {name:'À Noite',color:'#1a2a4a',herbs:[{n:'Camomila',icon:'🌼',ef:'Calmante universal'},{n:'Melissa',icon:'🍃',ef:'Mente quieta'},{n:'Maracujá',icon:'🍃',ef:'Ansiolítico'},{n:'Alfazema',icon:'💜',ef:'Ondas beta'},{n:'Valeriana',icon:'🌸',ef:'Insônia'}],combo:['Camomila + Melissa','Maracujá + Valeriana'],prep:{temp:'85°C',tempo:'10 min',dose:'2 col',freq:'1h antes dormir'}},
    {name:'Detox',color:'#2a3a1a',herbs:[{n:'Cúrcuma + Pimenta',icon:'🫚',ef:'Anti-inflamatório'},{n:'Dente-de-leão',icon:'🌼',ef:'Fígado e rins'},{n:'Alcachofra',icon:'🌱',ef:'Bile e detox'},{n:'Cardo Mariano',icon:'🌸',ef:'Hepatoprotetor'},{n:'Boldo',icon:'🍃',ef:'Colagogo'}],combo:['Gengibre + Limão + Cúrcuma','Dente-de-leão + Alcachofra'],prep:{temp:'90°C',tempo:'10 min',dose:'2 col',freq:'em jejum'}},
  ],
  sabor:[
    {name:'Amargo',color:'#2d4a2d',herbs:[{n:'Boldo',icon:'🍃',ef:'Amargo hepático'},{n:'Carqueja',icon:'🌿',ef:'Amargo termogênico'},{n:'Alcachofra',icon:'🌱',ef:'Amargo colerético'},{n:'Losna',icon:'🌿',ef:'Estimulante gástrico'},{n:'Dente-de-leão',icon:'🌼',ef:'Amargo tônico'}],combo:['Boldo + Canela','Carqueja + Limão'],prep:{temp:'90°C',tempo:'8 min',dose:'1 col',freq:'pós refeições'}},
    {name:'Doce',color:'#5a3a1a',herbs:[{n:'Alcaçuz',icon:'🌿',ef:'50x mais doce'},{n:'Erva-doce',icon:'🌾',ef:'Anis doce'},{n:'Canela',icon:'🌿',ef:'Doce-especiada'},{n:'Camomila',icon:'🌼',ef:'Floral suave'},{n:'Stevia',icon:'🌱',ef:'Zero calorias'}],combo:['Camomila + Alcaçuz','Erva-doce + Canela'],prep:{temp:'88°C',tempo:'7 min',dose:'1 col',freq:'qualquer hora'}},
    {name:'Cítrico',color:'#4a5a1a',herbs:[{n:'Capim-Limão',icon:'🌾',ef:'Cítrico calmante'},{n:'Erva Cidreira',icon:'🍃',ef:'Limão + calma'},{n:'Melissa',icon:'🍃',ef:'Limão mel'},{n:'Hibisco',icon:'🌺',ef:'Ácido frutado'},{n:'Rosa',icon:'🌹',ef:'Floral cítrico'}],combo:['Capim-limão + Gengibre','Melissa + Hibisco'],prep:{temp:'88°C',tempo:'7 min',dose:'2 col',freq:'qualquer hora'}},
    {name:'Picante',color:'#6b2a1a',herbs:[{n:'Gengibre',icon:'🫚',ef:'Picante termogênico'},{n:'Canela',icon:'🌿',ef:'Doce-picante'},{n:'Cravo',icon:'🌿',ef:'Aromático forte'},{n:'Cardamomo',icon:'🌱',ef:'Especiado exótico'},{n:'Pimenta',icon:'🌶',ef:'Capsaicina'}],combo:['Gengibre + Canela + Cravo','Cardamomo + Cúrcuma'],prep:{temp:'95°C',tempo:'10 min',dose:'1 col',freq:'manhã'}},
    {name:'Floral',color:'#6b3a5a',herbs:[{n:'Camomila',icon:'🌼',ef:'Floral clássico'},{n:'Jasmim',icon:'🌸',ef:'Intenso floral'},{n:'Rosa',icon:'🌹',ef:'Refinado'},{n:'Alfazema',icon:'💜',ef:'Medicinal'},{n:'Tília',icon:'🌸',ef:'Floral mel'}],combo:['Camomila + Rosa','Jasmim + Alfazema'],prep:{temp:'85°C',tempo:'7 min',dose:'2 col',freq:'tarde e noite'}},
    {name:'Mentolado',color:'#1a4a3a',herbs:[{n:'Hortelã',icon:'🌿',ef:'Mentol intenso'},{n:'Eucalipto',icon:'🌿',ef:'Cineol fresco'},{n:'Tomilho',icon:'🌿',ef:'Mentolado herbal'},{n:'Manjericão',icon:'🌿',ef:'Fresco herbáceo'},{n:'Capim-Limão',icon:'🌾',ef:'Cítrico fresco'}],combo:['Hortelã + Eucalipto','Tomilho + Hortelã'],prep:{temp:'85°C',tempo:'5 min',dose:'1 col',freq:'qualquer hora'}},
  ],
};

let rodaActiveLayer='sintoma', rodaHovIdx=-1, rodaSelIdx=-1;
const RODA_COLORS_MAP={sintoma:['#1e3d5c','#2d5a4a','#3a2d6b','#5a3a1a','#6b5a2d','#2d4a3a','#6b2d3a','#2d5a2d'],sistema:['#3a2d6b','#5a3a1a','#6b2d3a','#1e4a3a','#6b3a5a','#2d4a6b'],momento:['#7a5c2a','#5a3a1a','#3a4a1a','#2d4a2d','#1a2a4a','#2a3a1a'],sabor:['#2d4a2d','#5a3a1a','#4a5a1a','#6b2a1a','#6b3a5a','#1a4a3a']};

function initRoda(){
  const lay=document.getElementById('rodaLayers');
  lay.innerHTML='';
  RODA_LAYERS.forEach(l=>{
    const b=document.createElement('button');
    b.className='roda-layer-btn'+(rodaActiveLayer===l.id?' on':'');
    b.textContent=l.label;
    b.onclick=()=>{ rodaActiveLayer=l.id; rodaSelIdx=-1; initRoda(); renderRodaPanel(null); };
    lay.appendChild(b);
  });
  rodaHovIdx=-1;
  drawRoda();
}

function drawRoda(){
  const cv=document.getElementById('rodaCanvas');
  if(!cv)return;
  const ctx=cv.getContext('2d');
  const W=340,CX=W/2,CY=W/2,R=162,IR=38;
  // Ajuste retina: canvas em alta resolução com CSS mantendo tamanho lógico
  const dpr=Math.min(window.devicePixelRatio||1,3);
  if(cv.width!==W*dpr){
    cv.width=W*dpr; cv.height=W*dpr;
    cv.style.width=W+'px'; cv.style.height=W+'px';
  }
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,W,W);
  // Suavização de texto
  ctx.imageSmoothingEnabled=true;
  if('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality='high';
  const slices=RODA_DATA[rodaActiveLayer];
  const cols=RODA_COLORS_MAP[rodaActiveLayer];
  const n=slices.length, arc=2*Math.PI/n, start=-Math.PI/2;
  slices.forEach((s,i)=>{
    const a0=start+i*arc, a1=a0+arc;
    const sel=rodaSelIdx===i, hov=rodaHovIdx===i;
    ctx.beginPath(); ctx.moveTo(CX,CY); ctx.arc(CX,CY,sel?R+5:R,a0,a1); ctx.closePath();
    const c=cols[i]||'#3a3a3a';
    ctx.fillStyle=sel?lightenW(c,.4):hov?lightenW(c,.2):c; ctx.fill();
    ctx.strokeStyle=sel?'rgba(200,168,75,.7)':'rgba(11,10,8,.65)'; ctx.lineWidth=sel?1.5:1; ctx.stroke();
    if(sel){ctx.beginPath();ctx.moveTo(CX,CY);ctx.arc(CX,CY,R+4,a0+.02,a1-.02);ctx.closePath();ctx.strokeStyle='rgba(240,217,138,.3)';ctx.lineWidth=2;ctx.stroke();}
    const mA=a0+arc/2, lr=(R+IR)/2;
    const lx=CX+lr*Math.cos(mA), ly=CY+lr*Math.sin(mA);
    ctx.save(); ctx.translate(lx,ly); ctx.rotate(mA+Math.PI/2);
    ctx.fillStyle=sel?'#f5dd95':hov?'#ead083':'rgba(245,235,215,.92)';
    const fs = n>8 ? 11 : n>6 ? 12 : 13;
    ctx.font=`${sel?'600':'500'} ${fs}px 'Jost',system-ui,sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    // Sombra sutil para contraste sobre as fatias
    ctx.shadowColor='rgba(0,0,0,.45)'; ctx.shadowBlur=2; ctx.shadowOffsetY=.5;
    const parts=s.name.split(' ');
    if(parts.length>1){ctx.fillText(parts[0],0,-fs*0.6);ctx.fillText(parts.slice(1).join(' '),0,fs*0.6);}
    else ctx.fillText(s.name,0,0);
    ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetY=0;
    ctx.restore();
  });
  // outer glow ring
  ctx.beginPath();ctx.arc(CX,CY,R+7,0,Math.PI*2);ctx.strokeStyle='rgba(200,168,75,.1)';ctx.lineWidth=1;ctx.stroke();
  // center
  ctx.beginPath();ctx.arc(CX,CY,IR,0,Math.PI*2);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--bg').trim()||'#1a3a2a';ctx.fill();
  ctx.strokeStyle='rgba(200,168,75,.45)';ctx.lineWidth=1.5;ctx.stroke();
  // center text
  const sel=rodaSelIdx>=0?slices[rodaSelIdx]:null;
  const lbl=document.getElementById('rodaCenter');
  if(lbl){lbl.querySelector('.roda-center-label').textContent=sel?sel.name:'Toque\num setor';}
}

function getRodaIdx(mx,my){
  const cv=document.getElementById('rodaCanvas');
  if(!cv)return-1;
  const CX=170,CY=170,R=162,IR=38;
  const dx=mx-CX,dy=my-CY,d=Math.sqrt(dx*dx+dy*dy);
  if(d<IR||d>R+8)return-1;
  let a=Math.atan2(dy,dx)+Math.PI/2; if(a<0)a+=2*Math.PI; if(a>=2*Math.PI)a-=2*Math.PI;
  const n=RODA_DATA[rodaActiveLayer].length;
  return Math.floor(a/(2*Math.PI/n))%n;
}

function initRodaEvents(){
  const cv=document.getElementById('rodaCanvas');
  if(!cv||cv._hasEvents)return; cv._hasEvents=true;
  cv.addEventListener('mousemove',e=>{ const r=cv.getBoundingClientRect(); rodaHovIdx=getRodaIdx(e.clientX-r.left,e.clientY-r.top); cv.style.cursor=rodaHovIdx>=0?'pointer':'default'; drawRoda(); });
  cv.addEventListener('mouseleave',()=>{ rodaHovIdx=-1; drawRoda(); });
  cv.addEventListener('click',e=>{ const r=cv.getBoundingClientRect(); const i=getRodaIdx(e.clientX-r.left,e.clientY-r.top); if(i>=0){rodaSelIdx=i===rodaSelIdx?-1:i; drawRoda(); renderRodaPanel(i>=0?RODA_DATA[rodaActiveLayer][i]:null);} });
  cv.addEventListener('touchstart',e=>{ e.preventDefault(); const t=e.touches[0],r=cv.getBoundingClientRect(); const i=getRodaIdx(t.clientX-r.left,t.clientY-r.top); if(i>=0){rodaSelIdx=i===rodaSelIdx?-1:i; drawRoda(); renderRodaPanel(i>=0?RODA_DATA[rodaActiveLayer][i]:null);} },{passive:false});
}

// override initRoda to attach events after draw
const _origInitRoda=window.initRoda;
window.initRoda=function(){
  const lay=document.getElementById('rodaLayers'); if(!lay)return;
  lay.innerHTML='';
  RODA_LAYERS.forEach(l=>{
    const b=document.createElement('button');
    b.className='roda-layer-btn'+(rodaActiveLayer===l.id?' on':'');
    b.textContent=l.label;
    b.onclick=()=>{ rodaActiveLayer=l.id; rodaSelIdx=-1; window.initRoda(); renderRodaPanel(null); };
    lay.appendChild(b);
  });
  rodaHovIdx=-1; drawRoda(); initRodaEvents();
};

function _rodaPrepSpans(prep){
  const s='font-size:.72rem;padding:3px 10px;background:rgba(255,255,255,.04);border:0.5px solid var(--faint);border-radius:6px;color:var(--muted);display:inline-flex;align-items:center;gap:5px';
  return `<span style="${s}">${svgIcon('thermometer')} ${esc(prep.temp)}</span><span style="${s}">${_clockIcon()} ${esc(prep.tempo)}</span><span style="${s}">${svgIcon('spoon')} ${esc(prep.dose)}</span><span style="${s}">${svgIcon('calendar')} ${esc(prep.freq)}</span>`;
}
function _clockIcon(){return '<svg class="ui-ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline-block;vertical-align:-.15em"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';}

function calcRodaComboPrep(names){
  const herbs=names.map(n=>HERBS.find(h=>h.n===n)).filter(Boolean);
  const temps=herbs.map(h=>parseInt(String(h.temp).replace(/[^\d]/g,''))).filter(n=>n>0);
  const times=herbs.map(h=>parseInt(h.tempo)).filter(n=>n>0);
  const minTemp=temps.length?Math.min(...temps):90;
  const maxTime=times.length?Math.max(...times):8;
  const dose=names.length>1?`1 col de cada / 250ml`:(herbs[0]?.dose||'1-2 col / 250ml');
  const freq=herbs[0]?.freq||'2-3x ao dia';
  return {temp:`${minTemp}°C`,tempo:`${maxTime} min`,dose,freq};
}

function toggleRodaHerb(name){
  if(!window._rodaHerbSelection)window._rodaHerbSelection=new Set();
  if(_rodaHerbSelection.has(name))_rodaHerbSelection.delete(name);
  else _rodaHerbSelection.add(name);
  document.querySelectorAll('#rodaPanel .roda-herb-item').forEach(el=>{
    const sel=_rodaHerbSelection.has(el.dataset.herb);
    el.classList.toggle('selected',sel);
    const icon=el.querySelector('.roda-herb-sel-icon');
    if(icon)icon.textContent=sel?'✓':'+';
  });
  const prep=_rodaHerbSelection.size>0?calcRodaComboPrep([..._rodaHerbSelection]):window._rodaCurrentSlice?.prep;
  if(prep){
    const ps=document.getElementById('rodaPrepSection');
    if(ps)ps.innerHTML=_rodaPrepSpans(prep);
    const lbl=document.getElementById('rodaPrepLabel');
    if(lbl)lbl.textContent=_rodaHerbSelection.size>0?'Preparo da combinação selecionada':'Preparo';
  }
}

function renderRodaPanel(slice){
  const p=document.getElementById('rodaPanel');
  if(!slice){p.innerHTML='<div class="roda-empty"><div style="opacity:.3;margin-bottom:.75rem;color:var(--gold2)">'+svgIcon('tea',32)+'</div><div>Selecione um setor da roda para ver as ervas recomendadas</div></div>';return;}
  window._rodaCurrentSlice=slice;
  window._rodaHerbSelection=new Set();
  const colDot=RODA_COLORS_MAP[rodaActiveLayer][RODA_DATA[rodaActiveLayer].indexOf(slice)]||'#c8a84b';
  p.innerHTML=`<div class="roda-result">
    <div class="roda-result-header">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:10px;height:10px;border-radius:50%;background:${colDot};flex-shrink:0"></div>
        <div class="roda-result-name">${slice.name}</div>
      </div>
    </div>
    <div style="font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);margin-bottom:.5rem">Ervas recomendadas <span style="opacity:.5;font-style:italic;text-transform:none;letter-spacing:0">— toque para selecionar</span></div>
    ${slice.herbs.map(h=>{
      const match=HERBS.find(x=>x.n===h.n);
      const img=match&&match.img;
      const visual=img
        ? `<img class="roda-herb-img" src="${img}" data-responsive="${img}" alt="${esc(h.n)}" loading="lazy" decoding="async" onerror="this.outerHTML='<div class=\\'roda-herb-icon\\'>${h.icon}</div>'">`
        : `<div class="roda-herb-icon">${h.icon}</div>`;
      return `
      <div class="roda-herb-item" data-herb="${esc(h.n)}" onclick="toggleRodaHerb('${esc(h.n)}')">
        ${visual}
        <div style="flex:1"><div class="roda-herb-name">${esc(h.n)}</div><div class="roda-herb-ef">${esc(h.ef)}</div></div>
        <span class="roda-herb-sel-icon">+</span>
      </div>`;
    }).join('')}
    <div class="roda-combo">
      <div class="roda-combo-title">Combinações sugeridas</div>
      ${slice.combo.map(c=>`<span class="roda-combo-chip">${svgIcon('tea')} ${esc(c)}</span>`).join('')}
    </div>
    <div class="roda-prep">
      <div id="rodaPrepLabel" class="roda-combo-title" style="margin-bottom:.4rem">Preparo</div>
      <div id="rodaPrepSection" style="display:flex;flex-wrap:wrap;gap:6px">${_rodaPrepSpans(slice.prep)}</div>
    </div>
    <div style="display:flex;gap:8px;margin-top:.75rem">
      <button class="roda-start-btn" style="flex:1" onclick="openTimerFromRoda(window._rodaCurrentSlice)">⏱ Preparar agora</button>
      <button class="roda-start-btn" style="flex:1;background:rgba(255,255,255,.04);border-color:var(--faint)" onclick="sendRodaToBlend()">＋ Blend</button>
    </div>
    ${(rodaActiveLayer==='sintoma'||rodaActiveLayer==='sistema')?`
    <div class="roda-disclaimer" role="note">
      As ervas do Ervatório são curadoria botânica para o bem-estar e o prazer sensorial. Elas não substituem medicamentos nem orientação médica. Em caso de dúvidas, sintomas ou condições de saúde, consulte um profissional de saúde.
    </div>`:''}
  </div>`;
}

function findHerbAndOpen(name){
  const h=HERBS.find(x=>x.n===name||name.includes(x.n));
  if(h) openHerbModal(h.id);
}

function sendRodaToBlend(){
  const slice=window._rodaCurrentSlice;
  if(!slice) return;
  const sel=window._rodaHerbSelection&&_rodaHerbSelection.size>0;
  const names=sel?[..._rodaHerbSelection]:slice.herbs.map(h=>h.n||h);
  const ids=names.map(n=>{
    const h=HERBS.find(x=>x.n===n||(n&&n.includes&&n.includes(x.n)));
    return h?h.id:null;
  }).filter(Boolean);
  ids.forEach(id=>{ if(!blendTray.includes(id)) blendTray.push(id); });
  localStorage.setItem('erb_tray',JSON.stringify(blendTray));
  renderTray();
  toastLink(`${ids.length} erva${ids.length!==1?'s':''} adicionada${ids.length!==1?'s':''} ao blend`,'Ver blend →',()=>{ goPage('blends'); if(typeof switchBlendTab==='function') switchBlendTab('assistente'); });
}

function openTimerFromRoda(slice){
  const sel=window._rodaHerbSelection&&_rodaHerbSelection.size>0;
  const names=sel?[..._rodaHerbSelection]:null;
  const prep=sel?calcRodaComboPrep(names):slice.prep;
  const title=sel?names.join(' + '):slice.name;
  const mins=parseInt(prep.tempo)||8;
  const herbDesc=sel?`${names.join(', ')} — ${prep.dose}`:`${prep.dose}`;
  const steps=[
    {title:`Aqueça a água`,desc:`Ferva e deixe esfriar até ${prep.temp}. Nunca use água fervendo em ervas delicadas.`,duration:0},
    {title:`Adicione as ervas`,desc:`${herbDesc}. Coloque na infusora ou diretamente na xícara.`,duration:0},
    {title:`Infusão`,desc:`Tampa a xícara para não perder os óleos essenciais. Aguarde ${prep.tempo}.`,duration:mins*60},
    {title:`Coe e aproveite`,desc:`Coe, adicione mel ou limão se desejar. Beba morno. Frequência: ${prep.freq}.`,duration:0},
  ];
  launchTimer(title, steps);
}

// ════════════════════════════════════════
// ── PERFIL ──
// ════════════════════════════════════════
// Duas naturezas de dado, dois lugares (handoff 14/09, PR 08):
//
//   • dados comuns e preferências (nome, objetivos, sabores, momentos):
//     `perfilState`, em localStorage (`erb_perfil`) e em user_preferences
//     quando há conta. Nada aqui é sensível.
//   • saúde e restrições: `saudeState`, SÓ EM MEMÓRIA, carregado do servidor
//     (tabela perfil_saude, RLS do dono) quando há conta e consentimento.
//     Nunca vai para localStorage, nunca para o cache do Service Worker
//     (a API do Supabase é outra origem; o SW não a cacheia).
//
// Condição de saúde é dado sensível (LGPD art. 5º II); tratar exige
// consentimento específico e destacado (art. 11 I). O checkbox do Perfil é
// esse consentimento; retirá-lo apaga a linha no servidor.
const PERFIL_OBJ_OPTS=['Melhorar sono','Reduzir ansiedade','Mais energia','Focar mais','Emagrecer','Digestão','Imunidade','Desintoxicar','Beleza da pele'];
const PERFIL_SABOR_OPTS=['Doce','Suave','Cítrico','Amargo','Picante','Floral','Mentolado'];
const PERFIL_MOMENTO_OPTS=['Ao acordar','Manhã','Tarde','Noite','Antes de dormir','Pós-refeição'];

// Lista fechada: espelho de `condicoes_de_saude_conhecidas()` no banco
// (migration 20260915120000). `avoid` são os prefixos dos valores de `avoid`
// das fichas que cada condição bloqueia. Condição nova entra nos dois lugares.
const SAUDE_CONDICOES=[
  {id:'gestante',       label:'perfil.cond_gestante',       avoid:['gestantes']},
  {id:'amamentando',    label:'perfil.cond_amamentando',    avoid:['amamentação','lactantes']},
  {id:'hipertensao',    label:'perfil.cond_hipertensao',    avoid:['hipertensos']},
  {id:'anticoagulante', label:'perfil.cond_anticoagulante', avoid:['anticoagulantes']},
  {id:'crianca',        label:'perfil.cond_crianca',        avoid:['crianças']},
  {id:'diabetes',       label:'perfil.cond_diabetes',       avoid:[]},
  {id:'asteraceas',     label:'perfil.cond_asteraceas',     avoid:['alergia a asteráceas']},
];

let perfilState = safeLoad('erb_perfil', {nome:"",objetivos:[],sabores:[],momentos:[]});
// Limpeza de aparelho: versões anteriores guardavam `saude` e `restricoes`
// aqui. Some na primeira carga e não volta.
(function(){
  if(perfilState && (Object.prototype.hasOwnProperty.call(perfilState,'saude') || Object.prototype.hasOwnProperty.call(perfilState,'restricoes'))){
    delete perfilState.saude; delete perfilState.restricoes;
    try { localStorage.setItem('erb_perfil', JSON.stringify(perfilState)); } catch(e){}
  }
})();

let saudeState = { carregado:false, consentido:false, condicoes:[], existente:false };
function resetSaudeState(){ saudeState = { carregado:false, consentido:false, condicoes:[], existente:false }; }

// O que a recomendação pode usar: só com consentimento dado.
function saudeCondicoesAtivas(){ return saudeState.consentido ? saudeState.condicoes.slice() : []; }

// Barreira: a erva tem `avoid` que bate com alguma condição informada?
// Usada pelo Perfil e pelo assistente de blends; o motor único é o PR 05.
function ervaContraindicada(h, condicoes){
  if(!h || !condicoes || !condicoes.length) return false;
  const avoid=(h.avoid||[]).map(a=>String(a).toLowerCase());
  return condicoes.some(c=>{
    const def=SAUDE_CONDICOES.find(x=>x.id===c);
    return !!def && def.avoid.some(a=>avoid.some(v=>v===a || v.indexOf(a+' ')===0 || v.indexOf(a+' (')===0));
  });
}
function saudeLabel(id){ const def=SAUDE_CONDICOES.find(x=>x.id===id); return def ? navT(def.label) : id; }

function perfilLogado(){ return !!(window.ervaria && ervaria.user); }

// ============================================================
// DIÁRIO DE INFUSÕES (handoff, PR 08b) — erva + horário + sensação
// ============================================================
// Atrás do interruptor `diario` (flagLigada): desligado, a tela avisa e o
// banco recusa registro novo (policy). O diário é da conta: `diarioState`
// vive só em memória, carregado do servidor a cada sessão — nada no
// localStorage. Sensação é lista FECHADA, espelho de
// `sensacoes_conhecidas()` na migration 20260916120000. Sem texto livre:
// campo aberto viraria o lugar onde dado de saúde entra sem consentimento.
const DIARIO_SENSACOES = ['relaxei','dormi_bem','energia','foco','digestao','sem_efeito','nao_gostei'];
let diarioState = { carregado:false, itens:[] };
let diarioSensacaoEscolhida = null;
function resetDiarioState(){ diarioState = { carregado:false, itens:[] }; diarioSensacaoEscolhida = null; }
function diarioT(key){ return (typeof t === 'function') ? t(key) : key; }
function diarioNorm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim(); }

// Catálogo: as ervas de HERBS (id numérico como texto — o mesmo de
// user_favorites.tea_id) mais as fichas editoriais sem erva em HERBS (slug).
// Um id por erva; o banco confere o formato (^[a-z0-9_-]{1,64}$).
function diarioCatalogo(){
  if(window._diarioCatalogo) return window._diarioCatalogo;
  var lista=[], vistos={};
  var idOk=function(id){ return /^[a-z0-9_-]{1,64}$/.test(id); };
  (typeof HERBS!=='undefined' ? HERBS : []).forEach(function(h){
    var k=diarioNorm(h.n); if(!k || vistos[k] || !idOk(String(h.id))) return;
    vistos[k]=1; lista.push({ id:String(h.id), nome:h.n });
  });
  if(typeof FICHAS_ANCORA!=='undefined'){
    Object.keys(FICHAS_ANCORA).forEach(function(key){
      var f=FICHAS_ANCORA[key]||{}; var slug=f.slug||key; var k=diarioNorm(f.nome_popular);
      if(!k || vistos[k] || !idOk(slug)) return;
      vistos[k]=1; lista.push({ id:slug, nome:f.nome_popular });
    });
  }
  lista.sort(function(a,b){ return a.nome.localeCompare(b.nome, 'pt'); });
  window._diarioCatalogo=lista;
  return lista;
}
function diarioErvaPorNome(nome){
  var k=diarioNorm(nome);
  return k ? (diarioCatalogo().filter(function(e){ return diarioNorm(e.nome)===k; })[0] || null) : null;
}
function diarioAgoraLocal(){
  var d=new Date(); var p=function(n){ return (n<10?'0':'')+n; };
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes());
}
function diarioLocale(){
  try { return (typeof LANGS!=='undefined' && typeof getLang==='function' && LANGS[getLang()]) ? LANGS[getLang()].locale : 'pt-BR'; } catch(e){ return 'pt-BR'; }
}

function renderDiario(){
  var off=document.getElementById('diarioOff'), guest=document.getElementById('diarioGuest'),
      form=document.getElementById('diarioForm'), lista=document.getElementById('diarioLista');
  if(!off||!guest||!form||!lista) return;
  var ligado=flagLigada('diario'), logado=perfilLogado();
  off.hidden=ligado; guest.hidden=!ligado||logado;
  form.hidden=!(ligado&&logado); lista.hidden=!(ligado&&logado);
  if(!ligado||!logado) return;
  var dl=document.getElementById('diarioErvasList');
  if(dl && !dl.children.length) dl.innerHTML=diarioCatalogo().map(function(e){ return '<option value="'+esc(e.nome)+'"></option>'; }).join('');
  var quando=document.getElementById('diarioQuando');
  if(quando && !quando.value) quando.value=diarioAgoraLocal();
  renderDiarioSensacoes();
  renderDiarioLista();
  if(!diarioState.carregado && typeof ervaria!=='undefined' && typeof ervaria.diarioListar==='function'){
    ervaria.diarioListar().then(function(itens){
      diarioState.itens=Array.isArray(itens)?itens:[]; diarioState.carregado=true; renderDiarioLista();
    }).catch(function(){ toast(diarioT('diario.error')); });
  }
}

function renderDiarioSensacoes(){
  var el=document.getElementById('diarioSensacoes'); if(!el) return;
  el.innerHTML='';
  DIARIO_SENSACOES.forEach(function(s){
    var b=document.createElement('button'); b.type='button';
    var on=diarioSensacaoEscolhida===s;
    b.className='perfil-chip'+(on?' on':''); b.setAttribute('aria-pressed', on?'true':'false');
    b.dataset.sensacao=s; b.textContent=diarioT('diario.s_'+s);
    b.onclick=function(){ diarioSensacaoEscolhida=(diarioSensacaoEscolhida===s)?null:s; renderDiarioSensacoes(); };
    el.appendChild(b);
  });
}

function diarioOrdenar(){ diarioState.itens.sort(function(a,b){ return String(b.tomado_em).localeCompare(String(a.tomado_em)); }); }

function registrarInfusao(){
  if(!perfilLogado()||!flagLigada('diario')) return;
  var input=document.getElementById('diarioErva'), quando=document.getElementById('diarioQuando'), btn=document.getElementById('diarioAdd');
  var erva=diarioErvaPorNome(input.value);
  if(!erva){ input.setAttribute('aria-invalid','true'); input.focus(); toast(diarioT('diario.erva_unknown')); return; }
  input.removeAttribute('aria-invalid');
  var d=quando && quando.value ? new Date(quando.value) : new Date();
  if(isNaN(d.getTime())) d=new Date();
  var reg={ erva_id:erva.id, erva_nome:erva.nome, tomado_em:d.toISOString(), sensacao:diarioSensacaoEscolhida };
  if(btn) btn.disabled=true;
  ervaria.diarioRegistrar(reg).then(function(row){
    diarioState.itens.unshift(row||reg); diarioOrdenar();
    input.value=''; diarioSensacaoEscolhida=null; if(quando) quando.value=diarioAgoraLocal();
    renderDiarioSensacoes(); renderDiarioLista(); toast(diarioT('diario.saved'));
  }).catch(function(){ toast(diarioT('diario.error')); }).then(function(){ if(btn) btn.disabled=false; });
}

function renderDiarioLista(){
  var el=document.getElementById('diarioLista'); if(!el) return;
  if(!diarioState.carregado){ el.innerHTML='<p class="perfil-hint">'+esc(diarioT('diario.loading'))+'</p>'; return; }
  if(!diarioState.itens.length){ el.innerHTML='<p class="perfil-hint" id="diarioVazio">'+esc(diarioT('diario.empty'))+'</p>'; return; }
  var loc=diarioLocale(), grupos={}, ordem=[];
  diarioState.itens.forEach(function(it){
    var d=new Date(it.tomado_em); var k=d.toDateString();
    if(!grupos[k]){ grupos[k]={ data:d, itens:[] }; ordem.push(k); }
    grupos[k].itens.push(it);
  });
  el.innerHTML=ordem.map(function(k){
    var g=grupos[k];
    return '<section class="diario-dia"><h3 class="diario-dia-titulo">'+esc(g.data.toLocaleDateString(loc,{weekday:'long',day:'numeric',month:'long'}))+'</h3>'+
      g.itens.map(function(it){
        var hora=new Date(it.tomado_em).toLocaleTimeString(loc,{hour:'2-digit',minute:'2-digit'});
        var id=String(it.id||'');
        return '<div class="diario-item" data-id="'+esc(id)+'">'+
          '<span class="diario-hora">'+esc(hora)+'</span>'+
          '<span class="diario-erva">'+esc(it.erva_nome||'')+'</span>'+
          '<select class="diario-sensacao" aria-label="'+esc(diarioT('diario.sensacao_label'))+': '+esc(it.erva_nome||'')+'" onchange="alterarSensacaoInfusao(this.closest(\'.diario-item\').dataset.id,this.value)">'+
            '<option value="">'+esc(diarioT('diario.sensacao_none'))+'</option>'+
            DIARIO_SENSACOES.map(function(s){ return '<option value="'+s+'"'+(it.sensacao===s?' selected':'')+'>'+esc(diarioT('diario.s_'+s))+'</option>'; }).join('')+
          '</select>'+
          '<button type="button" class="diario-apagar" aria-label="'+esc(diarioT('diario.delete'))+': '+esc(it.erva_nome||'')+'" onclick="apagarInfusao(this.closest(\'.diario-item\').dataset.id)">'+svgIcon('trash',16)+'</button>'+
        '</div>';
      }).join('')+'</section>';
  }).join('');
}

function alterarSensacaoInfusao(id, s){
  if(!id) return;
  var novo=(DIARIO_SENSACOES.indexOf(s)!==-1)?s:null;
  var it=diarioState.itens.filter(function(x){ return String(x.id)===String(id); })[0];
  ervaria.diarioAtualizarSensacao(id, novo).then(function(){ if(it) it.sensacao=novo; })
    .catch(function(){ toast(diarioT('diario.error')); renderDiarioLista(); });
}
function apagarInfusao(id){
  if(!id) return;
  ervaria.diarioApagar(id).then(function(){
    diarioState.itens=diarioState.itens.filter(function(x){ return String(x.id)!==String(id); });
    renderDiarioLista(); toast(diarioT('diario.deleted'));
  }).catch(function(){ toast(diarioT('diario.error')); });
}


function renderPerfil(){
  const nome=document.getElementById('perfilNome'); if(!nome) return;
  nome.value=perfilState.nome||'';
  const email=document.getElementById('perfilEmail'), hint=document.getElementById('perfilEmailHint');
  const logado=perfilLogado();
  if(email) email.value = logado ? (ervaria.user.email||'') : '';
  if(hint) hint.hidden = logado;
  renderChipGroup('perfilObjetivos',PERFIL_OBJ_OPTS,'objetivos');
  renderChipGroup('perfilSabores',PERFIL_SABOR_OPTS,'sabores');
  renderChipGroup('perfilMomentos',PERFIL_MOMENTO_OPTS,'momentos');
  renderPerfilSaude();
  renderPerfilDados();
  renderPerfilRecomendacoes();
  if(logado && !saudeState.carregado && typeof ervaria.saudeCarregar==='function'){
    ervaria.saudeCarregar().then(function(){ renderPerfilSaude(); renderPerfilRecomendacoes(); });
  }
}

function renderChipGroup(containerId, opts, key){
  const el=document.getElementById(containerId); if(!el) return;
  el.innerHTML='';
  opts.forEach(o=>{
    const b=document.createElement('button');
    b.type='button';
    const on=!!(perfilState[key]&&perfilState[key].includes(o));
    b.className='perfil-chip'+(on?' on':'');
    b.setAttribute('aria-pressed', on?'true':'false');
    b.textContent=o;
    b.onclick=()=>{
      if(!perfilState[key])perfilState[key]=[];
      if(perfilState[key].includes(o)) perfilState[key]=perfilState[key].filter(x=>x!==o);
      else perfilState[key].push(o);
      const nowOn=perfilState[key].includes(o);
      b.classList.toggle('on', nowOn); b.setAttribute('aria-pressed', nowOn?'true':'false');
      renderPerfilRecomendacoes();
    };
    el.appendChild(b);
  });
}

// Bloco de saúde: sem conta, explica e oferece entrar; com conta, o
// consentimento libera os chips. Chips desabilitados não são "apagados":
// o que estiver marcado só é gravado se o consentimento estiver dado.
function renderPerfilSaude(){
  const guest=document.getElementById('perfilSaudeGuest'), form=document.getElementById('perfilSaudeForm');
  if(!guest||!form) return;
  const logado=perfilLogado();
  guest.hidden=logado; form.hidden=!logado;
  if(!logado) return;
  const consent=document.getElementById('perfilConsent');
  consent.checked=saudeState.consentido;
  consent.onchange=()=>{ saudeState.consentido=consent.checked; renderPerfilSaude(); renderPerfilRecomendacoes(); };
  const el=document.getElementById('perfilCondicoes'); el.innerHTML='';
  SAUDE_CONDICOES.forEach(c=>{
    const b=document.createElement('button');
    b.type='button';
    const on=saudeState.condicoes.includes(c.id);
    b.className='perfil-chip'+(on?' on':'');
    b.disabled=!saudeState.consentido;
    b.setAttribute('aria-pressed', on?'true':'false');
    b.dataset.condicao=c.id;
    b.textContent=saudeLabel(c.id);
    b.onclick=()=>{
      if(saudeState.condicoes.includes(c.id)) saudeState.condicoes=saudeState.condicoes.filter(x=>x!==c.id);
      else saudeState.condicoes.push(c.id);
      const nowOn=saudeState.condicoes.includes(c.id);
      b.classList.toggle('on', nowOn); b.setAttribute('aria-pressed', nowOn?'true':'false');
      renderPerfilRecomendacoes();
    };
    el.appendChild(b);
  });
  const w=document.getElementById('perfilSaudeWithdraw'); if(w) w.hidden=!saudeState.existente;
}

function renderPerfilDados(){
  const g=document.getElementById('perfilDadosGuest'), a=document.getElementById('perfilDadosActions');
  if(!g||!a) return;
  const logado=perfilLogado();
  g.hidden=logado; a.hidden=!logado;
}

function savePerfil(){
  perfilState.nome=document.getElementById('perfilNome').value;
  // Só o que não é sensível vai para o aparelho.
  const comum={nome:perfilState.nome,objetivos:perfilState.objetivos||[],sabores:perfilState.sabores||[],momentos:perfilState.momentos||[]};
  perfilState=comum;
  localStorage.setItem('erb_perfil',JSON.stringify(comum));
  if(typeof ervaria!=='undefined' && ervaria.pushPerfil) ervaria.pushPerfil(comum);
  toast(navT('perfil.save_btn')+' ✓');
  renderPerfilRecomendacoes();
  if(!perfilLogado() || typeof ervaria.saudeSalvar!=='function') return;
  // Saúde: com consentimento grava (mesmo lista vazia — o consentimento em si
  // é um fato); sem consentimento e com linha existente, apaga.
  if(saudeState.consentido){
    ervaria.saudeSalvar(saudeState.condicoes).then(function(){ saudeState.existente=true; renderPerfilSaude(); toast(navT('perfil.health_saved')); })
      .catch(function(){ toast(navT('perfil.health_error')); });
  } else if(saudeState.existente){
    retirarConsentimentoSaude();
  }
}

function retirarConsentimentoSaude(){
  if(!perfilLogado() || typeof ervaria.saudeApagar!=='function') return;
  ervaria.saudeApagar().then(function(){
    saudeState.consentido=false; saudeState.condicoes=[]; saudeState.existente=false;
    renderPerfilSaude(); renderPerfilRecomendacoes(); toast(navT('perfil.health_deleted'));
  }).catch(function(){ toast(navT('perfil.health_error')); });
}

function renderPerfilRecomendacoes(){
  const el=document.getElementById('perfilRecomendacoes');
  if(!el)return;
  const obj=perfilState.objetivos||[];
  const saude=saudeCondicoesAtivas();
  const momentos=perfilState.momentos||[];
  if(!obj.length&&!saude.length){el.innerHTML='';return;}

  // Smart recs based on profile
  let recs=[];
  if(obj.includes('Melhorar sono')||obj.includes('Reduzir ansiedade')) recs.push({name:'Blend da Noite',ids:[1,3,4],herbs:'Camomila + Maracujá + Melissa',why:'Baseado nos seus objetivos de sono e ansiedade',color:'#1e3d5c'});
  if(obj.includes('Mais energia')||obj.includes('Focar mais')) recs.push({name:'Blend do Foco',ids:[6,8,22],herbs:'Chá Verde + Alecrim + Ginkgo',why:'Para energia e concentração ao longo do dia',color:'#3a2d6b'});
  if(obj.includes('Digestão')) recs.push({name:'Digestivo Diário',ids:[14,9,10],herbs:'Boldo + Hortelã + Erva-doce',why:'Apoio à sua digestão pós-refeição',color:'#5a3a1a'});
  if(obj.includes('Emagrecer')) recs.push({name:'Blend Metabólico',ids:[6,21,7],herbs:'Chá Verde + Carqueja + Hibisco',why:'Termogênico e sacietogênico natural',color:'#2d5a2d'});
  if(obj.includes('Imunidade')) recs.push({name:'Blend Imunidade',ids:[12,5],herbs:'Equinácea + Cúrcuma + Gengibre',why:'Para fortalecer suas defesas',color:'#2d4a3a'});
  if(saude.includes('hipertensao')) recs.push({name:'Hipotensor Suave',ids:[7,4,17],herbs:'Hibisco + Melissa + Capim-Limão',why:'Sem estimulantes fortes; converse com quem acompanha sua pressão',color:'#6b2d3a'});
  if(saude.includes('gestante')) recs.push({name:'Blend Seguro Gestação',ids:[1,19,17],herbs:'Camomila + Erva Cidreira + Capim-Limão',why:'Ervas com uso tradicional seguro na gestação',color:'#2d5a4a'});

  // Barreira: uma recomendação com ingrediente contraindicado para a pessoa
  // não aparece — nem com aviso. É o que o anel de segurança da Roda já fazia
  // como filtro opcional; aqui é regra.
  if(saude.length){
    recs=recs.filter(r=>!(r.ids||[]).some(id=>ervaContraindicada(HERBS.find(h=>h.id===id), saude)));
  }

  const warnings=[];
  if(saude.includes('hipertensao')) warnings.push('Evite guaraná e estimulantes fortes.');
  if(saude.includes('gestante')) warnings.push('Evite arruda, alfazema em doses altas e valeriana.');
  if(saude.includes('amamentando')) warnings.push('Na amamentação, prefira ervas de uso tradicional consolidado e doses baixas.');
  if(saude.includes('anticoagulante')) warnings.push('Ginkgo, cúrcuma e imburana interagem com anticoagulantes.');
  if(saude.includes('diabetes')) warnings.push('Prefira ervas sem açúcar. Pata de vaca e canela são aliadas.');
  if(saude.includes('asteraceas')) warnings.push('Camomila, calêndula e equinácea são asteráceas.');
  if(saude.includes('crianca')) warnings.push('Para crianças, doses menores e sem estimulantes; confirme com o pediatra.');

  const quem=saude.map(saudeLabel).join(', ');
  const nome=perfilState.nome?`, ${esc(perfilState.nome)}`:'';
  el.innerHTML=`
    <div class="perfil-rec-title">Recomendações para você${nome}</div>
    ${saude.length?`<div class="perfil-rec-saude">${esc(navT('encontrar.safety').replace('{restrição}', quem).replace('{restriction}', quem))}</div>`:''}
    ${warnings.length?`<div class="warn-box" style="margin-bottom:1rem">${warnings.map(esc).join(' ')}</div>`:''}
    ${recs.map(r=>`
      <div class="perfil-rec-card">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:.4rem">
          <div style="width:8px;height:8px;border-radius:50%;background:${r.color}"></div>
          <div style="font-size:.88rem;font-weight:400;color:var(--cream)">${r.name}</div>
        </div>
        <div style="font-size:.82rem;color:var(--gold2);margin-bottom:3px;display:flex;align-items:center;gap:6px">${svgIcon('tea')} ${esc(r.herbs)}</div>
        <div style="font-size:.75rem;color:var(--muted)">${r.why}</div>
      </div>`).join('')}
    ${momentos.length?`<div style="margin-top:.75rem;font-size:.75rem;color:var(--muted)">Momentos favoritos: ${momentos.map(esc).join(', ')}</div>`:''}
    <p class="perfil-rec-aviso">${esc(navT('health.disclaimer'))}</p>`;
}

// ══��═════════════════════════════════════
// ── TIMER DE PREPARO ──
// ════════════════════════════════════════
let timerState={steps:[],current:0,remaining:0,total:0,running:false,interval:null,herbName:''};

function openTimer(herbId){
  const h=HERBS.find(x=>x.id===herbId);
  if(!h)return;
  const mins=parseInt(h.tempo)||8;
  const steps=[
    {title:'Aqueça a água',      desc:`Ferva e deixe esfriar até ${h.temp}. Água muito quente destrói compostos ativos.`,duration:0},
    {title:'Meça as ervas',      desc:`Use ${h.dose}. Ervas frescas: prefira ao seco. Infusora limpa.`,duration:0},
    {title:'Infusão',            desc:`Tampa bem a xícara para não perder os óleos essenciais. Aguarde exatamente ${h.tempo}.`,duration:mins*60},
    {title:'Coe e finalize',     desc:`Retire as ervas. Adicione mel ou limão se quiser. Ideal: ${h.freq}.`,duration:0},
  ];
  document.getElementById('herbModal').classList.remove('on');
  launchTimer(h.n, steps);
}

function launchTimer(name, steps){
  timerState={steps,current:0,remaining:steps[0].duration,total:steps[0].duration,running:false,interval:null,herbName:name};
  document.getElementById('timerModal').classList.add('on');
  renderTimerStep();
}

function closeTimerModal(e){
  if(!e||e.target===document.getElementById('timerModal')){
    clearInterval(timerState.interval); timerState.running=false;
    document.getElementById('timerModal').classList.remove('on');
  }
}

function renderTimerStep(){
  const {steps,current,herbName}=timerState;
  const step=steps[current];
  const hasTimer=step.duration>0;
  const isLast=current===steps.length-1;
  const dots=steps.map((_,i)=>`<div class="timer-step-dot ${i<current?'done':i===current?'active':''}"></div>`).join('');

  document.getElementById('timerContent').innerHTML=`
    <div class="modal-handle"></div>
    <button class="modal-close" onclick="closeTimerModal()">✕</button>
    <div class="timer-wrap">
      <div style="font-size:.72rem;color:var(--muted);margin-bottom:.75rem;letter-spacing:.06em">${esc(herbName)}</div>
      <div class="timer-step-indicator">${dots}</div>
      <div style="font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.3rem">Passo ${current+1} de ${steps.length}</div>
      <div class="timer-step-title">${esc(step.title)}</div>
      <div class="timer-step-desc">${esc(step.desc)}</div>
      ${hasTimer?`
        <div class="timer-ring-wrap">
          <canvas id="timerRing" width="160" height="160"></canvas>
          <div class="timer-ring-time" id="timerDisplay">${formatTime(step.duration)}</div>
          <div class="timer-ring-label" id="timerLabel">aguardando</div>
        </div>
        <div class="timer-controls">
          <button class="timer-btn primary" id="timerPlayBtn" onclick="toggleTimer()">▶ Iniciar</button>
          <button class="timer-btn" onclick="resetTimer()">↺ Reset</button>
        </div>`:''}
      <button class="timer-next-btn" id="timerNextBtn" onclick="timerNext()" ${hasTimer&&timerState.remaining>0&&!timerState.running?'':''}>${isLast?'Concluído ✓':'Próximo →'}</button>
    </div>`;
  if(hasTimer) drawTimerRing(1);
}

function formatTime(s){ return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }

function drawTimerRing(progress){
  const cv=document.getElementById('timerRing'); if(!cv)return;
  const ctx=cv.getContext('2d'),CX=80,CY=80,R=68,LW=6;
  ctx.clearRect(0,0,160,160);
  // bg ring
  ctx.beginPath();ctx.arc(CX,CY,R,0,Math.PI*2);ctx.strokeStyle='rgba(200,168,75,.1)';ctx.lineWidth=LW;ctx.stroke();
  // progress ring
  const start=-Math.PI/2, end=start+(2*Math.PI*progress);
  ctx.beginPath();ctx.arc(CX,CY,R,start,end);
  ctx.strokeStyle=progress>0.2?'#c8a84b':'#e08060';ctx.lineWidth=LW;ctx.lineCap='round';ctx.stroke();
}

function toggleTimer(){
  const step=timerState.steps[timerState.current];
  if(!step.duration)return;
  if(timerState.running){
    clearInterval(timerState.interval); timerState.running=false;
    document.getElementById('timerPlayBtn').textContent='▶ Continuar';
    document.getElementById('timerLabel').textContent='pausado';
  } else {
    timerState.running=true;
    document.getElementById('timerPlayBtn').textContent='⏸ Pausar';
    document.getElementById('timerLabel').textContent='infusando...';
    timerState.interval=setInterval(()=>{
      timerState.remaining--;
      const prog=timerState.remaining/timerState.total;
      drawTimerRing(prog);
      const disp=document.getElementById('timerDisplay'); if(disp)disp.textContent=formatTime(timerState.remaining);
      if(timerState.remaining<=0){
        clearInterval(timerState.interval); timerState.running=false;
        const lbl=document.getElementById('timerLabel'); if(lbl)lbl.textContent='pronto!';
        const btn=document.getElementById('timerPlayBtn'); if(btn)btn.textContent='✓ Concluído';
        toast(`${timerState.herbName} — infusão concluída!`);
        drawTimerRing(0);
      }
    },1000);
  }
}

function resetTimer(){
  clearInterval(timerState.interval); timerState.running=false;
  timerState.remaining=timerState.steps[timerState.current].duration;
  timerState.total=timerState.remaining;
  renderTimerStep();
}

function timerNext(){
  clearInterval(timerState.interval); timerState.running=false;
  const {steps,current}=timerState;
  if(current>=steps.length-1){
    // Complete
    document.getElementById('timerContent').innerHTML=`
      <div class="modal-handle"></div>
      <button class="modal-close" onclick="closeTimerModal()">✕</button>
      <div class="timer-complete">
        <div class="timer-complete-icon" style="color:var(--gold2)">${svgIcon('tea',44)}</div>
        <div class="timer-complete-title">Chá pronto!</div>
        <div class="timer-complete-sub">Seu ${esc(timerState.herbName)} está preparado.<br>Beba com calma e aproveite os benefícios.</div>
        <button class="timer-next-btn" style="margin-top:1.5rem" onclick="closeTimerModal()">Fechar</button>
      </div>`;
    return;
  }
  timerState.current++;
  timerState.remaining=steps[timerState.current].duration;
  timerState.total=timerState.remaining;
  renderTimerStep();
}
// ── TIMER EMBUTIDO NA FICHA (PR 06) ─────────────────────────────
// O botão «Iniciar preparo · N min» abre uma contagem regressiva no lugar,
// sem modal. N vem da ficha (fichaResumo().minutos); quando a ficha não diz,
// o timer nasce em 8 min, avisa que é sugestão e deixa ajustar.
var fichaTimerState = { total:0, remaining:0, running:false, interval:null, nome:'', sugerido:false };
function fichaTimerToggle(btn, minutos, nome){
  var box=document.getElementById('fichaTimer'); if(!box) return;
  if(!box.hidden){ fichaTimerFechar(); return; }
  var min=Number(minutos)||0;
  clearInterval(fichaTimerState.interval);
  fichaTimerState={ total:(min||8)*60, remaining:(min||8)*60, running:false, interval:null, nome:nome||'', sugerido:!min };
  box.hidden=false;
  if(btn) btn.setAttribute('aria-expanded','true');
  fichaTimerRender();
  var play=document.getElementById('fichaTimerPlay'); if(play) play.focus();
}
function fichaTimerRender(){
  var box=document.getElementById('fichaTimer'); if(!box) return;
  var st=fichaTimerState;
  box.innerHTML='<div class="ficha-timer-box" role="group" aria-label="'+esc(navT('ficha.timer'))+'">'+
    '<div class="ficha-timer-time" id="fichaTimerDisplay" aria-live="off">'+formatTime(st.remaining)+'</div>'+
    '<div class="ficha-timer-label" id="fichaTimerLabel" aria-live="polite">'+esc(navT('ficha.timer_wait'))+'</div>'+
    '<div class="ficha-timer-ctl">'+
      '<button type="button" class="enc-btn" onclick="fichaTimerAjustar(-1)" aria-label="'+esc(navT('ficha.timer_less'))+'">−1 min</button>'+
      '<button type="button" class="enc-btn enc-btn-gold" id="fichaTimerPlay" onclick="fichaTimerPlay()">'+esc(navT('ficha.timer_play'))+'</button>'+
      '<button type="button" class="enc-btn" onclick="fichaTimerAjustar(1)" aria-label="'+esc(navT('ficha.timer_more'))+'">+1 min</button>'+
      '<button type="button" class="enc-btn" onclick="fichaTimerReset()">'+esc(navT('ficha.timer_reset'))+'</button>'+
    '</div>'+
    (st.sugerido?'<p class="ficha-timer-hint">'+esc(navT('ficha.timer_hint'))+'</p>':'')+
  '</div>';
}
function fichaTimerPlay(){
  var st=fichaTimerState, play=document.getElementById('fichaTimerPlay'), lbl=document.getElementById('fichaTimerLabel');
  if(st.running){
    clearInterval(st.interval); st.running=false;
    if(play) play.textContent=navT('ficha.timer_resume'); if(lbl) lbl.textContent=navT('ficha.timer_paused');
    return;
  }
  if(st.remaining<=0){ fichaTimerReset(); return; }
  st.running=true;
  if(play) play.textContent=navT('ficha.timer_pause'); if(lbl) lbl.textContent=navT('ficha.timer_brewing');
  st.interval=setInterval(function(){
    st.remaining--;
    var disp=document.getElementById('fichaTimerDisplay'); if(disp) disp.textContent=formatTime(Math.max(0,st.remaining));
    if(st.remaining<=0){
      clearInterval(st.interval); st.running=false;
      var l=document.getElementById('fichaTimerLabel'); if(l) l.textContent=navT('ficha.timer_done');
      var p=document.getElementById('fichaTimerPlay'); if(p) p.textContent=navT('ficha.timer_reset');
      toast(navT('ficha.timer_done'));
    }
  },1000);
}
function fichaTimerAjustar(delta){
  var st=fichaTimerState; if(st.running) return;
  st.total=Math.max(60, st.total+delta*60); st.remaining=st.total; st.sugerido=false;
  fichaTimerRender();
}
function fichaTimerReset(){
  var st=fichaTimerState; clearInterval(st.interval); st.running=false; st.remaining=st.total;
  fichaTimerRender();
}
function fichaTimerFechar(){
  var st=fichaTimerState; clearInterval(st.interval); st.running=false;
  var box=document.getElementById('fichaTimer'); if(box){ box.hidden=true; box.innerHTML=''; }
  var btn=document.querySelector('.ficha-btn-preparo[aria-expanded="true"]'); if(btn) btn.setAttribute('aria-expanded','false');
}

let toastTimer;
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.onclick=null; t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),2500); }
function toastLink(msg,linkLabel,cb){ const t=document.getElementById('toast'); t.innerHTML=`${esc(msg)} <span style="color:var(--gold2);text-decoration:underline;cursor:pointer">${esc(linkLabel)}</span>`; t.onclick=()=>{ t.classList.remove('show'); cb(); }; t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>{t.classList.remove('show');t.onclick=null;},3500); }

// ════════════════════════════════════════
// ── CONSTRUTOR DE BLEND ──
// ════════════════════════════════════════
const HERB_META = {
  1: {type:'flower',role:'heart',intensity:2,tempMin:80,tempMax:88,timeMin:5,timeMax:10,qty:'1 col. sopa',unit:'g',grams:2},
  2: {type:'root',  role:'base', intensity:4,tempMin:82,tempMax:90,timeMin:8,timeMax:15,qty:'1 col. sopa',unit:'g',grams:3},
  3: {type:'leaf',  role:'heart',intensity:2,tempMin:80,tempMax:88,timeMin:6,timeMax:10,qty:'1 col. sopa',unit:'g',grams:2},
  4: {type:'leaf',  role:'heart',intensity:2,tempMin:80,tempMax:88,timeMin:5,timeMax:8, qty:'1 col. sopa',unit:'g',grams:2},
  5: {type:'root',  role:'accent',intensity:4,tempMin:88,tempMax:98,timeMin:8,timeMax:15,qty:'3-4 fatias',unit:'fatias',grams:5},
  6: {type:'leaf',  role:'base', intensity:3,tempMin:70,tempMax:80,timeMin:2,timeMax:4, qty:'1 col. sopa',unit:'g',grams:2},
  7: {type:'flower',role:'heart',intensity:3,tempMin:85,tempMax:95,timeMin:6,timeMax:10,qty:'2 col. sopa',unit:'g',grams:3},
  8: {type:'leaf',  role:'accent',intensity:3,tempMin:85,tempMax:95,timeMin:4,timeMax:7, qty:'1 col. sopa',unit:'g',grams:2},
  9: {type:'leaf',  role:'heart',intensity:3,tempMin:80,tempMax:90,timeMin:4,timeMax:7, qty:'1 col. sopa',unit:'g',grams:2},
  10:{type:'seed',  role:'accent',intensity:2,tempMin:85,tempMax:95,timeMin:6,timeMax:10,qty:'1 col. sopa',unit:'g',grams:2},
  11:{type:'bark',  role:'accent',intensity:3,tempMin:90,tempMax:100,timeMin:8,timeMax:15,qty:'1 pau pequeno',unit:'pau',grams:3},
  12:{type:'root',  role:'accent',intensity:3,tempMin:88,tempMax:98,timeMin:8,timeMax:12,qty:'1 col. chá',unit:'g',grams:2},
  13:{type:'flower',role:'heart',intensity:2,tempMin:80,tempMax:88,timeMin:6,timeMax:10,qty:'1 col. sopa flores',unit:'g',grams:2},
  14:{type:'leaf',  role:'base', intensity:3,tempMin:85,tempMax:95,timeMin:4,timeMax:8, qty:'1 col. sopa',unit:'g',grams:2},
  15:{type:'leaf',  role:'base', intensity:3,tempMin:85,tempMax:95,timeMin:8,timeMax:12,qty:'1-2 col. sopa',unit:'g',grams:3},
  16:{type:'leaf',  role:'base', intensity:3,tempMin:88,tempMax:98,timeMin:8,timeMax:12,qty:'2 col. sopa',unit:'g',grams:3},
  17:{type:'leaf',  role:'heart',intensity:2,tempMin:85,tempMax:95,timeMin:6,timeMax:10,qty:'2 folhas frescas',unit:'folhas',grams:3},
  18:{type:'leaf',  role:'base', intensity:2,tempMin:82,tempMax:90,timeMin:8,timeMax:12,qty:'1-2 col. sopa',unit:'g',grams:2},
  19:{type:'leaf',  role:'heart',intensity:2,tempMin:82,tempMax:90,timeMin:5,timeMax:8, qty:'2 col. sopa',unit:'g',grams:3},
  20:{type:'leaf',  role:'base', intensity:2,tempMin:85,tempMax:92,timeMin:8,timeMax:12,qty:'1 col. sopa',unit:'g',grams:2},
  21:{type:'leaf',  role:'accent',intensity:4,tempMin:85,tempMax:95,timeMin:6,timeMax:10,qty:'1 col. sopa',unit:'g',grams:2},
  22:{type:'leaf',  role:'base', intensity:2,tempMin:85,tempMax:95,timeMin:8,timeMax:12,qty:'1 col. sopa',unit:'g',grams:2},
  23:{type:'flower',role:'accent',intensity:2,tempMin:85,tempMax:95,timeMin:4,timeMax:7, qty:'1-2 col. sopa',unit:'g',grams:2},
  24:{type:'flower',role:'heart',intensity:2,tempMin:82,tempMax:90,timeMin:6,timeMax:10,qty:'1-2 col. sopa',unit:'g',grams:2},
  25:{type:'leaf',  role:'base', intensity:2,tempMin:90,tempMax:100,timeMin:4,timeMax:7, qty:'1-2 col. sopa',unit:'g',grams:3},
  26:{type:'root',  role:'base', intensity:3,tempMin:85,tempMax:95,timeMin:8,timeMax:12,qty:'1 col. chá pó',unit:'g',grams:2},
  27:{type:'seed',  role:'accent',intensity:5,tempMin:78,tempMax:85,timeMin:4,timeMax:6, qty:'1/2 col. chá',unit:'g',grams:1},
  28:{type:'leaf',  role:'heart',intensity:3,tempMin:85,tempMax:95,timeMin:6,timeMax:10,qty:'1 col. sopa',unit:'g',grams:2},
};
const SYNERGIES=[
  {ids:[1,4],label:'Dupla calmante clássica',text:'Camomila + Melissa: apigenina e ácido rosmarínico atuam sinergicamente nos receptores GABA, amplificando o efeito sedativo suave.'},
  {ids:[1,3],label:'Sono profundo',text:'Camomila + Maracujá: ação complementar — camomila relaxa o corpo, maracujá acalma a mente ansiosa.'},
  {ids:[2,3],label:'Sedativo potente',text:'Valeriana + Maracujá: combinação estudada clinicamente. Potência próxima a benzodiazepínicos suaves sem risco de dependência.'},
  {ids:[5,11],label:'Termogênico poderoso',text:'Gengibre + Canela: ambos ativam o metabolismo por vias diferentes, efeito cumulativo.'},
  {ids:[6,8],label:'Foco máximo',text:'Chá Verde + Alecrim: L-teanina equilibra a estimulação do 1,8-cineol do alecrim. Foco sem ansiedade.'},
  {ids:[12,5],label:'Anti-inflamatório duplo',text:'Cúrcuma + Gengibre: inibem COX-2 e LOX por caminhos distintos. Efeito 2-3x superior ao isolado.'},
  {ids:[7,9],label:'Detox refrescante',text:'Hibisco + Hortelã: hibisco elimina toxinas, hortelã refresca. Ótimo gelado.'},
  {ids:[14,15],label:'Detox hepático completo',text:'Boldo + Alcachofra: a dupla mais eficaz para fígado sobrecarregado.'},
  {ids:[4,19],label:'Calmante cítrico',text:'Melissa + Erva Cidreira: ambas têm citral como composto-chave. Potência calmante dobrada.'},
  {ids:[1,10],label:'Digestivo e calmante',text:'Camomila + Erva-doce: combinação tradicional para adultos e crianças. Anti-espasmódica e calmante.'},
];
const CONFLICTS=[
  {ids:[6,2],text:'Chá Verde (cafeína) + Valeriana (sedativa): efeitos opostos que se anulam.'},
  {ids:[27,2],text:'Guaraná (estimulante forte) + Valeriana: cafeína reduz o efeito sedativo.'},
  {ids:[6,3],text:'Chá Verde + Maracujá: cafeína pode contrabalancear o ansiolítico. Use só de manhã.'},
  {ids:[14,11],text:'Boldo + Canela em doses altas: ambos têm cumarina. Monitorar em uso prolongado.'},
];

let ctrBlend=[], ctrCatFilter='Todos';

function renderCtrHerbs(){
  const q=(document.getElementById('ctrSearch')?.value||'').toLowerCase();
  const list=HERBS.filter(h=>{
    if(q&&!(h.n+h.ef+h.tags.join(' ')).toLowerCase().includes(q))return false;
    if(ctrCatFilter!=='Todos'&&h.cat!==ctrCatFilter)return false;
    return true;
  });
  const el=document.getElementById('ctrHerbList'); if(!el)return;
  el.innerHTML=list.map(h=>{
    const inB=ctrBlend.some(b=>b.id===h.id);
    const visual = h.img
      ? `<img class="ctr-herb-row-img" src="${h.img}" data-responsive="${h.img}" alt="${esc(h.n)}" loading="lazy" decoding="async" onerror="this.outerHTML='<div class=\\'ctr-herb-row-icon\\'>${h.icon}</div>'">`
      : `<div class="ctr-herb-row-icon">${h.icon}</div>`;
    return `<div class="ctr-herb-row ${inB?'in-blend':''}" onclick="toggleCtrHerb(${h.id})">
      ${visual}
      <div style="flex:1;min-width:0"><div class="ctr-herb-row-name">${esc(h.n)}</div><div class="ctr-herb-row-cat">${esc(h.cat)}</div></div>
      <button class="ctr-herb-add">${inB?'✓':'+'}</button>
    </div>`;
  }).join('');
}

function buildCtrFilters(){
  const el=document.getElementById('ctrFilters'); if(!el)return;
  el.innerHTML='';
  ['Todos','Calmante','Sono','Digestivo','Estimulante','Respiratório','Metabólico','Cognitivo','Hormonal','Pele'].forEach(c=>{
    const b=document.createElement('button');
    b.className='ctr-fchip'+(ctrCatFilter===c?' on':'');
    b.textContent=c;
    b.onclick=()=>{ctrCatFilter=c;buildCtrFilters();renderCtrHerbs();};
    el.appendChild(b);
  });
}

function toggleCtrHerb(id){
  const idx=ctrBlend.findIndex(b=>b.id===id);
  if(idx>=0)ctrBlend.splice(idx,1); else ctrBlend.push({id,qty:1});
  renderCtrBlend(); renderCtrHerbs();
}

function changeCtrQty(id,delta){
  const item=ctrBlend.find(b=>b.id===id); if(!item)return;
  item.qty=Math.max(0.5,Math.min(4,item.qty+delta*0.5));
  renderCtrBlend();
}

function removeCtrHerb(id){
  ctrBlend=ctrBlend.filter(b=>b.id!==id);
  renderCtrBlend(); renderCtrHerbs();
}

function getQtyLabel(qty,meta){
  if(!meta||!meta.unit)return qty+' col.';
  if(meta.unit==='fatias')return Math.round(qty*3)+' fatias';
  if(meta.unit==='pau')return qty<1?'½ pau':'1 pau';
  if(meta.unit==='folhas')return Math.round(qty*2)+' folhas';
  if(qty===0.5)return '½ col.';
  if(qty===1)return '1 col.';
  return qty+' col.';
}

function renderCtrBlend(){
  const empty=document.getElementById('ctrBlendEmpty');
  const items=document.getElementById('ctrBlendItems');
  const analysis=document.getElementById('ctrAnalysis');
  if(!items)return;
  if(!ctrBlend.length){
    if(empty)empty.style.display='block';
    items.innerHTML='';
    if(analysis)analysis.style.display='none';
    return;
  }
  if(empty)empty.style.display='none';
  if(analysis)analysis.style.display='block';
  items.innerHTML=ctrBlend.map(b=>{
    const h=HERBS.find(x=>x.id===b.id);
    const m=HERB_META[b.id]||{};
    return `<div class="ctr-blend-item">
      <span style="font-size:1.1rem">${h.icon}</span>
      <div class="ctr-blend-item-info">
        <div class="ctr-blend-item-name">${esc(h.n)}</div>
        <div class="ctr-blend-item-ef">${esc(h.ef.split(',')[0])}</div>
      </div>
      <div class="ctr-blend-qty">
        <button class="ctr-qty-btn" onclick="changeCtrQty(${b.id},-1)">−</button>
        <span class="ctr-qty-val">${getQtyLabel(b.qty,m)}</span>
        <button class="ctr-qty-btn" onclick="changeCtrQty(${b.id},1)">+</button>
      </div>
      <button class="ctr-blend-rm" onclick="removeCtrHerb(${b.id})">✕</button>
    </div>`;
  }).join('');
  analyzeBlend();
}

function analyzeBlend(){
  if(!ctrBlend.length)return;
  const herbs=ctrBlend.map(b=>({...HERBS.find(x=>x.id===b.id),...HERB_META[b.id]||{},qty:b.qty}));

  // Smart temperature: minimum (protect delicate)
  const smartTemp=Math.min(...herbs.map(h=>h.tempMin||85));
  const tempLabel=smartTemp<=75?'70-75°C':smartTemp<=82?'80-85°C':smartTemp<=88?'85-90°C':'90-95°C';

  // Smart time: weighted average by herb type
  const tw={root:1.3,bark:1.4,seed:1.1,leaf:1.0,flower:0.8,resin:1.2};
  const smartTime=Math.round(herbs.map(h=>((h.timeMin+h.timeMax)/2)*(tw[h.type]||1)).reduce((a,b)=>a+b,0)/herbs.length);

  // Dose
  const totalG=herbs.reduce((s,h)=>s+(h.grams||2)*h.qty,0);

  // Characteristics radar
  const chars={Calmante:0,Estimulante:0,Digestivo:0,'Anti-inflam.':0,Detox:0,Amargo:0};
  herbs.forEach(h=>{
    const t=h.tags||[];
    if(t.some(x=>['calmante','ansiedade','sono'].includes(x)))chars.Calmante+=h.qty*20;
    if(t.some(x=>['energia','estimulante','termogênico','foco'].includes(x)))chars.Estimulante+=h.qty*20;
    if(t.some(x=>['digestivo','gases','estômago','bile'].includes(x)))chars.Digestivo+=h.qty*20;
    if(t.some(x=>['anti-inflamatório','articulações','inflamação'].includes(x)))chars['Anti-inflam.']+=h.qty*20;
    if(t.some(x=>['fígado','detox','diurético'].includes(x)))chars.Detox+=h.qty*20;
    if(['Boldo','Carqueja','Alcachofra','Losna'].includes(h.n))chars.Amargo+=h.qty*25;
  });
  const maxC=Math.max(...Object.values(chars),1);
  const cCol={Calmante:'#1e3d5c',Estimulante:'#6b5a2d',Digestivo:'#5a3a1a','Anti-inflam.':'#3a2d6b',Detox:'#2d5a2d',Amargo:'#2d4a2d'};
  document.getElementById('ctrCharBox').innerHTML=Object.entries(chars).map(([k,v])=>{
    const p=Math.min(100,Math.round(v/maxC*100));
    return `<div class="ctr-char-row"><span class="ctr-char-label">${k}</span><div class="ctr-char-bar-wrap"><div class="ctr-char-bar" style="width:${p}%;background:${cCol[k]}"></div></div><span class="ctr-char-val">${p}%</span></div>`;
  }).join('');

  // Effects
  const allTags=[...new Set(herbs.flatMap(h=>h.tags||[]))];
  const eCls={calmante:'positive',sono:'positive',digestivo:'positive','anti-inflamatório':'positive',ansiedade:'positive',energia:'neutral',foco:'neutral',estimulante:'neutral',termogênico:'caution',gripe:'positive',imunidade:'positive'};
  document.getElementById('ctrEffects').innerHTML=allTags.slice(0,12).map(t=>`<span class="ctr-effect-tag ctr-effect-${eCls[t]||'neutral'}">${esc(t)}</span>`).join('');

  // Warnings
  const ids=ctrBlend.map(b=>b.id);
  const conflicts=CONFLICTS.filter(c=>c.ids.every(id=>ids.includes(id)));
  const avoids=herbs.filter(h=>h.avoid&&h.avoid.length).map(h=>`${h.n}: ${h.avoid.slice(0,2).join(', ')}`);
  document.getElementById('ctrWarnings').innerHTML=(conflicts.length||avoids.length)?`<div class="warn-box" style="margin-bottom:1rem">${conflicts.map(c=>`⚠ <strong>Conflito:</strong> ${esc(c.text)}`).join('<br>')}${avoids.length?`<div style="margin-top:${conflicts.length?'.5rem':'0'}">ℹ Contraindicações: ${avoids.map(a=>esc(a)).join(' · ')}</div>`:''}</div>`:'';

  // Synergies
  document.getElementById('ctrSynergies').innerHTML=SYNERGIES.filter(s=>s.ids.every(id=>ids.includes(id))).map(s=>`<div class="ctr-synergy-box"><div class="ctr-synergy-title">✦ Sinergia: ${esc(s.label)}</div><div class="ctr-synergy-text">${esc(s.text)}</div></div>`).join('');

  // Smart recipe — sort roots first, flowers last
  const tOrd={root:1,bark:2,seed:3,resin:3,leaf:4,flower:5};
  const sorted=[...herbs].sort((a,b)=>(tOrd[a.type]||4)-(tOrd[b.type]||4));
  const tLbl={root:'raiz — infuse mais tempo',bark:'casca — resistente ao calor',seed:'semente',leaf:'folha — delicada',flower:'flor — adicionar por último'};
  document.getElementById('ctrRecipeBox').innerHTML=`
    <div class="ctr-recipe-total"><span>Total do blend</span><span>${Math.round(totalG)}g / 300ml · ${smartTime} min · ${tempLabel}</span></div>
    ${sorted.map((h,i)=>`<div class="ctr-recipe-row">
      <div class="ctr-recipe-order">${i+1}</div>
      <div style="flex:1"><div class="ctr-recipe-herb">${esc(h.n)} ${h.icon}</div><span class="ctr-recipe-herb-type">${esc(tLbl[h.type]||h.type)}</span></div>
      <div class="ctr-recipe-amount">${getQtyLabel(h.qty,h)}</div>
    </div>`).join('')}`;

  // Prep steps
  const hasRoots=herbs.some(h=>['root','bark'].includes(h.type));
  const hasFlowers=herbs.some(h=>h.type==='flower');
  const freq=herbs.some(h=>['Calmante','Sono'].includes(h.cat))?'1-2x ao dia, preferencialmente à noite':herbs.some(h=>h.cat==='Estimulante')?'1x pela manhã':'2-3x ao dia';
  const prepSteps=[
    `Ferva a água e deixe esfriar até ${tempLabel}.`,
    hasRoots?`Adicione primeiro as raízes/cascas: ${sorted.filter(h=>['root','bark'].includes(h.type)).map(h=>h.n).join(', ')}.`:'',
    `Adicione ${hasRoots?'em seguida ':''}as folhas/sementes${sorted.filter(h=>['leaf','seed'].includes(h.type)).length?': '+sorted.filter(h=>['leaf','seed'].includes(h.type)).map(h=>h.n).join(', '):'.'}.`,
    hasFlowers?`Adicione por último as flores: ${sorted.filter(h=>h.type==='flower').map(h=>h.n).join(', ')}.`:'',
    `Tampe e infuse por ${smartTime} min.`,
    `Coe e sirva morno. ${freq}.`,
  ].filter(Boolean);
  document.getElementById('ctrPrepBox').innerHTML=`
    <div class="ctr-prep-grid">
      <div class="ctr-prep-item"><div class="ctr-prep-val">${tempLabel}</div><div class="ctr-prep-key">Temperatura</div></div>
      <div class="ctr-prep-item"><div class="ctr-prep-val">${smartTime} min</div><div class="ctr-prep-key">Infusão</div></div>
      <div class="ctr-prep-item"><div class="ctr-prep-val">${Math.round(totalG)}g</div><div class="ctr-prep-key">Peso total</div></div>
      <div class="ctr-prep-item"><div class="ctr-prep-val">${freq.split(',')[0]}</div><div class="ctr-prep-key">Frequência</div></div>
    </div>
    <div class="ctr-prep-steps">${prepSteps.map((s,i)=>`<div class="ctr-prep-step"><div class="ctr-prep-step-num">${i+1}</div><div>${s}</div></div>`).join('')}</div>`;

  window._ctrComputed={smartTemp,smartTime,sorted,freq,herbs,totalG};
}

function startBlendTimer(){
  if(!ctrBlend.length){toast('Adicione pelo menos uma erva');return;}
  const c=window._ctrComputed; if(!c)return;
  const name=document.getElementById('ctrBlendName')?.value||'Meu Blend';
  const {smartTemp,smartTime,sorted,freq}=c;
  const tempLabel=smartTemp<=75?'~70°C':smartTemp<=82?'~80°C':smartTemp<=88?'~85°C':'~90°C';
  const tOrd={root:1,bark:2,seed:3,resin:3,leaf:4,flower:5};
  const groups=[];
  sorted.forEach(h=>{
    const last=groups[groups.length-1];
    if(last&&last.type===h.type)last.herbs.push(h);
    else groups.push({type:h.type,herbs:[h]});
  });
  const steps=[{title:'Aqueça a água',desc:`Ferva e deixe esfriar até ${tempLabel}. Separe todas as ${sorted.length} ervas e a infusora.`,duration:0}];
  const multiGroup=groups.length>1;
  if(multiGroup){
    const roots=groups.filter(g=>['root','bark'].includes(g.type));
    const mids=groups.filter(g=>['seed','leaf','resin'].includes(g.type));
    const flowers=groups.filter(g=>g.type==='flower');
    if(roots.length){
      const t=Math.round(smartTime*0.6);
      steps.push({title:`Adicione raízes: ${roots.flatMap(g=>g.herbs).map(h=>h.n).join(' + ')}`,desc:roots.flatMap(g=>g.herbs).map(h=>`${h.icon} ${h.n}: ${getQtyLabel(h.qty,HERB_META[h.id]||{})}`).join('\n')+'.\nRaízes precisam de mais tempo para liberar os compostos.',duration:t*60});
    }
    if(mids.length){
      const t=Math.round(smartTime*(roots.length?0.35:0.8));
      steps.push({title:`Adicione: ${mids.flatMap(g=>g.herbs).map(h=>h.n).join(' + ')}`,desc:mids.flatMap(g=>g.herbs).map(h=>`${h.icon} ${h.n}: ${getQtyLabel(h.qty,HERB_META[h.id]||{})}`).join('\n'),duration:t*60});
    }
    if(flowers.length){
      const t=Math.min(4,Math.round(smartTime*0.25));
      steps.push({title:`Adicione flores: ${flowers.flatMap(g=>g.herbs).map(h=>h.n).join(' + ')}`,desc:flowers.flatMap(g=>g.herbs).map(h=>`${h.icon} ${h.n}: ${getQtyLabel(h.qty,HERB_META[h.id]||{})}`).join('\n')+'.\nFlores liberam rápido — apenas '+t+' min finais.',duration:t*60});
    }
  } else {
    steps.push({title:`Adicione todas as ervas`,desc:sorted.map(h=>`${h.icon} ${h.n}: ${getQtyLabel(h.qty,HERB_META[h.id]||{})}`).join('\n'),duration:smartTime*60});
  }
  steps.push({title:'Coe e sirva',desc:`Retire as ervas e coe.\n${freq}.`,duration:0});
  launchTimer(name,steps);
}

function saveBlendFromCtr(){
  if(!ctrBlend.length){toast('Adicione pelo menos uma erva');return;}
  const name=document.getElementById('ctrBlendName')?.value||'Blend sem nome';
  const ings=ctrBlend.map(b=>{const h=HERBS.find(x=>x.id===b.id);const m=HERB_META[b.id]||{};return{id:b.id,n:h.n,amount:getQtyLabel(b.qty,m)};});
  if(savedRecipes.find(r=>r.name===name)){toast('Já existe um blend com esse nome');return;}
  savedRecipes.unshift({name,tagline:`${ctrBlend.length} ervas · blend personalizado`,ingredients:ings,fromCtr:true});
  localStorage.setItem('erb_recipes',JSON.stringify(savedRecipes));
  if(typeof trackAction==='function') trackAction('save-blend');
  toast(`"${name}" salvo nos favoritos!`);
}

// ── override goPage to handle all pages ──
// Pages accessible without login
const PUBLIC_PAGES = ['search','ervatorio','ficha','blends','blend','sabores','guia-sensorial','roda','ferramentas','ferramenta','familias','familia','quiz','chas','mundo','receitas','jogo','caminho'];

// Esconde a landing e expõe o container do app. Idempotente.
// Usado por goPage() e pelo hash handler para que deep links
// (#ervatorio, #ficha/:slug etc.) não fiquem cobertos pela landing.
function hideLanding(){
  var lp = document.getElementById('landingPage');
  var ac = document.getElementById('appContainer');
  if (lp) lp.style.display = 'none';
  if (ac) ac.style.display = 'block';
}

function goPage(id,btn,slug){
  // Cerimônia foi integrada em #page-chas — redireciona deep links antigos.
  if(id==='cerimonia') id='chas';
  // O hub "Sabores" saiu (D13): dois cards e conteudo nenhum. Quem chega por
  // ele cai no Guia de sabores; a Roda dos Chas continua em #roda.
  if(id==='sabores') id='guia-sensorial';
  // Blends tem duas abas (Prontos/Manual); a aba vem no slug (#blends/manual).
  // O Assistente virou o Encontre seu chá (PR 05): 'criarblend' legado e
  // #blends/assistente caem lá.
  var _blendOpenTab = null;
  if(id==='criarblend' || (id==='blends' && slug==='assistente')){ id='search'; slug=undefined; }
  if(id==='blends'){
    if(slug==='manual'||slug==='prontos') _blendOpenTab=slug;
    slug=_blendOpenTab||undefined;
  }
  // #encontrar/<intencao>: a tela de intencoes ja abre com a intencao aplicada
  // (chips do hero da landing). Ver D8.
  var _intent = null;
  if(id==='search' && slug){ _intent=slug; slug=undefined; }
  // #ficha/<id numérico> (receitas antigas passavam o id da erva): vira o
  // slug da ficha antes de o hash ser gravado, para a URL não mentir.
  if(id==='ficha' && /^\d+$/.test(String(slug||''))){ var _fs=fichaSlugPorId(Number(slug)); if(_fs) slug=_fs; }
  // Gate: quem já entrou no app (login real OU "continuar sem login") pode
  // navegar livremente entre as páginas. Features que exigem conta real
  // (sync de favoritos, salvar blend no cloud, etc.) checam ervaria.user
  // individualmente dentro de cada renderizador.
  const baseId = id.split('/')[0];
  // Loja desligada: as telas de comércio não existem (D4). Deep link cai na
  // home com o aviso — o servidor já recusava; a tela não oferece mais.
  if(LOJA_PAGES.indexOf(baseId) !== -1 && !lojaAtiva()){
    id = 'search'; slug = undefined;
    if(typeof t === 'function') toast(t('lp.loja.soon'));
    setTimeout(function(){ var el = document.getElementById('lp-loja'); if(el && typeof backToLanding === 'function'){ backToLanding(); el.scrollIntoView({behavior:'smooth',block:'start'}); } }, 60);
  }
  const hasEntered = (window.ervaria && ervaria.user)
                  || localStorage.getItem('erb_auth')
                  || localStorage.getItem('erb_entered');
  if(!PUBLIC_PAGES.includes(baseId) && !hasEntered){
    ervaria.showAuthModal();
    return;
  }
  hideLanding();
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.getElementById('page-'+id).classList.add('on');
  window._currentSlug = slug;
  if(typeof closeMenuSheet==='function') closeMenuSheet();
  if(id==='favs')renderFavs();
  if(id==='suppliers')renderSuppliers();
  if(id==='roda')window.initRoda();
  if(id==='perfil')renderPerfil();
  if(id==='diario' && typeof renderDiario==='function') renderDiario();
  if(id==='search'){
    // Com intenção no hash, o fluxo abre já no passo 2 (ou 3, se o link traz
    // momento e restrição); sem, volta ao passo 1.
    if(_intent) setTimeout(function(){ aplicarIntencao(_intent); }, 50);
    else if(typeof encReset==='function') encReset();
  }
  if(id==='blends'){
    // Inicializa todas as sub-abas (barato o bastante para rodar sempre)
    renderTray();
    if(typeof switchBlendTab==='function') switchBlendTab(_blendOpenTab || 'prontos');
  }
  if(id==='chas'){ if(slug && CHAS_DATA.some(function(c){ return c.id===slug; })) chaActiveId=slug; initChas(); initCerimonia(); }
  if(id==='guia-sensorial'&&typeof initFlavorWheel==='function')initFlavorWheel();
  if(id==='marketplace')initMkt();
  if(id==='mundo')initMundo(slug);
  // Ervatorio v1.1 pages
  if(id==='ervatorio' && typeof renderIndiceCatalogo==='function') renderIndiceCatalogo();
  if(id==='ficha' && slug && typeof renderFichaPage==='function') renderFichaPage(slug);
  // NB: o render da biblioteca é disparado pela switchBlendTab('prontos') acima.
  if(id==='blend' && slug && typeof renderBlendPage==='function') renderBlendPage(slug);
  if(id==='roda-funcional' && typeof renderRodaFuncional==='function') renderRodaFuncional();
  if(id==='ferramentas' && typeof initFerramentas==='function') initFerramentas();
  if(id==='ferramenta' && typeof initFerramentas==='function') initFerramentas(slug);
  if(id==='familias' && typeof initFamilias==='function') initFamilias();
  if(id==='familia' && slug && typeof initFamilia==='function') initFamilia(slug);
  if(id==='quiz' && typeof initQuiz==='function') initQuiz(slug);
  if(id==='receitas' && typeof initReceitas==='function'){ initReceitas(); if(slug && typeof openReceita==='function') openReceita(slug); if(typeof trackAction==='function') trackAction('visit-receitas'); }
  if(id==='caminho' && typeof initCaminho==='function') initCaminho();
  if(id==='jogo' && typeof initJogo==='function') initJogo();

  // i18n + SEO + estado do menu — update on every navigation
  window._currentPage = id;
  if(typeof applyI18n==='function') applyI18n();
  if(typeof updateSEO==='function') updateSEO(id);
  updateNavState(id, slug);
  window.scrollTo({ top: 0 });

  // Registra a navegação no histórico do browser para que o botão Voltar funcione.
  // A URL usa o nome canonico (PAGE_HASH); vindo de hashchange (alias ou
  // link), substitui a entrada em vez de empilhar.
  if(!window._goPageFromHistory){
    var newHash=pageHash(id,slug);
    if(window._goPageFromHash || window.location.hash===newHash)
      history.replaceState({page:id,slug:slug||null},'',newHash);
    else
      history.pushState({page:id,slug:slug||null},''  ,newHash);
  }
}

// ── ROTAS POR HASH ──────────────────────────────────────────────
// Decisões D6–D8 em docs/estrategia/2026-09-14-plano-handoff-ux.md.
//
// Qualquer `#<pagina>[/<slug>]` cujo `#page-<pagina>` exista abre a tela —
// antes, `#chas`, `#mundo`, `#receitas` e `#jogo` escondiam a landing mas
// nao abriam a pagina, porque o roteador era uma lista fechada.
//
// HASH_ALIASES: nome que aparece na URL -> id da pagina (com sub-aba opcional).
// Os nomes novos vem do handoff de UX (14/09); os antigos continuam
// funcionando para nao quebrar link ja compartilhado.
var HASH_ALIASES = {
  // vocabulario novo
  'encontrar':'search', 'ervas':'ervatorio', 'origens':'mundo', 'onde-beber':'mundo/beber',
  'como-preparar':'ferramentas', 'criar-blend':'blends/manual', 'loja':'marketplace',
  'produtores':'suppliers', 'estante':'favs', 'jornada':'caminho', 'conta':'favs',
  // hashes antigos e atalhos
  'sabores':'guia-sensorial', 'shop':'marketplace', 'cerimonia':'chas', 'criarblend':'search',
  // Onde beber virou visão de Origens (PR 07); o hash antigo segue valendo.
  'chazerias':'mundo/beber',
};
// Inverso: id da pagina -> nome canonico na URL. Quem nao esta aqui usa o proprio id.
// PAGE_HASH: ver js/nav-data.js.
// Secoes da landing (D7): os ids no HTML tem prefixo `lp-`; estes sao os
// nomes antigos, que ainda podem chegar por link. Nao ha pagina — o navegador rola.
// `diario` saiu daqui no PR 08b: agora é página do app (#diario). A seção da
// landing continua em #lp-diario, que é o que os links dela já usam.
var LANDING_ANCHORS = { 'clube':'lp-clube', 'colecoes':'lp-colecoes', 'mapa':'lp-mapa' };

function pageHash(id, slug){
  // Tela + slug com nome próprio (mundo/beber → #onde-beber) vem antes.
  if(slug && PAGE_HASH[id + '/' + slug]) return '#' + PAGE_HASH[id + '/' + slug];
  return '#' + (PAGE_HASH[id] || id) + (slug ? '/' + slug : '');
}

function resolveHash(hash){
  var m = String(hash || '').match(/^#([a-z0-9-]+)(?:\/(.+))?$/i);
  if(!m) return null;
  var id = m[1].toLowerCase(), slug = m[2] || '';
  if(LANDING_ANCHORS[id]) return { landing: LANDING_ANCHORS[id] };
  if(id.indexOf('lp-') === 0) return null;
  var target = HASH_ALIASES[id] || id;
  var parts = target.split('/');
  var page = parts[0];
  if(!slug && parts[1]) slug = parts[1];
  if(!document.getElementById('page-' + page)) return null;
  return { page: page, slug: slug };
}

function handleHash(){
  var r = resolveHash(window.location.hash);
  if(!r) return;
  if(r.landing){
    // Link antigo para uma secao da landing: mostra a landing (se o app
    // estiver por cima) e rola ate ela.
    if(typeof backToLanding === 'function') backToLanding();
    var el = document.getElementById(r.landing);
    if(el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  hideLanding();
  // A URL ja mudou (clique em <a href="#…">, digitacao, alias): goPage
  // substitui a entrada em vez de empilhar outra.
  window._goPageFromHash = true;
  try { goPage(r.page, null, r.slug || undefined); }
  finally { window._goPageFromHash = false; }
}
window.addEventListener('hashchange', handleHash);
// Carga inicial com hash: o roteador so roda depois que os scripts `defer`
// seguintes (ervatorio-pages, receitas, quiz…) registraram seus renderizadores.
// `_rotaInicialPronta` diz que essa passada inicial já aconteceu: quem
// precisa interagir com a tela (os testes E2E, por exemplo) espera por ela,
// porque goPage('search') sem slug devolve o Encontre seu chá ao passo 1.
if(window.location.hash && resolveHash(window.location.hash) && !resolveHash(window.location.hash).landing){
  hideLanding();
  setTimeout(function(){ handleHash(); window._rotaInicialPronta = true; }, 300);
} else {
  window._rotaInicialPronta = true;
}

// Botão Voltar/Avançar do browser
window.addEventListener('popstate', function(e){
  var state=e.state;
  if(state&&state.page){
    window._goPageFromHistory=true;
    try{ goPage(state.page, null, state.slug||undefined); }
    finally{ window._goPageFromHistory=false; }
  } else {
    // Sem estado — voltou para antes da primeira navegação no app:
    // mostra a landing page novamente.
    var lp=document.getElementById('landingPage');
    var ac=document.getElementById('appContainer');
    if(lp) lp.style.display='';
    if(ac) ac.style.display='none';
  }
});

function switchBlendTab(tab){
  const pronto=document.getElementById('blendPanelPronto');
  const manual=document.getElementById('blendPanelManual');
  const tabP=document.getElementById('blendTabPronto');
  const tabM=document.getElementById('blendTabManual');
  [pronto,manual].forEach(el=>{ if(el) el.style.display='none'; });
  [tabP,tabM].forEach(el=>{ if(el) el.classList.remove('on'); });
  // Duas abas (PR 05): Prontos e Manual. O Assistente virou o Encontre seu chá.
  if(tab==='manual'){
    if(manual) manual.style.display='';
    if(tabM) tabM.classList.add('on');
    if(typeof renderTray==='function') renderTray();
    buildCtrFilters();renderCtrHerbs();renderCtrBlend();
  } else {
    if(pronto) pronto.style.display='';
    if(tabP) tabP.classList.add('on');
    if(typeof renderBibliotecaBlends==='function') renderBibliotecaBlends();
  }
}

// ════════════════════════════════════════
// ── CHÁS TRADICIONAIS ──
// ════════════════════════════════════�����══
// CHAS_DATA mora em js/chas-data.js (carregado antes deste arquivo) — o
// prerender lê os mesmos seis tipos para /chas/<id>/ (PR 10).

let chaActiveId='verde';

function initChas(){
  const intro=document.getElementById('chaFamilyIntro');
  intro.innerHTML=`<strong style="color:var(--gold2);font-family:'Cormorant Garamond',serif;font-size:1rem">Camellia sinensis</strong> — uma única planta, seis universos distintos. O que diferencia cada chá não é a espécie, mas o processo: quanto tempo as folhas oxidam após a colheita. Este processo transforma compostos, sabores, aromas e benefícios completamente. Cada família é um mundo a descobrir.`;
  buildChaTabs();
  renderChaDetail(chaActiveId);
}

function buildChaTabs(){
  const el=document.getElementById('chaTabs'); if(!el)return;
  el.innerHTML='';
  CHAS_DATA.forEach(c=>{
    const b=document.createElement('button');
    b.className='cha-tab'+(chaActiveId===c.id?' on':'');
    b.style.color=chaActiveId===c.id?c.color:'';
    b.style.borderColor=chaActiveId===c.id?c.color:'';
    b.innerHTML=`${c.emoji} ${c.name}`;
    b.onclick=()=>{chaActiveId=c.id;buildChaTabs();renderChaDetail(c.id);
      // A visão tem hash próprio (#chas/<id>), como as de Origens (PR 07).
      if(window._currentPage==='chas'){ window._currentSlug=c.id; history.replaceState({page:'chas',slug:c.id},'',pageHash('chas',c.id)); }
    };
    el.appendChild(b);
  });
}

function renderChaDetail(id){
  const c=CHAS_DATA.find(x=>x.id===id); if(!c)return;
  if(typeof trackAction==='function') trackAction('view-cha', id);
  const el=document.getElementById('chaDetail'); if(!el)return;
  const isLight=document.body.classList.contains('light');
  const txtColor=isLight?(c.textColorLight||c.color):c.textColor;
  el.innerHTML=`
    <div class="cha-header" style="background:${c.bgColor};border:0.5px solid ${c.color}44;color:${txtColor}">
      ${c.img?`<div class="cha-header-img"><img src="${c.img}" alt="${c.name}" loading="lazy" onerror="this.parentNode.style.display='none'"></div>`:''}
      <div style="font-size:2.5rem;margin-bottom:.5rem">${c.emoji}</div>
      <div class="cha-header-name" style="color:${c.color}">${c.name}</div>
      <div class="cha-header-latin">${c.latin}</div>
      <div class="cha-header-tagline">${c.tagline}</div>
      <div class="cha-oxidation-bar">
        <span class="cha-oxidation-label">Oxidação 0%</span>
        <div class="cha-oxidation-track"><div class="cha-oxidation-fill" style="width:${c.oxidation}%;background:${c.color}"></div></div>
        <span class="cha-oxidation-label">${c.oxidation}%</span>
      </div>
    </div>

    <div class="cha-grid">
      <div class="cha-card">
        <div class="cha-card-label">Perfil de sabor</div>
        <div class="cha-flavor-wheel">${c.sabores.map(s=>`<span class="cha-flavor-tag">${s}</span>`).join('')}</div>
      </div>
      <div class="cha-card">
        <div class="cha-card-label">Preparo ideal</div>
        <table class="cha-compare-table">
          <tr><td style="color:var(--muted)">Temperatura</td><td><strong>${c.temp}</strong></td></tr>
          <tr><td style="color:var(--muted)">Tempo</td><td><strong>${c.tempo}</strong></td></tr>
          <tr><td style="color:var(--muted)">Dose</td><td><strong>${c.dose}</strong></td></tr>
          <tr><td style="color:var(--muted)">Cafeína</td><td><strong>${c.cafeina}</strong></td></tr>
        </table>
      </div>
      <div class="cha-card">
        <div class="cha-card-label">Benefícios</div>
        <div class="cha-card-content">${c.beneficios.map(b=>`<div style="display:flex;gap:6px;margin-bottom:.3rem"><span style="color:${c.color||'var(--gold)'};flex-shrink:0">✦</span><span>${b}</span></div>`).join('')}</div>
      </div>
      <div class="cha-card">
        <div class="cha-card-label">Regiões produtoras</div>
        <div class="cha-card-content">${c.regioes.map(r=>`<div style="padding:3px 0;border-bottom:0.5px solid rgba(255,255,255,.04)">${r}</div>`).join('')}</div>
      </div>
    </div>

    ${c.variedades?`
    <div class="cha-section-label">Variedades Notáveis</div>
    <div class="cha-variedades-grid">
      ${c.variedades.map(v=>`<div class="cha-var-card" style="border-top:2px solid ${c.color||'var(--gold)'}">
        <div class="cha-var-emoji">${v.emoji}</div>
        <div class="cha-var-name">${v.n}</div>
        <div class="cha-var-orig" style="display:inline-flex;align-items:center;gap:5px">${svgIcon('pin')} ${esc(v.orig)}</div>
        <div class="cha-var-desc">${v.d}</div>
      </div>`).join('')}
    </div>`:''}

    ${c.harmonizacao?`
    <div class="cha-section-label">Harmonização</div>
    <div class="cha-harmonizacao-row">
      ${c.harmonizacao.map(h=>`<span class="cha-harm-tag">${h}</span>`).join('')}
    </div>`:''}

    ${c.momento?`
    <div class="cha-momento-block" style="border-left:3px solid ${c.color||'var(--gold)'}">
      <span class="cha-momento-label">Melhor momento</span>
      <span class="cha-momento-val">${c.momento}</span>
    </div>`:''}

    <div class="cha-section-label">Como preparar</div>
    <div class="cha-prep-steps" style="margin-bottom:1.5rem">
      ${c.preparo.map((s,i)=>`<div class="cha-prep-step">
        <div class="cha-prep-num" style="background:${c.color||'var(--gold)'}22;border:0.5px solid ${c.color||'var(--gold)'}44;color:${c.color||'var(--gold)'}">${i+1}</div>
        <div class="cha-prep-text">${s}</div>
      </div>`).join('')}
    </div>

    <div class="cha-section-label">História & Origem</div>
    ${c.historia.map(h=>`<div class="cha-history-block" style="border-left-color:${c.color||'var(--gold)'}"><div class="cha-history-year">${h.year}</div>${h.text}</div>`).join('')}

    <div class="cha-section-label" style="margin-top:.75rem">Curiosidades</div>
    <div style="background:var(--bg3);border:0.5px solid var(--faint);border-radius:var(--r-lg);padding:1rem 1.25rem;font-size:.82rem;color:var(--cream2);line-height:1.7;font-style:italic">"${c.curiosidades}"</div>

    <div style="display:flex;gap:8px;margin-top:1.25rem">
      <button class="roda-start-btn" onclick="openTimerCha('${c.id}')">⏱ Preparar ${c.name} agora</button>
    </div>`;
}

function openTimerCha(id){
  const c=CHAS_DATA.find(x=>x.id===id); if(!c)return;
  const steps=[
    {title:'Aqueça a água',desc:`Para ${c.name}: ${c.temp}. Use termômetro para precisão — a temperatura é crucial.`,duration:0},
    {title:'Prepare o recipiente',desc:`Aqueça a xícara ou bule com um pouco de água quente e descarte. Isso mantém a temperatura estável durante a infusão.`,duration:0},
    {title:'Meça as folhas',desc:`Use ${c.dose}. Para ${c.name}, a proporção é fundamental para equilibrar sabor e suavidade.`,duration:0},
    {title:'Infusão',desc:`Despeje a água sobre as folhas. ${c.name}: ${c.tempo} de infusão. Cubra para preservar aromas.`,duration:parseInt(c.tempo)*60},
    {title:'Sirva e aproveite',desc:`Coe com cuidado. ${c.name} pode ser reinfusionado — segunda e terceira infusões revelam perfis diferentes.`,duration:0},
  ];
  launchTimer(c.name,steps);
}

// ════════════════════════════════════════
// ── CERIMÔNIA DO CHÁ ──
// ════════════════════════════════════════
const CER_TABS_DATA = [
  {id:'oque', label:'O que é'},
  {id:'tipos', label:'Tipos de Cerimônia'},
  {id:'utensílios', label:'Utensílios'},
  {id:'como', label:'Como Fazer'},
  {id:'onde', label:'Onde Participar'},
];
let cerActiveTab='oque';

function initCerimonia(){
  buildCerTabs();
  renderCerContent(cerActiveTab);
}

function buildCerTabs(){
  const el=document.getElementById('cerTabs'); if(!el)return;
  el.innerHTML='';
  CER_TABS_DATA.forEach(t=>{
    const b=document.createElement('button');
    b.className='cer-tab'+(cerActiveTab===t.id?' on':'');
    b.textContent=t.label;
    b.onclick=()=>{cerActiveTab=t.id;buildCerTabs();renderCerContent(t.id);};
    el.appendChild(b);
  });
}

function renderCerContent(tab){
  const el=document.getElementById('cerContent'); if(!el)return;
  if(tab==='oque') el.innerHTML=`
    <div class="cer-intro">"A cerimônia do chá não é sobre o chá. É sobre tudo o que acontece quando você para — o silêncio, a presença, a beleza do efêmero."</div>
    <div class="cer-section">
      <div class="cer-section-title">O que é a cerimônia do chá</div>
      <div class="cer-item"><div class="cer-item-name">Chanoyu — Japão</div><div class="cer-item-desc">A "Via do Chá" japonesa. Baseada nos princípios do Zen budismo: Wa (harmonia), Kei (respeito), Sei (pureza) e Jaku (tranquilidade). Sen Rikyū codificou seus princípios no século XVI. Não é apenas preparar chá — é uma forma de meditação ativa.</div></div>
      <div class="cer-item"><div class="cer-item-name">Gongfu Cha — China</div><div class="cer-item-desc">A "Arte de Fazer Chá com Habilidade". Múltiplas infusões rápidas em bule pequeno (Yixing). Cada infusão revela uma faceta diferente do chá. Popular em Fujian, Guangdong e Taiwan. Filosofia Taoísta de harmonizar com a natureza.</div></div>
      <div class="cer-item"><div class="cer-item-name">Cha Dao — Filosofia do Chá</div><div class="cer-item-desc">Além de qualquer cerimônia específica — o "caminho do chá" como prática de vida. Cada xícara como oportunidade de presença plena. Cultivada por mestres como Lu Yu (China, século VIII) e Sen Rikyū (Japão, século XVI).</div></div>
    </div>
    <div class="cer-section">
      <div class="cer-section-title">Os quatro princípios universais</div>
      ${[{n:'Harmonia (Wa/He)',t:'Sintonia entre as pessoas, o ambiente e o chá. O espaço, os gestos e os objetos devem criar um todo coerente.'},{n:'Respeito (Kei/Jing)',t:'Consideração profunda por cada pessoa presente, pelos objetos usados e pelo próprio chá.'},{n:'Pureza (Sei/Jie)',t:'Do espaço, dos utensílios, da mente. A limpeza é ritual — e vai além do físico.'},{n:'Tranquilidade (Jaku/Jing)',t:'O estado de paz interior que emerge quando os outros três princípios estão presentes.'}].map(p=>`<div class="cer-item"><div class="cer-item-name">${p.n}</div><div class="cer-item-desc">${p.t}</div></div>`).join('')}
    </div>`;

  else if(tab==='tipos') el.innerHTML=`
    <div class="cer-section">
      <div class="cer-section-title">Cerimônias japonesas</div>
      ${[{n:'Chaji — Cerimônia completa',d:'4-5 horas. Inclui refeição Kaiseki, matcha denso (koicha) e leve (usucha). Acontece no chashitsu (casa do chá). A forma mais formal e completa.',det:'Exige preparo intenso. Geralmente realizada para 4-5 convidados especiais.'},{n:'Chakai — Reunião casual',d:'1-2 horas. Mais simples, sem refeição completa. Wagashi (doces japoneses) antes do matcha. A forma mais acessível para iniciantes.',det:'Perfeita para primeiro contato com a cerimônia.'},{n:'Ro e Furo — sazonais',d:'Ro (braseiro interior, novembro-abril) e Furo (fogão portátil, maio-outubro). A cerimônia muda completamente com as estações — utensílios, gestos e estética.',det:'Cada estação tem seu próprio vocabulário estético.'}].map(c=>`<div class="cer-item"><div class="cer-item-name">${c.n}</div><div class="cer-item-desc">${c.d}</div><div class="cer-item-detail">${c.det}</div></div>`).join('')}
    </div>
    <div class="cer-section">
      <div class="cer-section-title">Cerimônias chinesas</div>
      ${[{n:'Gongfu Cha — Arte da habilidade',d:'Bule Yixing pequeno (100-150ml), múltiplas infusões curtas (20-40 segundos). Cada infusão é uma revelação diferente do mesmo chá. Ideal para oolongs, Pu-erh e chás premium.',det:'O bule Yixing absorve o sabor do chá ao longo dos anos — nunca lavar com detergente.'},{n:'Grandma Style — o cotidiano',d:'Folhas diretamente na xícara, adicionar água quente quando necessário. O jeito mais simples e praticado diariamente na China. Filosofia: o chá deve ser acessível a todos.',det:'Perfeito para chás verdes e oolongs leves do dia a dia.'},{n:'Cerimônia do Pu-erh',d:'Rinse inicial obrigatório. Bule ou gaiwan. Água fervendo (100°C). As primeiras infusões são rápidas (10-30s), depois aumentam gradualmente. Um bolo de Pu-erh vintage pode render 20+ infusões.',det:'Cada infusão revela um perfil diferente. A 7ª ou 8ª frequentemente é considerada a melhor.'}].map(c=>`<div class="cer-item"><div class="cer-item-name">${c.n}</div><div class="cer-item-desc">${c.d}</div><div class="cer-item-detail">${c.det}</div></div>`).join('')}
    </div>`;

  else if(tab==='utensílios') el.innerHTML=`
    <div class="cer-section">
      <div class="cer-section-title">Utensílios japoneses (Chanoyu)</div>
      ${[{n:'Chawan — Tigela de matcha',d:'O coração da cerimônia. Feita à mão por ceramistas. Formato assimétrico intencional — a imperfeição é beleza (Wabi-sabi). Aquecida antes do uso.',det:'Preço: R$150 (artesanal) a R$50.000+ (obra assinada)'},{n:'Chasen — Batedor de bambu',d:'80-120 fios de bambu finamente cortados. Bate o matcha em Z até formar espuma. Cada um tem vida útil de 3-6 meses.',det:'Origem: Nara. Família Takayama produz há 500 anos ininterruptamente.'},{n:'Chashaku — Colher de bambu',d:'Medida tradicional: 2 medidas rasas por tigela. Feita de bambu ou marfim (antigas). Carregada por cada mestre como objeto pessoal.',det:'Um chashaku autografado por um mestre pode valer milhares.'},{n:'Chakin — Pano branco',d:'Dobrado precisamente, usado para secar a tigela. A dobra específica é ensinada como técnica separada.',det:'Linho ou algodão branco imaculado.'},{n:'Fukusa — Seda para purificação',d:'Seda colorida para ritual de limpeza dos utensílios. A dobra e o gesto de limpeza são gestos meditativos centrais da cerimônia.',det:'Cor da seda indica escola e gênero do praticante.'}].map(u=>`<div class="cer-item"><div class="cer-item-name">${u.n}</div><div class="cer-item-desc">${u.d}</div><div class="cer-item-detail">${u.det}</div></div>`).join('')}
    </div>
    <div class="cer-section">
      <div class="cer-section-title">Utensílios chineses (Gongfu Cha)</div>
      ${[{n:'Bule Yixing — Argila roxa',d:'Argila Zisha de Yixing. Porosa: absorve sabor do chá ao longo dos anos. Um bule bem curado é passado de geração em geração.',det:'Nunca usar com diferentes tipos de chá. Nunca lavar com sabão.'},{n:'Gaiwan — Tigela com tampa',d:'Porcelana com tigela, tampa e pires. Versátil — funciona como bule e xícara. Permite ver as folhas abrirem.',det:'A tampa serve de filtro e permite observar a infusão.'},{n:'Cha Hai — Jarro',d:'Recebe o chá do bule antes de servir. Uniformiza a concentração. Permite avaliar a cor e limpidez.',det:'Também chamado "pitcher" do chá.'},{n:'Xícaras de cheiro e sabor',d:'Par de xícaras: a alta, estreita (para cheirar) e a baixa, aberta (para beber). A transição do aroma para o sabor é uma experiência em si.',det:'Típica da cerimônia de oolong.'},{n:'Tabuleiro de chá',d:'Captura o excesso de água. Bambu, madeira ou pedra. O derramamento intencional é parte da cerimônia — o tabuleiro "bebe" junto com os convidados.',det:'Símbolo de generosidade e abundância.'}].map(u=>`<div class="cer-item"><div class="cer-item-name">${u.n}</div><div class="cer-item-desc">${u.d}</div><div class="cer-item-detail">${u.det}</div></div>`).join('')}
    </div>`;

  else if(tab==='como') el.innerHTML=`
    <div class="cer-intro">"Cada gesto na cerimônia existe por uma razão. Aprenda os gestos e você aprenderá a razão deles."</div>
    <div class="cer-section">
      <div class="cer-section-title">Chanoyu simplificado — passo a passo</div>
      ${[
        {t:'Prepare o espaço',d:'Limpe com atenção. Um vaso com flor simples (chabana). Rolo caligrafia ou pintura (kakemono). Incenso suave aceso antes dos convidados chegarem. O espaço comunica antes do chá.'},
        {t:'Purifique os utensílios',d:'Com o fukusa (seda), limpe o chashaku e a borda da caixinha de matcha. Gesto lento, intencional. "Purifica" o objeto e a mente simultaneamente. É meditação ativa.'},
        {t:'Aqueça a tigela',d:'Despeje água quente no chawan. Aguarde 30 segundos. Descarte. Seque com o chakin dobrado com o padrão correto. A tigela aquecida mantém o matcha na temperatura ideal.'},
        {t:'Prepare o matcha',d:'2 medidas de chashaku de matcha peneirado. 70-80ml de água a 75-80°C. Bata em Z (não em círculos) com o chasen até formar espuma homogênea. O matcha está pronto quando a espuma é cremosa.'},
        {t:'Sirva com presença',d:'Coloque a tigela com a frente (parte mais bela) virada para o convidado. O convidado gira a tigela 90° antes de beber — para não deixar marcas no lado mais bonito. Aprecia a aparência antes de beber.'},
        {t:'Limpe e encerre',d:'Limpe todos os utensílios com calma. O fechamento da cerimônia é tão importante quanto a abertura. Guardar com cuidado é parte do respeito pela próxima vez.'},
      ].map((s,i)=>`<div class="cer-step"><div class="cer-step-num">${i+1}</div><div class="cer-step-content"><div class="cer-step-title">${s.t}</div><div class="cer-step-text">${s.d}</div></div></div>`).join('')}
    </div>
    <div class="cer-section">
      <div class="cer-section-title">Gongfu Cha — guia prático</div>
      ${[
        {t:'Prepare o tabuleiro',d:'Coloque bule Yixing, Cha Hai, xícaras e tabuleiro. Ferva a água. O ritual começa com os objetos dispostos com intenção.'},
        {t:'Desperte o bule',d:'Despeje água fervendo sobre o bule e xícaras por fora. Aquece e "desperta" o bule. Descarte a água no tabuleiro.'},
        {t:'Lave o chá (rinse)',d:'Coloque o chá no bule. Despeje água quente rapidamente e descarte. Abre as folhas e remove poeiras. Especialmente importante para Pu-erh.'},
        {t:'Primeiras infusões',d:'Oolongs: 30-45 segundos. Pu-erh Sheng: 15-20s. A cada infusão, aumente 10-15 segundos. Despeje no Cha Hai, distribua uniformemente nas xícaras.'},
        {t:'Aprecie a evolução',d:'Cada infusão é diferente. Observe a cor, o aroma, a textura. Algumas das melhores notas surgem na 4ª ou 5ª infusão. O chá conta sua história ao longo do tempo.'},
      ].map((s,i)=>`<div class="cer-step"><div class="cer-step-num">${i+1}</div><div class="cer-step-content"><div class="cer-step-title">${s.t}</div><div class="cer-step-text">${s.d}</div></div></div>`).join('')}
    </div>`;

  else if(tab==='onde') el.innerHTML=`
    <div class="cer-section">
      <div class="cer-section-title">Casas de chá e cerimônias no Brasil</div>
      ${[
        {icon:'🏮',n:'Museu do Imigrante — São Paulo',loc:'Mooca, São Paulo',d:'Cerimônias japonesas mensais organizadas pela comunidade nipo-brasileira. Inclui degustação e explicação histórica. Uma das mais autênticas fora do Japão.'},
        {icon:'🍵',n:'Liberdade Tea Houses',loc:'Liberdade, São Paulo',d:'Bairro japonês de SP concentra diversas casas de chá autênticas. Algumas realizam cerimônias Gongfu Cha com mestres de Fujian e Taiwan.'},
        {icon:'🌿',n:'Chá Verde Studio',loc:'Jardins, São Paulo',d:'Espaço dedicado à cultura do chá. Cursos de cerimônia japonesa e chinesa. Degustações mensais com chás de origem verificada.'},
        {icon:'🏔',n:'Comunidade Japonesa de Registro',loc:'Vale do Ribeira, São Paulo',d:'Maior comunidade japonesa rural do Brasil. Realizações de Chaji completo em datas especiais. Contato direto com a tradição viva.'},
        {icon:'🎋',n:'Instituto Brasil-Japão',loc:'Várias cidades',d:'Programação cultural regular inclui demonstrações de Chanoyu. Contato via site do Instituto.'},
      ].map(p=>`<div class="cer-place-card"><div class="cer-place-icon">${p.icon}</div><div><div class="cer-place-name">${p.n}</div><div class="cer-place-loc">${p.loc}</div><div class="cer-place-desc">${p.d}</div></div></div>`).join('')}
    </div>
    <div class="cer-section">
      <div class="cer-section-title">Experiências internacionais</div>
      ${[
        {icon:'🗾',n:'Urasenke — Kyoto, Japão',loc:'Kyoto, Japão',d:'Uma das três principais escolas de Chanoyu. Aceita visitantes para demonstrações. O lugar mais autêntico para vivenciar a cerimônia em seu contexto original.'},
        {icon:'🏯',n:'Kenroku-en Garden — Kanazawa',loc:'Kanazawa, Japão',d:'Um dos três mais belos jardins japoneses. Casa de chá tradicional dentro do jardim. Demonstrações regulares em inglês e japonês.'},
        {icon:'🐉',n:'Wuyishan Tea Villages — Fujian',loc:'Fujian, China',d:'Berço do oolong. Visitas às plantações e cerimônias Gongfu Cha com os próprios produtores. Experiência imersiva de 2-5 dias.'},
        {icon:'☁️',n:'Ali Shan Tea Houses — Taiwan',loc:'Alishan, Taiwan',d:'A 2200m de altitude, casas de chá servem High Mountain Oolongs colhidos localmente. Uma das experiências de chá mais especiais do mundo.'},
        {icon:'🏔',n:'Darjeeling Tea Estates — Índia',loc:'Darjeeling, Índia',d:'Fazendas históricas como Makaibari e Margaret Hope recebem visitantes. Tour completo da colheita ao processamento, com degustação.'},
      ].map(p=>`<div class="cer-place-card"><div class="cer-place-icon">${p.icon}</div><div><div class="cer-place-name">${p.n}</div><div class="cer-place-loc">${p.loc}</div><div class="cer-place-desc">${p.d}</div></div></div>`).join('')}
    </div>
    <div class="cer-section">
      <div class="cer-section-title">Como começar em casa</div>
      <div class="cer-item"><div class="cer-item-name">Kit mínimo para iniciar</div><div class="cer-item-desc">Chawan (tigela) · Chasen (batedor) · Matcha de qualidade · Água filtrada · Intenção de estar presente. Isso é suficiente. A cerimônia não exige riqueza — exige atenção.</div></div>
      <div class="cer-item"><div class="cer-item-name">Livros recomendados</div><div class="cer-item-desc">"O Livro do Chá" — Kakuzo Okakura (1906, clássico essencial) · "The Way of Tea" — Aaron Fisher · "Tea Horse Road" — Jeff Fuchs · "The Story of Tea" — Mary Lou Heiss</div></div>
    </div>`;
}

// ════════════════════════════════════════
// ── MARKETPLACE ──
// ════════════════════════════════════════
const MKT_PRODUCTS = [
  // Infusões premium
  {id:101,cat:'Infusões',type:'Chá Tradicional',name:'Gyokuro Uji Premium',seller:'TeaImport',icon:'🍵',price:189.90,unit:'30g',desc:'Chá verde japonês cultivado à sombra. Sabor umami intenso, baixo amargor. Colheita First Flush 2024.',badge:'new',stock:'in'},
  {id:102,cat:'Infusões',type:'Chá Tradicional',name:'Ali Shan Oolong High Mountain',seller:'TeaImport',icon:'☁️',price:245.00,unit:'50g',desc:'Cultivado a 2200m. Floral e cremoso. Um dos oolongs mais apreciados do mundo.',badge:'',stock:'in'},
  {id:103,cat:'Infusões',type:'Chá Tradicional',name:'Bai Hao Yinzhen — Agulha de Prata',seller:'TeaImport',icon:'🤍',price:320.00,unit:'25g',desc:'Chá branco mais nobre. Brotos cobertos por pelos brancos. Fujian, China.',badge:'',stock:'in'},
  {id:104,cat:'Infusões',type:'Pu-erh',name:'Menghai Pu-erh Sheng 2018',seller:'TeaImport',icon:'🟤',price:185.00,unit:'100g',desc:'Pu-erh cru com 6 anos de envelhecimento. Terroso, mineral, complexo. Melhor com o tempo.',badge:'',stock:'in'},
  {id:105,cat:'Infusões',type:'Blend Artesanal',name:'Blend Noite Serena',seller:'Ervas & Raízes',icon:'🌙',price:45.90,unit:'60g',desc:'Camomila + Maracujá + Melissa + Alfazema. Blend para sono profundo e noites tranquilas.',badge:'eco',stock:'in'},
  {id:106,cat:'Infusões',type:'Blend Artesanal',name:'Masala Chai Original',seller:'Verde Vivo',icon:'🌶',price:38.90,unit:'80g',desc:'Chá preto Assam + gengibre + cardamomo + canela + cravo + pimenta. Receita indiana tradicional.',badge:'',stock:'in'},
  {id:107,cat:'Infusões',type:'Blend Artesanal',name:'Blend Imunidade Verde',seller:'Ervas & Raízes',icon:'🛡',price:52.00,unit:'70g',desc:'Equinácea + Cúrcuma + Gengibre + Tomilho. Fortalecedor de defesas para o inverno.',badge:'eco',stock:'in'},
  {id:108,cat:'Infusões',type:'Herbal',name:'Rooibos Baunilha & Laranja',seller:'TeaImport',icon:'🍊',price:42.00,unit:'80g',desc:'Rooibos orgânico da África do Sul com baunilha natural e raspas de laranja. Sem cafeína.',badge:'',stock:'in'},

  // Equipamentos
  {id:201,cat:'Equipamentos',type:'Bule',name:'Bule Yixing Zisha Autêntico',seller:'TeaImport',icon:'🫖',price:485.00,unit:'150ml',desc:'Argila Zisha genuína de Yixing. Artesanal. Poroso: absorve o sabor e melhora com o uso. Ideal para oolongs.',badge:'',stock:'in'},
  {id:202,cat:'Equipamentos',type:'Bule',name:'Tetsubin Japonês — Ferro Fundido',seller:'TeaImport',icon:'🔵',price:680.00,unit:'600ml',desc:'Bule de ferro fundido japonês. Mantém temperatura por horas. Não enferrujar em uso regular.',badge:'',stock:'in'},
  {id:203,cat:'Equipamentos',type:'Matcha',name:'Kit Matcha Completo',seller:'TeaImport',icon:'🍵',price:220.00,unit:'kit',desc:'Chawan (tigela), Chasen (batedor 80 fios), Chashaku (colher) e suporte. Tudo para iniciar o ritual.',badge:'new',stock:'in'},
  {id:204,cat:'Equipamentos',type:'Infusor',name:'Infusor Gooseneck Elétrico',seller:'PhytoFarm',icon:'⚡',price:340.00,unit:'1L',desc:'Controle de temperatura preciso (60-100°C). Pescoço de cisne para fluxo suave. Essencial para chás premium.',badge:'',stock:'in'},
  {id:205,cat:'Equipamentos',type:'Acessório',name:'Tabuleiro de Bambu Gongfu',seller:'TeaImport',icon:'🎋',price:175.00,unit:'35x20cm',desc:'Tabuleiro de bambu com reservatório integrado. Inclui 4 xícaras de argilite. Cerimônia completa.',badge:'',stock:'in'},
  {id:206,cat:'Equipamentos',type:'Armazenamento',name:'Lata Washi Paper — set 3',seller:'Ervas & Raízes',icon:'📦',price:95.00,unit:'set 3 latas',desc:'Latas vedadas com papel washi japonês. Protegem da luz e umidade. Capacidade 50-100g cada.',badge:'',stock:'in'},
  {id:207,cat:'Equipamentos',type:'Termômetro',name:'Termômetro Digital para Chá',seller:'PhytoFarm',icon:'🌡',price:85.00,unit:'1 unid',desc:'Leitura instantânea. Essencial para chás brancos e verdes que exigem temperatura precisa.',badge:'',stock:'in'},
  {id:208,cat:'Equipamentos',type:'Balança',name:'Balança de Precisão 0.1g',seller:'PhytoFarm',icon:'⚖️',price:120.00,unit:'1 unid',desc:'Precisão de 0.1g. Para dosagem exata — especialmente para Pu-erh e matcha.',badge:'',stock:'in'},

  // Vivências
  {id:301,cat:'Vivências',type:'Workshop',name:'Cerimônia Chanoyu — São Paulo',seller:'Instituto Brasil-Japão',icon:'🎋',price:180.00,unit:'por pessoa',desc:'Workshop de 3h com mestre certificado. Inclui degustação de matcha e wagashi. Turmas de 8 pessoas.',badge:'exp',stock:'in'},
  {id:302,cat:'Vivências',type:'Curso',name:'Gongfu Cha — 4 aulas',seller:'Chá Verde Studio',icon:'🐉',price:420.00,unit:'4 sessões',desc:'Aprenda a cerimônia chinesa do zero. Inclui bule Gaiwan para praticar em casa. Certificado de conclusão.',badge:'exp',stock:'in'},
  {id:303,cat:'Vivências',type:'Degustação',name:'Oolong Journey — Degustação',seller:'TeaImport',icon:'☁️',price:150.00,unit:'por pessoa',desc:'Degustação guiada de 6 oolongs de Taiwan e Fujian. Do mais leve ao mais torrado. 2 horas.',badge:'new',stock:'in'},
  {id:304,cat:'Vivências',type:'Degustação',name:'Pu-erh Vertical Tasting',seller:'TeaImport',icon:'🟤',price:280.00,unit:'por pessoa',desc:'Degustação vertical de Pu-erh de 2015 a 2005. Aprenda a perceber o envelhecimento. Para entusiastas.',badge:'exp',stock:'in'},
  {id:305,cat:'Vivências',type:'Retiro',name:'Retiro do Chá — Serra da Cantareira',seller:'Chá Verde Studio',icon:'🌿',price:890.00,unit:'fim de semana',desc:'Retiro de 2 dias em sítio. Cerimônia ao amanhecer, blending, meditação com chá. 12 participantes máx.',badge:'exp',stock:'in'},

  // Viagens
  {id:401,cat:'Viagens',type:'Tour Tea',name:'Japão — Rota do Chá Kyoto-Uji',seller:'Tea Travels',icon:'🗾',price:12500.00,unit:'7 dias/pessoa',desc:'Visita às plantações de Uji, cerimônia Urasenke, mercado Nishiki, chashitsu histórico. Guia especializado.',badge:'exp',stock:'in'},
  {id:402,cat:'Viagens',type:'Tour Tea',name:'Taiwan — High Mountain Oolongs',seller:'Tea Travels',icon:'🏔',price:8900.00,unit:'5 dias/pessoa',desc:'Ali Shan, Li Shan, Pinglin. Visitas a produtores independentes. Degustação de altitude. 8 pessoas máx.',badge:'exp',stock:'in'},
  {id:403,cat:'Viagens',type:'Tour Tea',name:'Darjeeling — Colheita First Flush',seller:'Tea Travels',icon:'🌱',price:9800.00,unit:'6 dias/pessoa',desc:'Participação na colheita em fazenda histórica. Processamento artesanal. Degustação de 15 lotes diferentes.',badge:'new',stock:'in'},
  {id:404,cat:'Viagens',type:'Tour Tea',name:'Yunnan — Rota do Pu-erh',seller:'Tea Travels',icon:'🐉',price:11200.00,unit:'8 dias/pessoa',desc:'Xishuangbanna, árvores centenárias, produtores tradicionais, aldeias Dai. A rota mais completa para o Pu-erh.',badge:'exp',stock:'in'},
  {id:405,cat:'Viagens',type:'Tour Tea',name:'Fujian — Oolongs e Wuyishan',seller:'Tea Travels',icon:'⛰',price:9200.00,unit:'6 dias/pessoa',desc:'Anxi (Tie Guan Yin), Wuyi (Da Hong Pao), Fujian coastline. Inclui visita a fábrica artesanal centenária.',badge:'',stock:'in'},

  // Ervas & Acessórios (loja Ervatório — fornecedores cadastrados)
  {id:501,cat:'Ervas & Acessórios',type:'Folhas Secas',name:'Camomila Orgânica',seller:'Ervas & Raízes',icon:'🌼',price:12.90,unit:'50g',desc:'Flores de camomila orgânicas, colhidas e secas artesanalmente. Calmante suave para o dia a dia.',badge:'eco',stock:'in',supId:1},
  {id:502,cat:'Ervas & Acessórios',type:'Folhas Secas',name:'Melissa Premium',seller:'Ervas & Raízes',icon:'🍃',price:14.50,unit:'30g',desc:'Melissa (erva-cidreira) selecionada. Notas cítricas e suaves, ideal para relaxamento.',badge:'',stock:'in',supId:1},
  {id:503,cat:'Ervas & Acessórios',type:'Blend Artesanal',name:'Blend Serenidade',seller:'Ervas & Raízes',icon:'💜',price:28.90,unit:'60g',desc:'Mix artesanal de camomila, lavanda e melissa. Companhia perfeita para o fim do dia.',badge:'',stock:'in',supId:1},
  {id:504,cat:'Ervas & Acessórios',type:'Folhas Secas',name:'Boldo do Chile',seller:'Casa das Plantas',icon:'🍃',price:8.90,unit:'50g',desc:'Boldo chileno tradicional. Digestivo clássico, amargo característico.',badge:'',stock:'in',supId:2},
  {id:505,cat:'Ervas & Acessórios',type:'Folhas Secas',name:'Guaco 100% Natural',seller:'Casa das Plantas',icon:'🌿',price:11.90,unit:'40g',desc:'Guaco natural, tradicionalmente usado em infusões para o sistema respiratório.',badge:'',stock:'low',supId:2},
  {id:506,cat:'Ervas & Acessórios',type:'Extrato',name:'Ginkgo Biloba Extrato',seller:'Phytofarm Brasil',icon:'🍃',price:34.90,unit:'30g',desc:'Extrato padronizado de Ginkgo Biloba. Memória, circulação e foco.',badge:'',stock:'in',supId:3},
  {id:507,cat:'Ervas & Acessórios',type:'Pó',name:'Ashwagandha Raiz Pó',seller:'Phytofarm Brasil',icon:'🌿',price:42.90,unit:'100g',desc:'Raiz de Ashwagandha em pó. Adaptógeno ayurvédico tradicional para estresse e energia.',badge:'',stock:'in',supId:3},
  {id:508,cat:'Ervas & Acessórios',type:'Folhas Secas',name:'Valeriana Orgânica',seller:'Phytofarm Brasil',icon:'🌸',price:18.90,unit:'30g',desc:'Raiz de valeriana orgânica. Auxilia no relaxamento e sono profundo.',badge:'eco',stock:'in',supId:3},
  {id:509,cat:'Ervas & Acessórios',type:'Blend Artesanal',name:'Cúrcuma + Pimenta',seller:'Verde Vivo',icon:'🫚',price:22.90,unit:'80g',desc:'Blend de cúrcuma com pimenta-preta para potencializar a absorção de curcumina. Anti-inflamatório.',badge:'',stock:'in',supId:4},
  {id:510,cat:'Ervas & Acessórios',type:'Especiaria',name:'Gengibre Desidratado',seller:'Verde Vivo',icon:'🫚',price:16.90,unit:'100g',desc:'Gengibre desidratado em pedaços. Aquecedor, digestivo, ideal para chás de inverno.',badge:'',stock:'in',supId:4},
  {id:511,cat:'Ervas & Acessórios',type:'Flores',name:'Hibisco Flores Secas',seller:'Verde Vivo',icon:'🌺',price:13.90,unit:'40g',desc:'Flores de hibisco secas. Infusão rubi, notas cítricas, termogênico natural.',badge:'',stock:'in',supId:4},
  {id:512,cat:'Ervas & Acessórios',type:'Chá Tradicional',name:'Chá Verde Sencha',seller:'TeaImport',icon:'🍵',price:38.90,unit:'50g',desc:'Sencha japonês de qualidade diária. Verde vivo, notas herbáceas e levemente vegetais.',badge:'',stock:'in',supId:6},
  {id:513,cat:'Ervas & Acessórios',type:'Herbal',name:'Rooibos Orgânico',seller:'TeaImport',icon:'🍃',price:29.90,unit:'80g',desc:'Rooibos orgânico da África do Sul. Sem cafeína, doce natural, bom a qualquer hora.',badge:'eco',stock:'in',supId:6},
  {id:514,cat:'Ervas & Acessórios',type:'Chá Tradicional',name:'Hibisco Azul',seller:'TeaImport',icon:'💙',price:45.90,unit:'30g',desc:'Butterfly Pea. Muda de cor com limão, rico em antioxidantes. Efeito visual incrível.',badge:'new',stock:'low',supId:6},
  {id:515,cat:'Ervas & Acessórios',type:'Kit',name:'Kit Blend Digestivo',seller:'Verde Vivo',icon:'🌿',price:54.90,unit:'kit 3 ervas',desc:'Trio de ervas digestivas selecionadas: hortelã-pimenta, erva-doce e gengibre.',badge:'',stock:'in',supId:4},
  {id:516,cat:'Ervas & Acessórios',type:'Acessório',name:'Infusor Aço Inox',seller:'Ervas & Raízes',icon:'🫖',price:24.90,unit:'1 unid',desc:'Infusor de aço inox com tampa. Ideal para ervas soltas em xícara ou bule.',badge:'',stock:'in',supId:1},
];

let mktCatActive='Todos', mktSearchVal='';
const MKT_CATS=[{id:'Todos',icon:'✦'},{id:'Ervas & Acessórios',icon:'🌿'},{id:'Infusões',icon:'🍵'},{id:'Equipamentos',icon:'🫖'},{id:'Vivências',icon:'🎋'},{id:'Viagens',icon:'✈️'}];

function initMkt(){
  const catsEl=document.getElementById('mktCats'); if(!catsEl)return;
  catsEl.innerHTML='';
  MKT_CATS.forEach(c=>{
    const b=document.createElement('button');
    b.className='mkt-cat'+(mktCatActive===c.id?' on':'');
    b.innerHTML=`${c.icon} ${c.id}`;
    b.onclick=()=>{mktCatActive=c.id;initMkt();};
    catsEl.appendChild(b);
  });
  renderMkt();
  const mktC=document.getElementById('mktCartCount');
  if(mktC){const total=cart.reduce((s,c)=>s+c.qty,0); mktC.textContent=total?`(${total})`:'';};
}

// Onda 6.1 (backlog #3): produtos is_test ficam fora da vitrine
// pública e do fluxo de compra. Para enxergá-los em staging/QA,
// ligue SHOW_TEST_PRODUCTS:true em js/config.js.
function mktIsVisible(p){
  // Indicação só aparece com o interruptor ligado. Falha para escondido: sem a
  // resposta do banco, `ERV_INTERRUPTORES.indicacao` é undefined e o card não
  // entra — a rota de redirecionamento recusaria o clique de qualquer forma, e
  // um card que não leva a lugar nenhum é pior do que card nenhum.
  if(mktEhIndicacao(p) && window.ERV_INTERRUPTORES?.indicacao !== true) return false;
  return !p.is_test || window.ERVATORIO_CONFIG?.SHOW_TEST_PRODUCTS === true;
}

// ── Indicação: o parceiro vende, nós encaminhamos ──────────────────────
//
// A regra de negócio inteira cabe em três funções, e o que ela decide é o que
// o visitante vê. Quem RECUSA a compra é a `create-order` — isto aqui é UX, e
// a distinção importa porque o carrinho mora no localStorage e é editável.

function mktEhIndicacao(p){
  return p && p.modo_de_venda === 'indicacao';
}

/**
 * O link do card passa pela nossa rota, com o **id do produto**.
 *
 * Nunca a URL do parceiro na query: isso faria um redirecionador aberto, um
 * link que começa no nosso domínio e termina onde o atacante quiser. E nunca o
 * `href` direto para o parceiro, porque aí não há o que medir — e sem medida a
 * comissão vira negociação sobre memória.
 */
function mktLinkDeIndicacao(p){
  const base=window.ERVATORIO_CONFIG?.FUNCTIONS_URL;
  if(!base||!p.dbId)return '';
  return `${base}/indicacao?produto=${encodeURIComponent(p.dbId)}`;
}

/**
 * Por que o card de indicação NÃO mostra preço.
 *
 * Não é economia de espaço: o contrato do Amazon Associates proíbe exibir
 * preço que não venha da API deles em tempo real, e o mesmo vale, com outras
 * palavras, nos programas do Mercado Livre. Preço guardado no nosso banco
 * envelhece — e um preço errado na vitrine é, além de quebra de contrato, a
 * reclamação mais previsível que existe: a pessoa clica esperando um valor e
 * encontra outro.
 *
 * O dia em que houver integração com a API de preço deles, isto muda. Até lá,
 * a ausência é a informação honesta.
 */
function mktRotuloDeIndicacao(p){
  return `Vendido por ${esc(p.parceiro||p.seller||'parceiro')}`;
}

// ── Onda 7 (backlog #45, #48, #52): escassez, ficha e relacionados ──
function mktStockBadge(p){
  if(p.stock==='out')return '<span class="mkt-badge" style="background:rgba(220,90,90,.15);color:#e08080;border:1px solid rgba(220,90,90,.35);margin-left:6px">Esgotado</span>';
  if(p.stock==='low')return '<span class="mkt-badge" style="background:rgba(212,168,90,.15);color:#d4a85a;border:1px solid rgba(212,168,90,.35);margin-left:6px">⚡ Últimas unidades</span>';
  return '';
}

// Link produto → ficha E-E-A-T correspondente (reverso da Onda 6.2).
function mktFichaSlug(p){
  if(typeof FICHAS_ANCORA==='undefined')return null;
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const alvo=norm(p.name);
  for(const [slug,f] of Object.entries(FICHAS_ANCORA)){
    const fn=norm(f.nome_popular);
    if(fn===alvo||alvo.indexOf(fn+' ')===0||fn.indexOf(alvo+' ')===0)return slug;
  }
  return null;
}
function mktFichaLink(p){
  const slug=mktFichaSlug(p);
  if(!slug)return '';
  return `<a href="#ficha/${slug}" onclick="document.getElementById('mktDetailOverlay')?.remove()" style="display:inline-block;font-size:.75rem;color:var(--gold2);text-decoration:underline;margin-bottom:1rem">📖 Ver ficha completa — ciência, preparo e contraindicações</a>`;
}

// "Você também pode gostar": mesma categoria, curadoria simples.
function mktRelatedHtml(p){
  if(typeof MKT_PRODUCTS==='undefined')return '';
  const rel=MKT_PRODUCTS.filter(x=>x.id!==p.id&&mktIsVisible(x)&&x.cat===p.cat).slice(0,4);
  if(!rel.length)return '';
  return `<div style="border-top:0.5px solid var(--faint);margin-top:1.25rem;padding-top:1rem">
    <div style="font-family:'Jost',sans-serif;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:.6rem">Você também pode gostar</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${rel.map(x=>
      `<button onclick="openMktDetail(${x.id})" style="background:rgba(255,255,255,.04);border:0.5px solid var(--faint);border-radius:10px;padding:8px 12px;color:var(--cream2);font-size:.75rem;font-family:'Jost',sans-serif;cursor:pointer;text-align:left">
        ${x.icon} ${esc(x.name)}<br><span style="color:var(--gold2)">R$ ${Number(x.price).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
      </button>`).join('')}</div>
  </div>`;
}

function renderMkt(){
  const q=(document.getElementById('mktSearch')?.value||'').toLowerCase();
  const grid=document.getElementById('mktGrid'); if(!grid)return;
  let list=MKT_PRODUCTS.filter(p=>{
    if(!mktIsVisible(p))return false;
    if(mktCatActive!=='Todos'&&p.cat!==mktCatActive)return false;
    if(q&&!(p.name+p.desc+p.seller+p.type).toLowerCase().includes(q))return false;
    return true;
  });

  // Group by type within category
  if(mktCatActive==='Todos'){
    const groups={};
    list.forEach(p=>{if(!groups[p.cat])groups[p.cat]=[];groups[p.cat].push(p);});
    grid.innerHTML=Object.entries(groups).map(([cat,items])=>`
      <div class="mkt-section-title">${MKT_CATS.find(c=>c.id===cat)?.icon||'✦'} ${cat}</div>
      <div class="mkt-grid">${items.slice(0,4).map(p=>mktCard(p)).join('')}</div>`).join('');
  } else {
    grid.innerHTML=`<div class="mkt-grid">${list.map(p=>mktCard(p)).join('')}</div>`;
  }
}

function mktCard(p){
  const inCart=cart.some(c=>c.id===p.id);
  const typeColor=p.cat==='Infusões'?'#4a8a5a':p.cat==='Equipamentos'?'#4a6a9a':p.cat==='Vivências'?'#9a6a3a':p.cat==='Ervas & Acessórios'?'#5a8a3a':'#6a4a9a';
  const badgeHtml=p.badge==='new'?'<span class="mkt-badge mkt-badge-new">Novo</span>':p.badge==='exp'?'<span class="mkt-badge mkt-badge-exp">Experiência</span>':p.badge==='eco'?'<span class="mkt-badge mkt-badge-eco">Orgânico</span>':'';
  const testBadge=p.is_test?'<span class="mkt-badge" style="background:rgba(100,100,200,.15);color:#a0a8e0;border:1px solid rgba(100,100,200,.3)">TESTE</span>':'';
  const imgs=p.images&&p.images.length?p.images:[];
  // onerror robusto: o responsive-img embrulha o <img> em <picture>, então
  // localizamos o emoji de fallback pelo container .mkt-card-media.
  const onErr="var m=this.closest('.mkt-card-media');this.style.display='none';var e=m&&m.querySelector('[data-emoji]');if(e)e.style.display='flex'";
  const emojiSpan=`<span data-emoji style="font-size:2.8rem;display:none;align-items:center;justify-content:center;width:100%;height:100%" aria-hidden="true">${p.icon}</span>`;
  let mediaHtml;
  if(imgs[0]){
    // Imagens explícitas (produtos cadastrados via admin/Supabase).
    mediaHtml=`<img src="${imgs[0]}" data-img-idx="0" data-pid="${p.id}" alt="${esc(p.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="${onErr}">${emojiSpan}`;
  } else {
    // Produtos-semente: imagem editorial por convenção (images/marketplace/<id>.png),
    // upgradada para WebP responsivo pelo responsive-img.js; emoji como fallback.
    const key='images/marketplace/'+p.id+'.png';
    mediaHtml=`<img data-responsive="${key}" data-pid="${p.id}" alt="${esc(p.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="${onErr}">${emojiSpan}`;
  }
  const dots=imgs.length>1?`<div class="mkt-img-dots">${imgs.map((_,i)=>`<span class="mkt-img-dot${i===0?' on':''}" data-i="${i}"></span>`).join('')}</div>`:'';
  return `<div class="mkt-card">
    <div class="mkt-card-media" style="background:${typeColor}18;position:relative;cursor:${imgs.length>1?'pointer':'default'}" onclick="cycleCardImg(this,${p.id})">${mediaHtml}${dots}</div>
    <div class="mkt-card-body" style="cursor:pointer" onclick="openMktDetail(${p.id})">
      <div class="mkt-card-type" style="color:${typeColor}">${p.type} ${badgeHtml} ${testBadge}</div>
      <div class="mkt-card-name">${p.name}</div>
      <div class="mkt-card-seller">${p.seller}</div>
      <div class="mkt-card-desc">${p.desc.substring(0,90)}${p.desc.length>90?'...':''}</div>
      <div class="mkt-card-footer">${mktCardFooter(p,inCart)}</div>
    </div>
  </div>`;
}

/**
 * O rodapé do card muda inteiro na indicação: sai preço, sai carrinho, entra o
 * destino. É deliberado que as duas formas não se pareçam — o visitante precisa
 * saber ANTES de clicar que vai sair do nosso site, e um botão idêntico ao de
 * comprar prometeria o contrário.
 *
 * `rel="sponsored nofollow noopener"`: `sponsored` porque é link remunerado e
 * omitir isso é o que o Google chama de esquema de links; `noopener` porque
 * `target=_blank` sem ele entrega ao destino um `window.opener` que consegue
 * trocar a nossa aba de endereço.
 */
function mktCardFooter(p,inCart){
  if(mktEhIndicacao(p)){
    const href=mktLinkDeIndicacao(p);
    if(!href)return `<div class="mkt-card-price-sub">Indisponível no momento</div>`;
    return `<div style="min-width:0">
        <div class="mkt-card-price-sub">${mktRotuloDeIndicacao(p)}</div>
      </div>
      <a class="mkt-add-btn" href="${href}" target="_blank" rel="sponsored nofollow noopener"
         onclick="event.stopPropagation()"
         style="text-decoration:none;display:inline-flex;align-items:center;white-space:nowrap">Ver na loja ↗</a>`;
  }
  return `<div>
      <div class="mkt-card-price">R$ ${p.price.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
      <span class="mkt-card-price-sub">${p.unit}</span>
    </div>
    <button class="mkt-add-btn ${inCart?'added':''}" onclick="event.stopPropagation();addMktCart(${p.id})">${inCart?'✓ Adicionado':'+ Carrinho'}</button>`;
}

function cycleCardImg(mediaEl, pid){
  const p=MKT_PRODUCTS.find(x=>x.id===pid);
  if(!p||!p.images||p.images.length<2)return;
  const img=mediaEl.querySelector('img');
  if(!img)return;
  const cur=parseInt(img.getAttribute('data-img-idx')||'0');
  const next=(cur+1)%p.images.length;
  img.src=p.images[next];
  img.setAttribute('data-img-idx',next);
  mediaEl.querySelectorAll('.mkt-img-dot').forEach((d,i)=>d.classList.toggle('on',i===next));
}

/**
 * A área de compra do detalhe — a mesma bifurcação do card, e pelo mesmo
 * motivo. Aqui o aviso é explícito: quem vende, quem cobra e quem entrega é o
 * parceiro. Numa reclamação, «eu achei que era de vocês» é a primeira frase, e
 * ela é evitável com uma linha de texto.
 */
function mktDetalheCompra(p,inCart){
  if(mktEhIndicacao(p)){
    const href=mktLinkDeIndicacao(p);
    return `<div style="min-width:0">
        <div style="font-size:.78rem;color:var(--cream2)">${mktRotuloDeIndicacao(p)}</div>
        <span style="font-size:.65rem;color:var(--muted)">A compra, o pagamento e a entrega acontecem no site do parceiro.</span>
      </div>
      ${href
        ? `<a href="${href}" target="_blank" rel="sponsored nofollow noopener" style="padding:10px 20px;background:rgba(200,168,75,.2);border:0.5px solid rgba(200,168,75,.4);border-radius:var(--r-sm);color:var(--gold2);font-size:.8rem;font-family:'Jost',sans-serif;cursor:pointer;text-decoration:none;white-space:nowrap">Ver na loja ↗</a>`
        : `<span style="font-size:.7rem;color:var(--muted)">Indisponível no momento</span>`}`;
  }
  return `<div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:var(--gold2)">R$ ${p.price.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
      <span style="font-size:.65rem;color:var(--muted)">${p.unit} · Pix ou cartão via Mercado Pago</span>
    </div>
    <div style="display:flex;gap:8px">
      <button class="mkt-add-btn ${inCart?'added':''}" id="mktDetailCartBtn" onclick="addMktCartFromDetail(${p.id})" ${p.stock==='out'?'disabled':''} style="padding:10px 20px;font-size:.8rem${p.stock==='out'?';opacity:.45;cursor:not-allowed':''}">${p.stock==='out'?'Esgotado':inCart?'✓ Adicionado':'+ Carrinho'}</button>
      <button onclick="addMktCartFromDetail(${p.id},true)" ${p.stock==='out'?'disabled':''} style="padding:10px 20px;background:rgba(200,168,75,.2);border:0.5px solid rgba(200,168,75,.4);border-radius:var(--r-sm);color:var(--gold2);font-size:.8rem;font-family:'Jost',sans-serif;cursor:pointer${p.stock==='out'?';opacity:.45;cursor:not-allowed':''}">Comprar agora</button>
    </div>`;
}

function openMktDetail(pid){
  const p=MKT_PRODUCTS.find(x=>x.id===pid);
  if(!p||!mktIsVisible(p))return;
  window.ervTrack&&ervTrack('view_item',{currency:'BRL',value:p.price,items:[{item_id:String(p.dbId||p.id),item_name:p.name,price:p.price,quantity:1}]});
  const typeColor=p.cat==='Infusões'?'#4a8a5a':p.cat==='Equipamentos'?'#4a6a9a':p.cat==='Vivências'?'#9a6a3a':p.cat==='Ervas & Acessórios'?'#5a8a3a':'#6a4a9a';
  const imgs=p.images&&p.images.length?p.images:[];
  const inCart=cart.some(c=>c.id===p.id);
  const testBadge=p.is_test?'<span class="mkt-badge" style="background:rgba(100,100,200,.15);color:#a0a8e0;border:1px solid rgba(100,100,200,.3);margin-left:6px">TESTE</span>':'';
  const photoHtml=imgs[0]
    ?`<div style="position:relative;width:100%;border-radius:var(--r-lg);overflow:hidden;margin-bottom:.75rem">
        <div id="mktDetailPhoto" style="width:100%;aspect-ratio:4/3;background:#111">
          <img id="mktDetailImg" src="${imgs[0]}" data-idx="0" alt="${esc(p.name)}" style="width:100%;height:100%;object-fit:cover">
        </div>
        ${imgs.length>1?`<div class="mkt-img-dots">${imgs.map((_,i)=>`<span class="mkt-img-dot${i===0?' on':''}" onclick="switchDetailImg(${i})" style="cursor:pointer"></span>`).join('')}</div>`:''}
      </div>`
    :`<div style="width:100%;aspect-ratio:4/3;background:${typeColor}18;border-radius:var(--r-lg);display:flex;align-items:center;justify-content:center;font-size:5rem;margin-bottom:.75rem">${p.icon}</div>`;
  const existing=document.getElementById('mktDetailOverlay');
  if(existing)existing.remove();
  const overlay=document.createElement('div');
  overlay.id='mktDetailOverlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center;padding:0';
  overlay.innerHTML=`
    <div style="background:var(--bg2);border-radius:var(--r-lg) var(--r-lg) 0 0;width:100%;max-width:540px;max-height:90vh;overflow-y:auto;padding:1.5rem 1.25rem 2rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <span style="font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:${typeColor}">${p.cat}</span>
        <button onclick="document.getElementById('mktDetailOverlay').remove()" aria-label="Fechar detalhes do produto" style="background:none;border:none;color:var(--muted);font-size:1.2rem;cursor:pointer;padding:0 4px">✕</button>
      </div>
      ${photoHtml}
      <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:400;color:var(--cream);margin:0 0 .3rem">${p.name}${testBadge}${mktStockBadge(p)}</h2>
      <div style="font-size:.72rem;color:var(--muted);margin-bottom:.75rem">${p.seller} · ${p.unit}</div>
      <p style="font-size:.82rem;color:var(--cream2);line-height:1.65;margin-bottom:1.25rem">${p.desc}</p>
      ${mktFichaLink(p)}
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:1rem;border-top:0.5px solid var(--faint)">
        ${mktDetalheCompra(p,inCart)}
      </div>
      <div id="mktReviews"></div>
      ${mktRelatedHtml(p)}
    </div>`;
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
  window._mktDetailPid=pid;
  // Onda 7.2: avaliações (assíncrono; some sozinho se não há dbId)
  if(window.Reviews)Reviews.renderInto('mktReviews',p);
}

function switchDetailImg(idx){
  const p=MKT_PRODUCTS.find(x=>x.id===window._mktDetailPid);
  if(!p||!p.images[idx])return;
  const img=document.getElementById('mktDetailImg');
  if(img){img.src=p.images[idx];img.setAttribute('data-idx',idx);}
  document.querySelectorAll('#mktDetailOverlay .mkt-img-dot').forEach((d,i)=>d.classList.toggle('on',i===idx));
}

function addMktCartFromDetail(pid, checkout=false){
  addMktCart(pid);
  if(checkout){document.getElementById('mktDetailOverlay')?.remove();showSection('checkout');}
  else{
    const btn=document.getElementById('mktDetailCartBtn');
    if(btn){btn.textContent='✓ Adicionado';btn.classList.add('added');}
  }
}

function addMktCart(id){
  const p=MKT_PRODUCTS.find(x=>x.id===id); if(!p||!mktIsVisible(p))return;
  // Indicação não entra no carrinho. A tela nem oferece o botão, mas esta
  // função é global e alcançável — e um item de indicação no carrinho
  // atravessaria o checkout inteiro para ser recusado só na create-order,
  // depois de o visitante ter digitado endereço e escolhido frete.
  if(mktEhIndicacao(p)){toast(`${p.name} é vendido pelo parceiro — abra a loja dele para comprar.`);return;}
  const ex=cart.find(c=>c.id===id);
  if(ex)ex.qty++; else cart.push({...p,qty:1});
  window.ervTrack&&ervTrack('add_to_cart',{currency:'BRL',value:p.price,items:[{item_id:String(p.dbId||p.id),item_name:p.name,price:p.price,quantity:1}]});
  localStorage.setItem('erb_cart',JSON.stringify(cart));
  updateCartCount(); renderMkt(); initMkt();
  toast(`${p.name} adicionado ao carrinho`);
}

// Recompra ("comprar de novo"): re-adiciona ao carrinho os itens de um
// pedido que AINDA existem no catálogo atual (casados por dbId, usando o
// produto/preço vigentes). Itens fora de catálogo voltam em `missing`.
// Toda a lógica de carrinho mora aqui — app.js é o dono de `cart`.
window.recomprarPedido = function(items){
  const added=[], missing=[];
  (items||[]).forEach(function(it){
    const p = MKT_PRODUCTS.find(x=>x.dbId && x.dbId===it.product_id);
    if(!p){ missing.push(it.product_name); return; }
    // Um pedido antigo pode conter produto que DEPOIS passou a indicação —
    // vendemos, e mais tarde passamos a só encaminhar. Recomprar o traria de
    // volta ao carrinho por um caminho que não passa pelo card. Vai para
    // `missing`, que é onde a tela já explica que o item não está mais à venda.
    if(mktEhIndicacao(p)){ missing.push(it.product_name); return; }
    const qty = Math.max(1, Math.min(999, parseInt(it.qty,10)||1));
    const ex = cart.find(c=>c.id===p.id);
    if(ex) ex.qty+=qty; else cart.push({...p,qty});
    added.push(p.name);
    window.ervTrack&&ervTrack('add_to_cart',{currency:'BRL',value:p.price,items:[{item_id:String(p.dbId||p.id),item_name:p.name,price:p.price,quantity:qty}]});
  });
  if(added.length){
    localStorage.setItem('erb_cart',JSON.stringify(cart));
    updateCartCount();
    if(typeof renderMkt==='function' && document.getElementById('mktGrid')) renderMkt();
    openCart();
  }
  return { added, missing };
};

// ════════════════════════════════════════
// ��─ CHÁS DO MUNDO ──
// ════════════════════════════════════════
// Coordinates calibrated to the real map image (1330x840)
// cx/cy are fractions 0..1 of image width/height
const MUNDO_REGIONS=[
  {id:'china',   name:'China',        flag:'����🇳',cx:.755,cy:.315,color:'#c8382a',subtitle:'Berço do chá — 5000 anos de história',producao:'3.200.000 ton/ano',exportacao:'500.000 ton/ano',area:'3.200.000 ha',tipos:['Verde','Branco','Amarelo','Oolong','Preto','Pu-erh'],desc:'A China produz todos os seis tipos de chá verdadeiro. Única com essa distinção. Cada província tem identidade própria: Fujian para brancos e oolongs, Yunnan para Pu-erh, Zhejiang para Longjing.',chas:[{n:'Longjing (Dragon Well)',reg:'Zhejiang',tipo:'Verde',badge:'#4a7a3a',d:'O chá verde mais famoso. Folhas planas, sabor de castanha tostada.'},{n:'Tie Guan Yin',reg:'Anxi, Fujian',tipo:'Oolong',badge:'#2d5a7a',d:'Deusa da Misericórdia. Floral, cremoso. Ícone dos oolongs.'},{n:'Da Hong Pao',reg:'Wuyi, Fujian',tipo:'Oolong',badge:'#2d5a7a',d:'Manto Vermelho. Entre os mais caros do mundo.'},{n:'Keemun',reg:'Anhui',tipo:'Preto',badge:'#3a1a0a',d:'Notas de vinho e chocolate. Base do English Breakfast original.'},{n:'Pu-erh Sheng',reg:'Yunnan',tipo:'Escuro',badge:'#2a1a0a',d:'Envelhece como vinho. Mercado de investimento.'},{n:'Junshan Yinzhen',reg:'Hunan',tipo:'Amarelo',badge:'#a87a2a',d:'O chá amarelo mais raro. Produção < 500kg/ano.'}],ervas:[{n:'Chrysanthemum (Ju Hua)',d:'Flor seca usada em infusões. Refrescante, anti-inflamatória. Parte da MTC há séculos.'},{n:'Goji Berry (Gou Qi Zi)',d:'Baya adaptogênica. Longevidade, visão, imunidade. Usada em tônicos e blends.'},{n:'Ginseng (Ren Shen)',d:'O adaptógeno por excelência. Energia, foco, vitalidade. Símbolo da medicina tradicional.'},{n:'Osmanthus (Gui Hua)',d:'Flor perfumada para aromatizar tés. Notas de pêssego e damasco.'}],culinaria:'Chá é parte da vida cotidiana. Dim Sum sempre acompanhado de chá. Gongfu Cha é arte e filosofia.',brasil:'Comunidade chinesa em SP traz chás premium. Liberdade concentra lojas especializadas.'},
  {id:'japao',   name:'Japão',        flag:'🇯🇵',cx:.840,cy:.295,color:'#c8304a',subtitle:'A perfeição do chá verde — a Via do Chá',producao:'86.000 ton/ano',exportacao:'6.200 ton/ano',area:'44.000 ha',tipos:['Verde (80+ estilos)','Matcha'],desc:'O Japão transformou o chá verde em arte e filosofia. Mais de 80 estilos. Matcha virou fenômeno global. A cerimônia Chanoyu é patrimônio cultural imaterial.',chas:[{n:'Matcha',reg:'Uji, Kyoto',tipo:'Verde em pó',badge:'#2d5a2a',d:'Pó de tencha cultivada à sombra. 2.5mg de L-teanina por xícara.'},{n:'Gyokuro',reg:'Uji, Kyoto',tipo:'Verde premium',badge:'#2d5a2a',d:'Cultivado à sombra 20 dias. Sabor umami profundo.'},{n:'Sencha',reg:'Shizuoka',tipo:'Verde',badge:'#4a7a3a',d:'80% da produção japonesa. O chá cotidiano.'},{n:'Hojicha',reg:'Kyoto',tipo:'Verde torrado',badge:'#5a3a1a',d:'Sencha torrado. Baixa cafeína. Ideal à noite.'}],ervas:[{n:'Kuzu (Kudzu)',d:'Raiz medicinal. Usada em pós e infusões para digestão e ressaca.'},{n:'Beni Shoga',d:'Gengibre em conserva. Digestivo, anti-inflamatório.'},{n:'Sakura (Flor de Cerejeira)',d:'Petalas salgadas usadas em chás e sakura-yu. Ritual sazonal.'}],culinaria:'Matcha em sorvetes, confeitaria, cosméticos. Matcha latte virou fenômeno global.',brasil:'Maior comunidade japonesa fora do Japão em SP.'},
  {id:'india',   name:'Índia',        flag:'🇮🇳',cx:.640,cy:.385,color:'#e07820',subtitle:'Do Assam ao Darjeeling — a outra grande potência',producao:'1.390.000 ton/ano',exportacao:'250.000 ton/ano',area:'637.000 ha',tipos:['Preto','Verde','Oolong','Branco'],desc:'Segunda maior produtora mundial. Assam e Darjeeling definem o chá preto global. Darjeeling tem GI protegida — o Champagne dos chás.',chas:[{n:'Darjeeling First Flush',reg:'Darjeeling',tipo:'Preto/Oolong',badge:'#3a1a0a',d:'Floral, muscatel, leve. O mais imitado do mundo.'},{n:'Assam CTC',reg:'Vale do Assam',tipo:'Preto CTC',badge:'#5a2a0a',d:'Base do chá de saquinho global. Forte, maltado.'},{n:'Masala Chai',reg:'Todo país',tipo:'Blend cultural',badge:'#6a3a1a',d:'Ritual de 1.4 bilhões de pessoas diariamente.'}],ervas:[{n:'Tulsi (Manjericão Sagrado)',d:'Adaptógeno revered no Ayurveda. Anti-estresse, imunidade, clareza mental.'},{n:'Ashwagandha',d:'O ginseng indiano. Adaptógeno poderoso para estresse e vitalidade.'},{n:'Neem',d:'Antibacteriano tradicional. Amargo e potente — detox profundo.'},{n:'Cardamomo',d:'Elaichi — especiaria-erva ubíqua em chai. Digestiva, refrescante, aromática.'}],culinaria:'Chai é identidade nacional. Dhabas em cada esquina.',brasil:'Assam e Darjeeling chegam via importadoras. Masala Chai muito popular.'},
  {id:'srilanka',name:'Sri Lanka',    flag:'🇱🇰',cx:.660,cy:.430,color:'#c8a030',subtitle:'Ceylon Tea — o mais puro do mundo',producao:'300.000 ton/ano',exportacao:'290.000 ton/ano',area:'222.000 ha',tipos:['Preto','Verde','Branco'],desc:'Exporta 97% do que produz. Ceylon é sinônimo de qualidade global.',chas:[{n:'Ceylon UVA',reg:'Uva Province',tipo:'Preto',badge:'#3a1a0a',d:'Aromático, mentolado, adstringente.'},{n:'Nuwara Eliya',reg:'1800m',tipo:'Preto delicado',badge:'#4a1a1a',d:'Floral, quase cor-de-rosa. Champagne of Ceylon.'}],culinaria:'Chá gelado consumo nacional. Exporta para 80+ países.',brasil:'Base histórica do saquinho brasileiro.'},
  {id:'taiwan',  name:'Taiwan',       flag:'🇹🇼',cx:.800,cy:.360,color:'#3a8a5a',subtitle:'A ilha dos High Mountain Oolongs',producao:'14.000 ton/ano',exportacao:'3.000 ton/ano',area:'13.000 ha',tipos:['Oolong','Verde','Preto'],desc:'Taiwan redefiniu o oolong. Ali Shan e Da Yu Ling a mais de 2000m produzem oolongs cremosos inimitáveis.',chas:[{n:'Ali Shan Oolong',reg:'Alishan (1400-1800m)',tipo:'Oolong High Mountain',badge:'#2d5a7a',d:'Floral, leite, creme.'},{n:'Oriental Beauty',reg:'Hsinchu',tipo:'Oolong especial',badge:'#7a5a2a',d:'Picadas de inseto criam terpenos únicos. Mel, pêssego, moscatel.'}],culinaria:'Bubble Tea inventado em Taiwan em 1986.',brasil:'Bubble tea proliferou nas cidades brasileiras.'},
  {id:'kenya',   name:'Quênia',       flag:'🇰🇪',cx:.565,cy:.495,color:'#2a7a2a',subtitle:'Terceiro maior exportador — CTC africano',producao:'570.000 ton/ano',exportacao:'525.000 ton/ano',area:'230.000 ha',tipos:['Preto CTC','Verde','Branco'],desc:'O Quênia tornou-se em 60 anos o terceiro maior produtor. Solo vulcânico, altitude 1500-2700m.',chas:[{n:'Kenya CTC',reg:'Highlands centrais',tipo:'Preto CTC',badge:'#3a1a0a',d:'Forte, cor vinho intenso. Base do English Breakfast moderno.'}],culinaria:'Chai com leite fervido é bebida nacional.',brasil:'Presente nos blends de saquinhos importados.'},
  {id:'turquia', name:'Turquia',      flag:'🇹🇷',cx:.570,cy:.275,color:'#c83030',subtitle:'Çay — maior consumidor per capita do mundo',producao:'280.000 ton/ano',exportacao:'5.000 ton/ano',area:'76.000 ha',tipos:['Preto'],desc:'Turcos consomem 3.5 kg/pessoa/ano. O Çay é servido em copo de tulipa de vidro.',chas:[{n:'Rize Çay',reg:'Rize, Mar Negro',tipo:'Preto',badge:'#3a1a0a',d:'Forte e vermelho-escuro. Chaleira dupla çaydanlık.'}],culinaria:'Oferecido em toda reunião. Recusar é descortesia.',brasil:'Influência crescente com restaurantes turcos.'},
  {id:'marrocos',name:'Marrocos',     flag:'🇲🇦',cx:.490,cy:.305,color:'#c87820',subtitle:'Atay — o ritual berber de hospitalidade',producao:'0 (não produz)',exportacao:'—',area:'—',tipos:['Verde (importado) + Hortelã'],desc:'Não produz mas transformou o ritual em arte. Gunpowder com hortelã e açúcar, derramado de altura.',chas:[{n:'Atay',reg:'Todo Marrocos',tipo:'Verde + hortelã',badge:'#4a7a3a',d:'Três copos: o 1° amargo como vida, o 2° doce como amor, o 3° suave como morte.'}],ervas:[{n:'Hortelã Nana (Mentha spicata)',d:'A rainha marroquina. Fresca, vibrante, define o Atay. Cultivada em todo o país.'},{n:'Verbena',d:'Lemon verbena — calmante, digestiva. Blendada com hortelã nas regiões do norte.'},{n:'Flor de Laranjeira',d:'Perfumada e sedante. Comum em infusões do sul marroquino.'}],culinaria:'Ritual de hospitalidade. Recusar 3 copos é insulto.',brasil:'Tendência em restaurantes árabes.'},
  {id:'uk',      name:'Reino Unido',  flag:'🇬🇧',cx:.483,cy:.195,color:'#3a3a8a',subtitle:'A nação do chá — blends e o Afternoon Tea',producao:'0 (não produz)',exportacao:'—',area:'—',tipos:['Blends de importação'],desc:'100 milhões de xícaras por dia. Criou os grandes blends globais.',chas:[{n:'English Breakfast',reg:'Blend britânico',tipo:'Blend preto',badge:'#3a1a0a',d:'Assam + Ceylon + Kenya. O mais consumido do mundo.'},{n:'Earl Grey',reg:'Blend c/ bergamota',tipo:'Aromatizado',badge:'#3a3a7a',d:'Chá preto com óleo de bergamota. Criado em 1830.'}],culinaria:'Afternoon Tea com scones. Leite primeiro ou depois — debate nacional sério.',brasil:'Marcas inglesas em supermercados. Afternoon Tea em hotéis.'},
  {id:'russia',  name:'Rússia',       flag:'🇷🇺',cx:.660,cy:.185,color:'#8a2a2a',subtitle:'Samovar — a alma do inverno russo',producao:'700 ton/ano',exportacao:'—',area:'1.500 ha',tipos:['Preto (importado)','Krasnodar'],desc:'Popularizou o chá na Europa via Rota do Chá. O samovar é ícone cultural.',chas:[{n:'Russian Caravan',reg:'Blend histórico',tipo:'Blend defumado',badge:'#4a2a1a',d:'Levemente defumado — recria sabor das fogueiras das caravanas.'}],culinaria:'Chá com geleia (varenje). Samovar com concentrado diluído a gosto.',brasil:'Russian Caravan em lojas especializadas.'},
  {id:'brasil',  name:'Brasil',       flag:'🇧🇷',cx:.300,cy:.555,color:'#2a8a2a',subtitle:'Produtor emergente — do mate ao Camellia',producao:'4.200 ton/ano',exportacao:'200 ton/ano',area:'3.500 ha',tipos:['Preto','Verde','Erva-mate'],desc:'Produção iniciada por imigrantes japoneses em 1935. Maior polo em Registro (SP). O Brasil é também o país com maior biodiversidade de ervas medicinais do mundo.',chas:[{n:'Chá Preto de Registro',reg:'Vale do Ribeira, SP',tipo:'Preto',badge:'#3a1a0a',d:'Desde 1935. Solo ácido, clima subtropical.'},{n:'Erva-Mate',reg:'Sul do Brasil',tipo:'Mate',badge:'#2d5a2a',d:'O chá mais consumido no Brasil. Chimarrão, tereré e mate gelado.'}],ervas:[{n:'Erva-Mate (Ilex paraguariensis)',d:'O chá nacional. Mais cafeína que o verde. Chimarrão, tereré, mate gelado.'},{n:'Hibisco (Hibiscus sabdariffa)',d:'Flor vermelha ácida. Rico em antocianinas, anti-hipertensivo, refrescante.'},{n:'Capim-Limão (Cymbopogon citratus)',d:'Aromático, calmante, digestivo. Toque cítrico único. Cultivado em todo o país.'},{n:'Erva-Cidreira (Lippia alba)',d:'Ansiolítico natural. Calmante suave, digestivo, cicatrizante.'},{n:'Camomila (Matricaria chamomilla)',d:'Sedativa leve, anti-inflamatória. Uma das mais consumidas.'},{n:'Boldo-do-Chile (Peumus boldus)',d:'O protetor hepático. Amargo, potente. Símbolo dos chás medicinais.'}],culinaria:'Chimarrão ritual gaúcho. Tereré cultura mato-grossense.',brasil:'O Brasil é produtor, consumidor e importador simultaneamente.'},
  {id:'georgia', name:'Geórgia',      flag:'🇬🇪',cx:.605,cy:.260,color:'#c84040',subtitle:'O chá esquecido do Cáucaso',producao:'3.000 ton/ano',exportacao:'800 ton/ano',area:'11.000 ha',tipos:['Preto','Verde'],desc:'Principal produtora soviética. Com a dissolução da URSS a produção colapsou. Hoje em revival artesanal.',chas:[{n:'Guria Black',reg:'Guria',tipo:'Preto',badge:'#3a1a0a',d:'Floral, levemente amadeirado. Produção artesanal em revival.'}],ervas:[{n:'Tarragon (Estragon)',d:'Erva aromática icônica da culinária georgiana. Usada também em limonadas.'},{n:'Savory (Satureja)',d:'Tomilho-selvagem local. Infusões digestivas e carnes grelhadas.'}],culinaria:'Chá forte com açúcar. Hospitalidade caucasiana.',brasil:'Praticamente desconhecido no Brasil.'},
  {id:'argentina',name:'Argentina',   flag:'🇦🇷',cx:.270,cy:.650,color:'#5a9a3a',subtitle:'Terra do chimarrão — yerba mate como identidade',producao:'300.000 ton/ano (mate)',exportacao:'120.000 ton/ano',area:'200.000 ha',tipos:['Erva-Mate','Blends aromáticos'],desc:'A Argentina é o maior produtor e exportador mundial de erva-mate. Missiones, no nordeste, concentra quase toda a produção. O chimarrão é mais que bebida — é identidade cultural e símbolo de partilha.',chas:[{n:'Yerba Mate Clásica',reg:'Missiones',tipo:'Mate puro',badge:'#2d5a2a',d:'Verde, amargo, encorpado. A base do chimarrão argentino.'},{n:'Mate Compuesto',reg:'Todo país',tipo:'Blend c/ ervas',badge:'#3a7a2a',d:'Yerba com ervas adicionadas: menta, boldo, poejo. Suaviza o amargor.'},{n:'Tereré',reg:'Corrientes, Chaco',tipo:'Mate gelado',badge:'#1a5a3a',d:'Compartilhado em grupos. Com agua fría e ervas frescas.'}],ervas:[{n:'Poejo (Mentha pulegium)',d:'Digestiva potente. Adicionada ao mate para suavizar e aromatizar.'},{n:'Cedrón (Lemon Verbena)',d:'Aloysia citrodora. Calmante, digestiva, sabor suave de limão.'},{n:'Burrito (Aloysia polystachya)',d:'Única no cone sul. Perfumada, digestiva, anti-inflamatória.'},{n:'Menta (Mentha x piperita)',d:'Amplamente cultivada. Refresca o mate e infusões quentes.'}],culinaria:'Chimarrão em cuia de cabaça com bomba de metal. Compartilhado em rodas.',brasil:'Chimarrão gaúcho tem raiz cultural compartilhada. Tereré idêntico ao mato-grossense.'},
  {id:'sudafrica',name:'África do Sul',flag:'🇿🇦',cx:.540,cy:.600,color:'#c87020',subtitle:'Rooibos e Honeybush — tesouros únicos da Fynbos',producao:'15.000 ton/ano (rooibos)',exportacao:'12.000 ton/ano',area:'32.000 ha',tipos:['Rooibos','Honeybush','Buchu'],desc:'A África do Sul tem dois chás que não existem em mais nenhum lugar do mundo: o Rooibos (Aspalathus linearis) e o Honeybush (Cyclopia spp.). Ambos são sem cafeína e ricos em antioxidantes únicos.',chas:[{n:'Rooibos (Chá Vermelho)',reg:'Cederberg, W. Cape',tipo:'Tisana sem cafeína',badge:'#c84820',d:'O "chá vermelho" africano. Sem cafeína, rico em aspalathina. Vermelho rubí.'},{n:'Rooibos Verde',reg:'Cederberg',tipo:'Rooibos não oxidado',badge:'#7a8a3a',d:'Menos processado. Mais suave, mais antioxidantes. Raro e premium.'},{n:'Honeybush',reg:'Langkloof, E. Cape',tipo:'Tisana mel',badge:'#a87820',d:'Cyclopia — notas naturais de mel e baunilha. Sem açúcar adicionado.'}],ervas:[{n:'Rooibos (Aspalathus linearis)',d:'Único no mundo. Sem cafeína, anti-alérgico, rico em aspalathina. Cultivado só no Cederberg.'},{n:'Honeybush (Cyclopia spp.)',d:'Parente do rooibos. Mel natural sem adição. Oito espécies, cada com perfil único.'},{n:'Buchu (Agathosma betulina)',d:'Erva sagrada khoi. Cicatrizante, antibacteriana, antiséptica. Exportada ao mundo.'},{n:'Devil\'s Claw (Harpagophytum)',d:'Raíz anti-inflamatória poderosa. Artrite, dores musculares. Savana sul-africana.'}],culinaria:'Rooibos com leite, gelado, em culinária. Honeybush em sobremesas.',brasil:'Rooibos popular em lojas de produtos naturais. Sem cafeína — favorito noturno.'},
  {id:'egito',   name:'Egito/Oriente Médio',flag:'🌍',cx:.545,cy:.340,color:'#c84a20',subtitle:'Karkade — o hibisco sagrado do Nilo',producao:'Hibisco, ervas medicinais',exportacao:'Hibisco seco, olíbano',area:'—',tipos:['Hibisco (Karkade)','Ervas medicinais'],desc:'O Egito e o Oriente Médio têm tradição milenar de infusões. O Karkade (hibisco) é consumido quente e gelado em todo o Oriente Médio e Norte da África — rico em antocianinas e anti-hipertensivo.',chas:[{n:'Karkade (Hibisco)',reg:'Egito e Sudão',tipo:'Floral/ácida',badge:'#c83040',d:'Vermelho-vivo, ácido, anti-hipertensivo. Servido quente e gelado.'},{n:'Chai de Especiarias',reg:'Todo Oriente Médio',tipo:'Blend',badge:'#8a4a10',d:'Cardamomo, canela, cravo, gengibre. Cada país com sua versão.'},{n:'Sage (Sálvia)',reg:'Líbano, Síria',tipo:'Herbal',badge:'#4a7a3a',d:'Maramiya — sálvia medicinal. Muito consumida nas regiões montanhosas.'}],ervas:[{n:'Hibisco (Hibiscus sabdariffa)',d:'Karkade egípcio. Anti-hipertensivo, rico em vitamina C e antocianinas.'},{n:'Sálvia (Salvia officinalis)',d:'Maramiya árabe. Antibacteriana, digestiva, hormonal. Sagrada na medicina árabe.'},{n:'Olíbano (Boswellia sacra)',d:'Incenso/resina anti-inflamatória. Infusões no Omã e Yemen.'},{n:'Rosas de Damasco',d:'Rosa damascena. Água de rosas em bebidas e sobremesas árabes.'}],culinaria:'Karkade quente no inverno, gelado no verão com açúcar. Onipresente.',brasil:'Hibisco nacional. O chá mais consumido no Brasil depois do mate.'},
];

let mundoView='mapa', mundoRegionActive=null, mundoListFilter='Todos';

// #origens abre o mapa; #onde-beber (= mundo/beber) abre a 4ª visão.
function initMundo(slug){
  var v = slug==='beber' ? 'beber' : 'mapa';
  setMundoView(v, document.getElementById(v==='beber' ? 'btnBeber' : 'btnMapa'));
}

function setMundoView(v,btn){
  mundoView=v;
  document.querySelectorAll('.mundo-view-btn').forEach(b=>b.classList.remove('on'));
  if(btn)btn.classList.add('on');
  document.getElementById('mundoMapView').style.display=v==='mapa'?'block':'none';
  document.getElementById('mundoListView').style.display=v==='lista'?'block':'none';
  document.getElementById('mundoBrasilView').style.display=v==='brasil'?'block':'none';
  var beber=document.getElementById('mundoBeberView'); if(beber) beber.style.display=v==='beber'?'block':'none';
  // O hash e a sub-navegação acompanham a visão: «Onde beber» tem hash
  // próprio (#onde-beber) e entrada própria no grupo Descobrir.
  if(window._currentPage==='mundo'){
    var slugBeber = v==='beber' ? 'beber' : undefined;
    window._currentSlug = slugBeber;
    try { history.replaceState(null, '', pageHash('mundo', slugBeber)); } catch(e){}
    if(typeof updateNavState==='function') updateNavState('mundo', slugBeber);
  }
  if(v==='beber' && !window._chazeriasCarregadas && typeof initChazerias==='function'){ window._chazeriasCarregadas=true; initChazerias(); }
  if(v==='mapa') drawMundoMap();
  if(v==='lista'){buildMundoListFilter();renderMundoList();}
  if(v==='brasil'){ renderBrasilContent(); if(typeof trackAction==='function') trackAction('visit-brasil'); }
}

function drawMundoMap(){
  const svg=document.getElementById('mundoDotsLayer'); if(!svg)return;
  const NS='http://www.w3.org/2000/svg';
  // Clear previous dots
  while(svg.firstChild) svg.removeChild(svg.firstChild);

  function mk(tag,attrs){
    const el=document.createElementNS(NS,tag);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));
    return el;
  }

  // viewBox is 1330x840 matching the real map image dimensions
  const VW=1330, VH=840;

  MUNDO_REGIONS.forEach(r=>{
    const px=r.cx*VW, py=r.cy*VH;
    const isSel=mundoRegionActive===r.id;
    const dr=isSel?18:13;

    const g=document.createElementNS(NS,'g');
    g.style.cursor='pointer';

    // Pulse ring for selected
    if(isSel){
      g.appendChild(mk('circle',{cx:px,cy:py,r:dr+10,fill:r.color,opacity:'0.2'}));
      g.appendChild(mk('circle',{cx:px,cy:py,r:dr+5,fill:r.color,opacity:'0.15'}));
    }
    // Drop shadow
    g.appendChild(mk('circle',{cx:px,cy:py+2,r:dr+2,fill:'rgba(0,0,0,0.35)'}));
    // Main dot
    g.appendChild(mk('circle',{cx:px,cy:py,r:dr,fill:isSel?lightenW(r.color,.38):r.color}));
    // White highlight
    g.appendChild(mk('circle',{cx:px-dr*.3,cy:py-dr*.3,r:dr*.38,fill:'rgba(255,255,255,0.3)'}));
    // Flag emoji
    const ft=document.createElementNS(NS,'text');
    ft.setAttribute('x',px); ft.setAttribute('y',py+1);
    ft.setAttribute('text-anchor','middle');
    ft.setAttribute('dominant-baseline','middle');
    ft.setAttribute('font-size',isSel?16:12);
    ft.setAttribute('style','pointer-events:none;user-select:none');
    ft.textContent=r.flag;
    g.appendChild(ft);

    // Name label when selected
    if(isSel){
      const lw=r.name.length*7+16;
      g.appendChild(mk('rect',{x:px-lw/2,y:py+dr+4,width:lw,height:18,rx:4,fill:'rgba(0,0,0,0.85)'}));
      const lt=document.createElementNS(NS,'text');
      lt.setAttribute('x',px); lt.setAttribute('y',py+dr+13);
      lt.setAttribute('text-anchor','middle');
      lt.setAttribute('dominant-baseline','middle');
      lt.setAttribute('font-size',10);
      lt.setAttribute('font-family','Jost,sans-serif');
      lt.setAttribute('fill','#e6c96e');
      lt.setAttribute('font-weight','500');
      lt.setAttribute('style','pointer-events:none;user-select:none');
      lt.textContent=r.name;
      g.appendChild(lt);
    }

    // Events
    g.addEventListener('click',()=>selectMapRegion(r.id));
    g.addEventListener('mouseenter',e=>mapDotHover(r.id,e));
    g.addEventListener('mouseleave',mapDotLeave);
    g.addEventListener('touchstart',e=>{e.preventDefault();selectMapRegion(r.id);},{passive:false});

    svg.appendChild(g);
  });

  // Legend
  const leg=document.getElementById('mapLegend'); if(!leg)return;
  leg.innerHTML='<div style="font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);margin-bottom:.5rem;width:100%">Clique em um ponto do mapa ou na legenda</div>'+
    MUNDO_REGIONS.map(r=>`
      <div class="mundo-legend-item" style="cursor:pointer;padding:3px 8px;border-radius:5px;${mundoRegionActive===r.id?'background:rgba(200,168,75,.1)':''}"
           onclick="selectMapRegion('${r.id}')">
        <div class="mundo-legend-dot" style="background:${r.color};${mundoRegionActive===r.id?'box-shadow:0 0 0 2px '+r.color+'66':''}"></div>
        <span style="color:${mundoRegionActive===r.id?'var(--gold2)':'inherit'}">${r.flag} ${r.name}</span>
      </div>`).join('');
}

function mapDotHover(id,e){
  const reg=MUNDO_REGIONS.find(r=>r.id===id); if(!reg)return;
  const tt=document.getElementById('mapTooltip'); if(!tt)return;
  const wrap=document.getElementById('mundoSvgWrap'); if(!wrap)return;
  const rect=wrap.getBoundingClientRect();
  const clientX=e?e.clientX:0, clientY=e?e.clientY:0;
  tt.style.display='block';
  tt.style.left=Math.min(clientX-rect.left+14, rect.width-230)+'px';
  tt.style.top=Math.max(clientY-rect.top-40, 4)+'px';
  tt.innerHTML='<strong>'+esc(reg.flag)+' '+esc(reg.name)+'</strong><br><span style="color:var(--muted);font-size:.7rem">'+esc(reg.subtitle)+'</span>';
}

function mapDotLeave(){
  const tt=document.getElementById('mapTooltip'); if(tt) tt.style.display='none';
}

function selectMapRegion(id){
  mundoRegionActive=mundoRegionActive===id?null:id;
  if(id && typeof trackAction==='function') trackAction('visit-region', id);
  drawMundoMap();
  const reg=mundoRegionActive?MUNDO_REGIONS.find(r=>r.id===mundoRegionActive):null;
  const el=document.getElementById('regionDetail'); if(!el)return;
  if(!reg){el.style.display='none';return;}
  el.style.display='block';
  el.innerHTML=`
    <div class="mrd-header">
      <div class="mrd-flag">${reg.flag}</div>
      <div><div class="mrd-title">${esc(reg.name)}</div><div class="mrd-subtitle">${esc(reg.subtitle)}</div></div>
    </div>
    <p style="font-size:.82rem;color:var(--cream2);line-height:1.7;margin-bottom:1rem">${esc(reg.desc)}</p>
    <div class="mrd-grid">
      <div class="mrd-card"><div class="mrd-card-label">Produção anual</div><div class="mrd-card-val">${esc(reg.producao)}</div></div>
      <div class="mrd-card"><div class="mrd-card-label">Exportação</div><div class="mrd-card-val">${esc(reg.exportacao)}</div></div>
      <div class="mrd-card"><div class="mrd-card-label">Área cultivada</div><div class="mrd-card-val">${esc(reg.area)}</div></div>
      <div class="mrd-card"><div class="mrd-card-label">Tipos produzidos</div><div class="mrd-card-val">${reg.tipos.map(t=>esc(t)).join(' · ')}</div></div>
    </div>
    <div style="font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.6rem">Chás principais</div>
    <div style="background:var(--bg2);border:0.5px solid var(--faint);border-radius:var(--r-lg);overflow:hidden;margin-bottom:1rem">
      ${reg.chas.map(c=>`<div class="mrd-cha-row" style="padding:.65rem 1rem">
        <div style="flex:1">
          <div class="mrd-cha-name">${esc(c.n)} <span class="mrd-cha-badge" style="background:${c.badge}22;border:0.5px solid ${c.badge}44;color:${c.badge}">${esc(c.tipo)}</span></div>
          <div class="mrd-cha-desc">${esc(c.d)}</div>
          ${c.reg?`<div style="font-size:.65rem;color:var(--muted);margin-top:2px;display:inline-flex;align-items:center;gap:4px">${svgIcon('pin')} ${esc(c.reg)}</div>`:''}
        </div>
      </div>`).join('')}
    </div>
    ${reg.ervas?`<div style="font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.6rem">Ervas & Plantas Locais</div>
    <div class="mrd-ervas-grid" style="margin-bottom:1rem">${reg.ervas.map(e=>`<div class="mrd-erva-item"><div class="mrd-erva-name" style="display:inline-flex;align-items:center;gap:5px">${svgIcon('leaf')} ${esc(e.n)}</div><div class="mrd-erva-desc">${esc(e.d)}</div></div>`).join('')}</div>`:''}
    <div class="mrd-grid">
      <div class="mrd-card"><div class="mrd-card-label">Cultura & culinária</div><div class="mrd-card-val">${esc(reg.culinaria)}</div></div>
      <div class="mrd-card" style="border-left:2px solid #2a8a2a"><div class="mrd-card-label" style="color:#4a8a4a">🇧🇷 Conexão com o Brasil</div><div class="mrd-card-val">${esc(reg.brasil)}</div></div>
    </div>`;
  el.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function buildMundoListFilter(){
  const el=document.getElementById('listFilter'); if(!el)return;
  el.innerHTML='';
  const regionMap={china:'Ásia',japao:'Ásia',india:'Ásia',srilanka:'Ásia',taiwan:'Ásia',georgia:'Ásia',kenya:'África',turquia:'Ásia',marrocos:'África',russia:'Europa',uk:'Europa',brasil:'Américas',argentina:'Américas',sudafrica:'África',egito:'África'};
  ['Todos','Ásia','Europa','África','Américas'].forEach(r=>{
    const b=document.createElement('button');
    b.className='mfl-btn'+(mundoListFilter===r?' on':'');
    b.textContent=r;
    b.onclick=()=>{mundoListFilter=r;buildMundoListFilter();renderMundoList();};
    el.appendChild(b);
  });
}

function renderMundoList(){
  const regionMap={china:'Ásia',japao:'Ásia',india:'Ásia',srilanka:'Ásia',taiwan:'Ásia',georgia:'Ásia',kenya:'África',turquia:'Ásia',marrocos:'África',russia:'Europa',uk:'Europa',brasil:'Américas',argentina:'Américas',sudafrica:'África',egito:'África'};
  const list=MUNDO_REGIONS.filter(r=>mundoListFilter==='Todos'||regionMap[r.id]===mundoListFilter);
  const el=document.getElementById('mundoListContent'); if(!el)return;
  el.innerHTML=list.map(r=>`
    <div class="mundo-country-block">
      <div class="mcb-header" id="mch_${r.id}" onclick="toggleCountry('${r.id}')">
        <div class="mcb-flag">${r.flag}</div>
        <div style="flex:1"><div class="mcb-name">${esc(r.name)}</div><div class="mcb-prod">${esc(r.producao)} · ${r.tipos.slice(0,3).map(t=>esc(t)).join(', ')}</div></div>
        <div class="mcb-arrow" id="mca_${r.id}">▾</div>
      </div>
      <div class="mcb-body" id="mcb_${r.id}">
        <p style="font-size:.82rem;color:var(--cream2);line-height:1.7;margin-bottom:.75rem">${esc(r.desc)}</p>
        <div style="font-size:.6rem;letter-spacing:.09em;text-transform:uppercase;color:var(--gold);margin-bottom:.4rem">Chás & Infusões</div>
        ${r.chas.map(c=>`<div class="mrd-cha-row"><div style="flex:1">
          <div class="mrd-cha-name">${esc(c.n)} <span class="mrd-cha-badge" style="background:${c.badge}22;border:0.5px solid ${c.badge}44;color:${c.badge}">${esc(c.tipo)}</span></div>
          <div class="mrd-cha-desc">${esc(c.d)}</div>
          ${c.reg?`<div style="font-size:.65rem;color:var(--muted);margin-top:2px;display:inline-flex;align-items:center;gap:4px">${svgIcon('pin')} ${esc(c.reg)}</div>`:''}
        </div></div>`).join('')}
        ${r.ervas?`<div style="font-size:.6rem;letter-spacing:.09em;text-transform:uppercase;color:var(--gold);margin:.75rem 0 .4rem">Ervas & Plantas Locais</div>
        <div class="mrd-ervas-grid">${r.ervas.map(e=>`<div class="mrd-erva-item"><div class="mrd-erva-name" style="display:inline-flex;align-items:center;gap:5px">${svgIcon('leaf')} ${esc(e.n)}</div><div class="mrd-erva-desc">${esc(e.d)}</div></div>`).join('')}</div>`:''}
        <div style="margin-top:.75rem;padding:.75rem;background:rgba(42,138,42,.06);border:0.5px solid rgba(42,138,42,.2);border-radius:var(--r-md);font-size:.75rem;color:var(--cream2)">
          <span style="color:#4a8a4a;font-size:.62rem;letter-spacing:.08em;text-transform:uppercase">🇧🇷 Conexão com o Brasil</span><br>${esc(r.brasil)}
        </div>
      </div>
    </div>`).join('');
}

function toggleCountry(id){
  const body=document.getElementById('mcb_'+id),hdr=document.getElementById('mch_'+id),arrow=document.getElementById('mca_'+id);
  if(!body)return;
  const open=body.classList.contains('open');
  body.classList.toggle('open',!open); hdr.classList.toggle('open',!open); if(arrow)arrow.classList.toggle('open',!open);
}

function renderBrasilContent(){
  const el=document.getElementById('brasilContent'); if(!el)return;
  el.innerHTML=`
    <div class="brasil-hero">
      <div style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;color:var(--gold2);font-weight:300;margin-bottom:.5rem">🇧🇷 O Brasil e o chá verdadeiro</div>
      <div style="font-size:.82rem;color:var(--cream2);line-height:1.7">O Brasil tem uma relação paradoxal com o chá: é um dos maiores consumidores de "chás" (na maior parte tisanas de ervas), mas quase desconhece sua própria produção de Camellia sinensis. A história começa com imigrantes japoneses em 1935 no Vale do Ribeira e continua crescendo silenciosamente.</div>
      <div class="brasil-stat-grid">
        <div class="brasil-stat"><div class="brasil-stat-val">1935</div><div class="brasil-stat-key">Início produção Camellia</div></div>
        <div class="brasil-stat"><div class="brasil-stat-val">4.200 t</div><div class="brasil-stat-key">Produção anual estimada</div></div>
        <div class="brasil-stat"><div class="brasil-stat-val">3.500 ha</div><div class="brasil-stat-key">Área cultivada</div></div>
        <div class="brasil-stat"><div class="brasil-stat-val">6°</div><div class="brasil-stat-key">Maior consumidor mundial</div></div>
      </div>
    </div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:var(--gold2);margin-bottom:.75rem;font-weight:300">Polos produtores</div>
    ${[{name:'Vale do Ribeira — Registro, SP',icon:'🌱',loc:'Registro e região',desc:'O maior e mais antigo polo. Fundado por imigrantes japoneses em 1935. Solo ácido e clima subtropical. Produz principalmente chá preto e verde. Cooperativa Chá de Registro.',tipos:'Preto, Verde'},{name:'Serra Gaúcha — RS',icon:'🍇',loc:'Bento Gonçalves, Gramado',desc:'Experimentos com Camellia sinensis em altitude (800-900m). Pequenas propriedades artesanais incipientes.',tipos:'Verde, Preto (experimental)'},{name:'Região Serrana — RJ',icon:'⛰',loc:'Petrópolis, Nova Friburgo',desc:'Projetos piloto em altitude (800-1200m). Clima favorável com névoa frequente — similar a regiões asiáticas.',tipos:'Verde (experimental)'},{name:'Minas Gerais — UFV',icon:'🎓',loc:'Viçosa, MG',desc:'Pesquisas da UFV com variedades adaptadas. Zona da Mata tem potencial para chás de qualidade.',tipos:'Pesquisa acadêmica'}].map(r=>`<div class="brasil-region"><div class="brasil-region-name">${r.icon} ${r.name}</div><div class="brasil-region-loc">📍 ${r.loc}</div><div class="brasil-region-desc">${r.desc}</div><div style="margin-top:.3rem;font-size:.7rem;color:var(--gold)">Tipos: ${r.tipos}</div></div>`).join('')}
    <div style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:var(--gold2);margin:.5rem 0 .75rem;font-weight:300">Comparativo: Brasil vs. Grandes Produtores</div>
    <div class="compare-table-wrap"><table class="cha-compare-table" style="min-width:480px">
      <tr><th>Aspecto</th><th>🇧🇷 Registro, SP</th><th>🇮🇳 Darjeeling</th><th>🇯🇵 Uji</th></tr>
      <tr><td>Altitude</td><td>30-100m</td><td>800-2200m</td><td>200-600m</td></tr>
      <tr><td>Perfil</td><td>Encorpado, terroso</td><td>Floral, muscatel</td><td>Umami, gramíneo</td></tr>
      <tr><td>Preço (100g)</td><td>R$ 30-80</td><td>R$ 80-400</td><td>R$ 80-600</td></tr>
      <tr><td>Disponibilidade</td><td>Local/regional</td><td>Importação</td><td>Importação</td></tr>
      <tr><td>Identidade</td><td>Em construção</td><td>Consolidada (DOP)</td><td>Consolidada</td></tr>
    </table></div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:var(--gold2);margin:1rem 0 .75rem;font-weight:300">A Erva-Mate — o chá brasileiro por excelência</div>
    <div class="brasil-hero" style="background:rgba(45,90,42,.1);border-color:rgba(45,90,42,.25)">
      <div style="font-size:.82rem;color:var(--cream2);line-height:1.7">Ilex paraguariensis — não é Camellia sinensis, mas é o "chá" mais consumido no Brasil. Tem mais cafeína que muitos chás verdes. O chimarrão, o tereré e o mate gelado são expressões de uma cultura única.</div>
      <div style="margin-top:.75rem;display:flex;flex-wrap:wrap;gap:8px">
        ${[{n:'Chimarrão',r:'Rio Grande do Sul',c:'Quente, cuia e bomba'},{n:'Tereré',r:'MS, MT, Paraguai',c:'Gelado com ervas'},{n:'Mate Gelado',r:'São Paulo',c:'Industrializado'},{n:'Mate Torrado',r:'Todo Brasil',c:'Defumado, em saquinho'}].map(m=>`<div style="background:rgba(45,90,42,.1);border:0.5px solid rgba(45,90,42,.2);border-radius:var(--r-md);padding:.5rem .75rem"><div style="font-size:.8rem;font-weight:400;color:var(--cream)">${m.n}</div><div style="font-size:.68rem;color:#4a8a4a">${m.r}</div><div style="font-size:.68rem;color:var(--muted)">${m.c}</div></div>`).join('')}
      </div>
    </div>`;
}

// ── SOBRE ──
function renderSobre(){
  const el=document.getElementById('sobreContent'); if(!el)return;
  el.innerHTML=`
    <div class="sobre-wrap">
      <div class="sobre-hero-wrap">
        <img data-responsive="images/hero/hero-maos.png" alt="Ritual do chá" class="sobre-hero-photo"
          loading="lazy" onerror="this.style.display='none'">
      </div>

      <div class="sobre-body">
        <div class="sobre-tag">Manifesto</div>
        <div class="sobre-titulo">Transformamos ervas em rituais.</div>
        <div class="sobre-texto">Vivemos em um mundo acelerado, desconectado dos ciclos naturais. O corpo pede pausa. A mente pede clareza. A vida pede presença.</div>
        <div class="sobre-texto">O Ervatório nasce do resgate desse equilíbrio. Acreditamos que o cuidado começa no simples — na água aquecida, na folha escolhida, no tempo respeitado.</div>
        <div class="sobre-destaque">"Cada erva carrega uma história. Cada infusão, um ritual. Cada momento, uma oportunidade de reconexão."</div>
        <div class="sobre-texto">Unimos tradição e ciência. Brasil e mundo. Natureza e precisão. Selecionamos, estudamos e apresentamos ervas com propósito — não como produto, mas como experiência.</div>

        <div class="sobre-tag" style="margin-top:2rem">Nossos pilares</div>
        <div class="sobre-pilares">
          ${[
            {i:'🌿',n:'Natural',d:'Fitoterapia real, com base científica e tradição'},
            {i:'🧠',n:'Inteligente',d:'Cada erva documentada com rigor técnico e acessibilidade'},
            {i:'🕊️',n:'Sensorial',d:'Experiência completa — aroma, preparo, momento, ritual'},
            {i:'🇧🇷',n:'Brasileiro',d:'Biodiversidade única do Cerrado, Mata Atlântica e Amazônia'},
          ].map(p=>`
            <div class="sobre-pilar">
              <div style="font-size:1.4rem;margin-bottom:.5rem">${p.i}</div>
              <div style="font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--gold2);margin-bottom:.25rem">${p.n}</div>
              <div style="font-size:.75rem;color:var(--cream2);line-height:1.6">${p.d}</div>
            </div>
          `).join('')}
        </div>

        <div class="sobre-tag" style="margin-top:2rem">Nossas linhas</div>
        <div class="sobre-linhas">
          ${[
            {n:'Essencial',d:'Ervas brasileiras puras, curadoria de origem e qualidade',c:'#2d5a3a',bg:'rgba(45,90,58,.1)'},
            {n:'Global',d:'Matcha, oolong, rooibos — o melhor do mundo em curadoria',c:'#2d4a6b',bg:'rgba(45,74,107,.1)'},
            {n:'Funcional',d:'Blends com objetivo claro — sono, foco, digestão, imunidade',c:'#6b4a1a',bg:'rgba(107,74,26,.1)'},
            {n:'Ritual',d:'Kits completos com erva, acessório e guia de preparo',c:'#5a2d6b',bg:'rgba(90,45,107,.1)'},
          ].map(l=>`
            <div class="sobre-linha" style="background:${l.bg};border-left:3px solid ${l.c}">
              <div style="font-size:.85rem;font-weight:400;color:var(--cream);margin-bottom:.2rem">${l.n}</div>
              <div style="font-size:.72rem;color:var(--cream2);line-height:1.5">${l.d}</div>
            </div>
          `).join('')}
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:1.5rem">
          <button class="add-blend-btn" onclick="goPage('search')" style="flex:1;min-width:140px">Explorar o catálogo</button>
          <button class="add-blend-btn" onclick="goPage('roda')" style="flex:1;min-width:140px;background:rgba(200,168,75,.15)">🎡 Roda dos Chás</button>
        </div>

        <div class="sobre-tag" style="margin-top:2rem">Contato</div>
        <div class="sobre-texto">
          Dúvidas, parcerias ou suporte? Fale com a gente:
          <a href="mailto:contato@ervatorio.com.br" style="color:var(--gold2);text-decoration:none">contato@ervatorio.com.br</a>
        </div>
      </div>
    </div>`;
}

// ── INIT ──
if(typeof initI18n==='function') initI18n();
renderNav();
window._currentPage = window._currentPage || 'search';
updateNavState(window._currentPage);
// Estado inicial da loja: o CSS já esconde [data-loja]; aqui só sincroniza os
// hrefs. A remoção do DOM acontece quando os interruptores respondem.
document.querySelectorAll('[data-loja-href]').forEach(function(a){ a.setAttribute('href', a.getAttribute('data-loja-href-off') || '#lp-loja'); });
if(typeof updateSEO==='function') updateSEO('search');
buildFilters();
renderHerbs();
drawWheel();
encReset();
renderTray();
updateCartCount();
renderPerfil();
