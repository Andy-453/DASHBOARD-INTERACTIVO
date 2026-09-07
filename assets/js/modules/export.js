/**
 * export.js — Exportaciones y descargas de datos
 * ---
 * Responsabilidad:
 *   - downloadDB: descarga CSV con toda la base de datos (facultades, programas, SNIES)
 *   - exportSNIES: descarga CSV con datos históricos SNIES
 *   - getSniesPreg / getSniesEsp: helpers de búsqueda SNIES para downloadDB
 *   - SNIES_PRE_MAP / SNIES_ESP_MAP: mapas de códigos SNIES (usados por los helpers)
 *
 * Dependencias:
 *   - DB (global, app.js) — datos completos para generar CSV
 *   - SD (global, app.js) — datos SNIES para exportSNIES (solo en call-time)
 *   - toast() (utils.js) — notificación al completar descarga
 *   - Blob, URL.createObjectURL — APIs de navegador para descarga de archivos
 *
 * Compatibilidad legacy:
 *   - window.downloadDB — requerido por onclick="downloadDB()" en HTML (línea 27)
 *   - window.exportSNIES — expuesto para futura integración en panel SNIES
 *
 * Riesgos de acoplamiento:
 *   - Dependencia de estructura DB: si cambia la forma de los objetos,
 *     el CSV generado por downloadDB se desincronizará.
 *   - SNIES_PRE_MAP y SNIES_ESP_MAP deben mantenerse actualizados
 *     con los códigos SNIES reales de la Universidad.
 *   - exportSNIES depende de SD (global), que se define en app.js después
 *     de export.js. Seguro porque solo se ejecuta por evento (click).
 *
 * TODO [MVC]:
 *   - Separar mapas SNIES a un módulo de datos independiente (snies-data.js).
 *   - Migrar downloadDB a generación asíncrona si DB crece significativamente.
 *   - Unificar CSV generation en un helper compartido.
 *
 * Estado:
 *   Extraído de app.js. Sin cambios funcionales.
 */

