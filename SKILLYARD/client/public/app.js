const qs = (s, p=document) => p.querySelector(s);
const qsa = (s, p=document) => Array.from(p.querySelectorAll(s));

const state = {
  user: null,
  skills: [],
  requests: { incoming: [], outgoing: [] },
  threadWith: null,
};

// Elements
const els = {
  loginBtn: qs('#loginBtn'),
  createSkillBtn: qs('#createSkillBtn'),
  logoutBtn: qs('#logoutBtn'),
  modal: qs('#authModal'),
  closeModal: qs('#closeModal'),
  authTabs: qsa('[data-auth-tab]'),
  loginForm: qs('#loginForm'),
  registerForm: qs('#registerForm'),
  dash: qs('#dashboard'),
  landing: qs('#landing'),
  grid: qs('#skillsGrid'),
  searchInput: qs('#searchInput'),
  searchBtn: qs('#searchBtn'),
  createSkillForm: qs('#createSkillForm'),
  requestsIncoming: qs('#requestsIncoming'),
  requestsOutgoing: qs('#requestsOutgoing'),
  // dashboard tabs
  dashTabs: qsa('[data-dash-tab]'),
  dashSkills: qs('#dash-skills'),
  dashMessages: qs('#dash-messages'),
  dashProfile: qs('#dash-profile'),
  // messages
  msgUserId: qs('#msgUserId'),
  loadThreadBtn: qs('#loadThreadBtn'),
  threadBox: qs('#threadBox'),
  msgContent: qs('#msgContent'),
  sendMsgBtn: qs('#sendMsgBtn'),
  // profile (me)
  profileForm: qs('#profileForm'),
  profileBio: qs('#profileBio'),
  profileLocation: qs('#profileLocation'),
  myRatingsBox: qs('#myRatingsBox'),
  // public profile modal
  profileModal: qs('#profileModal'),
  closeProfile: qs('#closeProfile'),
  profileBody: qs('#profileBody'),
  profileTitle: qs('#profileTitle'),
};

function showModal(open=true){ els.modal.classList.toggle('open', open); }
function showProfileModal(open=true){ els.profileModal.classList.toggle('open', open); }

function setLoggedIn(user){
  state.user = user;
  els.landing.classList.add('hidden');
  els.dash.classList.remove('hidden');
  qs('#welcomeName').textContent = user.username;
  refreshAll();
}
function setLoggedOut(){
  state.user = null;
  API.clearToken();
  els.landing.classList.remove('hidden');
  els.dash.classList.add('hidden');
}

async function refreshAll(){
  try {
    await loadSkills();
    await loadRequests();
    await loadMyProfile();
    if (state.user && state.user.id) await loadMyRatings(state.user.id);
  } catch(e){
    console.error(e);
  }
}

async function loadSkills(q){
  try{
    const data = await API.get('/api/skills' + (q ? `?q=${encodeURIComponent(q)}` : ''));
    state.skills = data;
    renderSkills();
  }catch(e){ console.error(e); }
}

function renderSkills(){
  els.grid.innerHTML = '';
  if(state.skills.length === 0){
    els.grid.innerHTML = `<div class="card"><p>Nenhuma habilidade encontrada.</p></div>`;
    return;
  }
  state.skills.forEach(s => {
    const card = document.createElement('div');
    card.className = 'card skill-card';
    const tags = (s.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    card.innerHTML = `
      <h3>${escapeHtml(s.name)}</h3>
      <div class="skill-meta">por <button class="btn ghost" data-view-profile="${s.user_id}">@${escapeHtml(s.username)}</button> • ⭐ ${s.avg_stars || 0} (${s.ratings_count || 0})</div>
      <p style="margin:8px 0 10px; color:#cbd5e1">${escapeHtml(s.description || '')}</p>
      <div class="tags">
        ${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
      </div>
      <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap">
        <button class="btn" data-request="${s.id}" data-receiver="${s.user_id}">Pedir Troca</button>
        <button class="btn secondary" data-message="${s.user_id}">Mensagem</button>
        <button class="btn ghost" data-rate="${s.user_id}">Avaliar</button>
      </div>
    `;
    els.grid.appendChild(card);
  });

  qsa('[data-request]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const skill_id = Number(btn.getAttribute('data-request'));
      const receiver_id = Number(btn.getAttribute('data-receiver'));
      const message = prompt('Deixe uma mensagem opcional para o criador da habilidade:');
      try{
        await API.post('/api/requests', { skill_id, receiver_id, message });
        alert('Pedido enviado! Acompanhe em "Meus Pedidos".');
        await loadRequests();
      }catch(e){ alert(e.message); }
    });
  });

  qsa('[data-message]').forEach(btn => {
    btn.onclick = async () => {
      const uid = Number(btn.getAttribute('data-message'));
      els.msgUserId.value = uid;
      switchDash('messages');
    };
  });

  qsa('[data-rate]').forEach(btn => {
    btn.onclick = async () => {
      const uid = Number(btn.getAttribute('data-rate'));
      const stars = Number(prompt('Dê uma nota de 1 a 5 para este usuário:'));
      if(!stars) return;
      const comment = prompt('Comentário (opcional):') || '';
      try{
        await API.post('/api/ratings', { ratee_id: uid, stars, comment });
        alert('Avaliação registrada!');
      }catch(e){ alert(e.message); }
    };
  });

  qsa('[data-view-profile]').forEach(btn => {
    btn.onclick = () => openPublicProfile(Number(btn.getAttribute('data-view-profile')));
  });
}

