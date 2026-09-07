/**
 * indicators.js — Panel de Indicadores y métricas visuales
 * ---
 * Responsabilidad:
 *   - renderIndicadores: dashboard completo de indicadores
 *     (KPIs globales, gráficos de torta, tabla por facultad, estado por facultad)
 *   - helpers internos de renderizado SVG (pieSlices)
 *   - agrupación y conteo de estados (getEstGroup)
 *
 * Dependencias:
 *   - AppData.getFacultades() — datos completos vía capa de datos
 *
 * Compatibilidad legacy:
 *   - window.renderIndicadores — requerido por showTab() en app.js y por HTML
 *     con datos embebidos (onclick, panel-indicadores).
 *
 * Riesgos de acoplamiento:
 *   - La taxonomía de estados proviene de getSt/ST_MAP (utils.js), fuente única
 *
 * Estado:
 *   Extraído de app.js. Acceso DB via AppData.
 */

function renderIndicadores(){
  const wrap = document.getElementById('indicadores-content');
  const state = window.AppState; // future: filtrado por facultad activa

  let totalPre=0, totalEsp=0, totalMae=0, totalDoc=0;
  let vigente=0, proyectada=0;
  let totalMaeV=0, totalDocV=0;
  const estadoCount={};
  const facStats=[];
  // FASE 3.9.1: contabilidad POR ENTIDAD para la tabla "Distribución por
  // facultad". La especialización es una entidad consolidada (clave
  // _normalizeEspecializacion(l.esp)); es Vigente si al menos una de sus
  // líneas tiene o==='V', Proyectada si todas son no-V (regla 3.9.0.1).
  const espGlobalCons = new Map(); // key -> {name, v, facs}
  const espSharedNames = [];

  function getEstGroup(e){
    const g=getSt(e);
    return g.cat?{label:g.group,color:g.dot,bg:g.bg}:{label:'Sin definir',color:'#888',bg:'#f5f5f0'};
  }

  AppData.getFacultades().forEach(fac=>{
    const fs={name:fac.name, pre:fac.progs.length, esp:0, mae:0, doc:fac.doc?1:0, vigente:0, proyectada:0, estados:{}};
    const esLocal = new Map();
    totalPre+=fac.progs.length;
    fac.progs.forEach(p=>{
      p.lineas.forEach(l=>{
        fs.esp++; totalEsp++;
        if(l.o==='V'){vigente++;fs.vigente++;} else{proyectada++;fs.proyectada++;}
        const leV = l.o==='V';
        const k=_normalizeEspecializacion(l.esp);
        let le=esLocal.get(k);
        if(!le){le={v:leV}; esLocal.set(k,le);} else if(leV){le.v=true;}
        let ge=espGlobalCons.get(k);
        if(!ge){ge={name:(l.esp==null||String(l.esp).trim()==='')?'Sin especialización':l.esp, v:leV, facs:[]}; espGlobalCons.set(k,ge);}
        else if(leV){ge.v=true;}
        if(ge.facs.indexOf(fac.name)<0) ge.facs.push(fac.name);
        const g=getEstGroup(l.e); estadoCount[g.label]=(estadoCount[g.label]||0)+1; fs.estados[g.label]=(fs.estados[g.label]||0)+1;
      });
      p.mae.forEach(m=>{
        fs.mae++; totalMae++;
        if(m.o==='V'){vigente++;fs.vigente++; totalMaeV++;} else{proyectada++;fs.proyectada++;}
        const g=getEstGroup(m.e); estadoCount[g.label]=(estadoCount[g.label]||0)+1; fs.estados[g.label]=(fs.estados[g.label]||0)+1;
      });
    });
    const docV = fac.doc && fac.doc.o==='V' ? 1 : 0;
    let maeV=0;
    fac.progs.forEach(p=>(p.mae||[]).forEach(m=>{ if(m.o==='V') maeV++; }));
    if(fac.doc){
      totalDoc++;
      if(fac.doc.o==='V'){vigente++;fs.vigente++; totalDocV++;} else{proyectada++;fs.proyectada++;}
      const g=getEstGroup(fac.doc.e); estadoCount[g.label]=(estadoCount[g.label]||0)+1; fs.estados[g.label]=(fs.estados[g.label]||0)+1;
    }
    let espV=0;
    esLocal.forEach(e=>{ if(e.v) espV++; });
    fs.espCons=esLocal.size; fs.espV=espV; fs.espP=esLocal.size-espV;
    fs.maeV=maeV; fs.docV=docV;
    fs.vigEntity=espV+maeV+docV;
    fs.proyEntity=(esLocal.size-espV)+(fs.mae-maeV)+(fs.doc-docV);
    facStats.push(fs);
  });

  espGlobalCons.forEach(g=>{ if(g.facs.length>1) espSharedNames.push(g.name); });

  // Totales POR ENTIDAD (global) para la tabla: 44 / 20 / 6, posgrados 70.
  const totalEspCons = espGlobalCons.size;
  let espVGlobal=0;
  espGlobalCons.forEach(g=>{ if(g.v) espVGlobal++; });
  const espPGlobal = totalEspCons - espVGlobal;
  const totalPosgCons = totalEspCons + totalMae + totalDoc;
  const vigGlobalCons = espVGlobal + totalMaeV + totalDocV;
  const proyGlobalCons = espPGlobal + (totalMae-totalMaeV) + (totalDoc-totalDocV);
  const sumEspFilas = facStats.reduce((a,b)=>a+b.espCons,0);

  const totalPosg = totalEsp+totalMae+totalDoc;
  const total = totalPre+totalPosg;

  const EST_COLORS={
    'Obtención / Con registro':{color:'#1D9E75',bg:'#E1F5EE'},
    'Radicado MEN':{color:'#378ADD',bg:'#E6F1FB'},
    'En construcción':{color:'#BA7517',bg:'#FAEEDA'},
    'Por construir':{color:'#e09020',bg:'#FEF3C7'},
    'En reclamación':{color:'#D85A30',bg:'#FAECE7'},
    'Negado MEN':{color:'#A32D2D',bg:'#FCEBEB'},
    'Sin definir':{color:'#888',bg:'#f5f5f0'},
  };

  let h=`<div style="padding:1.25rem;background:#f4f6f4;min-height:400px">`;

  h+=`<div style="font-size:14px;font-weight:700;color:#006633;margin-bottom:1rem;display:flex;align-items:center;gap:8px">
    <span style="width:4px;height:20px;background:#006633;border-radius:2px;display:inline-block"></span>
    Panel de Indicadores — Oferta Académica Universidad de Cundinamarca
  </div>`;

  h+=`<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:1.25rem">`;
  const kpis=[
    {v:AppData.getFacultadCount(), l:'Facultades', c:'#006633', bg:'#e6f2eb'},
    {v:totalPre, l:'Programas pregrado', c:'#2e8b57', bg:'#f0faf5'},
    {v:totalEsp, l:'Especializaciones', c:'#3aaa72', bg:'#eaf7f0'},
    {v:totalMae, l:'Maestrías', c:'#C8A43A', bg:'#fdf6e3'},
    {v:totalDoc, l:'Doctorados', c:'#0d3d22', bg:'#d4e8da'},
    {v:totalPosg, l:'Total posgrados', c:'#185FA5', bg:'#e6f0fb'},
  ];
  kpis.forEach(k=>{
    h+=`<div style="background:${k.bg};border-radius:10px;padding:12px 14px;text-align:center;border:1px solid ${k.c}30">
      <div style="font-size:26px;font-weight:800;color:${k.c}">${k.v}</div>
      <div style="font-size:9px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:.06em;margin-top:3px;line-height:1.3">${k.l}</div>
    </div>`;
  });
  h+=`</div>`;

  h+=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1.25rem">`;

  const totalOferta=vigente+proyectada;
  const pctV=totalOferta>0?Math.round(vigente/totalOferta*100):0;
  const pctP=totalOferta>0?100-pctV:0;

  function pieSlices(segments){
    const cx=80, cy=80, r=62, ri=36;
    let angle=-90, paths='';
    segments.forEach(seg=>{
      const a1=angle, a2=angle+(seg.pct/100)*360;
      const r1=a1*Math.PI/180, r2=a2*Math.PI/180;
      const large=seg.pct>50?1:0;
      const x1o=cx+r*Math.cos(r1), y1o=cy+r*Math.sin(r1);
      const x2o=cx+r*Math.cos(r2), y2o=cy+r*Math.sin(r2);
      const x1i=cx+ri*Math.cos(r2), y1i=cy+ri*Math.sin(r2);
      const x2i=cx+ri*Math.cos(r1), y2i=cy+ri*Math.sin(r1);
      const mid=(r1+r2)/2;
      const lx=cx+(r+ri)/2*Math.cos(mid), ly=cy+(r+ri)/2*Math.sin(mid);
      paths+=`<path d="M ${x1o} ${y1o} A ${r} ${r} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${ri} ${ri} 0 ${large} 0 ${x2i} ${y2i} Z"
        fill="${seg.color}" stroke="#fff" stroke-width="2"/>`;
      if(seg.pct>8){
        paths+=`<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle"
          font-size="10" font-weight="700" fill="#fff" font-family="Arial">${Math.round(seg.pct)}%</text>`;
      }
      angle=a2;
    });
    return paths;
  }

  const seg1=[
    {pct:pctV, color:'#006633', label:'Vigente'},
    {pct:pctP, color:'#378ADD', label:'Proyectada'},
  ];

  h+=`<div style="background:#fff;border-radius:12px;padding:16px 18px;border:1px solid #d8e8dc;box-shadow:0 2px 8px rgba(0,102,51,0.06)">
    <div style="font-size:10px;font-weight:700;color:#006633;text-transform:uppercase;letter-spacing:.09em;margin-bottom:14px;display:flex;align-items:center;gap:6px">
      <span style="width:3px;height:14px;background:#006633;border-radius:2px;display:inline-block"></span>
      Oferta vigente vs proyectada
    </div>
    <div style="display:flex;align-items:center;gap:18px">
      <div style="flex-shrink:0">
        <svg width="160" height="160" viewBox="0 0 160 160">
          ${pieSlices(seg1)}
          <circle cx="80" cy="80" r="30" fill="#fff"/>
          <text x="80" y="75" text-anchor="middle" font-size="18" font-weight="800" fill="#006633" font-family="Arial">${vigente+proyectada}</text>
          <text x="80" y="90" text-anchor="middle" font-size="8" fill="#888" font-family="Arial">TOTAL</text>
        </svg>
      </div>
      <div style="flex:1">
        <div style="margin-bottom:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
            <span style="display:flex;align-items:center;gap:6px;font-size:11px;color:#333;font-weight:600">
              <span style="width:12px;height:12px;border-radius:3px;background:#006633;display:inline-block"></span>Vigente
            </span>
            <span style="font-size:13px;font-weight:800;color:#006633">${vigente}</span>
          </div>
          <div style="height:8px;background:#e8f0e8;border-radius:4px;overflow:hidden">
            <div style="width:${pctV}%;height:100%;background:#006633;border-radius:4px"></div>
          </div>
          <div style="font-size:9px;color:#888;margin-top:2px;text-align:right">${pctV}% del total</div>
        </div>
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
            <span style="display:flex;align-items:center;gap:6px;font-size:11px;color:#333;font-weight:600">
              <span style="width:12px;height:12px;border-radius:3px;background:#378ADD;display:inline-block"></span>Proyectada
            </span>
            <span style="font-size:13px;font-weight:800;color:#378ADD">${proyectada}</span>
          </div>
          <div style="height:8px;background:#e6f0fb;border-radius:4px;overflow:hidden">
            <div style="width:${pctP}%;height:100%;background:#378ADD;border-radius:4px"></div>
          </div>
          <div style="font-size:9px;color:#888;margin-top:2px;text-align:right">${pctP}% del total</div>
        </div>
      </div>
    </div>
  </div>`;

  const totalEst=Object.values(estadoCount).reduce((a,b)=>a+b,0);
  const sortedEst=Object.entries(estadoCount).sort((a,b)=>b[1]-a[1]);
  const EST_PIE_COLORS=['#1D9E75','#378ADD','#BA7517','#e09020','#D85A30','#A32D2D','#888'];
  const seg2=sortedEst.map((([est,cnt],i)=>({
    pct:cnt/totalEst*100,
    color:(EST_COLORS[est]||{color:EST_PIE_COLORS[i%EST_PIE_COLORS.length]}).color,
    label:est,cnt
  })));

  h+=`<div style="background:#fff;border-radius:12px;padding:16px 18px;border:1px solid #d8e8dc;box-shadow:0 2px 8px rgba(0,102,51,0.06)">
    <div style="font-size:10px;font-weight:700;color:#006633;text-transform:uppercase;letter-spacing:.09em;margin-bottom:14px;display:flex;align-items:center;gap:6px">
      <span style="width:3px;height:14px;background:#006633;border-radius:2px;display:inline-block"></span>
      Estado actual de programas
    </div>
    <div style="display:flex;align-items:center;gap:16px">
      <div style="flex-shrink:0">
        <svg width="160" height="160" viewBox="0 0 160 160">
          ${pieSlices(seg2)}
          <circle cx="80" cy="80" r="30" fill="#fff"/>
          <text x="80" y="75" text-anchor="middle" font-size="18" font-weight="800" fill="#1a2e1a" font-family="Arial">${totalEst}</text>
          <text x="80" y="90" text-anchor="middle" font-size="8" fill="#888" font-family="Arial">PROG.</text>
        </svg>
      </div>
      <div style="flex:1;max-height:140px;overflow-y:auto">
        ${sortedEst.map(([est,cnt])=>{
          const ec=EST_COLORS[est]||{color:'#888',bg:'#f5f5f0'};
          const pct=Math.round(cnt/totalEst*100);
          return `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #f0f4f0">
            <span style="width:10px;height:10px;border-radius:50%;background:${ec.color};flex-shrink:0;display:inline-block"></span>
            <span style="font-size:9px;color:#333;flex:1;line-height:1.3">${est}</span>
            <span style="font-size:10px;font-weight:700;color:${ec.color};white-space:nowrap">${cnt} <span style="font-size:8px;font-weight:400;color:#999">${pct}%</span></span>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;

  h+=`</div>`;

  h+=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1.25rem">`;

  const nivelSegs=[
    {pct:totalEsp/(totalPosg||1)*100, color:'#3aaa72', label:'Especializaciones', cnt:totalEsp},
    {pct:totalMae/(totalPosg||1)*100, color:'#C8A43A', label:'Maestrías', cnt:totalMae},
    {pct:totalDoc/(totalPosg||1)*100, color:'#0d3d22', label:'Doctorados', cnt:totalDoc},
  ];

  h+=`<div style="background:#fff;border-radius:12px;padding:16px 18px;border:1px solid #d8e8dc;box-shadow:0 2px 8px rgba(0,102,51,0.06)">
    <div style="font-size:10px;font-weight:700;color:#006633;text-transform:uppercase;letter-spacing:.09em;margin-bottom:14px;display:flex;align-items:center;gap:6px">
      <span style="width:3px;height:14px;background:#006633;border-radius:2px;display:inline-block"></span>
      Distribución por nivel de posgrado
    </div>
    <div style="display:flex;align-items:center;gap:18px">
      <div style="flex-shrink:0">
        <svg width="160" height="160" viewBox="0 0 160 160">
          ${pieSlices(nivelSegs)}
          <circle cx="80" cy="80" r="30" fill="#fff"/>
          <text x="80" y="75" text-anchor="middle" font-size="18" font-weight="800" fill="#006633" font-family="Arial">${totalPosg}</text>
          <text x="80" y="90" text-anchor="middle" font-size="8" fill="#888" font-family="Arial">POSGRADOS</text>
        </svg>
      </div>
      <div style="flex:1">
        ${nivelSegs.map(s=>`
        <div style="margin-bottom:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
            <span style="display:flex;align-items:center;gap:6px;font-size:11px;color:#333;font-weight:600">
              <span style="width:12px;height:12px;border-radius:3px;background:${s.color};display:inline-block"></span>${s.label}
            </span>
            <span style="font-size:13px;font-weight:800;color:${s.color}">${s.cnt}</span>
          </div>
          <div style="height:7px;background:#f0f4f0;border-radius:4px;overflow:hidden">
            <div style="width:${Math.round(s.pct)}%;height:100%;background:${s.color};border-radius:4px"></div>
          </div>
          <div style="font-size:9px;color:#888;margin-top:2px;text-align:right">${Math.round(s.pct)}% del total</div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;

  const FAC_COLORS_PIE=['#006633','#2e8b57','#3aaa72','#C8A43A','#378ADD','#D85A30','#993556','#534AB7'];
  const facSegments = facStats.map((fs,i)=>({
    pct:(fs.esp+fs.mae+fs.doc)/(totalPosg||1)*100,
    color: FAC_COLORS_PIE[i%FAC_COLORS_PIE.length],
    label: fs.name.replace('Facultad de ','').replace('Facultad ','').split(',')[0].trim(),
    cnt: fs.esp+fs.mae+fs.doc
  })).filter(s=>s.cnt>0);

  h+=`<div style="background:#fff;border-radius:12px;padding:16px 18px;border:1px solid #d8e8dc;box-shadow:0 2px 8px rgba(0,102,51,0.06)">
    <div style="font-size:10px;font-weight:700;color:#006633;text-transform:uppercase;letter-spacing:.09em;margin-bottom:14px;display:flex;align-items:center;gap:6px">
      <span style="width:3px;height:14px;background:#006633;border-radius:2px;display:inline-block"></span>
      Participación por facultad
    </div>
    <div style="display:flex;align-items:center;gap:16px">
      <div style="flex-shrink:0">
        <svg width="160" height="160" viewBox="0 0 160 160">
          ${pieSlices(facSegments)}
          <circle cx="80" cy="80" r="30" fill="#fff"/>
          <text x="80" y="75" text-anchor="middle" font-size="18" font-weight="800" fill="#1a2e1a" font-family="Arial">${AppData.getFacultadCount()}</text>
          <text x="80" y="90" text-anchor="middle" font-size="8" fill="#888" font-family="Arial">FAC.</text>
        </svg>
      </div>
      <div style="flex:1;max-height:140px;overflow-y:auto">
        ${facSegments.map(s=>{
          const pct=Math.round(s.pct);
          return `<div style="display:flex;align-items:center;gap:5px;padding:3px 0;border-bottom:1px solid #f0f4f0">
            <span style="width:10px;height:10px;border-radius:50%;background:${s.color};flex-shrink:0;display:inline-block"></span>
            <span style="font-size:9px;color:#333;flex:1;line-height:1.3">${esc(s.label)}</span>
            <span style="font-size:9px;font-weight:700;color:${s.color};white-space:nowrap">${s.cnt} <span style="font-size:8px;font-weight:400;color:#999">${pct}%</span></span>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;

  h+=`</div>`;
  h+=`<div style="background:#fff;border-radius:10px;padding:14px 16px;border:1px solid #d8e8dc;margin-bottom:1.25rem">
    <div style="font-size:10px;font-weight:700;color:#006633;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">Distribución por facultad</div>
    <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:10px;min-width:700px">
      <thead>
        <tr style="background:#006633;color:#fff">
          <th style="padding:8px 10px;text-align:left;font-weight:700;border-radius:6px 0 0 0">Facultad</th>
          <th style="padding:8px 10px;text-align:center;font-weight:700">Pregrados</th>
          <th style="padding:8px 10px;text-align:center;font-weight:700">Especializaciones</th>
          <th style="padding:8px 10px;text-align:center;font-weight:700">Maestrías</th>
          <th style="padding:8px 10px;text-align:center;font-weight:700">Doctorado</th>
          <th style="padding:8px 10px;text-align:center;font-weight:700">Total posgrados</th>
          <th style="padding:8px 10px;text-align:center;font-weight:700">Vigente</th>
          <th style="padding:8px 10px;text-align:center;font-weight:700">Proyectada</th>
          <th style="padding:8px 10px;text-align:left;font-weight:700;border-radius:0 6px 0 0">% participación</th>
        </tr>
      </thead>
      <tbody>`;

  facStats.forEach((fs,i)=>{
    const tp=fs.espCons+fs.mae+fs.doc;
    const pct=totalPosgCons>0?Math.round(tp/totalPosgCons*100):0;
    const bg=i%2===0?'#f8fbf8':'#fff';
    h+=`<tr style="background:${bg};border-bottom:1px solid #eef4ee">
      <td style="padding:8px 10px;font-weight:600;color:#006633;font-size:10px">${esc(fs.name.replace('Facultad de ','').replace('Facultad ',''))} </td>
      <td style="padding:8px 10px;text-align:center;font-weight:700;color:#2e8b57">${fs.pre>0
        ? '<span class="cell-click" role="button" tabindex="0" style="display:inline-block;padding:2px 10px;border-radius:8px" data-action="pre-show-detail" data-filter="fac|'+esc(fs.name)+'" title="Ver programas de pregrado de '+esc(fs.name)+'">'+fs.pre+'</span>'
        : '<span style="color:#999">0</span>'}</td>
      <td style="padding:8px 10px;text-align:center">${fs.espCons>0
        ? '<span class="rc-sum-click" role="button" tabindex="0" style="display:inline-block;padding:2px 10px;border-radius:8px;font-weight:700" data-action="esf-show-detail" data-filter="fac|'+esc(fs.name)+'" title="Ver especializaciones de '+esc(fs.name)+'">'+fs.espCons+'</span>'
        : '<span style="color:#999">0</span>'}</td>
      <td style="padding:8px 10px;text-align:center;color:#9a7c1a;font-weight:600">${fs.mae>0
        ? '<span class="mae-click" role="button" tabindex="0" style="display:inline-block;padding:2px 10px;border-radius:8px" data-action="mae-show-detail" data-filter="fac|'+esc(fs.name)+'" title="Ver maestrías de '+esc(fs.name)+'">'+fs.mae+'</span>'
        : '<span style="color:#999">0</span>'}</td>
      <td style="padding:8px 10px;text-align:center;color:#0d3d22;font-weight:600">${fs.doc>0
        ? '<span class="cell-click" role="button" tabindex="0" style="display:inline-block;padding:2px 10px;border-radius:8px" data-action="doc-show-detail" data-filter="fac|'+esc(fs.name)+'" title="Ver doctorado de '+esc(fs.name)+'">'+fs.doc+'</span>'
        : '<span style="color:#999">0</span>'}</td>
      <td style="padding:8px 10px;text-align:center;font-weight:700;color:#185FA5">${tp>0
        ? '<span class="cell-click" role="button" tabindex="0" style="display:inline-block;padding:2px 10px;border-radius:8px" data-action="posg-show-detail" data-filter="fac|'+esc(fs.name)+'" title="Ver posgrados de '+esc(fs.name)+'">'+tp+'</span>'
        : '<span style="color:#999">0</span>'}</td>
      <td style="padding:8px 10px;text-align:center">${fs.vigEntity>0
        ? '<span class="cell-click" role="button" tabindex="0" style="display:inline-block;padding:2px 8px;border-radius:8px;font-weight:600;background:#e6f2eb;color:#006633" data-action="posg-show-detail-vigente" data-filter="fac|'+esc(fs.name)+'" title="Ver posgrados vigentes de '+esc(fs.name)+'">'+fs.vigEntity+'</span>'
        : '<span style="background:#e6f2eb;color:#006633;padding:2px 8px;border-radius:8px;font-weight:600">'+fs.vigEntity+'</span>'}</td>
      <td style="padding:8px 10px;text-align:center">${fs.proyEntity>0
        ? '<span class="cell-click" role="button" tabindex="0" style="display:inline-block;padding:2px 8px;border-radius:8px;font-weight:600;background:#e6f0fb;color:#185FA5" data-action="posg-show-detail-proyectada" data-filter="fac|'+esc(fs.name)+'" title="Ver posgrados proyectados de '+esc(fs.name)+'">'+fs.proyEntity+'</span>'
        : '<span style="background:#e6f0fb;color:#185FA5;padding:2px 8px;border-radius:8px;font-weight:600">'+fs.proyEntity+'</span>'}</td>
      <td style="padding:8px 10px">
        <div style="display:flex;align-items:center;gap:6px">
          <div style="flex:1;height:6px;background:#e8f0e8;border-radius:3px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:#006633;border-radius:3px"></div>
          </div>
          <span style="font-size:9px;font-weight:700;color:#006633;min-width:28px">${pct}%</span>
        </div>
      </td>
    </tr>`;
  });

  h+=`<tr style="background:#006633;color:#fff;font-weight:700">
    <td style="padding:9px 10px;border-radius:0 0 0 6px">TOTAL</td>
    <td style="padding:9px 10px;text-align:center">${totalPre}</td>
    <td style="padding:9px 10px;text-align:center">${totalEspCons}<sup style="font-size:7px;color:#cfe6d8">*</sup></td>
    <td style="padding:9px 10px;text-align:center">${totalMae}</td>
    <td style="padding:9px 10px;text-align:center">${totalDoc}</td>
    <td style="padding:9px 10px;text-align:center">${totalPosgCons}</td>
    <td style="padding:9px 10px;text-align:center">${vigGlobalCons}</td>
    <td style="padding:9px 10px;text-align:center">${proyGlobalCons}</td>
    <td style="padding:9px 10px;border-radius:0 0 6px 0">100%</td>
  </tr>`;
  h+=`</tbody></table>`;
  if(espSharedNames.length>0 && sumEspFilas>totalEspCons){
    h+=`<div style="font-size:9px;color:#777;margin-top:8px;line-height:1.5">
      <sup>*</sup> Total de ${totalEspCons} especializaciones únicas. La suma por filas (${sumEspFilas}) supera el total porque la siguiente especialización está compartida entre facultades
      (se cuenta una vez por facultad): <i>${esc(espSharedNames.join(', '))}</i>.
    </div>`;
  }
  h+=`</div></div>`;

  h+=`<div style="background:#fff;border-radius:10px;padding:14px 16px;border:1px solid #d8e8dc">
    <div style="font-size:10px;font-weight:700;color:#006633;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">Estado actual por facultad</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px">`;

  facStats.forEach(fs=>{
    const tp=fs.esp+fs.mae+fs.doc;
    h+=`<div style="border:1px solid #e0ece4;border-radius:8px;overflow:hidden">
      <div style="background:#006633;color:#fff;padding:7px 10px;font-size:10px;font-weight:700">${esc(fs.name.replace('Facultad de ','').replace('Facultad ',''))}</div>
      <div style="padding:8px 10px">`;
    const sortedFs=Object.entries(fs.estados).sort((a,b)=>b[1]-a[1]);
    sortedFs.forEach(([est,cnt])=>{
      const ec=EST_COLORS[est]||{color:'#888',bg:'#f5f5f0'};
      const pct=tp>0?Math.round(cnt/tp*100):0;
      h+=`<div style="display:flex;align-items:center;justify-content:space-between;padding:3px 0;border-bottom:1px solid #f0f4f0">
        <span style="font-size:9px;color:#444;display:flex;align-items:center;gap:4px">
          <span style="width:7px;height:7px;border-radius:50%;background:${ec.color};display:inline-block;flex-shrink:0"></span>${esc(est)}
        </span>
        <span style="font-size:9px;font-weight:700;color:${ec.color};white-space:nowrap">${cnt} (${pct}%)</span>
      </div>`;
    });
    h+=`</div></div>`;
  });

  h+=`</div></div>`;

  // ===== REGISTRO CALIFICADO POR FACULTAD =====
  h+=renderRCSeccion();

  // ===== ESPECIALIZACIONES POR FACULTAD (p.lineas[] · A2 ponderado) =====
  h+=renderEsfSeccion();

  // ===== LÍNEAS DE PROFUNDIZACIÓN (p.lineas[]) =====
  h+=renderProfSeccion();

  // ===== MAESTRÍAS POR FACULTAD (p.mae[] · Orientación de la Maestría) =====
  h+=renderMaeSeccion();

  h+=`</div>`;

  wrap.innerHTML=h;
  renderProfCharts();
  renderEsfDonaCharts();
  renderEsfRcChart();
  renderMaeDonaCharts();
  renderMaeRcChart();
}

