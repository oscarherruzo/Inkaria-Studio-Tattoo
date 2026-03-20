/* ══════════════════════════════════════════════════════════
   INKARIA TATTOO INVENTORY — app.js
   Backend: Google Apps Script → Google Sheets
══════════════════════════════════════════════════════════ */

'use strict';

// ┌─────────────────────────────────────────────────────┐
// │  ⚠️  PEGA AQUÍ LA URL DE TU WEB APP (paso 2)        │
// └─────────────────────────────────────────────────────┘
const API_URL = "https://script.google.com/macros/s/AKfycbxrlQ-8C2l6dwdNwx4whyLHloFkX_O0BsgMEq5yOJ5xJmGZWmKUo0L7j7NwC8N-8Zmw/exec";

/* ─── DATOS ESTÁTICOS ───────────────────────────────────── */
const CATEGORY_COLORS = {
  'Máquinas de Tatuaje':      '#ff0066',
  'Agujas y Cartuchos':       '#00cfff',
  'Tintas':                   '#ff6a00',
  'Tintas Color':             '#ff6a00',
  'Tintas Negros':            '#a3e635',
  'Fuentes de Alimentación':  '#a855f7',
  'Grips, Tubos y Tips':      '#00e5a0',
  'Higiene y Sanitario':      '#facc15',
  'Desechables':              '#f472b6',
  'Stencil y Transferencia':  '#38bdf8',
  'Mobiliario Estudio':       '#fb923c',
  'Iluminación':              '#c084fc',
  'Aftercare':                '#4ade80',
  'Material de Práctica':     '#f87171',
  'Accesorios Máquinas':      '#60a5fa',
  'Protección de Equipo':     '#fbbf24',
  'Merchandising / Estudio':  '#e879f9',
};
const DEFAULT_COLORS = Object.values(CATEGORY_COLORS);

const OPCIONES_BASE = {
  'Máquinas de Tatuaje': ['Máquina rotativa','Máquina de bobina','Máquina pen (tipo lápiz)','Máquina inalámbrica','Dermógrafo','Máquina handpoke','Máquina híbrida'],
  'Agujas y Cartuchos':  ['Agujas round liner (RL)','Agujas round shader (RS)','Agujas magnum (MG)','Agujas curved magnum (CM)','Agujas flat','Agujas bugpin','Agujas handpoke','Cartuchos universales','Cartuchos PMU','Cartuchos liner','Cartuchos shader','Cartuchos magnum'],
  'Tintas':              ['Tinta negra','Tinta greywash clara','Tinta greywash media','Tinta greywash oscura','Tinta color — rojo','Tinta color — azul','Tinta color — verde','Tinta color — amarillo','Tinta color — naranja','Tinta color — violeta','Tinta color — blanco','Tinta UV','Pigmento PMU','Diluyente de tinta','Set de tinta completo','Tinta para realismo'],
  'Fuentes de Alimentación': ['Fuente de alimentación digital','Fuente de alimentación analógica','Fuente inalámbrica / batería externa','Pedal / footswitch','Clip cord','Cable RCA','Adaptador jack','Adaptador universal'],
  'Grips, Tubos y Tips': ['Grip desechable','Grip de acero inoxidable','Grip ajustable','Grip ergonómico','Tubo desechable','Tubo autoclavable','Tip / puntera redonda','Tip / puntera plana','Cubre grip'],
  'Higiene y Sanitario': ['Guantes nitrilo (caja)','Guantes látex (caja)','Mascarilla quirúrgica','Mascarilla FFP2','Alcohol isopropílico 70%','Alcohol isopropílico 96%','Clorhexidina','Jabón verde / soft soap','Desinfectante de superficies','Esterilizador autoclave','Bolsas residuos biosanitarios','Contenedor agujas (sharps)','Spray desinfectante'],
  'Desechables':         ['Vasitos para tinta (caps)','Paletinas / espátulas','Funda para máquina','Funda para cable','Film plástico / cling wrap','Papel de camilla','Toallas absorbentes','Cubre grip desechable','Servilletas','Bandeja desechable'],
  'Stencil y Transferencia': ['Papel hectográfico','Papel calco','Gel stencil','Spray transfer / Stencil stuff','Termocopiadora / thermal copier','Rotulador de piel','Compás / regla de tatuaje','Papel transfer térmico'],
  'Mobiliario Estudio':  ['Camilla de tatuaje','Silla tatuador ergonómica','Apoyabrazos regulable','Carrito auxiliar','Mesa de trabajo','Armario de material','Mostrador recepción','Taburete sin respaldo','Estantería abierta'],
  'Iluminación':         ['Lámpara LED brazo articulado','Ring light','Luz lupa / lupa iluminada','Panel LED techo','Foco direccional','Tira LED ambiente'],
  'Aftercare':           ['Crema cicatrizante','Bálsamo tattoo','Film protector (second skin)','Parche second skin','Jabón neutro aftercare','Loción sin perfume','Aceite de coco','Spray aftercare'],
  'Material de Práctica':['Piel sintética (silicona)','Cabeza de práctica','Brazo de práctica','Pierna de práctica','Pigmentos para práctica','Kit de aprendizaje completo','Libro de diseños / flash'],
  'Accesorios Máquinas': ['Motor de repuesto','Batería de repuesto','Tornillos / tuercas','Muelles (front/back spring)','O-rings','Piezas de contacto','Adaptador pen — cartucho','Llave de ajuste'],
  'Protección de Equipo':['Funda para máquina','Funda para clip cord','Funda para botella','Funda para grip','Estuche de transporte','Bolsa de trabajo','Maletín de tattoo'],
  'Merchandising / Estudio': ['Camiseta tatuador','Delantal','Guantes personalizados','Stickers / pegatinas','Póster decorativo','Tarjetas de visita','Colgante / llavero','Packaging regalo'],
};