// ===== MAPAS SNIES =====
const SNIES_PRE_MAP = {
  'INGENIERÍA DE SOFTWARE|SOACHA': '110946',
  'INGENIERÍA DE SOFTWARE|GIRARDOT': '116101',
  'INGENIERIA DE SOFTWARE|GIRARDOT': '116101',
  'INGENIERIA DE SISTEMAS Y COMPUTACION|FUSAGASUGÁ': '109964',
  'INGENIERIA DE SISTEMAS Y COMPUTACION|FACATATIVÁ': '109965',
  'INGENIERÍA DE SISTEMAS Y COMPUTACIÓN|CHÍA': '111350',
  'INGENIERÍA DE SISTEMAS Y COMPUTACIÓN|UBATE': '116385',
  'INGENIERIA ELECTRONICA|FUSAGASUGÁ': '4086',
  'INGENIERIA INDUSTRIAL|SOACHA-CHÍA': '53872',
  'INGENIERÍA MECATRÓNICA|CHÍA': '116851',
  'ADMINISTRACIÓN DE EMPRESAS|FUSAGASUGÁ': '19761',
  'ADMINISTRACIÓN DE EMPRESAS|UBATE': '902',
  'ADMINISTRACIÓN DE EMPRESAS|CHÍA': '19763',
  'ADMINISTRACIÓN DE EMPRESAS|FACATATIVÁ': '19785',
  'ADMINISTRACIÓN DE EMPRESAS|GIRARDOT': '14969',
  'ADMINISTRACIÓN DE EMPRESAS|SOACHA': '117202',
  'CONTADURÍA PÚBLICA|FUSAGASUGÁ': '53714',
  'CONTADURÍA PÚBLICA|SOACHA': '118077',
  'CONTADURÍA PÚBLICA|FACATATIVÁ': '53668',
  'CONTADURÍA PÚBLICA|CHÍA': '53668',
  'CONTADURÍA PÚBLICA|UBATE': '53668',
  'ZOOTECNIA|FUSAGASUGÁ': '889',
  'ZOOTECNIA|UBATE': '889',
  'INGENIERÍA AGRONÓMICA|FUSAGASUGÁ': '1928',
  'INGENIERÍA AGRONÓMICA|FACATATIVÁ': '1928',
  'INGENIERÍA AMBIENTAL|GIRARDOT': '52090',
  'INGENIERÍA AMBIENTAL|FACATATIVÁ': '52090',
  'MEDICINA VETERINARIA Y ZOOTECNIA|UBATE': '117676',
  'INGENIERÍA TOPOGRÁFICA Y GEOMÁTICA|SOACHA': '117898',
  'ENFERMERÍA|GIRARDOT': '898',
  'PSICOLOGÍA|FACATATIVÁ': '90941',
  'LIC. EN EDUCACIÓN FÍSICA, RECREACIÓN Y DEPORTES|FUSAGASUGÁ': '116292',
  'PROFESIONAL EN CIENCIAS DEL DEPORTE|SOACHA': '53776',
  'LIC. EN CIENCIAS SOCIALES|FUSAGASUGÁ': '107037',
  'MÚSICA|ZIPAQUIRÁ': '10528'
};
const SNIES_ESP_MAP = {
  'ESPECIALIZACIÓN EN METODOLOGÍAS DE CALIDAD PARA EL DESARROLLO DEL SOFTWARE': '117580',
  'ESP. EN METODOLOGÍAS DE CALIDAD PARA EL DESARROLLO DEL SOFTWARE': '117580',
  'ESP. EN METODOLOGÍAS DE CALIDAD': '117580',
  'ESPECIALIZACIÓN EN ANALÍTICA Y CIENCIA DE DATOS': '117565',
  'ESP. EN ANALÍTICA Y CIENCIA DE DATOS': '117565',
  'ESPECIALIZACIÓN EN MARKETING DIGITAL': '116654',
  'ESPECIALIZACIÓN EN GESTIÓN PÚBLICA': '116475',
  'ESP. EN GESTIÓN PÚBLICA': '116475',
  'ESPECIALIZACIÓN EN GERENCIA PARA LA TRANSFORMACIÓN DIGITAL': '115949',
  'ESP. GERENCIA PARA LA TRANSFORMACIÓN DIGITAL': '115949',
  'ESPECIALIZACIÓN EN GERENCIA FINANCIERA Y CONTABLE': '117817',
  'ESP. EN GERENCIA FINANCIERA Y CONTABLE': '117817',
  'ESPECIALIZACIÓN EN ANALÍTICA APLICADA A NEGOCIOS': '116876',
  'ESP. EN ANALÍTICA APLICADA A NEGOCIOS': '116876',
  'ESPECIALIZACIÓN EN RECURSOS ZOOGENÉTICOS': '117568',
  'ESP. NUTRICIÓN Y ALIMENTACIÓN ANIMAL ESP. NO CONVENCIONALES': '116370',
  'ESP. NUTRICIÓN Y ALIMENTACIÓN ANIMAL DE ESP. NO CONVENCIONALES': '116370',
  'ESPECIALIZACIÓN EN AGRONEGOCIOS SOSTENIBLES': '116771',
  'ESP. EN AGRONEGOCIOS SOSTENIBLES': '116771',
  'ESP. EN AGROECOLOGÍA Y DESARROLLO AGROECOTURÍSTICO': '116293',
  'ESPECIALIZACIÓN EN AGROECOLOGÍA Y DESARROLLO AGROECOTURÍSTICO': '116293',
  'ESPECIALIZACIÓN EN DEPORTE ESCOLAR': '117263',
  'ESPECIALIZACIÓN EN INFRAESTRUCTURA Y SEGURIDAD DE REDES': '117555',
  'ESP. EN INFRAESTRUCTURA Y SEGURIDAD DE REDES': '117555',
  'ESPECIALIZACIÓN EN INTELIGENCIA ARTIFICIAL': '117675',
  'ESP. EN INTELIGENCIA ARTIFICIAL': '117675',
  'ESPECIALIZACIÓN EN GESTIÓN Y DESARROLLO DE LA ACTIVIDAD FÍSICA Y EL DEPORTE': '118279',
  'ESP. EN GESTIÓN Y DESARROLLO DE LA ACTIVIDAD FÍSICA Y EL DEPORTE': '118279',
  'ESPECIALIZACIÓN EN LOGÍSTICA Y OPERACIONES': 'NO APLICA',
  'ESP. EN LOGÍSTICA Y OPERACIONES': 'NO APLICA',
  'ESPECIALIZACIÓN EN LOGÍSTICA Y COMERCIO INTERNACIONAL': 'NO APLICA',
  'ESP. EN LOGÍSTICA Y COMERCIO INTERNACIONAL': 'NO APLICA',
  'ESPECIALIZACIÓN EN GERENCIA FINANCIERA Y DIAGNÓSTICO ESTRATÉGICO': 'NO APLICA',
  'ESP. EN GERENCIA FINANCIERA Y DIAGNÓSTICO ESTRATÉGICO': 'NO APLICA',
  'ESPECIALIZACIÓN EN GESTIÓN TRIBUTARIA': 'NO APLICA',
  'ESPECIALIZACIÓN EN ACTIVIDAD FÍSICA Y DISCAPACIDAD': 'NO APLICA',
  'ESP. EN ACTIVIDAD FÍSICA Y DISCAPACIDAD': 'NO APLICA',
  'ESPECIALIZACIÓN EN ENTRENAMIENTO DEPORTIVO': 'NO APLICA',
  'ESP. EN ENTRENAMIENTO DEPORTIVO': 'NO APLICA',
  'ESPECIALIZACIÓN EN GESTIÓN DEL RECURSO HÍDRICO': 'NO APLICA',
  'ESP. EN GESTIÓN DEL RECURSO HÍDRICO': 'NO APLICA',
  'ESP. EN GESTIÓN DEL RIESGO DE DESASTRES Y PLANIFICACIÓN AMBIENTAL DEL TERRITORIO': 'NO APLICA',
  'ESP. EN GESTIÓN DE LA CALIDAD DEL RECURSO AIRE': 'NO APLICA',
  'ESPECIALIZACIÓN EN SANIDAD DE ANIMALES SILVESTRES': 'NO APLICA',
  'ESP. EN SANIDAD DE ANIMALES SILVESTRES': 'NO APLICA',
  'ESP. EN TÉCNICAS DE REPRODUCCIÓN ANIMAL ASISTIDA': 'NO APLICA',
  'ESPECIALIZACIÓN EN CIENCIA DE GEO-DATOS': 'NO APLICA',
  'ESP. EN CIENCIA DE GEO-DATOS': 'NO APLICA',
  'ESP. EN TOPOGRAFÍA AVANZADA CON FINES CATASTRALES': 'NO APLICA',
  'ESPECIALIZACIÓN EN SALUD MENTAL COMUNITARIA': 'NO APLICA',
  'ESP. EN SALUD MENTAL Y COMUNITARIA': 'NO APLICA',
  'ESP. GERENCIA DE LA CALIDAD E INNOVACIÓN EN SALUD': 'NO APLICA',
  'ESPECIALIZACIÓN EN INTERVENCIÓN PSICOSOCIAL': 'NO APLICA',
  'ESP. EN INTERVENCIÓN PSICOSOCIAL': 'NO APLICA',
  'ESPECIALIZACIÓN EN PSICOMETRÍA Y MEDICIÓN PSICOLÓGICA': 'NO APLICA',
  'ESP. EN PSICOMETRÍA Y MEDICIÓN PSICOLÓGICA': 'NO APLICA',
  'ESP. EN EDUCACIÓN, RURALIDADES Y DERECHOS HUMANOS': 'NO APLICA',
  'ESP. EN CIENCIAS SOCIALES, REGIÓN Y TERRITORIO': 'NO APLICA',
  'ESP. PARA LÍNEA DE PROFUNDIZACIÓN EN DIRECCIÓN MUSICAL': 'NO APLICA',
  'ESP. PARA LÍNEA DE PROFUNDIZACIÓN EN PRODUCCIÓN MUSICAL': 'NO APLICA',
  'ESP. TRANSFORMACIÓN E INNOVACIÓN DE PRODUCTOS LÁCTEOS Y CÁRNICOS': 'NO APLICA',
  'ESP. HERRAMIENTAS BIOTECNOLÓGICAS PARA LA PRODUCCIÓN ANIMAL': 'NO APLICA',
  'ESP. EN AUTOMATIZACIÓN INDUSTRIAL': 'NO APLICA',
  'ESPECIALIZACIÓN EN AUTOMATIZACIÓN INDUSTRIAL': 'NO APLICA',
  'ESP. EN SOLUCIÓN ENERGÉTICAS SOSTENIBLES': 'NO APLICA',
  'ESPECIALIZACIÓN EN SEGURIDAD DE LA INFORMACIÓN': 'NO APLICA',
  'ESP. EN SEGURIDAD DE LA INFORMACIÓN': 'NO APLICA',
  'ESPECIALIZACIÓN EN GESTIÓN AMBIENTAL PARA EL DESARROLLO SOSTENIBLE': 'NO APLICA',
  'MAESTRÍA EN GESTIÓN AMBIENTAL PARA EL DESARROLLO SOSTENIBLE': 'NO APLICA'
};