/**
 * Criterio único de Registro Calificado (RC) basado en enlaceObtencion.
 * NO se infiere RC a partir del campo de estado. Devuelve true únicamente
 * cuando enlaceObtencion es un string no vacío (contiene una URL/link).
 * @param {*} v - valor de enlaceObtencion de la línea
 * @returns {boolean}
 */
var _rcHasLink = function(v){
  return typeof v === 'string' && v.trim().length > 0;
};

/**
 * Agrega los totales de Registro Calificado de UNA facultad a partir de sus
 * líneas/especializaciones (p.lineas[]). Usa l.o (V/P) con la misma semántica
 * de Vigente/Proyectada que renderIndicadores().
 * @param {Object} fac - facultad de window.DB
 * @param {Object} acc - acumulador de la facultad (se muta)
 */
var _rcAccumFac = function(fac, acc){
  (fac.progs||[]).forEach(function(p){
    (p.lineas||[]).forEach(function(l){
      var rc = _rcHasLink(l.enlaceObtencion);
      var v = l.o === 'V', proy = l.o === 'P';
      acc.total++;
      if(rc && v) acc.vigCon++;
      else if(rc && proy) acc.proyCon++;
      else if(v) acc.vigSin++;
      else acc.proySin++;
    });
  });
};

/**
 * Calcula el resumen global y por facultad de Registro Calificado,
 * EN CADA LLAMADA, a partir de AppData.getFacultades() (window.DB vivo).
 * No persiste nada ni guarda en localStorage.
 * @returns {{total:number, conRC:number, sinRC:number, vigCon:number,
 *            vigSin:number, proyCon:number, proySin:number, perFac:Array}}
 */
var _rcCompute = function(){
  var perFac = [];
  var total = 0, conRC = 0, sinRC = 0, vigCon = 0, vigSin = 0, proyCon = 0, proySin = 0;
  AppData.getFacultades().forEach(function(fac){
    var acc = { fac: fac, total: 0, conRC: 0, sinRC: 0, vigCon: 0, vigSin: 0, proyCon: 0, proySin: 0 };
    _rcAccumFac(fac, acc);
    acc.conRC = acc.vigCon + acc.proyCon;
    acc.sinRC = acc.total - acc.conRC;
    total += acc.total; conRC += acc.conRC; sinRC += acc.sinRC;
    vigCon += acc.vigCon; vigSin += acc.vigSin; proyCon += acc.proyCon; proySin += acc.proySin;
    perFac.push(acc);
  });
  return { total: total, conRC: conRC, sinRC: sinRC, vigCon: vigCon, vigSin: vigSin, proyCon: proyCon, proySin: proySin, perFac: perFac };
};

/**
 * CAPA DE LECTURA/AGRUPACIÓN del indicador "Registro Calificado de
 * ESPECIALIZACIONES" a nivel de ENTIDAD (44 especializaciones consolidadas).
 * Consolida por _normalizeEspecializacion() — la MISMA clave de
 * getEspecializacionesAgrupadas() — recorriendo f.progs[].lineas[] en vivo.
 * Regla RC: cualquierRC ⇔ al menos un registro asociado tiene enlaceObtencion
 * válido (_rcHasLink). NO usa l.o ni l.e ni V/P. Read-only sobre window.DB.
 *
 * El total INSTITUCIONAL cuenta cada especialización UNA vez (sin importar si
 * pertenece a varias facultades). El array perFac cuenta, por cada facultad,
 * las especializaciones asociadas a ella (una compartida puede aparecer una vez
 * en cada una de sus facultades), por lo que la suma de perFac[].total puede
 * superar el total institucional; NUNCA se muestra 45 como total.
 * @returns {{
 *   total:number, con:number, sin:number, cobertura:number,
 *   perFac:Array<{fac:Object,total:number,con:number,sin:number}>,
 *   esp:Array<{key:string,esp:string,facultades:Array,programas:Array,
 *             lineas:Array,registros:number,ofertas:Array,estados:Array,
 *             enlaces:Array,anyRC:boolean}>
 * }}
 */
var _rcEspSeries = function(){
  var mapa = {};
  var perFacAcc = {};

  AppData.getFacultades().forEach(function(fac){
    (fac.progs || []).forEach(function(p){
      (p.lineas || []).forEach(function(l){
        var rc = _rcHasLink(l.enlaceObtencion);
        var orig = l.esp;
        var key = _normalizeEspecializacion(orig);
        var g = mapa[key];
        if (!g) {
          g = mapa[key] = {
            key: key,
            esp: (orig == null || String(orig).trim() === '') ? 'Sin especialización' : orig,
            facultades: [], programas: [], lineas: [], ofertas: [], estados: [],
            enlaces: [], registros: 0, anyRC: false
          };
        }
        g.registros++;
        if (rc) g.anyRC = true;
        _pushUniq(g.facultades, fac.name);
        _pushUniq(g.programas, (p.n != null && String(p.n).trim() !== '') ? p.n : (p.id != null ? p.id : ''));
        _pushUniq(g.lineas, l.l == null ? '' : String(l.l));
        _pushUniq(g.ofertas, l.o === 'V' ? 'Vigente' : 'Proyectada');
        _pushUniq(g.estados, l.e == null ? '' : String(l.e));
        if (rc && String(l.enlaceObtencion).trim() !== '') _pushUniq(g.enlaces, String(l.enlaceObtencion).trim());

        // Acumulador por facultad: consolidación POR FACULTAD (compartida puede
        // repetir) usando análogamente la clave normalizada dentro de ESA fac.
        perFacAcc[fac.name] = perFacAcc[fac.name] || {};
        var pm = perFacAcc[fac.name];
        var pg = pm[key];
        if (!pg) {
          pg = pm[key] = { key: key, esp: g.esp, anyRC: false, lineas: 0 };
        }
        pg.lineas++;
        if (rc) pg.anyRC = true;
      });
    });
  });

  var esp = Object.keys(mapa).map(function(k){ return mapa[k]; });
  var total = esp.length;
  var con = esp.filter(function(g){ return g.anyRC; }).length;
  var sin = total - con;
  var cobertura = total > 0 ? (Math.round(con / total * 1000) / 10) : 0;

  var perFac = [];
  Object.keys(perFacAcc).forEach(function(facName){
    var groups = Object.keys(perFacAcc[facName]).map(function(k){ return perFacAcc[facName][k]; });
    var fTotal = groups.length;
    var fCon = groups.filter(function(g){ return g.anyRC; }).length;
    perFac.push({ fac: facName, total: fTotal, con: fCon, sin: fTotal - fCon });
  });
  perFac.sort(function(a,b){ return (b.total - a.total) || (a.fac).localeCompare(b.fac); });

  return { total: total, con: con, sin: sin, cobertura: cobertura, perFac: perFac, esp: esp };
};

