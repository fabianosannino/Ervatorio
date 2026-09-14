// ============================================================
// Cabeçalho único nas páginas estáticas (handoff 14/09, PR 03b)
// ============================================================
// Gera, em HTML puro e em português, o mesmo cabeçalho que js/app.js
// renderiza no app: barra com os três grupos, busca, estante e Meu
// Ervatório; sub-navegação do grupo da página; folha do menu (mobile) e
// rodapé. A fonte é UMA — js/nav-data.js (grupos) e js/i18n.js (rótulos
// PT) — lidos aqui como texto, sem navegador, do mesmo jeito que o
// prerender lê js/fichas-data.js.
//
// O que fica de fora nas páginas estáticas, e por quê (D23):
//   • Loja e Diário dependem de interruptor. Sem JavaScript do app não há
//     como saber se estão ligados, e a régua é falhar para desligado.
//   • Idioma, tema e «Entrar»: as páginas estáticas são PT, tema claro
//     fixo, e não carregam Supabase.
//
// Uso: scripts/prerender.mjs chama `moldura(html, { secao })` para cada
// página gerada e `aplicarMarcadores(arquivo, { secao })` para as escritas
// à mão (pausa.html e as legais), que trazem marcadores no HTML.
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';

const navSrc = readFileSync('js/nav-data.js', 'utf8');
const { NAV_GROUPS, PAGE_HASH } = new Function(`${navSrc}; return { NAV_GROUPS, PAGE_HASH };`)();
const i18nSrc = readFileSync('js/i18n.js', 'utf8');
const { TRANSLATIONS } = new Function(`${i18nSrc}; return { TRANSLATIONS };`)();
const PT = TRANSLATIONS.pt;

const t = (k) => PT[k] ?? k;
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Ícones de linha — os mesmos traços de svgIcon() em js/app.js.
const ICONS = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  heart: '<path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
};
const icon = (name, size) => `<svg class="ui-ico" viewBox="0 0 24 24"${size ? ` width="${size}" height="${size}"` : ''} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// Link de uma entrada, visto de uma página estática: caminho real quando a
// entrada tem um (href) ou uma gêmea estática (estatico); senão o hash do
// app, absoluto (/#…), porque estamos fora do index.html.
function hrefEstatico(p) {
  if (p.href) return p.href;
  if (p.estatico) return p.estatico;
  return '/#' + (PAGE_HASH[p.id] || p.id) + (p.slug ? '/' + p.slug : '');
}
const visiveis = (g) => g.pages.filter((p) => !p.hidden && !p.flag);
const grupos = () => NAV_GROUPS.filter((g) => !g.icone && !g.loja);
const grupoDaSecao = (secao) => secao ? grupos().find((g) => g.pages.some((p) => (p.href || p.estatico) === secao)) : null;
const estaNaSecao = (p, secao) => !!secao && (p.href === secao || p.estatico === secao);

export function navEstatica({ secao } = {}) {
  const ativo = grupoDaSecao(secao);
  const itens = grupos().map((g) => {
    const on = ativo && ativo.id === g.id;
    return `<a class="erv-nav-item${on ? ' on' : ''}" data-group="${g.id}" href="${hrefEstatico(g.pages[0])}"${on ? ' aria-current="page"' : ''}>${esc(t(g.label))}</a>`;
  }).join('');
  const sub = ativo ? `<div class="erv-subnav"><div class="erv-subnav-inner">${visiveis(ativo).map((p) => {
    const on = estaNaSecao(p, secao);
    return `<a class="erv-subnav-item${on ? ' on' : ''}" href="${hrefEstatico(p)}"${on ? ' aria-current="page"' : ''}>${esc(t(p.label))}</a>`;
  }).join('')}</div></div>` : '';
  return `<nav class="erv-nav erv-estatico" aria-label="Navegação principal">
  <div class="erv-nav-bar">
    <button type="button" class="erv-nav-burger" aria-label="${esc(t('nav.open_menu'))}" aria-expanded="false" aria-controls="ervMenuSheet">${icon('menu', 22)}</button>
    <a class="erv-logo" href="/" title="Voltar à página inicial"><span class="erv-logo-mark">Ervatório</span><span class="erv-logo-sub">${esc(t('lp.logo.sub'))}</span></a>
    <div class="erv-nav-groups">${itens}</div>
    <div class="erv-nav-actions">
      <a class="erv-nav-icon erv-nav-search" href="/#encontrar" aria-label="${esc(t('nav.search'))}">${icon('search')}<span class="erv-nav-icon-label">${esc(t('nav.search_hint'))}</span></a>
      <a class="erv-nav-icon" href="/#estante" aria-label="${esc(t('nav.favorites'))}">${icon('heart')}</a>
      <a class="erv-nav-icon" href="/#perfil" aria-label="${esc(t('nav.account'))}">${icon('user')}</a>
    </div>
  </div>${sub ? '\n  ' + sub : ''}
