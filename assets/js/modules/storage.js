/**
 * storage.js — persistencia y descarga
 * ---
 * Responsabilidad:
 *   - carga/guarda de DB en localStorage
 *   - validación de estructura de datos (_validateDB)
 *   - descarga de HTML completo con datos actualizados (downloadHTML)
 *   - restablecimiento a datos por defecto (resetDB)
 *
 * Dependencias:
 *   - utils.js → uid, toast
 *   - window.DB, window.__DEFAULT_DATA, window.__UDEC_EMBEDDED__
 *
 * Estado:
 *   Estable. Serializa DB, rutas de aprendizaje y datos SNIES en exportación HTML.
 */
function saveDB(){if(_isReadOnlyExport())return;try{localStorage.setItem('udec_rutas_db',JSON.stringify(window.DB));}catch(e){}}
function _validateDB(data){
  if(!Array.isArray(data)||!data.length) return false;
  for(var i=0;i<data.length;i++){
    var f=data[i];
    if(!f||typeof f!=='object') return false;
    if(!f.name||!Array.isArray(f.progs)) return false;
    for(var j=0;j<f.progs.length;j++){
      var p=f.progs[j];
      if(!p||typeof p!=='object') return false;
      if(!Array.isArray(p.lineas)) p.lineas=[];
      if(!Array.isArray(p.mae)) p.mae=[];
      if(!Array.isArray(p.sedes)) p.sedes=[];
      if(!p.id) p.id=uid();
      if(!p.n) return false;
    }
  }
  return true;
}
/**
 * Carga DB desde localStorage o datos por defecto según flag embed.
 * @global window.__UDEC_EMBEDDED__ — si true, ignora localStorage
 * @global window.__DEFAULT_DATA — datos iniciales
 */