/**
 * Filas del detalle del indicador RC de ESPECIALIZACIONES a nivel de entidad.
 * Filtro: 'fac-con:<facultad>' | 'fac-sin:<facultad>' | 'fac-all:<facultad>'
 * (facultad opcional). Consolida UNA fila por especialización usando
 * _normalizeEspecializacion(), conservando las líneas/programas/ofertas/estados
 * como multivalores y los enlaces válidos como evidencia. `total` = nº de
 * especializaciones (entidades); `lineas` = nº total de registros p.lineas[]
 * asociados (información secundaria de detalle). Read-only; NO modifica window.DB.
 * @param {string} filter - clave de filtro
 * @returns {{rows:Array, total:number, lineas:number}}
 */
var _rcDetailRows = function(filter){
  var mapa = {};
  var kind = (filter || '').split(':')[0];
  var facMatch = (filter || '').split(':')[1] || '';
  AppData.getFacultades().forEach(function(fac){
    if (facMatch && fac.name !== facMatch) return;
    (fac.progs || []).forEach(function(p){
      (p.lineas || []).forEach(function(l){
        var rc = _rcHasLink(l.enlaceObtencion);
        var ok = false;
        if (kind === 'fac-con' && rc) ok = true;
        else if (kind === 'fac-sin' && !rc) ok = true;
        else if (kind === 'fac-all') ok = true;
        if (!ok) return;

        var esp = l.esp;
        var key = _normalizeEspecializacion(esp);
        var g = mapa[key];
        if (!g) {
          g = mapa[key] = {
            esp: (esp == null || String(esp).trim() === '') ? 'Sin especialización' : esp,
            facultades: [], programas: [], lineas: [], ofertas: [], estados: [],
            links: [], registros: 0
          };
        }
        g.registros++;
        _pushUniq(g.facultades, fac.name);
        _pushUniq(g.programas, (p.n != null && String(p.n).trim() !== '') ? p.n : (p.id != null ? p.id : ''));
        _pushUniq(g.lineas, l.l == null ? '' : String(l.l));
        _pushUniq(g.ofertas, l.o === 'V' ? 'Vigente' : 'Proyectada');
        _pushUniq(g.estados, l.e == null ? '' : String(l.e));
        if (rc && String(l.enlaceObtencion).trim() !== '') _pushUniq(g.links, String(l.enlaceObtencion).trim());
      });
    });
  });
  var rows = Object.keys(mapa).map(function(k){ return mapa[k]; });
  var lineas = 0;
  rows.forEach(function(r){ lineas += r.registros; });
  return { rows: rows, total: rows.length, lineas: lineas };
};

/**
 * Tipos de línea de profundización (campo `t` en p.lineas[]).
 * Se conservan las 4 categorías reales aunque Profundización 3 y "Sin línea"
 * tengan pocos registros: son datos reales, no deben agruparse como "Otros".
 */
var _PROF_TYPES = ['Profundización 1','Profundización 2','Profundización 3','Sin línea de profundización'];
// Colores claramente diferenciados para las 4 categorías (barras apiladas).
var _PROF_TYPE_COLORS = ['#107a6a','#2e8b57','#C8A43A','#77837b'];

/**
 * Fuente de datos para las visualizaciones de LÍNEAS DE PROFUNDIZACIÓN.
 * Analiza exclusivamente `p.lineas[]` y su campo `t`; NO usa enlaceObtencion,
 * l.o, p.mae[] ni fac.doc. Dinámico desde window.DB en cada llamada.
 * @returns {{
 *   total:number,                        // total de líneas p.lineas[]
 *   labels:Array<string>,                // nombres cortos de todas las facultades
 *   facTotals:Array<number>,             // líneas totales por facultad (orden = labels)
 *   facPct:Array<number>,                // % de participación (facTotals/total*100)
 *   byTypeRows:Array<Array<number>>,     // [facultad][tipo] conteo (4 tipos)
 *   typeSums:Array<number>,              // total por tipo (4)
 *   rank:Array<{n:string,t:number,p:number}>  // ranking desc por total (todas las facultades)
 *   facRc:Array<number>,                 // Registro Calificado por facultad (orden = labels)
 *   facProy:Array<number>,               // Proyectada (sin RC) por facultad (orden = labels)
 *   facRcPct:Array<number>,              // % RC sobre el total de líneas de la facultad
 *   facProyPct:Array<number>             // % Proyectada sobre el total de líneas de la facultad
 * }}
 */
var _profSeries = function(){
  var short = function(n){ return (n||'').replace('Facultad de ','').replace('Facultad ','').split(',')[0].trim(); };
  var labels=[], facNames=[], facTotals=[], byTypeRows=[], typeSums=[0,0,0,0];
  var total = 0;

  AppData.getFacultades().forEach(function(fac){
    var tStack = [0,0,0,0];
    (fac.progs||[]).forEach(function(p){
      (p.lineas||[]).forEach(function(l){
        var tv = (l && l.t || '').toString().trim();
        var idx = _PROF_TYPES.indexOf(tv);
        if(idx < 0) idx = 2; // valor atípico -> lo tratamos como Profundización 3 (categoría residual real)
        tStack[idx]++;
      });
    });
    var fTotal = tStack[0]+tStack[1]+tStack[2]+tStack[3];
    labels.push(short(fac.name));
    facNames.push(fac.name);
    facTotals.push(fTotal);
    byTypeRows.push(tStack.slice());
    for(var k=0;k<4;k++) typeSums[k]+=tStack[k];
    total += fTotal;
  });

  var facPct = labels.map(function(_,i){ return total>0 ? (facTotals[i]/total*100) : 0; });
  var rank = labels.map(function(n,i){ return { n:n, t:facTotals[i], p:facPct[i] }; })
    .sort(function(a,b){ return b.t - a.t || (a.n).localeCompare(b.n); });

  // Registro Calificado vs Proyectada por facultad (FASE 3.8): vista derivada que
  // delega en _rcCompute() (mismo criterio _rcHasLink) sin duplicar lógica. Por
  // construcción facRc[i]+facProy[i] === facTotals[i]; pcts suman 100% por facultad.
  var rcPerFac = _rcCompute().perFac;
  var rcMap = {};
  rcPerFac.forEach(function(f){ rcMap[f.fac.name] = f; });
  var facRc=[], facProy=[], facRcPct=[], facProyPct=[];
  facNames.forEach(function(nm){
    var fr = rcMap[nm] || { total: 0, conRC: 0, sinRC: 0 };
    facRc.push(fr.conRC);
    facProy.push(fr.sinRC);
    facRcPct.push(fr.total > 0 ? fr.conRC / fr.total * 100 : 0);
    facProyPct.push(fr.total > 0 ? fr.sinRC / fr.total * 100 : 0);
  });

  return {
    total: total, labels: labels, facTotals: facTotals, facPct: facPct,
    byTypeRows: byTypeRows, typeSums: typeSums, rank: rank,
    facRc: facRc, facProy: facProy, facRcPct: facRcPct, facProyPct: facProyPct
  };
};

// Paleta por Facultad para la dona (G3) y su ranking lateral (colores consistentes).
var _PROF_FAC_COLORS = ['#006633','#2e8b57','#3aaa72','#C8A43A','#378ADD','#D85A30','#993556','#534AB7'];

/**
 * Genera el HTML de la sección "Registro Calificado de Especializaciones":
 * KPIs (Con Registro Calificado 12 / Proyectada 32 / Cobertura 27,3%) + tabla
 * resumen por facultad a nivel de ENTIDAD (especializaciones consolidadas,
 * criterio anyRC vía _rcEspSeries). El total de especializaciones (44) no se
 * repite aquí: ya lo muestra el bloque "Especializaciones por Facultad".
 * La unidad es ESPECIALIZACIÓN, nunca líneas. La nomenclatura visual "Proyectada"
 * etiqueta la ausencia de RC, pero el VALOR sigue siendo total - con de
 * _rcEspSeries (criterio anyRC), nunca la oferta 'P'. La tabla Distribución
 * (FASE 3.9) y el bloque Líneas de Profundización son independientes.
 * @returns {string}
 */
var renderRCSeccion = function(){
  var rc = _rcEspSeries();
  var short = function(n){ return (n||'').replace('Facultad de ','').replace('Facultad ','').split(',')[0].trim(); };

  var h = '';
  h += '<div class="rc-container rc-rc-container">';
  h += '<div class="rc-title">Registro Calificado</div>';
  h += '<div class="rc-title-sub">Registro Calificado de Especializaciones por facultad</div>';

  // KPIs: Con Registro Calificado / Proyectada / Cobertura (exactamente 3 tarjetas).
  // El total de especializaciones (44) ya se muestra en el bloque
  // "Especializaciones por Facultad"; repetirlo aquí sería redundante.
  h += '<div class="rc-kpi-row">';
  var covStr = rc.cobertura.toFixed(1).replace('.', ',') + '%';
  var kpis = [
    { v: rc.con,     l: 'Con Registro Calificado',                cls: 'rc-kpi-con'   },
    { v: rc.sin,     l: 'Proyectada',                             cls: 'rc-kpi-proy'  },
    { v: covStr,     l: 'Cobertura',                              cls: 'rc-kpi-total' }
  ];
  kpis.forEach(function(k){
    h += '<div class="rc-kpi '+k.cls+'"><div class="rc-kpi-v">'+k.v+'</div><div class="rc-kpi-l">'+k.l+'</div></div>';
  });
  h += '</div>';

  // tabla resumen global (4 columnas): entidades de especialización
  h += '<div class="tbl-wrap"><table class="tbl rc-tbl-min rc-summary-tbl">';
  h += '<thead><tr>'
    + '<th>Especializaciones por Facultad</th>'
    + '<th>Total</th>'
    + '<th>Con Registro Calificado</th>'
    + '<th>Proyectada</th>'
    + '</tr></thead><tbody>';
  rc.perFac.forEach(function(f){
    h += '<tr>'
      + '<td class="rc-txt-green">'+esc(short(f.fac))+'</td>'
      + '<td class="rc-txt-dark rc-sum-click" role="button" tabindex="0" data-action="rc-show-detail" data-filter="fac-all:'+esc(f.fac)+'">'+f.total+'</td>'
      + '<td class="rc-txt-green rc-sum-click" role="button" tabindex="0" data-action="rc-show-detail" data-filter="fac-con:'+esc(f.fac)+'">'+f.con+'</td>'
      + '<td class="rc-txt-gold rc-sum-click" role="button" tabindex="0" data-action="rc-show-detail" data-filter="fac-sin:'+esc(f.fac)+'">'+f.sin+'</td>'
      + '</tr>';
  });
  h += '<tr class="rc-row-total">'
    + '<td>TOTAL</td>'
    + '<td>'+rc.total+'</td>'
    + '<td>'+rc.con+'</td>'
    + '<td>'+rc.sin+'</td>'
    + '</tr>';
  h += '</tbody></table></div>';

  // tarjetas por facultad (2 categorías clickeables)
  h += '<div class="rc-grid">';
  rc.perFac.forEach(function(f){
    h += '<div class="rc-card">'
      + '<div class="rc-card-head"><span class="rc-card-name">'+esc(short(f.fac))+'</span>'
      + '<span class="rc-card-total">Total <b>'+f.total+'</b></span></div>'
      + '<div class="rc-card-body">'
      + '<div role="button" tabindex="0" data-action="rc-show-detail" data-filter="fac-con:'+esc(f.fac)+'" class="rc-tile rc-tile-con"><span class="rc-tile-label"><span class="rc-dot"></span>Con Registro Calificado</span><span class="rc-tile-num">'+f.con+'</span></div>'
      + '<div role="button" tabindex="0" data-action="rc-show-detail" data-filter="fac-sin:'+esc(f.fac)+'" class="rc-tile rc-tile-sin"><span class="rc-tile-label"><span class="rc-dot"></span>Proyectada</span><span class="rc-tile-num">'+f.sin+'</span></div>'
      + '</div></div>';
  });
  h += '</div>';
  h += '</div>';
  return h;
};

/**
 * Genera el HTML del bloque independiente "Líneas de Profundización": las 3
 * visualizaciones Chart.js (barras total, barras por tipo, dona + ranking).
 * Está separado visualmente de Registro Calificado para evitar confusión con
 * las especializaciones (44). La lógica (_profSeries, _PROF_FAC_COLORS,
 * data-action prof-show-detail) no se modifica; la inicialización de las
 * gráficas se mantiene en renderProfCharts().
 * @returns {string}
 */
var renderProfSeccion = function(){
  var s = _profSeries();
  var short = function(n){ return (n||'').replace('Facultad de ','').replace('Facultad ','').split(',')[0].trim(); };

  var h = '';
  h += '<div class="rc-container prof-container">';
  h += '<div class="rc-title">Líneas de Profundización</div>';
  h += '<div class="rc-title-sub">'+s.total+' registros de líneas de profundización · clic para detalle por facultad</div>';
  h += '<div class="rc-charts">';
  h += '<div class="rc-chart-card">'
    + '<div class="rc-chart-head">Número de Líneas de profundización por Facultad</div>'
    + '<div class="rc-chart-sub">Participación sobre el total de líneas</div>'
    + '<div class="rc-chart-body rc-chart-body-tall"><canvas id="prof-chart-total" height="280"></canvas></div>'
    + '</div>';
  h += '<div class="rc-chart-card">'
    + '<div class="rc-chart-head">Distribución por Tipo de Línea</div>'
    + '<div class="rc-chart-sub">Profundización 1 · 2 · 3 y Sin línea, por Facultad</div>'
    + '<div class="rc-chart-body rc-chart-body-tall"><canvas id="prof-chart-type" height="280"></canvas></div>'
    + '</div>';
  h += '</div>';
  h += '</div>';
  return h;
};

/**
 * Inicializa las 2 visualizaciones Chart.js de LÍNEAS DE PROFUNDIZACIÓN.
 * DEBE ejecutarse DESPUÉS de asignar wrap.innerHTML=h (patrón snies.js):
 * las gráficas se crean con requestAnimationFrame, destruyendo primero toda
 * instancia previa (Chart.getChart(id)?.destroy()).
 * Usa _profSeries() → AppData.getFacultades() → window.DB en el momento (dinámico).
 * Si Chart.js no está disponible, no hace nada (no rompe el indicador).
 */
var renderProfCharts = function(){
  if(typeof Chart !== 'function' || typeof requestAnimationFrame !== 'function') return;
  var canvasIds = ['prof-chart-total','prof-chart-type'];
  var missing = canvasIds.some(function(id){ return !document.getElementById(id); });
  if(missing) return;

  var s = _profSeries();
  var short = function(n){ return (n||'').replace('Facultad de ','').replace('Facultad ','').split(',')[0].trim(); };

  requestAnimationFrame(function(){
    function destroy(id){
      var ex = Chart.getChart ? Chart.getChart(id) : null;
      if(ex) ex.destroy();
    }

    // Resuelve el nombre completo de facultad a partir del nombre corto y abre el modal.
    function openFac(shortName, tipo){
      if(!shortName) return;
      var full = shortName;
      AppData.getFacultades().forEach(function(f){
        if(short(f.name) === shortName) full = f.name;
      });
      var filter = 'fac|' + full;
      if(tipo) filter += '|tipo|' + tipo;
      renderIndicadorProfDetalle(filter);
    }

    // ── G1: Líneas de profundización por Facultad (barras HORIZONTALES desc por total,
    //        etiqueta = cantidad · % de participación sobre el total de líneas)
    var rank = s.labels.map(function(n,i){ return { n:n, t:s.facTotals[i], p:s.facPct[i] }; })
      .sort(function(a,b){ return b.t - a.t || (a.n).localeCompare(b.n); });
    var g1Labels = rank.map(function(r){ return r.n; });
    var g1Data = rank.map(function(r){ return r.t; });
    var g1Pct = rank.map(function(r){ return r.p; });

    destroy('prof-chart-total');
    new Chart(document.getElementById('prof-chart-total'), {
      type: 'bar',
      data: { labels: g1Labels, datasets:[
        { label:'Líneas', data:g1Data, backgroundColor:'#107a6a', borderRadius:6, maxBarThickness:22,
          datalabels:{ color:'#0a2f1e', anchor:'end', align:'end', font:{ weight:'700', size:11 },
            formatter:function(v, ctx){ var p=g1Pct[ctx.dataIndex]||0; return v>0 ? (v)+' · '+(p).toFixed(1)+'%' : ''; } } }
      ]},
      options: {
        indexAxis:'y',
        responsive:true, maintainAspectRatio:false,
        layout:{ padding:{ right: 8 } },
        onClick: function(evt, els){
          if(!els || !els.length) return;
          var lab = g1Labels[els[0].index];
          openFac(lab);
        },
        plugins:{
          legend:{ display:false },
          tooltip:{ callbacks:{ label:function(ctx){
            var p=g1Pct[ctx.dataIndex]||0;
            return 'Líneas: '+ctx.parsed.x+' ('+ (p).toFixed(1) +'% del total)';
          } } }
        },
        scales:{
          x:{ beginAtZero:true, precision:0, title:{ display:false }, grid:{ display:false } },
          y:{ grid:{ display:false }, ticks:{ font:{ size:10.5 }, autoSkip:false } }
        }
      }
    });

    // ── G2: Distribución por tipo y Facultad (barras HORIZONTALES APILADAS).
    //        4 categorías (P1, P2, P3, Sin línea) con colores diferenciados; total al final.
    var g2Labels = rank.map(function(r){ return r.n; });
    var datasets = _PROF_TYPES.map(function(tn, k){
      return {
        label: tn,
        data: g2Labels.map(function(nm){ var i = s.labels.indexOf(nm); return s.byTypeRows[i][k]; }),
        backgroundColor: _PROF_TYPE_COLORS[k],
        borderRadius: (k===0?6:0), maxBarThickness:22,
        datalabels: (k===s.byTypeRows[0].length-1) ? {
          color:'#0a2f1e', anchor:'end', align:'end', font:{ weight:'700', size:10.5 },
          formatter:function(v, ctx){ var i = s.labels.indexOf(g2Labels[ctx.dataIndex]); return (s.facTotals[i] || 0); }
        } : false
      };
    });

    destroy('prof-chart-type');
    new Chart(document.getElementById('prof-chart-type'), {
      type: 'bar',
      data: { labels: g2Labels, datasets: datasets },
      options: {
        indexAxis:'y',
        responsive:true, maintainAspectRatio:false,
        layout:{ padding:{ right: 10 } },
        onClick: function(evt, els){
          if(!els || !els.length) return;
          var lab = g2Labels[els[0].index];
          var tipo = _PROF_TYPES[els[0].datasetIndex];
          openFac(lab, tipo);
        },
        plugins:{
          legend:{ position:'bottom', labels:{ boxWidth:10, font:{ size:9.5 }, padding:8 } },
          datalabels:{ display:false },
          tooltip:{ callbacks:{ label:function(ctx){
            var v = ctx.parsed.x || 0;
            return ctx.dataset.label+': '+v+' línea(s)';
          } } }
        },
        scales:{
          x:{ stacked:true, beginAtZero:true, precision:0, title:{ display:false }, grid:{ display:false } },
          y:{ stacked:true, grid:{ display:false }, ticks:{ font:{ size:10.5 }, autoSkip:false } }
        }
      }
    });
  });
};

