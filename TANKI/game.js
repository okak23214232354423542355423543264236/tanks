// ============================================================
// ЗАГРУЗКА ДАННЫХ
// ============================================================
let NATIONS = {};
let T = {};

async function loadNations() {
  try {
    const res = await fetch('data/nations.json');
    NATIONS = await res.json();
    console.log('Нации загружены:', Object.keys(NATIONS));
  } catch (e) {
    console.error('Ошибка загрузки наций:', e);
  }
}

async function loadRank(nation, rank) {
  try {
    const res = await fetch('data/' + nation + '/rank' + rank + '.json');
    const data = await res.json();
    Object.keys(data).forEach(key => {
      T[key] = data[key];
    });
    return Object.keys(data);
  } catch (e) {
    return [];
  }
}

async function loadAllTanks() {
  const allTanks = [];
  for (const nation of Object.keys(NATIONS)) {
    for (let rank = 1; rank <= 7; rank++) {
      const ids = await loadRank(nation, rank);
      ids.forEach(id => allTanks.push(id));
    }
  }
  console.log('Всего танков загружено:', allTanks.length);
  return allTanks;
}

function tanksOf(nation) {
  return Object.keys(T).filter(k => T[k].nation === nation);
}

// ============================================================
// СОХРАНЕНИЕ
// ============================================================
const SK = 'tank2d_v57';
let P = { exp: 0, coins: 0, gold: 0, unlocked: [], texp: {}, tkills: {} };
let curNation = 'usa';
let treeNation = 'usa';
let treeFilter = 'all';
let treeView = 'nation';
let currentMap = 'corridor';
let curT = 'T1';

function loadSave() {
  try {
    const d = JSON.parse(localStorage.getItem(SK));
    if (d) Object.assign(P, d);
  } catch (e) {}
  if (!P.gold) P.gold = 0;
  if (!P.unlocked.length) {
    if (T['T1']) P.unlocked.push('T1');
    if (T['E1']) P.unlocked.push('E1');
    if (T['СУ5']) P.unlocked.push('СУ5');
  }
  Object.keys(T).forEach(t => {
    if (!P.texp[t]) P.texp[t] = 0;
    if (!P.tkills[t]) P.tkills[t] = 0;
  });
}

function save() {
  try { localStorage.setItem(SK, JSON.stringify(P)); } catch (e) {}
  renderNations();
  renderGarage();
  renderTreeNations();
  renderTree();
}

function resetAll() {
  if (confirm('Сбросить весь прогресс?')) {
    P = { exp: 0, coins: 0, gold: 0, unlocked: [], texp: {}, tkills: {} };
    if (T['T1']) P.unlocked.push('T1');
    if (T['E1']) P.unlocked.push('E1');
    if (T['СУ5']) P.unlocked.push('СУ5');
    curT = 'T1';
    save();
  }
}

// ============================================================
// НАЦИИ В ГАРАЖЕ
// ============================================================
function renderNations() {
  nationsBox.innerHTML = '<div class="nations-title">НАЦИИ</div>';
  Object.keys(NATIONS).forEach(code => {
    const n = NATIONS[code];
    const btn = document.createElement('button');
    btn.className = 'nation-btn' + (curNation === code ? ' sel' : '');
    btn.innerHTML = `<span class="flag">${n.flag}</span><span class="nn"><span>${n.name}</span><span class="code">${n.code}</span></span>`;
    btn.onclick = () => {
      curNation = code;
      const avail = tanksOf(code).filter(k => P.unlocked.includes(k));
      if (avail.length) curT = avail[0];
      renderNations();
      renderGarage();
      updateHUD();
    };
    nationsBox.appendChild(btn);
  });
}

// ============================================================
// ГАРАЖ
// ============================================================
function renderGarage() {
  gE.textContent = P.exp;
  gC.textContent = P.coins;
  gG.textContent = P.gold;
  grid.innerHTML = '';

  const list = tanksOf(curNation);
  if (!list.length) {
    grid.innerHTML = '<div style="color:#5a7a50;padding:20px">В разработке...</div>';
    return;
  }

  list.forEach(k => {
    const d = T[k];
    const isUnlocked = P.unlocked.includes(k);
    const c = document.createElement('div');
    c.className = 'card' + (k === curT ? ' sel' : '') + (isUnlocked ? '' : ' lock') + (d.premium ? ' premium' : '');
    c.onclick = () => {
      if (!isUnlocked) {
        if (d.premium) { showCheat('💎 Только из лутбокса'); return; }
        return;
      }
      curT = k;
      renderGarage();
      updateHUD();
    };
    const roleTag = d.role === 'PT' ? 'ПТ-САУ' : (d.role === 'LT' ? 'ЛТ' : 'СТ');
    const mgTag = d.special.mgOn ? ' 🔫' : '';
    const snTag = d.special.sniperOn ? ' 🎯' : '';
    c.innerHTML = `
      <span class="flag-badge">${NATIONS[d.nation].flag}</span>
      <span class="ic">${d.icon}</span>
      <div class="nm">${d.name}${mgTag}${snTag}</div>
      <div class="proj">Projekt Nr ${d.projNum} · ${roleTag}</div>
      <div class="st">❤️ ${d.combat.hp} | 🛡️ ${d.combat.armor.join('/')}<br>🔫 ${d.combat.dmg}${d.combat.guns > 1 ? ' (x' + d.combat.guns + ')' : ''} | 🎯 ${d.combat.pen}</div>
      <div class="exp">⭐ ${P.texp[k] || 0}</div>`;
    grid.appendChild(c);
  });
}

// ============================================================
// ВЫБОР КАРТЫ
// ============================================================
function openMapSelect() {
  if (inG || !T[curT]) return;
  mapSelect.classList.add('open');
}
function closeMapSelect() {
  mapSelect.classList.remove('open');
}

// ============================================================
// ДЕРЕВО — ПАНЕЛЬ НАЦИЙ
// ============================================================
function renderTreeNations() {
  forceHideTTX();
  treeNations.innerHTML = '';
  Object.keys(NATIONS).forEach(code => {
    const n = NATIONS[code];
    const btn = document.createElement('button');
    btn.className = 'tn-btn' + (treeView === 'nation' && treeNation === code ? ' sel' : '');
    btn.innerHTML = `<span class="flag">${n.flag}</span><span class="txt"><span>${n.name}</span><span class="code">${n.code}</span></span>`;
    btn.onclick = () => {
      treeView = 'nation';
      treeNation = code;
      renderTreeNations();
      renderTree();
    };
    treeNations.appendChild(btn);
  });
  const premBtn = document.createElement('button');
  premBtn.className = 'tn-btn' + (treeView === 'premium' ? ' sel' : '');
  premBtn.innerHTML = `<span class="flag">💎</span><span class="txt"><span>ПРЕМИУМ</span><span class="code">ALL</span></span>`;
  premBtn.onclick = () => {
    treeView = 'premium';
    renderTreeNations();
    renderTree();
  };
  treeNations.appendChild(premBtn);

  const filtersBox = document.createElement('div');
  filtersBox.className = 'filters';
  const filters = [
    { id: 'all', label: '📋 Все' },
    { id: '1', label: '⭐ Ранг I' },
    { id: '2', label: '⭐⭐ Ранг II' },
    { id: '3', label: '⭐⭐⭐ Ранг III' }
  ];
  filters.forEach(f => {
    const fb = document.createElement('button');
    fb.className = 'filter-btn' + (treeFilter === f.id ? ' sel' : '');
    fb.textContent = f.label;
    fb.onclick = () => {
      treeFilter = f.id;
      renderTreeNations();
      renderTree();
    };
    filtersBox.appendChild(fb);
  });
  treeNations.appendChild(filtersBox);
}

function reqOk(k) {
  const d = T[k];
  if (d.research.reqAll.length && !d.research.reqAll.every(r => P.unlocked.includes(r))) return false;
  if (d.research.reqAny.length && !d.research.reqAny.some(r => P.unlocked.includes(r))) return false;
  return true;
}

function reqText(k) {
  const d = T[k];
  if (d.research.reqAll.length) return 'Нужны ' + d.research.reqAll.join(' и ');
  if (d.research.reqAny.length) return 'Нужен ' + d.research.reqAny.join(' или ');
  return '';
}

function makeNode(k) {
  const d = T[k];
  const has = P.unlocked.includes(k);
  const rOk = reqOk(k);
  const canAfford = P.exp >= d.research.costExp && P.coins >= d.research.costCoins;
  const n = document.createElement('div');
  n.className = 'wot-node' + (has ? ' done' : '');

  let status = '', btn = '';
  if (has) status = '✅ Куплен';
  else if (d.premium) { status = '💎 Из лутбокса'; n.classList.add('lock'); }
  else if (!rOk) { status = '🔒 ' + reqText(k); n.classList.add('lock'); }
  else if (!canAfford) { status = '🔒 ⭐' + d.research.costExp + ' 🪙' + d.research.costCoins; n.classList.add('lock'); }
  else {
    status = '🔓 Доступен';
    btn = `<br><button onclick="event.stopPropagation();unlockTank('${k}')">Изучить</button>`;
  }

  const roleTag = d.role === 'PT' ? 'ПТ-САУ' : (d.role === 'LT' ? 'ЛТ' : 'СТ');
  const mgTag = d.special.mgOn ? ' 🔫' : '';
  const snTag = d.special.sniperOn ? ' 🎯' : '';

  n.innerHTML = `
    <span class="ic">${d.icon}</span>
    <div class="nm">${d.name}${mgTag}${snTag}</div>
    <div class="proj">Projekt Nr ${d.projNum} · ${roleTag}</div>
    <div class="sts">${status}</div>
    <div class="cost">${d.premium ? '💎 лутбокс' : '⭐' + d.research.costExp + ' 🪙' + d.research.costCoins}</div>
    ${btn}`;

  n.onmouseenter = (e) => showTTX(k, e);
  n.onmousemove = (e) => moveTTX(e);
  n.onmouseleave = hideTTX;
  return n;
}

function arrowV() {
  const a = document.createElement('div');
  a.className = 'wot-arrow-v';
  a.textContent = '⬇';
  return a;
}

function unlockTank(k) {
  const d = T[k];
  if (d.premium) return;
  if (P.unlocked.includes(k)) return;
  if (!reqOk(k)) return;
  if (P.exp < d.research.costExp || P.coins < d.research.costCoins) return;
  P.exp -= d.research.costExp;
  P.coins -= d.research.costCoins;
  P.unlocked.push(k);
  P.texp[k] = 0;
  P.tkills[k] = 0;
  save();
  curT = k;
  curNation = d.nation;
  renderGarage();
}
// ============================================================
// ДЕРЕВО — ОТРИСОВКА
// ============================================================
function renderTree() {
  forceHideTTX();
  treeScroll.innerHTML = '';

  if (treeView === 'premium') {
    renderPremiumTree();
    return;
  }

  const nation = NATIONS[treeNation];
  const filterRank = treeFilter === 'all' ? null : +treeFilter;

  // Если выбран конкретный ранг — плоский список
  if (filterRank !== null) {
    const all = tanksOf(treeNation).filter(k => !T[k].premium && T[k].rank === filterRank);
    if (!all.length) {
      treeScroll.innerHTML = `<div style="color:#5a7a50;padding:40px;text-align:center;font-size:18px">Нет танков Ранга ${filterRank}</div>`;
      return;
    }
    const wrap = document.createElement('div');
    wrap.className = 'wot-tree';
    const head = document.createElement('div');
    head.style.cssText = `text-align:center;padding:10px;font-size:22px;color:${nation.color};font-weight:bold;letter-spacing:3px`;
    head.textContent = `${nation.flag} ${nation.name} — ${nation.code}`;
    wrap.appendChild(head);
    const r = document.createElement('div');
    r.className = 'wot-rank';
    r.textContent = 'РАНГ ' + filterRank;
    wrap.appendChild(r);
    const row = document.createElement('div');
    row.className = 'wot-row';
    row.style.flexWrap = 'wrap';
    row.style.maxWidth = '1400px';
    all.forEach(k => row.appendChild(makeNode(k)));
    wrap.appendChild(row);
    treeScroll.appendChild(wrap);
    return;
  }

  // Полное дерево нации
  const wrap = document.createElement('div');
  wrap.className = 'wot-tree';
  const head = document.createElement('div');
  head.style.cssText = `text-align:center;padding:10px;font-size:22px;color:${nation.color};font-weight:bold;letter-spacing:3px`;
  head.textContent = `${nation.flag} ${nation.name} — ${nation.code}`;
  wrap.appendChild(head);

  if (treeNation === 'usa') buildTreeUSA(wrap);
  else if (treeNation === 'germany') buildTreeGER(wrap);
  else if (treeNation === 'ussr') buildTreeUSSR(wrap);
  else buildTreeFlat(treeNation, wrap);

  treeScroll.appendChild(wrap);
}

