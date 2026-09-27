'use strict';

/* ================================================================
   Alocação de Referência — Lógica da aplicação
   ================================================================ */

/* ---------- constantes ---------- */
const STORAGE = { model: 'alloc_model_v2', client: 'alloc_client_v2', mode: 'alloc_mode_v2' };

const PALETTE = ['#E0833A','#3E8361','#2E5C8A','#6B5B95','#B8935F','#C25B6B','#5B8AC2','#8A6B3E','#3E7B8A','#8A5B3E'];

const DEFAULT_MODEL = {
  classes: [
    { id:'cripto', name:'Criptomoedas', value:10, color:'#E0833A', subclasses:[
      { id:'sc1', name:'Classe 1 — Principais', value:40, assets:['Bitcoin','Ethereum'] },
      { id:'sc2', name:'Classe 2 — Alternativas líquidas', value:30, assets:['Solana','XRP','Polkadot'] },
      { id:'sc3', name:'Classe 3 — Outras altcoins', value:20, assets:['BNB','Cardano'] },
      { id:'sc4', name:'Classe 4 — Caixa/stable', value:10, assets:['USDT'] }
    ]},
    { id:'renda', name:'Renda fixa', value:40, color:'#3E8361', subclasses:[
      { id:'sc5', name:'Classe 1 — Bancário', value:40, assets:['CDB','LCI','LCA'] },
      { id:'sc6', name:'Classe 2 — Público', value:30, assets:['Tesouro Selic','Tesouro IPCA+'] },
      { id:'sc7', name:'Classe 3 — Crédito privado', value:15, assets:['CRI/CRA'] },
      { id:'sc8', name:'Classe 4 — Caixa', value:15, assets:['Liquidez diária'] }
    ]},
    { id:'brasil', name:'Ações Brasil', value:20, color:'#2E5C8A', subclasses:[
      { id:'sc9', name:'Classe 1 — Bancos', value:25, assets:['Banco do Brasil','Itaú Unibanco'] },
      { id:'sc10', name:'Classe 2 — Commodities/industriais', value:35, assets:['Petrobras','Vale','Suzano'] },
      { id:'sc11', name:'Classe 3 — Consumo/outros', value:30, assets:['Caixa Seguridade','WEG','Ambev'] },
      { id:'sc12', name:'Classe 4 — Caixa', value:10, assets:['Liquidez'] }
    ]},
    { id:'eua', name:'Ações americanas', value:15, color:'#6B5B95', subclasses:[
      { id:'sc13', name:'Classe 1 — Índices (ETFs)', value:55, assets:['ETF S&P 500','ETF Nasdaq 100'] },
      { id:'sc14', name:'Classe 2 — Big techs', value:35, assets:['Apple','Microsoft','Alphabet (Google)','Amazon'] },
      { id:'sc15', name:'Classe 3 — Caixa', value:10, assets:['Caixa (USD)'] }
    ]},
    { id:'commodities', name:'Commodities', value:15, color:'#B8935F', subclasses:[
      { id:'sc16', name:'Classe 1 — Metais preciosos', value:40, assets:['Ouro','Prata','Platina','Paládio'] },
      { id:'sc17', name:'Classe 2 — Energia', value:35, assets:['Petróleo','Gás Natural'] },
      { id:'sc18', name:'Classe 3 — Agrícolas/industriais', value:15, assets:['Cobre','Milho','Soja','Café'] },
      { id:'sc19', name:'Classe 4 — Caixa', value:10, assets:['Liquidez'] }
    ]}
  ]
};

const EXAMPLE_DATA = [
  { name:'Criptomoedas', value:10, color:'#E0833A', assets:'Bitcoin 35% · USDT 30% · Ethereum 15% · Solana 8% · XRP 5% · BNB 4% · Cardano 3%' },
  { name:'Renda fixa', value:40, color:'#3E8361', assets:'CDB 30% · Tesouro Selic 20% · LCI 15% · Caixa 10% · LCA 10% · Tesouro IPCA+ 10% · CRI/CRA 5%' },
  { name:'Ações Brasil', value:20, color:'#2E5C8A', assets:'Caixa Seguridade 22% · Petrobras 13% · Vale 13% · Suzano 12% · BB 12% · Itaú 10% · Caixa 8% · WEG 6% · Ambev 4%' },
  { name:'Ações americanas', value:15, color:'#6B5B95', assets:'ETF S&P 500 27% · ETF Nasdaq 100 25% · Apple 12% · Microsoft 12% · Google 10% · Caixa 8% · Amazon 6%' },
  { name:'Commodities', value:15, color:'#B8935F', assets:'Ouro 30% · Petróleo 17% · Prata 10% · Gás Natural 10% · Cobre 8% · Caixa 8% · Platina 5% · Milho 4% · Soja 3% · Paládio 3% · Café 2%' }
];

/* ---------- estado ---------- */
let model = { classes: [] };
let client = { totalValue: 0, picks: {} };
let mode = 'client';
let activeClassId = null;
let activeRefClassId = null;
let expandedAdmin = {};
let charts = {};

function sortedClasses() { return [...model.classes].sort((a, b) => (b.value || 0) - (a.value || 0)); }
function sortedPicks(picks) { return [...picks].sort((a, b) => (b.value || 0) - (a.value || 0)); }