const UMBRAL_ALERTAS = {
  'Agujas y Cartuchos':  5,
  'Tintas':              3,
  'Higiene y Sanitario': 10,
  'Desechables':         20,
  'Grips, Tubos y Tips': 5,
};

/* ─── API ────────────────────────────────────────────────── */
async function apiGet(params) {
  const url = API_URL + '?' + new URLSearchParams(params);
  const res  = await fetch(url);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

async function apiPost(body) {
  const res  = await fetch(API_URL, {
    method: 'POST',
    body:   JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

/* ─── CACHE en memoria (para no pedir a Sheets en cada render) ── */
const CACHE = {
  registrosMes:  null,  // { mes, data }
  allRegistros:  null,
  proveedores:   null,
  catalogo:      null,  // { cat: [prods] }
  meses:         null,
};

function invalidate(key) { CACHE[key] = null; }

async function getMeses() {
  if (!CACHE.meses) CACHE.meses = await apiGet({ action: 'getMeses' });
  return CACHE.meses;
}
async function getRegistrosMes(mes) {
  if (CACHE.registrosMes?.mes === mes) return CACHE.registrosMes.data;
  const raw  = await apiGet({ action: 'getRegistros', mes });
  const data = raw.map(normalizeRegistro);
  CACHE.registrosMes = { mes, data };
  return data;
}
async function getAllRegistros() {
  if (CACHE.allRegistros) return CACHE.allRegistros;
  const raw  = await apiGet({ action: 'getAllRegistros' });
  CACHE.allRegistros = raw.map(normalizeRegistro);
  return CACHE.allRegistros;
}
async function getProveedores() {
  if (CACHE.proveedores) return CACHE.proveedores;
  const raw = await apiGet({ action: 'getProveedores' });
  CACHE.proveedores = raw.map(r => ({
    nombre: r[0] || '', cat: r[1] || '', web: r[2] || '',
    tel: r[3] || '', notas: r[4] || '', fav: r[5] === '⭐'
  }));
  return CACHE.proveedores;
}
async function getCatalogo() {
  if (CACHE.catalogo) return CACHE.catalogo;
  CACHE.catalogo = await apiGet({ action: 'getCatalogo' });
  return CACHE.catalogo;
}

function normalizeRegistro(r) {
  // r es array [Fecha, Cat, Prod, Prov, Cant, Precio, Notas] + r.mes del getAllRegistros
  const precio = parseFloat(String(r[5] || 0).replace(',', '.')) || 0;
  return {
    fecha: r[0] || '', cat: r[1] || '', prod: r[2] || '',
    prov:  r[3] || '', cant: parseInt(r[4]) || 0,
    precio, notas: r[6] || '', mes: r.mes || ''
  };
}

function opciones(catExtra = {}) {
  const merged = {};
  Object.keys(OPCIONES_BASE).forEach(k => { merged[k] = [...OPCIONES_BASE[k]]; });
  Object.keys(catExtra).forEach(k => {
    if (!merged[k]) merged[k] = [];
    (catExtra[k] || []).forEach(p => { if (!merged[k].includes(p)) merged[k].push(p); });
  });
  return merged;
}

/* ─── HELPERS ────────────────────────────────────────────── */
function catColor(cat, idx = 0) { return CATEGORY_COLORS[cat] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]; }
function dot(color, size = 7) { return `<span style="display:inline-block;width:${size}px;height:${size}px;border-radius:50%;background:${color};margin-right:5px;vertical-align:middle;flex-shrink:0;"></span>`; }
function todayStr() { return new Date().toLocaleDateString('es-ES', {day:'2-digit',month:'2-digit',year:'numeric'}); }
function currentMes() { return new Date().toLocaleDateString('es-ES', {month:'long',year:'numeric'}); }
function showMsg(el, type, text, ms = 3500) {
  if (!el) return;
  el.innerHTML = `<div class="msg msg-${type}">${text}</div>`;
  if (ms) setTimeout(() => { el.innerHTML = ''; }, ms);
}
function setLoading(el, text = 'Cargando...') {
  if (!el) return;
  el.innerHTML = `<div class="empty-state"><div class="icon" style="animation:spin .8s linear infinite;display:inline-block">⏳</div>${text}</div>`;
}
function exportCSV(registros, filename) {
  const cols = ['Fecha','Mes','Categoría','Producto','Proveedor','Cantidad','Total €','Notas'];
  const rows = registros.map(r => [r.fecha, r.mes||'', r.cat, r.prod, r.prov, r.cant, r.precio.toFixed(2).replace('.',','), r.notas]);
  const csv  = [cols, ...rows].map(r => r.join(';')).join('\n');
  const blob = new Blob(['\ufeff'+csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

/* ─── LOGIN ──────────────────────────────────────────────── */
const AUTH = {
  _u: atob('SW5rYXJpYQ=='),
  _p: atob('SW5rYXJpYVRhdHRvbzIwMjZNYXJpYQ=='),
  isLogged: () => sessionStorage.getItem('ink_auth') === '1',
  login:    () => sessionStorage.setItem('ink_auth', '1'),
  logout:   () => { sessionStorage.removeItem('ink_auth'); location.reload(); },
  check:    (u, p) => u === AUTH._u && p === AUTH._p,
};

function initLogin() {
  if (AUTH.isLogged()) { showApp(); return; }
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-wrapper').style.display  = 'none';

  document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const u = document.getElementById('login-user').value.trim();
    const p = document.getElementById('login-pass').value;
    if (AUTH.check(u, p)) {
      AUTH.login(); showApp();
    } else {
      const err = document.getElementById('login-error');
      err.textContent = 'Usuario o contraseña incorrectos.';
      err.style.display = 'block';
      document.getElementById('login-pass').value = '';
      document.getElementById('login-pass').focus();
      document.getElementById('login-box').classList.add('shake');
      setTimeout(() => document.getElementById('login-box').classList.remove('shake'), 500);
    }
  });
  document.getElementById('login-eye').addEventListener('click', function() {
    const inp = document.getElementById('login-pass');
    const show = inp.type === 'text';
    inp.type = show ? 'password' : 'text';
    this.textContent = show ? '👁️' : '🙈';
  });
}

async function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-wrapper').style.display  = 'block';
  document.getElementById('btn-logout').addEventListener('click', () => {
    if (confirm('¿Cerrar sesión?')) AUTH.logout();
  });
  await initRegistroTab();
  initTabs();
}

/* ─── TABS ───────────────────────────────────────────────── */
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const id = btn.dataset.tab;
      document.getElementById(id).classList.add('active');
      if (id === 'tab-dashboard')   await renderDashboard();
      if (id === 'tab-buscador')    await initBuscador();
      if (id === 'tab-proveedores') await renderProveedores();
      if (id === 'tab-catalogo')    await renderCatalogo();
    });
  });
}