function renderPremiumTree() {
  const lootBtn = document.createElement('button');
  lootBtn.className = 'prem';
  lootBtn.style.cssText = 'font-size:16px;padding:12px 30px;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto';
  lootBtn.textContent = '🎁 Купить лутбокс — 10💰';
  lootBtn.onclick = () => openLootbox();
  treeScroll.appendChild(lootBtn);

  const allPrem = Object.keys(T).filter(k => T[k].premium > 0);
  if (!allPrem.length) {
    treeScroll.innerHTML += `<div style="color:#5a7a50;padding:40px;text-align:center;font-size:18px">💎 Премиум-танков пока нет</div>`;
    return;
  }

  const head = document.createElement('div');
  head.style.cssText = 'text-align:center;padding:10px;font-size:22px;color:#c9a83a;font-weight:bold;letter-spacing:3px';
  head.textContent = '💎 ПРЕМИУМ-ТАНКИ — ВСЕ НАЦИИ';
  treeScroll.appendChild(head);

  const wrap = document.createElement('div');
  wrap.className = 'wot-tree';

  const filterRank = treeFilter === 'all' ? null : +treeFilter;
  const groups = {};
  allPrem.forEach(k => {
    const r = T[k].rank || 1;
    if (filterRank !== null && r !== filterRank) return;
    if (!groups[r]) groups[r] = [];
    groups[r].push(k);
  });

  const ranks = Object.keys(groups).map(Number).sort((a, b) => a - b);
  if (!ranks.length) {
    treeScroll.innerHTML += `<div style="color:#5a7a50;padding:40px;text-align:center;font-size:18px">Нет премиум-танков Ранга ${filterRank}</div>`;
    return;
  }

  ranks.forEach(r => {
    const rk = document.createElement('div');
    rk.className = 'wot-rank';
    rk.textContent = 'РАНГ ' + r;
    wrap.appendChild(rk);
    const row = document.createElement('div');
    row.className = 'wot-row';
    row.style.flexWrap = 'wrap';
    row.style.maxWidth = '1200px';
    groups[r].forEach(k => {
      const node = makeNode(k);
      const flag = document.createElement('span');
      flag.textContent = NATIONS[T[k].nation].flag;
      flag.style.cssText = 'position:absolute;top:3px;right:3px;font-size:14px';
      node.style.position = 'relative';
      node.appendChild(flag);
      row.appendChild(node);
    });
    wrap.appendChild(row);
  });

  treeScroll.appendChild(wrap);
}

// ============================================================
// ДЕРЕВЬЯ НАЦИЙ
// ============================================================
function buildTreeUSA(wrap) {
  const r1 = document.createElement('div');
  r1.className = 'wot-rank';
  r1.textContent = 'РАНГ I';
  wrap.appendChild(r1);

  const t1row = document.createElement('div');
  t1row.className = 'wot-row';
  ['T0', 'T1'].forEach(k => { if (T[k]) t1row.appendChild(makeNode(k)); });
  wrap.appendChild(t1row);
  wrap.appendChild(arrowV());

  const fork = document.createElement('div');
  fork.className = 'wot-fork';
  const leftCol = document.createElement('div');
  leftCol.className = 'wot-fork-col';
  if (T['T2']) leftCol.appendChild(makeNode('T2'));
  const rightCol = document.createElement('div');
  rightCol.className = 'wot-fork-col';
  if (T['T3']) rightCol.appendChild(makeNode('T3'));
  fork.appendChild(leftCol);
  fork.appendChild(rightCol);
  wrap.appendChild(fork);

  const join = document.createElement('div');
  join.className = 'wot-split';
  join.textContent = '↘   ↙';
  wrap.appendChild(join);
  wrap.appendChild(arrowV());

  if (T['T4']) {
    const t4row = document.createElement('div');
    t4row.className = 'wot-row';
    t4row.appendChild(makeNode('T4'));
    wrap.appendChild(t4row);
    wrap.appendChild(arrowV());
  }

  const r2 = document.createElement('div');
  r2.className = 'wot-rank';
  r2.textContent = 'РАНГ II';
  wrap.appendChild(r2);

  if (T['T5']) {
    const t5row = document.createElement('div');
    t5row.className = 'wot-row';
    t5row.appendChild(makeNode('T5'));
    wrap.appendChild(t5row);
    wrap.appendChild(arrowV());
  }

  if (T['T6']) {
    const t6row = document.createElement('div');
    t6row.className = 'wot-row';
    t6row.appendChild(makeNode('T6'));
    wrap.appendChild(t6row);
    wrap.appendChild(arrowV());
  }

  const r3 = document.createElement('div');
  r3.className = 'wot-rank';
  r3.textContent = 'РАНГ III';
  wrap.appendChild(r3);

  if (T['T7']) {
    const t7row = document.createElement('div');
    t7row.className = 'wot-row';
    t7row.appendChild(makeNode('T7'));
    wrap.appendChild(t7row);
    wrap.appendChild(arrowV());
  }

  if (T['T8']) {
    const t8row = document.createElement('div');
    t8row.className = 'wot-row';
    t8row.appendChild(makeNode('T8'));
    wrap.appendChild(t8row);
    wrap.appendChild(arrowV());
  }

  if (T['T9']) {
    const t9row = document.createElement('div');
    t9row.className = 'wot-row';
    t9row.appendChild(makeNode('T9'));
    wrap.appendChild(t9row);
  }
}

function buildTreeGER(wrap) {
  const r1 = document.createElement('div');
  r1.className = 'wot-rank';
  r1.textContent = 'РАНГ I';
  wrap.appendChild(r1);

  const e1row = document.createElement('div');
  e1row.className = 'wot-row';
  if (T['E1']) e1row.appendChild(makeNode('E1'));
  wrap.appendChild(e1row);
  wrap.appendChild(arrowV());

  const fork = document.createElement('div');
  fork.className = 'wot-fork';
  const leftCol = document.createElement('div');
  leftCol.className = 'wot-fork-col';
  if (T['E10']) leftCol.appendChild(makeNode('E10'));
  const rightCol = document.createElement('div');
  rightCol.className = 'wot-fork-col';
  if (T['E2']) rightCol.appendChild(makeNode('E2'));
  fork.appendChild(leftCol);
  fork.appendChild(rightCol);
  wrap.appendChild(fork);
  wrap.appendChild(arrowV());

  if (T['E20']) {
    const e20row = document.createElement('div');
    e20row.className = 'wot-row';
    e20row.appendChild(makeNode('E20'));
    wrap.appendChild(e20row);
    wrap.appendChild(arrowV());
  }

  const r2 = document.createElement('div');
  r2.className = 'wot-rank';
  r2.textContent = 'РАНГ II';
  wrap.appendChild(r2);

  if (T['E21']) {
    const e21row = document.createElement('div');
    e21row.className = 'wot-row';
    e21row.appendChild(makeNode('E21'));
    wrap.appendChild(e21row);
    wrap.appendChild(arrowV());
  }

  if (T['E30']) {
    const e30row = document.createElement('div');
    e30row.className = 'wot-row';
    e30row.appendChild(makeNode('E30'));
    wrap.appendChild(e30row);
    wrap.appendChild(arrowV());
  }

  const r3 = document.createElement('div');
  r3.className = 'wot-rank';
  r3.textContent = 'РАНГ III';
  wrap.appendChild(r3);

  if (T['E40']) {
    const e40row = document.createElement('div');
    e40row.className = 'wot-row';
    e40row.appendChild(makeNode('E40'));
    wrap.appendChild(e40row);
    wrap.appendChild(arrowV());
  }

  if (T['E40 JPZ']) {
    const e40jrow = document.createElement('div');
    e40jrow.className = 'wot-row';
    e40jrow.appendChild(makeNode('E40 JPZ'));
    wrap.appendChild(e40jrow);
  }
}

function buildTreeUSSR(wrap) {
  const all = tanksOf('ussr').filter(k => !T[k].premium);
  if (!all.length) {
    treeScroll.innerHTML += `<div style="color:#5a7a50;padding:40px;text-align:center;font-size:18px">🚧 СССР в разработке...</div>`;
    return;
  }

  const r1 = document.createElement('div');
  r1.className = 'wot-rank';
  r1.textContent = 'РАНГ I';
  wrap.appendChild(r1);

  const su5row = document.createElement('div');
  su5row.className = 'wot-row';
  if (T['СУ5']) su5row.appendChild(makeNode('СУ5'));
  wrap.appendChild(su5row);
  wrap.appendChild(arrowV());

  if (T['СУ10']) {
    const su10row = document.createElement('div');
    su10row.className = 'wot-row';
    su10row.appendChild(makeNode('СУ10'));
    wrap.appendChild(su10row);
    wrap.appendChild(arrowV());
  }

  const r2 = document.createElement('div');
  r2.className = 'wot-rank';
  r2.textContent = 'РАНГ II';
  wrap.appendChild(r2);

  if (T['СУ15']) {
    const su15row = document.createElement('div');
    su15row.className = 'wot-row';
    su15row.appendChild(makeNode('СУ15'));
    wrap.appendChild(su15row);
  }
}

function buildTreeFlat(nation, wrap) {
  const all = tanksOf(nation).filter(k => !T[k].premium);
  if (!all.length) {
    treeScroll.innerHTML += `<div style="color:#5a7a50;padding:40px;text-align:center;font-size:18px">🚧 В разработке...</div>`;
    return;
  }
  const r1 = document.createElement('div');
  r1.className = 'wot-rank';
  r1.textContent = 'ТАНКИ';
  wrap.appendChild(r1);
  const row = document.createElement('div');
  row.className = 'wot-row';
  row.style.flexWrap = 'wrap';
  all.forEach(k => row.appendChild(makeNode(k)));
  wrap.appendChild(row);
}

// ============================================================
// TTX (тултип)
// ============================================================
const ttxCard = document.getElementById('ttxCard');