/* ---------- storage ---------- */
function loadState() {
  try { model = JSON.parse(localStorage.getItem(STORAGE.model)) || JSON.parse(JSON.stringify(DEFAULT_MODEL)); }
  catch { model = JSON.parse(JSON.stringify(DEFAULT_MODEL)); }
  try { client = JSON.parse(localStorage.getItem(STORAGE.client)) || { totalValue: 0, picks: {} }; }
  catch { client = { totalValue: 0, picks: {} }; }
  mode = localStorage.getItem(STORAGE.mode) || 'client';
  if (new URLSearchParams(location.search).get('admin') === '1') mode = 'admin';
}
function saveModel() { localStorage.setItem(STORAGE.model, JSON.stringify(model)); }
function saveClient() { localStorage.setItem(STORAGE.client, JSON.stringify(client)); }
function saveMode() { localStorage.setItem(STORAGE.mode, mode); }

/* ---------- utils ---------- */
function uid() { return 'id-' + Math.random().toString(36).slice(2, 9); }
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function formatBRL(v) {
  return new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v || 0);
}
function formatBRLPlain(v) {
  return (v || 0).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function parseBRL(str) {
  if (typeof str === 'number') return str;
  return parseFloat(String(str).replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
}
function shadeColor(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
  r = Math.round(r + (255 - r) * percent);
  g = Math.round(g + (255 - g) * percent);
  b = Math.round(b + (255 - b) * percent);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
function classTotal() { return model.classes.reduce((s, c) => s + (Number(c.value) || 0), 0); }
function rebalanceItems(items) {
  const total = items.reduce((s, i) => s + (Number(i.value) || 0), 0);
  if (total === 0) { const eq = Math.floor(100 / items.length); items.forEach((i, idx) => i.value = idx === 0 ? 100 - eq * (items.length - 1) : eq); return; }
  items.forEach(i => i.value = Math.round((i.value / total) * 100));
  const diff = 100 - items.reduce((s, i) => s + i.value, 0);
  if (items.length) items[0].value += diff;
}
function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ||
    (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
}

/* ---------- charts ---------- */
function destroyChart(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }
function renderDonut(canvasId, centerId, items, centerText, centerLabel, onClick) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);
  const labels = items.map(i => i.name || i.label || '—');
  const data = items.map(i => Math.max(Number(i.value) || 0, 0.0001));
  const colors = items.map(i => i.color);
  const total = client.totalValue || 0;
  charts[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: cssVar('--panel'), hoverOffset: 8 }] },
    options: {
      responsive: true, cutout: '62%', animation: { duration: 600 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cssVar('--ink'), titleColor: cssVar('--panel'), bodyColor: cssVar('--panel'),
          padding: 12, cornerRadius: 8, displayColors: true, boxPadding: 4,
          callbacks: {
            label: ctx => {
              const pct = items[ctx.dataIndex].value;
              const rs = formatBRL(total * pct / 100);
              return `  ${pct}%${total > 0 ? ' · ' + rs : ''}`;
            }
          }
        }
      },
      onClick: onClick ? (e, els) => { if (els.length) onClick(els[0].index); } : undefined,
      onHover: onClick ? (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; } : undefined
    }
  });
  if (centerId) {
    const c = document.getElementById(centerId);
    if (c) c.innerHTML = `<div class="cc-val">${centerText}</div>${centerLabel ? `<div class="cc-label">${centerLabel}</div>` : ''}`;
  }
}

/* ================================================================
   RENDER PRINCIPAL
   ================================================================ */
function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  if (mode === 'admin') renderAdmin(app); else renderClient(app);
  if (window.lucide) lucide.createIcons();
  updateModeBadge();
}

function updateModeBadge() {
  const badge = document.getElementById('modeBadge');
  if (!badge) return;
  badge.textContent = mode === 'admin' ? 'Modo Admin' : 'Modo Cliente';
  badge.classList.toggle('admin', mode === 'admin');
}

/* ================================================================
   MODO ADMIN
   ================================================================ */
function renderAdmin(app) {
  // header
  const head = document.createElement('div');
  head.className = 'admin-head';
  head.innerHTML = `
    <div><h2>Configuração do Modelo</h2><div class="sub">Defina classes, percentuais, subclasses e ativos disponíveis</div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-sm" data-act="reset">Restaurar padrão</button>
      <button class="btn btn-sm" data-act="viewClient">Ver modo cliente</button>
    </div>`;
  app.appendChild(head);

  // total bar
  const total = classTotal();
  const totalBar = document.createElement('div');
  totalBar.className = 'admin-total-bar';
  totalBar.innerHTML = `
    <div class="label">Total das classes</div>
    <div class="val ${total === 100 ? '' : 'off'}">${total}%</div>
    <div class="sum-bar"><div class="sum-bar-fill ${total === 100 ? '' : 'off'}" style="width:${Math.min(total,100)}%"></div></div>
    <div style="margin-top:8px"><button class="btn btn-sm" data-act="rebalanceAll">Equilibrar para 100%</button></div>`;
  app.appendChild(totalBar);

  // classes
  const container = document.createElement('div');
  container.id = 'adminClasses';
  model.classes.forEach((cls, i) => container.appendChild(buildAdminClass(cls, i)));
  app.appendChild(container);

  // add class
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-accent btn-block';
  addBtn.style.marginTop = '6px';
  addBtn.innerHTML = '<i data-lucide="plus"></i> Adicionar classe';
  addBtn.onclick = () => {
    model.classes.push({ id: uid(), name: 'Nova classe', value: 0, color: PALETTE[model.classes.length % PALETTE.length], subclasses: [] });
    saveModel(); render();
  };
  app.appendChild(addBtn);

  // delegation
  app.addEventListener('click', adminClickHandler);
}