async function openPublicProfile(userId){
  try{
    const data = await API.get(`/api/users/${userId}`);
    els.profileTitle.textContent = `Perfil de @${escapeHtml(data.user.username)}`;
    const skills = data.skills.map(s => `<li>${escapeHtml(s.name)} <small class="muted">(${(s.tags||'').slice(0,60)})</small></li>`).join('');
    els.profileBody.innerHTML = `
      <div class="card">
        <p><strong>@${escapeHtml(data.user.username)}</strong> • ⭐ ${data.user.avg_stars} (${data.user.ratings_count})</p>
        ${data.user.location ? `<p class="muted">📍 ${escapeHtml(data.user.location)}</p>`:''}
        ${data.user.bio ? `<p>${escapeHtml(data.user.bio)}</p>`:''}
      </div>
      <div class="card">
        <h4 style="margin:0 0 6px">Habilidades</h4>
        <ul style="margin:0; padding-left:18px">${skills || '<li class="muted">Sem habilidades publicadas.</li>'}</ul>
      </div>
      <div class="card" style="display:flex; gap:8px; flex-wrap:wrap">
        <button class="btn" id="pmBtn">Enviar mensagem</button>
        <button class="btn ghost" id="rateBtn">Avaliar</button>
      </div>
    `;
    showProfileModal(true);
    qs('#pmBtn').onclick = () => {
      showProfileModal(false);
      els.msgUserId.value = userId;
      switchDash('messages');
    };
    qs('#rateBtn').onclick = async () => {
      const stars = Number(prompt('Dê uma nota de 1 a 5:'));
      if(!stars) return;
      const comment = prompt('Comentário (opcional):') || '';
      try{ await API.post('/api/ratings', { ratee_id: userId, stars, comment }); alert('Avaliação registrada!'); }catch(e){ alert(e.message); }
    };
  }catch(e){ alert(e.message); }
}

async function loadRequests(){
  try{
    const data = await API.get('/api/requests');
    state.requests = data;
    renderRequests();
  }catch(e){ console.error(e); }
}

function renderRequests(){
  const inc = state.requests.incoming;
  const out = state.requests.outgoing;

  els.requestsIncoming.innerHTML = inc.length ? '' : '<p class="muted">Nenhum pedido recebido.</p>';
  inc.forEach(r => {
    const li = document.createElement('div');
    li.className = 'card';
    li.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:start; gap:8px;">
        <div>
          <strong>@${escapeHtml(r.requester_name)}</strong> pediu sua habilidade <em>${escapeHtml(r.skill_name)}</em><br/>
          <small class="muted">Status: ${r.status}</small>
          ${r.message ? `<p style="margin:6px 0 0; color:#cbd5e1">${escapeHtml(r.message)}</p>` : ''}
        </div>
        <div style="display:flex; gap:6px">
          <button class="btn" data-accept="${r.id}">Aceitar</button>
          <button class="btn secondary" data-decline="${r.id}">Recusar</button>
        </div>
      </div>
    `;
    els.requestsIncoming.appendChild(li);
  });

  qsa('[data-accept]').forEach(b => b.onclick = async () => {
    try{ await API.patch(`/api/requests/${b.getAttribute('data-accept')}`, { status:'accepted' }); await loadRequests(); }catch(e){ alert(e.message) }
  });
  qsa('[data-decline]').forEach(b => b.onclick = async () => {
    try{ await API.patch(`/api/requests/${b.getAttribute('data-decline')}`, { status:'declined' }); await loadRequests(); }catch(e){ alert(e.message) }
  });

  els.requestsOutgoing.innerHTML = out.length ? '' : '<p class="muted">Nenhum pedido enviado.</p>';
  out.forEach(r => {
    const li = document.createElement('div');
    li.className = 'card';
    li.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:start; gap:8px;">
        <div>
          Você pediu <em>${escapeHtml(r.skill_name)}</em> de <strong>@${escapeHtml(r.receiver_name)}</strong><br/>
          <small class="muted">Status: ${r.status}</small>
          ${r.message ? `<p style="margin:6px 0 0; color:#cbd5e1">${escapeHtml(r.message)}</p>` : ''}
        </div>
        <div>
          <button class="btn secondary" data-complete="${r.id}">Marcar como Concluído</button>
        </div>
      </div>
    `;
    els.requestsOutgoing.appendChild(li);
  });

  qsa('[data-complete]').forEach(b => b.onclick = async () => {
    try{ await API.patch(`/api/requests/${b.getAttribute('data-complete')}`, { status:'completed' }); await loadRequests(); }catch(e){ alert(e.message) }
  });
}