function showTTX(k, e) {
  const d = T[k];
  const roleTag = d.role === 'PT' ? 'ПТ-САУ' : (d.role === 'LT' ? 'ЛТ' : 'СТ');
  const cc = { ST: '#8aee7a', PT: '#ffaa60', LT: '#6ac9e0' };
  const classColor = cc[d.role] || '#8aee7a';
  const specials = [];
  if (d.special.isPT) specials.push('🐍 ПТ-САУ: рубка сзади, ствол ±10°');
  if (d.special.mgOn) specials.push('🔫 Пулемёт: SHIFT, урон ' + d.special.mgDmg + ', ±15° от корпуса, перегрев 5с');
  if (d.special.sniperOn) specials.push('🎯 Снайперка: урон ×' + d.special.sniperMult + ', пробитие 1, КД ' + (d.special.sniperCdMax / 60).toFixed(1) + 'с');
  if (d.premium) specials.push('💎 Премиум — только из лутбокса');
  const specialTag = specials.length ? '<div class="tt-special">' + specials.join('<br>') + '</div>' : '';

  ttxCard.innerHTML = `
    <div class="tt-name">${d.icon} ${d.name}</div>
    <div class="tt-proj">📐 Projekt Nr ${d.projNum}</div>
    <div class="tt-class" style="color:${classColor};background:rgba(80,120,60,.25);border:1px solid ${classColor}">🎖 ${roleTag}</div>
    <div class="tt-row"><span>❤️ HP:</span><b>${d.combat.hp}</b></div>
    <div class="tt-row"><span>🛡️ Броня:</span><b>${d.combat.armor.join('/')}</b></div>
    <div class="tt-row"><span>🔫 Урон:</span><b>${d.combat.dmg}</b></div>
    <div class="tt-row"><span>🎯 Пробитие:</span><b>${d.combat.pen}</b></div>
    <div class="tt-row"><span>💥 Пушек:</span><b>${d.combat.guns}</b></div>
    <div class="tt-row"><span>🕒 КД:</span><b>${(d.combat.cd / 60).toFixed(2)}с</b></div>
    <div class="tt-row"><span>⚡ Скорость:</span><b>${d.combat.spd}</b></div>
    <div class="tt-row"><span>↩️ Задний ход:</span><b>${d.combat.rspd.toFixed(1)}</b></div>
    <div class="tt-row"><span>🔄 Манёвренность:</span><b>${d.combat.mvr.toFixed(2)}×</b></div>
    <div class="tt-row"><span>🎯 Разброс:</span><b>${Math.round(d.combat.sMin * 180 / Math.PI)}°-${Math.round(d.combat.sMax * 180 / Math.PI)}°</b></div>
    <div class="tt-cost">${d.premium ? '💎 Лутбокс' : '⭐ ' + d.research.costExp + '  🪙 ' + d.research.costCoins}</div>
    ${specialTag}`;
  ttxCard.classList.add('on');
  moveTTX(e);
}

function moveTTX(e) {
  ttxCard.style.left = (e.clientX + 15) + 'px';
  ttxCard.style.top = (e.clientY + 15) + 'px';
  const r = ttxCard.getBoundingClientRect();
  if (r.right > innerWidth) ttxCard.style.left = (e.clientX - r.width - 15) + 'px';
  if (r.bottom > innerHeight) ttxCard.style.top = (e.clientY - r.height - 15) + 'px';
}

function hideTTX() { ttxCard.classList.remove('on'); }
function forceHideTTX() { ttxCard.classList.remove('on'); ttxCard.innerHTML = ''; }

// ============================================================
// ОТКРЫТИЕ/ЗАКРЫТИЕ ДЕРЕВА
// ============================================================
function openTree() { tree.classList.add('open'); renderTreeNations(); renderTree(); }
function closeTree() { forceHideTTX(); tree.classList.remove('open'); }

// ============================================================
// ЛУТБОКС
// ============================================================
const LOOT_COST = 10;
const LOOT_DUP_GOLD = 100;
const EMPTY_KEY = '__EMPTY__';
let spinning = false;

function getPremiumKeys() {
  return Object.keys(T).filter(k => T[k].premium > 0);
}

function openLootbox() {
  if (spinning) return;
  lootbox.classList.add('open');
  lootResult.textContent = '';
  lootResult.className = 'loot-result';
  renderLootTrack();
  updateLootBtn();
}

function closeLootbox() {
  if (spinning) return;
  lootbox.classList.remove('open');
}

function updateLootBtn() {
  lootBtn.textContent = `🎲 Крутить (${LOOT_COST}💰)`;
  if (P.gold < LOOT_COST) {
    lootBtn.disabled = true;
    lootBtn.style.opacity = 0.5;
    lootBtn.style.cursor = 'not-allowed';
  } else {
    lootBtn.disabled = false;
    lootBtn.style.opacity = 1;
    lootBtn.style.cursor = 'pointer';
  }
}

function randomLootCell() {
  const pk = getPremiumKeys();
  if (!pk.length) return EMPTY_KEY;
  const r = Math.random();
  if (r < 0.30) return EMPTY_KEY;
  return pk[Math.floor(Math.random() * pk.length)];
}

function makeLootCellHtml(key, winner) {
  const div = document.createElement('div');
  div.className = 'loot-item';
  if (key === EMPTY_KEY) {
    div.classList.add('empty');
    div.innerHTML = `<span class="li-icon">❌</span><div class="li-name">Пусто</div><div class="li-proj">&nbsp;</div>`;
  } else {
    const d = T[key];
    if (winner) div.style.background = 'rgba(80,140,60,.7)';
    div.innerHTML = `<span class="li-icon">${d.icon}</span><div class="li-name">${d.name}</div><div class="li-proj">Projekt Nr ${d.projNum}</div>`;
  }
  return div;
}

function renderLootTrack() {
  const track = document.getElementById('lootTrack');
  track.innerHTML = '';
  track.style.transition = 'none';
  track.style.transform = 'translateX(0)';
  for (let i = 0; i < 40; i++) {
    track.appendChild(makeLootCellHtml(randomLootCell(), false));
  }
}

function spinLootbox() {
  if (spinning) return;
  if (P.gold < LOOT_COST) { showCheat('❌ Нужно ' + LOOT_COST + '💰'); return; }
  spinning = true;
  P.gold -= LOOT_COST;
  save();
  updateCoins();
  updateLootBtn();
  lootResult.textContent = '';
  lootResult.className = 'loot-result';

  const pk = getPremiumKeys();
  const rolls = [];
  pk.forEach(k => {
    if (Math.random() < 0.03) rolls.push(k);
  });
  let resultKey = null;
  if (rolls.length > 0) {
    resultKey = rolls[Math.floor(Math.random() * rolls.length)];
  }

  const track = document.getElementById('lootTrack');
  track.innerHTML = '';
  track.style.transition = 'none';
  track.style.transform = 'translateX(0)';

  const beforeCount = 25;
  const winnerIdx = beforeCount;
  const finalKey = resultKey || EMPTY_KEY;

  for (let i = 0; i < beforeCount; i++) {
    track.appendChild(makeLootCellHtml(randomLootCell(), false));
  }
  track.appendChild(makeLootCellHtml(finalKey, true));
  for (let i = 0; i < 10; i++) {
    track.appendChild(makeLootCellHtml(randomLootCell(), false));
  }

  const itemW = 130;
  const containerW = track.parentElement.clientWidth;
  const targetX = -(winnerIdx * itemW) - (itemW / 2) + (containerW / 2);
  const jitter = (Math.random() - 0.5) * 20;

  setTimeout(() => {
    track.style.transition = 'transform 4s cubic-bezier(.15,.7,.3,1)';
    track.style.transform = `translateX(${targetX + jitter}px)`;
  }, 50);

  setTimeout(() => {
    if (resultKey) {
      if (P.unlocked.includes(resultKey)) {
        P.gold += LOOT_DUP_GOLD;
        lootResult.textContent = `💎 ${T[resultKey].name} (дубликат) → +${LOOT_DUP_GOLD}💰`;
        lootResult.className = 'loot-result dup';
      } else {
        P.unlocked.push(resultKey);
        P.texp[resultKey] = 0;
        P.tkills[resultKey] = 0;
        lootResult.textContent = `🎉 ВЫПАЛ: ${T[resultKey].name}!`;
        lootResult.className = 'loot-result';
      }
    } else {
      lootResult.textContent = `😢 Пусто. Попробуй ещё!`;
      lootResult.className = 'loot-result empty';
    }
    save();
    updateCoins();
    updateLootBtn();
    spinning = false;
  }, 4100);
}

// ============================================================
// ЧИТЫ
// ============================================================
let cb = '';
function cheat(k) {
  cb = (cb + k.toLowerCase()).slice(-4);
  if (cb.includes('ячсм') || cb.includes('zxcv')) {
    P.exp += 1e6; P.coins += 1e6; P.gold += 1e6;
    P.texp[curT] = (P.texp[curT] || 0) + 1e6;
    save();
    showCheat('✅ +1M (⭐ 🪙 💰)');
    cb = '';
    return;
  }
  if (cb.includes('мсчя') || cb.includes('vcxz')) {
    const pk = getPremiumKeys();
    pk.forEach(k => {
      if (!P.unlocked.includes(k)) {
        P.unlocked.push(k);
        P.texp[k] = 0;
        P.tkills[k] = 0;
      }
    });
    save();
    showCheat('💎 ВСЕ ПРЕМИУМЫ ОТКРЫТЫ!');
    cb = '';
    return;
  }
}

function showCheat(t) {
  const e = document.createElement('div');
  e.id = 'cheat';
  e.textContent = t;
  document.body.appendChild(e);
  setTimeout(() => e.remove(), 1500);
}

// ============================================================
// HUD
// ============================================================
function updateHUD() {
  tN.textContent = curT;
  const e = P.texp[curT] || 0;
  exF.style.width = Math.min(e % 100, 100) + '%';
  exT.textContent = Math.floor(e % 100) + '/100';
}
function updateCoins() { hC.textContent = P.coins; hG.textContent = P.gold; }
// ============================================================
// ИГРА — ПЕРЕМЕННЫЕ
// ============================================================
const cv = document.getElementById('c');
const cx = cv.getContext('2d');
let W, H, WW, WH;

function resize() {
  W = cv.width = innerWidth;
  H = cv.height = innerHeight;
  if (currentMap === 'corridor') { WW = Math.max(2400, W * 1.2); WH = Math.max(800, H * 0.9); }
  else if (currentMap === 'team7v7') { WW = 2400; WH = 2400; }
  else { WW = Math.max(2000, W * 1.6); WH = Math.max(1500, H * 1.6); }
}
addEventListener('resize', resize);

let P_ = { x: 0, y: 0, a: 0, hp: 500, max: 500, ta: 0, cd: 0, mgCd: 0, mgHeat: 100, mgHeatBlock: 0, sniperCd: 0 };
let bullets = [], enemies = [], allies = [], obs = [], score = 0, over = false;
let mx = 0, my = 0, cam = { x: 0, y: 0 }, inG = false, ftxt = [], spread = 0;
let battleTime = 0, teamMode = false, killsEnemies = 0, killsAllies = 0, playerDead = false;

const K = { w: 0, a: 0, s: 0, d: 0, ц: 0, ф: 0, ы: 0, в: 0, shift: 0 };
const PR = 22, ER = 20, BR = 5, MAXE = 7, RISE = 240, FALL = 60;
const PT_MAX_TURRET = 10 * Math.PI / 180;
const MG_SPREAD = 15 * Math.PI / 180;
const BASE_ROT = 0.030;
const SPAWN_MARGIN = 80;
const rnd = (a, b) => Math.random() * (b - a) + a;
const dst = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cl = (v, a, b) => Math.max(a, Math.min(b, v));