/* ══════════════════════════════════════════════════════════
   TAB 1 — REGISTRO
══════════════════════════════════════════════════════════ */
let mesActivo = currentMes();
const chartInstances = {};

async function initRegistroTab() {
  // Cargar catálogo para los selects
  let catExtra = {};
  try { catExtra = await getCatalogo(); } catch(_) {}
  const opts = opciones(catExtra);

  buildSelect('form-cat', Object.keys(opts));
  buildProdSelect(Object.keys(opts)[0], opts);
  await buildMesSelect();
  await buildProvSelect();

  document.getElementById('form-cat').addEventListener('change', function() {
    buildProdSelect(this.value, opts);
  });
  document.getElementById('form-prov').addEventListener('change', toggleProvInput);

  document.getElementById('registro-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = this.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = '⏳ Guardando...';
    try {
      const cat      = document.getElementById('form-cat').value;
      const prod     = document.getElementById('form-prod').value;
      const provSel  = document.getElementById('form-prov').value;
      const provNuevo= document.getElementById('form-prov-nuevo')?.value?.trim();
      const prov     = provSel || provNuevo || '—';
      const cant     = parseInt(document.getElementById('form-cant').value) || 1;
      const precio   = parseFloat(document.getElementById('form-precio').value) || 0;
      const notas    = document.getElementById('form-notas').value.trim() || '—';
      const fecha    = todayStr();

      await apiPost({
        action: 'addRegistro',
        mes:    mesActivo,
        row:    [fecha, cat, prod, prov, cant, String(precio).replace('.',','), notas]
      });

      // Invalidar cache del mes
      invalidate('registrosMes');
      invalidate('allRegistros');

      showMsg(document.getElementById('form-msg'), 'success', '✅ Registro guardado en Google Sheets.');
      this.reset();
      buildProdSelect(cat, opts);
      await buildProvSelect();
      await renderHistorial();
      await renderAnalytics();
    } catch(err) {
      showMsg(document.getElementById('form-msg'), 'error', '❌ Error: ' + err.message);
    }
    btn.disabled = false; btn.textContent = '✓  Confirmar Registro';
  });

  document.getElementById('mes-select').addEventListener('change', async function() {
    mesActivo = this.value;
    invalidate('registrosMes');
    await renderHistorial();
    await renderAnalytics();
  });

  document.getElementById('btn-export-mes')?.addEventListener('click', async () => {
    const data = await getRegistrosMes(mesActivo);
    exportCSV(data.map(r => ({...r, mes: mesActivo})), `inkaria_${mesActivo.replace(/ /g,'_')}.csv`);
  });

  await renderHistorial();
  await renderAnalytics();
}

