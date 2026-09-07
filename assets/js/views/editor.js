// ===== EDITOR CON SELECTOR DE FACULTAD =====
// TODO [MVC]: migrar a controlador independiente cuando se adopte ESModules.

var _lrEditingId;
var _lrEditorTab = 'programas';
// === R3: borrador separado del mapa vivo ===
var __LR_DRAFT = null;      // copia profunda de la ruta en edición
var _lrDraftMeta = null;    // { espId, sede, isNew }
var _lrDraftSrc = null;     // { sems:{}, subs:{} } ids presentes en la ruta guardada

function renderEditor(){
  var f=AppData.getFacultad(AppState.navigation.curFac);if(!f)return;
  function cbs(items){var v=0,p=0,c=0;items.forEach(function(x){var e=(x.e||'').toLowerCase();if(e.includes('obtención')||e.includes('registro')||e.includes('oferta'))v++;else if(e.includes('construcción')||e.includes('radicado')||e.includes('radicación'))c++;else p++;});return{v:v,p:p,c:c};}
  var _tab=window._lrEditorTab||'programas';
  var _cy=new Date().getFullYear(),_years=Array.from({length:10},function(_,i){return _cy+i;});
  var h='<div style="padding:1rem">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:8px"><div style="font-size:14px;font-weight:700;color:#006633;display:flex;align-items:center;gap:8px"><span style="width:4px;height:20px;background:#006633;border-radius:2px;display:inline-block"></span>Editor de datos</div><div style="display:flex;gap:6px;flex-wrap:wrap">'+(_tab==='rutas'?'<!-- Crear ruta desde secci\u00f3n Sin ruta -->':'<button class="btn-green" data-action="open-new-prog">+ Nuevo programa</button><button data-action="open-edit-fac">\u270f\ufe0f Editar facultad</button><button data-action="open-new-fac">+ Nueva facultad</button>')+'</div></div>';
  h+='<div style="display:flex;gap:0;margin-bottom:1rem;border-bottom:2px solid #e0ece4"><button data-action="lr-set-tab" data-tab="programas" style="padding:8px 16px;font-size:11px;font-weight:700;border:none;background:none;cursor:pointer;color:'+(_tab==='programas'?'#006633':'#999')+';border-bottom:2px solid '+(_tab==='programas'?'#006633':'transparent')+';margin-bottom:-2px">\ud83d\udccb Programas</button><button data-action="lr-set-tab" data-tab="rutas" style="padding:8px 16px;font-size:11px;font-weight:700;border:none;background:none;cursor:pointer;color:'+(_tab==='rutas'?'#006633':'#999')+';border-bottom:2px solid '+(_tab==='rutas'?'#006633':'transparent')+';margin-bottom:-2px">\ud83d\uddfa\ufe0f Rutas de aprendizaje</button></div>';
  if(_tab==='rutas'){h+=_lrRenderList();h+='</div>';document.getElementById('editor-content').innerHTML=h;return;}
  var facBtns=AppData.getFacultades().map(function(fac,i){var a=i===curFac;return '<button data-action="sel-fac" data-fac="'+i+'" style="padding:6px 14px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;border:1.5px solid '+(a?'#006633':'#d0e4d8')+';background:'+(a?'#006633':'#fff')+';color:'+(a?'#fff':'#555')+'">'+_lrEsc(fac.name.replace('Facultad de ','').replace('Facultad ','').split(',')[0].trim())+'</button>';}).join('');
  h+='<div style="background:#fff;border-radius:10px;border:1px solid #e0ece4;padding:12px 16px;margin-bottom:1rem"><div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#999;margin-bottom:8px">Selecciona la facultad</div><div style="display:flex;gap:7px;flex-wrap:wrap">'+facBtns+'</div></div>';
  h+='<div style="background:#006633;border-radius:10px;padding:10px 16px;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between"><div style="font-size:12px;font-weight:700;color:#fff">'+_lrEsc(f.name)+'</div><div style="font-size:10px;color:rgba(255,255,255,.7)">'+f.progs.length+' programa(s)</div></div>';
  h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;margin-bottom:1.5rem">';
  f.progs.forEach(function(p){
    var st=cbs((p.lineas||[]).concat(p.mae||[]));
    var cr=(p.lineas||[]).concat(p.mae||[]).filter(function(x){return x.resp;}).length;
    h+='<div style="background:#fff;border-radius:12px;border:1px solid #e0ece4;overflow:hidden">'
      +'<div style="background:#006633;padding:11px 14px;display:flex;align-items:center;justify-content:space-between"><div><div style="font-size:12px;font-weight:700;color:#fff">'+_lrEsc(p.n)+'</div><div style="font-size:9px;color:rgba(255,255,255,.65);margin-top:2px">'+p.lineas.length+' especializaci\u00f3n(es) \u00b7 '+p.mae.length+' maestr\u00eda(s)</div></div><div style="font-size:15px">\ud83c\udf93</div></div>'
      +'<div style="padding:10px 14px">'
        +'<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px">'
          +(st.v?'<span style="background:#e6f2eb;color:#006633;padding:2px 8px;border-radius:8px;font-size:9px;font-weight:700">\u2705 '+st.v+' vigente</span>':'')
          +(st.c?'<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:8px;font-size:9px;font-weight:700">\ud83d\udd27 '+st.c+' en proceso</span>':'')
          +(st.p?'<span style="background:#fffbeb;color:#d97706;padding:2px 8px;border-radius:8px;font-size:9px;font-weight:700">\ud83d\udcdd '+st.p+' por construir</span>':'')
          +(cr?'<span style="background:#e6f0fb;color:#185FA5;padding:2px 8px;border-radius:8px;font-size:9px;font-weight:700">\ud83d\udc64 '+cr+' con responsable</span>':'<span style="background:#f5f5f5;color:#aaa;padding:2px 8px;border-radius:8px;font-size:9px">Sin responsable</span>')
        +'</div>'
        +'<div style="font-size:10px;color:#666;margin-bottom:10px">'
          +(p.lineas||[]).slice(0,3).map(function(l){return '<div style="padding:3px 0;border-bottom:1px solid #f5f5f5;display:flex;align-items:center;gap:5px"><span style="width:6px;height:6px;border-radius:50%;background:#3aaa72;flex-shrink:0;display:inline-block"></span><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+_lrEsc(l.esp)+'</span>'+(l.mes&&l.ano?'<span style="font-size:8px;color:#185FA5;white-space:nowrap">'+['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][l.mes]+' '+l.ano+'</span>':'')+'</div>';}).join('')
          +((p.lineas||[]).length>3?'<div style="color:#aaa;font-size:9px;padding-top:3px">+ '+((p.lineas||[]).length-3)+' m\u00e1s...</div>':'')
          +(p.mae||[]).slice(0,2).map(function(m){return '<div style="padding:3px 0;border-bottom:1px solid #f5f5f5;display:flex;align-items:center;gap:5px"><span style="width:6px;height:6px;border-radius:50%;background:#C8A43A;flex-shrink:0;display:inline-block"></span><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+_lrEsc(m.n)+'</span>'+(m.mes&&m.ano?'<span style="font-size:8px;color:#185FA5;white-space:nowrap">'+['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][m.mes]+' '+m.ano+'</span>':'')+'</div>';}).join('')
        +'</div>'
        +'<div style="display:flex;gap:6px"><button data-pid="'+_lrEsc(p.id)+'" data-action="open-edit-prog" style="flex:1;background:#006633;color:#fff;border:none;border-radius:8px;padding:8px;font-size:11px;font-weight:700;cursor:pointer">\u270f\ufe0f Editar programa</button><button data-pid="'+_lrEsc(p.id)+'" data-action="delete-prog" style="background:#fee2e2;color:#c0392b;border:1px solid #fca5a5;border-radius:8px;padding:8px 12px;font-size:11px;font-weight:700;cursor:pointer" title="Eliminar">\ud83d\uddd1\ufe0f</button></div>'
      +'</div></div>';
  });
  h+='</div>';
  // Doctorado colapsable
  h+='<div style="background:#fff;border-radius:12px;border:1px solid #e0ece4;overflow:hidden;margin-bottom:1rem">'
    +'<div style="background:#0d3d22;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer" data-action="toggle-doc-form">'
      +'<div style="display:flex;align-items:center;gap:10px"><span style="font-size:16px"></span><div><div style="font-size:12px;font-weight:700;color:#fff">Doctorado de la facultad</div><div style="font-size:10px;color:rgba(200,164,58,.8);margin-top:1px">'+_lrEsc(f.doc?f.doc.n:'Sin doctorado \u2014 haz clic para agregar')+'</div></div></div>'
      +'<span id="doc-toggle-icon" style="color:#C8A43A;font-size:18px;font-weight:700">\u25b8</span>'
    +'</div>'
    +'<div id="doc-form-body" style="padding:16px;display:none">'
      +'<div class="grid2" style="margin-bottom:10px"><div class="field"><label>Nombre del doctorado</label><input id="doc-name" value="'+_lrEsc(f.doc?f.doc.n:'')+'" placeholder="Nombre del doctorado"></div><div class="field"><label>Estado actual</label><input id="doc-estado" value="'+_lrEsc(f.doc?f.doc.e:'')+'" placeholder="Ej: En construcci\u00f3n"></div></div>'
      +'<div class="grid2" style="margin-bottom:10px"><div class="field"><label>Tipo de oferta</label><select id="doc-oferta"><option value="V" '+(f.doc&&f.doc.o==='V'?'selected':'')+'>Vigente</option><option value="P" '+(!f.doc||f.doc.o==='P'?'selected':'')+'>Proyectada</option></select></div><div class="field"><label>\ud83d\udc64 Responsable</label><input id="doc-resp" value="'+_lrEsc(f.doc&&f.doc.resp?f.doc.resp:'')+'" placeholder="Docente o equipo"></div></div>'
      +'<div class="grid2" style="margin-bottom:12px"><div class="field"><label>\ud83d\udcc5 Mes inicio</label><select id="doc-mes"><option value="">\u2014 Mes \u2014</option>'+['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map(function(m,i){return '<option value="'+(i+1)+'" '+(f.doc&&f.doc.mes===(i+1)?'selected':'')+'>'+m+'</option>';}).join('')+'</select></div><div class="field"><label>\ud83d\udcc5 A\u00f1o inicio</label><select id="doc-ano"><option value="">\u2014 A\u00f1o \u2014</option>'+(function(v){var a=_years.slice();if(v!=null&&a.indexOf(v)===-1)a.push(v);a.sort(function(x,y){return x-y;});return a.map(function(y){return '<option value="'+y+'" '+(v===y?'selected':'')+'>'+y+'</option>';}).join('');})(f.doc&&f.doc.ano)+'</select></div></div>'
      +'<div class="grid2" style="margin-bottom:12px"><div class="field"><label>\ud83d\udd17 Enlace</label><input type="url" id="doc-enlace" value="'+_lrEsc(f.doc&&f.doc.enlaceObtencion?f.doc.enlaceObtencion:'')+'" placeholder="URL del programa"></div><div class="field"></div></div>'
      +'<div style="margin-bottom:12px"><label style="font-size:10px;font-weight:700;color:#555;display:block;margin-bottom:3px">\ud83d\udccd Sedes</label><div style="display:flex;flex-wrap:wrap;gap:4px">'+ALL_SEDES.map(function(s){return '<label style="display:flex;align-items:center;gap:2px;font-size:9px;cursor:pointer;padding:2px 6px;border-radius:4px;background:'+((f.doc&&f.doc.sedes&&f.doc.sedes.indexOf(s)>-1)?'#e6f2eb':'#f5f5f5')+'"><input type="checkbox" id="dse_'+_lrEsc(s)+'" '+((f.doc&&f.doc.sedes&&f.doc.sedes.indexOf(s)>-1)?'checked':'')+' style="margin:0"> '+_lrEsc(s)+'</label>';}).join('')+'</div></div>'
      +'<button class="btn-green" data-action="save-doc">\ud83d\udcbe Guardar doctorado</button>'
    +'</div>'
  +'</div>';
  h+='</div>';
  document.getElementById('editor-content').innerHTML=h;
}
function toggleDocForm(){var b=document.getElementById('doc-form-body'),ic=document.getElementById('doc-toggle-icon');if(!b)return;var o=b.style.display!=='none';b.style.display=o?'none':'block';if(ic)ic.textContent=o?'\u25be':'\u25b8';}
function saveDoc(){
  var n=document.getElementById('doc-name').value.trim();
  if(!n){AppData.saveDocumento(curFac,null);}
  else{
    var mes=parseInt(document.getElementById('doc-mes').value)||null;
    var ano=parseInt(document.getElementById('doc-ano').value)||null;
    AppData.saveDocumento(curFac,{n:n,e:document.getElementById('doc-estado').value.trim(),o:document.getElementById('doc-oferta').value,sedes:ALL_SEDES.filter(function(s){var e=document.getElementById('dse_'+s);return e&&e.checked;}),resp:document.getElementById('doc-resp')?document.getElementById('doc-resp').value.trim():'',mes:mes,ano:ano,enlaceObtencion:document.getElementById('doc-enlace')?document.getElementById('doc-enlace').value.trim():null});
  }
    toast('Doctorado guardado');__refreshAll();renderEditor();
}
function deleteFac(){
  var f=AppData.getFacultad(curFac);
  showConfirm('¿Eliminar facultad?','Se eliminará <strong>'+(f?_lrEsc(f.name):'')+'</strong> y todos sus programas.',function(){
    AppData.deleteFacultad(curFac);curFac=Math.max(0,curFac-1);
    toast('Facultad eliminada');__refreshAll();renderEditor();
  });
}
function openNewFac(){
  document.getElementById('editor-content').innerHTML='<div class="modal-overlay"><div class="modal"><div class="modal-title"><span>\u2795</span>Nueva facultad</div><div class="form-section"><div class="field"><label>Nombre de la facultad</label><input id="fac-name" placeholder="Ej: Facultad de Ingenier\u00eda"></div></div><div class="modal-actions"><button class="btn-green" data-action="save-fac" data-is-new="true">\u2795 Crear facultad</button><button data-action="cancel-edit">Cancelar</button></div></div></div>';
}
function openEditFac(){
  var f=AppData.getFacultad(curFac);
  document.getElementById('editor-content').innerHTML='<div class="modal-overlay"><div class="modal"><div class="modal-title"><span>\u270f\ufe0f</span>Editar facultad</div><div class="form-section"><div class="field"><label>Nombre de la facultad</label><input id="fac-name" value="'+_lrEsc(f?f.name:'')+'"></div></div><div class="modal-actions"><button class="btn-green" data-action="save-fac" data-is-new="false">\ud83d\udcbe Guardar</button><button data-action="cancel-edit">Cancelar</button><button class="btn-red" data-action="delete-fac">\ud83d\uddd1\ufe0f Eliminar facultad</button></div></div></div>';
}
function saveFac(isNew){
  var n=document.getElementById('fac-name').value.trim();
  if(!n){toast('Escribe el nombre de la facultad');return;}
  if(isNew){AppData.saveFacultad({name:n,progs:[],doc:null},true);curFac=AppData.getFacultadCount()-1;}
  else{AppData.updateFacultadName(curFac,n);}
    toast('Facultad guardada');__refreshAll();renderEditor();
}
function openNewProg(){editingProgId='__new__';tmpLineas=[];tmpMaes=[];renderProgForm();}
function openEditProg(pid){editingProgId=pid;if(!tmpLineas._progId||tmpLineas._progId!==pid){tmpLineas=[];tmpMaes=[];}renderProgForm();}

