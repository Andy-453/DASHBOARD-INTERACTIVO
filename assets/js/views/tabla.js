/**
 * Vista: Tabla de programas
 * Dependencias runtime: AppData, AppState, pregradoMatch, itemMatch, getSt, _getObtencionUrl
 */

function renderTabla(){
  function _tblEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function _maeTipoCell(t){
    const map={'Profundización':{c:'#1a6040',bg:'#e8f5ee'},'Investigación':{c:'#1a5cb0',bg:'#e8f0fb'}};
    const v=map[t]||{c:'#888',bg:'#f0f0f0'};
    return '<span style="display:inline-flex;align-items:center;padding:2px 7px;border-radius:8px;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;background:'+v.bg+';color:'+v.c+'">'+_tblEsc(t||'Sin definir')+'</span>';
  }
  const f=AppData.getFacultad(AppState.navigation.curFac);let rows='';if(!f)return;
  f.progs.forEach(p=>{
    if(!pregradoMatch(p.n)) return;
    const items=[
      ...(p.lineas||[]).filter(l=>itemMatch(l,'espec')).map(l=>({nivel:'Especialización',nombre:l.esp,linea:l.l,sedes:l.sedes||[],e:l.e,o:l.o,enlaceObtencion:l.enlaceObtencion})),
      ...(p.mae||[]).filter(m=>itemMatch(m,'mae')).map(m=>({nivel:'Maestría',nombre:m.n,linea:'—',sedes:m.sedes||[],e:m.e,o:m.o,enlaceObtencion:m.enlaceObtencion,tipo:m.tipo||''}))
    ];
    items.forEach((it,i)=>{
      const st=getSt(it.e);
      const os=it.o==='V'?'background:#e6f2eb;color:#006633;border:1px solid #006633':'background:#e8f0fb;color:#1a5cb0;border:1px solid #378ADD';
      var bUrl=_getObtencionUrl(it.e,it),bAttrs='';
      if(bUrl){bAttrs=' data-action="open-program-link" data-url="'+_tblEsc(bUrl)+'" role="button" tabindex="0" style="cursor:pointer"';}
      rows+=`<tr>${i===0?`<td rowspan="${items.length}" style="font-weight:700;vertical-align:top;color:#006633">${_tblEsc(p.n)}<div style="font-size:9px;color:#666;font-style:italic">${(p.sedes||[]).map(_tblEsc).join(', ')}</div></td>`:''}
        <td><span style="font-size:9px;padding:1px 5px;border-radius:5px;${os}">${it.o==='V'?'Vigente':'Proyectada'}</span></td>
        <td style="font-weight:700">${it.nivel}</td><td style="color:#555">${it.nivel==='Maestría'?_maeTipoCell(it.tipo):_tblEsc(it.linea)}</td>
        <td>${_tblEsc(it.nombre)}</td><td style="font-size:9px">${it.sedes.map(_tblEsc).join(', ')}</td>
        <td><span style="display:inline-flex;align-items:center;gap:3px;padding:2px 5px;border-radius:6px;font-size:9px;font-weight:600;background:${st.bg};color:${st.tx}"${bAttrs}><span style="width:5px;height:5px;border-radius:50%;background:${st.dot};display:inline-block"></span>${_tblEsc(it.e)||'—'}</span></td>
      </tr>`;
    });
  });
  if(f.doc&&itemMatch(f.doc,'doc')){
    const st=getSt(f.doc.e);const os=f.doc.o==='V'?'background:#e6f2eb;color:#006633;border:1px solid #006633':'background:#e8f0fb;color:#1a5cb0;border:1px solid #378ADD';
    rows+=`<tr style="background:#1a2e1a20"><td style="font-weight:700;color:#006633">Todos los pregrados</td>
      <td><span style="font-size:9px;padding:1px 5px;border-radius:5px;${os}">${f.doc.o==='V'?'Vigente':'Proyectada'}</span></td>
      <td style="font-weight:700">Doctorado</td><td>—</td><td>${_tblEsc(f.doc.n)}</td>
      <td style="font-size:9px">${(f.doc.sedes||[]).map(_tblEsc).join(', ')}</td>
      <td><span style="display:inline-flex;align-items:center;gap:3px;padding:2px 5px;border-radius:6px;font-size:9px;font-weight:600;background:${st.bg};color:${st.tx}"><span style="width:5px;height:5px;border-radius:50%;background:${st.dot};display:inline-block"></span>${_tblEsc(f.doc.e)}</span></td>
    </tr>`;
  }
  document.getElementById('tabla').innerHTML=rows
    ?`<thead><tr><th>Programa</th><th>Oferta</th><th>Nivel</th><th>Línea</th><th>Nombre del programa</th><th>Sede(s)</th><th>Estado</th></tr></thead><tbody>${rows}</tbody>`
    :`<tbody><tr><td colspan="7" style="padding:2rem;text-align:center;color:#888">Sin resultados</td></tr></tbody>`;
}

window.App = window.App || {};
window.App.renderTabla = renderTabla;
