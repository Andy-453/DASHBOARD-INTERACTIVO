/**
 * utils.js — utilidades globales
 * ---
 * Responsabilidad:
 *   - mapa de colores de estado (ST_MAP / getSt)
 *   - helpers de UI: confirm, toast, uid, gv, gi
 *   - badge de oferta (pll)
 *
 * Dependencias:
 *   - Ninguna (nivel base, primer módulo en carga)
 *
 * Estado:
 *   Estable. Sin dependencias externas.
 */
function showConfirm(t,m,ok){var o=document.createElement('div');o.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center';o.innerHTML='<div style="background:#fff;border-radius:12px;padding:24px 28px;max-width:400px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,.2)"><div id="__ct" style="font-size:15px;font-weight:700;color:#1a2e1a;margin-bottom:8px"></div><div id="__cm" style="font-size:12px;color:#555;margin-bottom:20px"></div><div style="display:flex;gap:8px;justify-content:flex-end"><button id="__cc" style="padding:8px 18px;border-radius:8px;border:1px solid #ddd;background:#fff;color:#555;cursor:pointer">Cancelar</button><button id="__co" style="padding:8px 18px;border-radius:8px;border:none;background:#c0392b;color:#fff;font-weight:700;cursor:pointer">Eliminar</button></div></div>';document.body.appendChild(o);document.getElementById('__ct').textContent=t;document.getElementById('__cm').innerHTML=m;document.getElementById('__cc').onclick=function(){document.body.removeChild(o);};document.getElementById('__co').onclick=function(){document.body.removeChild(o);ok();};o.onclick=function(e){if(e.target===o)document.body.removeChild(o);};}

// ===== ESCAPE HTML =====
/**
 * Escapa texto para interpolación segura en innerHTML y atributos.
 * No altera cadenas sin caracteres especiales (comportamiento transparente).
 * @param {*} s - Valor arbitrario (null/undefined se tratan como '')
 * @returns {string} Cadena con & < > " ' escapados
 */
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

// ===== COLORES Y TAXONOMÍA DE ESTADO (fuente única) =====
// cat: categoría gruesa (filtros/KPIs) · group: etiqueta fina (paneles indicadores/pipeline)
var ST_MAP={
  'obtención':{dot:'#1D9E75',bg:'#E1F5EE',tx:'#085041',cat:'obtención',group:'Obtención / Con registro'},
  'con registro calificado':{dot:'#1D9E75',bg:'#E1F5EE',tx:'#085041',cat:'obtención',group:'Obtención / Con registro'},
  'en oferta':{dot:'#1D9E75',bg:'#E1F5EE',tx:'#085041',cat:'obtención',group:'Obtención / Con registro'},
  'obtención-resignificación':{dot:'#1D9E75',bg:'#E1F5EE',tx:'#085041',cat:'obtención',group:'Obtención / Con registro'},
  'radicado men':{dot:'#378ADD',bg:'#E6F1FB',tx:'#0C447C',cat:'radicado',group:'Radicado MEN'},
  'en radicación':{dot:'#378ADD',bg:'#E6F1FB',tx:'#0C447C',cat:'radicado',group:'Radicado MEN'},
  'entregado para radicar':{dot:'#378ADD',bg:'#E6F1FB',tx:'#0C447C',cat:'radicado',group:'Radicado MEN'},
  'en construcción':{dot:'#BA7517',bg:'#FAEEDA',tx:'#633806',cat:'construcción',group:'En construcción'},
  'por construir':{dot:'#BA7517',bg:'#FAEEDA',tx:'#633806',cat:'construcción',group:'Por construir'},
  'en proyección':{dot:'#BA7517',bg:'#FAEEDA',tx:'#633806',cat:'construcción',group:'Por construir'},
  'nueva propuesta de la facultad':{dot:'#BA7517',bg:'#FAEEDA',tx:'#633806',cat:'construcción',group:'Por construir'},
  'pendiente en resolución':{dot:'#D85A30',bg:'#FAECE7',tx:'#4A1B0C',cat:'reclamación',group:'En reclamación'},
  'en reclamación  men':{dot:'#D85A30',bg:'#FAECE7',tx:'#4A1B0C',cat:'reclamación',group:'En reclamación'},
  'en reclamación men':{dot:'#D85A30',bg:'#FAECE7',tx:'#4A1B0C',cat:'reclamación',group:'En reclamación'},
  'renovación':{dot:'#D85A30',bg:'#FAECE7',tx:'#4A1B0C',cat:'reclamación',group:'En reclamación'},
  'renovación y modificación de la denominación':{dot:'#D85A30',bg:'#FAECE7',tx:'#4A1B0C',cat:'reclamación',group:'En reclamación'},
  'negado men':{dot:'#A32D2D',bg:'#FCEBEB',tx:'#501313',cat:'negado',group:'Negado MEN'},
};
function getSt(s){
  if(!s||!s.trim()) return {dot:'#aaa',bg:'#f5f5f0',tx:'#666',cat:''};
  var k=s.trim().toLowerCase();
  if(ST_MAP[k]) return ST_MAP[k];
  return {dot:'#aaa',bg:'#f5f5f0',tx:'#666',cat:''};
}
function pll(o){return o==='V'?'<span class="pill pv">Vigente</span>':'<span class="pill pp">Proyectada</span>';}
function uid(){return 'id'+Date.now()+Math.random().toString(36).slice(2,5);}
function gv(id){var e=document.getElementById(id);return e?e.value:'';}
function gi(id){var v=parseInt(gv(id));return isNaN(v)||v===0?null:v;}
function toast(msg){
  var t=document.getElementById('toast');t.textContent=msg;t.style.display='block';
  setTimeout(function(){t.style.display='none';},2500);
}

function _getObtencionUrl(e, item){
  if(!item || !item.enlaceObtencion) return '';
  if(!(e||'').toLowerCase().includes('obtención')) return '';
  var url = item.enlaceObtencion.trim();
  if(url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) return '';
  return url;
}
function _hasLR(id){
  var m = window.__LEARNING_ROUTES && window.__LEARNING_ROUTES[id];
  return !!(m && typeof m === 'object' && Object.keys(m).length);
}
function _getLearningRoute(espId, sede){
  var m = window.__LEARNING_ROUTES && window.__LEARNING_ROUTES[espId];
  if(!m || typeof m !== 'object') return null;
  if(sede && m[sede]) return m[sede];
  if(m.ALL) return m.ALL;
  return null;
}
function _hasFlatRoute(obj){
  if(!obj || typeof obj !== 'object') return false;
  return Object.keys(obj).some(function(k){
    var v = obj[k];
    return !!(v && typeof v === 'object' && Array.isArray(v.semesters));
  });
}
function _normalizeRoutes(obj){
  if(!obj || typeof obj !== 'object') return {};
  var out = {};
  Object.keys(obj).forEach(function(k){
    var v = obj[k];
    if(!v || typeof v !== 'object') return;
    if(Array.isArray(v.semesters)){
      out[k] = { ALL: v };
    } else {
      out[k] = v;
    }
  });
  return out;
}
function _lrMakeId(espId, sede){
  var base = 'lr-' + String(espId || 'prog').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  if(sede && sede !== 'ALL'){
    return base + '-' + String(sede).replace(/[^a-zA-Z0-9]/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  }
  return base + '-all';
}

function _getTypeLabel(type){
  var map={especializacion:'Especialización',maestria:'Maestría',doctorado:'Doctorado'};
  return map[type]||'Programa';
}
function _getTypeBadge(type){
  var labels={especializacion:{label:'Esp.',color:'#3aaa72',bg:'#e8f5ee'},
              maestria:{label:'Mae.',color:'#C8A43A',bg:'#faf3e0'},
              doctorado:{label:'Doc.',color:'#0d3d22',bg:'#d4e8da'}};
  var l=labels[type]||labels.especializacion;
  return '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:8px;font-size:9px;font-weight:700;background:'+l.bg+';color:'+l.color+'">'+l.label+'</span>';
}
function _getAllAcademicPrograms(){
  var list=[];
  AppData.getFacultades().forEach(function(f){
    if(f.doc){
      list.push({id:'doc-'+f.id,type:'doctorado',name:f.doc.n, facName:f.name, sedes:f.doc.sedes||[], enlaceObtencion:f.doc.enlaceObtencion||null});
    }
    f.progs.forEach(function(p){
      (p.mae||[]).forEach(function(m){
        list.push({id:m.id,type:'maestria',name:m.n, facName:f.name, progName:p.n, sedes:m.sedes});
      });
      (p.lineas||[]).forEach(function(l){
        list.push({id:l.id,type:'especializacion',name:l.esp, facName:f.name, progName:p.n, lineaName:l.l, sedes:l.sedes});
      });
    });
  });
  return list;
}

// ===== R5 (E22): RUTAS HUÉRFANAS =====
/**
 * Devuelve los espId de __LEARNING_ROUTES que ya no corresponden a ningún
 * programa/línea existente en la DB académica actual.
 *
 * Solo lectura: NO muta DB, NO muta __LEARNING_ROUTES, no normaliza ni reescribe.
 * Seguro de llamar repetidamente.
 *
 * @returns {string[]} array de espId huérfanos (orden de inserción del mapa)
 */
function getOrphanRoutes(){
  var valid = {};
  try {
    _getAllAcademicPrograms().forEach(function(p){ if(p && p.id) valid[p.id] = true; });
  } catch(e){}
  var lr = window.__LEARNING_ROUTES || {};
  var orphans = [];
  Object.keys(lr).forEach(function(espId){
    if(!valid[espId]) orphans.push(espId);
  });
  return orphans;
}

// ===== HOMOLOGACIÓN DESDE PREGRADO (por CADI) =====
/**
 * Devuelve el nombre del CADI de pregrado asociado a un CADI,
 * o null si no debe mostrarse la cápsula "🟣 Desde pregrado".
 *
 * Reglas:
 *   - homologa !== true            → null (el CADI no es homologable)
 *   - sj.homo.materia vacío/ausente → null (no hay CADI de pregrado asociado)
 *   - en caso contrario            → el texto de sj.homo.materia
 *
 * @param {Object} subj  - subject {homologa, homo?}
 * @param {Object} route - ruta (sin uso en esta simplificación; se mantiene por firma)
 * @returns {string|null} nombre del CADI de pregrado o null
 */
function _lrHomologacion(subj, route){
  if(!subj || subj.homologa !== true) return null;
  var materia = subj.homo && subj.homo.materia;
  if(typeof materia !== 'string' || !materia.trim()) return null;
  return materia.trim();
}

// ===== EXPORT-FIX-1 (E23): helpers de exportación =====
/**
 * Determina si la página actual es un export standalone de SOLO LECTURA:
 *   NORMAL + EMBEDDED  → read-only (snapshot autoritativo, sin escrituras)
 *   ADMIN + EMBEDDED   → editable (snapshot = estado inicial; localStorage hidratado)
 * @returns {boolean}
 */
function _isReadOnlyExport(){
  return !!(window.__EMBEDDED_DB && !window.__UDEC_ADMIN_EXPORT__);
}

/**
 * Fuente fresca y validada de DB para el export.
 * - Export read-only (Normal embebido): el snapshot embebido es la verdad.
 * - Live/Admin: la capa de persistencia (localStorage) es la más reciente/confiable:
 *   AppData persiste tras cada write, así que ante divergencia (p. ej. pestañas
 *   múltiples o un contexto cuyo window.DB quedó obsoleto), localStorage gana.
 * No usa timestamps: la capa de persistencia ES la fuente de frescura.
 * @returns {Array}
 */
function _freshSourceDB(){
  if(window.__EMBEDDED_DB && !window.__UDEC_ADMIN_EXPORT__) return window.DB;
  try{
    var d = localStorage.getItem('udec_rutas_db');
    if(d){
      var parsed = JSON.parse(d);
      if(typeof _validateDB === 'function' ? _validateDB(parsed) : (Array.isArray(parsed) && parsed.length)) return parsed;
    }
  }catch(e){}
  return window.DB;
}

/**
 * Fuente fresca y validada de rutas de aprendizaje para el export.
 * Misma semántica que _freshSourceDB (persistencia como fuente de frescura).
 * @returns {Object}
 */
function _freshSourceLR(){
  if(window.__EMBEDDED_DB && !window.__UDEC_ADMIN_EXPORT__) return window.__LEARNING_ROUTES || {};
  try{
    var s = localStorage.getItem('udec_learning_routes');
    if(s){
      var parsed = JSON.parse(s);
      if(parsed && typeof parsed === 'object' && Object.keys(parsed).length) return _normalizeRoutes(parsed);
    }
  }catch(e){}
  return window.__LEARNING_ROUTES || {};
}

/**
 * Token de generación para un export Admin. Identifica UNA instancia de export:
 * permite distinguir localStorage sembrado por ESTE archivo (se conservan ediciones)
 * de localStorage sembrado por otra fuente (se rehidrata el snapshot).
 * Es un marcador de generación (no un timestamp de reloj, inmune a desfases).
 * @returns {string}
 */
function _exportToken(){
  return 'exp' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Construye el IIFE de hidratación que se embebe en el HTML Admin exportado.
 * Reglas (por store: udec_rutas_db y udec_learning_routes):
 *   - ausente o inválido            → sembrar snapshot + marcar token
 *   - válido + token de ESTE export → conservar (ediciones del usuario)
 *   - válido + token distinto       → rehidratar snapshot + marcar token
 * No usa _validateDB (aún no cargado en <head>): validación inline ligera.
 * @param {string} _token - token de generación del export
 * @returns {string} código JS a incrustar
 */
function _adminHydrationJS(_token){
  return '(function(){try{' +
    'var _t=' + JSON.stringify(_token) + ';' +
    'function _mk(k,t){try{var p=JSON.parse(localStorage.getItem(k));return !!p&&p.token===t;}catch(e){return false;}}' +
    'function _ok(k){try{var p=JSON.parse(localStorage.getItem(k));if(Array.isArray(p))return p.length>0;return !!(p&&typeof p==="object"&&Object.keys(p).length);}catch(e){return false;}}' +
    'if(!_ok("udec_rutas_db")||!_mk("udec_rutas_export_seed",_t)){' +
      'localStorage.setItem("udec_rutas_db",JSON.stringify(window.__EMBEDDED_DB));' +
      'localStorage.setItem("udec_rutas_export_seed",JSON.stringify({token:_t}));}' +
    'if(!_ok("udec_learning_routes")||!_mk("udec_learning_routes_export_seed",_t)){' +
      'localStorage.setItem("udec_learning_routes",JSON.stringify(window.__EMBEDDED_LR||{}));' +
      'localStorage.setItem("udec_learning_routes_export_seed",JSON.stringify({token:_t}));}' +
    '}catch(_e){}})();';
}