function addLinea(){collectLineas();collectMaes();var pid=tmpLineas._progId;tmpLineas.push({id:uid(),l:'',t:'Profundización 1',esp:'',e:'',o:'P',sedes:[],resp:'',mes:null,ano:null,enlaceObtencion:null});tmpLineas._progId=pid;renderProgForm();}
function delLinea(lid){collectLineas();collectMaes();var pid=tmpLineas._progId;tmpLineas=tmpLineas.filter(function(l){return l.id!==lid;});tmpLineas._progId=pid;renderProgForm();}
function addMae(){collectLineas();collectMaes();var pid=tmpMaes._progId;tmpMaes.push({id:uid(),n:'',e:'',o:'P',sedes:[],resp:'',mes:null,ano:null,enlaceObtencion:null,tipo:''});tmpMaes._progId=pid;renderProgForm();}
function delMae(mid){collectLineas();collectMaes();var pid=tmpMaes._progId;tmpMaes=tmpMaes.filter(function(m){return m.id!==mid;});tmpMaes._progId=pid;renderProgForm();}
function collectLineas(){var pid=tmpLineas._progId;tmpLineas=tmpLineas.map(function(l){return{id:l.id,l:gv('ll'+l.id)||l.l,t:gv('lt'+l.id)||l.t,esp:gv('le'+l.id)||l.esp,e:gv('les'+l.id),o:gv('lo'+l.id)||l.o,motivo:gv('lm'+l.id)||l.motivo||'',sedes:ALL_SEDES.filter(function(s){var e=document.getElementById('lse_'+l.id+'_'+s);return e&&e.checked;}),resp:gv('lresp'+l.id),mes:gi('lmes'+l.id),ano:gi('lano'+l.id),enlaceObtencion:gv('lenlace'+l.id)||l.enlaceObtencion||null};});tmpLineas._progId=pid;}
function collectMaes(){var pid=tmpMaes._progId;tmpMaes=tmpMaes.map(function(m){return{id:m.id,n:gv('mn'+m.id)||m.n,e:gv('mes'+m.id),o:gv('mo'+m.id)||m.o,sedes:ALL_SEDES.filter(function(s){var e=document.getElementById('mse_'+m.id+'_'+s);return e&&e.checked;}),resp:gv('mresp'+m.id),mes:gi('mmes'+m.id),ano:gi('mano'+m.id),enlaceObtencion:gv('menlace'+m.id)||m.enlaceObtencion||null,tipo:gv('mtipo'+m.id)||m.tipo||''};});tmpMaes._progId=pid;}
function saveProg(pid,isNew){
  collectLineas();collectMaes();
  var name=gv('pn').trim();
  if(!name){toast('Escribe el nombre del programa');return;}
  var prog={id:pid,n:name,sedes:(gv('psedes')||'').split(',').map(function(s){return s.trim();}).filter(Boolean),lineas:tmpLineas,mae:tmpMaes};
  AppData.savePrograma(curFac,prog,isNew);
    editingProgId=null;tmpLineas=[];tmpMaes=[];toast('Programa guardado');__refreshAll();renderEditor();
}
function deleteProg(pid){
  var r=AppData.findProgramById(pid);
  showConfirm('¿Eliminar?','Se eliminará <strong>'+(r?_lrEsc(r.programa.n):'este programa')+'</strong>.',function(){
    if(r) AppData.deletePrograma(r.facIndex,pid);
    editingProgId=null;tmpLineas=[];tmpMaes=[];toast('Eliminado');__refreshAll();renderEditor();
  });
}
function cancelEdit(){editingProgId=null;tmpLineas=[];tmpMaes=[];renderEditor();}

