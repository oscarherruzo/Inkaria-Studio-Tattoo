/* ══════════════════════════════════════════════════════════
   INKARIA TATTOO INVENTORY — app.js v2
   Nuevas funciones: editar/borrar registros, presupuesto,
   notas rápidas, calculadora tatuaje, resumen header,
   borrar productos catálogo, limpiar mes
══════════════════════════════════════════════════════════ */
'use strict';

const API_URL = "https://script.google.com/macros/s/AKfycbxrlQ-8C2l6dwdNwx4whyLHloFkX_O0BsgMEq5yOJ5xJmGZWmKUo0L7j7NwC8N-8Zmw/exec";

/* ─── COLORES Y DATOS ───────────────────────────────────── */
const CATEGORY_COLORS = {
  'Máquinas de Tatuaje':'#ff0066','Agujas y Cartuchos':'#00cfff','Tintas':'#ff6a00',
  'Tintas Color':'#ff6a00','Tintas Negros':'#a3e635','Fuentes de Alimentación':'#a855f7',
  'Grips, Tubos y Tips':'#00e5a0','Higiene y Sanitario':'#facc15','Desechables':'#f472b6',
  'Stencil y Transferencia':'#38bdf8','Mobiliario Estudio':'#fb923c','Iluminación':'#c084fc',
  'Aftercare':'#4ade80','Material de Práctica':'#f87171','Accesorios Máquinas':'#60a5fa',
  'Protección de Equipo':'#fbbf24','Merchandising / Estudio':'#e879f9',
};
const DEFAULT_COLORS = Object.values(CATEGORY_COLORS);

const OPCIONES_BASE = {
  'Máquinas de Tatuaje':['Máquina rotativa','Máquina de bobina','Máquina pen (tipo lápiz)','Máquina inalámbrica','Dermógrafo','Máquina handpoke','Máquina híbrida'],
  'Agujas y Cartuchos':['Agujas round liner (RL)','Agujas round shader (RS)','Agujas magnum (MG)','Agujas curved magnum (CM)','Agujas flat','Agujas bugpin','Cartuchos universales','Cartuchos PMU','Cartuchos liner','Cartuchos shader','Cartuchos magnum'],
  'Tintas':['Tinta negra','Tinta greywash clara','Tinta greywash media','Tinta greywash oscura','Tinta color — rojo','Tinta color — azul','Tinta color — verde','Tinta color — amarillo','Tinta color — naranja','Tinta color — violeta','Tinta color — blanco','Tinta UV','Pigmento PMU','Diluyente de tinta','Set de tinta completo'],
  'Fuentes de Alimentación':['Fuente digital','Fuente analógica','Fuente inalámbrica','Pedal / footswitch','Clip cord','Cable RCA','Adaptador universal'],
  'Grips, Tubos y Tips':['Grip desechable','Grip de acero','Grip ajustable','Grip ergonómico','Tubo desechable','Tubo autoclavable','Tip redonda','Tip plana'],
  'Higiene y Sanitario':['Guantes nitrilo (caja)','Guantes látex (caja)','Mascarilla quirúrgica','Mascarilla FFP2','Alcohol isopropílico 70%','Alcohol isopropílico 96%','Clorhexidina','Jabón verde','Desinfectante superficies','Contenedor agujas','Spray desinfectante'],
  'Desechables':['Vasitos para tinta','Paletinas','Funda para máquina','Film plástico','Papel de camilla','Toallas absorbentes','Servilletas'],
  'Stencil y Transferencia':['Papel hectográfico','Papel calco','Gel stencil','Spray transfer','Termocopiadora','Rotulador de piel'],
  'Mobiliario Estudio':['Camilla de tatuaje','Silla ergonómica','Apoyabrazos regulable','Carrito auxiliar','Mesa de trabajo','Armario de material'],
  'Iluminación':['Lámpara LED articulada','Ring light','Luz lupa','Panel LED','Foco direccional','Tira LED'],
  'Aftercare':['Crema cicatrizante','Bálsamo tattoo','Film protector (second skin)','Jabón neutro','Loción sin perfume','Aceite de coco','Spray aftercare'],
  'Material de Práctica':['Piel sintética','Cabeza de práctica','Brazo de práctica','Kit aprendizaje completo'],
  'Accesorios Máquinas':['Motor de repuesto','Batería de repuesto','O-rings','Adaptador pen — cartucho','Llave de ajuste'],
  'Protección de Equipo':['Estuche de transporte','Bolsa de trabajo','Maletín de tattoo'],
  'Merchandising / Estudio':['Camiseta tatuador','Delantal','Stickers','Tarjetas de visita','Packaging regalo'],
};

const UMBRAL_ALERTAS = {
  'Agujas y Cartuchos':5,'Tintas':3,'Higiene y Sanitario':10,'Desechables':20,'Grips, Tubos y Tips':5
};

