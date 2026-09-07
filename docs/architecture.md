# Análisis Arquitectónico — Dashboard UDEC Posgrados

> **Hito**: 2026-08-20 — Security hardening C1–C9 completado. Arquitectura modular (views/controllers/models/data) estable. Tablero RC standalone integrado.
> Pendiente: migrar storage.js/embed.js a AppData (Fase 5).

## 1. Resumen del sistema

Aplicación web monolítica embebida (single-file HTML + JS modularizado) para la gestión y visualización de la oferta de posgrados de la Universidad de Cundinamarca. Opera completamente en el cliente (navegador) con persistencia en localStorage y exportación a CSV/HTML.

### Stack técnico
- Sin framework — JavaScript plano (ES5/ES6 híbrido)
- Chart.js 4.4.1 (CDN) para gráficos SNIES
- SVG inline para gráficos de indicadores
- localStorage para persistencia
- Single-file HTML con datos embebidos (`DEFAULT_DATA` en `data/default-data.js`)

### Archivos del proyecto

| Archivo | Líneas | Rol |
|---|---|---|---|
| `Dashboard_UDEC_Posgrados_2026-04-23.html` | 1207 | Shell HTML + datos embebidos serializados |
| `assets/js/app.js` | 97 | Orquestador: init, window.App, bootstrap |
| **modules/** | | |
| `modules/utils.js` | 253 | Utilidades base (esc, getSt, ST_MAP, toast, showConfirm, _getLearningRoute, _lrMakeId, _getAllAcademicPrograms, getOrphanRoutes) |
| `modules/embed.js` | 174 | Runtime embedding para export HTML standalone |
| `modules/storage.js` | 209 | Persistencia (saveDB, loadDB, downloadHTML, resetDB, backupDB, restoreDB) |
| `modules/filters.js` | 70 | Filtros (sedeMatch, ofertaMatch, estadoMatch, itemMatch, applyFilters) |
| `modules/dashboard.js` | 52 | KPIs y barra de facultades (renderKPIs, renderFacBar, selFac) |
| `modules/indicators.js` | 350 | Panel de indicadores (renderIndicadores, EST_COLORS) |
| `modules/export.js` | 264 | Exportaciones CSV/SNIES (downloadDB, exportSNIES) |
| `modules/snies-loader.js` | 234 | Carga/importación SNIES desde localStorage + Excel |
| `modules/rc-utils.js` | 42 | Utilidades del módulo Registro Calificado |
| **views/** | | |
| `views/tree.js` | 286 | Renderizado del árbol jerárquico |
| `views/rc-view.js` | 294 | Vistas del módulo Registro Calificado |
| `views/editor.js` | 523 | Editor de programas + rutas de aprendizaje |
| `views/pipeline.js` | 144 | Pipeline de estados |
| `views/snies.js` | 125 | Panel SNIES con Chart.js |
| `views/learning-route.js` | 110 | Modal de ruta de aprendizaje |
| `views/sedes-mgr.js` | 108 | Gestor de catálogo de sedes |
| `views/prog-form.js` | 67 | Formulario de programa |
| `views/sede-view.js` | 48 | Vista por sede |
| `views/tabla.js` | 41 | Tabla resumen |
| `views/rc.js` | 150 | Controlador del módulo RC |
| `views/rc-standalone.js` | 16 | Bootstrap tablero RC standalone |
| **controllers/** | | |
| `controllers/navigation.js` | 69 | Navegación central (showTab, renderViews, snSetFac, snSetProg) |
| `controllers/actions.js` | 154 | Dispatcher de acciones (data-action handlers) |
| **models/** | | |
| `models/app-state.js` | 84 | Estado centralizado (AppState) |
| `models/learning-routes.js` | 138 | Modelo de rutas de aprendizaje (load, save, restore, backup) |
| `models/snies-model.js` | 188 | Modelo SNIES (validate, build, compute) |
| `models/rc-model.js` | 45 | Modelo Registro Calificado |
| **data/** | | |
| `data/app-data.js` | 196 | Capa de acceso a datos (AppData) |
| `data/default-data.js` | 15 | Datos por defecto (window.__DEFAULT_DATA) |
| `data/learning-routes.js` | 652 | Rutas de aprendizaje institucionales (18 rutas) |
| `data/rc-data.js` | 3 | Datos base Registro Calificado |

**Total: ~5201 líneas JS, 32 archivos (10 modules + 12 views + 2 controllers + 4 models + 4 data)**

### Orden de carga
```
Chart.js (CDN) → utils.js → embed.js → storage.js → models/app-state.js
→ data/app-data.js → data/default-data.js → data/learning-routes.js
→ modules/filters.js → modules/dashboard.js → modules/indicators.js
→ modules/export.js → modules/snies-loader.js
→ views/tree.js → views/tabla.js → views/sede-view.js → views/editor.js
→ views/pipeline.js → views/snies.js → views/learning-route.js
→ views/sedes-mgr.js → views/rc-view.js → views/rc.js → views/rc-standalone.js
→ controllers/navigation.js → controllers/actions.js → app.js
```

---

## 2. Mapa de estado global actual

### 2.1. Variables globales (`var` en ventana global)

| Variable | Tipo | Define en | Modificado por | Consumido por | Acoplamiento | Riesgo |
|---|---|---|---|---|---|---|
| `DB` | `Array` | app.js:42 | storage.js (loadDB), app.js (editor CRUD), dashboard.js (selFac) | TODOS los módulos | **CRÍTICO** — 15+ consumidores | ALTO |
| `DEFAULT_DATA` | `Array` | data/default-data.js (window.__DEFAULT_DATA) | downloadHTML (reescritura en descarga) | storage.js (loadDB) | BAJO | BAJO |
| `ALL_SEDES` | `Array` | app.js:29 | Nunca | filters.js (populateSedes) | BAJO | BAJO |
| `curFac` | `Number` | app.js:31 | dashboard.js (selFac), app.js (deleteFac, saveFac, saveNewFac) | filters.js, dashboard.js, app.js (tree, tabla, editor, pipeline) | **ALTO** — 10+ referencias | ALTO |
| `filtSede` | `String` | app.js:31 | filters.js (applyFilters, resetFilters, populateSedes) | filters.js (sedeMatch), app.js (tree vía itemMatch) | MEDIO | MEDIO |
| `filtOferta` | `String` | app.js:31 | filters.js (applyFilters, resetFilters) | filters.js (ofertaMatch) | BAJO | BAJO |
| `filtEstado` | `String` | app.js:31 | filters.js (applyFilters, resetFilters) | filters.js (estadoMatch) | BAJO | BAJO |
| `filtNivel` | `String` | app.js:31 | filters.js (applyFilters, resetFilters) | filters.js (nivelMatch) | BAJO | BAJO |
| `filtPregrado` | `String` | app.js:31 | filters.js (applyFilters, resetFilters, populateSedes) | filters.js (pregradoMatch) | MEDIO | MEDIO |
| `editingProgId` | `String|null` | app.js:34 (getter/setter) | **MIGRADO** → `AppState.editor.editingProgId` | app.js (renderProgForm) | ✅ legacy alias | ✅ |
| `tmpLineas` | `Array` | app.js:35 (getter/setter) | **MIGRADO** → `AppState.editor.tmpLineas` | app.js (renderProgForm, saveProg) | ✅ legacy alias | ✅ |
| `tmpMaes` | `Array` | app.js:36 (getter/setter) | **MIGRADO** → `AppState.editor.tmpMaes` | app.js (renderProgForm, saveProg) | ✅ legacy alias | ✅ |
| `SD` | `Object` | app.js:579 (getter/setter) | **MIGRADO** → `AppState.snies.SD` | app.js (renderSNIES), export.js (exportSNIES) | ✅ legacy alias | ✅ |
| `_snFac` | `String` | app.js:581 (getter/setter) | **MIGRADO** → `AppState.snies.fac` | app.js (renderSNIES) | ✅ legacy alias | ✅ |
| `_snProg` | `String` | app.js:582 (getter/setter) | **MIGRADO** → `AppState.snies.prog` | app.js (renderSNIES) | ✅ legacy alias | ✅ |
| `ST_MAP` | `Object` | modules/utils.js:18 | Nunca (solo lectura) | utils.js (getSt) | BAJO | BAJO |
| `__UDEC_EMBEDDED__` | `Boolean` | app.js:24 | Nunca | storage.js (loadDB) | BAJO | BAJO |

### 2.2. Estado global mutable — Mapa de dependencias

```
                    ┌─────────────┐
                    │     DB      │ ← JSON de datos completo (facultades, programas)
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────────┐
          ▼                ▼                    ▼
    filters.js       dashboard.js          app.js
    (populateSedes)  (renderKPIs,    (tree, tabla, sedeView,
                       renderFacBar)    editor, pipeline)
          │                │                    │
          └────────────────┼────────────────────┘
                           ▼
                    ┌─────────────┐
                    │   curFac    │ ← índice de facultad activa
                    └─────────────┘
                           │
          ┌────────────────┼────────────────────┐
          ▼                ▼                    ▼
    filters.js       dashboard.js          app.js
    (sedeMatch)      (selFac,        (tree, tabla, editor,
                     renderFacBar)     pipeline, progForm)

                    ┌─────────────┐
                    │  filtros*   │ ← 5 flags: sede, oferta, estado, nivel, pregrado
                    └─────────────┘
                           │
          ┌────────────────┘
          ▼
    filters.js → itemMatch → usado por app.js (tree, tabla, sedeView)

                    ┌─────────────┐
                    │  SD         │ ← Datos SNIES (lectura solamente)
                    └─────────────┘
                           │
          ┌────────────────┼──────────────┐
          ▼                ▼              ▼
    app.js            export.js      renderSNIES
    (renderSNIES)     (exportSNIES)
```

---

## 3. Clasificación MVC tentativa

### 3.1. Posibles Models (gestión de datos)

| Candidato | Estado actual | Propuesta MVC |
|---|---|---|
| `DB` (estructura datos) | `var` global en app.js, modificado directamente por funciones de editor | **AppState.DB** — con métodos get/set validados |
| `DEFAULT_DATA` | inline en HTML, reescrito por downloadHTML | **AppState.defaultData** — constante |
| `ALL_SEDES` | `var` en app.js | **AppState.ALL_SEDES** — constante |
| `ST_MAP` | `var` en utils.js | **Model.ST_MAP** — estable, migrar primero |
| `SD` | `var` en app.js (línea 599) | **Model.SNIES_DATA** — independiente |
| `curFac` | `var` en app.js, mutado en 4 lugares | **AppState.activeFaculty** |
| `filtros` (5 vars) | `var` en app.js, mutados en filters.js | **AppState.filters** |
| `editingProgId`, `tmpLineas`, `tmpMaes` | `var` en app.js | **AppState.editor** |
| `_snFac`, `_snProg` | `var` en app.js | **AppState.snies** |
| `SNIES_PRE_MAP`, `SNIES_ESP_MAP` | `const` en export.js | **Model.SNIES_MAPS** — datos puros |

### 3.2. Posibles Views (renderizado)

| Candidato | Estado actual | Propuesta MVC | Líneas |
|---|---|---|---|
| `renderTree()` | views/tree.js:33 | **View.Tree** | ~286 |
| `renderTabla()` | views/tabla.js | **View.TableView** | ~41 |
| `renderSedeView()` | views/sede-view.js | **View.SedeView** | ~48 |
| `renderEditor()` | views/editor.js | **View.Editor** | ~523 |
| `renderProgForm()` | views/prog-form.js | **View.ProgForm** | ~67 |
| `renderPipeline()` | views/pipeline.js:13 | **View.Pipeline** | ~144 |
| `renderSNIES()` | views/snies.js | **View.SNIES** | ~125 |
| `renderIndicadores()` | modules/indicators.js:24 | **View.Indicators** | ~350 |
| `renderKPIs()` | modules/dashboard.js:40 | **View.KPIs** | ~12 |
| `renderFacBar()` | modules/dashboard.js:24 | **View.FacBar** | ~5 |
| `renderViews()` | controllers/navigation.js:39 | **Controller.Navigation** | 1 línea |

### 3.3. Posibles Controllers (lógica de negocio)

| Candidato | Estado actual | Propuesta MVC |
|---|---|---|
| `loadDB()` | storage.js | **Controller.Storage.init** |
| `saveDB()` | storage.js | **Controller.Storage.persist** |
| `downloadHTML()` | storage.js | **Controller.Export.downloadHTML** |
| `resetDB()` | storage.js | **Controller.Storage.reset** |
| `selFac(i)` | dashboard.js | **Controller.Faculty.select** |
| `applyFilters()` | filters.js | **Controller.Filters.apply** |
| `resetFilters()` | filters.js | **Controller.Filters.reset** |
| `populateSedes()` | filters.js | **Controller.Filters.populateSedes** |
| `showTab(id)` | app.js:565 | **Controller.Navigation.switchTab** |
| `saveProg()` | app.js | **Controller.Program.save** |
| `deleteProg()` | app.js | **Controller.Program.delete** |
| `saveDoc()` | app.js | **Controller.Program.saveDoctorado** |
| `saveFac()` | app.js | **Controller.Faculty.save** |
| `deleteFac()` | app.js | **Controller.Faculty.delete** |
| `openNewFac()` | app.js | **Controller.Faculty.openNewForm** |
| `openNewProg()` | app.js | **Controller.Program.openNewForm** |
| `openEditProg()` | app.js | **Controller.Program.openEditForm** |
| `cancelEdit()` | app.js | **Controller.Editor.cancel** |
| `addLinea()` / `delLinea()` | app.js | **Controller.Editor.addLinea** / **removeLinea** |
| `addMae()` / `delMae()` | app.js | **Controller.Editor.addMae** / **removeMae** |
| `collectLineas()` / `collectMaes()` | app.js | **Controller.Editor.collectLineas** / **collectMaes** |
| `downloadDB()` | export.js | **Controller.Export.downloadCSV** |
| `exportSNIES()` | export.js | **Controller.Export.downloadSNIES** |
| `snSetFac()` / `snSetProg()` | app.js | **Controller.SNIES.select** |
| `toggleSec()` | app.js | **Controller.UI.toggleSection** |
| `toggleDocForm()` | app.js | **Controller.UI.toggleDocForm** |

---

## 4. Zonas críticas

### 4.1. `renderTree()` (views/tree.js:33) — **CRÍTICO**

| Aspecto | Detalle |
|---|---|
| Líneas | ~260 |
| Dependencias globales | `DB`, `curFac`, `filtPregrado`, `pregradoMatch`, `itemMatch`, `getSt`, `pll` |
| Complejidad | ALTA — SVG inline, 2 modos (single/multi pregrado), lógica de conectores |
| Acoplamiento | **MUY ALTO** — conoce estructura de DB, filtros, sistema de badges |
| Riesgo migración | **MUY ALTO** — cambiar la fuente de datos requiere reescribir toda la función |
| Inline handlers | `data-action="open-edit-prog"` (migrado a event delegation) |
| Notas | Contiene 3 closures internos (`vline`, `stBadge`) que duplican lógica de utils.js |

### 4.2. Editor (views/editor.js + views/prog-form.js) — **CRÍTICO**

| Aspecto | Detalle |
|---|---|
| Líneas | ~155 (2 implementaciones + progForm) |
| Dependencias globales | `DB`, `curFac`, `editingProgId`, `tmpLineas`, `tmpMaes`, `saveDB`, `toast`, `populateSedes`, `renderFacBar`, `renderViews` |
| Complejidad | ALTA — CRUD completo con modal overlay |
| Acoplamiento | **MUY ALTO** — conoce estructura DB, DOM IDs de formularios |
| Riesgo migración | **ALTO** — funciones sombreadas (duplicadas), lógica de recolecta frágil |
| Sombreado | `renderEditor` en línea 369 (NUNCA ejecutada), `saveDoc` en línea 431 (idem), `deleteFac` en 530, `saveFac` en 525 — **BASURA TÉCNICA** |

### 4.3. `renderPipeline()` (views/pipeline.js:13) — **ALTO**

| Aspecto | Detalle |
|---|---|
| Líneas | ~129 |
| Dependencias globales | `DB`, `toggleSec` |
| Complejidad | ALTA — 5 grupos dinámicos, timeline por trimestre, SVG inline, tablas dinámicas |
| Acoplamiento | ALTO — conoce estructura DB, fórmula de agrupación por estado |
| Inline handlers | `data-action="toggle-section"` (migrado a event delegation) |
| Notas | Contiene 7 closures internos (`grp`, `kpi`, `nivBadge`, `tabla`, `buildTimeline`, `sec`, `getTri`, `estCol`) |

### 4.4. `renderSNIES()` (views/snies.js) — **MEDIO-ALTO**

| Aspecto | Detalle |
|---|---|
| Líneas | ~62 |
| Dependencias globales | `SD`, `_snFac`, `_snProg`, Chart.js (global) |
| Complejidad | MEDIA — generación de HTML + gráficos Chart.js con setTimeout |
| Acoplamiento | ALTO — conoce estructura exacta de SD, FAC_MP, nombres de programas |
| Notas | Datos SD son independientes de DB (no hay acoplamiento con editor) |
| Inline handlers | `data-action="snies-set-fac"`, `data-action="snies-set-prog"` (migrado a event delegation) |

### 4.5. `renderViews()` (controllers/navigation.js:39) — **PUNTO ÚNICO DE ORQUESTACIÓN**

```js
function renderViews(){renderKPIs();renderTree();renderTabla();renderSedeView();}
```

Dependencia: llama a 4 funciones de render. Cualquier cambio en la firma de estas funciones rompe el dashboard.

### 4.6. `showTab()` (controllers/navigation.js:22) — **NAVEGACIÓN CENTRAL**

```js
function showTab(id){
  // toggle 7 paneles
  if(id==='editor') renderEditor();
  if(id==='indicadores') renderIndicadores();
  if(id==='snies') renderSNIES();
  if(id==='pipeline') renderPipeline();
}
```

Dependencia: llama directamente a 4 renderers. Acoplamiento por nombre de función.

---

## 5. Dependencias circulares implícitas

Actualmente NO hay dependencias circulares porque:
1. Los módulos extraídos solo dependen de `window.*` globales
2. No hay import/export entre módulos
3. El orden de carga secuencial garantiza disponibilidad

Sin embargo, existen **dependencias cruzadas frágiles**:

```
dashboard.js:renderKPIs() → app.js:renderViews (llamada indirecta vía filters.applyFilters)
dashboard.js:selFac()     → app.js:showTab (para refrescar pestaña activa)
filters.js:applyFilters() → app.js:renderViews (global, definida en app.js)
app.js:renderViews()      → dashboard.js:renderKPIs()
```

Esto crea un **ciclo de llamadas** que funciona solo porque todo está en el mismo ámbito global:
```
applyFilters → renderViews → renderKPIs → (consume DB, curFac)
                                 ↓
                           renderTree, renderTabla, renderSedeView
```

**Riesgo**: al extraer un módulo a ESModule, se rompería este ciclo porque `renderViews` está en app.js y `renderKPIs` en dashboard.js. Solución: inyectar el callback `onRender` en lugar de llamar directamente.

---

## 6. Propuesta de AppState gradual

### 6.1. Estructura inicial propuesta

```js
// Fase 1: AppState mínimo (solo agrupar vars existentes)
window.AppState = {
  DB: [],
  DEFAULT_DATA: [],
  ALL_SEDES: [],
  activeFaculty: 0,
  filters: {
    sede: 'ALL',
    oferta: 'ALL',
    estado: 'ALL',
    nivel: 'ALL',
    pregrado: 'ALL'
  },
  editor: {
    editingProgId: null,
    tmpLineas: [],
    tmpMaes: []
  },
  snies: {
    data: null,        // SD
    activeFac: 'TODAS',
    activeProg: null
  },
  embedded: true
};
```

### 6.2. Migración incremental segura

| Paso | Qué migrar | Cómo | Riesgo |
|---|---|---|---|
| **1** | `ST_MAP` → `AppState.stateColors` | Reemplazar var global por AppState en utils.js | NINGUNO (solo lectura) |
| **2** | `filtros` (5 vars) → `AppState.filters` | En filters.js, cambiar window.filt* por AppState.filters.* | BAJO (solo filters.js consume) |
| **3** | `curFac` → `AppState.activeFaculty` | En dashboard.js + app.js, reemplazar acceso directo | MEDIO (10+ referencias) |
| **4** | `SD` → `AppState.snies.data` | En app.js, mover SD a AppState | BAJO (solo lectura) |
| **5** | `editingProgId`, `tmpLineas`, `tmpMaes` → `AppState.editor` | En app.js, agrupar en objeto editor | BAJO (solo editor) |
| **6** | `DB` → `AppState.DB` | **ÚLTIMO** — requiere refactor completo (15+ consumidores) | ALTO |

### 6.3. Qué NO migrar todavía

- `DB` — demasiados consumidores, requiere refactor mayor
- `DEFAULT_DATA` — estable, solo usado por storage.js
- `ALL_SEDES` — estable, solo usado por filters.js

---

## 7. Roadmap MVC incremental

### Fase 0: Preparación (ahora)
- [x] Modularización funcional (6 módulos extraídos)
- [x] Documentación arquitectónica (este archivo)
- [ ] Eliminar funciones sombreadas (renderEditor legacy, saveDoc legacy, etc.)
- [ ] Estandarizar window.* exports

### Fase 1: Centralización de estado
- [ ] Crear `window.AppState` con estructura definida
- [ ] Migrar filtros a `AppState.filters`
- [ ] Migrar `curFac` a `AppState.activeFaculty`
- [ ] Migrar estado del editor a `AppState.editor`
- [ ] Mantener compatibilidad: `window.curFac = AppState.activeFaculty`

### Fase 2: Separación View
- [ ] Extraer `renderTree()` → `View.Tree` module
- [ ] Extraer `renderPipeline()` → `View.Pipeline` module
- [ ] Extraer `renderSNIES()` → `View.SNIES` module
- [ ] Extraer editor Views (renderEditor, renderProgForm) → `View.Editor`
- [ ] Cada View recibe `(state)` en lugar de leer `window.*`

### Fase 3: Separación Controller
- [ ] Extraer lógica CRUD de editor → `Controller.Editor`
- [ ] Extraer lógica de filtros → `Controller.Filters`
- [ ] Extraer lógica de navegación → `Controller.Navigation`
- [x] Eliminar handlers inline (`onclick` + `onchange`) reemplazando por event delegation (show-tab, sel-fac, reset-filters, apply-filters)
- [x] Migrar estado del editor (`editingProgId`, `tmpLineas`, `tmpMaes`) a `AppState.editor` vía getter/setter
- [x] Migrar estado SNIES (`SD`, `_snFac`, `_snProg`) a `AppState.snies` vía getter/setter
- [x] Migrar handlers SNIES + Pipeline + Header a event delegation

### Fase 4: Desacoplamiento render
- [ ] Reemplazar ciclo `applyFilters → renderViews → renderKPIs` por event emitter
- [ ] Views se suscriben a cambios de estado en lugar de ser llamadas directamente
- [ ] Introducir `AppState.subscribe(callback)` o patrón Observer mínimo

### Fase 5: MVC híbrido
- [ ] Migrar módulos a ESModules (`type="module"`)
- [ ] Reemplazar `window.*` exports por `import`/`export`
- [ ] Eliminar compatibilidad legacy progresivamente
- [ ] Inyectar dependencias en lugar de acceder a globales

### Fase 6: MVC completo
- [ ] AppState como objeto inmutable (patrón Redux mínimo o similar)
- [ ] Views puras: `render(state) → string`
- [ ] Controllers sin acceso directo al DOM
- [ ] Testing unitario posible (sin DOM)

---

## 8. Riesgos de migración

### 8.1. Inline onclick handlers — RESUELTO

**Problema**: +50 handlers `onclick` en HTML renderizado dinámicamente y en HTML embebido. Ejemplos:
```html
<button onclick="openEditProg('${p.id}')">
<button onclick="selFac(0)">
<button onclick="saveDoc()">
<div data-sec-id="timeline" onclick="toggleSec(this.dataset.secId)">
```

**Solución aplicada**: Todos los handlers `onclick` fueron reemplazados por `data-action` + dispatcher centralizado:
```js
document.addEventListener('click', e => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action in dispatch) dispatch[action](e.target);
});
```

**Estado actual**: Migración mayor completada. Quedan **onclick inline reducidos** en módulos menores:
- `views/snies.js` — 3 onclick (import, reset, removeSniesProgram)
- `views/sedes-mgr.js` — 6 asignaciones onclick (add, save, cancel, close, overlay)
- `views/rc-view.js` — 2 onclick (upload, restore)
- `modules/utils.js` — 3 onclick en `showConfirm` (cancel, confirm, overlay)
- `HTML` — 1 onclick: `downloadDB()` (excluido por riesgo de doble descarga)

### 8.2. Funciones sombreadas — ELIMINADAS (Fase 3)

| Función sombreada | Estado |
|---|---|
| `renderEditor()` | ✅ Eliminada |
| `saveDoc()` | ✅ Eliminada |
| `deleteFac()` | ✅ Eliminada |
| `saveFac()` | ✅ Eliminada |
| `openNewFac()` | ✅ Eliminada |
| `openNewProg()` | ✅ Eliminada |
| `openEditProg()` | ✅ Eliminada |
| `saveNewFac()` | ✅ Eliminada (dead code) |

Todas las versiones redundantes fueron eliminadas en `app.js`. Ya no hay riesgo de ambigüedad.

### 8.3. Ciclo applyFilters → renderViews → renderKPIs

**Riesgo**: Si se extrae `renderKPIs` a un módulo ESModule, no podrá llamar a `renderViews` (definida en app.js) porque se crearía una dependencia circular.

**Solución actual**: Pasar callbacks como parámetros:
```js
// en filters.js
function applyFilters(onDone){
  // ... leer filtros ...
  onDone();
}
// app.js: applyFilters(() => renderViews());
```

### 8.4. Inicialización síncrona

```js
loadDB();
renderFacBar();
populateSedes();
renderViews();
```

Todo se ejecuta al cargar app.js. Si se migra a ESModules, `type="module"` tiene semántica de defer, lo que cambia el timing. Las Views embebidas en HTML (datos serializados) dependen de que app.js se ejecute después de los módulos.

### 8.5. Dependencia de Chart.js global

`renderSNIES()` usa `new Chart(...)` asumiendo que Chart.js está en window. Si se migra a ESModules, Chart.js debe importarse o cargarse como script independiente antes.

---

## 9. Recomendaciones inmediatas

### Prioridad 1 (antes de cualquier refactor MVC)
1. ✅ ~~**Eliminar funciones sombreadas**~~ — **COMPLETADO (Fase 3)**
2. **Estandarizar window.* exports** — algunos módulos exportan, otros no consistentemente

### Prioridad 2 (bajo riesgo, alto beneficio)
3. ✅ ~~Migrar filtros a AppState.filters~~ — **COMPLETADO (Fase 3)**
4. ✅ ~~Migrar curFac a AppState.navigation.curFac~~ — **COMPLETADO (Fase 3)**
5. ✅ ~~**Estandarizar window.* exports**~~ — **COMPLETADO (Fase 3)**

### Prioridad 3 (preparar terreno)
6. **Migrar editor (editingProgId, tmpLineas, tmpMaes) a AppState.editor**
7. **Migrar SNIES (_snFac, _snProg) a AppState.snies**
8. **Implementar event delegation** para reemplazar onclick inline
9. **Eliminar dependencia directa renderKPIs→renderViews** inyectando callback

### Prioridad 4 (no tocar todavía)
9. **renderTree** — esperar a que AppState esté estable
10. **renderPipeline** — esperar a que event delegation funcione
11. **Editor** — esperar a eliminar código sombreado primero

---

## 10. Diagrama de flujo general

```
[Inicio: HTML embebido]
       │
       ▼
  loadDB() ← localStorage / DEFAULT_DATA
       │
       ▼
  renderFacBar() ← DB, curFac
  populateSedes() ← DB[curFac], ALL_SEDES
  renderViews() ← DB[curFac], filtros
       │
       ├── renderKPIs() ← DB[curFac], filtros
       ├── renderTree() ← DB[curFac], filtros
       ├── renderTabla() ← DB[curFac], filtros
       └── renderSedeView() ← DB[curFac], filtros
       │
       ▼
  [Interacción del usuario]
       │
       ├── click facultad → selFac(i) → populateSedes + renderFacBar + renderViews + showTab
       ├── click filtros → applyFilters → renderViews
       ├── click pestaña → showTab(id) → renderEditor|renderIndicadores|renderSNIES|renderPipeline
       ├── click editor → openNewProg|openEditProg|saveProg|deleteProg → saveDB + renderViews + renderEditor
       └── click exportar → downloadDB|exportSNIES|downloadHTML
```

---

## 11. Convenciones de código

### Estilo actual
- `var` para todo (ES5 legacy)
- HTML templates concatenados con `+=`
- Event delegation como mecanismo principal (data-action + dispatchers centralizados)
- Algunos `onclick` inline restantes en módulos menores (snies, sedes-mgr, rc-view, showConfirm)
- Funciones globales (sin namespace)
- `window.*` exports para compatibilidad módulo → HTML

### Estilo objetivo (Fase 5-6)
- `const`/`let` (ES6+)
- Template literals con `${}`
- Event delegation
- ESModules con `import`/`export`
- Views como funciones puras: `render(state) → HTMLString`

---

## 12. Estado centralizado — progreso de migración

### 12.1. Estructura actual de AppState

```js
window.AppState = {
  navigation: {
    curFac: 0,          // índice facultad activa
    activeTab: 'pipeline'  // pestaña activa
  },
  filters: {
    sede: 'ALL',
    oferta: 'ALL',
    estado: 'ALL',
    nivel: 'ALL',
    pregrado: 'ALL'
  },
  ui: {},  // reservado para estado visual futuro
  editor: {
    editingProgId: null,  // null | '__new__' | program-id
    tmpLineas: [],        // working copy of lineas (with _progId)
    tmpMaes: []           // working copy of maes (with _progId)
  },
  snies: {
    SD: null,     // SNIES dataset (cargado al final de app.js)
    fac: 'TODAS', // facultad activa en panel SNIES
    prog: null    // programa activo en panel SNIES
  }
};
```

Definido en `models/app-state.js` (84 líneas).

### 12.2. Variables migradas

| Variable legacy | Ruta AppState | Migrada | Consumidores actualizados |
|---|---|---|---|
| `curFac` | `AppState.navigation.curFac` | ✅ | `selFac()` (escribe), `renderKPIs()` (lee) |
| `filtSede` | `AppState.filters.sede` | ✅ | `applyFilters()` (escribe), `resetFilters()` (escribe) |
| `filtOferta` | `AppState.filters.oferta` | ✅ | `applyFilters()` (escribe), `resetFilters()` (escribe) |
| `filtEstado` | `AppState.filters.estado` | ✅ | `applyFilters()` (escribe), `resetFilters()` (escribe) |
| `filtNivel` | `AppState.filters.nivel` | ✅ | `applyFilters()` (escribe), `resetFilters()` (escribe) |
| `filtPregrado` | `AppState.filters.pregrado` | ✅ | `applyFilters()` (escribe), `resetFilters()` (escribe), `populateSedes()` (escribe) |
| — | `AppState.navigation.activeTab` | ✅ | `showTab()` (escribe) |
| `editingProgId` | `AppState.editor.editingProgId` | ✅ | vía getter/setter — 0 cambios en consumidores |
| `tmpLineas` | `AppState.editor.tmpLineas` | ✅ | vía getter/setter — 0 cambios en consumidores |
| `tmpMaes` | `AppState.editor.tmpMaes` | ✅ | vía getter/setter — 0 cambios en consumidores |
| `SD` | `AppState.snies.SD` | ✅ | vía getter/setter — 0 cambios en consumidores |
| `_snFac` | `AppState.snies.fac` | ✅ | vía getter/setter — 0 cambios en consumidores |
| `_snProg` | `AppState.snies.prog` | ✅ | vía getter/setter — 0 cambios en consumidores |

### 12.3. Variables pendientes (próximas iteraciones)

| Variable | Ruta propuesta | Dependencias | Riesgo | Prioridad |
|---|---|---|---|---|
| `DB` | `AppState.DB` | 15+ consumidores, editor CRUD | **ALTO** | Último |
| `DEFAULT_DATA` | `AppState.defaultData` | storage.js | BAJO | Baja |
| `ALL_SEDES` | `AppState.ALL_SEDES` | filters.js | BAJO | Baja |
| (migrado) | vía getter/setter | — | ✅ | — |
| (migrado) | vía getter/setter | — | ✅ | — |
| `ST_MAP` | `AppState.stateColors` | utils.js (getSt) | BAJO | Baja |

### 12.4. Compatibilidad legacy (aliases)

Las variables `var` originales se mantienen intactas para no romper:
- `renderTree()` — lee `curFac`, `filtSede`, `filtPregrado`
- `renderTabla()` — lee `curFac`
- `renderSedeView()` — lee `curFac`
- `renderPipeline()` — lee `curFac`
- `renderEditor()` — lee `curFac`
- `renderProgForm()` — lee `curFac`
- `renderSNIES()` — lee `_snFac`, `_snProg`
- `populateSedes()` — lee `curFac`, `filtSede`, `filtPregrado`
- `deleteFac()` — modifica `curFac`
- `saveNewFac()` — modifica `curFac`

**Estrategia**: `selFac()` y `applyFilters()` escriben a AMBAS (AppState + var legacy). Las funciones legacy siguen funcionando vía `var`. Cuando todas las funciones legacy se migren, se eliminarán los aliases.

### 12.5. Funciones actualizadas en esta iteración

| Función | Archivo | Cambio |
|---|---|---|
| `showTab()` | app.js | Escribe `AppState.navigation.activeTab` |
| `selFac()` | dashboard.js | Escribe `AppState.navigation.curFac` (además de `curFac` legacy) |
| `renderKPIs()` | dashboard.js | Lee `AppState.navigation.curFac` en lugar de `curFac` |
| `applyFilters()` | filters.js | Escribe `AppState.filters.*` (además de `window.filt*` legacy) |
| `resetFilters()` | filters.js | Escribe `AppState.filters.*` (además de `window.filt*` legacy) |
| `renderIndicadores()` | indicators.js | Referencia `window.AppState` para uso futuro |
| `populateSedes()` | filters.js | Escribe `AppState.filters.sede` y `AppState.filters.pregrado` (además de `window.filt*` legacy) |

Funciones sombreadas **eliminadas** de app.js (8 funciones): `renderEditor`, `saveDoc`, `openNewProg`, `openEditProg`, `saveFac`, `deleteFac`, `openNewFac`, `saveNewFac`.

### 12.6. Sync post-init

Después del bootstrap (`loadDB()` → `populateSedes()`), se sincroniza `curFac` con AppState:

```js
window.AppState.navigation.curFac = curFac;
```

La sincronización de `filtSede`/`filtPregrado` ya no es necesaria porque `populateSedes()` escribe ambas fuentes. Se eliminaron las líneas redundantes.

### 12.7. Riesgos detectados

1. **Desincronización temporal**: `deleteFac()` (activa) y `saveFac(true)` modifican `curFac` sin actualizar AppState. Si una función AppState-aware se ejecuta entre medias, leería valor incorrecto. Mitigación: `deleteFac` en la versión activa usa `curFac=Math.max(0,curFac-1);` — la próxima llamada a `selFac()` sincronizará AppState.
2. ✅ ~~**populateSedes modifica filtros**~~ — **RESUELTO**: `populateSedes()` ahora escribe también en `AppState.filters`.
3. **Acceso directo a var legacy**: Las funciones no migradas (tree, tabla, editor, pipeline) leen `curFac` y `filt*` directamente. Mientras los aliases legacy existan, funciona correctamente.

---

## 13. Estrategia de exports globales

### 13.1. Patrón actual (Fase 3)

Se eliminaron las exportaciones redundantes `window.fn = fn` de cada módulo y se centralizaron en un único namespace:

```js
// app.js — manifiesto único de exportaciones
window.App = {
  AppState: window.AppState,
  showTab, renderViews, selFac,
  renderKPIs, renderFacBar,
  applyFilters, resetFilters, populateSedes,
  sedeMatch, ofertaMatch, estadoMatch, nivelMatch, pregradoMatch, itemMatch,
  renderTree, renderTabla, renderSedeView,
  renderEditor, openNewProg, openEditProg, openEditFac, openNewFac,
  saveFac, deleteFac, saveDoc, cancelEdit,
  renderProgForm, addLinea, delLinea, addMae, delMae,
  saveProg, deleteProg, collectLineas, collectMaes, toggleDocForm,
  renderSNIES, snSetFac, snSetProg, exportSNIES,
  renderPipeline, toggleSec,
  renderIndicadores,
  loadDB, saveDB, downloadHTML, downloadDB, resetDB,
  showConfirm, getSt, pll, uid, gv, gi, toast,
};
```

### 13.2. Mecanismo dual (compatibilidad legacy)

Todas las funciones existen en window por dos vías:

| Mecanismo | Origen | Persistencia |
|---|---|---|
| `function fn(){}` (declaración) | Hoisting a window.* | Implícito, permanente |
| `window.App.fn` (namespace) | Asignación en app.js | Explícito, canónico |

Esto garantiza que los handlers `onclick="fn()"` en HTML sigan funcionando sin cambios.

### 13.3. Exportaciones eliminadas por módulo

| Archivo | Exportaciones eliminadas | Motivo |
|---|---|---|
| utils.js | window.showConfirm, getSt, pll, uid, gv, gi, toast | Redundantes (fn en window vía function) |
| storage.js | window.saveDB, loadDB, downloadHTML, resetDB, _validateDB | Redundantes + _validateDB era interna |
| filters.js | window.sedeMatch…itemMatch, applyFilters, resetFilters, populateSedes | Redundantes |
| dashboard.js | window.renderKPIs, renderFacBar, selFac | Redundantes |
| indicators.js | window.renderIndicadores | Redundante |
| export.js | window.downloadDB, exportSNIES | Redundantes |

### 13.4. Funciones que permanecen solo en `function` (sin export explícito en módulo)

Ninguna. Todas las funciones están en `window.App`. Las que antes no tenían export explícito (showTab, renderTree, renderEditor, etc.) ahora están referenciadas en el namespace.

### 13.5. Diferencia clave entre mecanismos

```js
window.fn = fn;        // EXPLÍCITO — requiere línea de código
function fn(){}        // IMPLÍCITO — ocurre automáticamente

// Ambos producen: typeof window.fn === 'function'
// Diferencia: el explícito es redundante si ya hay function declaration
```

### 13.6. Transición futura a ESModules

Cuando se migre a ESModules, el manifiesto `window.App` se reemplazará por:

```js
// app.js (como entry point ESModule)
import { showTab, renderViews } from './navigation.js';
import { renderKPIs, renderFacBar } from './dashboard.js';
// ...
window.App = { showTab, renderViews, renderKPIs, /* ... */ };
```

Los módulos individuales usarán `export function fn(){}` estándar.

### 13.7. Bloqueadores para MVC real

1. ✅ ~~**Event delegation**~~ — **PILOTO IMPLEMENTADO (Fase 3)**: ver sección 14.
2. ✅ ~~**Eliminar `var` legacy (~6 vars)**~~ — **MIGRADO (Fase 3)**: `curFac` → `AppState.navigation.curFac`, `filt*` → `AppState.filters.*`. Restan `DB`, `DEFAULT_DATA`, `ALL_SEDES` + accessors SNIES.
3. ✅ ~~**Data como módulo**~~ — **INICIADO (Fase 4)**: `AppData` creado en `assets/js/data/app-data.js` (encapsula consultas + writes simples sobre DB). Resta: `DEFAULT_DATA`, `SD`, `ALL_SEDES` como módulos separados.
4. **ESModules**: cambiar `<script>` tags a `<script type="module">`.
5. **Refactor renderers**: migrar `DB[curFac]` en renderTree/renderTabla/renderSedeView/renderProgForm/renderEditor a `AppData.getFacultad()`.

---

## 14. Event Delegation — migración progresiva

### 14.1. Dispatcher click

```js
var __ACTIONS = {
  'show-tab':      function(b){ showTab(b.dataset.tab); },
  'sel-fac':       function(b){ selFac(parseInt(b.dataset.fac,10)); },
  'reset-filters': function(){ resetFilters(); },
};
document.addEventListener('click', function(e){
  var b = e.target.closest('[data-action]');
  if(!b) return;
  var fn = __ACTIONS[b.getAttribute('data-action')];
  if(fn) fn(b);
});
```

### 14.2. Dispatcher change

```js
var __CHANGE = {
  'apply-filters': function(){ applyFilters(); },
};
document.addEventListener('change', function(e){
  var b = e.target.closest('[data-action]');
  if(!b) return;
  var fn = __CHANGE[b.getAttribute('data-action')];
  if(fn) fn(b);
});
```

### 14.3. Handlers migrados

| data-action | Tipo evento | data-* | Handler | Riesgo |
|---|---|---|---|---|---|
| `show-tab` | click | `data-tab="arbol\|tabla\|sede\|..."` | `showTab(id)` | Bajo |
| `sel-fac` | click | `data-fac="0\|1\|2\|..."` | `selFac(i)` | Bajo |
| `reset-filters` | click | — | `resetFilters()` | Bajo |
| `apply-filters` | change | — | `applyFilters()` | Bajo |
| `snies-set-fac` | click | `data-fac="facultad"` | `snSetFac(f)` | Bajo |
| `snies-set-prog` | click | `data-prog="programa"` | `snSetProg(p)` | Bajo |
| `toggle-section` | click | `data-sec-id="secN"` | `toggleSec(id)` | Bajo |
| `download-html` | click | — | `downloadHTML()` | Bajo |
| `print` | click | — | `window.print()` | Bajo |
| `reset-db` | click | — | `resetDB()` | Bajo |
| `open-edit-prog` | click | `data-pid="progId"` | `openEditProg(pid)` | Bajo |

### 14.4. Elementos con data-action

| Origen | Tipo | Evento |
|---|---|---|
| HTML estático | 7 tabs + 7 fac-buttons + reset + header + imprimir + guardar + restablecer | click |
| `renderFacBar()` (dashboard.js) | N fac-buttons dinámicos | click |
| `renderSNIES()` (app.js) | N fac-buttons + N prog-buttons dinámicos | click |
| `renderPipeline()` (app.js) | N section headers + timeline | click |
| `renderTree()` (app.js) | 2 edit buttons (single + multi pregrado) | click |
| `renderTree()` (app.js) | 2 error-recovery links | click |
| HTML estático | 5 selects (#filt-sede, #filt-pregrado, #filt-oferta, #filt-estado, #filt-nivel) | change |

### 14.5. Estrategia de migración

Se removió `onclick`/`onchange` de todos los elementos con `data-action`. Cada tipo de evento (click, change) tiene su propio mapa (`__ACTIONS`, `__CHANGE`) y su propio listener. Las funciones globales persisten en `window` para handlers no migrados.

`resetFilters()` y `populateSedes()` modifican valores de selects vía `.value = ...` (programático), que no dispara eventos change — no hay loops.

### 14.6. Handlers — Estado de migración

| Handler | Ubicación actual | Estado |
|---|---|---|
| `deleteProg(pid)` | controllers/actions.js | ✅ Migrado a data-action |
| `saveProg(pid, isNew)` | controllers/actions.js | ✅ Migrado a data-action |
| `addLinea()` / `delLinea()` | controllers/actions.js | ✅ Migrado a data-action |
| `addMae()` / `delMae()` | controllers/actions.js | ✅ Migrado a data-action |
| `toggleDocForm()` | controllers/actions.js | ✅ Migrado a data-action |
| `saveDoc()` | controllers/actions.js | ✅ Migrado a data-action |
| `deleteFac()` / `saveFac(isNew)` | controllers/actions.js | ✅ Migrado a data-action |
| `openNewFac()` / `openEditFac()` | controllers/actions.js | ✅ Migrado a data-action |
| `downloadDB()` | HTML estático | ⚠️ No migrado (riesgo doble descarga) |

### 14.7. Próximos pasos

1. **Migrar `downloadDB()`**: evaluar migración a data-action con prevención de doble descarga.
2. ~~**Migrar editor**~~: ✅ Completado (controllers/actions.js + views/editor.js).

### 14.8. Bloqueadores

| Bloqueador | Impacto |
|---|---|
| Templates en string literals `` `...${}...` `` | Dificulta reemplazo masivo |
| Handlers con args dinámicos en editor | data-* resuelve, ~15 templates por refactorizar |
| Mezcla onclick en HTML estático y dinámico | Dos orígenes, misma estrategia |
| Sin tests automatizados | No se puede verificar regresión |

---

## 15. Event Architecture — consolidado

### 15.1. Click delegation

| Acción | Elemento(s) | data-action | Handler | data-* |
|---|---|---|---|---|
| Navegación tabs | 7 tabs | `show-tab` | `showTab(id)` | `data-tab` |
| Header editor | 1 button | `show-tab` | `showTab('editor')` | `data-tab` |
| Selección facultad | fac-bar buttons | `sel-fac` | `selFac(i)` | `data-fac` |
| Limpiar filtros | 1 button | `reset-filters` | `resetFilters()` | — |
| SNIES facultad | N buttons (renderSNIES) | `snies-set-fac` | `snSetFac(f)` | `data-fac` |
| SNIES programa | N buttons (renderSNIES) | `snies-set-prog` | `snSetProg(p)` | `data-prog` |
| Pipeline sección | N section headers | `toggle-section` | `toggleSec(id)` | `data-sec-id` |
| Guardar dashboard | 1 button | `download-html` | `downloadHTML()` | — |
| Imprimir | 1 button | `print` | `window.print()` | — |
| Restablecer datos | 1 button | `reset-db` | `resetDB()` | — |
| Editar programa (árbol) | ✎ button (renderTree) | `open-edit-prog` | `openEditProg(pid)` | `data-pid` |

### 15.2. Change delegation

| Acción | Elemento(s) | data-action | Handler | Comportamiento |
|---|---|---|---|---|
| Filtro sede | `#filt-sede` | `apply-filters` | `applyFilters()` | Lee DOM completo |
| Filtro pregrado | `#filt-pregrado` | `apply-filters` | `applyFilters()` | Lee DOM completo |
| Filtro oferta | `#filt-oferta` | `apply-filters` | `applyFilters()` | Lee DOM completo |
| Filtro estado | `#filt-estado` | `apply-filters` | `applyFilters()` | Lee DOM completo |
| Filtro nivel | `#filt-nivel` | `apply-filters` | `applyFilters()` | Lee DOM completo |