</nav>
${folhaEstatica()}`;
}

// A folha do menu, já no HTML e escondida: js/nav-estatica.js só a mostra.
function folhaEstatica() {
  const conta = NAV_GROUPS.find((g) => g.id === 'conta');
  return `<div class="erv-sheet erv-estatico" id="ervMenuSheet" role="dialog" aria-modal="true" aria-label="${esc(t('nav.menu'))}" hidden>
  <div class="erv-sheet-top"><span class="erv-sheet-title">${esc(t('nav.menu'))}</span><button type="button" class="erv-sheet-close" aria-label="${esc(t('nav.close'))}">${icon('close', 22)}</button></div>
  <div class="erv-sheet-groups">${grupos().map((g) => `<a class="erv-sheet-group" href="${hrefEstatico(g.pages[0])}"><span class="erv-sheet-group-name">${esc(t(g.label))}</span>${g.sub ? `<span class="erv-sheet-group-sub">${esc(t(g.sub))}</span>` : ''}</a>`).join('')}</div>
  <div class="erv-sheet-label">${esc(t('nav.account'))}</div>
  <div class="erv-sheet-grid">${visiveis(conta).filter((p) => p.id !== 'sobre').map((p) => `<a class="erv-sheet-cell" href="${hrefEstatico(p)}">${esc(t(p.label))}</a>`).join('')}</div>
  <div class="erv-sheet-foot"><a href="/#sobre">${esc(t('footer.sobre'))}</a><span aria-hidden="true">·</span><a href="/#lp-clube">${esc(t('footer.clube'))}</a><span aria-hidden="true">·</span><a href="/pausa.html">${esc(t('footer.pausa'))}</a><span aria-hidden="true">·</span><a href="/privacidade.html">${esc(t('footer.privacidade'))}</a></div>
</div>`;
}

export function rodapeEstatico() {
  return `<footer class="erv-footer erv-estatico" aria-label="Rodapé">
  <div class="erv-footer-inner">
    <div class="erv-footer-links">
      <a href="/#sobre">${esc(t('footer.sobre'))}</a>
      <a href="/#lp-clube">${esc(t('footer.clube'))}</a>
      <a href="/pausa.html">${esc(t('footer.pausa'))}</a>
      <a href="/privacidade.html">${esc(t('footer.privacidade'))}</a>
      <a href="/termos.html">${esc(t('footer.termos'))}</a>
      <a href="mailto:contato@ervatorio.com.br">${esc(t('footer.contato'))}</a>
    </div>
    <div>${esc(t('footer.linha'))}</div>
    <p class="erv-footer-aviso">${esc(t('health.disclaimer'))}</p>
  </div>
</footer>
<script defer src="/js/nav-estatica.js"></script>`;
}

export const cssEstatico = () => '<link rel="stylesheet" href="/css/nav.css">';

// Envolve uma página gerada: folha no <head>, cabeçalho logo depois de
// <body>, e o rodapé simples de antes vira o comum.
export function moldura(html, { secao } = {}) {
  let out = html.replace('</head>', `${cssEstatico()}\n</head>`);
  out = out.replace(/<body([^>]*)>\n?/, (m0, attrs) => `<body${attrs}>\n${navEstatica({ secao })}\n`);
  const rodapeAntigo = /<footer>\n  <p>© 2026 Ervatório · <a href="\/">ervatorio\.com\.br<\/a>[^\n]*<\/p>\n<\/footer>/;
  if (!rodapeAntigo.test(out)) throw new Error('moldura: rodapé antigo não encontrado');
  out = out.replace(rodapeAntigo, rodapeEstatico());
  return out;
}

// Páginas escritas à mão: três pares de marcadores, preenchidos a cada
// `npm run prerender`. Marcador ausente é erro — a página ficaria sem menu
// em silêncio.
export function aplicarMarcadores(arquivo, { secao } = {}) {
  let s = readFileSync(arquivo, 'utf8');
  const pares = [
    ['erv-nav-css', cssEstatico()],
    ['erv-nav-estatica', navEstatica({ secao })],
    ['erv-rodape-estatico', rodapeEstatico()],
  ];
  for (const [marca, conteudo] of pares) {
    const re = new RegExp(`<!-- ${marca} -->[\\s\\S]*?<!-- /${marca} -->`);
    if (!re.test(s)) throw new Error(`${arquivo}: marcador ${marca} ausente`);
    s = s.replace(re, () => `<!-- ${marca} -->\n${conteudo}\n<!-- /${marca} -->`);
  }
  writeFileSync(arquivo, s);
}
