/* ══════════════════════════════════════════════════════════
   INKARIA TATTOO INVENTORY — app.js
   Backend: localStorage  |  Charts: Chart.js
══════════════════════════════════════════════════════════ */

'use strict';

/* ─── DATOS ─────────────────────────────────────────────── */
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

/* ─── STORAGE ────────────────────────────────────────────── */
const DB = {
  getRegistros:   ()  => JSON.parse(localStorage.getItem('ink_registros')  || '[]'),
  setRegistros:   (d) => localStorage.setItem('ink_registros',   JSON.stringify(d)),
  getProveedores: ()  => JSON.parse(localStorage.getItem('ink_proveedores') || '[]'),
  setProveedores: (d) => localStorage.setItem('ink_proveedores', JSON.stringify(d)),
  getCatalogo:    ()  => JSON.parse(localStorage.getItem('ink_catalogo')    || '{}'),
  setCatalogo:    (d) => localStorage.setItem('ink_catalogo',    JSON.stringify(d)),
};

/* ─── HELPERS ────────────────────────────────────────────── */
function catColor(cat, idx = 0) {
  return CATEGORY_COLORS[cat] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
}
function dot(color) {
  return `<span class="cat-dot" style="background:${color};display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px;vertical-align:middle;"></span>`;
}
function todayStr() {
  return new Date().toLocaleDateString('es-ES', {day:'2-digit',month:'2-digit',year:'numeric'});
}
function currentMes() {
  return new Date().toLocaleDateString('es-ES', {month:'long',year:'numeric'});
}
function allMeses(registros) {
  const set = new Set(registros.map(r => r.mes));
  return [...set].sort();
}
function opciones() {
  const cat = DB.getCatalogo();
  const merged = {};
  Object.keys(OPCIONES_BASE).forEach(k => { merged[k] = [...OPCIONES_BASE[k]]; });
  Object.keys(cat).forEach(k => {
    if (!merged[k]) merged[k] = [];
    (cat[k] || []).forEach(p => { if (!merged[k].includes(p)) merged[k].push(p); });
  });
  return merged;
}
function showMsg(el, type, text, ms = 3000) {
  el.innerHTML = `<div class="msg msg-${type}">${text}</div>`;
  if (ms) setTimeout(() => { el.innerHTML = ''; }, ms);
}

/* ─── TABS ───────────────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(target).classList.add('active');
    if (target === 'tab-dashboard') renderDashboard();
    if (target === 'tab-catalogo')  renderCatalogo();
    if (target === 'tab-proveedores') renderProveedores();
    if (target === 'tab-buscador') renderBuscador();
  });
});

/* ══════════════════════════════════════════════════════════
   TAB 1 — REGISTRO
══════════════════════════════════════════════════════════ */
let mesActivo = currentMes();

function buildCatSelect(elId, selected) {
  const opts = opciones();
  const el = document.getElementById(elId);
  el.innerHTML = Object.keys(opts).map(k =>
    `<option value="${k}" ${k === selected ? 'selected' : ''}>${k}</option>`
  ).join('');
}

function buildProdSelect(cat) {
  const opts = opciones();
  const prods = opts[cat] || [];
  const el = document.getElementById('form-prod');
  el.innerHTML = prods.map(p => `<option value="${p}">${p}</option>`).join('');
}