// ============================================================
// ХЕЛПЕРЫ
// ============================================================
function getArmorFromAngle(attackerAngle, defenderAngle, armor) {
  let diff = attackerAngle - defenderAngle;
  diff = ((diff % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  const deg = Math.abs(diff * 180 / Math.PI);
  if (deg > 135) return { armor: armor[0], dir: 'ЛОБ' };
  if (deg < 45) return { armor: armor[2], dir: 'КОРМА' };
  return { armor: armor[1], dir: 'БОРТ' };
}

function calcHit(ang, def, dmg, pen) {
  if (!def || typeof def !== 'object') return { dmg: 0 };
  const defA = isFinite(def.a) ? def.a : 0;
  const result = getArmorFromAngle(ang, defA, def.armor || [2, 1, 1]);
  const armor = result.armor;
  const v = 1 + (Math.random() * 2 - 1) * 0.25;
  const fd = Math.round(dmg * v);
  let actual = 0, rico = false;
  if (pen >= armor) actual = fd;
  else if (Math.random() < 0.10) actual = fd;
  else if (Math.random() < 0.05) rico = true;
  return { dmg: actual, armor, dir: result.dir, rico };
}

function calcMgHit(ang, def, dmg) {
  if (!def || typeof def !== 'object') return { dmg: 0 };
  const defA = isFinite(def.a) ? def.a : 0;
  const result = getArmorFromAngle(ang, defA, def.armor || [2, 1, 1]);
  const armor = result.armor;
  let chance = 0.05;
  if (armor <= 1) chance = 0.15;
  else if (armor <= 3) chance = 0.10;
  const fd = Math.round(dmg * (0.85 + Math.random() * 0.3));
  const actual = Math.random() < chance ? fd : 0;
  return { dmg: actual, armor, dir: result.dir };
}

function rotateTowards(current, target, maxDelta) {
  let diff = target - current;
  diff = ((diff % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  if (Math.abs(diff) <= maxDelta) return target;
  return current + Math.sign(diff) * maxDelta;
}

function resolveCollision(a, b, r1, r2) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  const minD = r1 + r2;
  if (d < minD && d > 0.01) {
    const overlap = (minD - d) / 2;
    const nx = dx / d, ny = dy / d;
    a.x -= nx * overlap; a.y -= ny * overlap;
    b.x += nx * overlap; b.y += ny * overlap;
  }
}

function isFree(x, y, r) {
  if (x < r || x > WW - r || y < r || y > WH - r) return false;
  for (let o of obs) {
    if (x > o.x - r && x < o.x + o.w + r && y > o.y - r && y < o.y + o.h + r) return false;
  }
  return true;
}

function rayCast(x, y, angle, dist, r) {
  const step = 8;
  let travelled = 0;
  while (travelled < dist) {
    travelled += step;
    const nx = x + Math.cos(angle) * travelled;
    const ny = y + Math.sin(angle) * travelled;
    if (!isFree(nx, ny, r)) return travelled - step;
  }
  return dist;
}

// ============================================================
// ГЕНЕРАЦИЯ КАРТ
// ============================================================
function obsGen() {
  obs = [];
  if (currentMap === 'corridor') {
    const wt = 40;
    obs.push({ x: 0, y: 0, w: WW, h: wt });
    obs.push({ x: 0, y: WH - wt, w: WW, h: wt });
    for (let i = 0; i < 10; i++) {
      const w = rnd(50, 100), h = rnd(50, 100);
      let x, y, tr = 0;
      do {
        x = rnd(SPAWN_MARGIN + 50, WW - SPAWN_MARGIN - 50 - w);
        y = rnd(wt + 30, WH - wt - h - 30);
        tr++;
      } while (Math.hypot(x + w/2 - WW/2, y + h/2 - WH/2) < 250 && tr < 50);
      obs.push({ x, y, w, h });
    }
  } else if (currentMap === 'open') {
    for (let i = 0; i < 18; i++) {
      const w = rnd(50, 120), h = rnd(50, 120);
      let x, y, tr = 0;
      do {
        x = rnd(SPAWN_MARGIN, WW - SPAWN_MARGIN - w);
        y = rnd(SPAWN_MARGIN, WH - SPAWN_MARGIN - h);
        tr++;
      } while (Math.hypot(x + w/2 - WW/2, y + h/2 - WH/2) < 300 && tr < 50);
      obs.push({ x, y, w, h });
    }
  } else if (currentMap === 'team7v7') {
    const wt = 60;
    obs.push({ x: 0, y: 0, w: WW, h: wt });
    obs.push({ x: 0, y: WH - wt, w: WW, h: wt });
    obs.push({ x: 0, y: 0, w: wt, h: WH });
    obs.push({ x: WW - wt, y: 0, w: wt, h: WH });
    const bs = 100, gp = 140, cell = bs + gp;
    const startX = wt + 300, startY = wt + 300;
    const endX = WW - wt - 300, endY = WH - wt - 300;
    const cols = Math.floor((endX - startX) / cell);
    const rows = Math.floor((endY - startY) / cell);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const bx = startX + i * cell;
        const by = startY + j * cell;
        const cxx = bx + bs / 2, cyy = by + bs / 2;
        const midX = WW / 2, midY = WH / 2;
        if (Math.abs(cxx - midX) < 350 && Math.abs(cyy - midY) < 350) continue;
        if (cxx < 700 && Math.abs(cyy - midY) < 400) continue;
        if (cxx > WW - 700 && Math.abs(cyy - midY) < 400) continue;
        if (Math.random() < 0.40) continue;
        obs.push({ x: bx, y: by, w: bs, h: bs });
      }
    }
  }
}

// ============================================================
// ВЫБОР ВРАГОВ
// ============================================================
function getEnemyNation() {
  const playerNation = T[curT].nation;
  const valid = Object.keys(NATIONS).filter(n => n !== playerNation && tanksOf(n).filter(k => !T[k].premium).length > 0);
  if (!valid.length) return null;
  return valid[Math.floor(Math.random() * valid.length)];
}

function eType() {
  const playerRank = T[curT].rank || 1;
  const enemyNation = getEnemyNation();
  if (!enemyNation) return null;
  const allEnemies = tanksOf(enemyNation).filter(k => !T[k].premium);
  let allowedRanks;
  if (playerRank === 1) allowedRanks = [1];
  else if (playerRank === 2) allowedRanks = [2];
  else allowedRanks = [3];
  let available = allEnemies.filter(k => allowedRanks.includes(T[k].rank || 1));
  if (!available.length) available = allEnemies;
  if (!available.length) return null;
  const weighted = [];
  available.forEach(k => {
    const r = T[k].rank || 1;
    let w = 10;
    if (playerRank === 2 && r === 1) w = 2;
    if (playerRank === 3 && r === 2) w = 2;
    if (playerRank === 3 && r === 1) w = 0;
    for (let i = 0; i < w; i++) weighted.push(k);
  });
  if (!weighted.length) return available[0];
  return weighted[Math.floor(Math.random() * weighted.length)];
}

function allyType() {
  const playerNation = T[curT].nation;
  const playerRank = T[curT].rank || 1;
  const all = tanksOf(playerNation).filter(k => !T[k].premium && (T[k].rank || 1) === playerRank);
  if (!all.length) return curT;
  return all[Math.floor(Math.random() * all.length)];
}

function eStats(type) {
  const d = T[type];
  return {
    hp: d.enemy.hp, armor: d.combat.armor, dmg: Math.round(d.combat.dmg * 0.7), pen: d.combat.pen,
    cd: Math.round(d.combat.cd * 1.5), guns: d.combat.guns,
    spd: 1.3, bs: d.combat.bs, r: ER,
    cR: d.enemy.coins, eR: d.enemy.exp,
    sMin: d.combat.sMin, sMax: d.combat.sMax,
    isPT: d.special.isPT, look: d.look, mvr: d.combat.mvr,
    mgDmg: d.special.mgDmg, mgOn: d.special.mgOn,
    sniperOn: d.special.sniperOn, sniperMult: d.special.sniperMult, sniperCdMax: d.special.sniperCdMax
  };
}

function allyStats(type) {
  const s = eStats(type);
  s.hp = Math.round(s.hp * 1.1);
  return s;
}

function makeUnit(x, y, type, isEnemy) {
  const s = isEnemy ? eStats(type) : allyStats(type);
  return {
    x, y, a: isEnemy ? Math.PI : 0, ta: isEnemy ? Math.PI : 0, cd: 0,
    hp: s.hp, max: s.hp, r: s.r, type, stats: s, sp: 0, mv: false,
    isPT: s.isPT, look: s.look, mvr: s.mvr,
    mgCd: 0, mgHeat: 100, mgHeatBlock: 0, sniperCd: 0,
    mgOn: s.mgOn, mgDmg: s.mgDmg,
    sniperOn: s.sniperOn, sniperMult: s.sniperMult, sniperCdMax: s.sniperCdMax,
    isEnemy,
    _stuckTimer: 0, _lastX: x, _lastY: y, _lastA: 0,
    _wallFollowUntil: 0, _wallSide: 0, _escapeTarget: null, _escapeFrames: 0
  };
}

function findNearestEnemyTo(x, y) {
  let best = null, bestD = Infinity;
  if (!playerDead && inG) {
    const d = Math.hypot(P_.x - x, P_.y - y);
    if (d < bestD) { bestD = d; best = { x: P_.x, y: P_.y, ref: 'player' }; }
  }
  allies.forEach(a => {
    if (a.hp <= 0) return;
    const d = Math.hypot(a.x - x, a.y - y);
    if (d < bestD) { bestD = d; best = a; }
  });
  return best;
}

function findNearestFriendlyTo(x, y) {
  let best = null, bestD = Infinity;
  enemies.forEach(e => {
    if (e.hp <= 0) return;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < bestD) { bestD = d; best = e; }
  });
  return best;
}

// ============================================================
// СПАВН ЮНИТОВ
// ============================================================
function makeEnemySpawn() {
  if (currentMap === 'corridor') {
    const side = Math.random() < 0.5 ? 'L' : 'R';
    const edgeW = 300;
    let x, y;
    if (side === 'L') x = rnd(SPAWN_MARGIN + 20, SPAWN_MARGIN + edgeW);
    else x = rnd(WW - SPAWN_MARGIN - edgeW, WW - SPAWN_MARGIN - 20);
    y = rnd(SPAWN_MARGIN + 20, WH - SPAWN_MARGIN - 20);
    return { x, y };
  } else if (currentMap === 'open') {
    const side = Math.floor(Math.random() * 4);
    const band = 350;
    let x, y;
    if (side === 0) { x = rnd(SPAWN_MARGIN, SPAWN_MARGIN + band); y = rnd(SPAWN_MARGIN, WH - SPAWN_MARGIN); }
    else if (side === 1) { x = rnd(WW - SPAWN_MARGIN - band, WW - SPAWN_MARGIN); y = rnd(SPAWN_MARGIN, WH - SPAWN_MARGIN); }
    else if (side === 2) { x = rnd(SPAWN_MARGIN, WW - SPAWN_MARGIN); y = rnd(SPAWN_MARGIN, SPAWN_MARGIN + band); }
    else { x = rnd(SPAWN_MARGIN, WW - SPAWN_MARGIN); y = rnd(WH - SPAWN_MARGIN - band, WH - SPAWN_MARGIN); }
    return { x, y };
  } else if (currentMap === 'team7v7') {
    const x = rnd(WW - 400, WW - SPAWN_MARGIN - 20);
    const y = rnd(WH / 2 - 400, WH / 2 + 400);
    return { x, y };
  }
  return { x: 100, y: 100 };
}

function makeAllySpawn() {
  if (currentMap === 'team7v7') {
    const x = rnd(SPAWN_MARGIN + 20, 400);
    const y = rnd(WH / 2 - 400, WH / 2 + 400);
    return { x, y };
  }
  return { x: 100, y: 100 };
}

let spawnCnt = 0;