/* ─── API ────────────────────────────────────────────────── */
async function apiGet(params) {
  const res  = await fetch(API_URL + '?' + new URLSearchParams(params));
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}
async function apiPost(body) {
  const res  = await fetch(API_URL, { method:'POST', body:JSON.stringify(body) });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

/* ─── CACHE ──────────────────────────────────────────────── */
const C = { regMes:null, all:null, provs:null, cat:null, meses:null, presupuesto:{}, notes:null };
const inv = k => { C[k]=null; };

async function getMeses()        { if(!C.meses) C.meses=await apiGet({action:'getMeses'}); return C.meses; }
async function getRegMes(mes)    {
  if(C.regMes?.mes===mes) return C.regMes.data;
  const raw=await apiGet({action:'getRegistros',mes});
  C.regMes={mes,data:raw.map(normReg)};
  return C.regMes.data;
}
async function getAllReg()        { if(!C.all) C.all=(await apiGet({action:'getAllRegistros'})).map(normReg); return C.all; }
async function getProvs()        { if(!C.provs) C.provs=(await apiGet({action:'getProveedores'})).map(normProv); return C.provs; }
async function getCat()          { if(!C.cat) C.cat=await apiGet({action:'getCatalogo'}); return C.cat; }
async function getPresupuesto(m) { if(C.presupuesto[m]===undefined) C.presupuesto[m]=await apiGet({action:'getPresupuesto',mes:m}); return C.presupuesto[m]; }
async function getNotes()        { if(!C.notes) C.notes=(await apiGet({action:'getNotes'})).map(normNote); return C.notes; }

function normReg(r)  { return { _rowIdx:r._rowIdx, fecha:r[0]||'', cat:r[1]||'', prod:r[2]||'', prov:r[3]||'', cant:parseInt(r[4])||0, precio:parseFloat(String(r[5]||0).replace(',','.'))||0, notas:r[6]||'', mes:r.mes||'' }; }
function normProv(r) { return { _rowIdx:r._rowIdx, nombre:r[0]||'', cat:r[1]||'', web:r[2]||'', tel:r[3]||'', notas:r[4]||'', fav:r[5]==='⭐' }; }
function normNote(r) { return { _rowIdx:r._rowIdx, fecha:r[0]||'', texto:r[1]||'', tipo:r[2]||'nota' }; }

function opciones(catExtra={}) {
  const m={};
  Object.keys(OPCIONES_BASE).forEach(k=>{m[k]=[...OPCIONES_BASE[k]];});
  Object.keys(catExtra).forEach(k=>{ if(!m[k])m[k]=[]; (catExtra[k]||[]).forEach(p=>{if(!m[k].includes(p))m[k].push(p);}); });
  return m;
}

/* ─── HELPERS ────────────────────────────────────────────── */
const catColor = (cat,i=0) => CATEGORY_COLORS[cat]||DEFAULT_COLORS[i%DEFAULT_COLORS.length];
const dot = (c,s=7) => `<span style="display:inline-block;width:${s}px;height:${s}px;border-radius:50%;background:${c};margin-right:5px;vertical-align:middle;flex-shrink:0;"></span>`;
const todayStr = () => new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'});
const currentMes = () => new Date().toLocaleDateString('es-ES',{month:'long',year:'numeric'});
function showMsg(el,type,text,ms=3500){ if(!el)return; el.innerHTML=`<div class="msg msg-${type}">${text}</div>`; if(ms)setTimeout(()=>{el.innerHTML='';},ms); }
function loading(el,t='Cargando...'){ if(!el)return; el.innerHTML=`<div class="empty-state"><div class="icon" style="display:inline-block">⏳</div> ${t}</div>`; }
function buildSelect(id,items,empty=null){ const el=document.getElementById(id); if(!el)return; el.innerHTML=(empty?`<option value="">${empty}</option>`:'')+items.map(i=>`<option value="${i}">${i}</option>`).join(''); }
function exportCSV(data,fname){ const cols=['Fecha','Mes','Categoría','Producto','Proveedor','Cantidad','Total €','Notas']; const rows=data.map(r=>[r.fecha,r.mes||'',r.cat,r.prod,r.prov,r.cant,r.precio.toFixed(2).replace('.',','),r.notas]); const csv=[cols,...rows].map(r=>r.join(';')).join('\n'); const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download=fname;a.click();URL.revokeObjectURL(url); }

const chartInstances = {};

/* ─── LOGIN ──────────────────────────────────────────────── */
const AUTH = {
  _u:atob('SW5rYXJpYQ=='), _p:atob('SW5rYXJpYVRhdHRvbzIwMjZNYXJpYQ=='),
  isLogged:()=>sessionStorage.getItem('ink_auth')==='1',
  login:()=>sessionStorage.setItem('ink_auth','1'),
  logout:()=>{ sessionStorage.removeItem('ink_auth'); location.reload(); },
  check:(u,p)=>u===AUTH._u&&p===AUTH._p,
};

function initLogin(){
  if(AUTH.isLogged()){ showApp(); return; }
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('app-wrapper').style.display='none';
  document.getElementById('login-form').addEventListener('submit',function(e){
    e.preventDefault();
    const u=document.getElementById('login-user').value.trim();
    const p=document.getElementById('login-pass').value;
    if(AUTH.check(u,p)){ AUTH.login(); showApp(); }
    else {
      const err=document.getElementById('login-error');
      err.textContent='Usuario o contraseña incorrectos.'; err.style.display='block';
      document.getElementById('login-pass').value=''; document.getElementById('login-pass').focus();
      document.getElementById('login-box').classList.add('shake');
      setTimeout(()=>document.getElementById('login-box').classList.remove('shake'),500);
    }
  });
  document.getElementById('login-eye').addEventListener('click',function(){
    const inp=document.getElementById('login-pass'); const show=inp.type==='text';
    inp.type=show?'password':'text'; this.textContent=show?'👁️':'🙈';
  });
}

async function showApp(){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app-wrapper').style.display='block';
  document.getElementById('btn-logout').addEventListener('click',()=>{ if(confirm('¿Cerrar sesión?'))AUTH.logout(); });
  await initRegistroTab();
  initTabs();
}

/* ─── TABS ───────────────────────────────────────────────── */
function initTabs(){
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      const id=btn.dataset.tab;
      document.getElementById(id).classList.add('active');
      if(id==='tab-dashboard')   await renderDashboard();
      if(id==='tab-buscador')    await initBuscador();
      if(id==='tab-proveedores') await renderProveedores();
      if(id==='tab-catalogo')    await renderCatalogo();
      if(id==='tab-notas')       await renderNotas();
      if(id==='tab-calculadora') initCalculadora();
    });
  });
}

/* ══════════════════════════════════════════════════════════
   TAB 1 — REGISTRO
══════════════════════════════════════════════════════════ */
let mesActivo = currentMes();