/**
 * HTML del badge de estado: Negado MEN con presentación roja diferenciada.
 */
var _rcEstadoHtml = function(estado){
  var escSt = esc(estado);
  var negado = String(estado).trim().toUpperCase() === 'NEGADO MEN';
  return '<span class="rc-estado' + (negado ? ' rc-estado-negado' : '') + '">' + escSt + '</span>';
};

/** HTML de una columna multivalor, con separación visual por línea. */
var _rcMultiHtml = function(arr){
  return arr.map(function(x){ return esc(x); }).join('<br>');
};

/** Separador del contador de modales (FASE 3.5: jerarquía visual de conteos). */
var _rcCountSep = '<span class="rc-count-sep">·</span>';

/**
 * Un bloque del contador de modales: número destacado + etiqueta menor.
 * Ej: 10 <small>Especializaciones</small>. Es presentación, no altera datos.
 * @param {string|number} num - número (enteros o porcentaje, p.ej. '28,8%')
 * @param {string} lbl - etiqueta en tamaño menor
 * @returns {string}
 */
var _rcStat = function(num, lbl){
  return '<span class="rc-count-stat"><b>'+num+'</b> <span class="rc-count-lbl">'+esc(lbl)+'</span></span>';
};

/**
 * Construye y muestra el modal de detalle de Registo Calificado según un filtro.
 * Filas consolidadas UNA por ESPECIALIZACIÓN (los multivalores —facultades,
 * programas, líneas, ofertas, estados, links— se listan dentro de la celda como
 * información secundaria). El contador destaca el nº de especializaciones y
 * muestra las líneas asociadas como dato de detalle, sin confundirlas con el
 * total de especializaciones. Recalcula el detalle desde window.DB (dinámico).
 * @param {string} filter - clave de filtro: fac-con:|fac-sin:|fac-all:
 */
var renderIndicadorRCDetalle = function(filter){
  var overlay = document.getElementById('rc-detail-overlay');
  if(overlay && overlay.parentNode) document.body.removeChild(overlay);

  var data = _rcDetailRows(filter);
  var list = data.rows;

  var title = 'Detalle de Registro Calificado de Especializaciones';
  var kindLabel = {
    'fac-con':'Con Registro Calificado', 'fac-sin':'Proyectada', 'fac-all':'Especializaciones de la facultad'
  }[filter && filter.split(':')[0]] || '';
  var sub = kindLabel ? (' — ' + kindLabel + (filter && filter.split(':')[1] ? ' — ' + filter.split(':')[1] : '')) : '';

  var rows = list.map(function(r, i){
    var links = r.links && r.links.length
      ? r.links.map(function(ln){ return '<a href="'+esc(ln)+'" target="_blank" rel="noopener noreferrer" class="rc-link">Ver link</a>'; }).join('<br>')
      : '<span class="rc-nolink">Proyectada</span>';
    var hasNegado = (r.estados||[]).some(function(s){ return String(s).trim().toUpperCase() === 'NEGADO MEN'; });
    return '<tr class="'+(hasNegado ? 'rc-row-negado' : '')+'">'
      + '<td class="rc-txt-green" style="white-space:nowrap">'+_rcMultiHtml(r.facultades)+'</td>'
      + '<td>'+_rcMultiHtml(r.programas)+'</td>'
      + '<td>'+_rcMultiHtml(r.lineas)+'</td>'
      + '<td>'+esc(r.esp)+'</td>'
      + '<td class="rc-th-c">'+_rcMultiHtml(r.ofertas)+'</td>'
      + '<td>'+r.estados.map(_rcEstadoHtml).join(' ')+'</td>'
      + '<td class="rc-th-c">'+links+'</td>'
      + '</tr>';
  }).join('');

  var note = '<div class="rc-note">Unidad: especializaciones consolidadas (44). Las líneas/registros asociados se muestran como detalle secundario; la ausencia de RC corresponde a especializaciones sin enlaceObtencion documentado.</div>';

  var html = '<div id="rc-detail-overlay" class="rc-overlay">'
    + '<div class="modal rc-modal">'
    + '<div class="modal-title"><span>🔍</span><span>'+esc(title)+'<span class="rc-modal-sub">'+esc(sub)+'</span></span>'
    + '<button data-action="rc-close-detail" class="rc-close" title="Cerrar">×</button></div>'
    + '<div class="rc-modal-body">'
    + '<div class="rc-count">'
    + _rcStat(list.length, 'especialización(es)') + _rcCountSep
    + _rcStat(data.lineas, 'línea(s) asociada(s)')
    + '</div>'
    + note
    + '<div class="tbl-wrap"><table class="tbl rc-detail-tbl">'
    + '<thead><tr>'
    + '<th>Facultad</th><th>Programa</th>'
    + '<th>Línea(s)</th><th>Especialización</th>'
    + '<th>Oferta</th><th>Estado</th>'
    + '<th>Evidencia RC</th></tr></thead><tbody>'
    + rows + '</tbody></table></div>'
    + '<div class="rc-modal-foot"><button data-action="rc-close-detail" class="rc-close-bottom">Cerrar</button></div>'
    + '</div></div></div>';

  var holder = document.createElement('div');
  holder.innerHTML = html;
  var node = holder.firstChild;
  document.body.appendChild(node);

  // Cierre por tecla ESC y clic sobre el backdrop (fondo), reutilizando el
  // mismo comportamiento de cierre existente y autolimpiándose al cerrar.
  var onKey = function(e){
    if(!node || !node.parentNode){ document.removeEventListener('keydown', onKey); return; }
    if(e.key === 'Escape' && node.parentNode) document.body.removeChild(node);
    if(!node.parentNode) document.removeEventListener('keydown', onKey);
  };
  var onBackdrop = function(e){
    if(e.target !== node) return;
    if(node.parentNode) document.body.removeChild(node);
  };
  if(document.addEventListener) document.addEventListener('keydown', onKey);
  if(node && node.addEventListener) node.addEventListener('click', onBackdrop);
};

/**
 * Clasifica una línea de profundización a su tipo canónico (igual semántica que
 * _profSeries: valores atípicos se mapean a Profundización 3).
 * @param {Object} l - línea de p.lineas[]
 * @returns {string} uno de _PROF_TYPES
 */
var _profTypeOf = function(l){
  var v = (l && l.t || '').toString().trim();
  var idx = _PROF_TYPES.indexOf(v);
  return _PROF_TYPES[idx < 0 ? 2 : idx];
};

/**
 * Helper de lectura de detalle del modal de LÍNEAS DE PROFUNDIZACIÓN.
 * Recorre SOLO p.lineas[] (sin p.mae[] ni fac.doc). Lee window.DB en vivo.
 * Aplica PRIMERO los filtros (facultad y tipo de línea) y DESPUÉS consolida
 * una fila visual por especialización (misma normalización que
 * getEspecializacionesAgrupadas). Conserva todos los valores; `total` SIEMPRE
 * es el nº de registros p.lineas[] filtrados (no el nº de filas consolidadas).
 * @param {string|null} facName - nombre completo de facultad (null/'' = todas)
 * @param {string|null} tipo - 'Profundización 1|2|3' | 'Sin línea de profundización' (null/'Todas' = todas)
 * @returns {{rows:Array, total:number}}
 */
var _profDetailRows = function(facName, tipo){
  var mapa = {}, total = 0;
  var wantFac = (facName !== null && typeof facName !== 'undefined') ? String(facName).trim() : '';
  var wantTipo = (tipo === null || typeof tipo === 'undefined' || tipo === 'Todas') ? '' : String(tipo).trim();
  AppData.getFacultades().forEach(function(fac){
    if(wantFac !== '' && fac.name !== wantFac) return;
    (fac.progs||[]).forEach(function(p){
      (p.lineas||[]).forEach(function(l){
        var t = _profTypeOf(l);
        if(wantTipo !== '' && wantTipo !== t) return;
        total++;
        var esp = l.esp;
        var key = _normalizeEspecializacion(esp);
        var g = mapa[key];
        if(!g){
          g = mapa[key] = {
            esp: (esp == null || String(esp).trim() === '') ? 'Sin especialización' : esp,
            facultades: [], programas: [], lineas: [], tipos: []
          };
        }
        _pushUniq(g.facultades, fac.name);
        _pushUniq(g.programas, (p.n != null && String(p.n).trim() !== '') ? p.n : (p.id != null ? p.id : ''));
        _pushUniq(g.lineas, l.l == null ? '' : String(l.l));
        _pushUniq(g.tipos, t);
      });
    });
  });
  return { rows: Object.keys(mapa).map(function(k){ return mapa[k]; }), total: total };
};

// Facultad activa del modal (para re-filtrar por tipo con profSetTipo).
var _profModalFac = '';

/**
 * Construye y muestra el modal de detalle de LÍNEAS DE PROFUNDIZACIÓN.
 * El filtro usa el formato "fac|<facultad>|tipo|<tipo>" (ambas opcionales),
 * se lee window.DB en el momento (dinámico). Solo p.lineas[]; sin RC.
 * @param {string} filter - clave de filtro, p.ej. "fac|Facultad de Ingeniería" o "fac|X|tipo|Profundización 1"
 */
var renderIndicadorProfDetalle = function(filter){
  var overlay = document.getElementById('prof-detail-overlay');
  if(overlay && overlay.parentNode) document.body.removeChild(overlay);

  var opts = { fac:'', tipo:'' };
  var parts = (filter||'').split('|');
  for(var i=0;i+1<parts.length;i+=2){
    var k = parts[i].trim(), v = parts[i+1].trim();
    if(k === 'fac') opts.fac = v;
    else if(k === 'tipo') opts.tipo = v;
  }
  _profModalFac = opts.fac;

  var grandTotal = _profSeries().total;
  var data = _profDetailRows(_profModalFac, opts.tipo);
  var pct = grandTotal > 0 ? (data.total / grandTotal * 100) : 0;

  var subTxt = _profModalFac ? _profModalFac : 'Todas las facultades';
  if(opts.tipo && opts.tipo !== 'Todas') subTxt += ' · ' + opts.tipo;

  function chipsHtml(active){
    return ['Todas'].concat(_PROF_TYPES).map(function(t){
      var act = (active || 'Todas') === t;
      return '<button type="button" role="button" data-action="prof-filter-type" data-tipo="'+esc(t)+'" class="rc-filter-chip'+(act?' on':'')+'">'+esc(t)+'</button>';
    }).join('');
  }
  function rowsHtml(list){
    return list.map(function(r){
      return '<tr>'
        + '<td class="rc-txt-green">'+_rcMultiHtml(r.facultades)+'</td>'
        + '<td>'+_rcMultiHtml(r.programas)+'</td>'
        + '<td>'+esc(r.esp)+'</td>'
        + '<td>'+_rcMultiHtml(r.lineas)+'</td>'
        + '<td class="rc-th-c">'+_rcMultiHtml(r.tipos)+'</td>'
        + '</tr>';
    }).join('');
  }

  var html = '<div id="prof-detail-overlay" class="rc-overlay">'
    + '<div class="modal rc-modal">'
    + '<div class="modal-title"><span>🔍</span><span>Detalle de Líneas de Profundización<span class="rc-modal-sub"> — '+esc(subTxt)+'</span></span>'
    + '<button data-action="prof-close-detail" class="rc-close" title="Cerrar">×</button></div>'
    + '<div class="rc-modal-body">'
    + '<div class="rc-count">'
    + _rcStat(data.rows.length, 'Especializaciones') + _rcCountSep
    + _rcStat(data.total, 'Líneas') + _rcCountSep
    + _rcStat(pct.toFixed(1)+'%', 'del total de líneas')
    + '</div>'
    + '<div class="rc-filter-row">'+chipsHtml(opts.tipo||'Todas')+'</div>'
    + '<div class="tbl-wrap"><table class="tbl rc-detail-tbl">'
    + '<thead><tr>'
    + '<th>Facultad</th><th>Programa de pregrado</th>'
    + '<th>Especialización</th><th>Línea de profundización</th>'
    + '<th>Tipo de línea</th></tr></thead><tbody>'
    + rowsHtml(data.rows) + '</tbody></table></div>'
    + '<div class="rc-modal-foot"><button data-action="prof-close-detail" class="rc-close-bottom">Cerrar</button></div>'
    + '</div></div></div>';

  var holder = document.createElement('div');
  holder.innerHTML = html;
  var node = holder.firstChild;
  document.body.appendChild(node);

  var onKey = function(e){
    if(!node || !node.parentNode){ document.removeEventListener('keydown', onKey); return; }
    if(e.key === 'Escape' && node.parentNode) document.body.removeChild(node);
    if(!node.parentNode) document.removeEventListener('keydown', onKey);
  };
  var onBackdrop = function(e){
    if(e.target !== node) return;
    if(node.parentNode) document.body.removeChild(node);
  };
  if(document.addEventListener) document.addEventListener('keydown', onKey);
  if(node && node.addEventListener) node.addEventListener('click', onBackdrop);
};

/**
 * Re-filtra el modal de LÍNEAS DE PROFUNDIZACIÓN ya abierto por tipo,
 * consultando window.DB en el momento (dinámico). Actualiza el contador,
 * la tabla y el estado activo de los chips.
 * @param {string} tipo - 'Todas' | Profundización 1|2|3 | Sin línea de profundización
 */
var profSetTipo = function(tipo){
  var overlay = document.getElementById('prof-detail-overlay');
  if(!overlay) return;
  var grandTotal = _profSeries().total;
  var data = _profDetailRows(_profModalFac, tipo);
  var pct = grandTotal > 0 ? (data.total / grandTotal * 100) : 0;
  var count = overlay.querySelector('.rc-count');
  if(count) count.innerHTML = _rcStat(data.rows.length, 'Especializaciones') + _rcCountSep
    + _rcStat(data.total, 'Líneas') + _rcCountSep
    + _rcStat(pct.toFixed(1)+'%', 'del total de líneas');
  var tbody = overlay.querySelector('.rc-detail-tbl tbody');
  if(tbody){
    tbody.innerHTML = data.rows.map(function(r){
      return '<tr>'
        + '<td class="rc-txt-green">'+_rcMultiHtml(r.facultades)+'</td>'
        + '<td>'+_rcMultiHtml(r.programas)+'</td>'
        + '<td>'+esc(r.esp)+'</td>'
        + '<td>'+_rcMultiHtml(r.lineas)+'</td>'
        + '<td class="rc-th-c">'+_rcMultiHtml(r.tipos)+'</td>'
        + '</tr>';
    }).join('');
  }
  var active = (tipo || 'Todas');
  var chips = overlay.querySelectorAll('.rc-filter-chip');
  if(chips && chips.forEach) chips.forEach(function(c){ c.classList.toggle('on', c.getAttribute('data-tipo') === active); });
};

// ===== MAESTRÍAS POR FACULTAD — Orientación de la Maestría =====
// Concepto (auditoría): las maestrías (p.mae[]) NO tienen líneas de investigación
// ni de profundización. Solo existe el campo `tipo` con la orientación
// "Investigación" | "Profundización" | "" (sin definir). Esta sección trabaja
// exclusivamente con p.mae[]; NO usa p.lineas[], especializaciones, doctorados
// ni Registro Calificado como criterio. Todo se relee de window.DB en vivo.

var _MAE_TYPES = ['Investigación','Profundización','Sin definir'];

/**
 * Clasifica la orientación de una maestría (campo `tipo` de p.mae[]).
 * undefined, null, "" y cualquier valor atípico -> 'Sin definir'.
 * No modifica los datos originales.
 * @param {Object} m - maestría de p.mae[]
 * @returns {string} 'Investigación' | 'Profundización' | 'Sin definir'
 */
var _maeType = function(m){
  var v = (m && m.tipo !== undefined && m.tipo !== null) ? String(m.tipo).trim() : '';
  return _MAE_TYPES.indexOf(v) >= 0 ? v : 'Sin definir';
};

/**
 * Agregación dinámica de maestrías desde window.DB → p.mae[].
 * @returns {{
 *   total:number, perFac:Array<{fac,total,I,P,S}>,
 *   inv:number, prof:number, sin:number,
 *   pctInv:number, pctProf:number, pctSin:number
 * }}
 */