function buildSelect(id, items, emptyLabel = null) {
  const el = document.getElementById(id);
  el.innerHTML = (emptyLabel ? `<option value="">${emptyLabel}</option>` : '') +
    items.map(i => `<option value="${i}">${i}</option>`).join('');
}

function buildProdSelect(cat, opts) {
  const prods = (opts || opciones())[cat] || [];
  document.getElementById('form-prod').innerHTML = prods.map(p => `<option value="${p}">${p}</option>`).join('');
}

async function buildProvSelect() {
  let provs = [];
  try { provs = (await getProveedores()).map(p => p.nombre).sort(); } catch(_) {}
  const el = document.getElementById('form-prov');
  el.innerHTML = `<option value="">Escribir nuevo...</option>` +
    provs.map(p => `<option value="${p}">${p}</option>`).join('');
  toggleProvInput();
}

function toggleProvInput() {
  const sel = document.getElementById('form-prov').value;
  const inp = document.getElementById('prov-nuevo-wrap');
  if (inp) inp.style.display = sel ? 'none' : 'block';
}

async function buildMesSelect() {
  let meses = [];
  try {
    meses = await getMeses();
    if (!meses.includes(mesActivo)) meses.push(mesActivo);
  } catch(_) { meses = [mesActivo]; }
  meses.sort().reverse();
  const el = document.getElementById('mes-select');
  el.innerHTML = meses.map(m => `<option value="${m}" ${m===mesActivo?'selected':''}>${m}</option>`).join('');
}

