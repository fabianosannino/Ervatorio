// ============================================================
// ADMIN PANEL — Ervatório
// ============================================================
// Requer /js/config.js carregado antes deste script.
const ADM_SUPABASE_URL = window.ERVATORIO_CONFIG.SUPABASE_URL;
const ADM_SUPABASE_KEY = window.ERVATORIO_CONFIG.SUPABASE_PUBLISHABLE_KEY;
const ADM_FUNCTIONS_URL = window.ERVATORIO_CONFIG.FUNCTIONS_URL;

let sb = null;
let admUser = null;
let currentSection = 'dashboard';

// ── INIT ──
// ============================================================
// RBAC por capacidade (migration 20260815220000)
// ============================================================
// O que manda é o RLS: `tem_capacidade()` no banco recusa a escrita mesmo que
// esta tela ofereça o botão. O que segue é UX — esconder o que não adianta
// clicar. Mostrar um botão que sempre falha é pior do que não mostrá-lo,
// porque transforma uma regra clara num erro sem explicação.
//
// Se divergirem, o banco vence. Esta lista existe para concordar com ele, não
// para decidir.
let admCapacidades = [];

const ADM_CAPACIDADE_DA_SECAO = {
  dashboard:  null,                      // sem capacidade própria: só resumo
  users:      'usuarios:ler',
  herbs:      'catalogo:escrever',
  products:   'catalogo:escrever',
  suppliers:  'catalogo:escrever',
  news:       'catalogo:escrever',
  fichas:     'catalogo:escrever',
  chazerias:  'catalogo:escrever',
  orders:     'pedidos:ler',
  returns:    'devolucoes:escrever',
  audit:      'auditoria:ler',
};

function admPode(capacidade){
  if(!capacidade)return true;
  return admCapacidades.includes(capacidade);
}

/** Esconde do menu o que esta pessoa não pode abrir. */
function admAplicarCapacidades(){
  for(const [secao,capacidade] of Object.entries(ADM_CAPACIDADE_DA_SECAO)){
    const item=document.querySelector(`[data-sec="${secao}"]`);
    if(item)item.style.display=admPode(capacidade)?'':'none';
  }
  // Apagar usuário é destrutivo e tem capacidade própria — a tela de usuários
  // abre com `usuarios:ler`, e o botão de apagar exige mais do que isso.
  document.body.classList.toggle('pode-excluir-usuario',admPode('usuarios:excluir'));
}

/**
 * A primeira seção que esta pessoa pode ver.
 *
 * Sem isto, o painel abriria sempre no dashboard — que hoje é a única seção
 * sem capacidade própria, mas deixaria de existir como aposta segura no dia em
 * que ganhar uma. Perguntar é mais barato do que lembrar.
 */
function admPrimeiraSecaoVisivel(){
  for(const [secao,capacidade] of Object.entries(ADM_CAPACIDADE_DA_SECAO)){
    if(admPode(capacidade))return secao;
  }
  return 'dashboard';
}

async function admInit(){
  sb = window.supabase.createClient(ADM_SUPABASE_URL, ADM_SUPABASE_KEY);
  const {data:{session}} = await sb.auth.getSession();
  if(!session?.user){
    document.getElementById('admLogin').style.display='flex';
    document.getElementById('admShell').style.display='none';
    return;
  }
  admUser = session.user;
  const {data:profile} = await sb.from('user_profiles').select('is_admin,display_name,admin_capabilities').eq('id',admUser.id).maybeSingle();
  admCapacidades = profile?.admin_capabilities || [];
  if(!profile?.is_admin){
    document.getElementById('admLogin').style.display='flex';
    document.getElementById('admShell').style.display='none';
    document.getElementById('loginMsg').textContent='Acesso negado. Você não é administrador.';
    document.getElementById('loginMsg').style.color='#e08080';
    return;
  }
  // MFA (Onda 1.6): admin só entra no shell com aal2 (TOTP).
  if(!(await admRequireMfa()))return;
  document.getElementById('admLogin').style.display='none';
  document.getElementById('admShell').style.display='flex';
  document.getElementById('admUserName').textContent=profile.display_name||admUser.email;
  admAplicarCapacidades();
  showSection(admPrimeiraSecaoVisivel());
}

// ── MFA (TOTP) — exige segundo fator para o painel ──
// Flag de rollback: ADMIN_MFA_REQUIRED=false em js/config.js.
async function admRequireMfa(){
  if(window.ERVATORIO_CONFIG.ADMIN_MFA_REQUIRED===false)return true;
  try{
    const {data:aal,error:aalErr}=await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if(aalErr)throw aalErr;
    if(aal?.currentLevel==='aal2')return true;
    const {data:factors,error:fErr}=await sb.auth.mfa.listFactors();
    if(fErr)throw fErr;
    const verified=(factors?.totp||[]).find(f=>f.status==='verified');
    if(verified){admMfaChallengeUI(verified.id);}else{await admMfaEnrollUI(factors?.totp||[]);}
    return false;
  }catch(e){
    // MFA indisponível no projeto (ex.: TOTP desligado no Auth):
    // não trancar o painel por erro de config — logar e seguir.
    console.warn('[admin-mfa] indisponível, prosseguindo sem MFA:',e.message||e);
    return true;
  }
}

function admMfaOverlay(innerHtml){
  let ov=document.getElementById('admMfa');
  if(!ov){
    ov=document.createElement('div');
    ov.id='admMfa';
    ov.setAttribute('role','dialog');
    ov.setAttribute('aria-modal','true');
    ov.setAttribute('aria-label','Verificação em duas etapas');
    ov.style.cssText='position:fixed;inset:0;z-index:999;display:flex;align-items:center;justify-content:center;background:rgba(10,16,13,.92);padding:20px';
    document.body.appendChild(ov);
  }
  ov.innerHTML=innerHtml;
  document.getElementById('admLogin').style.display='none';
  document.getElementById('admShell').style.display='none';
  ov.style.display='flex';
  const code=document.getElementById('mfaCode');
  if(code)code.focus();
}

