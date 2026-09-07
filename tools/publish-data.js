#!/usr/bin/env node
/**
 * publish-data.js — Publica un snapshot (backup JSON) como datos base
 * ---
 * Reproducible para futuras publicaciones. Convierte el estado actual de un
 * navegador (backup JSON v2) en la BASE OFICIAL del repositorio, manteniendo
 * localStorage como capa de trabajo por navegador.
 *
 * Uso:
 *   node tools/publish-data.js "ruta/al/backup.json"
 *
 * Proceso:
 *   1. Valida el snapshot ANTES de escribir (estructura, version:2, IDs únicos,
 *      rutas huérfanas, presencia de DB/LR/SNIES/sedes/RC).
 *   2. Convierte backup.db    -> window.__DEFAULT_DATA (default-data.js)
 *      y backup.learningRoutes-> window.__LEARNING_ROUTES (learning-routes.js),
 *      soltando la envoltura 'ALL' para que data/learning-routes.js derive
 *      __LEARNING_ROUTES_BASE_V2 reproducirlo exactamente.
 *   3. Preserva TODOS los IDs, relaciones, nombres, campos y valores.
 *      No renombra propiedades ni normaliza datos.
 *   4. Solo toca los archivos de datos base (default-data.js, learning-routes.js).
 *      NO modifica lógica de aplicación (storage.js, CRUD, vistas, controladores,
 *      SNIES/sedes/RC, estructura de datos).
 *   5. Escribe en pretty-print con saltos CRLF (convención del repo).
 *
 * No incluye el backup JSON personal en el repositorio: la entrada vive fuera
 * del repo (p. ej. ~/Downloads) y aquí solo se lee.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_DATA_PATH = path.join(ROOT, 'assets', 'js', 'data', 'default-data.js');
const LEARNING_ROUTES_PATH = path.join(ROOT, 'assets', 'js', 'data', 'learning-routes.js');

const CRLF = '\r\n';
const OPEN_DD = 'window.__DEFAULT_DATA = ';
const OPEN_LR = 'window.__LEARNING_ROUTES = ';

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function die(msg) {
  console.error('FAIL — ' + msg);
  process.exit(1);
}

function toCRLF(text) {
  return text.replace(/\r?\n/g, CRLF);
}

function pp(obj) {
  return JSON.stringify(obj, null, 2);
}

// ---------------------------------------------------------------------------
// Lectura y validación del snapshot
// ---------------------------------------------------------------------------
function loadSnapshot(argv) {
  const p = argv[2];
  if (!p) die('falta la ruta del backup. Uso: node tools/publish-data.js "<backup.json>"');
  if (!fs.existsSync(p)) die('no existe el archivo: ' + p);
  let raw;
  try { raw = fs.readFileSync(p, 'utf8'); }
  catch (e) { die('no se pudo leer ' + p + ': ' + e.message); }
  let data;
  try { data = JSON.parse(raw); }
  catch (e) { die('JSON inválido: ' + e.message); }
  return data;
}

function validateSnapshot(data) {
  const errors = [];

  if (typeof data !== 'object' || data === null) errors.push('el snapshot no es un objeto');
  if (data.version !== 2) errors.push('version debe ser 2 (es: ' + data.version + ')');

  const db = data.db;
  if (!Array.isArray(db) || !db.length) {
    errors.push('db no es un array no vacío');
  } else {
    const seen = new Set();
    db.forEach((f, fi) => {
      if (!f || typeof f !== 'object' || !f.id || !Array.isArray(f.progs)) {
        errors.push('facultad[' + fi + '] malformada (faltan id/progs)');
        return;
      }
      if (f.doc) {
        const k = 'doc:' + f.id;
        if (seen.has(k)) errors.push('ID de doctorado duplicado: ' + k);
        seen.add(k);
      }
      f.progs.forEach((p, pi) => {
        if (!p || typeof p !== 'object' || !p.id) { errors.push('facultad[' + fi + '].progs[' + pi + '] sin id'); return; }
        const pk = 'prog:' + p.id;
        if (seen.has(pk)) errors.push('ID de programa duplicado: ' + pk);
        seen.add(pk);
        (p.lineas || []).forEach(l => {
          if (!l || !l.id) { errors.push('programa ' + p.id + ' tiene línea sin id'); return; }
          const lk = 'lin:' + l.id;
          if (seen.has(lk)) errors.push('ID de línea duplicado: ' + lk);
          seen.add(lk);
        });
        (p.mae || []).forEach(m => {
          if (!m || !m.id) { errors.push('programa ' + p.id + ' tiene maestría sin id'); return; }
          const mk = 'mae:' + m.id;
          if (seen.has(mk)) errors.push('ID de maestría duplicado: ' + mk);
          seen.add(mk);
        });
      });
    });
  }

  const lr = data.learningRoutes;
  if (!lr || typeof lr !== 'object' || Array.isArray(lr)) {
    errors.push('learningRoutes no es un objeto');
  }

  // Integridad mínima de las claves del snapshot
  ['db', 'learningRoutes', 'sniesSD', 'sedesCatalog'].forEach(k => {
    if (!(k in data)) errors.push('falta la clave "' + k + '" en el snapshot');
  });

  return errors;
}

// ---------------------------------------------------------------------------
// Detección de rutas huérfanas
// ---------------------------------------------------------------------------
function detectOrphans(db, lr) {
  // Misma convención de IDs que la app (utils.js:_getAllAcademicPrograms):
  //   doctorado    -> 'doc-' + f.id
  //   maestría     -> m.id
  //   especialización -> l.id
  const progIds = new Set();
  db.forEach(f => {
    if (f.doc) progIds.add('doc-' + f.id);
    f.progs.forEach(p => {
      (p.mae || []).forEach(m => progIds.add(m.id));
      (p.lineas || []).forEach(l => progIds.add(l.id));
    });
  });
  const orphans = Object.keys(lr).filter(k => !progIds.has(k));
  return orphans;
}

// ---------------------------------------------------------------------------
// Extracción de encabezados/colas desde los archivos actuales (fuente de verdad)
// ---------------------------------------------------------------------------
function splitDefaultData(content) {
  const idx = content.indexOf(OPEN_DD);
  if (idx < 0) die('default-data.js no contiene "' + OPEN_DD + '"');
  const header = content.slice(0, idx);        // incluye comentario + apertura
  return { header: header, assignmentPrefix: OPEN_DD };
}

function splitLearningRoutes(content) {
  const idxOpen = content.indexOf(OPEN_LR + '{');
  if (idxOpen < 0) die('learning-routes.js no contiene "' + OPEN_LR + '{"');
  const header = content.slice(0, idxOpen + OPEN_LR.length); // hasta "window.__LEARNING_ROUTES = "
  // encontrar el cierre '};' que cierra el objeto (primera línea exacta '};' tras la apertura)
  const bodyStart = content.indexOf('{', idxOpen + OPEN_LR.length);
  const mark = '};';
  const tailAt = content.indexOf(mark + '\r\n', bodyStart);
  const tailAt2 = tailAt >= 0 ? tailAt : content.indexOf(mark + '\n', bodyStart);
  if (tailAt2 < 0) die('no se encontró el cierre "};" del objeto __LEARNING_ROUTES');
  const tail = content.slice(tailAt2 + mark.length);
  return { header: header, tail: tail };
}

// Convierte el mapa LR a forma plana (soltando envoltura 'ALL')
function unwrapRoutes(lrObj) {
  const out = {};
  Object.keys(lrObj || {}).forEach(k => {
    const r = lrObj[k];
    out[k] = (r && typeof r === 'object' && r.ALL) ? r.ALL : r;
  });
  return out;
}

// ---------------------------------------------------------------------------
// Conteos de auditoría
// ---------------------------------------------------------------------------
function countsDB(db) {
  const c = { facultades: db.length, doctorados: 0, programas: 0, especializaciones: 0, maestrias: 0, uniqueIds: new Set() };
  db.forEach(f => {
    if (f.doc) { c.doctorados++; c.uniqueIds.add('doc:' + f.id); }
    f.progs.forEach(p => {
      c.programas++;
      c.uniqueIds.add('prog:' + p.id);
      (p.lineas || []).forEach(l => { c.especializaciones++; c.uniqueIds.add('lin:' + l.id); });
      (p.mae || []).forEach(m => { c.maestrias++; c.uniqueIds.add('mae:' + m.id); });
    });
  });
  c.uniqueIds = c.uniqueIds.size;
  return c;
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
function main() {
  const data = loadSnapshot(process.argv);
  const errors = validateSnapshot(data);
  if (errors.length) {
    console.error('Validación del snapshot fallida (' + errors.length + '):');
    errors.forEach(e => console.error('  - ' + e));
    process.exit(1);
  }

  // Detectar rutas huérfanas
  const orphans = detectOrphans(data.db, data.learningRoutes || {});
  if (orphans.length) {
    console.error('Validación fallida: ' + orphans.length + ' ruta(s) de aprendizaje sin programa en el DB:');
    orphans.forEach(o => console.error('  - ' + o));
    process.exit(1);
  }

  const dbCounts = countsDB(data.db);
  const lrCounts = { routes: Object.keys(data.learningRoutes || {}).length, orphanRoutes: orphans.length };
  const sniesCounts = {
    programs: (data.sniesSD && data.sniesSD.programs ? data.sniesSD.programs.length : 0),
    resumenYears: (data.sniesSD && data.sniesSD.resumen ? data.sniesSD.resumen.length : 0)
  };
  const sedesCounts = { sedes: Array.isArray(data.sedesCatalog) ? data.sedesCatalog.length : 0 };

  console.log('Snapshot válido ✓');
  console.log('  db   : fac ' + dbCounts.facultades +
    ' · prog ' + dbCounts.programas +
    ' · esp ' + dbCounts.especializaciones +
    ' · mae ' + dbCounts.maestrias +
    ' · doc ' + dbCounts.doctorados +
    ' · ids únicos ' + dbCounts.uniqueIds);
  console.log('  LR   : ' + lrCounts.routes + ' rutas · ' + lrCounts.orphanRoutes + ' huérfanas');
  console.log('  SNIES: ' + sniesCounts.programs + ' programas · ' + sniesCounts.resumenYears + ' años de resumen (fuente: ' + (data.sniesSD && data.sniesSD.source) + ')');
  console.log('  sedes: ' + sedesCounts.sedes);
  console.log('  RC   : rcRaw = ' + (data.rcRaw === null ? 'null (se conserva la base del repo)' : 'presente'));

  // ---- default-data.js ----
  const ddContent = fs.readFileSync(DEFAULT_DATA_PATH, 'utf8');
  const dd = splitDefaultData(ddContent);
  const newDD = toCRLF(
    dd.header + OPEN_DD + pp(data.db) + ';'
  );
  fs.writeFileSync(DEFAULT_DATA_PATH, newDD, 'utf8');
  console.log('✓ default-data.js actualizado');

  // ---- learning-routes.js ----
  const lrContent = fs.readFileSync(LEARNING_ROUTES_PATH, 'utf8');
  const lr = splitLearningRoutes(lrContent);
  const flat = unwrapRoutes(data.learningRoutes || {});
  const newLR = toCRLF(
    lr.header + '{' + CRLF + CRLF +
    pp(flat).replace(/^\{/, '').replace(/\}$/, '').trimEnd() +
    CRLF + '};' + lr.tail
  );
  fs.writeFileSync(LEARNING_ROUTES_PATH, newLR, 'utf8');
  console.log('✓ learning-routes.js actualizado (' + Object.keys(flat).length + ' rutas, envoltura ALL eliminada)');

  console.log('\nListo. Actualiza manualmente data-version.js con la fecha/origen del snapshot si corresponde.');
}

main();
