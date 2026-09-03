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
  const estadoCount={};
  const facStats=[];

  function getEstGroup(e){
    const g=getSt(e);
    return g.cat?{label:g.group,color:g.dot,bg:g.bg}:{label:'Sin definir',color:'#888',bg:'#f5f5f0'};
  }

  AppData.getFacultades().forEach(fac=>{
    const fs={name:fac.name, pre:fac.progs.length, esp:0, mae:0, doc:fac.doc?1:0, vigente:0, proyectada:0, estados:{}};
    totalPre+=fac.progs.length;
    fac.progs.forEach(p=>{
      p.lineas.forEach(l=>{
        fs.esp++; totalEsp++;
        if(l.o==='V'){vigente++;fs.vigente++;} else{proyectada++;fs.proyectada++;}
        const g=getEstGroup(l.e); estadoCount[g.label]=(estadoCount[g.label]||0)+1; fs.estados[g.label]=(fs.estados[g.label]||0)+1;
      });
      p.mae.forEach(m=>{
        fs.mae++; totalMae++;
        if(m.o==='V'){vigente++;fs.vigente++;} else{proyectada++;fs.proyectada++;}
        const g=getEstGroup(m.e); estadoCount[g.label]=(estadoCount[g.label]||0)+1; fs.estados[g.label]=(fs.estados[g.label]||0)+1;
      });
    });
    if(fac.doc){
      totalDoc++;
      if(fac.doc.o==='V'){vigente++;fs.vigente++;} else{proyectada++;fs.proyectada++;}
      const g=getEstGroup(fac.doc.e); estadoCount[g.label]=(estadoCount[g.label]||0)+1; fs.estados[g.label]=(fs.estados[g.label]||0)+1;
    }
    facStats.push(fs);
  });

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
    const tp=fs.esp+fs.mae+fs.doc;
    const pct=totalPosg>0?Math.round(tp/totalPosg*100):0;
    const bg=i%2===0?'#f8fbf8':'#fff';
    h+=`<tr style="background:${bg};border-bottom:1px solid #eef4ee">
      <td style="padding:8px 10px;font-weight:600;color:#006633;font-size:10px">${esc(fs.name.replace('Facultad de ','').replace('Facultad ',''))} </td>
      <td style="padding:8px 10px;text-align:center;font-weight:700;color:#2e8b57">${fs.pre}</td>
      <td style="padding:8px 10px;text-align:center">${fs.esp}</td>
      <td style="padding:8px 10px;text-align:center;color:#9a7c1a;font-weight:600">${fs.mae}</td>
      <td style="padding:8px 10px;text-align:center;color:#0d3d22;font-weight:600">${fs.doc}</td>
      <td style="padding:8px 10px;text-align:center;font-weight:700;color:#185FA5">${tp}</td>
      <td style="padding:8px 10px;text-align:center">
        <span style="background:#e6f2eb;color:#006633;padding:2px 8px;border-radius:8px;font-weight:600">${fs.vigente}</span>
      </td>
      <td style="padding:8px 10px;text-align:center">
        <span style="background:#e6f0fb;color:#185FA5;padding:2px 8px;border-radius:8px;font-weight:600">${fs.proyectada}</span>
      </td>
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
    <td style="padding:9px 10px;text-align:center">${totalEsp}</td>
    <td style="padding:9px 10px;text-align:center">${totalMae}</td>
    <td style="padding:9px 10px;text-align:center">${totalDoc}</td>
    <td style="padding:9px 10px;text-align:center">${totalPosg}</td>
    <td style="padding:9px 10px;text-align:center">${vigente}</td>
    <td style="padding:9px 10px;text-align:center">${proyectada}</td>
    <td style="padding:9px 10px;border-radius:0 0 6px 0">100%</td>
  </tr>`;
  h+=`</tbody></table></div></div>`;

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

  h+=`</div>`;

  wrap.innerHTML=h;
  renderProfCharts();
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
 * }}
 */
