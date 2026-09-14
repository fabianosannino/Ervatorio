// ════════════════════════════════════════════════════════════════
// Caminho do Chazeiro — Gamificação / Badges
// ════════════════════════════════════════════════════════════════

// ─── Níveis de progressão ────────────────────────────────────────
// Niveis em texto, sem emoji (handoff 14/09): a identidade e serifada e
// sobria, e o leitor de tela anuncia "planta em vaso" no lugar do nivel.
// `icon` guarda a inicial em serifa para o circulo do nivel.
const CAMINHO_LEVELS = [
  { id: 'semente',  name: 'Semente',  icon: 'I',   min: 0,  color: '#8c7a5e' },
  { id: 'broto',    name: 'Broto',    icon: 'II',  min: 3,  color: '#5a8c5a' },
  { id: 'raiz',     name: 'Raiz',     icon: 'III', min: 6,  color: '#4a7a4a' },
  { id: 'caule',    name: 'Caule',    icon: 'IV',  min: 10, color: '#3d6b4f' },
  { id: 'folha',    name: 'Folha',    icon: 'V',   min: 15, color: '#2d5a3d' },
  { id: 'flor',     name: 'Flor',     icon: 'VI',  min: 20, color: '#b8965a' },
  { id: 'fruto',    name: 'Mestre Chazeiro', icon: 'VII', min: 25, color: '#c8a04a' },
];

// ─── Definição dos 25 badges ────────────────────────────────────
const BADGES = [
  // ── Primeiros Passos (5) ──────────────────────────────────────
  { id: 'first-search',  cat: 'inicio',       icon: '🔍', name: 'Primeira Busca',       desc: 'Buscou sua primeira erva no catálogo' },
  { id: 'first-blend',   cat: 'inicio',       icon: '🧪', name: 'Primeiro Blend',       desc: 'Criou seu primeiro blend' },
  { id: 'first-fav',     cat: 'inicio',       icon: '❤️',  name: 'Primeira Favorita',   desc: 'Favoritou sua primeira erva' },
  { id: 'first-quiz',    cat: 'inicio',       icon: '🌿', name: 'Primeiro Quiz',        desc: 'Descobriu qual chá você é' },
  { id: 'first-jogo',    cat: 'inicio',       icon: '🎯', name: 'Primeiro Jogo',        desc: 'Jogou o Jogo Botânico pela primeira vez' },

  // ── Conhecimento (5) ─────────────────────────────────────────
  { id: 'herbs-5',       cat: 'conhecimento', icon: '🌱', name: 'Curioso Botânico',     desc: 'Explorou 5 ervas diferentes' },
  { id: 'herbs-15',      cat: 'conhecimento', icon: '🌿', name: 'Herborista',            desc: 'Explorou 15 ervas diferentes' },
  { id: 'herbs-30',      cat: 'conhecimento', icon: '🌳', name: 'Naturalista',           desc: 'Explorou 30 ervas diferentes' },
  { id: 'herbs-42',      cat: 'conhecimento', icon: '📖', name: 'Enciclopedista',        desc: 'Conhece todas as 42 ervas do catálogo' },
  { id: 'chas-all',      cat: 'conhecimento', icon: '🍵', name: 'Especialista em Chás', desc: 'Explorou todos os 6 chás tradicionais' },

  // ── Mundo (4) ────────────────────────────────────────────────
  { id: 'regions-3',     cat: 'mundo',        icon: '🗺️', name: 'Viajante',             desc: 'Visitou 3 regiões do mundo do chá' },
  { id: 'regions-8',     cat: 'mundo',        icon: '✈️',  name: 'Cosmopolita',          desc: 'Visitou 8 regiões do mundo' },
  { id: 'regions-15',    cat: 'mundo',        icon: '🌍', name: 'Cidadão do Chá',       desc: 'Explorou todas as 15 regiões' },
  { id: 'brasil-expert', cat: 'mundo',        icon: '🇧🇷', name: 'Orgulho Brasileiro',   desc: 'Explorou a seção Brasil & Chá' },

  // ── Jogo (4) ─────────────────────────────────────────────────
  { id: 'jogo-3',        cat: 'jogo',         icon: '🎮', name: 'Jogador Frequente',    desc: 'Jogou 3 partidas do Jogo Botânico' },
  { id: 'jogo-aprendiz', cat: 'jogo',         icon: '🌱', name: 'Aprendiz Botânico',    desc: 'Atingiu 45% de acerto no Jogo' },
  { id: 'jogo-experiente',cat: 'jogo',        icon: '🌿', name: 'Herborista Botânico',  desc: 'Atingiu 65% de acerto no Jogo' },
  { id: 'jogo-mestre',   cat: 'jogo',         icon: '🏆', name: 'Mestre Botânico',      desc: 'Atingiu 85% de acerto no Jogo' },

  // ── Blend (4) ────────────────────────────────────────────────
  { id: 'blend-3',       cat: 'blend',        icon: '⚗️',  name: 'Blendista',            desc: 'Criou 3 blends diferentes' },
  { id: 'blend-saved-3', cat: 'blend',        icon: '💾', name: 'Colecionador de Blends',desc: 'Salvou 3 blends na sua conta' },
  { id: 'blend-10',      cat: 'blend',        icon: '🧬', name: 'Alquimista',           desc: 'Criou 10 blends — verdadeiro artesão' },
  { id: 'receita-cook',  cat: 'blend',        icon: '🍯', name: 'Cozinheiro Botânico',  desc: 'Explorou as receitas com ervas' },

  // ── Elite (3) ────────────────────────────────────────────────
  { id: 'badges-10',     cat: 'elite',        icon: '⭐', name: 'Chazeiro',             desc: 'Conquistou 10 selos' },
  { id: 'badges-20',     cat: 'elite',        icon: '🌟', name: 'Mestre Chazeiro',      desc: 'Conquistou 20 selos — impressionante!' },
  { id: 'badges-all',    cat: 'elite',        icon: '👑', name: 'Lenda do Chá',         desc: 'Conquistou todos os 25 selos do Ervatório' },
];