function spawnE() {
  spawnCnt++;
  if (spawnCnt > 100) { spawnCnt = 0; return; }
  if (enemies.length >= MAXE || over || !inG) return;
  const t = eType();
  if (!t) return;
  let x, y, ok = false;
  for (let i = 0; i < 80; i++) {
    const pos = makeEnemySpawn();
    x = pos.x; y = pos.y;
    const s = eStats(t);
    if (Math.hypot(x - P_.x, y - P_.y) < 400) continue;
    if (!isFree(x, y, s.r)) continue;
    ok = true; break;
  }
  if (!ok) return;
  enemies.push(makeUnit(x, y, t, true));
}

function spawnAlly() {
  if (allies.length >= MAXE) return;
  const t = allyType();
  let x, y, ok = false;
  for (let i = 0; i < 80; i++) {
    const pos = makeAllySpawn();
    x = pos.x; y = pos.y;
    const s = allyStats(t);
    if (Math.hypot(x - P_.x, y - P_.y) < 100) continue;
    if (!isFree(x, y, s.r)) continue;
    ok = true; break;
  }
  if (!ok) return;
  allies.push(makeUnit(x, y, t, false));
}

// ============================================================
// СТАРТ БОЯ
// ============================================================
function start(mapType) {
  currentMap = mapType || 'corridor';
  closeMapSelect();
  resize();
  const d = T[curT];
  teamMode = (currentMap === 'team7v7');
  playerDead = false;
  killsEnemies = 0;
  killsAllies = 0;
  let px, py;
  if (currentMap === 'team7v7') { px = 300; py = WH / 2; }
  else { px = WW / 2; py = WH / 2; }
  P_ = { x: px, y: py, a: 0, hp: d.combat.hp, max: d.combat.hp, ta: 0, cd: 0, mgCd: 0, mgHeat: 100, mgHeatBlock: 0, sniperCd: 0 };
  bullets = []; enemies = []; allies = []; obsGen();
  score = 0; over = false; inG = true; ftxt = []; spawnCnt = 0; spread = 0;
  battleTime = 0;
  mx = P_.x + 100; my = P_.y;
  updateHPUI();
  sc.textContent = '0';
  cam.x = cl(P_.x - W / 2, 0, WW - W);
  cam.y = cl(P_.y - H / 2, 0, WH - H);
  const initialEnemies = teamMode ? 7 : 4;
  for (let i = 0; i < initialEnemies; i++) spawnE();
  if (teamMode) for (let i = 0; i < 6; i++) spawnAlly();
  eC.textContent = teamMode ? (allies.length + 1 + '/' + enemies.length) : enemies.length;
  updateHUD(); updateCoins(); updateTimer();
  g.classList.add('hide');
  hud.classList.remove('hide');
  tree.classList.remove('open');
  lootbox.classList.remove('open');
  battleEnd.classList.remove('open');
}

function toGarage() {
  inG = false; over = false; ftxt = [];
  g.classList.remove('hide');
  hud.classList.add('hide');
  tree.classList.remove('open');
  lootbox.classList.remove('open');
  battleEnd.classList.remove('open');
  forceHideTTX();
  renderGarage();
}

function closeBattleEnd() { battleEnd.classList.remove('open'); toGarage(); }

function showBattleEnd(win) {
  over = true;
  const title = document.getElementById('battleEndTitle');
  const stats = document.getElementById('battleEndStats');
  if (win) {
    title.textContent = '🏆 ПОБЕДА!';
    title.className = 'win';
    if (teamMode) { P.exp += 100; P.coins += 100; save(); }
    stats.innerHTML = `Убито врагов: <b>${killsEnemies}</b><br>Потеряно союзников: <b>${killsAllies}</b><br>${teamMode ? '+100⭐ +100🪙 за победу!' : ''}`;
  } else {
    title.textContent = '💀 ПОРАЖЕНИЕ';
    title.className = 'lose';
    stats.innerHTML = `Убито врагов: <b>${killsEnemies}</b><br>Потеряно союзников: <b>${killsAllies}</b>`;
  }
  battleEnd.classList.add('open');
}

function updateHPUI() {
  hpD.textContent = Math.floor(P_.hp);
  hpF.style.width = Math.min(P_.hp / P_.max * 100, 100) + '%';
}

function updateTimer() {
  const sec = Math.floor(battleTime / 60);
  const mm = Math.floor(sec / 60);
  const ss = sec % 60;
  tm.textContent = mm + ':' + (ss < 10 ? '0' : '') + ss;
}

function shoot() {
  if (!inG || over || P_.cd > 0 || playerDead) return;
  const d = T[curT];
  const cur = d.combat.sMin + (d.combat.sMax - d.combat.sMin) * spread;
  for (let g = 0; g < d.combat.guns; g++) {
    let off = (Math.random() < .75) ? (Math.random() - .5) * cur * 2 : 0;
    const fa = P_.ta + off;
    bullets.push({
      x: P_.x + Math.cos(fa) * 28, y: P_.y + Math.sin(fa) * 28,
      vx: Math.cos(fa) * d.combat.bs, vy: Math.sin(fa) * d.combat.bs,
      r: BR, enemy: 0, dmg: d.combat.dmg, pen: d.combat.pen, ang: fa, owner: 'player'
    });
  }
  P_.cd = d.combat.cd;
}

