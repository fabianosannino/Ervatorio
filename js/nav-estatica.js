// ============================================================
// Folha do menu nas páginas estáticas (handoff 14/09, PR 03b)
// ============================================================
// As páginas de /erva, /lexico, /como-se-faz, /biblioteca, pausa.html e as
// legais não carregam js/app.js. O cabeçalho delas já vem pronto no HTML
// (scripts/nav-estatica.mjs), inclusive a folha do menu, escondida. Este
// script só abre e fecha a folha do jeito que a11yDialog faz no app: foco
// no ✕, Tab preso dentro, Esc fecha, o foco volta ao ☰.
(function () {
  'use strict';
  var sheet = document.getElementById('ervMenuSheet');
  var burger = document.querySelector('[aria-controls="ervMenuSheet"]');
  if (!sheet || !burger) return;
  var close = sheet.querySelector('.erv-sheet-close');
  var FOCAVEIS = 'a[href], button:not([disabled])';

  function abrir() {
    sheet.hidden = false;
    document.body.classList.add('erv-sheet-open');
    burger.setAttribute('aria-expanded', 'true');
    if (close) close.focus();
  }
  function fechar() {
    if (sheet.hidden) return;
    sheet.hidden = true;
    document.body.classList.remove('erv-sheet-open');
    burger.setAttribute('aria-expanded', 'false');
    try { burger.focus(); } catch (_) {}
  }

  burger.addEventListener('click', function () { sheet.hidden ? abrir() : fechar(); });
  if (close) close.addEventListener('click', fechar);
  // Link clicado: a navegação acontece; fechar logo depois evita que um
  // clique cancelado (botão do meio, Ctrl) deixe a folha aberta.
  sheet.addEventListener('click', function (e) { if (e.target.closest('a[href]')) setTimeout(fechar, 0); });
  document.addEventListener('keydown', function (e) {
    if (sheet.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); fechar(); return; }
    if (e.key !== 'Tab') return;
    var itens = Array.prototype.filter.call(sheet.querySelectorAll(FOCAVEIS), function (el) { return el.offsetParent !== null || el === close; });
    if (!itens.length) return;
    var primeiro = itens[0], ultimo = itens[itens.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  });
  // A barra volta ao desktop com a folha aberta: fecha, senão o ☰ some e a
  // folha fica sem botão.
  var mq = window.matchMedia ? window.matchMedia('(min-width: 900px)') : null;
  if (mq && mq.addEventListener) mq.addEventListener('change', function (ev) { if (ev.matches) fechar(); });
})();
