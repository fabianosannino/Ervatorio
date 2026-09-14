#!/usr/bin/env node
// ============================================================
// Pré-render SEO — Onda 5 (backlog #26, #27, #28, #29, #31–#35, #38)
// ============================================================
// Gera, a partir de js/fichas-data.js (97 fichas):
//   • erva/<slug>/index.html — página estática indexável por erva,
//     com conteúdo real no HTML, canonical, OG/Twitter, JSON-LD
//     (Article + BreadcrumbList) e CTA para o app (#ficha/<slug>)
//   • erva/index.html        — hub "Ervopédia" com links para todas
//   • sitemap.xml             — home + legais + hub + 97 ervas
//   • robots.txt              — referencia o sitemap
//   • receitas/<id>/, blends/<slug>/, chas/<id>/ (+ hubs) — PR 10 do
//     handoff: as mesmas listas do app (js/receitas-data.js,
//     js/blends-data.js, js/chas-data.js), indexáveis sem JavaScript
//
// Estratégia (fase 1 da Onda 5): páginas estáticas convivem com o
// SPA sem tocar no routing hash — o Google indexa /erva/<slug>/ e
// o usuário entra no app pelo CTA. A migração completa do routing
// interno (History API) é a fase 2.
//
// Uso: npm run prerender   (os arquivos gerados são commitados,
// como as imagens otimizadas — deploy estático sem build step)
// ============================================================
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
// Cabeçalho único (PR 03b): o mesmo menu do app, em HTML puro.
import { moldura, aplicarMarcadores } from './nav-estatica.mjs';

const SITE = 'https://ervatorio.com.br';
const TODAY = new Date().toISOString().slice(0, 10);

// ── Carrega as fichas (arquivo de browser: expõe var FICHAS_ANCORA)
const fichasSrc = readFileSync('js/fichas-data.js', 'utf8');
const FICHAS = new Function(`${fichasSrc}; return FICHAS_ANCORA;`)();
const slugs = Object.keys(FICHAS);

// ── Catálogo do app e o resumo leigo (PR 06): a ficha estática monta o
// mesmo bloco «para que serve · como preparar · quem deve evitar» que a
// ficha do app, pela mesma função.
const herbsSrc = readFileSync('js/herbs-data.js', 'utf8');
const HERBS = new Function(`${herbsSrc}; return HERBS;`)();
const resumoSrc = readFileSync('js/ficha-resumo.js', 'utf8');
const { fichaResumo } = new Function(`const window = {}; ${resumoSrc}; return { fichaResumo: window.fichaResumo };`)();
const _nrm = (v) => String(v || '').normalize('NFC').toLowerCase().trim();
function herbDaFicha(f) {
  return HERBS.find((h) => _nrm(h.n) === _nrm(f.nome_popular) ||
    (h.lat && f.nome_cientifico && _nrm(f.nome_cientifico).startsWith(_nrm(h.lat.split(' ').slice(0, 2).join(' '))))) || null;
}

// ── Léxico da Chazeria (Onda 2.1) — glossário estático indexável
const lexicoSrc = readFileSync('js/lexico-data.js', 'utf8');
const { LEXICO_TERMOS, LEXICO_CATEGORIAS } =
  new Function(`${lexicoSrc}; return { LEXICO_TERMOS, LEXICO_CATEGORIAS };`)();

// ── Série "Como se faz" (Onda 2.3) — artigos de processo
const processosSrc = readFileSync('js/processos-data.js', 'utf8');
const { PROCESSOS } = new Function(`${processosSrc}; return { PROCESSOS };`)();

// ── Biblioteca (Onda 2.4) — guias imprimíveis (salvar como PDF)
const bibliotecaSrc = readFileSync('js/biblioteca-data.js', 'utf8');
const { BIBLIOTECA_GUIAS, PREPARO_TABELA } =
  new Function(`${bibliotecaSrc}; return { BIBLIOTECA_GUIAS, PREPARO_TABELA };`)();

// Receitas, blends prontos e tipos de chá (PR 10): os mesmos scripts de
// dados que o app carrega. INTENCOES fica em js/app.js (é o motor de
// recomendação, não dado) e só o mapa intenção → blend é lido daqui, para
// a página estática do blend levar ao mesmo lugar que o app.
const receitasSrc = readFileSync('js/receitas-data.js', 'utf8');
const { RECEITAS, REC_IMG_EXT } = new Function(`${receitasSrc}; return { RECEITAS, REC_IMG_EXT };`)();
const blendsSrc = readFileSync('js/blends-data.js', 'utf8');
const { BLEND_DB } = new Function(`${blendsSrc}; return { BLEND_DB };`)();
const chasSrc = readFileSync('js/chas-data.js', 'utf8');
const { CHAS_DATA } = new Function(`${chasSrc}; return { CHAS_DATA };`)();
const appSrc = readFileSync('js/app.js', 'utf8');
const intencoesMatch = appSrc.match(/\nconst INTENCOES = \{\n[\s\S]*?\n\};\n/);
if (!intencoesMatch) throw new Error('prerender: INTENCOES não encontrado em js/app.js');
const { INTENCOES } = new Function(`${intencoesMatch[0]}; return { INTENCOES };`)();
const slugify = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Manifest de imagens (Onda 4) para OG image por erva quando existir.
let IMG_MANIFEST = {};
try { IMG_MANIFEST = JSON.parse(readFileSync('images/manifest.json', 'utf8')); } catch { /* ok */ }

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
const has = (v) => v != null && String(v).trim() !== '' && !(Array.isArray(v) && v.length === 0);

function ogImageFor(slug) {
  for (const [key, entry] of Object.entries(IMG_MANIFEST)) {
    if (key.includes(`/produtos/${slug}.`) || key.includes(`/produtos/${slug}-`)) {
      const v = entry.variants?.find((x) => x.width >= 1024) || entry.variants?.at(-1);
      if (v) return `${SITE}/${v.path}`;
    }
  }
  return `${SITE}/images/optimized/hero/ervas-colecao-1024w.webp`;
}

// Miniatura (thumb) de produto por slug — retorna caminho relativo ou null.
function thumbFor(slug) {
  const pick = (entry) => {
    const v = entry.variants?.find((x) => x.width >= 280 && x.width <= 520) || entry.variants?.[0];
    return v ? `/${v.path}` : null;
  };
  // 1ª passada: arquivo com slug exato (ex.: manjericao.png), evita casar com manjericao-sagrado
  for (const [key, entry] of Object.entries(IMG_MANIFEST)) {
    if (key.includes(`/produtos/${slug}.`)) {
      const p = pick(entry);
      if (p) return p;
    }
  }
  // 2ª passada: variações com sufixo (ex.: slug-1.png)
  for (const [key, entry] of Object.entries(IMG_MANIFEST)) {
    if (key.includes(`/produtos/${slug}-`)) {
      const p = pick(entry);
      if (p) return p;
    }
  }
  return null;
}