### 15.3. Handlers inline restantes

| Evento | Handler | Ubicación | Prioridad migración |
|---|---|---|---|
| click | `downloadDB()` | HTML header | Baja (excluido por riesgo doble descarga) |
| click | `_sniesImportClick()`, `_sniesResetClick()`, `removeSniesProgram()` | views/snies.js | Baja (módulo SNIES) |
| click | `restoreRCDefaults()` | views/rc-view.js | Baja (módulo RC) |
| click | asignaciones onclick en sedes-mgr | views/sedes-mgr.js | Baja (modal interno) |

### 15.4. Preparación ESModules

Estado actual de dependencias para migración a `<script type="module">`:

| Requisito | Estado |
|---|---|
| Sin `var` globales en módulos | ⚠️ **6 migradas** (`curFac`,`filtSede`,`filtOferta`,`filtEstado`,`filtNivel`,`filtPregrado` → `AppState.*`). Restan: `var DB`, `DEFAULT_DATA`, `ALL_SEDES` + `SD`, `_snFac`, `_snProg` (via accessor) |
| Sin `onclick` inline en HTML | ⚠️ **1 en HTML (downloadDB), ~14 en JS módulos menores (snies, sedes-mgr, rc-view, showConfirm)** |
| Sin `onchange` inline en HTML | ✅ **0 onchange restantes** |
| Dispatcher centralizado como cuello de botella único | ✅ Click + change cubiertos |
| `window.App` como namespace de transición | ✅ ~50 funciones exportadas |
| Capa de acceso a datos | ✅ `AppData` (`assets/js/data/app-data.js`) encapsula queries + writes |
| `import`/`export` en lugar de contaminación global | ❌ Pendiente — requiere eliminar `var` globales primero |

