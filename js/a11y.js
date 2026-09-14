// ============================================================
// ERVATÓRIO — Acessibilidade (Onda 9 · backlog #61, #62, #66)
// ============================================================
// Helpers globais + reforços aplicados por delegação, para tornar
// overlays e cards operáveis por teclado e legíveis por leitores
// de tela SEM reescrever cada componente:
//
//   1. a11yDialog(el, opts) — transforma um overlay em diálogo
//      acessível: role/aria-modal, ESC fecha, focus-trap (Tab
//      circula dentro), foco inicial e restauração do foco ao
//      fechar. Observa remoção do nó para restaurar o foco.
//   2. MutationObserver marca automaticamente overlays conhecidos
//      (mktDetailOverlay, rvForm, checkoutOverlay, cartOverlay)
//      criados dinamicamente.
//   3. Delegação de teclado: qualquer elemento com [onclick] que
//      não seja nativamente focável ganha role=button/tabindex e
//      responde a Enter/Espaço.
// ============================================================
(function () {
  'use strict';

  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  window.a11yDialog = function (el, opts) {
    if (!el || el.dataset.a11yDialog === '1') return;
    el.dataset.a11yDialog = '1';
    opts = opts || {};
    if (!el.getAttribute('role')) el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    if (opts.label && !el.getAttribute('aria-label')) el.setAttribute('aria-label', opts.label);

    var previouslyFocused = document.activeElement;

    // Foco inicial: primeiro focável — apenas se o diálogo está
    // visível agora (overlays estáticos escondidos não roubam foco).
    // offsetParent é null também para position:fixed (a folha do menu, por
    // exemplo) — por isso a segunda condição.
    var isVisibleNow = el.offsetParent !== null ||
      (getComputedStyle(el).position === 'fixed' && el.getClientRects().length > 0);
    if (isVisibleNow) {
      var focusables = el.querySelectorAll(FOCUSABLE);
      if (focusables.length) {
        try { focusables[0].focus(); } catch (_) { /* ok */ }
      }
    }

    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (typeof opts.onClose === 'function') opts.onClose();
        else el.remove();
        return;
      }
      if (e.key !== 'Tab') return;
      // Focus-trap: Tab/Shift+Tab circulam dentro do diálogo.
      var items = Array.prototype.filter.call(
        el.querySelectorAll(FOCUSABLE),
        function (n) { return n.offsetParent !== null; }
      );
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });

    // Restaura o foco quando o diálogo sai do DOM (apenas para
    // diálogos que estavam visíveis quando instrumentados).
    if (isVisibleNow) {
      new MutationObserver(function (muts, obs) {
        if (!document.body.contains(el)) {
          obs.disconnect();
          if (previouslyFocused && previouslyFocused.focus) {
            try { previouslyFocused.focus(); } catch (_) { /* ok */ }
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    }
  };

  // ── Auto-instrumentação de overlays conhecidos ───────────────
  // remove: diálogos criados por request (fechar = tirar do DOM);
  // onClose custom: overlays toggleáveis (fechar = esconder).
  var KNOWN = {
    mktDetailOverlay: { label: 'Detalhes do produto' },
    rvForm: { label: 'Avaliar produto' },
    admMfa: { label: 'Verificação em duas etapas' },
    checkoutOverlay: {
      label: 'Finalizar pedido',
      onClose: function () { if (window.Checkout && Checkout.close) Checkout.close(); },
    },
    cartOverlay: {
      label: 'Carrinho',
      onClose: function () {
        var el = document.getElementById('cartOverlay');
        if (el && el.classList.contains('on') && typeof openCart === 'function') openCart();
      },
    },
    profileMenu: { menu: true }, // menu, não modal — só ESC
  };
  function instrument(n) {
    var cfg = KNOWN[n.id];
    if (!cfg) return;
    if (cfg.menu) {
      if (n.dataset.a11yMenu === '1') return;
      n.dataset.a11yMenu = '1';
      n.addEventListener('keydown', function (e) { if (e.key === 'Escape') n.remove(); });
      return;
    }
    window.a11yDialog(n, cfg);
  }
  new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      Array.prototype.forEach.call(m.addedNodes, function (n) {
        if (n.nodeType === 1 && KNOWN.hasOwnProperty(n.id)) instrument(n);
      });
    });
  }).observe(document.body, { childList: true });
  // Overlays já presentes no HTML estático (ex.: cartOverlay).
  Object.keys(KNOWN).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) instrument(el);
  });

  // ── Teclado para elementos clicáveis não-nativos (#61) ───────
  // Marca divs/spans com onclick como role=button focável.
  function upgradeClickables(root) {
    var nodes = (root || document).querySelectorAll('div[onclick],span[onclick]');
    Array.prototype.forEach.call(nodes, function (n) {
      if (n.dataset.a11yBtn === '1') return;
      n.dataset.a11yBtn = '1';
      if (!n.getAttribute('role')) n.setAttribute('role', 'button');
      if (!n.hasAttribute('tabindex')) n.setAttribute('tabindex', '0');
    });
  }
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.a11yBtn === '1') {
      e.preventDefault();
      e.target.click();
    }
  });
  var upgradeQueued = false;
  new MutationObserver(function () {
    if (upgradeQueued) return;
    upgradeQueued = true;
    requestAnimationFrame(function () {
      upgradeQueued = false;
      upgradeClickables(document);
    });
  }).observe(document.body, { childList: true, subtree: true });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { upgradeClickables(document); });
  } else {
    upgradeClickables(document);
  }
})();