function section(title, inner) {
  return inner ? `<section><h2>${esc(title)}</h2>${inner}</section>` : '';
}
function dl(pairs) {
  const rows = pairs.filter(([, v]) => has(v))
    .map(([k, v]) => `<div class="row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  return rows ? `<dl>${rows}</dl>` : '';
}
function ul(items) {
  const li = (items || []).filter(has).map((i) => `<li>${esc(i)}</li>`).join('');
  return li ? `<ul>${li}</ul>` : '';
}
function labeledList(items) {
  const li = (items || []).filter((i) => has(i?.label) || has(i?.texto))
    .map((i) => `<li><strong>${esc(i.label)}</strong>${has(i.texto) ? ` — ${esc(i.texto)}` : ''}</li>`).join('');
  return li ? `<ul>${li}</ul>` : '';
}

const CSS = `
:root{--verde:#1a3a2a;--verde2:#2d5440;--ouro:#b8965a;--ouro2:#d9b878;--creme:#f5ede0;--ink:#22201a;--panel:#fbf6ea;--line:#e0d5bd}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Georgia,'Times New Roman',serif;background:#f3ecdd;color:var(--ink);line-height:1.7}
header.hero{background:linear-gradient(160deg,var(--verde),var(--verde2));color:var(--creme);padding:40px 20px 34px;border-bottom:3px solid var(--ouro)}
.wrap{max-width:840px;margin:0 auto;padding:0 20px}
header a.back{color:var(--ouro2);text-decoration:none;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase}
h1{font-size:clamp(1.7rem,4.5vw,2.6rem);margin:10px 0 2px;font-weight:600}
.latin{font-style:italic;color:var(--ouro2);font-size:1.02rem}
.tagline{margin-top:12px;max-width:64ch;color:#e6dcc8;font-size:1.02rem}
main{padding:34px 0 56px}
section{margin:26px 0}
h2{font-size:1.22rem;color:var(--verde);border-bottom:1px solid var(--line);padding-bottom:5px;margin-bottom:12px}
dl .row{display:flex;gap:10px;padding:5px 0;border-bottom:1px dashed var(--line)}
dt{flex:0 0 190px;font-weight:700;font-size:.85rem;color:#6b5a2e}
dd{flex:1;font-size:.95rem}
ul{padding-left:22px}li{margin:5px 0;font-size:.95rem}
.cta{display:inline-block;background:var(--verde);color:var(--creme);border:1px solid var(--ouro);border-radius:10px;padding:12px 22px;text-decoration:none;font-size:.95rem;margin:8px 12px 8px 0}
.cta.gold{background:var(--ouro);color:#1c1608;font-weight:700}
.health{background:#f7e2df;border-left:4px solid #a3241c;padding:12px 16px;border-radius:0 8px 8px 0;font-size:.88rem;margin:24px 0}
.related{display:flex;flex-wrap:wrap;gap:8px}
.related a{background:var(--panel);border:1px solid var(--line);border-radius:99px;padding:6px 14px;text-decoration:none;color:var(--verde);font-size:.85rem}
footer{background:var(--verde);color:#c3b89e;padding:22px 20px;font-size:.8rem;text-align:center}
footer a{color:var(--ouro2)}
@media(max-width:560px){dl .row{flex-direction:column;gap:2px}dt{flex:none}}
`.trim();

// Só a ficha usa: o bloco-resumo, as caixas de alerta e o título do técnico (PR 06).
const FICHA_CSS = `.resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px 20px;margin:26px 0 14px}
.resumo h3{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:#8c6a2f;margin:0 0 6px}
.resumo p{font-size:.95rem;margin:0 0 6px}.resumo ul{padding-left:18px;margin:0 0 6px}.resumo li{font-size:.92rem;margin:2px 0}
.resumo .det{font-size:.82rem;color:#6b5a2e}
.alerta{background:#fff3e0;border:1px solid #e0b060;border-left:4px solid #b8965a;border-radius:0 8px 8px 0;padding:12px 16px;margin:14px 0;font-size:.92rem}
.alerta ul{margin-top:6px}
h2.tecnico{margin-top:30px;font-size:1.05rem;letter-spacing:.06em;text-transform:uppercase;color:#6b5a2e;border-bottom:2px solid var(--ouro)}
.mute{color:#8b7e68;font-style:italic}
`.trim();

function fichaPage(slug, f, idx) {
  const nome = f.nome_popular || slug;
  const latin = f.nome_cientifico || '';
  const desc = (f.tagline || `Ficha completa de ${nome}: preparo, ações, segurança e cultura.`).slice(0, 158);
  const url = `${SITE}/erva/${slug}/`;
  const img = ogImageFor(slug);

  // Vizinhas para linkagem interna (anel: 4 anteriores/seguintes).
  const related = [-2, -1, 1, 2].map((d) => slugs[(idx + d + slugs.length) % slugs.length])
    .map((s) => `<a href="/erva/${s}/">${esc(FICHAS[s].nome_popular || s)}</a>`).join('');

  const id = f.identificacao || {}, c = f.caracterizacao || {}, p = f.preparo || {};
  const a = f.acoes_e_seguranca || {}, cu = f.cultura || {}, r = f.regulacao || {};
  const R = fichaResumo(f, herbDaFicha(f));
  const sec = R.secoes;
  const cap = (v) => { v = String(v || ''); return v.charAt(0).toUpperCase() + v.slice(1); };

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: `${nome} (${latin})`.slice(0, 110),
        description: desc,
        image: img,
        inLanguage: 'pt-BR',
        mainEntityOfPage: url,
        author: { '@type': 'Organization', name: 'Ervatório', url: SITE },
        publisher: { '@type': 'Organization', name: 'Ervatório', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/icon-512.png` } },
        about: { '@type': 'Thing', name: nome, alternateName: latin },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ervatório', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Ervopédia', item: `${SITE}/erva/` },
          { '@type': 'ListItem', position: 3, name: nome, item: url },
        ],
      },
    ],
  };


  // Bloco-resumo: o que um leigo precisa antes de qualquer coisa.
  const prep = R.preparo.texto ? esc(R.preparo.texto)
    : [R.preparo.temp, R.preparo.tempo, R.preparo.dose].filter(has).map(esc).join(' · ') +
      (has(R.preparo.freq) ? `<br><span class="det">${esc(R.preparo.freq)}</span>` : '') +
      (has(R.preparo.metodo) ? `<br><span class="det">${esc(R.preparo.metodo)}</span>` : '');
  const evitar = R.evitar.length
    ? `<ul>${R.evitar.map((x) => `<li>${esc(cap(x))}</li>`).join('')}</ul>`
    : '<p>Nenhuma contraindicação registrada nesta ficha.</p>';
  const resumo = `<section class="resumo" aria-label="Resumo">
    <div><h3>Para que serve</h3><p>${esc(cap(R.serve))}</p>${has(R.serveDetalhe) ? `<p class="det">${esc(R.serveDetalhe)}</p>` : ''}</div>
    <div><h3>Como preparar</h3><p>${prep}</p></div>
    <div><h3>Quem deve evitar</h3>${evitar}${R.seguro.length ? `<p class="det">Seguro para: ${R.seguro.map(esc).join(', ')}</p>` : ''}${R.interacoes ? `<p class="det">Toma remédio? Há ${R.interacoes} interações conhecidas — veja abaixo.</p>` : ''}</div>
  </section>`;

  const alertas = [
    a.alerta_critico ? `<div class="alerta"><strong>${esc(a.alerta_critico.titulo || 'Atenção')}</strong>${has(a.alerta_critico.titulo2) ? ` — ${esc(a.alerta_critico.titulo2)}` : ''}<p>${esc(a.alerta_critico.corpo || '')}</p></div>` : '',
    ...sec.alertas.map((al) => `<div class="alerta"><strong>${esc(al.titulo)}</strong>${ul(al.itens)}</div>`),
  ].join('');

  const body = [
    section('Identificação', dl([
      ['Nome científico', latin],
      ['Família botânica', id.familia_botanica],
      ['Tipo', id.tipo_botanico],
      ['Parte usada', id.parte_usada],
    ]) + ul(id.sinonimos)),
    section('Características', dl([
      ['Sabor', c.sabor_dominante],
      ['Aroma', c.aroma],
      ['Cor da infusão', c.cor_da_infusao],
      ['Intensidade', c.intensidade],
      ['Bioma de origem', c.bioma_de_origem],
    ])),
    section('Como preparar', dl([
      ['Temperatura', p.temperatura_ideal],
      ['Tempo de infusão', p.tempo_de_infusao],
      ['Quantidade', p.quantidade],
      ['Método', p.metodo],
      ['Melhor momento', p.melhor_momento],
      ['Combina com', p.combina_com],
    ])),
    // Ações sem as contraindicações que o schema 1.1 deixou vazar (fichaSecoes).
    section('Ações principais', ul(sec.acoes)),
    section('Componentes ativos', labeledList(a.componentes_ativos) + (sec.notas_componentes.length ? sec.notas_componentes.map((x) => `<p>${esc(x)}</p>`).join('') : '')),
    section('Contraindicações e cuidados', ul(sec.contraindicacoes)),
    section('Interações', labeledList(sec.interacoes_estruturadas) + ul(sec.interacoes)),
    section('Efeitos adversos e dose máxima', dl([
      ['Efeitos adversos', sec.efeitos_adversos],
      ['Dose máxima', sec.dose_maxima],
    ])),
    ...sec.notas.map((n) => section(n.titulo, ul(n.itens))),
    has(cu.historia) || has(cu.brasil)
      ? section('História e cultura', `${has(cu.historia) ? `<p>${esc(cu.historia)}</p>` : ''}${has(cu.brasil) ? `<p>${esc(cu.brasil)}</p>` : ''}`)
      : '',
    section('Status regulatório', dl([
      ['ANVISA (Brasil)', r.status_anvisa],
      ['EMA (Europa)', r.status_ema],
      ['FDA (EUA)', r.status_fda],
      ['Sazonalidade', r.sazonalidade],
    ])),
    // Sem fonte a seção não some: diz que está em revisão.
    `<section><h2>Fontes</h2>${R.fontes.length ? ul(R.fontes) : '<p class="mute">Fontes em revisão.</p>'}</section>`,
  ].join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(nome)} (${esc(latin)}) — preparo, benefícios e contraindicações | Ervatório</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/icon-192.png">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(nome)} — Ervopédia | Ervatório">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(nome)} — Ervopédia | Ervatório">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}
${FICHA_CSS}</style>
</head>
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/erva/">← Ervopédia</a>
  <h1>${esc(nome)}</h1>
  <div class="latin">${esc(latin)}</div>
  ${has(f.tagline) ? `<p class="tagline">${esc(f.tagline)}</p>` : ''}
</div></header>
<main class="wrap">
  ${resumo}
  <p>
    <a class="cta gold" href="/#ficha/${esc(slug)}">Abrir no Ervatório</a>
    <a class="cta" href="/#ervas">Explorar todas as ervas</a>
  </p>
  ${alertas}
  <div class="health"><strong>Aviso:</strong> conteúdo exclusivamente educacional — não substitui prescrição, diagnóstico ou aconselhamento médico. Consulte profissional de saúde qualificado antes de usar plantas medicinais, especialmente em gravidez, amamentação, uso de medicamentos ou doenças preexistentes.</div>
  <h2 class="tecnico">Detalhe técnico</h2>
  ${body}
  <section><h2>Ervas relacionadas</h2><div class="related">${related}</div></section>
</main>
<footer>
  <p>© 2026 Ervatório · <a href="/">ervatorio.com.br</a> · <a href="/privacidade.html">Privacidade</a> · <a href="/termos.html">Termos</a></p>
</footer>
</body>
</html>`;
}

function hubPage() {
  const cards = slugs
    .map((s) => ({ s, n: FICHAS[s].nome_popular || s, l: FICHAS[s].nome_cientifico || '' }))
    .sort((x, y) => x.n.localeCompare(y.n, 'pt'))
    .map(({ s, n, l }) => {
      const mono = esc((n[0] || '?').toUpperCase());
      const dataN = esc(`${n} ${l}`.toLowerCase());
      const thumb = thumbFor(s);
      const visual = thumb
        ? `<span class="ervo-thumb"><img src="${esc(thumb)}" alt="" loading="lazy" onerror="this.closest('.ervo-thumb').outerHTML='<span class=\\'ervo-mono\\' aria-hidden=\\'true\\'>${mono}</span>'"></span>`
        : `<span class="ervo-mono" aria-hidden="true">${mono}</span>`;
      return `<li data-n="${dataN}"><a href="/erva/${s}/">${visual}<span class="ervo-txt"><span class="ervo-nome">${esc(n)}</span>${l ? `<span class="ervo-lat">${esc(l)}</span>` : ''}</span></a></li>`;
    })
    .join('\n');
  const url = `${SITE}/erva/`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Ervopédia — enciclopédia de ervas do Ervatório',
    url,
    inLanguage: 'pt-BR',
    isPartOf: { '@type': 'WebSite', name: 'Ervatório', url: SITE },
  };
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ervopédia — ${slugs.length} ervas com ciência, preparo e cultura | Ervatório</title>
<meta name="description" content="Enciclopédia botânica do Ervatório: ${slugs.length} fichas de ervas com preparo, componentes ativos, contraindicações, status regulatório (ANVISA/EMA/FDA) e cultura.">
<link rel="canonical" href="${url}">
<link rel="icon" href="/icon-192.png">
<meta property="og:type" content="website">
<meta property="og:title" content="Ervopédia | Ervatório">
<meta property="og:description" content="${slugs.length} ervas com ciência, preparo e cultura.">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/images/optimized/hero/ervas-colecao-1024w.webp">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}</style>
  <link rel="stylesheet" href="/css/editorial-pages.css">
</head>
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/">← Ervatório</a>
  <h1>Ervopédia</h1>
  <p class="tagline">${slugs.length} ervas do Brasil e do mundo — ciência, preparo, segurança e cultura em cada ficha.</p>
</div></header>
<main class="wrap">
  <p><a class="cta gold" href="/">Abrir o Ervatório</a> <a class="cta" href="/lexico/">Léxico da Chazeria →</a> <a class="cta" href="/como-se-faz/">Como se faz →</a> <a class="cta" href="/biblioteca/">Biblioteca →</a></p>
  <div class="ervo-tools">
    <input type="search" id="ervoSearch" class="ervo-search" placeholder="Buscar por nome ou nome científico…" aria-label="Buscar erva" autocomplete="off">
    <div class="ervo-count" id="ervoCount">${slugs.length} ervas</div>
  </div>
  <ul class="ervo-grid" id="ervoGrid">
${cards}
  </ul>
  <p class="ervo-empty" id="ervoEmpty">Nenhuma erva encontrada.</p>
</main>
<footer>
  <p>© 2026 Ervatório · <a href="/">ervatorio.com.br</a> · <a href="/privacidade.html">Privacidade</a> · <a href="/termos.html">Termos</a></p>
</footer>
<script>
(function(){
  var input=document.getElementById('ervoSearch'),grid=document.getElementById('ervoGrid'),
      count=document.getElementById('ervoCount'),empty=document.getElementById('ervoEmpty');
  if(!input||!grid)return;
  var items=[].slice.call(grid.children),total=items.length;
  function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');}
  input.addEventListener('input',function(){
    var q=norm(input.value.trim()),n=0;
    items.forEach(function(li){
      var hit=!q||norm(li.getAttribute('data-n')).indexOf(q)>-1;
      li.style.display=hit?'':'none';if(hit)n++;
    });
    count.textContent=(q?n+' de '+total:total)+' ervas';
    empty.style.display=n?'none':'block';
  });
})();
</script>
</body>
</html>`;
}

// ── Léxico: CSS extra + páginas ──────────────────────���──────
const LEXICO_CSS = `
.eyebrow{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ouro2);font-weight:700;margin-bottom:6px}
.pron{color:#e6dcc8;font-size:.95rem;margin-top:8px}
.pron em{font-style:normal;color:var(--ouro2)}
.rel-terms{display:flex;flex-wrap:wrap;gap:8px}
.rel-terms a{background:var(--panel);border:1px solid var(--line);border-radius:99px;padding:6px 14px;text-decoration:none;color:var(--verde);font-size:.85rem}
ul.lex{list-style:none;padding:0;columns:2;column-gap:30px}
ul.lex li{break-inside:avoid;border-bottom:1px dashed var(--line);padding:7px 0}
ul.lex a{color:var(--verde);font-weight:700;text-decoration:none}
ul.lex .cat{display:block;font-size:.72rem;color:#7a6f57}
.lex-cta{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0}
@media(max-width:640px){ul.lex{columns:1}}`;

const lexBySlug = Object.fromEntries(LEXICO_TERMOS.map((t) => [t.slug, t]));

function lexicoTermPage(term) {
  const cat = LEXICO_CATEGORIAS[term.categoria] || 'Léxico';
  const url = `${SITE}/lexico/${term.slug}/`;
  const desc = String(term.def || '').slice(0, 158);
  const etim = [term.origem, term.trad && `"${term.trad}"`].filter(Boolean).join(' · ');

  const rel = (term.rel || []).filter((s) => lexBySlug[s])
    .map((s) => `<a href="/lexico/${s}/">${esc(lexBySlug[s].termo)}</a>`).join('');
  // Só linka fichas que existem de fato (evita link quebrado).
  const ervas = (term.ervas || []).filter((s) => FICHAS[s])
    .map((s) => `<a href="/erva/${s}/">${esc(FICHAS[s].nome_popular || s)}</a>`).join('');

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'DefinedTerm', name: term.termo, description: term.def, inDefinedTermSet: `${SITE}/lexico/`,
        termCode: term.slug, inLanguage: 'pt-BR',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ervatório', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Léxico', item: `${SITE}/lexico/` },
          { '@type': 'ListItem', position: 3, name: term.termo, item: url },
        ],
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(term.termo)} — o que é? | Léxico da Chazeria · Ervatório</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/icon-192.png">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(term.termo)} — Léxico da Chazeria | Ervatório">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/images/optimized/hero/ervas-colecao-1024w.webp">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(term.termo)} — Léxico | Ervatório">
<meta name="twitter:description" content="${esc(desc)}">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}${LEXICO_CSS}</style>
</head>
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/lexico/">← Léxico da Chazeria</a>
  <div class="eyebrow" style="margin-top:10px">${esc(cat)}</div>
  <h1>${esc(term.termo)}</h1>
  ${term.pron || etim ? `<p class="pron">${term.pron ? `<em>/${esc(term.pron)}/</em>` : ''}${term.pron && etim ? ' · ' : ''}${esc(etim)}</p>` : ''}