---

## 16. Capa de acceso a datos — `AppData`

### 16.1. Ubicación

`assets/js/data/app-data.js` — cargado después de `storage.js`, antes de los módulos de UI.

### 16.2. API expuesta

```
AppData.getFacultades()                → Array completo de facultades
AppData.getFacultad(index)             → Facultad por índice
AppData.getProgramas(facIndex)         → Programas de una facultad
AppData.getFacultadCount()             → Número de facultades
AppData.findProgramById(pid)           → {facIndex, programa} | null
AppData.findFacultadIndexByProgId(pid) → índice | -1
AppData.savePrograma(facIndex, prog, isNew)   → muta + persiste
AppData.deletePrograma(facIndex, pid)         → muta + persiste
AppData.saveFacultad(facultad, isNew, idx)    → muta + persiste
AppData.updateFacultadName(facIndex, name)    → muta + persiste
AppData.deleteFacultad(facIndex)              → muta + persiste
AppData.saveDocumento(facIndex, doc)          → muta + persiste
```

### 16.3. Módulos migrados a AppData

| Módulo | Antes (DB directo) | Después (AppData) |
|---|---|---|
| `dashboard.js` | `DB.map()`, `DB[curFac]` | `AppData.getFacultades()`, `AppData.getFacultad()` |
| `filters.js` | `window.DB[window.curFac]` | `AppData.getFacultad()` |
| `indicators.js` | `DB.forEach()`, `DB.length` | `AppData.getFacultades()`, `AppData.getFacultadCount()` |
| `export.js` | `DB.forEach()` | `AppData.getFacultades()` |
| `app.js` (writes) | `DB[curFac].progs.push/filter/splice`, `DB[curFac].doc`, `DB[curFac].name` | `AppData.savePrograma/deletePrograma/saveFacultad/updateFacultadName/deleteFacultad/saveDocumento` |
| `app.js` (renderers) | `DB[curFac]` en tree/tabla/sedeView/progForm/editor | ❌ Pendiente (renderers complejos) |