async function admMfaEnrollUI(existingFactors){
  // Remove tentativas de enrollment anteriores não verificadas.
  for(const f of existingFactors.filter(f=>f.status!=='verified')){
    try{await sb.auth.mfa.unenroll({factorId:f.id});}catch(_){/* ok */}
  }
  const {data,error}=await sb.auth.mfa.enroll({factorType:'totp',friendlyName:'Ervatório Admin'});
  if(error){admMfaOverlay(`<div style="max-width:420px;text-align:center;color:#e08080">Erro ao iniciar MFA: ${esc(error.message)}<br><button class="adm-btn" style="margin-top:14px" onclick="admLogout()">Sair</button></div>`);return;}
  window.__admMfaFactorId=data.id;
  admMfaOverlay(`
    <div style="max-width:420px;background:var(--adm-panel,#131a16);border:1px solid var(--adm-line,#26302a);border-radius:14px;padding:26px;text-align:center">
      <h2 style="margin:0 0 6px;font-size:1.15rem">Ativar verificação em duas etapas</h2>
      <p style="font-size:.82rem;opacity:.8;margin:0 0 14px">O painel admin agora exige um segundo fator. Escaneie o QR no seu app autenticador (1Password, Google Authenticator, Authy…) e digite o código de 6 dígitos.</p>
      <div style="background:#fff;border-radius:10px;padding:10px;display:inline-block;margin-bottom:10px">${data.totp.qr_code}</div>
      <p style="font-size:.7rem;opacity:.6;word-break:break-all;margin:0 0 14px">Chave manual: ${esc(data.totp.secret)}</p>
      <input id="mfaCode" class="adm-form-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" style="text-align:center;letter-spacing:6px;font-size:1.2rem" onkeydown="if(event.key==='Enter')admMfaVerify()">
      <button class="adm-btn primary" style="width:100%;justify-content:center;margin-top:12px" onclick="admMfaVerify()">Confirmar</button>
      <div id="mfaMsg" style="min-height:20px;font-size:.78rem;margin-top:10px"></div>
      <button class="adm-btn" style="margin-top:6px" onclick="admLogout()">Sair</button>
    </div>`);
}

function admMfaChallengeUI(factorId){
  window.__admMfaFactorId=factorId;
  admMfaOverlay(`
    <div style="max-width:380px;background:var(--adm-panel,#131a16);border:1px solid var(--adm-line,#26302a);border-radius:14px;padding:26px;text-align:center">
      <h2 style="margin:0 0 6px;font-size:1.15rem">Verificação em duas etapas</h2>
      <p style="font-size:.82rem;opacity:.8;margin:0 0 14px">Digite o código do seu app autenticador.</p>
      <input id="mfaCode" class="adm-form-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" style="text-align:center;letter-spacing:6px;font-size:1.2rem" onkeydown="if(event.key==='Enter')admMfaVerify()">
      <button class="adm-btn primary" style="width:100%;justify-content:center;margin-top:12px" onclick="admMfaVerify()">Entrar</button>
      <div id="mfaMsg" style="min-height:20px;font-size:.78rem;margin-top:10px"></div>
      <button class="adm-btn" style="margin-top:6px" onclick="admLogout()">Sair</button>
    </div>`);
}

async function admMfaVerify(){
  const code=(document.getElementById('mfaCode')?.value||'').trim();
  const msg=document.getElementById('mfaMsg');
  if(code.length!==6){msg.textContent='Digite o código de 6 dígitos';msg.style.color='#e08080';return;}
  msg.textContent='Verificando...';msg.style.color='var(--adm-gold,#d4af7a)';
  try{
    const factorId=window.__admMfaFactorId;
    const {data:ch,error:chErr}=await sb.auth.mfa.challenge({factorId});
    if(chErr)throw chErr;
    const {error:vErr}=await sb.auth.mfa.verify({factorId,challengeId:ch.id,code});
    if(vErr)throw vErr;
    document.getElementById('admMfa').style.display='none';
    await admInit();
  }catch(e){
    msg.textContent=e.message&&e.message.includes('Invalid')?'Código inválido — tente de novo':(e.message||'Erro ao verificar');
    msg.style.color='#e08080';
  }
}

async function admLogin(){
  const email=document.getElementById('admEmail').value.trim();
  const pass=document.getElementById('admPass').value;
  const msg=document.getElementById('loginMsg');
  if(!email||!pass){msg.textContent='Preencha email e senha';msg.style.color='#e08080';return;}
  msg.textContent='Entrando...';msg.style.color='var(--adm-gold)';
  try{
    const {error}=await sb.auth.signInWithPassword({email,password:pass});
    if(error)throw error;
    await admInit();
  }catch(e){msg.textContent=e.message==='Invalid login credentials'?'Email ou senha incorretos':e.message;msg.style.color='#e08080';}
}

async function admLogout(){
  await sb.auth.signOut();
  location.reload();
}

// ── NAVIGATION ──
function showSection(id){
  currentSection=id;
  document.querySelectorAll('.adm-section').forEach(s=>s.style.display='none');
  // `aria-current` anda junto com a classe: a classe pinta, e é o atributo que
  // o leitor de tela anuncia. Marcar só a classe deixava quem navega por
  // teclado sem saber em que seção está.
  document.querySelectorAll('.adm-nav-item').forEach(n=>{n.classList.remove('active');n.removeAttribute('aria-current')});
  document.getElementById('sec-'+id).style.display='block';
  const atual=document.querySelector(`[data-sec="${id}"]`);
  atual?.classList.add('active');
  atual?.setAttribute('aria-current','page');
  if(id==='dashboard')loadDashboard();
  if(id==='users')loadUsers();
  if(id==='herbs')loadHerbs();
  if(id==='products')loadProducts();
  if(id==='news')loadNews();
  if(id==='suppliers')loadSuppliers();
  if(id==='fichas')loadFichasAdmin();
  if(id==='chazerias')loadChazerias();
  if(id==='orders'&&typeof loadOrders==='function')loadOrders();
  if(id==='returns'&&typeof loadReturns==='function')loadReturns();
  if(id==='audit'&&typeof loadAudit==='function')loadAudit(true);
}

// ── TOAST ──
function admToast(msg){
  const t=document.getElementById('admToast');
  t.textContent=msg;t.classList.add('on');
  setTimeout(()=>t.classList.remove('on'),2500);
}

// ── DASHBOARD ──
// ============================================================
// Interruptores (migration 20260815230000)
// ============================================================
// Cada entrada diz o que PARA DE ACONTECER ao desligar. E a informacao que
// falta justamente na hora em que alguem precisa desligar as pressas, e sem
// ela "a gente desabilita depois" e promessa vazia. Mesmo desenho do
// lib/interruptores/registro.ts do Solarisis.
//
// Esta lista e UX. Quem recusa e o RLS (escrita) e a Edge Function (uso):
// `payments_enabled` valia so no navegador ate agora, e quem virasse a
// variavel no devtools chamava create-order do mesmo jeito.
const ADM_INTERRUPTORES = [
  {
    chave: 'pagamentos',
    nome: 'Pagamentos',
    descricao: 'Habilita o checkout no marketplace.',
    aoDesligar: 'O carrinho continua funcionando e a finalizacao recusa — no servidor, nao so na tela. Pedidos ja pagos nao sao afetados.',
  },
  {
    chave: 'assinatura',
    nome: 'Assinatura de acesso exclusivo',
    descricao: 'Abre a venda de assinatura e o conteudo exclusivo.',
    aoDesligar: 'A assinatura some da vitrine e o checkout dela recusa. Quem ja assinou NAO perde acesso nem para de ser cobrado.',
  },
  {
    chave: 'indicacao',
    nome: 'Indicacao (produto de terceiro)',
    descricao: 'Mostra produtos de parceiros com link para a loja deles.',
    aoDesligar: 'Os produtos de indicacao somem da vitrine E a rota de redirecionamento passa a recusar — os links ja compartilhados por fora param de encaminhar, que e o ponto: desligar so a vitrine deixaria vivos justamente os links que continuam sendo clicados. Os cliques ja medidos continuam registrados.',
  },
  {
    chave: 'newsletter',
    nome: 'Newsletter',
    descricao: 'Captacao de e-mail no rodape e no modal.',
    aoDesligar: 'O formulario some. Quem ja se inscreveu continua inscrito e continua recebendo.',
  },
];