</div></header>
<main class="wrap">
  <section><p style="font-size:1.05rem">${esc(term.def)}</p></section>
  ${rel ? section('Termos relacionados', `<div class="rel-terms">${rel}</div>`) : ''}
  ${ervas ? section('Veja também nas ervas', `<div class="related">${ervas}</div>`) : ''}
  <div class="lex-cta">
    <a class="cta gold" href="/lexico/">Explorar o Léxico</a>
    <a class="cta" href="/erva/">Ir para a Ervopédia</a>
  </div>
  <div class="health"><strong>Aviso:</strong> conteúdo cultural e educacional sobre a linguagem do chá — não constitui aconselhamento de saúde.</div>
</main>
<footer>
  <p>© 2026 Ervatório · <a href="/">ervatorio.com.br</a> · <a href="/privacidade.html">Privacidade</a> · <a href="/termos.html">Termos</a></p>
</footer>
</body>
</html>`;
}

function lexicoHubPage() {
  const ordered = [...LEXICO_TERMOS].sort((a, b) => a.termo.localeCompare(b.termo, 'pt'));
  const links = ordered.map((t) =>
    `<li><a href="/lexico/${t.slug}/">${esc(t.termo)}</a> <span class="cat">${esc(LEXICO_CATEGORIAS[t.categoria] || '')}</span></li>`).join('\n');
  const url = `${SITE}/lexico/`;
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'DefinedTermSet',
    name: 'Léxico da Chazeria — a linguagem do chá', url, inLanguage: 'pt-BR',
    hasDefinedTerm: ordered.map((t) => ({ '@type': 'DefinedTerm', name: t.termo, url: `${SITE}/lexico/${t.slug}/` })),
  };
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Léxico da Chazeria — ${LEXICO_TERMOS.length} termos do chá explicados | Ervatório</title>
<meta name="description" content="A linguagem do chá em ${LEXICO_TERMOS.length} termos: métodos de preparo, utensílios, botânica, cultura brasileira e global, e vocabulário sensorial. Do gongfu cha ao chimarrão.">
<link rel="canonical" href="${url}">
<link rel="icon" href="/icon-192.png">
<meta property="og:type" content="website">
<meta property="og:title" content="Léxico da Chazeria | Ervatório">
<meta property="og:description" content="${LEXICO_TERMOS.length} termos do universo do chá, do gongfu cha ao chimarrão.">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/images/optimized/hero/ervas-colecao-1024w.webp">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}${LEXICO_CSS}</style>
</head>
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/">← Ervatório</a>
  <h1>Léxico da Chazeria</h1>
  <p class="tagline">A linguagem do chá em ${LEXICO_TERMOS.length} termos — métodos, utensílios, botânica e a cultura do Brasil e do mundo.</p>
</div></header>
<main class="wrap">
  <p><a class="cta gold" href="/">🍵 Abrir o Ervatório</a> <a class="cta" href="/erva/">Ervopédia →</a> <a class="cta" href="/como-se-faz/">Como se faz →</a> <a class="cta" href="/biblioteca/">Biblioteca →</a></p>
  <ul class="lex">
${links}
  </ul>
</main>
<footer>
  <p>© 2026 Ervatório · <a href="/">ervatorio.com.br</a> · <a href="/privacidade.html">Privacidade</a> · <a href="/termos.html">Termos</a></p>
</footer>
</body>
</html>`;
}