const BADGE_CATS = {
  inicio:       { label: 'Primeiros Passos', icon: '🌰' },
  conhecimento: { label: 'Conhecimento',     icon: '📚' },
  mundo:        { label: 'Mundo do Chá',     icon: '🌍' },
  jogo:         { label: 'Jogo Botânico',    icon: '🎯' },
  blend:        { label: 'Arte do Blend',    icon: '⚗️'  },
  elite:        { label: 'Elite',            icon: '👑' },
};

const PROGRESS_KEY = 'erb_progress';
const BADGES_KEY   = 'erb_badges';

// ─── State ───────────────────────────────────────────────────────
function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; } catch { return {}; }
}
function saveProgress(p) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}
function getEarnedBadges() {
  try { return JSON.parse(localStorage.getItem(BADGES_KEY)) || []; } catch { return []; }
}
function saveEarnedBadges(arr) {
  localStorage.setItem(BADGES_KEY, JSON.stringify(arr));
}

// ─── Level calculator ────────────────────────────────────────────
function getCaminhoLevel(badgeCount) {
  let level = CAMINHO_LEVELS[0];
  for (const l of CAMINHO_LEVELS) { if (badgeCount >= l.min) level = l; }
  return level;
}
function getNextLevel(badgeCount) {
  return CAMINHO_LEVELS.find(l => l.min > badgeCount) || null;
}

// ─── Badge checker ───────────────────────────────────────────────
function checkBadges(p, earned) {
  const newBadges = [];
  const herbsViewed  = (p.herbsViewed  || []).length;
  const chasViewed   = (p.chasViewed   || []).length;
  const regionsVisited = (p.regionsVisited || []).length;
  const blendsCreated = p.blendsCreated || 0;
  const blendsSaved   = p.blendsSaved   || 0;
  const jogoPlayed    = p.jogoPlayed    || 0;
  const jogoPct       = p.jogoBestPct   || 0;

  const check = (id, condition) => {
    if (condition && !earned.includes(id)) newBadges.push(id);
  };

  // Primeiros passos
  check('first-search',  p.firstSearch);
  check('first-blend',   blendsCreated >= 1);
  check('first-fav',     p.firstFav);
  check('first-quiz',    p.quizCompleted);
  check('first-jogo',    jogoPlayed >= 1);

  // Conhecimento
  check('herbs-5',  herbsViewed >= 5);
  check('herbs-15', herbsViewed >= 15);
  check('herbs-30', herbsViewed >= 30);
  check('herbs-42', herbsViewed >= 42);
  check('chas-all', chasViewed >= 6);

  // Mundo
  check('regions-3',     regionsVisited >= 3);
  check('regions-8',     regionsVisited >= 8);
  check('regions-15',    regionsVisited >= 15);
  check('brasil-expert', p.brasilVisited);

  // Jogo
  check('jogo-3',         jogoPlayed >= 3);
  check('jogo-aprendiz',  jogoPct >= 45);
  check('jogo-experiente',jogoPct >= 65);
  check('jogo-mestre',    jogoPct >= 85);

  // Blend
  check('blend-3',       blendsCreated >= 3);
  check('blend-saved-3', blendsSaved   >= 3);
  check('blend-10',      blendsCreated >= 10);
  check('receita-cook',  p.receitasVisited);

  // Elite (based on total earned + newBadges)
  const total = earned.length + newBadges.length;
  check('badges-10', total >= 10);
  check('badges-20', total >= 20);
  check('badges-all', total + (total >= 22 ? 1 : 0) >= 25);

  return newBadges;
}