function adminClickHandler(e) {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const act = t.dataset.act;
  if (act === 'reset') {
    if (confirm('Restaurar o modelo padrão? Suas alterações serão perdidas.')) {
      model = JSON.parse(JSON.stringify(DEFAULT_MODEL)); saveModel(); render();
    }
  } else if (act === 'viewClient') {
    mode = 'client'; saveMode(); render();
  } else if (act === 'rebalanceAll') {
    rebalanceItems(model.classes); saveModel(); render();
  }
}

function buildAdminClass(cls, idx) {
  const wrap = document.createElement('div');
  wrap.className = 'admin-class';
  const isOpen = !!expandedAdmin[cls.id];

  wrap.innerHTML = `
    <div class="admin-class-head">
      <input type="color" class="admin-color" value="${cls.color}" data-cid="${cls.id}" data-field="color">
      <input type="text" class="admin-name" value="${esc(cls.name)}" data-cid="${cls.id}" data-field="name" placeholder="Nome da classe">
      <span class="admin-pct-display">${cls.value}%</span>
      <button class="admin-expand ${isOpen ? 'open' : ''}" data-cid="${cls.id}" data-act="expand"><i data-lucide="chevron-down"></i></button>
      <button class="btn btn-danger btn-sm" data-cid="${cls.id}" data-act="delClass" title="Remover classe"><i data-lucide="trash-2"></i></button>
    </div>
    <div class="admin-class-body ${isOpen ? 'open' : ''}">
      <div class="admin-class-body-inner">
        <div style="margin-bottom:12px">
          <label style="font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em">Percentual da classe</label>
          <input type="range" class="slider" min="0" max="100" value="${cls.value}" data-cid="${cls.id}" data-field="value" style="margin-top:8px">
        </div>
        <h4 style="font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">Subclasses</h4>
        <div id="subs-${cls.id}"></div>
        <button class="btn btn-sm admin-sub-add" data-cid="${cls.id}" data-act="addSub"><i data-lucide="plus"></i> Adicionar subclasse</button>
      </div>
    </div>`;

  // subs
  const subsHolder = wrap.querySelector(`#subs-${cls.id}`);
  cls.subclasses.forEach(sc => subsHolder.appendChild(buildAdminSub(cls, sc)));

  // events
  wrap.querySelector('.admin-color').oninput = e => { cls.color = e.target.value; saveModel(); render(); };
  wrap.querySelector('.admin-name').oninput = e => { cls.name = e.target.value; saveModel(); };
  wrap.querySelector('[data-field="value"]').oninput = e => {
    cls.value = Math.max(0, Math.min(100, Number(e.target.value) || 0));
    saveModel();
    wrap.querySelector('.admin-pct-display').textContent = cls.value + '%';
    // update total bar
    const total = classTotal();
    const tv = document.querySelector('.admin-total-bar .val');
    if (tv) { tv.textContent = total + '%'; tv.classList.toggle('off', total !== 100); }
    const fill = document.querySelector('.sum-bar-fill');
    if (fill) { fill.style.width = Math.min(total, 100) + '%'; fill.classList.toggle('off', total !== 100); }
  };
  wrap.querySelector('[data-act="expand"]').onclick = () => { expandedAdmin[cls.id] = !expandedAdmin[cls.id]; render(); };
  wrap.querySelector('[data-act="delClass"]').onclick = () => {
    if (confirm(`Remover "${cls.name}"?`)) { model.classes = model.classes.filter(c => c.id !== cls.id); saveModel(); render(); }
  };
  wrap.querySelector('[data-act="addSub"]').onclick = () => {
    cls.subclasses.push({ id: uid(), name: 'Nova subclasse', value: 0, assets: [] });
    expandedAdmin[cls.id] = true; saveModel(); render();
  };

  return wrap;
}

function buildAdminSub(cls, sc) {
  const div = document.createElement('div');
  div.className = 'admin-sub';
  div.innerHTML = `
    <input type="text" class="admin-name" value="${esc(sc.name)}" data-scid="${sc.id}" data-cid="${cls.id}" data-field="scName" placeholder="Nome da subclasse">
    <span class="admin-pct-display">${sc.value}%</span>
    <input type="range" class="slider" min="0" max="100" value="${sc.value}" data-scid="${sc.id}" data-cid="${cls.id}" data-field="scValue" style="width:100px">
    <button class="btn btn-danger btn-sm" data-scid="${sc.id}" data-cid="${cls.id}" data-act="delSub"><i data-lucide="trash-2"></i></button>
    <div class="admin-asset-chips" id="chips-${sc.id}"></div>
    <div class="admin-add-asset">
      <input type="text" placeholder="Nome do ativo" data-scid="${sc.id}" data-act="assetInput">
      <button data-scid="${sc.id}" data-act="addAsset">Adicionar</button>
    </div>`;

  // chips
  const chipsHolder = div.querySelector(`#chips-${sc.id}`);
  sc.assets.forEach(a => {
    const chip = document.createElement('span');
    chip.className = 'admin-asset-chip';
    chip.innerHTML = `${esc(a)} <button class="rm" data-scid="${sc.id}" data-asset="${esc(a)}" data-act="delAsset">×</button>`;
    chipsHolder.appendChild(chip);
  });

  // events
  div.querySelector('[data-field="scName"]').oninput = e => { sc.name = e.target.value; saveModel(); };
  div.querySelector('[data-field="scValue"]').oninput = e => {
    sc.value = Math.max(0, Math.min(100, Number(e.target.value) || 0)); saveModel();
    div.querySelector('.admin-pct-display').textContent = sc.value + '%';
  };
  div.querySelector('[data-act="delSub"]').onclick = () => {
    cls.subclasses = cls.subclasses.filter(s => s.id !== sc.id); saveModel(); render();
  };
  div.querySelector('[data-act="addAsset"]').onclick = () => {
    const inp = div.querySelector('[data-act="assetInput"]');
    const name = inp.value.trim();
    if (name && !sc.assets.includes(name)) { sc.assets.push(name); saveModel(); render(); }
  };
  div.querySelector('[data-act="assetInput"]').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); div.querySelector('[data-act="addAsset"]').click(); }
  });
  // delegate chip removal
  chipsHolder.onclick = e => {
    const rm = e.target.closest('[data-act="delAsset"]');
    if (rm) { sc.assets = sc.assets.filter(a => a !== rm.dataset.asset); saveModel(); render(); }
  };

  return div;
}

