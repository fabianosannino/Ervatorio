// js/ervatorio-pages.js
// Rendering functions for Ervatorio v1.1 pages
// Depends on: ErvatorioData (ervatorio-data.js), esc() (app.js)

(function() {
  // Reusable HTML helpers (same patterns as renderFichaModal in app.js)
  function safeEsc(s) { return typeof esc === 'function' ? esc(s) : String(s || ''); }
  function listMaybe(v) { return Array.isArray(v) ? v.map(function(x) { return '<li>' + safeEsc(x) + '</li>'; }).join('') : (v ? '<li>' + safeEsc(v) + '</li>' : ''); }
  function paragraphs(v) { return Array.isArray(v) ? v.map(function(x) { return '<p>' + safeEsc(x) + '</p>'; }).join('') : (v ? '<p>' + safeEsc(v) + '</p>' : ''); }
  function dlList(arr, keyA, keyB) {
    keyA = keyA || 'label'; keyB = keyB || 'texto';
    return Array.isArray(arr) ? arr.map(function(x) { return '<div class="ficha-kv"><dt>' + safeEsc(x[keyA]) + '</dt><dd>' + safeEsc(x[keyB]) + '</dd></div>'; }).join('') : '';
  }

  // ================================================================
  // #ervatorio — Indice do catalogo v1.1
  // ================================================================
  // Resolve imagem local da erva a partir do nome popular / científico.
  // Consulta o array global HERBS (populado por app.js e re-hidratado
  // pela ervaria.js). Retorna null se não encontrar match.
  function normNome(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  // Cache de imagens resolvidas — evita 3× Array.find sobre HERBS por card
  // a cada keystroke do search. Chave: nome+científico normalizados.
  var _imgCache = Object.create(null);
  function resolveErvaImg(nomePopular, nomeCientifico) {
    if (typeof HERBS === 'undefined' || !Array.isArray(HERBS)) return null;
    var np = normNome(nomePopular);
    var nc = normNome(nomeCientifico).split(/\s|\(/)[0]; // gênero botânico
    if (!np && !nc) return null;
    var cacheKey = np + '|' + nc;
    if (cacheKey in _imgCache) return _imgCache[cacheKey];
    // 1) Match exato por nome popular
    var found = HERBS.find(function(h) { return normNome(h.n) === np; });
    // 2) Match por gênero científico (ex.: ficha "Passiflora spp." casa com HERBS lat "Passiflora edulis")
    if (!found && nc) {
      found = HERBS.find(function(h) {
        var hg = normNome(h.lat || '').split(/\s|\(/)[0];
        return hg && (hg === nc || nc.indexOf(hg) === 0 || hg.indexOf(nc) === 0);
      });
    }
    // 3) Match por substring do nome popular (ex.: "Chá Verde (Matcha)" → "Chá Verde")
    if (!found && np) {
      found = HERBS.find(function(h) {
        var hn = normNome(h.n);
        return hn && (np.indexOf(hn) === 0 || hn.indexOf(np) === 0);
      });
    }
    var img = found && found.img ? found.img : null;
    _imgCache[cacheKey] = img;
    return img;
  }

  // ── Facetas / filtros do catálogo ──────────────────────────────────
  // Cada faceta usa um mapeador canônico: regex → label canônico, evitando
  // o caos de splittar texto narrativo em vírgulas. As taxonomias abaixo
  // foram derivadas das fichas reais (97 fichas → 7-18 valores por faceta).
  var FACETS = [
    { id: 'tipo',       label: 'Tipo',         icon: '🍵', extract: extractTipo },
    { id: 'localizacao',label: 'Localização',  icon: '🌍', extract: extractLocalizacao },
    { id: 'bioma',      label: 'Bioma',        icon: '🌿', extract: extractBioma },
    { id: 'sensorial',  label: 'Sensorial',    icon: '✨', extract: extractSensorial, hint: 'O que busco no chá' },
    { id: 'coloracao',  label: 'Coloração',    icon: '🎨', extract: extractColoracao, swatch: true },
    { id: 'sabor',      label: 'Sabor',        icon: '👅', extract: extractSabor },
    { id: 'parte',      label: 'Parte usada',  icon: '🌱', extract: extractParte }
  ];

  // [canônico, regex em minúsculas]
  var TIPO_RULES = [
    ['Chá Tradicional', /camellia sinensis/],
    ['Erva-mate',       /ilex paraguariensis/],
    ['Especiaria',      /especiaria|tempero/],
    ['Adaptógeno',      /adapt[oó]gen/],
    ['Aromática',       /arom[aá]/],
    ['Ritual',          /ritual|cerimon/],
    ['Funcional',       /alimento funcional|funcional/],
    ['Medicinal',       /fitoter|phyto-?anvisa|medicinal/]
  ];

  var BIOMA_RULES = [
    ['Amazônia',           /amaz[oô]ni/],
    ['Cerrado',            /cerrad/],
    ['Mata Atlântica',     /mata atl[aâ]nti|atl[aâ]ntic/],
    ['Caatinga',           /caating/],
    ['Pampa',              /pampas?\b/],
    ['Pantanal',           /pantanal/],
    ['Restinga',           /restinga/],
    ['Mediterrâneo',       /mediterr[aâ]ne/],
    ['Floresta Tropical',  /tropical|floresta [úu]mid/],
    ['Floresta Temperada', /temperad/],
    ['Savana',             /savana|savan/],
    ['Tundra',             /tundra/],
    ['Taiga',              /taiga|boreal/],
    ['Pradaria',           /pradaria|grassland/],
    ['Deserto',            /deserto|semi[\s-]?[aá]rid/],
    ['Andes',              /andes\b|andin[oa]/]
  ];

  var PAIS_RULES = [
    ['Brasil',         /\bbrasil\b/],
    ['Argentina',      /\bargentina\b/],
    ['Uruguai',        /\buruguai\w*/],
    ['Paraguai',       /\bparaguai\w*/],
    ['Peru',           /\bperu\b|peruan/],
    ['Bolívia',        /\bbol[íi]via\b/],
    ['Chile',          /\bchile/],
    ['Colômbia',       /\bcol[oô]mbia\b/],
    ['Venezuela',      /\bvenezuela\b/],
    ['Equador',        /\bequador\b/],
    ['México',         /\bm[eé]xico\b/],
    ['Estados Unidos', /\beua\b|estados unidos|am[eé]rica do norte/],
    ['Canadá',         /\bcanad[aá]\b/],
    ['Portugal',       /\bportugal|portuguese?s?\b/],
    ['Espanha',        /\bespanha\b|\bespan[hñ]ola?\b/],
    ['França',         /\bfran[çc]a\b|franc[eê]s/],
    ['Itália',         /\bit[aá]lia\b|italian/],
    ['Alemanha',       /\balemanha\b|alem[aã]/],
    ['Reino Unido',    /inglaterra|reino unido|brit[âa]nic/],
    ['Grécia',         /\bgr[eé]cia\b|greg[oa]s?/],
    ['China',          /\bchin[aês]+/],
    ['Japão',          /\bjap[aã]o\b|japon[eê]/],
    ['Índia',          /\b[íi]ndia\b|indian[oa]/],
    ['Coreia',         /\bcoreia\b|coreano/],
    ['Tailândia',      /\btail[aâ]ndia\b/],
    ['Vietnã',         /\bvietn[aã]\w*/],
    ['Indonésia',      /\bindon[eé]sia\b/],
    ['Sri Lanka',      /\bsri lanka\b|ceil[aã]o/],
    ['Egito',          /\begito\b|eg[íi]pcio/],
    ['Marrocos',       /\bmarrocos\b/],
    ['África do Sul',  /[áa]frica do sul/],
    ['Etiópia',        /\beti[oó]pia\b/],
    ['Austrália',      /\baustr[aá]l/],
    ['Guianas',        /\bguian[as]?\b/]
  ];

  // Estados brasileiros: detectados por código UF (case-sensitive) ou nome completo (insensível).
  var ESTADOS_BR = {
    'AC':'Acre','AL':'Alagoas','AP':'Amapá','AM':'Amazonas','BA':'Bahia',
    'CE':'Ceará','DF':'Distrito Federal','ES':'Espírito Santo','GO':'Goiás',
    'MA':'Maranhão','MT':'Mato Grosso','MS':'Mato Grosso do Sul','MG':'Minas Gerais',
    'PA':'Pará','PB':'Paraíba','PR':'Paraná','PE':'Pernambuco','PI':'Piauí',
    'RJ':'Rio de Janeiro','RN':'Rio Grande do Norte','RS':'Rio Grande do Sul',
    'RO':'Rondônia','RR':'Roraima','SC':'Santa Catarina','SP':'São Paulo',
    'SE':'Sergipe','TO':'Tocantins'
  };

  // Vetores sensoriais agrupados — alinhado com a Roda Funcional. O usuário
  // pensa "o que busco no chá", não na nomenclatura clínica das fichas.
  var SENSORIAL_RULES = [
    ['Calmante',          /ansiol|sedat|hipno|calmant|antidepres|nootróp|cognit/],
    ['Digestivo',         /digest|antidisp|carmin|antiulcer|antiespasm|aperient|protetor da mucosa|hep[aá]t|colag|coler[ée]t/],
    ['Imunológico',       /antimicrob|antif[uú]ng|antiviral|antibacter|imunomod|imunoest/],
    ['Anti-inflamatório', /anti-?inflama/],
    ['Antioxidante',      /antioxidante/],
    ['Energético',        /estimulant|energ[eé]tic|adapt[oó]g/],
    ['Cardiovascular',    /cardio|hipertens|hipotens|vasodil|vasocon|venopr|antiagreg|hipolipem/],
    ['Diurético',         /diur[eé]t|litol[ií]t/],
    ['Respiratório',      /expector|broncodi|antituss|antiastm|descong/],
    ['Cicatrizante',      /cicatriz|antiss[eé]p/],
    ['Analgésico',        /analg[eé]/],
    ['Hormonal',          /afrodis|fitoestr|emenag/],
    ['Metabólico',        /termog|hipoglic|lipol[ií]t|antidiab/],
    ['Tópico',            /t[oó]pic|cosm[eé]t/],
    ['Antialérgico',      /antial[eé]rg|antihist/]
  ];
  // Filtra entradas de acoes_principais que NÃO descrevem ação sensorial
  // (alertas, contraindicações, comentários sobre uso, etc.).
  var SENSORIAL_DENY = /^(aten[çc][aã]o|cuidado|alerta|contraindica|interaç|uso prolongado|restri|toxicid|neurot[oó]xic)/i;

  var SABOR_RULES = [
    ['Amargo',       /amarg/],
    ['Doce',         /\bdoce\b|adoçant|baunilha|adocica/],
    ['Adstringente', /adstring|tan[íi]n/],
    ['Cítrico',      /c[íi]tric|lim[aã]o|limon|laranja/],
    ['Floral',       /\bfloral\b|flor[ae]s\b/],
    ['Picante',      /picant|pungent|apimenta/],
    ['Refrescante',  /mentol|refresc|fresco\b|gélid/],
    ['Resinoso',     /resino|balsâmic/],
    ['Terroso',      /terros|terra/],
    ['Herbáceo',     /herb[aá]c|verde/],
    ['Frutado',      /frutad|frutal/],
    ['Mucilaginoso', /mucilag/],
    ['Amadeirado',   /amadeira|madeir|woody/],
    ['Defumado',     /defum|smok/],
    ['Anisado',      /anis|alcaçuz|fennel/],
    ['Ácido',        /\bácid|azedo/],
    ['Mineral',      /mineral/],
    ['Salgado',      /salgad/]
  ];

  var PARTE_RULES = [
    ['Folha',          /\bfolha/],
    ['Flor',           /\bflor[ae]?s?\b|inflorescência|capítulo|sumidade flor|botão flor/],
    ['Pétala',         /\bp[eé]tal/],
    ['Estigma',        /estigma/],
    ['Raiz',           /\braiz|raízes/],
    ['Rizoma',         /rizoma/],
    ['Casca',          /casca|entrecasca/],
    ['Semente',        /semente|fava\b|tonka/],
    ['Fruto',          /\bfruto|baga|drupa/],
    ['Caule',          /caule|tronco|hast/],
    ['Bulbo',          /bulbo/],
    ['Resina',         /resina|óleo[\s-]?resina|exsudato|goma|látex/],
    ['Cone',           /\bcone\b|estróbil/],
    ['Vagem',          /vagem/],
    ['Polpa',          /polpa/],
    ['Óleo essencial', /óleo essencial/],
    ['Partes aéreas',  /parte[s]? a[eé]rea|sumidade/]
  ];

  // Coloração — paleta canônica (uma cor por keyword, dedupada).
  var COR_RULES = [
    ['Amarelo',  /amarel/, '#e8c547'],
    ['Dourado',  /dourad|ouro\b/, '#d4a017'],
    ['Verde',    /\bverde/, '#5b8a3a'],
    ['Âmbar',    /[aâ]mbar/, '#c08038'],
    ['Cobre',    /\bcobre|cobread/, '#a85a2a'],
    ['Vermelho', /vermelh|rubr|rubi/, '#9a3024'],
    ['Rosa',     /\brosa\b|rosad/, '#d97a8a'],
    ['Marrom',   /marrom|castanh/, '#6b4423'],
    ['Preto',    /\bpret[oa]\b|negro/, '#2a1a14'],
    ['Roxo',     /\broxo|violet|púrpur/, '#5a2d6b'],
    ['Azul',     /\bazul/, '#3a4a8a'],
    ['Branco',   /\bbranc|transparen|cristalin|incolor/, '#e8dcc8'],
    ['Laranja',  /laranj/, '#d97a3a']
  ];
  var COR_HEX = {};
  COR_RULES.forEach(function(r) { COR_HEX[r[0]] = r[2]; });

  // Estado dos filtros — Map<facetId, Set<value>>
  var ervFilters = {};
  var ervSearchTerm = '';
  var ervFichasCache = null;

  function ensureFilterState() {
    FACETS.forEach(function(f) {
      if (!ervFilters[f.id]) ervFilters[f.id] = new Set();
    });
  }

  // ── Mapeadores canônicos ─────────────────────────────────────────
  function matchRules(text, rules) {
    if (!text) return [];
    var lower = String(text).toLowerCase();
    var out = [];
    var seen = {};
    rules.forEach(function(r) {
      var canon = r[0], rx = r[1];
      if (!seen[canon] && rx.test(lower)) { seen[canon] = true; out.push(canon); }
    });
    return out;
  }

  function extractTipo(row) {
    var f = row.ficha || {};
    var rg = f.regulacao || {};
    var text = (rg.eixo_botanico_tpc || '') + ' ' + (f.nome_cientifico || '');
    var hits = matchRules(text, TIPO_RULES);
    return hits.length ? hits : ['Infusão'];
  }

  function extractBioma(row) {
    var f = row.ficha || {};
    var car = f.caracterizacao || {};
    var text = (car.bioma_de_origem || '') + ' ' + (car.notas || '');
    return matchRules(text, BIOMA_RULES);
  }

  function gatherLocText(f) {
    var car = f.caracterizacao || {};
    var cu = f.cultura || {};
    var arr = Array.isArray(car.distribuicao_geografica) ? car.distribuicao_geografica.join(' ') : (car.distribuicao_geografica || '');
    return [
      car.bioma_de_origem || '',
      car.notas || '',
      arr,
      cu.brasil || '',
      cu.historia || '',
      cu.cerimonial || ''
    ].join(' ');
  }

  function extractLocalizacao(row) {
    var f = row.ficha || {};
    var text = gatherLocText(f);
    if (!text) return [];
    var out = matchRules(text, PAIS_RULES);
    var seen = {};
    out.forEach(function(v) { seen[v] = true; });
    var hasState = false;
    Object.keys(ESTADOS_BR).forEach(function(code) {
      var full = ESTADOS_BR[code];
      var matched = new RegExp('\\b' + code + '\\b').test(text)
        || new RegExp('\\b' + full.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(text.toLowerCase());
      if (matched && !seen[full]) { seen[full] = true; out.push(full); hasState = true; }
    });
    if (hasState && !seen['Brasil']) out.unshift('Brasil');
    return out;
  }

  function extractSensorial(row) {
    var f = row.ficha || {};
    var ac = f.acoes_e_seguranca || {};
    var acoes = Array.isArray(ac.acoes_principais) ? ac.acoes_principais : [];
    var seen = {};
    var out = [];
    acoes.forEach(function(a) {
      var s = String(a || '').trim();
      if (!s || SENSORIAL_DENY.test(s)) return;
      var lower = s.toLowerCase();
      SENSORIAL_RULES.forEach(function(r) {
        var canon = r[0], rx = r[1];
        if (!seen[canon] && rx.test(lower)) { seen[canon] = true; out.push(canon); }
      });
    });
    return out;
  }

  function extractColoracao(row) {
    var f = row.ficha || {};
    var car = f.caracterizacao || {};
    if (!car.cor_da_infusao) return [];
    return matchRules(car.cor_da_infusao, COR_RULES.map(function(r) { return [r[0], r[1]]; }));
  }

  function extractSabor(row) {
    var f = row.ficha || {};
    var car = f.caracterizacao || {};
    var text = (car.sabor_dominante || '') + ' ' + (car.aroma || '') + ' ' + (car.notas || '');
    return matchRules(text, SABOR_RULES);
  }

  function extractParte(row) {
    var f = row.ficha || {};
    var id = f.identificacao || {};
    return matchRules(id.parte_usada || '', PARTE_RULES);
  }

  // Computa contagem por valor para cada faceta a partir de uma lista de fichas.
  function buildFacetCounts(fichas) {
    var counts = {};
    FACETS.forEach(function(facet) {
      counts[facet.id] = {};
      fichas.forEach(function(row) {
        var values = facet.extract(row) || [];
        var seen = {};
        values.forEach(function(v) {
          if (!v || seen[v]) return;
          seen[v] = true;
          counts[facet.id][v] = (counts[facet.id][v] || 0) + 1;
        });
      });
    });
    return counts;
  }

  function fichaMatchesFacet(row, facetId, selected) {
    if (!selected || !selected.size) return true;
    var facet = FACETS.find(function(f) { return f.id === facetId; });
    if (!facet) return true;
    var values = facet.extract(row) || [];
    for (var i = 0; i < values.length; i++) {
      if (selected.has(values[i])) return true;
    }
    return false;
  }

  function fichaMatchesSearch(row, term) {
    if (!term) return true;
    var f = row.ficha || {};
    var sin = (f.identificacao && Array.isArray(f.identificacao.sinonimos)) ? f.identificacao.sinonimos.join(' ') : '';
    var hay = [f.nome_popular, f.nome_cientifico, row.herb_latin_name, f.tagline, sin].join(' ');
    return normNome(hay).indexOf(term) >= 0;
  }

  function applyFilters(fichas) {
    var term = ervSearchTerm ? normNome(ervSearchTerm) : '';
    return fichas.filter(function(row) {
      if (!fichaMatchesSearch(row, term)) return false;
      for (var i = 0; i < FACETS.length; i++) {
        if (!fichaMatchesFacet(row, FACETS[i].id, ervFilters[FACETS[i].id])) return false;
      }
      return true;
    });
  }

  function totalActiveFilters() {
    var n = 0;
    FACETS.forEach(function(f) { n += (ervFilters[f.id] ? ervFilters[f.id].size : 0); });
    return n;
  }

  // Conjunto de estados brasileiros (nomes completos) para detecção rápida.
  var ESTADOS_BR_SET = (function() {
    var s = {};
    Object.keys(ESTADOS_BR).forEach(function(k) { s[ESTADOS_BR[k]] = true; });
    return s;
  })();

  // Renderização hierárquica da faceta Localização: estados brasileiros
  // ficam aninhados sob "Brasil"; demais países aparecem no nível raiz.
  // Países sem estados são listados após Brasil, ordenados por contagem.
  function renderLocalizacaoOptions(values, valueCounts) {
    var brasilCount = valueCounts['Brasil'] || 0;
    var states = [];
    var countries = [];
    values.forEach(function(v) {
      if (v === 'Brasil') return;
      if (ESTADOS_BR_SET[v]) states.push(v);
      else countries.push(v);
    });
    // Estados ordenados por contagem desc (já vem sorted, mantém ordem global)
    var selected = ervFilters['localizacao'] || new Set();

    function optHTML(val, indent) {
      var checked = selected.has(val);
      return '<label class="erv-filter-option' + (indent ? ' erv-filter-option-nested' : '') + '">' +
        '<input type="checkbox" data-facet="localizacao" value="' + safeEsc(val) + '"' + (checked ? ' checked' : '') + '>' +
        '<span class="erv-filter-option-label" title="' + safeEsc(val) + '">' + safeEsc(val) + '</span>' +
        '<span class="erv-filter-option-tally">' + (valueCounts[val] || 0) + '</span>' +
        '</label>';
    }

    var html = '';
    if (brasilCount > 0 || states.length) {
      // Agrupador "Brasil" colapsável quando tem estados
      var hasStates = states.length > 0;
      var anyStateSelected = states.some(function(s) { return selected.has(s); });
      var groupCollapsed = !selected.has('Brasil') && !anyStateSelected;
      html += '<div class="erv-filter-loc-group' + (groupCollapsed ? ' collapsed' : '') + '">' +
        '<div class="erv-filter-loc-parent">' +
          optHTML('Brasil', false);
      if (hasStates) {
        html += '<button type="button" class="erv-filter-loc-chevron" data-action="toggle-loc-group" aria-label="Mostrar estados">▾</button>';
      }
      html += '</div>';
      if (hasStates) {
        html += '<div class="erv-filter-loc-children">';
        states.forEach(function(s) { html += optHTML(s, true); });
        html += '</div>';
      }
      html += '</div>';
    }
    countries.forEach(function(c) { html += optHTML(c, false); });
    return html;
  }

  function renderFiltersSidebar(fichas) {
    var body = document.getElementById('ervFiltersBody');
    if (!body) return;
    var counts = buildFacetCounts(fichas);
    var html = '';
    FACETS.forEach(function(facet) {
      var values = Object.keys(counts[facet.id] || {}).sort(function(a, b) {
        var diff = counts[facet.id][b] - counts[facet.id][a];
        return diff !== 0 ? diff : a.localeCompare(b, 'pt-BR');
      });
      var active = ervFilters[facet.id] ? ervFilters[facet.id].size : 0;
      var collapsed = !active && facet.id !== 'tipo'; // primeira faceta aberta por padrão
      html += '<div class="erv-filter-group' + (collapsed ? ' collapsed' : '') + '" data-facet="' + facet.id + '">' +
        '<button type="button" class="erv-filter-head" data-action="toggle-facet">' +
          '<span class="erv-filter-icon" aria-hidden="true">' + facet.icon + '</span>' +
          '<span>' + safeEsc(facet.label) + '</span>' +
          '<span class="erv-filter-count' + (active ? ' on' : '') + '">' + (active ? active + '/' : '') + values.length + '</span>' +
          '<span class="erv-filter-chevron" aria-hidden="true">▾</span>' +
        '</button>' +
        '<div class="erv-filter-options">';
      if (!values.length) {
        html += '<div class="erv-filter-empty">Sem dados disponíveis</div>';
      } else if (facet.id === 'localizacao') {
        html += renderLocalizacaoOptions(values, counts[facet.id]);
      } else {
        values.forEach(function(val) {
          var checked = ervFilters[facet.id] && ervFilters[facet.id].has(val);
          var swatch = '';
          if (facet.swatch) {
            var color = COR_HEX[val] || '#888';
            swatch = '<span class="erv-filter-color-swatch" style="background:' + color + '"></span>';
          }
          html += '<label class="erv-filter-option">' +
            '<input type="checkbox" data-facet="' + safeEsc(facet.id) + '" value="' + safeEsc(val) + '"' + (checked ? ' checked' : '') + '>' +
            swatch +
            '<span class="erv-filter-option-label" title="' + safeEsc(val) + '">' + safeEsc(val) + '</span>' +
            '<span class="erv-filter-option-tally">' + counts[facet.id][val] + '</span>' +
            '</label>';
        });
      }
      html += '</div></div>';
    });
    body.innerHTML = html;

    // Toggle expand/collapse
    body.querySelectorAll('[data-action="toggle-facet"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        btn.parentElement.classList.toggle('collapsed');
      });
    });
    // Toggle expand/collapse do grupo Brasil → estados
    body.querySelectorAll('[data-action="toggle-loc-group"]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var group = btn.closest('.erv-filter-loc-group');
        if (group) group.classList.toggle('collapsed');
      });
    });
    // Checkbox change
    body.querySelectorAll('input[type="checkbox"][data-facet]').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var facetId = cb.getAttribute('data-facet');
        var val = cb.value;
        ensureFilterState();
        if (cb.checked) ervFilters[facetId].add(val);
        else ervFilters[facetId].delete(val);
        updateGridAndMeta();
        updateClearAndCounts();
      });
    });
  }

  function updateClearAndCounts() {
    var n = totalActiveFilters();
    var clearBtn = document.getElementById('ervFiltersClear');
    if (clearBtn) clearBtn.disabled = n === 0;
    var toggleCount = document.getElementById('ervFiltersToggleCount');
    if (toggleCount) {
      if (n > 0) { toggleCount.hidden = false; toggleCount.textContent = String(n); }
      else { toggleCount.hidden = true; }
    }
    // Atualiza headers de faceta (contagem ativa)
    document.querySelectorAll('.erv-filter-group').forEach(function(g) {
      var facetId = g.getAttribute('data-facet');
      var active = ervFilters[facetId] ? ervFilters[facetId].size : 0;
      var head = g.querySelector('.erv-filter-count');
      if (!head) return;
      var total = g.querySelectorAll('.erv-filter-option').length;
      head.classList.toggle('on', active > 0);
      head.textContent = (active ? active + '/' : '') + total;
    });
  }

  // Assinatura da última lista renderizada — evita rebuild de DOM quando
  // o resultado filtrado é idêntico ao anterior (ex.: digitar "ca" e apagar
  // de volta para "c" produz a mesma lista).
  var _lastRenderedSig = null;
  function updateGridAndMeta() {
    if (!ervFichasCache) return;
    var grid = document.getElementById('ervatorioGrid');
    var meta = document.getElementById('ervatorioMeta');
    if (!grid) return;
    var filtered = applyFilters(ervFichasCache);
    // Atualiza meta sempre (texto curto, custo zero)
    if (meta) {
      var n = filtered.length;
      var total = ervFichasCache.length;
      meta.innerHTML = n === total
        ? '<strong>' + total + '</strong> ervas no catálogo'
        : '<strong>' + n + '</strong> de ' + total + ' ervas';
    }
    // Skip rebuild se a lista filtrada é a mesma — economiza ~50–250ms de
    // parse de innerHTML + reflow para 96 cards.
    var sig = filtered.length + ':' + filtered.map(function(r) { return r.slug; }).join(',');
    if (sig === _lastRenderedSig) return;
    _lastRenderedSig = sig;
    if (!filtered.length) {
      grid.innerHTML = '<p class="ev-empty">Nenhuma erva encontrada com os filtros selecionados.</p>';
      return;
    }
    grid.innerHTML = filtered.map(buildCardHTML).join('');
  }

  function buildCardHTML(row) {
    var f = row.ficha || {};
    var slug = row.slug || '';
    var nome = f.nome_popular || slug;
    var cientifico = f.nome_cientifico || row.herb_latin_name || '';
    var tagline = f.tagline || '';
    var eixo = (f.regulacao && f.regulacao.eixo_botanico_tpc) || '';
    // Prioriza a imagem de slug exato (images/produtos/<slug>.png) para evitar
    // que uma ficha genérica (ex.: "Aroeira", "Ginkgo") pegue a foto de uma
    // espécie vizinha via match aproximado no array HERBS. Cadeia de fallback:
    // slug exato → match aproximado (herbImg) → slug .jpg → placeholder.
    var herbImg = resolveErvaImg(nome, cientifico);
    var exactPng = 'images/produtos/' + slug + '.png';
    var fallbacks = [];
    if (herbImg && herbImg !== exactPng) fallbacks.push(herbImg);
    fallbacks.push('images/produtos/' + slug + '.jpg');
    fallbacks.push('images/produtos/placeholder.svg');
    var fbAttr = safeEsc(JSON.stringify(fallbacks));
    var onerr = "var q=JSON.parse(this.getAttribute('data-fb')||'[]');if(q.length){this.src=q.shift();this.setAttribute('data-fb',JSON.stringify(q));}else{this.onerror=null;}";
    var visual = '<div class="ev-card-img-wrap"><img class="ev-card-img" src="' + safeEsc(exactPng) + '" data-responsive="' + safeEsc(exactPng) + '" data-fb="' + fbAttr + '" alt="' + safeEsc(nome) + '" loading="lazy" onerror="' + onerr + '"></div>';
    return '<div class="herb-card ev-ficha-card" onclick="goPage(\'ficha\',null,\'' + safeEsc(slug) + '\')">' +
      visual +
      '<div class="ev-card-nome">' + safeEsc(nome) + '</div>' +
      '<div class="ev-card-latin"><em>' + safeEsc(cientifico) + '</em></div>' +
      (tagline ? '<div class="ev-card-tagline">' + safeEsc(tagline) + '</div>' : '') +
      (eixo ? '<div class="ev-card-eixo">' + safeEsc(eixo) + '</div>' : '') +
      '</div>';
  }

  function bindFilterControls() {
    var clearBtn = document.getElementById('ervFiltersClear');
    if (clearBtn && !clearBtn._bound) {
      clearBtn._bound = true;
      clearBtn.addEventListener('click', function() {
        FACETS.forEach(function(f) { if (ervFilters[f.id]) ervFilters[f.id].clear(); });
        ervSearchTerm = '';
        var search = document.getElementById('ervFiltersSearch');
        if (search) search.value = '';
        if (ervFichasCache) renderFiltersSidebar(ervFichasCache);
        updateGridAndMeta();
        updateClearAndCounts();
      });
    }
    var search = document.getElementById('ervFiltersSearch');
    if (search && !search._bound) {
      search._bound = true;
      var t = null;
      search.addEventListener('input', function() {
        clearTimeout(t);
        // Debounce 200ms — equilibra responsividade percebida com custo
        // de re-render. Em testes com 96 fichas, 120ms ainda permitia
        // sobreposição entre digitação rápida e render do grid.
        t = setTimeout(function() {
          var newTerm = search.value || '';
          if (newTerm === ervSearchTerm) return;
          ervSearchTerm = newTerm;
          updateGridAndMeta();
        }, 200);
      });
    }
    var toggle = document.getElementById('ervFiltersToggle');
    var sidebar = document.getElementById('ervFiltersSidebar');
    if (toggle && sidebar && !toggle._bound) {
      toggle._bound = true;
      toggle.addEventListener('click', function() {
        var open = sidebar.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  }

  window.renderIndiceCatalogo = async function() {
    var grid = document.getElementById('ervatorioGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="ev-loading">Carregando catalogo...</div>';
    ensureFilterState();
    bindFilterControls();
    try {
      var fichas = await ErvatorioData.getAllFichas();
      ervFichasCache = fichas || [];
      if (!ervFichasCache.length) {
        grid.innerHTML = '<p class="ev-empty">Nenhuma ficha disponivel.</p>';
        var meta = document.getElementById('ervatorioMeta');
        if (meta) meta.innerHTML = '';
        return;
      }
      renderFiltersSidebar(ervFichasCache);
      updateGridAndMeta();
      updateClearAndCounts();
    } catch (e) {
      grid.innerHTML = '<p class="ev-error">Erro ao carregar catalogo.</p>';
      console.error('[Ervatorio] Indice:', e);
    }
  };

  // ================================================================
  // #ficha/:slug — Ficha individual (PR 06: leigo primeiro, técnico depois)
  // ================================================================
  // Fonte: FICHAS_ANCORA (js/fichas-data.js — a mesma das páginas /erva/)
  // primeiro, instantânea e offline; o Supabase só entra para slug que não
  // está no pacote (D34). Produtos e blends do banco chegam depois e só
  // acrescentam à lateral. O bloco-resumo e a separação das seções vêm de
  // js/ficha-resumo.js, que o prerender também usa — uma fonte para as
  // duas fichas.
  function tt(k, fb) { var v = (typeof t === 'function') ? t(k) : null; return (v && v !== k) ? v : fb; }
  function fmt(s, vars) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ''; }); }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }

  // A erva do catálogo do app que corresponde à ficha (nome popular ou os
  // dois primeiros termos do nome científico). Sem correspondência, uma
  // entrada sintética entra em HERBS só para favoritos e bandeja — marcada
  // para o resumo não a tratar como fonte de texto.
  function herbDaFicha(f) {
    var pr = f.preparo || {};
    var _nrm = function (s) { return String(s || '').normalize('NFC').toLowerCase().trim(); };
    var herbs = (typeof HERBS !== 'undefined' && Array.isArray(HERBS)) ? HERBS : [];
    var h = herbs.find(function (x) {
      return _nrm(x.n) === _nrm(f.nome_popular) ||
        (x.lat && f.nome_cientifico && _nrm(f.nome_cientifico).startsWith(_nrm(x.lat.split(' ').slice(0, 2).join(' '))));
    });
    if (h) return h;
    if (!f.nome_popular) return null;
    var _stableId = function (n) { var v = 5381; for (var i = 0; i < n.length; i++) v = ((v << 5) + v) ^ n.charCodeAt(i); return (v >>> 0) % 90000 + 10000; };
    var id = _stableId(f.nome_popular);
    h = herbs.find(function (x) { return x.id === id; });
    if (!h) {
      h = { id: id, n: f.nome_popular, lat: f.nome_cientifico || '', icon: '🌿', cat: '', ef: '', tags: [], safe: [], avoid: [], temp: pr.temperatura_ideal || '', tempo: pr.tempo_de_infusao || '', dose: pr.quantidade || '', freq: pr.melhor_momento || '', tagline: f.tagline || '', _sintetico: true };
      herbs.push(h);
    }
    return h;
  }

  // Produto vendável do marketplace que corresponde a esta ficha (nome
  // normalizado). Produtos is_test respeitam a visibilidade da Onda 6.1.
  function fichaMktProduct(ficha) {
    if (typeof MKT_PRODUCTS === 'undefined' || !Array.isArray(MKT_PRODUCTS)) return null;
    var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); };
    var alvo = norm(ficha.nome_popular);
    if (!alvo) return null;
    for (var i = 0; i < MKT_PRODUCTS.length; i++) {
      var p = MKT_PRODUCTS[i];
      if (typeof mktIsVisible === 'function' && !mktIsVisible(p)) continue;
      if (typeof mktEhIndicacao === 'function' && mktEhIndicacao(p)) continue;
      var pn = norm(p.name);
      if (pn === alvo || pn.indexOf(alvo + ' ') === 0 || alvo.indexOf(pn + ' ') === 0) return p;
    }
    return null;
  }

  // Parceiros de indicação para esta ficha: os do catálogo do app (casados
  // por nome) e as linhas de admin_products com slug_ficha. Só entram com o
  // interruptor `indicacao` ligado (mktIsVisible falha para escondido) e
  // sempre pela rota /indicacao?produto=<id> — nunca a URL do parceiro
  // (ver «Indicação» no CLAUDE.md). Sem preço, por contrato dos programas.
  function fichaParceiros(slug, produtos) {
    var out = [], visto = {};
    if (typeof mktEhIndicacao !== 'function' || typeof mktIsVisible !== 'function' || typeof mktLinkDeIndicacao !== 'function') return out;
    var add = function (p) {
      if (!p || !mktEhIndicacao(p) || !mktIsVisible(p)) return;
      var link = mktLinkDeIndicacao(p);
      if (!link || visto[p.dbId]) return;
      visto[p.dbId] = true;
      out.push({ nome: p.parceiro || p.seller || 'parceiro', link: link });
    };
    if (typeof MKT_PRODUCTS !== 'undefined' && Array.isArray(MKT_PRODUCTS) && typeof mktFichaSlug === 'function') {
      MKT_PRODUCTS.forEach(function (p) { if (mktFichaSlug(p) === slug) add(p); });
    }
    (produtos || []).forEach(function (row) {
      add({ dbId: row.id, modo_de_venda: row.modo_de_venda, link_externo: row.link_externo, parceiro: row.parceiro || row.supplier || row.brand, is_test: row.is_test });
    });
    return out;
  }

  window.renderFichaPage = async function (slug) {
    var container = document.getElementById('fichaPageContent');
    if (!container) return;
    slug = String(slug || '');
    // Receitas antigas chamavam goPage('ficha', null, <id numérico da erva>):
    // resolve pela erva e corrige o hash.
    if (/^\d+$/.test(slug) && typeof HERBS !== 'undefined' && typeof _fichaAncoraForHerb === 'function') {
      var hh = HERBS.find(function (h) { return h.id === Number(slug); });
      var fa = hh ? _fichaAncoraForHerb(hh) : null;
      if (fa && fa.slug) { slug = fa.slug; window._currentSlug = slug; try { history.replaceState(history.state, '', '#ficha/' + slug); } catch (_) { /* ok */ } }
    }
    if (typeof fichaTimerFechar === 'function') fichaTimerFechar();
    var f = (typeof FICHAS_ANCORA !== 'undefined' && FICHAS_ANCORA[slug]) ? FICHAS_ANCORA[slug] : null;
    if (!f) {
      container.innerHTML = '<div class="ev-loading">Carregando ficha...</div>';
      try {
        var fd = await ErvatorioData.getFichaBySlug(slug);
        f = fd && fd.ficha;
      } catch (e) {
        console.error('[Ervatorio] Ficha:', e);
      }
      if (!f) {
        container.innerHTML = '<p class="ev-error">Ficha "' + safeEsc(slug) + '" não encontrada. <a href="#ervas">' + safeEsc(tt('ficha.back', 'Guia de Ervas')) + '</a></p>';
        return;
      }
    }
    container.innerHTML = buildFichaHTML(f, [], [], slug);
    // Sem banco a ficha já está inteira; com banco, produtos e blends
    // acrescentam à lateral quando chegarem (se a pessoa ainda estiver aqui).
    try {
      var extra = await Promise.all([ErvatorioData.getProdutosByFichaSlug(slug), ErvatorioData.getBlendsByFichaSlug(slug)]);
      var produtos = extra[0] || [], blends = extra[1] || [];
      if ((produtos.length || blends.length) && window._currentPage === 'ficha' && window._currentSlug === slug) {
        var onde = document.getElementById('fichaOnde'), rec = document.getElementById('fichaReceitas');
        if (onde && produtos.length) onde.innerHTML = buildFichaOnde(f, produtos, slug);
        if (rec && blends.length) rec.innerHTML = buildFichaReceitas(f, herbDaFicha(f), blends);
      }
    } catch (_) { /* sem Supabase: nada a acrescentar */ }
  };

  function buildFichaOnde(f, produtos, slug) {
    var html = '<div class="enc-eyebrow">' + safeEsc(tt('ficha.where', 'Onde encontrar')) + '</div>';
    var loja = typeof lojaAtiva === 'function' && lojaAtiva();
    var mktP = loja ? fichaMktProduct(f) : null;
    var parceiros = fichaParceiros(slug, produtos);
    if (mktP) {
      var inCartNow = (typeof cart !== 'undefined' && Array.isArray(cart)) && cart.some(function (c) { return c.id === mktP.id; });
      var priceTxt = (mktP.price != null && !isNaN(Number(mktP.price))) ? ' · R$ ' + Number(mktP.price).toFixed(2).replace('.', ',') : '';
      html += '<button type="button" class="enc-btn enc-btn-gold ficha-onde-btn" data-loja onclick="addMktCart(' + mktP.id + ');this.textContent=' + JSON.stringify(tt('ficha.in_cart', 'No carrinho')) + ';this.disabled=true"' + (inCartNow ? ' disabled' : '') + '>' +
        safeEsc(inCartNow ? tt('ficha.in_cart', 'No carrinho') : tt('ficha.where_buy', 'Comprar na Loja Ervatório') + priceTxt) + '</button>';
    }
    if (parceiros.length) {
      html += '<p class="ficha-onde-nota">' + safeEsc(tt('ficha.where_partners', 'Parceiros de confiança (indicação — o preço é o do parceiro):')) + '</p>' +
        '<div class="ficha-parceiros">' + parceiros.map(function (p) {
          return '<a class="ficha-parceiro" href="' + safeEsc(p.link) + '" target="_blank" rel="noopener sponsored">' + safeEsc(p.nome) + ' ↗</a>';
        }).join('') + '</div>';
    }
    if (!mktP && !parceiros.length) {
      html += '<p class="ficha-onde-nota">' + safeEsc(tt('ficha.where_none', 'Ainda não temos parceiro para esta erva. Procure casas de chá e ervanárias de confiança.')) + '</p>' +
        '<a class="ficha-aside-link" href="#onde-beber">' + safeEsc(tt('ficha.where_teahouses', 'Casas de chá no guia')) + ' →</a>';
    }
    return html;
  }

  function buildFichaReceitas(f, herb, blends) {
    var nome = f.nome_popular || '';
    var html = '<div class="enc-eyebrow">' + safeEsc(fmt(tt('ficha.recipes', 'Receitas com {erva}'), { erva: nome })) + '</div>';
    var itens = [];
    if (herb && typeof RECEITAS !== 'undefined' && Array.isArray(RECEITAS)) {
      RECEITAS.filter(function (r) { return Array.isArray(r.ervas_ids) && r.ervas_ids.indexOf(herb.id) >= 0; }).forEach(function (r) {
        itens.push('<a class="ficha-aside-link" href="#receitas/' + safeEsc(r.id) + '">' + safeEsc(r.nome) + (r.tempo_total ? ' <span>' + safeEsc(r.tempo_total) + '</span>' : '') + '</a>');
      });
    }
    (blends || []).forEach(function (b) {
      itens.push('<a class="ficha-aside-link" href="#blend/' + safeEsc(b.slug || '') + '">' + safeEsc(b.nome || b.slug) + (b.proposito ? ' <span>' + safeEsc(b.proposito) + '</span>' : '') + '</a>');
    });
    if (itens.length) html += '<div class="ficha-aside-list">' + itens.join('') + '</div>';
    else html += '<p class="ficha-onde-nota">' + safeEsc(tt('ficha.recipes_none', 'Ainda sem receita com esta erva.')) + '</p><a class="ficha-aside-link" href="#receitas">' + safeEsc(tt('ficha.recipes_all', 'Ver todas as receitas')) + ' →</a>';
    return html;
  }

  function buildFichaHTML(f, produtos, blends, slug) {
    var id = f.identificacao || {};
    var car = f.caracterizacao || {};
    var pr = f.preparo || {};
    var ps = f.perfil_sensorial || {};
    var ac = f.acoes_e_seguranca || {};
    var cu = f.cultura || {};
    var rg = f.regulacao || {};
    var herb = herbDaFicha(f);
    var herbId = herb ? herb.id : null;
    var R = (typeof fichaResumo === 'function') ? fichaResumo(f, (herb && !herb._sintetico) ? herb : null) : null;
    var sec = R ? R.secoes : { acoes: ac.acoes_principais || [], contraindicacoes: ac.contraindicacoes || [], interacoes: [], interacoes_estruturadas: ac.interacoes || [], notas_componentes: [], notas_evidencia: [], alertas: [], notas: [], efeitos_adversos: ac.efeitos_adversos || '', dose_maxima: ac.dose_maxima || '' };
    var gustativo = Array.isArray(ps.gustativo) ? ps.gustativo : [];
    var trig = Array.isArray(ps.trigeminal) ? ps.trigeminal : [];
    var evid = Array.isArray(ac.evidencia) ? ac.evidencia : [];
    var nome = f.nome_popular || '';

    var html = '<article class="ficha-page"><div class="ficha-main">';
    html += '<a class="ficha-back" href="#ervas">← ' + safeEsc(tt('ficha.back', 'Guia de Ervas')) + '</a>';

    // Cabeçalho: foto, nome, nome científico, chips do catálogo, tagline.
    var heroImg = resolveErvaImg(f.nome_popular, f.nome_cientifico) || ('images/produtos/' + slug + '.jpg');
    var heroPng = safeEsc('images/produtos/' + slug + '.png');
    var heroPh = 'images/produtos/placeholder.svg';
    var heroOerr = "if(!this._fb){this._fb=1;this.src='" + heroPng + "';}else{this.src='" + heroPh + "';this.onerror=null;}";
    var chips = [];
    if (herb && !herb._sintetico && herb.cat) chips.push(herb.cat);
    if (herb && !herb._sintetico && herb.bioma) chips.push(herb.bioma);
    html += '<header class="ficha-head">' +
      '<figure class="ficha-head-img"><img src="' + safeEsc(heroImg) + '" alt="' + safeEsc(nome) + '" loading="lazy" onerror="' + heroOerr + '"></figure>' +
      '<div class="ficha-head-text">' +
        '<h1 class="ficha-title">' + safeEsc(nome) + '</h1>' +
        '<div class="ficha-latin">' + safeEsc(f.nome_cientifico || '') + '</div>' +
        (chips.length ? '<div class="ficha-chips">' + chips.map(function (c) { return '<span class="ficha-chip">' + safeEsc(c) + '</span>'; }).join('') + '</div>' : '') +
        (f.tagline ? '<p class="ficha-tagline">' + safeEsc(f.tagline) + '</p>' : '') +
      '</div></header>';

    // Bloco-resumo: para que serve · como preparar · quem deve evitar.
    if (R) {
      var prep = R.preparo;
      var prepHtml = prep.texto ? '<p class="ficha-resumo-txt">' + safeEsc(prep.texto) + '</p>' :
        '<p class="ficha-resumo-txt">' + [prep.temp, prep.tempo, prep.dose].filter(Boolean).map(safeEsc).join(' · ') + '</p>' +
        (prep.freq ? '<p class="ficha-resumo-det">' + safeEsc(prep.freq) + '</p>' : '') +
        (prep.metodo ? '<p class="ficha-resumo-det">' + safeEsc(prep.metodo) + '</p>' : '');
      var evitarHtml = R.evitar.length
        ? '<ul class="ficha-resumo-lista">' + R.evitar.map(function (x) { return '<li>' + safeEsc(cap(x)) + '</li>'; }).join('') + '</ul>'
        : '<p class="ficha-resumo-txt">' + safeEsc(tt('ficha.no_contra', 'Nenhuma contraindicação registrada nesta ficha.')) + '</p>';
      if (R.seguro.length) evitarHtml += '<p class="ficha-resumo-det ficha-resumo-seguro">' + safeEsc(tt('ficha.safe_for', 'Seguro para')) + ': ' + R.seguro.map(safeEsc).join(', ') + '</p>';
      if (R.interacoes) evitarHtml += '<p class="ficha-resumo-det">' + safeEsc(fmt(tt('ficha.interactions_note', 'Toma remédio? Há {n} interações conhecidas — veja no detalhe técnico.'), { n: R.interacoes })) + '</p>';
      html += '<section class="ficha-resumo" aria-label="' + safeEsc(tt('ficha.summary', 'Resumo')) + '">' +
        '<div class="ficha-resumo-cell"><div class="enc-eyebrow">' + safeEsc(tt('ficha.summary.serve', 'Para que serve')) + '</div><p class="ficha-resumo-txt">' + safeEsc(cap(R.serve)) + '</p>' + (R.serveDetalhe ? '<p class="ficha-resumo-det">' + safeEsc(R.serveDetalhe) + '</p>' : '') + '</div>' +
        '<div class="ficha-resumo-cell"><div class="enc-eyebrow">' + safeEsc(tt('ficha.summary.prep', 'Como preparar')) + '</div>' + prepHtml + '</div>' +
        '<div class="ficha-resumo-cell"><div class="enc-eyebrow">' + safeEsc(tt('ficha.summary.avoid', 'Quem deve evitar')) + '</div>' + evitarHtml + '</div>' +
      '</section>';
    }

    // Ações: iniciar preparo (timer no lugar), salvar, adicionar ao blend.
    if (herbId !== null) {
      var favs = (typeof favorites !== 'undefined' && Array.isArray(favorites)) ? favorites : [];
      var tray = (typeof blendTray !== 'undefined' && Array.isArray(blendTray)) ? blendTray : [];
      var inFav = favs.indexOf(herbId) >= 0, inTray = tray.indexOf(herbId) >= 0;
      var min = R && R.minutos ? R.minutos : 0;
      var labelPreparo = min ? fmt(tt('ficha.start', 'Iniciar preparo · {min} min'), { min: min }) : tt('ficha.start_nomin', 'Iniciar preparo');
      var lSave = tt('ficha.save', '♡ Salvar'), lSaved = tt('ficha.saved', '♥ Salvo');
      var lAdd = tt('ficha.blend_add', '＋ Adicionar ao meu blend'), lAdded = tt('ficha.blend_added', '✓ No meu blend');
      html += '<div class="ficha-acoes">' +
        '<button type="button" class="enc-btn enc-btn-gold ficha-btn-preparo" aria-controls="fichaTimer" aria-expanded="false" onclick="fichaTimerToggle(this,' + min + ',' + JSON.stringify(nome).replace(/"/g, '&quot;') + ')">' + safeEsc(labelPreparo) + '</button>' +
        '<button type="button" class="enc-btn ficha-btn-salvar' + (inFav ? ' on' : '') + '" data-fav-herb="' + herbId + '" data-label-on="' + safeEsc(lSaved) + '" data-label-off="' + safeEsc(lSave) + '" aria-pressed="' + (inFav ? 'true' : 'false') + '" onclick="toggleFichaFav(' + herbId + ')">' + safeEsc(inFav ? lSaved : lSave) + '</button>' +
        '<button type="button" class="enc-btn ficha-btn-blend' + (inTray ? ' in-tray' : '') + '" data-blend-herb="' + herbId + '" data-label-on="' + safeEsc(lAdded) + '" data-label-off="' + safeEsc(lAdd) + '" aria-pressed="' + (inTray ? 'true' : 'false') + '" onclick="toggleTrayModal(' + herbId + ')">' + safeEsc(inTray ? lAdded : lAdd) + '</button>' +
      '</div>' +
      '<div id="fichaTimer" class="ficha-timer" hidden></div>';
    }

    // Alertas fortes em caixa própria, antes de tudo o mais.
    if (ac.alerta_critico) {
      html += '<section class="ficha-alert" role="alert">' +
        '<div class="ficha-alert-title">' + safeEsc(ac.alerta_critico.titulo || tt('ficha.alert', 'Atenção')) + '</div>' +
        (ac.alerta_critico.titulo2 ? '<div class="ficha-alert-sub">' + safeEsc(ac.alerta_critico.titulo2) + '</div>' : '') +
        '<div class="ficha-alert-body">' + safeEsc(ac.alerta_critico.corpo || '') + '</div>' +
        '</section>';
    }
    (sec.alertas || []).forEach(function (a) {
      html += '<section class="ficha-alert"><div class="ficha-alert-title">' + safeEsc(a.titulo) + '</div>' +
        (a.itens.length ? '<ul class="ficha-bullets">' + listMaybe(a.itens) + '</ul>' : '') + '</section>';
    });

    // Aviso de saúde: antes do técnico, não no fim.
    html += '<p class="ficha-aviso">' + safeEsc(tt('health.disclaimer', 'Conteúdo educacional — não substitui orientação médica.')) + '</p>';

    // Detalhe técnico, recolhido: tudo o que a ficha sempre teve.
    var tec = '';
    tec += '<section class="ficha-section"><h2>Identificação</h2><dl class="ficha-dl">' +
      (id.nome_cientifico ? '<div class="ficha-kv"><dt>Nome científico</dt><dd><em>' + safeEsc(id.nome_cientifico) + '</em></dd></div>' : '') +
      (id.familia_botanica ? '<div class="ficha-kv"><dt>Família</dt><dd>' + safeEsc(id.familia_botanica) + '</dd></div>' : '') +
      (id.tipo_botanico ? '<div class="ficha-kv"><dt>Tipo</dt><dd>' + safeEsc(id.tipo_botanico) + '</dd></div>' : '') +
      (id.parte_usada ? '<div class="ficha-kv"><dt>Parte usada</dt><dd>' + safeEsc(id.parte_usada) + '</dd></div>' : '') +
      '</dl>' +
      (Array.isArray(id.sinonimos) && id.sinonimos.length ? '<div class="ficha-sub">Sinônimos</div><ul class="ficha-bullets">' + listMaybe(id.sinonimos) + '</ul>' : '') +
      '</section>';

    tec += '<section class="ficha-section"><h2>Caracterização</h2><dl class="ficha-dl">' +
      (car.sabor_dominante ? '<div class="ficha-kv"><dt>Sabor</dt><dd>' + safeEsc(car.sabor_dominante) + '</dd></div>' : '') +
      (car.aroma ? '<div class="ficha-kv"><dt>Aroma</dt><dd>' + safeEsc(car.aroma) + '</dd></div>' : '') +
      (car.cor_da_infusao ? '<div class="ficha-kv"><dt>Cor da infusão</dt><dd>' + safeEsc(car.cor_da_infusao) + '</dd></div>' : '') +
      (car.intensidade ? '<div class="ficha-kv"><dt>Intensidade</dt><dd>' + safeEsc(car.intensidade) + '</dd></div>' : '') +
      (car.notas ? '<div class="ficha-kv"><dt>Notas</dt><dd>' + safeEsc(car.notas) + '</dd></div>' : '') +
      (car.bioma_de_origem ? '<div class="ficha-kv"><dt>Bioma</dt><dd>' + safeEsc(car.bioma_de_origem) + '</dd></div>' : '') +
      '</dl>' +
      (Array.isArray(car.distribuicao_geografica) && car.distribuicao_geografica.length ? '<div class="ficha-sub">Distribuição geográfica</div><ul class="ficha-bullets">' + listMaybe(car.distribuicao_geografica) + '</ul>' : '') +
      '</section>';

    tec += '<section class="ficha-section"><h2>Preparo</h2><dl class="ficha-dl">' +
      (pr.temperatura_ideal ? '<div class="ficha-kv"><dt>Temperatura</dt><dd>' + safeEsc(pr.temperatura_ideal) + '</dd></div>' : '') +
      (pr.tempo_de_infusao ? '<div class="ficha-kv"><dt>Tempo de infusão</dt><dd>' + safeEsc(pr.tempo_de_infusao) + '</dd></div>' : '') +
      (pr.quantidade ? '<div class="ficha-kv"><dt>Quantidade</dt><dd>' + safeEsc(pr.quantidade) + '</dd></div>' : '') +
      (pr.metodo ? '<div class="ficha-kv"><dt>Método</dt><dd>' + safeEsc(pr.metodo) + '</dd></div>' : '') +
      (pr.reinfusoes ? '<div class="ficha-kv"><dt>Reinfusões</dt><dd>' + safeEsc(pr.reinfusoes) + '</dd></div>' : '') +
      (pr.melhor_momento ? '<div class="ficha-kv"><dt>Melhor momento</dt><dd>' + safeEsc(pr.melhor_momento) + '</dd></div>' : '') +
      (pr.combina_com ? '<div class="ficha-kv"><dt>Combina com</dt><dd>' + safeEsc(pr.combina_com) + '</dd></div>' : '') +
      '</dl>' +
      (f.preparo_ritual ? '<div class="ficha-sub">' + safeEsc(f.preparo_ritual.titulo || 'Preparo cerimonial') + '</div><p>' + safeEsc(f.preparo_ritual.texto || '') + '</p>' : '') +
      '</section>';

    if (f.usos_topicos && (f.usos_topicos.evidencia || (Array.isArray(f.usos_topicos.aplicacoes) && f.usos_topicos.aplicacoes.length))) {
      tec += '<section class="ficha-section"><h2>Usos tópicos</h2>' +
        (f.usos_topicos.evidencia ? '<p><strong>Evidência:</strong> ' + safeEsc(f.usos_topicos.evidencia) + '</p>' : '') +
        (Array.isArray(f.usos_topicos.aplicacoes) ? f.usos_topicos.aplicacoes.map(function (a) { return typeof a === 'string' ? '<p>' + safeEsc(a) + '</p>' : '<div class="ficha-sub">' + safeEsc(a.titulo || '') + '</div><p>' + safeEsc(a.texto || '') + '</p>'; }).join('') : '') +
        (f.usos_topicos.contraindicacoes ? '<p class="ficha-warn-inline">' + safeEsc(f.usos_topicos.contraindicacoes) + '</p>' : '') +
        '</section>';
    }

    // Ações e segurança — cada coisa na sua seção (fichaSecoes).
    tec += '<section class="ficha-section" id="fichaSeguranca"><h2>Ações e segurança</h2>' +
      (sec.acoes.length ? '<div class="ficha-sub">Ações principais</div><ul class="ficha-bullets ficha-acoes-lista">' + listMaybe(sec.acoes) + '</ul>' : '') +
      (Array.isArray(ac.componentes_ativos) && ac.componentes_ativos.length ? '<div class="ficha-sub">Componentes ativos</div><dl class="ficha-dl">' + dlList(ac.componentes_ativos) + '</dl>' : '') +
      (sec.notas_componentes.length ? paragraphs(sec.notas_componentes) : '') +
      (evid.length ? '<div class="ficha-sub">Indicações com evidência</div><table class="ficha-table"><caption>Evidência clínica e populacional</caption><thead><tr><th>Indicação</th><th>Evidência</th><th>População</th></tr></thead><tbody>' + evid.map(function (e) { return '<tr><td>' + safeEsc(e.indicacao) + '</td><td>' + safeEsc(e.evidencia) + '</td><td>' + safeEsc(e.populacao) + '</td></tr>'; }).join('') + '</tbody></table>' : '') +
      (sec.notas_evidencia.length ? paragraphs(sec.notas_evidencia) : '') +
      (sec.contraindicacoes.length ? '<div class="ficha-sub">Contraindicações</div><ul class="ficha-bullets ficha-contra-lista">' + listMaybe(sec.contraindicacoes) + '</ul>' : '') +
      (sec.interacoes_estruturadas.length || sec.interacoes.length ? '<div class="ficha-sub">Interações</div>' +
        (sec.interacoes_estruturadas.length ? '<dl class="ficha-dl">' + dlList(sec.interacoes_estruturadas) + '</dl>' : '') +
        (sec.interacoes.length ? '<ul class="ficha-bullets">' + listMaybe(sec.interacoes) + '</ul>' : '') : '') +
      (sec.efeitos_adversos ? '<div class="ficha-sub">Efeitos adversos</div><p>' + safeEsc(sec.efeitos_adversos) + '</p>' : '') +
      (sec.dose_maxima ? '<div class="ficha-sub">Dose máxima</div><p>' + safeEsc(sec.dose_maxima) + '</p>' : '') +
      (sec.notas || []).map(function (n) { return '<div class="ficha-sub">' + safeEsc(n.titulo) + '</div>' + (n.itens.length ? '<ul class="ficha-bullets">' + listMaybe(n.itens) + '</ul>' : ''); }).join('') +
      '</section>';

    if (gustativo.length || trig.length || ps.olfativo_familia || ps.tatil || ps.descricao_integrada) {
      tec += '<section class="ficha-section"><h2>Perfil sensorial</h2>' +
        (gustativo.length ? '<table class="ficha-table"><caption>Perfil gustativo</caption><thead><tr><th>Dimensão</th><th>Intensidade</th><th>Observação</th></tr></thead><tbody>' + gustativo.map(function (g) { return '<tr><td>' + safeEsc(g.dimensao) + '</td><td>' + safeEsc(g.intensidade) + '</td><td>' + safeEsc(g.observacao) + '</td></tr>'; }).join('') + '</tbody></table>' : '') +
        (ps.olfativo_familia ? '<div class="ficha-sub">Olfativo — ' + safeEsc(ps.olfativo_familia) + '</div>' : '') +
        (Array.isArray(ps.olfativo_descritores) && ps.olfativo_descritores.length ? '<ul class="ficha-bullets">' + listMaybe(ps.olfativo_descritores) + '</ul>' : '') +
        (trig.length ? '<table class="ficha-table"><caption>Perfil trigeminal</caption><thead><tr><th>Receptor</th><th>Ativação</th><th>Molécula</th></tr></thead><tbody>' + trig.map(function (x) { return '<tr><td>' + safeEsc(x.receptor) + '</td><td>' + safeEsc(x.ativacao) + '</td><td>' + safeEsc(x.molecula) + '</td></tr>'; }).join('') + '</tbody></table>' : '') +
        (ps.tatil ? '<div class="ficha-sub">Tátil</div><p>' + safeEsc(ps.tatil) + '</p>' : '') +
        (ps.descricao_integrada ? '<blockquote class="ficha-pullquote">' + safeEsc(ps.descricao_integrada) + '</blockquote>' : '') +
        '</section>';
    }

    if (cu.historia || cu.cerimonial || cu.brasil || cu.curiosidade) {
      tec += '<section class="ficha-section"><h2>Cultura</h2>' +
        (cu.historia ? '<div class="ficha-sub">História</div>' + paragraphs(cu.historia) : '') +
        (cu.cerimonial ? '<div class="ficha-sub">Cerimonial</div><p>' + safeEsc(cu.cerimonial) + '</p>' : '') +
        (cu.brasil ? '<div class="ficha-sub">No Brasil</div>' + paragraphs(cu.brasil) : '') +
        (cu.curiosidade ? '<blockquote class="ficha-pullquote">' + safeEsc(cu.curiosidade) + '</blockquote>' : '') +
        '</section>';
    }

    var join = function (v) { return Array.isArray(v) ? v.map(safeEsc).join(' ') : safeEsc(v); };
    tec += '<section class="ficha-section"><h2>Regulação e origem</h2><dl class="ficha-dl">' +
      (rg.eixo_botanico_tpc ? '<div class="ficha-kv"><dt>Eixo botânico</dt><dd>' + safeEsc(rg.eixo_botanico_tpc) + '</dd></div>' : '') +
      (rg.status_anvisa ? '<div class="ficha-kv"><dt>ANVISA</dt><dd>' + join(rg.status_anvisa) + '</dd></div>' : '') +
      (rg.status_ema ? '<div class="ficha-kv"><dt>EMA</dt><dd>' + safeEsc(rg.status_ema) + '</dd></div>' : '') +
      (rg.status_fda ? '<div class="ficha-kv"><dt>FDA</dt><dd>' + safeEsc(rg.status_fda) + '</dd></div>' : '') +
      (rg.certificacao_organica ? '<div class="ficha-kv"><dt>Certificação orgânica</dt><dd>' + join(rg.certificacao_organica) + '</dd></div>' : '') +
      (rg.sazonalidade ? '<div class="ficha-kv"><dt>Sazonalidade</dt><dd>' + join(rg.sazonalidade) + '</dd></div>' : '') +
      '</dl></section>';

    html += '<details class="ficha-tecnico" id="fichaTecnico"><summary><span class="ficha-tecnico-txt"><span class="ficha-tecnico-h2">' + safeEsc(tt('ficha.tech', 'Detalhe técnico')) + '</span><span class="ficha-tecnico-sub">' + safeEsc(tt('ficha.tech_sub', 'Componentes, evidência, regulação, perfil sensorial e cultura')) + '</span></span></summary>' + tec + '</details>';

    // Fontes: sempre presente — sem fonte, diz que está em revisão.
    html += '<section class="ficha-section ficha-fontes"><h2>' + safeEsc(tt('ficha.sources', 'Fontes')) + '</h2>' +
      (R && R.fontes.length ? '<ul class="ficha-bullets ficha-sources">' + listMaybe(R.fontes) + '</ul>' : '<p class="ficha-mute">' + safeEsc(tt('ficha.sources_review', 'Fontes em revisão.')) + '</p>') +
      '</section>';

    html += '<div class="ficha-foot"><span>Ervatório · ' + safeEsc(nome) + ' · v' + safeEsc(f.schema_version || '1.1') + '</span></div>';
    html += '</div>';

    // Lateral: onde encontrar, receitas, e-mail.
    html += '<aside class="ficha-aside" id="fichaAside">' +
      '<section class="ficha-aside-box ficha-onde" id="fichaOnde">' + buildFichaOnde(f, produtos, slug) + '</section>' +
      '<section class="ficha-aside-box" id="fichaReceitas">' + buildFichaReceitas(f, herb, blends) + '</section>' +
      '<section class="ficha-aside-box ficha-email">' +
        '<div class="enc-eyebrow">' + safeEsc(tt('ficha.email', 'Fichas e receitas por e-mail')) + '</div>' +
        '<p class="ficha-onde-nota">' + safeEsc(tt('ficha.email_sub', 'Uma pausa por semana, com fichas como esta. Sem spam; cancele quando quiser.')) + '</p>' +
        '<form class="ficha-email-form" onsubmit="return subscribeEmail(this,\'ficha\',\'ficha.email_ok\',\'ficha.email_err\')">' +
          '<label class="sr-only" for="fichaEmail">' + safeEsc(tt('ficha.email_label', 'Seu e-mail')) + '</label>' +
          '<input id="fichaEmail" type="email" required autocomplete="email" placeholder="voce@exemplo.com">' +
          '<button type="submit" class="enc-btn enc-btn-gold">' + safeEsc(tt('ficha.email_btn', 'Quero receber')) + '</button>' +
        '</form>' +
        '<p class="ficha-onde-nota" data-email-msg hidden></p>' +
      '</section>' +
    '</aside>';
    html += '</article>';
    return html;
  }

  // ================================================================
  // #blends — Biblioteca de Blends
  // ================================================================
  window.renderBibliotecaBlends = async function() {
    var el = document.getElementById('blendsGrid');
    if (!el) return;
    el.innerHTML = '<div class="ev-loading">Carregando blends...</div>';
    try {
      var blends = await ErvatorioData.getAllBlends();
      if (!blends || !blends.length) {
        el.innerHTML = '<p class="ev-empty">Nenhum blend disponivel.</p>';
        return;
      }
      el.innerHTML = blends.map(function(b) {
        var slug = b.slug || '';
        var nome = b.nome || slug;
        var proposito = b.proposito || '';
        var ervas = Array.isArray(b.ervas_referenciadas) ? b.ervas_referenciadas : [];
        // Imagem-herói: primeira erva com foto na biblioteca; fallback para arranjo genérico
        var blendImg = null;
        for (var i = 0; i < ervas.length && !blendImg; i++) { blendImg = resolveErvaImg(ervas[i], ''); }
        var imgSrc = safeEsc(blendImg || 'images/produtos/arranjo-de-chas.png');
        var ph = 'images/produtos/placeholder.svg';
        var visual = '<div class="ev-card-img-wrap"><img class="ev-card-img" src="' + imgSrc + '" alt="' + safeEsc(nome) + '" loading="lazy" onerror="this.src=\'' + ph + '\';this.onerror=null"></div>';
        return '<div class="herb-card ev-blend-card" onclick="goPage(\'blend\',null,\'' + safeEsc(slug) + '\')">' +
          visual +
          '<div class="ev-card-nome">' + safeEsc(nome) + '</div>' +
          (proposito ? '<div class="ev-card-tagline">' + safeEsc(proposito) + '</div>' : '') +
          (ervas.length ? '<div class="ev-card-ervas">' + ervas.map(function(e) { return '<span class="ev-erva-tag">' + safeEsc(e) + '</span>'; }).join(' ') + '</div>' : '') +
          '</div>';
      }).join('');
    } catch (e) {
      el.innerHTML = '<p class="ev-error">Erro ao carregar blends.</p>';
      console.error('[Ervatorio] Blends:', e);
    }
  };

  // ================================================================
  // #blend/:slug — Blend individual
  // ================================================================
  window.renderBlendPage = async function(slug) {
    var container = document.getElementById('blendPageContent');
    if (!container) return;
    container.innerHTML = '<div class="ev-loading">Carregando blend...</div>';
    try {
      var blend = await ErvatorioData.getBlendBySlug(slug);
      if (!blend) {
        container.innerHTML = '<p class="ev-error">Blend "' + safeEsc(slug) + '" nao encontrado.</p>';
        return;
      }
      var ervas = Array.isArray(blend.ervas_referenciadas) ? blend.ervas_referenciadas : [];
      var html = '<article class="ficha-page-article">';
      html += '<header class="ficha-hero">' +
        '<h1 class="ficha-title">' + safeEsc(blend.nome || slug) + '</h1>' +
        (blend.proposito ? '<blockquote class="ficha-tagline">' + safeEsc(blend.proposito) + '</blockquote>' : '') +
        '</header>';

      // Conteudo markdown (renderizado como texto por enquanto)
      if (blend.conteudo_markdown) {
        html += '<section class="ficha-section"><h2>Receita</h2>' +
          '<div class="ev-blend-content">' + renderSimpleMarkdown(blend.conteudo_markdown) + '</div>' +
          '</section>';
      }

      // Ingredientes/instrucoes JSONB
      if (blend.ingredientes && Array.isArray(blend.ingredientes)) {
        html += '<section class="ficha-section"><h2>Ingredientes</h2><ul class="ficha-bullets">';
        blend.ingredientes.forEach(function(ing) {
          html += '<li>' + safeEsc(typeof ing === 'string' ? ing : (ing.nome || '') + (ing.quantidade ? ' — ' + ing.quantidade : '')) + '</li>';
        });
        html += '</ul></section>';
      }

      if (blend.modo_preparo) {
        html += '<section class="ficha-section"><h2>Modo de preparo</h2>' +
          '<div class="ev-blend-content">' + renderSimpleMarkdown(String(blend.modo_preparo)) + '</div>' +
          '</section>';
      }

      // Ervas referenciadas como links
      if (ervas.length) {
        html += '<section class="ficha-section"><h2>Ervas neste blend</h2><div class="ev-blends-list">';
        ervas.forEach(function(slug_erva) {
          html += '<div class="ev-blend-link" onclick="goPage(\'ficha\',null,\'' + safeEsc(slug_erva) + '\')">' +
            '<span class="ev-blend-nome">' + safeEsc(slug_erva) + '</span>' +
            '<span class="ev-blend-prop"> Ver ficha →</span>' +
            '</div>';
        });
        html += '</div></section>';
      }

      html += '<footer class="ficha-foot"><span>Ervatorio v1.1 · Blend</span></footer>';
      html += '</article>';
      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = '<p class="ev-error">Erro ao carregar blend.</p>';
      console.error('[Ervatorio] Blend:', e);
    }
  };

  // Simple markdown-like renderer (bold, italic, line breaks, lists)
  function renderSimpleMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/<\/ul>\s*<ul>/g, '')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  // ================================================================
  // #roda-funcional — Roda dos Chas v1.1 (vetores agrupados por sistema)
  // ================================================================

  // Mapeamento de vetor -> categoria terapêutica. Ordem importa: o
  // primeiro match vence. Vetores sem match caem em 'Outros'.
  // 'short' é o rótulo usado na roda (espaço limitado no setor).
  var VETOR_CATEGORIAS = [
    { id: 'digestivo',  label: 'Digestivo',          short: 'Digestivo',    icon: '🫕',
      rx: /^(antidisp|carminat|colagogo|coler[ée]t|hepatoprot|hepatoativ|antiulcer|antiespasm|eup[eé]pt|aperiente|protetor da mucosa)/i },
    { id: 'respiratorio', label: 'Respiratório',     short: 'Respir.',      icon: '🌬',
      rx: /^(expector|broncodil|antituss|antiastm|descong|antial[eé]rg)/i },
    { id: 'nervoso',    label: 'Sistema Nervoso',    short: 'Nervoso',      icon: '🧠',
      rx: /^(ansiol|sedat|hipno|calmant|antidepr|nootr|adaptog|indutor de sono|estimulante do SNC)/i },
    { id: 'cardiovascular', label: 'Cardiovascular', short: 'Cardio',       icon: '❤️',
      rx: /^(anti-?hipert|hipolipem|cardiop|vasodil|vasocon|venoton|antiagreg|hipotens)/i },
    { id: 'urinario',   label: 'Urinário & Renal',   short: 'Urinário',     icon: '💧',
      rx: /^(diur[eé]t|litol[ií]t|antiss[eé]ptico urin|nefroprot)/i },
    { id: 'topico',     label: 'Pele & Tópico',      short: 'Tópico',       icon: '🌿',
      rx: /(t[oó]pico|cicatriz|anti-?hemorr|dermatol[oó]gic|antiss[eé]ptico)/i },
    { id: 'metabolico', label: 'Metabólico',         short: 'Metab.',       icon: '🔥',
      rx: /^(termog|hipogli|hipoglicem|lipol[ií]t|redu[cç][aã]o de peso|coadjuvante.*peso|modulador.*glic)/i },
    { id: 'antiinflam', label: 'Anti-inflamatório',  short: 'Anti-inflam', icon: '🩹',
      rx: /^(anti-?inflamat)/i },
    { id: 'imuno',      label: 'Imune & Antimicrob.', short: 'Imune',       icon: '🛡',
      rx: /^(antimicrob|antif[uú]ng|antiviral|antibacter|imunomodul)/i },
    { id: 'geral',      label: 'Tônico & Antioxid.',  short: 'Tônico',      icon: '✨',
      rx: /^(antioxidante|t[oô]nico|analg[eé]sico|afrodis|sudor[ií]fero|febr[ií]fugo|hemost)/i },
  ];
  var RF_OUTROS_META = { id: 'outros', label: 'Outros', short: 'Outros', icon: '🌱' };

  // Paleta de cores por categoria (coerente com o restante do app).
  var RF_COLORS = {
    digestivo:    '#5a3a1a',
    respiratorio: '#1e4a3a',
    nervoso:      '#3a2d6b',
    cardiovascular:'#6b2d3a',
    urinario:     '#2d4a6b',
    topico:       '#4a1e4a',
    metabolico:   '#6b5a2d',
    antiinflam:   '#6b3a2d',
    imuno:        '#2d4a3a',
    geral:        '#3d5a2a',
    outros:       '#4a4a4a'
  };

  // Estado do canvas-wheel
  var rfCats = [];        // categorias com pelo menos 1 vetor, na ordem de render
  var rfSelIdx = -1;
  var rfHovIdx = -1;

  function classificarVetor(v) {
    var s = String(v || '').trim();
    for (var i = 0; i < VETOR_CATEGORIAS.length; i++) {
      if (VETOR_CATEGORIAS[i].rx.test(s)) return VETOR_CATEGORIAS[i].id;
    }
    return 'outros';
  }

  function rfLighten(hex, amt) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(function(c){return c+c;}).join('');
    var r = parseInt(h.slice(0,2), 16);
    var g = parseInt(h.slice(2,4), 16);
    var b = parseInt(h.slice(4,6), 16);
    r = Math.min(255, r + ((255-r)*amt|0));
    g = Math.min(255, g + ((255-g)*amt|0));
    b = Math.min(255, b + ((255-b)*amt|0));
    return 'rgb('+r+','+g+','+b+')';
  }

  function drawRodaFuncWheel() {
    var cv = document.getElementById('rfCanvas');
    if (!cv || !rfCats.length) return;
    var ctx = cv.getContext('2d');
    var W = 340, CX = W/2, CY = W/2, R = 152, IR = 40;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (cv.width !== W*dpr) {
      cv.width = W*dpr; cv.height = W*dpr;
      cv.style.width = W+'px'; cv.style.height = W+'px';
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, W);
    ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
    var n = rfCats.length, arc = 2*Math.PI/n, start = -Math.PI/2;
    rfCats.forEach(function(cat, i) {
      var a0 = start + i*arc, a1 = a0 + arc;
      var sel = rfSelIdx === i, hov = rfHovIdx === i;
      ctx.beginPath(); ctx.moveTo(CX, CY);
      ctx.arc(CX, CY, sel ? R+5 : R, a0, a1);
      ctx.closePath();
      var c = RF_COLORS[cat.id] || '#3a3a3a';
      ctx.fillStyle = sel ? rfLighten(c, .4) : hov ? rfLighten(c, .2) : c;
      ctx.fill();
      ctx.strokeStyle = sel ? 'rgba(200,168,75,.7)' : 'rgba(11,10,8,.65)';
      ctx.lineWidth = sel ? 1.5 : 1;
      ctx.stroke();
      if (sel) {
        ctx.beginPath(); ctx.moveTo(CX, CY);
        ctx.arc(CX, CY, R+4, a0+.02, a1-.02);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(240,217,138,.3)';
        ctx.lineWidth = 2; ctx.stroke();
      }
      // Label (ícone acima do nome resumido)
      var mA = a0 + arc/2, lr = (R+IR)/2;
      var lx = CX + lr*Math.cos(mA), ly = CY + lr*Math.sin(mA);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(mA + Math.PI/2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 2; ctx.shadowOffsetY = .5;
      ctx.fillStyle = sel ? '#f5dd95' : hov ? '#ead083' : 'rgba(245,235,215,.92)';
      ctx.font = '14px system-ui';
      ctx.fillText(cat.icon, 0, -10);
      var fs = n > 8 ? 10 : 11;
      ctx.font = (sel ? '600 ' : '500 ') + fs + 'px "Jost",system-ui,sans-serif';
      ctx.fillText(cat.short, 0, 8);
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.restore();
    });
    // Ring + centro
    ctx.beginPath(); ctx.arc(CX, CY, R+7, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(200,168,75,.1)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(CX, CY, IR, 0, Math.PI*2);
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#1a3a2a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,168,75,.45)';
    ctx.lineWidth = 1.5; ctx.stroke();
    // Label central
    var lbl = document.getElementById('rfWheelCenter');
    if (lbl) {
      var inner = lbl.querySelector('.rf-wheel-label');
      var selCat = rfSelIdx >= 0 ? rfCats[rfSelIdx] : null;
      if (inner) inner.innerHTML = selCat
        ? '<span style="font-size:1.2rem;display:block;line-height:1">' + selCat.icon + '</span><span style="font-size:.62rem;letter-spacing:.04em">' + selCat.short + '</span>'
        : 'Toque<br>uma categoria';
    }
  }

  function getRodaFuncIdx(mx, my) {
    if (!rfCats.length) return -1;
    var CX = 170, CY = 170, R = 152, IR = 40;
    var dx = mx - CX, dy = my - CY;
    var d = Math.sqrt(dx*dx + dy*dy);
    if (d < IR || d > R + 8) return -1;
    var a = Math.atan2(dy, dx) + Math.PI/2;
    if (a < 0) a += 2*Math.PI;
    if (a >= 2*Math.PI) a -= 2*Math.PI;
    return Math.floor(a / (2*Math.PI / rfCats.length)) % rfCats.length;
  }

  function focusCategoria(id) {
    var el = document.getElementById('rfcat-' + id);
    if (!el) return;
    document.querySelectorAll('.rf-cat').forEach(function(c) {
      if (c.id === 'rfcat-' + id) c.classList.remove('collapsed');
      else c.classList.add('collapsed');
    });
    // Destaque visual breve
    el.classList.add('rf-cat-flash');
    setTimeout(function(){ el.classList.remove('rf-cat-flash'); }, 1200);
    // Scroll leve até a subdivisão
    setTimeout(function(){
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function initRodaFuncWheelEvents() {
    var cv = document.getElementById('rfCanvas');
    if (!cv || cv._hasEvents) return;
    cv._hasEvents = true;
    cv.addEventListener('mousemove', function(e) {
      var r = cv.getBoundingClientRect();
      rfHovIdx = getRodaFuncIdx(e.clientX - r.left, e.clientY - r.top);
      cv.style.cursor = rfHovIdx >= 0 ? 'pointer' : 'default';
      drawRodaFuncWheel();
    });
    cv.addEventListener('mouseleave', function() {
      rfHovIdx = -1;
      drawRodaFuncWheel();
    });
    function handleSelect(i) {
      if (i < 0) return;
      rfSelIdx = (i === rfSelIdx) ? -1 : i;
      drawRodaFuncWheel();
      if (rfSelIdx >= 0) focusCategoria(rfCats[rfSelIdx].id);
    }
    cv.addEventListener('click', function(e) {
      var r = cv.getBoundingClientRect();
      handleSelect(getRodaFuncIdx(e.clientX - r.left, e.clientY - r.top));
    });
    cv.addEventListener('touchstart', function(e) {
      e.preventDefault();
      var t = e.touches[0], r = cv.getBoundingClientRect();
      handleSelect(getRodaFuncIdx(t.clientX - r.left, t.clientY - r.top));
    }, { passive: false });
  }

  function agruparVetores(vetores) {
    var grupos = {};
    VETOR_CATEGORIAS.forEach(function(c) { grupos[c.id] = []; });
    grupos.outros = [];
    vetores.forEach(function(v) { grupos[classificarVetor(v)].push(v); });
    return grupos;
  }

  // Toggle collapse/expand de uma subdivisão.
  window.toggleRodaFuncCat = function(id) {
    var el = document.getElementById('rfcat-' + id);
    if (!el) return;
    el.classList.toggle('collapsed');
  };

  window.renderRodaFuncional = async function() {
    var form = document.getElementById('rodaFuncForm');
    var results = document.getElementById('rodaFuncResults');
    if (!form || !results) return;

    form.innerHTML = '<div class="ev-loading">Carregando vetores...</div>';
    try {
      var vetores = await ErvatorioData.getVetoresDisponiveis();
      var grupos = agruparVetores(vetores);

      // Populate rfCats with non-empty categories for the visual wheel.
      rfCats = [];
      rfSelIdx = -1; rfHovIdx = -1;
      VETOR_CATEGORIAS.concat([RF_OUTROS_META]).forEach(function(c) {
        var arr = grupos[c.id];
        if (arr && arr.length) {
          rfCats.push({ id: c.id, label: c.label, short: c.short, icon: c.icon, count: arr.length });
        }
      });

      var html = '<div class="ev-roda-vetores">' +
        '<div class="ficha-sub" style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
          '<span>Selecione os vetores desejados</span>' +
          '<span id="rfCount" class="rf-count">0 selecionados</span>' +
        '</div>';

      // Renderiza cada categoria que tem pelo menos 1 vetor.
      VETOR_CATEGORIAS.concat([RF_OUTROS_META]).forEach(function(c) {
        var arr = grupos[c.id];
        if (!arr || !arr.length) return;
        html += '<div class="rf-cat" id="rfcat-' + c.id + '">' +
          '<button type="button" class="rf-cat-head" onclick="toggleRodaFuncCat(\'' + c.id + '\')">' +
            '<span class="rf-cat-icon">' + c.icon + '</span>' +
            '<span class="rf-cat-label">' + safeEsc(c.label) + '</span>' +
            '<span class="rf-cat-count">' + arr.length + '</span>' +
            '<span class="rf-cat-chevron">▾</span>' +
          '</button>' +
          '<div class="rf-cat-body ev-checkbox-grid">';
        arr.forEach(function(v) {
          html += '<label class="ev-checkbox">' +
            '<input type="checkbox" name="vetor" value="' + safeEsc(v) + '" onchange="atualizarContagemVetores()"> ' +
            safeEsc(v) +
          '</label>';
        });
        html += '</div></div>';
      });
      html += '</div>';

      html += '<div class="ev-roda-restricoes"><div class="ficha-sub">Restrições</div><div class="ev-checkbox-grid">' +
        '<label class="ev-checkbox"><input type="checkbox" id="rfGestante"> Gestante</label>' +
        '<label class="ev-checkbox"><input type="checkbox" id="rfLactante"> Lactante</label>' +
        '<label class="ev-checkbox"><input type="checkbox" id="rfCrianca"> Criança (&lt; 12 anos)</label>' +
        '<label class="ev-checkbox"><input type="checkbox" id="rfAlerta"> Evitar alertas críticos</label>' +
        '</div></div>';

      html += '<button class="ev-roda-btn" onclick="executarRecomendacao()">Recomendar</button>';
      form.innerHTML = html;
      results.innerHTML = '<p class="ev-muted">Selecione vetores e clique em Recomendar.</p>';

      // Render visual wheel após o form estar no DOM.
      drawRodaFuncWheel();
      initRodaFuncWheelEvents();
    } catch (e) {
      form.innerHTML = '<p class="ev-error">Erro ao carregar vetores.</p>';
      console.error('[Ervatorio] Roda funcional:', e);
    }
  };

  // Atualiza o contador global de vetores selecionados no cabeçalho.
  window.atualizarContagemVetores = function() {
    var el = document.getElementById('rfCount');
    if (!el) return;
    var n = document.querySelectorAll('#rodaFuncForm input[name="vetor"]:checked').length;
    el.textContent = n + (n === 1 ? ' selecionado' : ' selecionados');
  };

  // Aliases esperados pelo diagnóstico de produção e pelo hash handler.
  // Os nomes canônicos (renderIndiceCatalogo / renderBibliotecaBlends) permanecem
  // para compatibilidade com goPage() em app.js.
  window.renderErvatorio = window.renderIndiceCatalogo;
  window.renderBlends = window.renderBibliotecaBlends;

  window.executarRecomendacao = async function() {
    var results = document.getElementById('rodaFuncResults');
    if (!results) return;

    var checked = document.querySelectorAll('#rodaFuncForm input[name="vetor"]:checked');
    var vetores = [];
    checked.forEach(function(cb) { vetores.push(cb.value); });
    if (!vetores.length) {
      results.innerHTML = '<p class="ev-muted">Selecione pelo menos um vetor.</p>';
      return;
    }

    var restricoes = {
      gestante: document.getElementById('rfGestante') && document.getElementById('rfGestante').checked,
      lactante: document.getElementById('rfLactante') && document.getElementById('rfLactante').checked,
      crianca: document.getElementById('rfCrianca') && document.getElementById('rfCrianca').checked,
      evitar_alertas: document.getElementById('rfAlerta') && document.getElementById('rfAlerta').checked,
      limite: 5
    };

    results.innerHTML = '<div class="ev-loading">Calculando recomendacoes...</div>';
    try {
      var recs = await ErvatorioData.recomendar(vetores, restricoes);
      if (!recs || !recs.length) {
        results.innerHTML = '<p class="ev-empty">Nenhuma recomendacao encontrada para esses criterios.</p>';
        return;
      }
      var html = '<div class="ficha-sub">Top ' + recs.length + ' recomendacoes</div><div class="ev-roda-results">';
      recs.forEach(function(r, i) {
        var hasAlerta = r.tem_alerta_critico || r.alerta_critico;
        html += '<div class="ev-rec-card' + (hasAlerta ? ' ev-rec-alerta' : '') + '" onclick="goPage(\'ficha\',null,\'' + safeEsc(r.slug || '') + '\')">' +
          '<div class="ev-rec-rank">' + (i + 1) + '</div>' +
          '<div class="ev-rec-info">' +
          '<div class="ev-rec-nome">' + safeEsc(r.nome_popular || r.slug || '') + '</div>' +
          (r.tagline ? '<div class="ev-rec-tagline">' + safeEsc(r.tagline) + '</div>' : '') +
          (r.score !== undefined ? '<div class="ev-rec-score">Score: ' + Number(r.score).toFixed(1) + '</div>' : '') +
          (hasAlerta ? '<div class="ev-rec-alert-badge">Alerta critico</div>' : '') +
          '</div>' +
          '</div>';
      });
      html += '</div>';
      results.innerHTML = html;
    } catch (e) {
      results.innerHTML = '<p class="ev-error">Erro na recomendacao.</p>';
      console.error('[Ervatorio] Recomendacao:', e);
    }
  };
})();