async function initRegistroTab(){
  let catExtra={};
  try{ catExtra=await getCat(); }catch(_){}
  const opts=opciones(catExtra);
  buildSelect('form-cat',Object.keys(opts));
  buildProdSelect(Object.keys(opts)[0],opts);
  await buildMesSelect();
  await buildProvSelect();

  document.getElementById('form-cat').addEventListener('change',function(){ buildProdSelect(this.value,opts); });
  document.getElementById('form-prov').addEventListener('change',toggleProvInput);

  document.getElementById('registro-form').addEventListener('submit',async function(e){
    e.preventDefault();
    const btn=this.querySelector('button[type=submit]');
    btn.disabled=true; btn.textContent='⏳ Guardando...';
    try{
      const cat=document.getElementById('form-cat').value;
      const prod=document.getElementById('form-prod').value;
      const provSel=document.getElementById('form-prov').value;
      const provNuevo=document.getElementById('form-prov-nuevo')?.value?.trim();
      const prov=provSel||provNuevo||'—';
      const cant=parseInt(document.getElementById('form-cant').value)||1;
      const precio=parseFloat(document.getElementById('form-precio').value)||0;
      const notas=document.getElementById('form-notas').value.trim()||'—';
      await apiPost({action:'addRegistro',mes:mesActivo,row:[todayStr(),cat,prod,prov,cant,String(precio).replace('.',','),notas]});
      inv('regMes'); inv('all');
      showMsg(document.getElementById('form-msg'),'success','✅ Registro guardado.');
      this.reset(); buildProdSelect(cat,opts);
      await buildProvSelect();
      await buildMesSelect();
      await renderHistorial();
      await renderAnalytics();
      await updateHeaderSummary();
    }catch(ex){ showMsg(document.getElementById('form-msg'),'error','❌ '+ex.message); }
    btn.disabled=false; btn.textContent='✓  Confirmar Registro';
  });

  document.getElementById('mes-select').addEventListener('change',async function(){
    mesActivo=this.value; inv('regMes');
    await renderHistorial(); await renderAnalytics();
  });

  document.getElementById('btn-export-mes')?.addEventListener('click',async()=>{
    const data=await getRegMes(mesActivo);
    exportCSV(data.map(r=>({...r,mes:mesActivo})),`inkaria_${mesActivo.replace(/ /g,'_')}.csv`);
  });

  document.getElementById('btn-clear-mes')?.addEventListener('click',async()=>{
    if(!confirm(`¿Eliminar TODOS los registros de "${mesActivo}"?`))return;
    try{
      await apiPost({action:'clearMes',mes:mesActivo});
      inv('regMes'); inv('all');
      showMsg(document.getElementById('form-msg'),'success','🗑️ Mes limpiado.');
      await renderHistorial(); await renderAnalytics(); await updateHeaderSummary();
    }catch(ex){ alert('Error: '+ex.message); }
  });

  await updateHeaderSummary();
}

function buildProdSelect(cat,opts){ const prods=(opts||opciones())[cat]||[]; document.getElementById('form-prod').innerHTML=prods.map(p=>`<option value="${p}">${p}</option>`).join(''); }
async function buildProvSelect(){ let provs=[]; try{provs=(await getProvs()).map(p=>p.nombre).sort();}catch(_){} const el=document.getElementById('form-prov'); el.innerHTML=`<option value="">Escribir nuevo...</option>`+provs.map(p=>`<option value="${p}">${p}</option>`).join(''); toggleProvInput(); }
function toggleProvInput(){ const sel=document.getElementById('form-prov').value; const inp=document.getElementById('prov-nuevo-wrap'); if(inp)inp.style.display=sel?'none':'block'; }
async function buildMesSelect(){
  let meses=[]; try{ meses=await getMeses(); if(!meses.includes(mesActivo))meses.push(mesActivo); }catch(_){meses=[mesActivo];}
  meses.sort().reverse();
  document.getElementById('mes-select').innerHTML=meses.map(m=>`<option value="${m}" ${m===mesActivo?'selected':''}>${m}</option>`).join('');
}

async function updateHeaderSummary(){
  try{
    const data=await getRegMes(mesActivo);
    const total=data.reduce((s,r)=>s+r.precio,0);
    const el=document.getElementById('header-gasto');
    if(el) el.textContent=total.toLocaleString('es-ES',{minimumFractionDigits:2})+' €';
  }catch(_){}
}

async function renderHistorial(){
  const tbody=document.getElementById('historial-tbody');
  loading(tbody,'Cargando registros...');
  try{
    const registros=await getRegMes(mesActivo);
    if(!registros.length){ tbody.innerHTML=`<tr><td colspan="5"><div class="empty-state"><div class="icon">📭</div>Sin registros este mes.</div></td></tr>`; return; }
    const last15=[...registros].reverse().slice(0,15);
    tbody.innerHTML=last15.map(r=>`<tr>
      <td class="muted">${r.fecha}</td>
      <td>${dot(catColor(r.cat))}${r.cat}</td>
      <td style="color:rgba(240,230,255,0.85)">${r.prod}</td>
      <td class="right pink">${r.precio>0?r.precio.toFixed(2)+' €':'<span style="opacity:.3">—</span>'}</td>
      <td class="right" style="white-space:nowrap;">
        <button class="btn btn-ghost btn-icon" onclick="openEditModal(${r._rowIdx},'${mesActivo}')" title="Editar">✏️</button>
        <button class="btn btn-danger btn-icon" onclick="deleteRegistro(${r._rowIdx},'${mesActivo}',this)" title="Eliminar">🗑️</button>
      </td>
    </tr>`).join('');
  }catch(ex){ tbody.innerHTML=`<tr><td colspan="5"><div class="msg msg-error">❌ ${ex.message}</div></td></tr>`; }
}