// Paleta propia por Facultad para la dona de maestrías y su ranking lateral.
// (No reutiliza _PROF_FAC_COLORS: paleta independiente del indicador de líneas.)
var _MAE_FAC_COLORS = ['#007A5E','#1F6FB2','#B87333','#6B3FA0','#C0392B','#2E86DE','#D68910','#7D8B64'];

var _maeSeries = function(){
  var total=0, inv=0, prof=0, sin=0, perFac=[];
  AppData.getFacultades().forEach(function(fac){
    var r={ fac:fac.name, total:0, I:0, P:0, S:0 };
    (fac.progs||[]).forEach(function(p){
      (p.mae||[]).forEach(function(m){
        var t=_maeType(m);
        r.total++; total++;
        if(t==='Investigación'){ r.I++; inv++; }
        else if(t==='Profundización'){ r.P++; prof++; }
        else { r.S++; sin++; }
      });
    });
    perFac.push(r);
  });
  var pct=function(n){ return total>0 ? (n/total*100) : 0; };
  return { total:total, perFac:perFac, inv:inv, prof:prof, sin:sin,
    pctInv:pct(inv), pctProf:pct(prof), pctSin:pct(sin) };
};

/**
 * Lista de maestrías filtradas (facultad y/o orientación). Lee window.DB en vivo.
 * @param {string|null} facName - nombre completo de facultad (null/'' = todas)
 * @param {string|null} tipo - 'Investigación'|'Profundización'|'Sin definir' (null/'Todas' = todas)
 * @returns {{rows:Array, total:number}}
 */
var _maeDetailRows = function(facName, tipo){
  var rows=[], total=0;
  var wantFac = (facName!==null && typeof facName!=='undefined') ? String(facName).trim() : '';
  var wantTipo = (tipo===null || typeof tipo==='undefined' || tipo==='Todas') ? '' : String(tipo).trim();
  AppData.getFacultades().forEach(function(fac){
    if(wantFac!=='' && fac.name!==wantFac) return;
    (fac.progs||[]).forEach(function(p){
      (p.mae||[]).forEach(function(m){
        var t=_maeType(m);
        if(wantTipo!=='' && t!==wantTipo) return;
        total++;
        rows.push({
          fac: fac.name, prog: p.n||'', nombre: m.n||'', tipo: t,
          oferta: (m.o==='V' ? 'Vigente' : 'Proyectada'),
          estado: m.e||'', sedes: (m.sedes||[]).join(', ')
        });
      });
    });
  });
  return { rows:rows, total:total };
};

// Facultad activa del modal de maestrías (para re-filtrar por orientación).
var _maeModalFac = '';

// Datos calculados de la dona de maestrías (labels/valores/pct por facultad).
// Se rellena en renderMaeSeccion() y se consume en renderMaeDonaCharts().
var _maeDonaData = [];

// HTML de filas del modal de maestrías (reutilizado por render y por el re-filtro).
var _maeRowsHtml = function(list){
  return list.map(function(r){
    return '<tr>'
      + '<td class="rc-txt-green">'+esc(r.fac)+'</td>'
      + '<td>'+esc(r.prog)+'</td>'
      + '<td>'+esc(r.nombre)+'</td>'
      + '<td class="rc-th-c">'+esc(r.tipo)+'</td>'
      + '<td class="rc-th-c">'+esc(r.oferta)+'</td>'
      + '<td>'+esc(r.estado)+'</td>'
      + '<td>'+esc(r.sedes)+'</td>'
      + '</tr>';
  }).join('');
};

/**
 * Genera el HTML de la sección "Maestrías por Facultad":
 * KPIs globales + tabla por facultad interactiva (fila TOTAL no interactiva).
 * @returns {string}
 */
var renderMaeSeccion = function(){
  var s = _maeSeries();
  var short = function(n){ return (n||'').replace('Facultad de ','').replace('Facultad ','').split(',')[0].trim(); };

  var h = '';
  h += '<div class="rc-container mae-container">';
  h += '<div class="rc-title">Maestrías por Facultad</div>';
  h += '<div class="rc-title-sub">Orientación de la Maestría: Investigación · Profundización · Sin definir</div>';

  // KPIs globales
  h += '<div class="rc-kpi-row">';
  var kpis = [
    { v: s.total, l: 'Total maestrías',  cls: 'rc-kpi-total' },
    { v: s.inv,   l: 'Investigación',    cls: 'mae-kpi-inv'  },
    { v: s.prof,  l: 'Profundización',   cls: 'mae-kpi-prof' },
    { v: s.sin,   l: 'Sin definir',      cls: 'mae-kpi-sin'  }
  ];
  kpis.forEach(function(k){
    h += '<div class="rc-kpi '+k.cls+'"><div class="rc-kpi-v">'+k.v+'</div><div class="rc-kpi-l">'+k.l+'</div></div>';
  });
  h += '</div>';

  // Tabla por facultad interactiva
  h += '<div class="tbl-wrap"><table class="tbl rc-tbl-min rc-summary-tbl mae-summary-tbl">';
  h += '<thead><tr>'
    + '<th>Facultad</th>'
    + '<th class="rc-th-c">Total</th>'
    + '<th class="rc-th-c">Investigación</th>'
    + '<th class="rc-th-c">Profundización</th>'
    + '<th class="rc-th-c">Sin definir</th>'
    + '</tr></thead><tbody>';
  s.perFac.forEach(function(r){
    var fFull = esc(r.fac);
    h += '<tr>'
      + '<td class="rc-txt-green mae-click" role="button" tabindex="0" data-action="mae-show-detail" data-filter="fac|'+fFull+'">'+esc(short(r.fac))+'</td>'
      + '<td class="rc-th-c rc-txt-dark mae-click" role="button" tabindex="0" data-action="mae-show-detail" data-filter="fac|'+fFull+'">'+r.total+'</td>'
      + '<td class="rc-th-c mae-click mae-cell-inv" role="button" tabindex="0" data-action="mae-show-detail" data-filter="fac|'+fFull+'|tipo|Investigación">'+r.I+'</td>'
      + '<td class="rc-th-c mae-click mae-cell-prof" role="button" tabindex="0" data-action="mae-show-detail" data-filter="fac|'+fFull+'|tipo|Profundización">'+r.P+'</td>'
      + '<td class="rc-th-c mae-click mae-cell-sin" role="button" tabindex="0" data-action="mae-show-detail" data-filter="fac|'+fFull+'|tipo|Sin definir">'+r.S+'</td>'
      + '</tr>';
  });
  // Fila TOTAL (resumen no interactivo)
  h += '<tr class="rc-row-total">'
    + '<td>TOTAL</td>'
    + '<td class="rc-th-c">'+s.total+'</td>'
    + '<td class="rc-th-c">'+s.inv+'</td>'
    + '<td class="rc-th-c">'+s.prof+'</td>'
    + '<td class="rc-th-c">'+s.sin+'</td>'
    + '</tr>';
  h += '</tbody></table></div>';

  // ===== Dona: Distribución de Maestrías por Facultad =====
  // Datos calculados (no hardcodeados) desde window.DB vía _maeSeries().
  // Se excluyen facultades con 0 maestrías. Composición coherente con el
  // bloque de Especializaciones: dona a la izquierda y a la derecha el
  // ranking (distribución/porcentajes) + el gráfico RC 100% apilado
  // (renderMaeRcChart), reutilizando el criterio _maeRcSeries().
  var sD = _maeSeries();
  var facFullMap = {};
  AppData.getFacultades().forEach(function(f){ facFullMap[short(f.name)] = f.name; });
  var dona = sD.perFac
    .filter(function(r){ return r.total > 0; })
    .map(function(r){
      return {
        fac: r.fac,
        total: r.total,
        pct: sD.total > 0 ? (r.total / sD.total * 100) : 0
      };
    })
    .sort(function(a,b){ return b.total - a.total || (a.fac).localeCompare(b.fac); });
  _maeDonaData = dona;

  var rankHtml = dona.map(function(f){
    var dotCol = _MAE_FAC_COLORS[dona.indexOf(f) % _MAE_FAC_COLORS.length];
    var full = facFullMap[short(f.fac)] || f.fac;
    return '<div class="rc-rank-row" role="button" tabindex="0" data-action="mae-show-detail" data-filter="fac|'+esc(full)+'">'
      + '<span class="rc-rank-dot" style="background:'+dotCol+'"></span>'
      + '<span class="rc-rank-name">'+esc(short(f.fac))+'</span>'
      + '<span class="rc-rank-num">'+f.total+'</span>'
      + '<span class="rc-rank-pct">'+f.pct.toFixed(1)+'%</span>'
      + '</div>';
  }).join('');

  h += '<div class="rc-title-sub rc-chart-section-sub">Visualización — Distribución de Maestrías por Facultad</div>';
  h += '<div class="rc-charts">';
  h += '<div class="rc-chart-card rc-chart-card-dona">'
    + '<div class="rc-chart-head">Distribución de Maestrías por Facultad</div>'
    + '<div class="rc-chart-sub">Participación sobre el total de maestrías · Registro Calificado por facultad</div>'
    + '<div class="rc-chart-body rc-chart-body-dona">'
    + '<div class="rc-dona-col">'
    + '<div class="rc-doughnut-center"><div class="rc-doughnut-center-v" id="mae-dona-total"></div><div class="rc-doughnut-center-l" id="mae-dona-label">Maestrías</div></div>'
    + '<canvas id="mae-chart-dona" height="200"></canvas>'
    + '</div>'
    + '<div class="rc-rank-col mae-rank-split">'
    + '<div class="rc-rank-side"><div class="rc-rank-head"><span>Facultad</span><span>Cant.</span><span>Part.</span></div>'
    + rankHtml
    + '</div>'
    + '<div class="rc-mae-rc"><div class="rc-inner-chart-head">Registro Calificado de Maestrías por Facultad</div><canvas id="mae-chart-rc"></canvas></div>'
    + '</div>'
    + '</div>'
    + '</div>';
  h += '</div>';

  // ===== SUB-BLOQUE: REGISTRO CALIFICADO DE MAESTRÍAS =====
  // Indicador específico de maestrías a NBEY (20): Con Registro Calificado vs
  // Proyectada (etiqueta visual del registro sin enlaceObtencion documentado),
  // POR REGISTRO p.mae[] (no se deduplica; los 20 registros se mantienen).
  // Criterio único _rcHasLink(m.enlaceObtencion): NO inferir RC desde e ni o.
  // Independiente del bloque de orientación I/P/S.
  h += renderMaeRcSeccion();

  h += '</div>';
  return h;
};

/**
 * Inicializa la dona Chart.js "Distribución de Maestrías por Facultad".
 * DEBE ejecutarse DESPUÉS de asignar wrap.innerHTML=h (patrón renderProfCharts):
 * se crea con requestAnimationFrame, destruyendo primero la instancia previa.
 * Usa _maeDonaData (calculado en renderMaeSeccion desde window.DB vía _maeSeries()).
 * Los datos provienen SIEMPRE de window.DB (dinámicos). Solo p.mae[].
 * Si Chart.js no está disponible, no hace nada (no rompe el indicador).
 */
var renderMaeDonaCharts = function(){
  if(typeof Chart !== 'function' || typeof requestAnimationFrame !== 'function') return;
  var id = 'mae-chart-dona';
  if(!document.getElementById(id)) return;
  var s = _maeSeries();
  var dona = _maeDonaData;

  requestAnimationFrame(function(){
    var ex = Chart.getChart ? Chart.getChart(id) : null;
    if(ex) ex.destroy();

    var donaTotalEl = document.getElementById('mae-dona-total');
    if(donaTotalEl) donaTotalEl.textContent = String(s.total);

    function openFac(full){
      if(!full) return;
      renderIndicadorMaeDetalle('fac|' + full);
    }

    new Chart(document.getElementById(id), {
      type: 'doughnut',
      data: {
        labels: dona.map(function(f){ return f.fac; }),
        datasets:[{
          data: dona.map(function(f){ return f.total; }),
          backgroundColor: dona.map(function(f, i){ return _MAE_FAC_COLORS[i % _MAE_FAC_COLORS.length]; }),
          borderColor:'#fff', borderWidth:3, hoverOffset:6
        }]
      },
      options: {
        responsive:true, maintainAspectRatio:false, cutout:'72%',
        layout:{ padding:{ top:6, bottom:6, left:4, right:4 } },
        onClick: function(evt, els){
          if(!els || !els.length) return;
          var f = dona[els[0].index];
          if(f) openFac(f.fac);
        },
        plugins:{
          legend:{ display:false },
          tooltip:{ callbacks:{ label:function(ctx){
            return ctx.label+': '+ctx.parsed+' maestría(s) (' + ((dona[ctx.dataIndex]||{}).pct||0).toFixed(1) + '% del total)';
          } } },
          datalabels:{ color:'#fff', font:{ weight:'900', size:11.5 }, textAlign:'center',
            formatter:function(v, ctx){
              if(v <= 0) return '';
              var p = (dona[ctx.dataIndex]||{}).pct||0;
              return (p >= 6) ? (p).toFixed(0)+'%' : '';
            } }
        }
      }
    });
  });
};

/**
 * Inicializa el gráfico de barras horizontales 100% apiladas
 * "Registro Calificado de Maestrías por Facultad", dentro de la MISMA tarjeta
 * de Distribución de Maestrías (columna derecha, junto al ranking compacto).
 * Mismo lenguaje visual que renderEsfRcChart. Usa EXCLUSIVAMENTE
 * _maeRcSeries() (criterio _rcHasLink por registro p.mae[], sin cálculos
 * paralelos). DEBE ejecutarse DESPUÉS de asignar wrap.innerHTML=h.
 * Cada segmento es clicable: "Con Registro Calificado" (verde, dataset 0) abre
 * renderIndicadorMaeRcDetalle('fac|<facultad>|rc|con') y "Proyectada" (dorado,
 * dataset 1) abre ...|rc|sin — reutilizando el modal/parser/_maeRcDetailRows
 * existentes. Read-only sobre window.DB.
 * Si Chart.js no está disponible, no hace nada (no rompe el indicador).
 */
var renderMaeRcChart = function(){
  if (typeof Chart !== 'function' || typeof requestAnimationFrame !== 'function') return;
  var id = 'mae-chart-rc';
  if (!document.getElementById(id)) return;

  var short = function(n){ return (String(n || '')).replace('Facultad de ','').replace('Facultad ','').split(',')[0].trim(); };
  var s = _maeRcSeries();

  // Orden: mismo ranking de la dona (total desc, nombre asc). Se omiten
  // facultades sin maestrías (total 0). total = con + sin (invariante).
  var rows = s.perFac
    .filter(function(r){ return r.total > 0; })
    .map(function(r){
      return {
        short: short(r.fac),
        full: r.fac,
        total: r.total, con: r.con, sin: r.sin,
        conPct: r.total > 0 ? r.con / r.total * 100 : 0,
        sinPct: r.total > 0 ? r.sin / r.total * 100 : 0
      };
    })
    .sort(function(a,b){ return (b.total - a.total) || (a.full).localeCompare(b.full); });

  requestAnimationFrame(function(){
    var ex = Chart.getChart ? Chart.getChart(id) : null;
    if (ex) ex.destroy();

    function openFacRc(full, ds){
      if (!full) return;
      renderIndicadorMaeRcDetalle(ds === 1 ? 'fac|' + full + '|rc|sin' : 'fac|' + full + '|rc|con');
    }
    function pctTxt(v){ return v.toFixed(1).replace('.', ',') + '%'; }

    new Chart(document.getElementById(id), {
      type: 'bar',
      data: {
        labels: rows.map(function(r){ return r.short; }),
        datasets:[
          { label:'Con Registro Calificado', data: rows.map(function(r){ return r.conPct; }), backgroundColor:'#107a6a',
            datalabels:{ color:'#ffffff', anchor:'center', align:'center', font:{ weight:'700', size:10.5 },
              formatter:function(v, ctx){ return v >= 15 ? (rows[ctx.dataIndex].con) + ' · ' + pctTxt(v) : ''; } } },
          { label:'Proyectada', data: rows.map(function(r){ return r.sinPct; }), backgroundColor:'#C8A43A',
            datalabels:{ color:'#5c4a00', anchor:'center', align:'center', font:{ weight:'700', size:10.5 },
              formatter:function(v, ctx){ return v >= 15 ? (rows[ctx.dataIndex].sin) + ' · ' + pctTxt(v) : ''; } } }
        ]
      },
      options: {
        indexAxis:'y',
        responsive:true, maintainAspectRatio:false,
        layout:{ padding:{ right: 8 } },
        onClick: function(evt, els){
          if (!els || !els.length) return;
          var r = rows[els[0].index];
          if (!r) return;
          var ds = els[0].datasetIndex;
          if (ds === 0 || ds === 1) openFacRc(r.full, ds);
        },
        plugins:{
          legend:{ position:'bottom', labels:{ boxWidth:10, font:{ size:9.5 }, padding:8 } },
          datalabels:{ display:false },
          tooltip:{ callbacks:{
            title: function(items){ return (items && items.length) ? rows[items[0].dataIndex].full : ''; },
            label: function(ctx){
              var r = rows[ctx.dataIndex] || {};
              var n = ctx.dataset.label.indexOf('Con Registro Calificado') === 0 ? r.con : r.sin;
              return ctx.dataset.label + ': ' + n + ' maestría(s) (' + pctTxt(ctx.parsed.x || 0) + ')';
            }
          } }
        },
        scales:{
          x:{ stacked:true, beginAtZero:true, max:100, precision:0, title:{ display:false }, grid:{ display:false },
            ticks:{ stepSize:20, callback:function(v){ return v + '%'; } } },
          y:{ stacked:true, grid:{ display:false }, ticks:{ font:{ size:10 }, autoSkip:false } }
        }
      }
    });
  });
};