/* ================================================================
   MODO CLIENTE
   ================================================================ */
function renderClient(app) {
  // investment input
  const inv = document.createElement('div');
  inv.className = 'card invest-card';
  inv.innerHTML = `
    <label for="totalInvest">Qual o valor total a investir?</label>
    <div class="invest-input-wrap">
      <input type="text" id="totalInvest" class="invest-input" inputmode="decimal"
        value="${client.totalValue > 0 ? formatBRLPlain(client.totalValue) : ''}" placeholder="0,00">
    </div>
    <button class="btn btn-sm" data-act="goAdmin" title="Modo Admin"><i data-lucide="settings"></i></button>`;
  app.appendChild(inv);

  const inp = inv.querySelector('#totalInvest');
  inp.addEventListener('input', e => {
    client.totalValue = parseBRL(e.target.value);
    saveClient();
    renderClientDynamic();
  });
  inp.addEventListener('blur', () => {
    inp.value = client.totalValue > 0 ? formatBRLPlain(client.totalValue) : '';
  });
  inv.querySelector('[data-act="goAdmin"]').onclick = () => { mode = 'admin'; saveMode(); render(); };

  // step 1: reference
  app.appendChild(buildStep1());
  // step 2: example
  app.appendChild(buildStep2());
  // step 3: builder
  app.appendChild(buildStep3());
  // summary
  app.appendChild(buildSummary());

  // init charts
  renderClientDynamic();
}

function renderClientDynamic() {
  // re-render charts and R$ values without rebuilding DOM structure
  renderRefChart();
  renderBuilderChart();
  renderSubDetailChart();
  if (activeRefClassId) renderRefDetail();
  updateRValues();
  renderSummaryTable();
}

function updateRValues() {
  // update legend R$ values
  const total = client.totalValue || 0;
  document.querySelectorAll('[data-rs-class]').forEach(el => {
    const pct = Number(el.dataset.rsClass) || 0;
    el.querySelector('.rs').textContent = total > 0 ? formatBRL(total * pct / 100) : '';
  });
  document.querySelectorAll('[data-rs-sub]').forEach(el => {
    const pct = Number(el.dataset.rsSub) || 0;
    el.querySelector('.rs').textContent = total > 0 ? formatBRL(total * pct / 100) : '';
  });
  document.querySelectorAll('[data-rs-asset]').forEach(el => {
    const classPct = Number(el.dataset.classPct) || 0;
    const assetPct = Number(el.dataset.rsAsset) || 0;
    const rs = total * classPct / 100 * assetPct / 100;
    el.textContent = total > 0 ? formatBRL(rs) : '';
  });
  // update chart center
  const cc = document.getElementById('refChartCenter');
  if (cc) {
    cc.innerHTML = `<div class="cc-val">${classTotal()}%</div><div class="cc-label">${total > 0 ? formatBRL(total) : 'Total'}</div>`;
  }
  const bc = document.getElementById('buildChartCenter');
  if (bc) {
    bc.innerHTML = `<div class="cc-val">${classTotal()}%</div><div class="cc-label">${total > 0 ? formatBRL(total) : 'Total'}</div>`;
  }
}

/* ----- step 1: reference (read-only) ----- */
function buildStep1() {
  const sec = document.createElement('section');
  sec.className = 'section';
  sec.innerHTML = `
    <div class="sec-head"><span class="sec-num">1</span><h2>Alocação sugerida por classe</h2><span class="sub">esta é a recomendação — você não pode alterar</span></div>
    <div class="card">
      <div class="board">
        <div>
          <div class="chart-wrap"><canvas id="refChart"></canvas><div class="chart-center" id="refChartCenter"></div></div>
          <div class="chart-hint">Clique numa classe para ver as subclasses</div>
        </div>
        <div class="legend" id="refLegend"></div>
      </div>
    </div>
    <div id="refDetail" class="hidden"></div>`;

  const legend = sec.querySelector('#refLegend');
  sortedClasses().forEach(c => {
    const row = document.createElement('div');
    row.className = 'leg-row' + (activeRefClassId === c.id ? ' active' : '');
    row.innerHTML = `
      <div class="leg-dot" style="background:${c.color}"></div>
      <div class="leg-name">${esc(c.name)}<small>${c.subclasses.length} subclasse(s)</small></div>
      <div class="leg-pct" data-rs-class="${c.value}">${c.value}%<span class="rs"></span></div>
      <div class="leg-arrow">›</div>`;
    row.onclick = () => openRefDetail(c.id);
    legend.appendChild(row);
  });

  const total = classTotal();
  const sum = document.createElement('div');
  sum.className = 'sumline';
  sum.innerHTML = `<span>Total: <b>${total}%</b>${total !== 100 ? ' — modelo desbalanceado' : ''}</span>`;
  legend.appendChild(sum);

  return sec;
}

