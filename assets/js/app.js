/**
 * app.js — orquestador principal
 * ---
 * Responsabilidad:
 *   - inicialización de datos (DB, SD, rutas de aprendizaje)
 *   - orquestación de vistas (renderViews, showTab)
 *   - exposición de todas las funciones globales via window.App
 *
 * Dependencias:
 *   - models/app-state.js        → AppState (estado centralizado)
 *   - models/snies-model.js      → validateCatalogo, buildPrograms, computeDerived
 *   - models/learning-routes.js  → loadLearningRoutes, saveLearningRoutes
 *   - data/default-data.js       → window.__DEFAULT_DATA
 *   - data/app-data.js           → AppData (capa de datos)
 *   - data/learning-routes.js    → window.__LEARNING_ROUTES
 *   - modules/utils.js           → getSt, toast, showConfirm, uid
 *   - modules/storage.js         → saveDB, loadDB, downloadHTML, resetDB
 *   - modules/filters.js         → applyFilters, resetFilters, populateSedes
 *   - modules/dashboard.js       → renderKPIs, renderFacBar, selFac
 *   - modules/indicators.js      → renderIndicadores
 *   - modules/export.js          → downloadDB, exportSNIES
 *   - modules/embed.js           → window.__EMBED
 *   - modules/snies-loader.js    → loadSnies, importSniesExcel, clearSnies, removeSniesProgram
 *   - controllers/navigation.js  → showTab, renderViews, snSetFac, snSetProg
 *   - controllers/actions.js     → __ACTIONS, __refreshAll
 *   - views/*.js                 → renderTree, renderTabla, renderSedeView, renderEditor, renderPipeline, renderSNIES
 *
 * Estado:
 *   Orquestador liviano. Renderizado delegado a módulos extraídos (views/*).
 *   Funciones globales expuestas via window.App para compatibilidad
 *   con onclick="" y exportación HTML standalone.
 *   DB access via AppData. curFac y filt* migrados a AppState.
 *   SD gestionado por snies-loader (localStorage + __EMBEDDED_SD).
 */

// Flag embed: solo se activa en HTML exportado standalone.
// En modo desarrollo (source files) se permite localStorage para persistencia local.
window.__UDEC_EMBEDDED__=false;

// ===== DATOS POR DEFECTO =====
// Fuente única: data/default-data.js → window.__DEFAULT_DATA
var DB=JSON.parse(JSON.stringify(window.__DEFAULT_DATA));

// ===== EXPORTACION =====
// Namespace global para migracion futura a ESModules.
// TODO [MVC]: cuando se migre a ESModules, reemplazar por import/export.
window.App = {
  // Estado
  AppState: window.AppState,
  // Navegacion
  showTab: showTab, renderViews: renderViews, selFac: selFac,
  // Panel
  renderKPIs: renderKPIs, renderFacBar: renderFacBar,
  // Filtros
  applyFilters: applyFilters, resetFilters: resetFilters, populateSedes: populateSedes,
  sedeMatch: sedeMatch, ofertaMatch: ofertaMatch, estadoMatch: estadoMatch,
  nivelMatch: nivelMatch, pregradoMatch: pregradoMatch, itemMatch: itemMatch,
  // Arbol, Tabla, VistaSede
  renderTree: renderTree, renderTabla: renderTabla, renderSedeView: renderSedeView,
  // Editor
  renderEditor: renderEditor, openNewProg: openNewProg, openEditProg: openEditProg,
  openEditFac: openEditFac, openNewFac: openNewFac, saveFac: saveFac,
  deleteFac: deleteFac, saveDoc: saveDoc, cancelEdit: cancelEdit,
  renderProgForm: renderProgForm, addLinea: addLinea, delLinea: delLinea,
  addMae: addMae, delMae: delMae, saveProg: saveProg, deleteProg: deleteProg,
  collectLineas: collectLineas, collectMaes: collectMaes, toggleDocForm: toggleDocForm,
  // SNIES
  loadSnies: loadSnies, importSniesExcel: importSniesExcel, removeSniesProgram: removeSniesProgram, clearSnies: clearSnies,
  renderSNIES: renderSNIES, snSetFac: snSetFac, snSetProg: snSetProg, exportSNIES: exportSNIES,
  // Desarrollo
  renderPipeline: renderPipeline, toggleSec: toggleSec,
  // Indicadores
  renderIndicadores: renderIndicadores, renderIndicadorRCDetalle: renderIndicadorRCDetalle,
  renderIndicadorProfDetalle: renderIndicadorProfDetalle, profSetTipo: profSetTipo,
  renderIndicadorMaeDetalle: renderIndicadorMaeDetalle, maeSetTipo: maeSetTipo,
  renderIndicadorMaeRcDetalle: renderIndicadorMaeRcDetalle,
  // Almacenamiento
  loadDB: loadDB, saveDB: saveDB, downloadHTML: downloadHTML, downloadDB: downloadDB, resetDB: resetDB,
  backupDB: backupDB, restoreDB: restoreDB,
  // Catálogo de sedes
  saveSedesCatalog: saveSedesCatalog, openSedesManager: openSedesManager,
  // Exportación administrativa
  downloadAdminHTML: downloadAdminHTML,
  // Utilidades
  showConfirm: showConfirm, getSt: getSt, pll: pll, uid: uid, gv: gv, gi: gi, toast: toast,
  // Rutas de Aprendizaje
  loadLearningRoutes: loadLearningRoutes, saveLearningRoutes: saveLearningRoutes, restoreDefaultRoutes: restoreDefaultRoutes,
  getOrphanRoutes: getOrphanRoutes,
};

// ===== ARBOL =====
/**
 * Renderiza el Arbol jerarquico (pregrado ? li­nea ? especializacion / maestri­a / doctorado).
 * Soporta modo single-pregrado y multi-pregrado.
 */

// ===== INICIALIZACION =====
loadDB();
loadLearningRoutes();
loadSnies();
renderFacBar();
populateSedes();
renderViews();
var _tb = document.querySelector('.tb.act');
if(_tb) showTab(_tb.dataset.tab);