/**
 * Construye y muestra el modal de detalle de MAESTRÍAS POR FACULTAD.
 * Filtro con formato "fac|<facultad>|tipo|<orientación>" (ambas opcionales).
 * Lee window.DB en el momento (dinámico). Solo p.mae[].
 * @param {string} filter - clave de filtro, p.ej. "fac|Facultad de Ingeniería" o "fac|X|tipo|Investigación"
 */
var renderIndicadorMaeDetalle = function(filter){
  var overlay = document.getElementById('mae-detail-overlay');
  if(overlay && overlay.parentNode) document.body.removeChild(overlay);

  var opts = { fac:'', tipo:'' };
  var parts = (filter||'').split('|');
  for(var i=0;i+1<parts.length;i+=2){
    var k = parts[i].trim(), v = parts[i+1].trim();
    if(k === 'fac') opts.fac = v;
    else if(k === 'tipo') opts.tipo = v;
  }
  _maeModalFac = opts.fac;

  var data = _maeDetailRows(_maeModalFac, opts.tipo);

  var subTxt = _maeModalFac ? _maeModalFac : 'Todas las facultades';
  if(opts.tipo && opts.tipo !== 'Todas') subTxt += ' · ' + opts.tipo;

  function chipsHtml(active){
    return ['Todas'].concat(_MAE_TYPES).map(function(t){
      var act = (active || 'Todas') === t;
      return '<button type="button" role="button" data-action="mae-filter-type" data-tipo="'+esc(t)+'" class="rc-filter-chip'+(act?' on':'')+'">'+esc(t)+'</button>';
    }).join('');
  }

  var html = '<div id="mae-detail-overlay" class="rc-overlay">'
    + '<div class="modal rc-modal">'
    + '<div class="modal-title"><span>🔍</span><span>Maestrías por Facultad<span class="rc-modal-sub">'+esc(subTxt)+'</span></span>'
    + '<button data-action="mae-close-detail" class="rc-close" title="Cerrar">×</button></div>'
    + '<div class="rc-modal-body">'
    + '<div class="rc-count"><b>'+data.total+'</b> maestría(s) · Orientación de la Maestría</div>'
    + '<div class="rc-filter-row">'+chipsHtml(opts.tipo||'Todas')+'</div>'
    + '<div class="tbl-wrap"><table class="tbl rc-detail-tbl">'
    + '<thead><tr>'
    + '<th>Facultad</th><th>Programa de pregrado</th>'
    + '<th>Nombre de la maestría</th><th>Orientación</th>'
    + '<th>Oferta</th><th>Estado</th><th>Sede(s)</th>'
    + '</tr></thead><tbody>'
    + _maeRowsHtml(data.rows) + '</tbody></table></div>'
    + '<div class="rc-modal-foot"><button data-action="mae-close-detail" class="rc-close-bottom">Cerrar</button></div>'
    + '</div></div></div>';

  var holder = document.createElement('div');
  holder.innerHTML = html;
  var node = holder.firstChild;
  document.body.appendChild(node);

  var onKey = function(e){
    if(!node || !node.parentNode){ document.removeEventListener('keydown', onKey); return; }
    if(e.key === 'Escape' && node.parentNode) document.body.removeChild(node);
    if(!node.parentNode) document.removeEventListener('keydown', onKey);
  };
  var onBackdrop = function(e){
    if(e.target !== node) return;
    if(node.parentNode) document.body.removeChild(node);
  };
  if(document.addEventListener) document.addEventListener('keydown', onKey);
  if(node && node.addEventListener) node.addEventListener('click', onBackdrop);
};

/**
 * Re-filtra el modal de MAESTRÍAS ya abierto por orientación, consultando
 * window.DB en el momento (dinámico). Actualiza contador, subtítulo y tabla.
 * @param {string} tipo - 'Todas' | 'Investigación' | 'Profundización' | 'Sin definir'
 */
var maeSetTipo = function(tipo){
  var overlay = document.getElementById('mae-detail-overlay');
  if(!overlay) return;
  var data = _maeDetailRows(_maeModalFac, tipo);
  var count = overlay.querySelector('.rc-count');
  if(count) count.innerHTML = '<b>'+data.total+'</b> maestría(s) · Orientación de la Maestría';
  var sub = overlay.querySelector('.rc-modal-sub');
  if(sub) sub.textContent = (_maeModalFac ? _maeModalFac : 'Todas las facultades') + ((tipo && tipo !== 'Todas') ? ' · ' + tipo : '');
  var tbody = overlay.querySelector('.rc-detail-tbl tbody');
  if(tbody) tbody.innerHTML = _maeRowsHtml(data.rows);
  var active = (tipo || 'Todas');
  var chips = overlay.querySelectorAll('.rc-filter-chip');
  if(chips && chips.forEach) chips.forEach(function(c){ c.classList.toggle('on', c.getAttribute('data-tipo') === active); });
};

/**
 * CAPA DE LECTURA/AGRUPACIÓN del indicador "Registro Calificado de Maestrías".
 * Recorre f.progs[].mae[] en vivo (AppData.getFacultades() == window.DB), POR
 * REGISTRO (mantiene los 20 registros; NO deduplica). Criterio único:
 * _rcHasLink(m.enlaceObtencion) — RC documentado = enlace no vacío.
 * Independiente de e (estado) y de o (orientación). NO modifica window.DB.
 * @returns {{ total:number, con:number, sin:number,
 *   perFac:Array<{fac,total,con,sin}> }}
 */
var _maeRcSeries = function(){
  var total = 0, con = 0, sin = 0, perFac = [];
  AppData.getFacultades().forEach(function(fac){
    var r = { fac: fac.name, total: 0, con: 0, sin: 0 };
    (fac.progs || []).forEach(function(p){
      (p.mae || []).forEach(function(m){
        var rc = _rcHasLink(m.enlaceObtencion);
        r.total++; total++;
        if (rc) { r.con++; con++; } else { r.sin++; sin++; }
      });
    });
    perFac.push(r);
  });
  return { total: total, con: con, sin: sin, perFac: perFac };
};

/**
 * Filas del detalle del indicador RC de maestrías, por registro p.mae[].
 * Filtra por facultad (nombre completo) y por tipo RC ('con' | 'sin' | '').
 * NO incluye especializaciones, doctorados ni líneas. Cada fila trae además
 * la evidencia (enlace) y metadatos de orientación/oferta/estado/sedes.
 * @param {string} facName - '' = todas las facultades
 * @param {string} kind    - '' | 'con' | 'sin'
 * @returns {{ rows:Array, total:number }}
 */
var _maeRcDetailRows = function(facName, kind){
  var rows = [], total = 0;
  var wantFac = (facName != null) ? String(facName).trim() : '';
  var want = (kind === 'con' || kind === 'sin') ? kind : '';
  AppData.getFacultades().forEach(function(fac){
    if (wantFac !== '' && fac.name !== wantFac) return;
    (fac.progs || []).forEach(function(p){
      (p.mae || []).forEach(function(m){
        var rc = _rcHasLink(m.enlaceObtencion);
        var k = rc ? 'con' : 'sin';
        if (want !== '' && k !== want) return;
        total++;
        rows.push({
          fac: fac.name,
          prog: p.n || '',
          nombre: m.n || '',
          rc: rc,
          enlace: (rc && m.enlaceObtencion != null && String(m.enlaceObtencion).trim() !== '') ? String(m.enlaceObtencion).trim() : null,
          tipo: _maeType(m),
          oferta: (m.o === 'V' ? 'Vigente' : 'Proyectada'),
          estado: m.e || '',
          sedes: (m.sedes || []).join(', ')
        });
      });
    });
  });
  return { rows: rows, total: total };
};

/**
 * Sub-card "REGISTRO CALIFICADO DE MAESTRÍAS" del bloque MAESTRÍAS POR
 * FACULTAD. KPIs total/con/sin clicables (data-action="mae-rc-show-detail",
 * filters institucional "rc|all" y por tipo "rc|con"|"rc|sin") + tabla por
 * facultad con celdas clicables (fac|<full>|rc|all|con|sin); los ceros
 * permanecen inertes. Los nombres visibles de facultad se muestran SIN el
 * prefijo "de" (presentación), pero los filtros conservan el nombre completo.
 * Datos calculados desde window.DB vía _maeRcSeries(). NO hardcodea números.
 */
var renderMaeRcSeccion = function(){
  var s = _maeRcSeries();
  var short = function(n){ return String(n || '').replace('Facultad de ', '').replace('Facultad ', '').replace(',', '').replace(/\s{2,}/g, ' ').trim(); };

  var h = '';
  h += '<div class="mae-rc-card">';
  h += '<div class="rc-title">Registro Calificado de Maestrías</div>';
  h += '<div class="rc-title-sub">Criterio: enlace de Resolución documentado (enlaceObtencion). Por registro de maestría (20). Independiente de estado y orientación.</div>';

  h += '<div class="rc-kpi-row mae-rc-kpis">';
  h += '<div class="rc-kpi rc-kpi-total rc-kpi-click" id="mae-kpi-total" role="button" tabindex="0" data-action="mae-rc-show-detail" data-filter="rc|all" title="Ver las '+s.total+' maestrías institucionales">'
    + '<div class="rc-kpi-v">'+s.total+'</div><div class="rc-kpi-l">Total maestrías</div></div>';
  h += '<div class="rc-kpi rc-kpi-con rc-kpi-click" id="mae-kpi-con" role="button" tabindex="0" data-action="mae-rc-show-detail" data-filter="rc|con" title="Ver las maestrías con Registro Calificado">'
    + '<div class="rc-kpi-v">'+s.con+'</div><div class="rc-kpi-l">Con Registro Calificado</div></div>';
  h += '<div class="rc-kpi mae-kpi-sinrc rc-kpi-click" id="mae-kpi-sin" role="button" tabindex="0" data-action="mae-rc-show-detail" data-filter="rc|sin" title="Ver las maestrías Proyectadas (sin Registro Calificado)">'
    + '<div class="rc-kpi-v">'+s.sin+'</div><div class="rc-kpi-l">Proyectada</div></div>';
  h += '</div>';

  h += '<div class="tbl-wrap"><table class="tbl rc-tbl-min rc-summary-tbl mae-rc-tbl">';
  h += '<thead><tr>'
    + '<th>Facultad</th>'
    + '<th class="rc-th-c">Total maestrías</th>'
    + '<th class="rc-th-c">Con Registro Calificado</th>'
    + '<th class="rc-th-c">Proyectada</th>'
    + '</tr></thead><tbody>';
  s.perFac.forEach(function(r){
    var fFull = esc(r.fac);
    h += '<tr>'
      + '<td class="rc-txt-green">'+esc(short(r.fac))+'</td>'
      + (r.total > 0
          ? '<td class="rc-th-c mae-rc-click" role="button" tabindex="0" data-action="mae-rc-show-detail" data-filter="fac|'+esc(r.fac)+'|rc|all" title="Ver todas las maestrías de '+esc(r.fac)+'">'+r.total+'</td>'
          : '<td class="rc-th-c">'+r.total+'</td>')
      + (r.con > 0
          ? '<td class="rc-th-c rc-txt-green mae-rc-click" role="button" tabindex="0" data-action="mae-rc-show-detail" data-filter="fac|'+esc(r.fac)+'|rc|con" title="Ver maestrías con Registro Calificado de '+esc(r.fac)+'">'+r.con+'</td>'
          : '<td class="rc-th-c rc-txt-green">0</td>')
      + (r.sin > 0
          ? '<td class="rc-th-c mae-rc-sin mae-rc-click" role="button" tabindex="0" data-action="mae-rc-show-detail" data-filter="fac|'+esc(r.fac)+'|rc|sin" title="Ver maestrías Proyectadas de '+esc(r.fac)+'">'+r.sin+'</td>'
          : '<td class="rc-th-c mae-rc-sin">0</td>')
      + '</tr>';
  });
  h += '<tr class="rc-row-total">'
    + '<td>TOTAL</td>'
    + '<td class="rc-th-c">'+s.total+'</td>'
    + '<td class="rc-th-c rc-txt-green">'+s.con+'</td>'
    + '<td class="rc-th-c mae-rc-sin">'+s.sin+'</td>'
    + '</tr>';
  h += '</tbody></table></div>';
  h += '</div>';
  return h;
};

/**
 * Parsea el filtro del detalle RC de maestrías: "fac|<nombre>|rc|all|con|sin"
 * (también "rc|all" institucional, sin facultad).
 * @returns {{ fac:string, rc:string }}
 */
var _parseMaeRcFilter = function(filter){
  var fac = '', rc = '';
  var parts = (filter || '').split('|');
  for (var i = 0; i + 1 < parts.length; i += 2) {
    var k = parts[i].trim(), v = parts[i + 1].trim();
    if (k === 'fac') fac = v;
    else if (k === 'rc') rc = v;
  }
  return { fac: fac, rc: rc };
};

/**
 * Modal de detalle del indicador RC de maestrías. MUESTRA SOLO MAESTRÍAS
 * (por registro, sin líneas/especializaciones/doctorados). Filtra por
 * facultad (fac|<full>|rc|...) y por tipo RC ('con' | 'sin' | 'all').
 * "rc|all" sin facultad = detalle institucional de todas las maestrías.
 * No dependiente de e ni de o.
 * @param {string} filter - "fac|<facultad>|rc|all|con|sin" | "rc|all|con|sin"
 */
var renderIndicadorMaeRcDetalle = function(filter){
  var overlay = document.getElementById('mae-rc-detail-overlay');
  if (overlay && overlay.parentNode) document.body.removeChild(overlay);

  var o = _parseMaeRcFilter(filter);
  var data = _maeRcDetailRows(o.fac, o.rc);
  var kind = (o.rc === 'con') ? 'Con Registro Calificado'
           : (o.rc === 'sin') ? 'Proyectada'
           : 'Todas las maestrías';
  var subTxt = (o.fac || 'Todas las facultades') + ' · ' + kind;

  var rowsHtml = data.rows.map(function(r){
    return '<tr>'
      + '<td class="rc-txt-green">'+esc(r.fac)+'</td>'
      + '<td>'+esc(r.prog)+'</td>'
      + '<td>'+esc(r.nombre)+'</td>'
      + '<td class="rc-th-c">'+esc(r.tipo)+'</td>'
      + '<td class="rc-th-c">'+esc(r.oferta)+'</td>'
      + '<td>'+esc(r.estado)+'</td>'
      + '<td>'+esc(r.sedes)+'</td>'
      + '<td class="rc-th-c">' + (r.enlace
          ? '<a href="'+esc(r.enlace)+'" target="_blank" rel="noopener noreferrer" class="rc-link">Ver enlace</a>'
          : '<span class="rc-nolink">Proyectada</span>')
      + '</td>'
      + '</tr>';
  }).join('');

  var html = '<div id="mae-rc-detail-overlay" class="rc-overlay">'
    + '<div class="modal rc-modal">'
    + '<div class="modal-title"><span>🎓</span><span>Registro Calificado de Maestrías<span class="rc-modal-sub">'+esc(subTxt)+'</span></span>'
    + '<button data-action="mae-rc-close-detail" class="rc-close" title="Cerrar">×</button></div>'
    + '<div class="rc-modal-body">'
    + '<div class="rc-count"><b>'+data.total+'</b> maestría(s) · '+kind+'</div>'
    + '<div class="tbl-wrap"><table class="tbl rc-detail-tbl">'
    + '<thead><tr>'
    + '<th>Facultad</th><th>Programa de pregrado</th><th>Nombre de la maestría</th>'
    + '<th>Orientación</th><th>Oferta</th><th>Estado</th><th>Sede(s)</th><th>Evidencia RC</th>'
    + '</tr></thead><tbody>'
    + rowsHtml + '</tbody></table></div>'
    + '<div class="rc-modal-foot"><button data-action="mae-rc-close-detail" class="rc-close-bottom">Cerrar</button></div>'
    + '</div></div></div>';

  var holder = document.createElement('div');
  holder.innerHTML = html;
  var node = holder.firstChild;
  document.body.appendChild(node);

  var onKey = function(e){
    if (!node || !node.parentNode) { document.removeEventListener('keydown', onKey); return; }
    if (e.key === 'Escape' && node.parentNode) document.body.removeChild(node);
    if (!node.parentNode) document.removeEventListener('keydown', onKey);
  };
  var onBackdrop = function(e){
    if (e.target !== node) return;
    if (node.parentNode) document.body.removeChild(node);
  };
  if (document.addEventListener) document.addEventListener('keydown', onKey);
  if (node && node.addEventListener) node.addEventListener('click', onBackdrop);
};

/**
 * Inserta un valor en un arreglo sin duplicados (comparación por forma de
 * string). Acepta un valor escalar o un arreglo (recursivo). Helper interno
 * de la capa de agrupación de especializaciones.
 * @private
 */
var _pushUniq = function(arr, item){
  if (Array.isArray(item)) { item.forEach(function(x){ _pushUniq(arr, x); }); return; }
  if (item === undefined || item === null) return;
  var s = '' + item;
  for (var i = 0; i < arr.length; i++) if (('' + arr[i]) === s) return;
  arr.push(item);
};

/**
 * Normaliza la denominación de una especialización para usarla como clave de
 * agrupación. Capa de LECTURA/derivada; NO modifica los datos. Solo aplica
 * las reglas realmente presentes en los datos: mayúsculas/minúsculas, acentos,
 * espacios y el prefijo de etiqueta ("Especialización", "Especialización en",
 * "Esp.", "Esp. en", con o sin acentos). No inventa reglas innecesarias.
 * @param {string} esp
 * @returns {string}
 */