async function renderHistorial() {
  const tbody = document.getElementById('historial-tbody');
  setLoading(tbody, 'Cargando registros...');
  try {
    const registros = await getRegistrosMes(mesActivo);
    if (!registros.length) {
      tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><div class="icon">📭</div>Sin registros este mes.</div></td></tr>`;
      return;
    }
    const last10 = [...registros].reverse().slice(0, 10);
    tbody.innerHTML = last10.map(r => `<tr>
      <td class="muted">${r.fecha}</td>
      <td>${dot(catColor(r.cat))}${r.cat}</td>
      <td style="color:rgba(240,230,255,0.85)">${r.prod}</td>
      <td class="right pink">${r.precio > 0 ? r.precio.toFixed(2)+' €' : '<span style="opacity:.3">0.00 €</span>'}</td>
    </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="msg msg-error">❌ Error cargando datos: ${e.message}</div></td></tr>`;
  }
}

async function renderAnalytics() {
  const el = document.getElementById('analytics-mes');
  if (el) el.textContent = `📊 Analytics · ${mesActivo}`;
  try {
    const registros = await getRegistrosMes(mesActivo);
    const total  = registros.reduce((s,r) => s+r.precio, 0);
    const n      = registros.length;
    const ticket = n ? total/n : 0;
    document.getElementById('metric-total').textContent  = total.toLocaleString('es-ES',{minimumFractionDigits:2})+' €';
    document.getElementById('metric-ticket').textContent = ticket.toLocaleString('es-ES',{minimumFractionDigits:2})+' €';
    renderDonut('donut-mes', registros, total);
    renderAlertas(registros);
  } catch(e) {
    console.error('Analytics error:', e);
  }
}

/* ─── Donut Chart ────────────────────────────────────────── */
function renderDonut(canvasId, registros, total) {
  if (chartInstances[canvasId]) { chartInstances[canvasId].destroy(); }
  if (!registros.length || total === 0) {
    const wrap = document.getElementById(canvasId)?.closest('.donut-wrap');
    if (wrap) wrap.innerHTML = `<div class="empty-state" style="padding:40px 0"><div class="icon">📊</div>Sin datos</div>`;
    return;
  }
  const map = {};
  registros.forEach(r => { map[r.cat] = (map[r.cat]||0)+r.precio; });
  const sorted = Object.entries(map).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  const labels = sorted.map(([k])=>k);
  const vals   = sorted.map(([,v])=>v);
  const colors = labels.map((k,i)=>catColor(k,i));
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  chartInstances[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets:[{ data:vals, backgroundColor:colors, borderColor:'#0a0010', borderWidth:3, hoverOffset:6 }] },
    options: {
      cutout:'60%',
      plugins:{
        legend:{display:false},
        tooltip:{
          callbacks:{label:ctx=>` ${ctx.parsed.toFixed(2)} € (${(ctx.parsed/total*100).toFixed(0)}%)`},
          backgroundColor:'#1a0030',borderColor:'#ff0095',borderWidth:1,titleColor:'#fff',bodyColor:'rgba(240,230,255,0.8)'
        }
      },
      animation:{animateRotate:true,duration:600}
    }
  });
  const legEl = document.getElementById(canvasId+'-leyenda');
  if (legEl) legEl.innerHTML = sorted.map(([k,v],i)=>`
    <div class="desglose-row">
      <span class="desglose-cat">${dot(catColor(k,i))}${k}</span>
      <span class="desglose-val">${v.toFixed(2)} €<span class="desglose-pct">(${(v/total*100).toFixed(0)}%)</span></span>
    </div>`).join('');
}

/* ─── Bar Chart Mensual ──────────────────────────────────── */
function renderBarChart(canvasId, registros) {
  if (chartInstances[canvasId]) { chartInstances[canvasId].destroy(); }
  const canvas = document.getElementById(canvasId);
  if (!canvas || !registros.length) return;
  const map = {};
  registros.forEach(r => { map[r.mes||r.fecha] = (map[r.mes||r.fecha]||0)+r.precio; });
  const entries = Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0]));
  chartInstances[canvasId] = new Chart(canvas, {
    type:'bar',
    data:{
      labels: entries.map(([k])=>k),
      datasets:[{ data:entries.map(([,v])=>v), backgroundColor:entries.map((_,i)=>`hsl(${290+i*18},85%,55%)`), borderRadius:6, borderSkipped:false }]
    },
    options:{
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.y.toFixed(2)} €`},backgroundColor:'#1a0030',borderColor:'#ff0095',borderWidth:1,titleColor:'#fff',bodyColor:'rgba(240,230,255,0.8)'}
      },
      scales:{
        x:{ticks:{color:'rgba(255,255,255,0.5)',font:{size:11}},grid:{color:'rgba(255,255,255,0.05)'}},
        y:{ticks:{color:'rgba(255,255,255,0.4)',font:{size:10},callback:v=>v+'€'},grid:{color:'rgba(255,255,255,0.06)'}}
      },
      animation:{duration:600}
    }
  });
}

/* ─── Alertas de Stock ───────────────────────────────────── */
function renderAlertas(registros) {
  const wrap = document.getElementById('alertas-wrap');
  if (!wrap) return;
  const alertas = Object.entries(UMBRAL_ALERTAS).map(([cat,umbral]) => {
    const qty = registros.filter(r=>r.cat===cat).reduce((s,r)=>s+r.cant,0);
    return {cat, qty, umbral};
  }).filter(a => a.qty < a.umbral && registros.some(r=>r.cat===a.cat));
  if (!alertas.length) { wrap.innerHTML=''; return; }
  wrap.innerHTML = `<div class="card">
    <div class="card-label">⚠️ Alertas de Stock</div>
    ${alertas.map(a => {
      const color = catColor(a.cat);
      const pct   = Math.min(Math.round(a.qty/a.umbral*100),100);
      return `<div class="alert-item">
        <div class="alert-row">
          <span class="alert-cat">${dot(color)}${a.cat}</span>
          <span class="alert-qty">${a.qty} uds</span>
        </div>
        <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
      </div>`;
    }).join('')}
  </div>`;
}