function renderRefChart() {
  const sc = sortedClasses();
  const items = sc.map(c => ({ name: c.name, value: c.value, color: c.color }));
  renderDonut('refChart', null, items, '', '', idx => openRefDetail(sc[idx].id));
  const cc = document.getElementById('refChartCenter');
  if (cc) {
    const total = client.totalValue || 0;
    cc.innerHTML = `<div class="cc-val">${classTotal()}%</div><div class="cc-label">${total > 0 ? formatBRL(total) : 'Total'}</div>`;
  }
}

function openRefDetail(classId) {
  activeRefClassId = classId;
  document.querySelectorAll('#refLegend .leg-row').forEach((row, i) => {
    row.classList.toggle('active', sortedClasses()[i].id === classId);
  });
  renderRefDetail();
  document.getElementById('refDetail')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderRefDetail() {
  const holder = document.getElementById('refDetail');
  if (!holder || !activeRefClassId) return;
  const cls = model.classes.find(c => c.id === activeRefClassId);
  if (!cls) return;
  holder.classList.remove('hidden');
  holder.className = 'card fade-in';

  let subsHtml = '';
  cls.subclasses.forEach((sc, i) => {
    const alpha = 1 - i * (0.5 / Math.max(cls.subclasses.length - 1, 1));
    const scColor = shadeColor(cls.color, 1 - alpha);
    subsHtml += `
      <div class="sub-row">
        <div class="leg-dot" style="background:${scColor}"></div>
        <span class="nm">${esc(sc.name)}</span>
        <span class="pv" data-rs-sub="${sc.value}">${sc.value}%<span class="rs"></span></span>
      </div>`;
  });

  const subTotal = cls.subclasses.reduce((s, sc) => s + (Number(sc.value) || 0), 0);
  const classRS = (client.totalValue || 0) * cls.value / 100;

  holder.innerHTML = `
    <button class="btn btn-sm" id="closeRefDetail" style="margin-bottom:14px"><i data-lucide="arrow-left"></i> Voltar</button>
    <div class="detail-head"><h3>${esc(cls.name)}</h3><span>${cls.value}% da carteira total${client.totalValue > 0 ? ' · ' + formatBRL(classRS) : ''}</span></div>
    <div class="detail-grid">
      <div class="chart-wrap"><canvas id="refSubChart"></canvas><div class="chart-center" id="refSubChartCenter"></div></div>
      <div>
        <h4 style="font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">Subclasses</h4>
        ${subsHtml}
        <div class="sumline ${subTotal === 100 ? '' : 'off'}">
          <span>Subtotal: <b>${subTotal}%</b>${subTotal !== 100 ? ' — modelo desbalanceado' : ''}</span>
        </div>
      </div>
    </div>`;

  // sub chart
  const items = cls.subclasses.map((sc, i) => {
    const alpha = 1 - i * (0.5 / Math.max(cls.subclasses.length - 1, 1));
    return { name: sc.name, value: sc.value, color: shadeColor(cls.color, 1 - alpha) };
  });
  renderDonut('refSubChart', 'refSubChartCenter', items, '', '', null);
  const cc = document.getElementById('refSubChartCenter');
  if (cc) cc.innerHTML = `<div class="cc-val">${subTotal}%</div>`;

  holder.querySelector('#closeRefDetail').onclick = () => {
    activeRefClassId = null;
    holder.classList.add('hidden');
    document.querySelectorAll('#refLegend .leg-row').forEach(r => r.classList.remove('active'));
    destroyChart('refSubChart');
  };

  if (window.lucide) lucide.createIcons();
  updateRValues();
}

/* ----- step 2: example (modal) ----- */
function buildStep2() {
  const sec = document.createElement('section');
  sec.className = 'section';
  sec.innerHTML = `
    <div class="sec-head"><span class="sec-num">2</span><h2>Exemplo de preenchimento</h2><span class="sub">ilustrativo — a escolha dos ativos é sua</span></div>
    <button class="btn" id="openExample"><i data-lucide="eye"></i> Ver exemplo</button>`;

  // modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'exampleOverlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-head"><h3>Exemplo de carteira preenchida</h3><button class="modal-close" id="closeExample">×</button></div>
      <div class="board">
        <div class="chart-wrap"><canvas id="exampleChart"></canvas><div class="chart-center"><div class="cc-val">100%</div></div></div>
        <div id="exampleLegend"></div>
      </div>
    </div>`;

  sec.appendChild(overlay);
  sec.querySelector('#openExample').onclick = () => {
    overlay.classList.add('show');
    renderExampleChart();
  };
  sec.querySelector('#closeExample').onclick = () => overlay.classList.remove('show');
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('show'); });

  return sec;
}

function renderExampleChart() {
  const items = EXAMPLE_DATA.map(e => ({ name: e.name, value: e.value, color: e.color }));
  renderDonut('exampleChart', null, items, '', '', null);
  const legend = document.getElementById('exampleLegend');
  if (!legend) return;
  legend.innerHTML = '';
  EXAMPLE_DATA.forEach(e => {
    legend.innerHTML += `
      <div class="ex-row"><span class="dot" style="background:${e.color}"></span><span class="nm">${esc(e.name)}</span><span class="pc">${e.value}%</span></div>
      <div class="ex-assets">${esc(e.assets)}</div>`;
  });
}

/* ----- step 3: builder ----- */
function buildStep3() {
  const sec = document.createElement('section');
  sec.className = 'section';
  sec.innerHTML = `
    <div class="sec-head"><span class="sec-num">3</span><h2>Monte a sua carteira</h2><span class="sub">clique numa classe para escolher os ativos</span></div>
    <div class="card">
      <div class="board">
        <div>
          <div class="chart-wrap"><canvas id="buildChart"></canvas><div class="chart-center" id="buildChartCenter"></div></div>
          <div class="chart-hint">Clique numa fatia para escolher os ativos</div>
        </div>
        <div>
          <div class="legend" id="buildLegend"></div>
          <div class="sumline"><span>Segue a alocação de referência acima</span></div>
        </div>
      </div>
    </div>
    <div id="buildDetail" class="hidden"></div>`;

  const legend = sec.querySelector('#buildLegend');
  sortedClasses().forEach(c => {
    const picks = client.picks[c.id] || [];
    const row = document.createElement('div');
    row.className = 'leg-row' + (activeClassId === c.id ? ' active' : '');
    row.innerHTML = `
      <div class="leg-dot" style="background:${c.color}"></div>
      <div class="leg-name">${esc(c.name)}<small>${picks.length} ativo(s) escolhido(s)</small></div>
      <div class="leg-pct" data-rs-class="${c.value}">${c.value}%<span class="rs"></span></div>
      <div class="leg-arrow">›</div>`;
    row.onclick = () => openBuildDetail(c.id);
    legend.appendChild(row);
  });

  return sec;
}

function renderBuilderChart() {
  const sc = sortedClasses();
  const items = sc.map(c => ({ name: c.name, value: c.value, color: c.color }));
  renderDonut('buildChart', null, items, '', '', idx => openBuildDetail(sc[idx].id));
  const cc = document.getElementById('buildChartCenter');
  if (cc) {
    const total = client.totalValue || 0;
    cc.innerHTML = `<div class="cc-val">${classTotal()}%</div><div class="cc-label">${total > 0 ? formatBRL(total) : 'Total'}</div>`;
  }
}

function openBuildDetail(classId) {
  activeClassId = classId;
  // update legend active states
  document.querySelectorAll('#buildLegend .leg-row').forEach((row, i) => {
    row.classList.toggle('active', sortedClasses()[i].id === classId);
  });
  renderBuildDetail();
}

function renderBuildDetail() {
  const holder = document.getElementById('buildDetail');
  if (!holder || !activeClassId) return;
  const cls = model.classes.find(c => c.id === activeClassId);
  if (!cls) return;
  const picks = client.picks[cls.id] || [];
  holder.classList.remove('hidden');
  holder.className = 'card fade-in';

  // build subclass list (read-only) + asset selection
  let subsHtml = '';
  cls.subclasses.forEach((sc, i) => {
    const alpha = 1 - i * (0.5 / Math.max(cls.subclasses.length - 1, 1));
    const scColor = shadeColor(cls.color, 1 - alpha);
    subsHtml += `
      <div class="sub-row">
        <div class="leg-dot" style="background:${scColor}"></div>
        <span class="nm">${esc(sc.name)}</span>
        <span class="pv" data-rs-sub="${sc.value}">${sc.value}%<span class="rs"></span></span>
      </div>`;
  });

  // selected assets with sliders
  let selHtml = '';
  if (picks.length === 0) {
    selHtml = '<div class="empty">Nenhum ativo escolhido ainda. Selecione nos chips abaixo.</div>';
  } else {
    picks.forEach((p, i) => {
      const rs = (client.totalValue || 0) * cls.value / 100 * p.value / 100;
      selHtml += `
        <div class="slider-row">
          <div class="slider-top">
            <span class="nm">${esc(p.name)}</span>
            <span class="pct" id="pct-${cls.id}-${i}">${p.value}%</span>
            <span class="rs" data-rs-asset="${p.value}" data-class-pct="${cls.value}">${client.totalValue > 0 ? formatBRL(rs) : ''}</span>
            <button class="rm" data-cid="${cls.id}" data-idx="${i}" data-act="rmAsset" title="Remover">×</button>
          </div>
          <input type="range" class="slider" min="0" max="100" value="${p.value}" data-cid="${cls.id}" data-idx="${i}" data-act="assetSlider">
        </div>`;
    });
  }

  const subTotal = picks.reduce((s, p) => s + (Number(p.value) || 0), 0);

  // chips by subclass
  let chipsHtml = '';
  cls.subclasses.forEach((sc, i) => {
    const alpha = 1 - i * (0.5 / Math.max(cls.subclasses.length - 1, 1));
    const scColor = shadeColor(cls.color, 1 - alpha);
    const chipBtns = sc.assets.map(a => {
      const picked = picks.some(p => p.name === a);
      return `<button class="chip ${picked ? 'picked' : ''}" data-cid="${cls.id}" data-asset="${esc(a)}" data-act="toggleAsset">${picked ? '<span class="chip-x">✓</span>' : '+ '} ${esc(a)}</button>`;
    }).join('');
    chipsHtml += `
      <div class="groupblock">
        <h4>${esc(sc.name)}<span class="sc-pct">${sc.value}%</span></h4>
        <div class="chips">${chipBtns}</div>
      </div>`;
  });

  holder.innerHTML = `
    <button class="btn btn-sm" id="backToOverview" style="margin-bottom:14px"><i data-lucide="arrow-left"></i> Voltar à Visão Geral da Carteira</button>
    <div class="detail-head"><h3>${esc(cls.name)}</h3><span>${cls.value}% da carteira total${client.totalValue > 0 ? ' · ' + formatBRL(client.totalValue * cls.value / 100) : ''}</span></div>
    <div class="detail-grid">
      <div class="chart-wrap"><canvas id="subChart"></canvas><div class="chart-center" id="subChartCenter"></div></div>
      <div>
        <h4 style="font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">Subclasses</h4>
        ${subsHtml}
      </div>
    </div>
    <div class="detail" style="margin-top:16px;border-top:1px solid var(--line);padding-top:16px">
      <h4 style="font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px">Ativos escolhidos</h4>
      <div id="selList">${selHtml}</div>
      <div class="sumline ${subTotal > 100 ? 'off' : ''}">
        <span id="subTotalSpan">Subtotal: <b>${subTotal}%</b>${picks.length > 0 && subTotal > 100 ? ' — ultrapassou 100%!' : (picks.length > 0 && subTotal < 100 ? ' — faltam ' + (100 - subTotal) + '%' : '')}</span>
        <button class="btn btn-sm" data-cid="${cls.id}" data-act="rebalanceAssets">Equilibrar para 100%</button>
      </div>
    </div>
    <div style="margin-top:14px">${chipsHtml}</div>`;

  // attach events
  holder.querySelectorAll('[data-act="assetSlider"]').forEach(s => {
    s.oninput = e => {
      const cid = e.target.dataset.cid;
      const idx = Number(e.target.dataset.idx);
      const arr = client.picks[cid] || [];
      if (arr[idx]) {
        arr[idx].value = Math.max(0, Math.min(100, Number(e.target.value) || 0));
        saveClient();
        // update display
        const pctEl = document.getElementById(`pct-${cid}-${idx}`);
        if (pctEl) pctEl.textContent = arr[idx].value + '%';
        updateSubTotal(cid);
        updateRValues();
        renderSubDetailChart();
        renderSummaryTable();
      }
    };
  });
  holder.querySelectorAll('[data-act="rmAsset"]').forEach(b => {
    b.onclick = e => {
      const cid = e.currentTarget.dataset.cid;
      const idx = Number(e.currentTarget.dataset.idx);
      const arr = client.picks[cid] || [];
      arr.splice(idx, 1);
      saveClient();
      renderBuildDetail();
      updateBuildLegendCounts();
      renderSummaryTable();
    };
  });
  holder.querySelectorAll('[data-act="toggleAsset"]').forEach(b => {
    b.onclick = e => {
      const cid = e.currentTarget.dataset.cid;
      const name = e.currentTarget.dataset.asset;
      const arr = client.picks[cid] || [];
      const idx = arr.findIndex(p => p.name === name);
      if (idx > -1) arr.splice(idx, 1);
      else arr.push({ name, value: 0 });
      client.picks[cid] = arr;
      saveClient();
      renderBuildDetail();
      updateBuildLegendCounts();
      renderSummaryTable();
    };
  });
  holder.querySelector('[data-act="rebalanceAssets"]').onclick = e => {
    const cid = e.currentTarget.dataset.cid;
    const arr = client.picks[cid] || [];
    if (arr.length) { rebalanceItems(arr); saveClient(); renderBuildDetail(); renderSummaryTable(); }
  };
  holder.querySelector('#backToOverview').onclick = () => {
    activeClassId = null;
    holder.classList.add('hidden');
    document.querySelectorAll('#buildLegend .leg-row').forEach(r => r.classList.remove('active'));
    destroyChart('subChart');
  };

  if (window.lucide) lucide.createIcons();
  renderSubDetailChart();
  updateRValues();
}

function updateSubTotal(cid) {
  const arr = client.picks[cid] || [];
  const subTotal = arr.reduce((s, p) => s + (Number(p.value) || 0), 0);
  const sl = document.querySelector('#buildDetail .sumline');
  if (sl) {
    sl.classList.toggle('off', arr.length > 0 && subTotal > 100);
    const msg = arr.length > 0 && subTotal > 100 ? ' — ultrapassou 100%!' : (arr.length > 0 && subTotal < 100 ? ' — faltam ' + (100 - subTotal) + '%' : '');
    const span = sl.querySelector('#subTotalSpan');
    if (span) span.innerHTML = `Subtotal: <b>${subTotal}%</b>${msg}`;
  }
}

function updateBuildLegendCounts() {
  sortedClasses().forEach((c, i) => {
    const row = document.querySelectorAll('#buildLegend .leg-row')[i];
    if (row) {
      const picks = client.picks[c.id] || [];
      const small = row.querySelector('.leg-name small');
      if (small) small.textContent = `${picks.length} ativo(s) escolhido(s)`;
    }
  });
}

function renderSubDetailChart() {
  if (!activeClassId) return;
  const cls = model.classes.find(c => c.id === activeClassId);
  if (!cls) return;
  const canvas = document.getElementById('subChart');
  if (!canvas) return;
  const picks = client.picks[cls.id] || [];
  if (picks.length === 0) {
    destroyChart('subChart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cc = document.getElementById('subChartCenter');
    if (cc) cc.innerHTML = `<div class="cc-val" style="font-size:13px;color:var(--muted)">Sem ativos</div>`;
    return;
  }
  const items = picks.map(p => ({ name: p.name, value: p.value, color: cls.color }));
  renderDonut('subChart', 'subChartCenter', items, '', '', null);
  const cc = document.getElementById('subChartCenter');
  if (cc) {
    const sub = picks.reduce((s, p) => s + (Number(p.value) || 0), 0);
    cc.innerHTML = `<div class="cc-val">${sub}%</div>`;
  }
}

/* ----- summary ----- */
function buildSummary() {
  const sec = document.createElement('section');
  sec.className = 'section';
  sec.innerHTML = `
    <div class="sec-head"><span class="sec-num">✓</span><h2>Resumo da sua carteira</h2></div>
    <div class="card sum-card">
      <div id="summaryTable"></div>
      <div class="sum-actions">
        <button class="btn btn-primary" id="printBtn"><i data-lucide="printer"></i> Gerar PDF / Imprimir</button>
        <button class="btn btn-danger" id="clearBtn"><i data-lucide="rotate-ccw"></i> Limpar carteira</button>
      </div>
    </div>`;
  sec.querySelector('#printBtn').onclick = printPortfolio;
  sec.querySelector('#clearBtn').onclick = () => {
    if (confirm('Limpar todos os ativos escolhidos?')) {
      client.picks = {}; saveClient(); render(); renderClientDynamic();
    }
  };
  return sec;
}

function renderSummaryTable() {
  const holder = document.getElementById('summaryTable');
  if (!holder) return;
  const total = client.totalValue || 0;
  let html = '<table class="sum-table"><thead><tr><th>Classe / Ativo</th><th class="num">% classe</th><th class="num">% total</th><th class="num">Valor</th></tr></thead><tbody>';
  let hasPicks = false;

  sortedClasses().forEach(c => {
    const picks = sortedPicks(client.picks[c.id] || []);
    if (picks.length === 0) return;
    hasPicks = true;
    const classRS = total * c.value / 100;
    html += `<tr class="cls-row"><td><span class="cls-dot" style="background:${c.color}"></span>${esc(c.name)}</td><td class="num">${c.value}%</td><td class="num">${c.value}%</td><td class="num">${total > 0 ? formatBRL(classRS) : '—'}</td></tr>`;
    picks.forEach(p => {
      const totalPct = (c.value * p.value / 100).toFixed(1);
      const rs = total * c.value / 100 * p.value / 100;
      html += `<tr><td style="padding-left:28px">${esc(p.name)}</td><td class="num">${p.value}%</td><td class="num">${totalPct}%</td><td class="num">${total > 0 ? formatBRL(rs) : '—'}</td></tr>`;
    });
  });

  if (!hasPicks) {
    html += `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:20px">Nenhum ativo selecionado ainda. Use a etapa 3 para montar sua carteira.</td></tr>`;
  }

  html += `</tbody>`;
  if (hasPicks && total > 0) {
    html += `<tfoot><tr><td colspan="3">Total investido</td><td class="num">${formatBRL(total)}</td></tr></tfoot>`;
  }
  html += `</table>`;
  holder.innerHTML = html;
}