var _profSeries = function(){
  var short = function(n){ return (n||'').replace('Facultad de ','').replace('Facultad ','').split(',')[0].trim(); };
  var labels=[], facTotals=[], byTypeRows=[], typeSums=[0,0,0,0];
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
    facTotals.push(fTotal);
    byTypeRows.push(tStack.slice());
    for(var k=0;k<4;k++) typeSums[k]+=tStack[k];
    total += fTotal;
  });

  var facPct = labels.map(function(_,i){ return total>0 ? (facTotals[i]/total*100) : 0; });
  var rank = labels.map(function(n,i){ return { n:n, t:facTotals[i], p:facPct[i] }; })
    .sort(function(a,b){ return b.t - a.t || (a.n).localeCompare(b.n); });

  return {
    total: total, labels: labels, facTotals: facTotals, facPct: facPct,
    byTypeRows: byTypeRows, typeSums: typeSums, rank: rank
  };
};

// Paleta por Facultad para la dona (G3) y su ranking lateral (colores consistentes).
var _PROF_FAC_COLORS = ['#006633','#2e8b57','#3aaa72','#C8A43A','#378ADD','#D85A30','#993556','#534AB7'];

/**
 * Genera el HTML completo de la sección "Registro Calificado por Facultad":
 * KPIs de resumen + tablas + tarjetas por facultad + visualizaciones de
 * LÍNEAS DE PROFUNDIZACIÓN. Las gráficas se inicializan en renderProfCharts()
 * @returns {string}
 */