var _normalizeEspecializacion = function(esp){
  var s = String(esp == null ? '' : esp);
  s = s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : s;
  s = s.toLowerCase();
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/^(especializaci[oó]n|esp\.?)(\s+en\b)?[:\s]*/, '');
  return s;
};

/**
 * CAPA DE LECTURA/AGRUPACIÓN (puramente derivada, NO modifica window.DB ni
 * p.lineas[]). Recorre f.progs[].lineas[] en vivo (AppData.getFacultades() ==
 * window.DB) y agrupa por ESPECIALIZACIÓN usando el `esp` normalizado por
 * _normalizeEspecializacion() como clave. Según la referencia
 * Especializaciones_Lineas_Profundizacion.xlsx, la especialización es la
 * entidad clave: facultad/programa/sede NO forman parte de la clave y se
 * conservan como multivalores del grupo. NO elimina registros: los duplicados
 * (esp,l) se conservan como registros de origen y se reflejan vía `registros`
 * / rcTotal. La normalización fusiona variantes de mayúsculas (p.ej.
 * "Seguridad de la Información" / "Seguridad de La Información").
 * @returns {Array<Object>}
 */
var getEspecializacionesAgrupadas = function(){
  var mapa = {};
  AppData.getFacultades().forEach(function(fac){
    (fac.progs || []).forEach(function(p){
      (p.lineas || []).forEach(function(l){
        var orig = l.esp;
        var key = _normalizeEspecializacion(orig);
        var g = mapa[key];
        if (!g) {
          g = mapa[key] = {
            esp: (orig == null || String(orig).trim() === '') ? 'Sin especialización' : orig,
            nLineas: 0,
            lineas: [],
            facultades: [],
            programas: [],
            sedes: [],
            estados: [],
            rcCount: 0,
            rcTotal: 0,
            registros: 0
          };
        }
        g.registros++;
        g.rcTotal = g.registros;
        if (_rcHasLink(l.enlaceObtencion)) g.rcCount++;
        _pushUniq(g.facultades, fac.name);
        _pushUniq(g.programas, (p.n != null && String(p.n).trim() !== '') ? p.n : (p.id != null ? p.id : ''));
        _pushUniq(g.sedes, l.sedes || []);
        _pushUniq(g.estados, l.e);

        var ln = l.l == null ? '' : String(l.l);
        var li = null;
        for (var i = 0; i < g.lineas.length; i++) {
          if (g.lineas[i].l === ln) { li = g.lineas[i]; break; }
        }
        if (!li) {
          li = { l: ln, registros: 0, sedes: [], estados: [], tipos: [], ofertas: [], enlaces: [], rcCount: 0, rcTotal: 0 };
          g.lineas.push(li);
          g.nLineas++;
        }
        li.registros++;
        li.rcTotal = li.registros;
        if (_rcHasLink(l.enlaceObtencion)) li.rcCount++;
        _pushUniq(li.sedes, l.sedes || []);
        _pushUniq(li.estados, l.e);
        _pushUniq(li.tipos, l.t);
        _pushUniq(li.ofertas, l.o);
        li.enlaces.push(l.enlaceObtencion == null ? null : l.enlaceObtencion);
      });
    });
  });
  return Object.keys(mapa).map(function(k){ return mapa[k]; });
};

// ===========================================================================
// INDICADOR: ESPECIALIZACIONES POR FACULTAD (FASE 2)
// ---------------------------------------------------------------------------
// Criterio aprobado A2 (reparto proporcional 1/nFac): cada especialización
// aporta 1/nFac a cada una de sus facultades asociadas (nFac = nº de
// facultades), por lo que la suma de pesos es SIEMPRE = nº de especializaciones
// únicas (44 hoy). La ponderación es una métrica estadística; los modales y
// detalle muestran las especializaciones REALES sin ponderar. Todo se calcula
// desde getEspecializacionesAgrupadas() -> window.DB (dinámico, read-only).
// ===========================================================================

// Paleta propia para especializaciones (no afecta líneas de profundización ni
// maestrías).
var _ESF_FAC_COLORS = ['#5B6B8C','#7C6FAC','#3E8E7E','#C77B3F','#8A4B8A','#4A7BA6','#B0608A','#6D8B74'];

// Datos calculados de la dona de especializaciones (se rellena en
// renderEsfSeccion() y se consume en renderEsfDonaCharts()).
var _esfDonaData = [];

/**
 * Formatea el peso ponderado (A2): entero si es exacto, 1 decimal si no
 * (p.ej. 13 -> "13", 9.5 -> "9.5"). Solo presentación; no redondea el dato.
 * @private
 */
var _esfFmt = function(n){
  var r = Math.round(n * 10) / 10;
  return ('' + r);
};

/**
 * Agregación A2 (reparto proporcional 1/nFac) de especializaciones por
 * facultad. Lee window.DB en el momento vía getEspecializacionesAgrupadas().
 * Cada especialización aporta 1/nFac a cada facultad asociada; el total es
 * siempre igual al nº de especializaciones únicas (grupos).
 * @returns {{total:number, perFac:Array<{fac:string,total:number}>}}
 */
var _esfSeries = function(){
  var groups = getEspecializacionesAgrupadas();
  var perFac = {};
  var total = 0;
  groups.forEach(function(g){
    var n = g.facultades.length || 1;
    var w = 1 / n;
    total += 1;
    g.facultades.forEach(function(f){
      perFac[f] = (perFac[f] || 0) + w;
    });
  });
  var list = Object.keys(perFac).map(function(f){
    return { fac: f, total: perFac[f] };
  }).filter(function(r){ return r.total > 0; }).sort(function(a,b){
    return (b.total - a.total) || (a.fac).localeCompare(b.fac);
  });
  return { total: total, perFac: list };
};

/**
 * Lista de especializaciones REALES (sin ponderar) de una facultad, para el
 * modal de detalle. Aplica la restricción por facultad ANTES de consolidar:
 * recorre las líneas de window.DB (AppData.getFacultades()) restringidas a la
 * facultad seleccionada y SOLO después agrupa por _normalizeEspecializacion()
 * (la MISMA normalización de getEspecializacionesAgrupadas). Así, una
 * especialización compartida (p.ej. Analítica Aplicada a Negocios) muestra
 * únicamente los programas/sedes/líneas/estados de la facultad elegida. La
 * ponderación 1/nFac sigue siendo solo métrica del indicador general; aquí el
 * detalle no pondera. Lee window.DB en vivo; NO modifica datos.
 * @param {string|null} facName - nombre completo de facultad (''/null = todas)
 * @returns {{rows:Array, total:number}} total = nº de especializaciones
 *   consolidadas dentro de la facultad (filas del detalle)
 */
var _esfDetailRows = function(facName){
  var mapa = {};
  var wantFac = (facName !== null && typeof facName !== 'undefined') ? String(facName).trim() : '';
  AppData.getFacultades().forEach(function(fac){
    if (wantFac !== '' && fac.name !== wantFac) return;
    (fac.progs || []).forEach(function(p){
      (p.lineas || []).forEach(function(l){
        var esp = l.esp;
        var key = _normalizeEspecializacion(esp);
        var g = mapa[key];
        if (!g) {
          g = mapa[key] = {
            esp: (esp == null || String(esp).trim() === '') ? 'Sin especialización' : esp,
            facultades: [], programas: [], sedes: [], lineas: [], estados: []
          };
        }
        _pushUniq(g.facultades, fac.name);
        _pushUniq(g.programas, (p.n != null && String(p.n).trim() !== '') ? p.n : (p.id != null ? p.id : ''));
        _pushUniq(g.sedes, l.sedes || []);
        _pushUniq(g.lineas, l.l == null ? '' : String(l.l));
        _pushUniq(g.estados, l.e == null ? '' : String(l.e));
      });
    });
  });
  var rows = Object.keys(mapa).map(function(k){ return mapa[k]; });
  return { rows: rows, total: rows.length };
};

// HTML de filas del modal de especializaciones (reutilizado por render).
var _esfRowsHtml = function(list){
  var cell = function(arr){ return arr.map(esc).join('<br>'); };
  return list.map(function(r){
    return '<tr>'
      + '<td class="rc-txt-green">'+esc(r.esp)+'</td>'
      + '<td>'+cell(r.facultades)+'</td>'
      + '<td>'+cell(r.programas)+'</td>'
      + '<td>'+cell(r.sedes)+'</td>'
      + '<td>'+cell(r.lineas)+'</td>'
      + '<td>'+cell(r.estados)+'</td>'
      + '</tr>';
  }).join('');
};

/**
 * Genera el HTML de la sección "Especializaciones por Facultad":
 * dona + ranking lateral (cantidad ponderada y porcentaje) y total central.
 * Distribución por facultad, ordenada de mayor a menor; se excluyen
 * facultades con 0. Total = nº de especializaciones únicas (44 hoy).
 * @returns {string}
 */
var renderEsfSeccion = function(){
  var s = _esfSeries();

  var dona = s.perFac.map(function(r){
    return { fac: r.fac, total: r.total, pct: s.total > 0 ? (r.total / s.total * 100) : 0 };
  });
  _esfDonaData = dona;

  // Ranking compacto (patrón Maestrías): misma agregación A2 ponderada
  // (_esfSeries().perFac ya incluye el peso 1/nFac de compartidas, p.ej.
  // Analítica Aplicada con 0.5 por facultad). La suma de cantidades = 44
  // (total institucional), NO 45. Solo presentación; reutiliza esf-show-detail.
  // @private
  var short = function(n){ return String(n || '').replace('Facultad de ', '').replace('Facultad ', '').replace(',', '').replace(/\s{2,}/g, ' ').trim(); };
  var fmtCant = function(n){ return _esfFmt(n).replace('.', ','); };
  var fmtPct = function(v){ return v.toFixed(1).replace('.', ',') + '%'; };
  var rankHtml = dona.map(function(f){
    var dotCol = _ESF_FAC_COLORS[dona.indexOf(f) % _ESF_FAC_COLORS.length];
    return '<div class="rc-rank-row" role="button" tabindex="0" data-action="esf-show-detail" data-filter="fac|'+esc(f.fac)+'">'
      + '<span class="rc-rank-dot" style="background:'+dotCol+'"></span>'
      + '<span class="rc-rank-name">'+esc(short(f.fac))+'</span>'
      + '<span class="rc-rank-num">'+fmtCant(f.total)+'</span>'
      + '<span class="rc-rank-pct">'+fmtPct(f.pct)+'</span>'
      + '</div>';
  }).join('');

  var h = '';
  h += '<div class="rc-container esf-container">';
  h += '<div class="rc-title">Especializaciones por Facultad</div>';
  h += '<div class="rc-title-sub">'+s.total+' especializaciones consolidadas; las especializaciones compartidas se distribuyen proporcionalmente entre sus facultades · clic para detalle</div>';

  // KPIs dinámicos derivados exclusivamente de getEspecializacionesAgrupadas()
  var v = getEspecializacionesAgrupadas();
  var esfKpi1 = v.filter(function(g){ return g.nLineas === 1; }).length;
  var esfKpi2 = v.filter(function(g){ return g.nLineas === 2; }).length;
  h += '<div class="rc-kpi-row">';
  var esfKpis = [
    { v: v.length, l: 'Especializaciones Consolidadas', cls: 'rc-kpi-total' },
    { v: esfKpi1,  l: 'Con 1 Línea de Profundización',  cls: 'rc-kpi-con'   },
    { v: esfKpi2,  l: 'Con 2 Líneas de Profundización', cls: 'rc-kpi-proy'  }
  ];
  esfKpis.forEach(function(k){
    h += '<div class="rc-kpi '+k.cls+'"><div class="rc-kpi-v">'+k.v+'</div><div class="rc-kpi-l">'+k.l+'</div></div>';
  });
  h += '</div>';

  h += '<div class="rc-charts">';
  h += '<div class="rc-chart-card rc-chart-card-dona">'
    + '<div class="rc-chart-head">DISTRIBUCIÓN DE LAS '+s.total+' ESPECIALIZACIONES POR FACULTAD</div>'
    + '<div class="rc-chart-sub">Participación de cada facultad sobre el total de especializaciones consolidadas</div>'
    + '<div class="rc-chart-body rc-chart-body-dona">'
    + '<div class="rc-dona-col">'
    + '<div class="rc-doughnut-center"><div class="rc-doughnut-center-v" id="esf-dona-total"></div><div class="rc-doughnut-center-l" id="esf-dona-label">Especializaciones</div></div>'
    + '<canvas id="esf-chart-dona" height="200"></canvas>'
    + '</div>'
    + '<div class="rc-rank-col esf-rank-split">'
    + '<div class="rc-rank-side"><div class="rc-rank-head"><span>Facultad</span><span>Cant.</span><span>Part.</span></div>'
    + rankHtml
    + '</div>'
    + '<div class="rc-esf-rc"><canvas id="esf-chart-rc"></canvas></div>'
    + '</div>'
    + '</div>'
    + '</div>';
  h += '</div>';
  h += '</div>';
  return h;
};

/**
 * Inicializa la dona Chart.js "Distribución de Especializaciones por Facultad".
 * DEBE ejecutarse DESPUÉS de asignar wrap.innerHTML=h (patrón renderMaeDonaCharts).
 * Usa _esfDonaData (calculado en renderEsfSeccion desde window.DB vía
 * getEspecializacionesAgrupadas). Dinámico; read-only. Si Chart.js no está
 * disponible, no hace nada.
 */
var renderEsfDonaCharts = function(){
  if (typeof Chart !== 'function' || typeof requestAnimationFrame !== 'function') return;
  var id = 'esf-chart-dona';
  if (!document.getElementById(id)) return;
  var s = _esfSeries();
  var dona = _esfDonaData;

  requestAnimationFrame(function(){
    var ex = Chart.getChart ? Chart.getChart(id) : null;
    if (ex) ex.destroy();

    var totalEl = document.getElementById('esf-dona-total');
    if (totalEl) totalEl.textContent = String(s.total);

    function openFac(full){ if (!full) return; renderIndicadorEsfDetalle('fac|' + full); }

    new Chart(document.getElementById(id), {
      type: 'doughnut',
      data: {
        labels: dona.map(function(f){ return f.fac; }),
        datasets:[{
          data: dona.map(function(f){ return f.total; }),
          backgroundColor: dona.map(function(f, i){ return _ESF_FAC_COLORS[i % _ESF_FAC_COLORS.length]; }),
          borderColor:'#fff', borderWidth:3, hoverOffset:6
        }]
      },
      options: {
        responsive:true, maintainAspectRatio:false, cutout:'72%',
        layout:{ padding:{ top:6, bottom:6, left:4, right:4 } },
        onClick: function(evt, els){
          if(!els || !els.length) return;
          var f = dona[els[0].index];
          if(f) openFac(f.fac);
        },
        plugins:{
          legend:{ display:false },
          tooltip:{ callbacks:{ label:function(ctx){
            var d = dona[ctx.dataIndex] || {};
            return ctx.label+': '+_esfFmt(ctx.parsed)+' especialización(es) (' + (d.pct||0).toFixed(1) + '% del total)';
          } } },
          datalabels:{ color:'#fff', font:{ weight:'900', size:11.5 }, textAlign:'center',
            formatter:function(v, ctx){
              if(v <= 0) return '';
              var d = dona[ctx.dataIndex] || {};
              return (d.pct >= 6) ? (d.pct).toFixed(0)+'%' : '';
            } }
        }
      }
    });
  });
};

/**
 * Inicializa la visualización compacta "Con Registro Calificado vs Proyectada
 * (ausencia de RC)" por facultad (barras horizontales 100% apiladas) dentro de
 * la MISMA tarjeta de Especializaciones (columna derecha, sustituye al ranking).
 * FASE 3.8.1: usa _rcEspSeries().perFac a nivel de ESPECIALIZACIÓN (entidad),
 * ordenado por el ranking A2 de _esfSeries() para que cada barra coincida con
 * su segmento de dona. El clic distingue el segmento: "Con Registro Calificado"
 * (verde, dataset 0) abre renderIndicadorRCDetalle('fac-con:<facultad>') y
 * "Proyectada" (dorado, dataset 1) abre
 * renderIndicadorRCDetalle('fac-sin:<facultad>'), equivalentes a rc-show-detail.
 * La dona conserva su propio comportamiento (renderIndicadorEsfDetalle). Read-only;
 * dinámico en cada render.
 */