function buildProvSelect() {
  const provs = DB.getProveedores().map(p => p.nombre).sort();
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

function buildMesSelect() {
  const registros = DB.getRegistros();
  const meses = allMeses(registros);
  if (!meses.includes(mesActivo)) meses.push(mesActivo);
  meses.sort().reverse();
  const el = document.getElementById('mes-select');
  el.innerHTML = meses.map(m =>
    `<option value="${m}" ${m === mesActivo ? 'selected' : ''}>${m}</option>`
  ).join('');
}

function initRegistroForm() {
  buildCatSelect('form-cat', Object.keys(opciones())[0]);
  buildProdSelect(Object.keys(opciones())[0]);
  buildProvSelect();
  buildMesSelect();

  document.getElementById('form-cat').addEventListener('change', function() {
    buildProdSelect(this.value);
  });
  document.getElementById('form-prov').addEventListener('change', toggleProvInput);

  document.getElementById('mes-select').addEventListener('change', function() {
    mesActivo = this.value;
    renderHistorial();
    renderAnalytics();
  });

  document.getElementById('registro-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const cat      = document.getElementById('form-cat').value;
    const prod     = document.getElementById('form-prod').value;
    const provSel  = document.getElementById('form-prov').value;
    const provNuevo= document.getElementById('form-prov-nuevo')?.value?.trim();
    const prov     = provSel || provNuevo || '—';
    const cant     = parseInt(document.getElementById('form-cant').value) || 1;
    const precio   = parseFloat(document.getElementById('form-precio').value) || 0;
    const notas    = document.getElementById('form-notas').value.trim() || '—';

    const registros = DB.getRegistros();
    registros.push({
      id:    Date.now(),
      fecha: todayStr(),
      mes:   mesActivo,
      cat, prod, prov, cant, precio, notas
    });
    DB.setRegistros(registros);

    showMsg(document.getElementById('form-msg'), 'success', '✅ Registro guardado.');
    this.reset();
    buildProdSelect(cat);
    buildProvSelect();
    buildMesSelect();
    renderHistorial();
    renderAnalytics();
  });
}

function renderHistorial() {
  const registros = DB.getRegistros().filter(r => r.mes === mesActivo);
  const tbody = document.getElementById('historial-tbody');

  if (!registros.length) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><div class="icon">📭</div>Sin registros este mes.</div></td></tr>`;
    return;
  }
  const last10 = [...registros].reverse().slice(0, 10);
  tbody.innerHTML = last10.map(r => {
    const color = catColor(r.cat);
    return `<tr>
      <td class="muted">${r.fecha}</td>
      <td>${dot(color)}${r.cat}</td>
      <td style="color:rgba(240,230,255,0.85)">${r.prod}</td>
      <td class="right pink">${r.precio > 0 ? r.precio.toFixed(2) + ' €' : '<span style="opacity:.3">0.00 €</span>'}</td>
    </tr>`;
  }).join('');
}

function renderAnalytics() {
  const registros = DB.getRegistros().filter(r => r.mes === mesActivo);
  const total     = registros.reduce((s, r) => s + r.precio, 0);
  const n         = registros.length;
  const ticket    = n ? total / n : 0;

  document.getElementById('metric-total').textContent = total.toLocaleString('es-ES', {minimumFractionDigits:2}) + ' €';
  document.getElementById('metric-ticket').textContent = ticket.toLocaleString('es-ES', {minimumFractionDigits:2}) + ' €';
  document.getElementById('analytics-mes').textContent = mesActivo;

  renderDonut('donut-mes', registros, total);
  renderAlertas(registros);
}

/* ─── Donut Chart ─────────────────────────────────────────── */
const chartInstances = {};
function renderDonut(canvasId, registros, total) {
  if (chartInstances[canvasId]) { chartInstances[canvasId].destroy(); }
  if (!registros.length || total === 0) {
    const wrap = document.getElementById(canvasId)?.closest('.donut-wrap');
    if (wrap) wrap.innerHTML = `<div class="empty-state" style="padding:40px 0"><div class="icon">📊</div>Sin datos</div>`;
    return;
  }

  // Agrupar por categoría
  const map = {};
  registros.forEach(r => { map[r.cat] = (map[r.cat] || 0) + r.precio; });
  const sorted = Object.entries(map).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]);
  const labels = sorted.map(([k]) => k);
  const vals   = sorted.map(([,v]) => v);
  const colors = labels.map((k, i) => catColor(k, i));

  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  chartInstances[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: vals, backgroundColor: colors, borderColor: '#0a0010', borderWidth: 3, hoverOffset: 6 }] },
    options: {
      cutout: '60%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.toFixed(2)} € (${(ctx.parsed/total*100).toFixed(0)}%)`
          },
          backgroundColor: '#1a0030',
          borderColor: '#ff0095',
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: 'rgba(240,230,255,0.8)',
        }
      },
      animation: { animateRotate: true, duration: 600 }
    }
  });

  // Leyenda
  const legId = canvasId + '-leyenda';
  const legEl = document.getElementById(legId);
  if (legEl) {
    legEl.innerHTML = sorted.map(([k, v], i) => `
      <div class="desglose-row">
        <span class="desglose-cat">${dot(catColor(k,i))}${k}</span>
        <span class="desglose-val">${v.toFixed(2)} €<span class="desglose-pct">(${(v/total*100).toFixed(0)}%)</span></span>
      </div>`).join('');
  }
}