var renderRCSeccion = function(){
  var rc = _rcCompute();
  var short = function(n){ return (n||'').replace('Facultad de ','').replace('Facultad ','').split(',')[0].trim(); };

  var h = '';
  h += '<div class="rc-container">';
  h += '<div class="rc-title">Seguimiento a Especializaciones </div>';
  h += '<div class="rc-title-sub">Registro Calificado y Proyectada, por facultad</div>';

  // KPIs resumen (3, fondos pastel semánticos)
  h += '<div class="rc-kpi-row">';
  var kpis = [
    { v: rc.total, l: 'Total líneas',       cls: 'rc-kpi-total' },
    { v: rc.conRC, l: 'Registro Calificado', cls: 'rc-kpi-con'   },
    { v: rc.sinRC, l: 'Proyectada',         cls: 'rc-kpi-proy'   }
  ];
  kpis.forEach(function(k){
    h += '<div class="rc-kpi '+k.cls+'"><div class="rc-kpi-v">'+k.v+'</div><div class="rc-kpi-l">'+k.l+'</div></div>';
  });
  h += '</div>';

  // tabla resumen global (4 columnas)
  h += '<div class="tbl-wrap"><table class="tbl rc-tbl-min rc-summary-tbl">';
  h += '<thead><tr>'
    + '<th>Estado Actual Posgrado</th>'
    + '<th>Total</th>'
    + '<th>Registro Calificado</th>'
    + '<th>Proyectada</th>'
    + '</tr></thead><tbody>';
  rc.perFac.forEach(function(f){
    h += '<tr>'
      + '<td class="rc-txt-green">'+esc(short(f.fac.name))+'</td>'
      + '<td class="rc-txt-dark">'+f.total+'</td>'
      + '<td class="rc-txt-green">'+f.conRC+'</td>'
      + '<td class="rc-txt-gold">'+f.sinRC+'</td>'
      + '</tr>';
  });
  h += '<tr class="rc-row-total">'
    + '<td>TOTAL</td>'
    + '<td>'+rc.total+'</td>'
    + '<td>'+rc.conRC+'</td>'
    + '<td>'+rc.sinRC+'</td>'
    + '</tr>';
  h += '</tbody></table></div>';

  // ===== Visualizaciones: LÍNEAS DE PROFUNDIZACIÓN por Facultad (p.lineas[] + campo t) =====
  h += '<div class="rc-title-sub rc-chart-section-sub">Visualización — Líneas de profundización por Facultad</div>';
  h += '<div class="rc-charts">';
  h += '<div class="rc-chart-card">'
    + '<div class="rc-chart-head">Líneas de profundización por Facultad</div>'
    + '<div class="rc-chart-sub">Participación sobre el total de líneas</div>'
    + '<div class="rc-chart-body rc-chart-body-tall"><canvas id="prof-chart-total" height="280"></canvas></div>'
    + '</div>';
  h += '<div class="rc-chart-card">'
    + '<div class="rc-chart-head">Distribución por tipo de profundización</div>'
    + '<div class="rc-chart-sub">Profundización 1 · 2 · 3 y Sin línea, por Facultad</div>'
    + '<div class="rc-chart-body rc-chart-body-tall"><canvas id="prof-chart-type" height="280"></canvas></div>'
    + '</div>';
  // Ranking lateral de la dona (G3): todas las facultades por total desc.
  var s3 = _profSeries();
  var facFullMap = {};
  AppData.getFacultades().forEach(function(f){ facFullMap[short(f.name)] = f.name; });
  var rankHtml = s3.rank.map(function(f){
    var dotCol = _PROF_FAC_COLORS[s3.labels.indexOf(f.n) % _PROF_FAC_COLORS.length];
    var full = facFullMap[f.n] || f.n;
    return '<div class="rc-rank-row" role="button" tabindex="0" data-action="prof-show-detail" data-filter="fac|'+esc(full)+'">'
      + '<span class="rc-rank-dot" style="background:'+dotCol+'"></span>'
      + '<span class="rc-rank-name">'+esc(f.n)+'</span>'
      + '<span class="rc-rank-num">'+f.t+'</span>'
      + '<span class="rc-rank-pct">'+f.p.toFixed(1)+'%</span>'
      + '</div>';
  }).join('');
  h += '<div class="rc-chart-card rc-chart-card-dona">'
    + '<div class="rc-chart-head">Distribución de líneas de profundización por Facultad</div>'
    + '<div class="rc-chart-sub">Participación sobre el total de líneas</div>'
    + '<div class="rc-chart-body rc-chart-body-dona">'
    + '<div class="rc-dona-col">'
    + '<div class="rc-doughnut-center"><div class="rc-doughnut-center-v" id="prof-dona-total"></div><div class="rc-doughnut-center-l" id="prof-dona-label">Líneas de profundización</div></div>'
    + '<canvas id="prof-chart-dona" height="200"></canvas>'
    + '</div>'
    + '<div class="rc-rank-col">'
    + '<div class="rc-rank-head"><span>Facultad</span><span>Cant.</span><span>Part.</span></div>'
    + rankHtml
    + '</div>'
    + '</div>'
    + '</div>';
  h += '</div>';

  // tarjetas por facultad (2 categorías clickeables)
  h += '<div class="rc-grid">';
  rc.perFac.forEach(function(f){
    h += '<div class="rc-card">'
      + '<div class="rc-card-head"><span class="rc-card-name">'+esc(short(f.fac.name))+'</span>'
      + '<span class="rc-card-total">Total <b>'+f.total+'</b></span></div>'
      + '<div class="rc-card-body">'
      + '<div role="button" tabindex="0" data-action="rc-show-detail" data-filter="fac-con:'+esc(f.fac.name)+'" class="rc-tile rc-tile-con"><span class="rc-tile-label"><span class="rc-dot"></span>Registro Calificado</span><span class="rc-tile-num">'+f.conRC+'</span></div>'
      + '<div role="button" tabindex="0" data-action="rc-show-detail" data-filter="fac-sin:'+esc(f.fac.name)+'" class="rc-tile rc-tile-sin"><span class="rc-tile-label"><span class="rc-dot"></span>Proyectada</span><span class="rc-tile-num">'+f.sinRC+'</span></div>'
      + '</div></div>';
  });
  h += '</div>';
  h += '</div>';
  return h;
};

/**
 * Inicializa las 3 visualizaciones Chart.js de LÍNEAS DE PROFUNDIZACIÓN.
 * DEBE ejecutarse DESPUÉS de asignar wrap.innerHTML=h (patrón snies.js):
 * las gráficas se crean con requestAnimationFrame, destruyendo primero toda
 * instancia previa (Chart.getChart(id)?.destroy()).
 * Usa _profSeries() → AppData.getFacultades() → window.DB en el momento (dinámico).
 * Si Chart.js no está disponible, no hace nada (no rompe el indicador).
 */