async function renderAnalytics(){
  const el=document.getElementById('analytics-mes');
  if(el) el.textContent=`📊 Analytics · ${mesActivo}`;
  try{
    const registros=await getRegMes(mesActivo);
    const total=registros.reduce((s,r)=>s+r.precio,0);
    const n=registros.length;
    const ticket=n?total/n:0;
    document.getElementById('metric-total').textContent=total.toLocaleString('es-ES',{minimumFractionDigits:2})+' €';
    document.getElementById('metric-ticket').textContent=ticket.toLocaleString('es-ES',{minimumFractionDigits:2})+' €';
    await renderPresupuesto(total);
    renderDonut('donut-mes',registros,total);
    renderAlertas(registros);
  }catch(ex){ console.error(ex); }
}

/* ─── Presupuesto ────────────────────────────────────────── */
async function renderPresupuesto(gastoActual){
  const wrap=document.getElementById('presupuesto-wrap');
  if(!wrap)return;
  let presup=0;
  try{ presup=await getPresupuesto(mesActivo); }catch(_){}
  if(!presup){ wrap.innerHTML=`<div style="text-align:center;margin-top:8px;"><button class="btn btn-ghost" style="font-size:.75rem;padding:6px 14px;" onclick="showPresupuestoForm()">💰 Fijar presupuesto mensual</button></div>`; return; }
  const pct=Math.min(gastoActual/presup*100,100);
  const color=pct>90?'#ff4444':pct>70?'#facc15':'#a3e635';
  wrap.innerHTML=`<div style="margin-top:12px;">
    <div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:5px;">
      <span style="color:rgba(255,255,255,.5);">💰 Presupuesto mensual</span>
      <span style="color:${color};font-weight:700;">${gastoActual.toFixed(0)} € / ${presup.toFixed(0)} €</span>
    </div>
    <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${color};transition:width .4s;"></div></div>
    <div style="text-align:right;margin-top:4px;"><button class="btn btn-ghost" style="font-size:.68rem;padding:3px 8px;" onclick="showPresupuestoForm()">✏️ Cambiar</button></div>
  </div>`;
}

function showPresupuestoForm(){
  const actual=C.presupuesto[mesActivo]||0;
  const nuevo=prompt(`Presupuesto mensual para "${mesActivo}" (€):`,actual||'');
  if(nuevo===null)return;
  const val=parseFloat(nuevo)||0;
  apiPost({action:'setPresupuesto',mes:mesActivo,valor:val}).then(()=>{
    C.presupuesto[mesActivo]=val;
    renderAnalytics();
  });
}

/* ─── Eliminar / Editar registro ─────────────────────────── */
async function deleteRegistro(rowIdx,mes,btnEl){
  if(!confirm('¿Eliminar este registro?'))return;
  btnEl.disabled=true; btnEl.textContent='⏳';
  try{
    await apiPost({action:'deleteRegistro',mes,rowIdx});
    inv('regMes'); inv('all');
    await renderHistorial(); await renderAnalytics(); await updateHeaderSummary();
  }catch(ex){ alert('Error: '+ex.message); btnEl.disabled=false; btnEl.textContent='🗑️'; }
}

let editingRow=null;
async function openEditModal(rowIdx,mes){
  const registros=await getRegMes(mes);
  const r=registros.find(x=>x._rowIdx===rowIdx);
  if(!r)return;
  editingRow={rowIdx,mes,original:r};
  document.getElementById('edit-fecha').value=r.fecha;
  document.getElementById('edit-prov').value=r.prov;
  document.getElementById('edit-cant').value=r.cant;
  document.getElementById('edit-precio').value=r.precio;
  document.getElementById('edit-notas').value=r.notas==='—'?'':r.notas;
  document.getElementById('edit-prod-txt').textContent=r.prod+' · '+r.cat;
  document.getElementById('modal-edit').classList.add('open');
}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('modal-edit-close')?.addEventListener('click',()=>{ document.getElementById('modal-edit').classList.remove('open'); });
  document.getElementById('modal-edit')?.addEventListener('click',function(e){ if(e.target===this)this.classList.remove('open'); });
  document.getElementById('edit-form')?.addEventListener('submit',async function(e){
    e.preventDefault();
    if(!editingRow)return;
    const btn=this.querySelector('button[type=submit]'); btn.disabled=true;
    const r=editingRow.original;
    const newRow=[
      document.getElementById('edit-fecha').value,
      r.cat, r.prod,
      document.getElementById('edit-prov').value,
      document.getElementById('edit-cant').value,
      String(document.getElementById('edit-precio').value).replace('.',','),
      document.getElementById('edit-notas').value||'—'
    ];
    try{
      await apiPost({action:'editRegistro',mes:editingRow.mes,rowIdx:editingRow.rowIdx,row:newRow});
      inv('regMes'); inv('all');
      document.getElementById('modal-edit').classList.remove('open');
      await renderHistorial(); await renderAnalytics(); await updateHeaderSummary();
    }catch(ex){ alert('Error: '+ex.message); }
    btn.disabled=false;
  });
});