/* ══════════════════════════════════════════════════════════
   TAB 2 — DASHBOARD ANUAL
══════════════════════════════════════════════════════════ */
async function renderDashboard() {
  const wrap = document.getElementById('dashboard-content');
  setLoading(wrap, 'Cargando todos los meses...');
  try {
    const registros = await getAllRegistros();
    if (!registros.length) {
      wrap.innerHTML = `<div class="msg msg-info">Sin datos todavía.</div>`; return;
    }

    const total  = registros.reduce((s,r)=>s+r.precio,0);
    const meses  = [...new Set(registros.map(r=>r.mes))];
    const media  = total/meses.length;
    const byMes  = {};
    registros.forEach(r => { byMes[r.mes]=(byMes[r.mes]||0)+r.precio; });
    const [mesCaro, gastoTop] = Object.entries(byMes).sort((a,b)=>b[1]-a[1])[0];

    wrap.innerHTML = `
      <div class="grid-3" style="margin-bottom:16px;">
        <div class="metric-box"><div class="metric-label">Gasto Anual Total</div><div class="metric-value" id="dash-total"></div></div>
        <div class="metric-box"><div class="metric-label">Media Mensual</div><div class="metric-value" id="dash-media"></div></div>
        <div class="metric-box">
          <div class="metric-label">Mes Más Caro</div>
          <div class="metric-value sm" id="dash-mes-caro"></div>
          <div class="metric-value" id="dash-gasto-top" style="font-size:1.8rem;line-height:1;"></div>
        </div>
      </div>
      <div class="grid-16">
        <div class="card"><div class="card-label">📊 Gasto por Mes</div><div class="chart-wrap"><canvas id="bar-anual" height="320"></canvas></div></div>
        <div class="card"><div class="card-label">🍩 Por Categoría (anual)</div><div class="donut-wrap"><canvas id="donut-anual" height="260"></canvas></div><div id="donut-anual-leyenda" style="margin-top:8px;"></div></div>
      </div>
      <div class="card"><div class="card-label">🏆 Top 5 Productos Más Gastados</div><div id="top5-list"></div></div>
      <button class="btn btn-secondary" id="btn-export-anual" style="width:auto">⬇️ &nbsp;Exportar CSV Anual</button>`;

    document.getElementById('dash-total').textContent    = total.toLocaleString('es-ES',{minimumFractionDigits:2})+' €';
    document.getElementById('dash-media').textContent    = media.toLocaleString('es-ES',{minimumFractionDigits:2})+' €';
    document.getElementById('dash-mes-caro').textContent = mesCaro;
    document.getElementById('dash-gasto-top').textContent= gastoTop.toLocaleString('es-ES',{minimumFractionDigits:0})+'€';

    renderBarChart('bar-anual', registros);
    renderDonut('donut-anual', registros, total);
    renderTop5(registros);

    document.getElementById('btn-export-anual')?.addEventListener('click', () => {
      exportCSV(registros, `inkaria_anual_${new Date().getFullYear()}.csv`);
    });
  } catch(e) {
    wrap.innerHTML = `<div class="msg msg-error">❌ Error: ${e.message}</div>`;
  }
}

function renderTop5(registros) {
  const map  = {};
  registros.forEach(r => { map[r.prod]=(map[r.prod]||0)+r.precio; });
  const top5 = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxV = top5[0]?.[1]||1;
  const el   = document.getElementById('top5-list');
  if (!el) return;
  el.innerHTML = top5.map(([prod,val],i)=>`<div class="top5-item">
    <div class="top5-row">
      <span class="top5-name">#${i+1} &nbsp;${prod}</span>
      <span class="top5-val">${val.toFixed(2)} €</span>
    </div>
    <div class="bar-bg"><div class="bar-fill" style="width:${val/maxV*100}%;background:linear-gradient(90deg,#ff0095,#cc00ff)"></div></div>
  </div>`).join('');
}

/* ══════════════════════════════════════════════════════════
   TAB 3 — BUSCADOR
══════════════════════════════════════════════════════════ */
let buscadorInited = false;
async function initBuscador() {
  if (!buscadorInited) {
    let catExtra = {};
    try { catExtra = await getCatalogo(); } catch(_) {}
    const opts = opciones(catExtra);
    buildSelect('busq-cat', Object.keys(opts), 'Todas las categorías');
    document.getElementById('busq-form').addEventListener('input', renderBuscador);
    document.getElementById('btn-export-busq')?.addEventListener('click', async () => {
      const data = await filteredRegistros();
      exportCSV(data, 'inkaria_busqueda.csv');
    });
    buscadorInited = true;
  }
  // Actualizar meses
  let meses = [];
  try { meses = await getMeses(); } catch(_) {}
  buildSelect('busq-mes', meses, 'Todos los meses');
  await renderBuscador();
}

