/**
 * sede-view.js — Vista por sede
 * ---
 * Responsabilidad:
 *   - renderSedeView: agrupa programas de posgrado por sede geográfica,
 *     mostrando cards colapsables con nivel, oferta y estado.
 *
 * Dependencias:
 *   - AppData.getFacultad(AppState.navigation.curFac) — datos de facultad
 *   - pregradoMatch, itemMatch (filters.js) — filtros activos
 *   - getSt (utils.js) — utilidad de estado
 *   - _getObtencionUrl (app.js) — helper de enlaces de obtención
 */

function renderSedeView(){
  function _sdEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function _sdTipoPill(t){
    const map={'Profundización':{c:'#1a6040',bg:'#e8f5ee'},'Investigación':{c:'#1a5cb0',bg:'#e8f0fb'}};
    const v=map[t]||{c:'#888',bg:'#f0f0f0'};
    return '<div style="margin-top:3px"><span style="display:inline-flex;align-items:center;padding:1px 6px;border-radius:8px;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;background:'+v.bg+';color:'+v.c+'">'+_sdEsc(t||'Sin definir')+'</span></div>';
  }
  const f=AppData.getFacultad(AppState.navigation.curFac);const sm={};if(!f)return;
  const filtSedeActive=window.filtSede&&window.filtSede!=='ALL';
  f.progs.forEach(p=>{
    if(!pregradoMatch(p.n)) return;
    [...(p.lineas||[]).filter(l=>itemMatch(l,'espec')),...(p.mae||[]).filter(m=>itemMatch(m,'mae'))].forEach(item=>{
      const target=filtSedeActive?[window.filtSede]:(item.sedes||[]);
      target.forEach(s=>{if(!sm[s])sm[s]=[];sm[s].push({prog:p.n,id:item.id,nivel:item.esp||item.n,e:item.e,o:item.o,enlaceObtencion:item.enlaceObtencion,tipo:item.tipo||'',mae:item.esp===undefined});});
    });
  });
  if(f.doc&&itemMatch(f.doc,'doc')) {
    const dSedes=(f.doc.sedes&&f.doc.sedes.length)?f.doc.sedes:['Todos los pregrados'];
    dSedes.forEach(s=>{if(!sm[s])sm[s]=[];sm[s].push({prog:'Todos',id:'doc-'+f.id,nivel:f.doc.n,e:f.doc.e,o:f.doc.o});});
  }
  const sedes=Object.keys(sm).sort();
  if(!sedes.length){document.getElementById('sede-content').innerHTML='<div class="empty-msg">Sin resultados</div>';return;}
  let h='';
  sedes.forEach(s=>{
    h+=`<div class="sede-card"><div class="sede-name">📍 ${_sdEsc(s)} <span style="font-size:9px;background:#e6f2eb;color:#006633;padding:1px 6px;border-radius:8px;margin-left:4px">${sm[s].length}</span></div>`;
    sm[s].forEach(it=>{
      const st=getSt(it.e);const os=it.o==='V'?'#006633':'#1a5cb0';
      var bUrl=_getObtencionUrl(it.e,it),bAttrs='';
      if(bUrl){bAttrs=' data-action="open-program-link" data-url="'+_sdEsc(bUrl)+'" role="button" tabindex="0" style="cursor:pointer"';}
      var rBtn=_getLearningRoute(it.id,s)?'<span class="route-link" data-action="show-learning-route" data-esp-id="'+_sdEsc(it.id)+'" data-sede="'+_sdEsc(s)+'" role="button" tabindex="0">Ruta</span>':'';
      h+=`<div class="sede-item"><div style="flex:1;font-size:10px;line-height:1.3">${_sdEsc(it.nivel)}${it.mae?_sdTipoPill(it.tipo):''}${rBtn?'<div style="margin-top:3px">'+rBtn+'</div>':''}</div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">
          <span style="font-size:8px;padding:1px 4px;border-radius:4px;background:${it.o==='V'?'#e6f2eb':'#e8f0fb'};color:${os};border:1px solid ${os}">${it.o==='V'?'Vig.':'Proy.'}</span>
          <span style="font-size:8px;padding:1px 4px;border-radius:4px;background:${st.bg};color:${st.tx}"${bAttrs}>${_sdEsc(it.e)||'—'}</span>
        </div></div>`;
    });
    h+=`</div>`;
  });
  document.getElementById('sede-content').innerHTML=h;
}