// ===== EDITOR DE RUTAS DE APRENDIZAJE =====
function _lrSetTab(tab){ _lrEditorTab=tab; renderEditor(); }

function _lrRenderList(){
  var lr=window.__LEARNING_ROUTES||{};
  var allProgs=_getAllAcademicPrograms();if(!allProgs) return '';
  var withRoute=[], withoutRoute=[];
  allProgs.forEach(function(p){
    if(_hasLR(p.id)) withRoute.push(p);
    else withoutRoute.push(p);
  });
  var hasPrevBackup=false;
  try{ hasPrevBackup=!!localStorage.getItem(LR_PRE_RESTORE_KEY); }catch(e){}
  var h='';
  h+='<div style="background:#fff;border-radius:10px;border:1px solid #e0ece4;padding:12px 16px;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between">'
    +'<div><div style="font-size:12px;font-weight:700;color:#333">'+withRoute.length+' programa(s) con ruta</div>'
    +'<div style="font-size:10px;color:#999;margin-top:2px">'+withoutRoute.length+' programa(s) sin ruta</div></div>'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
    +'<button data-action="restore-default-routes" style="background:none;border:1px solid #e0ece4;border-radius:6px;padding:6px 12px;font-size:10px;font-weight:600;cursor:pointer;color:#999;white-space:nowrap">Restaurar por defecto</button>'
    +(hasPrevBackup?'<button data-action="restore-lr-backup" style="background:none;border:1px solid #b3d9c4;border-radius:6px;padding:6px 12px;font-size:10px;font-weight:600;cursor:pointer;color:#006633;white-space:nowrap">↩️ Recuperar respaldo previo</button>':'')
    +'</div></div>';
  if(withRoute.length){
    h+='<div style="font-size:11px;font-weight:700;color:#006633;margin-bottom:8px;padding:0 4px">\u25a0 CON RUTA ('+withRoute.length+')</div>';
    h+='<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:1rem">';
    withRoute.forEach(function(p){
      var m=lr[p.id]||{};
      var keys=Object.keys(m);
      var type=(m.ALL&&m.ALL.type)||p.type||'especializacion';
      h+='<div style="background:#fff;border-radius:10px;border:1px solid #e0ece4;padding:12px 16px">'
        +'<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px">'
        +'<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#333">'+_getTypeBadge(type)+_lrEsc(p.name)+'</div>'
        +'<div style="font-size:10px;color:#999;margin-top:2px">ID: '+_lrEsc(p.id)+' \u00b7 '+keys.length+' ruta(s)</div></div>'
        +'</div>';
      keys.forEach(function(k){
        var e=m[k];
        var lrCred=(e.semesters||[]).reduce(function(t,s){return t+(s.subjects||[]).reduce(function(tt,sj){return tt+(sj.credits||0);},0);},0);
        var ts=(e.semesters||[]).reduce(function(t,s){return t+(s.subjects||[]).length;},0);
        h+='<div style="background:#fafcfa;border:1px solid #e8f0ec;border-radius:8px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px">'
          +'<div style="flex:1;min-width:0">'
            +'<div style="font-size:11px;font-weight:700;color:#333">'+(k==='ALL'?'\ud83c\udf10 Todas las sedes':'🏫 '+_lrEsc(k))+(k==='ALL'?' <span style="font-size:9px;color:#999;font-weight:400">(ruta global)</span>':' <span style="font-size:9px;color:#999;font-weight:400">(sede espec\u00edfica)</span>')+'</div>'
            +'<div style="font-size:9px;color:#999;margin-top:2px">'+e.semesters.length+' semestre(s) \u00b7 '+esc(lrCred)+' cr\u00e9ditos \u00b7 '+ts+' CADI(s)'+(e.version?' \u00b7 v'+_lrEsc(e.version):'')+'</div>'
          +'</div>'
          +'<div style="display:flex;gap:5px;flex-shrink:0">'
          +'<button data-action="lr-edit-route" data-esp-id="'+_lrEsc(p.id)+'" data-sede="'+_lrEsc(k)+'" style="background:#006633;color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:9px;font-weight:700;cursor:pointer">\u270e Editar</button>'
          +'<button data-action="lr-preview-route" data-esp-id="'+_lrEsc(p.id)+'" data-sede="'+_lrEsc(k)+'" style="background:#e6f2eb;color:#006633;border:1px solid #b3d9c4;border-radius:6px;padding:5px 10px;font-size:9px;font-weight:700;cursor:pointer">\ud83d\udc41 Vista previa</button>'
          +'<button data-action="lr-delete-route" data-esp-id="'+_lrEsc(p.id)+'" data-sede="'+_lrEsc(k)+'" style="background:#fee2e2;color:#c0392b;border:1px solid #fca5a5;border-radius:6px;padding:5px 10px;font-size:9px;font-weight:700;cursor:pointer">\ud83d\uddd1</button>'
          +'</div></div>';
      });
      if(m.ALL){
        var candidates=(p.sedes&&p.sedes.length?p.sedes:ALL_SEDES).filter(function(s){return keys.indexOf(s)===-1;});
        if(candidates.length){
          h+='<div style="display:flex;gap:6px;align-items:center;margin-top:4px">'
            +'<select id="lr-new-sede-'+_lrEsc(p.id)+'" style="flex:1;max-width:220px;padding:5px 8px;border:1px solid #ddd;border-radius:6px;font-size:10px"><option value="">\u2014 Sede \u2014</option>'
            +candidates.map(function(s){return '<option value="'+_lrEsc(s)+'">'+_lrEsc(s)+'</option>';}).join('')
            +'</select>'
            +'<button data-action="lr-create-sede-route" data-prog-id="'+_lrEsc(p.id)+'" data-prog-name="'+_lrEsc(p.name)+'" data-prog-type="'+_lrEsc(p.type)+'" style="background:#e6f2eb;color:#006633;border:1px solid #b3d9c4;border-radius:6px;padding:5px 12px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap">\u2795 Crear ruta para sede</button>'
            +'</div>';
        }
      }
      h+='</div>';
    });
    h+='</div>';
  }
  if(withoutRoute.length){
    h+='<div style="font-size:11px;font-weight:700;color:#999;margin-bottom:8px;padding:0 4px">\u25a0 SIN RUTA ('+withoutRoute.length+')</div>';
    h+='<div style="display:flex;flex-direction:column;gap:6px">';
    withoutRoute.forEach(function(p){
      h+='<div style="background:#fafcfa;border-radius:10px;border:1px solid #e8f0ec;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;opacity:0.85">'
        +'<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#555">'+_getTypeBadge(p.type)+_lrEsc(p.name)+'</div>'
        +'<div style="font-size:10px;color:#999;margin-top:2px">'+_lrEsc(p.facName)+(p.progName?' \u00b7 '+_lrEsc(p.progName):'')+'</div></div>'
        +'<button data-action="create-route-for-prog" data-prog-id="'+_lrEsc(p.id)+'" data-prog-name="'+_lrEsc(p.name)+'" data-prog-type="'+_lrEsc(p.type)+'" style="background:#006633;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap">\u2795 Crear ruta</button>'
        +'</div>';
    });
    h+='</div>';
  }
  var orphans=getOrphanRoutes();
  if(orphans.length){
    h+='<div style="font-size:11px;font-weight:700;color:#B45309;margin-bottom:8px;padding:0 4px">⚠️ RUTAS HU\u00c9RFANAS (SIN PROGRAMA) ('+orphans.length+')</div>';
    h+='<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:1rem">';
    var progOpts=_getAllAcademicPrograms().map(function(p){
      return '<option value="'+_lrEsc(p.id)+'">'+_lrEsc(_getTypeLabel(p.type))+' \u00b7 '+_lrEsc(p.name)+'</option>';
    }).join('');
    orphans.forEach(function(espId){
      var m=lr[espId]||{};
      var keys=Object.keys(m);
      var first=m[keys[0]]||{};
      h+='<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:12px 16px">'
        +'<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;flex-wrap:wrap">'
        +'<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700;color:#92400E">'+_lrEsc(first.espName||'Ruta sin nombre')+'</div>'
        +'<div style="font-size:10px;color:#B45309;margin-top:2px">ID: '+_lrEsc(espId)+' \u00b7 '+keys.length+' ruta(s) \u00b7 sedes: '+keys.map(_lrEsc).join(', ')+'</div></div>'
        +'</div>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">'
        +'<select id="lr-reassign-'+_lrEsc(espId)+'" style="flex:1;min-width:180px;max-width:340px;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:10px"><option value="">\u2014 Programa destino \u2014</option>'+progOpts+'</select>'
        +'<button data-action="lr-reassign-route" data-orphan-id="'+_lrEsc(espId)+'" style="background:#006633;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap">\u21aa\ufe0f Reasignar</button>'
        +'<button data-action="lr-keep-orphan" data-orphan-id="'+_lrEsc(espId)+'" style="background:#e6f2eb;color:#006633;border:1px solid #b3d9c4;border-radius:6px;padding:6px 12px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap">\ud83d\udcbe Conservar/Exportar</button>'
        +'<button data-action="lr-delete-orphan" data-orphan-id="'+_lrEsc(espId)+'" style="background:#fee2e2;color:#c0392b;border:1px solid #fca5a5;border-radius:6px;padding:6px 12px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap">\ud83d\uddd1\ufe0f Eliminar</button>'
        +'</div></div>';
    });
    h+='</div>';
  }
  if(!withRoute.length && !withoutRoute.length){
    h+='<div style="text-align:center;padding:2rem;color:#999">No hay programas acad\u00e9micos disponibles</div>';
  }
  return h;
}