/* ----- print / PDF ----- */
function printPortfolio() {
  const total = client.totalValue || 0;
  let html = `
    <div class="print-h1">Resumo da Carteira</div>
    <div class="print-sub">Valor total: ${formatBRL(total)} · Gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
    <table class="print-table"><thead><tr><th>Classe / Ativo</th><th class="num">% classe</th><th class="num">% total</th><th class="num">Valor</th></tr></thead><tbody>`;
  let hasPicks = false;
  sortedClasses().forEach(c => {
    const picks = sortedPicks(client.picks[c.id] || []);
    if (picks.length === 0) return;
    hasPicks = true;
    const classRS = total * c.value / 100;
    html += `<tr class="cls-row"><td><span class="print-dot" style="background:${c.color}"></span>${esc(c.name)}</td><td class="num">${c.value}%</td><td class="num">${c.value}%</td><td class="num">${total > 0 ? formatBRL(classRS) : '—'}</td></tr>`;
    picks.forEach(p => {
      const totalPct = (c.value * p.value / 100).toFixed(1);
      const rs = total * c.value / 100 * p.value / 100;
      html += `<tr><td style="padding-left:22px">${esc(p.name)}</td><td class="num">${p.value}%</td><td class="num">${totalPct}%</td><td class="num">${total > 0 ? formatBRL(rs) : '—'}</td></tr>`;
    });
  });
  if (!hasPicks) {
    html += `<tr><td colspan="4" style="text-align:center;color:#999;padding:16px">Nenhum ativo selecionado.</td></tr>`;
  }
  html += `</tbody>`;
  if (hasPicks && total > 0) {
    html += `<tfoot><tr><td colspan="3">Total investido</td><td class="num">${formatBRL(total)}</td></tr></tfoot>`;
  }
  html += `</table>
    <div class="print-footer">Alocação de referência — não é recomendação de investimento personalizada. Revise sempre seu perfil de risco antes de aplicar.</div>`;
  document.getElementById('printArea').innerHTML = html;
  window.print();
}

/* ================================================================
   INIT
   ================================================================ */
function initTheme() {
  const saved = localStorage.getItem('alloc_theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('themeBtn').onclick = () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : (cur === 'light' ? 'dark' : (isDark() ? 'light' : 'dark'));
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('alloc_theme', next);
    renderClientDynamic();
  };
}

function init() {
  loadState();
  initTheme();
  render();
  document.getElementById('modeBadge').onclick = () => {
    mode = mode === 'admin' ? 'client' : 'admin';
    saveMode();
    render();
  };
}

document.addEventListener('DOMContentLoaded', init);