async function loadInterruptores(){
  const lista=document.getElementById('interruptoresLista');
  if(!lista)return;

  const {data,error}=await sb.from('interruptores').select('chave,ligado');
  if(error){lista.innerHTML='<div style="font-size:.75rem;color:#e08080">Nao foi possivel carregar os interruptores.</div>';return;}

  const estado=Object.fromEntries((data||[]).map(l=>[l.chave,l.ligado]));
  // So quem pode virar ve o controle. Mostrar um toggle que sempre falha
  // transforma uma regra clara num erro sem explicacao.
  const podeVirar=admPode('configuracoes:escrever');

  lista.innerHTML=ADM_INTERRUPTORES.map(i=>{
    const ligado=estado[i.chave]===true;
    return `<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:.85rem 0;border-top:1px solid var(--adm-faint)">
      <div style="flex:1">
        <div style="font-size:.85rem;font-weight:500">${esc(i.nome)}</div>
        <div style="font-size:.72rem;color:var(--adm-muted);margin-top:2px">${esc(i.descricao)}</div>
        <div style="font-size:.68rem;color:var(--adm-muted);margin-top:6px;opacity:.85">Ao desligar: ${esc(i.aoDesligar)}</div>
      </div>
      ${podeVirar
        ? `<label class="adm-toggle"><input type="checkbox" ${ligado?'checked':''} onchange="virarInterruptor('${i.chave}',this.checked)"><span class="adm-toggle-slider"></span></label>`
        : `<span style="font-size:.72rem;color:var(--adm-muted);white-space:nowrap">${ligado?'Ligado':'Desligado'}</span>`}
    </div>`;
  }).join('');
}

async function virarInterruptor(chave,ligado){
  const {error}=await sb.from('interruptores')
    .update({ligado,alterado_em:new Date().toISOString(),alterado_por:admUser?.id||null})
    .eq('chave',chave);

  if(error){
    admToast('Erro ao salvar: '+error.message);
    loadInterruptores();   // volta o toggle ao estado real do banco
    return;
  }
  admToast(ligado?'Ligado':'Desligado');
}

async function loadDashboard(){
  loadInterruptores();
  const [users,herbs,products,suppliers,news]=await Promise.all([
    sb.from('user_profiles').select('id',{count:'exact',head:true}),
    sb.from('admin_herbs').select('id',{count:'exact',head:true}),
    sb.from('admin_products').select('id',{count:'exact',head:true}),
    sb.from('admin_suppliers').select('id',{count:'exact',head:true}),
    sb.from('admin_news').select('id',{count:'exact',head:true}),
  ]);
  document.getElementById('statUsers').textContent=users.count||0;
  document.getElementById('statHerbs').textContent=herbs.count||0;
  document.getElementById('statProducts').textContent=products.count||0;
  document.getElementById('statSuppliers').textContent=suppliers.count||0;
  document.getElementById('statNews').textContent=news.count||0;
}