var renderProfCharts = function(){
  if(typeof Chart !== 'function' || typeof requestAnimationFrame !== 'function') return;
  var canvasIds = ['prof-chart-total','prof-chart-type','prof-chart-dona'];
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

    // ── G3: Dona — participación de líneas por Facultad (7 facultades).
    //        Total 52 + etiqueta en el centro; ranking lateral HTML con los mismos colores.
    var donaTotalEl = document.getElementById('prof-dona-total');
    if(donaTotalEl) donaTotalEl.textContent = String(s.total);

    destroy('prof-chart-dona');
    new Chart(document.getElementById('prof-chart-dona'), {
      type: 'doughnut',
      data: {
        labels: s.labels,
        datasets:[{ data:s.facTotals, backgroundColor: s.labels.map(function(nm, i){ return _PROF_FAC_COLORS[i % _PROF_FAC_COLORS.length]; }),
          borderColor:'#fff', borderWidth:3, hoverOffset:6
        }]
      },
      options: {
        responsive:true, maintainAspectRatio:false, cutout:'72%',
        layout:{ padding:{ top:6, bottom:6, left:4, right:4 } },
        onClick: function(evt, els){
          if(!els || !els.length) return;
          var lab = s.labels[els[0].index];
          openFac(lab);
        },
        plugins:{
          legend:{ display:false },
          tooltip:{ callbacks:{ label:function(ctx){
            return ctx.label+': '+ctx.parsed+' línea(s) (' + (s.facPct[ctx.dataIndex]||0).toFixed(1) + '% del total)';
          } } },
          datalabels:{ color:'#fff', font:{ weight:'900', size:11.5 }, textAlign:'center',
            formatter:function(v, ctx){
              if(v <= 0) return '';
              var p = s.facPct[ctx.dataIndex]||0;
              return (p >= 6) ? (p).toFixed(0)+'%' : '';
            } }
        }
      }
    });
  });
};

/**
 * Construye y muestra el modal de detalle de Registo Calificado según un filtro.
 * Los filtros permitidos: 'proy-sin' (global), 'fac-con', 'fac-sin',
 * 'fac-vig-con', 'fac-vig-sin', 'fac-proy-con', 'fac-proy-sin' con sufijo ':'+facultad.
 * Recalcula el detalle desde window.DB en el momento (dinámico).
 * @param {string} filter - clave de filtro
 */