function _lrEsc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function _lrDraftCopy(o){
  try{ return JSON.parse(JSON.stringify(o==null?{}:o)); }catch(e){ return {}; }
}

function _lrCollectSourceIds(route){
  var src={ sems:{}, subs:{} };
  (route.semesters||[]).forEach(function(s){
    if(s.id) src.sems[s.id]=true;
    (s.subjects||[]).forEach(function(sj){ if(sj.id) src.subs[sj.id]=true; });
  });
  return src;
}

// === R3 (E16): fusión conservadora. Parte de una copia profunda de la fuente y
// solo modifica los campos representados por el formulario. Preserva campos no
// representados, version/resourceUrl/homo.materia, CADIs existentes con título
// vacío y los IDs. Descarta únicamente filas NUEVAS completamente vacías. ===
function _lrMergeFormIntoRoute(src, form){
  var out=_lrDraftCopy(src);
  out.espName=form.espName;
  out.version=form.version||'';
  out.type=form.type||out.type||'especializacion';
  out.credits=form.credits;
  out.sede=form.sede;
  out.espId=form.espId;
  out.id=_lrMakeId(form.espId, form.sede);
  var byId={};
  (out.semesters||[]).forEach(function(s){ if(s.id) byId[s.id]=s; });
  var sems=[];
  form.semesters.forEach(function(fs){
    var ex=fs.id?byId[fs.id]:null;
    if(ex){
      ex.title=fs.title;
      ex.type=fs.type;
      ex.credits=fs.credits;
      var sbyId={};
      (ex.subjects||[]).forEach(function(sj){ if(sj.id) sbyId[sj.id]=sj; });
      var subs=[];
      fs.subjects.forEach(function(fsj){
        var exsj=fsj.id?sbyId[fsj.id]:null;
        if(exsj){
          exsj.title=fsj.title;
          exsj.version=fsj.version;
          exsj.credits=fsj.credits;
          exsj.homologa=fsj.homologa;
          exsj.resourceUrl=fsj.resourceUrl;
          if(fsj.homo && fsj.homo.materia){ exsj.homo={materia:fsj.homo.materia}; }
          else if(exsj.homo){ delete exsj.homo; }
          subs.push(exsj);
        } else {
          subs.push(fsj);
        }
      });
      ex.subjects=subs;
      sems.push(ex);
    } else {
      sems.push(fs);
    }
  });
  out.semesters=sems;
  return out;
}