function addT(x, y, text, color, size) {
  if (ftxt.length > 30) ftxt.shift();
  ftxt.push({ x, y, text, color, size, life: 60, max: 60, vy: -1.5 });
}
// ============================================================
// ДВИЖЕНИЕ ЮНИТА (умный обход препятствий)
// ============================================================
function moveUnit(e, target, dtP) {
  const mvr = e.mvr || 1.0;
  if (!target) return;
  if (e._stuckTimer === undefined) e._stuckTimer = 0;
  if (e._lastX === undefined) { e._lastX = e.x; e._lastY = e.y; }
  if (e._lastA === undefined) e._lastA = e.a;
  if (e._wallFollowUntil === undefined) e._wallFollowUntil = 0;
  if (e._wallSide === undefined) e._wallSide = 0;
  if (e._escapeTarget === undefined) e._escapeTarget = null;
  if (e._escapeFrames === undefined) e._escapeFrames = 0;

  if (e._wallFollowUntil > 0) e._wallFollowUntil--;

  const movedDist = Math.hypot(e.x - e._lastX, e.y - e._lastY);
  const rotatedDist = Math.abs(e.a - e._lastA);
  const isRot = rotatedDist > 0.008;

  if (movedDist < 0.3 && !isRot && e._escapeTarget === null) e._stuckTimer++;
  else e._stuckTimer = Math.max(0, e._stuckTimer - 2);

  e._lastX = e.x; e._lastY = e.y; e._lastA = e.a;

  const stuckLimit = e.isPT ? 200 : 150;

  if (e._escapeTarget !== null) {
    e._escapeFrames++;
    e.a = rotateTowards(e.a, e._escapeTarget, BASE_ROT * mvr * 1.2);
    let dd = e._escapeTarget - e.a;
    dd = ((dd % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    if (Math.abs(dd) < 0.15 || e._escapeFrames > 120) {
      e._escapeTarget = null;
      e._escapeFrames = 0;
      e._stuckTimer = 0;
      e._wallFollowUntil = 60;
      e._wallSide = Math.random() < 0.5 ? -1 : 1;
    }
    return;
  }

  if (e._stuckTimer > stuckLimit) {
    const testAngles = [
      e.a - Math.PI, e.a - Math.PI * 0.75, e.a - Math.PI / 2,
      e.a + Math.PI / 2, e.a + Math.PI * 0.75, e.a + Math.PI
    ];
    let bestAngle = e.a + Math.PI;
    let bestClear = -1;
    const testDist = 100 + e.r * 2;
    for (let ta of testAngles) {
      const clear = rayCast(e.x, e.y, ta, testDist, e.r);
      if (clear > bestClear) { bestClear = clear; bestAngle = ta; }
    }
    e._escapeTarget = bestAngle;
    e._escapeFrames = 0;
    return;
  }

  const dx = target.x - e.x;
  const dy = target.y - e.y;
  const distToTarget = Math.hypot(dx, dy);

  // Если цель близко — задний ход (не разворачиваемся)
  if (distToTarget < 200) {
    const targetA = Math.atan2(dy, dx);
    let da = targetA - e.a;
    da = ((da % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    const rs = BASE_ROT * mvr * (e.isPT ? 0.8 : 1.2);
    if (Math.abs(da) > 0.1) {
      e.a += Math.sign(da) * Math.min(Math.abs(da), rs);
    } else {
      const rspd = e.stats.rspd || (e.stats.spd / 1.5);
      const mdx = -Math.cos(e.a) * rspd;
      const mdy = -Math.sin(e.a) * rspd;
      let nx = e.x + mdx, ny = e.y + mdy;
      let blk = false;
      for (let o of obs) {
        if (nx > o.x - e.r && nx < o.x + o.w + e.r && ny > o.y - e.r && ny < o.y + o.h + e.r) { blk = true; break; }
      }
      if (!blk) {
        if (nx > e.r && nx < WW - e.r) e.x = nx;
        if (ny > e.r && ny < WH - e.r) e.y = ny;
      }
    }
    const dd = e.a - (e._lastA || e.a);
    if (Math.abs(dd) > 0.001) e.ta += dd;
    return;
  }

  let desA;
  if (dtP > 250) desA = Math.atan2(dy, dx);
  else return;

  const pd = (60 + e.r * 2) * (e.isPT ? 1.4 : 1.1);
  const fc = rayCast(e.x, e.y, desA, pd, e.r);
  let mA;

  if (fc >= pd - 5) {
    mA = desA;
    e._wallFollowUntil = 0;
  } else {
    const os = [0, -0.4, 0.4, -0.8, 0.8, -1.2, 1.2, -1.6, 1.6];
    let ba = desA, bc = -Infinity;
    for (let o of os) {
      const tt = desA + o;
      const c = rayCast(e.x, e.y, tt, pd, e.r);
      const s = c - Math.abs(o) * 5;
      if (s > bc) { bc = s; ba = tt; }
    }
    mA = ba;
    let df = mA - desA;
    df = ((df % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    if (Math.abs(df) > 0.3) {
      e._wallSide = Math.sign(df);
      e._wallFollowUntil = 40;
    }
  }

  const rs = BASE_ROT * mvr * (e.isPT ? 0.8 : 1.2);
  const oA = e.a;
  let df = mA - e.a;
  df = ((df % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;

  if (Math.abs(df) > 0.2) {
    e.a += Math.sign(df) * Math.min(Math.abs(df), rs);
    const nx = e.x + Math.cos(e.a) * e.stats.spd * 0.5;
    const ny = e.y + Math.sin(e.a) * e.stats.spd * 0.5;
    let cm = true;
    for (let o of obs) {
      if (nx > o.x - e.r && nx < o.x + o.w + e.r && ny > o.y - e.r && ny < o.y + o.h + e.r) { cm = false; break; }
    }
    if (cm) {
      if (nx > e.r && nx < WW - e.r) e.x = nx;
      if (ny > e.r && ny < WH - e.r) e.y = ny;
    }
  } else {
    const dx2 = Math.cos(e.a) * e.stats.spd;
    const dy2 = Math.sin(e.a) * e.stats.spd;
    let nx = e.x + dx2, ny = e.y + dy2;
    let blk = false;
    for (let o of obs) {
      if (nx > o.x - e.r && nx < o.x + o.w + e.r && ny > o.y - e.r && ny < o.y + o.h + e.r) { blk = true; break; }
    }
    if (!blk) {
      if (nx > e.r && nx < WW - e.r) e.x = nx;
      if (ny > e.r && ny < WH - e.r) e.y = ny;
    } else {
      e.a += 0.05 * (e._wallSide || 1);
    }
  }

  const dd = e.a - oA;
  if (Math.abs(dd) > 0.001) e.ta += dd;
}

// ============================================================
// ИИ ЮНИТА
// ============================================================
function unitAI(e, isEnemy) {
  let target;
  if (isEnemy) target = findNearestEnemyTo(e.x, e.y);
  else target = findNearestFriendlyTo(e.x, e.y);
  if (!target) return;

  const tx = target.x, ty = target.y;
  const dtP = Math.hypot(tx - e.x, ty - e.y);
  const targetA = Math.atan2(ty - e.y, tx - e.x);
  const eTurretSpeed = BASE_ROT * (e.mvr || 1.0) * 1.2;

  // Поворот орудия
  if (e.isPT) {
    let tr = targetA - e.a;
    tr = ((tr % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    tr = cl(tr, -PT_MAX_TURRET, PT_MAX_TURRET);
    const ct = e.a + tr;
    e.ta = rotateTowards(e.ta, ct, eTurretSpeed);
    let cr = e.ta - e.a;
    cr = ((cr % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    if (Math.abs(cr) > PT_MAX_TURRET) {
      cr = cl(cr, -PT_MAX_TURRET, PT_MAX_TURRET);
      e.ta = e.a + cr;
    }
  } else {
    e.ta = rotateTowards(e.ta, targetA, eTurretSpeed);
  }

  e.mv = dtP > 200;
  if (e.mv) e.sp = Math.min(1, (e.sp || 0) + .02);
  else e.sp = Math.max(0, (e.sp || 0) - .03);

  // Движение
  if (e.isPT) {
    let rt = targetA - e.a;
    rt = ((rt % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    const inArc = Math.abs(rt) <= PT_MAX_TURRET + 0.05;
    if (inArc && dtP < 500) {
      // стоим и стреляем
    } else {
      const td = Math.atan2(ty - e.y, tx - e.x);
      const pd = 80 + e.r * 2;
      const fc = rayCast(e.x, e.y, td, pd, e.r);
      if (fc < pd - 20) {
        moveUnit(e, { x: tx, y: ty }, dtP);
      } else {
        let da = td - e.a;
        da = ((da % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
        const rs = BASE_ROT * (e.mvr || 1.0) * 1.2;
        if (Math.abs(da) > 0.1) {
          e.a += Math.sign(da) * Math.min(Math.abs(da), rs);
        } else {
          const dx = Math.cos(e.a) * e.stats.spd * 0.8;
          const dy = Math.sin(e.a) * e.stats.spd * 0.8;
          let nx = e.x + dx, ny = e.y + dy;
          let blk = false;
          for (let o of obs) {
            if (nx > o.x - e.r && nx < o.x + o.w + e.r && ny > o.y - e.r && ny < o.y + o.h + e.r) { blk = true; break; }
          }
          if (!blk) {
            if (nx > e.r && nx < WW - e.r) e.x = nx;
            if (ny > e.r && ny < WH - e.r) e.y = ny;
          }
        }
      }
    }
  } else {
    moveUnit(e, { x: tx, y: ty }, dtP);
  }

  // Перегрев пулемёта
  if (e.mgHeatBlock > 0) {
    e.mgHeatBlock--;
    if (e.mgHeatBlock <= 0) e.mgHeat = 100;
  } else if (e.mgHeat < 100 && !(dtP < 350 && e.mgOn)) {
    e.mgHeat = Math.min(100, e.mgHeat + 0.8);
  }

  // Стрельба основная
  if (dtP < 500 && e.cd <= 0) {
    const dx = tx - e.x, dy = ty - e.y;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      const sa = Math.atan2(dy, dx);
      const st = e.stats;
      const cur = st.sMin + (st.sMax - st.sMin) * e.sp;
      for (let g = 0; g < st.guns; g++) {
        let off = (Math.random() < .75) ? (Math.random() - .5) * cur * 2 : 0;
        const bA = e.isPT ? e.ta : sa;
        const fa = bA + off;
        bullets.push({
          x: e.x + Math.cos(fa) * (e.r + 6), y: e.y + Math.sin(fa) * (e.r + 6),
          vx: Math.cos(fa) * st.bs, vy: Math.sin(fa) * st.bs,
          r: BR * .9, enemy: isEnemy ? 1 : 0, dmg: st.dmg, pen: st.pen, ang: fa,
          owner: isEnemy ? 'enemy' : 'ally'
        });
      }
    }
    e.cd = e.stats.cd || 55;
  } else if (e.cd > 0) e.cd--;

  // Пулемёт
  if (e.mgOn && e.mgHeatBlock <= 0 && dtP < 350) {
    if (e.mgCd <= 0) {
      let df = targetA - e.a;
      df = ((df % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
      df = cl(df, -MG_SPREAD, MG_SPREAD);
      const mA = e.a + df;
      const off = (Math.random() - 0.5) * 0.07;
      const fa = mA + off;
      bullets.push({
        x: e.x + Math.cos(e.a) * 26, y: e.y + Math.sin(e.a) * 26,
        vx: Math.cos(fa) * 14, vy: Math.sin(fa) * 14,
        r: 3, enemy: isEnemy ? 1 : 0, dmg: e.mgDmg, pen: 0, ang: fa, isMG: 1,
        owner: isEnemy ? 'enemy' : 'ally'
      });
      e.mgCd = 6;
      e.mgHeat -= 6;
      if (e.mgHeat <= 0) { e.mgHeat = 0; e.mgHeatBlock = 300; }
    }
  }
  if (e.mgCd > 0) e.mgCd--;

  // Снайперка
  if (e.sniperOn && e.sniperCd <= 0 && dtP < 700) {
    const fa = e.ta;
    bullets.push({
      x: e.x + Math.cos(fa) * (e.r + 10), y: e.y + Math.sin(fa) * (e.r + 10),
      vx: Math.cos(fa) * 12, vy: Math.sin(fa) * 12,
      r: 4, enemy: isEnemy ? 1 : 0,
      dmg: Math.round(e.stats.dmg * e.sniperMult), pen: 1, ang: fa, isSniper: 1,
      owner: isEnemy ? 'enemy' : 'ally'
    });
    e.sniperCd = e.sniperCdMax;
  }
  if (e.sniperCd > 0) e.sniperCd--;
}

// ============================================================
// ОБНОВЛЕНИЕ
// ============================================================
function update() {
  if (!inG || over) return;
  const d = T[curT];
  if (playerDead && !teamMode) return;

  if (!playerDead) {
    if (P_.cd > 0) P_.cd--;
    if (P_.sniperCd > 0) P_.sniperCd--;
  }
  battleTime++;
  updateTimer();

  if (P_.mgHeatBlock > 0) {
    P_.mgHeatBlock--;
    if (P_.mgHeatBlock <= 0) P_.mgHeat = 100;
  } else if (!K.shift && P_.mgHeat < 100) {
    P_.mgHeat = Math.min(100, P_.mgHeat + 0.8);
  }

  for (let i = ftxt.length - 1; i >= 0; i--) {
    ftxt[i].y += ftxt[i].vy;
    ftxt[i].life--;
    if (ftxt[i].life <= 0) ftxt.splice(i, 1);
  }

  // Игрок
  if (!playerDead) {
    let mf = 0, rot = 0;
    if (K.w || K.W) mf = 1; if (K.s || K.S) mf = -1;
    if (K.a || K.A) rot = -1; if (K.d || K.D) rot = 1;
    if (K.ц || K.Ц) mf = 1; if (K.ы || K.Ы) mf = -1;
    if (K.ф || K.Ф) rot = -1; if (K.в || K.В) rot = 1;

    const moving = (mf !== 0 || rot !== 0);
    if (moving) spread = Math.min(1, spread + 1 / RISE);
    else spread = Math.max(0, spread - 1 / FALL);

    P_.a += rot * BASE_ROT * d.combat.mvr;
    if (!isFinite(P_.a)) P_.a = 0;

    if (mf !== 0) {
      const spd = mf > 0 ? d.combat.spd : d.combat.rspd;
      const dx = Math.cos(P_.a) * mf * spd;
      const dy = Math.sin(P_.a) * mf * spd;
      let nx = P_.x + dx, ny = P_.y + dy, blk = false;
      for (let o of obs) {
        if (nx > o.x - PR && nx < o.x + o.w + PR && ny > o.y - PR && ny < o.y + o.h + PR) { blk = true; break; }
      }
      if (!blk) {
        if (nx > PR && nx < WW - PR) P_.x = nx;
        if (ny > PR && ny < WH - PR) P_.y = ny;
      }
    }

    const targetAngle = Math.atan2(my - P_.y, mx - P_.x);
    const turretSpeed = BASE_ROT * d.combat.mvr * 1.2;

    if (d.special.isPT) {
      let tr = targetAngle - P_.a;
      tr = ((tr % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
      tr = cl(tr, -PT_MAX_TURRET, PT_MAX_TURRET);
      const ct = P_.a + tr;
      P_.ta = rotateTowards(P_.ta, ct, turretSpeed);
      let cr = P_.ta - P_.a;
      cr = ((cr % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
      if (Math.abs(cr) > PT_MAX_TURRET) {
        cr = cl(cr, -PT_MAX_TURRET, PT_MAX_TURRET);
        P_.ta = P_.a + cr;
      }
    } else {
      P_.ta = rotateTowards(P_.ta, targetAngle, turretSpeed);
    }
    if (!isFinite(P_.ta)) P_.ta = 0;

    // Пулемёт игрока
    if (d.special.mgOn && K.shift && P_.mgHeatBlock <= 0) {
      if (P_.mgCd <= 0) {
        const baseTarget = Math.atan2(my - P_.y, mx - P_.x);
        let diff = baseTarget - P_.a;
        diff = ((diff % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
        diff = cl(diff, -MG_SPREAD, MG_SPREAD);
        const mgAngle = P_.a + diff;
        const off = (Math.random() - 0.5) * 0.05;
        const fa = mgAngle + off;
        bullets.push({
          x: P_.x + Math.cos(P_.a) * 26, y: P_.y + Math.sin(P_.a) * 26,
          vx: Math.cos(fa) * 14, vy: Math.sin(fa) * 14,
          r: 3, enemy: 0, dmg: d.special.mgDmg, pen: 0, ang: fa, isMG: 1, owner: 'player'
        });
        P_.mgCd = 6;
        P_.mgHeat -= 6;
        if (P_.mgHeat <= 0) {
          P_.mgHeat = 0;
          P_.mgHeatBlock = 300;
          addT(P_.x - cam.x, P_.y - cam.y - 50, 'ПЕРЕГРЕВ!', '#ff6a3a', 18);
        }
      }
    }
    if (P_.mgCd > 0) P_.mgCd--;

    // Снайперка игрока
    if (d.special.sniperOn && P_.sniperCd <= 0) {
      const fa = P_.ta;
      bullets.push({
        x: P_.x + Math.cos(fa) * 34, y: P_.y + Math.sin(fa) * 34,
        vx: Math.cos(fa) * 12, vy: Math.sin(fa) * 12,
        r: 4, enemy: 0,
        dmg: Math.round(d.combat.dmg * d.special.sniperMult), pen: 1, ang: fa, isSniper: 1, owner: 'player'
      });
      P_.sniperCd = d.special.sniperCdMax;
    }
  }

  // Пули
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx; b.y += b.vy;
    if (b.x < -40 || b.x > WW + 40 || b.y < -40 || b.y > WH + 40) { bullets.splice(i, 1); continue; }
    let hO = false;
    for (let o of obs) {
      if (b.x > o.x - BR && b.x < o.x + o.w + BR && b.y > o.y - BR && b.y < o.y + o.h + BR) { hO = true; break; }
    }
    if (hO) { bullets.splice(i, 1); continue; }

    const fromPlayer = (b.owner === 'player');
    const fromEnemy = (b.owner === 'enemy');
    const fromAlly = (b.owner === 'ally');
    let used = false;

    // Попадание в игрока
    if (!playerDead && fromEnemy) {
      if (dst(b, P_) < BR + PR) {
        const r = b.isMG ? calcMgHit(b.ang, { a: P_.a, armor: d.combat.armor }, b.dmg) : calcHit(b.ang, { a: P_.a, armor: d.combat.armor }, b.dmg, b.pen);
        const info = r.dir + ' Бр:' + r.armor;
        if (r.rico) addT(b.x - cam.x, b.y - cam.y - 30, 'РИКОШЕТ ' + info, '#ffaa60', 18);
        else if (r.dmg > 0) {
          P_.hp -= r.dmg;
          if (P_.hp < 0) P_.hp = 0;
          updateHPUI();
          addT(b.x - cam.x, b.y - cam.y - 30, '-' + r.dmg + ' ' + info, b.isMG ? '#f0c060' : '#ff4a3a', b.isMG ? 16 : 24);
          if (P_.hp <= 0) {
            playerDead = true;
            if (!teamMode) over = true;
          }
        } else if (!b.isMG) addT(b.x - cam.x, b.y - cam.y - 30, 'НЕПРОБ ' + info, '#8a8a8a', 16);
        bullets.splice(i, 1); continue;
      }
    }

    // Попадание в врагов (игрок или союзник)
    if (fromPlayer || fromAlly) {
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (dst(b, e) < BR + e.r) {
          const r = b.isMG ? calcMgHit(b.ang, { a: e.a, armor: e.stats.armor }, b.dmg) : calcHit(b.ang, { a: e.a, armor: e.stats.armor }, b.dmg, b.pen);
          const info = r.dir + ' Бр:' + r.armor;
          if (r.rico) addT(e.x - cam.x, e.y - cam.y - 30, 'РИКОШЕТ ' + info, '#ffaa60', 18);
          else if (r.dmg > 0) {
            e.hp -= r.dmg;
            addT(e.x - cam.x, e.y - cam.y - 30, '-' + r.dmg + ' ' + info, b.isMG ? '#f0c060' : '#ff4a3a', b.isMG ? 16 : 24);
            if (e.hp <= 0) {
              const st = e.stats;
              if (fromPlayer) {
                P.coins += st.cR * d.enemy.coinMul;
                P.gold += 1;
                if (curT !== 'T0') {
                  P.exp += st.eR;
                  P.texp[curT] = (P.texp[curT] || 0) + st.eR;
                  P.tkills[curT] = (P.tkills[curT] || 0) + 1;
                }
                score++;
                sc.textContent = score;
              } else {
                if (curT !== 'T0') {
                  P.exp += Math.round(st.eR * 0.3);
                  P.texp[curT] = (P.texp[curT] || 0) + Math.round(st.eR * 0.3);
                }
              }
              killsEnemies++;
              enemies.splice(j, 1);
              if (!teamMode) spawnE();
              save();
              updateCoins();
            }
          } else if (!b.isMG) addT(e.x - cam.x, e.y - cam.y - 30, 'НЕПРОБ ' + info, '#8a8a8a', 16);
          used = true; break;
        }
      }
      if (used) { bullets.splice(i, 1); continue; }
    }

    // Попадание врага в союзников
    if (fromEnemy) {
      for (let j = allies.length - 1; j >= 0; j--) {
        const a = allies[j];
        if (dst(b, a) < BR + a.r) {
          const r = b.isMG ? calcMgHit(b.ang, { a: a.a, armor: a.stats.armor }, b.dmg) : calcHit(b.ang, { a: a.a, armor: a.stats.armor }, b.dmg, b.pen);
          const info = r.dir + ' Бр:' + r.armor;
          if (r.rico) addT(a.x - cam.x, a.y - cam.y - 30, 'РИКОШЕТ ' + info, '#ffaa60', 18);
          else if (r.dmg > 0) {
            a.hp -= r.dmg;
            addT(a.x - cam.x, a.y - cam.y - 30, '-' + r.dmg + ' ' + info, '#ff8a3a', 20);
            if (a.hp <= 0) { allies.splice(j, 1); killsAllies++; }
          }
          used = true; break;
        }
      }
      if (used) { bullets.splice(i, 1); continue; }
    }

    // Дружественный огонь — игрок не бьёт союзников
    if (fromPlayer) {
      for (let j = allies.length - 1; j >= 0; j--) {
        const a = allies[j];
        if (dst(b, a) < BR + a.r) { used = true; break; }
      }
      if (used) { bullets.splice(i, 1); continue; }
    }
  }

  // ИИ юнитов
  for (let e of enemies) unitAI(e, true);
  for (let a of allies) unitAI(a, false);

  // Коллизии
  for (let i = 0; i < allies.length; i++)
    for (let j = i + 1; j < allies.length; j++)
      resolveCollision(allies[i], allies[j], allies[i].r, allies[j].r);
  for (let i = 0; i < enemies.length; i++)
    for (let j = i + 1; j < enemies.length; j++)
      resolveCollision(enemies[i], enemies[j], enemies[i].r, enemies[j].r);
  for (let a of allies)
    for (let e of enemies)
      resolveCollision(a, e, a.r, e.r);
  if (!playerDead) {
    for (let e of enemies) resolveCollision(P_, e, PR, e.r);
    for (let a of allies) resolveCollision(P_, a, PR, a.r);
  }

  // Спавн
  if (!teamMode) {
    let sa = 0;
    while (enemies.length < MAXE && !over && sa < 10) { spawnE(); sa++; }
  } else {
    if (playerDead && allies.length === 0) {
      setTimeout(() => { if (!over) showBattleEnd(false); }, 500);
    }
    if (enemies.length === 0 && !over) {
      setTimeout(() => { if (!over) showBattleEnd(true); }, 500);
    }
  }

  if (teamMode) eC.textContent = (playerDead ? 0 : 1) + allies.length + '/' + enemies.length;
  else eC.textContent = enemies.length;

  cam.x = cl(P_.x - W / 2, 0, WW - W);
  cam.y = cl(P_.y - H / 2, 0, WH - H);
  cdD.textContent = P_.cd > 0 ? Math.ceil(P_.cd / 60 * 100) / 100 + 's' : '▶';
}

// ============================================================
// ОТРИСОВКА
// ============================================================
const ENEMY_COLORS = {
  T0:'#5a4a4a',T1:'#5a4a3a',T2:'#4a3a5a',T3:'#3a4a6a',T4:'#6a4a8a',T5:'#8a4a6a',T6:'#6a5a8a',
  T7:'#8a5a4a',T8:'#9a4a3a',T9:'#aa3a2a',
  E1:'#7a6a2a',E1R:'#8a7a1a',E2:'#8a8a3a',E10:'#6a5a1a',E20:'#8a7a3a',
  E21:'#8a5a2a',E30:'#9a6a2a',E40:'#7a5a1a','E40 JPZ':'#6a4a0a',
  'KW E20':'#a07a3a','СУ5':'#8a4a3a','СУ10':'#7a5a3a','СУ15':'#6a4a2a'
};

function drawTank(x, y, a, ta, d, isP, type, isPT, isA) {
  const lk = (d.look !== undefined) ? d.look : 0;
  let bc;
  if (isP) bc = '#4f7a3a';
  else if (isA) bc = '#3a6a9a';
  else bc = (ENEMY_COLORS[type] || '#5a4a4a');
  const tc = isP ? '#5a8a4a' : (isA ? '#4a7aaa' : '#6a5a5a');
  const dc = '#3a3a2a';
  let hW = 44, hH = 32, gW = 48, gH = 8, tW = 28, tH = 28, bL = 22, bT = 5;
  switch (lk) {
    case 0: hW = 36; hH = 26; tW = 20; tH = 20; gW = 40; bL = 16; bT = 4; break;
    case 2: hW = 50; hH = 36; tW = 34; tH = 32; gW = 54; bL = 20; bT = 6; break;
    case 3: hW = 40; hH = 28; tW = 22; tH = 34; gW = 44; break;
    case 4: hW = 46; hH = 30; tW = 30; tH = 24; break;
    case 5: hW = 54; hH = 38; tW = 38; tH = 32; gW = 58; gH = 10; bL = 28; bT = 8; break;
    case 6: hW = 44; hH = 30; tW = 28; tH = 28; break;
    case 7: hW = 42; hH = 26; tW = 24; tH = 22; gW = 46; bL = 28; bT = 3; break;
    case 8: hW = 42; hH = 30; tW = 26; tH = 26; bL = 28; break;
    case 9: hW = 48; hH = 34; tW = 32; tH = 30; bL = 24; break;
    case 13: hW = 52; hH = 36; tW = 36; tH = 34; gW = 56; gH = 10; bL = 26; bT = 4; break;
    case 14: hW = 50; hH = 34; tW = 34; tH = 30; gW = 54; gH = 9; bL = 26; bT = 4; break;
    case 15: hW = 42; hH = 26; tW = 26; tH = 18; gW = 46; gH = 7; bL = 32; bT = 4; break;
    case 16: hW = 56; hH = 40; tW = 40; tH = 36; gW = 60; gH = 11; bL = 30; bT = 5; break;
    case 17: hW = 58; hH = 42; tW = 42; tH = 38; gW = 62; gH = 12; bL = 32; bT = 6; break;
    case 18: hW = 60; hH = 44; tW = 44; tH = 40; gW = 64; gH = 12; bL = 34; bT = 7; break;
    case 19: hW = 54; hH = 30; tW = 28; tH = 20; gW = 58; gH = 8; bL = 40; bT = 8; break;
    case 20: hW = 48; hH = 30; tW = 30; tH = 22; gW = 52; gH = 8; bL = 36; bT = 6; break;
    case 21: hW = 38; hH = 26; tW = 26; tH = 26; gW = 42; gH = 8; bL = 20; bT = 4; break;
    case 22: hW = 44; hH = 28; tW = 26; tH = 20; gW = 48; gH = 7; bL = 42; bT = 7; break;
  }
  cx.save();
  cx.translate(x, y);
  cx.rotate(a);
  cx.shadowBlur = 12;
  cx.shadowColor = isA ? '#4a7aaa' : '#4f8a4a';
  cx.fillStyle = isA ? 'rgba(80,150,200,.18)' : 'rgba(80,200,80,.18)';
  cx.strokeStyle = isA ? 'rgba(120,180,255,.5)' : 'rgba(120,255,120,.45)';
  cx.lineWidth = 2;
  cx.beginPath();
  cx.moveTo(18, -18); cx.lineTo(32, -8); cx.lineTo(32, 8); cx.lineTo(18, 18);
  cx.closePath(); cx.fill(); cx.stroke();
  cx.shadowBlur = 0;
  cx.fillStyle = bc;
  cx.strokeStyle = '#2f4a2a';
  cx.lineWidth = 3;
  cx.fillRect(-hW/2, -hH/2, hW, hH);
  cx.strokeRect(-hW/2, -hH/2, hW, hH);
  cx.fillStyle = dc;
  cx.strokeStyle = '#2a2a1a';
  cx.lineWidth = 2;
  cx.fillRect(-hW/2 - 2, -hH/2 - 4, gW, gH);
  cx.strokeRect(-hW/2 - 2, -hH/2 - 4, gW, gH);
  cx.fillRect(-hW/2 - 2, hH/2 - gH + 4, gW, gH);
  cx.strokeRect(-hW/2 - 2, hH/2 - gH + 4, gW, gH);
  cx.restore();
  cx.save();
  cx.translate(x, y);
  cx.rotate(ta);
  cx.fillStyle = tc;
  cx.strokeStyle = isP ? '#3a5a2a' : '#4a3a3a';
  cx.lineWidth = 3;
  cx.fillRect(-tW/2, -tH/2, tW, tH);
  cx.strokeRect(-tW/2, -tH/2, tW, tH);
  cx.fillStyle = dc;
  cx.strokeStyle = '#2a2a1a';
  cx.lineWidth = 2;
  const sX = tW / 2;
  const gn = d.guns || 1;
  if (gn === 1) { cx.fillRect(sX, -bT/2, bL, bT); cx.strokeRect(sX, -bT/2, bL, bT); }
  else if (gn === 2) {
    cx.fillRect(sX, -8, bL, bT); cx.strokeRect(sX, -8, bL, bT);
    cx.fillRect(sX, 3, bL, bT); cx.strokeRect(sX, 3, bL, bT);
  } else {
    for (let i = 0; i < Math.min(gn, 4); i++) {
      cx.fillRect(sX, -10 + i * 6, bL, 4);
      cx.strokeRect(sX, -10 + i * 6, bL, 4);
    }
  }
  cx.restore();
}

function draw() {
  cx.clearRect(0, 0, W, H);
  if (!inG) return;
  cx.save();
  cx.translate(-cam.x, -cam.y);

  cx.fillStyle = currentMap === 'team7v7' ? '#3a4a3a' : '#4a6a45';
  cx.fillRect(0, 0, WW, WH);

  cx.strokeStyle = currentMap === 'team7v7' ? '#4a5a4a' : '#4f6a4b';
  cx.lineWidth = 1;
  for (let i = 0; i < WW; i += 60) { cx.beginPath(); cx.moveTo(i, 0); cx.lineTo(i, WH); cx.stroke(); }
  for (let i = 0; i < WH; i += 60) { cx.beginPath(); cx.moveTo(0, i); cx.lineTo(WW, i); cx.stroke(); }

  for (let o of obs) {
    cx.fillStyle = currentMap === 'team7v7' ? '#5a5a4a' : '#5f4a3a';
    cx.strokeStyle = '#3f2a1a';
    cx.lineWidth = 3;
    cx.fillRect(o.x, o.y, o.w, o.h);
    cx.strokeRect(o.x, o.y, o.w, o.h);
    cx.fillStyle = currentMap === 'team7v7' ? '#6a6a5a' : '#6f5a4a';
    cx.fillRect(o.x + 6, o.y + 6, o.w - 12, o.h - 12);
  }

  const d = T[curT];
  if (!over && !playerDead) {
    const cur = d.combat.sMin + (d.combat.sMax - d.combat.sMin) * spread;
    const len = 120;
    const dev = Math.tan(cur) * len;
    cx.save();
    cx.translate(P_.x, P_.y);
    cx.rotate(P_.ta);
    cx.strokeStyle = 'rgba(255,165,0,.7)';
    cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(30, -4); cx.lineTo(30 + len, -4 - dev); cx.stroke();
    cx.beginPath(); cx.moveTo(30, 4); cx.lineTo(30 + len, 4 + dev); cx.stroke();
    cx.restore();
  }

  for (let a of allies) {
    drawTank(a.x, a.y, a.a, a.ta, { guns: a.stats.guns, look: a.look }, false, a.type, a.isPT, true);
    const hpP = a.hp / a.max;
    cx.fillStyle = '#1a2a1a';
    cx.fillRect(a.x - 15, a.y - a.r - 12, 30, 4);
    cx.fillStyle = hpP > .3 ? '#4a8a3a' : '#8a3a3a';
    cx.fillRect(a.x - 15, a.y - a.r - 12, 30 * hpP, 4);
  }

  for (let e of enemies) {
    drawTank(e.x, e.y, e.a, e.ta, { guns: e.stats.guns, look: e.look }, false, e.type, e.isPT, false);
    const hpP = e.hp / e.max;
    cx.fillStyle = '#2a1a1a';
    cx.fillRect(e.x - 15, e.y - e.r - 12, 30, 4);
    cx.fillStyle = hpP > .3 ? '#4a8a3a' : '#8a3a3a';
    cx.fillRect(e.x - 15, e.y - e.r - 12, 30 * hpP, 4);
    cx.fillStyle = '#8aaa80';
    cx.font = '9px monospace';
    cx.textAlign = 'center';
    cx.fillText(e.type, e.x, e.y + e.r + 14);
  }

  if (!playerDead) drawTank(P_.x, P_.y, P_.a, P_.ta, d, true, curT, d.special.isPT, false);

  for (let b of bullets) {
    cx.beginPath();
    cx.arc(b.x, b.y, b.r, 0, 6.28);
    if (b.owner === 'enemy') cx.fillStyle = '#ff4a3a';
    else if (b.owner === 'ally') cx.fillStyle = '#6ac9e0';
    else if (b.isMG) cx.fillStyle = '#f0c060';
    else if (b.isSniper) cx.fillStyle = '#8aee7a';
    else cx.fillStyle = '#f0e060';
    cx.fill();
  }

  if (!playerDead) {
    cx.strokeStyle = '#e0f0d0';
    cx.lineWidth = 2;
    cx.beginPath();
    cx.moveTo(mx - 16, my); cx.lineTo(mx + 16, my);
    cx.moveTo(mx, my - 16); cx.lineTo(mx, my + 16);
    cx.stroke();
  }

  cx.restore();

  for (let f of ftxt) {
    cx.globalAlpha = f.life / f.max;
    cx.font = `bold ${f.size}px monospace`;
    cx.textAlign = 'center';
    cx.fillStyle = f.color;
    cx.strokeStyle = 'rgba(0,0,0,.8)';
    cx.lineWidth = 3;
    cx.strokeText(f.text, f.x, f.y);
    cx.fillText(f.text, f.x, f.y);
  }
  cx.globalAlpha = 1;

  const mmW = 200, mmH = 80;
  const mmX = W - mmW - 10, mmY = 60;
  cx.fillStyle = 'rgba(0,0,0,.6)';
  cx.fillRect(mmX, mmY, mmW, mmH);
  cx.strokeStyle = '#4f6a4b';
  cx.lineWidth = 2;
  cx.strokeRect(mmX, mmY, mmW, mmH);

  const scaleX = mmW / WW, scaleY = mmH / WH;
  cx.fillStyle = '#6ac9e0';
  for (let a of allies) { cx.beginPath(); cx.arc(mmX + a.x * scaleX, mmY + a.y * scaleY, 2, 0, 6.28); cx.fill(); }
  cx.fillStyle = '#8aee7a';
  if (!playerDead) { cx.beginPath(); cx.arc(mmX + P_.x * scaleX, mmY + P_.y * scaleY, 3, 0, 6.28); cx.fill(); }
  cx.fillStyle = '#ff4a3a';
  for (let e of enemies) { cx.beginPath(); cx.arc(mmX + e.x * scaleX, mmY + e.y * scaleY, 2, 0, 6.28); cx.fill(); }

  cx.fillStyle = 'rgba(200, 220, 180, 0.7)';
  cx.font = 'bold 14px monospace';
  cx.textAlign = 'center';
  let mapName = '🏭 КОРИДОР';
  if (currentMap === 'open') mapName = '🏞️ ОТКРЫТАЯ';
  if (currentMap === 'team7v7') mapName = '⚔️ БИТВА 7v7';
  cx.fillText(mapName, W / 2, 25);

  if (playerDead && teamMode && !over) {
    cx.font = 'bold 36px monospace';
    cx.fillStyle = '#ff6a4a';
    cx.textAlign = 'center';
    cx.fillText('💀 ВЫ УНИЧТОЖЕНЫ', W / 2, H / 2 - 20);
    cx.font = '16px monospace';
    cx.fillStyle = '#8aaa80';
    cx.fillText('Союзники продолжают бой...', W / 2, H / 2 + 20);
  }

  if (over && !battleEnd.classList.contains('open')) {
    cx.font = 'bold 48px monospace';
    cx.fillStyle = '#d0c0b0';
    cx.textAlign = 'center';
    cx.fillText('💀 УНИЧТОЖЕН', W / 2, H / 2 - 20);
    cx.font = 'bold 20px monospace';
    cx.fillStyle = '#8aaa80';
    cx.fillText('ESC — в ангар', W / 2, H / 2 + 30);
  }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

// ============================================================
// ОБРАБОТЧИКИ
// ============================================================
cv.addEventListener('mousemove', e => {
  if (!inG) return;
  const r = cv.getBoundingClientRect();
  mx = (e.clientX - r.left) * (W / r.width) + cam.x;
  my = (e.clientY - r.top) * (H / r.height) + cam.y;
});

cv.addEventListener('mousedown', e => { if (e.button === 0) shoot(); });

addEventListener('keydown', e => {
  const k = e.key;
  if (k.length === 1 && /[a-zA-Zа-яА-Я]/.test(k)) cheat(k);
  if (k === 'w' || k === 'W') { K.w = 1; K.W = 1; e.preventDefault(); }
  if (k === 'a' || k === 'A') { K.a = 1; K.A = 1; e.preventDefault(); }
  if (k === 's' || k === 'S') { K.s = 1; K.S = 1; e.preventDefault(); }
  if (k === 'd' || k === 'D') { K.d = 1; K.D = 1; e.preventDefault(); }
  if (k === 'ц' || k === 'Ц') { K.ц = 1; K.Ц = 1; e.preventDefault(); }
  if (k === 'ф' || k === 'Ф') { K.ф = 1; K.Ф = 1; e.preventDefault(); }
  if (k === 'ы' || k === 'Ы') { K.ы = 1; K.Ы = 1; e.preventDefault(); }
  if (k === 'в' || k === 'В') { K.в = 1; K.В = 1; e.preventDefault(); }
  if (k === ' ') { shoot(); e.preventDefault(); }
  if (k === 'Shift') { K.shift = 1; e.preventDefault(); }
  if (k === 'Escape') {
    e.preventDefault();
    if (battleEnd.classList.contains('open')) closeBattleEnd();
    else if (lootbox.classList.contains('open')) closeLootbox();
    else if (mapSelect.classList.contains('open')) closeMapSelect();
    else if (tree.classList.contains('open')) tree.classList.remove('open');
    else if (inG) toGarage();
  }
});

addEventListener('keyup', e => {
  const k = e.key;
  if (k === 'w' || k === 'W') { K.w = 0; K.W = 0; }
  if (k === 'a' || k === 'A') { K.a = 0; K.A = 0; }
  if (k === 's' || k === 'S') { K.s = 0; K.S = 0; }
  if (k === 'd' || k === 'D') { K.d = 0; K.D = 0; }
  if (k === 'ц' || k === 'Ц') { K.ц = 0; K.Ц = 0; }
  if (k === 'ф' || k === 'Ф') { K.ф = 0; K.Ф = 0; }
  if (k === 'ы' || k === 'Ы') { K.ы = 0; K.Ы = 0; }
  if (k === 'в' || k === 'В') { K.в = 0; K.В = 0; }
  if (k === 'Shift') { K.shift = 0; }
});

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================
async function init() {
  await loadNations();
  await loadAllTanks();
  loadSave();
  if (!T[curT]) curT = Object.keys(T)[0] || 'T1';
  renderNations();
  renderGarage();
  updateHUD();
  updateCoins();
  resize();
  loop();
}

init();