### 16.4. DB references restantes

| Ubicación | Ref | Motivo |
|---|---|---|
| `app-data.js` | `window.DB` (14) | Capa misma — fuente de verdad legacy |
| `storage.js` | `window.DB` (4) | Persistencia — `loadDB`, `downloadHTML` |
| `app.js` | `DB` bare (6) | Renderers complejos (tree, tabla, sedeView, progForm, editor) |

**Total: 6 referencias bare en renderers + 4 en storage + 14 internas en AppData.**

### 16.5. Próximos pasos

1. Migrar renderers (tree, tabla, sedeView, progForm, editor) a `AppData.getFacultad()`
2. Extraer `DEFAULT_DATA`, `ALL_SEDES`, `SD` a módulos separados bajo `assets/js/data/`
3. Migrar `storage.js` a usar `AppData` en lugar de `window.DB`
4. Evaluar eliminación de `var DB` una vez migrados todos los consumidores

---

## 17. Export standalone HTML — `embed.js`

### 17.1. Problema

`downloadHTML()` serializaba `document.documentElement.outerHTML` con `DEFAULT_DATA` actualizado, pero los `<link>`, `<script src>`, `<img src>` seguían apuntando a rutas relativas (`assets/css/main.css`, `assets/js/app.js`). Al mover el archivo .html descargado a otra ubicación, todos los recursos quedaban rotos.

### 17.2. Solución

`assets/js/modules/embed.js` — módulo runtime que empaqueta todos los recursos inline antes de la descarga:

| Función | Qué hace | API |
|---|---|---|
| `collectCSS()` | Recorre `document.styleSheets` y recolecta `cssRules[].cssText` | Síncrona, retorna string |
| `fetchJS(src)` | `fetch()` mismo origen para obtener contenido JS como texto | Async, retorna Promise<string> |
| `imageToDataURI(img)` | Dibuja imagen en `<canvas>` y exporta como `data:image/png;base64,...` | Async, retorna Promise<string> |
| `buildStandalone()` | Orquesta: inyecta CSS inline, reemplaza `<script src>` por inline, convierte imágenes a data URI | Retorna Promise<string> |

### 17.3. Flujo de `downloadHTML()` (actualizado)

```
[Click "Guardar dashboard"]
  → toast("⏳ Empaquetando dashboard...")
  → __EMBED.buildStandalone()
      ├─ collectCSS() → <style>...</style> (reemplaza <link>)
      ├─ fetchJS() para cada <script src> → <script>code</script>
      ├─ imageToDataURI() para cada <img> → data:image/png;base64,...
      └─ Reemplaza DEFAULT_DATA con DB actual
  → Blob → download
  └─ Si __EMBED no existe o falla: fallback clásico (solo DEFAULT_DATA)
```

### 17.4. Edge cases

| Caso | Comportamiento |
|---|---|
| CDN script (Chart.js) | fetchJS falla (cross-origin sin CORS o sin conexión) → se conserva `<script src="...">` original |
| Imagen no cargada (0×0) | Canvas falla → se conserva src original |
| Imagen ya data URI | Se pasa tal cual, sin reconversión |
| `outerHTML` resuelve src a URL absoluta | Se reemplazan ambas formas (relativa y absoluta) |
| Sin conexión a internet | JS local funciona (mismo origen), CDN no — Chart.js no disponible offline |

### 17.5. Carga

`embed.js` se carga entre `utils.js` y `storage.js` (antes que `downloadHTML()` lo necesite):

```
Chart.js (CDN) → utils.js → **embed.js** → storage.js → app-data.js → ...
```

### 17.6. Dependencias

- `fetch()` — disponible en todos los navegadores modernos
- `document.styleSheets` + `cssRules` — mismo origen (CSS local)
- `<canvas>` API — para conversión de imágenes

---

## 18. Estrategia de impresión / PDF

### 18.1. Problemas observados

| Síntoma | Causa raíz | Componente |
|---|---|---|
| Corte horizontal | `overflow-x:auto` en `.scroll` | Tree (renderTree) |
| Tabla truncada vertical | `max-height:480px` + `overflow:auto` en `.tbl-wrap` | Tabla (renderTabla) |
| Corte contenedores lista | `max-height:140px;overflow-y:auto` inline | Indicadores (legends) |
| Corte horizontal tabla | `overflow-x:auto` + `min-width:700px` inline | Indicadores (facultad table) |
| Secciones plegadas | `display:none` en secciones toggle | Pipeline |
| Sticky header no funcional | `position:sticky` no soportado en print browsers | Tabla |
| Cards cortadas entre páginas | Ausencia de `break-inside` | Tree cards, KPI, Sede cards |
| Grillas muy anchas | `repeat(5,1fr)` / `repeat(6,1fr)` | KPIs, Indicadores |

### 18.2. Estrategia implementada (`@media print`)

#### 18.2.1. Principios

1. **Print color exact**: `*-print-color-adjust:exact` en todos los elementos para preservar colores corporativos UDEC.
2. **Sin dependencia de JS**: todas las adaptaciones son CSS puras, sin hooks JS ni librerías.
3. **Overflow visible**: todo `overflow:auto/hidden/scroll` → `visible`. El contenido fluye naturalmente a través de páginas.
4. **Page-break-inside:avoid** en cards, nodos, filas de tabla, KPIs y badges.
5. **Compactación visual**: font-size reducida (8–10px), padding/margin reducidos, header compacto.
6. **Scaling del árbol**: `.tree` escala a 70% vía `transform:scale(.7)` con `transform-origin:top left` para que el diagrama jerárquico (que usa `inline-flex` + `min-width:max-content`) quepa en el ancho de página.
7. **Secciones expandidas**: pipeline toggle sections con `display:block` forzado.

#### 18.2.2. Componentes ocultos en print

| Selector | Motivo |
|---|---|
| `.no-print` | Marcados manualmente (fac-bar, filters, tab-bar, botones) |
| `.toast` | Notificación flotante, irrelevante en papel |
| `.edit-node-btn` | Botones de edición sobre nodos del árbol |
| `.btn-white`, `.btn-gold`, `.btn-reset`, `.btn-green`, `.btn-red` | Todos los botones de acción |
| `#panel-editor` | Panel editor completo |
| `#snies-content button` | Botones de filtro SNIES |

#### 18.2.3. Componentes adaptados

| Componente | Cambio principal |
|---|---|
| Header | Compacto (28px logos, 11px título), botones ocultos |
| KPIs | 5→3 columnas, padding reducido |
| Legend | Compacta, page-break-inside:avoid |
| Tree | `.scroll` overflow visible, `.tree` scale(0.7), cards avoid-break |
| Table (renderTabla) | `max-height` eliminado, `position:sticky` → `static`, font 8px |
| Sede View | Overflow visible, grid adaptativo, cards avoid-break |
| Indicators | Inline overrides via `[style*="..."]` selectors: overflow visible, max-height none, grid 6→3 cols, SVG limitado a 100px |
| SNIES | Canvas limitado (320×160px), botones ocultos |
| Pipeline | Secciones expandidas (`display:block` forzado), grid 3 cols |

### 18.3. Limitaciones conocidas

| Limitación | Causa | Impacto |
|---|---|---|
| Tree aún puede cortarse horizontalmente en landscape | `transform:scale(.7)` no garantiza ajuste para 6+ programas | Medio — ocurre con muchas especializaciones por facultad |
| Chart.js en canvas se renderiza con baja resolución | Canvas es rasterizado por el browser print engine, sin control de DPI | Medio — gráficos SNIES se ven pixelados |
| `@page landscape` no es estándar CSS | La especificación `@page` no soporta pseudo-clase `:landscape` | Bajo — el usuario debe seleccionar Landscape manualmente en el diálogo de print |
| Secciones toggle del pipeline se imprimen completas aunque colapsadas en pantalla | `display:block` forzado revela contenido oculto | Bajo — es el comportamiento deseado |
| Inline styles con `!important` no siempre sobreescribibles | `[style*="..."]` selector tiene alta especificidad pero puede fallar con atributos normalizados por el browser | Bajo — validar en cada browser target |
| Tabla de indicadores (9 columnas) puede comprimirse demasiado | `min-width:700px` + `width:100%` + font 8px fuerza texto pequeño | Medio — legibilidad comprometida |
| Sin librería externa, no hay control de: encabezados/pies de página, numeración, saltos de página exactos, marcas de agua | Limitaciones nativas de `window.print()` | Alto — para documentos formales se requiere html2pdf/jsPDF |
| Paginación de árbol grande inevitable | Los SVG connectors y cards jerárquicas no se dividen limpiamente entre páginas | Alto — el árbol debería imprimirse en una sola página o no imprimirse |

### 18.4. Componentes clasificados por compatibilidad print

| Componente | Compatibilidad | Notas |
|---|---|---|
| **Header** | ✅ Correcta | Compacto, colores preservados |
| **Fac bar** | ✅ Oculta | `no-print` |
| **Filters** | ✅ Oculta | `no-print` |
| **KPIs** | ✅ Correcta | 3 columnas, cards compactas |
| **Legend** | ✅ Correcta | Compacta, colores preservados |
| **Tree (árbol)** | ⚠️ Parcial | Scale 70%, puede cortarse en vertical para facultades grandes |
| **Tabla** | ✅ Correcta | Overflow eliminado, sticky → static, avoid-break en tr |
| **Sede View** | ✅ Correcta | Grid adaptativo, cards avoid-break |
| **Indicadores** | ⚠️ Parcial | Inline styles difíciles de override; SVG charts escalan bien; tabla 9-col es pequeña |
| **SNIES** | ⚠️ Parcial | Canvas baja resolución; botones ocultos; tabla OK |
| **Pipeline** | ✅ Correcta | Secciones expandidas, grid 3 cols |
| **Editor** | ✅ Oculta | `#panel-editor` oculto |