function _lrCancelDraft(){
  __LR_DRAFT=null; _lrDraftMeta=null; _lrDraftSrc=null; _lrEditingId=null;
}

function _lrEditRoute(progId, sede, prefill){
  _lrEditingId=progId; renderEditor();
  var sd=sede||'ALL';
  var lr=window.__LEARNING_ROUTES||{};
  var e=(lr[progId]||{})[sd];
  var isNew=!e;
  var route;
  if(isNew){
    var src=(prefill && prefill.copyFrom) ? _getLearningRoute(progId,'ALL') : null;
    if(src){
      route=JSON.parse(JSON.stringify(src));
      route.id=_lrMakeId(progId,sd);
      route.sede=sd;
      route.espId=progId;
    } else {
      route={ id:_lrMakeId(progId,sd), espId:progId, sede:sd, espName:(prefill&&prefill.name)||'', version:'', type:(prefill&&prefill.type)||'especializacion', credits:0, semesters:[{id:uid(),title:'Semestre 1',type:'Fundamentación',credits:10,subjects:[{id:uid(),title:'',credits:2,homologa:false},{id:uid(),title:'',credits:2,homologa:false}]}] };
    }
  } else {
    route=JSON.parse(JSON.stringify(e));
    if(!route.sede) route.sede=sd;
  }
  // === R3: el formulario trabaja sobre un borrador separado del mapa vivo ===
  __LR_DRAFT = route;
  _lrDraftMeta = { espId:progId, sede:sd, isNew:isNew };
  _lrDraftSrc = _lrCollectSourceIds(route);
  _lrRenderRouteForm(route, _lrDraftMeta);
}