async function filteredRegistros() {
  const q   = document.getElementById('busq-q').value.trim().toLowerCase();
  const cat = document.getElementById('busq-cat').value;
  const mes = document.getElementById('busq-mes').value;
  let data  = mes ? await getRegistrosMes(mes) : await getAllRegistros();
  if (!mes) {} // mes ya incluido en allRegistros
  if (q)   data = data.filter(r=>r.prod.toLowerCase().includes(q)||r.prov.toLowerCase().includes(q));
  if (cat) data = data.filter(r=>r.cat===cat);
  return data;
}

async function renderBuscador() {
  const wrap = document.getElementById('busq-results');
  setLoading(wrap, 'Buscando...');
  try {
    const data  = await filteredRegistros();
    const total = data.reduce((s,r)=>s+r.precio,0);
    document.getElementById('busq-count').textContent = `${data.length} resultados`;
    document.getElementById('busq-total').textContent = `Total: ${total.toFixed(2)} €`;
    const mes = document.getElementById('busq-mes').value;
    if (!data.length) { wrap.innerHTML=`<div class="empty-state"><div class="icon">🔍</div>Sin resultados.</div>`; return; }
    const showMes = !mes;
    wrap.innerHTML=`<table class="hist-table">
      <thead><tr><th>Fecha</th>${showMes?'<th>Mes</th>':''}<th>Categoría</th><th>Producto</th><th>Proveedor</th><th class="right">Total</th></tr></thead>
      <tbody>${data.map(r=>`<tr>
        <td class="muted">${r.fecha}</td>
        ${showMes?`<td class="muted" style="font-size:.72rem">${r.mes}</td>`:''}
        <td>${dot(catColor(r.cat))}${r.cat}</td>
        <td style="color:var(--text)">${r.prod}</td>
        <td class="muted">${r.prov}</td>
        <td class="right pink">${r.precio.toFixed(2)} €</td>
      </tr>`).join('')}</tbody>
    </table>`;
  } catch(e) {
    wrap.innerHTML=`<div class="msg msg-error">❌ Error: ${e.message}</div>`;
  }
}

/* ══════════════════════════════════════════════════════════
   TAB 4 — PROVEEDORES
══════════════════════════════════════════════════════════ */
let provInited = false;
async function renderProveedores() {
  if (!provInited) {
    let catExtra = {};
    try { catExtra = await getCatalogo(); } catch(_) {}
    buildSelect('prov-cat', Object.keys(opciones(catExtra)));
    document.getElementById('prov-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const nombre = document.getElementById('prov-nombre').value.trim();
      if (!nombre) { showMsg(document.getElementById('prov-msg'),'error','El nombre es obligatorio.'); return; }
      const btn = this.querySelector('button[type=submit]');
      btn.disabled=true;
      try {
        await apiPost({ action:'addProveedor', row:[
          nombre,
          document.getElementById('prov-cat').value,
          document.getElementById('prov-web').value.trim(),
          document.getElementById('prov-tel').value.trim(),
          document.getElementById('prov-notas').value.trim()||'—',
          document.getElementById('prov-fav').checked ? '⭐' : ''
        ]});
        invalidate('proveedores');
        showMsg(document.getElementById('prov-msg'),'success',`✅ Proveedor '${nombre}' guardado.`);
        this.reset();
        await renderProveedores();
        await buildProvSelect();
      } catch(err) {
        showMsg(document.getElementById('prov-msg'),'error','❌ '+err.message);
      }
      btn.disabled=false;
    });
    document.getElementById('prov-busq').addEventListener('input', renderProveedores);
    provInited = true;
  }

  const wrap = document.getElementById('prov-list');
  setLoading(wrap, 'Cargando proveedores...');
  try {
    const q    = document.getElementById('prov-busq').value.trim().toLowerCase();
    let provs  = await getProveedores();
    if (q) provs = provs.filter(p=>p.nombre.toLowerCase().includes(q)||p.cat.toLowerCase().includes(q));
    provs = [...provs].sort((a,b)=>(b.fav?1:0)-(a.fav?1:0));
    if (!provs.length) { wrap.innerHTML=`<div class="empty-state"><div class="icon">🏪</div>No hay proveedores.</div>`; return; }
    wrap.innerHTML = provs.map(p=>{
      const color   = catColor(p.cat);
      const webLink = p.web?.startsWith('http') ? `<a class="prov-link" href="${p.web}" target="_blank">${p.web}</a>` : `<span class="prov-tel">${p.web||''}</span>`;
      return `<div class="prov-item">
        <div class="prov-name-row">
          ${dot(color,9)}<span class="prov-name">${p.fav?'⭐ ':''}${p.nombre}</span>
          <span class="prov-tag">${p.cat}</span>
        </div>
        <div class="prov-links">${webLink}${p.tel?`<span class="prov-tel">📞 ${p.tel}</span>`:''}</div>
        ${p.notas&&p.notas!=='—'?`<div class="prov-note">${p.notas}</div>`:''}
      </div>`;
    }).join('');
  } catch(e) {
    wrap.innerHTML=`<div class="msg msg-error">❌ Error: ${e.message}</div>`;
  }
}

