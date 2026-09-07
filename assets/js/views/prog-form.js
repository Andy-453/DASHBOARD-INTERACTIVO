/**
 * Vista: Formulario de programa (editor CRUD)
 * Dependencias runtime: AppData, AppState, editingProgId, tmpLineas, tmpMaes,
 *   uid (global), document.getElementById
 */

var TIPO_SIN_LINEA='Sin línea de profundización';

function renderProgForm(){
  var f=AppData.getFacultad(AppState.navigation.curFac),isNew=editingProgId==='__new__';if(!f)return;
  var p=isNew?{id:uid(),n:'',sedes:[],lineas:[{id:uid(),l:'',t:'Profundización 1',esp:'',e:'',o:'V',sedes:[],resp:'',mes:null,ano:null}],mae:[{id:uid(),n:'',e:'',o:'P',sedes:[],resp:'',mes:null,ano:null,tipo:''}]}:f.progs.find(function(x){return x.id===editingProgId;});
  if(!p) return;
  if(!tmpLineas._progId||tmpLineas._progId!==p.id){
    tmpLineas=JSON.parse(JSON.stringify(p.lineas||[]));tmpLineas._progId=p.id;
    tmpMaes=JSON.parse(JSON.stringify(p.mae||[]));tmpMaes._progId=p.id;
  }
  var ES=['','Con registro Calificado','En oferta','Obtención','Radicado MEN','En radicación','Entregado para radicar','En construcción','Por construir','En proyección','Nueva Propuesta de la Facultad','En reclamación  MEN','Renovación','Renovación y modificación de la denominación','Negado MEN'];
  var MS=['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var _cy=new Date().getFullYear(),AS=Array.from({length:10},function(_,i){return _cy+i;});
  function eo(c){return ES.map(function(e){return '<option value="'+e+'"'+(e===c?' selected':'')+'>'+( e||'— Sin estado —')+'</option>';}).join('');}
  function mo(c){return '<option value="">— Mes —</option>'+MS.slice(1).map(function(m,i){return '<option value="'+(i+1)+'"'+((i+1)===c?' selected':'')+'>'+m+'</option>';}).join('');}
  function ao(c){var a=AS.slice();if(c!=null&&a.indexOf(c)===-1)a.push(c);a.sort(function(x,y){return x-y;});return '<option value="">— Año —</option>'+a.map(function(y){return '<option value="'+y+'"'+(y===c?' selected':'')+'>'+y+'</option>';}).join('');}
  var lH=tmpLineas.map(function(l){
    return '<div class="linea-card" id="lc'+esc(l.id)+'">'
      +'<button class="del-btn" data-action="del-linea" data-linea-id="'+esc(l.id)+'">🗑️ Quitar</button>'
+'<div class="grid2"><div class="field" id="llbox'+esc(l.id)+'"'+(l.t===TIPO_SIN_LINEA?' style="display:none"':'')+'><label>Línea</label><input id="ll'+esc(l.id)+'"'+(l.t===TIPO_SIN_LINEA?' disabled':'')+' value="'+esc(l.l||'')+'" placeholder="Nombre de la línea"></div>'
+'<div class="field" id="lmbox'+esc(l.id)+'"'+(l.t===TIPO_SIN_LINEA?'':' style="display:none"')+'><label>Motivo / modalidad</label><input id="lm'+esc(l.id)+'"'+(l.t===TIPO_SIN_LINEA?'':' disabled')+' value="'+esc(l.motivo||'')+'" placeholder="Ej: Semestre avanzado"></div>'
+'<div class="field"><label>Tipo</label><select id="lt'+esc(l.id)+'" data-action="prog-linea-tipo"><option'+(l.t==='Profundización 1'?' selected':'')+'>Profundización 1</option><option'+(l.t==='Profundización 2'?' selected':'')+'>Profundización 2</option><option'+(l.t==='Profundización 3'?' selected':'')+'>Profundización 3</option><option'+(l.t===TIPO_SIN_LINEA?' selected':'')+'>'+TIPO_SIN_LINEA+'</option></select></div></div>'
      +'<div class="grid2"><div class="field"><label>Especialización</label><input id="le'+esc(l.id)+'" value="'+esc(l.esp||'')+'" placeholder="Nombre"></div>'
      +'<div class="field"><label>Estado</label><select id="les'+esc(l.id)+'">'+eo(l.e)+'</select></div></div>'
      +'<div class="grid2"><div class="field"><label>Oferta</label><select id="lo'+esc(l.id)+'"><option value="V"'+(l.o==='V'?' selected':'')+'>Vigente</option><option value="P"'+(l.o==='P'?' selected':'')+'>Proyectada</option></select></div>'
      +'<div class="field"><label>👤 Responsable</label><input id="lresp'+esc(l.id)+'" value="'+esc(l.resp||'')+'" placeholder="Docente o equipo"></div></div>'
      +'<div class="grid3"><div class="field"><label>📅 Mes</label><select id="lmes'+esc(l.id)+'">'+mo(l.mes)+'</select></div>'
+'<div class="field"><label>📅 Año</label><select id="lano'+esc(l.id)+'">'+ao(l.ano)+'</select></div><div class="field"><label>🔗 Link Registro Calificado</label><input type="url" id="lenlace'+esc(l.id)+'" value="'+esc(l.enlaceObtencion||'')+'" placeholder="URL Registro Calificado"></div></div>'
+'<div style="margin-top:6px"><label style="font-size:10px;font-weight:700;color:#555;display:block;margin-bottom:3px">📍 Sedes</label><div style="display:flex;flex-wrap:wrap;gap:4px">'+ALL_SEDES.map(function(s){return '<label style="display:flex;align-items:center;gap:2px;font-size:9px;cursor:pointer;padding:2px 6px;border-radius:4px;background:'+((l.sedes||[]).indexOf(s)>-1?'#e6f2eb':'#f5f5f5')+'"><input type="checkbox" id="lse_'+esc(l.id)+'_'+esc(s)+'" '+((l.sedes||[]).indexOf(s)>-1?'checked':'')+' style="margin:0"> '+esc(s)+'</label>';}).join('')+'</div></div>'
+'</div>';
  }).join('');
  var mH=tmpMaes.map(function(m){
    return '<div class="linea-card" id="mc'+esc(m.id)+'">'
      +'<button class="del-btn" data-action="del-mae" data-mae-id="'+esc(m.id)+'">🗑️ Quitar</button>'
      +'<div class="grid2"><div class="field"><label>Maestría</label><input id="mn'+esc(m.id)+'" value="'+esc(m.n||'')+'" placeholder="Nombre"></div>'
      +'<div class="field"><label>Estado</label><select id="mes'+esc(m.id)+'">'+eo(m.e)+'</select></div></div>'
      +'<div class="grid2"><div class="field"><label>Oferta</label><select id="mo'+esc(m.id)+'"><option value="V"'+(m.o==='V'?' selected':'')+'>Vigente</option><option value="P"'+(m.o==='P'?' selected':'')+'>Proyectada</option></select></div>'
      +'<div class="field"><label>Tipo de maestría</label><select id="mtipo'+esc(m.id)+'"><option value=""'+(m.tipo===''||!m.tipo?' selected':'')+'>Sin definir</option><option'+(m.tipo==='Profundización'?' selected':'')+'>Profundización</option><option'+(m.tipo==='Investigación'?' selected':'')+'>Investigación</option></select></div></div>'
      +'<div class="grid2"><div class="field"><label>👤 Responsable</label><input id="mresp'+esc(m.id)+'" value="'+esc(m.resp||'')+'" placeholder="Docente o equipo"></div></div>'
      +'<div class="grid3"><div class="field"><label>📅 Mes</label><select id="mmes'+esc(m.id)+'">'+mo(m.mes)+'</select></div>'
+'<div class="field"><label>📅 Año</label><select id="mano'+esc(m.id)+'">'+ao(m.ano)+'</select></div><div class="field"><label>🔗 Enlace</label><input type="url" id="menlace'+esc(m.id)+'" value="'+esc(m.enlaceObtencion||'')+'" placeholder="URL programa"></div></div>'
+'<div style="margin-top:6px"><label style="font-size:10px;font-weight:700;color:#555;display:block;margin-bottom:3px">📍 Sedes</label><div style="display:flex;flex-wrap:wrap;gap:4px">'+ALL_SEDES.map(function(s){return '<label style="display:flex;align-items:center;gap:2px;font-size:9px;cursor:pointer;padding:2px 6px;border-radius:4px;background:'+((m.sedes||[]).indexOf(s)>-1?'#e6f2eb':'#f5f5f5')+'"><input type="checkbox" id="mse_'+esc(m.id)+'_'+esc(s)+'" '+((m.sedes||[]).indexOf(s)>-1?'checked':'')+' style="margin:0"> '+esc(s)+'</label>';}).join('')+'</div></div>'
+'</div>';
  }).join('');
  var h='<div class="modal-overlay"><div class="modal">'
    +'<div class="modal-title"><span>'+(isNew?'🆕':'✏️')+'</span>'+(isNew?'Nuevo programa':'Editar — '+esc(p.n))+'</div>'
    +'<div class="form-section"><h3>Programa de pregrado</h3>'
      +'<div class="grid2"><div class="field"><label>Nombre</label><input id="pn" value="'+esc(p.n||'')+'" placeholder="Nombre del pregrado"></div>'
      +'<div class="field"><label>Sedes</label><input id="psedes" value="'+esc(p.sedes?p.sedes.join(', '):'')+'" placeholder="Ej: Fusagasugá, Chía"></div></div></div>'
    +'<div class="form-section"><h3>Líneas de profundización y especializaciones</h3>'
      +'<div id="lineas-container">'+lH+'</div>'
      +'<button data-action="add-linea" style="margin-top:6px;border-color:#006633;color:#006633">+ Agregar línea</button></div>'
    +'<div class="form-section"><h3>Maestrías</h3>'
      +'<div id="maes-container">'+mH+'</div>'
      +'<button data-action="add-mae" style="margin-top:6px;border-color:#C8A43A;color:#8a6d00">+ Agregar maestría</button></div>'
    +'<div class="modal-actions">'
      +'<button class="btn-green" data-action="save-prog" data-pid="'+esc(p.id)+'" data-is-new="'+(isNew?'true':'false')+'">💾 Guardar</button>'
      +'<button data-action="cancel-edit">Cancelar</button>'
      +(isNew?'':'<button class="btn-red" data-action="delete-prog" data-pid="'+esc(p.id)+'">🗑️ Eliminar</button>')
    +'</div></div></div>';
  document.getElementById('editor-content').innerHTML=h;
}

window.App = window.App || {};
window.App.renderProgForm = renderProgForm;