### 18.5. Recomendación futura

Para documentos PDF formales (informes, presentaciones institucionales), se recomienda:

1. **html2pdf.js** o **jsPDF + html2canvas**: captura rasterizada del DOM con control de:
   - Encabezados y pies de página personalizados
   - Numeración de páginas
   - Saltos de página explícitos
   - Marcas de agua institucionales
   - Resolución de gráficos SVG/Canvas mejorada

2. **Cuándo migrar**: cuando se requiera:
   - Exportación PDF con formato institucional (membrete, logos grandes, bordes)
   - Documentos multi-página con paginación controlada
   - Inclusión de datos SNIES en informes trimestrales
   - Distribución externa a entes gubernamentales (MEN)

3. **No migrar si**: el print CSS actual + `window.print()` + selección manual "Save as PDF" del navegador es suficiente para uso interno del equipo de posgrados.

### 18.6. Uso recomendado

```
1. Abrir el dashboard en navegador (Chrome/Edge recomendado)
2. Seleccionar pestaña a imprimir (Árbol, Tabla, Indicadores, etc.)
3. Ctrl+P / Cmd+P
4. Seleccionar destino: "Guardar como PDF"
5. Opcional: Layout → Landscape (para árbol o tabla ancha)
6. Opciones → "Gráficos de fondo" activado (preserva colores)
7. Márgenes → "Personalizado" (mínimo)
8. Guardar
```

---

## 19. Análisis de accesos y mutaciones sobre DB

### 19.1. Estructura de datos

```
DB: Array<Facultad>

Facultad {
  id: string,          // ej. "admin"
  name: string,        // ej. "Facultad de Ingeniería"
  doc: Doctorado|null, // opcional
  progs: Array<Programa>
}

Programa {
  id: string,          // uid()
  n: string,           // nombre del pregrado
  sedes: string[],     // ej. ["Fusagasugá", "Chía"]
  lineas: Array<Linea>,
  mae: Array<Maestria>
}

Linea {
  id: string,          // uid()
  l: string,           // nombre de línea
  t: string,           // tipo: "Profundización 1" | "Profundización 2" | "Profundización 3" | "Sin línea de profundización"
  motivo?: string,     // motivo/modalidad (solo cuando t === "Sin línea de profundización")
  esp: string,         // nombre de especialización
  e: string,           // estado (texto libre, ~20 variantes)
  o: string,           // oferta: "V" | "P"
  sedes: string[],
  resp: string,        // responsable
  mes: number|null,    // 1-12
  ano: number|null     // 2024-2028
}

Maestria {
  id: string,          // uid()
  n: string,           // nombre maestría
  e: string,           // estado
  o: string,           // oferta: "V" | "P"
  sedes: string[],
  resp: string,
  mes: number|null,
  ano: number|null
}

Doctorado {
  n: string,
  e: string,
  o: string,           // "V" | "P"
  sedes: string[],
  resp: string,
  mes: number|null,
  ano: number|null
}
```

### 19.2. Mapa de consumidores por módulo

```
                           ┌───────────────────┐
                           │   window.DB        │  ← fuente de verdad
                           │   Array(7)         │
                           └────────┬──────────┘
                   ┌────────────────┼────────────────────┐
                   ▼                ▼                     ▼
           ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
           │   AppData    │ │   storage.js │ │  app.js (direct) │
           │  (capa)      │ │  (persist)   │ │  renderers       │
           └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘
                  │                │                   │
       ┌──────────┼──────────┐     │          ┌────────┼────────┐
       ▼          ▼          ▼     │          ▼        ▼        ▼
  dashboard.js filters.js export.js│     renderTree renderTabla renderSedeView
  indicators.js                   │     renderProgForm renderEditor
                                  │
                                  ▼
                            embed.js (read)
```

### 19.3. Operaciones por tipo

#### LECTURAS

| # | Operación | Responsable | Frecuencia | Línea |
|---|---|---|---|---|
| L1 | `DB[curFac]` → facultad activa | renderTree, renderTabla, renderSedeView, renderProgForm, renderEditor | 5 call-sites en app.js | app.js:172,432,466,495,819 |
| L2 | `DB[curFac].progs.forEach(p => ...)` | renderTree, renderTabla, renderSedeView, renderEditor | 4 call-sites en app.js | app.js:187,433,467,827 |
| L3 | `f.progs.filter(p => pregradoMatch(p.n))` | renderTree | 1 | app.js:187 |
| L4 | `f.progs.find(x => x.id === pid)` | renderProgForm | 1 | app.js:496 |
| L5 | `p.lineas.filter(l => itemMatch(l,'espec'))` | renderTree, renderTabla | 3 app.js | app.js:191,214,436 |
| L6 | `p.mae.filter(m => itemMatch(m,'mae'))` | renderTree, renderTabla | 3 app.js | app.js:193,215,437 |
| L7 | `f.doc && itemMatch(f.doc,'doc')` | renderTree, renderTabla | 2 | app.js:193,408,450 |
| L8 | `DB[curFac].progs.length` | renderEditor | 1 | app.js:825 |
| L9 | `DB[curFac].progs.map(...)` | renderEditor (inline en string) | 1 | app.js:821-846 |
| L10 | `window.DB[i]` (genérico) | AppData.getFacultad | vía delegación | app-data.js:26 |
| L11 | `window.DB[faci].progs` | AppData.getProgramas | sin consumidores aún | app-data.js:27 |
| L12 | `window.DB.filter/Búsqueda` | AppData.findProgramById | vía deleteProg | app-data.js:32-38 |
| L13 | `ALL_SEDES.filter(s => s.has(x))` | populateSedes (filters.js) | 1 | filters.js:53 |
| L14 | `JSON.stringify(window.DB)` | saveDB + downloadHTML | cada write + export | storage.js:17, embed.js:67 |

#### ESCRITURAS / MUTACIONES

| # | Operación | Responsable | Riesgo | Línea |
|---|---|---|---|---|
| W1 | `window.DB = JSON.parse(JSON.stringify(DEFAULT_DATA))` | loadDB | **ALTO** — reemplaza DB completo | storage.js:42,47 |
| W2 | `window.DB.push({name, progs:[], doc:null})` | AppData.saveFacultad (isNew) | **ALTO** — muta array + cambia índices | app-data.js:66 |
| W3 | `window.DB[currentIndex] = facultad` | AppData.saveFacultad (edit) | **ALTO** — reemplaza elemento completo | app-data.js:67 |
| W4 | `window.DB.splice(facIndex, 1)` | AppData.deleteFacultad | **ALTO** — reindexa todo el array | app-data.js:79 |
| W5 | `f.progs.push(prog)` | AppData.savePrograma (isNew) | **ALTO** — muta array interno | app-data.js:50 |
| W6 | `f.progs[i] = prog` | AppData.savePrograma (edit) | **MEDIO** — reemplaza elemento referenciado | app-data.js:53 |
| W7 | `f.progs = f.progs.filter(p => p.id !== pid)` | AppData.deletePrograma | **MEDIO** — reemplaza array completo | app-data.js:61 |
| W8 | `f.doc = doc` / `f.doc = null` | AppData.saveDocumento | **BAJO** — mutación de propiedad in-place | app-data.js:86-87 |
| W9 | `f.name = name` | AppData.updateFacultadName | **BAJO** — mutación de propiedad in-place | app-data.js:74 |
| W10 | `localStorage.setItem('udec_rutas_db', ...)` | saveDB | **BAJO** — efecto secundario de persistencia | storage.js:17 |

#### MUTACIONES OCULTAS / SIDE EFFECTS

| # | Efecto | Dónde | Detalle |
|---|---|---|---|
| S1 | Reasignación de `curFac` tras delete/save | app.js:878 (`deleteFac`), app.js:892 (`saveFac`) | Cambia índice global después de mutar DB |
| S2 | `curFac` accessor → AppState.navigation.curFac | app.js:71 | Sincronización automática via Object.defineProperty |
| S3 | `saveDB()` llamado 6 veces en AppData writes | app-data.js:55,62,68,75,80,88 | Cada write persiste automáticamente a localStorage |
| S4 | `location.reload()` en resetDB | storage.js:93 | Recarga completa de página |
| S5 | Re-renderizado completo tras cada write | app.js:561,567,873,879,894 | `renderViews()` + `renderEditor()` + `populateSedes()` + `renderFacBar()` |

### 19.4. Dependencias de renderizado (qué DB necesita cada vista)

| Vista | Datos de DB requeridos | Dependencia |
|---|---|---|
| **renderFacBar** (dashboard.js:24) | `AppData.getFacultades()` — solo `.name` | Bajo |
| **renderKPIs** (dashboard.js:41) | `AppData.getFacultad(curFac)` → `f.progs`, `p.lineas`, `p.mae`, `f.doc` | Alto |
| **renderTree** (app.js:170) | `DB[curFac]` → `f.name`, `f.progs[].id/n/sedes`, `p.lineas[]`, `p.mae[]`, `f.doc` | **Crítico** |
| **renderTabla** (app.js:431) | `DB[curFac]` → `f.progs`, `p.lineas[]`, `p.mae[]`, `f.doc` | Alto |
| **renderSedeView** (app.js:465) | `DB[curFac]` → `f.progs`, sedes de cada item, `f.doc` | Alto |
| **renderProgForm** (app.js:494) | `DB[curFac]` → `f.progs.find(id)`, `p.lineas`, `p.mae` | Alto |
| **renderEditor** (app.js:818) | `DB[curFac]` → `f.name`, `f.progs`, `p.lineas/mae`, `f.doc` | Alto |
| **renderIndicadores** (indicators.js:28) | `AppData.getFacultades()` + count → todos los datos | Alto |
| **renderPipeline** (app.js:685) | `AppData.getFacultades()` → todos los datos | Alto |
| **renderSNIES** (app.js:620) | `SD` (AppState.snies.SD) — independiente de DB | Bajo |
| **populateSedes** (filters.js:47) | `AppData.getFacultad(curFac)` + `ALL_SEDES` | Medio |
| **downloadDB** (export.js:164) | `AppData.getFacultades()` → todos los datos planos | Alto |
| **downloadHTML** (storage.js:53) | `JSON.stringify(window.DB)` → datos serializados | Bajo |

### 19.5. Patrones de acceso repetidos

| Patrón | Ocurrencias | Dónde |
|---|---|---|
| `DB[curFac]` → `f.progs` + `forEach/map/filter` | 8 | renderTree (3), renderTabla (2), renderSedeView (1), renderEditor (2) |
| `DB[curFac].progs.find(id)` → `p.lineas` + `p.mae` | 1 | renderProgForm |
| `AppData.getFacultades().forEach(fac => fac.progs.forEach(p => ...))` | 3 | indicators.js, export.js, pipeline |
| `DB[curFac].progs.filter(p => pregradoMatch(p.n))` | 1 | renderTree |
| `p.lineas.filter(l => itemMatch(l,'espec'))` + `p.mae.filter(m => itemMatch(m,'mae'))` | 4 | renderTree (2), renderTabla (2) |
| `f.doc && itemMatch(f.doc, 'doc')` | 2 | renderTree, renderTabla |
| `f.progs.length` | 1 | renderEditor |
| `JSON.parse(JSON.stringify(objeto))` (deep clone) | 3 | loadDB (DEFAULT_DATA), renderProgForm (tmpLineas/tmpMaes) |

### 19.6. Riesgos por operación

| Riesgo | Operaciones | Justificación |
|---|---|---|
| **🔴 ALTO** | `loadDB`, `saveFacultad` (push/splice), `deleteFacultad` | Mutan la estructura del array `window.DB` — cualquier referencia por índice (curFac) queda desactualizada. `splice` cambia índices de todas las facultades siguientes. |
| **🟡 MEDIO** | `savePrograma` (replace), `deletePrograma` (filter), `savePrograma` (push) | Mutan la estructura interna de `f.progs` — referencias retenidas a programas individuales quedan huérfanas. El filter reemplaza todo el array. |
| **🟢 BAJO** | `saveDocumento`, `updateFacultadName`, `saveDB`, `getFacultades` | Mutación in-place de propiedades sin afectar estructura de array ni índices. get retorna referencia directa (compartida) pero nadie retiene la referencia para mutación salvo AppData. |
| **⚪ INFORMATIVO** | `getFacultad`, `findProgramById`, `getFacultadCount` | Solo lectura. No hay efecto secundario. Seguras para migración inmediata. |

### 19.7. Referencias compartidas (aliasing)

| Referencia | Dónde se obtiene | Riesgo |
|---|---|---|
| `AppData.getFacultades()` → `window.DB` | dashboard.js:25, indicators.js:77, export.js:184, app.js:697,821 | **ALERTA**: retorna el array original. Cualquier `push/splice` en el caller muta DB directamente. Actualmente ningún caller lo hace (solo AppData escribe), pero no hay protección. |
| `AppData.getFacultad(i)` → `window.DB[i]` | dashboard.js:42, filters.js:48, app.js:876,886 | **ALERTA**: retorna la referencia del objeto. Mutar `f.name`, `f.progs`, `f.doc` desde caller afecta DB directamente. Solo AppData escribe actualmente. |
| `DB[curFac]` en app.js renderers | app.js:172,432,466,495,819 | **LEGACY**: acceso directo a `var DB`, sin pasar por AppData. Solo lectura, pero bypass del control de acceso. |

### 19.8. Operaciones candidatas para encapsulación inmediata (sin riesgo)

| Operación | Reemplazo AppData | Prioridad |
|---|---|---|
| `DB[curFac]` en renderTree | `AppData.getFacultad(AppState.navigation.curFac)` | 🔴 Alta (reemplaza 5 sites) |
| `DB[curFac]` en renderTabla | `AppData.getFacultad(AppState.navigation.curFac)` | 🔴 Alta |
| `DB[curFac]` en renderSedeView | `AppData.getFacultad(AppState.navigation.curFac)` | 🔴 Alta |
| `DB[curFac]` en renderProgForm | `AppData.getFacultad(AppState.navigation.curFac)` | 🔴 Alta |
| `DB[curFac]` en renderEditor | `AppData.getFacultad(AppState.navigation.curFac)` | 🔴 Alta |
| `storage.js` references to `window.DB` | `AppData.getFacultades/getFacultad` | 🟡 Media |
| `DEFAULT_DATA` como módulo | `assets/js/data/default-data.js` | 🟡 Media |
| `ALL_SEDES` como módulo | `assets/js/data/sedes.js` | 🟢 Baja |
| `SD` (SNIES) como módulo | `assets/js/data/snies-data.js` | 🟢 Baja |

### 19.9. Estructura propuesta para capa de datos

```
assets/js/
  data/
    app-data.js       ← ya existe: queries + writes controlados sobre window.DB
    default-data.js   ← extraer DEFAULT_DATA aquí
    sedes.js          ← extraer ALL_SEDES aquí
    snies-data.js     ← extraer SD aquí
  services/
    (reservado para lógica de negocio futura)
  modules/
    ... (sin cambios)
```

### 19.10. Dependencias circulares

```
NO HAY dependencias circulares.
```