// ── "Como se faz": CSS extra + páginas ──────────────────────
const PROCESSO_CSS = `
.serie-tag{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ouro2);font-weight:700}
.tldr{background:#eef3ec;border:1px solid #cfe0cc;border-left:4px solid var(--verde2);border-radius:0 10px 10px 0;padding:14px 18px;margin:22px 0;font-size:1rem}
.tldr strong{color:var(--verde)}
article section p{margin:10px 0}
.serie-nav{display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;margin-top:8px}
.serie-nav a{color:var(--verde);text-decoration:none;font-weight:700;font-size:.9rem}
.refs{font-size:.82rem;color:#6b5a2e}.refs li{margin:4px 0}`;

const procByOrdem = [...PROCESSOS].sort((a, b) => a.ordem - b.ordem);
const TOTAL_PROC = procByOrdem.length;

function comoSeFazPage(proc) {
  const url = `${SITE}/como-se-faz/${proc.slug}/`;
  const nn = String(proc.ordem).padStart(2, '0');
  const desc = String(proc.tldr || '').slice(0, 158);

  const corpo = (proc.secoes || [])
    .map((s) => `<section><h2>${esc(s.h)}</h2>${(s.p || []).map((p) => `<p>${esc(p)}</p>`).join('')}</section>`).join('\n');

  const relLex = (proc.rel_lexico || []).filter((s) => lexBySlug[s])
    .map((s) => `<a href="/lexico/${s}/">${esc(lexBySlug[s].termo)}</a>`).join('');
  const relErvas = (proc.rel_ervas || []).filter((s) => FICHAS[s])
    .map((s) => `<a href="/erva/${s}/">${esc(FICHAS[s].nome_popular || s)}</a>`).join('');
  const refs = (proc.referencias || [])
    .map((r) => `<li>${esc(r.titulo)}${has(r.autor) ? ` — ${esc(r.autor)}` : ''}${has(r.ano) ? ` (${esc(r.ano)})` : ''}</li>`).join('');

  const prev = procByOrdem.find((x) => x.ordem === proc.ordem - 1);
  const next = procByOrdem.find((x) => x.ordem === proc.ordem + 1);
  const nav = `<div class="serie-nav">
    <span>${prev ? `<a href="/como-se-faz/${prev.slug}/">← ${esc(String(prev.ordem).padStart(2, '0'))} ${esc(prev.titulo)}</a>` : '<span></span>'}</span>
    <span><a href="/como-se-faz/">Ver a série (${TOTAL_PROC}) →</a></span>
    <span>${next ? `<a href="/como-se-faz/${next.slug}/">${esc(String(next.ordem).padStart(2, '0'))} ${esc(next.titulo)} →</a>` : ''}</span>
  </div>`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article', headline: `${proc.titulo}: ${proc.subtitulo}`.slice(0, 110),
        description: desc, inLanguage: 'pt-BR', mainEntityOfPage: url,
        image: `${SITE}/images/optimized/hero/ervas-colecao-1024w.webp`,
        author: { '@type': 'Organization', name: 'Ervatório', url: SITE },
        publisher: { '@type': 'Organization', name: 'Ervatório', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/icon-512.png` } },
        articleSection: 'Como se faz',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ervatório', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Como se faz', item: `${SITE}/como-se-faz/` },
          { '@type': 'ListItem', position: 3, name: proc.titulo, item: url },
        ],
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(proc.titulo)}: ${esc(proc.subtitulo)} — Como se faz o chá | Ervatório</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/icon-192.png">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(proc.titulo)} — Como se faz o chá | Ervatório">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/images/optimized/hero/ervas-colecao-1024w.webp">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(proc.titulo)} — Como se faz | Ervatório">
<meta name="twitter:description" content="${esc(desc)}">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}${PROCESSO_CSS}</style>
</head>
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/como-se-faz/">← Como se faz</a>
  <div class="serie-tag" style="margin-top:10px">Como se faz · ${nn} / ${String(TOTAL_PROC).padStart(2, '0')}</div>
  <h1>${esc(proc.titulo)}</h1>
  <div class="latin">${esc(proc.subtitulo)}</div>
</div></header>
<main class="wrap">
  <article>
    <div class="tldr"><strong>Em resumo:</strong> ${esc(proc.tldr)}</div>
    ${corpo}
  </article>
  ${relLex ? section('Termos relacionados', `<div class="related">${relLex}</div>`) : ''}
  ${relErvas ? section('Ervas relacionadas', `<div class="related">${relErvas}</div>`) : ''}
  ${refs ? `<section><h2>Referências</h2><ul class="refs">${refs}</ul></section>` : ''}
  <section><h2>Nesta série</h2>${nav}</section>
  <div class="health"><strong>Aviso:</strong> conteúdo cultural e educacional sobre o processamento de chás e ervas — não constitui aconselhamento de saúde.</div>
</main>
<footer>
  <p>© 2026 Ervatório · <a href="/">ervatorio.com.br</a> · <a href="/privacidade.html">Privacidade</a> · <a href="/termos.html">Termos</a></p>
</footer>
</body>
</html>`;
}

function comoSeFazHub() {
  const url = `${SITE}/como-se-faz/`;
  const cards = procByOrdem.map((p) =>
    `<li><a href="/como-se-faz/${p.slug}/"><span class="nn">${esc(String(p.ordem).padStart(2, '0'))}</span> ${esc(p.titulo)}</a> <span class="sub">${esc(p.subtitulo)}</span></li>`).join('\n');
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: 'Como se faz o chá — série editorial do Ervatório', url, inLanguage: 'pt-BR',
    hasPart: procByOrdem.map((p) => ({ '@type': 'Article', name: `${p.titulo}: ${p.subtitulo}`, url: `${SITE}/como-se-faz/${p.slug}/` })),
  };
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Como se faz o chá — da colheita à defumação (${TOTAL_PROC} etapas) | Ervatório</title>
<meta name="description" content="A jornada da folha à xícara em ${TOTAL_PROC} etapas: colheita, murchamento, enrolamento, oxidação, fixação, secagem e a defumação amazônica. Como o processamento define cada tipo de chá.">
<link rel="canonical" href="${url}">
<link rel="icon" href="/icon-192.png">
<meta property="og:type" content="website">
<meta property="og:title" content="Como se faz o chá | Ervatório">
<meta property="og:description" content="Da colheita à defumação — ${TOTAL_PROC} etapas que definem cada chá.">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/images/optimized/hero/ervas-colecao-1024w.webp">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}${PROCESSO_CSS}
ul.serie{list-style:none;padding:0}
ul.serie li{border-bottom:1px dashed var(--line);padding:12px 0}
ul.serie a{color:var(--verde);font-weight:700;text-decoration:none;font-size:1.05rem}
ul.serie .nn{color:var(--ouro);font-family:Georgia,serif}
ul.serie .sub{display:block;color:#7a6f57;font-size:.88rem}</style>
</head>
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/">← Ervatório</a>
  <h1>Como se faz o chá</h1>
  <p class="tagline">Da folha no galho à xícara: ${TOTAL_PROC} etapas que decidem se um chá vira verde, oolong ou preto — e o saber brasileiro que os guias globais ignoram.</p>
</div></header>
<main class="wrap">
  <p><a class="cta gold" href="/">🍵 Abrir o Ervatório</a> <a class="cta" href="/lexico/">Léxico da Chazeria →</a> <a class="cta" href="/biblioteca/">Biblioteca →</a></p>
  <ul class="serie">
${cards}
  </ul>
</main>
<footer>
  <p>© 2026 Ervatório · <a href="/">ervatorio.com.br</a> · <a href="/privacidade.html">Privacidade</a> · <a href="/termos.html">Termos</a></p>
</footer>
</body>
</html>`;
}

// ── Biblioteca: CSS (com print) + páginas ───────────────────
const BIBLIOTECA_CSS = `
.print-btn{display:inline-block;background:var(--ouro);color:#1c1608;border:1px solid var(--ouro);border-radius:10px;padding:12px 22px;font-size:.95rem;font-weight:700;cursor:pointer;font-family:inherit;margin:8px 0 4px}
.guia-table{width:100%;border-collapse:collapse;font-size:.9rem;margin:6px 0}
.guia-table th,.guia-table td{border:1px solid var(--line);padding:7px 10px;text-align:left;vertical-align:top}
.guia-table th{background:var(--panel);color:var(--verde);font-size:.82rem}
.lex-item{border-bottom:1px dashed var(--line);padding:8px 0}
.lex-item strong{color:var(--verde)}
.lex-item .cat{color:#7a6f57;font-size:.78rem}
.step{border-bottom:1px dashed var(--line);padding:10px 0}
.step .nn{color:var(--ouro);font-weight:700;font-family:Georgia,serif;margin-right:6px}
.step .sub{color:#7a6f57;font-size:.88rem}
@media print{
  header.hero{background:#fff !important;color:#000 !important;border-bottom:2px solid #000;padding:0 0 10px}
  header.hero h1,.latin{color:#000 !important}
  .back,.print-btn,.lex-cta,.cta,footer,.health{display:none !important}
  body{background:#fff;color:#000}
  h2{color:#000;border-color:#999}
  .guia-table th{background:#eee;color:#000}
  main{padding:10px 0}
  a{color:#000;text-decoration:none}
}`;

function guiaCorpo(guia) {
  if (guia.tipo === 'preparo') {
    const rows = PREPARO_TABELA.map((r) =>
      `<tr><td><strong>${esc(r.tipo)}</strong></td><td>${esc(r.temp)}</td><td>${esc(r.tempo)}</td><td>${esc(r.proporcao)}</td><td>${esc(r.reinfusoes)}</td></tr>`).join('');
    return `<table class="guia-table">
      <thead><tr><th>Tipo</th><th>Água</th><th>Tempo</th><th>Proporção</th><th>Reinfusões</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p style="font-size:.82rem;color:#6b5a2e;margin-top:10px">Orientações gerais — ajuste ao seu gosto e ao tipo de folha. Mate: nunca ferver a água.</p>`;
  }
  if (guia.tipo === 'lexico') {
    const items = (guia.termos || []).filter((s) => lexBySlug[s]).map((s) => {
      const t = lexBySlug[s];
      return `<div class="lex-item"><strong>${esc(t.termo)}</strong> <span class="cat">${esc(LEXICO_CATEGORIAS[t.categoria] || '')}</span><br>${esc(t.def)}</div>`;
    }).join('');
    return `<div>${items}</div><p style="margin-top:12px"><a href="/lexico/">Ver o Léxico completo (${LEXICO_TERMOS.length} termos) →</a></p>`;
  }
  if (guia.tipo === 'processos') {
    const steps = procByOrdem.map((p) =>
      `<div class="step"><span class="nn">${esc(String(p.ordem).padStart(2, '0'))}</span><strong>${esc(p.titulo)}</strong> <span class="sub">��� ${esc(p.subtitulo)}</span><br>${esc(p.tldr)}</div>`).join('');
    return `<div>${steps}</div><p style="margin-top:12px"><a href="/como-se-faz/">Ler a série completa →</a></p>`;
  }
  return '';
}

function bibliotecaGuiaPage(guia) {
  const url = `${SITE}/biblioteca/${guia.slug}/`;
  const desc = String(guia.desc || '').slice(0, 158);
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article', headline: `${guia.titulo}`.slice(0, 110), description: desc,
        inLanguage: 'pt-BR', mainEntityOfPage: url, articleSection: 'Biblioteca',
        author: { '@type': 'Organization', name: 'Ervatório', url: SITE },
        publisher: { '@type': 'Organization', name: 'Ervatório', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/icon-512.png` } },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ervatório', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Biblioteca', item: `${SITE}/biblioteca/` },
          { '@type': 'ListItem', position: 3, name: guia.titulo, item: url },
        ],
      },
    ],
  };
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(guia.titulo)} — guia para imprimir | Ervatório</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/icon-192.png">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(guia.titulo)} | Ervatório">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/images/optimized/hero/ervas-colecao-1024w.webp">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}${BIBLIOTECA_CSS}</style>
</head>
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/biblioteca/">← Biblioteca</a>
  <h1>${esc(guia.titulo)}</h1>
  <div class="latin">${esc(guia.subtitulo)}</div>
</div></header>
<main class="wrap">
  <button class="print-btn" onclick="window.print()">🖨 Salvar como PDF / Imprimir</button>
  ${guiaCorpo(guia)}
  <div class="health"><strong>Aviso:</strong> guia educacional sobre preparo e cultura do chá — não constitui aconselhamento de saúde.</div>
</main>
<footer>
  <p>© 2026 Ervatório · <a href="/">ervatorio.com.br</a> · <a href="/privacidade.html">Privacidade</a> · <a href="/termos.html">Termos</a></p>
</footer>
</body>
</html>`;
}

function bibliotecaHub() {
  const url = `${SITE}/biblioteca/`;
  const cards = BIBLIOTECA_GUIAS.map((g) =>
    `<li><a href="/biblioteca/${g.slug}/">${esc(g.titulo)}</a> <span class="sub">${esc(g.subtitulo)}</span><br><span class="d">${esc(g.desc)}</span></li>`).join('\n');
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: 'Biblioteca do Ervatório — guias do chá para imprimir', url, inLanguage: 'pt-BR',
    hasPart: BIBLIOTECA_GUIAS.map((g) => ({ '@type': 'Article', name: g.titulo, url: `${SITE}/biblioteca/${g.slug}/` })),
  };
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Biblioteca — guias do chá para imprimir e salvar em PDF | Ervatório</title>
<meta name="description" content="Guias práticos do chá para imprimir ou salvar em PDF: preparo por tipo, mini-léxico e o resumo de como o chá é feito.">
<link rel="canonical" href="${url}">
<link rel="icon" href="/icon-192.png">
<meta property="og:type" content="website">
<meta property="og:title" content="Biblioteca | Ervatório">
<meta property="og:description" content="Guias do chá para imprimir e salvar em PDF.">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/images/optimized/hero/ervas-colecao-1024w.webp">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}
ul.biblio{list-style:none;padding:0}
ul.biblio li{border-bottom:1px dashed var(--line);padding:14px 0}
ul.biblio a{color:var(--verde);font-weight:700;text-decoration:none;font-size:1.1rem}
ul.biblio .sub{color:#7a6f57;font-size:.9rem}
ul.biblio .d{color:var(--ink);font-size:.9rem}</style>
</head>
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/">← Ervatório</a>
  <h1>Biblioteca</h1>
  <p class="tagline">Guias do chá para imprimir ou salvar em PDF — preparo, léxico e processo, num clique.</p>
</div></header>
<main class="wrap">
  <p><a class="cta gold" href="/">🍵 Abrir o Ervatório</a> <a class="cta" href="/lexico/">Léxico →</a> <a class="cta" href="/como-se-faz/">Como se faz →</a></p>
  <ul class="biblio">
${cards}
  </ul>
</main>
<footer>
  <p>© 2026 Ervatório · <a href="/">ervatorio.com.br</a> · <a href="/privacidade.html">Privacidade</a> · <a href="/termos.html">Termos</a></p>
</footer>
</body>
</html>`;
}

// ── Receitas, blends prontos e tipos de chá (PR 10) ─────────
const HERB_BY_ID = Object.fromEntries(HERBS.map((h) => [h.id, h]));
// Erva do catálogo → slug da ficha editorial (mesma casa de herbDaFicha).
function fichaSlugDeHerb(h) {
  if (!h) return null;
  const hn = _nrm(h.n), hl = h.lat ? _nrm(h.lat.split(' ').slice(0, 2).join(' ')) : '';
  for (const [slug, f] of Object.entries(FICHAS)) {
    if (_nrm(f.nome_popular) === hn) return slug;
    if (hl && f.nome_cientifico && _nrm(f.nome_cientifico).startsWith(hl)) return slug;
  }
  return null;
}
function linkErva(h) {
  const slug = fichaSlugDeHerb(h);
  return slug ? `<a href="/erva/${slug}/">${esc(h.n)}</a>` : `<span>${esc(h.n)}</span>`;
}
function imagemProduto(nome) {
  if (!nome) return null;
  const ext = REC_IMG_EXT[nome] || 'png';
  for (const e of [ext, ext === 'png' ? 'jpg' : 'png']) {
    const p = `images/produtos/${nome}.${e}`;
    if (existsSync(p)) return `/${p}`;
  }
  return null;
}
// «15 min» → PT15M; «1 h 20 min» → PT1H20M. Sem número: null.
function duracaoISO(txt) {
  const h = String(txt || '').match(/(\d+)\s*h/i), m = String(txt || '').match(/(\d+)\s*min/i);
  if (!h && !m) return null;
  return `PT${h ? h[1] + 'H' : ''}${m ? m[1] + 'M' : ''}`;
}
const REC_CAT = { quente: 'Quente', gelado: 'Gelada', mocktail: 'Mocktail', medicinal: 'Medicinal', culinario: 'Culinária', ritual: 'Ritual' };
const CONTEUDO_CSS = `
.meta{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:.88rem;color:#6b5a2e;margin:6px 0 0}
.meta span{white-space:nowrap}
.foto{margin:0 0 18px;border-radius:14px;overflow:hidden;background:var(--panel);border:1px solid var(--line);max-width:520px}
.foto img{display:block;width:100%;height:auto}
ol.passos{padding-left:26px}ol.passos li{margin:8px 0;font-size:.98rem}
.dica{background:#eef3ec;border:1px solid #cfe0cc;border-left:4px solid var(--verde2);border-radius:0 10px 10px 0;padding:12px 16px;margin:18px 0;font-size:.95rem}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chips span{background:var(--panel);border:1px solid var(--line);border-radius:99px;padding:5px 12px;font-size:.85rem}
ul.lista{list-style:none;padding:0}ul.lista li{border-bottom:1px dashed var(--line);padding:12px 0}
ul.lista a{color:var(--verde);font-weight:700;text-decoration:none;font-size:1.05rem}
ul.lista .sub{display:block;color:#7a6f57;font-size:.88rem}
.grupo{font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ouro2);margin:26px 0 4px;font-weight:700}
.linha{display:flex;gap:14px;align-items:flex-start;margin:10px 0}.linha .ano{flex:0 0 110px;font-weight:700;color:#6b5a2e;font-size:.9rem}
.tag{margin-top:10px;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ouro2);font-weight:700}
meter.barra{width:220px;height:12px;vertical-align:middle}
`;

const RODAPE_ANTIGO = `<footer>
  <p>© 2026 Ervatório · <a href="/">ervatorio.com.br</a> · <a href="/privacidade.html">Privacidade</a> · <a href="/termos.html">Termos</a></p>
</footer>`;

function cabecaHtml({ title, desc, url, ogType, ogImage, jsonld, extraCss }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/icon-192.png">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}${CONTEUDO_CSS}${extraCss || ''}</style>
</head>`;
}
const OG_PADRAO = `${SITE}/images/optimized/hero/ervas-colecao-1024w.webp`;
const AVISO_SAUDE = '<div class="health"><strong>Aviso:</strong> conteúdo educacional — não substitui orientação médica. Consulte um profissional antes de usar plantas medicinais, especialmente na gravidez, amamentação ou uso de medicamentos.</div>';

// Receita
function receitaPage(r) {
  const url = `${SITE}/receitas/${r.id}/`;
  const desc = String(r.subtitulo || r.nome).slice(0, 158);
  const foto = imagemProduto(r.img);
  const ervas = (r.ervas_ids || []).map((id) => HERB_BY_ID[id]).filter(Boolean);
  const relacionadas = RECEITAS.filter((x) => x.id !== r.id && x.categoria === r.categoria).slice(0, 4)
    .map((x) => `<a href="/receitas/${x.id}/">${esc(x.nome)}</a>`).join('');
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Recipe', name: r.nome, description: desc, inLanguage: 'pt-BR', url,
        image: foto ? `${SITE}${foto}` : OG_PADRAO,
        author: { '@type': 'Organization', name: 'Ervatório', url: SITE },
        recipeCategory: REC_CAT[r.categoria] || r.categoria,
        recipeYield: r.porcoes || undefined,
        prepTime: duracaoISO(r.tempo_prep) || undefined,
        totalTime: duracaoISO(r.tempo_total) || undefined,
        keywords: (r.tags || []).join(', ') || undefined,
        recipeIngredient: r.ingredientes || [],
        recipeInstructions: (r.modo || []).map((t, i) => ({ '@type': 'HowToStep', position: i + 1, text: t })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ervatório', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Receitas', item: `${SITE}/receitas/` },
          { '@type': 'ListItem', position: 3, name: r.nome, item: url },
        ],
      },
    ],
  };
  return `${cabecaHtml({ title: `${r.nome} — receita ${REC_CAT[r.categoria] ? (REC_CAT[r.categoria]).toLowerCase() : ''} com ervas | Ervatório`, desc, url, ogType: 'article', ogImage: foto ? `${SITE}${foto}` : OG_PADRAO, jsonld })}
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/receitas/">← Receitas</a>
  <h1>${esc(r.nome)}</h1>
  ${has(r.subtitulo) ? `<div class="latin">${esc(r.subtitulo)}</div>` : ''}
  <div class="meta"><span>${esc(REC_CAT[r.categoria] || r.categoria)}</span>${has(r.nivel) ? `<span>${esc(r.nivel)}</span>` : ''}${has(r.tempo_total) ? `<span>${esc(r.tempo_total)}</span>` : ''}${has(r.porcoes) ? `<span>${esc(r.porcoes)}</span>` : ''}</div>
</div></header>
<main class="wrap">
  ${foto ? `<figure class="foto"><img src="${foto}" alt="${esc(r.nome)}" loading="lazy"></figure>` : ''}
  <p>
    <a class="cta gold" href="/#receitas/${esc(r.id)}">Abrir no Ervatório</a>
    <a class="cta" href="/receitas/">Todas as receitas</a>
  </p>
  ${ervas.length ? section('Ervas desta receita', `<div class="related">${ervas.map(linkErva).join('')}</div>`) : ''}
  ${section('Ingredientes', ul(r.ingredientes))}
  ${section('Modo de preparo', `<ol class="passos">${(r.modo || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`)}
  ${has(r.dica) ? `<div class="dica"><strong>Dica:</strong> ${esc(r.dica)}</div>` : ''}
  ${has(r.beneficios) ? section('Benefícios', `<p>${esc(r.beneficios)}</p>`) : ''}
  ${has(r.pairing) ? section('Harmonização', `<p>${esc(r.pairing)}</p>`) : ''}
  ${(r.tags || []).length ? section('Tags', `<div class="chips">${r.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>`) : ''}
  ${AVISO_SAUDE}
  ${relacionadas ? section('Mais receitas assim', `<div class="related">${relacionadas}</div>`) : ''}
</main>
${RODAPE_ANTIGO}
</body>
</html>`;
}

function receitasHub() {
  const url = `${SITE}/receitas/`;
  const ordem = ['quente', 'gelado', 'mocktail', 'medicinal', 'culinario', 'ritual'];
  const grupos = ordem.filter((c) => RECEITAS.some((r) => r.categoria === c)).map((c) =>
    `<div class="grupo">${esc(REC_CAT[c] || c)}</div><ul class="lista">${RECEITAS.filter((r) => r.categoria === c).map((r) =>
      `<li><a href="/receitas/${r.id}/">${esc(r.nome)}</a> <span class="sub">${esc(r.subtitulo || '')}${has(r.tempo_total) ? ` · ${esc(r.tempo_total)}` : ''}</span></li>`).join('\n')}</ul>`).join('\n');
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: 'Receitas com ervas — Ervatório', url, inLanguage: 'pt-BR',
    hasPart: RECEITAS.map((r) => ({ '@type': 'Recipe', name: r.nome, url: `${SITE}/receitas/${r.id}/` })),
  };
  return `${cabecaHtml({ title: `Receitas com ervas — ${RECEITAS.length} chás, drinks e preparos | Ervatório`, desc: `${RECEITAS.length} receitas com ervas brasileiras: chás quentes, gelados, mocktails, medicinais, culinárias e rituais. Ingredientes, modo de preparo e as ervas de cada uma.`, url, ogType: 'website', ogImage: OG_PADRAO, jsonld })}
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/">← Ervatório</a>
  <h1>Receitas com ervas</h1>
  <p class="tagline">${RECEITAS.length} preparos, do chai brasileiro ao cold brew de mate — com as ervas de cada um ligadas às fichas.</p>
</div></header>
<main class="wrap">
  <p><a class="cta gold" href="/#receitas">Abrir no Ervatório</a> <a class="cta" href="/blends/">Blends prontos</a> <a class="cta" href="/erva/">Guia de Ervas</a></p>
${grupos}
  ${AVISO_SAUDE}
</main>
${RODAPE_ANTIGO}
</body>
</html>`;
}

// Blend pronto
const BLENDS = Object.entries(BLEND_DB).map(([chave, b]) => {
  const intencao = Object.entries(INTENCOES).find(([, def]) => def.blend === chave)?.[0] || null;
  return { chave, slug: slugify(b.name), intencao, ...b };
});
if (new Set(BLENDS.map((b) => b.slug)).size !== BLENDS.length) throw new Error('prerender: slug de blend repetido');

function blendPage(b) {
  const url = `${SITE}/blends/${b.slug}/`;
  const desc = String(b.tagline || b.name).slice(0, 158);
  const ervas = (b.ings || []).map((i) => HERB_BY_ID[i.id] || { id: i.id, n: i.n, lat: '' });
  const outros = BLENDS.filter((x) => x.slug !== b.slug).slice(0, 4).map((x) => `<a href="/blends/${x.slug}/">${esc(x.name)}</a>`).join('');
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Recipe', name: b.name, description: desc, inLanguage: 'pt-BR', url, image: OG_PADRAO,
        author: { '@type': 'Organization', name: 'Ervatório', url: SITE },
        recipeCategory: 'Blend de ervas',
        recipeIngredient: (b.ings || []).map((i) => `${i.amount} de ${i.n}`),
        recipeInstructions: (b.steps || []).map((t, i) => ({ '@type': 'HowToStep', position: i + 1, text: t })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ervatório', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Blends prontos', item: `${SITE}/blends/` },
          { '@type': 'ListItem', position: 3, name: b.name, item: url },
        ],
      },
    ],
  };
  const ctaApp = b.intencao ? `/#encontrar/${b.intencao}` : '/#blends/prontos';
  return `${cabecaHtml({ title: `${b.name} — blend pronto para ${b.chave === 'default' ? 'o dia a dia' : b.chave.toLowerCase()} | Ervatório`, desc, url, ogType: 'article', ogImage: OG_PADRAO, jsonld })}
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/blends/">← Blends prontos</a>
  <div class="tag">${b.chave === 'default' ? 'Para o dia a dia' : esc(b.chave)}</div>
  <h1>${esc(b.name)}</h1>
  ${has(b.tagline) ? `<div class="latin">${esc(b.tagline)}</div>` : ''}
</div></header>
<main class="wrap">
  <p>
    <a class="cta gold" href="${ctaApp}">Abrir no Ervatório</a>
    <a class="cta" href="/#blends/manual">Montar o meu blend</a>
  </p>
  ${section('Ervas e proporção', `<ul>${(b.ings || []).map((i) => `<li><strong>${esc(i.amount)}</strong> de ${linkErva(HERB_BY_ID[i.id] || { n: i.n })}</li>`).join('')}</ul>`)}
  ${section('Como preparar', `<ol class="passos">${(b.steps || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`)}
  ${(b.effects || []).length ? section('O que esperar', `<div class="chips">${b.effects.map((e) => `<span>${esc(e)}</span>`).join('')}</div>`) : ''}
  ${has(b.obs) ? `<div class="dica"><strong>Observação:</strong> ${esc(b.obs)}</div>` : ''}
  ${AVISO_SAUDE}
  ${outros ? section('Outros blends prontos', `<div class="related">${outros}</div>`) : ''}
</main>
${RODAPE_ANTIGO}
</body>
</html>`;
}

function blendsHub() {
  const url = `${SITE}/blends/`;
  const itens = BLENDS.map((b) =>
    `<li><a href="/blends/${b.slug}/">${esc(b.name)}</a> <span class="sub">${b.chave === 'default' ? 'Para o dia a dia' : esc(b.chave)} · ${(b.ings || []).map((i) => esc(i.n)).join(', ')}</span></li>`).join('\n');
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: 'Blends prontos — Ervatório', url, inLanguage: 'pt-BR',
    hasPart: BLENDS.map((b) => ({ '@type': 'Recipe', name: b.name, url: `${SITE}/blends/${b.slug}/` })),
  };
  return `${cabecaHtml({ title: `Blends prontos — ${BLENDS.length} misturas de ervas por momento | Ervatório`, desc: `${BLENDS.length} blends de ervas com proporção, preparo e cuidados: para dormir, para o foco, para a digestão, para a ansiedade e mais.`, url, ogType: 'website', ogImage: OG_PADRAO, jsonld })}
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/">← Ervatório</a>
  <h1>Blends prontos</h1>
  <p class="tagline">${BLENDS.length} misturas testadas, cada uma para um momento — as mesmas que o «Encontre seu chá» sugere.</p>
</div></header>
<main class="wrap">
  <p><a class="cta gold" href="/#encontrar">Encontre seu chá</a> <a class="cta" href="/#blends/manual">Montar o meu blend</a> <a class="cta" href="/receitas/">Receitas</a></p>
  <ul class="lista">
${itens}
  </ul>
  ${AVISO_SAUDE}
</main>
${RODAPE_ANTIGO}
</body>
</html>`;
}

// Tipo de chá (Camellia sinensis)
function chaPage(c) {
  const url = `${SITE}/chas/${c.id}/`;
  const desc = String(c.tagline || c.name).slice(0, 158);
  const foto = existsSync(c.img || '') ? `/${c.img}` : null;
  const outros = CHAS_DATA.filter((x) => x.id !== c.id).map((x) => `<a href="/chas/${x.id}/">${esc(x.name)}</a>`).join('');
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article', headline: `${c.name} — ${c.tagline}`.slice(0, 110), description: desc, inLanguage: 'pt-BR', mainEntityOfPage: url,
        image: foto ? `${SITE}${foto}` : OG_PADRAO,
        author: { '@type': 'Organization', name: 'Ervatório', url: SITE },
        publisher: { '@type': 'Organization', name: 'Ervatório', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/icon-512.png` } },
        about: { '@type': 'Thing', name: c.name, alternateName: 'Camellia sinensis' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ervatório', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Tipos de chá', item: `${SITE}/chas/` },
          { '@type': 'ListItem', position: 3, name: c.name, item: url },
        ],
      },
    ],
  };
  return `${cabecaHtml({ title: `${c.name} — preparo, sabor, história e variedades | Ervatório`, desc, url, ogType: 'article', ogImage: foto ? `${SITE}${foto}` : OG_PADRAO, jsonld })}
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/chas/">← Tipos de chá</a>
  <h1>${esc(c.name)}</h1>
  ${has(c.latin) ? `<div class="latin">${esc(c.latin)}</div>` : ''}
  ${has(c.tagline) ? `<p class="tagline">${esc(c.tagline)}</p>` : ''}
</div></header>
<main class="wrap">
  ${foto ? `<figure class="foto"><img src="${foto}" alt="${esc(c.name)}" loading="lazy"></figure>` : ''}
  <p>
    <a class="cta gold" href="/#chas/${esc(c.id)}">Abrir no Ervatório</a>
    <a class="cta" href="/chas/">Os seis tipos</a>
  </p>
  ${section('Oxidação', `<p><meter class="barra" min="0" max="100" value="${Number(c.oxidation) || 0}">${esc(String(c.oxidation))}%</meter> ${esc(String(c.oxidation))}% — de 0 (chá branco) a 100 (chá preto).</p>`)}
  ${section('Como preparar', dl([['Temperatura', c.temp], ['Tempo', c.tempo], ['Dose', c.dose], ['Cafeína', c.cafeina], ['Melhor momento', c.momento]]) + ((c.preparo || []).length ? `<ol class="passos">${c.preparo.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : ''))}
  ${(c.sabores || []).length ? section('Perfil de sabor', `<div class="chips">${c.sabores.map((x) => `<span>${esc(x)}</span>`).join('')}</div>`) : ''}
  ${section('Benefícios', ul(c.beneficios))}
  ${(c.variedades || []).length ? section('Variedades', `<ul>${c.variedades.map((v) => `<li><strong>${esc(v.n)}</strong>${has(v.orig) ? ` (${esc(v.orig)})` : ''}${has(v.d) ? ` — ${esc(v.d)}` : ''}</li>`).join('')}</ul>`) : ''}
  ${section('Regiões', ul(c.regioes))}
  ${(c.historia || []).length ? section('História', c.historia.map((h) => `<div class="linha"><span class="ano">${esc(h.year)}</span><span>${esc(h.text)}</span></div>`).join('')) : ''}
  ${section('Harmonização', ul(c.harmonizacao))}
  ${has(c.curiosidades) ? section('Curiosidade', `<p>${esc(c.curiosidades)}</p>`) : ''}
  ${AVISO_SAUDE}
  ${section('Os outros tipos', `<div class="related">${outros}</div>`)}
</main>
${RODAPE_ANTIGO}
</body>
</html>`;
}

function chasHub() {
  const url = `${SITE}/chas/`;
  const itens = CHAS_DATA.map((c) =>
    `<li><a href="/chas/${c.id}/">${esc(c.name)}</a> <span class="sub">${esc(c.tagline || '')} · oxidação ${esc(String(c.oxidation))}% · ${esc(c.cafeina || '')}</span></li>`).join('\n');
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: 'Tipos de chá (Camellia sinensis) — Ervatório', url, inLanguage: 'pt-BR',
    hasPart: CHAS_DATA.map((c) => ({ '@type': 'Article', name: c.name, url: `${SITE}/chas/${c.id}/` })),
  };
  return `${cabecaHtml({ title: 'Tipos de chá — os seis filhos da Camellia sinensis | Ervatório', desc: 'Branco, verde, amarelo, oolong, preto e pu-erh: uma planta, seis processos. Preparo, sabor, cafeína, história e variedades de cada tipo.', url, ogType: 'website', ogImage: OG_PADRAO, jsonld })}
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/">← Ervatório</a>
  <h1>Tipos de chá</h1>
  <p class="tagline">Uma única planta, seis universos: o que muda é a oxidação — e com ela o sabor, a cafeína e o preparo.</p>
</div></header>
<main class="wrap">
  <p><a class="cta gold" href="/#chas">Abrir no Ervatório</a> <a class="cta" href="/como-se-faz/">Como se faz o chá</a> <a class="cta" href="/erva/">Guia de Ervas</a></p>
  <ul class="lista">
${itens}
  </ul>
  ${AVISO_SAUDE}
</main>
${RODAPE_ANTIGO}
</body>
</html>`;
}

// ── Geração ─────────────────────────────────────────────────
let count = 0;
for (const [i, slug] of slugs.entries()) {
  const dir = join('erva', slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), moldura(fichaPage(slug, FICHAS[slug], i), { secao: '/erva/' }));
  count++;
}
writeFileSync(join('erva', 'index.html'), moldura(hubPage(), { secao: '/erva/' }));

// Léxico da Chazeria
let lexCount = 0;
for (const term of LEXICO_TERMOS) {
  const dir = join('lexico', term.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), moldura(lexicoTermPage(term), { secao: '/lexico/' }));
  lexCount++;
}
writeFileSync(join('lexico', 'index.html'), moldura(lexicoHubPage(), { secao: '/lexico/' }));

// Série "Como se faz"
let procCount = 0;
for (const proc of PROCESSOS) {
  const dir = join('como-se-faz', proc.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), moldura(comoSeFazPage(proc), { secao: '/como-se-faz/' }));
  procCount++;
}
writeFileSync(join('como-se-faz', 'index.html'), moldura(comoSeFazHub(), { secao: '/como-se-faz/' }));

// Biblioteca (guias imprimíveis)
let bibCount = 0;
for (const guia of BIBLIOTECA_GUIAS) {
  const dir = join('biblioteca', guia.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), moldura(bibliotecaGuiaPage(guia), { secao: '/biblioteca/' }));
  bibCount++;
}
writeFileSync(join('biblioteca', 'index.html'), moldura(bibliotecaHub(), { secao: '/biblioteca/' }));

// Receitas, blends prontos e tipos de chá (PR 10)
let recCount = 0;
for (const r of RECEITAS) {
  const dir = join('receitas', r.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), moldura(receitaPage(r), { secao: '/receitas/' }));
  recCount++;
}
writeFileSync(join('receitas', 'index.html'), moldura(receitasHub(), { secao: '/receitas/' }));
let blendCount = 0;
for (const b of BLENDS) {
  const dir = join('blends', b.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), moldura(blendPage(b), { secao: '/blends/' }));
  blendCount++;
}
writeFileSync(join('blends', 'index.html'), moldura(blendsHub(), { secao: '/blends/' }));
let chaCount = 0;
for (const c of CHAS_DATA) {
  const dir = join('chas', c.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), moldura(chaPage(c), { secao: '/chas/' }));
  chaCount++;
}
writeFileSync(join('chas', 'index.html'), moldura(chasHub(), { secao: '/chas/' }));