/* ─── Donut ──────────────────────────────────────────────── */
function renderDonut(id,registros,total){
  if(chartInstances[id]){chartInstances[id].destroy();}
  if(!registros.length||total===0){ const w=document.getElementById(id)?.closest('.donut-wrap'); if(w)w.innerHTML=`<div class="empty-state" style="padding:40px 0"><div class="icon">📊</div>Sin datos</div>`; return; }
  const map={};registros.forEach(r=>{map[r.cat]=(map[r.cat]||0)+r.precio;});
  const sorted=Object.entries(map).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  const canvas=document.getElementById(id); if(!canvas)return;
  chartInstances[id]=new Chart(canvas,{
    type:'doughnut',
    data:{labels:sorted.map(([k])=>k),datasets:[{data:sorted.map(([,v])=>v),backgroundColor:sorted.map(([k],i)=>catColor(k,i)),borderColor:'#0a0010',borderWidth:3,hoverOffset:6}]},
    options:{cutout:'60%',plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.toFixed(2)} € (${(ctx.parsed/total*100).toFixed(0)}%)`},backgroundColor:'#1a0030',borderColor:'#ff0095',borderWidth:1,titleColor:'#fff',bodyColor:'rgba(240,230,255,0.8)'}},animation:{duration:600}}
  });
  const leg=document.getElementById(id+'-leyenda');
  if(leg)leg.innerHTML=sorted.map(([k,v],i)=>`<div class="desglose-row"><span class="desglose-cat">${dot(catColor(k,i))}${k}</span><span class="desglose-val">${v.toFixed(2)} €<span class="desglose-pct">(${(v/total*100).toFixed(0)}%)</span></span></div>`).join('');
}

/* ─── Bar ────────────────────────────────────────────────── */
function renderBarChart(id,registros){
  if(chartInstances[id]){chartInstances[id].destroy();}
  const canvas=document.getElementById(id); if(!canvas||!registros.length)return;
  const map={};registros.forEach(r=>{map[r.mes||r.fecha]=(map[r.mes||r.fecha]||0)+r.precio;});
  const entries=Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0]));
  const n=entries.length;
  chartInstances[id]=new Chart(canvas,{
    type:'bar',
    data:{
      labels:entries.map(([k])=>k),
      datasets:[{
        data:entries.map(([,v])=>v),
        backgroundColor:entries.map((_,i)=>`hsl(${290+i*18},85%,55%)`),
        borderRadius:6, borderSkipped:false,
        maxBarThickness: n<=2 ? 60 : n<=4 ? 80 : 120,
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
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

/* ─── Alertas ────────────────────────────────────────────── */
function renderAlertas(registros){
  const wrap=document.getElementById('alertas-wrap'); if(!wrap)return;
  const alertas=Object.entries(UMBRAL_ALERTAS).map(([cat,u])=>({cat,qty:registros.filter(r=>r.cat===cat).reduce((s,r)=>s+r.cant,0),umbral:u})).filter(a=>a.qty<a.umbral&&registros.some(r=>r.cat===a.cat));
  if(!alertas.length){wrap.innerHTML='';return;}
  wrap.innerHTML=`<div class="card"><div class="card-label">⚠️ Alertas de Stock</div>${alertas.map(a=>{const c=catColor(a.cat);const p=Math.min(Math.round(a.qty/a.umbral*100),100);return`<div class="alert-item"><div class="alert-row"><span class="alert-cat">${dot(c)}${a.cat}</span><span class="alert-qty">${a.qty} uds</span></div><div class="bar-bg"><div class="bar-fill" style="width:${p}%;background:${c}"></div></div></div>`;}).join('')}</div>`;
}

/* ══════════════════════════════════════════════════════════
   TAB 2 — DASHBOARD ANUAL
══════════════════════════════════════════════════════════ */
async function renderDashboard(){
  const wrap=document.getElementById('dashboard-content');
  loading(wrap,'Cargando todos los meses...');
  try{
    const registros=await getAllReg();
    if(!registros.length){wrap.innerHTML=`<div class="msg msg-info">Sin datos todavía.</div>`;return;}
    const total=registros.reduce((s,r)=>s+r.precio,0);
    const meses=[...new Set(registros.map(r=>r.mes))];
    const media=total/meses.length;
    const byMes={};registros.forEach(r=>{byMes[r.mes]=(byMes[r.mes]||0)+r.precio;});
    const [mesCaro,gastoTop]=Object.entries(byMes).sort((a,b)=>b[1]-a[1])[0];
    wrap.innerHTML=`
      <div class="grid-3" style="margin-bottom:16px;">
        <div class="metric-box"><div class="metric-label">Gasto Anual Total</div><div class="metric-value" id="dash-total"></div></div>
        <div class="metric-box"><div class="metric-label">Media Mensual</div><div class="metric-value" id="dash-media"></div></div>
        <div class="metric-box"><div class="metric-label">Mes Más Caro</div><div class="metric-value sm" id="dash-mes-caro"></div><div class="metric-value" id="dash-gasto-top" style="font-size:1.8rem;line-height:1;"></div></div>
      </div>
      <div class="grid-16">
        <div class="card"><div class="card-label">📊 Gasto por Mes</div><div style="position:relative;height:220px;width:100%;"><canvas id="bar-anual"></canvas></div></div>
        <div class="card"><div class="card-label">🍩 Por Categoría</div><div class="donut-wrap"><canvas id="donut-anual" height="260"></canvas></div><div id="donut-anual-leyenda" style="margin-top:8px;"></div></div>
      </div>
      <div class="card"><div class="card-label">🏆 Top 5 Productos</div><div id="top5-list"></div></div>
      <button class="btn btn-secondary" id="btn-export-anual" style="width:auto">⬇️ Exportar CSV Anual</button>`;
    document.getElementById('dash-total').textContent=total.toLocaleString('es-ES',{minimumFractionDigits:2})+' €';
    document.getElementById('dash-media').textContent=media.toLocaleString('es-ES',{minimumFractionDigits:2})+' €';
    document.getElementById('dash-mes-caro').textContent=mesCaro;
    document.getElementById('dash-gasto-top').textContent=gastoTop.toLocaleString('es-ES',{minimumFractionDigits:0})+'€';
    renderBarChart('bar-anual',registros);
    renderDonut('donut-anual',registros,total);
    renderTop5(registros);
    document.getElementById('btn-export-anual')?.addEventListener('click',()=>exportCSV(registros,`inkaria_anual_${new Date().getFullYear()}.csv`));
  }catch(ex){wrap.innerHTML=`<div class="msg msg-error">❌ ${ex.message}</div>`;}
}

function renderTop5(registros){
  const map={};registros.forEach(r=>{map[r.prod]=(map[r.prod]||0)+r.precio;});
  const top5=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxV=top5[0]?.[1]||1;
  const el=document.getElementById('top5-list'); if(!el)return;
  el.innerHTML=top5.map(([prod,val],i)=>`<div class="top5-item"><div class="top5-row"><span class="top5-name">#${i+1} &nbsp;${prod}</span><span class="top5-val">${val.toFixed(2)} €</span></div><div class="bar-bg"><div class="bar-fill" style="width:${val/maxV*100}%;background:linear-gradient(90deg,#ff0095,#cc00ff)"></div></div></div>`).join('');
}

/* ══════════════════════════════════════════════════════════
   TAB 3 — BUSCADOR
══════════════════════════════════════════════════════════ */
let busqInited=false;
async function initBuscador(){
  if(!busqInited){
    let catExtra={}; try{catExtra=await getCat();}catch(_){}
    buildSelect('busq-cat',Object.keys(opciones(catExtra)),'Todas las categorías');
    document.getElementById('busq-form').addEventListener('input',renderBuscador);
    document.getElementById('btn-export-busq')?.addEventListener('click',async()=>{ const d=await filteredReg(); exportCSV(d,'inkaria_busqueda.csv'); });
    busqInited=true;
  }
  let meses=[]; try{meses=await getMeses();}catch(_){}
  buildSelect('busq-mes',meses,'Todos los meses');
  await renderBuscador();
}

async function filteredReg(){
  const q=document.getElementById('busq-q').value.trim().toLowerCase();
  const cat=document.getElementById('busq-cat').value;
  const mes=document.getElementById('busq-mes').value;
  let data=mes?await getRegMes(mes):await getAllReg();
  if(q)data=data.filter(r=>r.prod.toLowerCase().includes(q)||r.prov.toLowerCase().includes(q));
  if(cat)data=data.filter(r=>r.cat===cat);
  return data;
}

async function renderBuscador(){
  const wrap=document.getElementById('busq-results'); loading(wrap,'Buscando...');
  try{
    const data=await filteredReg();
    const total=data.reduce((s,r)=>s+r.precio,0);
    document.getElementById('busq-count').textContent=`${data.length} resultados`;
    document.getElementById('busq-total').textContent=`Total: ${total.toFixed(2)} €`;
    const mes=document.getElementById('busq-mes').value;
    if(!data.length){wrap.innerHTML=`<div class="empty-state"><div class="icon">🔍</div>Sin resultados.</div>`;return;}
    const showMes=!mes;
    wrap.innerHTML=`<table class="hist-table"><thead><tr><th>Fecha</th>${showMes?'<th>Mes</th>':''}<th>Categoría</th><th>Producto</th><th>Proveedor</th><th class="right">Total</th></tr></thead><tbody>${data.map(r=>`<tr><td class="muted">${r.fecha}</td>${showMes?`<td class="muted" style="font-size:.72rem">${r.mes}</td>`:''}<td>${dot(catColor(r.cat))}${r.cat}</td><td>${r.prod}</td><td class="muted">${r.prov}</td><td class="right pink">${r.precio.toFixed(2)} €</td></tr>`).join('')}</tbody></table>`;
  }catch(ex){wrap.innerHTML=`<div class="msg msg-error">❌ ${ex.message}</div>`;}
}

/* ══════════════════════════════════════════════════════════
   TAB 4 — PROVEEDORES
══════════════════════════════════════════════════════════ */
let provInited=false;
async function renderProveedores(){
  if(!provInited){
    let catExtra={}; try{catExtra=await getCat();}catch(_){}
    buildSelect('prov-cat',Object.keys(opciones(catExtra)));
    document.getElementById('prov-form').addEventListener('submit',async function(e){
      e.preventDefault();
      const nombre=document.getElementById('prov-nombre').value.trim();
      if(!nombre){showMsg(document.getElementById('prov-msg'),'error','El nombre es obligatorio.');return;}
      const btn=this.querySelector('button[type=submit]'); btn.disabled=true;
      try{
        await apiPost({action:'addProveedor',row:[nombre,document.getElementById('prov-cat').value,document.getElementById('prov-web').value.trim(),document.getElementById('prov-tel').value.trim(),document.getElementById('prov-notas').value.trim()||'—',document.getElementById('prov-fav').checked?'⭐':'']});
        inv('provs'); showMsg(document.getElementById('prov-msg'),'success',`✅ '${nombre}' guardado.`);
        this.reset(); await renderProveedores(); await buildProvSelect();
      }catch(ex){showMsg(document.getElementById('prov-msg'),'error','❌ '+ex.message);}
      btn.disabled=false;
    });
    document.getElementById('prov-busq').addEventListener('input',renderProveedores);
    provInited=true;
  }
  const wrap=document.getElementById('prov-list'); loading(wrap,'Cargando...');
  try{
    const q=document.getElementById('prov-busq').value.trim().toLowerCase();
    let provs=await getProvs();
    if(q)provs=provs.filter(p=>p.nombre.toLowerCase().includes(q)||p.cat.toLowerCase().includes(q));
    provs=[...provs].sort((a,b)=>(b.fav?1:0)-(a.fav?1:0));
    if(!provs.length){wrap.innerHTML=`<div class="empty-state"><div class="icon">🏪</div>Sin proveedores.</div>`;return;}
    wrap.innerHTML=provs.map(p=>{
      const c=catColor(p.cat);
      const webLink=p.web?.startsWith('http')?`<a class="prov-link" href="${p.web}" target="_blank">${p.web}</a>`:`<span class="prov-tel">${p.web||''}</span>`;
      return `<div class="prov-item">
        <div class="prov-name-row">${dot(c,9)}<span class="prov-name">${p.fav?'⭐ ':''}${p.nombre}</span><span class="prov-tag">${p.cat}</span>
          <button class="btn btn-danger btn-icon" style="margin-left:auto;padding:3px 7px;font-size:.7rem;" onclick="deleteProveedor(${p._rowIdx},this)">🗑️</button>
        </div>
        <div class="prov-links">${webLink}${p.tel?`<span class="prov-tel">📞 ${p.tel}</span>`:''}</div>
        ${p.notas&&p.notas!=='—'?`<div class="prov-note">${p.notas}</div>`:''}
      </div>`;
    }).join('');
  }catch(ex){wrap.innerHTML=`<div class="msg msg-error">❌ ${ex.message}</div>`;}
}

async function deleteProveedor(rowIdx,btn){
  if(!confirm('¿Eliminar este proveedor?'))return;
  btn.disabled=true;
  try{ await apiPost({action:'deleteProveedor',rowIdx}); inv('provs'); await renderProveedores(); await buildProvSelect(); }
  catch(ex){alert('Error: '+ex.message); btn.disabled=false;}
}

/* ══════════════════════════════════════════════════════════
   TAB 5 — CATÁLOGO
══════════════════════════════════════════════════════════ */
let catInited=false;
async function renderCatalogo(){
  if(!catInited){
    document.getElementById('cat-nueva-form').addEventListener('submit',async function(e){
      e.preventDefault();
      const nombre=document.getElementById('cat-nueva-input').value.trim();
      if(!nombre){showMsg(document.getElementById('cat-msg'),'error','Escribe un nombre.');return;}
      const btn=this.querySelector('button[type=submit]'); btn.disabled=true;
      try{ await apiPost({action:'addCatItem',row:[nombre,'']}); inv('cat'); document.getElementById('cat-nueva-input').value=''; showMsg(document.getElementById('cat-msg'),'success',`✅ '${nombre}' añadida.`); await renderCatalogo(); }
      catch(ex){showMsg(document.getElementById('cat-msg'),'error','❌ '+ex.message);}
      btn.disabled=false;
    });
    document.getElementById('prod-nuevo-form').addEventListener('submit',async function(e){
      e.preventDefault();
      const cat=document.getElementById('prod-cat-dest').value;
      const prod=document.getElementById('prod-nuevo-input').value.trim();
      if(!prod){showMsg(document.getElementById('prod-msg'),'error','Escribe un nombre.');return;}
      const btn=this.querySelector('button[type=submit]'); btn.disabled=true;
      try{ await apiPost({action:'addCatItem',row:[cat,prod]}); inv('cat'); document.getElementById('prod-nuevo-input').value=''; showMsg(document.getElementById('prod-msg'),'success',`✅ '${prod}' añadido.`); await renderCatalogo(); }
      catch(ex){showMsg(document.getElementById('prod-msg'),'error','❌ '+ex.message);}
      btn.disabled=false;
    });
    document.getElementById('cat-filtro').addEventListener('input',renderCatalogo);
    catInited=true;
  }
  const listEl=document.getElementById('catalogo-list'); loading(listEl,'Cargando catálogo...');
  try{
    let catExtra={}; try{catExtra=await getCat();}catch(_){}
    const opts=opciones(catExtra); const custom=new Set(Object.keys(catExtra));
    buildSelect('prod-cat-dest',Object.keys(opts));
    const q=document.getElementById('cat-filtro').value.trim().toLowerCase();
    const cats=Object.keys(opts).filter(k=>!q||k.toLowerCase().includes(q)||opts[k].some(p=>p.toLowerCase().includes(q))).sort();
    if(!cats.length){listEl.innerHTML=`<div class="empty-state">Sin resultados.</div>`;return;}
    listEl.innerHTML=cats.map(k=>{
      const prods=q?opts[k].filter(p=>p.toLowerCase().includes(q)||k.toLowerCase().includes(q)):opts[k];
      const c=catColor(k); const isNew=custom.has(k)&&!OPCIONES_BASE[k];
      const isCustomCat=custom.has(k);
      return `<div class="cat-section">
        <div class="cat-section-header">
          ${dot(c,9)}<span class="cat-section-name">${k}</span>
          ${isNew?'<span class="cat-badge-custom">tuya</span>':''}
          <span class="cat-section-count">${opts[k].length} prod.</span>
        </div>
        <div class="prod-chips">${prods.slice(0,24).map(p=>{
          const isDel=isCustomCat||(catExtra[k]||[]).includes(p);
          return `<span class="prod-chip">${p}${isDel?` <button onclick="deleteProd('${k}','${p}',this)" style="background:none;border:none;color:#ff4444;cursor:pointer;padding:0 2px;font-size:.7rem;" title="Eliminar">✕</button>`:''}`;
        }).join('')}${prods.length>24?`<span style="font-size:.7rem;color:rgba(255,255,255,.3)">+${prods.length-24} más</span>`:''}</div>
      </div>`;
    }).join('');
  }catch(ex){listEl.innerHTML=`<div class="msg msg-error">❌ ${ex.message}</div>`;}
}

async function deleteProd(cat,prod,btn){
  if(!confirm(`¿Eliminar "${prod}" de "${cat}"?`))return;
  btn.disabled=true;
  try{ await apiPost({action:'deleteCatItem',cat,prod}); inv('cat'); await renderCatalogo(); }
  catch(ex){alert('Error: '+ex.message); btn.disabled=false;}
}

/* ══════════════════════════════════════════════════════════
   TAB 6 — NOTAS RÁPIDAS
══════════════════════════════════════════════════════════ */
let notasInited=false;
async function renderNotas(){
  if(!notasInited){
    document.getElementById('nota-form').addEventListener('submit',async function(e){
      e.preventDefault();
      const texto=document.getElementById('nota-texto').value.trim();
      const tipo=document.getElementById('nota-tipo').value;
      if(!texto)return;
      const btn=this.querySelector('button[type=submit]'); btn.disabled=true;
      try{
        await apiPost({action:'addNote',row:[todayStr(),texto,tipo]});
        inv('notes'); document.getElementById('nota-texto').value='';
        await renderNotas();
      }catch(ex){alert('Error: '+ex.message);}
      btn.disabled=false;
    });
    notasInited=true;
  }
  const wrap=document.getElementById('notas-list'); loading(wrap,'Cargando notas...');
  try{
    const notas=await getNotes();
    if(!notas.length){wrap.innerHTML=`<div class="empty-state"><div class="icon">📝</div>Sin notas todavía.</div>`;return;}
    wrap.innerHTML=[...notas].reverse().map(n=>{
      const icons={'nota':'📝','compra':'🛒','urgente':'🔴','idea':'💡'};
      return `<div class="nota-item">
        <div class="nota-header">
          <span class="nota-tipo">${icons[n.tipo]||'📝'} ${n.tipo}</span>
          <span class="nota-fecha">${n.fecha}</span>
          <button class="btn btn-danger btn-icon" style="padding:2px 6px;font-size:.7rem;" onclick="deleteNota(${n._rowIdx},this)">✕</button>
        </div>
        <div class="nota-texto">${n.texto}</div>
      </div>`;
    }).join('');
  }catch(ex){wrap.innerHTML=`<div class="msg msg-error">❌ ${ex.message}</div>`;}
}

async function deleteNota(rowIdx,btn){
  btn.disabled=true;
  try{ await apiPost({action:'deleteNote',rowIdx}); inv('notes'); await renderNotas(); }
  catch(ex){alert('Error: '+ex.message); btn.disabled=false;}
}

/* ══════════════════════════════════════════════════════════
   TAB 7 — CALCULADORA DE TATUAJE
══════════════════════════════════════════════════════════ */
function initCalculadora(){
  const form=document.getElementById('calc-form');
  if(!form||form.dataset.inited)return;
  form.dataset.inited='1';
  form.addEventListener('input',calcularPrecio);
  calcularPrecio();
}

function calcularPrecio(){
  const tamano   = document.getElementById('calc-tamano')?.value||'medio';
  const estilo   = document.getElementById('calc-estilo')?.value||'blackwork';
  const zona     = document.getElementById('calc-zona')?.value||'normal';
  const sesiones = parseInt(document.getElementById('calc-sesiones')?.value)||1;
  const extra    = document.getElementById('calc-extra')?.checked||false;

  // ── Tarifas base — tatuadora junior (6 meses experiencia, Andalucía) ──
  // Tarifa hora mercado andaluz junior: 40–55 €/h (vs 60–80 €/h senior)
  // Precios antes de margen de beneficio
  const BASE = {
    minimo:  30,   // mínimo estudio (~30 min)
    pequeno: 55,   // pequeño (~1h)
    medio:   110,  // medio (~2–2.5h)
    grande:  240,  // grande (~4–5h)
    maxi:    450,  // muy grande (~8h)
    manga:   850,  // manga completa (varias sesiones)
  };

  const ESTILO = {
    linework:       1.0,
    blackwork:      1.0,
    geometrico:     1.05,
    fineline:       1.2,
    acuarela:       1.15,
    neotradicional: 1.1,
    realismo:       1.35,
    portrait:       1.4,
    japonés:        1.2,
    tradicional:    0.95,
    chicano:        1.1,
    puntillismo:    1.25,
  };

  const ZONA = {
    brazo:    1.0,
    pierna:   1.0,
    espalda:  1.0,
    costilla: 1.15,
    cuello:   1.15,
    mano:     1.2,
    pie:      1.15,
    cara:     1.3,
    normal:   1.0,
  };

  const BENEFICIO = 1.15; // 15% margen de beneficio

  let base   = BASE[tamano] || 110;
  let mult   = (ESTILO[estilo] || 1.0) * (ZONA[zona] || 1.0);
  let subtotal = base * mult * sesiones;
  if (extra) subtotal *= 1.1;
  let total  = subtotal * BENEFICIO; // aplicar margen

  const min = Math.round(subtotal / 5) * 5;  // sin margen
  const max = Math.round(total / 5) * 5;      // con margen 15%

  const horasEst = {minimo:0.5,pequeno:1,medio:2.2,grande:4.5,maxi:8,manga:15};
  const horas    = (horasEst[tamano]||2.2) * sesiones;
  const tarifaH  = Math.round(total / horas);
  const beneficioEuros = Math.round(total - subtotal);

  const res = document.getElementById('calc-resultado');
  if (!res) return;
  res.innerHTML=`
    <div class="calc-precio-wrap">
      <div class="calc-rango">${min} € — ${max} €</div>
      <div class="calc-label">sin / con margen · mercado andaluz · nivel junior</div>
    </div>
    <div class="calc-desglose">
      <div class="calc-row"><span>Precio base (tamaño)</span><span>${base} €</span></div>
      <div class="calc-row"><span>Estilo</span><span>×${(ESTILO[estilo]||1).toFixed(2)}</span></div>
      <div class="calc-row"><span>Zona corporal</span><span>×${(ZONA[zona]||1).toFixed(2)}</span></div>
      ${sesiones>1?`<div class="calc-row"><span>Sesiones</span><span>×${sesiones}</span></div>`:''}
      ${extra?'<div class="calc-row"><span>Color / detalles extra</span><span>×1.10</span></div>':''}
      <div class="calc-row"><span>Tiempo estimado</span><span>~${horas<1?'30 min':horas===1?'1 h':horas+' h'}</span></div>
      <div class="calc-row"><span>Subtotal sin margen</span><span>${Math.round(subtotal)} €</span></div>
      <div class="calc-row" style="color:#a3e635"><span>+ Margen beneficio (15%)</span><span>+${beneficioEuros} €</span></div>
      <div class="calc-row" style="border-top:1px solid rgba(255,0,149,0.3);padding-top:8px;color:#fff;font-weight:700;">
        <span>Precio final recomendado</span>
        <span style="color:#ff4dc4">${Math.round(total)} €</span>
      </div>
      <div class="calc-row"><span>Tarifa/hora equivalente</span><span style="color:rgba(255,255,255,0.5)">~${tarifaH} €/h</span></div>
    </div>
    <p style="font-size:.68rem;color:rgba(255,255,255,.3);margin-top:10px;text-align:center;">
      * Precios junior (6 meses exp.) · Andalucía · 40–55 €/h base · 15% margen incluido
    </p>`;
}

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', initLogin);