function _lrRenderRouteForm(route, meta){
  var progId=meta.espId, sd=meta.sede, isNew=meta.isNew;
  var type=route.type||'especializacion';
  var sedesOpts=['<option value="ALL"'+(route.sede==='ALL'?' selected':'')+'>Todas las sedes</option>'].concat(ALL_SEDES.map(function(s){return '<option value="'+_lrEsc(s)+'"'+(route.sede===s?' selected':'')+'>'+_lrEsc(s)+'</option>';})).join('');
  var h='<div style="padding:1rem">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:1rem">'
    +'<button data-action="lr-back-to-list" style="background:none;border:none;font-size:16px;cursor:pointer;color:#666">\u2190</button>'
    +_getTypeBadge(type)+'<div style="font-size:14px;font-weight:700;color:#006633">'+(isNew?'Nueva ruta':'Editar ruta')+'</div></div>';
  h+='<div id="lr-form-container" data-esp-id="'+_lrEsc(progId)+'" data-prog-type="'+_lrEsc(type)+'" data-sede="'+_lrEsc(sd)+'">';
  h+='<div class="grid2" style="margin-bottom:12px">';
  h+='<div class="field"><label>Nombre del programa</label><input id="lr-esp-name" value="'+_lrEsc(route.espName||'')+'" placeholder="Ej: Especializaci\u00f3n en..." style="width:100%"></div>';
  h+='<div class="field"><label>Versi\u00f3n (opcional)</label><input id="lr-version" value="'+_lrEsc(route.version||'')+'" placeholder="Ej: V2.1, 2026-2, 1.0" style="width:100%"></div>';
  h+='</div>';
  h+='<div style="padding:6px 10px;background:#f5f5f5;border-radius:6px;font-size:11px;color:#666;margin-bottom:12px">ID: '+_lrEsc(progId)+'</div>';
  h+='<div class="field" style="margin-bottom:12px"><label>🏫 Sede</label><select id="lr-sede" style="width:100%;max-width:280px">'+sedesOpts+'</select></div>';
  var tc=0; (route.semesters||[]).forEach(function(s){ tc+=(s.subjects||[]).reduce(function(t,sj){return t+(sj.credits||0);},0); });
  h+='<div style="background:#e6f2eb;border-radius:8px;padding:8px 12px;margin-bottom:12px;display:flex;align-items:center;gap:12px;font-size:11px">'
    +'<span style="font-weight:700;color:#006633">Total cr\u00e9ditos: <span id="lr-total-credits">'+esc(tc)+'</span></span>'
    +'<span style="color:#999">\u00b7</span>'
    +'<span style="color:#666"><span id="lr-sem-count">'+route.semesters.length+'</span> semestre(s)</span></div>';
  h+='<div id="lr-semesters">';
  route.semesters.forEach(function(sem,si){
    h+='<div class="lr-semester" data-si="'+si+'" data-sem-id="'+_lrEsc(sem.id||'')+'">';
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
      +'<span style="font-size:12px;font-weight:700;color:#333">Semestre '+(si+1)+'</span>'
      +'<div style="flex:1"></div>'
      +(route.semesters.length>1?'<button data-action="lr-delete-semester" data-si="'+si+'" style="background:#fee2e2;color:#c0392b;border:1px solid #fca5a5;border-radius:6px;padding:4px 8px;font-size:9px;font-weight:700;cursor:pointer">Eliminar semestre</button>':'')
      +'</div>';
    h+='<div class="grid2" style="margin-bottom:8px">'
      +'<div class="field"><label>T\u00edtulo</label><input class="lr-sem-title" value="'+_lrEsc(sem.title||'')+'" style="width:100%"></div>'
      +'<div class="field"><label>Tipo</label><select class="lr-sem-type" style="width:100%"><option value="Fundamentaci\u00f3n" '+(sem.type==='Fundamentación'?'selected':'')+'>Fundamentaci\u00f3n</option><option value="Profundizaci\u00f3n" '+(sem.type==='Profundización'?'selected':'')+'>Profundizaci\u00f3n</option></select></div>'
      +'</div>';
    var semInitCr=(sem.subjects||[]).reduce(function(t,sj){return t+(sj.credits||0);},0);
    h+='<div class="field" style="margin-bottom:8px"><label>Cr\u00e9ditos del semestre</label><span class="lr-sem-credits-display" style="display:inline-block;padding:6px 10px;background:#f0f7f2;border-radius:6px;font-size:11px;color:#006633;font-weight:600">'+esc(semInitCr)+'</span><span style="font-size:10px;color:#999;margin-left:6px">calculado autom\u00e1ticamente</span></div>';
    h+='<div class="lr-subjects" data-si="'+si+'" style="margin-bottom:6px">';
    sem.subjects.forEach(function(subj,ji){
      var shomoMateria = (subj.homo && subj.homo.materia) || '';
      h+='<div class="lr-subject" data-si="'+si+'" data-ji="'+ji+'" data-subj-id="'+_lrEsc(subj.id||'')+'" style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:#f9fbfa;border:1px solid #e8f0ec;border-radius:6px;margin-bottom:4px;flex-wrap:wrap">'
        +'<input class="lr-subj-name" value="'+_lrEsc(subj.title||'')+'" placeholder="Nombre del CADI" style="flex:1;min-width:0;padding:4px 6px;border:1px solid #ddd;border-radius:4px;font-size:10px">'
        +'<input class="lr-subj-credits" data-action="lr-update-sem-credits" type="number" min="0" max="10" value="'+esc(subj.credits)+'" style="width:45px;padding:4px 6px;border:1px solid #ddd;border-radius:4px;font-size:10px;text-align:center" placeholder="Cr">'
        +'<input class="lr-subj-version" value="'+_lrEsc(subj.version||'')+'" placeholder="Versi\u00f3n" title="Versi\u00f3n (opcional)" style="width:70px;padding:4px 6px;border:1px solid #ddd;border-radius:4px;font-size:10px">'
        +'<label style="display:flex;align-items:center;gap:3px;font-size:9px;color:#666;white-space:nowrap;cursor:pointer"><input class="lr-subj-homologa" data-action="lr-touch-homologa" type="checkbox" '+(subj.homologa?'checked':'')+'> Homologa</label>'
+'<input class="lr-subj-homo" type="text" value="'+_lrEsc(shomoMateria)+'" placeholder="CADI homologado desde pregrado" title="CADI homologado desde pregrado" '+(subj.homologa?'':'disabled')+' style="max-width:190px;min-width:120px;padding:4px 6px;border:1px solid #ddd;border-radius:4px;font-size:10px">'
+'<input class="lr-subj-url" type="url" value="'+_lrEsc(subj.resourceUrl||'')+'" placeholder="URL CADI (opcional)" style="width:140px;padding:4px 6px;border:1px solid #ddd;border-radius:4px;font-size:10px">'
+'<button data-action="lr-delete-subject" data-si="'+si+'" data-ji="'+ji+'" style="background:none;border:none;color:#c0392b;cursor:pointer;font-size:14px;padding:2px" title="Eliminar CADI">\u00d7</button>'
        +'</div>';
    });
    h+='</div>';
    h+='<button data-action="lr-add-subject" data-si="'+si+'" style="padding:4px 10px;background:none;border:1px dashed #ccc;border-radius:4px;cursor:pointer;font-size:9px;color:#999;width:100%">+ Agregar CADI</button>';
    h+='</div>';
  });
  h+='</div>';
  h+='<button data-action="lr-add-semester" style="width:100%;padding:10px;background:#f5f5f5;border:1px dashed #ccc;border-radius:8px;cursor:pointer;font-size:11px;color:#666;margin-bottom:1rem">+ Agregar semestre</button>';
  h+='<div style="display:flex;gap:8px">'
    +'<button class="btn-green" data-action="lr-save-route" data-esp-id="'+_lrEsc(progId)+'" data-sede="'+_lrEsc(sd)+'" style="flex:1">\ud83d\udcbe Guardar ruta</button>'
    +'<button data-action="lr-preview-route" data-esp-id="'+_lrEsc(progId)+'" data-sede="'+_lrEsc(sd)+'" style="background:#e6f2eb;color:#006633;border:1px solid #b3d9c4;border-radius:8px;padding:8px 16px;font-size:11px;font-weight:700;cursor:pointer">\ud83d\udc41 Vista previa</button>'
    +'<button data-action="lr-back-to-list" style="background:#f5f5f5;color:#666;border:1px solid #ddd;border-radius:8px;padding:8px 16px;font-size:11px;cursor:pointer">Cancelar</button>'
    +'</div>';
  h+='</div></div>';
  document.getElementById('editor-content').innerHTML=h;
  _lrRecalcCredits();
}