// ══════════════════════════════════════
// USERS
// ══════════════════════════════════════
let allUsers=[];
async function loadUsers(){
  const {data}=await sb.from('user_profiles').select('*').order('created_at',{ascending:false});
  allUsers=data||[];
  renderUsers(allUsers);
}
function filterUsers(){
  const q=document.getElementById('userSearch').value.toLowerCase();
  renderUsers(allUsers.filter(u=>(u.display_name||'').toLowerCase().includes(q)||(u.email||'').toLowerCase().includes(q)||(u.role||'').toLowerCase().includes(q)));
}
function renderUsers(list){
  const tbody=document.getElementById('usersBody');
  if(!list.length){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--adm-muted);padding:2rem">Nenhum usuário encontrado</td></tr>';return;}
  tbody.innerHTML=list.map(u=>`<tr>
    <td><strong>${esc(u.display_name||'—')}</strong><br><span style="color:var(--adm-muted);font-size:.72rem">${esc(u.email||'')}</span></td>
    <td>${u.role?`<span class="adm-badge gold">${esc(u.role)}</span>`:'—'}</td>
    <td>${esc(u.city||'')}${u.state?', '+esc(u.state):''}</td>
    <td>${u.is_admin?'<span class="adm-badge green">Admin</span>':u.profile_completed?'<span class="adm-badge blue">Completo</span>':'<span class="adm-badge red">Pendente</span>'}</td>
    <td style="font-size:.72rem;color:var(--adm-muted)">${u.created_at?new Date(u.created_at).toLocaleDateString('pt-BR'):''}</td>
    <td>${admPode('usuarios:excluir')?`<button class="adm-btn danger" onclick="deleteUser('${u.id}','${esc(u.display_name||u.email||'')}')">Excluir</button>`:'<span class="adm-muted">—</span>'}</td>
  </tr>`).join('');
}
async function deleteUser(id,name){
  if(!confirm(`Excluir o usuário "${name}"? Esta ação não pode ser desfeita.`))return;
  // Usa Edge Function com service_role — apaga auth.users + cascatas.
  // Fallback: se a função não estiver deployada, cai no delete só do profile.
  try{
    const {data:{session}}=await sb.auth.getSession();
    const res=await fetch(`${ADM_FUNCTIONS_URL}/admin-delete-user`,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`},
      body:JSON.stringify({userId:id}),
    });
    if(res.ok){admToast('Usuário excluído');loadUsers();loadDashboard();return;}
    const err=await res.json().catch(()=>({error:res.statusText}));
    // 404 = função não deployada ainda; cai no fallback
    if(res.status!==404){admToast('Erro: '+(err.error||res.statusText));return;}
  }catch(e){/* network falhou, tenta fallback */}
  const {error}=await sb.from('user_profiles').delete().eq('id',id);
  if(error){admToast('Erro: '+error.message);return;}
  admToast('Perfil excluído (auth user pode ter ficado órfão — faça deploy da Edge Function admin-delete-user)');
  loadUsers();loadDashboard();
}

// ══════════════════════════════════════
// HERBS (Chás e Infusões)
// ══════════════════════════════════════
let allHerbs=[];
async function loadHerbs(){
  const {data}=await sb.from('admin_herbs').select('*').order('created_at',{ascending:false});
  allHerbs=data||[];
  renderHerbsAdmin(allHerbs);
}
function filterHerbsAdmin(){
  const q=document.getElementById('herbSearch').value.toLowerCase();
  renderHerbsAdmin(allHerbs.filter(h=>(h.name||'').toLowerCase().includes(q)||(h.category||'').toLowerCase().includes(q)));
}
function renderHerbsAdmin(list){
  const tbody=document.getElementById('herbsBody');
  if(!list.length){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--adm-muted);padding:2rem">Nenhum chá cadastrado. Clique em "+ Novo chá" para começar.</td></tr>';return;}
  const linhaColor={Essencial:'green',Global:'gold',Funcional:'red'};
  tbody.innerHTML=list.map(h=>`<tr>
    <td>${h.icon||'🍃'} <strong>${esc(h.name)}</strong><br><span style="color:var(--adm-muted);font-size:.72rem;font-style:italic">${esc(h.latin_name||'')}</span></td>
    <td><span class="adm-badge gold">${esc(h.category)}</span>${h.linha?` <span class="adm-badge ${linhaColor[h.linha]||'gold'}" style="margin-left:4px">${esc(h.linha)}</span>`:''}</td>
    <td style="font-size:.78rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(h.effects||'')}</td>
    <td>${h.active?'<span class="adm-badge green">Ativo</span>':'<span class="adm-badge red">Inativo</span>'}</td>
    <td style="font-size:.72rem;color:var(--adm-muted)">${h.created_at?new Date(h.created_at).toLocaleDateString('pt-BR'):''}</td>
    <td style="white-space:nowrap">
      <button class="adm-btn" onclick="editHerb('${h.id}')">Editar</button>
      <button class="adm-btn danger" onclick="deleteHerb('${h.id}','${esc(h.name)}')">Excluir</button>
    </td>
  </tr>`).join('');
}
function openHerbForm(herb){
  const m=document.getElementById('herbModal');
  document.getElementById('herbFormTitle').textContent=herb?'Editar Chá':'Novo Chá';
  document.getElementById('hfId').value=herb?.id||'';
  document.getElementById('hfName').value=herb?.name||'';
  document.getElementById('hfLatin').value=herb?.latin_name||'';
  document.getElementById('hfIcon').value=herb?.icon||'🍃';
  document.getElementById('hfCategory').value=herb?.category||'Calmante';
  document.getElementById('hfLinha').value=herb?.linha||'';
  document.getElementById('hfTagline').value=herb?.tagline||'';
  document.getElementById('hfEffects').value=herb?.effects||'';
  document.getElementById('hfDetail').value=herb?.detail||'';
  document.getElementById('hfTemp').value=herb?.temp||'';
  document.getElementById('hfTime').value=herb?.brew_time||'';
  document.getElementById('hfDose').value=herb?.dose||'';
  document.getElementById('hfFreq').value=herb?.frequency||'';
  document.getElementById('hfSafe').value=(herb?.safe_for||[]).join(', ');
  document.getElementById('hfAvoid').value=(herb?.avoid_for||[]).join(', ');
  document.getElementById('hfTags').value=(herb?.tags||[]).join(', ');
  document.getElementById('hfActive').checked=herb?.active!==false;
  m.classList.add('on');
}
function editHerb(id){openHerbForm(allHerbs.find(h=>h.id===id));}
function closeHerbForm(){document.getElementById('herbModal').classList.remove('on');}
async function saveHerb(){
  const id=document.getElementById('hfId').value;
  const row={
    name:document.getElementById('hfName').value.trim(),
    latin_name:document.getElementById('hfLatin').value.trim()||null,
    icon:document.getElementById('hfIcon').value.trim()||'🍃',
    category:document.getElementById('hfCategory').value,
    linha:document.getElementById('hfLinha').value||null,
    tagline:document.getElementById('hfTagline').value.trim()||null,
    effects:document.getElementById('hfEffects').value.trim()||null,
    detail:document.getElementById('hfDetail').value.trim()||null,
    temp:document.getElementById('hfTemp').value.trim()||null,
    brew_time:document.getElementById('hfTime').value.trim()||null,
    dose:document.getElementById('hfDose').value.trim()||null,
    frequency:document.getElementById('hfFreq').value.trim()||null,
    safe_for:document.getElementById('hfSafe').value.split(',').map(s=>s.trim()).filter(Boolean),
    avoid_for:document.getElementById('hfAvoid').value.split(',').map(s=>s.trim()).filter(Boolean),
    tags:document.getElementById('hfTags').value.split(',').map(s=>s.trim()).filter(Boolean),
    active:document.getElementById('hfActive').checked,
  };
  if(!row.name){admToast('Nome é obrigatório');return;}
  let error;
  if(id){({error}=await sb.from('admin_herbs').update(row).eq('id',id));}
  else{row.created_by=admUser.id;({error}=await sb.from('admin_herbs').insert(row));}
  if(error){admToast('Erro: '+error.message);return;}
  closeHerbForm();admToast(id?'Chá atualizado':'Chá criado');loadHerbs();loadDashboard();
}
async function deleteHerb(id,name){
  if(!confirm(`Excluir "${name}"?`))return;
  await sb.from('admin_herbs').delete().eq('id',id);
  admToast('Chá excluído');loadHerbs();loadDashboard();
}

// ══════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════
let allProducts=[];
async function loadProducts(){
  const {data}=await sb.from('admin_products').select('*').order('created_at',{ascending:false});
  allProducts=data||[];
  renderProductsAdmin(allProducts);
}
function filterProductsAdmin(){
  const q=document.getElementById('prodSearch').value.toLowerCase();
  renderProductsAdmin(allProducts.filter(p=>(p.name||'').toLowerCase().includes(q)||(p.category||'').toLowerCase().includes(q)));
}
function renderProductsAdmin(list){
  const tbody=document.getElementById('productsBody');
  if(!list.length){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--adm-muted);padding:2rem">Nenhum produto cadastrado.</td></tr>';return;}
  tbody.innerHTML=list.map(p=>`<tr>
    <td>
      ${p.images&&p.images[0]?`<img src="${esc(p.images[0])}" style="width:32px;height:32px;object-fit:cover;border-radius:4px;vertical-align:middle;margin-right:6px">`:p.icon||'📦'}
      <strong>${esc(p.name)}</strong>
      ${p.is_test?'<span class="adm-badge" style="background:rgba(100,100,200,.15);color:#a0a8e0;border:1px solid rgba(100,100,200,.3);margin-left:4px">TESTE</span>':''}
    </td>
    <td><span class="adm-badge gold">${esc(p.category)}</span></td>
    <td style="color:var(--adm-gold2)">R$ ${Number(p.price).toFixed(2)}</td>
    <td>
      ${p.stock==='in'?'<span class="adm-badge green">Em estoque</span>':p.stock==='low'?'<span class="adm-badge gold">Últimas</span>':'<span class="adm-badge red">Esgotado</span>'}
      <small style="display:block;margin-top:3px;font-size:.7rem;color:var(--adm-muted)">${p.stock_qty==null?'sem controle de unidades':`${p.stock_qty} un.`}</small>
    </td>
    <td style="font-size:.72rem;color:var(--adm-muted)">${p.created_at?new Date(p.created_at).toLocaleDateString('pt-BR'):''}</td>
    <td style="white-space:nowrap">
      <button class="adm-btn" onclick="editProduct('${p.id}')">Editar</button>
      <button class="adm-btn danger" onclick="deleteProduct('${p.id}','${esc(p.name)}')">Excluir</button>
    </td>
  </tr>`).join('');
}
function populateSupplierDropdown(selectedId){
  const sel=document.getElementById('pfSupplierId');
  if(!sel)return;
  sel.innerHTML='<option value="">— Sem fornecedor —</option>';
  allSuppliers.forEach(s=>{
    const o=document.createElement('option');
    o.value=s.id;
    o.textContent=s.name;
    if(s.id===selectedId)o.selected=true;
    sel.appendChild(o);
  });
}
function openProductForm(p){
  const m=document.getElementById('productModal');
  document.getElementById('productFormTitle').textContent=p?'Editar Produto':'Novo Produto';
  document.getElementById('pfId').value=p?.id||'';
  document.getElementById('pfName').value=p?.name||'';
  document.getElementById('pfDesc').value=p?.description||'';
  document.getElementById('pfIcon').value=p?.icon||'📦';
  document.getElementById('pfCategory').value=p?.category||'Infusões';
  document.getElementById('pfPrice').value=p?.price||'';
  document.getElementById('pfUnit').value=p?.unit||'50g';
  document.getElementById('pfWeight').value=p?.weight_grams||100;
  document.getElementById('pfStock').value=p?.stock||'in';
  // null/undefined vira campo vazio, que significa "não controlado".
  // 0 é quantidade legítima (esgotado) e precisa aparecer como "0".
  document.getElementById('pfStockQty').value=(p?.stock_qty??'')===''?'':String(p.stock_qty);
  syncStockFields();
  document.getElementById('pfActive').checked=p?.active!==false;
  document.getElementById('pfIsTest').checked=p?.is_test||false;
  document.getElementById('pfModoDeVenda').value=p?.modo_de_venda||'proprio';
  document.getElementById('pfLinkExterno').value=p?.link_externo||'';
  document.getElementById('pfParceiro').value=p?.parceiro||'';
  syncIndicacaoFields();
  // Populate supplier dropdown
  if(allSuppliers.length){populateSupplierDropdown(p?.supplier_id||'');}
  else{sb.from('admin_suppliers').select('id,name').eq('active',true).order('name').then(({data})=>{if(data){allSuppliers=data;populateSupplierDropdown(p?.supplier_id||'');}});}
  // Populate image inputs
  const imgs=p?.images||[];
  document.querySelectorAll('.pf-img-url').forEach((inp,i)=>{inp.value=imgs[i]||'';});
  updateImagePreview();
  m.classList.add('on');
}
// Com quantidade preenchida, a flag da vitrine passa a ser derivada pelo
// trigger sync_stock_flag (migration 20260730120000). Escrever nela na mão
// seria sobrescrito no banco, então o seletor é desabilitado e mostra o
// valor que o servidor vai calcular. Sem quantidade, tudo segue manual.
function syncStockFields(){
  const qtyEl=document.getElementById('pfStockQty');
  const stockEl=document.getElementById('pfStock');
  if(!qtyEl||!stockEl)return;
  const bruto=qtyEl.value.trim();
  const controlado=bruto!==''&&Number.isFinite(Number(bruto));
  stockEl.disabled=controlado;
  document.getElementById('pfStockDerived').hidden=!controlado;
  if(controlado){
    const q=Math.max(0,Math.floor(Number(bruto)));
    stockEl.value=q===0?'out':q<=5?'low':'in';
  }
}
function updateImagePreview(){
  const preview=document.getElementById('pfImagesPreview');
  if(!preview)return;
  const urls=Array.from(document.querySelectorAll('.pf-img-url')).map(i=>i.value.trim()).filter(Boolean);
  preview.innerHTML=urls.map(u=>`<img src="${esc(u)}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,.1)" onerror="this.style.display='none'">`).join('');
}
function triggerImageUpload(idx){document.querySelectorAll('.pf-img-file')[idx].click();}
async function handleImageUpload(input,idx){
  const file=input.files[0];if(!file)return;
  admToast('Enviando imagem...');
  try{
    const ext=file.name.split('.').pop();
    const path=`${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const {data,error}=await sb.storage.from('product-images').upload(path,file,{upsert:false});
    if(error){admToast('Erro no upload: '+error.message);return;}
    const {data:{publicUrl}}=sb.storage.from('product-images').getPublicUrl(data.path);
    document.querySelectorAll('.pf-img-url')[idx].value=publicUrl;
    updateImagePreview();
    admToast('Imagem enviada');
  }catch(e){admToast('Erro: '+e.message);}
}
// Vazio = NULL = estoque não controlado. Qualquer outra coisa vira inteiro
// >= 0, porque a coluna tem CHECK (stock_qty IS NULL OR stock_qty >= 0) e um
// negativo voltaria como erro cru do Postgres na cara do admin.
function parseStockQty(v){
  const s=String(v??'').trim();
  if(s==='')return null;
  const n=Number(s);
  if(!Number.isFinite(n))return null;
  return Math.max(0,Math.floor(n));
}
// Mostra os campos de indicação só quando eles significam alguma coisa. Com
// `proprio` selecionado eles são PROIBIDOS pelo banco (constraint
// bicondicional), então deixá-los à vista convidaria a preencher algo que o
// save recusa.
function syncIndicacaoFields(){
  const modo=document.getElementById('pfModoDeVenda');
  const campos=document.getElementById('pfIndicacaoCampos');
  const preco=document.getElementById('pfPrice');
  if(!modo||!campos)return;
  const indicacao=modo.value==='indicacao';
  campos.hidden=!indicacao;
  // O preço continua obrigatório na coluna (NOT NULL, herdada), mas na
  // indicação ele NÃO é exibido em lugar nenhum da vitrine — os programas de
  // afiliado proíbem preço que não venha da API deles. Fica como referência
  // interna, e a dica diz isso para ninguém achar que é o preço de venda.
  if(preco){
    preco.placeholder=indicacao?'Referência interna — não aparece na vitrine':'29.90';
  }
}

function editProduct(id){openProductForm(allProducts.find(p=>p.id===id));}
function closeProductForm(){document.getElementById('productModal').classList.remove('on');}
async function saveProduct(){
  const id=document.getElementById('pfId').value;
  const images=Array.from(document.querySelectorAll('.pf-img-url')).map(i=>i.value.trim()).filter(Boolean);
  const suppId=document.getElementById('pfSupplierId').value||null;
  const supplierName=suppId?(allSuppliers.find(s=>s.id===suppId)?.name||null):null;
  const row={
    name:document.getElementById('pfName').value.trim(),
    description:document.getElementById('pfDesc').value.trim()||null,
    icon:document.getElementById('pfIcon').value.trim()||'📦',
    category:document.getElementById('pfCategory').value,
    price:parseFloat(document.getElementById('pfPrice').value)||0,
    unit:document.getElementById('pfUnit').value.trim()||'50g',
    weight_grams:Math.max(1,parseInt(document.getElementById('pfWeight').value,10)||100),
    supplier:supplierName,
    supplier_id:suppId,
    stock:document.getElementById('pfStock').value,
    stock_qty:parseStockQty(document.getElementById('pfStockQty').value),
    active:document.getElementById('pfActive').checked,
    is_test:document.getElementById('pfIsTest').checked,
    images:images.length?images:null,
  };
  // Indicação: o link é obrigatório; venda própria: o link é proibido. A
  // constraint bicondicional do banco recusa as duas combinações erradas — o
  // que se faz aqui é evitar a ida e volta e dar a mensagem em português, em
  // vez do texto cru do Postgres.
  const modoDeVenda=document.getElementById('pfModoDeVenda').value;
  row.modo_de_venda=modoDeVenda;
  if(modoDeVenda==='indicacao'){
    const link=document.getElementById('pfLinkExterno').value.trim();
    if(!/^https:\/\//i.test(link)){
      admToast('Indicação precisa de um link https:// para a loja do parceiro');return;
    }
    if(/\s/.test(link)||link.slice(8).split('/')[0].includes('@')){
      // `https://ervatorio.com.br@evil.tld` é lido pelo olho como o nosso
      // domínio e pelo navegador como outro. O banco também recusa.
      admToast('Link inválido: sem espaços e sem "@" antes da primeira barra');return;
    }
    row.link_externo=link;
    row.parceiro=document.getElementById('pfParceiro').value.trim()||null;
  }else{
    row.link_externo=null;
    row.parceiro=null;
  }
  if(!row.name){admToast('Nome é obrigatório');return;}
  if(!row.price){admToast('Preço é obrigatório');return;}
  let error;
  if(id){({error}=await sb.from('admin_products').update(row).eq('id',id));}
  else{row.created_by=admUser.id;({error}=await sb.from('admin_products').insert(row));}
  if(error){admToast('Erro: '+error.message);return;}
  closeProductForm();admToast(id?'Produto atualizado':'Produto criado');loadProducts();loadDashboard();
}
async function deleteProduct(id,name){
  if(!confirm(`Excluir "${name}"?`))return;
  await sb.from('admin_products').delete().eq('id',id);
  admToast('Produto excluído');loadProducts();loadDashboard();
}

// ══════════════════════════════════════
// NEWS
// ══════════════════════════════════════
let allNews=[];
async function loadNews(){
  const {data}=await sb.from('admin_news').select('*').order('created_at',{ascending:false});
  allNews=data||[];
  renderNewsAdmin(allNews);
}
function renderNewsAdmin(list){
  const tbody=document.getElementById('newsBody');
  if(!list.length){tbody.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--adm-muted);padding:2rem">Nenhuma notícia cadastrada.</td></tr>';return;}
  tbody.innerHTML=list.map(n=>`<tr>
    <td><strong>${esc(n.title)}</strong><br><span style="color:var(--adm-muted);font-size:.72rem;max-width:250px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc((n.content||'').substring(0,80))}</span></td>
    <td><span class="adm-badge blue">${esc(n.category)}</span></td>
    <td>${n.published?'<span class="adm-badge green">Publicado</span>':'<span class="adm-badge red">Rascunho</span>'}</td>
    <td style="font-size:.72rem;color:var(--adm-muted)">${n.created_at?new Date(n.created_at).toLocaleDateString('pt-BR'):''}</td>
    <td style="white-space:nowrap">
      <button class="adm-btn" onclick="editNews('${n.id}')">Editar</button>
      <button class="adm-btn danger" onclick="deleteNews('${n.id}','${esc(n.title)}')">Excluir</button>
    </td>
  </tr>`).join('');
}
function openNewsForm(n){
  const m=document.getElementById('newsModal');
  document.getElementById('newsFormTitle').textContent=n?'Editar Notícia':'Nova Notícia';
  document.getElementById('nfId').value=n?.id||'';
  document.getElementById('nfTitle').value=n?.title||'';
  document.getElementById('nfContent').value=n?.content||'';
  document.getElementById('nfCategory').value=n?.category||'noticia';
  document.getElementById('nfPublished').checked=n?.published||false;
  m.classList.add('on');
}
function editNews(id){openNewsForm(allNews.find(n=>n.id===id));}
function closeNewsForm(){document.getElementById('newsModal').classList.remove('on');}
async function saveNews(){
  const id=document.getElementById('nfId').value;
  const row={
    title:document.getElementById('nfTitle').value.trim(),
    content:document.getElementById('nfContent').value.trim(),
    category:document.getElementById('nfCategory').value,
    published:document.getElementById('nfPublished').checked,
  };
  if(!row.title){admToast('Título é obrigatório');return;}
  if(!row.content){admToast('Conteúdo é obrigatório');return;}
  let error;
  if(id){({error}=await sb.from('admin_news').update(row).eq('id',id));}
  else{row.created_by=admUser.id;({error}=await sb.from('admin_news').insert(row));}
  if(error){admToast('Erro: '+error.message);return;}
  closeNewsForm();admToast(id?'Notícia atualizada':'Notícia criada');loadNews();loadDashboard();
}
async function deleteNews(id,title){
  if(!confirm(`Excluir "${title}"?`))return;
  await sb.from('admin_news').delete().eq('id',id);
  admToast('Notícia excluída');loadNews();loadDashboard();
}

// ══════════════════════════════════════
// SUPPLIERS
// ══════════════════════════════════════
let allSuppliers=[];
async function loadSuppliers(){
  const {data}=await sb.from('admin_suppliers').select('*').order('created_at',{ascending:false});
  allSuppliers=data||[];
  renderSuppliersAdmin(allSuppliers);
}
function renderSuppliersAdmin(list){
  const tbody=document.getElementById('suppliersBody');
  if(!list.length){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--adm-muted);padding:2rem">Nenhum fornecedor cadastrado.</td></tr>';return;}
  tbody.innerHTML=list.map(s=>`<tr>
    <td><strong>${esc(s.name)}</strong></td>
    <td><span class="adm-badge gold">${esc(s.type||'')}</span></td>
    <td style="font-size:.72rem;color:var(--adm-muted)">${esc(s.cnpj||'—')}</td>
    <td style="font-size:.78rem">${esc(s.city||'')}</td>
    <td style="font-size:.72rem;color:var(--adm-muted);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(s.categories&&s.categories.length?s.categories:s.herbs||[]).map(h=>esc(h)).join(', ')||'—'}</td>
    <td style="white-space:nowrap">
      <button class="adm-btn" onclick="editSupplier('${s.id}')">Editar</button>
      <button class="adm-btn danger" onclick="deleteSupplier('${s.id}','${esc(s.name)}')">Excluir</button>
    </td>
  </tr>`).join('');
}
function openSupplierForm(s){
  const m=document.getElementById('supplierModal');
  document.getElementById('supplierFormTitle').textContent=s?'Editar Fornecedor':'Novo Fornecedor';
  document.getElementById('sfId').value=s?.id||'';
  document.getElementById('sfName').value=s?.name||'';
  document.getElementById('sfCnpj').value=s?.cnpj||'';
  document.getElementById('sfType').value=s?.type||'';
  document.getElementById('sfCity').value=s?.city||'';
  document.getElementById('sfSince').value=s?.since||'';
  document.getElementById('sfCert').value=s?.certification||'';
  document.getElementById('sfShip').value=s?.shipping||'';
  document.getElementById('sfMinOrder').value=s?.min_order||'';
  document.getElementById('sfActive').checked=s?.active!==false;
  const activeCats=s?.categories||[];
  document.querySelectorAll('.sf-cat').forEach(cb=>{cb.checked=activeCats.includes(cb.value);});
  m.classList.add('on');
}
function editSupplier(id){openSupplierForm(allSuppliers.find(s=>s.id===id));}
function closeSupplierForm(){document.getElementById('supplierModal').classList.remove('on');}
async function saveSupplier(){
  const id=document.getElementById('sfId').value;
  const categories=Array.from(document.querySelectorAll('.sf-cat:checked')).map(cb=>cb.value);
  const row={
    name:document.getElementById('sfName').value.trim(),
    cnpj:document.getElementById('sfCnpj').value.trim()||null,
    type:document.getElementById('sfType').value.trim()||null,
    city:document.getElementById('sfCity').value.trim()||null,
    since:document.getElementById('sfSince').value.trim()||null,
    certification:document.getElementById('sfCert').value.trim()||null,
    shipping:document.getElementById('sfShip').value.trim()||null,
    min_order:document.getElementById('sfMinOrder').value.trim()||null,
    categories:categories,
    active:document.getElementById('sfActive').checked,
  };
  if(!row.name){admToast('Nome é obrigatório');return;}
  let error;
  if(id){({error}=await sb.from('admin_suppliers').update(row).eq('id',id));}
  else{row.created_by=admUser.id;({error}=await sb.from('admin_suppliers').insert(row));}
  if(error){admToast('Erro: '+error.message);return;}
  closeSupplierForm();admToast(id?'Fornecedor atualizado':'Fornecedor criado');loadSuppliers();loadDashboard();
}
async function deleteSupplier(id,name){
  if(!confirm(`Excluir "${name}"?`))return;
  await sb.from('admin_suppliers').delete().eq('id',id);
  admToast('Fornecedor excluído');loadSuppliers();loadDashboard();
}

// ══════════════════════════════════════
// FICHAS EDITORIAIS
// ══════════════════════════════════════
let allFichas=[];
async function loadFichasAdmin(){
  const {data,error}=await sb.from('admin_herb_fichas')
    .select('id,slug,schema_version,herb_latin_name,status,active,updated_at,ficha')
    .order('updated_at',{ascending:false});
  if(error){admToast('Erro ao carregar fichas: '+error.message);return;}
  allFichas=data||[];
  renderFichasAdmin(allFichas);
}
function renderFichasAdmin(list){
  const tbody=document.getElementById('fichasBody');
  if(!list.length){
    tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--adm-muted);padding:2rem">Nenhuma ficha cadastrada. Use "⇪ Importar JSON" para carregar o catálogo inicial ou "+ Nova ficha" para criar uma.</td></tr>';
    return;
  }
  const statusLabels={draft:'Rascunho',in_review:'Em revisão',published:'Publicado',archived:'Arquivada'};
  const statusColor={draft:'gold',in_review:'gold',published:'green',archived:'red'};
  tbody.innerHTML=list.map(f=>`<tr>
    <td><code style="font-size:.8rem">${esc(f.slug)}</code></td>
    <td>${esc(f.ficha?.nome_popular||'')}</td>
    <td style="font-style:italic;font-size:.8rem">${esc(f.herb_latin_name||f.ficha?.nome_cientifico||'')}</td>
    <td><span class="adm-badge gold">v${esc(f.schema_version||'1.1')}</span></td>
    <td>${f.active?`<span class="adm-badge ${statusColor[f.status]||'gold'}">${esc(statusLabels[f.status]||f.status)}</span>`:'<span class="adm-badge red">Inativa</span>'}</td>
    <td style="font-size:.72rem;color:var(--adm-muted)">${f.updated_at?new Date(f.updated_at).toLocaleDateString('pt-BR'):''}</td>
    <td style="white-space:nowrap">
      <button class="adm-btn" onclick="editFicha('${esc(f.id)}')">Editar</button>
      <button class="adm-btn danger" onclick="deleteFicha('${esc(f.id)}','${esc(f.slug)}')">Excluir</button>
    </td>
  </tr>`).join('');
}
function openFichaForm(ficha){
  const m=document.getElementById('fichaModal');
  document.getElementById('fichaFormTitle').textContent=ficha?'Editar ficha':'Nova ficha';
  document.getElementById('ffId').value=ficha?.id||'';
  document.getElementById('ffSlug').value=ficha?.slug||'';
  document.getElementById('ffVersion').value=ficha?.schema_version||'1.1';
  document.getElementById('ffLatin').value=ficha?.herb_latin_name||'';
  document.getElementById('ffStatus').value=ficha?.status||'published';
  document.getElementById('ffActive').checked=ficha?.active!==false;
  document.getElementById('ffJson').value=ficha?.ficha?JSON.stringify(ficha.ficha,null,2):'';
  document.getElementById('ffJsonMsg').textContent='';
  m.classList.add('on');
}
function editFicha(id){openFichaForm(allFichas.find(f=>f.id===id));}
function closeFichaForm(){document.getElementById('fichaModal').classList.remove('on');}
function validateFichaJson(){
  const msg=document.getElementById('ffJsonMsg');
  const raw=document.getElementById('ffJson').value.trim();
  if(!raw){msg.style.color='var(--adm-muted)';msg.textContent='Vazio';return null;}
  try{
    const obj=JSON.parse(raw);
    msg.style.color='#3a8a5a';msg.textContent=`JSON válido (${Object.keys(obj).length} chaves).`;
    return obj;
  }catch(e){
    msg.style.color='#c86060';msg.textContent='JSON inválido: '+e.message;
    return null;
  }
}
async function saveFicha(){
  const id=document.getElementById('ffId').value;
  const slug=document.getElementById('ffSlug').value.trim();
  if(!slug){admToast('Slug obrigatório');return;}
  const ficha=validateFichaJson();
  if(!ficha){admToast('Corrija o JSON antes de salvar');return;}
  const row={
    slug,
    schema_version:document.getElementById('ffVersion').value.trim()||'1.1',
    herb_latin_name:document.getElementById('ffLatin').value.trim()||null,
    status:document.getElementById('ffStatus').value,
    active:document.getElementById('ffActive').checked,
    ficha,
  };
  let error;
  if(id){({error}=await sb.from('admin_herb_fichas').update(row).eq('id',id));}
  else{row.created_by=admUser.id;({error}=await sb.from('admin_herb_fichas').upsert(row,{onConflict:'slug,schema_version'}));}
  if(error){admToast('Erro: '+error.message);return;}
  closeFichaForm();admToast(id?'Ficha atualizada':'Ficha salva');loadFichasAdmin();
}
async function deleteFicha(id,slug){
  if(!confirm(`Excluir ficha "${slug}"? Essa ação é irreversível.`))return;
  const {error}=await sb.from('admin_herb_fichas').delete().eq('id',id);
  if(error){admToast('Erro: '+error.message);return;}
  admToast('Ficha excluída');loadFichasAdmin();
}

// Importa um arquivo JSON contendo { schema_version, fichas: [...] }
// e UPSERTa cada ficha em admin_herb_fichas (idempotente).
async function importFichasFile(input){
  const file=input.files?.[0];
  if(!file)return;
  input.value='';
  let payload;
  try{
    const text=await file.text();
    payload=JSON.parse(text);
  }catch(e){admToast('Arquivo inválido: '+e.message);return;}
  if(!Array.isArray(payload.fichas)){admToast('JSON deve ter array "fichas"');return;}
  if(!confirm(`Importar ${payload.fichas.length} ficha(s)? Existentes (mesmo slug+versão) serão atualizadas.`))return;
  const schema=payload.schema_version||'1.1';
  const rows=payload.fichas.map(f=>({
    slug:f.slug,
    herb_latin_name:(f.nome_cientifico||f.identificacao?.nome_cientifico||'').split('(')[0].trim().split(' ').slice(0,2).join(' '),
    schema_version:f.schema_version||schema,
    ficha:f,
    status:'published',
    active:true,
    created_by:admUser.id,
  }));
  const {data,error}=await sb.from('admin_herb_fichas')
    .upsert(rows,{onConflict:'slug,schema_version'})
    .select('slug');
  if(error){admToast('Erro ao importar: '+error.message);return;}
  admToast(`${data?.length||rows.length} ficha(s) importada(s)`);
  loadFichasAdmin();
}

// ── UTILS ──
function esc(s){
  if(s==null)return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── START ──
document.addEventListener('DOMContentLoaded',()=>{
  sb=window.supabase.createClient(ADM_SUPABASE_URL,ADM_SUPABASE_KEY);
  admInit();
});

// ── CHAZERIAS ──
let chazeriasData = [];

async function loadChazerias(){
  const tbody=document.getElementById('chazBody');
  tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--adm-muted)">Carregando...</td></tr>';
  const {data,error}=await sb.from('chazerias').select('*').order('continent').order('country').order('city');
  if(error){admToast('Erro: '+error.message);return;}
  chazeriasData=data||[];
  const TYPE={'chazeria':'Chazeria','ervateiro':'Ervateiro','mercado':'Mercado','spa':'Spa','restaurante':'Restaurante','hotel':'Hotel','outro':'Outro'};
  tbody.innerHTML=chazeriasData.length?chazeriasData.map(c=>`
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.city}, ${c.country}</td>
      <td>${c.continent||'—'}</td>
      <td>${TYPE[c.type]||c.type||'—'}</td>
      <td style="font-size:.72rem;color:var(--adm-muted)">${c.lat&&c.lng?`${c.lat}, ${c.lng}`:'—'}</td>
      <td><span class="adm-badge ${c.active?'green':'red'}">${c.active?'Ativo':'Inativo'}</span></td>
      <td style="display:flex;gap:6px">
        <button class="adm-btn small" onclick="openChazForm(${c.id})">✎</button>
        <button class="adm-btn small danger" onclick="deleteChaz(${c.id},'${(c.name||'').replace(/'/g,"\\'")}')">✕</button>
      </td>
    </tr>`).join('')
  :'<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--adm-muted)">Nenhuma chazeria cadastrada ainda</td></tr>';
}

function openChazForm(id){
  const c=id?chazeriasData.find(x=>x.id===id):{};
  document.getElementById('chazFormTitle').textContent=id?'Editar Chazeria':'Nova Chazeria';
  document.getElementById('chazId').value=id||'';
  ['Name','Address','City','Country','Lat','Lng','Desc','Quote','QuoteAuthor','Hours','Payment','Style','Website','Phone']
    .forEach(f=>{const el=document.getElementById('chaz'+f);if(el)el.value=c?.[f.toLowerCase()]||c?.['quote_author']||c?.['opening_hours']||'';});
  // manual mapping for fields with different keys
  document.getElementById('chazName').value=c?.name||'';
  document.getElementById('chazAddress').value=c?.address||'';
  document.getElementById('chazCity').value=c?.city||'';
  document.getElementById('chazCountry').value=c?.country||'';
  document.getElementById('chazContinent').value=c?.continent||'América do Sul';
  document.getElementById('chazLat').value=c?.lat||'';
  document.getElementById('chazLng').value=c?.lng||'';
  document.getElementById('chazType').value=c?.type||'chazeria';
  document.getElementById('chazDesc').value=c?.description||'';
  document.getElementById('chazQuote').value=c?.quote||'';
  document.getElementById('chazQuoteAuthor').value=c?.quote_author||'';
  document.getElementById('chazHours').value=c?.opening_hours||'';
  document.getElementById('chazPayment').value=c?.payment||'';
  document.getElementById('chazStyle').value=c?.style||'';
  document.getElementById('chazWebsite').value=c?.website||'';
  document.getElementById('chazPhone').value=c?.phone||'';
  document.getElementById('chazActive').checked=c?.active!==false;
  document.getElementById('chazModal').style.display='flex';
}

function closeChazForm(){document.getElementById('chazModal').style.display='none';}

async function saveChaz(){
  const id=document.getElementById('chazId').value;
  const payload={
    name:document.getElementById('chazName').value.trim(),
    address:document.getElementById('chazAddress').value.trim(),
    city:document.getElementById('chazCity').value.trim(),
    country:document.getElementById('chazCountry').value.trim(),
    continent:document.getElementById('chazContinent').value,
    lat:parseFloat(document.getElementById('chazLat').value)||null,
    lng:parseFloat(document.getElementById('chazLng').value)||null,
    type:document.getElementById('chazType').value,
    description:document.getElementById('chazDesc').value.trim(),
    quote:document.getElementById('chazQuote').value.trim(),
    quote_author:document.getElementById('chazQuoteAuthor').value.trim(),
    opening_hours:document.getElementById('chazHours').value.trim(),
    payment:document.getElementById('chazPayment').value.trim(),
    style:document.getElementById('chazStyle').value.trim(),
    website:document.getElementById('chazWebsite').value.trim(),
    phone:document.getElementById('chazPhone').value.trim(),
    active:document.getElementById('chazActive').checked,
  };
  if(!payload.name||!payload.city||!payload.country){admToast('Nome, cidade e país são obrigatórios');return;}
  const {error}=id
    ?await sb.from('chazerias').update(payload).eq('id',id)
    :await sb.from('chazerias').insert(payload);
  if(error){admToast('Erro: '+error.message);return;}
  admToast(id?'Chazeria atualizada!':'Chazeria criada!');
  closeChazForm();
  loadChazerias();
}

async function deleteChaz(id,name){
  if(!confirm(`Remover "${name}"?`))return;
  const {error}=await sb.from('chazerias').delete().eq('id',id);
  if(error){admToast('Erro: '+error.message);return;}
  admToast('Removida!');
  loadChazerias();
}