Flujo actual:
```
app-data.js ← storage.js ← embed.js    (embed.js → app-data.js? No)
                ↑                ↑
          app-data.js        app.js
                ↑
          app.js (loadDB)
```

`embed.js` lee `window.DB` directamente en `buildStandalone()`, no importa de app-data.js. Esto es correcto porque embed.js se ejecuta en runtime para export, no para inicialización.

### 19.11. Resumen de acoplamientos

| Módulo | Acoplamiento a DB | Controlado por AppData |
|---|---|---|
| app-data.js | 20 referencias a `window.DB` | Es la capa misma — aceptable |
| app.js (renderers) | 6 referencias `DB[curFac]` | ❌ Directo |
| app.js (writes) | 0 — vía AppData | ✅ |
| storage.js | 6 referencias `window.DB` + DEFAULT_DATA | ❌ Directo |
| storage.js (downloadHTML) | 2 refs `window.DB` | ❌ Directo |
| embed.js | 1 ref `window.DB` | ❌ Directo (pero aislado) |
| filters.js | 1 ref `window.ALL_SEDES` | ❌ Directo (solo lectura) |
| dashboard.js | 0 — vía AppData | ✅ |
| indicators.js | 0 — vía AppData | ✅ |
| export.js | 0 — vía AppData | ✅ |

### 19.12. Operaciones encapsuladas (Fase 4)

#### Nuevos getters readonly agregados (app-data.js — Fase 4):

| Método | Retorno | Propósito |
|---|---|---|
| `getFacultadesSafe()` | `Array` (shallow copy) | Evita mutación accidental del array original |
| `getFacultadSafe(i)` | `Object` (shallow copy) | Evita mutación accidental del objeto facultad |
| `getProgramaCount(fi)` | `number` | Cuenta programas de pregrado |
| `getSedesEnUso(fi)` | `string[]` | Sedes únicas usadas por los programas de una facultad |
| `getFacultadName(fi)` | `string` | Acceso seguro al campo name |
| `getFacultadDoc(fi)` | `Object|null` | Acceso seguro al campo doc |
| `getFacultadIndexById(fid)` | `number` | Búsqueda de índice por id |
| `getFacultadIndexByName(name)` | `number` | Búsqueda de índice por nombre exacto |
| `getProgramaById(pid)` | `Object|null` | Retorna solo el programa (sin facIndex) |

#### Referencias legacy migradas en Fase 4:

| Antes | Después | Archivo |
|---|---|---|
| `window.ALL_SEDES.filter(...)` | `AppState.staticData.ALL_SEDES.filter(...)` | filters.js:53 |
| `DB[curFac]` en renderTree | `AppData.getFacultad(AppState.navigation.curFac)` | app.js:172 |
| `DB[curFac]` en renderTabla | `AppData.getFacultad(AppState.navigation.curFac)` | app.js:432 |
| `DB[curFac]` en renderSedeView | `AppData.getFacultad(AppState.navigation.curFac)` | app.js:466 |
| `DB[curFac]` en renderProgForm | `AppData.getFacultad(AppState.navigation.curFac)` | app.js:495 |
| `DB[curFac]` en renderEditor | `AppData.getFacultad(AppState.navigation.curFac)` | app.js:819 |

### 19.13. Checklist de migración (actualizado Fase 4)

- [x] AppData creado (queries + writes iniciales, Fase 3)
- [x] AppData extendido con 9 getters readonly adicionales (Fase 4)
- [x] dashboard.js → AppData (Fase 3)
- [x] indicators.js → AppData (Fase 3)
- [x] export.js → AppData (Fase 3)
- [x] app.js writes → AppData (Fase 3)
- [x] filters.js `window.ALL_SEDES` → `AppState.staticData.ALL_SEDES` (Fase 4)
- [x] renderTree `DB[curFac]` → `AppData.getFacultad()` (Fase 4)
- [x] renderTabla `DB[curFac]` → `AppData.getFacultad()` (Fase 4)
- [x] renderSedeView `DB[curFac]` → `AppData.getFacultad()` (Fase 4)
- [x] filters.js `window.curFac` → `AppState.navigation.curFac` (Fase 4)
- [x] renderProgForm `DB[curFac]` → `AppData.getFacultad()` (Fase 4)
- [x] renderEditor `DB[curFac]` → `AppData.getFacultad()` (Fase 4)
- [x] AppData writes: validaciones ligeras (null, arrays, tipos) (Fase 4)
- [x] default-data.js creado con `window.__DEFAULT_DATA` (Fase 4)
- [ ] storage.js → AppData (loadDB, saveDB)
- [ ] embed.js → AppData (buildStandalone)
- [ ] Eliminar copia inline DEFAULT_DATA de app.js (requiere actualizar regex en storage/embed)
- [ ] Extraer ALL_SEDES a módulo separado
- [ ] Extraer SD (SNIES) a módulo separado

### 19.14. Cobertura actual de AppData

| Módulo | Accesos DB | Via AppData | Directo | Progreso |
|---|---|---|---|---|
| app-data.js | 20 | 20 (es la capa) | 0 | 100% |
| dashboard.js | 2 | 2 | 0 | 100% |
| indicators.js | 11 | 11 | 0 | 100% |
| export.js | 5 | 5 | 0 | 100% |
| app.js (writes) | 7 | 7 | 0 | 100% |
| filters.js | 3 | 3 | 0 | 100% |
| app.js (renderers) | 30 | 30 | 0 | 100% |
| storage.js | 11 | 0 | 11 (`window.DB`) | 0% |
| embed.js | 1 | 0 | 1 (`window.DB`) | 0% |
| **Total** | **90** | **78** | **12** | **87%** |

### 19.15. Accesos legacy restantes (pendientes Fase 4)

| # | Referencia | Archivo | Línea | Riesgo | Dependencia |
|---|---|---|---|---|---|---|---|
| R1 | `window.DB` en save/load | storage.js | 17,42,61,67,77 | 🟡 Medio | persistencia (no tocar) |
| R2 | `window.DB` en embed | embed.js | 67 | 🟢 Bajo | export (no tocar) |

### 19.16. Referencias compartidas detectadas

| Referencia | Dónde | Riesgo |
|---|---|---|
| `AppData.getFacultades()` → `window.DB` mismo array | dashboard.js:25, indicators.js:77, export.js:184, app.js:697,821 | Mutable desde afuera — `getFacultadesSafe()` existe como alternativa |
| `AppData.getFacultad(i)` → `window.DB[i]` mismo objeto | dashboard.js:42, filters.js:48, app.js:876,886 | Mutable desde afuera — `getFacultadSafe()` existe como alternativa |
| `AppState.staticData.ALL_SEDES` → `window.ALL_SEDES` mismo array | filters.js:53 | Misma referencia, no hay copia |

### 19.17. Riesgos pendientes para siguiente fase

1. **11 referencias en storage.js**: `saveDB()` serializa `window.DB`, `loadDB()` reemplaza `window.DB`. Migrar requiere que AppData gestione la persistencia.
2. **1 referencia en embed.js**: `JSON.stringify(window.DB)` en `buildStandalone()`. Migrar requiere AppData serializable.
3. **Mutable references**: `getFacultades()` y `getFacultad()` retornan referencias directas. Callers actualmente no mutan, pero no hay protección.
4. **ALL_SEDES sin extraer**: datos inline en app.js, no modularizados. Filtros dependen de `AppState.staticData.ALL_SEDES` que apunta al mismo array.
5. **DEFAULT_DATA inline bloqueado por regex**: la variable `var DEFAULT_DATA=[...]` en app.js no puede eliminarse porque storage.js y embed.js usan un regex que busca ese patrón exacto para actualizar datos en exportaciones. `window.__DEFAULT_DATA` ya existe en módulo separado, pero la copia inline debe mantenerse hasta migrar storage/embed.

### 19.18. Recomendaciones para Fase 4 (siguiente iteración)

1. ~~Migrar renderTree, renderTabla, renderSedeView~~ ✅ ~~renderProgForm~~ ✅ ~~renderEditor~~ ✅ ~~filters.js legacy~~ ✅ ~~validaciones AppData~~ ✅ ~~default-data.js creado~~ ✅
2. **Eliminar copia inline DEFAULT_DATA de app.js**: requiere actualizar el regex `/(var|const) DEFAULT_DATA=\[[\s\S]*?\](?=\s*\n(var|const) ALL_SEDES)/` en storage.js y embed.js para que apunte a `window.__DEFAULT_DATA`.
3. **Migrar storage.js**: que `loadDB` use `AppData.loadDB()` y que `saveDB` acceda a datos via AppData.
4. **Evaluar inmutabilidad**: congelar (`Object.freeze`) los objetos retornados por AppData queries para prevenir mutaciones accidentales fuera de la capa.
5. **ALL_SEDES y SD (SNIES)**: extraer a módulo separado similar a default-data.js.

### 19.19. Estado consolidado Fase 4 — Baseline arquitectónico

#### Capas del sistema (final Fase 4)

```
┌──────────────────────────────────────────────────────┐
│                    UI Layer                           │
│  app.js (orquestador) · renderers · dashboard        │
│  indicators · filters · export · SNIES               │
└──────────────────────┬───────────────────────────────┘
                       │ AppData.* (read/write)
┌──────────────────────▼───────────────────────────────┐
│              Data Access Layer                        │
│  app-data.js (AppData)                               │
│    • Queries readonly (12 métodos)                   │
│    • Writes controladas (6 métodos)                  │
│    • Validación ligera pre-write                     │
│    • Persistencia automática (via storage.js)        │
└──────┬─────────────────────────────────┬─────────────┘
       │ window.DB                        │ storage.js/saveDB
┌──────▼──────┐              ┌───────────▼────────────┐
│  window.DB   │              │   localStorage        │
│ (source of   │              │   (persistencia real) │
│  truth)      │              │                        │
└──────────────┘              └────────────────────────┘
```

#### Cobertura AppData por módulo (resumen Fase 4)

| Categoría | Módulos | Cobertura |
|---|---|---|
| ✅ 100% vía AppData | dashboard.js, indicators.js, export.js, filters.js, app.js (renderers), app.js (writes) | 6/8 módulos |
| 🔴 Persistencia (0%) | storage.js, embed.js | 2 módulos pendientes |
| **Total** | **90 accesos DB → 78 vía AppData** | **87%** |

#### Accesos DB directos restantes (12 total)

| Módulo | Ref directas | Dependencia |
|---|---|---|
| storage.js | 11 (`window.DB`, `window.DEFAULT_DATA`) | Persistencia |
| embed.js | 1 (`window.DB`) | Export |

#### Riesgos activos documentados

1. **storage.js/embed.js sin migrar** — único acoplamiento directo a `window.DB` que persiste
2. **Referencias mutables** — `getFacultades()` y `getFacultad()` retornan referencias directas; `getFacultadesSafe/getFacultadSafe` no tienen consumidores actualmente
3. **Regex de export frágil** — downloadHTML/buildStandalone dependen de formato exacto `var DEFAULT_DATA=[...]`
4. **ALL_SEDES y SD (SNIES)** — datos inline en app.js sin modularizar
5. **EST_COLORS vs ST_MAP** — indicators.js tiene `EST_COLORS` (7 grupos con `color`/`bg`), diferente de `ST_MAP` en utils.js (17 estados con `cat`/`group`/`dot`/`bg`/`tx`). Relacionados semánticamente pero no es una copia directa.
6. **Datos de encoding mixto** — caracteres UTF-8 con doble codificación en DEFAULT_DATA

#### Deuda técnica identificada

| Item | Impacto | Prioridad |
|---|---|---|
| `gi()` bug: retorna null cuando valor es 0 | 🟡 Medio | Fase 5 |
| `_validateDB` en storage.js muta input | 🟡 Medio | Fase 5 |
| indicadores render es 1 función de 400+ líneas | 🟡 Medio | Refactor futuro |
| CSV download duplicado en export.js/storage.js | 🟢 Bajo | Refactor futuro |
| `countItems`, `bar`, `donut` eliminados (dead code) | ✅ Resuelto | — |
| Comentarios SOMBREADA y dependencias legacy | ✅ Resuelto | — |

#### Acciones dinámicas del dispatcher

El dispatcher `__ACTIONS` en app.js centraliza todas las acciones `data-action`.
Acción añadida para enlaces de obtención:

| Acción | data-* | Comportamiento |
|---|---|---|
| `open-program-link` | `data-url` | `window.open(url, '_blank', 'noopener,noreferrer')` |

**Campo opcional `enlaceObtencion`** en items de especialización (`lineas`):
- String URL (`https://...`), guardado como parte del objeto item
- Renderizado solo cuando `item.e === "Obtención"` y URL válida (http/https)
- Editado via `type="url"` en el formulario del editor
- `renderObtencionLink(item)` helper genera `<button data-action="open-program-link" data-url="...">`
- Compatibilidad total: datos sin el campo o con estado distinto a "Obtención" no muestran botón

#### Roadmap post-Fase 4

1. **Fase 5**: Migrar storage.js → AppData persistence (autorizar toque de persistencia)
2. **Fase 6**: Migrar embed.js → AppData serialization
3. **Fase 7**: Eliminar copia inline DEFAULT_DATA, actualizar regex
4. **Fase 8**: Inmutabilidad (`Object.freeze` en queries), getFacultadesSafe como default
5. **Fase 9**: Extraer ALL_SEDES, SD (SNIES), ESTADOS_GRUPO a módulos separados
6. **Fase 10**: Refactor indicadores y renderers monolíticos

#### Snapshot estable — tag `v1.0.0-alpha`

Este commit marca el baseline arquitectónico estable de Fase 4.
Todos los consumidores de datos (renderers, writes, filtros) pasan
por AppData. Persistencia (storage.js) y export (embed.js) son
los únicos módulos con acceso directo a `window.DB`.

---

## 20. Rutas de Aprendizaje por Sede (Fases F1–F5)

> **Hito**: 2026-08-18 — Arquitectura de rutas de aprendizaje parametrizadas por sede,
> implementada y validada en las fases F1–F5. Este documento describe el diseño final.
> Código relacionado: `utils.js`, `models/learning-routes.js`, `modules/storage.js`,
> `controllers/navigation.js`, `controllers/actions.js`, `views/editor.js`,
> `views/tree.js`, `views/sede-view.js`, `views/learning-route.js`.

### 20.1. Estructura de datos

La fuente de verdad en memoria es `window.__LEARNING_ROUTES`, un mapa
**anidado por programa y luego por sede**:

```js
window.__LEARNING_ROUTES = {
  [espId]: {
    'ALL':       ruta,   // ruta GLOBAL (base / fallback)
    'Fusagasugá': ruta,  // ruta ESPECÍFICA de la sede
    'Soacha':     ruta,  // ...
  }
}
```

Donde cada `ruta` tiene la forma:

```js
{
  id:      'lr-<espId>-all',      // _lrMakeId(espId, sede)
  espId:   'idXXX',               // id del programa académico
  sede:    'ALL' | 'Fusagasugá' | ...,
  espName: 'Esp. en ...',         // nombre del programa
  version: 'V2.1',                // opcional
  type:    'especializacion' | 'maestria' | 'doctorado',
  credits: 20,                    // suma de créditos de CADIs
  semesters: [
    {
      id:    'sem1',
      title: 'Semestre 1',
      type:  'Fundamentación' | 'Profundización',
      credits: 10,
      subjects: [
        {
          id:          'subj1',
          title:       'Economía rural...',
          version:     '1.0',              // opcional
          credits:     2,
          homologa:    true,
          resourceUrl: 'https://...',      // opcional
          homo:        { materia: 'Pregrado X' } // opcional, solo si homologa
        }
      ]
    }
  ]
}
```

- Clave `ALL` = **ruta global**: aplica a todas las sedes cuando no existe una específica.
- Clave de sede (ej. `'Fusagasugá'`) = **ruta específica**: solo aplica a esa sede.
- `_lrMakeId(espId, sede)` (utils.js:92) genera el id: `lr-<espId>-all` para `ALL`,
  `lr-<espId>-<sede-slug>` para una sede específica (slug en minúsculas, sin caracteres especiales).

### 20.2. Significado de `ALL` como ruta global

`ALL` es la ruta por defecto de un programa. Reglas:

1. Una ruta `ALL` **es la base de referencia**: el editor permite crear una ruta de sede
   **copiando la ruta ALL** (`copyFrom:'ALL'`), conservando semestres, CADIs e ids.
2. `ALL` actúa como **fallback** de resolución: si se solicita la ruta de una sede sin
   ruta específica, se abre la ruta `ALL`.
3. Al eliminar una ruta de sede específica, `ALL` **permanece intacta**.
4. La ruta `ALL` **no se mezcla ni se modifica** al crear/editar rutas específicas;
   cada ruta por sede es un objeto independiente (copia profunda en la creación).

### 20.3. Resolución específica → ALL → null

El orden de resolución de una ruta es:

```
sede específica (m[sede])  →  ALL (m.ALL)  →  null
```

- Si `sede` no se indica, se usa `'ALL'`.
- La **sede usada para abrir el modal es la de la ruta resuelta**, no la solicitada:
  `overlay.dataset.sede = route.sede || 'ALL'` (navigation.js:61). Así, al abrir
  'Soacha' sin ruta específica, el modal identifica que la ruta abierta es `ALL`.

### 20.4. API del modelo (utils.js)

| Función | Firma | Comportamiento |
|---|---|---|
| `_getLearningRoute` | `(espId, sede)` → ruta\|null | Resolución específica → ALL → null (utils.js:64) |
| `_hasLR` | `(id)` → boolean | `true` si el programa tiene al menos una ruta (utils.js:60) |
| `_hasFlatRoute` | `(obj)` → boolean | Detecta estructura legacy plana (utils.js:71) |
| `_normalizeRoutes` | `(obj)` → mapa anidado | Normaliza legacy a `[espId][sede]` (utils.js:78) |
| `_lrMakeId` | `(espId, sede)` → string | Genera el id canónico de la ruta (utils.js:92) |
| `_lrHomologacion` | `(subj, route)` → string\|null | Nombre del CADI de pregrado si `homologa===true` y `homo.materia` no vacío (utils.js:143) |

### 20.5. Normalización de rutas legacy planas

El formato **legacy (v1)** era plano:

```js
{ [espId]: ruta }   // ruta con prop `semesters` (array)
```

El formato **actual (v2)** es anidado:

```js
{ [espId]: { [sede]: ruta } }
```

`_normalizeRoutes(obj)` convierte:

- Entrada con `Array.isArray(v.semesters)` → `out[k] = { ALL: v }` (envuelve en `ALL`).
- Entrada ya anidada (valores sin `semesters` a nivel superior) → se conserva tal cual.
- Entradas malformadas / no-objeto → se descartan.

La normalización **no muta el origen** y nunca lanza.

### 20.6. Carga y migración de localStorage

`loadLearningRoutes()` (models/learning-routes.js:5), key `udec_learning_routes`:

1. **Primera llamada**: congela los defaults en `__LEARNING_ROUTES_DEFAULT =
   _normalizeRoutes(window.__LEARNING_ROUTES)` (snapshot de los datos embebidos).
2. **Modo standalone** (`__EMBEDDED_LR`): usa los datos embebidos normalizados;
   ignora localStorage (no escribe).
3. **Con dato en localStorage**: parsea; si es legacy plano (`_hasFlatRoute`),
   normaliza en memoria y **escribe una sola vez** `saveLearningRoutes()` (migración
   única); si ya es anidado, no reescribe.
4. **Sin dato**: deep-copy de `__LEARNING_ROUTES_DEFAULT`.

`saveLearningRoutes()` (learning-routes.js:28) persiste el mapa completo como JSON;
es no-op en modo embedded. `restoreDefaultRoutes(onDone)` (learning-routes.js:35)
borra la key, restaura los defaults normalizados y re-renderiza.

### 20.7. Backup / restore — compatibilidad v1 y v2

`backupDB()` (storage.js:148) genera un JSON:

```js
{ version: 2, date, db, learningRoutes, sniesSD, rcRaw, sedesCatalog }
```

`restoreDB(file)` (storage.js:167) lee el archivo con `FileReader` y `JSON.parse`:

- **Acepta `version === 1` o `version === 2`**.
- `learningRoutes` se pasa siempre por `_normalizeRoutes` (v1 plano → anidado;
  v2 anidado → se conserva).
- Versión distinta → toast `'❌ Archivo de respaldo no compatible'` y **no muta nada**.
- Error de parseo → toast `'❌ Archivo inválido'`.
- Tras restaurar: `saveDB()`, `saveLearningRoutes()`, sincroniza SNIES, catálogo de
  sedes, etiquetas de programas por defecto, y refresca todas las vistas.

### 20.8. Persistencia de IDs de semestres y CADIs

El editor conserva los `id` de semestres y CADIs al guardar:

- `_lrCollectFormData` (editor.js:276) lee `dataset.semId` / `dataset.subjId` y los
  reutiliza; solo genera `uid()` para elementos nuevos (`_lrAddSemester`,
  `_lrAddSubject`).
- Se preservan además `homo.materia`, `version`, `resourceUrl`, `credits` y `homologa`.
- Esto garantiza estabilidad de referencias entre ediciones y en restore v2.

### 20.9. Creación de rutas específicas copiando ALL

Acción `lr-create-sede-route` (actions.js:75): el usuario elige una sede en el listado
de rutas (solo se ofrecen sedes del programa o `ALL_SEDES` aún sin ruta) y se abre
`_lrEditRoute(progId, sede, { copyFrom:'ALL', name, type })`.

En `_lrEditRoute` (editor.js:202): si no existe ruta para la sede y hay `copyFrom`,
se hace **copia profunda** de `_getLearningRoute(progId,'ALL')`, se asigna nuevo id
con `_lrMakeId` y `sede` de destino. La ruta ALL original queda intacta.

Para programas sin ruta, `create-route-for-prog` (actions.js:72) abre el editor de la
ruta `ALL` con plantilla vacía (espName/type precargados).

### 20.10. Independencia entre rutas por sede

- Cada ruta por sede se guarda en `__LEARNING_ROUTES[espId][sede]` como objeto propio.
- Modificar la ruta de una sede **no altera** `ALL` ni las demás sedes
  (verificado en F5: cambios en Fusa no tocan Soacha ni ALL y viceversa).
- La ruta ALL solo se usa como *template* al momento de crear una específica (copia
  profunda), nunca como referencia compartida mutable.

### 20.11. Comportamiento del Árbol (tree.js)

- Helper `routeLinkCls(id, sede)` (tree.js:62): si `_getLearningRoute(id, sede)` existe,
  emite `class="route-link" data-action="show-learning-route" data-esp-id="<id>"
  data-sede="<sede>"`; si no, string vacío (sin enlace).
- Las especializaciones (`l.id`) y maestrías (`m.id`) **solo se renderizan cuando hay
  sede efectiva** (`sEff = filtSede ? filtSede : AppState.ui.sedeSel[p.id]`) — diseño
  auditado del árbol.
- El **doctorado siempre se renderiza**; `docSede = filtSede ? filtSede : 'ALL'`
  (tree.js:250). El enlace de ruta del doctorado usa el id `doc-<facId>`.
- Un clic en el nodo dispara `openLearningRouteModal(espId, sede)` (acciones
  `show-learning-route`).

### 20.12. Comportamiento de Vista Sede (sede-view.js)

- Los items llevan `id:item.id` (especialización `l.id`, maestría `m.id`,
  doctorado `'doc-'+f.id`).
- Para cada sede destino se muestra el botón **"Ruta"** solo si
  `_getLearningRoute(it.id, s)` existe (sede-view.js:38):
  `<span class="route-link" data-action="show-learning-route" data-esp-id="..." data-sede="...">`.
- Con `filtSede` activo, solo se consideran las sedes del filtro; si el programa no
  ofrece la sede, no aparece card ni botón.

### 20.13. Comportamiento del editor (editor.js)

El editor tiene dos pestañas (`_lrEditorTab`, editor.js:5): **Programas** y
**Rutas de aprendizaje**.

- `_lrRenderList` (editor.js:118): separa programas **con ruta** (`_hasLR`) y **sin
  ruta** (vía `_getAllAcademicPrograms`, utils.js:111). Por cada ruta existente lista
  la sede (`ALL` → "ruta global", específica → "sede específica") con botones
  **Editar / Vista previa / Eliminar**, y el selector "➕ Crear ruta para sede" (solo
  si existe `ALL`). Botón "Restaurar por defecto" (`restore-default-routes`).
- `_lrEditRoute(progId, sede, prefill)` (editor.js:194): abre el formulario en
  `#editor-content` con `#lr-form-container` (`data-esp-id`, `data-prog-type`,
  `data-sede`), `#lr-sede` (select), nombre/versión, total de créditos, semestres y
  CADIs. Recupera la ruta existente o la crea (copia de ALL / plantilla nueva).
- `_lrCollectFormData` (editor.js:276): recolecta el formulario; nombre obligatorio
  (toast si vacío); CADIs sin título se omiten; créditos recalculados.
- `_lrSaveRoute` (editor.js:318): construye y persiste
  `__LEARNING_ROUTES[espId][sede]` (id canónico, `saveLearningRoutes()`), toast
  "Ruta guardada", re-renderiza.
- `_rerenderForm` (editor.js:372): guarda un **borrador en memoria**
  (`__LEARNING_ROUTES`) **sin persistir** (phantom) para operaciones de agregar /
  eliminar semestre o CADI; solo el guardado explícito persiste.
- `_lrPreviewRoute` (editor.js:382): abre modal con la ruta guardada, o con el
  borrador del formulario si aún no se guardó.
- Acción `edit-lr-from-modal` (actions.js:57): desde el modal, valida
  `_getLearningRoute(espId, sede)` (toast "Ruta no disponible para edición" si no),
  cierra el overlay, cambia a la pestaña "rutas" y edita **la ruta realmente abierta**
  (la que el modal reporta en `dataset.sede`).

### 20.14. Modal de ruta — apertura y fallback

`openLearningRouteModal(espId, sede)` (navigation.js:46):

- Acepta `(espId, sede)` **o un objeto ruta** (vista previa de borrador).
- Con `(espId, sede)`: `usedSede = sede || 'ALL'`; resuelve con `_getLearningRoute`.
- **Si no hay ruta ni ALL**: toast `'Ruta no disponible'` y **no abre overlay**.
- Overlay: `dataset.espId = espId`, `dataset.sede = route.sede || 'ALL'`.
- Cierre: clic fuera, `Escape`, o `close-lr-modal`.

### 20.15. Eliminación de ALL y rutas específicas

`_lrDeleteRoute(espId, sede)` (editor.js:330):

- Confirma con `showConfirm` mostrando la sede y `espName`.
- `delete m[sd]`; si el mapa queda vacío, elimina también la entrada del programa.
- Persiste, toast "Ruta eliminada", re-renderiza.
- **Eliminar una sede específica no afecta `ALL`**; eliminar `ALL` deja intactas las
  sedes específicas.

### 20.16. Compatibilidad con las 18 rutas actuales

- `assets/js/data/learning-routes.js` sigue en **formato plano (v1)**: 18 programas
  con `id`, `espId`, `espName`, `type`, `credits`, `semesters` (con homologaciones).
- Al primer arranque, `loadLearningRoutes` normaliza las 18 → todas quedan como
  **rutas `ALL`** y se persisten anidadas; el archivo de datos **no se modifica**.
- La exportación standalone embebe el mapa (anidado) como `__EMBEDDED_LR`
  (storage.js:44, embed.js:76) y lo restaura normalizado.
- Validación F5 (G1–G6): 18 rutas, todas disponibles como ALL, con espName,
  semesters y homologaciones íntegros, `espId` coherente.

## 21. Resiliencia de Rutas de Aprendizaje (R1–R5)

> **Hito**: 2026-08-19 — Resiliencia de rutas de aprendizaje implementada en las
> fases R1–R5. Este documento describe la arquitectura final de persistencia,
> recuperación, borradores, restore seguro, huérfanas y metadatos de backup.
> Código relacionado: `data/learning-routes.js`, `models/learning-routes.js`,
> `modules/utils.js`, `modules/storage.js`, `modules/embed.js`,
> `views/editor.js`, `controllers/actions.js`, `app.js`.

Las fases R1–R5 se aplican sobre la arquitectura de rutas por sede de la
sección §20 (F1–F5) **sin romper** la jerarquía `específica → ALL → null` ni la
estructura `[espId][sede]` de `__LEARNING_ROUTES`.

### 21.1. Fuentes de datos y claves de persistencia

| Objeto / clave | Tipo | Rol |
|---|---|---|
| `window.__LEARNING_ROUTES_BASE_V2` | `data/learning-routes.js` | **Snapshot institucional inmutable** (18 rutas anidadas en `ALL`). Fuente de recuperación (`_lrBaseSource`, learning-routes.js:24). **Nunca se modifica en runtime.** |
| `window.__LEARNING_ROUTES_DEFAULT` | en memoria | Congelado en la primera llamada a `loadLearningRoutes` (copia profunda normalizada de BASE_V2). Base para `restoreDefaultRoutes` y recuperaciones. |
| `window.__LEARNING_ROUTES` | en memoria | **Mapa runtime** `[espId][sede]`, la única fuente de verdad mutable. |
| `udec_learning_routes` | localStorage | Persistencia del mapa runtime (JSON). |
| `udec_learning_routes_meta` | localStorage | Meta `{ schemaVersion:2, seededAt, lastSavedAt, recovered?, recoveredAt? }`. |
| `udec_learning_routes_pre_restore` | localStorage | Backup automático previo a `restoreDefaultRoutes` (R4). |
| `__LR_DRAFT` / `_lrDraftMeta` / `_lrDraftSrc` | en memoria | Borrador de edición separado del mapa vivo (R3). |

### 21.2. Ciclo de carga y recuperación (R1)

`loadLearningRoutes()` (learning-routes.js:55) cubre todos los escenarios:

1. **Export de solo lectura** (`__EMBEDDED_LR` + `__EMBEDDED_DB`): usa el snapshot
   embebido normalizado; **no escribe** en localStorage.