function _lrCollectFormData(){
  var c=document.getElementById('lr-form-container'); if(!c) return null;
  var espId=c.dataset.espId;
  var type=c.dataset.progType||'especializacion';
  var sedeSel=document.getElementById('lr-sede');
  var sede=(sedeSel? sedeSel.value : (c.dataset.sede||'ALL'))||'ALL';
  var espName=document.getElementById('lr-esp-name')?.value.trim();
  if(!espName){ toast('Escribe el nombre del programa'); return null; }
  var version=document.getElementById('lr-version')?.value.trim()||'';
  var sems=[]; var totalCr=0;
  document.querySelectorAll('.lr-semester').forEach(function(el){
    var semId=el.dataset.semId||uid();
    var t=el.querySelector('.lr-sem-title')?.value.trim()||'';
    var tp=el.querySelector('.lr-sem-type')?.value||'Fundamentación';
    var subs=[];
    el.querySelectorAll('.lr-subject').forEach(function(s){
      var sjId=s.dataset.subjId||uid();
      var st=s.querySelector('.lr-subj-name')?.value.trim()||'';
      var sc=parseInt(s.querySelector('.lr-subj-credits')?.value)||0;
      var sh=s.querySelector('.lr-subj-homologa')?.checked||false;
      var sv=s.querySelector('.lr-subj-version')?.value.trim()||'';
      var su=s.querySelector('.lr-subj-url')?.value.trim()||'';
      var shm=(s.querySelector('.lr-subj-homo')?.value||'').trim();
      var isNew=!(_lrDraftSrc && _lrDraftSrc.subs[sjId]);
      if(isNew && !st && !sv && !su && !sh && !shm) return; // fila NUEVA totalmente vacía → descartar
      var subj={id:sjId,title:st,version:sv,credits:sc,homologa:sh,resourceUrl:(su&&(su.indexOf('http://')===0||su.indexOf('https://')===0))?su:undefined};
      if(shm) subj.homo={materia:shm}; // R3: conserva homo.materia aunque homologa sea false
      subs.push(subj);
    });
    var cr=subs.reduce(function(t,s){return t+(s.credits||0);},0);
    sems.push({id:semId,title:t,type:tp,credits:cr,subjects:subs});
    totalCr+=cr;
  });
  return {espName:espName,version:version,espId:espId,sede:sede,type:type,credits:totalCr,semesters:sems};
}

function _lrRecalcCredits(){
  var tc=0; document.querySelectorAll('.lr-subj-credits').forEach(function(i){ tc+=parseInt(i.value)||0; });
  var el=document.getElementById('lr-total-credits'); if(el) el.textContent=tc;
}

