// ============================================================
// Ficha — do técnico ao leigo, com uma fonte só (handoff, PR 06)
// ============================================================
// Duas funções puras, lidas em dois lugares: no navegador (js/ervatorio-
// pages.js, a ficha do app) e em Node (scripts/prerender.mjs, a ficha
// estática em /erva/<slug>/). Por isso é script clássico sem dependência,
// como js/nav-data.js.
//
//   fichaSecoes(acoes_e_seguranca)
//     Separa o que o schema 1.1 deixou misturado: `acoes_principais` traz
//     linhas-marcador («Contraindicações:», «Interações:», «Componentes
//     ativos:», «⚠️ ATENÇÃO — X:») seguidas dos itens daquela seção. Sem
//     esta separação, «Hipertensão arterial não controlada» aparece como
//     ação principal do guaraná — foi o que a auditoria do handoff achou em
//     7 de 10 fichas. Nada é apagado: cada linha vai para a seção certa.
//
//   fichaResumo(ficha, herb)
//     O bloco-resumo do topo: para que serve, como preparar, quem deve
//     evitar. Prefere o texto curto do catálogo do app (js/herbs-data.js:
//     `ef`, `temp`, `tempo`, `dose`, `freq`, `avoid`, `safe`) e cai no texto
//     da ficha quando a erva não está no catálogo. Uma ficha pode trazer
//     `resumo` escrito à mão (para_que_serve, como_preparar,
//     quem_deve_evitar) e ele vence tudo — é o caminho para o «leigo
//     primeiro» do handoff sem reescrever 96 fichas de uma vez.
// ============================================================
(function (root) {
  'use strict';

  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
  function limpo(s) { return String(s || '').replace(/^[\s⚠️]+/, '').trim(); }

  // Marcadores conhecidos → seção. A comparação é por prefixo normalizado,
  // para «Componentes ativos (flores):» cair em componentes.
  var MARCADORES = [
    ['componentes ativos', 'notas_componentes'],
    ['indicacoes com evidencia', 'notas_evidencia'],
    ['contraindicacoes', 'contraindicacoes'],
    ['interacoes', 'interacoes'],
  ];
  var ALERTA_RE = /aten[cç][aã]o|cr[ií]tic|t[oó]xic|hepat|interacoes criticas/i;

  function fichaSecoes(ac) {
    ac = ac || {};
    var out = {
      acoes: [], contraindicacoes: [], interacoes: [],
      notas_componentes: [], notas_evidencia: [],
      alertas: [], notas: [],
      efeitos_adversos: String(ac.efeitos_adversos || ''),
      dose_maxima: String(ac.dose_maxima || ''),
    };
    // A mesma leitura vale para `contraindicacoes`: em várias fichas o
    // campo próprio também recebeu «Interações:», «Efeitos adversos: …» e
    // «Dose máxima: …» como itens.
    consumir(ac.acoes_principais, 'acoes');
    consumir(ac.contraindicacoes, 'contraindicacoes');

    function consumir(lista, baldeInicial) {
      var balde = baldeInicial, bloco = null;
      (Array.isArray(lista) ? lista : []).forEach(function (item) {
        var s = String(item || '').trim();
        if (!s) return;
        if (/:$/.test(s)) {
          var chave = norm(limpo(s).replace(/:$/, ''));
          var alvo = null;
          for (var i = 0; i < MARCADORES.length; i++) if (chave.indexOf(MARCADORES[i][0]) === 0) alvo = MARCADORES[i][1];
          if (alvo) { balde = alvo; bloco = null; return; }
          bloco = { titulo: limpo(s).replace(/:$/, '').trim(), itens: [] };
          (ALERTA_RE.test(chave) || /^\u26A0/.test(s) ? out.alertas : out.notas).push(bloco);
          balde = 'bloco';
          return;
        }
        var inline = s.match(/^(efeitos adversos|dose m[a\u00e1]xima)\s*:\s*(.+)$/i);
        if (inline) {
          var campo = /^efeitos/i.test(inline[1]) ? 'efeitos_adversos' : 'dose_maxima';
          if (!out[campo]) out[campo] = inline[2].trim();
          return;
        }
        if (balde === 'bloco' && bloco) { bloco.itens.push(s); return; }
        if (out[balde].indexOf(s) < 0) out[balde].push(s);
      });
    }
    // Interações estruturadas ({label, texto}) ficam à parte: renderizam
    // como lista de definição, as textuais como lista simples.
    out.interacoes_estruturadas = (Array.isArray(ac.interacoes) ? ac.interacoes : [])
      .filter(function (i) { return i && (i.label || i.texto); });
    return out;
  }

  // Primeiro «N min» (ou «N–M min», e aí M) encontrado nos textos de preparo.
  function fichaMinutos(textos) {
    for (var i = 0; i < textos.length; i++) {
      var m = String(textos[i] || '').match(/(\d+)(?:\s*[–—-]\s*(\d+))?\s*min/i);
      if (m) return Number(m[2] || m[1]);
    }
    return null;
  }

  function fichaResumo(f, herb) {
    f = f || {}; herb = herb || null;
    var pr = f.preparo || {}, ac = f.acoes_e_seguranca || {};
    var r = f.resumo || {};
    var sec = fichaSecoes(ac);
    var semParenteses = function (s) { return String(s || '').replace(/\s*\([^)]*\)/g, '').trim(); };

    var serve = r.para_que_serve || (herb && herb.ef) || f.tagline || sec.acoes.slice(0, 3).map(semParenteses).join(' · ');
    var serveDetalhe = r.para_que_serve ? '' : (herb && herb.detail) || (herb ? '' : sec.acoes.slice(0, 2).map(semParenteses).join('. '));

    var preparo = r.como_preparar ? { texto: r.como_preparar } : {
      temp: (herb && herb.temp) || pr.temperatura_ideal || '',
      tempo: (herb && herb.tempo) || pr.tempo_de_infusao || '',
      dose: (herb && herb.dose) || pr.quantidade || '',
      freq: (herb && herb.freq) || pr.melhor_momento || '',
      metodo: herb ? '' : (pr.metodo || ''),
    };
    var minutos = fichaMinutos([herb && herb.tempo, pr.tempo_de_infusao, pr.metodo, pr.quantidade, pr.temperatura_ideal]);

    var evitar = [];
    var push = function (x) { var s = String(x || '').trim(); if (s && evitar.indexOf(s) < 0) evitar.push(s); };
    if (Array.isArray(r.quem_deve_evitar)) r.quem_deve_evitar.forEach(push);
    else if (sec.contraindicacoes.length) sec.contraindicacoes.forEach(push);
    else ((herb && herb.avoid) || []).forEach(push);

    return {
      serve: serve, serveDetalhe: serveDetalhe,
      preparo: preparo, minutos: minutos,
      evitar: evitar,
      interacoes: Math.max(sec.interacoes.length, sec.interacoes_estruturadas.length),
      seguro: (herb && Array.isArray(herb.safe)) ? herb.safe.slice() : [],
      secoes: sec,
      alertaCritico: ac.alerta_critico || null,
      fontes: Array.isArray(ac.fontes) ? ac.fontes.filter(Boolean) : [],
    };
  }

  root.fichaSecoes = fichaSecoes;
  root.fichaResumo = fichaResumo;
  root.fichaMinutos = fichaMinutos;
})(typeof window !== 'undefined' ? window : this);