var renderEsfRcChart = function(){
  if (typeof Chart !== 'function' || typeof requestAnimationFrame !== 'function') return;
  var id = 'esf-chart-rc';
  if (!document.getElementById(id)) return;

  var short = function(n){ return (n || '').replace('Facultad de ','').replace('Facultad ','').split(',')[0].trim(); };
  var rc = _rcEspSeries();
  var esf = _esfSeries();

  var facBy = {};
  rc.perFac.forEach(function(p){ facBy[p.fac] = p; });

  // Orden: ranking A2 de la dona (desc); cada barra = Con Registro Calificado vs
  // Proyectada (ausencia de RC) de esa facultad a nivel de ESPECIALIZACIÓN (entidad).
  // Total = con + sin (invariante de _rcEspSeries).
  var rows = esf.perFac.map(function(r){
    var p = facBy[r.fac];
    if (!p || !p.total) return null;
    return {
      short: short(r.fac),
      full: r.fac,
      total: p.total, con: p.con, sin: p.sin,
      conPct: p.con / p.total * 100,
      sinPct: p.sin / p.total * 100
    };
  }).filter(function(x){ return x; });

  requestAnimationFrame(function(){
    var ex = Chart.getChart ? Chart.getChart(id) : null;
    if (ex) ex.destroy();

    function openFacRc(full, ds){ if (!full) return; renderIndicadorRCDetalle(ds === 1 ? 'fac-sin:' + full : 'fac-con:' + full); }
    function pctTxt(v){ return v.toFixed(1).replace('.', ',') + '%'; }

    new Chart(document.getElementById(id), {
      type: 'bar',
      data: {
        labels: rows.map(function(r){ return r.short; }),
        datasets:[
          { label:'Con Registro Calificado', data: rows.map(function(r){ return r.conPct; }), backgroundColor:'#107a6a',
            datalabels:{ color:'#ffffff', anchor:'center', align:'center', font:{ weight:'700', size:10.5 },
              formatter:function(v, ctx){ return v >= 15 ? (rows[ctx.dataIndex].con) + ' · ' + pctTxt(v) : ''; } } },
          { label:'Proyectada', data: rows.map(function(r){ return r.sinPct; }), backgroundColor:'#C8A43A',
            datalabels:{ color:'#5c4a00', anchor:'center', align:'center', font:{ weight:'700', size:10.5 },
              formatter:function(v, ctx){ return v >= 15 ? (rows[ctx.dataIndex].sin) + ' · ' + pctTxt(v) : ''; } } }
        ]
      },
      options: {
        indexAxis:'y',
        responsive:true, maintainAspectRatio:false,
        layout:{ padding:{ right: 8 } },
        onClick: function(evt, els){
          if (!els || !els.length) return;
          var r = rows[els[0].index];
          if (!r) return;
          var ds = els[0].datasetIndex;
          if (ds === 0 || ds === 1) openFacRc(r.full, ds);
        },
        plugins:{
          legend:{ position:'bottom', labels:{ boxWidth:10, font:{ size:9.5 }, padding:8 } },
          datalabels:{ display:false },
          tooltip:{ callbacks:{
            title: function(items){ return (items && items.length) ? rows[items[0].dataIndex].full : ''; },
            label: function(ctx){
              var r = rows[ctx.dataIndex] || {};
              var n = ctx.dataset.label === 'Con Registro Calificado' ? r.con : r.sin;
              return ctx.dataset.label + ': ' + n + ' especialización(es) (' + pctTxt(ctx.parsed.x || 0) + ')';
            }
          } }
        },
        scales:{
          x:{ stacked:true, beginAtZero:true, max:100, precision:0, title:{ display:false }, grid:{ display:false },
            ticks:{ stepSize:20, callback:function(v){ return v + '%'; } } },
          y:{ stacked:true, grid:{ display:false }, ticks:{ font:{ size:10 }, autoSkip:false } }
        }
      }
    });
  });
};

/**
 * Construye y muestra el modal de detalle de ESPECIALIZACIONES POR FACULTAD.
 * Muestra las especializaciones REALES (sin ponderación) de la facultad
 * seleccionada: el detalle filtra por facultad ANTES de consolidar, por lo que
 * una especialización compartida (p.ej. Analítica Aplicada a Negocios) aparece
 * únicamente con la información de la facultad elegida. Lee window.DB en vivo
 * vía _esfDetailRows(). No modifica datos.
 * @param {string} filter - clave de filtro, p.ej. "fac|Facultad de Ingeniería"
 */
var renderIndicadorEsfDetalle = function(filter){
  var overlay = document.getElementById('esf-detail-overlay');
  if (overlay && overlay.parentNode) document.body.removeChild(overlay);

  var fac = '';
  var parts = (filter || '').split('|');
  for (var i = 0; i + 1 < parts.length; i += 2) {
    if (parts[i].trim() === 'fac') fac = parts[i + 1].trim();
  }

  var data = _esfDetailRows(fac);
  var subTxt = fac ? fac : 'Todas las facultades';

  var html = '<div id="esf-detail-overlay" class="rc-overlay">'
    + '<div class="modal rc-modal">'
    + '<div class="modal-title"><span>🔍</span><span>Especializaciones por Facultad<span class="rc-modal-sub"> — '+esc(subTxt)+'</span></span>'
    + '<button data-action="esf-close-detail" class="rc-close" title="Cerrar">×</button></div>'
    + '<div class="rc-modal-body">'
    + '<div class="rc-count">'
    + _rcStat(data.total, 'especializaciones consolidadas') + _rcCountSep
    + '<span class="rc-count-stat"><span class="rc-count-lbl">datos reales (sin ponderación)</span></span>'
    + '</div>'
    + '<div class="tbl-wrap"><table class="tbl rc-detail-tbl">'
    + '<thead><tr>'
    + '<th>Especialización</th><th>Facultad(es)</th><th>Programa(s)</th><th>Sede(s)</th><th>Línea(s) de profundización</th><th>Estado(s)</th>'
    + '</tr></thead><tbody>'
    + _esfRowsHtml(data.rows) + '</tbody></table></div>'
    + '<div class="rc-modal-foot"><button data-action="esf-close-detail" class="rc-close-bottom">Cerrar</button></div>'
    + '</div></div></div>';

  var holder = document.createElement('div');
  holder.innerHTML = html;
  var node = holder.firstChild;
  document.body.appendChild(node);

  var onKey = function(e){
    if (!node || !node.parentNode){ document.removeEventListener('keydown', onKey); return; }
    if (e.key === 'Escape' && node.parentNode) document.body.removeChild(node);
    if (!node.parentNode) document.removeEventListener('keydown', onKey);
  };
  var onBackdrop = function(e){
    if (e.target !== node) return;
    if (node.parentNode) document.body.removeChild(node);
  };
  if (document.addEventListener) document.addEventListener('keydown', onKey);
  if (node && node.addEventListener) node.addEventListener('click', onBackdrop);
};

// ===== FASE 3.9.2-B — INTERACTIVIDAD COMPLETA DE LA TABLA "DISTRIBUCIÓN POR FACULTAD" =====
// Fuente única de verdad de las ENTIDADES de posgrado por facultad:
// getPosgradosPorFacultad(). Devuelve especializaciones consolidadas (clave
// _normalizeEspecializacion) + maestrías + doctorado, y deriva
// total/vigente/proyectada con la MISMA contabilidad de la tabla FASE 3.9.1
// (44/20/6 -> 70 inmediato; V/P 20/50). NO usa p.lineas[] como entidades, NO
// usa Registro Calificado y NO usa _esfSeries (ponderación A2). Todo es
// lectura en vivo de window.DB; NO modifica datos.

// Extrae el valor 'fac|' del filtro (formato clave|valor, pares).
var _parseFacFilter = function(filter){
  var fac = '';
  var parts = (filter || '').split('|');
  for (var i = 0; i + 1 < parts.length; i += 2) {
    if (parts[i].trim() === 'fac') fac = parts[i + 1].trim();
  }
  return fac;
};

// Objeto de facultad completo (o null) por nombre exacto.
var _facByName = function(facName){
  var found = null;
  AppData.getFacultades().forEach(function(f){ if (f.name === facName) found = f; });
  return found;
};

/**
 * FUENTE ÚNICA DE VERDAD (FASE 3.9.2-B). Entidades de posgrado de una facultad:
 * especializaciones consolidadas + maestrías + doctorado (objeto único 0/1).
 * Reglas idénticas a la tabla FASE 3.9.1:
 *   - especialización Vigente si ≥1 línea o==='V' dentro de ESA facultad (la
 *     compartida se cuenta 1× global y 1× por cada facultad asociada);
 *   - maestría/doctorado usan su propio o.
 * Deriva total / vig / proy. NO muestra líneas de profundización como entidades.
 * @param {string|null} facName - nombre completo de facultad (''/null = todas)
 * @returns {Object}
 */
var getPosgradosPorFacultad = function(facName){
  var wantFac = (facName !== null && typeof facName !== 'undefined') ? String(facName).trim() : '';
  var espMap = {}, maes = [], doc = null;
  AppData.getFacultades().forEach(function(fac){
    if (wantFac !== '' && fac.name !== wantFac) return;
    (fac.progs || []).forEach(function(p){
      (p.lineas || []).forEach(function(l){
        var key = _normalizeEspecializacion(l.esp);
        var g = espMap[key];
        if (!g) {
          g = espMap[key] = {
            nombre: (l.esp == null || String(l.esp).trim() === '') ? 'Sin especialización' : l.esp,
            oferta: (l.o === 'V' ? 'Vigente' : 'Proyectada')
          };
        } else if (l.o === 'V') {
          g.oferta = 'Vigente';
        }
      });
      (p.mae || []).forEach(function(m){
        maes.push({ nombre: m.n || '', oferta: (m.o === 'V' ? 'Vigente' : 'Proyectada') });
      });
    });
    if (fac.doc) doc = { nombre: fac.doc.n || '', oferta: (fac.doc.o === 'V' ? 'Vigente' : 'Proyectada') };
  });
  var esp = Object.keys(espMap).map(function(k){ return espMap[k]; });
  var totalEsp = esp.length, totalMae = maes.length, totalDoc = doc ? 1 : 0;
  var vigEsp = esp.filter(function(e){ return e.oferta === 'Vigente'; }).length;
  var vigMae = maes.filter(function(m){ return m.oferta === 'Vigente'; }).length;
  var vigDoc = (doc && doc.oferta === 'Vigente') ? 1 : 0;
  var total = totalEsp + totalMae + totalDoc;
  var vig = vigEsp + vigMae + vigDoc;
  return {
    fac: wantFac,
    esp: esp, mae: maes, doc: doc,
    totalEsp: totalEsp, totalMae: totalMae, totalDoc: totalDoc,
    vigEsp: vigEsp, vigMae: vigMae, vigDoc: vigDoc,
    total: total, vig: vig, proy: total - vig
  };
};

// Monta un overlay de detalle (patrón de los modales rc) con cierre por Esc,
// clic en el fondo y botones data-action. NO modifica datos.
var _detailOverlay = function(id, html){
  var old = document.getElementById(id);
  if (old && old.parentNode) document.body.removeChild(old);
  var holder = document.createElement('div');
  holder.innerHTML = html;
  var node = holder.firstChild;
  document.body.appendChild(node);
  var onKey = function(e){
    if (!node || !node.parentNode){ document.removeEventListener('keydown', onKey); return; }
    if (e.key === 'Escape' && node.parentNode) document.body.removeChild(node);
    if (!node.parentNode) document.removeEventListener('keydown', onKey);
  };
  var onBackdrop = function(e){
    if (e.target !== node) return;
    if (node.parentNode) document.body.removeChild(node);
  };
  if (document.addEventListener) document.addEventListener('keydown', onKey);
  if (node && node.addEventListener) node.addEventListener('click', onBackdrop);
};

// Detalle de PREGRADOS por facultad. Lista los programas de pregrado
// (fac.progs[]) de la facultad seleccionada. NO reutiliza lr-modal-overlay
// (esa ruta de aprendizaje requiere programa+sede concreto).
// @param {string} filter - "fac|<nombre completo de facultad>"
var renderIndicadorPreDetalle = function(filter){
  var fac = _parseFacFilter(filter);
  var f = _facByName(fac);
  var progs = f ? (f.progs || []) : [];
  var sub = fac || 'Todas las facultades';
  var rows = progs.map(function(p){
    return '<tr>'
      + '<td>'+esc(p.n || '')+'</td>'
      + '<td class="rc-txt-green">'+esc(fac)+'</td>'
      + '<td>'+esc((p.sedes || []).join(', '))+'</td>'
      + '</tr>';
  }).join('');
  var html = '<div id="pre-detail-overlay" class="rc-overlay">'
    + '<div class="modal rc-modal">'
    + '<div class="modal-title"><span>🎓</span><span>Programas de Pregrado por Facultad<span class="rc-modal-sub"> — '+esc(sub)+'</span></span>'
    + '<button data-action="pre-close-detail" class="rc-close" title="Cerrar">×</button></div>'
    + '<div class="rc-modal-body">'
    + '<div class="rc-count">'+_rcStat(progs.length, 'programa(s) de pregrado')+'</div>'
    + '<div class="tbl-wrap"><table class="tbl rc-detail-tbl">'
    + '<thead><tr><th>Programa</th><th>Facultad</th><th>Sede(s)</th></tr></thead><tbody>'
    + rows + '</tbody></table></div>'
    + '<div class="rc-modal-foot"><button data-action="pre-close-detail" class="rc-close-bottom">Cerrar</button></div>'
    + '</div></div></div>';
  _detailOverlay('pre-detail-overlay', html);
};

// Detalle de DOCTORADO por facultad. El modelo usa fac.doc como objeto único
// (0 o 1 por facultad), por lo que el detalle es de una sola entidad.
// @param {string} filter - "fac|<nombre completo de facultad>"
var renderIndicadorDocDetalle = function(filter){
  var fac = _parseFacFilter(filter);
  var f = _facByName(fac);
  var d = f ? f.doc : null;
  var sub = fac || 'Todas las facultades';
  var row = '';
  if (d) {
    row = '<tr>'
      + '<td>'+esc(d.n || '')+'</td>'
      + '<td class="rc-txt-green">'+esc(fac)+'</td>'
      + '<td class="rc-th-c">'+esc(d.o === 'V' ? 'Vigente' : 'Proyectada')+'</td>'
      + '<td>'+esc(d.e || '')+'</td>'
      + '<td>'+esc((d.sedes || []).join(', '))+'</td>'
      + '</tr>';
  }
  var html = '<div id="doc-detail-overlay" class="rc-overlay">'
    + '<div class="modal rc-modal">'
    + '<div class="modal-title"><span>🎓</span><span>Doctorado por Facultad<span class="rc-modal-sub"> — '+esc(sub)+'</span></span>'
    + '<button data-action="doc-close-detail" class="rc-close" title="Cerrar">×</button></div>'
    + '<div class="rc-modal-body">'
    + '<div class="rc-count">'+_rcStat(d ? 1 : 0, 'doctorado(s)')+'</div>'
    + '<div class="tbl-wrap"><table class="tbl rc-detail-tbl">'
    + '<thead><tr><th>Doctorado</th><th>Facultad</th><th>Oferta</th><th>Estado</th><th>Sede(s)</th></tr></thead><tbody>'
    + row + '</tbody></table></div>'
    + '<div class="rc-modal-foot"><button data-action="doc-close-detail" class="rc-close-bottom">Cerrar</button></div>'
    + '</div></div></div>';
  _detailOverlay('doc-detail-overlay', html);
};

// Detalle consolidado de POSGRADOS por facultad (TOTAL / VIGENTES /
// PROYECTADAS). Muestra las ENTIDADES (especializaciones consolidadas +
// maestrías + doctorado), nunca líneas de profundización.
// @param {string} filter - "fac|<nombre completo de facultad>"
// @param {string} [ofertaFilter] - ''=todas | 'V'=Vigentes | 'P'=Proyectadas
var renderPosgDetalle = function(filter, ofertaFilter){
  var fac = _parseFacFilter(filter);
  var data = getPosgradosPorFacultad(fac);
  var only = (ofertaFilter === 'V' || ofertaFilter === 'P')
    ? (ofertaFilter === 'V' ? 'Vigente' : 'Proyectada') : '';
  var sub = only
    ? (fac + ' · ' + (only === 'Vigente' ? 'Vigentes' : 'Proyectadas'))
    : (fac || 'Todas las facultades');
  var rowsHtml = '';
  var shown = 0;
  var pushRow = function(nivel, nombre, oferta){
    if (only && oferta !== only) return;
    shown++;
    rowsHtml += '<tr><td class="rc-txt-green">'+nivel+'</td><td>'+esc(nombre)+'</td><td class="rc-th-c">'+esc(oferta)+'</td></tr>';
  };
  data.esp.forEach(function(e){ pushRow('Especialización', e.nombre, e.oferta); });
  data.mae.forEach(function(m){ pushRow('Maestría', m.nombre, m.oferta); });
  if (data.doc) pushRow('Doctorado', data.doc.nombre, data.doc.oferta);

  var countTxt = only
    ? _rcStat(shown, 'entidad(es) de posgrado') + _rcCountSep
      + '<span class="rc-count-stat"><span class="rc-count-lbl">de '+data.total+' totales de la facultad</span></span>'
    : _rcStat(shown, 'entidades de posgrado') + _rcCountSep
      + '<span class="rc-count-stat"><span class="rc-count-lbl">especializaciones '+data.totalEsp+' · maestrías '+data.totalMae+' · doctorados '+data.totalDoc+'</span></span>';

  var html = '<div id="posg-detail-overlay" class="rc-overlay">'
    + '<div class="modal rc-modal">'
    + '<div class="modal-title"><span>🏫</span><span>Posgrados por Facultad<span class="rc-modal-sub"> — '+esc(sub)+'</span></span>'
    + '<button data-action="posg-close-detail" class="rc-close" title="Cerrar">×</button></div>'
    + '<div class="rc-modal-body">'
    + '<div class="rc-count">' + countTxt + '</div>'
    + '<div class="tbl-wrap"><table class="tbl rc-detail-tbl">'
    + '<thead><tr><th>Nivel</th><th>Entidad de posgrado</th><th>Oferta</th></tr></thead><tbody>'
    + rowsHtml + '</tbody></table></div>'
    + '<div class="rc-note">Entidades consolidadas (no líneas de profundización). Oferta Vigente/Proyectada con la contabilidad FASE 3.9.1; no usa Registro Calificado.</div>'
    + '<div class="rc-modal-foot"><button data-action="posg-close-detail" class="rc-close-bottom">Cerrar</button></div>'
    + '</div></div></div>';
  _detailOverlay('posg-detail-overlay', html);
};

// exportado via window.App (app.js)