function _lrSaveRoute(espId, sede){
  var data=_lrCollectFormData(); if(!data) return;
  var id=data.espId;
  var sd=data.sede||sede||'ALL';
  var src=null;
  if(__LR_DRAFT && _lrDraftMeta && _lrDraftMeta.espId===id && _lrDraftMeta.sede===sd){
    src=__LR_DRAFT;
  } else {
    var lr=window.__LEARNING_ROUTES||{};
    src=(lr[id]||{})[sd];
  }
  var merged=_lrMergeFormIntoRoute(src, data);
  window.__LEARNING_ROUTES[id]=window.__LEARNING_ROUTES[id]||{};
  window.__LEARNING_ROUTES[id][sd]=merged;
  toast('Ruta guardada'); _lrCancelDraft();
  saveLearningRoutes(); renderEditor(); __refreshAll();
}

function _lrDeleteRoute(espId, sede){
  var lr=window.__LEARNING_ROUTES||{};
  var m=lr[espId];
  var sd=sede||'ALL';
  if(!m || !m[sd]){ toast('Ruta no encontrada'); return; }
  var label=(sd==='ALL')?'Todas las sedes':sd;
  showConfirm('Eliminar ruta','¿Eliminar la ruta de <strong>'+_lrEsc(m[sd].espName||espId)+'</strong> ('+label+')?',function(){
    delete m[sd];
    if(!Object.keys(m).length) delete lr[espId];
    saveLearningRoutes(); toast('Ruta eliminada'); renderEditor(); __refreshAll();
  });
}

function _lrAddSemester(){
  var data=_lrCollectFormData(); if(!data) return;
  var n=data.semesters.length+1;
  data.semesters.push({id:uid(),title:'Semestre '+n,type:'Profundización',credits:10,subjects:[{id:uid(),title:'',credits:2,homologa:false}]});
  _rerenderForm(data,data.espId,data.sede);
}

function _lrDeleteSemester(si){
  var data=_lrCollectFormData(); if(!data) return;
  if(data.semesters.length<=1){ toast('Debe haber al menos un semestre'); return; }
  data.semesters.splice(si,1);
  _rerenderForm(data,data.espId,data.sede);
}

function _lrAddSubject(si){
  var data=_lrCollectFormData(); if(!data) return;
  if(!data.semesters[si]){ toast('Semestre no encontrado'); return; }
  data.semesters[si].subjects.push({id:uid(),title:'',credits:2,homologa:false});
  _rerenderForm(data,data.espId,data.sede);
}

function _lrDeleteSubject(si,ji){
  var data=_lrCollectFormData(); if(!data) return;
  if(!data.semesters[si]){ toast('Semestre no encontrado'); return; }
  if(data.semesters[si].subjects.length<=1){ toast('Debe haber al menos una CADI'); return; }
  data.semesters[si].subjects.splice(ji,1);
  _rerenderForm(data,data.espId,data.sede);
}

function _rerenderForm(data,espId,sede){
  var sd=sede||(data&&data.sede)||'ALL';
  if(!(__LR_DRAFT && _lrDraftMeta && _lrDraftMeta.espId===espId && _lrDraftMeta.sede===sd)){
    var lr=window.__LEARNING_ROUTES||{};
    var e=(lr[espId]||{})[sd];
    __LR_DRAFT = e ? _lrDraftCopy(e) : { id:_lrMakeId(espId,sd), espId:espId, sede:sd, espName:'', version:'', type:'especializacion', credits:0, semesters:[] };
    _lrDraftMeta = { espId:espId, sede:sd, isNew:!e };
    _lrDraftSrc = _lrCollectSourceIds(__LR_DRAFT);
  }
  __LR_DRAFT = _lrMergeFormIntoRoute(__LR_DRAFT, data);
  _lrRenderRouteForm(__LR_DRAFT, _lrDraftMeta);
}

function _lrPreviewRoute(espId, sede){
  var lr=window.__LEARNING_ROUTES||{};
  var sd=sede||'ALL';
  var route=(lr[espId]||{})[sd];
  if(__LR_DRAFT && _lrDraftMeta && _lrDraftMeta.espId===espId && _lrDraftMeta.sede===sd) route=__LR_DRAFT;
  if(route){
    openLearningRouteModal(route);
    var ov=document.getElementById('lr-modal-overlay');
    if(ov) ov.dataset.sede=sd;
  } else {
    var data=_lrCollectFormData(); if(!data) return;
    openLearningRouteModal({id:_lrMakeId(data.espId||'__preview__',data.sede||'ALL'),espId:data.espId||'__preview__',sede:data.sede||'ALL',espName:data.espName,version:data.version||'',type:data.type||'especializacion',credits:data.credits,semesters:data.semesters});
    var ov2=document.getElementById('lr-modal-overlay');
    if(ov2) ov2.dataset.sede=data.sede||'ALL';
  }
}

// === R5 (E22): acciones explícitas sobre rutas huérfanas ===
function _lrReassignRoute(oldEspId, newEspId){
  if(!oldEspId || !newEspId){ toast('Selecciona un programa destino'); return; }
  var lr=window.__LEARNING_ROUTES||{};
  if(!lr[oldEspId]){ toast('Ruta no encontrada'); return; }
  if(oldEspId===newEspId) return;
  if(lr[newEspId]){ toast('El programa destino ya tiene rutas'); return; }
  var out={};
  Object.keys(lr[oldEspId]).forEach(function(sede){
    var r=_lrDraftCopy(lr[oldEspId][sede]);
    r.espId=newEspId;
    r.sede=sede;
    r.id=_lrMakeId(newEspId, sede);
    out[sede]=r;
  });
  lr[newEspId]=out;
  delete lr[oldEspId];
  saveLearningRoutes(); toast('Ruta reasignada a '+newEspId); renderEditor(); __refreshAll();
}

function _lrDeleteOrphan(espId){
  var lr=window.__LEARNING_ROUTES||{};
  if(!lr[espId]){ toast('Ruta no encontrada'); return; }
  var m=lr[espId];
  var first=m[Object.keys(m)[0]]||{};
  showConfirm('Eliminar ruta huérfana','¿Eliminar la ruta huérfana de <strong>'+_lrEsc(first.espName||espId)+'</strong>? Esta es la única operación que elimina una ruta huérfana.',function(){
    delete lr[espId];
    saveLearningRoutes(); toast('Ruta huérfana eliminada'); renderEditor(); __refreshAll();
  });
}