var renderIndicadorRCDetalle = function(filter){
  var overlay = document.getElementById('rc-detail-overlay');
  if(overlay && overlay.parentNode) document.body.removeChild(overlay);

  var list = [];
  AppData.getFacultades().forEach(function(fac){
    (fac.progs||[]).forEach(function(p){
      (p.lineas||[]).forEach(function(l){
        var rc = _rcHasLink(l.enlaceObtencion);
        var v = l.o === 'V', proy = l.o === 'P';
        var ok = false;
        var kind = (filter||'').split(':')[0];
        var facMatch = (filter||'').split(':')[1] || '';
        if(facMatch && fac.name !== facMatch) return;
        if(kind === 'fac-con' && rc) ok = true;
        else if(kind === 'fac-sin' && !rc) ok = true;
        if(ok){
          list.push({
            fac: fac.name, prog: p.n, linea: l.l||'', esp: l.esp||'',
            oferta: v ? 'Vigente' : 'Proyectada', estado: l.e||'',
            link: rc ? l.enlaceObtencion.trim() : ''
          });
        }
      });
    });
  });

  var title = 'Detalle de Registro Calificado';
  var kindLabel = {
    'fac-con':'Registro Calificado', 'fac-sin':'Proyectada'
  }[filter && filter.split(':')[0]] || '';
  var sub = kindLabel ? (' — ' + kindLabel + (filter && filter.split(':')[1] ? ' — ' + filter.split(':')[1] : '')) : '';

  var rows = list.map(function(r, i){
    var link = r.link ? '<a href="'+esc(r.link)+'" target="_blank" rel="noopener noreferrer" class="rc-link">Ver link</a>' : '<span class="rc-nolink">Sin Registro Calificado</span>';
    return '<tr>'
      + '<td class="rc-txt-green">'+esc(r.fac)+'</td>'
      + '<td>'+esc(r.prog)+'</td>'
      + '<td>'+esc(r.linea)+'</td>'
      + '<td>'+esc(r.esp)+'</td>'
      + '<td class="rc-th-c">'+esc(r.oferta)+'</td>'
      + '<td>'+esc(r.estado)+'</td>'
      + '<td class="rc-th-c">'+link+'</td>'
      + '</tr>';
  }).join('');

  var note = '<div class="rc-note">La categoría \'Proyectada\' corresponde a líneas sin Registro Calificado dentro de este indicador.</div>';

  var html = '<div id="rc-detail-overlay" class="rc-overlay">'
    + '<div class="modal rc-modal">'
    + '<div class="modal-title"><span>🔍</span><span>'+esc(title)+'<span class="rc-modal-sub">'+esc(sub)+'</span></span>'
    + '<button data-action="rc-close-detail" class="rc-close" title="Cerrar">×</button></div>'
    + '<div class="rc-modal-body">'
    + '<div class="rc-count"><b>'+list.length+'</b> línea(s)</div>'
    + note
    + '<div class="tbl-wrap"><table class="tbl rc-detail-tbl">'
    + '<thead><tr>'
    + '<th>Facultad</th><th>Programa</th>'
    + '<th>Línea</th><th>Especialización</th>'
    + '<th>Oferta</th><th>Estado</th>'
    + '<th>Link Registro Calificado</th></tr></thead><tbody>'
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
 * @param {string|null} facName - nombre completo de facultad (null/'' = todas)
 * @param {string|null} tipo - 'Profundización 1|2|3' | 'Sin línea de profundización' (null/'Todas' = todas)
 * @returns {{rows:Array, total:number}}
 */
var _profDetailRows = function(facName, tipo){
  var rows = [], total = 0;
  var wantFac = (facName !== null && typeof facName !== 'undefined') ? String(facName).trim() : '';
  var wantTipo = (tipo === null || typeof tipo === 'undefined' || tipo === 'Todas') ? '' : String(tipo).trim();
  AppData.getFacultades().forEach(function(fac){
    if(wantFac !== '' && fac.name !== wantFac) return;
    (fac.progs||[]).forEach(function(p){
      (p.lineas||[]).forEach(function(l){
        var t = _profTypeOf(l);
        if(wantTipo !== '' && wantTipo !== t) return;
        total++;
        rows.push({ fac: fac.name, prog: p.n||'', esp: l.esp||'', linea: l.l||'', tipo: t });
      });
    });
  });
  return { rows: rows, total: total };
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
        + '<td class="rc-txt-green">'+esc(r.fac)+'</td>'
        + '<td>'+esc(r.prog)+'</td>'
        + '<td>'+esc(r.esp)+'</td>'
        + '<td>'+esc(r.linea)+'</td>'
        + '<td class="rc-th-c">'+esc(r.tipo)+'</td>'
        + '</tr>';
    }).join('');
  }

  var html = '<div id="prof-detail-overlay" class="rc-overlay">'
    + '<div class="modal rc-modal">'
    + '<div class="modal-title"><span>🔍</span><span>Detalle de Líneas de Profundización<span class="rc-modal-sub">'+esc(subTxt)+'</span></span>'
    + '<button data-action="prof-close-detail" class="rc-close" title="Cerrar">×</button></div>'
    + '<div class="rc-modal-body">'
    + '<div class="rc-count"><b>'+data.total+'</b> línea(s) · <b>'+pct.toFixed(1)+'%</b> sobre el total</div>'
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
  if(count) count.innerHTML = '<b>'+data.total+'</b> línea(s) · <b>'+pct.toFixed(1)+'%</b> sobre el total';
  var tbody = overlay.querySelector('.rc-detail-tbl tbody');
  if(tbody){
    tbody.innerHTML = data.rows.map(function(r){
      return '<tr>'
        + '<td class="rc-txt-green">'+esc(r.fac)+'</td>'
        + '<td>'+esc(r.prog)+'</td>'
        + '<td>'+esc(r.esp)+'</td>'
        + '<td>'+esc(r.linea)+'</td>'
        + '<td class="rc-th-c">'+esc(r.tipo)+'</td>'
        + '</tr>';
    }).join('');
  }
  var active = (tipo || 'Todas');
  var chips = overlay.querySelectorAll('.rc-filter-chip');
  if(chips && chips.forEach) chips.forEach(function(c){ c.classList.toggle('on', c.getAttribute('data-tipo') === active); });
};

// exportado via window.App (app.js)