/* ─── Bar Chart Mensual ──────────────────────────────────── */
function renderBarChart(canvasId, registros) {
  if (chartInstances[canvasId]) { chartInstances[canvasId].destroy(); }
  const canvas = document.getElementById(canvasId);
  if (!canvas || !registros.length) return;

  const map = {};
  registros.forEach(r => { map[r.mes] = (map[r.mes] || 0) + r.precio; });
  const entries = Object.entries(map).sort((a,b) => a[0].localeCompare(b[0]));
  const labels = entries.map(([k]) => k);
  const vals   = entries.map(([,v]) => v);

  chartInstances[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: vals,
        backgroundColor: vals.map((v, i) => `hsl(${290 + i * 15},90%,${50 + i*2}%)`),
        borderRadius: 6, borderSkipped: false,
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(2)} €` },
          backgroundColor: '#1a0030', borderColor: '#ff0095', borderWidth: 1,
          titleColor: '#fff', bodyColor: 'rgba(240,230,255,0.8)',
        }
      },
      scales: {
        x: { ticks: { color: 'rgba(255,255,255,0.5)', font: {size:11} }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: 'rgba(255,255,255,0.4)', font: {size:10}, callback: v => v + '€' }, grid: { color: 'rgba(255,255,255,0.06)' } }
      },
      animation: { duration: 600 }
    }
  });
}

/* ─── Alertas de Stock ───────────────────────────────────── */
function renderAlertas(registros) {
  const wrap = document.getElementById('alertas-wrap');
  if (!wrap) return;
  const alertas = Object.entries(UMBRAL_ALERTAS).map(([cat, umbral]) => {
    const qty = registros.filter(r => r.cat === cat).reduce((s,r) => s + r.cant, 0);
    return { cat, qty, umbral };
  }).filter(a => a.qty < a.umbral && registros.some(r => r.cat === a.cat));

  if (!alertas.length) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = `<div class="card">
    <div class="card-label">⚠️ Alertas de Stock</div>
    ${alertas.map(a => {
      const color = catColor(a.cat);
      const pct   = Math.min(Math.round(a.qty / a.umbral * 100), 100);
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

/* ─── Exportar CSV ───────────────────────────────────────── */
function exportCSV(registros, filename) {
  const cols = ['Fecha','Mes','Categoría','Producto','Proveedor','Cantidad','Total €','Notas'];
  const rows = registros.map(r => [r.fecha, r.mes, r.cat, r.prod, r.prov, r.cant, r.precio.toFixed(2).replace('.',','), r.notas]);
  const csv  = [cols, ...rows].map(r => r.join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('btn-export-mes')?.addEventListener('click', () => {
  exportCSV(DB.getRegistros().filter(r => r.mes === mesActivo), `inkaria_${mesActivo.replace(/ /g,'_')}.csv`);
});

/* ══════════════════════════════════════════════════════════
   TAB 2 — DASHBOARD ANUAL
══════════════════════════════════════════════════════════ */
function renderDashboard() {
  const registros = DB.getRegistros();
  if (!registros.length) {
    document.getElementById('dashboard-content').innerHTML = `<div class="msg msg-info">Sin datos todavía. Añade registros en la pestaña Registro.</div>`;
    return;
  }

  const total   = registros.reduce((s,r) => s + r.precio, 0);
  const meses   = [...new Set(registros.map(r => r.mes))];
  const media   = total / meses.length;
  const byMes   = {};
  registros.forEach(r => { byMes[r.mes] = (byMes[r.mes] || 0) + r.precio; });
  const [mesCaro, gastoTop] = Object.entries(byMes).sort((a,b) => b[1]-a[1])[0];

  document.getElementById('dash-total').textContent = total.toLocaleString('es-ES',{minimumFractionDigits:2}) + ' €';
  document.getElementById('dash-media').textContent = media.toLocaleString('es-ES',{minimumFractionDigits:2}) + ' €';
  document.getElementById('dash-mes-caro').textContent = mesCaro;
  document.getElementById('dash-gasto-top').textContent = gastoTop.toLocaleString('es-ES',{minimumFractionDigits:0}) + '€';

  renderBarChart('bar-anual', registros);
  renderDonut('donut-anual', registros, total);
  renderTop5(registros);
}

function renderTop5(registros) {
  const map = {};
  registros.forEach(r => { map[r.prod] = (map[r.prod] || 0) + r.precio; });
  const top5  = Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,5);
  const maxV  = top5[0]?.[1] || 1;
  const el    = document.getElementById('top5-list');
  if (!el) return;
  el.innerHTML = top5.map(([prod, val], i) => {
    const pct = val / maxV * 100;
    return `<div class="top5-item">
      <div class="top5-row">
        <span class="top5-name">#${i+1} &nbsp;${prod}</span>
        <span class="top5-val">${val.toFixed(2)} €</span>
      </div>
      <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:linear-gradient(90deg,#ff0095,#cc00ff)"></div></div>
    </div>`;
  }).join('');
}

document.getElementById('btn-export-anual')?.addEventListener('click', () => {
  exportCSV(DB.getRegistros(), `inkaria_anual_${new Date().getFullYear()}.csv`);
});

/* ══════════════════════════════════════════════════════════
   TAB 3 — BUSCADOR
══════════════════════════════════════════════════════════ */
function initBuscador() {
  const opts = opciones();
  const catSel = document.getElementById('busq-cat');
  catSel.innerHTML = `<option value="">Todas las categorías</option>` +
    Object.keys(opts).map(k => `<option value="${k}">${k}</option>`).join('');

  const meses = allMeses(DB.getRegistros());
  const mesSel = document.getElementById('busq-mes');
  mesSel.innerHTML = `<option value="">Todos los meses</option>` +
    meses.map(m => `<option value="${m}">${m}</option>`).join('');

  document.getElementById('busq-form').addEventListener('input', renderBuscador);
}

function renderBuscador() {
  const q   = document.getElementById('busq-q').value.trim().toLowerCase();
  const cat = document.getElementById('busq-cat').value;
  const mes = document.getElementById('busq-mes').value;

  let data = DB.getRegistros();
  if (q)   data = data.filter(r => r.prod.toLowerCase().includes(q) || r.prov.toLowerCase().includes(q));
  if (cat) data = data.filter(r => r.cat === cat);
  if (mes) data = data.filter(r => r.mes === mes);

  const total = data.reduce((s,r) => s + r.precio, 0);
  const wrap  = document.getElementById('busq-results');

  if (!data.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="icon">🔍</div>Sin resultados.</div>`; return;
  }

  document.getElementById('busq-count').textContent  = `${data.length} resultados`;
  document.getElementById('busq-total').textContent  = `Total: ${total.toFixed(2)} €`;

  const showMes = !mes;
  wrap.innerHTML = `<table class="hist-table">
    <thead><tr>
      <th>Fecha</th>${showMes ? '<th>Mes</th>' : ''}
      <th>Categoría</th><th>Producto</th><th>Proveedor</th>
      <th class="right">Total</th>
    </tr></thead>
    <tbody>${data.map(r => {
      const color = catColor(r.cat);
      return `<tr>
        <td class="muted">${r.fecha}</td>
        ${showMes ? `<td class="muted" style="font-size:.72rem">${r.mes}</td>` : ''}
        <td>${dot(color)}${r.cat}</td>
        <td style="color:var(--text)">${r.prod}</td>
        <td class="muted">${r.prov}</td>
        <td class="right pink">${r.precio.toFixed(2)} €</td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

document.getElementById('btn-export-busq')?.addEventListener('click', () => {
  const q   = document.getElementById('busq-q').value.trim().toLowerCase();
  const cat = document.getElementById('busq-cat').value;
  const mes = document.getElementById('busq-mes').value;
  let data = DB.getRegistros();
  if (q)   data = data.filter(r => r.prod.toLowerCase().includes(q) || r.prov.toLowerCase().includes(q));
  if (cat) data = data.filter(r => r.cat === cat);
  if (mes) data = data.filter(r => r.mes === mes);
  exportCSV(data, 'inkaria_busqueda.csv');
});

/* ══════════════════════════════════════════════════════════
   TAB 4 — PROVEEDORES
══════════════════════════════════════════════════════════ */
function initProveedores() {
  const catSel = document.getElementById('prov-cat');
  catSel.innerHTML = Object.keys(opciones()).map(k => `<option value="${k}">${k}</option>`).join('');

  document.getElementById('prov-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre = document.getElementById('prov-nombre').value.trim();
    if (!nombre) { showMsg(document.getElementById('prov-msg'), 'error', 'El nombre es obligatorio.'); return; }
    const prov = {
      id:      Date.now(),
      nombre,
      cat:     document.getElementById('prov-cat').value,
      web:     document.getElementById('prov-web').value.trim(),
      tel:     document.getElementById('prov-tel').value.trim(),
      notas:   document.getElementById('prov-notas').value.trim() || '—',
      fav:     document.getElementById('prov-fav').checked,
    };
    const provs = DB.getProveedores();
    provs.push(prov);
    DB.setProveedores(provs);
    showMsg(document.getElementById('prov-msg'), 'success', `✅ Proveedor '${nombre}' guardado.`);
    this.reset();
    renderProveedores();
    buildProvSelect();
  });

  document.getElementById('prov-busq').addEventListener('input', renderProveedores);
}

function renderProveedores() {
  const q    = document.getElementById('prov-busq').value.trim().toLowerCase();
  let provs  = DB.getProveedores();
  if (q) provs = provs.filter(p => p.nombre.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q));
  provs = [...provs].sort((a,b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0));

  const el = document.getElementById('prov-list');
  if (!provs.length) {
    el.innerHTML = `<div class="empty-state"><div class="icon">🏪</div>No hay proveedores todavía.</div>`; return;
  }
  el.innerHTML = provs.map(p => {
    const color   = catColor(p.cat);
    const webLink = p.web?.startsWith('http')
      ? `<a class="prov-link" href="${p.web}" target="_blank">${p.web}</a>`
      : `<span class="prov-tel">${p.web || ''}</span>`;
    return `<div class="prov-item">
      <div class="prov-name-row">
        <span class="cat-dot" style="background:${color};width:9px;height:9px;border-radius:50%;display:inline-block;flex-shrink:0;"></span>
        <span class="prov-name">${p.fav ? '⭐ ' : ''}${p.nombre}</span>
        <span class="prov-tag">${p.cat}</span>
      </div>
      <div class="prov-links">${webLink}${p.tel ? `<span class="prov-tel">📞 ${p.tel}</span>` : ''}</div>
      ${p.notas !== '—' ? `<div class="prov-note">${p.notas}</div>` : ''}
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   TAB 5 — CATÁLOGO
══════════════════════════════════════════════════════════ */
function initCatalogo() {
  // Poblar select categoría destino
  rebuildCatDestinoSelect();

  document.getElementById('cat-nueva-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre = document.getElementById('cat-nueva-input').value.trim();
    if (!nombre) { showMsg(document.getElementById('cat-msg'), 'error', 'Escribe un nombre.'); return; }
    const cat = DB.getCatalogo();
    if (cat[nombre] || OPCIONES_BASE[nombre]) {
      showMsg(document.getElementById('cat-msg'), 'warn', `'${nombre}' ya existe.`); return;
    }
    cat[nombre] = [];
    DB.setCatalogo(cat);
    document.getElementById('cat-nueva-input').value = '';
    showMsg(document.getElementById('cat-msg'), 'success', `✅ Categoría '${nombre}' añadida.`);
    rebuildCatDestinoSelect();
    renderCatalogo();
    buildCatSelect('form-cat', nombre);
  });

  document.getElementById('prod-nuevo-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const cat   = document.getElementById('prod-cat-dest').value;
    const prod  = document.getElementById('prod-nuevo-input').value.trim();
    if (!prod) { showMsg(document.getElementById('prod-msg'), 'error', 'Escribe un nombre.'); return; }
    const opts  = opciones();
    if ((opts[cat] || []).includes(prod)) {
      showMsg(document.getElementById('prod-msg'), 'warn', `'${prod}' ya existe en '${cat}'.`); return;
    }
    const c = DB.getCatalogo();
    if (!c[cat]) c[cat] = [];
    c[cat].push(prod);
    DB.setCatalogo(c);
    document.getElementById('prod-nuevo-input').value = '';
    showMsg(document.getElementById('prod-msg'), 'success', `✅ '${prod}' añadido a '${cat}'.`);
    renderCatalogo();
    buildProdSelect(document.getElementById('form-cat').value);
  });

  document.getElementById('cat-filtro').addEventListener('input', renderCatalogo);
}

function rebuildCatDestinoSelect() {
  const opts = opciones();
  const el   = document.getElementById('prod-cat-dest');
  el.innerHTML = Object.keys(opts).map(k => `<option value="${k}">${k}</option>`).join('');
}

function renderCatalogo() {
  const q       = document.getElementById('cat-filtro').value.trim().toLowerCase();
  const opts    = opciones();
  const custom  = new Set(Object.keys(DB.getCatalogo()));
  const el      = document.getElementById('catalogo-list');

  const cats = Object.keys(opts).filter(k => {
    if (!q) return true;
    return k.toLowerCase().includes(q) || opts[k].some(p => p.toLowerCase().includes(q));
  }).sort();

  if (!cats.length) { el.innerHTML = `<div class="empty-state">Sin resultados.</div>`; return; }

  el.innerHTML = cats.map(k => {
    const prods = q ? opts[k].filter(p => p.toLowerCase().includes(q) || k.toLowerCase().includes(q)) : opts[k];
    const color  = catColor(k);
    const isNew  = custom.has(k) && !OPCIONES_BASE[k];
    const chips  = prods.slice(0, 24).map(p => `<span class="prod-chip">${p}</span>`).join('');
    const more   = prods.length > 24 ? `<span style="font-size:.7rem;color:rgba(255,255,255,.3)">+${prods.length-24} más</span>` : '';
    return `<div class="cat-section">
      <div class="cat-section-header">
        <span class="cat-dot" style="background:${color};width:9px;height:9px;border-radius:50%;display:inline-block;flex-shrink:0;"></span>
        <span class="cat-section-name">${k}</span>
        ${isNew ? '<span class="cat-badge-custom">tuya</span>' : ''}
        <span class="cat-section-count">${opts[k].length} prod.</span>
      </div>
      <div class="prod-chips">${chips}${more}</div>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════════════════ */
const AUTH = {
  // Credenciales — ofuscadas en base64 para no quedar en texto plano visible
  _u: atob('SW5rYXJpYQ=='),           // Inkaria
  _p: atob('SW5rYXJpYVRhdHRvbzIwMjZNYXJpYQ=='), // InkariaTattoo2026Maria
  SESSION_KEY: 'ink_auth',
  isLogged:  () => sessionStorage.getItem('ink_auth') === '1',
  login:     () => sessionStorage.setItem('ink_auth', '1'),
  logout:    () => { sessionStorage.removeItem('ink_auth'); location.reload(); },
  check:     (u, p) => u === AUTH._u && p === AUTH._p,
};

function initLogin() {
  if (AUTH.isLogged()) {
    showApp();
    return;
  }
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-wrapper').style.display  = 'none';

  document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const u = document.getElementById('login-user').value.trim();
    const p = document.getElementById('login-pass').value;
    if (AUTH.check(u, p)) {
      AUTH.login();
      showApp();
    } else {
      const err = document.getElementById('login-error');
      err.textContent = 'Usuario o contraseña incorrectos.';
      err.style.display = 'block';
      document.getElementById('login-pass').value = '';
      document.getElementById('login-pass').focus();
      // Shake
      document.getElementById('login-box').classList.add('shake');
      setTimeout(() => document.getElementById('login-box').classList.remove('shake'), 500);
    }
  });

  // Toggle password visibility
  document.getElementById('login-eye').addEventListener('click', function() {
    const inp = document.getElementById('login-pass');
    const showing = inp.type === 'text';
    inp.type = showing ? 'password' : 'text';
    this.textContent = showing ? '👁️' : '🙈';
  });
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-wrapper').style.display  = 'block';
  initRegistroForm();
  renderHistorial();
  renderAnalytics();
  initBuscador();
  initProveedores();
  initCatalogo();

  // Botón cerrar sesión
  document.getElementById('btn-logout').addEventListener('click', () => {
    if (confirm('¿Cerrar sesión?')) AUTH.logout();
  });
}

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', initLogin);