// ─── Award badge ─────────────────────────────────────────────────
function awardBadge(badgeId) {
  const earned = getEarnedBadges();
  if (earned.includes(badgeId)) return;
  earned.push(badgeId);
  saveEarnedBadges(earned);

  const badge = BADGES.find(b => b.id === badgeId);
  if (badge) showBadgeToast(badge);

  // Sync to Supabase if logged in
  syncBadgeToSupabase(badgeId);

  // Re-check elite badges after earning a new one
  const p = getProgress();
  const moreNew = checkBadges(p, earned);
  moreNew.forEach(id => { if (id !== badgeId) awardBadge(id); });
}

// ─── Toast notification ──────────────────────────────────────────
function showBadgeToast(badge) {
  // Remove existing badge toasts
  document.querySelectorAll('.badge-toast').forEach(el => el.remove());

  const el = document.createElement('div');
  el.className = 'badge-toast';
  el.innerHTML = `
    <div class="badge-toast-icon">${badge.icon}</div>
    <div class="badge-toast-text">
      <div class="badge-toast-title">Novo Selo Conquistado!</div>
      <div class="badge-toast-name">${badge.name}</div>
    </div>
  `;
  document.body.appendChild(el);

  requestAnimationFrame(() => { el.classList.add('show'); });
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  }, 3500);
}

// ─── Main tracker ────────────────────────────────────────────────
function trackAction(action, data) {
  const p = getProgress();
  const earned = getEarnedBadges();

  switch (action) {
    case 'view-herb': {
      const viewed = p.herbsViewed || [];
      if (!viewed.includes(data)) {
        p.herbsViewed = [...viewed, data];
        p.firstSearch = true;
      }
      break;
    }
    case 'first-search': {
      if (!p.firstSearch) p.firstSearch = true;
      break;
    }
    case 'fav-herb': {
      p.firstFav = true;
      break;
    }
    case 'create-blend': {
      p.blendsCreated = (p.blendsCreated || 0) + 1;
      break;
    }
    case 'save-blend': {
      p.blendsSaved = (p.blendsSaved || 0) + 1;
      break;
    }
    case 'quiz-complete': {
      p.quizCompleted = true;
      break;
    }
    case 'jogo-complete': {
      p.jogoPlayed = (p.jogoPlayed || 0) + 1;
      if (data && data.pct !== undefined) {
        p.jogoBestPct = Math.max(p.jogoBestPct || 0, data.pct);
      }
      break;
    }
    case 'view-cha': {
      const chas = p.chasViewed || [];
      if (!chas.includes(data)) p.chasViewed = [...chas, data];
      break;
    }
    case 'visit-region': {
      const regions = p.regionsVisited || [];
      if (!regions.includes(data)) p.regionsVisited = [...regions, data];
      break;
    }
    case 'visit-brasil': {
      p.brasilVisited = true;
      break;
    }
    case 'visit-receitas': {
      p.receitasVisited = true;
      break;
    }
  }

  saveProgress(p);
  const newBadges = checkBadges(p, earned);
  newBadges.forEach(id => awardBadge(id));
}