// Páginas escritas à mão: recebem o mesmo cabeçalho pelos marcadores.
for (const arquivo of ['pausa.html', 'privacidade.html', 'termos.html', 'descadastro.html']) aplicarMarcadores(arquivo, {});

// sitemap.xml
const staticUrls = [
  { loc: `${SITE}/`, priority: '1.0' },
  { loc: `${SITE}/erva/`, priority: '0.9' },
  { loc: `${SITE}/lexico/`, priority: '0.7' },
  { loc: `${SITE}/como-se-faz/`, priority: '0.7' },
  { loc: `${SITE}/biblioteca/`, priority: '0.6' },
  { loc: `${SITE}/receitas/`, priority: '0.8' },
  { loc: `${SITE}/blends/`, priority: '0.7' },
  { loc: `${SITE}/chas/`, priority: '0.8' },
  { loc: `${SITE}/privacidade.html`, priority: '0.3' },
  { loc: `${SITE}/termos.html`, priority: '0.3' },
];
const urls = staticUrls
  .concat(slugs.map((s) => ({ loc: `${SITE}/erva/${s}/`, priority: '0.8' })))
  .concat(LEXICO_TERMOS.map((t) => ({ loc: `${SITE}/lexico/${t.slug}/`, priority: '0.6' })))
  .concat(PROCESSOS.map((p) => ({ loc: `${SITE}/como-se-faz/${p.slug}/`, priority: '0.7' })))
  .concat(BIBLIOTECA_GUIAS.map((g) => ({ loc: `${SITE}/biblioteca/${g.slug}/`, priority: '0.5' })))
  .concat(RECEITAS.map((r) => ({ loc: `${SITE}/receitas/${r.id}/`, priority: '0.7' })))
  .concat(BLENDS.map((b) => ({ loc: `${SITE}/blends/${b.slug}/`, priority: '0.6' })))
  .concat(CHAS_DATA.map((c) => ({ loc: `${SITE}/chas/${c.id}/`, priority: '0.7' })));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${TODAY}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
writeFileSync('sitemap.xml', sitemap);

// robots.txt
writeFileSync('robots.txt', `User-agent: *
Allow: /
Disallow: /admin.html

Sitemap: ${SITE}/sitemap.xml
`);

console.log(`✓ ${count} páginas de erva + hub geradas em /erva/`);
console.log(`✓ ${lexCount} termos do léxico + hub gerados em /lexico/`);
console.log(`✓ ${procCount} artigos "como se faz" + hub gerados em /como-se-faz/`);
console.log(`✓ ${bibCount} guias da biblioteca + hub gerados em /biblioteca/`);
console.log(`✓ ${recCount} receitas + hub em /receitas/, ${blendCount} blends + hub em /blends/, ${chaCount} tipos de chá + hub em /chas/`);
console.log(`✓ sitemap.xml (${urls.length} URLs) e robots.txt escritos`);
if (!existsSync('images/manifest.json')) console.warn('! images/manifest.json ausente — OG images caíram no fallback');