// Messages
els.loadThreadBtn.addEventListener('click', loadThread);
els.sendMsgBtn.addEventListener('click', sendMessage);
async function loadThread(){
  const uid = Number(els.msgUserId.value);
  if(!uid) return alert('Informe o ID do usuário.');
  state.threadWith = uid;
  try{
    const rows = await API.get(`/api/messages?with=${uid}`);
    renderThread(rows);
  }catch(e){ alert(e.message); }
}
async function sendMessage(){
  if(!state.threadWith) return alert('Abra uma conversa primeiro.');
  const content = els.msgContent.value.trim();
  if(!content) return;
  try{
    await API.post('/api/messages', { to: state.threadWith, content });
    els.msgContent.value = '';
    await loadThread();
  }catch(e){ alert(e.message); }
}
function renderThread(rows){
  els.threadBox.innerHTML = '';
  rows.forEach(m => {
    const div = document.createElement('div');
    const mine = m.sender_id === (state.user?.id);
    div.className = `msg ${mine ? 'me' : 'them'}`;
    div.innerHTML = `<div><strong>${mine ? 'Você' : '@'+escapeHtml(m.sender_name)}</strong></div><div>${escapeHtml(m.content)}</div><div class="muted" style="font-size:12px">${new Date(m.created_at).toLocaleString()}</div>`;
    els.threadBox.appendChild(div);
  });
  els.threadBox.scrollTop = els.threadBox.scrollHeight;
}

// My profile
async function loadMyProfile(){
  try{
    const me = await API.get('/api/users/me/profile');
    if(me){
      state.user = { ...(state.user||{}), ...me };
      qs('#welcomeName').textContent = me.username;
      els.profileBio.value = me.bio || '';
      els.profileLocation.value = me.location || '';
    }
  }catch{}
}
els.profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try{
    await API.patch('/api/users/me/profile', {
      bio: els.profileBio.value.trim(),
      location: els.profileLocation.value.trim()
    });
    alert('Perfil atualizado!');
  }catch(e){ alert(e.message); }
});

async function loadMyRatings(userId){
  try{
    const data = await API.get(`/api/ratings/${userId}`);
    const box = els.myRatingsBox;
    box.innerHTML = `<p>⭐ ${data.summary.avg_stars} (${data.summary.ratings_count})</p>`;
    data.items.forEach(r => {
      const el = document.createElement('div');
      el.className = 'card';
      el.innerHTML = `<strong>@${escapeHtml(r.rater_name)}</strong> — ⭐ ${r.stars}<br/><span class="muted">${new Date(r.created_at).toLocaleDateString()}</span>${r.comment ? `<p>${escapeHtml(r.comment)}</p>`:''}`;
      box.appendChild(el);
    });
  }catch(e){ console.error(e); }
}

// Tabs 
els.closeModal.addEventListener('click', () => showModal(false));
els.authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    els.authTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.authTab;
    qs('[data-form="login"]').classList.toggle('hidden', target !== 'login');
    qs('[data-form="register"]').classList.toggle('hidden', target !== 'register');
  });
});
els.dashTabs.forEach(tab => tab.addEventListener('click', () => switchDash(tab.dataset.dashTab)));
function switchDash(name){
  els.dashTabs.forEach(t => t.classList.toggle('active', t.dataset.dashTab === name));
  els.dashSkills.classList.toggle('hidden', name !== 'skills');
  els.dashMessages.classList.toggle('hidden', name !== 'messages');
  els.dashProfile.classList.toggle('hidden', name !== 'profile');
}

// Auth
els.loginBtn.addEventListener('click', () => showModal(true));
els.registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = qs('#regUsername').value.trim();
  const email = qs('#regEmail').value.trim();
  const password = qs('#regPassword').value;
  try{
    const { token, user } = await API.post('/api/auth/register', { username, email, password });
    API.setToken(token);
    showModal(false);
    setLoggedIn(user);
  }catch(err){ alert(err.message); }
});
els.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = qs('#loginEmail').value.trim();
  const password = qs('#loginPassword').value;
  try{
    const { token, user } = await API.post('/api/auth/login', { email, password });
    API.setToken(token);
    showModal(false);
    setLoggedIn(user);
  }catch(err){ alert(err.message); }
});
els.logoutBtn.addEventListener('click', () => setLoggedOut());
els.closeProfile.addEventListener('click', () => showProfileModal(false));

els.searchBtn.addEventListener('click', async () => {
  const q = els.searchInput.value.trim();
  await loadSkills(q);
});

els.createSkillForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = qs('#skillName').value.trim();
  const description = qs('#skillDesc').value.trim();
  const tags = qs('#skillTags').value.trim();
  try{
    await API.post('/api/skills', { name, description, tags });
    qs('#skillName').value = '';
    qs('#skillDesc').value = '';
    qs('#skillTags').value = '';
    await loadSkills();
    alert('Habilidade publicada!');
  }catch(err){ alert(err.message); }
});

function escapeHtml(str){
  return (str || '').replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[s]));
}


(async function init(){
  if(API.token()){
    try{
      const me = await API.get('/api/users/me/profile');
      setLoggedIn(me || { username: 'Você' });
    }catch{
      API.clearToken();
      setLoggedOut();
    }
  } else {
    setLoggedOut();
    await loadSkills();
  }
})();