// ─── Supabase sync ───────────────────────────────────────────────
async function syncBadgeToSupabase(badgeId) {
  try {
    if (typeof ervaria === 'undefined') return;
    const session = await ervaria.getSession?.();
    if (!session?.user) return;
    const { supabase } = ervaria;
    if (!supabase) return;
    await supabase.from('user_badges').upsert(
      { user_id: session.user.id, badge_id: badgeId },
      { onConflict: 'user_id,badge_id', ignoreDuplicates: true }
    );
  } catch (e) { /* silently fail */ }
}

async function loadBadgesFromSupabase() {
  try {
    if (typeof ervaria === 'undefined') return;
    const session = await ervaria.getSession?.();
    if (!session?.user) return;
    const { supabase } = ervaria;
    if (!supabase) return;
    const { data } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', session.user.id);
    if (!data) return;
    const remoteIds = data.map(r => r.badge_id);
    const local = getEarnedBadges();
    const merged = [...new Set([...local, ...remoteIds])];
    saveEarnedBadges(merged);
  } catch (e) { /* silently fail */ }
}

// ─── Page rendering ──────────────────────────────────────────────
function initCaminho() {
  loadBadgesFromSupabase().then(() => renderCaminho());
}

function renderCaminho() {
  const el = document.getElementById('caminhoContainer');
  if (!el) return;

  const earned    = getEarnedBadges();
  const p         = getProgress();
  const total     = BADGES.length;
  const count     = earned.length;
  const level     = getCaminhoLevel(count);
  const nextLevel = getNextLevel(count);
  const pct       = Math.round((count / total) * 100);

  // Progress to next level
  const nextMin  = nextLevel ? nextLevel.min : total;
  const prevMin  = level.min;
  const levelPct = nextLevel
    ? Math.round(((count - prevMin) / (nextMin - prevMin)) * 100)
    : 100;

  el.innerHTML = `
    <div class="caminho-hero">
      <div class="caminho-level-icon">${level.icon}</div>
      <div class="caminho-level-name">${level.name}</div>
      <div class="caminho-level-desc">${count} de ${total} selos conquistados</div>

      <div class="caminho-progress-wrap">
        <div class="caminho-progress-bar">
          <div class="caminho-progress-fill" style="width:${pct}%;background:${level.color}"></div>
        </div>
        <div class="caminho-progress-labels">
          <span>${level.name}</span>
          ${nextLevel ? `<span>${nextLevel.name} (${nextMin - count} selos)</span>` : '<span>Coleção completa</span>'}
        </div>
      </div>

      <div class="caminho-stats-row">
        <div class="caminho-stat">
          <div class="caminho-stat-val">${(p.herbsViewed||[]).length}</div>
          <div class="caminho-stat-lbl">ervas exploradas</div>
        </div>
        <div class="caminho-stat">
          <div class="caminho-stat-val">${p.blendsCreated||0}</div>
          <div class="caminho-stat-lbl">blends criados</div>
        </div>
        <div class="caminho-stat">
          <div class="caminho-stat-val">${(p.regionsVisited||[]).length}</div>
          <div class="caminho-stat-lbl">regiões visitadas</div>
        </div>
        <div class="caminho-stat">
          <div class="caminho-stat-val">${p.jogoPlayed||0}</div>
          <div class="caminho-stat-lbl">partidas jogadas</div>
        </div>
      </div>
    </div>

    ${Object.entries(BADGE_CATS).map(([catId, cat]) => {
      const catBadges = BADGES.filter(b => b.cat === catId);
      return `
        <div class="caminho-cat-section">
          <div class="caminho-cat-header">
            <span class="caminho-cat-icon">${cat.icon}</span>
            <span class="caminho-cat-label">${cat.label}</span>
            <span class="caminho-cat-count">${catBadges.filter(b => earned.includes(b.id)).length}/${catBadges.length}</span>
          </div>
          <div class="badges-grid">
            ${catBadges.map(b => {
              const isEarned = earned.includes(b.id);
              return `
                <div class="badge-card${isEarned ? ' earned' : ' locked'}" title="${b.desc}">
                  <div class="badge-icon">${isEarned ? b.icon : '🔒'}</div>
                  <div class="badge-name">${b.name}</div>
                  <div class="badge-desc">${isEarned ? b.desc : '???'}</div>
                  ${isEarned ? '<div class="badge-earned-tag">Conquistado</div>' : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('')}
  `;
}