2. **Sin dato (`stored === null`)**:
   - con **meta existente** → pérdida real → `_recoverFromBase` (restaura defaults
     normalizados, `recovered:true`, toast de recuperación);
   - **primer arranque** (sin meta) → `_seedFrom` (siembra defaults + meta, **sin toast**).
3. **`{}`** → el mapa fue vaciado → pérdida real → `_recoverFromBase` con toast.
4. **JSON corrupto** → `_recoverFromBase` con toast.
5. **Legacy plano** (`_hasFlatRoute`) → normaliza en memoria y **migra una sola vez**
   con `saveLearningRoutes()`.
6. **Anidado válido** → se conserva sin reescritura (solo se crea meta si falta).

`saveLearningRoutes()` (learning-routes.js:98) persiste el mapa completo y actualiza
`lastSavedAt`; es **no-op en modo embedded** (`__EMBEDDED_DB`).

### 21.3. Seed simétrico del Admin export (R2)

`_makeAdminEmbedded()` (storage.js:129) + `buildStandaloneAdmin()` (embed.js) siembran
las rutas en un HTML administrativo nuevo:

- Si `udec_learning_routes` **no existe** → se siembra desde `__EMBEDDED_LR`.
- Si existe un **mapa válido** → **no se pisa** (localStorage gana sobre embedded).
- Si es `{}` o **JSON corrupto** → **no se siembra silenciosamente**; `loadLearningRoutes`
  (R1) lo recupera con notificación.
- El seed usa `Object.keys(...)` (no `.length` de arrays) y es **simétrico** con
  `udec_rutas_db` (ambas keys se siembran juntas).

### 21.4. Borrador separado del mapa vivo (R3 / E16)

- `_lrEditRoute` (editor.js:294) construye `__LR_DRAFT` a partir de una **copia
  profunda** (o plantilla), **nunca escribe en el mapa vivo**.
- `_lrMergeFormIntoRoute` (editor.js:244) es una **fusión conservadora**: parte de la
  copia profunda y solo toca campos representados por el formulario. Preserva campos
  no representados, `version`, `resourceUrl`, `homo.materia`, CADIs existentes con
  título vacío e IDs; **descarta únicamente filas nuevas totalmente vacías**.
- `_lrSaveRoute` (editor.js:426) fusiona sobre el borrador/`_lrDraftSrc`, persiste con
  `saveLearningRoutes()` y llama a `_lrCancelDraft()`.
- `_lrCancelDraft()` (editor.js:290) limpia borrador y metadatos; se invoca al
  cancelar (`lr-back-to-list`, actions.js:81), tras guardar y en los restores (R4).
- **Los borradores jamás contaminan backups/exports**: `backupDB` y `__EMBEDDED_LR`
  serializan el **mapa guardado**, no `__LR_DRAFT` (verificado: export fallback y
  `buildStandaloneAdmin` no contienen texto del borrador).

### 21.5. Backup previo y restauración por defecto (R4)

`restoreDefaultRoutes(onDone)` (learning-routes.js:138):

1. `showConfirm` (acción explícita del usuario).
2. `_lrStorePreRestoreBackup()` → guarda copia profunda exacta
   `{ savedAt, routes }` en `udec_learning_routes_pre_restore` (learning-routes.js:109).
3. Borra `udec_learning_routes`, restaura `__LEARNING_ROUTES_DEFAULT`, persiste.
4. Limpia `__LR_DRAFT`, toast "Rutas restauradas".

`restoreLearningRoutesBackup(onDone)` (learning-routes.js:118): si existe el backup,
confirma y restaura la **copia exacta** (sin normalizar), consume la key, limpia el
draft y persiste. **No existe recuperación automática de este backup**: la acción es
siempre del usuario (botón "↩️ Recuperar respaldo previo").

### 21.6. `restoreDB` conservador (R4)

`restoreDB(file)` (storage.js:172) acepta backups **v1 y v2**:

- Si `learningRoutes` está presente y no vacío (`hadLR`) → se aplica con
  `_normalizeRoutes` (v1 plano → anidado; v2 → se conserva) + toast
  "✅ Rutas de aprendizaje restauradas del respaldo".
- Si **no incluye rutas** → **se conservan las rutas actuales** (nunca se introduce
  `{}`) + toast "ℹ️ El respaldo no incluía rutas; se conservaron las rutas actuales".
- Versión inválida → rechazo sin mutar nada; JSON inválido → toast "❌ Archivo inválido".
- Limpia `__LR_DRAFT` (el borrador no sobrevive al restore).
- `_normalizeRoutes` nunca devuelve `{}` como destino por ausencia de rutas.

### 21.7. Rutas huérfanas y acciones explícitas (R5 / E22)

**Detección (solo lectura):** `getOrphanRoutes()` (utils.js:139) compara las claves de
`__LEARNING_ROUTES` contra los `id` de `_getAllAcademicPrograms()` (utils.js:111).
Devuelve un array de `espId` sin programa. **No muta DB ni mapa, no normaliza, no
reescribe** y es seguro de llamar repetidamente.

**UI:** `_lrRenderList` (editor.js:122) muestra la sección "⚠️ RUTAS HUÉRFANAS (SIN
PROGRAMA)" con `espId`, sedes y nombre de cada ruta, y por cada una:

| Acción | data-action | Implementación |
|---|---|---|
| Reasignar | `lr-reassign-route` | `_lrReassignRoute` (editor.js:517): cambia únicamente `espId`/`sede`/`id` (vía `_lrDraftCopy` + `_lrMakeId`), **conserva todo el contenido**, guarda, no permite pisar un destino con rutas existentes. |
| Conservar/Exportar | `lr-keep-orphan` | Reutiliza `backupDB()` (genera respaldo con la huérfana incluida). No elimina ni altera la ruta. |
| Eliminar | `lr-delete-orphan` | `_lrDeleteOrphan` (editor.js:536) con `showConfirm`; elimina **solo la ruta seleccionada** y persiste. |

**Regla R5:** no existe **ninguna** eliminación automática de rutas huérfanas; borrar
un programa o una facultad jamás borra sus rutas. La única operación que elimina una
huérfana es la acción explícita Eliminar.

### 21.8. Backup / export y metadatos de auditoría (R5)

`backupDB()` (storage.js:149) genera `version:2` con:

```js
{
  version: 2, date, db,
  learningRoutes,                       // el mapa guardado (sin borradores)
  learningRoutesMeta: {                 // R5: auditoría, NO parte de la estructura de rutas
    totalRoutes,                        // Object.keys(learningRoutes).length
    orphanCount                         // getOrphanRoutes().length en ese momento
  },
  sniesSD, rcRaw, sedesCatalog
}
```

- Los metadatos **no modifican** `learningRoutes` y **no contaminan** la estructura
  de las rutas (nada de `orphanCount` dentro de una ruta).
- **No rompe v1/v2** y `restoreDB` no necesita los metadatos para funcionar (no se
  modificó el restore por esta adición).
- La exportación standalone (`_makeEmbedded`, `_makeAdminEmbedded`) serializa el mapa
  guardado; los borradores nunca aparecen.

### 21.9. Jerarquía específica > ALL > null (sin cambios)

La resolución sigue siendo (ver §20.3): `m[sede] → m.ALL → null`. R1–R5 la conservan
intacta; `_getLearningRoute` (utils.js:64) y `_hasLR` (utils.js:60) se usan tal cual en
árbol, vista sede y modal.

### 21.10. Garantías finales verificadas por los smokes R1–R5

- Las **18 rutas institucionales** permanecen byte/estructuralmente intactas
  (`data/learning-routes.js` no se modifica).
- `__LEARNING_ROUTES_BASE_V2` permanece intacta tras cargar, restaurar, reasignar,
  eliminar, restore v1/v2 y exportar.
- `específica → ALL → null` intacta (F2/F3/F4 verdes).
- No hay eliminación automática de rutas (ni de huérfanas).
- Los borradores no contaminan backups ni exports.
- Restore v1/v2 compatible; v1 plano se normaliza; v2 se conserva.
- Las rutas huérfanas solo desaparecen mediante la acción explícita Eliminar.
- Backup/export/restore mantienen los datos (round-trip idéntico).
- **No hay pérdida de datos** en ningún escenario (ausencia, `{}`, corrupto, restore
  sin rutas, borrado de programas/facultades).

Suites de validación: `smoke-lr-resilience.js` (R1), `smoke-lr-r2.js` (R2),
`smoke-lr-draft.js` (R3), `smoke-lr-restore-safe.js` (R4),
`smoke-lr-orphans.js` (R5).

---

## 22. Datos base versionados + localStorage como capa de trabajo

> **Hito**: 2026-08-28 — Se formaliza el modelo de datos de dos capas: la **base
> oficial versionada** (en el repositorio/GitHub) y la **copia de trabajo por
> navegador** en localStorage.

### 22.1. Concepto general

El Dashboard opera sobre datos en dos planos distintos con responsabilidades
separadas:

| Plano | Dónde vive | Carácter | Ejemplos |
|---|---|---|---|
| **Base oficial (versionada)** | Repositorio (`assets/js/data/*.js`) | **Solo lectura en runtime**; es la fuente de verdad de instalaciones limpias y de recuperación | `default-data.js`, `learning-routes.js`, `rc-data.js`, SNIES y sedes en `app-state.js`, manifiesto `data-version.js` |
| **Capa de trabajo** | `localStorage` del navegador | **Mutable**; el usuario edita aquí | `udec_rutas_db`, `udec_learning_routes` (+ `_meta`), `udec_snies_data`, `udec_sedes_catalog` |

**GitHub contiene la base oficial. Cada navegador mantiene su propia copia de
trabajo en localStorage.** Un navegador nunca escribe de vuelta a GitHub: la única
forma de cambiar la base es publicar un nuevo snapshot (sección 22.4).

### 22.2. Base oficial — datasets versionados

Cada dataset de la base tiene una versión propia, registrada en
`assets/js/data/data-version.js` (expone `window.__DATA_VERSION`):

| Dataset | Datos | Versión | Conteos (base actual) |
|---|---|---|---|
| `db` | `window.__DEFAULT_DATA` (`default-data.js`) | `1.0.0` | 7 facultades · 18 programas · 52 especializaciones · 20 maestrías · 6 doctorados · 96 IDs únicos |
| `learningRoutes` | `window.__LEARNING_ROUTES` (`learning-routes.js`) | `1.0.0` | 25 rutas globales · 0 huérfanas |
| `snies` | SNIES en `AppState.snies.SD` (`app-state.js`) | `1.0.0` | 12 programas · 5 años de resumen · `_source: default` |
| `rc` | `data/rc-data.js` (`BASE`/`RC_DEFAULT`) | `1.0.0` | 19 registros · el snapshot trae `rcRaw: null` (no se reemplaza) |
| `sedes` | `ALL_SEDES`/`DEFAULT_SEDES` (`app-state.js`) | `1.0.0` | 7 sedes |

El manifiesto también registra `published` (fecha del snapshot) y `snapshot`
(origen: nombre de archivo, fecha y `version:2` del backup).

- `data-version.js` es **solo lectura**: no escribe en localStorage ni altera
  lógica de la aplicación. Se carga después de los módulos de datos que describe
  (orden estricto, sin reordenar scripts existentes).
- Los datasets `snies`, `rc` y `sedes` conservan sus versiones/valores actuales:
  el snapshot confirmó que no cambian, por lo que no se regeneraron.

### 22.3. Papel de localStorage (capa de trabajo)

- A la primera carga sin datos, la app **siembra** la base en localStorage
  (`loadDB`, `loadLearningRoutes` con su meta `schemaVersion:2`, SNIES, sedes).
- A partir de ahí, el usuario edita **su** copia local; `saveDB`/`saveLearningRoutes`
  persisten solo en `localStorage`.
- Los mecanismos de resiliencia de rutas (`__LEARNING_ROUTES_BASE_V2`,
  `_recoverFromBase`, re-seed) usan la **base** únicamente ante ausencia, vacío o
  corrupción del dato local. Ver secciones §20 y §21.
- El **backup JSON** (`backupDB`) captura la capa de trabajo actual; es la materia
  prima para publicar una nueva base, pero **no se versiona en el repositorio**.

### 22.4. Runbook — publicar una nueva versión de datos base

Procedimiento reproducible para elevar un snapshot a **base oficial**:

1. **Obtener el snapshot**: en el Dashboard → Herramientas → *Respaldo (JSON)*.
   Guardar el archivo fuera del repo (p. ej. `~/Downloads`). **No** añadir el JSON
   al repositorio (es dato de trabajo personal).
2. **Validar y publicar**:
   ```
   node tools/publish-data.js "ruta/al/backup.json"
   ```
   El script:
   - Valida el snapshot **antes de escribir**: `version === 2`, estructura de
     facultades/programas/doctorados, **IDs únicos**, presencia de DB/LR/SNIES/sedes/RC.
   - Detecta **rutas huérfanas** (claves de `learningRoutes` sin programa en el DB,
     misma convención de IDs que `utils.js:_getAllAcademicPrograms`, p. ej.
     `doc-<facId>` para doctorados). Si hay alguna, **aborta sin escribir**.
   - Convierte `backup.db` → `window.__DEFAULT_DATA` y
     `backup.learningRoutes` → `window.__LEARNING_ROUTES` (suelta la envoltura
     `ALL` para que `learning-routes.js` derive `__LEARNING_ROUTES_BASE_V2`
     exactamente). **Preserva IDs, relaciones, nombres, campos y valores**; no
     renombra ni normaliza.
   - Solo toca `default-data.js` y `learning-routes.js`; **no modifica** `storage.js`,
     CRUD, vistas, controladores, SNIES/sedes/RC ni la estructura de datos.
   - Escribe en pretty-print con saltos **CRLF** (convención del repo).
3. **Actualizar el manifiesto** `data-version.js`: subir la versión para
   `db` y `learningRoutes`, y actualizar `published`/`snapshot` con la fecha y
   origen del nuevo snapshot. Dejar `snies`/`rc`/`sedes` con sus versiones si no
   cambiaron.
4. **Validar en clon limpio**: abrir el Dashboard con un perfil de navegador nuevo
   (`--user-data-dir` único) y comprobar que siembra exactamente la nueva base y
   que la edición persiste en localStorage (sin ser pisada por la base).
5. **Verificar integridad**: `git diff --check` sin alertas, revisar `git status`,
   ejecutar regresiones (renders, filtros, SNIES, rutas) y confirmar `git diff`
   solo en los archivos de datos.
6. **Commit** de `default-data.js`, `learning-routes.js`, `data-version.js`,
   `publish-data.js` y este documento. **Nunca** el JSON del snapshot.

### 22.5. Reglas invariantes

- **GitHub = base oficial**; los archivos `data/*.js` se versionan en el repo.
- **localStorage = capa de trabajo** por navegador; no se sincroniza a GitHub.
- No se sube el backup JSON personal al repositorio.
- No se modifica la lógica de persistencia (storage.js, models/learning-routes.js,
  snies-loader.js) ni el CRUD en este flujo.
- `data-version.js` es un manifiesto informativo; no debe acoplarse lógica de
  la aplicación a él en esta fase.
