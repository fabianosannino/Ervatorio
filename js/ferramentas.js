// js/ferramentas.js — Ferramentas Calculadoras + Famílias · Ervatório
// Depende de: HERBS (app.js), goPage, esc, toast

(function () {
  // ════════════════════════════════════════════════════════════════
  // PARSERS — extraem números dos strings descritivos das fichas
  // ════════════════════════════════════════════════════════════════
  function parseTemp(s) {
    var m = String(s || '').match(/(\d+)\s*°?C?/i);
    return m ? parseInt(m[1], 10) : 90;
  }
  function parseTempoMin(s) {
    var m = String(s || '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 5;
  }
  function parseDose(s) {
    // Tenta extrair {gramas/colheres, volumeMl}
    var str = String(s || '');
    var volM = str.match(/(\d+)\s*ml/i);
    var volumeMl = volM ? parseInt(volM[1], 10) : 250;
    var unidade = 'colher';
    var qtd = 1;
    var qtM = str.match(/(\d+(?:[.,]\d+)?)(?:\s*-\s*(\d+(?:[.,]\d+)?))?\s*(col\.?\s*sopa|col\.?\s*ch[áa]|colheres?|fatias?|g\b|gramas?|pau|folhas?|paus?)/i);
    if (qtM) {
      var min = parseFloat(qtM[1].replace(',', '.'));
      var max = qtM[2] ? parseFloat(qtM[2].replace(',', '.')) : min;
      qtd = (min + max) / 2;
      var u = qtM[3].toLowerCase();
      if (u.indexOf('col') >= 0 && u.indexOf('ch') >= 0) unidade = 'col_cha';
      else if (u.indexOf('col') >= 0) unidade = 'col_sopa';
      else if (u.indexOf('fati') >= 0) unidade = 'fatias';
      else if (u.indexOf('pau') >= 0) unidade = 'pau';
      else if (u.indexOf('folha') >= 0) unidade = 'folhas';
      else if (u === 'g' || u.indexOf('grama') >= 0) unidade = 'g';
    }
    return { qtd: qtd, unidade: unidade, volumeMl: volumeMl };
  }
  function unidadeLabel(u, qtd) {
    var plural = qtd > 1 ? 's' : '';
    var map = {
      col_sopa: 'col. de sopa',
      col_cha: 'col. de chá',
      fatias: 'fatia' + plural,
      pau: 'pau' + (qtd > 1 ? 's' : ''),
      folhas: 'folha' + plural,
      g: 'g',
      colher: 'colher' + (qtd > 1 ? 'es' : '')
    };
    return map[u] || u;
  }

  // ════════════════════════════════════════════════════════════════
  // 1.1 — CALCULADORA DE INFUSÃO
  // ════════════════════════════════════════════════════════════════
  var _calcState = { herbId: null, volumeMl: 250, forca: 'medio' };

  function calcular(herb, opts) {
    var temp = parseTemp(herb.temp);
    var tempo = parseTempoMin(herb.tempo);
    var dose = parseDose(herb.dose);
    var fatorVol = opts.volumeMl / dose.volumeMl;
    var multForca = { leve: 0.7, medio: 1.0, forte: 1.4 }[opts.forca] || 1;
    var multTempo = { leve: 0.9, medio: 1.0, forte: 1.15 }[opts.forca] || 1;
    var qtdFinal = +(dose.qtd * fatorVol * multForca).toFixed(1);
    var tempoFinal = Math.round(tempo * multTempo);
    return {
      temp: temp,
      tempoMin: tempoFinal,
      qtd: qtdFinal,
      unidadeLabel: unidadeLabel(dose.unidade, qtdFinal),
      freq: herb.freq || ''
    };
  }

  function renderCalculadora() {
    var p = document.getElementById('page-ferramenta-infusao');
    if (!p) return;
    var herb = _calcState.herbId ? HERBS.find(function (h) { return h.id === _calcState.herbId; }) : null;
    var herbList = HERBS.slice().sort(function (a, b) { return a.n.localeCompare(b.n, 'pt-BR'); });
    var opts = herbList.map(function (h) {
      return '<option value="' + h.id + '"' + (_calcState.herbId === h.id ? ' selected' : '') + '>' + esc(h.n) + '</option>';
    }).join('');

    var resultHtml = '';
    if (herb) {
      var r = calcular(herb, { volumeMl: _calcState.volumeMl, forca: _calcState.forca });
      resultHtml = ''
        + '<div class="ferr-result">'
        +   '<div class="ferr-result-row"><div class="ferr-result-icon">🌡</div><div class="ferr-result-label">Temperatura</div><div class="ferr-result-val">' + r.temp + '°C</div></div>'
        +   '<div class="ferr-result-row"><div class="ferr-result-icon">⏱</div><div class="ferr-result-label">Infusão</div><div class="ferr-result-val">' + r.tempoMin + ' min</div></div>'
        +   '<div class="ferr-result-row"><div class="ferr-result-icon">🌿</div><div class="ferr-result-label">Quantidade</div><div class="ferr-result-val">' + r.qtd + ' ' + r.unidadeLabel + '</div></div>'
        +   '<div class="ferr-result-row"><div class="ferr-result-icon">💧</div><div class="ferr-result-label">Água</div><div class="ferr-result-val">' + _calcState.volumeMl + ' ml</div></div>'
        +   (r.freq ? '<div class="ferr-result-row"><div class="ferr-result-icon">📅</div><div class="ferr-result-label">Frequência</div><div class="ferr-result-val">' + esc(r.freq) + '</div></div>' : '')
        + '</div>'
        + '<div class="ferr-cta-row">'
        +   '<button class="ferr-cta" onclick="ferrTimerFromCalc(' + herb.id + ',' + r.tempoMin + ')">⏱ Iniciar Timer</button>'
        +   '<button class="ferr-cta ferr-cta-secondary" onclick="goPage(\'ferramenta\',null,\'cafeina\');setTimeout(()=>ferrCafLog(' + herb.id + ',' + _calcState.volumeMl + '),100)">＋ Logar cafeína</button>'
        + '</div>';
    } else {
      resultHtml = '<div class="ferr-empty">Selecione uma erva acima para ver os parâmetros recomendados</div>';
    }

    p.innerHTML = ''
      + '<div class="sec-title">Calculadora de Infusão</div>'
      + '<div class="sec-sub">Temperatura, tempo e dose ajustados ao seu volume e força preferidos</div>'
      + '<div class="ferr-card">'
      +   '<label class="ferr-label">Erva</label>'
      +   '<select class="ferr-select" onchange="ferrCalcSet(\'herbId\',+this.value)"><option value="">— escolha uma erva —</option>' + opts + '</select>'
      +   '<div class="ferr-grid">'
      +     '<div><label class="ferr-label">Volume</label>'
      +       '<select class="ferr-select" onchange="ferrCalcSet(\'volumeMl\',+this.value)">'
      +         [150, 200, 250, 300, 400, 500, 750, 1000].map(function (v) {
                  return '<option value="' + v + '"' + (_calcState.volumeMl === v ? ' selected' : '') + '>' + v + ' ml</option>';
                }).join('')
      +       '</select></div>'
      +     '<div><label class="ferr-label">Força</label>'
      +       '<div class="ferr-radio-row">'
      +         ['leve', 'medio', 'forte'].map(function (f) {
                  return '<button class="ferr-radio' + (_calcState.forca === f ? ' on' : '') + '" onclick="ferrCalcSet(\'forca\',\'' + f + '\')">' + f.charAt(0).toUpperCase() + f.slice(1) + '</button>';
                }).join('')
      +       '</div></div>'
      +   '</div>'
      + '</div>'
      + resultHtml;
  }

  window.ferrCalcSet = function (key, val) {
    _calcState[key] = val;
    renderCalculadora();
  };

  window.ferrTimerFromCalc = function (herbId, tempoMin) {
    _timerState.modo = 'ocidental';
    _timerState.steps = [tempoMin * 60];
    _timerState.herbId = herbId;
    goPage('ferramenta', null, 'timer');
  };

  // ════════════════════════════════════════════════════════════════
  // 1.2 — TIMER MULTI-STEP
  // ════════════════════════════════════════════════════════════════
  var _timerState = {
    modo: 'ocidental',
    steps: [180],
    currentStep: 0,
    remaining: 180,
    running: false,
    intervalId: null,
    audioCtx: null,
    herbId: null
  };

  var TIMER_PRESETS = {
    ocidental: { steps: [180], label: 'Ocidental · 1 infusão de 3 min' },
    gongfu: { steps: [10, 15, 20, 30, 45, 60], label: 'Gongfu · 6 infusões curtas crescentes' },
    chimarrao: { steps: [], label: 'Chimarrão · sem timer fixo, marca rodadas' },
    personalizado: { steps: [60], label: 'Personalizado' }
  };

  function fmtTime(s) {
    if (s < 0) s = 0;
    var m = Math.floor(s / 60), sec = s % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function playBell() {
    try {
      if (!_timerState.audioCtx) _timerState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var ctx = _timerState.audioCtx;
      if (ctx.state === 'suspended') ctx.resume();
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 1.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.3);
    } catch (e) { /* sem áudio = ok */ }
  }
  function vibrate(p) { if (navigator.vibrate) navigator.vibrate(p); }

  function updateTimerDisplay() {
    var disp = document.getElementById('timerDisplay');
    var status = document.getElementById('timerStatus');
    if (!disp) return;
    disp.textContent = fmtTime(_timerState.remaining);
    if (status) {
      var s = _timerState;
      var label = s.steps.length > 1 ? 'Infusão ' + (s.currentStep + 1) + ' de ' + s.steps.length : 'Infusão única';
      status.textContent = s.running ? label : (s.currentStep >= s.steps.length ? 'Concluído' : label + ' — pausado');
    }
    if (_timerState.running) document.title = '(' + fmtTime(_timerState.remaining) + ') Ervatório';
  }

  function tickTimer() {
    _timerState.remaining--;
    updateTimerDisplay();
    if (_timerState.remaining <= 0) {
      clearInterval(_timerState.intervalId);
      playBell(); vibrate([200, 100, 200]);
      _timerState.currentStep++;
      if (_timerState.currentStep >= _timerState.steps.length) {
        _timerState.running = false;
        toast('Infusão concluída ✓');
        document.title = 'Ervatório';
        renderTimer();
        return;
      }
      _timerState.remaining = _timerState.steps[_timerState.currentStep];
      _timerState.intervalId = setInterval(tickTimer, 1000);
      updateTimerDisplay();
    }
  }

  window.ferrTimerSetMode = function (modo) {
    _timerState.modo = modo;
    if (modo !== 'personalizado' && TIMER_PRESETS[modo]) {
      _timerState.steps = TIMER_PRESETS[modo].steps.slice();
    }
    if (modo === 'personalizado' && (!_timerState.steps.length || _timerState.steps.length === 6)) {
      _timerState.steps = [60];
    }
    _timerState.currentStep = 0;
    _timerState.remaining = _timerState.steps[0] || 0;
    if (_timerState.intervalId) { clearInterval(_timerState.intervalId); _timerState.running = false; }
    renderTimer();
  };

  window.ferrTimerStart = function () {
    if (_timerState.running) return;
    if (!_timerState.steps.length) { toast('Adicione pelo menos uma infusão'); return; }
    if (!_timerState.audioCtx) _timerState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_timerState.audioCtx.state === 'suspended') _timerState.audioCtx.resume();
    if (_timerState.currentStep >= _timerState.steps.length) {
      _timerState.currentStep = 0;
      _timerState.remaining = _timerState.steps[0];
    }
    _timerState.running = true;
    _timerState.intervalId = setInterval(tickTimer, 1000);
    updateTimerDisplay();
    renderTimer();
  };

  window.ferrTimerPause = function () {
    if (_timerState.intervalId) clearInterval(_timerState.intervalId);
    _timerState.running = false;
    document.title = 'Ervatório';
    renderTimer();
  };

  window.ferrTimerReset = function () {
    if (_timerState.intervalId) clearInterval(_timerState.intervalId);
    _timerState.running = false;
    _timerState.currentStep = 0;
    _timerState.remaining = _timerState.steps[0] || 0;
    document.title = 'Ervatório';
    renderTimer();
  };

  window.ferrTimerEditStep = function (i, delta) {
    var v = (_timerState.steps[i] || 0) + delta;
    if (v < 5) v = 5;
    _timerState.steps[i] = v;
    if (i === _timerState.currentStep && !_timerState.running) _timerState.remaining = v;
    renderTimer();
  };

  window.ferrTimerAddStep = function () {
    var last = _timerState.steps[_timerState.steps.length - 1] || 30;
    _timerState.steps.push(last + 15);
    renderTimer();
  };

  window.ferrTimerRemoveStep = function (i) {
    _timerState.steps.splice(i, 1);
    if (!_timerState.steps.length) _timerState.steps = [60];
    if (_timerState.currentStep >= _timerState.steps.length) _timerState.currentStep = 0;
    _timerState.remaining = _timerState.steps[_timerState.currentStep];
    renderTimer();
  };

  function renderTimer() {
    var p = document.getElementById('page-ferramenta-timer');
    if (!p) return;
    var s = _timerState;
    var herb = s.herbId ? HERBS.find(function (h) { return h.id === s.herbId; }) : null;
    var modos = ['ocidental', 'gongfu', 'personalizado'];
    var modesHtml = modos.map(function (m) {
      return '<button class="ferr-radio' + (s.modo === m ? ' on' : '') + '" onclick="ferrTimerSetMode(\'' + m + '\')">' + m.charAt(0).toUpperCase() + m.slice(1) + '</button>';
    }).join('');

    var stepsHtml = s.steps.map(function (sec, i) {
      var isCurrent = i === s.currentStep && s.running;
      var canEdit = s.modo === 'personalizado';
      return '<div class="ferr-step' + (isCurrent ? ' active' : '') + '">'
        + '<span class="ferr-step-label">#' + (i + 1) + '</span>'
        + (canEdit ? '<button class="ferr-step-btn" onclick="ferrTimerEditStep(' + i + ',-15)">−</button>' : '')
        + '<span class="ferr-step-time">' + fmtTime(sec) + '</span>'
        + (canEdit ? '<button class="ferr-step-btn" onclick="ferrTimerEditStep(' + i + ',15)">+</button>' : '')
        + (canEdit && s.steps.length > 1 ? '<button class="ferr-step-rm" onclick="ferrTimerRemoveStep(' + i + ')">✕</button>' : '')
        + '</div>';
    }).join('');

    p.innerHTML = ''
      + '<div class="sec-title">Timer de Infusão</div>'
      + '<div class="sec-sub">' + (herb ? 'Para ' + esc(herb.n) + ' — ' : '') + (TIMER_PRESETS[s.modo] ? TIMER_PRESETS[s.modo].label : '') + '</div>'
      + '<div class="ferr-card">'
      +   '<label class="ferr-label">Modo</label>'
      +   '<div class="ferr-radio-row">' + modesHtml + '</div>'
      + '</div>'
      + '<div class="ferr-card">'
      +   '<label class="ferr-label">Infusões</label>'
      +   '<div class="ferr-steps-list">' + stepsHtml + '</div>'
      +   (s.modo === 'personalizado' ? '<button class="ferr-add-btn" onclick="ferrTimerAddStep()">＋ adicionar infusão</button>' : '')
      + '</div>'
      + '<div class="ferr-clock">'
      +   '<div class="ferr-clock-face">'
      +     '<div id="timerDisplay" class="ferr-clock-time">' + fmtTime(s.remaining) + '</div>'
      +     '<div id="timerStatus" class="ferr-clock-status">' + (s.steps.length > 1 ? 'Infusão ' + (s.currentStep + 1) + ' de ' + s.steps.length : 'Pronto') + '</div>'
      +   '</div>'
      +   '<div class="ferr-clock-controls">'
      +     (s.running
              ? '<button class="ferr-clock-btn" onclick="ferrTimerPause()">⏸</button>'
              : '<button class="ferr-clock-btn primary" onclick="ferrTimerStart()">▶</button>')
      +     '<button class="ferr-clock-btn" onclick="ferrTimerReset()">↻</button>'
      +   '</div>'
      + '</div>';
  }

  // ════════════════════════════════════════════════════════════════
  // 1.3 — CALCULADORA DE CAFEÍNA
  // ════════════════════════════════════════════════════════════════
  // Mapa simples de mg/250ml por id (heurística — caffeine-bearing herbs)
  var CAFEINA_MG_250ML = {
    6: 35,    // Chá Verde
    27: 45,   // Guaraná (chá leve)
    // Mate (não está no HERBS mas vamos tratar via nome)
    // Outras: caffeine-free
  };
  function cafeinaPorHerb(herb, volumeMl) {
    var base = 0;
    if (CAFEINA_MG_250ML[herb.id] != null) base = CAFEINA_MG_250ML[herb.id];
    else if (/mate/i.test(herb.n)) base = 80;
    else if (/preto|matcha|oolong|pu-?erh/i.test(herb.n)) base = 50;
    return Math.round(base * (volumeMl / 250));
  }

  function loadCafLog() {
    var today = new Date().toISOString().slice(0, 10);
    try { return JSON.parse(localStorage.getItem('erb_caf_' + today) || '[]'); }
    catch (e) { return []; }
  }
  function saveCafLog(arr) {
    var today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('erb_caf_' + today, JSON.stringify(arr));
  }
  function load7days() {
    var arr = [];
    var today = new Date();
    for (var i = 6; i >= 0; i--) {
      var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      var key = d.toISOString().slice(0, 10);
      var dayLog = JSON.parse(localStorage.getItem('erb_caf_' + key) || '[]');
      var total = dayLog.reduce(function (s, e) { return s + (e.mg || 0); }, 0);
      arr.push({ date: key, label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3), total: total });
    }
    return arr;
  }

  window.ferrCafLog = function (herbId, volumeMl) {
    var herb = HERBS.find(function (h) { return h.id === herbId; });
    if (!herb) return;
    volumeMl = volumeMl || 250;
    var mg = cafeinaPorHerb(herb, volumeMl);
    var log = loadCafLog();
    log.push({
      time: new Date().toISOString(),
      herbId: herb.id,
      herbName: herb.n,
      volumeMl: volumeMl,
      mg: mg
    });
    saveCafLog(log);
    toast(mg > 0 ? '+' + mg + 'mg de cafeína registrados' : herb.n + ' registrado (sem cafeína)');
    renderCafeina();
  };

  window.ferrCafRemove = function (idx) {
    var log = loadCafLog();
    log.splice(idx, 1);
    saveCafLog(log);
    renderCafeina();
  };

  function renderCafeina() {
    var p = document.getElementById('page-ferramenta-cafeina');
    if (!p) return;
    var log = loadCafLog();
    var total = log.reduce(function (s, e) { return s + (e.mg || 0); }, 0);
    var limite = 400;
    var pct = Math.min(100, (total / limite) * 100);
    var corClasse = 'ok';
    var aviso = '';
    if (pct >= 100) { corClasse = 'over'; aviso = 'Limite excedido em ' + (total - limite) + 'mg. Que tal uma camomila?'; }
    else if (pct >= 75) { corClasse = 'high'; aviso = 'Limite quase atingido — considere uma erva sem cafeína'; }
    else if (pct >= 60) { corClasse = 'mid'; aviso = 'Você está se aproximando do seu limite'; }

    var herbList = HERBS.slice().sort(function (a, b) { return a.n.localeCompare(b.n, 'pt-BR'); });
    var herbOpts = herbList.map(function (h) { return '<option value="' + h.id + '">' + esc(h.n) + '</option>'; }).join('');

    var listHtml = log.length
      ? log.map(function (e, i) {
          var t = new Date(e.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          return '<div class="caf-row">'
            + '<span class="caf-time">' + t + '</span>'
            + '<span class="caf-name">' + esc(e.herbName) + '</span>'
            + '<span class="caf-vol">' + e.volumeMl + 'ml</span>'
            + '<span class="caf-mg">' + (e.mg > 0 ? '~' + e.mg + 'mg' : '0mg') + '</span>'
            + '<button class="caf-rm" onclick="ferrCafRemove(' + i + ')">✕</button>'
            + '</div>';
        }).join('')
      : '<div class="ferr-empty">Nenhuma xícara registrada hoje</div>';

    var hist = load7days();
    var maxHist = Math.max.apply(null, hist.map(function (d) { return d.total; }).concat([100]));
    var histHtml = hist.map(function (d) {
      var h = (d.total / maxHist) * 100;
      return '<div class="caf-bar-col"><div class="caf-bar" style="height:' + h + '%"></div><div class="caf-bar-label">' + d.label + '</div><div class="caf-bar-val">' + d.total + '</div></div>';
    }).join('');

    p.innerHTML = ''
      + '<div class="sec-title">Cafeína Hoje</div>'
      + '<div class="sec-sub">Limite recomendado: 400mg/dia</div>'
      + '<div class="caf-meter ' + corClasse + '">'
      +   '<div class="caf-meter-bar"><div class="caf-meter-fill" style="width:' + pct + '%"></div></div>'
      +   '<div class="caf-meter-val">' + total + ' mg <span>· ' + Math.round(pct) + '%</span></div>'
      +   (aviso ? '<div class="caf-aviso">' + aviso + '</div>' : '')
      + '</div>'
      + '<div class="ferr-card">'
      +   '<label class="ferr-label">Adicionar xícara</label>'
      +   '<div class="ferr-grid">'
      +     '<select class="ferr-select" id="cafSelectHerb"><option value="">— erva —</option>' + herbOpts + '</select>'
      +     '<select class="ferr-select" id="cafSelectVol">'
      +       [150, 200, 250, 300, 400, 500].map(function (v) { return '<option value="' + v + '"' + (v === 250 ? ' selected' : '') + '>' + v + ' ml</option>'; }).join('')
      +     '</select>'
      +   '</div>'
      +   '<button class="ferr-add-btn" onclick="ferrCafAddFromForm()">＋ Registrar</button>'
      + '</div>'
      + '<div class="ferr-card"><label class="ferr-label">Hoje</label><div class="caf-list">' + listHtml + '</div></div>'
      + '<div class="ferr-card"><label class="ferr-label">Últimos 7 dias</label><div class="caf-hist">' + histHtml + '</div></div>';
  }

  window.ferrCafAddFromForm = function () {
    var hid = +document.getElementById('cafSelectHerb').value;
    var vol = +document.getElementById('cafSelectVol').value;
    if (!hid) { toast('Selecione uma erva'); return; }
    ferrCafLog(hid, vol);
  };

  // ════════════════════════════════════════════════════════════════
  // 1.4 — FAMÍLIAS DE CHÁ
  // ════════════════════════════════════════════════════════════════
  var FAMILIAS = [
    { slug: 'cha-preto', nome: 'Chá Preto', estrangeiro: '紅茶 Hóngchá', icon: '🍂', cafeina: '60–90 mg', temp: '95–100°C', tempo: '3–5 min', desc: 'Robusto, maltado, taninoso — totalmente oxidado.', match: function (h) { return /preto|assam|darjeeling/i.test(h.n) || /preto/i.test(h.cat || ''); } },
    { slug: 'cha-verde', nome: 'Chá Verde', estrangeiro: '綠茶 Lǜchá', icon: '🍵', cafeina: '25–50 mg', temp: '70–80°C', tempo: '2–3 min', desc: 'Vegetal, fresco, herbáceo — oxidação interrompida.', match: function (h) { return /verde|matcha|sencha|gyokuro/i.test(h.n); } },
    { slug: 'cha-branco', nome: 'Chá Branco', estrangeiro: '白茶 Báichá', icon: '🌸', cafeina: '15–35 mg', temp: '75–85°C', tempo: '3–5 min', desc: 'Delicado, doce, floral — minimamente processado.', match: function (h) { return /branco|silver|bai hao/i.test(h.n); } },
    { slug: 'oolong', nome: 'Oolong', estrangeiro: '烏龍 Wūlóng', icon: '🍃', cafeina: '30–60 mg', temp: '85–95°C', tempo: '3–4 min', desc: 'Espectro entre verde e preto — oxidação parcial.', match: function (h) { return /oolong|tieguanyin|da hong pao/i.test(h.n); } },
    { slug: 'puerh', nome: 'Pu-erh', estrangeiro: '普洱 Pǔ\'ěr', icon: '🪵', cafeina: '40–80 mg', temp: '95–100°C', tempo: '4–6 min', desc: 'Terroso, profundo, fermentado — envelhece como vinho.', match: function (h) { return /pu.?erh/i.test(h.n); } },
    { slug: 'mate', nome: 'Mate', estrangeiro: 'Erva-Mate', icon: '🧉', cafeina: '80–100 mg', temp: '70–85°C', tempo: '3 min', desc: 'A energia sul-americana — folha de Ilex paraguariensis.', match: function (h) { return /mate|tereré/i.test(h.n); } },
    { slug: 'rooibos', nome: 'Rooibos', estrangeiro: 'Bush Tea (África do Sul)', icon: '🌾', cafeina: '0 mg', temp: '95–100°C', tempo: '5–7 min', desc: 'Adocicado, naturalmente sem cafeína, antioxidante.', match: function (h) { return /rooibos/i.test(h.n); } },
    { slug: 'herbais', nome: 'Herbais & Tisanas', estrangeiro: 'Tisanes', icon: '🌿', cafeina: '0 mg', temp: '85–95°C', tempo: '5–10 min', desc: 'Folhas, flores, raízes que não vêm da Camellia sinensis.', match: function (h) { return !(h.id === 6 || h.id === 27) && !/preto|verde|branco|oolong|matcha|pu.?erh|rooibos|mate/i.test(h.n); } },
    { slug: 'estimulantes', nome: 'Estimulantes Brasileiros', estrangeiro: 'Brazilian Stimulants', icon: '⚡', cafeina: 'varia', temp: '85–95°C', tempo: '5 min', desc: 'Guaraná e companhia — energia tropical.', match: function (h) { return /guaraná|açaí/i.test(h.n); } }
  ];

  function ervasDaFamilia(fam) {
    return HERBS.filter(fam.match);
  }

  function renderFamilias() {
    var p = document.getElementById('page-familias');
    if (!p) return;
    var cardsHtml = FAMILIAS.map(function (f) {
      var n = ervasDaFamilia(f).length;
      return '<div class="fam-card" onclick="goPage(\'familia\',null,\'' + f.slug + '\')">'
        + '<div class="fam-card-icon">' + f.icon + '</div>'
        + '<div class="fam-card-foreign">' + esc(f.estrangeiro) + '</div>'
        + '<div class="fam-card-nome">' + esc(f.nome) + '</div>'
        + '<div class="fam-card-meta"><span>☕ ' + esc(f.cafeina) + '</span><span>🌡 ' + esc(f.temp) + '</span><span>⏱ ' + esc(f.tempo) + '</span></div>'
        + '<div class="fam-card-desc">' + esc(f.desc) + '</div>'
        + (n > 0 ? '<div class="fam-card-count">' + n + ' erva' + (n > 1 ? 's' : '') + ' no catálogo →</div>' : '<div class="fam-card-count fam-card-empty">em curadoria</div>')
        + '</div>';
    }).join('');
    p.innerHTML = ''
      + '<div class="sec-title">Famílias de Chá</div>'
      + '<div class="sec-sub">Da Camellia sinensis às tisanas brasileiras — nove caminhos do chá</div>'
      + '<div class="fam-grid">' + cardsHtml + '</div>';
  }

  function renderFamilia(slug) {
    var p = document.getElementById('page-familia');
    if (!p) return;
    var fam = FAMILIAS.find(function (f) { return f.slug === slug; });
    if (!fam) { p.innerHTML = '<div class="ferr-empty">Família não encontrada</div>'; return; }
    var ervas = ervasDaFamilia(fam);
    var ervasHtml = ervas.length
      ? ervas.map(function (h) {
          return '<div class="fam-erva-card" onclick="openHerbModal(' + h.id + ')">'
            + (h.img ? '<img class="fam-erva-img" src="' + h.img + '" alt="' + esc(h.n) + '" loading="lazy" onerror="this.outerHTML=\'<span class=&quot;fam-erva-icon&quot;>' + h.icon + '</span>\'">' : '<span class="fam-erva-icon">' + h.icon + '</span>')
            + '<div class="fam-erva-info"><div class="fam-erva-name">' + esc(h.n) + '</div><div class="fam-erva-lat">' + esc(h.lat) + '</div><div class="fam-erva-ef">' + esc((h.ef || '').split(',')[0]) + '</div></div>'
            + '</div>';
        }).join('')
      : '<div class="ferr-empty">Em breve — adicionando ervas dessa família ao catálogo.</div>';

    p.innerHTML = ''
      + '<button class="fam-back" onclick="goPage(\'familias\')">← Famílias</button>'
      + '<div class="fam-hero">'
      +   '<div class="fam-hero-icon">' + fam.icon + '</div>'
      +   '<div class="fam-hero-foreign">' + esc(fam.estrangeiro) + '</div>'
      +   '<h1 class="fam-hero-nome">' + esc(fam.nome) + '</h1>'
      +   '<p class="fam-hero-desc">' + esc(fam.desc) + '</p>'
      +   '<div class="fam-hero-tech"><span>☕ ' + esc(fam.cafeina) + '</span><span>🌡 ' + esc(fam.temp) + '</span><span>⏱ ' + esc(fam.tempo) + '</span></div>'
      + '</div>'
      + '<div class="sec-title" style="font-size:1.1rem;margin-top:2rem">Ervas no catálogo</div>'
      + '<div class="fam-erva-grid">' + ervasHtml + '</div>';
  }

  // ════════════════════════════════════════════════════════════════
  // HUB DE FERRAMENTAS
  // ════════════════════════════════════════════════════════════════
  function renderHub() {
    var p = document.getElementById('page-ferramentas');
    if (!p) return;
    var tt = function (k) { return (typeof t === 'function') ? t(k) : k; };
    var ico = function (n) { return (typeof svgIcon === 'function') ? svgIcon(n, 34) : ''; };
    // Seis cards, todos <a> de verdade (teclado, leitor de tela), sem emoji.
    // Famílias botânicas saíram daqui: moram em Descobrir. As três últimas
    // são páginas estáticas — o link é o caminho real.
    var cards = [
      { href: pageHash('ferramenta', 'infusao'), icon: 'thermometer', nome: tt('ferr.calc'),    desc: tt('ferr.calc_desc') },
      { href: pageHash('ferramenta', 'timer'),   icon: 'tea',         nome: tt('ferr.timer'),   desc: tt('ferr.timer_desc') },
      { href: pageHash('ferramenta', 'cafeina'), icon: 'bulb',        nome: tt('ferr.cafeina'), desc: tt('ferr.cafeina_desc'), nota: tt('ferr.cafeina_local') },
      { href: '/como-se-faz/', icon: 'spoon',    nome: tt('nav.how_made'), desc: tt('ferr.como_desc') },
      { href: '/lexico/',      icon: 'leaf',     nome: tt('nav.lexicon'),  desc: tt('ferr.lexico_desc') },
      { href: '/biblioteca/',  icon: 'calendar', nome: tt('nav.library'),  desc: tt('ferr.biblio_desc') },
    ];
    p.innerHTML = ''
      + '<div class="sec-title">' + esc(tt('page.ferramentas.title')) + '</div>'
      + '<div class="sec-sub">' + esc(tt('ferr.hub_sub')) + '</div>'
      + '<div class="ferr-hub-grid">'
      + cards.map(function (c) {
          return '<a class="ferr-hub-card" href="' + c.href + '">'
            + '<span class="ferr-hub-icon" aria-hidden="true">' + ico(c.icon) + '</span>'
            + '<span class="ferr-hub-name">' + esc(c.nome) + '</span>'
            + '<span class="ferr-hub-desc">' + esc(c.desc) + '</span>'
            + (c.nota ? '<span class="ferr-hub-nota">' + esc(c.nota) + '</span>' : '')
            + '</a>';
        }).join('')
      + '</div>';
  }

  // ════════════════════════════════════════════════════════════════
  // ROUTING ENTRY POINT
  // ════════════════════════════════════════════════════════════════
  window.initFerramentas = function (slug) {
    // mostra a página correta dentro de page-ferramenta-*
    document.querySelectorAll('.ferr-sub-page').forEach(function (el) { el.style.display = 'none'; });
    if (!slug) {
      renderHub();
      return;
    }
    var target = document.getElementById('page-ferramenta-' + slug);
    if (target) target.style.display = 'block';
    if (slug === 'infusao') renderCalculadora();
    if (slug === 'timer') renderTimer();
    if (slug === 'cafeina') renderCafeina();
  };

  window.initFamilias = function () { renderFamilias(); };
  window.initFamilia = function (slug) { renderFamilia(slug); };
})();