function _makeEmbedded(){
  return '<script>' +
    'window.__EMBEDDED_DB=' + JSON.stringify(_freshSourceDB()).replace(/<\//g, '<\\/') + ';' +
    'window.__EMBEDDED_LR=' + JSON.stringify(_freshSourceLR()).replace(/<\//g, '<\\/') + ';' +
    'window.__EMBEDDED_SD=' + JSON.stringify(window.AppState ? window.AppState.snies.SD || {} : {}).replace(/<\//g, '<\\/') + ';' +
    'window.__EMBEDDED_RC=' + JSON.stringify(window.__rcRaw || null).replace(/<\//g, '<\\/') + ';' +
    '<\/script>';
}
function loadDB(){
  if(window.__EMBEDDED_DB && !window.__UDEC_ADMIN_EXPORT__){window.DB=JSON.parse(JSON.stringify(window.__EMBEDDED_DB));return;}
  if(window.__UDEC_EMBEDDED__){window.DB=JSON.parse(JSON.stringify(window.__DEFAULT_DATA));return;}
  try{
    var d=localStorage.getItem('udec_rutas_db');
    if(d){var parsed=JSON.parse(d);if(_validateDB(parsed)){window.DB=parsed;return;}}
  }catch(e){}
  if(window.__UDEC_ADMIN_EXPORT__ && window.__EMBEDDED_DB){window.DB=JSON.parse(JSON.stringify(window.__EMBEDDED_DB));return;}
  window.DB=JSON.parse(JSON.stringify(window.__DEFAULT_DATA));
}
function _hideToast(el){
  if(!el) return;
  if(el._hideT) clearTimeout(el._hideT);
  el.textContent='';
  el.style.display='none';
}
function _scheduleToastHide(el,ms){
  if(!el) return;
  if(el._hideT) clearTimeout(el._hideT);
  el._hideT=setTimeout(function(){_hideToast(el);},ms);
}
/**
 * Exporta HTML envolviendo la generación con gestión robusta del toast:
 *  - muestra busyMsg mientras se empaqueta;
 *  - si éxito: descarga + okMsg, luego oculta;
 *  - si error/rechazo: intenta fallback clásico, muestra errMsg y SIEMPRE oculta;
 *  - salvaguarda por timeout: si el embed nunca resuelve/rechaza (p. ej. un
 *    fetch de CDN se cuelga), oculta el toast y muestra errMsg, evitando que
 *    el mensaje de progreso quede pegado para siempre.
 * @param {Function} buildFn - buildStandalone / buildStandaloneAdmin
 * @param {Function} makeEmbed - _makeEmbedded / _makeAdminEmbedded
 * @param {string} filename
 * @param {string} busyMsg
 * @param {string} okMsg
 * @param {string} errMsg
 */
function _exportWithToast(buildFn,makeEmbed,filename,busyMsg,okMsg,errMsg){
  var toastEl=document.getElementById('toast');
  if(toastEl){toastEl.textContent=busyMsg;toastEl.style.display='block';if(toastEl._hideT)clearTimeout(toastEl._hideT);}
  var settled=false;
  var timeout=setTimeout(function(){
    if(settled) return;
    settled=true;
    if(toastEl){toastEl.textContent=errMsg;_scheduleToastHide(toastEl,3500);}
  },20000);
  buildFn().then(function(html){
    if(settled) return;
    settled=true;clearTimeout(timeout);
    _downloadBlob(html,filename);
    if(toastEl){toastEl.textContent=okMsg;_scheduleToastHide(toastEl,2500);}
  }).catch(function(err){
    if(settled) return;
    settled=true;clearTimeout(timeout);
    console.error('embed error:',err);
    try{
      var html2=document.documentElement.outerHTML;
      html2=html2.replace('</title>','</title>'+makeEmbed());
      _downloadBlob(html2,filename);
    }catch(e2){console.error('fallback export error:',e2);}
    if(toastEl){toastEl.textContent=errMsg;_scheduleToastHide(toastEl,3500);}
  });
}
/**
 * Descarga HTML standalone con CSS, JS e imágenes inline.
 * Usa __EMBED.buildStandalone() para embeber todos los recursos.
 */
function downloadHTML(){
  var hoy=new Date();
  var fecha=hoy.getFullYear()+'-'+String(hoy.getMonth()+1).padStart(2,'0')+'-'+String(hoy.getDate()).padStart(2,'0');
  var filename='Dashboard_UDEC_Posgrados_'+fecha+'.html';

  if(!window.__EMBED){
    var html=document.documentElement.outerHTML;
    html=html.replace('</title>','</title>'+_makeEmbedded());
    _downloadBlob(html,filename);
    return;
  }

  _exportWithToast(
    function(){return window.__EMBED.buildStandalone();},
    _makeEmbedded,
    filename,
    '⏳ Empaquetando dashboard...',
    '✅ Dashboard guardado con datos actualizados',
    '❌ Error al empaquetar; se descargó la versión base'
  );
}

function _downloadBlob(html,filename){
  var blob=new Blob([html],{type:'text/html;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download=filename;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
/**
 * Descarga HTML standalone editable (admin mode):
 * - Full CRUD visible (editor, backup, sedes)
 * - Persistencia via localStorage
 * - Usa buildStandaloneAdmin() de __EMBED
 */
function downloadAdminHTML(){
  var hoy=new Date();
  var fecha=hoy.getFullYear()+'-'+String(hoy.getMonth()+1).padStart(2,'0')+'-'+String(hoy.getDate()).padStart(2,'0');
  var filename='Dashboard_UDEC_Posgrados_ADMIN_'+fecha+'.html';
  if(!window.__EMBED){
    var html=document.documentElement.outerHTML;
    html=html.replace('</title>','</title>'+_makeAdminEmbedded());
    _downloadBlob(html,filename);
    return;
  }
  _exportWithToast(
    function(){return window.__EMBED.buildStandaloneAdmin();},
    _makeAdminEmbedded,
    filename,
    '⏳ Empaquetando dashboard administrativo...',
    '✅ Dashboard administrativo guardado',
    '❌ Error al empaquetar; se descargó la versión base'
  );
}
function _makeAdminEmbedded(){
  return '<script>' +
    'window.__UDEC_ADMIN_EXPORT__=true;' +
    'window.__EMBEDDED_DB=' + JSON.stringify(_freshSourceDB()).replace(/<\//g, '<\\/') + ';' +
    'window.__EMBEDDED_LR=' + JSON.stringify(_freshSourceLR()).replace(/<\//g, '<\\/') + ';' +
    _adminHydrationJS(_exportToken()) +
    'window.__EMBEDDED_SD=' + JSON.stringify(window.AppState ? window.AppState.snies.SD || {} : {}).replace(/<\//g, '<\\/') + ';' +
    'window.__EMBEDDED_RC=' + JSON.stringify(window.__rcRaw || null).replace(/<\//g, '<\\/') + ';' +
    '<\/script>';
}
function _downloadJSON(obj,filename){
  var json=JSON.stringify(obj,null,2);
  var blob=new Blob([json],{type:'application/json;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download=filename;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function backupDB(){
  var lr=window.__LEARNING_ROUTES||{};
  var totalRoutes=Object.keys(lr).length;
  var orphanCount=(typeof getOrphanRoutes==='function')?getOrphanRoutes().length:0;
  var payload={
    version:2,
    date:new Date().toISOString(),
    db:window.DB,
    learningRoutes:lr,
    learningRoutesMeta:{ totalRoutes:totalRoutes, orphanCount:orphanCount }, // R5: auditoría, no modifica learningRoutes ni v1/v2
    sniesSD:window.AppState?window.AppState.snies.SD||null:null,
    rcRaw:window.__rcRaw||null,
    sedesCatalog:window.AppState?window.AppState.staticData.ALL_SEDES.slice():null
  };
  var now=new Date();
  var y=now.getFullYear();
  var m=String(now.getMonth()+1).padStart(2,'0');
  var d=String(now.getDate()).padStart(2,'0');
  var hh=String(now.getHours()).padStart(2,'0');
  var mm=String(now.getMinutes()).padStart(2,'0');
  _downloadJSON(payload,'Dashboard_UDEC_Backup_'+y+'-'+m+'-'+d+'_'+hh+mm+'.json');
  toast('✅ Respaldo generado');
}
function restoreDB(file){
  if(!file) return;
  if(!confirm('Se reemplazarán los datos actuales por los del respaldo. ¿Desea continuar?')) return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var payload=JSON.parse(e.target.result);
      if(!payload||(payload.version!==1&&payload.version!==2)){toast('❌ Archivo de respaldo no compatible');return;}
      if(!payload.db||!_validateDB(payload.db)){toast('❌ Respaldo inválido: la base de datos no tiene el formato esperado');return;}
      window.DB=payload.db;
      // R4: nunca convertir __LEARNING_ROUTES en {} por ausencia de learningRoutes.
      var hadLR = payload.learningRoutes && typeof payload.learningRoutes === 'object' && Object.keys(payload.learningRoutes).length > 0;
      var routesNote;
      if(hadLR){
        window.__LEARNING_ROUTES=_normalizeRoutes(payload.learningRoutes);
        routesNote='✅ Rutas de aprendizaje restauradas del respaldo';
      } else {
        routesNote='ℹ️ El respaldo no incluía rutas; se conservaron las rutas actuales';
      }
      if(typeof _lrCancelDraft === 'function') _lrCancelDraft(); // R4: el borrador no sobrevive al restore
      if(window.AppState) AppState.snies.SD=payload.sniesSD||AppState.snies.SD;
      window.__rcRaw=payload.rcRaw||null;
      saveDB();
      saveLearningRoutes();
      if(typeof _saveSniesLocal==='function'&&AppState.snies.SD) _saveSniesLocal(AppState.snies.SD);
      if(payload.sedesCatalog&&Array.isArray(payload.sedesCatalog)&&typeof saveSedesCatalog==='function') saveSedesCatalog(payload.sedesCatalog);
      if(typeof _tagDefaultPrograms==='function') _tagDefaultPrograms();
      if(typeof __refreshAll==='function') __refreshAll();
      if(typeof renderSNIES==='function') renderSNIES();
      if(typeof renderIndicadores==='function') renderIndicadores();
      if(typeof renderPipeline==='function') renderPipeline();
      toast(routesNote);
      toast('✅ Datos restaurados correctamente');
    }catch(err){
      toast('❌ Archivo inválido');
    }
  };
  reader.onerror=function(){toast('❌ Error al leer el archivo');};
  reader.readAsText(file);
}
function resetDB(){if(confirm('¿Restablecer todos los datos al estado original?')){var KEYS=['udec_rutas_db','udec_learning_routes','udec_learning_routes_meta','udec_learning_routes_pre_restore','udec_snies_data','udec_sedes_catalog','udec_rutas_export_seed','udec_learning_routes_export_seed'];try{KEYS.forEach(function(k){localStorage.removeItem(k);});}catch(e){}location.reload();}}