/* ══════════════════════════════════════════════════════════
   TAB 5 — CATÁLOGO
══════════════════════════════════════════════════════════ */
let catInited = false;
async function renderCatalogo() {
  if (!catInited) {
    document.getElementById('cat-nueva-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const nombre = document.getElementById('cat-nueva-input').value.trim();
      if (!nombre) { showMsg(document.getElementById('cat-msg'),'error','Escribe un nombre.'); return; }
      const btn = this.querySelector('button[type=submit]'); btn.disabled=true;
      try {
        await apiPost({ action:'addCatItem', row:[nombre,''] });
        invalidate('catalogo');
        document.getElementById('cat-nueva-input').value='';
        showMsg(document.getElementById('cat-msg'),'success',`✅ Categoría '${nombre}' añadida.`);
        await renderCatalogo();
      } catch(err) { showMsg(document.getElementById('cat-msg'),'error','❌ '+err.message); }
      btn.disabled=false;
    });
    document.getElementById('prod-nuevo-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const cat  = document.getElementById('prod-cat-dest').value;
      const prod = document.getElementById('prod-nuevo-input').value.trim();
      if (!prod) { showMsg(document.getElementById('prod-msg'),'error','Escribe un nombre.'); return; }
      const btn = this.querySelector('button[type=submit]'); btn.disabled=true;
      try {
        await apiPost({ action:'addCatItem', row:[cat, prod] });
        invalidate('catalogo');
        document.getElementById('prod-nuevo-input').value='';
        showMsg(document.getElementById('prod-msg'),'success',`✅ '${prod}' añadido a '${cat}'.`);
        await renderCatalogo();
      } catch(err) { showMsg(document.getElementById('prod-msg'),'error','❌ '+err.message); }
      btn.disabled=false;
    });
    document.getElementById('cat-filtro').addEventListener('input', renderCatalogo);
    catInited = true;
  }

  const listEl = document.getElementById('catalogo-list');
  setLoading(listEl, 'Cargando catálogo...');
  try {
    let catExtra = {};
    try { catExtra = await getCatalogo(); } catch(_) {}
    const opts   = opciones(catExtra);
    const custom = new Set(Object.keys(catExtra));
    buildSelect('prod-cat-dest', Object.keys(opts));

    const q    = document.getElementById('cat-filtro').value.trim().toLowerCase();
    const cats = Object.keys(opts).filter(k => !q || k.toLowerCase().includes(q) || opts[k].some(p=>p.toLowerCase().includes(q))).sort();
    if (!cats.length) { listEl.innerHTML=`<div class="empty-state">Sin resultados.</div>`; return; }
    listEl.innerHTML = cats.map(k=>{
      const prods  = q ? opts[k].filter(p=>p.toLowerCase().includes(q)||k.toLowerCase().includes(q)) : opts[k];
      const color  = catColor(k);
      const isNew  = custom.has(k) && !OPCIONES_BASE[k];
      return `<div class="cat-section">
        <div class="cat-section-header">
          ${dot(color,9)}<span class="cat-section-name">${k}</span>
          ${isNew?'<span class="cat-badge-custom">tuya</span>':''}
          <span class="cat-section-count">${opts[k].length} prod.</span>
        </div>
        <div class="prod-chips">${prods.slice(0,24).map(p=>`<span class="prod-chip">${p}</span>`).join('')}${prods.length>24?`<span style="font-size:.7rem;color:rgba(255,255,255,.3)">+${prods.length-24} más</span>`:''}</div>
      </div>`;
    }).join('');
  } catch(e) {
    listEl.innerHTML=`<div class="msg msg-error">❌ Error: ${e.message}</div>`;
  }
}

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', initLogin);