function getSniesPreg(nombre, sedes){
  for(const s of (sedes||[])) {
    const k=(nombre.toUpperCase()+'|'+s.toUpperCase());
    if(SNIES_PRE_MAP[k]) return SNIES_PRE_MAP[k];
  }
  const prefix=nombre.toUpperCase()+'|';
  for(const [k,v] of Object.entries(SNIES_PRE_MAP)) if(k.startsWith(prefix)) return v;
  return '';
}

function getSniesEsp(esp){
  if(!esp) return '';
  const k=esp.toUpperCase().trim();
  return SNIES_ESP_MAP[k]||'';
}

function defuseCSV(s){return s[0]==='='||s[0]==='+'||s[0]==='-'||s[0]==='@'?'\t'+s:s;}

// ===== DESCARGA DE BD =====
function downloadDB(){
  const headers = [
    'Facultad',
    'SNIES Pregrado',
    'Programa de Pregrado',
    'Sede(s) Pregrado',
    'Tipo de Oferta',
    'Nivel',
    'SNIES Posgrado',
    'Nombre del Programa de Posgrado',
    'Línea de Profundización',
    'Tipo Línea',
    'Especialización',
    'Estado',
    'Sede(s) Programa',
    'Doctorado Facultad',
    'Estado Doctorado',
    'Tipo de Maestría'
  ];
  const rows = [headers];

  AppData.getFacultades().forEach(fac => {
    fac.progs.forEach(p => {
      const sniesPre = getSniesPreg(p.n, p.sedes);

      p.lineas.forEach(l => {
        const sniesEsp = getSniesEsp(l.esp);
        rows.push([
          fac.name,
          sniesPre,
          p.n,
          p.sedes.join(' | '),
          l.o === 'V' ? 'Oferta Vigente' : 'Oferta Proyectada',
          'Especialización',
          sniesEsp,
          l.esp,
          l.l,
          l.t,
          l.esp,
          l.e || '',
          l.sedes.join(' | '),
          fac.doc ? fac.doc.n : '',
          fac.doc ? fac.doc.e : '',
          ''
        ]);
      });

      p.mae.forEach(m => {
        rows.push([
          fac.name,
          sniesPre,
          p.n,
          p.sedes.join(' | '),
          m.o === 'V' ? 'Oferta Vigente' : 'Oferta Proyectada',
          'Maestría',
          '',
          m.n,
          '',
          '',
          '',
          m.e || '',
          m.sedes.join(' | '),
          fac.doc ? fac.doc.n : '',
          fac.doc ? fac.doc.e : '',
          m.tipo || ''
        ]);
      });

      if(!p.lineas.length && !p.mae.length){
        rows.push([
          fac.name, sniesPre, p.n, p.sedes.join(' | '),
          '', '', '', '', '', '', '', '', '',
          fac.doc ? fac.doc.n : '', fac.doc ? fac.doc.e : '', ''
        ]);
      }
    });

    if(fac.doc){
      rows.push([
        fac.name, '', 'Todos los pregrados', fac.doc.sedes.join(' | '),
        fac.doc.o === 'V' ? 'Oferta Vigente' : 'Oferta Proyectada',
        'Doctorado', '', fac.doc.n, '', '', '', fac.doc.e || '',
        fac.doc.sedes.join(' | '), fac.doc.n, fac.doc.e || '', ''
      ]);
    }
  });

  const bom = '\uFEFF';
  const csv = bom + rows.map(r =>
    r.map(cell => {
      const s = defuseCSV(String(cell ?? '')).replace(/"/g, '""');
      return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s;
    }).join(',')
  ).join('\n');

  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Base_Datos_Rutas_Formacion_UdeCundinamarca.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Base de datos descargada con códigos SNIES');
}

// ===== EXPORTAR SNIES =====
function exportSNIES(){
  var rows=[['Programa','Nivel','Año','Inscritos','Admitidos','Matriculados','Graduados','T.Absorcion','T.Selectividad','T.Graduacion','%H','%M']];
  SD.programs.forEach(function(p){[2020,2021,2022,2023,2024].forEach(function(y){var d=p.years[String(y)];rows.push([p.name,p.nivel,y,d.ins,d.adm,d.mat,d.grad,d.tabs,d.tsel,d.tgrad,d.pctH,d.pctM]);});});
  var csv='\ufeff'+rows.map(function(r){return r.map(function(v){var s=defuseCSV(String(v==null?'':v)).replace(/"/g,'""');return s.includes(',')||s.includes('\n')||s.includes('"')? '"'+s+'"':s;}).join(',');}).join('\n');
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));a.download='SNIES_UDEC.csv';document.body.appendChild(a);a.click();document.body.removeChild(a);
}

// ===== EXPORTAR RUTAS DE APRENDIZAJE A EXCEL =====
function exportLearningRoutesExcel(){
  if(typeof XLSX==='undefined'){toast('Librería XLSX no disponible');return;}
  var lr=window.__LEARNING_ROUTES||{};
  var keys=Object.keys(lr);
  if(!keys.length){toast('No hay rutas de aprendizaje para exportar');return;}

  var lookup={};
  AppData.getFacultades().forEach(function(f){
    f.progs.forEach(function(p){
      (p.lineas||[]).forEach(function(l){lookup[l.id]={facName:f.name,progName:p.n,lineaName:l.l,o:l.o};});
      (p.mae||[]).forEach(function(m){lookup[m.id]={facName:f.name,progName:p.n,lineaName:'',o:m.o};});
    });
    if(f.doc){lookup['doc-'+f.id]={facName:f.name,progName:'',lineaName:'',o:f.doc.o};}
  });

  var ofertaLabel=function(o){return o==='V'?'Vigente':o==='P'?'Proyectada':'';};
  var sedeLabel=function(s){return s==='ALL'?'Todas las sedes':s;};
  var typeLabel=function(t){var m={especializacion:'Especialización',maestria:'Maestría',doctorado:'Doctorado'};return m[t]||t||'Programa';};

  var rows=[['Facultad','Programa de Pregrado','Tipo de Programa','Especialización / Maestría / Doctorado','Línea de Profundización','Sede','Estado de Oferta','Semestre #','Nombre Semestre','Tipo Semestre','CADI','Créditos','Homologa','CADI Homologado','Versión Asignatura','URL Recurso','Versión Ruta','Créditos Totales Ruta','ID Ruta']];

  keys.forEach(function(espId){
    var sedeMap=lr[espId];
    if(!sedeMap||typeof sedeMap!=='object')return;
    var ctx=lookup[espId]||{facName:'',progName:'',lineaName:'',o:''};

    Object.keys(sedeMap).forEach(function(sedeKey){
      var route=sedeMap[sedeKey];
      if(!route||!Array.isArray(route.semesters))return;

      (route.semesters||[]).forEach(function(sem,si){
        (sem.subjects||[]).forEach(function(subj){
          rows.push([
            ctx.facName,
            ctx.progName,
            typeLabel(route.type),
            route.espName||'',
            ctx.lineaName,
            sedeLabel(sedeKey),
            ofertaLabel(ctx.o),
            si+1,
            sem.title||'',
            sem.type||'',
            subj.title||'',
            subj.credits||0,
            subj.homologa?'Sí':'No',
            (subj.homo&&subj.homo.materia)||'',
            subj.version||'',
            subj.resourceUrl||'',
            route.version||'',
            route.credits||0,
            route.id||''
          ]);
        });
      });
    });
  });

  var ws=XLSX.utils.aoa_to_sheet(rows);
  var colWidths=rows[0].map(function(_,ci){var max=rows[0][ci].length;for(var ri=1;ri<rows.length;ri++){var v=String(rows[ri][ci]||'');if(v.length>max)max=v.length;}return{wch:Math.min(max+2,50)};});
  ws['!cols']=colWidths;
  var wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Rutas de Aprendizaje');
  var now=new Date();
  var fecha=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  XLSX.writeFile(wb,'Rutas_Aprendizaje_UdeC_'+fecha+'.xlsx');
  toast('Rutas de aprendizaje exportadas: '+keys.length+' programa(s), '+(rows.length-1)+' fila(s)');
}

// exportado via window.App (app.js)
